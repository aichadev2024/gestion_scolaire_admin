'use client';

import React, { forwardRef, useMemo, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Eleve } from '@/types';

interface CarteProps {
  eleve: Eleve;
  etablissementNom?: string;
  etablissementLogoUrl?: string;
  etablissementTelephone?: string;
  anneeScolaire?: string;
  version?: number;
}

// CR80 standard: 85.6mm × 54mm → at 96dpi ≈ 323px × 204px
// We'll render at 2x for quality: 646px × 408px
const CARD_W = 323;
const CARD_H = 204;

// Pile de polices système : rendu identique à l'écran, à l'impression et dans
// html2canvas (aucune police web à charger → plus de texte « coupé » quand la
// police de repli, plus large, débordait des cadres à overflow:hidden).
const FONT_STACK =
  '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

// html2canvas ne respecte pas fiablement `text-overflow: ellipsis` ni
// `-webkit-line-clamp` (limitation connue : il redessine le texte lui-même
// plutôt que de s'appuyer sur le moteur de rendu du navigateur) — un nom
// d'établissement long débordait du cadre dans la carte exportée en PDF si on
// se fiait au CSS. On calcule donc nous-mêmes, mot par mot et mesuré au pixel
// près, comment répartir le nom sur au maximum `maxLignes` lignes, pour un
// rendu identique à l'écran et dans l'export.
let mesureCanvas: HTMLCanvasElement | null = null;
function tronquerTexte(texte: string, maxWidthPx: number, font: string): string {
  if (typeof document === 'undefined') return texte;
  if (!mesureCanvas) mesureCanvas = document.createElement('canvas');
  const ctx = mesureCanvas.getContext('2d');
  if (!ctx) return texte;
  ctx.font = font;
  if (ctx.measureText(texte).width <= maxWidthPx) return texte;
  let tronque = texte;
  while (tronque.length > 1 && ctx.measureText(tronque + '…').width > maxWidthPx) {
    tronque = tronque.slice(0, -1);
  }
  return tronque + '…';
}

function diviserEnLignes(texte: string, maxWidthPx: number, font: string, maxLignes: number): string[] {
  if (typeof document === 'undefined') return [texte];
  if (!mesureCanvas) mesureCanvas = document.createElement('canvas');
  const ctx = mesureCanvas.getContext('2d');
  if (!ctx) return [texte];
  ctx.font = font;

  const mots = texte.split(' ');
  const lignes: string[] = [];
  let ligne = '';
  let i = 0;
  while (i < mots.length) {
    const essai = ligne ? `${ligne} ${mots[i]}` : mots[i];
    const derniereLigne = lignes.length === maxLignes - 1;
    if (ctx.measureText(essai).width <= maxWidthPx || !ligne) {
      ligne = essai;
      i++;
    } else if (derniereLigne) {
      break; // le reste sera rattaché puis tronqué ci-dessous
    } else {
      lignes.push(ligne);
      ligne = '';
    }
  }
  lignes.push(ligne);

  const derniereIdx = lignes.length - 1;
  if (i < mots.length) {
    lignes[derniereIdx] = `${lignes[derniereIdx]} ${mots.slice(i).join(' ')}`.trim();
  }
  lignes[derniereIdx] = tronquerTexte(lignes[derniereIdx], maxWidthPx, font);
  return lignes;
}

const CarteEleveCard = forwardRef<HTMLDivElement, CarteProps>(
  ({ eleve, etablissementNom, etablissementLogoUrl, etablissementTelephone, anneeScolaire = new Date().getFullYear() + '/' + (new Date().getFullYear() + 1), version = 1 }, ref) => {
    const nom = eleve.profil?.nom?.toUpperCase() || '—';
    const prenom = eleve.profil?.prenom || '—';
    const matricule = eleve.matricule || '—';
    const classe = eleve.classeNom || 'Non affecté';
    const statut = eleve.statut || 'ACTIF';
    const photoUrl = eleve.profil?.photoUrl;
    const [photoEchec, setPhotoEchec] = useState(false);
    const [logoEchec, setLogoEchec] = useState(false);
    const ecoleNom = (eleve.etablissementNom || etablissementNom || 'ÉTABLISSEMENT SCOLAIRE').toUpperCase();
    // Le logo de l'établissement lui-même sur sa propre carte officielle — celui de
    // Netaa uniquement en repli, pour une école qui n'a pas encore importé le sien.
    const logoSrc = etablissementLogoUrl && !logoEchec ? etablissementLogoUrl : '/logo-reversed.png';
    // Largeur dispo ≈ CARD_W - paddings - logo - badge statut (worst case "INACTIF").
    const ecoleNomLignes = useMemo(
      () => diviserEnLignes(ecoleNom, 190, '800 8.5px ' + FONT_STACK, 2),
      [ecoleNom],
    );

    // Public QR verification URL
    const verifyUrl = typeof window !== 'undefined'
      ? `${window.location.origin}/verify/${matricule}`
      : `/verify/${matricule}`;

    const dateValidite = `31/08/${new Date().getFullYear() + (new Date().getMonth() >= 8 ? 1 : 0)}`;

    const labelStyle: React.CSSProperties = {
      color: 'rgba(255,255,255,0.5)',
      fontSize: '7px',
      fontWeight: 700,
      letterSpacing: '0.06em',
      width: '46px',
      flexShrink: 0,
    };
    const valueStyle: React.CSSProperties = {
      color: '#ffffff',
      fontSize: '9px',
      fontWeight: 600,
      overflowWrap: 'anywhere',
    };

    return (
      <div
        ref={ref}
        data-carte-id={matricule}
        style={{
          width: `${CARD_W}px`,
          height: `${CARD_H}px`,
          boxSizing: 'border-box',
          borderRadius: '10px',
          overflow: 'hidden',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          background: 'linear-gradient(135deg, #1B365D 0%, #0f2140 100%)',
          fontFamily: FONT_STACK,
          boxShadow: '0 8px 32px rgba(27, 54, 93, 0.4)',
          flexShrink: 0,
          WebkitPrintColorAdjust: 'exact',
          printColorAdjust: 'exact',
        }}
      >
        {/* Décor (derrière, rogné par overflow:hidden) */}
        <div style={{ position: 'absolute', top: '-24px', right: '-24px', width: '120px', height: '120px', borderRadius: '50%', background: 'rgba(46,124,184,0.10)' }} />

        {/* Bandeau haut — en flux (pas absolu) pour un rendu html2canvas fiable */}
        <div style={{ height: '5px', flexShrink: 0, background: 'linear-gradient(90deg, #2E7CB8, #5AA9DC, #2E7CB8)' }} />

        {/* En-tête : logo + établissement + statut */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 12px 8px 12px', flexShrink: 0 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={logoSrc}
            alt={ecoleNom}
            style={{ height: '34px', width: '34px', objectFit: 'contain', flexShrink: 0, borderRadius: '3px' }}
            onError={() => setLogoEchec(true)}
          />
          <div style={{ flex: 1, minWidth: 0 }} title={ecoleNom}>
            {ecoleNomLignes.map((ligne, idx) => (
              <div
                key={idx}
                style={{ color: '#5AA9DC', fontSize: '8.5px', fontWeight: 800, letterSpacing: '0.03em', lineHeight: 1.35, whiteSpace: 'nowrap' }}
              >
                {ligne}
              </div>
            ))}
            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '8.5px', fontWeight: 700, letterSpacing: '0.05em', lineHeight: 1.3, marginTop: '1px' }}>CARTE D&apos;IDENTITÉ SCOLAIRE</div>
          </div>
          <div style={{ marginLeft: 'auto', flexShrink: 0, background: statut === 'ACTIF' ? 'rgba(5,205,153,0.18)' : 'rgba(238,93,80,0.18)', border: `1px solid ${statut === 'ACTIF' ? '#05cd99' : '#ee5d50'}`, borderRadius: '4px', padding: '2px 6px', fontSize: '7px', fontWeight: 700, color: statut === 'ACTIF' ? '#05cd99' : '#ee5d50' }}>
            {statut}
          </div>
        </div>

        {/* Corps : photo | infos | QR — occupe toute la hauteur restante */}
        <div style={{ flex: 1, display: 'flex', gap: '10px', padding: '2px 12px 6px 12px', alignItems: 'center', minHeight: 0 }}>
          {/* Photo */}
          <div style={{
            width: '58px', height: '72px', borderRadius: '6px', overflow: 'hidden', flexShrink: 0,
            border: '2px solid #2E7CB8', background: '#0f2140',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {photoUrl && !photoEchec ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={photoUrl}
                alt={`${prenom} ${nom}`}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={() => setPhotoEchec(true)}
              />
            ) : (
              <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '7px' }}>Photo</span>
            )}
          </div>

          {/* Infos */}
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '3px' }}>
            <div style={{ color: 'white', fontWeight: 800, fontSize: '12px', lineHeight: 1.15, overflowWrap: 'anywhere' }}>
              {nom} <span style={{ color: '#5AA9DC', fontWeight: 600 }}>{prenom}</span>
            </div>
            <div style={{ display: 'flex', gap: '4px', alignItems: 'baseline' }}>
              <span style={labelStyle}>MATRIC.</span>
              <span style={{ ...valueStyle, fontFamily: 'monospace', letterSpacing: '0.03em' }}>{matricule}</span>
            </div>
            <div style={{ display: 'flex', gap: '4px', alignItems: 'baseline' }}>
              <span style={labelStyle}>CLASSE</span>
              <span style={valueStyle}>{classe}</span>
            </div>
            <div style={{ display: 'flex', gap: '4px', alignItems: 'baseline' }}>
              <span style={labelStyle}>VALIDE</span>
              <span style={{ ...valueStyle, fontWeight: 400, color: 'rgba(255,255,255,0.75)' }}>jusqu&apos;au {dateValidite}</span>
            </div>
          </div>

          {/* QR */}
          <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
            <div style={{ padding: '3px', background: 'white', borderRadius: '4px', lineHeight: 0 }}>
              <QRCodeSVG value={verifyUrl} size={50} level="M" bgColor="#ffffff" fgColor="#1B365D" />
            </div>
            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '6px', textAlign: 'center', maxWidth: '58px' }}>Scanner pour vérifier</span>
          </div>
        </div>

        {/* Pied : mention officielle + année, puis contact en cas de perte */}
        <div style={{ flexShrink: 0, padding: '4px 12px 5px 12px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '6.5px', letterSpacing: '0.1em', fontWeight: 600, lineHeight: 1.3 }}>
              CARTE SCOLAIRE OFFICIELLE
            </span>
            <span style={{ color: '#5AA9DC', fontSize: '7px', fontWeight: 700, lineHeight: 1.3 }}>{anneeScolaire}</span>
          </div>
          {etablissementTelephone && (
            <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: '6.5px', lineHeight: 1.4, marginTop: '2px' }}>
              En cas de perte, contacter l&apos;école : <span style={{ color: '#ffffff', fontWeight: 700 }}>{etablissementTelephone}</span>
            </div>
          )}
        </div>

        {/* Bandeau bas — en flux */}
        <div style={{ height: '3px', flexShrink: 0, background: 'linear-gradient(90deg, #2E7CB8, #5AA9DC, #2E7CB8)' }} />
        <div style={{ position: 'absolute', bottom: '9px', right: '10px', color: 'rgba(255,255,255,0.18)', fontSize: '6px' }}>v{version}</div>
      </div>
    );
  }
);

CarteEleveCard.displayName = 'CarteEleveCard';
export default CarteEleveCard;
