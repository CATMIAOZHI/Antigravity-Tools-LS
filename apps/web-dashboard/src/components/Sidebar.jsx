import React from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  Infinity, 
  LayoutDashboard, 
  Users, 
  Key, 
  Cpu, 
  BarChart3, 
  Scroll, 
  Layers, 
  Settings2,
  Info
} from 'lucide-react';
import useAppStore from '../store/useAppStore';

const Sidebar = () => {
  const { t } = useTranslation();
  const { sidebarCollapsed } = useAppStore();

  const navItems = [
    { to: '/', name: t('nav.dashboard'), icon: LayoutDashboard },
    { to: '/accounts', name: t('nav.accounts'), icon: Users },
    { to: '/keys', name: t('nav.keys'), icon: Key },
    { to: '/processes', name: t('nav.processes'), icon: Cpu },
    { to: '/stats', name: t('nav.stats'), icon: BarChart3 },
    { to: '/logs', name: t('nav.logs'), icon: Scroll },
    { to: '/integration', name: t('nav.integration'), icon: Layers },
    { to: '/settings', name: t('nav.settings'), icon: Settings2 },
    { to: '/about', name: t('nav.about'), icon: Info },
  ];

  return (
    <aside className={`${sidebarCollapsed ? 'w-20' : 'w-60'} h-screen bg-sidebar border-r border-glass-border flex flex-col py-6 px-3 shrink-0 transition-all duration-300 relative`}>
      {/* Brand & Toggle Container */}
      <div className={`flex items-start ${sidebarCollapsed ? 'justify-center mb-10' : 'gap-3 px-3 mb-10'} shrink-0`}>
        <div className="w-8 h-8 rounded-lg bg-black flex items-center justify-center shadow-lg shadow-blue-500/20 shrink-0 mt-0.5 overflow-hidden">
          <img src="/logo.png" alt="Logo" className="w-7 h-7 object-contain" />
        </div>
        {!sidebarCollapsed && (
          <div className="flex flex-col animate-in fade-in duration-300 select-none text-foreground">
            <span className="text-lg font-black tracking-tighter uppercase leading-none mb-1">Antigravity</span>
            <span className="text-lg font-black tracking-tighter uppercase leading-none text-blue-500/80">Tools LS</span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1.5 overflow-y-auto overflow-x-hidden scrollbar-hide">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            title={sidebarCollapsed ? item.name : ''}
            className={({ isActive }) => `
              flex items-center ${sidebarCollapsed ? 'justify-center px-0' : 'gap-3 px-3'} py-3.5 rounded-xl text-[13px] font-bold transition-all relative group/nav
              ${isActive ? 'sidebar-item-active text-blue-400' : 'sidebar-item-inactive text-foreground/65 hover:text-foreground/85'}
            `}
          >
            <item.icon className={`w-5 h-5 shrink-0 ${sidebarCollapsed ? 'group-hover/nav:scale-110 transition-transform' : ''}`} />
            {!sidebarCollapsed && (
              <span className="truncate whitespace-nowrap animate-in slide-in-from-left-2 duration-300">{item.name}</span>
            )}
            
            {/* Tooltip for collapsed state */}
            {sidebarCollapsed && (
              <div className="fixed left-20 px-3 py-1.5 bg-sidebar border border-glass-border rounded-lg text-[10px] font-black uppercase tracking-widest pointer-events-none opacity-0 group-hover/nav:opacity-100 transition-opacity z-50 shadow-2xl ml-2 text-foreground">
                {item.name}
              </div>
            )}
          </NavLink>
        ))}
      </nav>

    </aside>
  );
};

export default Sidebar;
