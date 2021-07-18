<template>
  <table class="summary-list">
    <caption>
      <dates-display
        v-if="ready && hasDatetime"
        :is-hovering="hoverOn"
        :focus-on="focusOn"
        :hovered-date="hoverDate ? hoverDate.getTime() : null"
        :focus-date="focusDate ? focusDate.getTime() : null"
        :start-date="startTime"
        :end-date="endTime"
        :range="range"
        :interval="interval"
        class="date-display"
      />
    </caption>

    <thead class="unit-header-row">
      <tr>
        <th style="width: 100px;">
          Unit
          <small v-if="areAllUnitsOfSameFuelTech">
            {{ getFirstUnitFuelTech }}
          </small>
        </th>

        <th
          class="align-right"
          style="width: 80px;">
          Registered cap.
          <small>MW</small>
        </th>

        <th
          v-if="hasEmissions"
          class="align-right"
          style="width: 80px;">
          Emission Intensity
          <small>kgCO₂e/MWh</small>
        </th>

        <th
          class="data-col date-col align-right hover-cell"
          style="width: 100px;">
          <span v-if="isEnergyType && !isYAxisAveragePower">
            Energy
            <small>{{ powerEnergyUnit }}</small>
          </span>

          <span v-if="!isEnergyType && !(hoverOn || focusOn)">
            Energy
            <small>{{ powerEnergyUnit }}h</small>
          </span>

          <span v-if="isEnergyType && isYAxisAveragePower">
            Av. Power
            <small>{{ powerEnergyUnit }}</small>
          </span>

          <span v-if="!isEnergyType && (hoverOn || focusOn)">
            Power
            <small>{{ powerEnergyUnit }}</small>
          </span>
        </th>

        <th
          v-if="units.length > 1"
          style="width: 150px;">
          <span>
            Proportion
            <small>%</small>
          </span>
        </th>

        <th
          class="data-col align-right hover-cell"
          style="width: 80px;">
          Cap. factor
          <small>%</small>
        </th>

        <th
          v-if="hasMarketValue"
          class="data-col align-right hover-cell"
          style="width: 100px;">
          Market value
          <small>${{ marketValueDisplayUnit }}</small>
        </th>

        <th
          v-if="hasMarketValue"
          class="data-col align-right hover-cell"
          style="width: 100px;">
          Av. Value
          <small>$</small>
        </th>

      </tr>
    </thead>
    <tbody>
      <tr
        v-for="(d, i) in filteredUnits"
        :key="i"
        :class="{
          'is-inactive': !isActive(d.status),
          'is-hidden-unit': d.isHidden
        }"
        @click.exact="handleRowClick(d.code)"
        @click.shift.exact="handleRowShiftClick(d.code)"
        @mouseenter="handleMouseEnter(d.code, d.status)"
        @mouseleave="handleMouseLeave">
        <td
          v-tooltip.left="getTooltip(d)"
          v-highlight="showFields"
          class="unit-name"
          @click.self="() => handleFieldClick(`${d.code} label`, d.code)"
        >
          <div
            :style="{ backgroundColor: d.colour}"
            class="colour-square" />
          <span>{{ d.code }}</span>
          <span v-if="!areAllUnitsOfSameFuelTech">— {{ getFuelTechLabel(d.fuelTechLabel) }}</span>
        </td>

        <td
          v-highlight="showFields"
          class="align-right"
          @click.self="() => handleFieldClick(`${d.code} reg cap`, d.registeredCapacity)">
          {{ d.registeredCapacity }}
        </td>

        <td
          v-highlight="showFields"
          v-if="hasEmissions"
          class="align-right"
          @click.self="() => handleFieldClick(`${d.code} intensity`, d.emissionIntensity)">
          {{ d.emissionIntensity | formatValue }}
        </td>

        <td
          v-if="isAveragePower"
          class="align-right hover-cell">
          <span v-if="hoverOn">
            {{ convertValue(getAvPowerHoverValue(d.id)) | formatValue }}
          </span>
          <span v-if="!hoverOn && focusOn">
            {{ convertValue(getAvPowerFocusValue(d.id)) | formatValue }}
          </span>
          <span v-if="!hoverOn && !focusOn">
            {{ convertValue(summary[d.id].avPower) | formatValue }}
          </span>
        </td>

        <td
          v-else
          class="align-right hover-cell">
          <span v-if="hoverOn">
            {{ convertValue(getHoverValue(d.id)) | formatValue }}
          </span>
          <span v-if="!hoverOn && focusOn">
            {{ convertValue(getFocusValue(d.id)) | formatValue }}
          </span>
          <span v-if="!hoverOn && !focusOn">
            {{ convertValue(summary[d.id].energy) | formatValue }}
          </span>
        </td>

        <td v-if="units.length > 1">
          <UnitListBar
            v-if="ready"
            :bar-width="150"
            :colour="areAllUnitsOfSameFuelTech ? getFirstUnitFuelTechColour : d.colour"
            :value="getCellValue(d)"
            :total="getCellTotalValue(d)"
          />
        </td>

        <td class="align-right hover-cell">
          <span v-if="hoverOn">
            {{ calculateCapacityFactor(getHoverPowerValue(d.id), d.registeredCapacity) | percentageFormatNumber }}
          </span>
          <span v-if="!hoverOn && focusOn">
            {{ calculateCapacityFactor(getFocusPowerValue(d.id), d.registeredCapacity) | percentageFormatNumber }}
          </span>
          <span v-if="!hoverOn && !focusOn">
            {{ summary[d.id].capFactor | percentageFormatNumber }}
          </span>
        </td>

        <td
          v-if="hasMarketValue"
          class="align-right hover-cell">
          <span v-if="hoverOn">
            {{ convertMarketValue(getHoverValue(d.marketValueId)) | formatValue('$') }}<template v-if="getHoverValue(d.marketValueId)">{{ marketValueDisplayUnit }}</template>
          </span>
          <span v-if="!hoverOn && focusOn">
            {{ convertMarketValue(getFocusValue(d.marketValueId)) | formatValue('$') }}<template v-if="getFocusValue(d.marketValueId)">{{ marketValueDisplayUnit }}</template>
          </span>
          <span v-if="!hoverOn && !focusOn">
            {{ convertMarketValue(summary[d.id].marketValue) | formatValue('$') }}<template v-if="summary[d.id].marketValue">{{ marketValueDisplayUnit }}</template>  
          </span>
        </td>

        <td
          v-if="hasMarketValue"
          class="align-right hover-cell">
          <span v-if="hoverOn">
            {{ calculateAveragePrice(getHoverValue(d.marketValueId), getHoverValue(d.id)) | formatCurrency }}
          </span>
          <span v-if="!hoverOn && focusOn">
            {{ calculateAveragePrice(getFocusValue(d.marketValueId), getFocusValue(d.id)) | formatCurrency }}
          </span>
          <span v-if="!hoverOn && !focusOn">
            {{ calculateAveragePrice(summary[d.id].marketValue, summary[d.id].energy) | formatCurrency }}
          </span>
        </td>

      </tr>
    </tbody>

    <tfoot v-if="units.length > 1">
      <tr>
        <th>Total</th>

        <th class="align-right cell-value">{{ operatingUnitsTotalCapacity }}</th>

        <th
          v-if="hasEmissions"
          class="align-right cell-value"/>

        <th
          v-if="isAveragePower"
          class="align-right hover-cell cell-value">
          <span v-if="hoverOn">
            {{ convertValue(hoverAveragePowerTotal) | formatValue }}
          </span>
          <span v-if="!hoverOn && focusOn">
            {{ convertValue(focusAveragePowerTotal) | formatValue }}
          </span>
          <span v-if="!hoverOn && !focusOn">
            {{ convertValue(summary.totalAvPower) | formatValue }}
          </span>
        </th>

        <th
          v-else
          class="align-right hover-cell cell-value">
          <span v-if="hoverOn">
            {{ convertValue(hoverTotal) | formatValue }}
          </span>
          <span v-if="!hoverOn && focusOn">
            {{ convertValue(focusTotal) | formatValue }}
          </span>
          <span v-if="!hoverOn && !focusOn">
            {{ convertValue(summary.totalEnergy) | formatValue }}
          </span>
        </th>

        <th v-if="units.length > 1" />

        <th class="align-right hover-cell cell-value">
          Av.
          <span v-if="hoverOn">
            {{ calculateCapacityFactor(isEnergyType ? hoverAveragePowerTotal : hoverTotal, operatingUnitsTotalCapacity) | percentageFormatNumber }}
          </span>
          <span v-if="!hoverOn && focusOn">
            {{ calculateCapacityFactor(isEnergyType ? focusAveragePowerTotal : focusTotal, operatingUnitsTotalCapacity) | percentageFormatNumber }}
          </span>
          <span v-if="!hoverOn && !focusOn">
            {{ summary.capFactor | percentageFormatNumber }}
          </span>
        </th>

        <th
          v-if="hasMarketValue"
          class="align-right hover-cell cell-value">
          <span v-if="hoverOn">
            {{ convertMarketValue(hoverTotalMarketValue) | formatValue('$') }}<template v-if="hoverTotalMarketValue">{{ marketValueDisplayUnit }}</template> 
          </span>
          <span v-if="!hoverOn && focusOn">
            {{ convertMarketValue(focusTotalMarketValue) | formatValue('$') }}<template v-if="focusTotalMarketValue">{{ marketValueDisplayUnit }}</template>
          </span>
          <span v-if="!hoverOn && !focusOn">
            {{ convertMarketValue(summary.totalMarketValue) | formatValue('$') }}<template v-if="summary.totalMarketValue">{{ marketValueDisplayUnit }}</template> 
          </span>
        </th>

        <th
          v-if="hasMarketValue"
          class="align-right hover-cell cell-value">
          <span v-if="hoverOn">
            {{ hoverTotalVolWeightedPrice | formatCurrency }}
          </span>
          <span v-if="!hoverOn && focusOn">
            {{ focusTotalVolWeightedPrice | formatCurrency }}
          </span>
          <span v-if="!hoverOn && !focusOn">
            {{ summary.volWeightedPrice | formatCurrency }}
          </span>
        </th>
      </tr>
    </tfoot>

  </table>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
import _cloneDeep from 'lodash.clonedeep'
import * as FT from '~/constants/energy-fuel-techs/group-default.js'
import {
  FACILITY_OPERATING,
  FACILITY_RETIRED,
  getFacilityStatusLabelById
} from '@/constants/facility-status.js'
import DatesDisplay from '@/components/SummaryTable/DatesDisplay'
import UnitListBar from './UnitListBar'

export default {
  components: {
    DatesDisplay,
    UnitListBar
  },
  props: {
    ready: {
      type: Boolean,
      default: false
    },
    isEnergyType: {
      type: Boolean,
      default: false
    },
    isYAxisAveragePower: {
      type: Boolean,
      default: false
    },
    units: {
      type: Array,
      default: () => []
    },
    powerEnergyUnit: {
      type: String,
      default: () => ''
    },
    dataset: {
      type: Array,
      default: () => []
    },
    averagePowerDataset: {
      type: Array,
      default: () => []
    },
    hiddenCodes: {
      type: Array,
      default: () => []
    },
    hoverOn: {
      type: Boolean,
      default: false
    },
    hoverDate: {
      type: Date,
      default: null
    },
    focusOn: {
      type: Boolean,
      default: false
    },
    focusDate: {
      type: Date,
      default: null
    },
    range: {
      type: String,
      default: null
    },
    interval: {
      type: String,
      default: null
    },
    hasMarketValue: {
      type: Boolean,
      default: false
    },
    convertValue: {
      type: Function,
      default: d => d
    },
    convertMarketValue: {
      type: Function,
      default: d => d
    },
    marketValueDisplayUnit: {
      type: String,
      default: ''
    },
    hasEmissions: {
      type: Boolean,
      default: false
    }
  },

  computed: {
    ...mapGetters({
      showFields: 'feedback/showFields'
    }),
    isAveragePower() {
      return this.isEnergyType && this.isYAxisAveragePower
    },
    filteredUnits() {
      const units = _cloneDeep(this.units)
      units.forEach(u => {
        const isHidden = this.hiddenCodes.find(d => d === u.code)
        u.isHidden = isHidden ? true : false
      })
      return units
    },
    operatingUnits() {
      return this.filteredUnits.filter(u => u.status === FACILITY_OPERATING)
    },
    operatingUnitsTotalCapacity() {
      return this.calculateTotalRegisteredCapacity(this.operatingUnits)
    },
    areAllUnitsOfSameFuelTech() {
      let same = true,
        currentFuelTech =
          this.units.length > 0 ? this.units[0].fuelTechLabel : null

      this.units.forEach(u => {
        if (u.fuelTechLabel !== currentFuelTech) {
          same = false
        }
      })
      return same
    },
    getFirstUnitFuelTech() {
      return this.units.length > 0
        ? FT.FUEL_TECH_LABEL[this.units[0].fuelTechLabel]
        : null
    },
    getFirstUnitFuelTechColour() {
      return this.units.length > 0
        ? FT.DEFAULT_FUEL_TECH_COLOUR[this.units[0].fuelTechLabel]
        : null
    },

    startTime() {
      if (this.dataset.length > 0) {
        return this.dataset[0].time
      }
      return null
    },
    endTime() {
      if (this.dataset.length > 0) {
        return this.dataset[this.dataset.length - 1].time
      }
      return null
    },

    hasDatetime() {
      return (
        (this.startTime && this.endTime) || this.hoverDate || this.focusDate
      )
    },

    summary() {
      // dataset length not including undefined or null values
      const ds = this.dataset.filter(d => {
        let allNulls = true
        this.units.forEach(u => {
          const id = u.id
          if (d[id] || d[id] === 0) {
            allNulls = false
          }
        })
        return !allNulls
      })

      const summary = {}
      const unitNonNullLength = {}
      let totalOperatingRegCap = 0,
        totalPower = null,
        totalEnergy = null,
        totalMarketValue = null

      // setup and calculate total Registered capacity
      this.units.forEach(u => {
        const id = u.id
        summary[id] = {
          power: null,
          avPower: null,
          energy: null,
          capFactor: null,
          marketValue: null
        }
        unitNonNullLength[id] = 0
        if (u.status === FACILITY_OPERATING) {
          totalOperatingRegCap += u.registeredCapacity
        }
      })

      const getEnergy = value => {
        if (this.isEnergyType) {
          return value
        } else {
          // calculate energy (MWh) += power * 5mins/60
          const mins = this.interval === '30m' ? 30 : 5
          return (value * mins) / 60
        }
      }

      const getPower = (obj, id) => {
        if (this.isEnergyType) {
          // get power from average power dataset
          const find = this.averagePowerDataset.find(d => d.time === obj.time)
          return find ? find[id] : null
        } else {
          return obj[id]
        }
      }

      // sum power / energy for each Unit
      ds.forEach(d => {
        this.units.forEach(u => {
          const id = u.id
          const marketValueId = u.marketValueId

          if (d[id] || d[id] === 0) {
            summary[id].power += getPower(d, id)
            summary[id].energy += getEnergy(d[id])
            summary[id].marketValue += d[marketValueId]
            unitNonNullLength[id]++
          }
        })
      })

      console.log(summary)

      this.units.forEach(u => {
        const id = u.id
        const marketValueId = u.marketValueId

        // calculate capacity factor - av power / registered capacity
        // - average power is calculated using non null length
        // (total energy) / (total capacity*no. intervals)
        console.log(
          summary[id].power,
          summary[id].energy,
          unitNonNullLength[id],
          u.registeredCapacity,
          ds.length,
          this.interval
        )
        const cp1 =
          (summary[id].energy / (u.registeredCapacity * 24 * ds.length)) * 100
        const cp2 =
          (summary[id].power / unitNonNullLength[id] / u.registeredCapacity) *
          100
        console.log(cp1, cp2)

        summary[id].capFactor = unitNonNullLength[id]
          ? (summary[id].power / unitNonNullLength[id] / u.registeredCapacity) *
            100
          : null

        summary[id].avPower = unitNonNullLength[id]
          ? summary[id].power / unitNonNullLength[id]
          : null

        summary[id].avMarketValue = unitNonNullLength[id]
          ? summary[id].marketValue / unitNonNullLength[id]
          : null

        totalPower += summary[id].power
        totalEnergy += summary[id].energy
        totalMarketValue += summary[id].marketValue
      })

      const hasData = ds.length > 0

      summary.totalPower = hasData ? totalPower : null
      summary.totalAvPower = hasData ? totalPower / ds.length : null
      summary.totalEnergy = hasData ? totalEnergy : null
      summary.avPower = hasData ? totalPower / ds.length : null

      const tCp =
        (summary.totalEnergy / (totalOperatingRegCap * 24 * ds.length)) * 100
      console.log('total', tCp, totalOperatingRegCap)
      summary.capFactor = hasData
        ? summary.avPower === 0
          ? 0
          : (summary.avPower / totalOperatingRegCap) * 100
        : null
      summary.totalMarketValue = hasData ? totalMarketValue : null
      summary.totalAvMarketValue = hasData ? totalMarketValue / ds.length : null
      summary.volWeightedPrice = hasData
        ? this.isEnergyType
          ? totalMarketValue / totalEnergy
          : totalMarketValue / totalPower
        : null

      return summary
    },

    hoverData() {
      return this.getData(this.hoverDate)
    },
    hoverAveragePowerData() {
      return this.getAveragePowerData(this.hoverDate)
    },
    hoverTotal() {
      return this.getTotal('id', this.hoverData)
    },
    hoverAveragePowerTotal() {
      return this.getTotal('id', this.hoverAveragePowerData)
    },
    hoverTotalMarketValue() {
      return this.getTotal('marketValueId', this.hoverData)
    },
    hoverTotalVolWeightedPrice() {
      return this.hoverData ? this.hoverData._volWeightedPrice : null
    },

    focusData() {
      return this.getData(this.focusDate)
    },
    focusAveragePowerData() {
      return this.getAveragePowerData(this.focusDate)
    },
    focusTotal() {
      return this.getTotal('id', this.focusData)
    },
    focusAveragePowerTotal() {
      return this.getTotal('id', this.focusAveragePowerData)
    },
    focusTotalMarketValue() {
      return this.getTotal('marketValueId', this.focusData)
    },
    focusTotalVolWeightedPrice() {
      return this.focusData ? this.focusData._volWeightedPrice : null
    }
  },

  methods: {
    ...mapActions({
      addField: 'feedback/addField'
    }),
    handleFieldClick(key, value) {
      this.addField({ key, value })
    },
    formatDate(d) {
      return this.$options.filters.formatLocalDate(d)
    },

    getStatusLabel(status) {
      return getFacilityStatusLabelById(status)
    },

    isActive(status) {
      return status === FACILITY_OPERATING
    },

    isRetired(status) {
      return status === FACILITY_RETIRED
    },

    getTooltip(d) {
      if (this.isActive(d.status)) {
        return `First seen ${this.formatDate(d.dataFirstSeen)}`
      }
      if (this.isRetired(d.status)) {
        return `${this.getStatusLabel(d.status)} on ${this.formatDate(
          d.dataLastSeen
        )}`
      }
      return `${this.getStatusLabel(d.status)} on ${this.formatDate(
        d.dataFirstSeen
      )}`
    },

    getData(date) {
      return date && this.dataset.length > 0
        ? this.dataset.find(d => d.time === date.getTime())
        : null
    },
    getAveragePowerData(date) {
      return date && this.averagePowerDataset.length > 0
        ? this.averagePowerDataset.find(d => d.time === date.getTime())
        : null
    },
    getTotal(prop, data) {
      if (!data) {
        return null
      }
      let total = null
      this.operatingUnits.forEach(u => {
        const value = data[u[prop]]
        if (value || value === 0) {
          total += value
        }
      })
      return total
    },

    handleMouseEnter(code, status) {
      if (this.isActive(status)) {
        this.$emit('codeHover', code)
      }
    },
    handleMouseLeave() {
      this.$emit('codeHover', '')
    },
    handleRowClick(code) {
      if (!this.showFields) {
        this.$emit('codeClick', code)
      }
    },
    handleRowShiftClick(code) {
      if (!this.showFields) {
        this.$emit('codeShiftClick', code)
      }
    },

    getFuelTechLabel(code) {
      return FT.FUEL_TECH_LABEL[code]
    },

    getCellValue(d) {
      if (this.hoverOn) {
        return this.getHoverValue(d.id)
      }
      if (!this.hoverOn && this.focusOn) {
        return this.getFocusValue(d.id)
      }
      if (!this.hoverOn && !this.focusOn) {
        return this.summary[d.id].energy
      }
    },
    getCellTotalValue(d) {
      if (this.hoverOn) {
        return this.hoverTotal
      }
      if (!this.hoverOn && this.focusOn) {
        return this.focusTotal
      }
      if (!this.hoverOn && !this.focusOn) {
        return this.summary.totalEnergy
      }
    },

    getHoverValue(id) {
      return this.hoverData ? this.hoverData[id] : null
    },
    getAvPowerHoverValue(id) {
      return this.hoverAveragePowerData ? this.hoverAveragePowerData[id] : null
    },
    getFocusValue(id) {
      return this.focusData ? this.focusData[id] : null
    },
    getAvPowerFocusValue(id) {
      return this.focusAveragePowerData ? this.focusAveragePowerData[id] : null
    },
    getHoverPowerValue(id) {
      const hover = this.isEnergyType
        ? this.hoverAveragePowerData
        : this.hoverData
      return hover ? hover[id] : null
    },
    getFocusPowerValue(id) {
      const focus = this.isEnergyType
        ? this.focusAveragePowerData
        : this.focusData
      return focus ? focus[id] : null
    },
    calculateCapacityFactor(value, capacity) {
      return value ? (value / capacity) * 100 : 0
    },
    calculateTotalRegisteredCapacity(units) {
      let total = null
      units.forEach(u => {
        const value = u.registeredCapacity
        if (value || value === 0) {
          total += value
        }
      })
      return total
    },
    calculateAveragePrice(marketValue, energy) {
      return marketValue && energy ? marketValue / energy : null
    }
  }
}
</script>

<style lang="scss" scoped>
@import '~/assets/scss/responsive-mixins.scss';
@import '~/assets/scss/variables.scss';

.is-inactive {
  td {
    color: #aaa;
  }
}

.is-hidden-unit {
  .colour-square {
    background-color: white !important;
  }
  .unit-name {
    color: #aaa;
  }
}

.colour-square {
  width: 18px;
  height: 18px;
  float: left;
  margin-right: 5px;
  border-radius: 4px;
  box-shadow: 1px 1px 3px rgba(0, 0, 0, 0.1);

  @include mobile {
    display: inline;
    float: none;
  }
}

.align-right {
  text-align: right;
}

.data-col {
  width: 25%;
}

.summary-list {
  @include mobile {
    font-size: 0.8em;
  }
}

.date-display {
  text-align: left;
}

table {
  font-size: 12px;
  width: 100%;
  table-layout: auto;

  @include desktop {
    table-layout: auto;
  }

  .cell-value {
    font-family: $family-primary;
  }

  tr:hover td {
    background-color: #eee;
  }

  td,
  th {
    padding: 3px 6px;
    border-bottom: 1px solid #ddd;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;
  }
  th {
    font-family: $family-secondary;
    font-weight: 700;
    // border-bottom: 1px solid #000;
    vertical-align: bottom;
  }

  .unit-header-row {
    th {
      font-weight: 700;
      small {
        display: block;
        color: #999;
      }
    }
  }

  td {
    border-bottom: 1px solid #ddd;
    cursor: pointer;
  }

  .unit-name {
    white-space: nowrap;
  }
}
</style>
