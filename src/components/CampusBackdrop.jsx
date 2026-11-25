import { useId } from 'react';

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

export default function CampusBackdrop({ fixed = false }) {
  const id = useId().replace(/:/g, '');
  return (
    <div
      className={`pointer-events-none ${fixed ? 'fixed' : 'absolute'} inset-0 z-0 bg-[#001022] [background-image:radial-gradient(ellipse_at_35%_43%,#06396666,transparent_52%),radial-gradient(ellipse_at_80%_35%,#00295266,transparent_43%),linear-gradient(135deg,#020d1c,#00162b_55%,#010c1c)]`}
      aria-hidden="true"
    >
      <svg
        className="block size-full"
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
    </div>
  );
}
