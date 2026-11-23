import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { randomBytes, timingSafeEqual } from 'node:crypto';
import { WebSocketServer } from 'ws';
import ssh2 from 'ssh2';
import { DEFAULT_ASSET_CATALOG } from '../src/features/digital-twin/scene/config/assetCatalog.js';

const { Client } = ssh2;
const host = process.env.SSH_HOST;
const username = process.env.SSH_USER;
if (!host || !username || !process.env.SSH_KEY_PATH) {
  console.error('SSH_HOST, SSH_USER, SSH_KEY_PATH를 .terminal.env에 설정하세요.');
  process.exit(1);
}
let privateKey;
try {
  privateKey = fs.readFileSync(process.env.SSH_KEY_PATH);
} catch {
  console.error('SSH 키 파일을 읽지 못했습니다. SSH_KEY_PATH를 확인하세요.');
  process.exit(1);
}
const racks = new Map(
  DEFAULT_ASSET_CATALOG.filter(asset =>
    ['SERVER RACK', 'GPU SERVER RACK'].includes(asset.type)
  ).map(asset => [asset.id, asset.type])
);
const origins = new Set(
  (process.env.TERMINAL_ORIGINS || 'http://localhost:5173,http://127.0.0.1:5173').split(',')
);
const token = randomBytes(32).toString('hex');
const tickets = new Map();
const knownHostsPath = path.resolve('.terminal/known-hosts.json');
let knownHosts = {};
if (fs.existsSync(knownHostsPath)) knownHosts = JSON.parse(fs.readFileSync(knownHostsPath, 'utf8'));
const port = Number(process.env.SSH_PORT || 22);
const hostId = `${host}:${port}`;
const reply = (res, status, body) => {
  res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(body));
};
const authorized = req => {
  const value = Buffer.from(req.headers.authorization || '');
  const expected = Buffer.from(`Bearer ${token}`);
  return value.length === expected.length && timingSafeEqual(value, expected);
};
const server = http.createServer(async (req, res) => {
  if (req.url === '/api/terminal/health' && req.method === 'GET')
    return reply(res, 200, { service: 'knu-terminal-relay', status: 'ok' });
  if (
    !['/api/terminal/access', '/api/terminal/sessions'].includes(req.url) ||
    req.method !== 'POST'
  )
    return reply(res, 404, { error: 'Not found' });
  if (!origins.has(req.headers.origin))
    return reply(res, 403, { error: '허용되지 않은 브라우저 주소입니다.' });
  // Loopback-only development bootstrap. Browser origin checks remain mandatory;
  // no CORS access is granted to other sites. Never expose this as a public login.
  if (req.url === '/api/terminal/access') return reply(res, 200, { token });
  if (!authorized(req))
    return reply(res, 401, { error: '접속 인증이 만료되었습니다. 다시 접속하세요.' });
  try {
    let body = '';
    for await (const chunk of req) {
      body += chunk;
      if (body.length > 4096) return reply(res, 413, { error: '요청이 너무 큽니다.' });
    }
    const data = JSON.parse(body);
    const rackType = racks.get(data.rackId);
    const validDevice =
      data.device === 'server' || (data.device === 'gpu' && rackType === 'GPU SERVER RACK');
    if (!rackType || !validDevice)
      return reply(res, 409, {
        error: '등록된 서버 랙의 서버 또는 GPU 슬롯을 선택하세요.',
      });
    const now = Date.now();
    for (const [id, expires] of tickets) if (expires <= now) tickets.delete(id);
    if (tickets.size >= 16 || wss.clients.size >= 4)
      return reply(res, 429, { error: '열린 터미널을 닫고 다시 시도하세요.' });
    const ticket = randomBytes(32).toString('hex');
    tickets.set(ticket, now + 30000);
    reply(res, 201, { path: `/api/terminal/ws?ticket=${ticket}` });
  } catch {
    reply(res, 400, { error: '잘못된 접속 요청입니다.' });
  }
});
const wss = new WebSocketServer({ noServer: true, maxPayload: 65536 });
server.on('upgrade', (req, socket, head) => {
  const url = new URL(req.url, 'http://localhost');
  const ticket = url.searchParams.get('ticket');
  const expires = tickets.get(ticket);
  tickets.delete(ticket);
  if (
    url.pathname !== '/api/terminal/ws' ||
    !origins.has(req.headers.origin) ||
    !expires ||
    expires <= Date.now() ||
    wss.clients.size >= 4
  ) {
    socket.end('HTTP/1.1 403 Forbidden\r\nConnection: close\r\n\r\n');
    return;
  }
  wss.handleUpgrade(req, socket, head, ws => wss.emit('connection', ws));
});
wss.on('connection', ws => {
  const ssh = new Client();
  let stream;
  let fingerprint;
  let ended = false;
  const send = message => {
    if (ws.readyState === 1) ws.send(JSON.stringify(message));
  };
  const finish = () => {
    if (ended) return;
    ended = true;
    clearTimeout(lifetime);
    stream?.end();
    ssh.end();
    ws.close();
  };
  const lifetime = setTimeout(
    () => {
      send({ type: 'error', message: '30분 테스트 세션이 종료되었습니다.' });
      finish();
    },
    30 * 60 * 1000
  );
  ws.on('close', finish);
  ws.on('error', finish);
  ssh.on('error', error => {
    send({ type: 'error', message: `SSH 연결 실패: ${error.message}` });
    finish();
  });
  ssh.on('close', finish);
  ssh.on('ready', () => {
    if (ended) return ssh.end();
    // Trust on first authenticated use; subsequent host key changes are rejected.
    if (!knownHosts[hostId]) {
      try {
        knownHosts[hostId] = fingerprint;
        fs.mkdirSync(path.dirname(knownHostsPath), { recursive: true });
        fs.writeFileSync(knownHostsPath, JSON.stringify(knownHosts, null, 2), { mode: 0o600 });
      } catch {
        send({ type: 'error', message: 'SSH 호스트 키를 저장하지 못했습니다.' });
        finish();
        return;
      }
    }
    ssh.shell({ term: 'xterm-256color', cols: 100, rows: 28 }, (error, channel) => {
      if (error) {
        send({ type: 'error', message: '원격 셸을 열지 못했습니다.' });
        finish();
        return;
      }
      if (ended) return channel.end();
      stream = channel;
      send({ type: 'status', status: 'connected' });
      channel.on('data', data => {
        if (ws.bufferedAmount > 1024 * 1024) {
          finish();
          return;
        }
        // Forward bytes without splitting multibyte terminal characters.
        send({ type: 'data', data: data.toString('base64') });
      });
      channel.on('close', finish);
      channel.on('error', finish);
    });
  });
  ws.on('message', raw => {
    try {
      const message = JSON.parse(raw.toString());
      if (
        message.type === 'input' &&
        typeof message.data === 'string' &&
        message.data.length <= 16384
      )
        stream?.write(message.data);
      if (
        message.type === 'resize' &&
        Number.isInteger(message.cols) &&
        Number.isInteger(message.rows) &&
        message.cols >= 2 &&
        message.cols <= 500 &&
        message.rows >= 2 &&
        message.rows <= 200
      )
        stream?.setWindow(message.rows, message.cols, 0, 0);
    } catch {
      send({ type: 'error', message: '잘못된 터미널 메시지입니다.' });
      finish();
    }
  });
  try {
    ssh.connect({
      host,
      port,
      username,
      privateKey,
      readyTimeout: 15000,
      keepaliveInterval: 10000,
      keepaliveCountMax: 3,
      hostHash: 'sha256',
      hostVerifier: hash => {
        fingerprint = hash;
        return !knownHosts[hostId] || knownHosts[hostId] === hash;
      },
    });
  } catch {
    send({ type: 'error', message: 'SSH 키 또는 연결 설정을 확인하세요.' });
    finish();
  }
});
const listenPort = Number(process.env.TERMINAL_PORT || 3001);
server.on('error', error => {
  console.error(`터미널 서버 시작 실패: ${error.message}`);
  process.exit(1);
});
server.listen(listenPort, '127.0.0.1', () => {
  console.log(`로컬 SSH 중계: http://127.0.0.1:${server.address().port}`);
  console.log(`테스트 대상: 전체 서버 랙 ${racks.size}개 공통 → ${username}@${host}`);
  console.log('브라우저에서 접속을 누르면 로컬 인증이 자동으로 처리됩니다.');
});
for (const signal of ['SIGINT', 'SIGTERM'])
  process.on(signal, () => {
    for (const ws of wss.clients) ws.terminate();
    server.close(() => process.exit(0));
  });
