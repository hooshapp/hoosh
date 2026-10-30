import { ApiError } from './errors';

/** One deadline covers credentials, recovery, transport, body parsing and decoding. */
export function createRequestOperation(
  timeoutMs: number,
  caller: AbortSignal | undefined,
  now: () => number,
) {
  const controller = new AbortController();
  const deadline = now() + timeoutMs;
  let failure: ApiError | undefined;
  let rejectStopped: (reason: ApiError) => void = () => {};
  const stopped = new Promise<never>((_, reject) => {
    rejectStopped = reject;
  });
  void stopped.catch(() => {});
  const stop = (reason: ApiError) => {
    if (failure) return;
    failure = reason;
    controller.abort();
    rejectStopped(reason);
  };
  const check = () => {
    if (!failure && now() >= deadline) stop(new ApiError('timeout'));
    if (failure) throw failure;
  };
  const onAbort = () => stop(new ApiError('cancelled'));
  const timer = setTimeout(() => stop(new ApiError('timeout')), timeoutMs);
  caller?.addEventListener('abort', onAbort);
  if (caller?.aborted) onAbort();
  return {
    signal: controller.signal,
    stop,
    check,
    async run<T>(work: () => T | PromiseLike<T>): Promise<T> {
      check();
      const result = await Promise.race([
        Promise.resolve().then(() => {
          check();
          return work();
        }),
        stopped,
      ]);
      check();
      return result;
    },
    dispose() {
      clearTimeout(timer);
      caller?.removeEventListener('abort', onAbort);
    },
  };
}
export type RequestOperation = ReturnType<typeof createRequestOperation>;
/** An abort-ignoring transport must not make us consume a late body. */
export function discardResponse(response: Response) {
  try {
    void response.body?.cancel().catch(() => {});
  } catch {
    /* Already locked/consumed. */
  }
}
