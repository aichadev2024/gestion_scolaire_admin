'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { authService } from '@/services/auth.service';

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = () => {
    authService.logout();
    router.push('/login');
  };

  const navLinks = [
    { label: '📊 Dashboard', path: '/super-admin' },
    { label: '🏛️ Établissements', path: '/super-admin/etablissements' },
    { label: '📜 Journaux d\'Audit', path: '/super-admin/journal' },
    { label: '⚙️ Configuration SaaS', path: '/super-admin/settings' },
  ];

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-secondary, #0b0f19)', color: 'var(--text-primary, #f8fafc)', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Super Admin Topbar Header */}
      <header style={{
        backgroundColor: '#0f172a',
        color: '#ffffff',
        padding: '0.85rem 2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{
            fontSize: '1.25rem',
            fontWeight: 800,
            background: 'linear-gradient(90deg, #6366f1 0%, #a855f7 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '-0.02em'
          }}>
            🎓 Netaa School — Super-Admin SaaS
          </div>
          <span style={{
            fontSize: '0.75rem',
            backgroundColor: 'rgba(99,102,241,0.2)',
            color: '#a5b4fc',
            border: '1px solid rgba(99,102,241,0.4)',
            padding: '2px 10px',
            borderRadius: '12px',
            fontWeight: 600
          }}>
            Multi-Tenant Core
          </span>
        </div>

        <nav style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          {navLinks.map(link => {
            const isActive = pathname === link.path;
            return (
              <Link
                key={link.path}
                href={link.path}
                style={{
                  color: isActive ? '#ffffff' : '#94a3b8',
                  fontWeight: isActive ? 700 : 500,
                  fontSize: '0.875rem',
                  textDecoration: 'none',
                  padding: '0.5rem 0.85rem',
                  borderRadius: '8px',
                  backgroundColor: isActive ? 'rgba(99,102,241,0.25)' : 'transparent',
                  border: isActive ? '1px solid rgba(99,102,241,0.4)' : '1px solid transparent',
                  transition: 'all 0.2s ease'
                }}
              >
                {link.label}
              </Link>
            );
          })}

          <div style={{ width: '1px', height: '24px', backgroundColor: 'rgba(255,255,255,0.15)', margin: '0 0.5rem' }} />

          <Link
            href="/dashboard"
            style={{
              color: '#cbd5e1',
              fontWeight: 500,
              fontSize: '0.8rem',
              textDecoration: 'none',
              padding: '0.4rem 0.75rem',
              borderRadius: '6px',
              backgroundColor: 'rgba(255,255,255,0.05)'
            }}
          >
            ↩ Vue École
          </Link>
          <button
            onClick={handleLogout}
            style={{
              backgroundColor: 'rgba(239,68,68,0.15)',
              color: '#fca5a5',
              border: '1px solid rgba(239,68,68,0.3)',
              padding: '6px 12px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.8rem',
              transition: 'background 0.2s'
            }}
          >
            Déconnexion 🚪
          </button>
        </nav>
      </header>

      {/* Main Content Area */}
      <main style={{ padding: '2rem 1.5rem', maxWidth: '1300px', margin: '0 auto' }}>
        {children}
      </main>
    </div>
  );
}
