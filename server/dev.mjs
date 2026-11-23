import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';

const projectRoot = fileURLToPath(new URL('../', import.meta.url));
process.chdir(projectRoot);
const children = new Set();
let stopping = false;
function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  process.exitCode = code;
  for (const child of children) child.kill('SIGTERM');
}
function start(args) {
  const child = spawn(process.execPath, args, { cwd: projectRoot, stdio: 'inherit' });
  children.add(child);
  child.on('error', error => {
    console.error(`개발 서버 실행 실패: ${error.message}`);
    stop(1);
  });
  child.on('exit', (code, signal) => {
    children.delete(child);
    if (!stopping) stop(code ?? (signal ? 1 : 0));
  });
  return child;
}
async function relayReady() {
  try {
    const response = await fetch('http://127.0.0.1:3001/api/terminal/health', {
      signal: AbortSignal.timeout(500),
    });
    const data = await response.json();
    if (response.ok && data.service === 'knu-terminal-relay') return true;
    throw new Error('3001번 포트를 다른 서비스가 사용 중입니다.');
  } catch (error) {
    if (error.message.includes('다른 서비스')) throw error;
    if (error.cause?.code === 'ECONNREFUSED' || error.name === 'TimeoutError') return false;
    throw new Error(
      '3001번 포트의 서비스를 확인하지 못했습니다. 기존 중계 서버를 종료하고 다시 실행하세요.'
    );
  }
}
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => stop());
try {
  if (!(await relayReady())) {
    start(['--env-file=.terminal.env', 'server/terminal-server.mjs']);
    let ready = false;
    for (let attempt = 0; attempt < 100 && !stopping; attempt++) {
      if (await relayReady()) {
        ready = true;
        break;
      }
      await delay(100);
    }
    if (!ready && !stopping)
      throw new Error('SSH 중계 서버가 시작되지 않았습니다. .terminal.env와 키 경로를 확인하세요.');
  } else console.log('실행 중인 로컬 SSH 중계 서버를 사용합니다.');
  if (!stopping) start(['node_modules/vite/bin/vite.js', ...process.argv.slice(2)]);
} catch (error) {
  console.error(error.message);
  stop(1);
}
