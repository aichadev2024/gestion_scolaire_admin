'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import api from '@/services/api';
import VerifyPanel from '@/components/VerifyPanel';

interface RecuVerif {
  valide: boolean;
  numeroRecu?: string;
  eleveNom?: string;
  elevePrenom?: string;
  matricule?: string;
  montantPaye?: number;
  datePaiement?: string;
  modePaiement?: string;
  fraisTitre?: string;
  etablissement?: string;
}

export default function VerifyRecuPage() {
  const params = useParams();
  const numero = params?.numero as string;
  const [data, setData] = useState<RecuVerif | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!numero) return;
    api
      .get<RecuVerif>(`/public/verify/recu/${encodeURIComponent(numero)}`)
      .then((res) => setData(res.data))
      .catch(() => setData({ valide: false }))
      .finally(() => setLoading(false));
  }, [numero]);

  return (
    <VerifyPanel
      eyebrow="Vérification de reçu de paiement"
      loading={loading}
      valide={!!data?.valide}
      code={numero}
      notFoundLabel="Aucun reçu trouvé avec la référence"
      badge={{ label: 'REÇU AUTHENTIQUE', ok: true }}
      rows={[
        { label: 'Élève', value: `${data?.eleveNom?.toUpperCase() ?? ''} ${data?.elevePrenom ?? ''}`.trim() },
        { label: 'Matricule', value: data?.matricule, mono: true },
        { label: 'Frais', value: data?.fraisTitre },
        { label: 'Montant payé', value: data?.montantPaye != null ? `${data.montantPaye.toLocaleString('fr-FR')} FCFA` : undefined },
        { label: 'Mode de paiement', value: data?.modePaiement },
        { label: 'Date', value: data?.datePaiement },
        { label: 'N° Reçu', value: data?.numeroRecu, mono: true },
        { label: 'Établissement', value: data?.etablissement },
      ]}
    />
  );
}
