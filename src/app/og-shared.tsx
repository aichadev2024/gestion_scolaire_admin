import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

/** Taille standard recommandée par Facebook/WhatsApp/LinkedIn/X pour une carte de partage. */
export const ogSize = { width: 1200, height: 630 };

const INDIGO = '#22315B';
const INDIGO_DEEP = '#161F3A';
const LATERITE = '#B24A2A';
const MIL = '#5AA9DC';
const PAPER = '#FAF6EE';

/** Petite suite de pastilles espacées — écho du motif « bògòlan » utilisé comme séparateur sur le site. */
function Mudcloth() {
  const dots = Array.from({ length: 34 });
  return (
    <div style={{ display: 'flex', width: '100%', alignItems: 'center' }}>
      {dots.map((_, i) => (
        <div
          key={i}
          style={{ display: 'flex', width: 8, height: 8, borderRadius: 999, background: LATERITE, marginRight: 26, opacity: 0.85 }}
        />
      ))}
    </div>
  );
}

/**
 * Élément JSX partagé par opengraph-image.tsx et twitter-image.tsx — carte de partage affichée
 * sur WhatsApp, Facebook, LinkedIn et X quand le lien de la vitrine est envoyé.
 */
export async function buildOgElement() {
  const logoData = await readFile(join(process.cwd(), 'public/logo.png'), 'base64');
  const logoSrc = `data:image/png;base64,${logoData}`;

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        background: `linear-gradient(135deg, ${INDIGO} 0%, ${INDIGO_DEEP} 100%)`,
        padding: '64px 72px',
        fontFamily: 'sans-serif',
      }}
    >
      {/* Marque */}
      <div style={{ display: 'flex', alignItems: 'center' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logoSrc} width={72} height={72} style={{ borderRadius: 18 }} alt="" />
        <div style={{ display: 'flex', flexDirection: 'column', marginLeft: 18 }}>
          <div style={{ display: 'flex', color: PAPER, fontSize: 34, fontWeight: 800, lineHeight: 1 }}>Netaa</div>
          <div style={{ display: 'flex', color: MIL, fontSize: 16, fontWeight: 700, letterSpacing: 6, marginTop: 4 }}>ÉCOLE</div>
        </div>
      </div>

      {/* Message principal */}
      <div style={{ display: 'flex', flexDirection: 'column', maxWidth: 980 }}>
        <div
          style={{
            display: 'flex',
            alignSelf: 'flex-start',
            alignItems: 'center',
            background: 'rgba(178,74,42,0.18)',
            border: `1px solid ${LATERITE}`,
            borderRadius: 999,
            padding: '8px 20px',
            color: '#E8A487',
            fontSize: 20,
            fontWeight: 700,
            letterSpacing: 2,
            marginBottom: 28,
          }}
        >
          CONÇU AU MALI · POUR LES ÉCOLES MALIENNES
        </div>
        <div style={{ display: 'flex', color: PAPER, fontSize: 58, fontWeight: 800, lineHeight: 1.12 }}>
          Gérez tout votre établissement, d&apos;une seule application.
        </div>
        <div style={{ display: 'flex', color: '#C7CEE0', fontSize: 26, marginTop: 22, lineHeight: 1.4 }}>
          Notes, bulletins, finances et cartes scolaires — avec l&apos;application parents incluse.
        </div>
      </div>

      <Mudcloth />
    </div>
  );
}
