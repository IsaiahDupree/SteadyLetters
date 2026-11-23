import { createServer } from 'node:http';
import { once } from 'node:events';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { authorizeCron, authorizeExternalDiagnostics } from '../src/lib/operational-guard';

test('sensitive operations fail closed over actual loopback HTTP', async () => {
  let enabled: string | undefined;
  let secret: string | undefined;
  const server = createServer((incoming, outgoing) => {
    const request = new Request(`http://127.0.0.1${incoming.url}`, { headers: incoming.headers });
    const blocked = incoming.url === '/cron'
      ? authorizeCron(request, secret)
      : authorizeExternalDiagnostics(request, enabled, secret);
    outgoing.writeHead(blocked?.status ?? 204);
    outgoing.end();
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  try {
    const address = server.address();
    assert.ok(address && typeof address !== 'string');
    const base = `http://127.0.0.1:${address.port}`;
    assert.equal((await fetch(`${base}/diagnostics`)).status, 503);
    assert.equal((await fetch(`${base}/cron`)).status, 503);
    enabled = 'true';
    assert.equal((await fetch(`${base}/diagnostics`)).status, 503);
    secret = 'local-test-secret';
    assert.equal((await fetch(`${base}/cron`)).status, 401);
    assert.equal((await fetch(`${base}/diagnostics`, { headers: { authorization: 'Bearer wrong' } })).status, 401);
    assert.equal((await fetch(`${base}/cron`, { headers: { authorization: 'Bearer local-test-secret' } })).status, 204);
    assert.equal((await fetch(`${base}/diagnostics`, { headers: { authorization: 'Bearer local-test-secret' } })).status, 204);
    enabled = 'TRUE';
    assert.equal((await fetch(`${base}/diagnostics`, { headers: { authorization: 'Bearer local-test-secret' } })).status, 503);
  } finally {
    server.closeAllConnections();
    server.close();
    await once(server, 'close');
  }
});
