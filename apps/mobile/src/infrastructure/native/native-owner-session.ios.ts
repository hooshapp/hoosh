import type { IOSGoogleCalendarStatus } from './ios-selection-device';
import { uuid } from 'expo';
import { directGoogleCalendar, directGoogleCalendarAvailable } from './direct-google-calendar';
import { createIOSProductPort, type IOSRuntimeModule } from './ios-product-port';
import { decodeSavedSelection } from './selection-editor';
import { decodeIOSDeviceStatus } from './ios-device-status';
import { requireOptionalNativeModule } from 'expo-modules-core';
import type { InstallationReview, NativeOwnerSessionPort } from './native-owner-session';

type OwnerModule = IOSRuntimeModule & {
  refreshCalendarSources?(namespace: string, userID: string, token: string): Promise<void>;
  refreshPublicHoliday?(namespace: string, userID: string, token: string): Promise<string | null>;
  cacheHolidayNudges?(namespace: string, userID: string, token: string, name: string, messages: string[]): Promise<void>;
  setDirectGoogleCalendarContext?(namespace: string, userID: string, token: string, context: string, replaceSynced: boolean): Promise<void>;
  googleCalendarNudges?(namespace: string, userID: string, token: string, action: string, calendarID: string | null): Promise<IOSGoogleCalendarStatus>;
  calendarNudgeSettings?(namespace: string, userID: string, token: string, enabled: boolean | null): Promise<boolean>;
  remindersNudgeSettings?(namespace: string, userID: string, token: string, enabled: boolean | null): Promise<boolean>;
  questPlanningContext?(namespace: string, userID: string, token: string, directConnected: boolean): Promise<unknown>;
  cacheGeneratedNudges?(namespace: string, userID: string, token: string, activity: string, tone: string, messages: string[]): Promise<void>;
  setShieldContext?(namespace: string, userID: string, token: string, name: string, activity: string): Promise<void>;
  reviewUsageBaseline?(namespace: string, userID: string, token: string): Promise<unknown>;
  setNudgeTone?(namespace: string, userID: string, token: string, tone: string): Promise<unknown>;
  budgetCapabilities?(): Promise<unknown>;
  schedulePreview(spec: unknown): Promise<unknown>;
  selectionRead(namespace: string, userID: string, token: string): Promise<unknown>;
  selectionBegin(namespace: string, userID: string, token: string): Promise<unknown>;
  selectionPick(namespace: string, userID: string, token: string, draft: string, version: number): Promise<unknown>;
  selectionCommit(namespace: string, userID: string, token: string, draft: string, version: number): Promise<unknown>;
  selectionRelease(namespace: string, userID: string, token: string, draft: string): Promise<void>;
  deviceStatus(namespace: string, userID: string, token: string): Promise<unknown>;
  requestDeviceAuthorization(namespace: string, userID: string, token: string): Promise<unknown>;
  addListener(event: string, listener: () => void): { remove(): void };
  beginOwnerSession(namespace: string, userID: string): Promise<string>;
  endOwnerSession(token: string): Promise<void>;
  readInstallation(namespace: string, userID: string, token: string): Promise<unknown>;
  claimInstallation(namespace: string, userID: string, token: string, revision: string, confirmed: boolean): Promise<void>;
};
const module = requireOptionalNativeModule<OwnerModule>('HooshScreenTime');
// Serialize lifecycle requests even across account boundary remounts. Cleanup is
// token-specific, so a late old cleanup cannot revoke a newer account's lease.
let pending: Promise<unknown> = Promise.resolve();
function ordered<T>(operation: () => Promise<T>): Promise<T> {
  const result = pending.then(operation, operation);
  pending = result.catch(() => undefined);
  return result;
}
export const nativeOwnerSession: NativeOwnerSessionPort | null =
  typeof module?.beginOwnerSession === 'function' && typeof module?.endOwnerSession === 'function' &&
  typeof module?.readInstallation === 'function' && typeof module?.claimInstallation === 'function' ? {
    device: typeof module.selectionBegin === 'function' && typeof module.selectionPick === 'function' &&
      typeof module.selectionCommit === 'function' && typeof module.selectionRelease === 'function' &&
      typeof module.selectionRead === 'function' && typeof module.deviceStatus === 'function' &&
      typeof module.requestDeviceAuthorization === 'function' && typeof module.addListener === 'function'
      ? (namespace, userID, token, generation) => {
        const owner = `${namespace}:${userID}`;
        const check = (provided: string) => { if (provided !== owner) throw new Error('Owner changed'); };
        const selection = {
          selectionBegin: (provided: string) => { check(provided); return module.selectionBegin(namespace, userID, token); },
          selectionPick: (provided: string, draft: string, version: number) => { check(provided); return module.selectionPick(namespace, userID, token, draft, version); },
          selectionCommit: (provided: string, draft: string, version: number) => { check(provided); return module.selectionCommit(namespace, userID, token, draft, version); },
          selectionRelease: (provided: string, draft: string) => { check(provided); return module.selectionRelease(namespace, userID, token, draft); },
          selectionRead: (provided: string) => { check(provided); return module.selectionRead(namespace, userID, token); },
        };
        const port = typeof module.runtimeRead === 'function' && typeof module.runtimeApply === 'function' && typeof module.runtimeRecover === 'function' && typeof module.schedulePreview === 'function'
          ? createIOSProductPort({ namespace, userID, token, module, selection, requestID: () => uuid.v4(),
            preview: spec => module.schedulePreview(spec), review: () => module.requestDeviceAuthorization(namespace, userID, token),
            end: () => module.endOwnerSession(token), protectionRead: () => module.deviceStatus(namespace, userID, token),
            claim: async () => {
              const current = await module.readInstallation(namespace, userID, token) as { revision: string };
              await module.claimInstallation(namespace, userID, token, current.revision, true);
            },
          }) : undefined;
        return {
          owner, generation, productPort: port, recover: port?.recover,
          selection: {
            selectionBegin: provided => { check(provided); return module.selectionBegin(namespace, userID, token); },
            selectionPick: (provided, draft, version) => { check(provided); return module.selectionPick(namespace, userID, token, draft, version); },
            selectionCommit: (provided, draft, version) => { check(provided); return module.selectionCommit(namespace, userID, token, draft, version); },
            selectionRelease: (provided, draft) => { check(provided); return module.selectionRelease(namespace, userID, token, draft); },
          },
          readSelection: async () => decodeSavedSelection(await module.selectionRead(namespace, userID, token), owner),
          readStatus: async () => decodeIOSDeviceStatus(await module.deviceStatus(namespace, userID, token), owner),
          reviewUsageBaseline: module.reviewUsageBaseline ? () => module.reviewUsageBaseline!(namespace, userID, token) : undefined,
          setNudgeTone: module.setNudgeTone ? (tone: string) => module.setNudgeTone!(namespace, userID, token, tone) : undefined,
          refreshCalendarSources: module.refreshCalendarSources
            ? () => module.refreshCalendarSources!(namespace, userID, token) : undefined,
          refreshPublicHoliday: module.refreshPublicHoliday
            ? () => module.refreshPublicHoliday!(namespace, userID, token) : undefined,
          cacheHolidayNudges: module.cacheHolidayNudges
            ? (name, messages) => module.cacheHolidayNudges!(namespace, userID, token, name, messages) : undefined,
          subscribeCalendar: listener => {
            const subscription = module.addListener('onCalendarChanged', listener);
            return () => subscription.remove();
          },
          googleCalendarDirect: directGoogleCalendarAvailable && !!module.setDirectGoogleCalendarContext,
          googleCalendarNudges: directGoogleCalendarAvailable && module.setDirectGoogleCalendarContext
            ? (action) => directGoogleCalendar(owner, action,
              (context, replaceSynced) => module.setDirectGoogleCalendarContext!(namespace, userID, token, JSON.stringify(context), replaceSynced ?? false))
            : module.googleCalendarNudges
            ? (action, calendarID) => module.googleCalendarNudges!(namespace, userID, token, action, calendarID ?? null)
            : undefined,
          calendarNudgeSettings: module.calendarNudgeSettings
            ? enabled => module.calendarNudgeSettings!(namespace, userID, token, enabled ?? null)
            : undefined,
          remindersNudgeSettings: module.remindersNudgeSettings
            ? enabled => module.remindersNudgeSettings!(namespace, userID, token, enabled ?? null)
            : undefined,
          questPlanningContext: module.questPlanningContext
            ? async () => {
              const direct = directGoogleCalendarAvailable && module.setDirectGoogleCalendarContext
                ? directGoogleCalendar(owner, 'status', (context) =>
                  module.setDirectGoogleCalendarContext!(namespace, userID, token, JSON.stringify(context), false))
                : null;
              const [google] = await Promise.all([
                direct?.catch(() => undefined),
                module.remindersNudgeSettings?.(namespace, userID, token, null).catch(() => false),
              ]);
              return module.questPlanningContext!(namespace, userID, token, google?.status === 'connected');
            } : undefined,
          cacheGeneratedNudges: module.cacheGeneratedNudges
            ? (activity, tone, messages) => module.cacheGeneratedNudges!(namespace, userID, token, activity, tone, messages)
            : undefined,
          setShieldContext: module.setShieldContext ? (name: string, activity: string) => module.setShieldContext!(namespace, userID, token, name, activity) : undefined,
          budgetCapabilities: module.budgetCapabilities ? () => module.budgetCapabilities!() : undefined,
          requestAuthorization: async () => { await module.requestDeviceAuthorization(namespace, userID, token); },
          stop: async () => {
            const read = await module.readInstallation(namespace, userID, token) as { status: string; revision: string };
            if (!['owned', 'installation_pending'].includes(read.status)) throw new Error('Device owner changed');
            await module.claimInstallation(namespace, userID, token, read.revision, true);
          },
          subscribe: listener => { const subscription = module.addListener('onDeviceStatusChanged', listener); return () => subscription.remove(); },
        };
      } : undefined,
    begin: (namespace, userID) => ordered(() => module.beginOwnerSession(namespace, userID)),
    end: token => ordered(() => module.endOwnerSession(token)),
    read: (namespace, userID, token) => ordered(async () => {
      const raw = await module.readInstallation(namespace, userID, token);
      if (!raw || typeof raw !== 'object') throw new Error('Invalid installation response');
      const value = raw as Record<string, unknown>;
      if (typeof value.status !== 'string' || !['unclaimed', 'owned', 'legacy_review', 'other_owner', 'claim_pending', 'installation_pending'].includes(value.status) ||
          typeof value.revision !== 'string' || !/^(missing|[0-9]{1,20})$/.test(value.revision)) {
        throw new Error('Invalid installation response');
      }
      return value as InstallationReview;
    }),
    claim: (namespace, userID, token, revision) => ordered(() =>
      module.claimInstallation(namespace, userID, token, revision, true)),
  } : null;
