import type { Place } from '../../domain/types';

/**
 * Mundo Vice place icons.
 *
 * The sprite (public/assets/mundovice/place-icons.webp) is a 7 x 5 grid of
 * 96 px cells, in the order of PLACE_ICON_ORDER. Icons were drawn for Mundo
 * Vice and are matched to places by name keywords first, then by source tags.
 */
export const PLACE_ICON_ORDER = [
  'restaurante',
  'roupas',
  'moda-praia',
  'musica',
  'barbearia',
  'mercado',
  'tenis',
  'academia',
  'bar',
  'hospital',
  'lanchonete',
  'marina',
  'sucos',
  'armas',
  'perfumaria',
  'tatuagem',
  'loja-bebidas',
  'sinuca',
  'posto',
  'casa',
  'tenis-quadra',
  'golfe',
  'aeroporto',
  'base-aerea',
  'dirigivel',
  'n1n',
  'clube',
  'loja-d',
  'sapatos',
  'globo',
  'icone-octogono',
  'onibus',
  'carro',
  'oficina',
  'oficina-motos',
  // Mundo Vice extras (Font Awesome Free glyphs, CC BY 4.0, drawn in the same tile style)
  'hotel',
  'residencial',
  'industria',
  'natureza',
  'lazer',
  'eventos',
  'governo',
  'utilidades',
  'publico',
  'ponto-turistico',
  'escritorio',
  'obra',
  'igreja',
  'escola',
  'local',
] as const;

export type PlaceIcon = (typeof PLACE_ICON_ORDER)[number];

export const PLACE_ICON_COLUMNS = 7;
export const PLACE_ICON_ROWS = 8;
export const PLACE_ICON_SPRITE = 'assets/mundovice/place-icons.webp';

/** Order matters: the first rule whose pattern matches the place name wins. */
const NAME_RULES: ReadonlyArray<readonly [PlaceIcon, RegExp]> = [
  ['armas', /ammu-?nation|\bgun ?(shop|store|range)\b|shooting range|firearms?/],
  ['clube', /jack of hearts|strip club|gentlemen'?s club|cabaret/],
  ['n1n', /nine1nine|night ?club|\bdisco\b/],
  ['golfe', /\bgolf\b/],
  ['tenis-quadra', /\btennis\b/],
  ['aeroporto', /airport|\bairfield\b|\bhangar\b|\bvcia\b(?! metro)/],
  ['base-aerea', /\bair ?(force )?base\b|\bmilitary\b|\bnaval\b|\barmy\b/],
  ['dirigivel', /\bblimp\b|airship/],
  ['posto', /\bgas station\b|\bgas\b|\bfuel\b|\bpetrol\b|\bxero\b|\bglobe oil\b/],
  ['onibus', /\bbus\b|\bmetro\b|\btransit\b|\bstation\b|\brail\b|\btrain\b/],
  ['marina', /\bmarina\b|\bharbou?r\b|\bdocks?\b|\bpier\b|\byacht\b|\bboat\b|\bferry\b|shipping terminal/],
  ['hospital', /hospital|\bclinic\b|\bmedical\b|\bpharmacy\b/],
  ['tatuagem', /\btattoo\b|\bink\b/],
  ['barbearia', /\bbarber\b|\bsalon\b|\bhair\b/],
  ['academia', /\bgym\b|\bfitness\b/],
  ['sinuca', /\bbilliards?\b|pool hall/],
  ['loja-bebidas', /\bliquor\b|\bwine\b|\bspirits\b/],
  ['bar', /\bbar\b|\bpub\b|\blounge\b|\btavern\b|\bsaloon\b|\bbrewery\b/],
  ['lanchonete', /burger|pizza|\bdiner\b|\btaco\b|fried chicken|hot ?dog|donut|\bsnack/],
  ['sucos', /\bjuice\b|smoothie|\bcoffee\b|\bcaf[eé]\b/],
  ['restaurante', /restaurant|\bgrill\b|\bkitchen\b|\bbistro\b|steak|seafood|sushi|\beatery\b|cuisine/],
  ['oficina-motos', /motorcycle|\bbikers?\b|\bchopper/],
  ['oficina', /\btires?\b|\brepair\b|body shop|customs\b|mechanic|car wash|auto (shop|repair|body)/],
  ['carro', /\bparking\b|\bdealership\b|\bmotors\b|auto resort/],
  ['sapatos', /\bshoes?\b|\bfootwear\b/],
  ['tenis', /\bsneakers?\b/],
  ['perfumaria', /perfume|fragrance|cosmetic/],
  ['moda-praia', /swimwear|\bsurf ?shop\b|beachwear/],
  ['roupas', /clothing|apparel|boutique|fashion|\bbinco\b|\bponsonbys\b|\bsuburban\b/],
  ['musica', /\bmusic\b|\brecords\b|recording studio|concert|amphitheat/],
  ['hotel', /\bhotel\b|\bmotel\b|\binn\b|\bresort\b|\bhostel\b|\blodge\b/],
  ['igreja', /\bchurch\b|\bchapel\b|\bcathedral\b|\btemple\b/],
  ['escola', /\bschool\b|\bcollege\b|\buniversity\b|\bacademy\b/],
  ['mercado', /\bmarket\b|grocery|supermarket|\bmart\b|24\/7|\bstore\b|\bshop\b|\bplaza\b|\bmall\b|\boutlet\b/],
];

const TAG_RULES: ReadonlyArray<readonly [PlaceIcon, string]> = [
  ['restaurante', 'restaurant'],
  ['casa', 'safehouse'],
  ['mercado', 'retail'],
  ['hotel', 'hotel'],
  ['onibus', 'transportation'],
  ['industria', 'industrial'],
  ['natureza', 'natural'],
  ['lazer', 'leisure'],
  ['eventos', 'events'],
  ['governo', 'government'],
  ['utilidades', 'utilities'],
  ['utilidades', 'infrastructure'],
  ['publico', 'public'],
  ['ponto-turistico', 'landmark'],
  ['escritorio', 'office'],
  ['obra', 'construction'],
  ['natureza', 'agriculture'],
  ['residencial', 'residential'],
];

/** The part of a place title before the first comma, e.g. "Taco Bomb" in "Taco Bomb, Kelly County". */
export function placeNameOnly(title: string): string {
  const name = title.split(',')[0] ?? '';
  return name.replace(/\?/g, '').trim().toLowerCase();
}

/** Returns the Mundo Vice icon for a place, or null when nothing fits (the classic pin is used). */
export function iconForPlace(place: Pick<Place, 'title' | 'tags' | 'layerId'>): PlaceIcon | null {
  if (place.layerId === 'regions' || place.layerId === 'personal') return null;
  const name = placeNameOnly(place.title);
  if (name) {
    for (const [icon, pattern] of NAME_RULES) {
      if (pattern.test(name)) return icon;
    }
  }
  for (const [icon, tag] of TAG_RULES) {
    if (place.tags.includes(tag)) return icon;
  }
  // Every point of interest gets an icon; uncertain places keep their "?" marker.
  return place.layerId === 'uncertain' ? null : 'local';
}

/** CSS background for one sprite cell rendered at `size` px. */
export function placeIconStyle(icon: PlaceIcon, size: number, baseUrl: string): string {
  const index = PLACE_ICON_ORDER.indexOf(icon);
  const x = (index % PLACE_ICON_COLUMNS) * size;
  const y = Math.floor(index / PLACE_ICON_COLUMNS) * size;
  return [
    `background-image:url("${baseUrl}${PLACE_ICON_SPRITE}")`,
    `background-size:${PLACE_ICON_COLUMNS * size}px ${PLACE_ICON_ROWS * size}px`,
    `background-position:-${x}px -${y}px`,
  ].join(';');
}
