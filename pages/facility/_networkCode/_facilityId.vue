<template>
  <section class="facility">
    <transition name="fade">
      <div
        v-if="!fetchingFacility && !facility"
        class="not-found-card card"
        style="height: 60vh; margin: 0 auto;">
        <i class="fal fa-industry-alt"/>
        <span>Facility not available</span>
      </div>
    </transition>

    <transition name="fade">
      <div
        v-if="facility"
        class="main">
        <header>
          <h2>{{ facilityName }}</h2>
        </header>

        <Summary
          v-if="hasDescriptionOrWikiLink"
          :description="facilityDescription"
          :wiki-link="facilityWikiLink" />

        <transition name="fade">
          <PhotoMap
            v-if="facility && widthBreak"
            :facility-name="facilityName"
            :facility-photos="facilityPhotos"
            :has-facility-location="hasFacilityLocation"
            :facility-location="facilityLocation"
            :layout="'normal'"
          />
        </transition>

        <section class="facility-chart">
          <RangeIntervalSelectors
            @rangeChange="handleRangeChange"
            @intervalChange="handleIntervalChange" />

          <transition name="fade">
            <div
              v-if="!fetchingStats && stackedAreaDataset.length === 0"
              class="not-found-card card">
              <i class="fal fa-chart-area"/>
              <span>Power and energy data not available</span>
            </div>
          </transition>

          <transition name="fade">
            <Loader
              v-if="fetchingStats"
              class="facility-chart-loader" />
          </transition>

          <transition name="fade">
            <PowerChart
              v-if="!fetchingStats && stackedAreaDataset.length > 0"
              :hover-on="isHovering"
              :hover-date="hoverDate"
              :focus-on="isFocusing"
              :focus-date="focusDate"
              :dataset="stackedAreaDataset"
              :domains="operatingDomains"
              :zoom-extent="zoomExtent"
              :facility-id="facilityId"
              :y-max="facilityRegisteredCapacity"
              :chart-title="chartTitle"
              :chart-shown="chartShown"
              :chart-type="chartType"
              :chart-y-axis="chartYAxis"
              :chart-curve="chartCurve"
              :is-y-axis-average-power="isYAxisAveragePower"
              :display-unit="displayUnit"
              @dateHover="handleDateHover"
              @isHovering="handleIsHovering"
              @zoomExtent="handleZoomExtent"
              @svgClick="handleSvgClick"
            />
          </transition>
        </section>

        <section class="facility-units">
          <UnitList
            :is-energy-type="isEnergyType"
            :is-y-axis-average-power="isYAxisAveragePower"
            :units="unitsSummary"
            :hover-on="isHovering"
            :hover-date="hoverDate"
            :focus-on="isFocusing"
            :focus-date="focusDate"
            :dataset="datasetFilteredByZoomExtent"
            :average-power-dataset="averagePowerDataset"
            :range="range"
            :interval="interval"
            @codeHover="handleCodeHover" />
        </section>

        <!-- <FacilityProperties
          :facility="facility"
          class="facility-props" /> -->
      </div>
    </transition>

    <PhotoMap
      v-if="facility && !widthBreak"
      :facility-name="facilityName"
      :facility-photos="facilityPhotos"
      :has-facility-location="hasFacilityLocation"
      :facility-location="facilityLocation"
    />
  </section>
</template>

<script>
import { mapActions, mapGetters, mapMutations } from 'vuex'
import _uniq from 'lodash.uniq'
import _sortBy from 'lodash.sortby'
import { interpolateRgb, quantize } from 'd3-interpolate'
import { color } from 'd3-color'

import * as FT from '~/constants/energy-fuel-techs/group-default.js'
import * as SI from '@/constants/si'
import * as OPTIONS from '@/constants/chart-options.js'
import EnergyToAveragePower from '@/data/transform/energy-to-average-power.js'
import DateDisplay from '@/services/DateDisplay.js'
import RangeIntervalSelectors from '@/components/Facility/RangeIntervalSelectors.vue'
import PowerChart from '@/components/Facility/Charts/PowerChart.vue'
import UnitList from '@/components/Facility/UnitList.vue'
import PhotoMap from '@/components/Facility/PhotoMap.vue'
import FacilityProperties from '@/components/Facility/Properties.vue'
import Summary from '@/components/Facility/Summary.vue'
import Loader from '@/components/ui/Loader'

export default {
  layout: 'facility',

  head() {
    return {
      title: ` Facility: ${this.facilityName}`
    }
  },

  components: {
    RangeIntervalSelectors,
    PowerChart,
    UnitList,
    PhotoMap,

    FacilityProperties,
    Summary,
    Loader
  },

  data() {
    return {
      zoomExtent: [],
      isHovering: false,
      hoverDate: null
    }
  },

  computed: {
    ...mapGetters({
      widthBreak: 'app/widthBreak',
      fetchingFacility: 'facility/fetchingFacility',
      fetchingStats: 'facility/fetchingStats',
      facility: 'facility/selectedFacility',
      selectedFacilityUnitsDataset: 'facility/selectedFacilityUnitsDataset',
      dataType: 'facility/dataType',
      range: 'facility/range',
      interval: 'facility/interval',

      chartShown: 'chartOptionsPowerEnergy/chartShown',
      chartType: 'chartOptionsPowerEnergy/chartType',
      chartEnergyCurve: 'chartOptionsPowerEnergy/chartEnergyCurve',
      chartEnergyYAxis: 'chartOptionsPowerEnergy/chartEnergyYAxis',
      chartPowerCurve: 'chartOptionsPowerEnergy/chartPowerCurve',
      chartEnergyCurrentUnit: 'chartOptionsPowerEnergy/chartEnergyCurrentUnit',
      chartPowerCurrentUnit: 'chartOptionsPowerEnergy/chartPowerCurrentUnit',

      isFocusing: 'visInteract/isFocusing',
      focusDate: 'visInteract/focusDate'
    }),
    isEnergyType() {
      return this.dataType === 'energy'
    },
    facilityId() {
      return this.$route.params.facilityId
    },
    facilityName() {
      return this.facility && this.facility.name ? this.facility.name : ''
    },
    facilityDescription() {
      return this.facility && this.facility.description
        ? this.facility.description
        : ''
    },
    facilityNetworkRegion() {
      return this.facility && this.facility.network
        ? this.facility.network.code
        : ''
    },
    facilityWikiLink() {
      return this.facility && this.facility.wikipedia_link
        ? this.facility.wikipedia_link
        : ''
    },
    hasDescriptionOrWikiLink() {
      return this.facilityDescription !== '' || this.facilityWikiLink !== ''
    },
    facilityUnits() {
      return this.facility
        ? _sortBy(this.facility.facilities, ['status.code', 'code'])
        : []
    },
    facilityRegisteredCapacity() {
      return this.operatingDomains.length > 0
        ? this.operatingDomains.reduce(
            (acc, cur) => acc + (cur.registeredCapacity || 0),
            0
          )
        : 0
    },
    facilityLocation() {
      return this.facility ? this.facility.location : null
    },
    hasFacilityLocation() {
      return this.facilityLocation &&
        this.facilityLocation.lat &&
        this.facilityLocation.lng
        ? true
        : false
    },
    facilityState() {
      return this.facility && this.facility.location
        ? this.facility.location.state
        : ''
    },
    facilityFuelTechsColours() {
      const fuelTechs = this.facilityUnits.map(d => {
        return d.fueltech ? d.fueltech.code : ''
      })

      // get only unique fuel techs
      const uniqFuelTechs = _uniq(fuelTechs.filter(d => d !== '')).sort()
      const uniqFuelTechsCount = {}
      uniqFuelTechs.forEach(d => {
        uniqFuelTechsCount[d] = fuelTechs.filter(ft => ft === d).length
      })

      // set different opacity variations of fuel tech
      const colours = {}
      uniqFuelTechs.forEach(ft => {
        const colour = color(this.getUnitColour(ft))
        const count = uniqFuelTechsCount[ft]

        colours[ft] =
          count > 1
            ? quantize(
                interpolateRgb(
                  colour,
                  colour.copy({ opacity: 1 / count + 0.3 })
                ),
                count
              ).reverse()
            : [colour.formatRgb()]
      })

      // apply each colour variation to facility unit
      const obj = {}
      uniqFuelTechs.forEach(ft => {
        const filter = this.facilityUnits.filter(
          d => d.fueltech && d.fueltech.code === ft
        )
        filter.forEach((f, i) => {
          obj[f.code] = colours[ft][i]
        })
      })

      return obj
    },
    participant() {
      return this.facility ? this.facility.participant_id : ''
    },
    facilityPhotos() {
      return this.facility ? this.facility.photos : []
    },
    unitsSummary() {
      return this.facilityUnits.map((d, i) => {
        return {
          colour: this.facilityFuelTechsColours[d.code],
          domain: d.code,
          id: d.code,
          code: d.code,
          registeredCapacity: d.capacity_registered,
          status: d.status ? d.status.label : '',
          fuelTechLabel: d.fueltech ? d.fueltech.label : ''
        }
      })
    },
    operatingDomains() {
      return this.unitsSummary.filter(d => d.status === 'Operating')
    },

    datasetFilteredByZoomExtent() {
      if (this.zoomExtent.length === 2) {
        const start = this.zoomExtent[0]
        const end = this.zoomExtent[1]

        return this.stackedAreaDataset.filter(
          d => d.date >= start && d.date <= end
        )
      }
      return this.stackedAreaDataset
    },
    stackedAreaDataset() {
      if (this.isEnergyType) {
        if (this.isYAxisAveragePower) {
          return this.averagePowerDataset
        }
      }
      return this.selectedFacilityUnitsDataset
    },
    averagePowerDataset() {
      return EnergyToAveragePower({
        data: this.selectedFacilityUnitsDataset,
        domains: this.operatingDomains,
        range: this.range,
        interval: this.interval,
        exponent: SI.MEGA
      })
    },
    chartTitle() {
      if (this.isEnergyType) {
        if (this.isYAxisAveragePower) {
          return 'Average Power'
        }
      }
      return this.dataType
    },
    chartYAxis() {
      return this.chartEnergyYAxis
      // return this.isEnergyType ? this.chartEnergyYAxis : this.chartPowerYAxis
    },
    chartCurve() {
      return this.isEnergyType ? this.chartEnergyCurve : this.chartPowerCurve
    },
    isYAxisAveragePower() {
      return this.chartYAxis === OPTIONS.CHART_YAXIS_AVERAGE_POWER
    },
    displayUnit() {
      let unit = ''
      if (this.isEnergyType) {
        if (this.isYAxisAveragePower) {
          unit = this.chartPowerCurrentUnit
        } else {
          unit = `${this.chartEnergyCurrentUnit}/${this.getIntervalLabel(
            this.interval
          )}`
        }
      } else {
        unit = this.chartPowerCurrentUnit
      }

      // this.$emit('displayUnit', unit)
      return unit
    }
  },

  watch: {
    facility(update) {
      if (update) {
        const networkRegion = update.network ? update.network.code : ''
        const facilityId = update.code
        this.doGetStationStats({ networkRegion, facilityId })
      }
    },
    selectedFacilityUnitsDataset() {
      // clear dates
      this.setFocusDate(null)
    }
  },

  created() {
    this.doGetFacilityById({
      facilityId: this.facilityId
    })
    this.doSetChartEnergyPrefixes(SI.MEGA)
  },

  methods: {
    ...mapMutations({
      setHighlightDomain: 'visInteract/highlightDomain',
      setFocusDate: 'visInteract/focusDate'
    }),
    ...mapActions({
      doGetFacilityById: 'facility/doGetFacilityById',
      doGetStationStats: 'facility/doGetStationStats',
      doUpdateDatasetByInterval: 'facility/doUpdateDatasetByInterval',
      doSetChartEnergyPrefixes:
        'chartOptionsPowerEnergy/doSetChartEnergyPrefixes'
    }),
    getIntervalLabel(interval) {
      if (interval === 'Fin Year') {
        return 'year'
      }
      return interval.toLowerCase()
    },
    getUnitColour(fuelTech) {
      const unknownColour = '#ccc'
      if (fuelTech) {
        const colour = FT.DEFAULT_FUEL_TECH_COLOUR[fuelTech]
        return colour || unknownColour
      }
      return unknownColour
    },
    handleZoomExtent(dateRange) {
      this.zoomExtent = dateRange
    },
    handleCodeHover(code) {
      this.setHighlightDomain(code)
    },
    handleDateHover(date) {
      const closestDate = DateDisplay.snapToClosestInterval(this.interval, date)
      this.hoverDate = closestDate
    },
    handleIsHovering(hovering) {
      this.isHovering = hovering
    },
    handleRangeChange() {
      const networkRegion = this.facilityNetworkRegion
      const facilityId = this.facilityId
      this.doGetStationStats({ networkRegion, facilityId })
    },
    handleIntervalChange() {
      if (this.range === '30D') {
        const networkRegion = this.facilityNetworkRegion
        const facilityId = this.facilityId
        this.doGetStationStats({ networkRegion, facilityId })
      } else {
        this.doUpdateDatasetByInterval()
      }
    },
    handleSvgClick() {
      if (
        this.focusDate &&
        this.focusDate.getTime() === this.hoverDate.getTime()
      ) {
        this.setFocusDate(null)
      } else {
        this.setFocusDate(this.hoverDate)
      }
    }
  }
}
</script>

<style lang="scss" scoped>
@import '~/assets/scss/responsive-mixins.scss';
@import '~/assets/scss/variables.scss';

$radius: 0.5rem;

.facility {
  @include desktop {
    display: flex;
    margin: 1rem;

    .main {
      width: 70%;
      padding: 1rem;
    }
  }
}

header {
  margin-bottom: 1rem;
  padding: 0 $facility-tablet-padding;

  @include mobile {
    padding: 0 $facility-mobile-padding;
    margin-bottom: 0.5rem;
    margin-top: 0.5rem;
  }
  @include tablet {
    padding: 0;
  }

  h2 {
    font-family: $header-font-family;
    font-size: 1.8em;
    font-weight: 700;

    @include mobile {
      font-size: 1.6em;
    }
  }
}

::v-deep h3 {
  font-family: $header-font-family;
  font-size: 1.4em;
  border-bottom: 1px solid #666;
}

.facility-chart {
  $chartHeight: 275px;
  width: 100%;
  min-height: $chartHeight;
  margin-bottom: 1rem;
  padding: 0 12px 0 11px;
  position: relative;

  @include tablet {
    padding: 0;
  }

  .not-found-card {
    height: $chartHeight;
  }
}

.facility-chart-loader {
  position: absolute;
  margin: 100px auto 0;
  left: 45%;
}

.facility-meta {
  margin: 0.5rem 0;
}

::v-deep .not-found-card {
  width: 100%;
  height: 150px;
  display: flex;
  justify-content: center;
  align-items: center;
  align-content: center;
  flex-wrap: wrap;
  box-shadow: none;
  color: #888;
  background: rgba(0, 0, 0, 0.1);
  i {
    font-size: 1.3em;
    width: 100%;
    text-align: center;
  }
  span {
    font-size: 0.9em;
  }
}

.facility-units {
  margin: 0.5rem 1rem 0.5rem 1rem;

  @include desktop {
    margin: 0.5rem 1rem 0.5rem 1.25rem;
  }
}

.facility-props {
  margin-top: 3rem;
}
</style>
