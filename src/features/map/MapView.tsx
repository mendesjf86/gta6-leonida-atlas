import { useEffect, useId, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import type { LayerDefinition, Place, Position, Preferences } from '../../domain/types';
import {
  BASEMAP_BOUNDS,
  INITIAL_BOUNDS,
  MAX_ZOOM,
  MIN_ZOOM,
  fromMapCoordinate,
  getFocusCenter,
  isValidPosition,
  toMapCoordinate,
  type MapBounds,
} from './coordinates';
import { buildSpatialIndex, clusterPlaces, querySpatialIndex, type PlaceCluster } from './spatial';
import { iconForPlace, placeIconStyle } from './place-icons';
import 'leaflet/dist/leaflet.css';
import './map.css';

/** Upstream project credit and the AGPL source of this modified build. */
const UPSTREAM_REPOSITORY = 'https://github.com/navanem/gta6-leonida-atlas';
const SOURCE_REPOSITORY = 'https://github.com/mendesjf86/gta6-leonida-atlas';

export interface MapViewProps {
  places: Place[];
  layers: LayerDefinition[];
  selectedId: string | null;
  focus: { position: Position; requestId: number } | null;
  editorMode: 'none' | 'create' | 'move';
  preferences: Preferences;
  onSelect: (id: string) => void;
  onPlacePosition: (position: Position) => void;
  onViewport?: (viewport: { center: Position; zoom: number }) => void;
}

function leafletBounds(bounds: MapBounds): L.LatLngBoundsExpression {
  return [
    [bounds.south, bounds.west],
    [bounds.north, bounds.east],
  ];
}

function markerIcon(
  group: PlaceCluster,
  layer: LayerDefinition | undefined,
  selected: boolean,
): L.DivIcon {
  const cluster = group.places.length > 1;
  const icon = cluster || !group.places[0] ? null : iconForPlace(group.places[0]);
  if (icon) {
    const size = 30;
    const face = document.createElement('span');
    face.className = 'atlas-pin-icon';
    face.setAttribute('aria-hidden', 'true');
    face.style.cssText = placeIconStyle(icon, size, import.meta.env?.BASE_URL ?? '/');
    return L.divIcon({
      html: face,
      className: `atlas-map-marker has-icon ${selected ? 'is-selected' : ''}`,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
    });
  }
  const content = document.createElement('span');
  content.className = cluster ? 'atlas-cluster-face' : 'atlas-pin-face';
  if (cluster) {
    // Mundo Vice: show the most common place icon of the group as a small badge.
    const tally = new Map<string, number>();
    for (const place of group.places.slice(0, 120)) {
      const found = iconForPlace(place);
      if (found) tally.set(found, (tally.get(found) ?? 0) + 1);
    }
    let best: string | null = null;
    let bestCount = 0;
    for (const [name, count] of tally) if (count > bestCount) [best, bestCount] = [name, count];
    if (best) {
      const badge = document.createElement('span');
      badge.className = 'atlas-cluster-icon';
      badge.setAttribute('aria-hidden', 'true');
      badge.style.cssText = placeIconStyle(best as Parameters<typeof placeIconStyle>[0], 20, import.meta.env?.BASE_URL ?? '/');
      content.append(badge);
    }
  }
  content.style.setProperty('--pin-color', layer?.style.color ?? '#2fe6d2');
  content.setAttribute('aria-hidden', 'true');
  const text = cluster
    ? group.places.length.toLocaleString()
    : group.places[0]?.layerId === 'personal'
      ? group.places[0].tags.includes('star')
        ? '★'
        : group.places[0].tags.includes('flag')
          ? '⚑'
          : '•'
      : group.places[0]?.layerId === 'uncertain'
        ? '?'
        : '•';
  content.prepend(document.createTextNode(text));
  const size = cluster
    ? Math.round(30 + Math.min(16, Math.log10(group.places.length) * 8))
    : group.places[0]?.layerId === 'uncertain'
      ? 22
      : Math.max(24, (layer?.style.radius ?? 6) * 2 + 10);
  return L.divIcon({
    html: content,
    className: `atlas-map-marker ${cluster ? 'is-cluster' : ''} ${selected ? 'is-selected' : ''} ${!cluster && group.places[0]?.layerId === 'regions' ? 'is-region' : ''} ${!cluster && group.places[0]?.layerId === 'uncertain' ? 'is-uncertain' : ''}`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

export default function MapView(props: MapViewProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const callbacks = useRef(props);
  const [map, setMap] = useState<L.Map | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [mapError, setMapError] = useState<string | null>(null);
  const [previewPosition, setPreviewPosition] = useState<Position | null>(null);
  const [placementMessage, setPlacementMessage] = useState('');
  const [zoom, setZoom] = useState(-5);
  const [counts, setCounts] = useState({ places: 0, groups: 0, groupedForPerformance: false });
  const descriptionId = useId();
  const index = useMemo(() => buildSpatialIndex(props.places), [props.places]);

  useEffect(() => {
    callbacks.current = props;
  });

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let instance: L.Map | undefined;
    let observer: ResizeObserver | undefined;
    let resizeFrame = 0;
    setMapError(null);
    try {
      instance = L.map(host, {
        crs: L.CRS.Simple,
        minZoom: MIN_ZOOM,
        maxZoom: MAX_ZOOM,
        zoomSnap: 0.25,
        zoomDelta: 0.5,
        zoomControl: false,
        attributionControl: false,
        keyboard: true,
        scrollWheelZoom: true,
        touchZoom: true,
        doubleClickZoom: true,
        // Camera padding allows wide screens to center the occupied source extent. Data stays within BASEMAP_BOUNDS.
        maxBounds: L.latLngBounds(leafletBounds(BASEMAP_BOUNDS) as L.LatLngBoundsLiteral).pad(0.75),
        maxBoundsViscosity: 0.8,
        zoomAnimation: !callbacks.current.preferences.reducedMotion,
        fadeAnimation: !callbacks.current.preferences.reducedMotion,
        markerZoomAnimation: !callbacks.current.preferences.reducedMotion,
      });
      const activeMap = instance;
      activeMap.fitBounds(leafletBounds(INITIAL_BOUNDS), { padding: [24, 24], animate: false });
      const base = import.meta.env.BASE_URL ?? '/';
      const overlay = L.imageOverlay(
        `${base.endsWith('/') ? base : `${base}/`}assets/mundovice/basemap-mundovice.webp`,
        leafletBounds(BASEMAP_BOUNDS),
        {
          interactive: false,
          alt: 'Reconstrução aproximada de Leonida feita pela comunidade do GTADB',
          className: 'atlas-source-basemap',
        },
      ).addTo(activeMap);
      overlay.on('error', () =>
        setMapError(
          'Não foi possível carregar o mapa base. Seus locais salvos continuam disponíveis.',
        ),
      );
      overlay.on('load', () => setMapError(null));
      const reportViewport = () => {
        setZoom(activeMap.getZoom());
        callbacks.current.onViewport?.({
          center: fromMapCoordinate(activeMap.getCenter()),
          zoom: activeMap.getZoom(),
        });
      };
      activeMap.on('moveend zoomend', reportViewport);
      activeMap.on('click', (event: L.LeafletMouseEvent) => {
        if (callbacks.current.editorMode === 'none') return;
        const position = fromMapCoordinate(event.latlng);
        if (!isValidPosition(position)) {
          setPlacementMessage('Escolha um ponto dentro da área do mapa.');
          return;
        }
        setPreviewPosition(position);
        setPlacementMessage('Posição escolhida. Preencha os detalhes do marcador para salvar.');
        callbacks.current.onPlacePosition(position);
      });
      const resize = () => {
        cancelAnimationFrame(resizeFrame);
        resizeFrame = requestAnimationFrame(() => activeMap.invalidateSize({ pan: false }));
      };
      if (typeof ResizeObserver !== 'undefined') {
        observer = new ResizeObserver(resize);
        observer.observe(host);
      }
      reportViewport();
      setMap(activeMap);
      return () => {
        observer?.disconnect();
        cancelAnimationFrame(resizeFrame);
        overlay.off();
        activeMap.off('moveend zoomend', reportViewport);
        // Leaflet 1.9's uncancellable 250ms zoom fallback can outlive remove().
        // Clear its guard before the map pane is deleted; preserve internal unload cleanup.
        (activeMap as L.Map & { _animatingZoom?: boolean })._animatingZoom = false;
        activeMap.remove();
        activeMap.off();
      };
    } catch (error) {
      observer?.disconnect();
      cancelAnimationFrame(resizeFrame);
      instance?.remove();
      setMap(null);
      setMapError(
        error instanceof Error
          ? `Mapa indisponível: ${error.message}`
          : 'Não foi possível iniciar o mapa.',
      );
    }
  }, [attempt]);

  useEffect(() => {
    if (!map) return;
    const markerGroup = L.layerGroup().addTo(map);
    const layersById = new Map(props.layers.map((layer) => [layer.id, layer]));
    let frame = 0;
    const renderMarkers = () => {
      markerGroup.clearLayers();
      const bounds = map.getBounds();
      const currentZoom = map.getZoom();
      const visible = querySpatialIndex(index, {
        west: bounds.getWest(),
        east: bounds.getEast(),
        south: bounds.getSouth(),
        north: bounds.getNorth(),
      }).filter((place) => {
        const layer = layersById.get(place.layerId);
        return (
          layer?.visible &&
          (layer.minZoom === undefined || currentZoom >= layer.minZoom) &&
          (layer.maxZoom === undefined || currentZoom <= layer.maxZoom)
        );
      });
      const groups = clusterPlaces(visible, {
        zoom: currentZoom,
        enabled: props.preferences.clusterMarkers,
        selectedId: props.selectedId,
      });
      setCounts((previous) => {
        const next = {
          places: visible.length,
          groups: groups.length,
          groupedForPerformance:
            !props.preferences.clusterMarkers && groups.length < visible.length,
        };
        return previous.places === next.places &&
          previous.groups === next.groups &&
          previous.groupedForPerformance === next.groupedForPerformance
          ? previous
          : next;
      });
      let labelCount = 0;
      for (const group of groups) {
        const place = group.places[0]!;
        const layer = layersById.get(place.layerId);
        const isCluster = group.places.length > 1;
        const selected = !isCluster && place.id === props.selectedId;
        const interactive = group.places.some(
          (member) => layersById.get(member.layerId)?.interactive,
        );
        const draggable = selected && place.evidence === 'personal' && props.editorMode === 'move';
        const title = isCluster
          ? `Explorar ${group.places.length.toLocaleString('pt-BR')} locais`
          : `${place.title}${selected ? ', selecionado' : ''}`;
        const marker = L.marker(toMapCoordinate(group.position), {
          icon: markerIcon(group, layer, selected),
          title,
          alt: title,
          keyboard: interactive,
          interactive,
          draggable,
          autoPan: draggable,
          bubblingMouseEvents: false,
          riseOnHover: true,
          zIndexOffset: selected ? 1500 : (layer?.order ?? 0) * 5,
        }).addTo(markerGroup);
        const markerElement = marker.getElement();
        markerElement?.setAttribute('aria-label', title);
        if (interactive)
          markerElement?.addEventListener('keydown', (event) => {
            if (event.key === ' ') {
              event.preventDefault();
              event.stopPropagation();
              marker.fire('click');
            }
          });
        if (interactive) {
          marker.on('click', () => {
            if (callbacks.current.editorMode !== 'none') {
              setPreviewPosition(group.position);
              setPlacementMessage('Posição escolhida. Preencha os detalhes do marcador para salvar.');
              callbacks.current.onPlacePosition(group.position);
              return;
            }
            if (!isCluster) {
              callbacks.current.onSelect(place.id);
              return;
            }
            if (map.getZoom() < MAX_ZOOM) {
              map.setView(
                toMapCoordinate(group.position),
                Math.min(MAX_ZOOM, map.getZoom() + 1.5),
                { animate: !callbacks.current.preferences.reducedMotion },
              );
              return;
            }
            // Coincident source positions cannot separate through zoom; offer their records directly.
            const content = document.createElement('div');
            content.className = 'atlas-cluster-list';
            const heading = document.createElement('strong');
            heading.textContent = `${group.places.length.toLocaleString('pt-BR')} locais nesta posição`;
            content.append(heading);
            for (const member of group.places.slice(0, 30)) {
              if (!layersById.get(member.layerId)?.interactive) continue;
              const button = document.createElement('button');
              button.type = 'button';
              button.textContent = `${member.title} · ${member.id}`;
              button.addEventListener('click', () => {
                callbacks.current.onSelect(member.id);
                map.closePopup();
              });
              content.append(button);
            }
            if (group.places.length > 30) {
              const note = document.createElement('p');
              note.textContent =
                'Mostrando os 30 primeiros. Use a busca para encontrar outros locais.';
              content.append(note);
            }
            L.popup({ maxWidth: 310, maxHeight: 280 })
              .setLatLng(toMapCoordinate(group.position))
              .setContent(content)
              .openOn(map);
          });
        }
        if (draggable) {
          marker.on('dragend', () => {
            const position = fromMapCoordinate(marker.getLatLng());
            if (!isValidPosition(position)) {
              marker.setLatLng(toMapCoordinate(place.position!));
              setPlacementMessage('Escolha um ponto dentro da área do mapa.');
              return;
            }
            setPreviewPosition(position);
            setPlacementMessage('Marcador movido na prévia. Salve os detalhes para manter esta posição.');
            callbacks.current.onPlacePosition(position);
          });
        }
        if (
          !isCluster &&
          props.preferences.showLabels &&
          labelCount < 65 &&
          (selected || place.layerId === 'regions' || currentZoom >= -1)
        ) {
          const label = document.createElement('span');
          label.textContent = place.title;
          marker.bindTooltip(label, {
            permanent: true,
            direction: place.layerId === 'regions' ? 'center' : 'right',
            offset: place.layerId === 'regions' ? [0, 0] : [10, 0],
            className: `atlas-place-label ${selected ? 'is-selected' : ''} ${place.layerId === 'regions' ? 'is-region' : ''}`,
          });
          labelCount++;
        }
      }
    };
    const scheduleRender = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(renderMarkers);
    };
    renderMarkers();
    map.on('moveend zoomend resize', scheduleRender);
    return () => {
      cancelAnimationFrame(frame);
      map.off('moveend zoomend resize', scheduleRender);
      markerGroup.clearLayers();
      markerGroup.remove();
    };
  }, [
    map,
    index,
    props.layers,
    props.selectedId,
    props.editorMode,
    props.preferences.clusterMarkers,
    props.preferences.showLabels,
  ]);

  useEffect(() => {
    if (!map || !props.focus || !isValidPosition(props.focus.position)) return;
    const position = props.focus.position;
    const applyFocus = () => {
      const targetZoom = Math.max(map.getZoom(), -1.5);
      const center = getFocusCenter(
        position,
        targetZoom,
        map.getSize().y,
        window.innerWidth <= 599 && callbacks.current.selectedId !== null,
      );
      map.setView(toMapCoordinate(center), targetZoom, {
        animate: !callbacks.current.preferences.reducedMotion,
      });
    };
    const followResize = () => {
      if (callbacks.current.selectedId) applyFocus();
    };
    applyFocus();
    map.on('resize', followResize);
    return () => {
      map.off('resize', followResize);
    };
  }, [map, props.focus, props.preferences.reducedMotion]);

  useEffect(() => {
    if (props.editorMode === 'none') {
      setPreviewPosition(null);
      setPlacementMessage('');
    }
    if (!map) return;
    if (props.editorMode === 'none') map.doubleClickZoom.enable();
    else map.doubleClickZoom.disable();
  }, [map, props.editorMode]);

  useEffect(() => {
    if (!map || !previewPosition || props.editorMode === 'none') return;
    const content = document.createElement('span');
    content.textContent = '+';
    content.setAttribute('aria-hidden', 'true');
    const preview = L.marker(toMapCoordinate(previewPosition), {
      icon: L.divIcon({
        className: 'atlas-position-preview',
        html: content,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      }),
      interactive: false,
      keyboard: false,
      zIndexOffset: 2000,
    }).addTo(map);
    return () => {
      preview.remove();
    };
  }, [map, previewPosition, props.editorMode]);

  const useMapCenter = () => {
    if (!map) return;
    const size = map.getSize();
    const center =
      window.innerWidth <= 599 && props.selectedId !== null
        ? map.containerPointToLatLng([size.x / 2, size.y * 0.28])
        : map.getCenter();
    const position = fromMapCoordinate(center);
    if (!isValidPosition(position)) {
      setPlacementMessage('Arraste o mapa até um ponto dentro da área do mapa.');
      return;
    }
    setPreviewPosition(position);
    setPlacementMessage('Centro do mapa escolhido. Preencha os detalhes do marcador para salvar.');
    props.onPlacePosition(position);
  };

  return (
    <div className={`atlas-map-view ${props.editorMode !== 'none' ? 'is-editing' : ''}`}>
      <p id={descriptionId} className="map-sr-only">
        Mapa interativo com coordenadas aproximadas do jogo. Use as setas para mover e mais ou menos
        para dar zoom. Selecione um marcador no mapa ou use a lista de locais com busca.
      </p>
      <div
        ref={hostRef}
        className="atlas-map-canvas"
        role="region"
        aria-label="Mapa interativo de Leonida"
        aria-describedby={descriptionId}
        tabIndex={0}
      />
      {props.editorMode !== 'none' ? (
        <div className="atlas-map-editor-hint">
          <button type="button" onClick={useMapCenter}>
            Usar centro do mapa
          </button>
          <span className="map-sr-only" role="status">
            {placementMessage ||
              (props.editorMode === 'move'
                ? 'Escolha a nova posição do marcador'
                : 'Escolha uma posição para seu marcador')}
          </span>
        </div>
      ) : null}
      {props.editorMode !== 'none' ? (
        <div className="atlas-center-crosshair" aria-hidden="true">
          +
        </div>
      ) : null}
      <div className="atlas-map-navigation" aria-label="Navegação do mapa">
        <button
          type="button"
          aria-label="Aproximar"
          title="Aproximar"
          disabled={!map || zoom >= MAX_ZOOM}
          onClick={() => map?.zoomIn(0.5, { animate: !props.preferences.reducedMotion })}
        >
          +
        </button>
        <button
          type="button"
          aria-label="Afastar"
          title="Afastar"
          disabled={!map || zoom <= MIN_ZOOM}
          onClick={() => map?.zoomOut(0.5, { animate: !props.preferences.reducedMotion })}
        >
          −
        </button>
        <button
          type="button"
          aria-label="Mostrar o mapa inteiro"
          title="Mostrar o mapa inteiro"
          disabled={!map}
          onClick={() =>
            map?.fitBounds(leafletBounds(INITIAL_BOUNDS), {
              padding: [24, 24],
              animate: !props.preferences.reducedMotion,
            })
          }
        >
          ⌖
        </button>
      </div>
      <div className="atlas-map-caption">
        <span>
          {counts.places.toLocaleString('pt-BR')} {counts.places === 1 ? 'local' : 'locais'} na tela
        </span>
        {counts.groupedForPerformance ? <span>Agrupados para o mapa ficar mais leve</span> : null}
      </div>
      <div className="atlas-map-attribution">
        <a href="https://map.gtadb.org" target="_blank" rel="noreferrer">
          GTADB / Map GTA
        </a>
        <span> · </span>
        <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer">
          CC BY 4.0
        </a>
        <span> · Mapa aproximado da comunidade · baseado no </span>
        <a href={UPSTREAM_REPOSITORY} target="_blank" rel="noreferrer">
          Leonida Atlas
        </a>
        <span> (</span>
        <a href={SOURCE_REPOSITORY} target="_blank" rel="noreferrer">
          código-fonte
        </a>
        <span>)</span>
      </div>
      {mapError ? (
        <div className="atlas-map-error" role="alert">
          <span>{mapError}</span>
          <button type="button" onClick={() => setAttempt((value) => value + 1)}>
            Recarregar mapa
          </button>
        </div>
      ) : null}
    </div>
  );
}
