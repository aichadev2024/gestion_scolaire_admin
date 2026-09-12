'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Info, Save } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/ui/form-field';
import { Alert } from '@/components/ui/alert';
import { tarifService } from '@/services/tarif.service';

const PLAN_LABELS: Record<string, string> = { STARTER: 'Starter (web, personnel)', PRO: 'Pro (+ appli mobile parents)' };

type PlanForm = { prix: string; limite: string };

function TarifsAbonnementsCard() {
  const [plans, setPlans] = useState<Record<string, PlanForm>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchTarifs = () => {
    setLoading(true);
    tarifService
      .listerTous()
      .then((tarifs) => {
        const next: Record<string, PlanForm> = {};
        tarifs.forEach((t) => {
          next[t.code] = { prix: String(t.prixMensuel), limite: t.maxEnseignants != null ? String(t.maxEnseignants) : '' };
        });
        setPlans(next);
      })
      .catch(() => toast.error('Impossible de charger les tarifs.'))
      .finally(() => setLoading(false));
  };

  useEffect(fetchTarifs, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await Promise.all(
        Object.entries(plans).map(([code, { prix, limite }]) =>
          tarifService.modifierPlan(code, Number(prix), limite.trim() === '' ? null : Number(limite)),
        ),
      );
      toast.success('Tarifs des abonnements mis à jour.');
      fetchTarifs();
    } catch {
      toast.error('Erreur lors de la mise à jour des tarifs.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm uppercase tracking-wide text-primary">
          Tarifs & limites des abonnements
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSave} className="space-y-4">
          {loading ? (
            <p className="text-sm text-muted-foreground">Chargement…</p>
          ) : (
            Object.entries(plans).map(([code, { prix, limite }]) => (
              <div key={code} className="grid gap-4 rounded-lg border border-border p-4 sm:grid-cols-2">
                <Field label={`${PLAN_LABELS[code] || code} — prix (FCFA / mois)`}>
                  <Input
                    type="number"
                    min={0}
                    step={500}
                    value={prix}
                    onChange={(e) => setPlans((p) => ({ ...p, [code]: { ...p[code], prix: e.target.value } }))}
                  />
                </Field>
                <Field
                  label="Comptes enseignants max"
                  hint="Laisser vide pour illimité."
                >
                  <Input
                    type="number"
                    min={1}
                    placeholder="Illimité"
                    value={limite}
                    onChange={(e) => setPlans((p) => ({ ...p, [code]: { ...p[code], limite: e.target.value } }))}
                  />
                </Field>
              </div>
            ))
          )}
          <div className="flex justify-end">
            <Button type="submit" loading={saving} disabled={loading}>
              <Save /> Enregistrer les tarifs
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export default function SuperAdminSettingsPage() {
  const [settings, setSettings] = useState({
    nomPlateforme: 'Netaa École SaaS',
    domaineRacine: 'netaa-ecole.com',
    dureeEssaiJours: '30',
    deviseParDefaut: 'FCFA',
    emailContactSupport: 'support@netaa-ecole.com',
    smtpHost: 'smtp-relay.brevo.com',
    smtpPort: '587',
    jwtExpirationHours: '24',
    resetPasswordExpiryMinutes: '30',
  });

  const set = (key: keyof typeof settings) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setSettings((s) => ({ ...s, [key]: e.target.value }));

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Paramètres SaaS enregistrés.');
  };

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Configuration SaaS"
        description="Réglages généraux de la plateforme multi-tenant, sécurité JWT et services système."
      />

      <Alert tone="info" className="mb-6" icon={<Info className="size-4" />}>
        Les tarifs des abonnements ci-dessous sont enregistrés en base et appliqués immédiatement
        (reçus, tableau de bord). Les autres réglages restent locaux à l&apos;interface pour l&apos;instant.
      </Alert>

      <div className="mb-6">
        <TarifsAbonnementsCard />
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm uppercase tracking-wide text-primary">
              1. Identité &amp; multi-tenant
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Field label="Nom de la plateforme SaaS">
              <Input value={settings.nomPlateforme} onChange={set('nomPlateforme')} />
            </Field>
            <Field label="Domaine racine multi-tenant">
              <Input value={settings.domaineRacine} onChange={set('domaineRacine')} />
            </Field>
            <Field label="Durée d'essai par défaut (jours)">
              <Input type="number" value={settings.dureeEssaiJours} onChange={set('dureeEssaiJours')} />
            </Field>
            <Field label="Devise principale">
              <Input value={settings.deviseParDefaut} onChange={set('deviseParDefaut')} />
            </Field>
            <Field label="Email de contact support" className="sm:col-span-2">
              <Input
                type="email"
                value={settings.emailContactSupport}
                onChange={set('emailContactSupport')}
              />
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm uppercase tracking-wide text-accent">
              2. Sécurité &amp; tokens JWT
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Field label="Durée de validité du token JWT (heures)">
              <Input
                type="number"
                value={settings.jwtExpirationHours}
                onChange={set('jwtExpirationHours')}
              />
            </Field>
            <Field label="Expiration du lien de réinitialisation (minutes)">
              <Input
                type="number"
                value={settings.resetPasswordExpiryMinutes}
                onChange={set('resetPasswordExpiryMinutes')}
              />
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm uppercase tracking-wide text-success">
              3. Messagerie SMTP &amp; emails
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Field label="Serveur SMTP (host)">
              <Input value={settings.smtpHost} onChange={set('smtpHost')} />
            </Field>
            <Field label="Port SMTP">
              <Input value={settings.smtpPort} onChange={set('smtpPort')} />
            </Field>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit">
            <Save /> Enregistrer les paramètres SaaS
          </Button>
        </div>
      </form>
    </div>
  );
}
