use anyhow::Result;
use tracing::{error, info, warn};
use std::time::Duration;
use tokio::sync::mpsc;

use crate::common::LsConnectionInfo;
use crate::constants::{GRPC_MAX_RETRIES, GRPC_RETRY_DELAY_MS};
use crate::proto::exa::codeium_common_pb::Metadata;
use crate::mappers::{ProtocolMapper, MapperChunk, StreamMetadata};

pub async fn handle_generic_stream<M: ProtocolMapper>(
    req: M::Request,
    conn: LsConnectionInfo,
    stats_mgr: Option<std::sync::Arc<crate::stats::StatsManager>>,
    meta_tx: Option<tokio::sync::oneshot::Sender<StreamMetadata>>,
) -> Result<mpsc::Receiver<MapperChunk>> {
    let (tx, rx) = mpsc::channel(128);

    // 🚀 深度重构：将首次连接建立过程前置到 spawn 之前
    // 这样如果发生 403 (PERMISSION_DENIED)，我们可以直接返回 Result::Err，
    // 从而让外层 chat.rs 能返回真实的 HTTP 403 状态码。
    
    let config = crate::common::get_runtime_config();
    let metadata = Metadata {
        ide_name: config.ide_name,
        ide_version: config.version.clone(),
        extension_name: config.extension_name,
        extension_version: config.version,
        ..Default::default()
    };

    let model_name = M::get_model(&req).to_string();
    let prompt = M::build_prompt(&req)?;

    // 🚀 工作区路径解析：优先使用 conn.workspace_dir，其次从请求 system prompt 中提取
    let resolved_workspace = conn.workspace_dir.clone()
        .or_else(|| M::extract_workspace(&req));
    if let Some(ref ws) = resolved_workspace {
        tracing::info!("📁 [Engine] 解析到工作区路径: {}", ws);
    }

    // 尝试建立连接
    let mut client = crate::cascade::CascadeClient::new(
        conn.grpc_addr.clone(),
        metadata.clone(),
        conn.csrf_token.clone().unwrap_or_default(),
        conn.tls_cert.clone(),
        resolved_workspace,
    ).await.map_err(|e| {
        // 如果连接阶段就发现 403 迹象（通过 ErrorFetcher）
        if let Some(ref fetcher) = conn.error_fetcher {
            if let Some(raw_err) = fetcher.get_last_error() {
                if raw_err.contains("PERMISSION_DENIED") || raw_err.contains("Verify your account") {
                    return anyhow::anyhow!("{}", raw_err);
                }
            }
        }
        e 
    })?;

    // 发起流式请求
    let mut rx_cascade = client.chat_stream(prompt.clone(), conn.resolved_model_id).await.map_err(|e| {
        // 如果请求阶段发现 403 迹象
        if let Some(ref fetcher) = conn.error_fetcher {
            if let Some(raw_err) = fetcher.get_last_error() {
                if raw_err.contains("PERMISSION_DENIED") || raw_err.contains("Verify your account") {
                    return anyhow::anyhow!("{}", raw_err);
                }
            }
        }
        e
    })?;

    // 🚀 关键改进：尝试读取第一帧。如果 LS 直接关闭流且 stderr 有 403，则截获
    let first_res = rx_cascade.recv().await;
    match first_res {
        Some(Err(status)) if status.code() == tonic::Code::PermissionDenied => {
             return Err(anyhow::anyhow!("{}", status.message()));
        }
        None => {
            // 流直接结束（空流），检查 stderr
            if let Some(ref fetcher) = conn.error_fetcher {
                if let Some(raw_err) = fetcher.get_last_error() {
                    if raw_err.contains("PERMISSION_DENIED") || raw_err.contains("Verify your account") {
                        return Err(anyhow::anyhow!("{}", raw_err));
                    }
                }
            }
        }
        _ => {}
    }

    // 握手成功或已有数据，启动后台循环处理剩余工作
    tokio::spawn(async move {
        if let Err(e) = run_transcode_loop_with_client::<M>(req, conn, tx.clone(), stats_mgr, meta_tx, client, rx_cascade, model_name, prompt, first_res).await {
            error!("转码引擎内部异常: {:?}", e);
        }
    });

    Ok(rx)
}

async fn run_transcode_loop_with_client<M: ProtocolMapper>(
    _req: M::Request,
    conn: LsConnectionInfo,
    tx: mpsc::Sender<MapperChunk>,
    stats_mgr: Option<std::sync::Arc<crate::stats::StatsManager>>,
    mut meta_tx: Option<tokio::sync::oneshot::Sender<StreamMetadata>>,
    mut _client: crate::cascade::CascadeClient,
    mut rx_cascade: mpsc::Receiver<Result<String, tonic::Status>>,
    model_name: String,
    prompt: String,
    first_res: Option<Result<String, tonic::Status>>,
) -> Result<()> {
    // 提升状态变量
    let mut tool_call_buffer = String::new();
    let mut in_tool_call = false;
    let mut tool_call_index = 0u32;

    // 发送初始帧
    for chunk in M::initial_chunks() {
        let _ = tx.send(chunk).await;
    }

    let mut full_response_content = String::new();
    let mut sent_errors = std::collections::HashSet::new();

    // 先处理第一帧（如果有）
    let process_res = |res: Result<String, tonic::Status>, full_content: &mut String, sent_errs: &mut std::collections::HashSet<String>, 
                       tc_buf: &mut String, in_tc: &mut bool, tc_idx: &mut u32, tx: &mpsc::Sender<MapperChunk>| -> Result<Option<String>> {
        match res {
            Ok(delta) => {
                full_content.push_str(&delta);
                // 模拟简单的 map_delta 逻辑（此处逻辑与主循环一致，为了不重复代码可暂略或内联）
                return Ok(Some(delta));
            }
            Err(status) => {
                return Err(anyhow::anyhow!(format!("gRPC 错误 [{}]: {}", status.code(), status.message())));
            }
        }
    };

    if let Some(res) = first_res {
        match process_res(res, &mut full_response_content, &mut sent_errors, &mut tool_call_buffer, &mut in_tool_call, &mut tool_call_index, &tx) {
            Ok(Some(delta)) => {
                let chunks = M::map_delta(&model_name, delta, false, &mut tool_call_buffer, &mut in_tool_call, &mut tool_call_index).await?;
                for chunk in chunks { let _ = tx.send(chunk).await; }
            }
            Err(e) => {
                let _ = send_error_to_user::<M>(&tx, &model_name, &e.to_string(), &mut tool_call_buffer, &mut in_tool_call, &mut tool_call_index).await;
                return Err(e);
            }
            _ => {}
        }
    }

    // 继续处理剩余流
    while let Some(res) = rx_cascade.recv().await {
        match res {
            Ok(delta) => {
                full_response_content.push_str(&delta);
                let chunks = M::map_delta(&model_name, delta, false, &mut tool_call_buffer, &mut in_tool_call, &mut tool_call_index).await?;
                for chunk in chunks { let _ = tx.send(chunk).await; }
            }
            Err(status) => {
                let err_msg = format!("gRPC 错误 [{}]: {}", status.code(), status.message());
                let _ = send_error_to_user::<M>(&tx, &model_name, &err_msg, &mut tool_call_buffer, &mut in_tool_call, &mut tool_call_index).await;
                return Err(anyhow::anyhow!(err_msg));
            }
        }
    }

    // 🚀 核心兜底逻辑：如果流执行完毕但没有任何内容产出，通常意味着 LS 进程发生了静默报错（如 403）
    if full_response_content.is_empty() {
         let mut err_msg = "内核返回内容为空，且未抓取到具体报错。请检查账号状态。".to_string();
         if let Some(ref fetcher) = conn.error_fetcher {
             if let Some(raw_err) = fetcher.get_last_error() {
                 err_msg = raw_err;
             }
         }
         let _ = send_error_to_user::<M>(&tx, &model_name, &err_msg, &mut tool_call_buffer, &mut in_tool_call, &mut tool_call_index).await;
    }

    // 发送结束帧
    let final_chunks = M::map_delta(&model_name, String::new(), true, &mut tool_call_buffer, &mut in_tool_call, &mut tool_call_index).await?;
    for chunk in final_chunks { let _ = tx.send(chunk).await; }

    // 统计逻辑...
    let input_tokens = (prompt.len() / 4).max(1) as u32;
    let output_tokens = (full_response_content.len() / 4).max(1) as u32;
    if let Some(mgr) = stats_mgr {
        let account = conn.account_email.clone().unwrap_or_else(|| "anonymous".to_string());
        let _ = mgr.record_usage(&account, &model_name, input_tokens, output_tokens);
    }

    if let Some(meta_tx_inner) = meta_tx.take() {
        let _ = meta_tx_inner.send(crate::mappers::StreamMetadata { input_tokens, output_tokens, error: None });
    }

    Ok(())
}

/// 辅助函数：将错误信息发送给终端用户 (极简模式：直接输出原始文本)
async fn send_error_to_user<M: ProtocolMapper>(
    tx: &mpsc::Sender<MapperChunk>,
    model_name: &str,
    err_msg: &str,
    tool_call_buffer: &mut String,
    in_tool_call: &mut bool,
    tool_call_index: &mut u32,
) -> Result<()> {
    if let Ok(chunks) = M::map_delta(
        model_name,
        err_msg.to_string(),
        false,
        tool_call_buffer,
        in_tool_call,
        tool_call_index,
    ).await {
        for chunk in chunks {
            let _ = tx.send(chunk).await;
        }
    }
    Ok(())
}
