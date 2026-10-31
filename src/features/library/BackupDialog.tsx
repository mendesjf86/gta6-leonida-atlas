import { useState } from 'react';
import { Download, Upload } from 'lucide-react';
import type { Backup } from '../../domain/types';
import { atlasRepository } from '../../db/repository';
import { MAX_BACKUP_BYTES, parseBackup } from '../../db/backup';
import {
  exportWorkspaceBackup,
  saveLocal,
  usePersistenceStore,
  useWorkspaceStore,
} from '../../stores/atlas';
import { Modal } from '../../app/Modal';

function count(value: number, singular: string, plural: string): string {
  return `${value.toLocaleString('pt-BR')} ${value === 1 ? singular : plural}`;
}

export default function BackupDialog({ onClose }: { onClose: () => void }) {
  const ready = usePersistenceStore((s) => s.ready);
  const workspaceId = useWorkspaceStore((s) => s.workspaceId);
  const [preview, setPreview] = useState<Backup | null>(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  async function exportData() {
    try {
      const backup = await exportWorkspaceBackup(workspaceId);
      const blob = new Blob([JSON.stringify(backup)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `leonida-atlas-backup-${new Date().toISOString().slice(0, 10)}.json`;
      anchor.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setMessage('Backup baixado. Guarde em um lugar seguro.');
    } catch {
      setError('Não foi possível ler os dados locais para exportar. Confira o armazenamento e tente de novo.');
    }
  }
  async function inspect(file: File | undefined) {
    setPreview(null);
    setError('');
    setMessage('');
    if (!file) return;
    if (file.size > MAX_BACKUP_BYTES) {
      setError('Este arquivo passa do limite de 10 MB para backups.');
      return;
    }
    try {
      setPreview(parseBackup(JSON.parse(await file.text())));
    } catch (error) {
      setError(
        error instanceof Error ? error.message : 'Arquivo de backup inválido. Nenhum dado foi alterado.',
      );
    }
  }
  async function merge() {
    if (!preview) return;
    setBusy(true);
    const ok = await saveLocal(() => atlasRepository.importBackup(preview));
    setBusy(false);
    if (ok) {
      setPreview(null);
      setMessage('Backup mesclado. Seus dados locais estão salvos.');
    } else setError('A importação falhou. Os dados existentes foram preservados. Confira o armazenamento e tente de novo.');
  }
  return (
    <Modal title="Seu backup local" onClose={onClose}>
      <p className="panel-intro">
        Exporte seus favoritos, coleções, notas, marcadores e preferências. Não precisa de conta.
      </p>
      <button className="button primary" disabled={!ready} onClick={() => void exportData()}>
        <Download size={18} />
        Exportar backup
      </button>
      <section className="detail-section">
        <label className="file-label" htmlFor="backup-file">
          <Upload size={18} />
          Importar um backup
        </label>
        <input
          id="backup-file"
          type="file"
          accept=".json,application/json"
          disabled={!ready || busy}
          onChange={(e) => void inspect(e.target.files?.[0])}
        />
        <p className="help-text">
          JSON com versão · até 10 MB. Confira o conteúdo antes de mesclar. Os itens existentes são
          mantidos, e os itens correspondentes mais novos são atualizados.
        </p>
      </section>
      {preview && (
        <section className="backup-preview" aria-label="Prévia do backup">
          <h3>Pronto para mesclar</h3>
          <p>
            {count(preview.favorites.length, 'favorito', 'favoritos')} ·{' '}
            {count(preview.collections.length, 'coleção', 'coleções')} ·{' '}
            {count(preview.notes.length, 'nota', 'notas')} ·{' '}
            {count(preview.markers.length, 'marcador', 'marcadores')}
          </p>
          <p className="help-text">
            As preferências de exibição importadas vão substituir as atuais.
          </p>
          <button className="button primary" disabled={busy} onClick={() => void merge()}>
            {busy ? 'Importando…' : 'Mesclar backup'}
          </button>
          <button className="text-button" onClick={() => setPreview(null)}>
            Cancelar importação
          </button>
        </section>
      )}
      {error && (
        <p className="inline-error" role="alert">
          {error}
        </p>
      )}
      {message && (
        <p className="success-message" role="status">
          {message}
        </p>
      )}
    </Modal>
  );
}
