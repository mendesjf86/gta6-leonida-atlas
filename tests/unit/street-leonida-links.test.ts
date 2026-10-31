import { describe, expect, it } from 'vitest';

import {
  derivePreviousMoment,
  getCoverageState,
  getStreetLinkLabel,
} from '@features/street-leonida/links';
import * as streetLinks from '@features/street-leonida/links';
import type { PublicStreetLink } from '@features/street-leonida/types';

const timeline: PublicStreetLink = {
  fromSlug: 'moment-one',
  toSlug: 'moment-two',
  type: 'VIDEO_TIMELINE_NEXT',
  label: 'Próximo momento',
  note: null,
  authority: 'ROCKSTAR_OFFICIAL',
  confidence: 'HIGH',
  source: null,
};

describe('Street Leonida documented links', () => {
  it('uses Próximo momento only for a reviewed timeline relation', () => {
    expect(getStreetLinkLabel('VIDEO_TIMELINE_NEXT')).toBe('Próximo momento');
  });

  it.each(['SAME_PLACE_JUMP', 'REGION_JUMP', 'MANUAL_JUMP'] as const)(
    'labels %s as Ir para a cena',
    (type) => expect(getStreetLinkLabel(type)).toBe('Ir para a cena'),
  );

  it('derives previous only from an incoming timeline relation', () => {
    expect(
      derivePreviousMoment('moment-two', [
        timeline,
        { ...timeline, fromSlug: 'other', toSlug: 'moment-two', type: 'REGION_JUMP' },
      ]),
    ).toBe('moment-one');
    expect(derivePreviousMoment('moment-one', [timeline])).toBeNull();
  });

  it('returns an explicit terminal message when no outgoing documented link exists', () => {
    expect(getCoverageState('moment-two', [timeline], null)).toEqual({
      terminal: true,
      message: 'A cobertura termina aqui',
    });
  });

  it('uses the reviewed coverage message and stays non-terminal when a link exists', () => {
    expect(
      getCoverageState('moment-one', [timeline], 'Não há mais mídia oficial documentada.'),
    ).toEqual({ terminal: false, message: null });
    expect(
      getCoverageState('moment-two', [timeline], 'Não há mais mídia oficial documentada.'),
    ).toEqual({ terminal: true, message: 'Não há mais mídia oficial documentada.' });
  });

  it('keeps reviewed timeline navigation separate from non-spatial scene jumps', () => {
    const links = streetLinks as typeof streetLinks & {
      resolveStreetNavigation?: (
        currentSlug: string,
        candidates: PublicStreetLink[],
      ) => {
        previousMoment: PublicStreetLink | null;
        nextMoment: PublicStreetLink | null;
        previousScene: PublicStreetLink | null;
        nextScene: PublicStreetLink | null;
      };
    };
    expect(typeof links.resolveStreetNavigation).toBe('function');

    const sceneJump: PublicStreetLink = {
      ...timeline,
      fromSlug: 'moment-one',
      toSlug: 'other-scene',
      type: 'REGION_JUMP',
      label: 'Ir para a cena',
    };
    expect(links.resolveStreetNavigation?.('moment-one', [sceneJump, timeline])).toEqual({
      previousMoment: null,
      nextMoment: timeline,
      previousScene: null,
      nextScene: sceneJump,
    });
  });
});
