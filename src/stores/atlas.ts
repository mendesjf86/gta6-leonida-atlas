import { create } from 'zustand';
import type { Filters, LayerDefinition, Place, Position, UserData } from '../domain/types';
import { EMPTY_USER_DATA } from '../domain/types';
import {
  AtlasDatabase,
  atlasRepository,
  ConflictError,
  replaceAtlasRepository,
  workspaceDatabaseName,
} from '../db/repository';
import { atlasRegistry } from '../plugins/registry';
import { parseBackup } from '../db/backup';

export const DEFAULT_FILTERS: Filters = {
  query: '',
  category: 'all',
  favoritesOnly: false,
  personalOnly: false,
  evidence: 'all',
  collectionId: null,
};
export const useDomainStore = create<{
  places: Place[];
  status: 'loading' | 'ready' | 'error';
  error: string;
  setPlaces: (places: Place[]) => void;
  fail: (error: string) => void;
}>((set) => ({
  places: [],
  status: 'loading',
  error: '',
  setPlaces: (places) => set({ places, status: 'ready', error: '' }),
  fail: (error) => set({ status: 'error', error }),
}));
export const useMapStore = create<{
  selectedId: string | null;
  focus: { position: Position; requestId: number } | null;
  layers: LayerDefinition[];
  editorMode: 'none' | 'create' | 'move';
  draftPosition: Position | null;
  setLayers: (layers: LayerDefinition[]) => void;
  select: (place: Place | null) => void;
  setEditor: (mode: 'none' | 'create' | 'move') => void;
  setPosition: (position: Position) => void;
}>((set) => ({
  selectedId: null,
  focus: null,
  layers: [],
  editorMode: 'none',
  draftPosition: null,
  setLayers: (layers) => set({ layers }),
  select: (place) => {
    set((state) => ({
      selectedId: place?.id ?? null,
      focus: place?.position
        ? { position: place.position, requestId: (state.focus?.requestId ?? 0) + 1 }
        : null,
      editorMode: 'none',
      draftPosition: null,
    }));
    atlasRegistry.emit('selection', place?.id ?? null);
  },
  setEditor: (editorMode) => set({ editorMode, draftPosition: null }),
  setPosition: (draftPosition) => set({ draftPosition }),
}));
export type SidebarTab = 'explore' | 'layers' | 'saved';
export const useUiStore = create<{
  filters: Filters;
  tab: SidebarTab;
  sidebarOpen: boolean;
  dialog: 'settings' | 'backup' | null;
  editorOpen: boolean;
  setFilters: (filters: Partial<Filters>) => void;
  resetFilters: () => void;
  setTab: (tab: SidebarTab) => void;
  setSidebar: (open: boolean) => void;
  setDialog: (dialog: 'settings' | 'backup' | null) => void;
  setEditorOpen: (open: boolean) => void;
}>((set) => ({
  filters: DEFAULT_FILTERS,
  tab: 'explore',
  sidebarOpen: true,
  dialog: null,
  editorOpen: false,
  setFilters: (filters) => set((state) => ({ filters: { ...state.filters, ...filters } })),
  resetFilters: () => set({ filters: DEFAULT_FILTERS }),
  setTab: (tab) => set({ tab }),
  setSidebar: (sidebarOpen) => set({ sidebarOpen }),
  setDialog: (dialog) => set({ dialog }),
  setEditorOpen: (editorOpen) => set({ editorOpen }),
}));
export const useUserStore = create<UserData>(() => structuredClone(EMPTY_USER_DATA));
export const useWorkspaceStore = create<{
  workspaceId: string | null;
  switching: boolean;
  revision: number;
}>(() => ({ workspaceId: null, switching: false, revision: 0 }));
export const usePersistenceStore = create<{
  status: 'loading' | 'saved' | 'saving' | 'error';
  error: string;
  offline: boolean;
  ready: boolean;
}>(() => ({
  status: 'loading',
  error: '',
  offline: typeof navigator !== 'undefined' && !navigator.onLine,
  ready: false,
}));

let generation = 0;
let publication = 0;
export async function hydrateUserData() {
  if (useWorkspaceStore.getState().switching || pending) return;
  const requestedGeneration = generation;
  const requestedPublication = ++publication;
  const repository = atlasRepository;
  try {
    const data = await repository.load();
    if (
      requestedGeneration !== generation ||
      requestedPublication !== publication ||
      repository !== atlasRepository
    )
      return;
    useUserStore.setState(data);
    usePersistenceStore.setState({ status: 'saved', error: '', ready: true });
  } catch {
    if (
      requestedGeneration !== generation ||
      requestedPublication !== publication ||
      repository !== atlasRepository
    )
      return;
    usePersistenceStore.setState({
      status: 'error',
      ready: false,
      error:
        'O armazenamento local não está disponível. Confira as permissões de armazenamento do navegador e tente de novo. Seus dados não foram apagados.',
    });
  }
}
let writeQueue: Promise<unknown> = Promise.resolve();
let pending = 0;

/** Drain accepted writes before changing databases; never display a previous identity's data. */
export function switchLocalWorkspace(workspaceId: string | null): Promise<void> {
  const name = workspaceDatabaseName(workspaceId);
  const current = useWorkspaceStore.getState();
  if (
    !current.switching &&
    current.workspaceId === workspaceId &&
    usePersistenceStore.getState().ready
  )
    return Promise.resolve();
  const requestedGeneration = ++generation;
  useWorkspaceStore.setState({ switching: true, revision: requestedGeneration });
  usePersistenceStore.setState({ status: 'loading', ready: false, error: '' });
  useUserStore.setState(structuredClone(EMPTY_USER_DATA));
  useUiStore.setState({
    dialog: null,
    editorOpen: false,
    filters: DEFAULT_FILTERS,
    tab: 'explore',
  });
  useMapStore.setState({ selectedId: null, focus: null, editorMode: 'none', draftPosition: null });
  const operation = writeQueue.then(async () => {
    const previous = atlasRepository;
    const repository = previous.name === name ? previous : new AtlasDatabase(name);
    replaceAtlasRepository(repository);
    if (previous !== repository) previous.close();
    useWorkspaceStore.setState({ workspaceId });
    try {
      const data = await repository.load();
      if (requestedGeneration !== generation) return;
      useUserStore.setState(data);
      useWorkspaceStore.setState({ switching: false });
      usePersistenceStore.setState({ status: 'saved', ready: true, error: '' });
    } catch (error) {
      if (requestedGeneration === generation) {
        useWorkspaceStore.setState({ switching: false });
        usePersistenceStore.setState({
          status: 'error',
          ready: false,
          error: 'Não foi possível abrir este espaço de trabalho. Confira as permissões de armazenamento do navegador e tente de novo.',
        });
      }
      throw error;
    }
  });
  // A failed switch must not poison subsequent transitions or local writes.
  writeQueue = operation.catch(() => undefined);
  return operation;
}

export async function deleteLocalWorkspace(workspaceId: string): Promise<void> {
  const name = workspaceDatabaseName(workspaceId);
  const operation = writeQueue.then(async () => {
    if (name === atlasRepository.name) throw new Error('Não é possível apagar o espaço de trabalho ativo.');
    await new AtlasDatabase(name).delete();
  });
  writeQueue = operation.catch(() => undefined);
  await operation;
}

function assertWorkspace(workspaceId: string | null, expectedGeneration: number): void {
  const state = useWorkspaceStore.getState();
  if (
    state.switching ||
    state.workspaceId !== workspaceId ||
    generation !== expectedGeneration ||
    !usePersistenceStore.getState().ready
  )
    throw new Error(
      'O espaço de trabalho ativo mudou ou não está disponível. Tente de novo a partir da conta atual.',
    );
}

export async function exportWorkspaceBackup(workspaceId: string | null) {
  const expectedGeneration = generation;
  assertWorkspace(workspaceId, expectedGeneration);
  await writeQueue;
  assertWorkspace(workspaceId, expectedGeneration);
  const backup = await atlasRepository.exportBackup();
  assertWorkspace(workspaceId, expectedGeneration);
  return backup;
}

export async function importWorkspaceBackup(
  workspaceId: string | null,
  value: unknown,
): Promise<void> {
  const expectedGeneration = generation;
  assertWorkspace(workspaceId, expectedGeneration);
  const backup = parseBackup(value);
  const saved = await saveLocal(async () => {
    assertWorkspace(workspaceId, expectedGeneration);
    await atlasRepository.importBackup(backup);
  });
  assertWorkspace(workspaceId, expectedGeneration);
  if (!saved)
    throw new Error(usePersistenceStore.getState().error || 'Não foi possível importar o backup.');
}

/** Serialize local writes; publish success only after the transaction and reload complete. */
export function saveLocal(action: () => Promise<void>): Promise<boolean> {
  if (useWorkspaceStore.getState().switching || !usePersistenceStore.getState().ready)
    return Promise.resolve(false);
  const requestedGeneration = generation;
  const repository = atlasRepository;
  publication++;
  pending++;
  usePersistenceStore.setState({ status: 'saving', error: '' });
  const operation = writeQueue.then(async () => {
    try {
      await action();
      const data = await repository.load();
      pending--;
      if (requestedGeneration !== generation) return false;
      useUserStore.setState(data);
      usePersistenceStore.setState({
        status: pending ? 'saving' : 'saved',
        error: '',
        ready: true,
      });
      atlasRegistry.emit('saved', undefined);
      return true;
    } catch (error) {
      pending--;
      if (useWorkspaceStore.getState().switching) return false;
      usePersistenceStore.setState({
        status: 'error',
        error:
          error instanceof ConflictError
            ? 'Existe uma versão mais nova em outra aba ou importação. Guarde seu rascunho e recarregue a versão salva antes de editar de novo.'
            : 'Não foi possível salvar neste aparelho. Libere espaço ou confira as permissões e tente de novo. Os dados existentes foram preservados.',
      });
      return false;
    }
  });
  writeQueue = operation;
  return operation;
}
