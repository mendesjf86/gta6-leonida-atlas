import { useEffect, useRef, useState } from 'react';
import type { Place } from '../../domain/types';
import { getLocalStreetPlaces, getLocalStreetViewpoints } from '../street-leonida/page-data';
import {
  GTADB_LICENSE_URL,
  GTADB_PINNED_DATA_URL,
  GTADB_PREFERRED_SOURCE,
  GTADB_REVISION,
} from '../street-leonida/gtadb';
import { mountExplorer } from './mount-explorer';
import { projectPath } from './public-path';
import { resolveExplorerEntry } from './initial-entry';
import RegionalResearch from '../library/RegionalResearch';
import './explorer.css';

export interface ExplorerViewProps {
  onClose: () => void;
  initialPlace?: Place | null;
  requestedPlaceId?: string | null;
}

const regions = getLocalStreetPlaces().items;
const scenes = getLocalStreetViewpoints().items.map((viewpoint) => ({
  slug: viewpoint.slug,
  title: viewpoint.title,
  placeName: viewpoint.place.name,
  placeSlug: viewpoint.place.slug,
  description: viewpoint.visualDescription,
  image: viewpoint.media.image ?? viewpoint.media.video?.poster ?? null,
  source: viewpoint.source,
  labels: viewpoint.labels,
}));

const MOVE_DIRECTION_LABELS = {
  forward: 'para frente',
  left: 'para a esquerda',
  backward: 'para trás',
  right: 'para a direita',
} as const;

const LOOK_DIRECTION_LABELS = {
  up: 'para cima',
  left: 'para a esquerda',
  down: 'para baixo',
  right: 'para a direita',
} as const;

function Attribution() {
  return (
    <p className="explorer-attribution">
      <strong>APROXIMADO</strong> · Reconstrução da comunidade ·{' '}
      <a href={GTADB_PREFERRED_SOURCE} target="_blank" rel="noreferrer">
        GTADB / Map GTA
      </a>{' '}
      ·{' '}
      <a href={GTADB_LICENSE_URL} target="_blank" rel="noreferrer">
        CC BY 4.0
      </a>{' '}
      ·{' '}
      <a href={GTADB_PINNED_DATA_URL} target="_blank" rel="noreferrer">
        {GTADB_REVISION.slice(0, 7)}
      </a>
    </p>
  );
}

/** Maintained DOM contract for the existing imperative Three.js reconstruction. */
export default function ExplorerView({
  onClose,
  initialPlace,
  requestedPlaceId,
}: ExplorerViewProps) {
  const worldRef = useRef<HTMLElement>(null);
  const entry = resolveExplorerEntry(initialPlace);
  const [destinationsOpen, setDestinationsOpen] = useState(false);
  useEffect(() => {
    if (destinationsOpen)
      worldRef.current?.querySelector<HTMLInputElement>('[data-walk-map-search]')?.focus();
  }, [destinationsOpen]);
  useEffect(() => {
    const root = worldRef.current;
    if (!root) return;
    const previousFocus = document.activeElement;
    const dispose = mountExplorer(root);
    return () => {
      dispose();
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus();
    };
  }, []);

  return (
    <section
      className="explorer-view"
      data-street-shell=""
      data-atlas-standalone="true"
      aria-label="Explorador 3D opcional"
    >
      <section
        ref={worldRef}
        className="explorer-world"
        data-walk-world=""
        data-atlas-standalone="true"
        data-walk-active="false"
        data-walk-ready="false"
        data-initial-place={entry.regionSlug}
        data-initial-scene={Math.max(
          0,
          scenes.findIndex((scene) => scene.placeSlug === entry.regionSlug),
        )}
        data-initial-destination={entry.destination ? JSON.stringify(entry.destination) : undefined}
        data-player-position={`${entry.position.x},${entry.position.z}`}
        data-scenes={JSON.stringify(scenes)}
      >
        <canvas
          data-walk-canvas=""
          tabIndex={-1}
          aria-label="Reconstrução 3D de Leonida feita pela comunidade"
        />
        <header className="explorer-toolbar">
          <div>
            <span className="explorer-kicker">RECONSTRUÇÃO DA COMUNIDADE</span>
            <h1>Explorar Leonida</h1>
          </div>
          <nav aria-label="Ferramentas do explorador">
            <button type="button" data-start-walking="">
              Voltar a andar
            </button>
            <button type="button" data-open-walk-map="">
              Mapa de viagem <kbd>M</kbd>
            </button>
            <button type="button" data-open-walk-evidence="">
              Evidências
            </button>
            <button type="button" onClick={onClose}>
              Voltar ao mapa
            </button>
          </nav>
        </header>
        <div className="explorer-loading" data-walk-loading="" role="status">
          Construindo Leonida…
        </div>
        <div className="explorer-unavailable" data-walk-unsupported="" role="status" hidden>
          <h2>Visualização 3D indisponível</h2>
          <p>
            Não foi possível iniciar o renderizador. Seu mapa local e o que você salvou continuam
            disponíveis.
          </p>
          <button type="button" onClick={onClose}>
            Voltar ao mapa
          </button>
          <button type="button" data-open-walk-evidence="">
            Ler notas das fontes
          </button>
        </div>
        <div className="explorer-hud" data-walk-hud="">
          <strong data-walk-zone="">{entry.regionName}</strong>
          <span data-walk-zone-detail="">Reconstrução aproximada da comunidade</span>
          <small data-walk-hud-coordinates="">Coordenadas GTADB</small>
          <b data-walk-heading="">N</b>
        </div>
        <p
          className="explorer-arrival"
          data-atlas-arrival-notice=""
          role="status"
          aria-live="polite"
          hidden={(!initialPlace && !requestedPlaceId) || Boolean(entry.destination)}
        >
          {initialPlace && !entry.destination
            ? `${initialPlace.title} não tem posição no mapa. O explorador começa em Vice City.`
            : requestedPlaceId && !initialPlace
              ? 'O local selecionado não está disponível neste navegador. O explorador começa em Vice City.'
              : ''}
        </p>
        <div className="explorer-zoom" aria-label="Zoom da câmera">
          <button type="button" data-walk-zoom-in="" aria-label="Aproximar câmera">
            +
          </button>
          <output data-walk-zoom-value="">100%</output>
          <button type="button" data-walk-zoom-out="" aria-label="Afastar câmera">
            −
          </button>
        </div>
        <p className="explorer-controls-hint">
          <kbd>WASD</kbd> andar · <kbd>Shift</kbd> correr · <kbd>E</kbd> explorar
        </p>
        <p className="explorer-lock-hint" data-walk-lock-hint="" hidden>
          Clique na cena para olhar ao redor. Esc libera o cursor.
        </p>
        <button className="explorer-prompt" type="button" data-walk-prompt="" hidden>
          <kbd>E</kbd> Explorar <span data-walk-prompt-title="" />
        </button>
        <div
          className="explorer-touch"
          data-walk-mobile-controls=""
          role="group"
          aria-label="Controles de movimento por toque"
        >
          <div data-walk-joystick="" role="group" aria-label="Movimento analógico">
            <span data-walk-joystick-knob="" aria-hidden="true" />
            <small>MOVER</small>
          </div>
          <div data-walk-look-pad="" role="group" aria-label="Arraste para olhar ao redor">
            <small>ARRASTE PARA OLHAR</small>
          </div>
          <button type="button" data-walk-interact="" disabled>
            Explorar
          </button>
        </div>
        <details className="explorer-buttons" data-walk-button-controls="">
          <summary>Controles por botões</summary>
          <div role="group" aria-label="Botões de movimento">
            {(['forward', 'left', 'backward', 'right'] as const).map((direction, i) => (
              <button
                key={direction}
                type="button"
                data-walk-move-button={direction}
                aria-label={`Mover ${MOVE_DIRECTION_LABELS[direction]}`}
              >
                {['↑', '←', '↓', '→'][i]}
              </button>
            ))}
          </div>
          <div role="group" aria-label="Botões para olhar">
            {(['up', 'left', 'down', 'right'] as const).map((direction) => (
              <button
                key={direction}
                type="button"
                data-walk-look-button={direction}
                aria-label={`Olhar ${LOOK_DIRECTION_LABELS[direction]}`}
              >
                Olhar {LOOK_DIRECTION_LABELS[direction]}
              </button>
            ))}
          </div>
        </details>
        <footer className="explorer-footer">
          <Attribution />
        </footer>

        <dialog
          className="explorer-dialog explorer-map"
          data-walk-map=""
          data-destinations-open={String(destinationsOpen)}
          aria-labelledby="explorer-map-title"
        >
          <header>
            <div>
              <span className="explorer-kicker">VIAGEM 3D</span>
              <h2 id="explorer-map-title">Escolha um destino</h2>
            </div>
            <div className="explorer-map-header-actions">
              <button
                className="explorer-destinations-toggle"
                type="button"
                aria-controls="explorer-destinations"
                aria-expanded={destinationsOpen}
                onClick={() => setDestinationsOpen(!destinationsOpen)}
              >
                Destinos
              </button>
              <button type="button" data-close-walk-map="">
                Voltar ao 3D
              </button>
            </div>
          </header>
          <div className="explorer-map-body">
            <div className="explorer-map-drawing">
              <div className="explorer-map-viewport" data-walk-map-viewport="">
                <svg
                  data-walk-map-svg=""
                  role="group"
                  aria-label="Mapa interativo de evidências da comunidade"
                />
              </div>
              <div className="explorer-map-tools" aria-label="Controles do mapa de viagem">
                <button type="button" data-walk-map-zoom-in="" aria-label="Aproximar mapa">
                  +
                </button>
                <output data-walk-map-zoom-value="">100%</output>
                <button type="button" data-walk-map-zoom-out="" aria-label="Afastar mapa">
                  −
                </button>
                <button type="button" data-walk-map-zoom-reset="">
                  Ajustar
                </button>
                <button type="button" data-walk-map-center-player="">
                  Minha posição
                </button>
              </div>
              <div className="explorer-map-pose">
                <strong data-walk-map-live-region="">{entry.regionName}</strong>
                <span data-walk-map-live-heading="">N</span>
                <span data-walk-map-live-gtadb="">Coordenadas GTADB</span>
                <span data-walk-map-live-world="" />
                <small data-walk-map-live-evidence="">APROXIMADO</small>
              </div>
            </div>
            <aside
              id="explorer-destinations"
              className="explorer-destinations"
              aria-label="Destinos de viagem"
            >
              <button
                className="explorer-destinations-close"
                type="button"
                onClick={() => {
                  setDestinationsOpen(false);
                  worldRef.current
                    ?.querySelector<HTMLButtonElement>('.explorer-destinations-toggle')
                    ?.focus();
                }}
              >
                Fechar destinos
              </button>
              <p data-walk-map-fallback-note="" role="status" hidden>
                A viagem em 3D não está disponível, mas você ainda pode navegar pelas evidências.
              </p>
              <label>
                Buscar no catálogo
                <input
                  type="search"
                  data-walk-map-search=""
                  aria-label="Buscar locais do GTADB"
                  placeholder="Local, tag ou ID do marcador…"
                  autoComplete="off"
                />
              </label>
              <details open>
                <summary>Seis regiões documentadas</summary>
                <div className="explorer-regions">
                  {regions.map((region) => (
                    <button key={region.slug} type="button" data-walk-region={region.slug}>
                      {region.name}
                      <small>APROXIMADO</small>
                    </button>
                  ))}
                </div>
              </details>
              <div className="explorer-layer-toggles" aria-label="Visibilidade das evidências">
                <button type="button" data-walk-map-layer-toggle="supported" aria-pressed="true">
                  <span data-walk-map-toggle-state="">Ocultar</span> evidências nomeadas
                </button>
                <button type="button" data-walk-map-layer-toggle="uncertain" aria-pressed="false">
                  <span data-walk-map-toggle-state="">Mostrar</span> entradas incertas
                </button>
              </div>
              <output data-walk-map-search-summary="" aria-live="polite">
                Carregando catálogo local…
              </output>
              <button type="button" data-walk-map-search-clear="" hidden>
                Limpar
              </button>
              <div
                className="explorer-search-results"
                data-walk-map-search-results=""
                aria-label="Resultados da busca no GTADB"
              />
              <p data-walk-map-caveat="">
                Toque em um ponto para viajar. Arraste para mover o mapa; role ou use o gesto de pinça
                para dar zoom. Registros sem posição continuam aparecendo na busca.
              </p>
              <a href={projectPath('credits')}>Fontes e créditos</a>
            </aside>
          </div>
          <footer>
            <Attribution />
          </footer>
        </dialog>

        <dialog
          className="explorer-dialog explorer-evidence"
          data-walk-evidence-dialog=""
          aria-labelledby="explorer-evidence-title"
        >
          <header>
            <h2 id="explorer-evidence-title">O que se sabe</h2>
            <button type="button" data-close-walk-evidence="">
              Fechar
            </button>
          </header>
          <div className="explorer-dialog-copy">
            <RegionalResearch travel="explorer" />
            <p>
              As evidências visuais da Rockstar podem confirmar a identidade oficial ou a existência
              de algo. O GTADB / Map GTA fornece posicionamentos estimados pela comunidade. A
              geometria entre os pontos de evidência é uma reconstrução editorial.
            </p>
            <dl>
              <dt>CONFIRMADO</dt>
              <dd>Identidade visual oficial ou existência mostrada ou citada pela Rockstar.</dd>
              <dt>CORROBORADO</dt>
              <dd>Identificação da comunidade com contexto compatível nas fontes.</dd>
              <dt>APROXIMADO</dt>
              <dd>Posicionamento estimado pela comunidade ou geometria reconstruída.</dd>
              <dt>DESCONHECIDO</dt>
              <dd>
                Nomes ausentes, falta de cobertura e alertas das fontes continuam visíveis como
                incerteza; eles não viram geografia confirmada.
              </dd>
            </dl>
            <p>
              A geometria procedural e os estudos gerados de materiais e vegetação são recursos da
              reconstrução, não arquivos extraídos do jogo GTA VI.
            </p>
            <a
              href="https://www.rockstargames.com/VI/media/screenshots"
              target="_blank"
              rel="noreferrer"
            >
              Referências visuais da Rockstar
            </a>
            <Attribution />
            <p>
              Sem afiliação, endosso ou patrocínio da Rockstar Games ou da Take-Two Interactive.
            </p>
          </div>
        </dialog>
        <dialog
          className="explorer-dialog explorer-scene"
          data-walk-scene-dialog=""
          aria-labelledby="explorer-scene-title"
        >
          <header>
            <h2 id="explorer-scene-title" data-walk-scene-title="">
              Cena documentada
            </h2>
            <button type="button" data-close-walk-scene="">
              Fechar descoberta
            </button>
          </header>
          <div className="explorer-dialog-copy">
            <img data-walk-scene-image="" alt="" hidden />
            <span data-walk-scene-evidence-label="">EVIDÊNCIA DE FONTE DOCUMENTADA</span>
            <p>
              <span data-walk-scene-provenance="" /> · <strong data-walk-scene-place="" />
            </p>
            <p data-walk-scene-description="" />
            <p>
              A identidade e a aparência da fonte estão documentadas; o posicionamento do ponto
              próximo e a geometria interpolada continuam aproximados.
            </p>
            <a href={projectPath('documentation')}>Ler a metodologia</a>
            {' · '}
            <a
              data-walk-scene-source=""
              href="https://www.rockstargames.com/VI"
              target="_blank"
              rel="noreferrer"
            >
              Abrir fonte citada
            </a>
          </div>
        </dialog>
      </section>
    </section>
  );
}
