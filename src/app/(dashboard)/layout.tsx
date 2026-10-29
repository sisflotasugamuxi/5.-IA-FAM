'use client';
import React, { useState, useEffect } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { dbService } = await import('@/lib/services/dbService');
        if (dbService.isMockMode()) {
          const userStr = localStorage.getItem('fam_mock_user');
          if (!userStr) {
            window.location.href = '/auth/login';
            return;
          }
        } else {
          const { createClient } = await import('@/lib/supabase/client');
          const supabase = createClient();
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) {
            window.location.href = '/auth/login';
            return;
          }

          // Sync authenticated Supabase profile to localStorage
          try {
            const { data: profile } = await supabase
              .from('perfiles')
              .select('rol, nombre, cargo')
              .eq('id', user.id)
              .single();

            const role = (user.email?.toLowerCase() === 'sisflotasugamuxi@gmail.com')
              ? 'admin'
              : (((profile as any)?.rol || 'consultor'));

            const cachedUser = {
              id: user.id,
              email: user.email || '',
              nombre: (profile as any)?.nombre || user.email?.split('@')[0] || 'Usuario',
              rol: role,
              cargo: (profile as any)?.cargo || (role === 'admin' ? 'Administrador' : role === 'analista' ? 'Analista' : 'Consultor'),
            };
            localStorage.setItem('fam_mock_user', JSON.stringify(cachedUser));
            window.dispatchEvent(new Event('storage'));
          } catch (syncErr) {
            console.warn('Error syncing profile to session state:', syncErr);
          }
        }
        setAuthorized(true);
      } catch (err) {
        console.error('Error checking auth:', err);
        window.location.href = '/auth/login';
      }
    };
    checkAuth();
  }, []);

  useEffect(() => {
    const handleToggle = () => setMobileOpen(prev => !prev);
    window.addEventListener('toggle-sidebar', handleToggle);

    const handleSetCollapsed = (e: Event) => {
      const customEvent = e as CustomEvent;
      setSidebarCollapsed(!!customEvent.detail);
    };
    window.addEventListener('set-sidebar-collapsed', handleSetCollapsed);

    return () => {
      window.removeEventListener('toggle-sidebar', handleToggle);
      window.removeEventListener('set-sidebar-collapsed', handleSetCollapsed);
    };
  }, []);

  // Inactivity timeout: auto logout after 15 minutes of inactivity
  useEffect(() => {
    let timeoutId: any;
    const INACTIVITY_TIMEOUT = 15 * 60 * 1000; // 15 minutes

    const handleLogout = async () => {
      localStorage.removeItem('fam_mock_user');
      try {
        const { createClient } = await import('@/lib/supabase/client');
        const supabase = createClient();
        await supabase.auth.signOut();
      } catch (err) {
        console.error('Error signing out due to inactivity:', err);
      }
      window.location.href = '/auth/login';
    };

    const resetTimer = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(handleLogout, INACTIVITY_TIMEOUT);
    };

    const activityEvents = ['mousedown', 'keydown', 'scroll', 'mousemove', 'click', 'touchstart'];

    resetTimer();

    activityEvents.forEach((event) => {
      document.addEventListener(event, resetTimer, { passive: true });
    });

    return () => {
      clearTimeout(timeoutId);
      activityEvents.forEach((event) => {
        document.removeEventListener(event, resetTimer);
      });
    };
  }, []);

  if (!authorized) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background text-muted-foreground">
        <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin mb-4" />
        <p className="text-sm font-medium">Verificando credenciales...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen h-[100dvh] bg-background overflow-hidden relative">
      {/* Desktop Sidebar */}
      {!sidebarCollapsed && (
        <div className="hidden md:flex h-full flex-shrink-0">
          <Sidebar />
        </div>
      )}

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Sidebar Drawer */}
      <div 
        className={`fixed top-0 bottom-0 left-0 z-50 md:hidden transition-transform duration-300 ease-in-out transform ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <Sidebar onNavClick={() => setMobileOpen(false)} />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
