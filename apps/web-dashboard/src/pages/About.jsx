import React, { useState, useEffect } from 'react';
import { useSpotlight } from '../hooks/useSpotlight';
import { useTranslation } from 'react-i18next';
import { 
  ShieldCheck, 
  User, 
  MessageCircle, 
  Send, 
  Github, 
  Heart, 
  Coffee, 
  ExternalLink,
  Cpu,
  RefreshCw,
  Box,
  X,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import useSettingsStore from '../store/useSettingsStore';

const About = () => {
  const { t } = useTranslation();
  const spotlightRef = useSpotlight();
  const { 
    provisionStatus, 
    versionInfo, 
    updateInfo,
    isCheckingUpdate,
    fetchProvisionStatus, 
    fetchVersionInfo,
    checkDashboardUpdate
  } = useSettingsStore();
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);

  useEffect(() => {
    fetchProvisionStatus();
    fetchVersionInfo();
  }, [fetchProvisionStatus, fetchVersionInfo]);

  const handleCheckUpdate = async (e) => {
    e.stopPropagation();
    try {
      await checkDashboardUpdate();
    } catch (err) {
      console.error('Update check failed:', err);
    }
  };

  // 系统清单数据
  const manifestData = [
    { label: t('about.envStack'), value: "React 19 / Vite / Tailwind", icon: Box },
    { 
      label: t('about_extra.dashboardVersion'), 
      value: `v0.0.2 (${t('about_extra.experimental')})`, 
      icon: ShieldCheck,
      isVersionRow: true 
    },
    { 
      label: t('about_extra.lsEngineCore'), 
      value: provisionStatus?.current_version 
        ? `v${provisionStatus.current_version}` 
        : (versionInfo?.data?.simulated_version ? `v${versionInfo.data.simulated_version}` : t('about_extra.fetching')), 
      icon: Cpu 
    },
  ];

  return (
    <div ref={spotlightRef} className="flex-1 overflow-y-auto p-8 space-y-12 animate-in fade-in duration-700 transition-colors duration-300 spotlight-group">
      {/* Header Block */}
      <div className="flex flex-col items-center justify-center space-y-4 py-8 relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-blue-600/5 blur-[120px] rounded-full pointer-events-none" />
        <div className="w-24 h-24 rounded-3xl bg-black flex items-center justify-center shadow-2xl shadow-blue-500/10 relative z-10 overflow-hidden transform hover:scale-105 transition-transform duration-500">
          <img src="/logo.png" alt="Logo" className="w-20 h-20 object-contain" />
        </div>
        <div className="text-center relative z-10">
          <h1 className="text-3xl font-black tracking-tighter uppercase mb-1 text-foreground">Antigravity Tools LS</h1>
          <p className="text-[10px] text-foreground/55 tracking-[0.3em] font-mono leading-none lowercase italic opacity-80">{t('app.subtitle')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 max-w-6xl mx-auto items-stretch">
        {/* 左侧：系统清单 (Manifest) */}
        <div className="lg:col-span-3 flex flex-col">
           <h2 className="text-[10px] font-bold text-foreground/45 uppercase tracking-[0.2em] px-2 mb-4">{t('about.manifest')}</h2>
           <div className="glass-card spotlight-card p-6 rounded-2xl border border-glass-border relative overflow-hidden group flex-1 flex flex-col transition-all duration-300">
              <div className="grain-overlay" />
              <div className="flex-1 space-y-2">
                {manifestData.map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-foreground/[0.02] border border-glass-border hover:bg-foreground/[0.04] transition-colors group/node">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-foreground/5 flex items-center justify-center text-foreground/55 group-hover:text-blue-500 transition-colors">
                        <item.icon size={18} />
                      </div>
                      <div>
                         <p className="text-[10px] text-foreground/55 font-bold uppercase tracking-wider">{item.label}</p>
                         <div className="flex items-center gap-2">
                            <p className="text-sm font-mono text-foreground/80">{item.value}</p>
                            {item.isVersionRow && updateInfo?.has_update && (
                              <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-[8px] font-bold text-blue-400 animate-pulse">
                                 {t('about_extra.newVersion', { version: updateInfo.latest_version })}
                              </span>
                            )}
                         </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Update Info Inline Result Area */}
              {updateInfo && !isCheckingUpdate && (
                <div className={`mt-4 p-3 rounded-xl border flex items-center gap-3 animate-in slide-in-from-top-2 duration-300 ${
                  updateInfo.has_update 
                    ? 'bg-blue-500/5 border-blue-500/20 text-blue-400' 
                    : 'bg-foreground/[0.01] border-glass-border text-foreground/45'
                }`}>
                  {updateInfo.has_update ? <AlertCircle size={14} /> : <CheckCircle2 size={14} />}
                  <span className="text-[10px] font-bold uppercase tracking-widest flex-1">
                    {updateInfo.message} {updateInfo.has_update && t('about_extra.latestVersion', { version: updateInfo.latest_version })}
                  </span>
                  {updateInfo.has_update && (
                    <a 
                      href={updateInfo.release_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-[10px] font-black underline underline-offset-4 hover:text-blue-300"
                    >
                      {t('about_extra.getUpdate')}
                    </a>
                  )}
                </div>
              )}
           </div>

           <button 
             onClick={handleCheckUpdate}
             disabled={isCheckingUpdate}
             className="mt-8 w-full py-4 rounded-xl border border-glass-border hover:bg-foreground/5 text-foreground/85 hover:text-foreground font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 active:scale-[0.98] transition-all group/btn box-border"
           >
             <RefreshCw size={16} className={`${isCheckingUpdate ? 'animate-spin text-blue-500' : 'group-hover-btn:text-blue-500 transition-colors'}`} />
             {isCheckingUpdate ? t('about_extra.verifying') : t('about_extra.checkUpdate')}
           </button>
        </div>

        {/* 右侧：作者签名 (Signature) */}
        <div className="lg:col-span-2 flex flex-col">
           <h2 className="text-[10px] font-bold text-foreground/45 uppercase tracking-[0.2em] px-2 mb-4">{t('about.signature')}</h2>
           <div className="glass-card spotlight-card p-6 rounded-2xl border border-glass-border relative overflow-hidden group flex-1 flex flex-col transition-all duration-300">
              <div className="grain-overlay" />
              {/* Profile */}
              <div className="flex items-center gap-4 mb-8">
                 <div className="w-14 h-14 rounded-2xl bg-foreground/5 border border-glass-border flex items-center justify-center text-foreground/65 group-hover:border-blue-500/50 transition-all duration-500 overflow-hidden relative">
                    <User size={32} />
                    <div className="absolute inset-0 bg-blue-600/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                 </div>
                 <div>
                    <h3 className="text-xl font-black text-foreground/90">Ctrler</h3>
                    <p className="text-[10px] text-emerald-500 font-mono font-bold tracking-widest uppercase">{t('about.statusVerified')}</p>
                 </div>
              </div>

              {/* Social Nodes */}
              <div className="flex-1 space-y-2">
                 {[
                    { name: t('about.wechat'), value: "Ctrler", icon: MessageCircle, color: "text-emerald-500", url: null },
                    { name: t('about.telegram'), value: "@AntigravityManager", icon: Send, color: "text-sky-500", url: "https://t.me/AntigravityManager" },
                    { name: t('about.github'), value: "lbjlaq / Tools-LS", icon: Github, color: "text-foreground", url: "https://github.com/lbjlaq/Antigravity-Tools-LS" },
                 ].map((node, i) => {
                   const Container = node.url ? 'a' : 'div';
                   return (
                     <Container 
                       key={i} 
                       href={node.url || undefined}
                       target={node.url ? "_blank" : undefined}
                       rel={node.url ? "noopener noreferrer" : undefined}
                       className={`flex items-center justify-between p-3 rounded-xl bg-foreground/[0.02] border border-glass-border hover:bg-foreground/[0.04] transition-colors group/node ${node.url ? 'cursor-pointer' : 'cursor-default'}`}
                     >
                        <div className="flex items-center gap-3">
                           <node.icon size={16} className={node.color} />
                           <span className="text-xs font-bold text-foreground/85">{node.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono text-foreground/55 group-hover/node:text-foreground/85 transition-colors uppercase">{node.value}</span>
                          {node.url && <ExternalLink size={10} className="text-foreground/10 group-hover/node:text-blue-500 transition-colors" />}
                        </div>
                     </Container>
                   );
                 })}
              </div>
           </div>

           {/* Energy supply button - Moved outside to align with left button */}
           <button 
             onClick={() => setIsSupportModalOpen(true)}
             className="mt-8 w-full py-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all"
           >
             <Heart size={16} className="fill-white" />
             {t('about.donatedBtn')}
           </button>
        </div>
      </div>

      <div className="text-center py-8">
         <p className="text-[10px] text-foreground/35 tracking-[0.5em] font-mono">COPYRIGHT © 2025-2026 ANTIGRAVITY. ALL RIGHTS RESERVED.</p>
      </div>

      {/* Support Modal */}
      {isSupportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" onClick={() => setIsSupportModalOpen(false)} />
          <div className="glass-card w-full max-w-2xl rounded-3xl border border-glass-border relative z-10 overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8">
               <div className="flex justify-between items-start mb-8">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-600/20 flex items-center justify-center text-blue-500">
                      <Coffee size={24} />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-foreground">{t('about.donatedTitle')}</h3>
                       <p className="text-sm text-foreground/65">{t('about.donatedDesc')}</p>
                    </div>
                  </div>
                  <button onClick={() => setIsSupportModalOpen(false)} className="p-2 hover:bg-foreground/5 rounded-full transition-colors">
                    <X size={20} className="text-foreground/65" />
                  </button>
               </div>

               {/* QR Codes Grid */}
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  {[
                    { name: t('about.alipay'), path: "/images/donate/alipay.png" },
                    { name: t('about.wechatPay'), path: "/images/donate/wechat.png" },
                    { name: t('about.coffee'), path: "/images/donate/coffee.png" },
                  ].map((qr, i) => (
                    <div key={i} className="flex flex-col items-center gap-3 p-4 rounded-2xl bg-foreground/[0.02] border border-glass-border group hover:border-foreground/20 transition-all">
                       <div className="w-full aspect-square bg-white rounded-xl overflow-hidden shadow-2xl relative">
                          <img 
                            src={qr.path} 
                            alt={qr.name} 
                            className="w-full h-full object-contain grayscale-[0.5] group-hover:grayscale-0 transition-all duration-700"
                            onError={(e) => { e.target.style.display = 'none'; e.target.parentNode.innerHTML = '<div class="absolute inset-0 flex items-center justify-center text-[10px] text-black font-mono">QR_DATA_MISSING</div>'; }}
                          />
                       </div>
                        <span className="text-[10px] font-bold text-foreground/65 uppercase tracking-widest group-hover:text-blue-500 transition-colors">{qr.name}</span>
                    </div>
                  ))}
               </div>

               <button 
                 onClick={() => setIsSupportModalOpen(false)}
                 className="w-full py-3 rounded-xl border border-glass-border hover:bg-foreground/5 text-foreground/60 font-bold text-xs uppercase"
               >
                 {t('common.close')}
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default About;
