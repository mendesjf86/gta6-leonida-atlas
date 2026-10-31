import type { Category, PersonalMarker, Place } from '../domain/types';
import { getLocalStreetPlaces } from '../features/street-leonida/page-data';
import {
  GTADB_LICENSE,
  GTADB_PREFERRED_SOURCE,
  GTADB_REVISION,
  classifyGtadbUncertaintyReasons,
  normalizeGtadbCatalogue,
  type GtadbLandmark,
} from '../features/street-leonida/gtadb';

function categoryFor(tags: readonly string[]): Category {
  if (tags.some((tag) => ['natural', 'agriculture'].includes(tag))) return 'nature';
  if (tags.some((tag) => ['transportation', 'infrastructure', 'infr'].includes(tag)))
    return 'transport';
  if (
    tags.some((tag) =>
      ['hotel', 'restaurant', 'retail', 'service', 'office', 'industrial'].includes(tag),
    )
  )
    return 'business';
  return 'landmark';
}

const UNCERTAINTY_LABELS: Record<string, string> = {
  'unknown-name': 'nome desconhecido',
  unconfirmed: 'não confirmado',
  'may-not-exist': 'pode não existir',
  cancelled: 'cancelado',
  fictional: 'fictício',
  demolished: 'demolido',
  duplicate: 'duplicado',
};

function landmarkToPlace(landmark: GtadbLandmark): Place {
  const reasons = classifyGtadbUncertaintyReasons(landmark.inGameAddress, landmark.tags);
  const uncertain = reasons.length > 0;
  return {
    id: landmark.id,
    title: landmark.inGameAddress.trim() || `Local da comunidade sem nome (${landmark.id})`,
    description: [
      landmark.inGameCoordinates
        ? 'Posição aproximada, mapeada pela comunidade.'
        : 'Sem posição conhecida no jogo; este local aparece só na busca.',
      uncertain ? `Incerteza na fonte: ${reasons.map((reason) => UNCERTAINTY_LABELS[reason] ?? reason.replaceAll('-', ' ')).join(', ')}.` : '',
      landmark.realWorldAddress
        ? `Referência no mundo real (só como comparação): ${landmark.realWorldAddress}`
        : '',
    ]
      .filter(Boolean)
      .join(' '),
    category: categoryFor(landmark.tags),
    position: landmark.inGameCoordinates
      ? { x: landmark.inGameCoordinates[0], y: landmark.inGameCoordinates[1] }
      : null,
    layerId: uncertain ? 'uncertain' : 'community',
    tags: [...landmark.tags],
    region: landmark.inGameAddress.split(',').slice(1).join(',').trim(),
    source: {
      title: `GTADB / Map GTA · revisão ${GTADB_REVISION.slice(0, 7)}`,
      url: GTADB_PREFERRED_SOURCE,
      license: GTADB_LICENSE,
    },
    evidence: uncertain ? 'uncertain' : 'approximate',
  };
}

/** Parse bundled source data through the existing strict evidence/coordinate normalizer. */
export function catalogueFromSnapshot(input: unknown): Place[] {
  if (
    !input ||
    typeof input !== 'object' ||
    !('landmarks' in input) ||
    !Array.isArray(input.landmarks)
  ) {
    throw new Error('O catálogo da comunidade incluído no mapa é inválido.');
  }
  const tuples: Record<string, unknown> = {};
  for (const candidate of input.landmarks) {
    if (
      !candidate ||
      typeof candidate !== 'object' ||
      typeof candidate.id !== 'string' ||
      !/^L\d+$/.test(candidate.id)
    ) {
      throw new Error('O catálogo da comunidade tem um registro inválido.');
    }
    if (Object.hasOwn(tuples, candidate.id))
      throw new Error(`Registro duplicado no catálogo da comunidade: ${candidate.id}`);
    tuples[candidate.id] = [
      candidate.inGameAddress,
      candidate.inGameCoordinates === null ? [] : candidate.inGameCoordinates,
      candidate.inGamePhotoSize === null ? [] : candidate.inGamePhotoSize,
      candidate.realWorldAddress,
      candidate.realWorldCoordinates === null ? [] : candidate.realWorldCoordinates,
      candidate.realWorldPhotoSize === null ? [] : candidate.realWorldPhotoSize,
      candidate.tags,
      candidate.color,
      candidate.editedAt,
    ];
  }
  const regions: Place[] = getLocalStreetPlaces().items.map((region) => ({
    id: `region:${region.slug}`,
    title: region.name,
    description: region.description ?? '',
    category: 'region',
    position: region.position ? { x: region.position.x, y: region.position.y } : null,
    layerId: 'regions',
    tags: [...region.labels],
    region: region.name,
    source: {
      title: region.source?.title ?? 'Rockstar Games',
      url: region.source?.url ?? '',
      license: 'Nome oficial; posição do GTADB, CC BY 4.0',
    },
    evidence: 'approximate',
  }));
  return [...regions, ...normalizeGtadbCatalogue(tuples).map(landmarkToPlace)];
}

let catalogueRequest: Promise<Place[]> | undefined;

/** The snapshot is local, same-origin and base-path aware; failures remain actionable to callers. */
export function loadCatalogue(): Promise<Place[]> {
  if (!catalogueRequest) {
    const base = import.meta.env.BASE_URL ?? '/';
    catalogueRequest = fetch(
      `${base.endsWith('/') ? base : `${base}/`}assets/street-leonida/maps/gtadb-landmarks-7c3f8c2.json`,
    )
      .then(async (response) => {
        if (!response.ok)
          throw new Error(`Não foi possível carregar o catálogo da comunidade (${response.status}).`);
        return catalogueFromSnapshot(await response.json());
      })
      .catch((error: unknown) => {
        catalogueRequest = undefined;
        throw error;
      });
  }
  return catalogueRequest;
}

export function markerToPlace(marker: PersonalMarker): Place {
  return {
    id: marker.id,
    title: marker.title,
    description: marker.description,
    category: marker.category,
    position: marker.position,
    layerId: 'personal',
    tags: [marker.icon],
    region: 'Meus marcadores',
    source: { title: 'Seu mapa neste aparelho', url: '' },
    evidence: 'personal',
  };
}
