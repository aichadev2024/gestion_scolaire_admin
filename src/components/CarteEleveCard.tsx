'use client';

import React, { forwardRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Eleve } from '@/types';

interface CarteProps {
  eleve: Eleve;
  etablissementNom?: string;
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

const CarteEleveCard = forwardRef<HTMLDivElement, CarteProps>(
  ({ eleve, etablissementNom, anneeScolaire = new Date().getFullYear() + '/' + (new Date().getFullYear() + 1), version = 1 }, ref) => {
    const nom = eleve.profil?.nom?.toUpperCase() || '—';
    const prenom = eleve.profil?.prenom || '—';
    const matricule = eleve.matricule || '—';
    const classe = eleve.classeNom || 'Non affecté';
    const statut = eleve.statut || 'ACTIF';
    const photoUrl = eleve.profil?.photoUrl;
    const ecoleNom = (eleve.etablissementNom || etablissementNom || 'ÉTABLISSEMENT SCOLAIRE').toUpperCase();

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
        {/* Bandeau haut */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '5px', background: 'linear-gradient(90deg, #2E7CB8, #5AA9DC, #2E7CB8)' }} />
        {/* Décor */}
        <div style={{ position: 'absolute', top: '-24px', right: '-24px', width: '120px', height: '120px', borderRadius: '50%', background: 'rgba(46,124,184,0.10)' }} />

        {/* En-tête : logo + établissement + statut */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '11px 12px 8px 12px', flexShrink: 0 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-reversed.png" alt="Netaa" style={{ height: '22px', width: '22px', objectFit: 'contain', flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ color: '#5AA9DC', fontSize: '9px', fontWeight: 800, letterSpacing: '0.04em', lineHeight: 1.15, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {ecoleNom}
            </div>
            <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: '6.5px', letterSpacing: '0.08em' }}>CARTE D&apos;IDENTITÉ SCOLAIRE</div>
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
            {photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photoUrl} alt={`${prenom} ${nom}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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

        {/* Pied : mention officielle + année */}
        <div style={{ flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 12px 8px 12px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '6.5px', letterSpacing: '0.1em', fontWeight: 600 }}>
            CARTE SCOLAIRE OFFICIELLE
          </span>
          <span style={{ color: '#5AA9DC', fontSize: '7px', fontWeight: 700 }}>{anneeScolaire}</span>
        </div>

        {/* Bandeau bas */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '3px', background: 'linear-gradient(90deg, #2E7CB8, #5AA9DC, #2E7CB8)' }} />
        <div style={{ position: 'absolute', bottom: '10px', right: '10px', color: 'rgba(255,255,255,0.18)', fontSize: '6px' }}>v{version}</div>
      </div>
    );
  }
);

CarteEleveCard.displayName = 'CarteEleveCard';
export default CarteEleveCard;
