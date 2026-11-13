export function buildUtilityZones(context) {
  const {
    THREE,
    region,
    platform,
    wall,
    column,
    upsCabinet,
    box,
    M,
    cylinder,
    register,
    chiller,
    pump,
    pipe,
    installCCTV,
  } = context;
  // Electrical annex.
  const powerZone = region('power');
  platform(powerZone, -18, 0, 10.6, 12, 0xe1b16a);
  wall(powerZone, -18, -5.86, 10.5, 2.4);
  wall(powerZone, -23.2, 0, 11.6, 2.4, 'vertical', true);
  for (const x of [-22.7, -18, -13.3]) column(powerZone, x, -5.58, 2.55);
  upsCabinet(powerZone, -20.75, -3.45, 'UPS-01');
  upsCabinet(powerZone, -18.2, -3.45, 'BAT-01', 'BATTERY');
  upsCabinet(powerZone, -15.65, -3.45, 'SWGR-01', 'SWITCHGEAR');
  upsCabinet(powerZone, -20.75, 0.25, 'ATS-01', 'SWITCHGEAR');
  upsCabinet(powerZone, -18.2, 0.25, 'UPS-02');
  // Substation transformer behind cabinet.
  const transformer = new THREE.Group();
  transformer.position.set(-15.35, 0.44, 1.5);
  powerZone.add(transformer);
  box(transformer, 2.3, 1.65, 2.15, 0, 0.83, 0, M.brushed, { rounded: true });
  for (let k = 0; k < 3; k++) {
    cylinder(transformer, 0.3, 0.88, -0.63 + k * 0.63, 1.97, 0, M.gold);
    for (let j = 0; j < 4; j++)
      cylinder(transformer, 0.4, 0.09, -0.63 + k * 0.63, 1.58 + j * 0.2, 0, M.edge);
  }
  register(transformer, 'TR-01', {
    zone: 'power',
    type: 'TRANSFORMER',
    name: '변압기 TR-01',
    location: '전력 설비동',
    temp: 35.2,
    power: 0.8,
    capacity: 66,
    summary: '전압을 변환하여 데이터센터의 전원 분배 설비에 공급하는 변압기.',
  });
  // Danger floor markings and overhead copper-colored bus ducts.
  for (let x = -22.1; x < -13.8; x += 1.15)
    box(powerZone, 0.34, 0.012, 0.08, x, 0.41, 4.95, M.gold, { cast: false });
  box(powerZone, 8.6, 0.37, 0.46, -18.2, 2.84, -4.8, M.brushed);

  // Cooling annex: chillers, pumps, cooling-water piping.
  const coolingZone = region('cooling');
  platform(coolingZone, 18, -3, 10.6, 11.5, 0x68cddd);
  wall(coolingZone, 18, -8.58, 10.2, 2.3);
  wall(coolingZone, 23.15, -3, 10.8, 2.3, 'vertical', true);
  chiller(coolingZone, 16.24, -5.44, 'CH-01');
  chiller(coolingZone, 20.23, -5.44, 'CH-02');
  pump(coolingZone, 15.5, -0.87, 'PUMP-01');
  pump(coolingZone, 17.55, -0.87, 'PUMP-02');
  const exchanger = new THREE.Group();
  exchanger.position.set(20.2, 0.45, 0.23);
  coolingZone.add(exchanger);
  box(exchanger, 2.6, 1.65, 1.35, 0, 0.82, 0, M.brushed, { rounded: true });
  for (let i = 0; i < 18; i++)
    box(exchanger, 0.05, 1.4, 0.12, -1.14 + i * 0.134, 0.86, 0.7, M.cool, { cast: false });
  pipe(
    exchanger,
    [
      [-1.8, 0.9, -0.36],
      [-1.35, 0.9, -0.36],
      [1.25, 0.9, -0.36],
      [1.7, 0.9, -0.36],
    ],
    0.13,
    0x60cfec
  );
  register(exchanger, 'HEX-01', {
    zone: 'cooling',
    type: 'HEAT EXCHANGER',
    name: '열교환기 HEX-01',
    location: '냉각 설비동',
    temp: 20.1,
    power: 0.4,
    capacity: 72,
    summary: '냉각 회로 사이에서 열을 전달하고 루프를 분리하는 열교환기.',
  });
  // V36: Remove the two legacy free-standing cooling pipes. Their open-ended
  // cyan/amber curves remained visible even when the cooling overlay was OFF.
  // The V29+ utilityNetwork already owns the switchable, floor-accurate supply
  // and return paths; retain those paths and all equipment-integrated piping.
  for (let x = 15; x < 22; x += 1.2)
    box(coolingZone, 0.34, 0.025, 0.07, x, 0.411, 2.2, M.cool, { cast: false });
  // V33: one CCTV in each utility annex, mounted below the wall coping to avoid floating hardware.
  // Power rear wall: z=-5.86, height ends at y=2.78. Cooling rear wall: z=-8.58, height ends y=2.68.
  installCCTV(
    powerZone,
    'CCTV-PWR-01',
    -13.92,
    -5.76,
    -17.9,
    0.15,
    'UPS·배전 설비 점검',
    'back',
    2.32
  );
  installCCTV(
    coolingZone,
    'CCTV-CLG-01',
    22.0,
    -8.48,
    17.55,
    -2.25,
    '냉동기·순환 펌프 점검',
    'back',
    2.28
  );

  return { powerZone, coolingZone };
}
