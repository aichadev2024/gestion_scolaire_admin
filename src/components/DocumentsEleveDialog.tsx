'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { FileText, FileImage, Trash2, Upload, ExternalLink } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { EmptyState } from '@/components/ui/empty-state';
import { documentEleveService, DocumentEleve } from '@/services/documentEleve.service';
import { Eleve } from '@/types';

const TYPE_LABEL: Record<string, string> = {
  ACTE_NAISSANCE: 'Acte de naissance',
  CERTIFICAT_MEDICAL: 'Certificat médical',
  AUTRE: 'Autre document',
};

function msg(err: unknown, fallback: string): string {
  const e = err as { response?: { data?: { message?: string } } };
  return e?.response?.data?.message || fallback;
}

function tailleLisible(octets?: number): string {
  if (!octets) return '';
  if (octets < 1024 * 1024) return `${Math.round(octets / 1024)} Ko`;
  return `${(octets / (1024 * 1024)).toFixed(1)} Mo`;
}

interface DocumentsEleveDialogProps {
  eleve: Eleve | null;
  onClose: () => void;
}

export default function DocumentsEleveDialog({ eleve, onClose }: DocumentsEleveDialogProps) {
  const [documents, setDocuments] = useState<DocumentEleve[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [type, setType] = useState('ACTE_NAISSANCE');
  const [libelle, setLibelle] = useState('');
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    if (!eleve) return;
    setLoading(true);
    documentEleveService
      .lister(eleve.id)
      .then(setDocuments)
      .catch((e) => toast.error(msg(e, 'Impossible de charger les documents.')))
      .finally(() => setLoading(false));
  }, [eleve]);

  if (!eleve) return null;

  const handleUpload = async () => {
    if (!file) {
      toast.error('Choisissez un fichier.');
      return;
    }
    if (file.size > 6 * 1024 * 1024) {
      toast.error('Fichier trop lourd (6 Mo max).');
      return;
    }
    setUploading(true);
    try {
      const doc = await documentEleveService.ajouter(eleve.id, file, type, libelle);
      setDocuments((prev) => [doc, ...prev]);
      setFile(null);
      setLibelle('');
      toast.success('Document ajouté.');
    } catch (e) {
      toast.error(msg(e, "Erreur lors de l'envoi (stockage d'images/documents indisponible ?)."));
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (doc: DocumentEleve) => {
    if (!confirm(`Supprimer « ${doc.libelle} » ?`)) return;
    try {
      await documentEleveService.supprimer(eleve.id, doc.id);
      setDocuments((prev) => prev.filter((d) => d.id !== doc.id));
      toast.success('Document supprimé.');
    } catch (e) {
      toast.error(msg(e, 'Erreur lors de la suppression.'));
    }
  };

  return (
    <Dialog open={!!eleve} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            Documents — {eleve.profil.prenom} {eleve.profil.nom}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-2">
          {loading ? (
            <div className="py-6 text-center text-sm text-muted-foreground">Chargement…</div>
          ) : documents.length === 0 ? (
            <EmptyState icon={<FileText />} title="Aucun document" description="Acte de naissance, certificat médical…" />
          ) : (
            documents.map((doc) => (
              <div key={doc.id} className="flex items-center gap-3 rounded-lg border border-border bg-secondary/40 px-3 py-2">
                {doc.contentType === 'application/pdf' ? (
                  <FileText className="size-5 shrink-0 text-primary" />
                ) : (
                  <FileImage className="size-5 shrink-0 text-primary" />
                )}
                <div className="min-w-0 flex-1">
                  <a
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 truncate text-sm font-semibold text-foreground hover:text-primary"
                  >
                    {doc.libelle} <ExternalLink className="size-3 shrink-0" />
                  </a>
                  <div className="text-xs text-muted-foreground">
                    {TYPE_LABEL[doc.type] ?? doc.type} · {tailleLisible(doc.tailleOctets)}
                    {doc.dateAjout ? ` · ${new Date(doc.dateAjout).toLocaleDateString('fr-FR')}` : ''}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="shrink-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => handleDelete(doc)}
                >
                  <Trash2 />
                </Button>
              </div>
            ))
          )}
        </div>

        <div className="mt-2 flex flex-col gap-3 border-t border-border pt-4">
          <Label>Ajouter un document</Label>
          <div className="grid grid-cols-2 gap-2">
            <Select value={type} onChange={(e) => setType(e.target.value)}>
              {Object.entries(TYPE_LABEL).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </Select>
            <Input placeholder="Libellé (optionnel)" value={libelle} onChange={(e) => setLibelle(e.target.value)} />
          </div>
          <Input
            type="file"
            accept="application/pdf,image/jpeg,image/png"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
          <p className="text-xs text-muted-foreground">PDF, JPEG ou PNG, 6 Mo max.</p>
          <Button onClick={handleUpload} loading={uploading}>
            <Upload /> Envoyer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
