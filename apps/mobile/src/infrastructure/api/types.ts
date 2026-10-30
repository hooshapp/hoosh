import type { AuthSessionPort } from '@disconnect/contracts';

export type ApiFetch = (url: string, init?: RequestInit) => Promise<Response>;
export type RequestAccount = Readonly<{ user_id: string; sessionGeneration: number }>;
export type ResponseContext = Readonly<{ account: RequestAccount | null; requestId?: string }>;
export type ResponseDecoder<T> = (value: unknown, context: ResponseContext) => T;
export type ApiClientOptions = {
  baseUrl?: string | null;
  auth?: AuthSessionPort;
  fetcher?: ApiFetch;
  timeoutMs?: number;
  /** Wall-clock checks reject overdue work after a suspended JS timer resumes. */
  now?: () => number;
};
type CommonOptions = {
  authenticated?: boolean;
  method?: string;
  headers?: HeadersInit;
  signal?: AbortSignal;
} & ({ json?: unknown; body?: never } | { body?: BodyInit; json?: never });
export type JsonRequestOptions<T> = CommonOptions & {
  response?: 'json';
  decode: ResponseDecoder<T>;
};
export type EmptyRequestOptions = CommonOptions & { response: 'empty'; decode?: never };
export type RequestOptions<T> = JsonRequestOptions<T> | EmptyRequestOptions;
