import { createServer, type RequestListener } from 'node:http';
import { expect, it } from 'vitest';
import { createApiClient } from './client';
import { decodeIdentity } from './decoders';
import { identity, makeAuth, SYNTHETIC_TOKEN } from './__tests__/support';

async function localServer(handler: RequestListener) {
  const server = createServer(handler);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Expected a TCP test listener.');
  return {
    origin: `http://127.0.0.1:${address.port}`,
    close: () =>
      new Promise<void>((resolve, reject) => {
        server.closeAllConnections();
        server.close((error) => (error ? reject(error) : resolve()));
      }),
  };
}

it('the default Fetch transport refuses a redirect without sending the bearer to its target', async () => {
  let targetCalls = 0;
  let sourceAuthorization: string | undefined;
  const target = await localServer((_request, response) => {
    targetCalls++;
    response.end('{}');
  });
  const source = await localServer((request, response) => {
    sourceAuthorization = request.headers.authorization;
    response.writeHead(307, { Location: target.origin + '/capture' });
    response.end();
  });
  try {
    const auth = makeAuth();
    const api = createApiClient({ baseUrl: source.origin, auth: auth.port });
    await expect(api.request('/redirect', { decode: decodeIdentity })).rejects.toMatchObject({
      kind: 'network',
    });
    expect(sourceAuthorization).toBe(`Bearer ${SYNTHETIC_TOKEN}`);
    expect(targetCalls).toBe(0);
    expect(auth.listenerCount).toBe(0);
  } finally {
    await source.close();
    await target.close();
  }
});

it('the real Fetch body stream is bounded by the whole-operation deadline', async () => {
  const source = await localServer((_request, response) => {
    response.writeHead(200, { 'Content-Type': 'application/json' });
    response.write(JSON.stringify(identity()).slice(0, 10));
  });
  try {
    const auth = makeAuth();
    const api = createApiClient({ baseUrl: source.origin, auth: auth.port, timeoutMs: 100 });
    await expect(api.request('/hanging-body', { decode: decodeIdentity })).rejects.toMatchObject({
      kind: 'timeout',
    });
    expect(auth.listenerCount).toBe(0);
  } finally {
    await source.close();
  }
});
