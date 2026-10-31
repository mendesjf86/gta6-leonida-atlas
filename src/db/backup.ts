import { DEFAULT_PREFERENCES } from '../domain/types';
import type {
  Backup,
  Category,
  Collection,
  Favorite,
  PersonalMarker,
  PlaceNote,
  Preferences,
} from '../domain/types';
import { CANONICAL_BOUNDS } from '../features/street-leonida/leonida-coordinates';

/** The file picker should check this before reading or JSON-parsing a file. */
export const MAX_BACKUP_BYTES = 10 * 1024 * 1024;
export const BACKUP_LIMITS = Object.freeze({
  items: 10_000,
  title: 200,
  description: 20_000,
  note: 100_000,
  id: 128,
});

export class BackupValidationError extends Error {
  constructor(message: string) {
    super(`Backup inválido: ${message}`);
    this.name = 'BackupValidationError';
  }
}

function invalid(path: string, requirement: string): never {
  throw new BackupValidationError(`${path} ${requirement}`);
}

function record(input: unknown, path: string): Record<string, unknown> {
  if (input === null || typeof input !== 'object' || Array.isArray(input))
    invalid(path, 'precisa ser um objeto');
  return input as Record<string, unknown>;
}

function list(input: unknown, path: string): unknown[] {
  if (!Array.isArray(input)) invalid(path, 'precisa ser uma lista');
  if (input.length > BACKUP_LIMITS.items)
    invalid(path, `passa do limite de ${BACKUP_LIMITS.items.toLocaleString('pt-BR')} itens`);
  return input;
}

export function parseText(input: unknown, path: string, max: number, required = false): string {
  if (typeof input !== 'string') invalid(path, 'precisa ser texto');
  if (input.length > max) invalid(path, `passa do limite de ${max.toLocaleString('pt-BR')} caracteres`);
  if (required && !input.trim()) invalid(path, 'não pode ficar vazio');
  return input;
}

export function parseId(input: unknown, path = 'id', personal = false): string {
  const id = parseText(input, path, BACKUP_LIMITS.id, true);
  if (
    !/^[a-zA-Z0-9][a-zA-Z0-9:_-]*$/.test(id) ||
    ['constructor', 'prototype', '__proto__'].includes(id)
  ) {
    invalid(
      path,
      'precisa ser um identificador seguro, só com letras, números, dois-pontos, sublinhados ou hífens',
    );
  }
  if ((personal || id.startsWith('custom:')) && !/^custom:[a-zA-Z0-9][a-zA-Z0-9:_-]*$/.test(id)) {
    invalid(path, 'precisa começar com custom: seguido de um identificador seguro');
  }
  return id;
}

function timestamp(input: unknown, path: string): string {
  if (
    typeof input !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/.test(input)
  ) {
    invalid(path, 'precisa ser uma data e hora ISO em UTC');
  }
  const milliseconds = Date.parse(input);
  if (!Number.isFinite(milliseconds)) invalid(path, 'precisa ser uma data e hora válida');
  const normalized = new Date(milliseconds).toISOString();
  if (normalized.slice(0, 19) !== input.slice(0, 19))
    invalid(path, 'precisa ser uma data válida no calendário');
  return normalized;
}

function unique<T>(items: T[], key: (item: T) => string, path: string): T[] {
  const seen = new Set<string>();
  for (const item of items) {
    const id = key(item);
    if (seen.has(id)) invalid(path, `tem o id duplicado ${id}`);
    seen.add(id);
  }
  return items;
}

export function parsePreferences(input: unknown, legacy = false): Preferences {
  const item = record(input === undefined && legacy ? {} : input, 'preferences');
  const boolean = (key: keyof Preferences): boolean => {
    const value = item[key] === undefined && legacy ? DEFAULT_PREFERENCES[key] : item[key];
    if (typeof value !== 'boolean') invalid(`preferences.${key}`, 'precisa ser verdadeiro ou falso');
    return value;
  };
  return {
    reducedMotion: boolean('reducedMotion'),
    showLabels: boolean('showLabels'),
    clusterMarkers: boolean('clusterMarkers'),
  };
}

export function parsePersonalMarker(
  input: unknown,
  path = 'marker',
  legacyTime?: string,
): PersonalMarker {
  const item = record(input, path);
  const position = record(item.position, `${path}.position`);
  const coordinate = (axis: 'x' | 'y', min: number, max: number): number => {
    const value = position[axis];
    if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max) {
      invalid(
        `${path}.position.${axis}`,
        `precisa ser uma coordenada finita dentro dos limites do mapa [${min}, ${max}]`,
      );
    }
    return value;
  };
  const category = item.category === undefined && legacyTime ? 'personal' : item.category;
  if (
    !['region', 'landmark', 'nature', 'transport', 'business', 'personal'].includes(
      category as string,
    )
  )
    invalid(`${path}.category`, 'não é suportado');
  const icon = item.icon === undefined && legacyTime ? 'pin' : item.icon;
  if (icon !== 'pin' && icon !== 'star' && icon !== 'flag')
    invalid(`${path}.icon`, 'não é suportado');
  const createdAt = timestamp(
    item.createdAt === undefined ? legacyTime : item.createdAt,
    `${path}.createdAt`,
  );
  return {
    id: parseId(item.id, `${path}.id`, true),
    title: parseText(item.title, `${path}.title`, BACKUP_LIMITS.title, true),
    description: parseText(
      item.description === undefined && legacyTime ? '' : item.description,
      `${path}.description`,
      BACKUP_LIMITS.description,
    ),
    category: category as Category,
    position: {
      x: coordinate('x', CANONICAL_BOUNDS.west, CANONICAL_BOUNDS.east),
      y: coordinate('y', CANONICAL_BOUNDS.south, CANONICAL_BOUNDS.north),
    },
    icon,
    createdAt,
    updatedAt: timestamp(
      item.updatedAt === undefined && legacyTime ? createdAt : item.updatedAt,
      `${path}.updatedAt`,
    ),
  };
}

export function parseCollection(
  input: unknown,
  path = 'collection',
  legacyTime?: string,
): Collection {
  const item = record(input, path);
  const createdAt = timestamp(
    item.createdAt === undefined ? legacyTime : item.createdAt,
    `${path}.createdAt`,
  );
  return {
    id: parseId(item.id, `${path}.id`),
    name: parseText(item.name, `${path}.name`, BACKUP_LIMITS.title, true),
    placeIds: unique(
      list(item.placeIds, `${path}.placeIds`).map((id, index) =>
        parseId(id, `${path}.placeIds[${index}]`),
      ),
      (id) => id,
      `${path}.placeIds`,
    ),
    createdAt,
    updatedAt: timestamp(
      item.updatedAt === undefined && legacyTime ? createdAt : item.updatedAt,
      `${path}.updatedAt`,
    ),
  };
}

/** Returns a new, whitelisted value. Never mutates input or touches browser storage. */
export function parseBackup(input: unknown): Backup {
  const data = record(input, 'backup');
  if (data.format !== 'leonida-atlas') invalid('format', 'precisa ser leonida-atlas');
  if (data.version !== 1 && data.version !== 2)
    invalid('version', 'não é suportada (versões suportadas: 1 e 2)');
  const exportedAt = timestamp(data.exportedAt, 'exportedAt');
  const legacyTime = data.version === 1 ? exportedAt : undefined;
  const markers = unique(
    list(data.markers, 'markers').map((item, index) =>
      parsePersonalMarker(item, `markers[${index}]`, legacyTime),
    ),
    (item) => item.id,
    'markers',
  );
  const favorites = unique(
    list(data.favorites, 'favorites').map((value, index): Favorite => {
      const path = `favorites[${index}]`;
      const item =
        typeof value === 'string' && legacyTime ? { placeId: value } : record(value, path);
      return {
        placeId: parseId(item.placeId, `${path}.placeId`),
        createdAt: timestamp(
          item.createdAt === undefined ? legacyTime : item.createdAt,
          `${path}.createdAt`,
        ),
      };
    }),
    (item) => item.placeId,
    'favorites',
  );
  const notes = unique(
    list(data.notes, 'notes').map((value, index): PlaceNote => {
      const path = `notes[${index}]`;
      const item = record(value, path);
      return {
        placeId: parseId(item.placeId, `${path}.placeId`),
        text: parseText(item.text, `${path}.text`, BACKUP_LIMITS.note),
        updatedAt: timestamp(
          item.updatedAt === undefined ? legacyTime : item.updatedAt,
          `${path}.updatedAt`,
        ),
      };
    }),
    (item) => item.placeId,
    'notes',
  );
  const collections = unique(
    list(data.collections === undefined && legacyTime ? [] : data.collections, 'collections').map(
      (item, index) => parseCollection(item, `collections[${index}]`, legacyTime),
    ),
    (item) => item.id,
    'collections',
  );
  const markerIds = new Set(markers.map((item) => item.id));
  const checkReference = (id: string) => {
    if (id.startsWith('custom:') && !markerIds.has(id))
      invalid('references', `tem o marcador pessoal ${id}, que não existe`);
  };
  for (const item of favorites) checkReference(item.placeId);
  for (const item of notes) checkReference(item.placeId);
  for (const item of collections) for (const id of item.placeIds) checkReference(id);
  const result: Backup = {
    format: 'leonida-atlas',
    version: 2,
    exportedAt,
    favorites,
    notes,
    collections,
    markers,
    preferences: parsePreferences(data.preferences, Boolean(legacyTime)),
  };
  // Count only whitelisted data: ignored keys cannot become stored executable content.
  if (new TextEncoder().encode(JSON.stringify(result)).byteLength > MAX_BACKUP_BYTES)
    invalid('backup', 'passa do limite de 10 MiB de dados');
  return result;
}
