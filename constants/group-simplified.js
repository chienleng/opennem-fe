import * as FT from './fuelTech.js'

export const GROUP_NAME = 'group.simplified'

export const PUMPS = `${GROUP_NAME}.pumps`
export const BATTERY_CHARGING = `${GROUP_NAME}.battery_charging`
export const EXPORTS = `${GROUP_NAME}.exports`
export const IMPORTS = `${GROUP_NAME}.imports`

export const BIOENERGY = `${GROUP_NAME}.bioenergy`
export const DISTILLATE = `${GROUP_NAME}.distillate`
export const BATTERY_DISCHARGING = `${GROUP_NAME}.battery_discharging`
export const HYDRO = `${GROUP_NAME}.hydro`
export const WIND = `${GROUP_NAME}.wind`
export const COAL = `${GROUP_NAME}.coal`
export const GAS = `${GROUP_NAME}.gas`
export const SOLAR = `${GROUP_NAME}.solar`

export const FUEL_TECH_GROUP = {}
FUEL_TECH_GROUP[PUMPS] = [FT.PUMPS]
FUEL_TECH_GROUP[BATTERY_CHARGING] = [FT.BATTERY_CHARGING]
FUEL_TECH_GROUP[EXPORTS] = [FT.EXPORTS]
FUEL_TECH_GROUP[IMPORTS] = [FT.IMPORTS]
FUEL_TECH_GROUP[BIOENERGY] = [FT.BIOMASS, FT.BIOENERGY_BIOGAS]
FUEL_TECH_GROUP[DISTILLATE] = [FT.DISTILLATE]
FUEL_TECH_GROUP[BATTERY_DISCHARGING] = [FT.BATTERY_DISCHARGING]
FUEL_TECH_GROUP[HYDRO] = [FT.HYDRO]
FUEL_TECH_GROUP[WIND] = [FT.WIND]
FUEL_TECH_GROUP[COAL] = [FT.BROWN_COAL, FT.BLACK_COAL]
FUEL_TECH_GROUP[GAS] = [
  FT.GAS_STEAM,
  FT.GAS_CCGT,
  FT.GAS_OCGT,
  FT.GAS_RECIP,
  FT.GAS_LFG,
  FT.GAS_WCMG
]
FUEL_TECH_GROUP[SOLAR] = [FT.SOLAR, FT.ROOFTOP_SOLAR]

// Fuel tech group order
export const FUEL_TECH_ORDER = [
  BATTERY_CHARGING,
  PUMPS,
  EXPORTS,
  IMPORTS,
  COAL,
  BIOENERGY,
  DISTILLATE,
  GAS,
  BATTERY_DISCHARGING,
  HYDRO,
  WIND,
  SOLAR
]

// Fuel tech group colour
export const FUEL_TECH_GROUP_COLOUR = {}
FUEL_TECH_GROUP_COLOUR[PUMPS] = '#88AFD0'
FUEL_TECH_GROUP_COLOUR[BATTERY_CHARGING] = '#B2DAEF'
FUEL_TECH_GROUP_COLOUR[EXPORTS] = '#977AB1'
FUEL_TECH_GROUP_COLOUR[IMPORTS] = '#44146F'
FUEL_TECH_GROUP_COLOUR[COAL] = '#131313'
FUEL_TECH_GROUP_COLOUR[BIOENERGY] = '#A3886F'
FUEL_TECH_GROUP_COLOUR[DISTILLATE] = '#F35020'
FUEL_TECH_GROUP_COLOUR[GAS] = '#F48E1B'
FUEL_TECH_GROUP_COLOUR[BATTERY_DISCHARGING] = '#00A2FA'
FUEL_TECH_GROUP_COLOUR[HYDRO] = '#4582B4'
FUEL_TECH_GROUP_COLOUR[WIND] = '#417505'
FUEL_TECH_GROUP_COLOUR[SOLAR] = '#F8E71C'

// Fuel tech type
const LOAD = 'load'
const SOURCE = 'source'
export const FUEL_TECH_CATEGORY = {}
FUEL_TECH_CATEGORY[PUMPS] = LOAD
FUEL_TECH_CATEGORY[BATTERY_CHARGING] = LOAD
FUEL_TECH_CATEGORY[EXPORTS] = LOAD
FUEL_TECH_CATEGORY[IMPORTS] = SOURCE
FUEL_TECH_CATEGORY[COAL] = SOURCE
FUEL_TECH_CATEGORY[BIOENERGY] = SOURCE
FUEL_TECH_CATEGORY[DISTILLATE] = SOURCE
FUEL_TECH_CATEGORY[GAS] = SOURCE
FUEL_TECH_CATEGORY[BATTERY_DISCHARGING] = SOURCE
FUEL_TECH_CATEGORY[HYDRO] = SOURCE
FUEL_TECH_CATEGORY[WIND] = SOURCE
FUEL_TECH_CATEGORY[SOLAR] = SOURCE

// Fuel tech label
export const FUEL_TECH_LABEL = {}
FUEL_TECH_LABEL[PUMPS] = 'Pumps'
FUEL_TECH_LABEL[BATTERY_CHARGING] = 'Battery (Charging)'
FUEL_TECH_LABEL[EXPORTS] = 'Exports'
FUEL_TECH_LABEL[IMPORTS] = 'Imports'
FUEL_TECH_LABEL[COAL] = 'Coal'
FUEL_TECH_LABEL[BIOENERGY] = 'Bioenergy'
FUEL_TECH_LABEL[DISTILLATE] = 'Distillate'
FUEL_TECH_LABEL[GAS] = 'Gas'
FUEL_TECH_LABEL[BATTERY_DISCHARGING] = 'Battery (Discharging)'
FUEL_TECH_LABEL[HYDRO] = 'Hydro'
FUEL_TECH_LABEL[WIND] = 'Wind'
FUEL_TECH_LABEL[SOLAR] = 'Solar'
