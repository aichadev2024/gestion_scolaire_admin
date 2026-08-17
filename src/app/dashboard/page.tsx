'use client';

import { useEffect, useState } from 'react';
import { authService } from '@/services/auth.service';
import { eleveService } from '@/services/eleve.service';
import { enseignantService } from '@/services/enseignant.service';
import { classeService } from '@/services/classe.service';
import { useRouter } from 'next/navigation';

interface Stats {
  totalEleves: number;
  totalEnseignants: number;
  totalClasses: number;
}

export default function DashboardPage() {
  const [userName, setUserName] = useState<string>('Admin');
  const [etablissementNom, setEtablissementNom] = useState<string>('');
  const [stats, setStats] = useState<Stats>({ totalEleves: 0, totalEnseignants: 0, totalClasses: 0 });
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const user = authService.getCurrentUser();
    if (!user || !authService.isAuthenticated()) {
      router.push('/login');
      return;
    }

    if (user.role === 'SUPER_ADMIN') {
      router.push('/super-admin');
      return;
    }

    const nomComplet = [user.prenom, user.nom].filter(Boolean).join(' ');
    setUserName(nomComplet || user.username || user.email?.split('@')[0] || 'Utilisateur');
    if (user.etablissementNom) {
      setEtablissementNom(user.etablissementNom);
    }

    const fetchStats = async () => {
      try {
        const [elevesData, enseignantsData, classesData] = await Promise.all([
          eleveService.getEleves(),
          enseignantService.getEnseignants(),
          classeService.getClasses()
        ]);
        setStats({
          totalEleves: elevesData.length,
          totalEnseignants: enseignantsData.length,
          totalClasses: classesData.length
        });
      } catch (err: any) {
        console.error("Erreur de chargement des stats", err);
        if (err.response?.status === 401 || err.response?.status === 403) {
          authService.logout();
          router.push('/login');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const statCards = [
    {
      label: 'Total Élèves',
      value: stats.totalEleves,
      icon: '🎓',
      color: 'var(--primary-color)',
      bg: 'rgba(67, 24, 255, 0.1)',
      link: '/dashboard/eleves'
    },
    {
      label: 'Enseignants',
      value: stats.totalEnseignants,
      icon: '👨‍🏫',
      color: 'var(--success)',
      bg: 'rgba(5, 205, 153, 0.1)',
      link: '/dashboard/enseignants'
    },
    {
      label: 'Classes Actives',
      value: stats.totalClasses,
      icon: '🏫',
      color: '#d97706',
      bg: 'rgba(255, 206, 32, 0.1)',
      link: '/dashboard/classes'
    }
  ];

  const quickActions = [
    { label: '+ Nouvelle Inscription', path: '/dashboard/eleves', color: 'var(--primary-color)' },
    { label: '+ Ajouter une classe', path: '/dashboard/classes', color: '#d97706' },
    { label: '+ Ajouter un enseignant', path: '/dashboard/enseignants', color: 'var(--success)' },
    { label: '💰 Enregistrer un paiement', path: '/dashboard/finances', color: '#8b5cf6' }
  ];

  return (
    <div>
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
            Bonjour, {userName} 👋
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Voici un aperçu en temps réel de l'activité de votre établissement.
          </p>
        </div>
        <div style={{ padding: '0.75rem 1.25rem', background: 'linear-gradient(135deg, #1B365D, #0f2140)', borderRadius: '12px', border: '1px solid rgba(217, 119, 6, 0.4)', boxShadow: '0 4px 12px rgba(27, 54, 93, 0.2)', color: 'white', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '1.5rem' }}>🏛️</span>
          <div>
            <div style={{ fontSize: '0.65rem', color: '#D97706', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Établissement Actif</div>
            <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'white' }}>{etablissementNom || 'Établissement Scolaire'}</div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="glass-card"
            style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', cursor: 'pointer', transition: 'transform 0.2s', border: `1px solid ${card.bg}` }}
            onClick={() => router.push(card.link)}
            onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-4px)')}
            onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{card.label}</span>
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', backgroundColor: card.bg, color: card.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem' }}>
                {card.icon}
              </div>
            </div>
            <h3 style={{ fontSize: '2.5rem', fontWeight: 800, margin: 0, color: card.color }}>
              {loading ? (
                <span style={{ fontSize: '1.5rem', color: 'var(--text-secondary)' }}>...</span>
              ) : card.value}
            </h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              Cliquez pour voir la liste →
            </span>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="glass-card" style={{ marginTop: '1.5rem' }}>
        <h3 style={{ fontWeight: 600, marginBottom: '1.5rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '0.8rem' }}>
          ⚡ Actions Rapides
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          {quickActions.map(action => (
            <button
              key={action.path}
              onClick={() => router.push(action.path)}
              style={{
                padding: '1rem 1.5rem',
                background: 'none',
                border: `1px solid ${action.color}40`,
                borderRadius: '12px',
                color: action.color,
                fontWeight: 600,
                fontSize: '0.9rem',
                cursor: 'pointer',
                transition: 'all 0.2s',
                textAlign: 'left'
              }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = `${action.color}15`; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              {action.label}
            </button>
          ))}
        </div>
      </div>

      {/* Derniers élèves — section future */}
      <div className="glass-card" style={{ marginTop: '1.5rem', opacity: 0.6 }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem' }}>📋 Inscriptions récentes</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Cette section affichera les 5 derniers élèves inscrits — à venir dans une prochaine version.</p>
      </div>
    </div>
  );
}
