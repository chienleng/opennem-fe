<template>
  <section>
    <summary-table
      :energy-domains="powerEnergyDomains"
      :temperature-domains="domainTemperature"
      :market-value-domains="currentDomainMarketValue"
      :emissions-domains="currentDomainEmissions"
      :price-id="domainPrice.length > 0 ? domainPrice[0].id : ''"
      :dataset="filteredCurrentDataset"
      :hover-date="hoverDate"
      :hover-on="isHovering"
      :focus-date="focusDate"
      :focus-on="focusOn"
      :range="range"
      :interval="interval"
      :is-energy="isEnergyType"
      :hidden-fuel-techs="hiddenFuelTechs"
      @fuelTechsHidden="handleFuelTechsHidden"
      @summary-update="handleSummaryUpdated"
      @mouse-enter="handleSummaryRowMouseEnter"
      @mouse-leave="handleSummaryRowMouseLeave"
    />

    <section
      v-if="showDonutBar"
      class="bar-donut-wrapper">
      <header>
        <div class="buttons has-addons">
          <button
            :class="{ 'is-selected': !chartSummaryPie }"
            class="button is-rounded"
            @click="handleChartSummaryClick('bar')">
            <i class="fal fa-chart-bar" />
          </button>
          <button
            :class="{ 'is-selected': chartSummaryPie }"
            class="button is-rounded"
            @click="handleChartSummaryClick('pie')">
            <i class="fal fa-chart-pie" />
          </button>
        </div>
      </header>

      <energy-bar
        v-if="!chartSummaryPie"
        :bar-width="250"
        :domains="donutDomains"
        :dataset="filteredCurrentDataset"
        :hover-on="isHovering"
        :hover-data="hoverData"
        :focus-on="focusOn"
        :focus-data="focusData"
        :highlight-domain="highlightId"
      />

      <donut-vis
        v-if="chartSummaryPie"
        :unit="` ${chartCurrentUnit}`"
        :domains="donutDomains"
        :dataset="filteredCurrentDataset"
        :dynamic-extent="filteredDates"
        :hover-on="isHovering"
        :hover-data="hoverData"
        :focus-on="focusOn"
        :focus-data="focusData"
        :convert-value="convertValue"
        :highlight-domain="highlightId"
      />
    </section>

    <EnergyRecords
      v-if="showRecords"
      :selected-power-energy-domains="domains"
      :power-energy-domains="powerEnergyDomains"
      :dataset="filteredCurrentDataset"
      :range="range"
      :interval="interval"
      :price-id="domainPrice.length > 0 ? domainPrice[0].id : ''"
      :temperature-id="temperatureMeanDomain"
      @recordSelect="handleRecordSelect"
      @recordDeselect="handleRecordDeselect"
      @recordMouseEnter="handleRecordMouseEnter"
      @recordMouseLeave="handleRecordMouseLeave" />
  </section>
</template>

<script>
import { mapGetters, mapMutations } from 'vuex'
import _cloneDeep from 'lodash.clonedeep'
import _includes from 'lodash.includes'

import SummaryTable from '@/components/SummaryTable'
import EnergyRecords from '~/components/Energy/Records'
import DonutVis from '~/components/Vis/Donut.vue'
import EnergyBar from '~/components/Energy/Charts/EnergyBarChart.vue'

import { TEMPERATURE, TEMPERATURE_MEAN } from '@/constants/data-types.js'
import * as SI from '@/constants/si.js'

export default {
  components: {
    SummaryTable,
    EnergyRecords,
    EnergyBar,
    DonutVis
  },

  props: {
    isHovering: {
      type: Boolean,
      default: false
    },
    hoverDate: {
      type: Date,
      default: null
    },
    showRecords: {
      type: Boolean,
      default: true
    },
    showDonutBar: {
      type: Boolean,
      default: true
    }
  },

  computed: {
    ...mapGetters({
      hoverDomain: 'visInteract/hoverDomain',
      focusOn: 'visInteract/isFocusing',
      focusDate: 'visInteract/focusDate',
      chartSummaryPie: 'visInteract/chartSummaryPie',
      highlightDomain: 'visInteract/highlightDomain',

      range: 'range',
      interval: 'interval',
      fuelTechGroupName: 'fuelTechGroupName',
      hiddenFuelTechs: 'hiddenFuelTechs',
      chartUnit: 'chartUnit',
      ready: 'regionEnergy/ready',
      isEnergyType: 'regionEnergy/isEnergyType',
      filteredDates: 'regionEnergy/filteredDates',
      filteredCurrentDataset: 'regionEnergy/filteredCurrentDataset',
      domainTemperature: 'regionEnergy/domainTemperature',
      domainPrice: 'regionEnergy/domainPrice',
      currentDomainPowerEnergy: 'regionEnergy/currentDomainPowerEnergy',
      currentDomainMarketValue: 'regionEnergy/currentDomainMarketValue',
      currentDomainEmissions: 'regionEnergy/currentDomainEmissions',

      chartEnergyUnitPrefix: 'chartOptionsPowerEnergy/chartEnergyUnitPrefix',
      chartEnergyDisplayPrefix:
        'chartOptionsPowerEnergy/chartEnergyDisplayPrefix',
      chartEnergyCurrentUnit: 'chartOptionsPowerEnergy/chartEnergyCurrentUnit',

      chartPowerUnitPrefix: 'chartOptionsPowerEnergy/chartPowerUnitPrefix',
      chartPowerDisplayPrefix:
        'chartOptionsPowerEnergy/chartPowerDisplayPrefix',
      chartPowerCurrentUnit: 'chartOptionsPowerEnergy/chartPowerCurrentUnit'
    }),
    chartCurrentUnit() {
      return this.isEnergyType
        ? this.chartEnergyCurrentUnit
        : this.chartPowerCurrentUnit
    },
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

    property() {
      return this.fuelTechGroupName === 'Default' ? 'fuelTech' : 'group'
    },
    powerEnergyDomains() {
      return this.currentDomainPowerEnergy
        ? _cloneDeep(this.currentDomainPowerEnergy).reverse()
        : []
    },
    domains() {
      const domains = this.powerEnergyDomains
      const hidden = this.hiddenFuelTechs
      return domains.filter(d => !_includes(hidden, d[this.property]))
    },
    donutDomains() {
      return this.domains.filter(d => d.category === 'source')
    },
    temperatureMeanDomain() {
      const find = this.domainTemperature.find(
        t => t.type === TEMPERATURE || t.type === TEMPERATURE_MEAN
      )
      return find ? find.domain : ''
    },
    hoverData() {
      if (!this.hoverDate) {
        return null
      }
      const time = this.hoverDate.getTime()
      return this.filteredCurrentDataset.find(d => d.time === time)
    },
    focusData() {
      if (!this.focusDate) {
        return null
      }
      const time = this.focusDate.getTime()
      return this.filteredCurrentDataset.find(d => d.time === time)
    },

    highlightId() {
      const domain = this.highlightDomain
      const property =
        this.fuelTechGroupName === 'Default' ? 'fuelTech' : 'group'
      const find = this.domains.find(d => d[property] === domain)
      return find ? find.id : ''
    }
  },

  methods: {
    ...mapMutations({
      setSummary: 'regionEnergy/summary',
      setHighlightDomain: 'visInteract/highlightDomain',
      setFocusDate: 'visInteract/focusDate'
    }),
    convertValue(value) {
      return SI.convertValue(
        this.chartUnitPrefix,
        this.chartDisplayPrefix,
        value
      )
    },
    handleFuelTechsHidden(hidden) {
      this.$store.dispatch('hiddenFuelTechs', hidden)
    },
    handleSummaryUpdated(summary) {
      this.setSummary(summary)
    },
    handleSummaryRowMouseEnter(ft) {
      const property =
        this.fuelTechGroupName === 'Default' ? 'fuelTech' : 'group'
      this.setHighlightDomain(ft[property])
    },
    handleSummaryRowMouseLeave() {
      this.setHighlightDomain('')
    },
    handleRecordMouseEnter(date) {
      this.$emit('dateHover', new Date(date))
      this.$emit('isHovering', true)
    },
    handleRecordMouseLeave() {
      this.$emit('dateHover', null)
      this.$emit('isHovering', false)
    },
    handleRecordSelect(date) {
      this.setFocusDate(new Date(date))
    },
    handleRecordDeselect() {
      this.setFocusDate(null)
    },
    handleChartSummaryClick(chartType) {
      if (chartType === 'pie') {
        this.$store.commit('visInteract/chartSummaryPie', true)
      } else {
        this.$store.commit('visInteract/chartSummaryPie', false)
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.bar-donut-wrapper {
  margin-bottom: 1rem;
  header {
    margin: 1rem 0;
    .buttons {
      justify-content: center;
    }
    button {
      font-size: 11px;
      min-width: 30px;
    }
    i.fa-chart-bar {
      -moz-transform: scaleY(-1) rotate(90deg);
      -o-transform: scaleY(-1) rotate(90deg);
      -webkit-transform: scaleY(-1) rotate(90deg);
      transform: scaleY(-1) rotate(90deg);
    }
  }
}
</style>
