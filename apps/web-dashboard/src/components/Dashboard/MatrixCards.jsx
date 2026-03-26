import React, { useMemo } from 'react';
import { 
  Zap, 
  Database, 
  Activity, 
  Cpu, 
  ShieldCheck, 
  AlertTriangle, 
  Layers,
  HardDrive
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { getIntegrityStatus } from './integrityStatus';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

import { useNavigate } from 'react-router-dom';

// 基础卡片容器
export const DashboardCard = ({ children, title, icon: Icon, className, height = "h-[180px]", onClick }) => (
  <div 
    onClick={onClick}
    className={cn(
      "glass-card spotlight-card p-5 rounded-2xl flex flex-col relative overflow-hidden group transition-all duration-300", 
      height, 
      className,
      onClick && "cursor-pointer active:scale-[0.98]"
    )}
  >
    <div className="grain-overlay" />
    <div className="flex justify-between items-start mb-2 relative z-10">
      <h3 className="text-foreground/30 font-bold text-[10px] uppercase tracking-[0.2em]">{title}</h3>
      {Icon && <Icon size={14} className="text-foreground/20 group-hover:text-blue-500/50 transition-colors magnetic" />}
    </div>
    <div className="flex-1 flex flex-col justify-end relative z-10">
      {children}
    </div>
    {/* 背景装饰：微弱的 Matrix 纹理 */}
    <div className="absolute top-0 right-0 p-4 opacity-[0.02] dark:opacity-[0.02] text-foreground pointer-events-none">
       <Layers size={80} />
    </div>
  </div>
);

// 1. LS Core Integrity Card
export const LSIntegrityCard = ({ metrics, provision }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { state, isHealthy } = getIntegrityStatus(provision);
  const isChecking = state === 'CHECKING';
  const cardStatusText = isChecking
    ? t('dashboard.checking')
    : isHealthy
      ? t('dashboard.optimal')
      : t('dashboard.degraded');
  
  return (
    <DashboardCard 
      title={t('dashboard.lsCoreIntegrity')} 
      icon={ShieldCheck}
      onClick={state === 'DEGRADED' ? () => navigate('/settings', { state: { tab: 'assets' } }) : undefined}
      className={state === 'DEGRADED' ? "border-amber-500/20 hover:border-amber-500/50" : ""}
    >
      <div className="flex items-baseline gap-2">
        <span className={cn(
          "font-black text-3xl tracking-tighter",
          isChecking
            ? "text-blue-400"
            : isHealthy
              ? "text-emerald-500"
              : "text-amber-500 animate-pulse"
        )}>
          {cardStatusText}
        </span>
      </div>
      <div className="mt-2 space-y-1">
        <div className="flex items-center gap-2 text-[10px] text-foreground/40">
           <div className={cn(
             "w-1.5 h-1.5 rounded-full",
             isChecking
               ? "bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.45)]"
               : isHealthy
                 ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                 : "bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]"
           )} />
           {isChecking ? t('dashboard.establishing') : t('dashboard.systemCoreReady')}
        </div>
        {state === 'DEGRADED' && (
          <div className="text-[9px] text-amber-500/60 font-black uppercase tracking-widest mt-1">
             {t('settings.fixNow')} →
          </div>
        )}
        <div className="text-[10px] text-foreground/20 font-mono">
           SHA256: {isHealthy ? t('dashboard.verifiedOk') : t('dashboard.checkPending')}
        </div>
      </div>
    </DashboardCard>
  );
};

// 2. Memory Matrix Card
export const MemoryMatrixCard = ({ metrics }) => {
  const { t } = useTranslation();
  const totalGB = (metrics?.system_total_memory / (1024 * 1024 * 1024)).toFixed(1);
  const lsMB = (metrics?.ls_aggregate_rss / (1024 * 1024)).toFixed(0);
  const pressure = metrics?.memory_pressure_index || 0;
  
  // 生成一个 8x4 的网格像素点
  const pixels = useMemo(() => Array.from({ length: 32 }, (_, i) => ({
    active: i < Math.floor(pressure / (100 / 32)),
    id: i
  })), [pressure]);

  return (
    <DashboardCard title={t('dashboard.memoryMatrix')} icon={Cpu}>
      <div className="flex justify-between items-end">
        <div>
          <div className="text-3xl font-black tracking-tighter text-foreground">
            {lsMB}<span className="text-xs ml-1 text-foreground/40 font-bold uppercase">MB</span>
          </div>
          <div className="text-[10px] text-foreground/30 uppercase mt-1">{t('dashboard.lsAggregatedRss')}</div>
        </div>
        
        {/* 动态网格像素 */}
        <div className="grid grid-cols-8 gap-1 mb-1">
          {pixels.map(p => (
            <div 
              key={p.id} 
              className={cn(
                "w-1.5 h-1.5 rounded-[1px] transition-all duration-500",
                p.active ? "bg-blue-500 shadow-[0_0_5px_rgba(59,130,246,0.6)]" : "bg-foreground/5"
              )} 
            />
          ))}
        </div>
      </div>
      <div className="mt-3 pt-2 border-t border-glass-border flex justify-between text-[9px] uppercase tracking-wider text-foreground/20">
         <span>{t('dashboard.sysLoad')}: {pressure.toFixed(1)}%</span>
         <span>{t('dashboard.cap')}: {totalGB}GB</span>
      </div>
    </DashboardCard>
  );
};

// 3. Heartbeat / PID Card
export const HeartbeatCard = ({ metrics, instances = [] }) => {
  const { t } = useTranslation();
  const activeCount = instances.filter(i => i.status === 'active').length;
  const orphanCount = instances.filter(i => i.status === 'orphan').length;

  return (
    <DashboardCard title={t('dashboard.runtimeHeartbeat')} icon={Activity}>
      <div className="flex items-baseline gap-2">
        <span className="text-4xl font-black tracking-tighter text-blue-500">{activeCount}</span>
        <span className="text-xs text-foreground/30 font-bold uppercase tracking-widest">{t('dashboard.activeSlots')}</span>
      </div>
      <div className="mt-4 flex gap-1.5">
        {/* 槽位波形模拟 */}
        {Array.from({ length: 12 }).map((_, i) => (
          <div 
            key={i} 
            className={cn(
              "w-1 flex-1 rounded-full bg-foreground/5 relative overflow-hidden",
              i < activeCount ? "h-6" : "h-3"
            )}
          >
            {i < activeCount && (
               <div className="absolute inset-0 bg-blue-500/40 animate-pulse" />
            )}
          </div>
        ))}
      </div>
      <div className="mt-2 text-[9px] text-foreground/20 uppercase flex justify-between">
         <span>{t('dashboard.isolationSecure')}</span>
         {orphanCount > 0 && <span className="text-amber-500/50">{t('dashboard.orphansDetect', { count: orphanCount })}</span>}
      </div>
    </DashboardCard>
  );
};

// 4. Throughput Card
export const ThroughputCard = ({ summary }) => {
  const { t } = useTranslation();
  const total = summary?.total_requests || 0;
  
  return (
    <DashboardCard title={t('dashboard.throughputIndex')} icon={Zap}>
      <div className="text-4xl font-black tracking-tighter text-foreground">
        {total.toLocaleString()}<span className="text-xs ml-1 text-foreground/40 uppercase">{t('dashboard.hits')}</span>
      </div>
      <div className="mt-1 text-[10px] text-foreground/30 uppercase tracking-[0.1em]">{t('dashboard.cumulativeLoad')}</div>
      
      {/* 虚拟迷你趋势图 (此处先用简单的 SVG 占位，后期可由 store 数据驱动) */}
      <div className="h-8 mt-4 flex items-end gap-[1px]">
         {[40, 60, 45, 70, 80, 55, 65, 90, 75, 85, 95, 100].map((h, i) => (
           <div 
             key={i} 
             style={{ height: `${h}%` }} 
             className="flex-1 bg-blue-500/20 rounded-t-[1px] group-hover:bg-blue-500/40 transition-colors" 
           />
         ))}
      </div>
    </DashboardCard>
  );
};
