export const panelSurface =
  'overflow-hidden border border-[#5274a2a6] border-t-[#7a9dcebf] border-b-[#7aa4e0b8] [background:radial-gradient(ellipse_135%_140px_at_52%_-29px,#3d64a965,transparent_83%),_radial-gradient(ellipse_118%_105px_at_50%_101%,#3f65b450,transparent_90%),_linear-gradient(90deg,#2e518520,transparent_15%_85%,#2e518520),_linear-gradient(175deg,#111e37f4,#0a1328f5_52%,#0d1934f3)] [box-shadow:inset_0_0_0_1px_#7ba4e217,inset_0_-10px_22px_-18px_#79adff,0_10px_36px_#01061369] backdrop-blur-[13px]';

export const panelBase = `panel fixed top-[92px] bottom-[34px] z-[15] ${panelSurface}`;

export const tooltipSurface = `${panelSurface} pointer-events-none rounded-[6px] px-[12px] py-[8px] text-[14px] font-medium leading-normal text-[#e5efff] [font-family:var(--font-interface)]`;

export const panelTab =
  'border border-transparent bg-transparent text-[#afc8e4] transition-[background,border-color,box-shadow,color] duration-150 hover:border-[#7799c3a6] hover:text-[#edf6ff] hover:[background:linear-gradient(175deg,#34558280,#172c4cd9)] hover:[box-shadow:inset_0_1px_0_#b9d8ff26,inset_0_-8px_16px_-12px_#79adff80] [&.active]:border-[#8aafd9bf] [&.active]:text-[#f1f7ff] [&.active]:[background:radial-gradient(ellipse_at_50%_0%,#668ec54d,transparent_80%),linear-gradient(175deg,#304e79e6,#182b4bef)] [&.active]:[box-shadow:inset_0_1px_0_#c4dfff40,inset_0_-10px_18px_-14px_#8dbbffb3] [&.active:hover]:border-[#b3d3f5] [&.active:hover]:[box-shadow:inset_0_1px_0_#c4dfff66,inset_0_-10px_18px_-14px_#8dbbff] focus-visible:outline-2 focus-visible:outline-[#a6cbff] focus-visible:outline-offset-2';

export const panelScroll = 'panel-scroll relative z-[3] h-full overflow-y-auto overscroll-contain';

export const sectionTitle =
  'section-title -mx-4 mb-3.5 flex h-[46px] items-center justify-between gap-2 border-b border-[#5c7fab73] bg-[#172744cc] px-[17px] text-[13px] font-semibold tracking-[0.2px]';

export const subTitle =
  'sub-title mt-[18px] mb-2.5 flex items-center gap-2 text-[13px] font-semibold text-[#dce9f8]';

export const moduleReadout =
  'module-readout whitespace-nowrap text-[11px] font-semibold tabular-nums text-[#b9d5f6]';

export const instrumentCard = 'border border-[#2b4566a6] bg-[#101d34cc]';

export const floorList = 'floor-list grid gap-1.5';

export const floorButton =
  'floor-button grid min-h-[48px] w-full grid-cols-[32px_minmax(0,1fr)_auto] items-center gap-2 rounded-[2px] border border-[#2e496a] bg-[#111f35] px-2 py-2 text-left transition-colors hover:border-[#527aa5] hover:bg-[#192d49]';

export const floorNumber =
  'floor-no grid min-h-[30px] place-items-center bg-[#1c3352] text-[12px] font-semibold tabular-nums text-[#c2dcff]';

export const healthStatus =
  'health inline-flex items-center gap-1 whitespace-nowrap text-[11px] text-[#73e1c0]';
