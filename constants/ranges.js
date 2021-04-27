import _includes from 'lodash.includes'
import * as INTERVALS from '@/constants/interval-filters.js'

export const RANGE_1D = '1D'
export const RANGE_3D = '3D'
export const RANGE_7D = '7D'
export const RANGE_30D = '30D'
export const RANGE_1Y = '1Y'
export const RANGE_ALL = 'ALL'
export const RANGE_ALL_12MTH_ROLLING = 'ALL — 12 month rolling'

export const RANGES = [
  RANGE_1D,
  RANGE_3D,
  RANGE_7D,
  RANGE_30D,
  RANGE_1Y,
  [RANGE_ALL, RANGE_ALL_12MTH_ROLLING]
]

export const RANGE_INTERVALS = {}
RANGE_INTERVALS[RANGE_1D] = [INTERVALS.INTERVAL_5MIN, INTERVALS.INTERVAL_30MIN]
RANGE_INTERVALS[RANGE_3D] = [INTERVALS.INTERVAL_5MIN, INTERVALS.INTERVAL_30MIN]
RANGE_INTERVALS[RANGE_7D] = [INTERVALS.INTERVAL_5MIN, INTERVALS.INTERVAL_30MIN]
RANGE_INTERVALS[RANGE_30D] = [INTERVALS.INTERVAL_DAY]
RANGE_INTERVALS[RANGE_1Y] = [
  INTERVALS.INTERVAL_DAY,
  INTERVALS.INTERVAL_WEEK,
  INTERVALS.INTERVAL_MONTH
]
RANGE_INTERVALS[RANGE_ALL] = [
  INTERVALS.INTERVAL_MONTH,
  INTERVALS.INTERVAL_SEASON,
  INTERVALS.INTERVAL_QUARTER,
  INTERVALS.INTERVAL_HALFYEAR,
  INTERVALS.INTERVAL_FINYEAR,
  INTERVALS.INTERVAL_YEAR
]

export const RANGE_DEFAULT_INTERVAL = {}
RANGE_DEFAULT_INTERVAL[RANGE_1D] = INTERVALS.INTERVAL_30MIN
RANGE_DEFAULT_INTERVAL[RANGE_3D] = INTERVALS.INTERVAL_30MIN
RANGE_DEFAULT_INTERVAL[RANGE_7D] = INTERVALS.INTERVAL_30MIN
RANGE_DEFAULT_INTERVAL[RANGE_30D] = INTERVALS.INTERVAL_DAY
RANGE_DEFAULT_INTERVAL[RANGE_1Y] = INTERVALS.INTERVAL_WEEK
RANGE_DEFAULT_INTERVAL[RANGE_ALL] = INTERVALS.INTERVAL_MONTH

export function isPowerRange(range) {
  return range === RANGE_1D || range === RANGE_3D || range === RANGE_7D
}

export const FuelTechRanges = [
  {
    range: RANGE_1D,
    intervals: [INTERVALS.INTERVAL_5MIN, INTERVALS.INTERVAL_30MIN],
    defaultInterval: INTERVALS.INTERVAL_30MIN
  },
  {
    range: RANGE_3D,
    intervals: [INTERVALS.INTERVAL_5MIN, INTERVALS.INTERVAL_30MIN],
    defaultInterval: INTERVALS.INTERVAL_30MIN
  },
  {
    range: RANGE_7D,
    intervals: [INTERVALS.INTERVAL_5MIN, INTERVALS.INTERVAL_30MIN],
    defaultInterval: INTERVALS.INTERVAL_30MIN
  },
  {
    range: RANGE_30D,
    intervals: [INTERVALS.INTERVAL_DAY],
    defaultInterval: INTERVALS.INTERVAL_DAY
  },
  {
    range: RANGE_1Y,
    intervals: [
      INTERVALS.INTERVAL_DAY,
      INTERVALS.INTERVAL_WEEK,
      INTERVALS.INTERVAL_MONTH
    ],
    defaultInterval: INTERVALS.INTERVAL_WEEK
  },
  {
    range: RANGE_ALL,
    intervals: [
      INTERVALS.INTERVAL_MONTH,
      INTERVALS.INTERVAL_SEASON,
      INTERVALS.INTERVAL_QUARTER,
      INTERVALS.INTERVAL_HALFYEAR,
      INTERVALS.INTERVAL_FINYEAR,
      INTERVALS.INTERVAL_YEAR
    ],
    defaultInterval: INTERVALS.INTERVAL_MONTH
  }
]

export function getDefaultIntervalByRange(range) {
  return RANGE_DEFAULT_INTERVAL[range] || null
}

export function isValidRangeInterval(range, interval) {
  return _includes(RANGE_INTERVALS[range], interval)
}

export const FACILITY_RANGES = [
  RANGE_1D,
  RANGE_3D,
  RANGE_7D,
  RANGE_30D,
  RANGE_1Y,
  RANGE_ALL
]
export const FACILITY_RANGE_INTERVALS = {}
FACILITY_RANGE_INTERVALS[RANGE_1D] = [
  INTERVALS.INTERVAL_5MIN,
  INTERVALS.INTERVAL_30MIN
]
FACILITY_RANGE_INTERVALS[RANGE_3D] = [
  INTERVALS.INTERVAL_5MIN,
  INTERVALS.INTERVAL_30MIN
]
FACILITY_RANGE_INTERVALS[RANGE_7D] = [
  INTERVALS.INTERVAL_5MIN,
  INTERVALS.INTERVAL_30MIN
]
FACILITY_RANGE_INTERVALS[RANGE_30D] = [INTERVALS.INTERVAL_DAY]
FACILITY_RANGE_INTERVALS[RANGE_1Y] = [
  INTERVALS.INTERVAL_DAY,
  INTERVALS.INTERVAL_WEEK,
  INTERVALS.INTERVAL_MONTH
]
FACILITY_RANGE_INTERVALS[RANGE_ALL] = [
  INTERVALS.INTERVAL_MONTH,
  INTERVALS.INTERVAL_SEASON,
  INTERVALS.INTERVAL_QUARTER,
  INTERVALS.INTERVAL_HALFYEAR,
  INTERVALS.INTERVAL_FINYEAR,
  INTERVALS.INTERVAL_YEAR
]
