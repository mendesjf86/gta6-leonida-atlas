import { useEffect, useRef, useState } from 'react';
import { Bookmark, Check, ExternalLink, MapPin, Move, Pencil, Star, X } from 'lucide-react';
import type { Place } from '../../domain/types';
import { atlasRepository, ConflictError } from '../../db/repository';
import {
  saveLocal,
  useMapStore,
  usePersistenceStore,
  useUiStore,
  useUserStore,
} from '../../stores/atlas';
import { finishNoteSave, reconcileNoteDraft, type NoteDraft } from './note-draft';
import { getResearchForPlace } from '../street-leonida/leonida-research';
import RegionalResearch from './RegionalResearch';
import { categoryName } from '../../app/Sidebar';

const coordinate = (value: number) =>
  value.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

export default function PlaceDetails({ place }: { place: Place }) {
  const favorite = useUserStore((s) => s.favorites.some((f) => f.placeId === place.id));
  const savedNote = useUserStore((s) => s.notes.find((n) => n.placeId === place.id)?.text ?? '');
  const savedRevision = useUserStore(
    (s) => s.notes.find((n) => n.placeId === place.id)?.updatedAt ?? null,
  );
  const collections = useUserStore((s) => s.collections);
  const ready = usePersistenceStore((s) => s.ready);
  const [draft, setDraft] = useState<NoteDraft>({
    text: savedNote,
    revision: savedRevision,
    dirty: false,
    conflict: false,
  });
  const [noteSaved, setNoteSaved] = useState(false);
  const saving = useRef(false);
  const [noteBusy, setNoteBusy] = useState(false);
  useEffect(() => {
    if (!saving.current)
      setDraft((current) => reconcileNoteDraft(current, savedNote, savedRevision));
  }, [savedNote, savedRevision]);
  const [copied, setCopied] = useState(false);
  const isPersonal = place.evidence === 'personal';
  const research = getResearchForPlace(place);
  async function saveNote() {
    if (saving.current || !draft.dirty || draft.conflict) return;
    saving.current = true;
    setNoteBusy(true);
    const captured = draft;
    let conflict = false;
    const ok = await saveLocal(async () => {
      try {
        await atlasRepository.saveNote(place.id, captured.text, captured.revision);
      } catch (error) {
        conflict = error instanceof ConflictError;
        throw error;
      }
    });
    saving.current = false;
    setNoteBusy(false);
    if (ok) {
      const persisted = useUserStore.getState().notes.find((n) => n.placeId === place.id);
      setDraft((current) =>
        finishNoteSave(current, captured, {
          text: persisted?.text ?? '',
          revision: persisted?.updatedAt ?? null,
        }),
      );
      setNoteSaved((persisted?.text ?? '') === (captured.text.trim() ? captured.text : ''));
    } else if (conflict) setDraft((current) => ({ ...current, conflict: true }));
  }
  async function addToCollection(id: string) {
    const collection = collections.find((c) => c.id === id);
    if (!collection) return;
    await saveLocal(() => atlasRepository.addCollectionPlace(collection.id, place.id));
  }
  async function share() {
    const url = new URL(window.location.href);
    url.search = '';
    url.hash = '';
    url.searchParams.set('place', place.id);
    try {
      await navigator.clipboard.writeText(url.href);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }
  return (
    <aside className="detail-panel" aria-label="Detalhes do local">
      <header className="panel-heading">
        <span className="eyebrow">{isPersonal ? 'LOCAL PESSOAL' : 'DETALHES DO LOCAL'}</span>
        <button
          className="icon-button"
          aria-label="Fechar detalhes do local"
          onClick={() => useMapStore.getState().select(null)}
        >
          <X size={20} />
        </button>
      </header>
      <div className="detail-scroll">
        <div className="place-title">
          <MapPin size={27} />
          <h2>{place.title}</h2>
        </div>
        <p className="evidence-label">
          {isPersonal
            ? 'Marcador pessoal · neste aparelho'
            : !place.position
              ? 'Sem posição no mapa'
              : place.evidence === 'uncertain'
                ? 'Local incerto · posição aproximada'
                : 'Posição da comunidade · aproximada'}
        </p>
        <button
          disabled={!ready}
          className={`button ${favorite ? 'selected' : ''}`}
          onClick={() => void saveLocal(() => atlasRepository.toggleFavorite(place.id))}
        >
          <Star size={18} fill={favorite ? 'currentColor' : 'none'} />
          {favorite ? 'Salvo nos favoritos' : 'Adicionar aos favoritos'}
        </button>
        {place.description && <p className="description">{place.description}</p>}
        <dl className="place-meta">
          <div>
            <dt>Categoria</dt>
            <dd>{categoryName(place.category)}</dd>
          </div>
          {place.region && (
            <div>
              <dt>Região</dt>
              <dd>{place.region}</dd>
            </div>
          )}
          {place.position && (
            <div>
              <dt>Coordenadas no jogo</dt>
              <dd>
                {coordinate(place.position.x)}; {coordinate(place.position.y)}
              </dd>
            </div>
          )}
        </dl>
        {place.tags.length > 0 && <p className="tags">{place.tags.join(' · ')}</p>}
        {place.source.url && (
          <a className="source-link" href={place.source.url} target="_blank" rel="noreferrer">
            {place.source.title}
            <ExternalLink size={13} />
          </a>
        )}
        {research && <RegionalResearch region={research.region.slug} />}
        <section className="detail-section">
          <label htmlFor="place-note">Notas</label>
          <textarea
            id="place-note"
            rows={5}
            maxLength={100000}
            value={draft.text}
            disabled={!ready}
            placeholder="Adicione notas sobre este local…"
            onChange={(e) => {
              const text = e.currentTarget.value;
              setDraft((current) => ({ ...current, text, dirty: true }));
              setNoteSaved(false);
            }}
            onBlur={() => {
              if (draft.dirty && ready) void saveNote();
            }}
          />
          <div className="row-between">
            <small>{draft.text.length.toLocaleString('pt-BR')} / 100.000</small>
            <button
              className="text-button"
              disabled={!ready || noteBusy || draft.conflict}
              onClick={() => void saveNote()}
            >
              {noteBusy ? (
                'Salvando…'
              ) : noteSaved ? (
                <>
                  <Check size={14} />
                  Salvo
                </>
              ) : (
                'Salvar nota'
              )}
            </button>
          </div>
          {draft.conflict && (
            <div className="inline-error" role="alert">
              Esta nota mudou em outro lugar ou não pôde ser salva. Seu rascunho continua aqui. Copie
              o texto antes de carregar a última nota salva.
              <button
                className="text-button"
                onClick={() => {
                  setDraft({
                    text: savedNote,
                    revision: savedRevision,
                    dirty: false,
                    conflict: false,
                  });
                  setNoteSaved(false);
                }}
              >
                Carregar nota salva
              </button>
            </div>
          )}
        </section>
        <section className="detail-section">
          <label htmlFor="place-collection">Adicionar a uma coleção</label>
          <select
            id="place-collection"
            disabled={!ready || collections.length === 0}
            value=""
            onChange={(e) => void addToCollection(e.target.value)}
          >
            <option value="">
              {collections.length ? 'Escolha uma coleção…' : 'Crie uma coleção em Salvos'}
            </option>
            {collections.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          {collections
            .filter((c) => c.placeIds.includes(place.id))
            .map((c) => (
              <div className="membership" key={c.id}>
                <Bookmark size={14} />
                {c.name}
                <button
                  className="icon-button"
                  aria-label={`Remover de ${c.name}`}
                  onClick={() =>
                    void saveLocal(() => atlasRepository.removeCollectionPlace(c.id, place.id))
                  }
                >
                  <X size={14} />
                </button>
              </div>
            ))}
        </section>
        {isPersonal ? (
          <div className="button-row">
            <button
              className="button"
              disabled={!ready}
              onClick={() => useUiStore.getState().setEditorOpen(true)}
            >
              <Pencil size={16} />
              Editar marcador
            </button>
            <button
              className="button"
              disabled={!ready}
              onClick={() => {
                useMapStore.getState().setEditor('move');
                useUiStore.getState().setSidebar(false);
              }}
            >
              <Move size={16} />
              Mover
            </button>
          </div>
        ) : (
          <button className="text-button" onClick={() => void share()}>
            {copied ? 'Link copiado' : 'Copiar link do local'}
          </button>
        )}
      </div>
    </aside>
  );
}
