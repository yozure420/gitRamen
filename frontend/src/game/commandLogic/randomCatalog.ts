const TOPPING_OPTIONS = ['ネギ', 'バター', 'チャーシュー', 'メンマ', '煮玉子', 'のり', 'もやし', 'コーン', 'ナルト'] as const
const BASE_RAMEN_OPTIONS = ['味噌ラーメン', '醤油ラーメン', '豚骨ラーメン', '家系ラーメン', '台湾ラーメン'] as const
const CALL_OPTIONS = ['味噌ラーメン特盛りおまち！', '醤油ラーメン全部のせおまち！', '豚骨ラーメン硬め濃いめおまち！'] as const
const LANE_NAME_OPTIONS = ['lane'] as const
const LANE_SWITCH_OPTIONS = ['lane1', 'lane2', 'lane3'] as const

export const pickRandomTopping = (): string => {
  const index = Math.floor(Math.random() * TOPPING_OPTIONS.length)
  return TOPPING_OPTIONS[index]
}

export const pickRandomBaseRamen = (): string => {
  const index = Math.floor(Math.random() * BASE_RAMEN_OPTIONS.length)
  return BASE_RAMEN_OPTIONS[index]
}

export const pickRandomCall = (): string => {
  const index = Math.floor(Math.random() * CALL_OPTIONS.length)
  return CALL_OPTIONS[index]
}

export const pickRandomLaneName = (): string => {
  const suffix = Math.floor(Math.random() * 90) + 10
  const index = Math.floor(Math.random() * LANE_NAME_OPTIONS.length)
  return `${LANE_NAME_OPTIONS[index]}-${suffix}`
}

export const pickRandomLaneSwitch = (): string => {
  const index = Math.floor(Math.random() * LANE_SWITCH_OPTIONS.length)
  return LANE_SWITCH_OPTIONS[index]
}

export const createCheckoutLaneCommand = (lane: string): string => `git checkout ${lane}`
