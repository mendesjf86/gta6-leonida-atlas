import { useState } from 'react';
import { Bookmark, Check, Pencil, Plus, Star, Trash2 } from 'lucide-react';
import { atlasRepository } from '../../db/repository';
import { saveLocal, usePersistenceStore, useUiStore, useUserStore } from '../../stores/atlas';
import type { Collection } from '../../domain/types';

export function SavedPlaces() {
  const collections = useUserStore((s) => s.collections);
  const favorites = useUserStore((s) => s.favorites);
  const markers = useUserStore((s) => s.markers);
  const ready = usePersistenceStore((s) => s.ready);
  const filters = useUiStore((s) => s.filters);
  const [name, setName] = useState('');
  const [editing, setEditing] = useState<Collection | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  function show(kind: 'favorites' | 'personal' | 'all', id: string | null = null) {
    useUiStore.getState().resetFilters();
    useUiStore.getState().setFilters({
      favoritesOnly: kind === 'favorites',
      personalOnly: kind === 'personal',
      collectionId: id,
    });
    useUiStore.getState().setTab('explore');
  }
  async function save() {
    const trimmed = name.trim();
    if (!trimmed) return;
    const now = new Date().toISOString();
    const collection = editing
      ? { ...editing, name: trimmed, updatedAt: now }
      : {
          id: `collection:${crypto.randomUUID()}`,
          name: trimmed,
          placeIds: [],
          createdAt: now,
          updatedAt: now,
        };
    if (
      await saveLocal(() =>
        editing
          ? atlasRepository.renameCollection(editing.id, trimmed)
          : atlasRepository.saveCollection(collection),
      )
    ) {
      setName('');
      setEditing(null);
    }
  }
  return (
    <div className="library-view">
      <button className="library-row" onClick={() => show('favorites')}>
        <Star size={19} />
        <span>Favoritos</span>
        <span>{favorites.length}</span>
      </button>
      <button className="library-row" onClick={() => show('personal')}>
        <Bookmark size={19} />
        <span>Marcadores pessoais</span>
        <span>{markers.length}</span>
      </button>
      <div className="section-label">
        Coleções <span>{collections.length}</span>
      </div>
      <form
        className="collection-form"
        onSubmit={(e) => {
          e.preventDefault();
          void save();
        }}
      >
        <label className="sr-only" htmlFor="collection-name">
          Nome da coleção
        </label>
        <input
          id="collection-name"
          maxLength={120}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={editing ? 'Renomear coleção' : 'Nova coleção'}
          disabled={!ready}
        />
        <button
          className="icon-button"
          aria-label={editing ? 'Salvar nome da coleção' : 'Criar coleção'}
          disabled={!name.trim() || !ready}
        >
          {editing ? <Check size={18} /> : <Plus size={18} />}
        </button>
      </form>
      {editing && (
        <button
          className="text-button"
          onClick={() => {
            setEditing(null);
            setName('');
          }}
        >
          Cancelar renomeação
        </button>
      )}
      {!collections.length && (
        <p className="empty-state">
          Junte sua próxima rota, descobertas ou pontos para foto. Crie uma coleção e depois adicione
          locais pela tela de detalhes.
        </p>
      )}
      {collections.map((c) => (
        <div className="collection-row" key={c.id}>
          <button className="collection-open" onClick={() => show('all', c.id)}>
            <Bookmark size={17} />
            <span>
              {c.name}
              <small>
                {c.placeIds.length.toLocaleString('pt-BR')}{' '}
                {c.placeIds.length === 1 ? 'local' : 'locais'}
              </small>
            </span>
          </button>
          <button
            className="icon-button"
            aria-label={`Renomear ${c.name}`}
            onClick={() => {
              setEditing(c);
              setName(c.name);
            }}
          >
            <Pencil size={15} />
          </button>
          <button
            className="icon-button danger"
            aria-label={`Apagar ${c.name}`}
            onClick={() => setDeleting(c.id)}
          >
            <Trash2 size={15} />
          </button>
          {deleting === c.id && (
            <div className="delete-confirm">
              <span>Apagar esta coleção? Os locais e as notas continuam salvos.</span>
              <button
                className="text-button danger"
                onClick={async () => {
                  if (await saveLocal(() => atlasRepository.deleteCollection(c.id))) {
                    setDeleting(null);
                    if (filters.collectionId === c.id)
                      useUiStore.getState().setFilters({ collectionId: null });
                  }
                }}
              >
                Apagar coleção
              </button>
              <button className="text-button" onClick={() => setDeleting(null)}>
                Cancelar
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
