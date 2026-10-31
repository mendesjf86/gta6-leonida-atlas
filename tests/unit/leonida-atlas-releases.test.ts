import { readFile } from 'node:fs/promises';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import ProjectPage from '../../src/features/project/ProjectPage';
import {
  LEONIDA_ATLAS_RELEASES,
  latestLeonidaAtlasRelease,
} from '../../src/features/street-leonida/releases';

describe('Leonida Atlas release history', () => {
  it('retains every release since v0.5.0 in newest-first order across the changelog and documentation', async () => {
    expect(LEONIDA_ATLAS_RELEASES.map((release) => release.version)).toEqual([
      'v0.8.0',
      'v0.7.0',
      'v0.6.2',
      'v0.6.1',
      'v0.6.0',
      'v0.5.0',
    ]);
    expect(latestLeonidaAtlasRelease).toMatchObject({
      version: 'v0.8.0',
      date: '2026-09-06',
      status: 'public',
    });
    const markup = renderToStaticMarkup(
      createElement(ProjectPage, { page: 'changelog', onClose: () => undefined }),
    );
    const documentation = await readFile(new URL('../../RELEASES.md', import.meta.url), 'utf8');
    expect(markup).toContain('Publicada');
    expect(documentation).toContain('Released');
    for (const output of [markup, documentation]) {
      for (const version of ['v0.8.0', 'v0.7.0', 'v0.6.2', 'v0.6.1', 'v0.6.0', 'v0.5.0'])
        expect(output).toContain(version);
      expect(output).not.toMatch(/\bv0\.[1-4]\.\d+\b/);
      expect(output).not.toContain('local candidate; not pushed');
    }
    expect(markup).toContain(latestLeonidaAtlasRelease.title);
  });

  it('shows the same release history on About with direct version links and a single current badge', () => {
    const markup = renderToStaticMarkup(
      createElement(ProjectPage, { page: 'about', onClose: () => undefined }),
    );
    expect(markup).toContain('Histórico de versões');
    for (const release of LEONIDA_ATLAS_RELEASES) {
      expect(markup).toContain(
        `https://github.com/navanem/gta6-leonida-atlas/releases/tag/${release.version}`,
      );
      expect(markup).toContain(release.title);
      expect(markup).toContain(release.summary);
    }
    expect(markup.match(/>Atual</g)).toHaveLength(1);
    expect(markup).toContain('Ver todas as notas de versão');
    expect(markup).toContain('https://github.com/navanem/gta6-leonida-atlas');
    expect(markup).toContain('https://github.com/mendesjf86/gta6-leonida-atlas');
    expect(markup).toContain('AGPL-3.0');
  });

  it('retains source uncertainty and the limits of the executed browser verification', () => {
    const notes = LEONIDA_ATLAS_RELEASES.flatMap((release) => release.highlights).join(' ');
    expect(notes).toContain('APROXIMAD');
    expect(notes).toContain('DESCONHECID');
    expect(notes).toContain('GTADB');
    expect(notes).toContain('CC BY 4.0');
    expect(notes).toContain('107 sem posição');
    const verification = LEONIDA_ATLAS_RELEASES.flatMap((release) => release.verification).join(
      ' ',
    );
    expect(verification).toContain('Chromium');
    expect(verification).toContain('WebKit');
    expect(verification).toContain('explicitamente ignorad');
  });
});
