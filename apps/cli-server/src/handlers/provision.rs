use axum::{
    Json, 
    response::{IntoResponse, sse::{Event, Sse}},
    extract::State
};
use tracing::{info, error};
use serde::{Serialize, Deserialize};
use transcoder_core::transcoder::{AssetProvisioner, ProvisioningStrategy};
use std::sync::Arc;
use tokio_stream::StreamExt;
use futures::stream::Stream;
use std::convert::Infallible;

#[derive(Serialize, Clone, Debug)]
pub struct SyncProgressEvent {
    pub stage: String,    // "requesting", "downloading", "extracting", "completed", "error"
    pub percent: u32,
    pub speed: String,
    pub message: String,
}

#[derive(Serialize)]
pub struct ProvisionSyncResponse {
    pub success: bool,
    pub version: String,
    pub ls_address: String,
    pub message: String,
}

#[derive(Deserialize)]
pub struct ProvisionSyncRequest {
    pub source: Option<String>, // "auto", "force_remote", "local_only"
}

#[derive(Serialize)]
pub struct ProvisionStatusResponse {
    pub ls_core_exists: bool,
    pub cert_pem_exists: bool,
    pub bin_dir: String,
    pub data_dir: String,
    pub current_version: String,
    pub ls_core_hash: String,
}

/// POST /v1/provision/sync
/// 强制触发资产同步与版本对齐
pub async fn sync_assets_api(
    State(state): State<Arc<crate::state::AppState>>,
    Json(payload): Json<ProvisionSyncRequest>,
) -> impl IntoResponse {
    let strategy = match payload.source.as_deref() {
        Some("force_remote") => ProvisioningStrategy::ForceRemote,
        Some("local_only") => ProvisioningStrategy::LocalOnly,
        _ => ProvisioningStrategy::Auto,
    };

    let sync_tx = state.sync_tx.clone();
    
    // 在后台执行同步，避免阻塞 HTTP 响应
    tokio::spawn(async move {
        let state_for_cb = state.clone();
        let callback = move |percent: u32, message: &str| {
            let stage = if percent == 100 { "completed" } else if percent > 0 { "downloading" } else { "requesting" };
            let event = SyncProgressEvent {
                stage: stage.to_string(),
                percent,
                speed: "".to_string(),
                message: message.to_string(),
            };
            
            // 更新全局最后一次进度快照 [NEW]
            if let Ok(mut last) = state_for_cb.last_sync_event.try_write() {
                *last = Some(event.clone());
            }

            let _ = sync_tx.send(event);
        };

        match AssetProvisioner::ensure_assets_with_progress(strategy, Box::new(callback)).await {
            Ok(assets) => {
                info!("✅ 后台资产同步完成: {}", assets.version);
            }
            Err(e) => {
                error!("❌ 后台资产同步失败: {}", e);
                let _ = state.sync_tx.send(SyncProgressEvent {
                    stage: "error".to_string(),
                    percent: 0,
                    speed: "".to_string(),
                    message: e.to_string(),
                });
            }
        }
    });

    Json(ProvisionSyncResponse {
        success: true,
        version: "".to_string(),
        ls_address: "".to_string(),
        message: "同步任务已在后台启动".to_string(),
    })
}

/// GET /v1/provision/progress
/// 订阅同步进度流 (SSE)
pub async fn sync_progress_stream(
    State(state): State<Arc<crate::state::AppState>>,
) -> Sse<impl Stream<Item = Result<Event, Infallible>>> {
    let mut rx = state.sync_tx.subscribe();

    let stream = async_stream::stream! {
        // 首先重播最近一次进度 (如果有) [NEW]
        if let Some(msg) = state.last_sync_event.read().await.clone() {
            yield Ok(Event::default().json_data(msg).unwrap());
        }

        while let Ok(msg) = rx.recv().await {
            yield Ok(Event::default().json_data(msg).unwrap());
        }
    };

    Sse::new(stream).keep_alive(axum::response::sse::KeepAlive::default())
}

#[derive(Serialize)]
pub struct DetectIdeResponse {
    pub success: bool,
    pub executable_path: Option<String>,
    pub args: Option<Vec<String>>,
    pub message: String,
}

/// GET /v1/provision/detect_ide
/// 探测运行中的 Antigravity 进程
pub async fn detect_ide_api() -> impl IntoResponse {
    let (path, args) = transcoder_core::ide::get_process_info_for_api();
    
    if path.is_some() {
        Json(DetectIdeResponse {
            success: true,
            executable_path: path.map(|p| p.to_string_lossy().to_string()),
            args: args.map(|a| a.iter().map(|s| s.to_string()).collect()),
            message: "成功探测到活跃进程".to_string(),
        })
    } else {
        Json(DetectIdeResponse {
            success: false,
            executable_path: None,
            args: None,
            message: "未发现运行中的 Antigravity 进程".to_string(),
        })
    }
}

/// GET /v1/provision/select_path
/// 打开本地文件选择对话框
pub async fn select_path_api() -> impl IntoResponse {
    #[cfg(feature = "gui")]
    {
        // 使用 spawn_blocking 确保在 macOS 等平台上对话框正常弹出
        let res = tokio::task::spawn_blocking(|| {
            let dialog = rfd::FileDialog::new()
                .set_title("选择 Antigravity 可执行文件");
            
            #[cfg(target_os = "macos")]
            let dialog = dialog.add_filter("App", &["app"]);
            #[cfg(target_os = "windows")]
            let dialog = dialog.add_filter("Executable", &["exe"]);
            
            dialog.pick_file()
        }).await;

        match res {
            Ok(Some(path)) => {
                Json(DetectIdeResponse {
                    success: true,
                    executable_path: Some(path.to_string_lossy().to_string()),
                    args: None,
                    message: "已选择文件".to_string(),
                })
            }
            _ => {
                Json(DetectIdeResponse {
                    success: false,
                    executable_path: None,
                    args: None,
                    message: "操作已取消".to_string(),
                })
            }
        }
    }
    #[cfg(not(feature = "gui"))]
    {
        Json(DetectIdeResponse {
            success: false,
            executable_path: None,
            args: None,
            message: "当前环境不支持 UI 选择目录，请在设置中手动输入路径".to_string(),
        })
    }
}

/// GET /v1/provision/status
/// 检查当前资产状态
pub async fn get_provision_status_api() -> impl IntoResponse {
    let bin_dir = transcoder_core::common::get_app_bin_dir();
    let data_dir = transcoder_core::common::get_app_data_dir();

    let ls_core_path = bin_dir.join("ls_core");
    let ls_core_exists = ls_core_path.exists();
    let cert_pem_exists = bin_dir.join("cert.pem").exists();
    
    // 计算哈希
    let ls_core_hash = if ls_core_exists {
        calc_sha256(&ls_core_path).unwrap_or_else(|_| "HASH_ERROR".to_string())
    } else {
        "NOT_FOUND".to_string()
    };

    // 从运行时配置获取
    let config = transcoder_core::common::get_runtime_config();
    let current_version = config.version;

    Json(ProvisionStatusResponse {
        ls_core_exists,
        cert_pem_exists,
        bin_dir: bin_dir.display().to_string(),
        data_dir: data_dir.display().to_string(),
        current_version,
        ls_core_hash,
    })
}

fn calc_sha256(path: &std::path::Path) -> anyhow::Result<String> {
    use sha2::{Sha256, Digest};
    use std::io::{self, Read};
    
    let mut file = std::fs::File::open(path)?;
    let mut hasher = Sha256::new();
    let mut buffer = [0u8; 8192];

    loop {
        let count = file.read(&mut buffer)?;
        if count == 0 { break; }
        hasher.update(&buffer[..count]);
    }

    Ok(format!("{:x}", hasher.finalize()))
}
