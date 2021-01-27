<template>
  <div class="compare-container">
    <div class="compare-header">
      <div class="chart-label">
        <strong>{{ firstDate | customFormatDate({ range, interval, showIntervalRange: true }) }}</strong>
        vs
        <strong>{{ secondDate | customFormatDate({ range, interval, showIntervalRange: true }) }}</strong>
      </div>
    </div>
    <div class="compare-chart-legend">
      <div class="compare-legend">
        <div
          v-for="(domain, index) in updatedDomains"
          :key="`domain-${index}`"
          class="legend-item">
          <span
            :style="{
              'background-color': domain.colour,
              border: domain.id === '_total' ? `1px dashed #c74523` : 'none'
            }"
            class="colour-square" />
          {{ domain.label }}
        </div>
      </div>
      <div class="compare-chart">
        <div class="compare-chart-unit">{{ unit }}</div>
        <column-vis
          v-if="hasCompareData"
          :domains="updatedDomains"
          :dataset="dataset"
          :dataset-percent="datasetPercent"
          :vis-height="visHeight"
          :display-prefix="chartDisplayPrefix"
          :convert-value="convertValue"
          :highlight-domain="highlightId"
        />
      </div>
    </div>

  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import _includes from 'lodash.includes'
import _cloneDeep from 'lodash.clonedeep'

import * as SI from '@/constants/si.js'
import ColumnVis from '~/components/Vis/Column.vue'
export default {
  components: {
    ColumnVis
  },

  props: {
    compareData: {
      type: Array,
      default: () => []
    },
    unit: {
      type: String,
      default: () => ''
    }
  },

  data() {
    return {
      updatedCompareData: [],
      visHeight: 200
    }
  },

  computed: {
    ...mapGetters({
      fuelTechGroupName: 'fuelTechGroupName',
      hiddenFuelTechs: 'hiddenFuelTechs',
      currentDomainPowerEnergy: 'regionEnergy/currentDomainPowerEnergy',
      isEnergyType: 'regionEnergy/isEnergyType',

      highlightDomain: 'visInteract/highlightDomain',

      chartEnergyUnitPrefix: 'chartOptionsPowerEnergy/chartEnergyUnitPrefix',
      chartEnergyDisplayPrefix:
        'chartOptionsPowerEnergy/chartEnergyDisplayPrefix',

      chartPowerUnitPrefix: 'chartOptionsPowerEnergy/chartPowerUnitPrefix',
      chartPowerDisplayPrefix: 'chartOptionsPowerEnergy/chartPowerDisplayPrefix'
    }),

    chartUnitPrefix() {
      return this.isEnergyType
        ? this.chartEnergyUnitPrefix
        : this.chartPowerUnitPrefix
    },
    chartDisplayPrefix() {
      return this.isEnergyType
        ? this.chartEnergyDisplayPrefix
        : this.chartPowerDisplayPrefix
    },

    powerEnergyDomains() {
      return this.currentDomainPowerEnergy
        ? _cloneDeep(this.currentDomainPowerEnergy).reverse()
        : []
    },
    domains() {
      const property =
        this.fuelTechGroupName === 'Default' ? 'fuelTech' : 'group'
      const domains = this.powerEnergyDomains
      const hidden = this.hiddenFuelTechs
      return domains.filter(d => !_includes(hidden, d[property]))
    },
    hasCompareData() {
      return this.updatedCompareData.length === 2
    },
    firstDate() {
      return this.hasCompareData ? this.updatedCompareData[0].time : null
    },
    secondDate() {
      return this.hasCompareData ? this.updatedCompareData[1].time : null
    },
    chartType() {
      return this.$store.getters.energyChartType
    },
    range() {
      return this.$store.getters.range
    },
    interval() {
      return this.$store.getters.interval
    },

    dataset() {
      if (this.hasCompareData) {
        const change = {}
        const former = this.updatedCompareData[0]
        const latter = this.updatedCompareData[1]
        Object.keys(latter).forEach(d => {
          if (d !== 'date' && d.length > 0) {
            change[d] = latter[d] - former[d]
          }
        })
        return change
      }
      return null
    },
    datasetPercent() {
      if (this.hasCompareData) {
        const changePercent = {}
        const former = this.updatedCompareData[0]
        const latter = this.updatedCompareData[1]
        Object.keys(latter).forEach(d => {
          if (d !== 'date' && d.length > 0) {
            if (
              former[d] === null ||
              latter[d] === null ||
              former[d] === 0 ||
              latter[d] === 0
            ) {
              changePercent[d] = null
            } else {
              changePercent[d] = ((latter[d] - former[d]) / former[d]) * 100
            }
          }
        })
        return changePercent
      }
      return null
    },
    isReducedDemand() {
      return this.dataset && this.dataset._total < 0
    },
    updatedDomains() {
      const domains = this.domains.slice()
      if (this.isReducedDemand) {
        domains.push({
          colour: 'rgba(203, 87, 58, 0.5)',
          id: '_total',
          label: 'Reduced Demand'
        })
      }
      return domains
    },

    highlightId() {
      const domain = this.highlightDomain
      const property =
        this.fuelTechGroupName === 'Default' ? 'fuelTech' : 'group'
      const find = this.domains.find(d => d[property] === domain)
      return find ? find.id : ''
    }
  },

  watch: {
    compareData(update) {
      if (update.length === 2 && update[0]) {
        let latter = update[0]
        let former = update[1]
        if (update[1].date > latter.date) {
          latter = update[1]
          former = update[0]
        }
        this.updatedCompareData = [former, latter]
      } else {
        this.updatedCompareData = []
      }
    }
  },

  mounted() {
    const $height = this.$el.offsetHeight < 200 ? 200 : this.$el.offsetHeight
    this.visHeight = $height
  },

  methods: {
    convertValue(value) {
      return SI.convertValue(
        this.chartUnitPrefix,
        this.chartDisplayPrefix,
        value
      )
    }
  }
}
</script>

<style lang="scss" scoped>
.chart-label {
  text-align: center;
}
.compare-chart-legend {
  padding: 0.5rem 1rem;
  margin: 0 0.5rem 0.5rem;
  background-color: rgba(0, 0, 0, 0.05);
  box-shadow: inset 0 1px 10px rgba(0, 0, 0, 0.05);
  border-radius: 3px;
  display: flex;
  align-items: center;

  .compare-legend {
    width: 20%;
    font-size: 9px;

    .legend-item {
      display: flex;
      align-items: center;
      padding: 0.1rem;
    }
  }
  .compare-chart {
    width: 80%;
  }
  .compare-chart-unit {
    font-size: 9px;
    font-weight: bold;
    padding-left: 4px;
  }
}
.colour-square {
  display: inline-block;
  border: 1px solid transparent;
  width: 15px;
  height: 15px;
  margin-right: 0.2rem;
}
</style>
