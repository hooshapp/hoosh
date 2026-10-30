import type { AuthAccountActions, AuthSessionPort, AuthSnapshot, SignOutResult } from '@disconnect/contracts';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';
import type { AuthRuntime } from '@/infrastructure/auth/supabase';
import { INITIAL_LINK_STATE, type LinkState, type PendingLink, type SocialProvider, callbackBase, callbackKey, parsePendingLink, validateCallback } from './link-flow';
import { AuthUnavailableError } from '../../infrastructure/auth/errors';

/** Auth owns tokens internally; subscribers only see the canonical safe snapshot. */
export class SessionController implements AuthSessionPort, AuthAccountActions {
  private snapshot: AuthSnapshot = { status: 'bootstrapping', sessionGeneration: 0 };
  private listeners = new Set<() => void>();
  private runtime: AuthRuntime | null = null;
  private session: Session | null = null;
  private identityKey: string | null = null;
  private recoveryEventKey: string | null = null;
  private subscription: { unsubscribe(): void } | null = null;
  private revision = 0;
  private run = 0;
  private active = false;
  private foreground = false;
  private suspended = false;
  private operation: Promise<void> | null = null;
  private refresh: Promise<void> | null = null;
  private links: LinkState = INITIAL_LINK_STATE;
  private actionEpoch = 0;
  private callbacks = new Map<string, Promise<string>>();
  readonly getLinkSnapshot = () => this.links;
  private lastSignOut: SignOutResult | null = null;
  readonly getLastSignOutResult = () => this.lastSignOut;
  private logout: Promise<SignOutResult> | null = null;

  constructor(private readonly factory: () => AuthRuntime) {}
  readonly getSnapshot = () => this.snapshot;
  readonly subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  };
  private publishLinks(next: LinkState) {
    this.links = Object.freeze(next);
    for (const listener of this.listeners) listener();
  }
  private async savePending(pending: PendingLink | null) {
    if (!this.runtime) throw new AuthUnavailableError('configuration', false);
    const key = this.runtime.config.storageKey + '.pending';
    if (pending) await this.runtime.storage.setItem(key, JSON.stringify(pending));
    else await this.runtime.storage.removeItem(key);
    this.publishLinks({ ...this.links, pending });
  }
  private publish(next: AuthSnapshot) {
    if (JSON.stringify(next) === JSON.stringify(this.snapshot)) return;
    this.snapshot = Object.freeze(next);
    for (const listener of this.listeners) listener();
  }
  private unavailable(reason: 'configuration' | 'storage' | 'bootstrap', retryable = true) {
    this.publish({ status: 'unavailable', reason, retryable, sessionGeneration: this.snapshot.sessionGeneration });
  }
  private adopt(event: AuthChangeEvent, session: Session | null) {
    this.revision++;
    if (this.suspended || !this.active || this.snapshot.status === 'unavailable') return;
    if (!session) {
      const changed = this.identityKey !== null;
      this.session = null; this.identityKey = null; this.recoveryEventKey = null;
      if (this.links.draftName) this.publishLinks({ ...this.links, draftName: null });
      this.publish({ status: 'signed_out', sessionGeneration: this.snapshot.sessionGeneration + (changed ? 1 : 0) });
      return;
    }
    // session_id is routing metadata only. The backend must verify access tokens.
    let sid = '';
    try {
      const payload = session.access_token.split('.')[1];
      const parsed: unknown = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
      if (parsed && typeof parsed === 'object' && 'session_id' in parsed && typeof parsed.session_id === 'string') sid = parsed.session_id;
    } catch { /* An opaque test/provider token can still be refreshed through the SDK. */ }
    const key = `${session.user.id}:${sid}`;
    const replacement = this.identityKey !== key ||
      (!sid && event === 'SIGNED_IN' && this.session?.access_token !== session.access_token);
    if (event === 'PASSWORD_RECOVERY') this.recoveryEventKey = key;
    else if (this.identityKey !== key) this.recoveryEventKey = null;
    if (this.identityKey !== key && this.links.draftName) this.publishLinks({ ...this.links, draftName: null });
    this.identityKey = key; this.session = session;
    this.publish({ status: 'signed_in', sessionGeneration: this.snapshot.sessionGeneration + (replacement ? 1 : 0),
      user: Object.freeze({ user_id: session.user.id, email: session.user.email ?? null }),
      credentialStatus: (session.expires_at ?? 0) > Date.now() / 1000 ? 'ready' : 'unavailable' });
  }

  /** Safe to restart after provider effect cleanup; one client and listener per controller. */
  readonly start = async () => {
    this.stop(); this.active = true;
    const run = ++this.run;
    const current = () => this.active && run === this.run;
    let stage: 'storage' | 'bootstrap' = 'storage';
    this.publish({ status: 'bootstrapping', sessionGeneration: this.snapshot.sessionGeneration });
    // Keep the serialized storage queue intact if native I/O stalls. Expire this
    // restore's authority, rather than racing later writes/removals past it.
    const deadline = setTimeout(() => {
      if (!current()) return;
      this.subscription?.unsubscribe(); this.subscription = null; this.run++; this.actionEpoch++;
      this.unavailable(stage);
    }, 20000);
    try {
      if (this.suspended) await this.signOut();
      if (!current()) return;
      this.runtime ??= this.factory();
      const auth = this.runtime.client.auth;
      let restoring = true;
      let queued: { event: AuthChangeEvent; session: Session | null } | null = null;
      this.subscription = auth.onAuthStateChange((event, session) => {
        if (!current() || event === 'INITIAL_SESSION') return;
        if (restoring) queued = { event, session };
        else this.adopt(event, session);
      }).data.subscription;
      const marker = await this.runtime.storage.getItem(this.runtime.config.storageKey + '.logout');
      if (!current()) return;
      if (marker === '1') { this.suspended = true; await this.signOut(); }
      if (!current()) return;
      const rawPending = await this.runtime.storage.getItem(this.runtime.config.storageKey + '.pending');
      if (!current()) return;
      const pending = parsePendingLink(rawPending);
      if (rawPending && !pending) { this.suspended = true; await this.signOut(); }
      if (!current()) return;
      this.publishLinks({ ...this.links, pending, processing: false });
      stage = 'bootstrap';
      const { data, error } = await auth.getSession();
      if (!current()) return;
      stage = 'storage';
      const rawDraft = await this.runtime.storage.getItem(this.runtime.config.storageKey + '.signup-name');
      if (!current()) return;
      let draft: { userId?: unknown; name?: unknown } | null = null;
      try { draft = rawDraft ? JSON.parse(rawDraft) : null; } catch { /* clear malformed data below */ }
      let newer = queued as { event: AuthChangeEvent; session: Session | null } | null;
      let candidate = newer ? newer.session : data.session;
      if (rawDraft && (!candidate || draft?.userId !== candidate.user.id || typeof draft.name !== 'string' || draft.name.length > 320)) {
        await this.runtime.storage.removeItem(this.runtime.config.storageKey + '.signup-name');
        if (!current()) return;
        draft = null;
      }
      newer = queued as { event: AuthChangeEvent; session: Session | null } | null;
      candidate = newer ? newer.session : data.session;
      if (error && !newer) { stage = 'bootstrap'; throw error; }
      restoring = false;
      this.adopt(newer?.event ?? 'INITIAL_SESSION', candidate);
      if (candidate && draft?.userId === candidate.user.id && typeof draft.name === 'string' && draft.name.length <= 320) {
        this.publishLinks({ ...this.links, draftName: draft.name });
      }
      this.setForeground(this.foreground);
    } catch (error) {
      if (!current()) return;
      this.subscription?.unsubscribe(); this.subscription = null; this.run++;
      this.unavailable(error instanceof AuthUnavailableError && error.reason === 'configuration' ? 'configuration' :
        error instanceof AuthUnavailableError && error.reason === 'storage' ? 'storage' : stage,
      !(error instanceof AuthUnavailableError && !error.retryable));
    } finally { clearTimeout(deadline); }
  };
  readonly stop = () => {
    this.active = false; this.run++; this.actionEpoch++;
    this.subscription?.unsubscribe(); this.subscription = null;
    void this.runtime?.client.auth.stopAutoRefresh().catch(() => undefined);
  };
  readonly setForeground = (foreground: boolean) => {
    this.foreground = foreground;
    const auth = this.runtime?.client.auth;
    if (!auth || !this.active) return;
    void (foreground && !this.suspended && this.snapshot.status !== 'unavailable' && this.snapshot.status !== 'bootstrapping' ? auth.startAutoRefresh() : auth.stopAutoRefresh()).catch(() => undefined);
  };
  private requireRuntime() {
    if (!this.runtime) throw new AuthUnavailableError('configuration', false);
    if (this.suspended || this.snapshot.status === 'bootstrapping' || this.snapshot.status === 'signing_out') throw new AuthUnavailableError('not_ready');
    if (this.snapshot.status === 'unavailable') throw new AuthUnavailableError(this.snapshot.reason === 'storage' ? 'storage' : 'not_ready');
    return this.runtime;
  }
  readonly signIn = (email: string, password: string): Promise<void> => {
    if (this.operation || this.logout) return Promise.reject(new AuthUnavailableError('not_ready'));
    const work = async () => {
      const { client } = this.requireRuntime();
      if (this.session && this.links.pending) throw new AuthUnavailableError('not_ready');
      await this.savePending(null);
      this.callbacks.clear(); this.actionEpoch++; this.lastSignOut = null;
      const run = this.run;
      const { data, error } = await client.auth.signInWithPassword({ email: email.trim(), password });
      if (error) throw error;
      if (!data.session) throw new AuthUnavailableError('not_ready');
      if (this.active && run === this.run && !this.suspended) this.adopt('SIGNED_IN', data.session);
    };
    this.operation = work().finally(() => { this.operation = null; });
    return this.operation;
  };
  private exclusive<T>(work: () => Promise<T>): Promise<T> {
    if (this.operation || this.logout) return Promise.reject(new AuthUnavailableError('not_ready'));
    const result = work().finally(() => {
      if (this.operation === operation) this.operation = null;
    });
    const operation = result.then(() => undefined, () => undefined);
    this.operation = operation;
    return result;
  }
  private newLink(kind: PendingLink['kind'], email: string, webOrigin?: string, name?: string): PendingLink {
    const id = globalThis.crypto.randomUUID();
    return { id, kind, email: email.trim(), ...(name ? { displayName: name } : {}),
      createdAt: Date.now(), lastSentAt: Date.now(), phase: 'requested', redirectUrl: `${callbackBase(webOrigin)}?flow=${id}` };
  }
  /** Only the SDK validates identity tokens. Native credentials never enter snapshots/storage. */
  readonly signInWithApple = (request: () => Promise<{ token: string; nonce: string; displayName?: string }>) => this.exclusive(async () => {
    const runtime = this.requireRuntime();
    if (this.session || this.links.pending) throw new AuthUnavailableError('not_ready');
    const run = this.run; const epoch = ++this.actionEpoch;
    const credentials = await request();
    const current = () => this.active && run === this.run && epoch === this.actionEpoch && !this.suspended;
    if (!current()) throw new AuthUnavailableError('not_ready');
    this.callbacks.clear(); this.lastSignOut = null;
    const { data, error } = await runtime.client.auth.signInWithIdToken({ provider: 'apple', token: credentials.token, nonce: credentials.nonce });
    if (!current()) throw new AuthUnavailableError('not_ready');
    if (error) throw error;
    if (!data.session) throw new AuthUnavailableError('not_ready');
    this.adopt('SIGNED_IN', data.session);
    if (credentials.displayName) await this.recordName({ ...this.newLink('signup', ''), displayName: credentials.displayName.slice(0, 320) }, data.session.user.id);
  });
  /** Release the action lock before opening the browser so callbacks can exchange. */
  readonly beginOAuth = (provider: SocialProvider, webOrigin?: string) => this.exclusive(async () => {
    const runtime = this.requireRuntime();
    if (this.session || this.links.pending) throw new AuthUnavailableError('not_ready');
    const run = this.run; const epoch = ++this.actionEpoch;
    const pending = { ...this.newLink('oauth', '', webOrigin), provider };
    this.callbacks.clear(); this.lastSignOut = null;
    await this.savePending(pending);
    // Failed attempts remain gated until cancellation removes the SDK verifier.
    if (!this.active || run !== this.run || epoch !== this.actionEpoch || this.suspended) throw new AuthUnavailableError('not_ready');
    const { data, error } = await runtime.client.auth.signInWithOAuth({ provider, options: { redirectTo: pending.redirectUrl, skipBrowserRedirect: true } });
    if (!this.active || run !== this.run || epoch !== this.actionEpoch || this.suspended) throw new AuthUnavailableError('not_ready');
    if (error) throw error;
    const target = new URL(data.url ?? '');
    if (target.origin !== runtime.config.url || target.pathname !== '/auth/v1/authorize' || target.username || target.password || target.hash ||
      target.searchParams.get('provider') !== provider || target.searchParams.get('redirect_to') !== pending.redirectUrl ||
      target.searchParams.get('code_challenge_method') !== 's256' || !target.searchParams.get('code_challenge')) throw new AuthUnavailableError('configuration', false);
    return { url: target.toString(), redirectUrl: pending.redirectUrl, flowId: pending.id };
  });
  readonly signUp = (email: string, password: string, name: string, webOrigin?: string) => this.exclusive(async () => {
    const runtime = this.requireRuntime();
    if (this.session) throw new AuthUnavailableError('not_ready');
    const pending = this.newLink('signup', email, webOrigin, name.slice(0, 320));
    await this.savePending(pending);
    const epoch = ++this.actionEpoch;
    const { data, error } = await runtime.client.auth.signUp({ email: email.trim(), password,
      options: { emailRedirectTo: pending.redirectUrl } });
    if (epoch !== this.actionEpoch || this.suspended) throw new AuthUnavailableError('not_ready');
    if (error) {
      await this.savePending(null);
      if (error.code === 'user_already_exists' || error.code === 'email_exists') return;
      throw error;
    }
    if (data.session) { await this.recordName(pending, data.session.user.id); await this.savePending(null); this.adopt('SIGNED_IN', data.session); }
    // A user without a session is only awaiting confirmation, never authenticated.
  });
  private async recordName(pending: PendingLink, userId: string) {
    if (!pending.displayName || !this.runtime) return;
    await this.runtime.storage.setItem(this.runtime.config.storageKey + '.signup-name', JSON.stringify({ userId, name: pending.displayName }));
    this.publishLinks({ ...this.links, draftName: pending.displayName });
  }
  readonly requestConfirmation = (email: string, webOrigin?: string) => this.exclusive(async () => {
    const { client } = this.requireRuntime();
    if (this.session) throw new AuthUnavailableError('not_ready');
    const pending = this.newLink('signup', email, webOrigin);
    await this.savePending(pending);
    const epoch = ++this.actionEpoch;
    const { error } = await client.auth.resend({ type: 'signup', email: email.trim(), options: { emailRedirectTo: pending.redirectUrl } });
    if (epoch !== this.actionEpoch || this.suspended) throw new AuthUnavailableError('not_ready');
    if (error) throw error;
  });
  readonly requestRecovery = (email: string, webOrigin?: string) => this.exclusive(async () => {
    const runtime = this.requireRuntime();
    if (this.session) throw new AuthUnavailableError('not_ready');
    const pending = this.newLink('recovery', email, webOrigin);
    await this.savePending(pending);
    const epoch = ++this.actionEpoch;
    const { error } = await runtime.client.auth.resetPasswordForEmail(email.trim(), { redirectTo: pending.redirectUrl });
    if (epoch !== this.actionEpoch || this.suspended) throw new AuthUnavailableError('not_ready');
    if (error) { await this.savePending(null); throw error; }
  });
  readonly resendConfirmation = () => this.exclusive(async () => {
    const { client } = this.requireRuntime();
    const pending = this.links.pending;
    if (!pending || pending.kind !== 'signup' || pending.phase !== 'requested' || Date.now() - pending.createdAt > 3600000) throw new AuthUnavailableError('not_ready');
    if (Date.now() - pending.lastSentAt < 60000) throw { code: 'over_email_send_rate_limit' };
    // Persist cooldown even if the server rate-limits or the request goes offline.
    await this.savePending({ ...pending, lastSentAt: Date.now() });
    const { error } = await client.auth.resend({ type: 'signup', email: pending.email, options: { emailRedirectTo: pending.redirectUrl } });
    if (error) throw error;
  });
  readonly cancelLink = async () => {
    if (!this.runtime && !this.links.pending) return;
    if (this.operation) throw new AuthUnavailableError('not_ready');
    if (this.links.pending) await this.signOut();
    else { await this.savePending(null); this.actionEpoch++; this.callbacks.clear(); }
  };
  readonly handleCallback = (url: string): Promise<string> => {
    const key = callbackKey(url);
    const existing = this.callbacks.get(key);
    if (existing) return existing;
    const result = this.exclusive(async () => {
      const runtime = this.requireRuntime();
      const pending = this.links.pending;
      const code = validateCallback(url, pending);
      if (!pending || this.session) throw new Error('Finish or cancel the current account flow before opening this link.');
      const epoch = this.actionEpoch;
      await this.savePending({ ...pending, phase: 'consuming' });
      this.publishLinks({ ...this.links, processing: true });
      try {
        const { data, error } = await runtime.client.auth.exchangeCodeForSession(code);
        if (epoch !== this.actionEpoch || this.suspended) throw new AuthUnavailableError('not_ready');
        if (error || !data.session) throw new Error('This link is expired or cannot be used here. Request a new link on this device.');
        if ((pending.kind === 'recovery') !== (this.recoveryEventKey !== null && this.recoveryEventKey === this.identityKey)) throw new Error('This link does not match the requested account action.');
        this.adopt('SIGNED_IN', data.session);
        if (pending.kind === 'recovery') {
          await this.savePending({ ...pending, phase: 'recovery', sessionKey: this.identityKey ?? undefined });
          return '/(auth)/reset-password';
        }
        await this.recordName(pending, data.session.user.id);
        await this.savePending(null);
        return '/(tabs)';
      } finally { this.publishLinks({ ...this.links, processing: false }); }
    });
    this.callbacks.set(key, result);
    if (this.callbacks.size > 8) this.callbacks.delete(this.callbacks.keys().next().value!);
    return result;
  };
  readonly canResetPassword = () => this.snapshot.status === 'signed_in' &&
    this.links.pending?.kind === 'recovery' && this.links.pending.phase === 'recovery' &&
    this.links.pending.sessionKey === this.identityKey && Date.now() - this.links.pending.createdAt < 3600000;
  readonly updatePassword = (password: string) => this.exclusive(async () => {
    const { client } = this.requireRuntime();
    if (!this.canResetPassword()) throw new AuthUnavailableError('not_ready');
    const epoch = this.actionEpoch;
    const { error } = await client.auth.updateUser({ password });
    if (epoch !== this.actionEpoch || this.suspended || !this.canResetPassword()) throw new AuthUnavailableError('not_ready');
    if (error) throw error;
    // Keep recovery gate closed until the user explicitly signs out and logs in.
  });
  readonly getAccessToken = async (): Promise<string | null> => {
    if (this.snapshot.status === 'signed_out') return null;
    this.requireRuntime();
    if (this.snapshot.status !== 'signed_in' || !this.session) throw new AuthUnavailableError('not_ready');
    if ((this.session.expires_at ?? 0) <= Date.now() / 1000 + 30) await this.revalidateSession();
    if (this.getSnapshot().status !== 'signed_in' || !this.session) throw new AuthUnavailableError('not_ready');
    if (this.snapshot.credentialStatus !== 'ready') throw new AuthUnavailableError('refresh');
    return this.session.access_token;
  };
  readonly revalidateSession = (): Promise<void> => {
    if (this.refresh) return this.refresh;
    const work = async () => {
      const { client } = this.requireRuntime();
      if (this.snapshot.status !== 'signed_in') throw new AuthUnavailableError('not_ready');
      const generation = this.snapshot.sessionGeneration;
      const run = this.run;
      this.publish({ ...this.snapshot, credentialStatus: 'refreshing' });
      try {
        const { data, error } = await client.auth.refreshSession();
        if (generation !== this.snapshot.sessionGeneration || run !== this.run || this.suspended || !this.active) throw new AuthUnavailableError('not_ready');
        if (error) throw error;
        if (!data.session) throw new AuthUnavailableError('refresh');
        this.adopt('TOKEN_REFRESHED', data.session);
      } catch (error) {
        // SDK clears known-invalid refresh sessions via SIGNED_OUT. Transient
        // refresh errors retain known identity, without promising a credential.
        if (generation === this.snapshot.sessionGeneration && run === this.run && this.snapshot.status === 'signed_in') {
          this.publish({ ...this.snapshot, credentialStatus: 'unavailable' });
        }
        throw error instanceof AuthUnavailableError ? error : new AuthUnavailableError('refresh');
      }
    };
    this.refresh = work().finally(() => { this.refresh = null; });
    return this.refresh;
  };
  readonly signOut = (): Promise<SignOutResult> => {
    if (this.logout) return this.logout;
    if (!this.runtime) return Promise.reject(new AuthUnavailableError('configuration', false));
    const runtime = this.runtime;
    const wasSignedOut = this.snapshot.status === 'signed_out';
    this.actionEpoch++; this.callbacks.clear();
    this.suspended = true; this.session = null; this.identityKey = null;
    this.publish({ status: 'signing_out', sessionGeneration: this.snapshot.sessionGeneration + 1 });
    const deadline = setTimeout(() => { if (this.logout) this.unavailable('storage'); }, 20000);
    const work = async (): Promise<SignOutResult> => {
      try {
        await runtime.storage.setItem(runtime.config.storageKey + '.logout', '1');
        await runtime.client.auth.stopAutoRefresh();
        // Finish an already-started sign-in before erasing its SDK result.
        await this.operation?.catch(() => undefined);
        const { error } = await runtime.client.auth.signOut({ scope: 'local' });
        // The pinned SDK removes local credentials even on revocation failure.
        // Verify the adapter and public SDK state; never claim erasure on failure.
        if (await runtime.storage.getItem(runtime.config.storageKey) !== null) throw new AuthUnavailableError('storage');
        const check = await runtime.client.auth.getSession();
        if (check.error || check.data.session) throw new AuthUnavailableError('storage');
        await this.savePending(null);
        await runtime.storage.removeItem(runtime.config.storageKey + '.signup-name');
        await runtime.storage.removeItem(runtime.config.storageKey + '.logout');
        this.publishLinks(INITIAL_LINK_STATE);
        this.suspended = false;
        this.lastSignOut = Object.freeze({ localSessionCleared: true, remoteRevocation: wasSignedOut ? 'not_needed' : error ? 'unconfirmed' : 'confirmed' });
        this.publish({ status: 'signed_out', sessionGeneration: this.snapshot.sessionGeneration });
        return this.lastSignOut;
      } catch {
        this.unavailable('storage');
        throw new AuthUnavailableError('storage');
      }
    };
    this.logout = work().finally(() => { clearTimeout(deadline); this.logout = null; });
    return this.logout;
  };
}

