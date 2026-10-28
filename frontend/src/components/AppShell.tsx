'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'sonner';
import {
  BarChart3,
  ChevronsLeft,
  ChevronsRight,
  CreditCard,
  LogOut,
  Menu,
  MonitorPlay,
  PackageCheck,
  Smartphone,
  UtensilsCrossed,
  Users,
  X,
  type LucideIcon,
} from 'lucide-react';
import { RootState } from '@/store';
import { logout } from '@/store/slices/authSlice';

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  adminOnly?: boolean;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    title: 'Operación',
    items: [
      { label: 'Comandero', href: '/comandero', icon: Smartphone },
      { label: 'Caja & Turnos', href: '/caja/turno', icon: CreditCard },
    ],
  },
  {
    title: 'Administración',
    items: [
      { label: 'Auditoría & Ventas', href: '/admin/auditoria', icon: BarChart3, adminOnly: true },
      { label: 'Carta & Precios', href: '/admin/carta', icon: UtensilsCrossed, adminOnly: true },
      { label: 'Inventario', href: '/admin/inventario', icon: PackageCheck, adminOnly: true },
      { label: 'Pantallas KDS', href: '/admin/pantallas-kds', icon: MonitorPlay, adminOnly: true },
      { label: 'Personal', href: '/admin/trabajadores', icon: Users, adminOnly: true },
    ],
  },
];

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Administrador',
  MESERA: 'Mesera',
  CAJERO: 'Cajero',
  COCINERO: 'Cocinero',
};

function SidebarContent({
  collapsed,
  onNavigate,
}: {
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useDispatch();
  const { user, tenantId } = useSelector((state: RootState) => state.auth);

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
  const isMesera = user?.role === 'MESERA';

  const handleLogout = () => {
    dispatch(logout());
    router.push('/login');
    toast.success('Sesión cerrada');
  };

  const groups = NAV_GROUPS.map((g) => ({
    ...g,
    items: g.items.filter((i) => {
      if (i.adminOnly && !isAdmin) return false;
      if (isMesera && i.href === '/caja/turno') return false;
      return true;
    }),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="flex h-full flex-col">
      {/* Marca */}
      <div className={`flex items-center gap-3 px-4 h-16 shrink-0 border-b border-[#20293A] ${collapsed ? 'justify-center px-0' : ''}`}>
        <div className="w-9 h-9 rounded-xl bg-[#2563EB] flex items-center justify-center font-bold text-white shadow-md shrink-0">
          CM
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="text-sm font-bold text-[#F8FAFC] truncate">Chifa Mariana</p>
            <p className="text-[11px] text-[#38BDF8] font-mono-numbers truncate">{tenantId}</p>
          </div>
        )}
      </div>

      {/* Navegación */}
      <nav className="flex-1 overflow-y-auto px-2.5 py-4 space-y-5">
        {groups.map((group) => (
          <div key={group.title}>
            {!collapsed && (
              <p className="px-2.5 mb-1.5 text-[10px] uppercase tracking-widest text-[#64748B] font-semibold">
                {group.title}
              </p>
            )}
            <ul className="space-y-1">
              {group.items.map((item) => {
                const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      title={collapsed ? item.label : undefined}
                      aria-current={active ? 'page' : undefined}
                      className={`btn-tactile flex items-center gap-3 rounded-xl min-h-[44px] text-sm font-medium border ${
                        collapsed ? 'justify-center px-0' : 'px-3'
                      } ${
                        active
                          ? 'bg-[#2563EB]/15 text-white border-[#2563EB]/40'
                          : 'text-[#94A3B8] border-transparent hover:text-white hover:bg-[#1A2234]'
                      }`}
                    >
                      <Icon className={`w-[18px] h-[18px] shrink-0 ${active ? 'text-[#2563EB]' : ''}`} />
                      {!collapsed && <span className="truncate">{item.label}</span>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Usuario */}
      <div className="shrink-0 border-t border-[#20293A] p-2.5 space-y-2">
        {!collapsed && (
          <div className="px-2.5 py-1.5">
            <p className="text-sm font-semibold text-[#F8FAFC] truncate">{user?.fullName || 'Usuario'}</p>
            <p className="text-[11px] text-[#94A3B8]">
              {ROLE_LABELS[user?.role ?? ''] ?? user?.role ?? '—'}
            </p>
          </div>
        )}
        <button
          onClick={handleLogout}
          title="Cerrar sesión"
          className={`btn-tactile w-full flex items-center gap-3 min-h-[44px] rounded-xl border border-red-500/30 bg-red-500/10 text-sm font-medium text-red-400 hover:bg-red-500/20 cursor-pointer ${
            collapsed ? 'justify-center' : 'px-3'
          }`}
        >
          <LogOut className="w-[18px] h-[18px] shrink-0" />
          {!collapsed && <span>Cerrar sesión</span>}
        </button>
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#0B0F17] text-[#F8FAFC] lg:flex">
      {/* Sidebar escritorio */}
      <aside
        className={`hidden lg:block sticky top-0 h-screen shrink-0 bg-[#131823] border-r border-[#20293A] transition-[width] duration-200 ${
          collapsed ? 'w-[72px]' : 'w-64'
        }`}
      >
        <SidebarContent collapsed={collapsed} />
        <button
          onClick={() => setCollapsed((c) => !c)}
          aria-label={collapsed ? 'Expandir menú' : 'Contraer menú'}
          className="absolute top-[22px] -right-3 w-6 h-6 rounded-full bg-[#1A2234] border border-[#20293A] text-[#94A3B8] hover:text-white flex items-center justify-center cursor-pointer"
        >
          {collapsed ? <ChevronsRight className="w-3.5 h-3.5" /> : <ChevronsLeft className="w-3.5 h-3.5" />}
        </button>
      </aside>

      {/* Barra superior móvil */}
      <div className="lg:hidden flex items-center gap-3 h-12 px-3 bg-[#131823] border-b border-[#20293A]">
        <button
          onClick={() => setMobileOpen(true)}
          aria-label="Abrir menú"
          className="btn-tactile w-10 h-10 -ml-1 flex items-center justify-center rounded-lg text-[#94A3B8] hover:text-white hover:bg-[#1A2234] cursor-pointer"
        >
          <Menu className="w-5 h-5" />
        </button>
        <span className="text-sm font-bold">Chifa Mariana</span>
      </div>

      {/* Drawer móvil */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="relative w-64 max-w-[80%] bg-[#131823] border-r border-[#20293A] animate-in slide-in-from-left duration-200">
            <button
              onClick={() => setMobileOpen(false)}
              aria-label="Cerrar menú"
              className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-lg text-[#94A3B8] hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
            <SidebarContent collapsed={false} onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}
