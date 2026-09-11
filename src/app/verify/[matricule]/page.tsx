'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import api from '@/services/api';
import VerifyPanel from '@/components/VerifyPanel';

interface CarteVerif {
  valide: boolean;
  nom?: string;
  prenom?: string;
  matricule?: string;
  classe?: string;
  statut?: string;
  etablissement?: string;
}

export default function VerifyPage() {
  const params = useParams();
  const matricule = params?.matricule as string;
  const [data, setData] = useState<CarteVerif | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!matricule) return;
    api
      .get<CarteVerif>(`/public/verify/eleve/${encodeURIComponent(matricule)}`)
      .then((res) => setData(res.data))
      .catch(() => setData({ valide: false }))
      .finally(() => setLoading(false));
  }, [matricule]);

  const isActif = (data?.statut || '') === 'ACTIF';

  return (
    <VerifyPanel
      eyebrow="Vérification de carte scolaire"
      loading={loading}
      valide={!!data?.valide}
      code={matricule}
      notFoundLabel="Aucun élève trouvé avec le matricule"
      badge={{ label: isActif ? 'CARTE VALIDE' : 'CARTE EXPIRÉE / ARCHIVÉE', ok: isActif }}
      warning={!isActif ? "Cette carte n'est plus valide. L'élève n'est plus actif dans le système." : undefined}
      rows={[
        { label: 'Nom & prénom', value: `${data?.nom?.toUpperCase() ?? ''} ${data?.prenom ?? ''}`.trim() },
        { label: 'Matricule', value: data?.matricule, mono: true },
        { label: 'Classe', value: data?.classe },
        { label: 'Établissement', value: data?.etablissement },
      ]}
    />
  );
}
