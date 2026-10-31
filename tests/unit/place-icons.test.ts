import { describe, expect, it } from 'vitest';
import { iconForPlace, PLACE_ICON_ORDER, placeIconStyle, placeNameOnly } from '../../src/features/map/place-icons';

const place = (title: string, tags: string[] = [], layerId = 'community') => ({ title, tags, layerId });

describe('place icons', () => {
  it('has one sprite cell per icon in a 7 x 5 grid', () => {
    expect(PLACE_ICON_ORDER).toHaveLength(35);
    expect(new Set(PLACE_ICON_ORDER).size).toBe(35);
  });

  it('matches by place name, not by district', () => {
    expect(iconForPlace(place('Xero Gas Station, Ambrosia'))).toBe('posto');
    expect(iconForPlace(place('Electric Fang Tattoo, Stockyard, Vice City'))).toBe('tatuagem');
    expect(iconForPlace(place('?, Leaf Links'))).toBeNull();
    expect(iconForPlace(place('?, Harborside Ave, Vice Beach'))).toBeNull();
    expect(iconForPlace(place('Vice Beach Marina, Vice Beach'))).toBe('marina');
  });

  it('prefers specific rules over generic ones', () => {
    expect(iconForPlace(place('Leaf Links Golf Club?, Vice Beach'))).toBe('golfe');
    expect(iconForPlace(place('NINE1NINE, Downtown, Vice City'))).toBe('n1n');
    expect(iconForPlace(place('Jack of Hearts, Crosstown, Vice City'))).toBe('clube');
    expect(iconForPlace(place("Phil's Ammu-Nation, Leonida"))).toBe('armas');
    expect(iconForPlace(place('Blue Crab Bar & Grill, Mariana County'))).toBe('bar');
    expect(iconForPlace(place('VCIA Metro Station, Vice City'))).toBe('onibus');
    expect(iconForPlace(place('Autograph Hangar 2, Vice City International Airport'))).toBe('aeroporto');
  });

  it('falls back to source tags and skips regions and personal markers', () => {
    expect(iconForPlace(place('?, Watson Bay', ['restaurant']))).toBe('restaurante');
    expect(iconForPlace(place('?, Vice Beach', ['L1', 'retail']))).toBe('mercado');
    expect(iconForPlace(place('?, Vice Beach', ['residential']))).toBeNull();
    expect(iconForPlace(place('Vice City', [], 'regions'))).toBeNull();
    expect(iconForPlace(place('Gas Station', [], 'personal'))).toBeNull();
  });

  it('builds the sprite position for a cell', () => {
    expect(placeNameOnly('Taco Bomb?, Kelly County')).toBe('taco bomb');
    const style = placeIconStyle('posto', 30, '/mapa-interativo/');
    expect(style).toContain('/mapa-interativo/assets/mundovice/place-icons.webp');
    expect(style).toContain('background-size:210px 150px');
    expect(style).toContain('background-position:-120px -60px');
  });
});
