import { useEffect, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Bookmark,
  ChevronRight,
  Compass,
  Database,
  Layers,
  MapPin,
  Search,
  Settings,
  X,
} from 'lucide-react';
import type { Category, Place } from '../domain/types';
import { useDomainStore, useMapStore, useUiStore } from '../stores/atlas';
import { SavedPlaces } from '../features/library/SavedPlaces';
import { Status } from './Status';
import { setAccountEntryTarget } from '../capabilities/extension-host';

export const CATEGORIES: { id: Category | 'all'; name: string }[] = [
  { id: 'all', name: 'Todos os locais' },
  { id: 'region', name: 'Regiões' },
  { id: 'landmark', name: 'Pontos de referência' },
  { id: 'nature', name: 'Natureza' },
  { id: 'transport', name: 'Transporte' },
  { id: 'business', name: 'Comércios' },
  { id: 'personal', name: 'Pessoais' },
];

export function categoryName(category: Category): string {
  return CATEGORIES.find((c) => c.id === category)?.name ?? category;
}

function LayerManager() {
  const layers = useMapStore((s) => s.layers);
  const ordered = [...layers].sort((a, b) => b.order - a.order);
  function move(id: string, direction: number) {
    const index = ordered.findIndex((l) => l.id === id);
    const neighbor = ordered[index + direction];
    const current = ordered[index];
    if (!neighbor || !current) return;
    useMapStore
      .getState()
      .setLayers(
        layers.map((layer) =>
          layer.id === id
            ? { ...layer, order: neighbor.order }
            : layer.id === neighbor.id
              ? { ...layer, order: current.order }
              : layer,
        ),
      );
  }
  return (
    <div className="layer-manager">
      <p className="panel-intro">
        Escolha o que aparece no mapa. As camadas do topo ficam por cima das outras.
      </p>
      {ordered.map((layer, index) => (
        <div className="layer-row" key={layer.id}>
          <label>
            <input
              type="checkbox"
              checked={layer.visible}
              onChange={(e) =>
                useMapStore
                  .getState()
                  .setLayers(
                    layers.map((l) =>
                      l.id === layer.id ? { ...l, visible: e.target.checked } : l,
                    ),
                  )
              }
            />
            <span className="layer-dot" style={{ background: layer.style.color }} />
            <span>
              {layer.name}
              <small>{layer.description}</small>
            </span>
          </label>
          <div>
            <button
              className="icon-button"
              aria-label={`Subir ${layer.name}`}
              disabled={index === 0}
              onClick={() => move(layer.id, -1)}
            >
              <ArrowUp size={15} />
            </button>
            <button
              className="icon-button"
              aria-label={`Descer ${layer.name}`}
              disabled={index === ordered.length - 1}
              onClick={() => move(layer.id, 1)}
            >
              <ArrowDown size={15} />
            </button>
          </div>
        </div>
      ))}
      <p className="empty-state">
        O mapa base é uma reconstrução da comunidade. Áreas não mapeadas continuam desconhecidas, e as
        posições são aproximadas.
      </p>
    </div>
  );
}

function Results({ places }: { places: Place[] }) {
  const filters = useUiStore((s) => s.filters);
  const selectedId = useMapStore((s) => s.selectedId);
  const status = useDomainStore((s) => s.status);
  const [limit, setLimit] = useState(50);
  useEffect(() => setLimit(50), [filters]);
  function select(place: Place) {
    useMapStore.getState().select(place);
    if (window.innerWidth < 1000) useUiStore.getState().setSidebar(false);
  }
  return (
    <>
      <div className="filter-controls">
        <label htmlFor="category">Categorias</label>
        <select
          id="category"
          value={filters.category}
          onChange={(e) =>
            useUiStore.getState().setFilters({ category: e.target.value as Category | 'all' })
          }
        >
          {CATEGORIES.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <div className="row-between">
          <label className="check-label">
            <input
              type="checkbox"
              checked={filters.favoritesOnly}
              onChange={(e) =>
                useUiStore.getState().setFilters({ favoritesOnly: e.target.checked })
              }
            />
            Favoritos
          </label>
          <select
            className="compact-select"
            aria-label="Filtro de fonte"
            value={filters.evidence}
            onChange={(e) =>
              useUiStore
                .getState()
                .setFilters({ evidence: e.target.value as 'all' | 'approximate' | 'uncertain' })
            }
          >
            <option value="all">Todas as fontes</option>
            <option value="approximate">Locais com nome</option>
            <option value="uncertain">Locais incertos</option>
          </select>
        </div>
      </div>
      <div className="results-count">
        <span>{places.length.toLocaleString('pt-BR')} resultados</span>
        <button className="text-button" onClick={() => useUiStore.getState().resetFilters()}>
          Limpar filtros
        </button>
      </div>
      {status === 'loading' ? (
        <p className="empty-state">Carregando o catálogo público…</p>
      ) : !places.length ? (
        <p className="empty-state">
          Nenhum local corresponde a esses filtros. Tente outro nome, região ou tag.
        </p>
      ) : (
        <div className="place-results" aria-label="Resultados da busca">
          {places.slice(0, limit).map((place) => (
            <button
              className={`place-result ${selectedId === place.id ? 'active' : ''}`}
              key={place.id}
              onClick={() => select(place)}
            >
              <MapPin size={19} />
              <span>
                <strong>{place.title || 'Local sem nome'}</strong>
                <small>
                  {!place.position
                    ? 'Sem posição'
                    : place.evidence === 'personal'
                      ? 'Marcador pessoal'
                      : place.category === 'region'
                        ? 'Região · aproximado'
                        : place.evidence === 'uncertain'
                          ? 'Incerto · aproximado'
                          : `${categoryName(place.category)} · aproximado`}
                </small>
              </span>
              <ChevronRight size={16} />
            </button>
          ))}
        </div>
      )}
      {places.length > limit && (
        <button className="load-more" onClick={() => setLimit((n) => n + 50)}>
          Mostrar mais {Math.min(50, places.length - limit)}{' '}
          {Math.min(50, places.length - limit) === 1 ? 'local' : 'locais'}
        </button>
      )}
    </>
  );
}

export function Sidebar({ places }: { places: Place[] }) {
  const tab = useUiStore((s) => s.tab);
  const open = useUiStore((s) => s.sidebarOpen);
  const query = useUiStore((s) => s.filters.query);
  return (
    <aside className="sidebar" data-open={open} aria-label="Painel lateral do mapa">
      <header className="brand-header">
        <div>
          <h1>Mapa de Leonida</h1>
          <p>Mundo Vice · Mapa da comunidade de GTA 6</p>
        </div>
        <button
          className="icon-button mobile-only"
          aria-label="Fechar painel lateral"
          onClick={() => useUiStore.getState().setSidebar(false)}
        >
          <X size={21} />
        </button>
      </header>
      <div className="search-field">
        <Search size={18} />
        <input
          id="atlas-search"
          type="search"
          maxLength={250}
          placeholder="Buscar locais, regiões, tags"
          aria-label="Buscar locais, regiões, tags"
          value={query}
          onChange={(e) => {
            useUiStore.getState().setFilters({ query: e.target.value });
            useUiStore.getState().setTab('explore');
          }}
        />
        <kbd>/</kbd>
      </div>
      <nav className="sidebar-tabs" aria-label="Ferramentas do mapa">
        {(
          [
            { id: 'explore', name: 'Explorar', icon: Compass },
            { id: 'layers', name: 'Camadas', icon: Layers },
            { id: 'saved', name: 'Salvos', icon: Bookmark },
          ] as const
        ).map((item) => (
          <button
            key={item.id}
            className={tab === item.id ? 'active' : ''}
            aria-current={tab === item.id ? 'page' : undefined}
            onClick={() => useUiStore.getState().setTab(item.id)}
          >
            <item.icon size={18} />
            {item.name}
          </button>
        ))}
      </nav>
      <div className="sidebar-content">
        {tab === 'explore' ? (
          <Results places={places} />
        ) : tab === 'layers' ? (
          <LayerManager />
        ) : (
          <SavedPlaces />
        )}
      </div>
      <footer className="sidebar-footer">
        <div ref={setAccountEntryTarget} data-atlas-account-slot />
        <Status />
        <div className="button-row">
          <button className="button" onClick={() => useUiStore.getState().setDialog('settings')}>
            <Settings size={17} />
            Ajustes
          </button>
          <button className="button" onClick={() => useUiStore.getState().setDialog('backup')}>
            <Database size={17} />
            Backup
          </button>
        </div>
      </footer>
    </aside>
  );
}
