# KNU AIDC — V40 Real Human Operators

기존 V39 시설과 UI, CCTV, 설비 상세 모달, 7명의 AI 운영요원 클릭/모의 장애 연동을 유지하고 **실사에 가까운 3D 인체 모델(GLB)** 로 교체한 버전입니다.

## 실행

- 단일 HTML `KNU_AIDC_3D_DigitalTwin_V40_RealHumans_Standalone.html` 실행
- 또는 `python -m http.server 8000` 실행 후 `index.html` 접속
- 웹 연결 필요: Three.js ESM + 4종 외부 고품질 GLB 모델 다운로드
- **첫 로드 시 약 80 MB**의 외부 GLB 자산을 다운로드할 수 있습니다. 브라우저와 CDN에서 로딩 시간이 걸릴 수 있습니다.
- 4종 모델 (Jordan, Sam, Maya, Harper)을 7명의 에이전트에게 중복 배치하여 메모리/네트워크 비용을 줄였습니다.
- 모델 로딩 또는 CORS 차단 시 기존 절차 기반 대체 캐릭터를 표시하고, 좌측 에이전트 목록에 상태를 표시합니다. 서비스 환경에서의 CDN 접근 여부 확인이 필요합니다.

## 독립 호스팅(권장)

별도의 자산을 서버에 보관하고 싶다면 `download_human_models.py`를 실행해 4종 GLB를 `assets/humans`에 다운로드하세요.
그다음 `http://localhost:8000/index.html?localModels=1` 로 열면 로컬 자산을 우선 사용합니다.
브라우저 보안 제약 때문에 `file://`에서는 로컬 자산 대신 공개 다운로드 링크가 사용됩니다.

## 모델 라이선스

Innerscene에서 공개한 MakeHuman/MPFB 기반 CC0 인체 모델 4종을 로딩합니다. 원본 링크, 파일명은 `HUMAN_ASSETS.json`에 수록했습니다.
모델은 실제 인물을 스캔한 것이 아니라 스타일링된 사실적 디지털 휴먼입니다. 실시간 이동/순찰은 이번 버전에서 추가하지 않았으며 기본 idle 애니메이션을 사용합니다.
