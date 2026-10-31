import type { Place } from "../../domain/types";
import {
  REVIEWED_GTADB_ANCHORS,
  type StreetLeonidaRegionSlug,
} from "./leonida-evidence";

export interface ResearchSource {
  readonly id: string;
  readonly title: string;
  readonly url: string;
  readonly evidence: "official-text" | "official-image" | "official-video";
  readonly publishedAt: string | null;
  readonly retrievedAt: string;
}

export interface RegionDiscovery {
  readonly id: string;
  readonly region: StreetLeonidaRegionSlug;
  readonly title: string;
  readonly summary: string;
  readonly sourceIds: readonly string[];
  /** A regional observation is never a new map coordinate or a promise of a modeled POI. */
  readonly placement: "UNPOSITIONED";
  readonly travelRegion: StreetLeonidaRegionSlug;
}

export const RESEARCH_REVIEWED_AT = "2026-09-06";

function source(
  id: string,
  title: string,
  path: string,
  evidence: ResearchSource["evidence"],
  publishedAt: string | null = null,
): ResearchSource {
  return Object.freeze({
    id,
    title,
    url: `https://www.rockstargames.com/VI/${path}`,
    evidence,
    publishedAt,
    retrievedAt: RESEARCH_REVIEWED_AT,
  });
}

function still(id: string, title: string, filename: string): ResearchSource {
  // These are outbound citations, never hotlinked images or redistributed game assets.
  // The current gallery does not publish dates for individual images.
  return source(id, title, `_next/static/media/${filename}`, "official-image");
}

export const RESEARCH_SOURCES: Readonly<Record<string, ResearchSource>> =
  Object.freeze({
    leonida: source(
      "leonida",
      "Rockstar — Only in Leonida",
      "only-in-leonida",
      "official-text",
    ),
    "vice-city-05": still(
      "vice-city-05",
      "Rockstar — Vice City 05",
      "Vice_City_05.0~r~o0jzpp4a-.jpg",
    ),
    "keys-02": still(
      "keys-02",
      "Rockstar — Leonida Keys 02",
      "Leonida_Keys_02.0~ptk-53gl0lq.jpg",
    ),
    "keys-04": still(
      "keys-04",
      "Rockstar — Leonida Keys 04",
      "Leonida_Keys_04.0hce1rw1s8pd9.jpg",
    ),
    "keys-05": still(
      "keys-05",
      "Rockstar — Leonida Keys 05",
      "Leonida_Keys_05.0yerhvjhto-h..jpg",
    ),
    "keys-06": still(
      "keys-06",
      "Rockstar — Leonida Keys 06",
      "Leonida_Keys_06.0eapr3hbeyewx.jpg",
    ),
    "grassrivers-06": still(
      "grassrivers-06",
      "Rockstar — Grassrivers 06",
      "Grassrivers_06.0bdeicllwisnc.jpg",
    ),
    "port-gellhorn-05": still(
      "port-gellhorn-05",
      "Rockstar — Port Gellhorn 05",
      "Port_Gellhorn_05.0nsv0ou54n-t3.jpg",
    ),
    "ambrosia-01": still(
      "ambrosia-01",
      "Rockstar — Ambrosia 01",
      "Ambrosia_01.0rqphs0gazkm..jpg",
    ),
    "ambrosia-04": still(
      "ambrosia-04",
      "Rockstar — Ambrosia 04",
      "Ambrosia_04.0.2cefoguu-tt.jpg",
    ),
    "kalaga-05": still(
      "kalaga-05",
      "Rockstar — Mount Kalaga National Park 05",
      "Mount_Kalaga_National_Park_05.0_~vto-o2zxok.jpg",
    ),
    "kalaga-06": still(
      "kalaga-06",
      "Rockstar — Mount Kalaga National Park 06",
      "Mount_Kalaga_National_Park_06.166ouq5pjd7h0.jpg",
    ),
    "trailer-2": source(
      "trailer-2",
      "Grand Theft Auto VI Trailer 2",
      "trailer-2",
      "official-video",
      "2025-05-06",
    ),
    "extended-look": source(
      "extended-look",
      "Grand Theft Auto VI: An Extended Look",
      "an-extended-look",
      "official-video",
      "2026-08-27",
    ),
  });

export const RESEARCH_REGIONS = Object.freeze([
  {
    slug: "vice-city",
    name: "Vice City",
    summary:
      "A Rockstar cita Ocean Beach, Little Cuba, Tisha-Wocka e VC Port, dando à cidade identidades próprias de praia, bairro, mercado e porto de cruzeiros.",
  },
  {
    slug: "leonida-keys",
    name: "Leonida Keys",
    summary:
      "Um arquipélago com vida cotidiana à beira da estrada, encontros de barcos e vida marinha nos recifes, segundo as imagens públicas da Rockstar.",
  },
  {
    slug: "grassrivers",
    name: "Grassrivers",
    summary:
      "A Rockstar descreve áreas alagadas de manguezal; as imagens também mostram abrigos de trabalho desgastados entre os canais.",
  },
  {
    slug: "port-gellhorn",
    name: "Port Gellhorn",
    summary:
      "Um antigo destino de férias com imóveis comerciais vazios, motéis baratos e encontros informais ao ar livre.",
  },
  {
    slug: "ambrosia",
    name: "Ambrosia",
    summary:
      "A refinaria de açúcar Allied Crystal é a base dos empregos locais; imagens públicas mostram plantações e motociclistas com emblemas do Final Chapter.",
  },
  {
    slug: "mount-kalaga-national-park",
    name: "Mount Kalaga National Park",
    summary:
      "Uma região selvagem no norte com trilhas off-road, riachos sombreados, vida selvagem e caiaque, segundo o material público da Rockstar.",
  },
] as const satisfies readonly {
  readonly slug: StreetLeonidaRegionSlug;
  readonly name: string;
  readonly summary: string;
}[]);

function discovery(
  region: StreetLeonidaRegionSlug,
  id: string,
  title: string,
  summary: string,
  ...sourceIds: string[]
): RegionDiscovery {
  return Object.freeze({
    id,
    region,
    title,
    summary,
    sourceIds: Object.freeze(sourceIds),
    placement: "UNPOSITIONED",
    travelRegion: region,
  });
}

export const REGION_DISCOVERIES: readonly RegionDiscovery[] = Object.freeze([
  discovery(
    "vice-city",
    "little-cuba-bakeries",
    "As padarias de Little Cuba",
    "A Rockstar apresenta Little Cuba pelas suas panaderías movimentadas. A cultura das padarias está documentada; nomes e locais de cada loja não foram informados.",
    "leonida",
  ),
  discovery(
    "vice-city",
    "tisha-wocka-market",
    "Feira de Tisha-Wocka",
    "A descrição oficial da cidade cita uma feira que vende imitações de marcas. Ela não informa endereço nem a disposição da feira.",
    "leonida",
  ),
  discovery(
    "vice-city",
    "vc-port-cruises",
    "VC Port e o turismo de cruzeiros",
    "A Rockstar chama o polo de navios de cruzeiro de VC Port. Essa função está confirmada, mas a área dos terminais e os limites do porto continuam indefinidos.",
    "leonida",
  ),
  discovery(
    "vice-city",
    "ocean-beach-life",
    "Ocean Beach e a vida na praia",
    "Ocean Beach é conhecida pelos hotéis Art Déco e pela areia clara. Uma imagem de praia de Vice City mostra ainda um posto de salva-vidas, gente correndo e jogando bola.",
    "leonida",
    "vice-city-05",
  ),
  discovery(
    "leonida-keys",
    "keys-everyday-life",
    "Iguanas e ruas da ilha",
    "Imagens públicas mostram iguanas à beira da estrada e em pedras do litoral. Uma cena de rua inclui uma bicicleta, uma scooter de mobilidade e pequenos comércios de beira de estrada.",
    "keys-02",
    "keys-06",
  ),
  discovery(
    "leonida-keys",
    "keys-underwater-life",
    "Vida debaixo d’água",
    "Uma cena de recife mostra mergulhadores, corais, peixes, uma moreia e uma tartaruga-marinha. A imagem confirma a vida submarina, não a posição medida de um ponto de mergulho.",
    "keys-04",
  ),
  discovery(
    "leonida-keys",
    "keys-boat-gathering",
    "Um encontro na água",
    "Barcos de vários tipos se reúnem com passageiros, boias infláveis e jet skis passando. São detalhes observados de convívio e navegação, não uma marina com nome.",
    "keys-05",
  ),
  discovery(
    "grassrivers",
    "grassrivers-working-shelter",
    "Abrigos de trabalho nas áreas alagadas",
    "Uma imagem pública mostra um abrigo aberto com caibros à mostra, correntes, paletes empilhados e telhado de chapa ondulada. O nome e o local exato são desconhecidos.",
    "grassrivers-06",
  ),
  discovery(
    "port-gellhorn",
    "gellhorn-tourism-decline",
    "Uma antiga economia de férias",
    "A Rockstar descreve o turismo perdido, atrações fechadas e centros comerciais vazios. Isso explica o comércio desgastado sem confirmar nenhuma atração abandonada específica.",
    "leonida",
  ),
  discovery(
    "port-gellhorn",
    "gellhorn-bonfire",
    "Um encontro ao ar livre",
    "Uma cena noturna mostra uma fogueira, cadeiras dobráveis, caixas térmicas e picapes estacionadas. Ela documenta um encontro social, não um acampamento fixo com nome.",
    "port-gellhorn-05",
  ),
  discovery(
    "ambrosia",
    "ambrosia-bikers",
    "Os motociclistas do Final Chapter",
    "Dá para ler Final Chapter e Ambrosia nos emblemas dos coletes dos motociclistas. A Rockstar descreve, à parte, uma gangue local de motoqueiros ao lado dos empregos da refinaria.",
    "ambrosia-01",
    "leonida",
  ),
  discovery(
    "ambrosia",
    "ambrosia-crop-fields",
    "Plantações, fogo e indústria",
    "Uma imagem ao pôr do sol mostra fileiras de plantação, frentes estreitas de fogo, canais de água e chaminés industriais ao longe. Ela não explica o que causou os incêndios.",
    "ambrosia-04",
  ),
  discovery(
    "mount-kalaga-national-park",
    "kalaga-backwoods-trails",
    "Trilhas no meio do mato",
    "A Rockstar coloca o parque perto da fronteira norte de Leonida e descreve caça, pesca e trilhas off-road. Os trajetos exatos das trilhas não foram divulgados.",
    "leonida",
  ),
  discovery(
    "mount-kalaga-national-park",
    "kalaga-stream-wildlife",
    "Vida selvagem no riacho",
    "Um puma e um cervo aparecem ao lado de um riacho sombreado, com raízes expostas e folhas caídas. Isso indica habitats variados na borda da floresta, além das serras cobertas de pinheiros.",
    "kalaga-05",
  ),
  discovery(
    "mount-kalaga-national-park",
    "kalaga-river-kayak",
    "Caiaque sob a ponte ferroviária",
    "Um caiaquista passa por uma régua amarela de nível de cheia ao lado de uma ponte ferroviária de aço. Esses detalhes visíveis do rio não definem o curso nem o nível da água.",
    "kalaga-06",
  ),
]);

export function getRegionDiscoveries(
  slug: StreetLeonidaRegionSlug,
): readonly RegionDiscovery[] {
  return REGION_DISCOVERIES.filter((discovery) => discovery.region === slug);
}

export function getResearchForPlace(place: Pick<Place, "id" | "evidence">) {
  if (place.evidence !== "approximate") return null;
  const directRegion = RESEARCH_REGIONS.find(
    (region) => place.id === `region:${region.slug}`,
  );
  const anchor = Object.hasOwn(REVIEWED_GTADB_ANCHORS, place.id)
    ? REVIEWED_GTADB_ANCHORS[place.id as keyof typeof REVIEWED_GTADB_ANCHORS]
    : null;
  const region =
    directRegion ??
    (anchor?.confidence === "SUPPORTED"
      ? RESEARCH_REGIONS.find((region) => region.slug === anchor.region)
      : undefined);
  return region
    ? { region, discoveries: getRegionDiscoveries(region.slug) }
    : null;
}
