'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AlertCircle, ArrowLeft, Mail, Wrench } from 'lucide-react';
import { authService } from '@/services/auth.service';
import { errorMessage } from '@/lib/errors';
import { AuthShell, AuthHeader } from '@/components/ui/auth-shell';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [devToken, setDevToken] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setDevToken('');
    setLoading(true);

    try {
      const res = await authService.forgotPassword(email);
      setSuccessMsg(res.message);
      if (res.dev_token) setDevToken(res.dev_token);
    } catch (err) {
      setError(errorMessage(err, 'Erreur lors de la demande. Veuillez réessayer.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell>
      <AuthHeader
        title="Mot de passe oublié ?"
        description={
          <>
            Entrez votre adresse email pour recevoir un lien de réinitialisation.
            <br />
            <span className="text-xs italic">
              Si aucune adresse email n&apos;est associée à votre compte, contactez l&apos;administration.
            </span>
          </>
        }
      />

      {error && (
        <Alert tone="error" className="mb-5" icon={<AlertCircle className="size-4" />}>
          {error}
        </Alert>
      )}
      {successMsg && (
        <Alert tone="success" className="mb-5" icon={<Mail className="size-4" />}>
          {successMsg}
        </Alert>
      )}
      {devToken && (
        <Alert tone="warning" className="mb-5" icon={<Wrench className="size-4" />}>
          <span className="font-semibold">Mode Dev (mail non configuré)</span> — lien généré :{' '}
          <Link
            href={`/reset-password?token=${devToken}`}
            className="break-all font-medium text-primary underline"
          >
            /reset-password?token={devToken}
          </Link>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="email">Adresse email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="votre@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <Button type="submit" className="w-full" loading={loading}>
          Envoyer le lien
        </Button>
      </form>

      <div className="mt-6 text-center">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:underline"
        >
          <ArrowLeft className="size-3.5" /> Retour à la connexion
        </Link>
      </div>
    </AuthShell>
  );
}
