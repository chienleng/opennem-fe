<template>
  <div class="container-fluid">
    <h3 v-if="useAllPeriods">{{ getDateRange(allBucket) }}</h3>

    <div class="options-legend-wrapper">
      <div class="options">
        <!-- <label for="">Period</label> -->
        <!-- <strong>
          {{ selectedPeriodObject.label }}
        </strong> -->
        <!-- <div class="select is-rounded">
          <select v-model="selectedPeriod">
            <option
              v-for="(d, i) in periods"
              :key="`period-${i}`"
              :value="d.value"
            >
              {{ d.label }}
            </option>
          </select>
        </div> -->


        <!-- <label for=""><strong>Metric</strong></label> -->
        <div class="metric-selection select is-rounded">
          <select v-model="selectedMetric">
            <option
              v-for="(d, i) in metrics"
              :key="`metric-${i}`"
              :value="d.value"
            >
              {{ d.label }}
            </option>
          </select>
        </div>
      </div>

      <ColourLegend
        v-if="regionData.length > 0"
        :svg-width="tabletBreak ? width : 310"
        :svg-height="30"
        :unit="
          selectedMetricObject.value === 'carbonIntensity'
            ? ''
            : selectedMetricObject.unit
        "
        :multiplier="selectedMetricObject.divisor"
        :offset="selectedMetricObject.offset"
        :colour-range="selectedMetricObject.range"
        :colour-domain="selectedMetricObject.domain"
        :colour-domain-label="selectedMetricObject.domainLabel"
        :zero-block="selectedMetricObject.showZeroBlock"
        :type="selectedMetricObject.legendType"
        class="colour-legend"
      />
    </div>

    <div class="vis-container">
      <section
        v-for="(d, i) in regionData"
        :key="`region-${i}`"
        class="vis-section"
      >

        <div
          v-if="hoverDate && d.yearlyData"
          class="hover-date-value">
          <span class="date">{{ getHoverDate(hoverDate) }}</span>
          <span
            v-if="hoverValue || hoverValue === 0"
            class="value">{{ valueFormat(hoverValue) }}{{ selectedMetricObject.unit }}</span>
          <span
            v-else
            class="value">—</span>
        </div>

        <div
          v-if="hoverDate && !d.yearlyData"
          class="hover-date-value">
          <span class="date">{{ getHoverDate(hoverDate) }}</span>
          <span class="value">{{ getHoverValue(d[selectedMetric], hoverDate) }}</span>
        </div>

        <div v-if="d.yearlyData">
          <section
            v-for="(yData, yIndex) in d.yearlyData"
            :key="`yearly-${i}-${yIndex}`"
            style="width: 100%"
          >
            <h5>{{ yData.year }}</h5>
            <Heatmap
              :cell-height="50"
              :svg-width="width"
              :svg-height="50"
              :radius="0"
              :dataset="yData[selectedMetric]"
              :value-prop="selectedMetric"
              :tooltip-value-prop="selectedMetricObject.valueProp ? selectedMetricObject.valueProp : selectedMetric"
              :divisor="selectedMetricObject.divisor"
              :offset="selectedMetricObject.offset"
              :colour-range="selectedMetricObject.range"
              :colour-domain="selectedMetricObject.domain"
              @rect-mousemove="obj => {
                handleMousemove(obj, d.regionId)
              }"
              @rect-mouseout="handleMouseout"
            />
          </section>
        </div>
        <div
          v-else
          style="width: 100%">
          <h5 :class="{ dark: shouldDarken(d[selectedMetric], selectedMetric) }">{{ d.region }}</h5>
          <Heatmap
            :cell-height="75"
            :svg-width="width"
            :svg-height="75"
            :radius="0"
            :dataset="d[selectedMetric]"
            :value-prop="selectedMetric"
            :tooltip-value-prop="selectedMetricObject.valueProp ? selectedMetricObject.valueProp : selectedMetric"
            :divisor="selectedMetricObject.divisor"
            :offset="selectedMetricObject.offset"
            :colour-range="selectedMetricObject.range"
            :colour-domain="selectedMetricObject.domain"
            :hover-date="hoverDate"
            @rect-mousemove="obj => {
              handleMousemove(obj, d.regionId)
            }"
            @rect-mouseout="handleMouseout"
          />
        </div>
      </section>
    </div>


  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
import { extent } from 'd3-array'
import { select, mouse } from 'd3-selection'
import { format as numFormat } from 'd3-format'
import debounce from 'lodash.debounce'
import addDays from 'date-fns/addDays'
import format from 'date-fns/format'
import differenceInDays from 'date-fns/differenceInDays'
import { getEnergyRegions } from '@/constants/energy-regions.js'
import {
  periods,
  metrics,
  yearsBucket,
  allRangeBucket,
  yearDailyRangeBucket
} from '@/constants/metrics/'
import Heatmap from '@/components/Vis/_wip/Heatmap'
import ColourLegend from '@/components/Vis/ColourLegend'

export default {
  layout: 'main',

  components: {
    Heatmap,
    ColourLegend
  },

  head: {
    titleTemplate: 'OpenNEM Experiments: Metrics'
  },

  data() {
    return {
      width: 0,
      periods,
      metrics,
      yearsBucket,
      allBucket: allRangeBucket(),
      regionData: [],
      regions: getEnergyRegions().filter(
        d => d.id !== 'au' && d.id !== 'nem' && d.id !== 'wem'
      ),
      hoverDate: null,
      hoverValue: null,
      hoverRegion: ''
    }
  },

  computed: {
    ...mapGetters({
      range: 'range',
      interval: 'interval',
      filterPeriod: 'filterPeriod',
      fuelTechGroupName: 'fuelTechGroupName',
      tabletBreak: 'app/tabletBreak',
      v3Paths: 'feature/v3Paths'
    }),

    selectedPeriod: {
      get() {
        return this.$store.getters['metrics/selectedPeriod']
      },

      set(val) {
        this.$store.commit('metrics/selectedPeriod', val)
      }
    },

    selectedMetric: {
      get() {
        return this.$store.getters['metrics/selectedMetric']
      },

      set(val) {
        this.$router.push({
          query: {
            metric: val
          }
        })
        this.$store.commit('metrics/selectedMetric', val)
      }
    },

    selectedMetricObject() {
      return this.metrics.find(m => m.value === this.selectedMetric)
    },

    selectedPeriodObject() {
      return this.periods.find(p => p.value === this.selectedPeriod)
    },

    regionId() {
      return this.$route.params.region
    },

    queryMetric() {
      return this.$route.query.metric
    },

    useAllPeriods() {
      return this.regionId === 'au' || this.regionId === 'nem'
    }
  },

  watch: {
    regionId(id) {
      this.getData(id, this.selectedPeriod)
    }
  },

  created() {
    if (this.queryMetric) {
      this.selectedMetric = this.queryMetric
    } else {
      this.$router.push({
        query: {
          metric: this.selectedMetric
        }
      })
    }
  },

  mounted() {
    this.$store.dispatch('currentView', 'experiments/metrics')
    this.getData(this.regionId, this.selectedPeriod)

    this.width = this.$el.offsetWidth - 32

    window.addEventListener(
      'resize',
      debounce(() => {
        this.width =
          this.$el.offsetWidth === 0 ? this.width : this.$el.offsetWidth - 32
      }),
      50
    )

    //     const $vis = select('.vis-container')
    //     let mouseinside = false
    //
    //     $vis
    //       .on('mousemove touchmove', function() {
    //         const m = mouse(this)
    //         const $hoverLine = select('#hover-line')
    //         $hoverLine.style('left', `${m[0] - 1}px`)
    //         if (!mouseinside) {
    //           $hoverLine.style('opacity', 1)
    //           mouseinside = true
    //         }
    //       })
    //       .on('mouseout', () => {
    //         const $hoverLine = select('#hover-line')
    //         $hoverLine.style('opacity', 0)
    //         mouseinside = false
    //       })
  },

  methods: {
    ...mapActions({
      doGetRegionData: 'regionEnergy/doGetRegionData',
      doGetRegionDataByRangeInterval:
        'regionEnergy/doGetRegionDataByRangeInterval',
      doGetYearRegionData: 'regionEnergy/doGetYearRegionData'
    }),

    getData(id, period) {
      // reset
      this.regionData = []

      const filter =
        id === 'au'
          ? d => d.id !== 'au' && d.id !== 'nem'
          : id === 'nem'
            ? d => d.id !== 'au' && d.id !== 'nem' && d.id !== 'wem'
            : d => d.id === id
      const regions = getEnergyRegions().filter(filter)

      if (this.useAllPeriods) {
        this.selectedPeriod = 'all/month'
        this.getRegionsData(regions)
      } else {
        this.selectedPeriod = 'multiyear/day'
        regions.forEach((r, i) => {
          const yearlyData = []

          if (this.v3Paths) {
            this.doGetRegionData({ region: r.id }).then(d => {
              yearsBucket.forEach((year, yIndex) => {
                const yearInt = parseInt(year)
                const dataset = d.dataset.filter(
                  e => e.date.getFullYear() === yearInt
                )

                if (dataset.length > 0) {
                  const propData = this.generateDataset(
                    dataset,
                    d.domainPowerEnergy,
                    d.domainEmissions,
                    d.domainTemperature,
                    true,
                    yearDailyRangeBucket(yearInt)
                  )
                  yearlyData.push({
                    year,
                    carbonIntensity: propData,
                    renewablesProportion: propData,
                    windProportion: propData,
                    solarProportion: propData,
                    gasProportion: propData,
                    coalProportion: propData,
                    importsExports: propData,
                    temperature: propData,
                    maxTemperature: propData,
                    netInterconnectorFlow: propData
                  })
                }
              })
            })
          } else {
            yearsBucket.forEach((year, yIndex) => {
              setTimeout(() => {
                this.doGetYearRegionData({ region: r.id, year }).then(d => {
                  const yearInt = parseInt(year)
                  const last = new Date(yearInt, 11, 31)
                  const start = new Date(yearInt, 0, 1)
                  const propData = this.generateDataset(
                    d.dataset,
                    d.domainPowerEnergy,
                    d.domainEmissions,
                    d.domainTemperature,
                    true
                  )
                  yearlyData.push({
                    year,
                    carbonIntensity: propData,
                    renewablesProportion: propData,
                    windProportion: propData,
                    solarProportion: propData,
                    gasProportion: propData,
                    coalProportion: propData,
                    importsExports: propData,
                    temperature: propData,
                    maxTemperature: propData,
                    netInterconnectorFlow: propData
                  })
                })
              }, 500 * yIndex)
            })
          }

          this.regionData.push({
            region: r.label,
            regionId: r.id,
            yearlyData
          })
        })
      }
    },

    getRegionsData(regions) {
      regions.forEach((r, i) => {
        setTimeout(() => {
          this.doGetRegionDataByRangeInterval({
            region: r.id,
            range: 'ALL',
            interval: 'Month',
            period: 'All',
            groupName: this.fuelTechGroupName
          }).then(d => {
            const propData = this.generateDataset(
              d.currentDataset,
              d.currentDomainPowerEnergy,
              d.currentDomainEmissions,
              d.domainTemperature,
              false,
              this.allBucket
            )

            this.regionData.push({
              region: r.label,
              regionId: r.id,
              carbonIntensity: propData,
              renewablesProportion: propData,
              windProportion: propData,
              solarProportion: propData,
              gasProportion: propData,
              coalProportion: propData,
              importsExports: propData,
              temperature: propData,
              maxTemperature: propData,
              netInterconnectorFlow: propData
            })
          })
        }, 500 * i)
      })
    },

    generateDataset(
      dataset,
      domainPowerEnergy,
      domainEmissions,
      domainTemperature,
      topUp,
      bucket
    ) {
      if (bucket) {
        const data = bucket.map(d => {
          const obj = this.createEmptyObj(d.date, d.time)
          const find = dataset.find(x => x.time === d.time)
          return this.calculateMetricData(
            obj,
            find,
            domainPowerEnergy,
            domainEmissions,
            domainTemperature
          )
        })

        return data
      }

      const data = dataset.map(d => {
        const obj = this.createEmptyObj(d.date, d.time)
        return this.calculateMetricData(
          obj,
          d,
          domainPowerEnergy,
          domainEmissions,
          domainTemperature
        )
      })

      if (data.length > 0 && topUp) {
        const lastDataDate = data[data.length - 1].date
        const last = new Date(lastDataDate.getFullYear(), 11, 31)
        const fillUp = differenceInDays(last, addDays(lastDataDate, 1))
        let cDate = lastDataDate
        for (let i = 1; i <= fillUp + 1; i++) {
          cDate = addDays(cDate, 1)
          data.push(this.createEmptyObj(cDate, cDate.getTime()))
        }
      }

      return data
    },

    handleMousemove({ id, date, value }, regionId) {
      this.hoverRegion = regionId
      this.hoverDate = date
      this.hoverValue = value
    },
    handleMouseout() {
      this.hoverDate = null
      this.hoverValue = null
    },

    getDateRange(data) {
      const formatString = 'MMM yyyy'
      const firstDate = format(data[0].date, formatString)
      const lastDate = format(data[data.length - 1].date, formatString)
      return `${firstDate} – ${lastDate}`
    },

    getHoverDate(date) {
      return format(date, this.selectedPeriodObject.dateFormatString)
    },

    getHoverValue(data, date) {
      const find = data.find(d => d.time === date.getTime())
      return find &&
        (find[this.selectedMetric] || find[this.selectedMetric] === 0)
        ? `${this.valueFormat(find[this.selectedMetric])}${
            this.selectedMetricObject.unit
          }`
        : '—'
    },

    valueFormat(value) {
      const numberFormatString =
        this.selectedMetricObject.numberFormatString || ',.0f'
      return numFormat(numberFormatString)(value)
    },

    createEmptyObj(date, time) {
      return {
        date,
        time,
        carbonIntensity: null,
        renewablesProportion: null,
        windProportion: null,
        solarProportion: null,
        coalProportion: null,
        coal: null,
        gasProportion: null,
        gas: null,
        temperature: null,
        maxTemperature: null,
        importsExports: null,
        sumImportsExports: null,
        netInterconnectorFlow: null
      }
    },

    calculateMetricData(
      obj,
      d,
      domainPowerEnergy,
      domainEmissions,
      domainTemperature
    ) {
      if (d) {
        let totalEmissions = 0,
          totalPowerEnergy = 0,
          temperature = null,
          maxTemperature = null,
          sumImportsExports = 0,
          hasImportsExportsValue = false,
          importsExports = null

        domainEmissions.forEach(domain => {
          totalEmissions += d[domain.id] || 0
        })
        domainPowerEnergy.forEach(domain => {
          if (domain.category !== 'load' || domain.fuelTech === 'exports') {
            totalPowerEnergy += d[domain.id] || 0
          }
          if (domain.fuelTech === 'imports' || domain.fuelTech === 'exports') {
            if (d[domain.id] || d[domain.id] === 0) {
              hasImportsExportsValue = true
            }
            sumImportsExports += d[domain.id]
          }
        })
        domainTemperature.forEach(domain => {
          if (domain.type === 'temperature_mean') {
            temperature = d[domain.id]
          }
          if (domain.type === 'temperature_max') {
            maxTemperature = d[domain.id]
          }
        })

        const ei = totalEmissions / totalPowerEnergy
        const isValidEI = Number.isFinite(ei)

        // if no value
        importsExports = hasImportsExportsValue
          ? sumImportsExports > 0
            ? 1
            : 0
          : null
        if (!hasImportsExportsValue) {
          sumImportsExports = null
        }

        obj.carbonIntensity = isValidEI ? ei : null
        obj.renewablesProportion =
          d._totalDemandRenewablesPercentage < 0
            ? 0
            : d._totalDemandRenewablesPercentage
        obj.windProportion =
          d._totalDemandWindProportion < 0 ? 0 : d._totalDemandWindProportion
        obj.solarProportion =
          d._totalDemandSolarProportion < 0 ? 0 : d._totalDemandSolarProportion
        obj.coalProportion =
          d._totalDemandCoalProportion < 0 ? 0 : d._totalDemandCoalProportion
        obj.coal = d._totalCoal
        obj.gasProportion =
          d._totalDemandGasProportion < 0 ? 0 : d._totalDemandGasProportion
        obj.gas = d._totalGas
        obj.temperature = temperature
        obj.maxTemperature = maxTemperature
        obj.importsExports = importsExports
        obj.sumImportsExports = sumImportsExports
        obj.netInterconnectorFlow = d._totalDemandImportsExportsProportion
      }

      return obj
    },

    shouldDarken(data, prop) {
      const check = data.filter((d, i) => i < 20).map(d => d[prop])
    }
  }
}
</script>

<style lang="scss" scoped>
@import '~/assets/scss/variables.scss';
@import '~/assets/scss/responsive-mixins.scss';

.container-fluid {
  padding: 1rem 16px;
  height: 100%;
}

.options-legend-wrapper {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  position: sticky;
  z-index: 99;
  top: 0;
  padding: 1rem 0;
  background-color: $beige-lighter;
  border-bottom: 1px solid #ddd;

  @include mobile {
    display: block;
  }
}
.options {
  display: flex;
  align-items: center;

  @include mobile {
    margin-bottom: 1rem;
  }

  & > * {
    // margin: 0 1rem;
  }

  label {
    margin: 0 0.5rem 0 0;
  }
}

h3 {
  font-family: $header-font-family;
  font-size: 1.4em;
  font-weight: 300;
  margin-left: 2px;
  padding-bottom: 0.5rem;
  text-align: right;
  border-bottom: 1px solid #ddd;
}

.vis-container {
  margin-top: 1.8rem;
}
.vis-section {
  position: relative;
  margin-top: 35px;

  h4 {
    font-family: $header-font-family;
    font-size: 1.2em;
    font-weight: 700;
  }
  h5 {
    font-family: $header-font-family;
    font-weight: 700;
    font-size: 1em;
    position: absolute;
    z-index: 9;
    color: #fff;
    text-shadow: 0 0 2px rgba(0, 0, 0, 0.4);
    background-color: rgba(0, 0, 0, 0.2);
    padding: 0 3px 1px;
    border-radius: 0 0 1px 0;
    left: 1px;
    margin-top: 1px;
  }
  header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 5px;

    small {
      font-family: $family-primary;
      font-size: 0.7em;
      font-weight: 300;
    }
  }
}
.colour-legend {
  // margin-top: 2rem;
}
.metric-selection {
  width: 100%;
  select {
    width: 100%;
  }
}
.hover-date-value {
  font-size: 0.8em;
  display: flex;
  align-items: flex-end;
  position: absolute;
  right: 0;
  top: -25px;
  span {
    padding: 3px 12px 2px;
    white-space: nowrap;
  }
  .date {
    background-color: rgba(199, 69, 35, 0.1);
    color: #444;
    font-weight: 600;
    border-radius: 20px 0 0 20px;
  }
  .value {
    border-radius: 0 20px 20px 0;
    background-color: rgba(255, 255, 255, 0.5);
  }
}
// #hover-line {
//   background-color: red;
//   width: 1px;
//   height: 400px;
//   position: absolute;
//   top: 0;
//   left: 0;
//   z-index: 99;
//   opacity: 0;
// }

::v-deep .heatmap {
  border: 1px solid #ddd;
}
</style>
