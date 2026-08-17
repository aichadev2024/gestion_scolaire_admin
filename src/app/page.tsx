import Link from 'next/link';
import Head from 'next/head';

export default function Home() {
  return (
    <>
      <Head>
        <title>Accueil | Netaa — Gestion Scolaire Numérique</title>
        <meta name="description" content="Netaa - Plateforme de gestion scolaire numérique" />
      </Head>
      
      {/* Navbar */}
      <nav style={{ padding: '1.25rem 0', backgroundColor: 'var(--bg-primary)', borderBottom: '1px solid rgba(163, 174, 209, 0.2)' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <img src="/logo.png" alt="Netaa Logo" style={{ height: '45px', width: 'auto', objectFit: 'contain' }} />
            <div>
              <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--primary-color)', display: 'block', lineHeight: 1 }}>
                Netaa
              </span>
              <span style={{ fontSize: '0.6rem', fontWeight: 700, color: 'var(--secondary-color)', letterSpacing: '0.05em' }}>
                GESTION SCOLAIRE NUMÉRIQUE
              </span>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
            <Link href="#features" className="nav-link">Fonctionnalités</Link>
            <Link href="#about" className="nav-link">À Propos</Link>
            <Link href="/login" className="btn-primary" style={{ padding: '0.5rem 1rem', width: 'auto' }}>
              Espace Administration
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-gradient" style={{ padding: '6rem 0' }}>
        <div className="container" style={{ position: 'relative', zIndex: 1, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '4rem', alignItems: 'center' }}>
          
          <div style={{ textAlign: 'left' }}>
            <h1 style={{ fontSize: '3.5rem', fontWeight: 800, marginBottom: '1.5rem', lineHeight: 1.2 }}>
              La gestion de votre établissement, <br/>
              <span style={{ color: 'var(--primary-color)' }}>simplifiée.</span>
            </h1>
            <p style={{ fontSize: '1.25rem', color: 'var(--text-secondary)', marginBottom: '2.5rem' }}>
              Une plateforme complète pour gérer les inscriptions, les notes, les emplois du temps et la comptabilité de votre école en toute sérénité.
            </p>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <Link href="/login" className="btn-primary" style={{ width: 'auto', padding: '1rem 2rem', fontSize: '1.125rem' }}>
                Commencer maintenant
              </Link>
              <Link href="#features" className="btn-secondary" style={{ width: 'auto', padding: '1rem 2rem', fontSize: '1.125rem' }}>
                Fonctionnalités
              </Link>
            </div>
          </div>

          <div style={{ position: 'relative' }}>
            {/* Image Card */}
            <div className="glass-card" style={{ padding: '1rem', position: 'relative', zIndex: 2 }}>
              <img 
                src="https://images.unsplash.com/photo-1503676260728-1c00da094a0b?q=80&w=2022&auto=format&fit=crop" 
                alt="Étudiants souriants" 
                style={{ width: '100%', height: 'auto', borderRadius: 'var(--radius-sm)', objectFit: 'cover' }}
              />
            </div>
            {/* Decorative background shapes specific to the image */}
            <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '100px', height: '100px', background: 'var(--primary-color)', borderRadius: '50%', filter: 'blur(40px)', opacity: 0.5, zIndex: 1 }}></div>
            <div style={{ position: 'absolute', bottom: '-20px', left: '-20px', width: '150px', height: '150px', background: 'var(--secondary-color)', borderRadius: '50%', filter: 'blur(50px)', opacity: 0.4, zIndex: 1 }}></div>
          </div>
          
        </div>
        
        {/* Global Decorative elements */}
        <div style={{ position: 'absolute', top: '10%', left: '5%', width: '300px', height: '300px', background: 'var(--primary-color)', borderRadius: '50%', filter: 'blur(120px)', opacity: 0.1 }}></div>
      </section>

      {/* Features Section */}
      <section id="features" style={{ padding: '5rem 0', backgroundColor: 'var(--bg-primary)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <h2 style={{ fontSize: '2.25rem', fontWeight: 700, marginBottom: '1rem' }}>Une solution tout-en-un</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.125rem' }}>Découvrez les modules conçus pour faciliter votre quotidien.</p>
          </div>
          
          <div className="grid-features">
            {/* Feature 1 */}
            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              <div style={{ width: '50px', height: '50px', backgroundColor: 'rgba(67, 24, 255, 0.1)', color: 'var(--primary-color)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem', fontSize: '1.5rem' }}>
                🎓
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.75rem' }}>Gestion Scolaire</h3>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>Gérez facilement les classes, les niveaux, les inscriptions des élèves et les affectations des professeurs.</p>
            </div>
            
            {/* Feature 2 */}
            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              <div style={{ width: '50px', height: '50px', backgroundColor: 'rgba(5, 205, 153, 0.1)', color: 'var(--success)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem', fontSize: '1.5rem' }}>
                📊
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.75rem' }}>Notes et Bulletins</h3>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>Saisie rapide des notes, calcul automatique des moyennes et génération des bulletins scolaires.</p>
            </div>
            
            {/* Feature 3 */}
            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              <div style={{ width: '50px', height: '50px', backgroundColor: 'rgba(238, 93, 80, 0.1)', color: 'var(--danger)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem', fontSize: '1.5rem' }}>
                💰
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.75rem' }}>Suivi Financier</h3>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>Suivez les paiements des frais de scolarité en temps réel et relancez les retards de paiement.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ backgroundColor: 'var(--bg-secondary)', padding: '3rem 0', borderTop: '1px solid rgba(163, 174, 209, 0.2)' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '2rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <img src="/logo.png" alt="Netaa" style={{ height: '32px', width: 'auto' }} />
              <h4 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary-color)', margin: 0 }}>Netaa</h4>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Netaa - Gestion Scolaire Numérique © 2026. Tous droits réservés.</p>
          </div>
          <div style={{ display: 'flex', gap: '1.5rem' }}>
            <span className="nav-link" style={{ cursor: 'pointer' }}>Mentions légales</span>
            <span className="nav-link" style={{ cursor: 'pointer' }}>Politique de confidentialité</span>
            <span className="nav-link" style={{ cursor: 'pointer' }}>Contact</span>
          </div>
        </div>
      </footer>
    </>
  );
}
