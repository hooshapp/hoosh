/** Explicit native transaction port. It does not authenticate the owner or install rules. */
export type SelectionDraft = Readonly<{
  draftId: string;
  groupId: 'global';
  baseRevision: number;
  draftVersion: number;
  selectedAppCount: number;
  savedAppCount: number;
  dirty: boolean;
}>;
export interface SelectionEditorPort {
  selectionBegin(owner: string): Promise<unknown>;
  selectionPick(owner: string, draftId: string, draftVersion: number): Promise<unknown>;
  selectionCommit(owner: string, draftId: string, draftVersion: number): Promise<unknown>;
  selectionRelease(owner: string, draftId: string): Promise<unknown>;
}
export function decodeSelectionDraft(value: unknown): SelectionDraft {
  if (!value || typeof value !== 'object') throw new Error('Invalid selection response');
  const v = value as Record<string, unknown>;
  if (typeof v.draftId !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(v.draftId) || v.groupId !== 'global' || typeof v.dirty !== 'boolean')
    throw new Error('Invalid selection response');
  for (const key of ['baseRevision', 'draftVersion', 'selectedAppCount', 'savedAppCount']) {
    if (!Number.isSafeInteger(v[key]) || (v[key] as number) < 0 || (v[key] as number) > 2147483647)
      throw new Error('Invalid selection response');
  }
  if ((v.selectedAppCount as number) > 512 || (v.savedAppCount as number) > 512 ||
    (!v.dirty && v.selectedAppCount !== v.savedAppCount) || (v.baseRevision === 0 && v.savedAppCount !== 0))
    throw new Error('Invalid selection response');
  return {
    draftId: v.draftId, groupId: 'global', baseRevision: v.baseRevision as number,
    draftVersion: v.draftVersion as number, selectedAppCount: v.selectedAppCount as number,
    savedAppCount: v.savedAppCount as number, dirty: v.dirty,
  }; // Never retain inventory extras or native exception text.
}
