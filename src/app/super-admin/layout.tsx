'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Building2,
  Crown,
  KeyRound,
  LayoutDashboard,
  LogOut,
  ScrollText,
  Settings,
  Undo2,
} from 'lucide-react';
import { authService } from '@/services/auth.service';
import ChangePasswordModal from '@/components/ChangePasswordModal';
import { ThemeToggle } from '@/components/theme-toggle';
import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const NAV = [
  { label: 'Dashboard', path: '/super-admin', icon: LayoutDashboard },
  { label: 'Établissements', path: '/super-admin/etablissements', icon: Building2 },
  { label: "Journaux d'audit", path: '/super-admin/journal', icon: ScrollText },
  { label: 'Configuration SaaS', path: '/super-admin/settings', icon: Settings },
];

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isChangePwdOpen, setIsChangePwdOpen] = useState(false);

  const handleLogout = () => {
    authService.logout();
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 border-b border-border bg-card/90 backdrop-blur">
        <div className="mx-auto flex max-w-[1300px] flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2.5">
            <Logo markClassName="h-8 w-8" showEcole={false} />
            <span className="inline-flex items-center gap-1 rounded-full bg-gold/15 px-2.5 py-1 text-[0.7rem] font-bold uppercase tracking-wide text-gold-foreground">
              <Crown className="size-3.5 text-gold" /> Super-Admin SaaS
            </span>
          </div>

          <nav className="flex flex-1 flex-wrap items-center gap-1">
            {NAV.map((link) => {
              const active = pathname === link.path;
              const Icon = link.icon;
              return (
                <Link
                  key={link.path}
                  href={link.path}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                    active
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
                  )}
                >
                  <Icon className="size-4" />
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button asChild variant="outline" size="sm">
              <Link href="/dashboard">
                <Undo2 /> Vue école
              </Link>
            </Button>
            <Button variant="outline" size="sm" onClick={() => setIsChangePwdOpen(true)}>
              <KeyRound /> Mot de passe
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={handleLogout}
            >
              <LogOut /> Déconnexion
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1300px] p-4 sm:p-6">{children}</main>

      <ChangePasswordModal isOpen={isChangePwdOpen} onClose={() => setIsChangePwdOpen(false)} />
    </div>
  );
}
