import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { Bell, Languages, Moon, Sun, PanelLeftOpen, PanelLeftClose } from 'lucide-react';
import useAppStore from '../store/useAppStore';
import NotificationCenter from './NotificationCenter';

const Header = () => {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const { 
    theme, 
    toggleTheme, 
    language, 
    setLanguage, 
    systemStatus, 
    notifications,
    sidebarCollapsed,
    toggleSidebar
  } = useAppStore();
  const [notificationCenterOpen, setNotificationCenterOpen] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;

  const getPageTitle = () => {
    switch (location.pathname) {
      case '/': return t('nav.dashboard');
      case '/accounts': return t('nav.accounts');
      case '/keys': return t('nav.keys');
      case '/processes': return t('nav.processes');
      case '/stats': return t('nav.stats');
      case '/logs': return t('nav.logs');
      case '/integration': return t('nav.integration');
      case '/settings': return t('nav.settings');
      case '/about': return t('nav.about');
      default: return t('nav.dashboard');
    }
  };

  const toggleLanguage = () => {
    const nextLng = language === 'zh' ? 'en' : 'zh';
    i18n.changeLanguage(nextLng);
    setLanguage(nextLng);
  };

  return (
    <header className="px-10 py-6 flex justify-between items-start shrink-0 transition-all duration-300">
      <div className="flex items-start gap-4">
        {/* Global Sidebar Toggle */}
        <button 
          onClick={toggleSidebar}
          className="w-10 h-10 rounded-xl btn-matrix-glass text-foreground/65 hover:text-blue-400 hover:border-blue-500/30 transition-all shrink-0 mt-0.5"
          title={sidebarCollapsed ? t('nav.expand') : t('nav.collapse')}
        >
          {sidebarCollapsed ? <PanelLeftOpen className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
        </button>

        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
            {getPageTitle()}
            <span className="ml-2 text-foreground/45 font-black uppercase text-[14px]">({getPageTitle().split(' ')[0]})</span>
          </h1>
          <div className="flex items-center gap-2 font-mono text-[10px] font-bold text-foreground/45 tracking-widest uppercase">
            {t('header.integrity')}: <span className={
              systemStatus.integrity === 'OPTIMAL' ? 'text-emerald-400' : 
              systemStatus.integrity === 'DEGRADED' ? 'text-amber-400' : 'text-foreground/40'
            }>{systemStatus.integrity === 'INITIALIZING' ? '...' : systemStatus.integrity}</span> 
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 relative">
        {/* Notifications */}
        <button 
          onClick={() => setNotificationCenterOpen(!notificationCenterOpen)}
          className={`w-10 h-10 rounded-full btn-matrix-glass relative group ${notificationCenterOpen ? 'bg-orange-500/10 border-orange-500/30 text-orange-400' : 'text-orange-400'}`}
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute top-2.5 right-2.5 w-1.5 h-1.5 bg-orange-500 rounded-full shadow-[0_0_8px_rgba(249,115,22,0.6)] group-hover:scale-125 transition-transform"></span>
          )}
        </button>

        <NotificationCenter 
          isOpen={notificationCenterOpen} 
          onClose={() => setNotificationCenterOpen(false)} 
        />

        {/* Language Toggle */}
        <button 
          onClick={toggleLanguage}
          className="h-10 px-4 rounded-full btn-matrix-glass gap-2 text-[11px] font-bold text-foreground/60 uppercase tracking-tight"
        >
          <Languages className="w-3.5 h-3.5" />
          {language === 'zh' ? 'ZH' : 'EN'}
        </button>

        {/* Theme Toggle */}
        <button 
          onClick={toggleTheme}
          className="w-10 h-10 rounded-full btn-matrix-glass text-foreground/65"
        >
          {theme === 'dark' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4 text-orange-500" />}
        </button>
      </div>
    </header>
  );
};

export default Header;
