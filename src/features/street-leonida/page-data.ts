import { GTADB_LICENSE_URL, GTADB_PREFERRED_SOURCE, GTADB_REVISION } from './gtadb';
import { worldToGtadb } from './leonida-coordinates';
import { OFFICIAL_SOURCE_URLS } from './leonida-evidence';
import { PLACE_ENTRY_VIEWS } from './walk-geography';
import { RESEARCH_REGIONS, RESEARCH_REVIEWED_AT } from './leonida-research';
import type {
  PublicStreetList,
  PublicStreetMedia,
  PublicStreetPlace,
  PublicStreetPosition,
  PublicStreetSource,
  PublicStreetViewpoint,
  StreetPlaceCategory,
} from './types';

export type AtlasFocus =
  { kind: 'default' } | { kind: 'place'; slug: string } | { kind: 'viewpoint'; slug: string };

export interface AtlasPageData {
  places: PublicStreetPlace[];
  viewpoints: PublicStreetViewpoint[];
  initialPlace: PublicStreetPlace | null;
  initialViewpoint: PublicStreetViewpoint | null;
  dataUnavailable: boolean;
  focusFound: boolean;
}

interface LocalRegionRecord {
  readonly slug: keyof typeof PLACE_ENTRY_VIEWS;
  readonly name: string;
  readonly category: StreetPlaceCategory;
  readonly description: string;
  readonly visualDescription: string;
  readonly sourceUrl: string;
}

const gtadbSource: PublicStreetSource = {
  title: `Reconstrução da comunidade GTADB / Map GTA, revisão fixada ${GTADB_REVISION.slice(0, 7)}`,
  publisher: 'Colaboradores do GTADB / Map GTA',
  url: GTADB_PREFERRED_SOURCE,
  publishedAt: null,
  retrievedAt: '2026-09-05',
};

const rockstarSource = (url: string): PublicStreetSource => ({
  title: 'Mídia oficial de Grand Theft Auto VI',
  publisher: 'Rockstar Games',
  url,
  publishedAt: null,
  retrievedAt: RESEARCH_REVIEWED_AT,
});

const localMedia: PublicStreetMedia = {
  kind: 'STILL_IMAGE',
  deliveryMode: 'LOCAL_IMAGE',
  image: null,
  video: null,
  outboundUrl: null,
  pan: null,
};

const localRegions: readonly LocalRegionRecord[] = [
  {
    slug: 'vice-city',
    name: 'Vice City',
    category: 'CITY',
    description:
      'Região urbana com nome oficial, representada no mapa com posição aproximada na base do GTADB, orla densa e contexto do horizonte de prédios.',
    visualDescription:
      'Cidade litorânea em tons pastel, faixa de praia e água, palmeiras, conjunto de arranha-céus e luz forte e úmida.',
    sourceUrl: OFFICIAL_SOURCE_URLS.screenshots,
  },
  {
    slug: 'leonida-keys',
    name: 'Leonida Keys',
    category: 'REGION',
    description:
      'Região de ilhas com nome oficial, representada com posição aproximada da comunidade, ilhas baixas, pontes-estrada e água costeira turquesa.',
    visualDescription:
      'Ilhas baixas, água rasa, marinas e pontes-estrada, mangue e vegetação costeira.',
    sourceUrl: OFFICIAL_SOURCE_URLS.onlyInLeonida,
  },
  {
    slug: 'grassrivers',
    name: 'Grassrivers',
    category: 'NATURAL_AREA',
    description:
      'Região de áreas alagadas com nome oficial, representada como reconstrução aproximada de pântanos e canais pouco povoados.',
    visualDescription:
      'Água de pântano, juncos, horizonte baixo, estruturas de madeira e ocupação esparsa.',
    sourceUrl: OFFICIAL_SOURCE_URLS.onlyInLeonida,
  },
  {
    slug: 'port-gellhorn',
    name: 'Port Gellhorn',
    category: 'CITY',
    description:
      'Cidade litorânea do oeste com nome oficial, representada com posição aproximada da comunidade e clima de motéis e comércio de beira de estrada.',
    visualDescription:
      'Motéis desbotados, comércio baixo em fileira, ruas mais precárias, toques de neon e expansão pelo litoral.',
    sourceUrl: OFFICIAL_SOURCE_URLS.onlyInLeonida,
  },
  {
    slug: 'ambrosia',
    name: 'Ambrosia',
    category: 'REGION',
    description:
      'Região industrial e agrícola com nome oficial, representada com posição aproximada na base do GTADB e contexto de infraestrutura.',
    visualDescription:
      'Volumes industriais e agrícolas: silos, tanques, galpões, plantações e redes de energia.',
    sourceUrl: OFFICIAL_SOURCE_URLS.onlyInLeonida,
  },
  {
    slug: 'mount-kalaga-national-park',
    name: 'Mount Kalaga',
    category: 'NATURAL_AREA',
    description:
      'Região selvagem do norte com nome oficial, representada com posição aproximada, relevo, floresta e estradas sinuosas.',
    visualDescription:
      'Serras com floresta, cortes na rocha, estradas com curvas, estruturas à beira do rio e um clima mais selvagem.',
    sourceUrl: OFFICIAL_SOURCE_URLS.onlyInLeonida,
  },
] as const;

function localPosition(slug: keyof typeof PLACE_ENTRY_VIEWS): PublicStreetPosition {
  const entry = PLACE_ENTRY_VIEWS[slug] ?? PLACE_ENTRY_VIEWS['vice-city'];
  if (!entry) throw new Error('Missing local Atlas entry view');
  const gtadb = worldToGtadb(entry.position);
  return {
    x: gtadb.x,
    y: gtadb.y,
    authority: 'COMMUNITY_SOURCE',
    confidence: 'LOW',
    precision: 'APPROXIMATE',
    label: 'Approximate position',
    source: gtadbSource,
  };
}

const localPlaces: readonly PublicStreetPlace[] = localRegions.map((region) => ({
  name: region.name,
  slug: region.slug,
  aliases: [],
  category: region.category,
  description: `${RESEARCH_REGIONS.find((research) => research.slug === region.slug)!.summary} A posição no mapa e a geometria reconstruída continuam aproximadas.`,
  region: { name: region.name, slug: region.slug },
  relatedLocationSlug: null,
  position: localPosition(region.slug),
  labels: ['Official place name', 'Community-mapped position', 'Approximate position'],
  source: rockstarSource(region.sourceUrl),
}));

const localViewpoints: readonly PublicStreetViewpoint[] = localRegions.map((region) => ({
  slug: `${region.slug}-regional-entry`,
  title: `Entrada regional: ${region.name}`,
  place: { name: region.name, slug: region.slug },
  media: localMedia,
  source: rockstarSource(region.sourceUrl),
  labels: ['Official place name', 'Official media', 'Community-mapped position', 'Approximate position'],
  position: localPosition(region.slug),
  perspective: 'Vista de chegada na região',
  captureContext: `Catálogo local de código aberto. A posição derivada do GTADB continua aproximada; fonte dos dados: ${GTADB_PREFERRED_SOURCE}; licença: ${GTADB_LICENSE_URL}.`,
  visualDescription: region.visualDescription,
  coverageMessage: 'A cobertura é regional e aproximada; detalhes desconhecidos não são preenchidos de propósito.',
  links: [],
}));

export function getLocalStreetPlaces(): PublicStreetList<PublicStreetPlace> {
  return { items: [...localPlaces], total: localPlaces.length, page: 1, totalPages: 1 };
}

export function getLocalStreetViewpoints(): PublicStreetList<PublicStreetViewpoint> {
  return {
    items: [...localViewpoints],
    total: localViewpoints.length,
    page: 1,
    totalPages: 1,
  };
}

/** Load the complete app catalogue from bundled, source-attributed local data. */
export async function loadAtlasPageData(focus: AtlasFocus): Promise<AtlasPageData> {
  const places = [...localPlaces];
  const viewpoints = [...localViewpoints];

  let initialPlace: PublicStreetPlace | null = null;
  let initialViewpoint: PublicStreetViewpoint | null = null;
  let focusFound = true;

  if (focus.kind === 'place') {
    initialPlace = places.find((place) => place.slug === focus.slug) ?? null;
    focusFound = Boolean(initialPlace);
    initialViewpoint = viewpoints.find((viewpoint) => viewpoint.place.slug === initialPlace?.slug) ?? null;
  } else if (focus.kind === 'viewpoint') {
    initialViewpoint = viewpoints.find((viewpoint) => viewpoint.slug === focus.slug) ?? null;
    focusFound = Boolean(initialViewpoint);
    initialPlace = places.find((place) => place.slug === initialViewpoint?.place.slug) ?? null;
  } else {
    initialPlace = places.find((place) => place.slug === 'vice-city') ?? places[0] ?? null;
    initialViewpoint =
      viewpoints.find((viewpoint) => viewpoint.place.slug === initialPlace?.slug) ??
      viewpoints[0] ??
      null;
  }

  return {
    places,
    viewpoints,
    initialPlace,
    initialViewpoint,
    dataUnavailable: false,
    focusFound,
  };
}
