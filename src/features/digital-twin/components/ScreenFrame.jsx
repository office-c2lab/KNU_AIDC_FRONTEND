import { useId, useLayoutEffect, useRef, useState } from 'react';

export default function ScreenFrame() {
  const hostRef = useRef(null);
  const id = useId().replace(/:/g, '');
  const [size, setSize] = useState({ width: 0, height: 0, viewportWidth: 0 });

  useLayoutEffect(() => {
    const host = hostRef.current;
    const update = entry => {
      const width = entry?.contentRect.width ?? host.clientWidth;
      const height = entry?.contentRect.height ?? host.clientHeight;
      const viewportWidth = window.innerWidth;
      setSize(previous =>
        previous.width === width &&
        previous.height === height &&
        previous.viewportWidth === viewportWidth
          ? previous
          : { width, height, viewportWidth }
      );
    };
    const observer = new ResizeObserver(entries => update(entries[0]));
    const onResize = () => update();
    update();
    observer.observe(host);
    window.addEventListener('resize', onResize);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', onResize);
    };
  }, []);

  const { width: w, height: h, viewportWidth } = size;
  const paint = name => `url(#${id}-${name})`;
  // Match the existing header columns and its SVG bevel in the same CSS coordinates.
  const headerWidth = w - 4;
  const titleWidth = headerWidth * (viewportWidth < 1100 ? 0.43 : 0.48);
  const titleSvgWidth = titleWidth + 16;
  const titleLeft = (headerWidth - titleWidth) / 2 - 6;
  const leftTop = titleLeft + titleSvgWidth * 0.028;
  const leftBottom = titleLeft + titleSvgWidth * 0.117;
  const rightBottom = titleLeft + titleSvgWidth * 0.883;
  const rightTop = titleLeft + titleSvgWidth * 0.972;
  const top =
    viewportWidth >= 1000
      ? `H${leftTop}L${leftBottom - 4} 69Q${leftBottom} 73 ${leftBottom + 5} 73H${rightBottom - 5}Q${rightBottom} 73 ${rightBottom + 4} 69L${rightTop} 2`
      : '';
  const outline = `M24 2${top}H${w - 24}Q${w - 2} 2 ${w - 2} 24V${h - 25}L${w - 25} ${h - 2}H25L2 ${h - 25}V24Q2 2 24 2Z`;
  const topCorner = 'M2 29V24Q2 2 24 2H38L33 7H24Q7 7 7 24V29Z';
  const bottomTip = Math.max(38, Math.min(87, w * 0.12));
  const goldStart = Math.max(30, bottomTip - 42);
  const bottomCorner = `M2 ${h - 32}L27 ${h - 7}H${bottomTip - 8}L${bottomTip} ${h - 2}H24L2 ${h - 24}Z`;

  return (
    <div
      ref={hostRef}
      className="pointer-events-none fixed inset-2 z-[32] select-none"
      aria-hidden="true"
    >
      {w > 100 && h > 100 && (
        <svg className="pointer-events-none block size-full overflow-visible" width={w} height={h}>
          <defs>
            <linearGradient id={`${id}-edge`} x1="0" y1="0" x2="1" y2="1">
              <stop stopColor="#72e3ff" />
              <stop offset=".3" stopColor="#137fbc" />
              <stop offset=".7" stopColor="#21b9fa" />
              <stop offset="1" stopColor="#8bddff" />
            </linearGradient>
            <linearGradient id={`${id}-ice`}>
              <stop stopColor="#d2f4ff" />
              <stop offset=".38" stopColor="#62c9ff" />
              <stop offset="1" stopColor="#2598df" />
            </linearGradient>
            <linearGradient id={`${id}-gold`}>
              <stop stopColor="#c78e32" />
              <stop offset=".5" stopColor="#fff1b5" />
              <stop offset="1" stopColor="#e9b749" />
            </linearGradient>
            <radialGradient id={`${id}-flare`}>
              <stop stopColor="#f3ffff" />
              <stop offset=".16" stopColor="#a2edff" stopOpacity=".95" />
              <stop offset=".42" stopColor="#28baff" stopOpacity=".55" />
              <stop offset="1" stopColor="#1091e8" stopOpacity="0" />
            </radialGradient>
            <filter
              id={`${id}-glow`}
              x="-12"
              y="-12"
              width={w + 24}
              height={h + 24}
              filterUnits="userSpaceOnUse"
            >
              <feGaussianBlur stdDeviation="1.7" />
            </filter>
          </defs>
          <path
            d={outline}
            fill="none"
            stroke="#169ee8"
            strokeWidth="3"
            opacity=".4"
            filter={paint('glow')}
          />
          <path
            d={outline}
            fill="none"
            stroke={paint('edge')}
            strokeWidth="1"
            strokeLinejoin="round"
          />
          {[false, true].map(mirrored => (
            <g
              key={String(mirrored)}
              transform={mirrored ? `translate(${w} 0) scale(-1 1)` : undefined}
            >
              <path d={topCorner} fill={paint('ice')} />
              <path d="M24 2H40L36 6H24Z" fill={paint('gold')} />
              <path d={bottomCorner} fill={paint('ice')} />
              <path
                d={`M${goldStart} ${h - 7}H${bottomTip - 8}L${bottomTip} ${h - 2}H${goldStart + 6}Z`}
                fill={paint('gold')}
              />
            </g>
          ))}
          <ellipse cx="2" cy={h * 0.17} rx="2.5" ry="28" fill={paint('flare')} />
          <ellipse cx={w - 2} cy={h * 0.17} rx="2.5" ry="28" fill={paint('flare')} />
          {[0.24, 0.5, 0.76].map(x => (
            <ellipse
              key={x}
              cx={w * x}
              cy={h - 2}
              rx={Math.min(85, w * 0.06)}
              ry="3"
              fill={paint('flare')}
            />
          ))}
          <ellipse
            cx={w * 0.12}
            cy="2"
            rx={Math.min(70, w * 0.05)}
            ry="2"
            fill={paint('flare')}
            opacity=".7"
          />
          <ellipse
            cx={w * 0.88}
            cy="2"
            rx={Math.min(70, w * 0.05)}
            ry="2"
            fill={paint('flare')}
            opacity=".7"
          />
        </svg>
      )}
    </div>
  );
}
