'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { authService } from '@/services/auth.service';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ChangePasswordModal({ isOpen, onClose }: ChangePasswordModalProps) {
  const [ancienMotDePasse, setAncien] = useState('');
  const [nouveauMotDePasse, setNouveau] = useState('');
  const [confirmMotDePasse, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const reset = () => {
    setAncien('');
    setNouveau('');
    setConfirm('');
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (nouveauMotDePasse !== confirmMotDePasse) {
      setError('Les nouveaux mots de passe ne correspondent pas.');
      return;
    }
    if (nouveauMotDePasse.length < 6) {
      setError('Le nouveau mot de passe doit contenir au moins 6 caractères.');
      return;
    }

    setLoading(true);
    try {
      const res = await authService.changePassword({ ancienMotDePasse, nouveauMotDePasse });
      toast.success(res.message || 'Mot de passe changé.');
      reset();
      onClose();
    } catch (err) {
      setError(getMessage(err, 'Erreur lors du changement de mot de passe.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          reset();
          onClose();
        }
      }}
    >
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Changer le mot de passe</DialogTitle>
          <DialogDescription>Au moins 6 caractères.</DialogDescription>
        </DialogHeader>

        {error && (
          <p className="rounded-md border border-destructive/25 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="ancien">Ancien mot de passe</Label>
            <Input id="ancien" type="password" autoComplete="current-password" value={ancienMotDePasse} onChange={(e) => setAncien(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="nouveau">Nouveau mot de passe</Label>
            <Input id="nouveau" type="password" autoComplete="new-password" value={nouveauMotDePasse} onChange={(e) => setNouveau(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirm">Confirmer le nouveau mot de passe</Label>
            <Input id="confirm" type="password" autoComplete="new-password" value={confirmMotDePasse} onChange={(e) => setConfirm(e.target.value)} required />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => { reset(); onClose(); }}>
              Annuler
            </Button>
            <Button type="submit" loading={loading}>
              Enregistrer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function getMessage(err: unknown, fallback: string): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const r = (err as { response?: { data?: { message?: string } } }).response;
    if (r?.data?.message) return r.data.message;
  }
  return fallback;
}
