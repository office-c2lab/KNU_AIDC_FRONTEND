import test from 'node:test';
import assert from 'node:assert/strict';
import { generateKeyPairSync } from 'node:crypto';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import ssh2 from 'ssh2';
import { WebSocket } from 'ws';

test(
  'local relay authenticates, restricts target, forwards PTY and rejects ticket reuse',
  { timeout: 20000 },
  async t => {
    const dir = await mkdtemp(path.join(os.tmpdir(), 'knu-terminal-test-'));
    const { privateKey } = generateKeyPairSync('rsa', {
      modulusLength: 2048,
      privateKeyEncoding: { type: 'pkcs1', format: 'pem' },
      publicKeyEncoding: { type: 'spki', format: 'pem' },
    });
    const keyPath = path.join(dir, 'fixture.pem');
    await writeFile(keyPath, privateKey, { mode: 0o600 });
    const fake = new ssh2.Server({ hostKeys: [privateKey] }, client => {
      client.on('authentication', ctx => ctx.accept());
      client.on('ready', () =>
        client.on('session', accept => {
          const session = accept();
          session.on('pty', acceptPty => acceptPty());
          session.on('window-change', acceptResize => acceptResize?.());
          session.on('shell', acceptShell => {
            const channel = acceptShell();
            channel.write('fixture ready\r\n');
            channel.on('data', bytes => channel.write(bytes));
          });
        })
      );
    });
    fake.listen(0, '127.0.0.1');
    await once(fake, 'listening');
    const child = spawn(process.execPath, [path.resolve('server/terminal-server.mjs')], {
      cwd: dir,
      env: {
        ...process.env,
        SSH_HOST: '127.0.0.1',
        SSH_PORT: String(fake.address().port),
        SSH_USER: 'fixture',
        SSH_KEY_PATH: keyPath,
        TERMINAL_PORT: '0',
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    t.after(async () => {
      child.kill();
      fake.close();
      await rm(dir, { recursive: true, force: true });
    });
    const startup = await new Promise((resolve, reject) => {
      let output = '';
      child.stdout.on('data', data => {
        output += data;
        if (output.includes('로컬 인증이 자동으로 처리됩니다.')) resolve(output);
      });
      child.once('exit', code => reject(new Error(`Relay exited ${code}`)));
      child.stderr.on('data', data => reject(new Error(String(data))));
    });
    const base = startup.match(/http:\/\/127\.0\.0\.1:\d+/)[0];
    const bootstrap = origin =>
      fetch(`${base}/api/terminal/access`, {
        method: 'POST',
        headers: origin ? { Origin: origin } : {},
      });
    assert.equal((await bootstrap('https://untrusted.invalid')).status, 403);
    assert.equal((await bootstrap()).status, 403);
    assert.equal((await fetch(`${base}/api/terminal/access`)).status, 404);
    const access = await bootstrap('http://localhost:5173');
    assert.equal(access.status, 200);
    assert.equal(access.headers.get('cache-control'), 'no-store');
    const { token } = await access.json();
    assert.equal(typeof token, 'string');
    const request = (body, auth = token, origin = 'http://localhost:5173') =>
      fetch(`${base}/api/terminal/sessions`, {
        method: 'POST',
        headers: {
          Origin: origin,
          Authorization: `Bearer ${auth}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
    const target = { rackId: 'SRV-01', device: 'server' };
    assert.equal((await request(target, 'wrong')).status, 401);
    assert.equal((await request(target, token, 'https://untrusted.invalid')).status, 403);
    assert.equal((await request({ ...target, device: 'gpu' })).status, 409);
    assert.equal((await request({ ...target, rackId: 'SRV-99' })).status, 409);
    assert.equal((await request({ ...target, rackId: 'SEC-DESK-01' })).status, 409);
    assert.equal((await request({ ...target, device: 'unknown' })).status, 409);
    for (const rackId of ['SRV-16', 'GPU-06', 'LIQ-GPU-04']) {
      assert.equal((await request({ rackId, device: 'server' })).status, 201);
      if (!rackId.startsWith('SRV-'))
        assert.equal((await request({ rackId, device: 'gpu' })).status, 201);
    }
    const response = await request(target);
    assert.equal(response.status, 201);
    const { path: socketPath } = await response.json();
    const url = base.replace('http:', 'ws:') + socketPath;
    const ws = new WebSocket(url, { origin: 'http://localhost:5173' });
    t.after(() => ws.terminate());
    const echoed = new Promise((resolve, reject) => {
      ws.on('error', reject);
      ws.on('message', bytes => {
        const message = JSON.parse(bytes);
        if (message.type === 'error') reject(new Error(message.message));
        if (message.type === 'status') {
          ws.send(JSON.stringify({ type: 'resize', cols: 120, rows: 30 }));
          ws.send(JSON.stringify({ type: 'input', data: 'echo-test\r' }));
        }
        if (
          message.type === 'data' &&
          Buffer.from(message.data, 'base64').toString().includes('echo-test')
        )
          resolve();
      });
    });
    await echoed;
    const reused = new WebSocket(url, { origin: 'http://localhost:5173' });
    await new Promise(resolve => {
      reused.on('unexpected-response', (_req, res) => {
        assert.equal(res.statusCode, 403);
        res.resume();
        reused.terminate();
        resolve();
      });
      reused.on('error', () => {});
    });
    ws.close();
    await once(ws, 'close');
  }
);
