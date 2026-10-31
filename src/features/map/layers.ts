import type { LayerDefinition, Place } from '../../domain/types';

export const DEFAULT_LAYERS: LayerDefinition[] = [
  {
    id: 'regions',
    name: 'Regiões com nome',
    description: 'Nomes oficiais com posições aproximadas da comunidade.',
    category: 'reference',
    visible: true,
    order: 0,
    source: 'Rockstar Games / GTADB',
    style: { color: '#ffc46b', radius: 9 },
    icon: 'region',
    interactive: true,
  },
  {
    id: 'community',
    name: 'Locais da comunidade',
    description: 'Locais com nome mapeados pela comunidade; a posição é aproximada.',
    category: 'community',
    visible: true,
    order: 10,
    source: 'GTADB / Map GTA · CC BY 4.0',
    style: { color: '#2fe6d2', radius: 6 },
    icon: 'pin',
    interactive: true,
  },
  {
    id: 'uncertain',
    name: 'Locais incertos',
    description: 'Nomes desconhecidos ou sinais claros de incerteza na fonte.',
    category: 'community',
    visible: true,
    order: 20,
    source: 'GTADB / Map GTA · CC BY 4.0',
    style: { color: '#a59cc4', radius: 5 },
    icon: 'question',
    interactive: true,
  },
  {
    id: 'personal',
    name: 'Meus marcadores',
    description: 'Suas marcações, salvas só neste aparelho.',
    category: 'personal',
    visible: true,
    order: 30,
    source: 'Seu mapa neste aparelho',
    style: { color: '#ff3e9a', radius: 8 },
    icon: 'pin',
    interactive: true,
  },
];

/** Unpositioned records remain available to the catalogue; the spatial index omits them. */
export function getVisiblePlaces(
  places: readonly Place[],
  layers: readonly LayerDefinition[],
  zoom?: number,
): Place[] {
  const orderedLayers = layers
    .filter(
      (layer) =>
        layer.visible &&
        (zoom === undefined || layer.minZoom === undefined || zoom >= layer.minZoom) &&
        (zoom === undefined || layer.maxZoom === undefined || zoom <= layer.maxZoom),
    )
    .sort((a, b) => a.order - b.order);
  const buckets = new Map(orderedLayers.map((layer) => [layer.id, [] as Place[]]));
  for (const place of places) buckets.get(place.layerId)?.push(place);
  return orderedLayers.flatMap((layer) => buckets.get(layer.id) ?? []);
}
