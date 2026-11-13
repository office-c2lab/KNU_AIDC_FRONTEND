# KNU AIDC 3D Digital Twin

Vite/React 애플리케이션에서 V40 Real Human Operators 3D 디지털 트윈을
전체 화면으로 제공합니다. Three.js는 npm 패키지로 번들링되며 React 화면에서 직접
초기화됩니다.

## 실행

```bash
npm run dev
```

개발 서버의 루트 경로에서 디지털 트윈이 표시됩니다. `AppLayout`이 공통 관제 UI를
구성하고, 라우터의 `Outlet`에 실제 3D 뷰 페이지를 렌더링합니다.

- `layouts/AppLayout.jsx`: 헤더·좌우 패널·하단 컨트롤 및 `Outlet`
- `pages/DigitalTwinPage.jsx`: `Outlet`에 표시되는 3D 뷰 페이지
- `features/digital-twin/components`: 관제 UI 컴포넌트
- `features/digital-twin/useDigitalTwinScene.js`: Three.js 생명주기 연결
- `scene.js`: Three.js 장면, 설비, 상호작용 로직
- `digital-twin.css`: 3D 오버레이와 Three.js가 토글하는 동적 상태 스타일

압축에서 해제한 독립 실행 원본은 비교·참고를 위해 `public/digital-twin`에 보존되어
있지만 앱 실행에는 사용하지 않습니다.

Three.js는 프로젝트 번들에 포함됩니다. 기본 인체 GLB 모델만 외부 주소에서 로드되므로
첫 실행에는 인터넷 연결이 필요합니다. 모델까지 자체 호스팅하려면
`public/digital-twin/README.md`의 안내를 따르세요.

## Vite 참고

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
