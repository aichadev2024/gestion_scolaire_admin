'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AlertCircle, ArrowRight, Crown, Eye, EyeOff, Lock, PartyPopper } from 'lucide-react';
import { authService } from '@/services/auth.service';
import { AuthShell } from '@/components/ui/auth-shell';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Field } from '@/components/ui/form-field';

export default function SetupSuperAdminPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [alreadyExists, setAlreadyExists] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    authService
      .checkSuperAdminExists()
      .then((res) => {
        if (res?.exists) setAlreadyExists(true);
      })
      .catch(console.error)
      .finally(() => setChecking(false));
  }, []);

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    motDePasse: '',
    confirmMotDePasse: '',
    profil: {
      nom: '',
      prenom: '',
      telephone: '',
      adresse: 'Siège Netaa SaaS',
      genre: 'M',
      dateNaissance: '1990-01-01',
    },
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name in formData.profil) {
      setFormData((prev) => ({ ...prev, profil: { ...prev.profil, [name]: value } }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.motDePasse !== formData.confirmMotDePasse) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }
    if (formData.motDePasse.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }

    setLoading(true);
    try {
      const apiBase =
        process.env.NEXT_PUBLIC_API_URL || 'https://gestion-scolaire-backend-x0hy.onrender.com/api';
      const response = await fetch(`${apiBase}/auth/register-super-admin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          motDePasse: formData.motDePasse,
          role: 'SUPER_ADMIN',
          profil: formData.profil,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de la création du compte Super-Admin.');
      }

      setSuccess(true);
      setTimeout(() => router.push('/login'), 3500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inattendue lors de l'inscription.");
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <AuthShell>
        <p className="text-center text-sm text-muted-foreground">Vérification des autorisations…</p>
      </AuthShell>
    );
  }

  if (alreadyExists) {
    return (
      <AuthShell>
        <div className="flex flex-col items-center text-center">
          <div className="mb-3 flex size-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <Lock className="size-7" />
          </div>
          <h2 className="font-display text-xl font-extrabold text-destructive">
            Création Super-Admin verrouillée
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Un compte Super-Admin maître existe déjà sur la plateforme Netaa. Pour des raisons de
            sécurité et d&apos;exclusivité, aucun autre compte Super-Admin ne peut être créé via cette
            page.
          </p>
          <Button asChild className="mt-6">
            <Link href="/login">
              <ArrowRight className="size-4 rotate-180" /> Se connecter
            </Link>
          </Button>
        </div>
      </AuthShell>
    );
  }

  if (success) {
    return (
      <AuthShell>
        <div className="flex flex-col items-center text-center">
          <div className="mb-3 flex size-14 items-center justify-center rounded-full bg-gold/15 text-gold">
            <PartyPopper className="size-7" />
          </div>
          <h2 className="font-display text-xl font-extrabold text-primary">
            Compte Super-Admin créé
          </h2>
          <p className="mt-2 text-sm text-foreground">
            Votre espace d&apos;administration globale est configuré.
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Redirection automatique vers la page de connexion…
          </p>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell wide>
      <div className="mb-8 flex flex-col items-center text-center">
        <div className="mb-3 flex size-14 items-center justify-center rounded-2xl bg-gold/15 text-gold">
          <Crown className="size-7" />
        </div>
        <h1 className="font-display text-xl font-extrabold text-primary">
          Inscription Super-Admin SaaS
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Créez vos identifiants maître pour superviser la plateforme et les établissements abonnés.
        </p>
      </div>

      {error && (
        <Alert tone="error" className="mb-5" icon={<AlertCircle className="size-4" />}>
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <fieldset className="grid gap-4 sm:grid-cols-2">
          <legend className="mb-2 text-xs font-bold uppercase tracking-wide text-accent">
            1. Informations personnelles
          </legend>
          <Field label="Prénom *">
            <Input name="prenom" placeholder="Ex : Aïcha" value={formData.profil.prenom} onChange={handleChange} required />
          </Field>
          <Field label="Nom *">
            <Input name="nom" placeholder="Ex : Diarra" value={formData.profil.nom} onChange={handleChange} required />
          </Field>
          <Field label="Téléphone">
            <Input name="telephone" placeholder="+223 70 00 00 00" value={formData.profil.telephone} onChange={handleChange} />
          </Field>
          <Field label="Genre">
            <Select name="genre" value={formData.profil.genre} onChange={handleChange}>
              <option value="M">Masculin</option>
              <option value="F">Féminin</option>
            </Select>
          </Field>
        </fieldset>

        <fieldset className="grid gap-4 sm:grid-cols-2">
          <legend className="mb-2 text-xs font-bold uppercase tracking-wide text-accent">
            2. Identifiants maître
          </legend>
          <Field label="Nom d'utilisateur *">
            <Input name="username" placeholder="ex : super.aicha" value={formData.username} onChange={handleChange} required />
          </Field>
          <Field label="Email professionnel *">
            <Input type="email" name="email" placeholder="aicha@netaa-ecole.com" value={formData.email} onChange={handleChange} required />
          </Field>

          <Field label="Mot de passe *">
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                name="motDePasse"
                placeholder="••••••••"
                value={formData.motDePasse}
                onChange={handleChange}
                required
                minLength={6}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground"
                aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </Field>

          <Field label="Confirmer le mot de passe *">
            <div className="relative">
              <Input
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmMotDePasse"
                placeholder="••••••••"
                value={formData.confirmMotDePasse}
                onChange={handleChange}
                required
                minLength={6}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground"
                aria-label={showConfirmPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
              >
                {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </Field>
        </fieldset>

        <Button type="submit" className="w-full" loading={loading}>
          <Crown /> Créer mon compte Super-Admin
        </Button>

        <div className="text-center">
          <Link href="/login" className="text-sm text-muted-foreground underline hover:text-foreground">
            Déjà inscrit ? Se connecter →
          </Link>
        </div>
      </form>
    </AuthShell>
  );
}
