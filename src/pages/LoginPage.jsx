import { Check, Eye, EyeOff, LockKeyhole, LogIn, UserRound, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import loginImage from '../assets/login.png';
import { LoginBackdrop, LoginFrame, UniversityWordmark } from '../features/login/LoginArtwork.jsx';

const savedIdKey = 'knu-aidc-saved-login-id';
function readSavedId() {
  try {
    return localStorage.getItem(savedIdKey) || '';
  } catch {
    return '';
  }
}
const inputClass =
  'h-[var(--login-field-height,54px)] w-full rounded-[10px] border border-[#4f80a9] bg-linear-to-r from-[#19354a99] to-[#11243980] pr-12 pl-14 text-[15px] text-[#edf7ff] shadow-[inset_0_1px_#a8daf00a] outline-none transition-colors placeholder:text-[#b0bed0] hover:border-[#71a9d2] focus:border-[#6ee3ff] focus:ring-2 focus:ring-[#30beff26] max-[420px]:h-[50px] max-[420px]:pl-12 max-[420px]:text-[14px]';

export default function LoginPage() {
  const [initialId] = useState(readSavedId);
  const [username, setUsername] = useState(initialId);
  const [remember, setRemember] = useState(Boolean(initialId));
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const usernameRef = useRef(null);
  const helpRef = useRef(null);

  useEffect(() => {
    const previous = document.title;
    document.title = 'KNU AIDC · 로그인';
    return () => {
      document.title = previous;
    };
  }, []);

  const submit = event => {
    event.preventDefault();
    if (!username.trim()) {
      setError('아이디를 입력해주세요.');
      usernameRef.current?.focus();
      return;
    }
    try {
      if (remember) localStorage.setItem(savedIdKey, username.trim());
      else localStorage.removeItem(savedIdKey);
    } catch {
      /* Login remains usable when browser storage is unavailable. */
    }
    // No account authentication endpoint is available in this application yet.
    setError('현재 로그인 서비스를 이용할 수 없습니다. 관리자에게 문의해주세요.');
  };

  return (
    <main
      className="relative flex h-dvh min-h-0 w-full flex-col overflow-x-hidden overflow-y-auto bg-[#001022] font-interface min-[1001px]:[@media(max-height:740px)]:[--login-field-height:46px] min-[1001px]:[@media(max-height:740px)]:[--login-card-top:44px] min-[1001px]:[@media(max-height:740px)]:[--login-card-bottom:36px] min-[1001px]:[@media(max-height:740px)]:[--login-caption-gap:28px] min-[1001px]:[@media(max-height:740px)]:[--login-logo-size:50px] min-[1001px]:[@media(max-height:740px)]:[--login-university-size:27px] [scrollbar-width:thin] [scrollbar-color:#55779a_transparent] text-[#edf4ff] [background-image:radial-gradient(ellipse_at_35%_43%,#06396666,transparent_52%),radial-gradient(ellipse_at_80%_35%,#00295266,transparent_43%),linear-gradient(135deg,#020d1c,#00162b_55%,#010c1c)]"
      aria-label="KNU AIDC 로그인"
    >
      <LoginBackdrop />
      <div className="relative mx-auto grid w-full max-w-[1540px] flex-1 grid-cols-[minmax(0,1.35fr)_minmax(360px,.9fr)] items-center gap-7 min-[1001px]:content-center px-[clamp(24px,4vw,64px)] pt-8 pb-4 max-[1000px]:max-w-[620px] max-[1000px]:grid-cols-1 max-[1000px]:gap-6 max-[1000px]:pt-10 max-[480px]:px-4 max-[480px]:pt-7">
        <section className="relative min-w-0 self-center" aria-labelledby="login-heading">
          <div className="relative z-10 -ml-[1.4%] max-[1000px]:ml-0 max-[1000px]:text-center">
            <p className="mb-1 text-[clamp(21px,2vw,29px)] leading-tight font-semibold tracking-[0.02em] text-[#f3ca6e] [text-shadow:0_0_16px_#ffc95526]">
              KNU AIDC
            </p>
            <h1
              id="login-heading"
              className="text-[clamp(30px,3.6vw,53px)] leading-[1.15] font-bold tracking-[-0.025em] whitespace-nowrap italic text-[#eff8ff] [text-shadow:0_0_6px_#bce4ff66,0_0_24px_#1e85c94d] max-[480px]:text-[clamp(26px,7.2vw,35px)]"
            >
              Digital Twin Campus
            </h1>
            <p className="mt-4 text-[clamp(13px,1.15vw,16px)] leading-[1.6] font-normal text-[#d9e2ef] max-[1000px]:mx-auto max-[1000px]:mt-3 max-[1000px]:w-fit max-[480px]:text-[12px]">
              KNU AIDC의 시설, 인프라, 보안 운영을
              <br />
              가상 공간에서 학습하고 체험하는 통합 플랫폼입니다.
            </p>
          </div>
          <div className="relative -ml-[3.9%] mt-[clamp(24px,6vh,80px)] aspect-[2.12] w-[103%] overflow-hidden max-[1000px]:hidden">
            <img
              src={loginImage}
              alt="파란 조명이 켜진 KNU AIDC 데이터센터"
              className="pointer-events-none absolute top-[-68%] left-0 w-full max-w-none select-none drop-shadow-[0_18px_30px_#008ce526]"
              fetchPriority="high"
              draggable="false"
            />
          </div>
        </section>

        <section
          className="relative mx-auto w-full max-w-[540px] min-[1001px]:self-stretch px-[clamp(28px,3.5vw,55px)] pt-[var(--login-card-top,56px)] pb-[var(--login-card-bottom,48px)] max-[480px]:px-8 max-[480px]:pt-12 max-[480px]:pb-10"
          aria-label="로그인"
        >
          <LoginFrame />
          <div className="relative flex h-full flex-col justify-center">
            <div className="flex justify-center">
              <UniversityWordmark />
            </div>
            <div className="mt-7 mb-[var(--login-caption-gap,36px)] flex items-center justify-center gap-4 max-[420px]:gap-2">
              <span
                aria-hidden="true"
                className="h-px min-w-4 flex-1 bg-linear-to-r from-transparent to-[#68d8ff]"
              />
              <p className="text-[16px] tracking-[0.09em] whitespace-nowrap text-[#63d6fc] max-[420px]:text-[12px]">
                AIDC Digital Twin Campus
              </p>
              <span
                aria-hidden="true"
                className="h-px min-w-4 flex-1 bg-linear-to-l from-transparent to-[#68d8ff]"
              />
            </div>
            <form onSubmit={submit} aria-label="로그인 정보" className="flex flex-col">
              <label htmlFor="login-username" className="sr-only">
                아이디
              </label>
              <div className="relative">
                <UserRound
                  size={22}
                  strokeWidth={1.7}
                  aria-hidden="true"
                  className="pointer-events-none absolute top-1/2 left-[18px] -translate-y-1/2 text-[#ebf1f9] max-[420px]:left-4"
                />
                <input
                  ref={usernameRef}
                  id="login-username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  autoCapitalize="none"
                  spellCheck="false"
                  required
                  value={username}
                  onChange={event => {
                    setUsername(event.target.value);
                    setError('');
                  }}
                  placeholder="아이디를 입력하세요"
                  className={inputClass}
                  aria-describedby={error ? 'login-error' : undefined}
                />
              </div>
              <label htmlFor="login-password" className="sr-only">
                비밀번호
              </label>
              <div className="relative mt-3">
                <LockKeyhole
                  size={22}
                  strokeWidth={1.7}
                  aria-hidden="true"
                  className="pointer-events-none absolute top-1/2 left-[18px] -translate-y-1/2 text-[#ebf1f9] max-[420px]:left-4"
                />
                <input
                  id="login-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  placeholder="비밀번호를 입력하세요"
                  className={inputClass}
                  onInput={() => setError('')}
                  aria-describedby={error ? 'login-error' : undefined}
                />
                <button
                  type="button"
                  aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
                  aria-pressed={showPassword}
                  onClick={() => setShowPassword(value => !value)}
                  className="absolute top-1/2 right-2 grid size-9 -translate-y-1/2 cursor-pointer place-items-center rounded-md text-[#c4d4e4] transition-colors hover:bg-[#38608a33] hover:text-white focus-visible:outline-2 focus-visible:outline-[#76ddff]"
                >
                  {showPassword ? (
                    <Eye size={21} strokeWidth={1.6} />
                  ) : (
                    <EyeOff size={21} strokeWidth={1.6} />
                  )}
                </button>
              </div>
              <div className="mt-4 flex items-center justify-between gap-2 text-[13px] max-[420px]:text-[11px]">
                <label className="flex cursor-pointer items-center gap-2.5 whitespace-nowrap">
                  <input
                    type="checkbox"
                    name="remember-username"
                    checked={remember}
                    onChange={event => {
                      setRemember(event.target.checked);
                      if (!event.target.checked) {
                        try {
                          localStorage.removeItem(savedIdKey);
                        } catch {
                          /* Storage can be blocked by the browser. */
                        }
                      }
                    }}
                    className="peer sr-only"
                  />
                  <span
                    aria-hidden="true"
                    className="grid size-5 place-items-center rounded-[4px] border border-[#28c6fa] bg-[#07223d] text-white shadow-[inset_0_0_0_1px_#35c6fa26] peer-checked:bg-[#0879b4] peer-focus-visible:outline-2 peer-focus-visible:outline-offset-3 peer-focus-visible:outline-[#76ddff]"
                  >
                    {remember && <Check size={14} strokeWidth={2.2} />}
                  </span>
                  아이디 저장
                </label>
                <button
                  type="button"
                  onClick={() => helpRef.current?.showModal()}
                  className="cursor-pointer whitespace-nowrap text-[#d8e4f1] underline-offset-4 hover:text-[#7de1ff] hover:underline focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#76ddff]"
                >
                  비밀번호를 잊으셨나요?
                </button>
              </div>
              <button
                type="submit"
                className="mt-8 flex h-[var(--login-field-height,54px)] cursor-pointer items-center justify-center gap-3 rounded-[10px] border border-[#35b8f3] bg-[radial-gradient(ellipse_at_15%_0%,#4fe0ff99,transparent_60%),linear-gradient(115deg,#148de0,#0754b6)] text-[19px] font-semibold tracking-[0.08em] text-white shadow-[inset_0_1px_#b6f5ff73,0_4px_24px_#007cdb26] transition-[filter,box-shadow] hover:brightness-115 hover:shadow-[inset_0_1px_#d4faff99,0_4px_24px_#009dff40] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#86e7ff] active:brightness-95"
              >
                <LogIn size={23} strokeWidth={1.8} aria-hidden="true" />
                로그인
              </button>
              {error && (
                <p
                  id="login-error"
                  role="alert"
                  className="mt-4 text-[12px] leading-relaxed text-[#ffb4a9]"
                >
                  {error}
                </p>
              )}
            </form>
          </div>
        </section>
      </div>

      <footer className="relative mx-auto flex w-full max-w-[1440px] shrink-0 items-center justify-center gap-7 px-8 pt-2 pb-4 max-[480px]:gap-3 max-[480px]:px-5">
        <span
          className="h-px min-w-4 flex-1 bg-linear-to-r from-transparent to-[#168dcd]"
          aria-hidden="true"
        />
        <div className="flex items-center gap-4 max-[600px]:gap-2">
          <UniversityWordmark compact />
          <p className="text-[13px] font-medium text-[#d5e1f0] max-[600px]:max-w-[210px] max-[600px]:text-[10px]">
            강원대학교 데이터보안활용 혁신융합대학 사업단
          </p>
        </div>
        <span
          className="h-px min-w-4 flex-1 bg-linear-to-l from-transparent to-[#168dcd]"
          aria-hidden="true"
        />
      </footer>

      <dialog
        ref={helpRef}
        aria-labelledby="login-help-title"
        className="fixed inset-0 m-auto w-[400px] max-w-[calc(100vw-40px)] rounded-xl border border-[#497ca5] bg-[#0b2137] p-6 text-[#e7f1ff] shadow-[0_20px_60px_#0008] backdrop:bg-[#000a] backdrop:backdrop-blur-sm"
      >
        <header className="flex items-center justify-between gap-4">
          <h2 id="login-help-title" className="text-lg font-semibold">
            비밀번호 재설정
          </h2>
          <button
            type="button"
            onClick={() => helpRef.current?.close()}
            aria-label="안내 닫기"
            className="grid size-8 cursor-pointer place-items-center rounded-md text-[#b3c9df] hover:bg-[#2b4c6c]"
          >
            <X size={20} />
          </button>
        </header>
        <p className="mt-5 text-sm leading-relaxed text-[#b9cee3]">
          계정 관리 담당자에게 비밀번호 재설정을 요청해주세요.
        </p>
        <form method="dialog" className="mt-6 flex justify-end">
          <button className="cursor-pointer rounded-md border border-[#4b86b4] bg-[#174670] px-5 py-2 text-sm font-medium hover:bg-[#235c8b]">
            확인
          </button>
        </form>
      </dialog>
    </main>
  );
}
