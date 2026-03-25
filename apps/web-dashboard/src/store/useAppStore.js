import { create } from 'zustand';
import { settingsService } from '../api/services/settings';

const useAppStore = create((set) => ({
  // Theme state
  theme: localStorage.getItem('theme') || 'dark',
  toggleTheme: () => set((state) => {
    const newTheme = state.theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    return { theme: newTheme };
  }),

  // Language state
  language: localStorage.getItem('lng') || 'zh',
  setLanguage: (lng) => set(() => {
    localStorage.setItem('lng', lng);
    return { language: lng };
  }),

  systemStatus: {
    integrity: 'INITIALIZING',
    latency: '...',
    version: 'v0.0.2',
  },

  syncProgress: {
    loading: false,
    percent: 0,
    stage: '',
    message: '',
  },

  setSyncProgress: (progress) => set((state) => ({
    syncProgress: { ...state.syncProgress, ...progress }
  })),

  setSystemStatus: (status) => set((state) => ({
    systemStatus: { ...state.systemStatus, ...status }
  })),

  checkSystemHealth: async () => {
    try {
      // 1. 获取资产状态
      const provision = await settingsService.getProvisionStatus();
      // 2. 获取版本信息
      const version = await settingsService.getVersion();
      
      const isHealthy = provision?.ls_core_exists && provision?.cert_pem_exists;
      const hasUpdate = version?.remote_latest_version && version?.local_app_version && 
                        version.remote_latest_version !== version.local_app_version;

      set((state) => ({
        systemStatus: {
          ...state.systemStatus,
          integrity: isHealthy ? 'OPTIMAL' : 'DEGRADED',
          version: version?.local_app_version || state.systemStatus.version,
        }
      }));

      // 如果不健康，发送警告通知（仅发送一次，通过 ID 避免重复）
      if (!isHealthy) {
        set((state) => {
          const exists = state.notifications.some(n => n.id === 'system-integrity-error');
          if (!exists) {
            // 首次发现异常，增加一个 Toast
            setTimeout(() => state.addToast('检测到系统完整性异常，请检查配置', 'error', 5000), 100);
            return {
              notifications: [
                {
                  id: 'system-integrity-error',
                  title: '系统完整性异常',
                  content: `检测到关键组件缺失：${!provision?.ls_core_exists ? '[LS Core] ' : ''}${!provision?.cert_pem_exists ? '[TLS Certificate]' : ''}。这将导致服务不可用。`,
                  type: 'error',
                  time: new Date().toISOString(),
                  read: false
                },
                ...state.notifications
              ]
            };
          }
          return {};
        });
      }

      // 如果有更新，发送信息通知
      if (hasUpdate) {
        set((state) => {
          const exists = state.notifications.some(n => n.id === 'system-update-available');
          if (!exists) {
            // 发现更新，增加一个 Toast
            setTimeout(() => state.addToast(`发现新版本 ${version.remote_latest_version}，建议升级`, 'info', 5000), 200);
            return {
              notifications: [
                {
                  id: 'system-update-available',
                  title: '发现新版本',
                  content: `从云端检测到新版本 ${version.remote_latest_version}，建议尽快更新。`,
                  type: 'info',
                  time: new Date().toISOString(),
                  read: false
                },
                ...state.notifications
              ]
            };
          }
          return {};
        });
      }
    } catch (err) {
      console.error('System health check failed:', err);
    }
  },
  
  // Notifications state
  notifications: [],
  
  addNotification: (notification) => set((state) => ({
    notifications: [
      {
        id: Date.now(),
        read: false,
        time: new Date().toISOString(),
        ...notification
      },
      ...state.notifications
    ]
  })),

  markAsRead: (id) => set((state) => ({
    notifications: state.notifications.map(n => n.id === id ? { ...n, read: true } : n)
  })),

  markAllAsRead: () => set((state) => ({
    notifications: state.notifications.map(n => ({ ...n, read: true }))
  })),

  clearNotifications: () => set({ notifications: [] }),

  // Toasts state
  toasts: [],
  addToast: (message, type = 'info', duration = 3000) => {
    const id = Date.now();
    set((state) => ({
      toasts: [...state.toasts, { id, message, type, duration }]
    }));
    
    if (duration > 0) {
      setTimeout(() => {
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id)
        }));
      }, duration);
    }
  },
  removeToast: (id) => set((state) => ({
    toasts: state.toasts.filter((t) => t.id !== id)
  })),

  // Sidebar state
  sidebarCollapsed: localStorage.getItem('sidebarCollapsed') === 'true',
  setSidebarCollapsed: (collapsed) => set(() => {
    localStorage.setItem('sidebarCollapsed', collapsed);
    return { sidebarCollapsed: collapsed };
  }),
  toggleSidebar: () => set((state) => {
    const newState = !state.sidebarCollapsed;
    localStorage.setItem('sidebarCollapsed', newState);
    return { sidebarCollapsed: newState };
  }),
}));

export default useAppStore;
