# KNU AIDC 3D Digital Twin

Vite/React 애플리케이션에서 V40 Real Human Operators 3D 디지털 트윈을
전체 화면으로 제공합니다. Three.js는 npm 패키지로 번들링되며 React 화면에서 직접
초기화됩니다.

## 실행

### 랙 콘솔 SSH 테스트

Node.js 22 이상을 사용합니다. 키가 있는 Windows PC에서 이 프로젝트의 프론트엔드와
중계 서버를 함께 실행합니다. `.terminal.env.example`을 `.terminal.env`로 복사한 뒤
키 경로를 확인하세요. 기본 접속 대상은 `ubuntu@43.203.18.76`, 키는
`C:/pemkey/c2lab-office.pem`입니다. 모든 표준/GPU 서버 랙의 서버 슬롯과
GPU 랙의 GPU 슬롯은 동일한 회사 EC2에 연결됩니다. 랙별 실장비 연결은 아닙니다.
`.terminal.env`와 PEM 파일은 Git에서 제외됩니다.

```powershell
npm install
# 웹 화면과 로컬 SSH 중계를 함께 실행
npm run dev
```

`http://localhost:5173`에서 원하는 서버 랙 상세창을 열고 도어·KVM 콘솔을 펼칩니다.
LCD 화면을 클릭하거나 `터미널 열기` 버튼을 누른 다음 `접속`만 누르면 공통 테스트 EC2에 연결됩니다.
접속 인증은 허용된 로컬 브라우저에서 자동으로 처리되며 코드를 입력할 필요가 없습니다.
PEM 파일 내용은 공유하지 않습니다. 연결 후에는 실제 EC2 셸이므로
우선 `hostname`, `whoami`, `pwd` 등 조회 명령으로 확인하세요.

중계 서버는 `127.0.0.1:3001`에서만 수신하며 Vite가 HTTP/WebSocket 요청을 전달합니다.
`npm run dev`는 중계 서버가 준비된 뒤 Vite를 시작하고 종료 시 함께 정리합니다.
이미 실행 중인 중계 서버는 재사용합니다. 필요하면 `npm run terminal:server`와
`npm run dev:frontend`로 각각 실행할 수도 있습니다.
EC2에 프로그램을 설치하거나 홈페이지 포트를 변경할 필요가 없습니다.
EC2의 22번 포트는 실행 PC의 공인 IP에서 접근할 수 있어야 합니다.
카탈로그에 등록되지 않은 랙이나 지원하지 않는 장비 선택은 접속을 거부합니다.
첫 SSH 인증 성공 시 호스트 키를 `.terminal/known-hosts.json`에 기록하고,
이후 키가 달라지면 연결을 거부합니다. 서버 재설치 시 실제 지문을 확인한 뒤 갱신하세요.
창 닫기, 장비 변경, 연결 종료 시 SSH 세션도 종료되며 테스트 세션 최대 시간은 30분입니다.
이 구성은 로컬 개발용이며 Vite 정적 배포만으로 중계 서버가 배포되지는 않습니다.
자동 인증 발급 경로는 루프백 중계 서버와 허용된 로컬 Origin에서만 사용합니다.
외부 서비스로 배포할 때는 해당 경로를 사용자 로그인·권한 확인으로 대체해야 합니다.

`npm run test:terminal`은 실제 EC2 대신 로컬 SSH 테스트 서버로 인증 제한,
장비 매핑, 일회용 접속권, PTY 입출력을 검증합니다.

### 프론트엔드

```bash
npm run dev
```

개발 서버의 루트 경로에서 디지털 트윈이 표시됩니다. `AppLayout`이 공통 관제 UI를
구성하고, 라우터의 `Outlet`에 실제 3D 뷰 페이지를 렌더링합니다.

- `layouts/AppLayout.jsx`: 헤더·좌우 패널·하단 컨트롤 및 `Outlet`
- `pages/DigitalTwinPage.jsx`: `Outlet`에 표시되는 3D 뷰 페이지
- `features/digital-twin/components`: 관제 UI 컴포넌트
- `features/digital-twin/useDigitalTwinScene.js`: Three.js 생명주기 연결
- `features/digital-twin/scene/floors`: 1F~4F 층별 배치 모듈
- `features/digital-twin/scene/zones`: 전력동·냉각동 구역 모듈
- `features/digital-twin/scene/core`: 공용 지오메트리·재질·효과 생성 도구
- `features/digital-twin/scene/assets`: 랙·CDU·UPS·냉동기 등 설비 팩토리
- `features/digital-twin/scene/config`: 층·구역·장애 시나리오 설정
- `features/digital-twin/scene/systems`: 장애 상태 계산 등 독립 실행 시스템
- `features/digital-twin/scene/runtime`: 분리된 코어·설비·시스템의 생명주기 조립
- `features/digital-twin/scene.js`: 런타임을 노출하는 최소 진입점
- `stores/digitalTwinStore.js`: Zustand 기반 선택·뷰·화질·요원·장애 상태
- `digital-twin.css`: 3D 오버레이와 Three.js가 토글하는 동적 상태 스타일

압축에서 해제한 독립 실행 원본은 비교·참고를 위해 `public/digital-twin`에 보존되어
있지만 앱 실행에는 사용하지 않습니다.

Three.js는 프로젝트 번들에 포함됩니다. 인체 GLB 모델도
`public/digital-twin/assets/humans`에서 자체 호스팅하며, 로컬 파일이 없을 때만 원본
외부 주소를 fallback으로 시도합니다.

