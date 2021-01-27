const PRICE_DIVISOR = 16000 // -1000 to 15000
const PRICE_OFFSET = 1000
const PRICE_DOMAIN = [0, 0.0625, 0.0656, 0.0688, 0.0813, 0.125, 0.375, 1]
const PRICE_DOMAIN_LABEL = [
  '-$1k',
  '$0',
  '$50',
  '$100',
  '$300',
  '$1k',
  '$5k',
  '$15k'
]
const PRICE_RANGE = [
  '#613C9E',
  '#28609A',
  '#76ACCE',
  '#F0BA9F',
  '#DF8E73',
  '#C5594C',
  '#99292F',
  '#621020'
]

export const periods = [
  {
    label: 'Multi Year / day',
    value: 'multiyear/day',
    dateFormatString: 'd MMM y'
  },
  {
    label: 'All / Month',
    value: 'all/month',
    dateFormatString: 'MMM y'
  }
]

export const metrics = [
  {
    label: 'Carbon intensity',
    value: 'carbonIntensity',
    divisor: 1000,
    domain: [0, 0.1, 0.55, 1],
    range: ['#2D9B14', '#ffe310', '#803D11', '#000000'],
    unit: ' kgCO₂e/MWh',
    numberFormatString: ',.0f',
    legendType: 'ramp'
  },
  {
    label: 'Renewables proportion (of demand)',
    value: 'renewablesProportion',
    divisor: 100,
    domain: [0, 0.5, 1],
    range: ['#fff', '#52BCA3', 'darkgreen'],
    unit: '%',
    numberFormatString: ',.0f',
    legendType: 'ramp'
  },
  {
    label: 'Wind proportion (of demand)',
    value: 'windProportion',
    divisor: 100,
    domain: [0, 0.5, 1],
    range: ['#fff', '#88B653', '#417505'],
    unit: '%',
    numberFormatString: ',.0f',
    legendType: 'ramp'
  },

  {
    label: 'Solar proportion (of demand)',
    value: 'solarProportion',
    divisor: 100,
    domain: [0, 0.5, 1],
    range: ['#fff', '#F3E13E', '#F0D800'],
    unit: '%',
    numberFormatString: ',.0f',
    legendType: 'ramp'
  },
  {
    label: 'Coal proportion (of demand)',
    value: 'coalProportion',
    divisor: 100,
    domain: [0, 0.001, 0.9],
    range: ['#52BCA3', '#ccc', '#131313'],
    unit: '%',
    numberFormatString: ',.0f',
    legendType: 'ramp',
    showZeroBlock: true
  },
  {
    label: 'Gas proportion (of demand)',
    value: 'gasProportion',
    divisor: 100,
    domain: [0, 0.001, 0.5],
    range: ['#52BCA3', '#ccc', '#F48E1B'],
    unit: '%',
    numberFormatString: ',.0f',
    legendType: 'ramp',
    showZeroBlock: true
  },

  {
    label: 'Net interconnector flow (of demand)',
    value: 'netInterconnectorFlow',
    divisor: 50, // -25 to 25.
    offset: 25,
    domain: [0, 0.5, 1],
    range: ['#2E69A3', '#fff', '#AC3837'], // F5EDE9
    domainLabel: ['Export', 'Import'],
    unit: '%',
    numberFormatString: ',.0f',
    legendType: 'ramp'
  },

  {
    label: 'Wind value',
    value: 'windValue',
    divisor: PRICE_DIVISOR,
    offset: PRICE_OFFSET,
    domain: PRICE_DOMAIN,
    domainLabel: PRICE_DOMAIN_LABEL,
    range: PRICE_RANGE,
    unit: '',
    numberFormatString: '$,.2f',
    legendType: 'swatch'
  },
  {
    label: 'Solar value',
    value: 'solarValue',
    divisor: PRICE_DIVISOR,
    offset: PRICE_OFFSET,
    domain: PRICE_DOMAIN,
    domainLabel: PRICE_DOMAIN_LABEL,
    range: PRICE_RANGE,
    unit: '',
    numberFormatString: '$,.2f',
    legendType: 'swatch'
  },
  {
    label: 'Coal value',
    value: 'coalValue',
    divisor: PRICE_DIVISOR,
    offset: PRICE_OFFSET,
    domain: PRICE_DOMAIN,
    domainLabel: PRICE_DOMAIN_LABEL,
    range: PRICE_RANGE,
    unit: '',
    numberFormatString: '$,.2f',
    legendType: 'swatch'
  },
  {
    label: 'Gas value',
    value: 'gasValue',
    divisor: PRICE_DIVISOR,
    offset: PRICE_OFFSET,
    domain: PRICE_DOMAIN,
    domainLabel: PRICE_DOMAIN_LABEL,
    range: PRICE_RANGE,
    unit: '',
    numberFormatString: '$,.2f',
    legendType: 'swatch'
  },
  {
    label: 'Hydro value',
    value: 'hydroValue',
    divisor: PRICE_DIVISOR,
    offset: PRICE_OFFSET,
    domain: PRICE_DOMAIN,
    domainLabel: PRICE_DOMAIN_LABEL,
    range: PRICE_RANGE,
    unit: '',
    numberFormatString: '$,.2f',
    legendType: 'swatch'
  },

  {
    label: 'Volume-weighted price',
    value: 'price',
    divisor: PRICE_DIVISOR,
    offset: PRICE_OFFSET,
    domain: PRICE_DOMAIN,
    domainLabel: PRICE_DOMAIN_LABEL,
    range: PRICE_RANGE,
    unit: '',
    numberFormatString: '$,.2f',
    legendType: 'swatch'
  },
  {
    label: 'Volume-weighted price (inflation adjusted)',
    value: 'inflatedPrice',
    divisor: PRICE_DIVISOR,
    offset: PRICE_OFFSET,
    domain: PRICE_DOMAIN,
    domainLabel: PRICE_DOMAIN_LABEL,
    range: PRICE_RANGE,
    unit: '',
    numberFormatString: '$,.2f',
    legendType: 'swatch'
  },

  {
    label: 'Average temperature',
    value: 'temperature',
    divisor: 60, // -10 to 50
    offset: 10,
    domain: [0, 0.3, 0.6, 1],
    range: ['#08306B', '#9ECAE1', '#FD9272', '#67000D'],
    unit: '°C',
    numberFormatString: ',.1f',
    legendType: 'ramp'
  },
  {
    label: 'Max temperature',
    value: 'maxTemperature',
    divisor: 60, // -10 to 50
    offset: 10,
    domain: [0, 0.3, 0.6, 1],
    range: ['#08306B', '#9ECAE1', '#FD9272', '#67000D'],
    unit: '°C',
    numberFormatString: ',.1f',
    legendType: 'ramp'
  }
]
