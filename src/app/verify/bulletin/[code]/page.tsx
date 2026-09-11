'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import api from '@/services/api';
import VerifyPanel from '@/components/VerifyPanel';

interface BulletinVerif {
  valide: boolean;
  eleveNom?: string;
  elevePrenom?: string;
  matricule?: string;
  classe?: string;
  periode?: string;
  anneeScolaire?: string;
  moyenneGenerale?: number;
  estVerrouille?: boolean;
  etablissement?: string;
}

const PERIODE_LABEL: Record<string, string> = {
  COMPOSITION_1: 'Composition n°1', COMPOSITION_2: 'Composition n°2', COMPOSITION_3: 'Composition n°3',
  COMPOSITION_4: 'Composition n°4', COMPOSITION_5: 'Composition n°5', COMPOSITION_6: 'Composition n°6',
  TRIMESTRE_1: '1er trimestre', TRIMESTRE_2: '2e trimestre', TRIMESTRE_3: '3e trimestre',
  SEMESTRE_1: '1er semestre', SEMESTRE_2: '2e semestre',
};

export default function VerifyBulletinPage() {
  const params = useParams();
  const code = params?.code as string;
  const [data, setData] = useState<BulletinVerif | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!code) return;
    api
      .get<BulletinVerif>(`/public/verify/bulletin/${encodeURIComponent(code)}`)
      .then((res) => setData(res.data))
      .catch(() => setData({ valide: false }))
      .finally(() => setLoading(false));
  }, [code]);

  return (
    <VerifyPanel
      eyebrow="Vérification de bulletin"
      loading={loading}
      valide={!!data?.valide}
      code={code}
      notFoundLabel="Aucun bulletin trouvé avec le code"
      badge={{
        label: data?.estVerrouille ? 'BULLETIN OFFICIEL VERROUILLÉ' : 'BULLETIN PROVISOIRE',
        ok: !!data?.estVerrouille,
      }}
      warning={!data?.estVerrouille ? "Ce bulletin n'a pas encore été verrouillé par l'établissement — les notes peuvent encore changer." : undefined}
      rows={[
        { label: 'Élève', value: `${data?.eleveNom?.toUpperCase() ?? ''} ${data?.elevePrenom ?? ''}`.trim() },
        { label: 'Matricule', value: data?.matricule, mono: true },
        { label: 'Classe', value: data?.classe },
        { label: 'Période', value: data?.periode ? (PERIODE_LABEL[data.periode] ?? data.periode) : undefined },
        { label: 'Année scolaire', value: data?.anneeScolaire },
        { label: 'Moyenne générale', value: data?.moyenneGenerale != null ? `${data.moyenneGenerale.toFixed(2)} / 20` : undefined, mono: true },
        { label: 'Établissement', value: data?.etablissement },
      ]}
    />
  );
}
