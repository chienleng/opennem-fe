import * as FT from '@/constants/energy-fuel-techs/group-default.js'
import {
  PRICE,
  PRICE_ABOVE_300,
  PRICE_BELOW_0,
  CPI
} from '@/constants/data-types'

const PRICE_COLOUR = '#e34a33'

export function getFuelTechInOrder(data) {
  const fuelTechs = {}
  FT.DEFAULT_FUEL_TECH_ORDER.forEach(ft => {
    const find = data.find(d => d.fuel_tech === ft)
    if (find) {
      fuelTechs[ft] = find.id
    }
  })
  return fuelTechs
}

export function getFuelTechDomains(ids, type) {
  return ids ? FT.getFuelTechObjs(ids, type).reverse() : []
}

export function getFuelTechWithTypeDomains(ids, type) {
  const mutateIds = {}
  Object.keys(ids).forEach(key => {
    const split = ids[key].split('.')
    split.pop()
    const newId = `${split.join('.')}.${type}`
    mutateIds[key] = newId
  })
  return FT.getFuelTechObjs(mutateIds, type).reverse()
}

export function getTemperatureDomains(data) {
  return data.map(d => {
    return {
      id: d.id,
      domain: d.id,
      type: d.type,
      colour: '#e34a33'
    }
  })
}

export function getPriceDomains(res) {
  let domains = res.map(d => {
    return { id: d.id, domain: d.id, type: d.type, colour: PRICE_COLOUR }
  })
  if (domains.length > 0) {
    domains = [...domains, ...getDerivedPriceDomains()]
  }
  return domains
}

export function getDerivedPriceDomains() {
  return [
    {
      id: PRICE_ABOVE_300,
      domain: PRICE_ABOVE_300,
      type: PRICE,
      colour: PRICE_COLOUR
    },
    {
      id: PRICE_BELOW_0,
      domain: PRICE_BELOW_0,
      type: PRICE,
      colour: PRICE_COLOUR
    }
  ]
}

export function getVolWeightedPriceDomains() {
  return [
    {
      id: '_volWeightedPrice',
      domain: '_volWeightedPrice',
      type: 'price',
      colour: PRICE_COLOUR
    },
    {
      id: '_volWeightedPriceAbove300',
      domain: '_volWeightedPriceAbove300',
      type: 'price',
      colour: PRICE_COLOUR
    },
    {
      id: '_volWeightedPriceBelow0',
      domain: '_volWeightedPriceBelow0',
      type: 'price',
      colour: PRICE_COLOUR
    }
  ]
}

export function getInflationDomain(id) {
  return {
    id,
    domain: id,
    type: CPI,
    colour: '#e34a33'
  }
}
