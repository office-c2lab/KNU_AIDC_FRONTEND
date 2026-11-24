import { useId } from 'react';

const waves = Array.from({ length: 18 }, (_, row) => {
  const points = Array.from({ length: 101 }, (_, step) => {
    const x = step * 10;
    const crest = Math.exp(-(((x - 140) / 110) ** 2)) + Math.exp(-(((x - 860) / 110) ** 2));
    const y = 77 - crest * 25 + row * 0.8 + Math.sin(x / 55 + row * 0.16) * 4 * crest;
    return `${step ? 'L' : 'M'}${x},${y.toFixed(2)}`;
  });
  return points.join(' ');
});

export default function HeaderFrame() {
  const id = useId().replace(/:/g, '');
  const paint = name => `url(#${id}-${name})`;
  const shape = 'M28 2H972L883 83H117Z';
  return (
    <>
      <svg
        className="pointer-events-none absolute inset-x-[-8px] top-0 h-[76px] w-[calc(100%+16px)] overflow-visible"
        viewBox="0 0 1000 88"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={`${id}-glass`} x2="0" y2="1">
            <stop stopColor="#04101f" />
            <stop offset=".5" stopColor="#06172d" />
            <stop offset="1" stopColor="#0b2b4c" />
          </linearGradient>
          <linearGradient id={`${id}-edge`}>
            <stop stopColor="#62b9ff" />
            <stop offset=".3" stopColor="#55a9ed" />
            <stop offset=".5" stopColor="#fff0b1" />
            <stop offset=".7" stopColor="#55a9ed" />
            <stop offset="1" stopColor="#62b9ff" />
          </linearGradient>
          <linearGradient id={`${id}-gold`} x1="0" y1="0" x2="0" y2="1">
            <stop stopColor="#111a24" />
            <stop offset=".38" stopColor="#433c29" />
            <stop offset=".67" stopColor="#b18a38" />
            <stop offset=".84" stopColor="#fff6d2" />
            <stop offset=".93" stopColor="#ffe2a0" />
            <stop offset="1" stopColor="#8c6524" />
          </linearGradient>
          <linearGradient id={`${id}-plate`}>
            <stop stopColor="#5c4119" />
            <stop offset=".2" stopColor="#a37b2e" />
            <stop offset=".42" stopColor="#dfad43" />
            <stop offset=".48" stopColor="#ffe7a0" />
            <stop offset=".5" stopColor="#fffef1" />
            <stop offset=".52" stopColor="#ffe7a0" />
            <stop offset=".58" stopColor="#dfad43" />
            <stop offset=".8" stopColor="#a37b2e" />
            <stop offset="1" stopColor="#5c4119" />
          </linearGradient>
          <linearGradient id={`${id}-ticks`} x1="0" y1="0" x2="0" y2="1">
            <stop stopColor="#fff4bc" />
            <stop offset=".45" stopColor="#ffda75" />
            <stop offset="1" stopColor="#ba852e" />
          </linearGradient>
          <linearGradient id={`${id}-plate-bevel`} x1="0" y1="0" x2="0" y2="1">
            <stop stopColor="#fff0b5" stopOpacity=".45" />
            <stop offset=".3" stopColor="#fff0b5" stopOpacity="0" />
            <stop offset=".75" stopColor="#50330d" stopOpacity="0" />
            <stop offset="1" stopColor="#50330d" stopOpacity=".6" />
          </linearGradient>
          <radialGradient id={`${id}-light`}>
            <stop stopColor="#fffdf0" />
            <stop offset=".22" stopColor="#ffebae" stopOpacity=".9" />
            <stop offset=".55" stopColor="#efc26a" stopOpacity=".4" />
            <stop offset="1" stopColor="#d6a355" stopOpacity="0" />
          </radialGradient>
          <radialGradient id={`${id}-warmth`}>
            <stop stopColor="#ffe7af" stopOpacity=".44" />
            <stop offset=".4" stopColor="#e8bd71" stopOpacity=".2" />
            <stop offset="1" stopColor="#c89444" stopOpacity="0" />
          </radialGradient>
          <linearGradient
            id={`${id}-gold-line`}
            gradientUnits="userSpaceOnUse"
            x1="240"
            y1="0"
            x2="760"
            y2="0"
          >
            <stop stopColor="#d9ac60" stopOpacity="0" />
            <stop offset=".25" stopColor="#e8c687" stopOpacity=".65" />
            <stop offset=".5" stopColor="#fff1ca" />
            <stop offset=".75" stopColor="#e8c687" stopOpacity=".65" />
            <stop offset="1" stopColor="#d9ac60" stopOpacity="0" />
          </linearGradient>
          <linearGradient id={`${id}-fade`} x2="0" y2="1">
            <stop stopColor="white" stopOpacity="0" />
            <stop offset="1" stopColor="white" stopOpacity=".55" />
          </linearGradient>
          <pattern id={`${id}-dots`} width="5" height="4" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r=".6" fill="#47b7ff" />
          </pattern>
          <filter id={`${id}-glow`} x="-30%" y="-100%" width="160%" height="300%">
            <feGaussianBlur stdDeviation="2" />
          </filter>
          <filter id={`${id}-soft-glow`} x="-50%" y="-150%" width="200%" height="400%">
            <feGaussianBlur stdDeviation="5" />
          </filter>
          <clipPath id={`${id}-clip`}>
            <path d={shape} />
          </clipPath>
          <mask id={`${id}-mask`}>
            <rect x="0" y="35" width="1000" height="53" fill={paint('fade')} />
          </mask>
        </defs>

        <path
          d="M0 6H1000L926 72Q919 80 907 80H93Q81 80 74 72Z"
          fill="#050b14"
          stroke="#8f744534"
        />
        <g opacity=".4" filter={paint('soft-glow')}>
          <path d="M3 6H28L110 79H96Q84 79 76 70Z" fill={paint('gold')} />
          <path d="M972 6H997L924 70Q916 79 904 79H890Z" fill={paint('gold')} />
        </g>
        <path d="M3 6H28L110 79H96Q84 79 76 70Z" fill={paint('gold')} />
        <path d="M972 6H997L924 70Q916 79 904 79H890Z" fill={paint('gold')} />
        <path
          d={shape}
          fill={paint('glass')}
          stroke="#167be5"
          strokeOpacity=".45"
          strokeWidth="5"
          filter={paint('glow')}
        />
        <path d={shape} fill={paint('glass')} />
        <g clipPath={paint('clip')}>
          <rect
            x="0"
            y="35"
            width="1000"
            height="53"
            fill={paint('dots')}
            mask={paint('mask')}
            opacity=".65"
          />
          {waves.map((d, index) => (
            <path
              key={index}
              d={d}
              fill="none"
              stroke="#168fff"
              strokeWidth=".65"
              strokeOpacity={0.12 + (17 - index) * 0.012}
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </g>
        <path
          d={shape}
          fill="none"
          stroke={paint('edge')}
          strokeWidth="1.1"
          vectorEffect="non-scaling-stroke"
        />
        <path
          d="M35 5H965L881 80H119Z"
          fill="none"
          stroke="#7bc4ff"
          strokeOpacity=".12"
          strokeWidth=".7"
          vectorEffect="non-scaling-stroke"
        />
        <path
          d="M118 83H882"
          fill="none"
          stroke="#70caff"
          strokeWidth="1.4"
          vectorEffect="non-scaling-stroke"
        />
        <ellipse
          cx="500"
          cy="2"
          rx="270"
          ry="6"
          fill={paint('warmth')}
          filter={paint('soft-glow')}
        />
        <ellipse cx="500" cy="2" rx="65" ry="1.3" fill={paint('light')} filter={paint('glow')} />
        <path
          d="M240 2H760"
          stroke={paint('gold-line')}
          strokeWidth="1.2"
          vectorEffect="non-scaling-stroke"
        />
        <ellipse
          cx="500"
          cy="82"
          rx="170"
          ry="5"
          fill={paint('warmth')}
          filter={paint('soft-glow')}
        />
        <path
          d="M374 84L384 78H616L626 84Z"
          fill={paint('plate')}
          stroke="#d6aa53"
          strokeWidth=".65"
          vectorEffect="non-scaling-stroke"
        />
        <path d="M374 84L384 78H616L626 84Z" fill={paint('plate-bevel')} />
        <path
          d="M377 83L385 78.5H615L623 83"
          fill="none"
          stroke="#ffe7a7"
          strokeOpacity=".8"
          strokeWidth=".6"
          vectorEffect="non-scaling-stroke"
        />
        <path d="M386 79H390M610 79H614" stroke="#fff9df" strokeWidth=".8" />
        <ellipse cx="500" cy="82" rx="45" ry="1.3" fill={paint('light')} filter={paint('glow')} />
        <path
          d="M31 3L38 8M969 3L962 8"
          stroke="#dcf4ff"
          strokeWidth="1.5"
          vectorEffect="non-scaling-stroke"
        />
        {[1, 0.98, 0.9, 0.78, 0.58, 0.38, 0.22, 0.12].map((opacity, i) => {
          const x = 1012 + i * 14;
          const right = `M${x + 9} 14h6l-9 11h-6Z`;
          const left = `M${1000 - x - 9} 14h-6l9 11h6Z`;
          return (
            <g key={i} fill={paint('ticks')} opacity={opacity}>
              {i < 4 && (
                <g opacity=".4" filter={paint('glow')}>
                  <path d={left} />
                  <path d={right} />
                </g>
              )}
              <path d={left} />
              <path d={right} />
            </g>
          );
        })}
      </svg>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute top-[-2px] left-1/2 h-[7px] w-[52%] -translate-x-1/2 bg-[radial-gradient(ellipse,#ffd36bcc_0%,#d69b3859_32%,transparent_72%)] blur-px"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute top-px left-1/2 h-px w-[52%] -translate-x-1/2 bg-[radial-gradient(ellipse,#fffef1_0%,#ffeca4_6%,#ffc34899_20%,#a7712326_45%,transparent_72%)]"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute top-[0.5px] left-1/2 h-[2px] w-[24%] -translate-x-1/2 bg-[radial-gradient(ellipse,#fffef5_0%,#fff5c9_20%,#ffd570a6_40%,transparent_70%)] blur-[0.5px]"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute bottom-[3px] left-1/2 h-[6px] w-[32%] -translate-x-1/2 translate-y-1/2 bg-[radial-gradient(ellipse,#fff8dc_0%,#ffd76b_8%,#e9ad3e99_24%,#a7752526_48%,transparent_72%)] blur-px"
      />
    </>
  );
}
