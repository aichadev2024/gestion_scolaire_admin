'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { AlertCircle, ArrowLeft, Eye, EyeOff, KeyRound, Mail, ShieldCheck, BellRing, QrCode, LayoutGrid } from 'lucide-react';
import { authService, LoginCredentials } from '@/services/auth.service';
import { Logo, LogoMark } from '@/components/logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

/** Élèves et parents n'ont pas accès à l'interface web — application mobile uniquement. */
const ROLES_MOBILE_UNIQUEMENT = ['ELEVE', 'PARENT'];

/** Destination après connexion : mobile-uniquement pour élève/parent, sinon ?redirect= ou selon le rôle. */
function destinationApresLogin(role: string): string {
  if (ROLES_MOBILE_UNIQUEMENT.includes(role)) return '/mobile-uniquement';
  if (typeof window !== 'undefined') {
    const cible = new URLSearchParams(window.location.search).get('redirect');
    if (cible && cible.startsWith('/') && !cible.startsWith('//')) return cible;
  }
  return role === 'SUPER_ADMIN' ? '/super-admin' : '/dashboard';
}

/** Élève/parent : pas de session web à garder — on efface le jeton avant de rediriger vers /mobile-uniquement. */
function finaliserConnexion(role: string): string {
  const destination = destinationApresLogin(role);
  if (ROLES_MOBILE_UNIQUEMENT.includes(role)) authService.logout();
  return destination;
}

const ATOUTS = [
  { Icon: BellRing, t: 'Le parent est prévenu', d: 'à chaque note, absence ou paiement enregistré' },
  { Icon: QrCode, t: 'Documents vérifiables', d: 'bulletins, reçus et cartes à QR code' },
  { Icon: LayoutGrid, t: 'Un espace par métier', d: 'direction, secrétariat, comptabilité, enseignants' },
];

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
      router.push(finaliserConnexion(res.role));
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
      router.push(finaliserConnexion(res.role));
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
    <div className="grid min-h-screen lg:grid-cols-[7fr_5fr]">
      {/* ── Panneau de marque (desktop uniquement) ── */}
      <div className="relative hidden overflow-hidden bg-primary lg:flex lg:flex-col lg:justify-between">
        <div className="absolute inset-0">
          <Image src="/photos/cours.jpg" alt="" fill sizes="60vw" priority className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-br from-primary/95 via-primary/85 to-primary/60" />
          <div className="grain-overlay absolute inset-0" />
        </div>

        <div className="relative flex items-center gap-3 p-10">
          <span className="flex size-11 items-center justify-center rounded-xl bg-primary-foreground/95 shadow-md">
            <LogoMark className="h-8 w-8" />
          </span>
          <div className="flex flex-col leading-none">
            <span className="font-display text-lg font-extrabold text-primary-foreground">Netaa</span>
            <span className="mt-0.5 font-mono text-[0.6rem] font-medium uppercase tracking-[0.35em] text-primary-foreground/70">École</span>
          </div>
        </div>

        <div className="relative px-10">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/15 px-3.5 py-1.5 font-mono text-[0.68rem] font-medium uppercase tracking-[0.15em] text-accent-foreground/90">
            <span className="size-1.5 rounded-full bg-[hsl(var(--gold))]" /> Fait au Mali · en français
          </p>
          <h1 className="max-w-md font-display text-3xl font-extrabold leading-tight text-primary-foreground xl:text-4xl">
            Toute la vie de l&apos;établissement, au même endroit.
          </h1>
        </div>

        <div className="relative space-y-4 p-10 pt-8">
          {ATOUTS.map(({ Icon, t, d }) => (
            <div key={t} className="flex items-center gap-3.5">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary-foreground/15 text-primary-foreground">
                <Icon className="size-4" />
              </span>
              <p className="text-sm text-primary-foreground/80">
                <span className="font-semibold text-primary-foreground">{t}</span> — {d}
              </p>
            </div>
          ))}
        </div>
        <div className="mudcloth-divider relative opacity-90" />
      </div>

      {/* ── Formulaire ── */}
      <div className="hero-glow relative flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex flex-col items-center text-center lg:hidden">
            <Logo className="mb-3" markClassName="h-14 w-14" showEcole={false} />
            <p className="text-[0.7rem] font-bold uppercase tracking-[0.18em] text-accent">Gestion scolaire numérique</p>
          </div>
          <div className="mb-7 hidden lg:block">
            <h2 className="font-display text-2xl font-extrabold text-primary">Connexion</h2>
            <p className="mt-1.5 text-sm text-muted-foreground">Accédez à votre espace d&apos;administration.</p>
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
              <div className="text-center lg:text-left">
                <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary lg:mx-0">
                  <KeyRound className="size-6" />
                </div>
                <h2 className="text-lg font-semibold text-foreground">Validation première connexion</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Saisissez le code à 6 chiffres reçu par mail pour activer votre accès.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="otpCode" className="block text-center lg:text-left">Code OTP</Label>
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

              <Button
                type="submit"
                loading={loading}
                className="w-full rounded-full shadow-lg shadow-primary/25 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/30"
              >
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
