'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import api from '@/services/api';
import VerifyPanel from '@/components/VerifyPanel';

interface EtabVerif {
  valide: boolean;
  nom?: string;
  code?: string;
  planTarifaire?: string;
  statut?: string;
  dateExpirationAbonnement?: string;
}

export default function VerifyEtablissementPage() {
  const params = useParams();
  const code = params?.code as string;
  const [data, setData] = useState<EtabVerif | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!code) return;
    api
      .get<EtabVerif>(`/public/verify/etablissement/${encodeURIComponent(code)}`)
      .then((res) => setData(res.data))
      .catch(() => setData({ valide: false }))
      .finally(() => setLoading(false));
  }, [code]);

  const actif = (data?.statut || '') === 'ACTIF';

  return (
    <VerifyPanel
      eyebrow="Vérification d'abonnement établissement"
      loading={loading}
      valide={!!data?.valide}
      code={code}
      notFoundLabel="Aucun établissement trouvé avec le code"
      badge={{ label: actif ? 'ABONNEMENT ACTIF' : 'ABONNEMENT INACTIF', ok: actif }}
      rows={[
        { label: 'Établissement', value: data?.nom },
        { label: 'Code système', value: data?.code, mono: true },
        { label: 'Plan tarifaire', value: data?.planTarifaire },
        { label: 'Statut', value: data?.statut },
        { label: "Expiration de l'abonnement", value: data?.dateExpirationAbonnement },
      ]}
    />
  );
}
