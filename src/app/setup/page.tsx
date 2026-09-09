'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, Eye, EyeOff, PartyPopper } from 'lucide-react';
import { AuthShell, AuthHeader } from '@/components/ui/auth-shell';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Field } from '@/components/ui/form-field';

export default function SetupPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    motDePasse: '',
    profil: {
      nom: '',
      prenom: '',
      telephone: '',
      adresse: '',
      genre: 'M',
      dateNaissance: '',
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
    setLoading(true);

    try {
      const apiBase =
        process.env.NEXT_PUBLIC_API_URL || 'https://gestion-scolaire-backend-x0hy.onrender.com/api';
      const response = await fetch(`${apiBase}/auth/register-first-admin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, role: 'ADMIN' }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de la création du compte');
      }

      setSuccess(true);
      setTimeout(() => router.push('/login'), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inattendue.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <AuthShell>
        <div className="flex flex-col items-center text-center">
          <div className="mb-3 flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            <PartyPopper className="size-7" />
          </div>
          <h2 className="font-display text-xl font-extrabold text-primary">Félicitations&nbsp;!</h2>
          <p className="mt-2 text-sm text-foreground">Le compte administrateur a été créé avec succès.</p>
          <p className="mt-1 text-xs text-muted-foreground">Redirection vers la page de connexion…</p>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell wide>
      <AuthHeader
        title="Configuration initiale"
        description="Bienvenue sur Netaa École ! Créez le tout premier compte administrateur de l'école."
      />

      {error && (
        <Alert tone="error" className="mb-5" icon={<AlertCircle className="size-4" />}>
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
        <Field label="Prénom">
          <Input name="prenom" value={formData.profil.prenom} onChange={handleChange} required />
        </Field>
        <Field label="Nom">
          <Input name="nom" value={formData.profil.nom} onChange={handleChange} required />
        </Field>

        <Field label="Nom d'utilisateur">
          <Input
            name="username"
            placeholder="admin123"
            value={formData.username}
            onChange={handleChange}
            required
          />
        </Field>
        <Field label="Email de connexion">
          <Input
            type="email"
            name="email"
            placeholder="admin@ecole.com"
            value={formData.email}
            onChange={handleChange}
          />
        </Field>

        <Field label="Mot de passe *" className="sm:col-span-2">
          <div className="relative">
            <Input
              type={showPassword ? 'text' : 'password'}
              name="motDePasse"
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

        <Field label="Téléphone">
          <Input name="telephone" value={formData.profil.telephone} onChange={handleChange} required />
        </Field>
        <Field label="Genre">
          <Select name="genre" value={formData.profil.genre} onChange={handleChange} required>
            <option value="M">Masculin</option>
            <option value="F">Féminin</option>
          </Select>
        </Field>

        <Field label="Date de naissance">
          <Input
            type="date"
            name="dateNaissance"
            value={formData.profil.dateNaissance}
            onChange={handleChange}
            required
          />
        </Field>
        <Field label="Adresse">
          <Input name="adresse" value={formData.profil.adresse} onChange={handleChange} required />
        </Field>

        <div className="sm:col-span-2">
          <Button type="submit" className="w-full" loading={loading}>
            Créer l&apos;administrateur
          </Button>
        </div>
      </form>
    </AuthShell>
  );
}
