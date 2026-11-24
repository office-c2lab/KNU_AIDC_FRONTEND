import { useId } from 'react';

export function UniversityWordmark({ compact = false }) {
  return (
    <div
      className={`inline-flex items-center text-[#f5f8ff] ${compact ? 'gap-3' : 'gap-4 max-[420px]:gap-2.5'}`}
      aria-label="KNU 강원대학교"
    >
      <span
        className={`relative font-black leading-none tracking-[-0.07em] ${compact ? 'text-[25px]' : 'text-[length:var(--login-logo-size,58px)] max-[420px]:text-[47px]'}`}
      >
        <span
          aria-hidden="true"
          className={`absolute rotate-[-30deg] bg-[#ff8500] ${compact ? '-top-0.5 -left-1.5 size-[6px]' : '-top-0.5 -left-2 size-[12px]'}`}
        />
        KNU
      </span>
      {!compact && (
        <span className="flex flex-col gap-1 text-left">
          <span className="text-[length:var(--login-university-size,31px)] leading-none font-bold tracking-[0.02em] max-[420px]:text-[25px]">
            강원대학교
          </span>
          <span className="text-[9px] leading-normal font-bold tracking-[0.015em] max-[420px]:text-[7px]">
            KANGWON NATIONAL UNIVERSITY
          </span>
        </span>
      )}
    </div>
  );
}

export function LoginFrame() {
  const id = useId().replace(/:/g, '');
  const url = name => `url(#${id}-${name})`;
  const outer =
    'M58 8H466Q492 8 492 34V494Q492 510 481 521L460 542Q450 552 436 552H34Q8 552 8 526V70Q8 50 22 36L42 16Q50 8 58 8Z';
  const inner =
    'M61 19H461Q481 19 481 40V491L449 527Q442 537 428 537H39Q21 537 21 519V76L53 27Q57 19 61 19Z';
  return (
    <svg
      className="pointer-events-none absolute inset-0 size-full overflow-visible"
      viewBox="0 0 500 560"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`${id}-blue`} x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#6cefff" />
          <stop offset=".35" stopColor="#168ee7" />
          <stop offset=".7" stopColor="#75dcff" />
          <stop offset="1" stopColor="#248fd1" />
        </linearGradient>
        <linearGradient id={`${id}-gold`}>
          <stop stopColor="#e6b240" />
          <stop offset=".5" stopColor="#fff6b9" />
          <stop offset="1" stopColor="#e9b747" />
        </linearGradient>
        <radialGradient id={`${id}-glass`} cx=".9" cy=".05" r="1">
          <stop stopColor="#123e66" stopOpacity=".7" />
          <stop offset=".52" stopColor="#041b31" stopOpacity=".93" />
          <stop offset="1" stopColor="#041627" stopOpacity=".97" />
        </radialGradient>
        <filter id={`${id}-glow`} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="4" />
        </filter>
        <radialGradient id={`${id}-spark`}>
          <stop stopColor="#fff" />
          <stop offset=".2" stopColor="#c6f4ff" />
          <stop offset="1" stopColor="#249aff" stopOpacity="0" />
        </radialGradient>
      </defs>
      <path
        d={outer}
        fill="none"
        stroke="#159bff"
        strokeWidth="5"
        opacity=".5"
        filter={url('glow')}
      />
      <path d={outer} fill={url('glass')} stroke={url('blue')} strokeWidth="1.5" />
      <path
        d={inner}
        fill="none"
        stroke="#52cfff"
        strokeWidth="3"
        opacity=".6"
        filter={url('glow')}
      />
      <path d={inner} fill="none" stroke={url('blue')} strokeWidth="1.3" />
      <path d="M21 76L53 27Q57 19 61 19H181L169 28H67Q63 28 60 33L21 92Z" fill={url('gold')} />
      <path
        d="M319 537L330 528H426Q434 528 439 522L481 481V501L449 535Q444 541 432 541H319Z"
        fill={url('gold')}
      />
      <path d="M63 20H167M339 537H427" stroke="#fff6ba" strokeWidth="2" filter={url('glow')} />
      <ellipse cx="447" cy="19" rx="33" ry="6" fill={url('spark')} />
      <ellipse cx="58" cy="537" rx="30" ry="5" fill={url('spark')} />
    </svg>
  );
}

const waveRows = Array.from(
  { length: 30 },
  (_, row) =>
    `M-80 ${300 + row * 5}C100 ${355 + row * 8} 115 ${550 + row * 4} 390 ${535 + row * 4}S700 ${320 + row * 6} 1000 ${510 + row * 5}S1300 ${560 + row * 5} 1510 ${480 + row * 6}`
);
const bottomRows = Array.from(
  { length: 26 },
  (_, row) =>
    `M-80 ${625 + row * 4}C160 ${700 + row * 5} 310 ${820 + row * 3} 600 ${759 + row * 4}S1130 ${790 + row * 4} 1510 ${655 + row * 6}`
);

export function LoginBackdrop() {
  const id = useId().replace(/:/g, '');
  return (
    <svg
      className="pointer-events-none absolute inset-0 size-full"
      viewBox="0 0 1440 900"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`${id}-fade`} x2="0" y2="1">
          <stop stopColor="#179aff" stopOpacity=".05" />
          <stop offset=".5" stopColor="#18a3ff" stopOpacity=".35" />
          <stop offset="1" stopColor="#157ccd" stopOpacity=".04" />
        </linearGradient>
        <pattern id={`${id}-dots`} width="5" height="5" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r=".65" fill="#28a8f0" />
        </pattern>
        <clipPath id={`${id}-bottom`}>
          <path d="M0 625C160 700 310 820 600 759S1130 790 1440 655V900H0Z" />
        </clipPath>
        <linearGradient id={`${id}-mask`} x2="0" y2="1">
          <stop stopColor="white" stopOpacity=".5" />
          <stop offset="1" stopColor="white" stopOpacity="0" />
        </linearGradient>
        <mask id={`${id}-dots-mask`}>
          <rect x="0" y="620" width="1440" height="280" fill={`url(#${id}-mask)`} />
        </mask>
      </defs>
      <g fill="none" stroke={`url(#${id}-fade)`} strokeWidth=".6">
        {waveRows.map((d, i) => (
          <path d={d} key={i} />
        ))}
      </g>
      <g fill="none" stroke="#199fe5" strokeOpacity=".16" strokeWidth=".6">
        {bottomRows.map((d, i) => (
          <path d={d} key={i} />
        ))}
      </g>
      <g clipPath={`url(#${id}-bottom)`} mask={`url(#${id}-dots-mask)`}>
        <rect x="0" y="620" width="1440" height="280" fill={`url(#${id}-dots)`} opacity=".7" />
      </g>
    </svg>
  );
}
