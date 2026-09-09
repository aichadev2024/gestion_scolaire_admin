'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AlertCircle, ArrowLeft, Eye, EyeOff, KeyRound, Mail, ShieldCheck } from 'lucide-react';
import { authService, LoginCredentials } from '@/services/auth.service';
import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

/** Destination après connexion : ?redirect= (fourni par le proxy), sinon selon le rôle. */
function destinationApresLogin(role: string): string {
  if (typeof window !== 'undefined') {
    const cible = new URLSearchParams(window.location.search).get('redirect');
    if (cible && cible.startsWith('/') && !cible.startsWith('//')) return cible;
  }
  return role === 'SUPER_ADMIN' ? '/super-admin' : '/dashboard';
}

export default function LoginPage() {
  const router = useRouter();
  const [credentials, setCredentials] = useState<LoginCredentials>({ identifiant: '', motDePasse: '' });
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [setupRequired, setSetupRequired] = useState(false);
  const [superAdminExists, setSuperAdminExists] = useState(false);

  const [requiresOtp, setRequiresOtp] = useState(false);
  const [otpUserId, setOtpUserId] = useState<number | null>(null);
  const [otpCode, setOtpCode] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);

  useEffect(() => {
    authService.checkSetup().then((res) => setSetupRequired(!!res?.setupRequired)).catch(() => {});
    authService.checkSuperAdminExists().then((res) => setSuperAdminExists(!!res?.exists)).catch(() => {});
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCredentials((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfoMessage('');
    setLoading(true);
    try {
      const res = await authService.login(credentials);
      if (res.requiresOtp) {
        setRequiresOtp(true);
        setOtpUserId(res.utilisateurId);
        setInfoMessage(res.message || 'Un code de validation OTP à 6 chiffres a été envoyé par mail.');
        setLoading(false);
        return;
      }
      router.push(destinationApresLogin(res.role));
    } catch (err) {
      setError(getMessage(err, 'Erreur lors de la connexion. Vérifiez vos identifiants.'));
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfoMessage('');
    setOtpLoading(true);
    try {
      if (!otpUserId) throw new Error('Identifiant utilisateur manquant.');
      const res = await authService.verifyOtp(otpUserId, otpCode);
      router.push(destinationApresLogin(res.role));
    } catch (err) {
      setError(getMessage(err, 'Code OTP invalide ou expiré.'));
    } finally {
      setOtpLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!otpUserId) return;
    setError('');
    setInfoMessage('');
    setOtpLoading(true);
    try {
      const res = await authService.resendOtp(otpUserId);
      setInfoMessage(res.message || 'Un nouveau code OTP a été envoyé à votre adresse email.');
    } catch (err) {
      setError(getMessage(err, "Erreur lors de l'envoi du nouveau code OTP."));
    } finally {
      setOtpLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background p-4">
      {/* Décor */}
      <div className="pointer-events-none absolute -right-32 -top-32 size-96 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -left-32 size-96 rounded-full bg-accent/10 blur-3xl" />

      <div className="relative z-10 w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-xl">
        <div className="mb-8 flex flex-col items-center text-center">
          <Logo className="mb-3" markClassName="h-14 w-14" showEcole={false} />
          <p className="text-[0.7rem] font-bold uppercase tracking-[0.18em] text-accent">
            Gestion scolaire numérique
          </p>
          <p className="mt-3 text-sm text-muted-foreground">
            Connectez-vous à votre espace d&apos;administration
          </p>
        </div>

        {setupRequired && (
          <Alert tone="info" className="mb-5">
            Premier lancement détecté. Configurez le{' '}
            <Link href="/setup" className="font-semibold underline">premier Admin d&apos;école</Link> ou créez un{' '}
            <Link href="/setup-super-admin" className="font-semibold underline">Super-Admin</Link>.
          </Alert>
        )}
        {infoMessage && (
          <Alert tone="success" className="mb-5" icon={<Mail className="size-4" />}>
            {infoMessage}
          </Alert>
        )}
        {error && (
          <Alert tone="error" className="mb-5" icon={<AlertCircle className="size-4" />}>
            {error}
          </Alert>
        )}

        {requiresOtp ? (
          <form onSubmit={handleOtpSubmit} className="space-y-5">
            <div className="text-center">
              <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <KeyRound className="size-6" />
              </div>
              <h2 className="text-lg font-semibold text-foreground">Validation première connexion</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Saisissez le code à 6 chiffres reçu par mail pour activer votre accès.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="otpCode" className="block text-center">Code OTP</Label>
              <Input
                id="otpCode"
                inputMode="numeric"
                maxLength={6}
                autoComplete="one-time-code"
                placeholder="123456"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                required
                className="h-14 text-center text-2xl font-bold tracking-[0.5em] text-primary"
              />
            </div>

            <Button type="submit" className="w-full" loading={otpLoading} disabled={otpCode.length !== 6}>
              Valider le code &amp; accéder
            </Button>

            <div className="flex items-center justify-between text-sm">
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={otpLoading}
                className="inline-flex items-center gap-1.5 font-medium text-primary hover:underline disabled:opacity-50"
              >
                <Mail className="size-3.5" /> Renvoyer le code
              </button>
              <button
                type="button"
                onClick={() => { setRequiresOtp(false); setOtpCode(''); setError(''); }}
                className="inline-flex items-center gap-1.5 text-muted-foreground hover:underline"
              >
                <ArrowLeft className="size-3.5" /> Annuler
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="identifiant">Identifiant</Label>
              <Input
                id="identifiant"
                name="identifiant"
                autoComplete="username"
                placeholder="admin ou admin@ecole.com"
                value={credentials.identifiant}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="motDePasse">Mot de passe</Label>
                <Link href="/forgot-password" className="text-xs font-medium text-primary hover:underline">
                  Mot de passe oublié ?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="motDePasse"
                  name="motDePasse"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={credentials.motDePasse}
                  onChange={handleChange}
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground"
                  title={showPassword ? 'Masquer' : 'Afficher'}
                  aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full" loading={loading}>
              Se connecter
            </Button>

            {!superAdminExists && (
              <div className="border-t border-border pt-4 text-center text-xs text-muted-foreground">
                <ShieldCheck className="mr-1 inline size-3.5 align-[-2px]" />
                Éditeur / fondateur SaaS ?{' '}
                <Link href="/setup-super-admin" className="font-semibold text-primary hover:underline">
                  Créer un compte Super-Admin →
                </Link>
              </div>
            )}
          </form>
        )}
      </div>
    </div>
  );
}

function getMessage(err: unknown, fallback: string): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const resp = (err as { response?: { data?: { message?: string } } }).response;
    if (resp?.data?.message) return resp.data.message;
  }
  return fallback;
}

function Alert({
  tone,
  icon,
  className,
  children,
}: {
  tone: 'info' | 'success' | 'error';
  icon?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  const tones = {
    info: 'border-primary/25 bg-primary/8 text-primary',
    success: 'border-success/30 bg-success/10 text-success',
    error: 'border-destructive/25 bg-destructive/10 text-destructive',
  } as const;
  return (
    <div className={`flex items-start gap-2 rounded-lg border px-3 py-2.5 text-sm ${tones[tone]} ${className ?? ''}`}>
      {icon && <span className="mt-0.5 shrink-0">{icon}</span>}
      <span>{children}</span>
    </div>
  );
}
