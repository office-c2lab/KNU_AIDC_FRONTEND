export const buttonSurface =
  'overflow-hidden border border-[#214a68] border-t-[#3c9ac4] [background:linear-gradient(90deg,transparent,#68ceef,transparent)_center_top/100%_1px_no-repeat,linear-gradient(#061424,#061424)] shadow-[0_6px_20px_#01071359]';

export const panelSurface =
  'overflow-hidden border border-[#214a68] border-t-[#3c9ac4] [background:linear-gradient(90deg,transparent,#68ceef,transparent)_center_top/100%_1px_no-repeat,linear-gradient(90deg,#ab833e,#eed18c,#ab833e)_center_bottom/22px_1px_no-repeat,linear-gradient(#061424,#061424)] shadow-[0_6px_20px_#01071359]';

export const panelBase = `panel fixed top-[92px] bottom-[34px] z-[15] ${panelSurface} [background:#061424]! [backdrop-filter:none]! [box-shadow:0_6px_20px_#01071359]! [border-color:#214a68]! [&::before]:hidden! [&::after]:hidden!`;

export const tooltipSurface = `${panelSurface} pointer-events-none rounded-[6px] px-[12px] py-[8px] text-[14px] font-medium leading-normal text-[#e5efff] [font-family:var(--font-interface)]`;

export const panelTab =
  'border border-transparent bg-transparent text-[#b5cadd] transition-[background-color,border-color,box-shadow,color] duration-150 hover:border-[#398eb2] hover:text-[#edf8ff] hover:bg-[#0b2438] [&.active]:border-[#50b9dc] [&.active]:text-[#e5f8ff] [&.active]:bg-[#0c2a3f] [&.active]:[box-shadow:inset_0_-2px_0_#50b9dc] [&.active:hover]:border-[#83d8f2] [&.active:hover]:bg-[#10354b] focus-visible:outline-2 focus-visible:outline-[#76ddff] focus-visible:outline-offset-2';

export const panelScroll = 'panel-scroll relative z-[3] h-full overflow-y-auto overscroll-contain';

export const sectionTitle =
  'section-title -mx-4 mb-3.5 flex h-[46px] items-center justify-between gap-2 border-b border-[#214a68] bg-[#081b2d] px-[17px] text-[13px] font-semibold tracking-[0.2px]';

export const subTitle =
  'sub-title mt-[18px] mb-2.5 flex items-center gap-2 text-[13px] font-semibold text-[#dce9f8]';

export const moduleReadout =
  'module-readout whitespace-nowrap text-[11px] font-semibold tabular-nums text-[#b9d5f6]';

export const instrumentCard = 'border border-[#214a68] bg-[#081b2d]';

export const floorList = 'floor-list grid gap-1.5';

export const floorButton =
  'floor-button grid min-h-[48px] w-full grid-cols-[32px_minmax(0,1fr)_auto] items-center gap-2 rounded-[2px] border border-[#2e496a] bg-[#111f35] px-2 py-2 text-left transition-colors hover:border-[#527aa5] hover:bg-[#192d49]';

export const floorNumber =
  'floor-no grid min-h-[30px] place-items-center bg-[#1c3352] text-[12px] font-semibold tabular-nums text-[#c2dcff]';

export const healthStatus =
  'health inline-flex items-center gap-1 whitespace-nowrap text-[11px] text-[#73e1c0]';
