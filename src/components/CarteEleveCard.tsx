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

    return (
      <div
        ref={ref}
        data-carte-id={matricule}
        style={{
          width: `${CARD_W}px`,
          height: `${CARD_H}px`,
          borderRadius: '10px',
          overflow: 'hidden',
          position: 'relative',
          background: 'linear-gradient(135deg, #1B365D 0%, #0f2140 100%)',
          fontFamily: "'Inter', sans-serif",
          boxShadow: '0 8px 32px rgba(27, 54, 93, 0.4)',
          flexShrink: 0,
        }}
      >
        {/* Gold top stripe */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '5px', background: 'linear-gradient(90deg, #E5A93C, #f0c060, #E5A93C)' }} />

        {/* Background decoration */}
        <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '120px', height: '120px', borderRadius: '50%', background: 'rgba(229,169,60,0.07)' }} />
        <div style={{ position: 'absolute', bottom: '-30px', left: '100px', width: '150px', height: '150px', borderRadius: '50%', background: 'rgba(255,255,255,0.03)' }} />

        {/* Header row: logo + school name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 10px 0 10px' }}>
          <img src="/logo.png" alt="Netaa" style={{ height: '22px', objectFit: 'contain', filter: 'brightness(10)' }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ color: '#E5A93C', fontSize: '9px', fontWeight: 800, letterSpacing: '0.05em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {ecoleNom}
            </div>
            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '5.5px', letterSpacing: '0.05em' }}>CARTE D'IDENTITÉ SCOLAIRE</div>
          </div>
          <div style={{ marginLeft: 'auto', background: statut === 'ACTIF' ? 'rgba(5,205,153,0.2)' : 'rgba(238,93,80,0.2)', border: `1px solid ${statut === 'ACTIF' ? '#05cd99' : '#ee5d50'}`, borderRadius: '4px', padding: '2px 6px', fontSize: '7px', fontWeight: 700, color: statut === 'ACTIF' ? '#05cd99' : '#ee5d50' }}>
            {statut}
          </div>
        </div>

        {/* Title */}
        <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.5)', fontSize: '7px', letterSpacing: '0.15em', marginTop: '4px', fontWeight: 600 }}>
          CARTE SCOLAIRE — {anneeScolaire}
        </div>

        {/* Main content */}
        <div style={{ display: 'flex', gap: '10px', padding: '8px 10px', alignItems: 'flex-start' }}>
          {/* Photo */}
          <div style={{ flexShrink: 0 }}>
            <div style={{
              width: '60px', height: '70px', borderRadius: '6px', overflow: 'hidden',
              border: '2px solid #E5A93C', background: '#0f2140',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              {photoUrl ? (
                <img src={photoUrl} alt={`${prenom} ${nom}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', marginBottom: '2px' }}>👤</div>
                  <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '6px' }}>Photo</div>
                </div>
              )}
            </div>
          </div>

          {/* Info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ color: 'white', fontWeight: 800, fontSize: '13px', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {nom}
            </div>
            <div style={{ color: '#E5A93C', fontWeight: 600, fontSize: '10px', marginBottom: '6px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {prenom}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: '7px', fontWeight: 600, width: '40px', flexShrink: 0 }}>MATRIC.</span>
                <span style={{ color: 'white', fontSize: '8px', fontWeight: 700, fontFamily: 'monospace', letterSpacing: '0.05em' }}>{matricule}</span>
              </div>
              <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: '7px', fontWeight: 600, width: '40px', flexShrink: 0 }}>CLASSE</span>
                <span style={{ color: 'white', fontSize: '8px', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{classe}</span>
              </div>
              <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: '7px', fontWeight: 600, width: '40px', flexShrink: 0 }}>VALID.</span>
                <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '7px' }}>{dateValidite}</span>
              </div>
            </div>
          </div>

          {/* QR Code */}
          <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
            <div style={{ padding: '3px', background: 'white', borderRadius: '4px' }}>
              <QRCodeSVG value={verifyUrl} size={52} level="M" bgColor="#ffffff" fgColor="#1B365D" />
            </div>
            <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '5.5px', textAlign: 'center' }}>Scanner pour vérifier</span>
          </div>
        </div>

        {/* Bottom gold stripe */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '3px', background: 'linear-gradient(90deg, #E5A93C, #f0c060, #E5A93C)' }} />

        {/* Version watermark */}
        <div style={{ position: 'absolute', bottom: '6px', right: '10px', color: 'rgba(255,255,255,0.2)', fontSize: '6px' }}>
          v{version}
        </div>
      </div>
    );
  }
);

CarteEleveCard.displayName = 'CarteEleveCard';
export default CarteEleveCard;
