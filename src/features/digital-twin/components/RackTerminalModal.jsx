import { uiClass } from '../../../styles/interfaceStyles.js';
import { useEffect, useRef, useState } from 'react';
import { TerminalSquare, X } from 'lucide-react';
import { useDigitalTwinStore } from '../../../stores/digitalTwinStore.js';
import '@xterm/xterm/css/xterm.css';
function TerminalWindow({ rack, close }) {
  const serverId = `${rack.id}:server`;
  const [loadError, setLoadError] = useState(false);
  const [connection, setConnection] = useState(null);
  const [status, setStatus] = useState('idle');
  const hostRef = useRef(null);
  const closeRef = useRef(null);
  useEffect(() => {
    const previouslyFocused = document.activeElement;
    closeRef.current?.focus();
    return () => {
      if (previouslyFocused?.isConnected)
        previouslyFocused.focus({
          preventScroll: true,
        });
    };
  }, []);
  useEffect(() => {
    let cancelled = false;
    let terminal;
    let observer;
    let socket;
    let input;
    let resizeSubscription;
    const abort = new AbortController();
    Promise.all([import('@xterm/xterm'), import('@xterm/addon-fit')])
      .then(async ([{ Terminal }, { FitAddon }]) => {
        if (cancelled || !hostRef.current) return;
        terminal = new Terminal({
          disableStdin: true,
          cursorBlink: false,
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
          fontSize: 14,
          lineHeight: 1.4,
          scrollback: 1000,
          theme: {
            background: '#070e19',
            foreground: '#d4e7f5',
            cursor: '#79d7be',
          },
        });
        const fit = new FitAddon();
        terminal.loadAddon(fit);
        terminal.open(hostRef.current);
        const resize = () => {
          if (hostRef.current?.clientWidth && hostRef.current?.clientHeight) fit.fit();
        };
        observer = new ResizeObserver(resize);
        observer.observe(hostRef.current);
        resize();
        terminal.writeln('\x1b[1;36mKNU AIDC / RACK CONSOLE\x1b[0m');
        terminal.writeln('');
        terminal.writeln(`Rack   : ${rack.id}`);
        terminal.writeln(`Device : ${serverId.endsWith(':gpu') ? 'GPU SERVER' : 'SERVER'}`);
        terminal.writeln('');
        if (connection) {
          terminal.writeln('EC2에 연결하는 중입니다…');
          try {
            const accessResponse = await fetch('/api/terminal/access', {
              method: 'POST',
              signal: abort.signal,
            });
            if (!accessResponse.headers.get('content-type')?.includes('application/json'))
              throw new Error('로컬 SSH 중계 서버를 실행해 주세요.');
            const access = await accessResponse.json();
            if (!accessResponse.ok || !access.token)
              throw new Error(access.error || '로컬 접속 인증을 처리하지 못했습니다.');
            if (cancelled) return;
            const response = await fetch('/api/terminal/sessions', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${access.token}`,
              },
              body: JSON.stringify({
                rackId: rack.id,
                device: serverId.endsWith(':gpu') ? 'gpu' : 'server',
              }),
              signal: abort.signal,
            });
            if (!response.headers.get('content-type')?.includes('application/json'))
              throw new Error('로컬 SSH 중계 서버를 실행해 주세요.');
            const session = await response.json();
            if (!response.ok) throw new Error(session.error || '접속 요청이 실패했습니다.');
            if (cancelled) return;
            const url = new URL(session.path, window.location.origin);
            if (
              url.origin !== window.location.origin ||
              !url.pathname.startsWith('/api/terminal/ws')
            )
              throw new Error('잘못된 터미널 접속 주소입니다.');
            url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
            socket = new WebSocket(url);
            const send = data => {
              if (socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify(data));
            };
            resizeSubscription = terminal.onResize(({ cols, rows }) =>
              send({
                type: 'resize',
                cols,
                rows,
              })
            );
            input = terminal.onData(data =>
              send({
                type: 'input',
                data,
              })
            );
            socket.onmessage = event => {
              if (cancelled) return;
              try {
                const message = JSON.parse(event.data);
                if (message.type === 'status' && message.status === 'connected') {
                  setStatus('connected');
                  terminal.options.disableStdin = false;
                  terminal.options.cursorBlink = true;
                  send({
                    type: 'resize',
                    cols: terminal.cols,
                    rows: terminal.rows,
                  });
                  terminal.focus();
                } else if (message.type === 'data') {
                  terminal.write(
                    Uint8Array.from(atob(message.data), character => character.charCodeAt(0))
                  );
                } else if (message.type === 'error') {
                  terminal.writeln(`\r\n${message.message}`);
                  setStatus('error');
                }
              } catch {
                terminal.writeln('\r\n터미널 응답을 읽지 못했습니다.');
              }
            };
            socket.onerror = () => {
              if (!cancelled) {
                setStatus('error');
                terminal.writeln('\r\n중계 서버에 연결하지 못했습니다.');
              }
            };
            socket.onclose = () => {
              if (!cancelled) {
                terminal.options.disableStdin = true;
                terminal.options.cursorBlink = false;
                terminal.writeln('\r\n연결이 종료되었습니다.');
                setStatus(previous => (previous === 'error' ? previous : 'closed'));
              }
            };
          } catch (error) {
            if (!cancelled) {
              terminal.writeln(`\r\n${error.message}`);
              setStatus('error');
            }
          }
          return;
        }
        terminal.writeln('\x1b[33m접속 대기\x1b[0m');
        terminal.writeln('접속을 누르면 공통 테스트 EC2에 바로 연결됩니다.');
        terminal.writeln(
          '현재는 서버에 연결되어 있지 않으며, 명령어를 입력하거나 실행할 수 없습니다.'
        );
      })
      .catch(() => {
        if (!cancelled) setLoadError(true);
      });
    return () => {
      cancelled = true;
      abort.abort();
      if (socket) {
        socket.onmessage = null;
        socket.onerror = null;
        socket.onclose = null;
        if (socket.readyState === WebSocket.OPEN) socket.close();
        else socket.onopen = () => socket.close();
      }
      input?.dispose();
      resizeSubscription?.dispose();
      observer?.disconnect();
      terminal?.dispose();
    };
  }, [rack.id, serverId, connection]);
  const handleKeyDown = event => {
    event.stopPropagation();
    if (event.key === 'Escape' && !hostRef.current?.contains(event.target)) {
      event.preventDefault();
      close();
    }
    if (event.key === 'Tab') {
      const controls = [
        ...event.currentTarget.querySelectorAll('button:not(:disabled), select, input, textarea'),
      ];
      const first = controls[0];
      const last = controls.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    }
  };
  return (
    <div className={uiClass('rack-terminal-overlay')} onKeyDown={handleKeyDown}>
      <div className={uiClass('rack-terminal-backdrop cursor-pointer')} onClick={close} />
      <section
        className={uiClass('rack-terminal-window')}
        role="dialog"
        aria-modal="true"
        aria-labelledby="rack-terminal-title"
      >
        <header className={uiClass('rack-terminal-header')}>
          <TerminalSquare size={22} aria-hidden="true" />
          <div>
            <small>KNU AIDC / KVM CONSOLE</small>
            <h2 id="rack-terminal-title">{rack.id} · 원격 터미널</h2>
          </div>
          <button ref={closeRef} type="button" onClick={close} aria-label="터미널 닫기">
            <X size={18} aria-hidden="true" />
          </button>
        </header>
        <div className={uiClass('rack-terminal-toolbar')}>
          <label>접속 대상 · 회사 홈페이지 EC2</label>
          <span role="status">
            {
              {
                idle: '연결 대기',
                connecting: '접속 중',
                connected: '접속됨',
                closed: '연결 종료',
                error: '연결 실패',
              }[status]
            }
          </span>
          {status === 'connected' || status === 'connecting' ? (
            <button
              type="button"
              onClick={() => {
                setConnection(null);
                setStatus('closed');
              }}
            >
              연결 종료
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setStatus('connecting');
                setConnection({});
              }}
            >
              접속
            </button>
          )}
        </div>
        <div
          className={uiClass('rack-terminal-body')}
          ref={hostRef}
          aria-label="서버 터미널 화면"
        />
        {loadError && (
          <p role="alert">터미널 화면을 불러오지 못했습니다. 창을 닫고 다시 열어 주세요.</p>
        )}
        <footer className={uiClass('rack-terminal-footer')}>
          {rack.name} · 전체 랙 공통 테스트 EC2 연결 <span>Esc 닫기</span>
        </footer>
      </section>
    </div>
  );
}
export default function RackTerminalModal() {
  const rack = useDigitalTwinStore(state => state.terminalRack);
  const close = useDigitalTwinStore(state => state.closeRackTerminal);
  useEffect(() => () => close(), [close]);
  return rack ? <TerminalWindow key={rack.id} rack={rack} close={close} /> : null;
}
