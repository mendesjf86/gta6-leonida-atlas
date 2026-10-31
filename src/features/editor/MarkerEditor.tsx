import { useState } from 'react';
import type { Category, PersonalMarker, Position } from '../../domain/types';
import { atlasRepository, ConflictError } from '../../db/repository';
import { markerToPlace } from '../../data/catalogue';
import { saveLocal, useMapStore, useUiStore, useUserStore } from '../../stores/atlas';
import { Modal } from '../../app/Modal';
import { CATEGORIES } from '../../app/Sidebar';

export default function MarkerEditor({
  position,
  onClose,
}: {
  position: Position | null;
  onClose: () => void;
}) {
  const selectedId = useMapStore((s) => s.selectedId);
  const mode = useMapStore((s) => s.editorMode);
  const existing = useUserStore((s) => s.markers.find((marker) => marker.id === selectedId));
  const [marker] = useState(mode === 'create' ? undefined : existing);
  const [title, setTitle] = useState(marker?.title ?? '');
  const [description, setDescription] = useState(marker?.description ?? '');
  const [category, setCategory] = useState<Category>(marker?.category ?? 'personal');
  const [icon, setIcon] = useState<PersonalMarker['icon']>(marker?.icon ?? 'pin');
  const [x, setX] = useState(String(position?.x ?? marker?.position.x ?? 0));
  const [y, setY] = useState(String(position?.y ?? marker?.position.y ?? 0));
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [busy, setBusy] = useState(false);
  async function save() {
    const coords = { x: Number(x), y: Number(y) };
    if (
      !title.trim() ||
      !x.trim() ||
      !y.trim() ||
      !Number.isFinite(coords.x) ||
      !Number.isFinite(coords.y) ||
      coords.x < -16000 ||
      coords.x > 4000 ||
      coords.y < -8000 ||
      coords.y > 12000
    ) {
      setError('Informe um título e coordenadas dentro do mapa: X de −16.000 a 4.000; Y de −8.000 a 12.000.');
      return;
    }
    const now = new Date().toISOString();
    const next: PersonalMarker = {
      id: marker?.id ?? `custom:${crypto.randomUUID()}`,
      title: title.trim(),
      description: description.trim(),
      category,
      icon,
      position: coords,
      createdAt: marker?.createdAt ?? now,
      updatedAt: now,
    };
    setBusy(true);
    let conflict = false;
    const ok = await saveLocal(async () => {
      try {
        await atlasRepository.saveMarker(next, marker?.updatedAt ?? null);
      } catch (error) {
        conflict = error instanceof ConflictError;
        throw error;
      }
    });
    setBusy(false);
    if (ok) {
      useMapStore.getState().select(markerToPlace(next));
      useUiStore.getState().resetFilters();
      onClose();
    } else
      setError(
        conflict
          ? 'Este marcador mudou em outro lugar. Copie seu rascunho, feche este formulário e abra o marcador atual antes de salvar de novo.'
          : 'Não foi possível salvar o marcador. Seu rascunho continua aqui; tente de novo depois de resolver o armazenamento local.',
      );
  }
  async function remove() {
    if (!marker) return;
    setBusy(true);
    const ok = await saveLocal(() => atlasRepository.deleteMarker(marker.id));
    setBusy(false);
    if (ok) {
      useMapStore.getState().select(null);
      onClose();
    }
  }
  return (
    <Modal title={marker ? 'Editar marcador pessoal' : 'Novo marcador pessoal'} onClose={onClose}>
      <form
        className="editor-form"
        onSubmit={(e) => {
          e.preventDefault();
          void save();
        }}
      >
        <p className="panel-intro">
          Este marcador é só seu. Ele fica salvo neste aparelho e não muda o mapa público.
        </p>
        <label htmlFor="marker-title">Título</label>
        <input
          id="marker-title"
          value={title}
          maxLength={200}
          required
          onChange={(e) => setTitle(e.target.value)}
          autoFocus
        />
        <label htmlFor="marker-description">Descrição</label>
        <textarea
          id="marker-description"
          value={description}
          maxLength={10000}
          rows={3}
          onChange={(e) => setDescription(e.target.value)}
        />
        <div className="form-grid">
          <div>
            <label htmlFor="marker-category">Categoria</label>
            <select
              id="marker-category"
              value={category}
              onChange={(e) => setCategory(e.target.value as Category)}
            >
              {CATEGORIES.filter((c) => c.id !== 'all').map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="marker-icon">Ícone</label>
            <select
              id="marker-icon"
              value={icon}
              onChange={(e) => setIcon(e.target.value as PersonalMarker['icon'])}
            >
              <option value="pin">Alfinete</option>
              <option value="star">Estrela</option>
              <option value="flag">Bandeira</option>
            </select>
          </div>
        </div>
        <div className="form-grid">
          <div>
            <label htmlFor="marker-x">X no jogo</label>
            <input
              id="marker-x"
              type="number"
              step="any"
              min={-16000}
              max={4000}
              value={x}
              onChange={(e) => setX(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="marker-y">Y no jogo</label>
            <input
              id="marker-y"
              type="number"
              step="any"
              min={-8000}
              max={12000}
              value={y}
              onChange={(e) => setY(e.target.value)}
              required
            />
          </div>
        </div>
        {error && (
          <p className="inline-error" role="alert">
            {error}
          </p>
        )}
        <div className="button-row">
          <button type="submit" className="button primary" disabled={busy}>
            {busy ? 'Salvando…' : 'Salvar marcador'}
          </button>
          <button type="button" className="button" onClick={onClose}>
            Cancelar
          </button>
        </div>
        {marker && !deleting && (
          <button type="button" className="text-button danger" onClick={() => setDeleting(true)}>
            Apagar marcador
          </button>
        )}
        {deleting && (
          <div className="delete-confirm">
            <p>
              Apagar este marcador e a nota dele? Ele também sai dos favoritos e das
              coleções.
            </p>
            <button
              type="button"
              className="button danger"
              disabled={busy}
              onClick={() => void remove()}
            >
              Confirmar exclusão
            </button>
          </div>
        )}
      </form>
    </Modal>
  );
}
