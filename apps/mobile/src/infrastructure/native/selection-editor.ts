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
/** Trusted caller must invalidate/unmount old UI before invoking; local only, no Auth deletion. */
export interface SelectionOwnerLifecyclePort {
  selectionEndOwner(owner: string, eraseLocalSelection: boolean): Promise<unknown>;
}
export type SavedSelectionSummary = Readonly<{ owner: string; revision: number; selectedAppCount: number; needsReselection?: boolean }>;
export function decodeSavedSelection(value: unknown, owner: string): SavedSelectionSummary {
  if (!value || typeof value !== 'object') throw new Error('Invalid saved selection');
  const v = value as Record<string, unknown>;
  if (v.owner !== owner || !Number.isSafeInteger(v.revision) || (v.revision as number) < 0 || (v.revision as number) > 2147483647 ||
      !Number.isSafeInteger(v.selectedAppCount) || (v.selectedAppCount as number) < 0 || (v.selectedAppCount as number) > 512 ||
      (v.revision === 0 && v.selectedAppCount !== 0) ||
      (v.needsReselection !== undefined && typeof v.needsReselection !== 'boolean')) throw new Error('Invalid saved selection');
  return { owner, revision: v.revision as number, selectedAppCount: v.selectedAppCount as number,
    ...(v.needsReselection === undefined ? {} : { needsReselection: v.needsReselection }) };
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
