import React, { useEffect } from 'react';
import useStatsStore from '../store/useStatsStore';
import useProcessStore from '../store/useProcessStore';
import useAccountStore from '../store/useAccountStore';
import useSettingsStore from '../store/useSettingsStore';
import { useTranslation } from 'react-i18next';
import { useSpotlight } from '../hooks/useSpotlight';

import { 
  LSIntegrityCard, 
  MemoryMatrixCard, 
  HeartbeatCard, 
  ThroughputCard 
} from '../components/Dashboard/MatrixCards';

import {
  TrafficStreamChart,
  ModelDistributionChart,
  QuotaHealthCard,
  FaultHotspotsList,
  AccountLoadCard
} from '../components/Dashboard/MatrixCharts';

const Dashboard = () => {
  const { t } = useTranslation();
  const spotlightRef = useSpotlight();
  const spotlightRow2Ref = useSpotlight(); // 为图表行添加追踪器
  const spotlightRow3Ref = useSpotlight(); // 为第三行添加追踪器
  
  const { 
    metrics, 
    summary, 
    trends, 
    modelStats, 
    accountStats, 
    faults, 
    fetchAll 
  } = useStatsStore();
  
  const { processes, fetchProcesses } = useProcessStore();
  const { accounts, fetchAccounts } = useAccountStore();
  const { provisionStatus, fetchProvisionStatus } = useSettingsStore();

  useEffect(() => {
    const loadData = async () => {
      await Promise.all([
        fetchAll(),
        fetchProcesses(),
        fetchAccounts(),
        fetchProvisionStatus()
      ]);
    };
    
    loadData();
    
    // 每 30 秒自动刷新全量指标
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, [fetchAll, fetchProcesses, fetchAccounts, fetchProvisionStatus]);

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-700">
      {/* Row 1: System Vital Signs */}
      <div ref={spotlightRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 spotlight-group">
        <LSIntegrityCard metrics={metrics} provision={provisionStatus} />
        <MemoryMatrixCard metrics={metrics} />
        <HeartbeatCard metrics={metrics} instances={processes} />
        <ThroughputCard summary={summary} />
      </div>

      {/* Row 2: Traffic Matrix Analysis */}
      <div ref={spotlightRow2Ref} className="grid grid-cols-1 lg:grid-cols-3 gap-4 spotlight-group">
        <div className="lg:col-span-2">
          <TrafficStreamChart data={trends} />
        </div>
        <div>
          <ModelDistributionChart stats={modelStats} />
        </div>
      </div>

      {/* Row 3: Operation & Faults */}
      <div ref={spotlightRow3Ref} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 spotlight-group">
        {/* 这里的卡片也需要支持 spotlight-card 类名，目前先确保容器有 spotlight-group */}
        <QuotaHealthCard accounts={accounts} />
        <AccountLoadCard stats={accountStats} />
        <FaultHotspotsList faults={faults} />
      </div>

      {/* Matrix Footer Status */}
      <div className="flex justify-center mt-8">
        <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-text-dim border border-glass-border text-[9px] font-mono text-foreground/65 uppercase tracking-widest shadow-inner transition-colors duration-300">
           <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/40 animate-pulse" />
           {metrics?.timestamp ? t('dashboard.matrixSynced', { time: new Date(metrics.timestamp * 1000).toLocaleTimeString() }) : t('dashboard.establishing')}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
