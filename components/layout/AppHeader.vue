<template>
  <header :class="{ 'facilities-header': isFacilitiesView }">
    <div class="header-dropdowns">
      <div
        class="logo-wrapper"
        @click="toggleDrawer">
        <i
          v-if="ready && tabletBreak"
          class="fal fa-ellipsis-v" />
        <app-logo class="header-logo" />
        <h1 v-if="ready && tabletBreak">{{ regionLabel }}</h1>
      </div>
      <view-dropdown
        v-if="!tabletBreak"
        class="selection" />
      <region-dropdown
        v-if="!tabletBreak"
        class="selection" />
    </div>

    <div>
      <app-drawer
        v-if="tabletBreak"
        :open="openDrawer"
        @close="closeDrawer" />

      <div
        v-if="!isFacilitiesView && showButtons"
        :class="{ hide: tabletBreak }"
        class="more-buttons"
      >
        <consumption-generation-toggle />

        <button
          v-if="(focusOn || compareDifference) && isEnergy"
          :class="{ 'is-selected': compareDifference }"
          class="compare-button button is-rounded"
          @click="handleCompareClick"
        >
          Compare
        </button>
      </div>

      <div
        v-if="!tabletBreak && showButtons"
        class="share-button-wrapper">
        <button
          v-on-clickaway="handleClickAway"
          :class="{ 'is-loading is-primary': generating }"
          class="share-button button is-rounded"
          @click="handleShareButtonClicked"
        >
          <img
            src="~/assets/img/share-icon.svg"
            alt="Share icon" >
          <span class="label-image">Export</span>
        </button>
        <transition name="slide-down-fade">
          <div
            v-if="showShareMenu"
            class="share-menu dropdown-menu">
            <div class="dropdown-content">
              <a
                v-if="!isFacilitiesView"
                class="dropdown-item button"
                @click="handleExportImage"
              >
                <i class="fal fa-fw fa-chart-bar" />
                <span class="label-image">PNG</span>
              </a>
              <a
                class="dropdown-item button"
                @click="handleExportDataClick">
                <download-csv
                  :data="exportData"
                  :name="`${filename}.csv`">
                  <i class="fal fa-fw fa-table" />
                  <span class="label-csv">CSV</span>
                </download-csv>
              </a>
            </div>
          </div>
        </transition>
      </div>
    </div>
  </header>
</template>

<script>
import { mapGetters } from 'vuex'
import { timeFormat as d3TimeFormat } from 'd3-time-format'
import { format as d3Format } from 'd3-format'
import _debounce from 'lodash.debounce'
import DownloadCsv from 'vue-json-csv'
import { mixin as clickaway } from 'vue-clickaway'
import { getEnergyRegions } from '@/constants/energy-regions.js'
import AppLogo from '~/components/ui/Logo'
import ViewDropdown from '~/components/ui/ViewDropdown'
import ConsumptionGenerationToggle from '~/components/ui/ConsumptionGenerationToggle'
import RegionDropdown from '~/components/ui/RegionDropdown'
import AppDrawer from '~/components/layout/Drawer'

export default {
  components: {
    DownloadCsv,
    AppLogo,
    ViewDropdown,
    RegionDropdown,
    ConsumptionGenerationToggle,
    AppDrawer
  },
  mixins: [clickaway],

  data() {
    return {
      ready: false,
      generating: false,
      openDrawer: false,
      showShareMenu: false,
      regions: getEnergyRegions()
    }
  },

  computed: {
    ...mapGetters({
      tabletBreak: 'app/tabletBreak',

      chartEnergyRenewablesLine:
        'chartOptionsPowerEnergy/chartEnergyRenewablesLine',
      energyExportData: 'regionEnergy/filteredCurrentDataset',
      energyDomains: 'regionEnergy/currentDomainPowerEnergy',
      emissionDomains: 'regionEnergy/currentDomainEmissions',
      priceDomains: 'regionEnergy/domainPrice',
      temperatureDomains: 'regionEnergy/domainTemperature',
      marketValueDomains: 'regionEnergy/currentDomainMarketValue'
    }),
    range() {
      return this.$store.getters.range
    },
    interval() {
      return this.$store.getters.interval
    },
    hasMarketValue() {
      return this.range !== '1D' && this.range !== '3D' && this.range !== '7D'
    },
    dateFilter() {
      return this.$store.getters.dateFilter
    },
    isFacilitiesView() {
      return this.$store.getters.currentView === 'facilities'
    },
    chartUnit() {
      return this.$store.getters.chartUnit
    },
    exportData() {
      const timeFormat = d3TimeFormat('%Y-%m-%d %H:%M')
      const format = d3Format('.2f')
      if (this.isFacilitiesView) {
        return this.$store.getters.facilityExportData
      }
      return this.energyExportData.map(d => {
        let obj = {
          date: `${timeFormat(d.date)}`
        }
        this.energyDomains.forEach(domain => {
          obj[`${domain.label} - ${this.chartUnit}`] = format(d[domain.id])
        })
        this.temperatureDomains.forEach(domain => {
          let label = 'Temperature'
          switch (domain.type) {
            case 'temperature_mean':
              label += ' Mean'
              break
            case 'temperature_min':
              label += ' Min'
              break
            case 'temperature_max':
              label += ' Max'
              break
            default:
          }
          obj[`${label} - C`] = format(d[domain.id])
        })
        this.emissionDomains.forEach(domain => {
          obj[`${domain.label} Emissions Vol - tCO₂e`] = format(d[domain.id])
        })
        obj['Emissions Intensity - kgCO₂e/MWh'] = format(d._emissionsIntensity)
        if (this.priceDomains.length > 0) {
          const priceDomain = this.priceDomains[0]
          const label =
            priceDomain.type === 'price' ? 'Price' : 'Volume Weighted Price'
          obj[`${label} - AUD/MWh`] = format(d[priceDomain.id])
        }
        if (this.hasMarketValue) {
          this.marketValueDomains.forEach(domain => {
            obj[`${domain.label} Market Value - AUD`] = format(d[domain.id])
          })
        }
        if (this.chartEnergyRenewablesLine) {
          if (this.isGeneration) {
            obj['Renewables — %'] = format(
              d._totalGenerationRenewablesPercentage
            )
          } else {
            obj['Renewables — %'] = format(d._totalDemandRenewablesPercentage)
          }
        }
        return obj
      })
    },
    regionId() {
      return this.$route.params.region
    },
    regionLabel() {
      const region = this.regions.find(d => d.id === this.regionId)
      return region ? region.label : ''
    },
    filename() {
      if (this.isFacilitiesView) {
        return 'facilities'
      }
      let date = ''
      let region = this.regionLabel
      if (this.exportData.length > 0) {
        date = d3TimeFormat('%Y%m%d')(this.energyExportData[0].date)
      }
      if (this.regionId === 'nem') {
        region = 'OpenNEM'
      }
      return `${date} ${region}`
    },
    isEnergy() {
      return this.$store.getters.energyChartType === 'energy'
    },
    compareDifference() {
      return this.$store.getters.compareDifference
    },
    focusOn() {
      return this.$store.getters.focusOn
    },
    showButtons() {
      const view = this.$store.getters.currentView
      return view === 'energy' || view === 'facilities'
    }
  },

  mounted() {
    this.ready = true
  },

  methods: {
    toggleDrawer() {
      this.openDrawer = !this.openDrawer
      this.$store.dispatch('drawer', this.openDrawer)
    },
    closeDrawer() {
      this.openDrawer = false
      this.$store.dispatch('drawer', false)
    },
    handleExportImage() {
      const query = {
        range: this.range,
        interval: this.interval
      }
      if (this.dateFilter.length > 0) {
        query.start = new Date(this.dateFilter[0]).getTime()
        query.end = new Date(this.dateFilter[1]).getTime()
      }
      this.$router.push({
        path: `/energy/${this.regionId}/export/`
      })
    },
    handleExportDataClick() {
      this.generating = true
      setTimeout(() => {
        this.generating = false
      }, 1000)
    },
    handleCompareClick() {
      this.$store.dispatch('compareDifference', !this.compareDifference)
      if (this.compareDifference) {
        this.$store.dispatch('focusOn', false)
      }
    },
    handleShareButtonClicked() {
      this.showShareMenu = !this.showShareMenu
    },
    handleClickAway() {
      this.showShareMenu = false
    }
  }
}
</script>

<style lang="scss" scoped>
@import '~/assets/scss/variables.scss';
@import '~/assets/scss/responsive-mixins.scss';

header {
  color: #000;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: $app-padding / 2;
  background-color: $background-alpha;
  position: relative;
  z-index: 998;

  @include desktop {
    margin-top: $app-padding;
  }

  h1 {
    font-family: $header-font-family;
    font-weight: 700;
    color: #000;
    font-size: 1.2rem;
    position: relative;
    top: 3px;
  }

  .header-logo {
    width: 2.3rem;
    max-height: 2.3rem;
    margin: 0.2rem $app-padding / 2;
    position: relative;
    top: 3px;
  }

  .logo-wrapper {
    display: flex;
    align-items: center;
  }

  .fa-ellipsis-v {
    font-size: 2.2rem;
    color: $opennem-link-color;
    position: relative;
    top: 3px;
  }

  .header-dropdowns {
    display: flex;
    align-items: center;

    .selection {
      position: relative;
      top: 3px;
    }
  }

  .share-button-wrapper {
    position: relative;
    .button:focus {
      color: $opennem-link-color;
    }
  }

  &.facilities-header {
    .share-button-wrapper {
      position: absolute;
      left: 50%;
      top: 12px;
      margin-left: -50px;

      @include desktop {
        top: 12px;
        margin-left: -90px;
      }

      .button {
        min-width: 30px;
        border-radius: 4px;
        padding: 0;
        @include desktop {
          min-width: 62px;
          padding: 0 15px;
        }
      }

      .label-image {
        display: none;
        @include desktop {
          display: inline;
        }
      }
    }
  }

  .share-button {
    font-size: 11px;
    img {
      width: 10px;
      color: $opennem-link-color;
      display: inline-block;
      margin-right: 3px;
      position: relative;
      top: -1px;
    }
  }

  .share-menu {
    display: block;
    right: 0;
    left: auto;
    min-width: 40px;
    .dropdown-item {
      border-radius: 0;
      min-width: 40px;
    }
  }

  .share-buttons {
    .button {
      font-size: 0.9rem;
    }

    .label-image {
      margin-left: 3px;
    }
    .fa-chart-bar {
      position: relative;
      top: 1px;
    }
  }
}
.more-buttons {
  position: absolute;
  right: 90px;

  @include mobile {
    right: 0;
    z-index: 9999;

    &.hide {
      display: none;
    }
  }
  .buttons {
    display: inline;
  }

  .button {
    font-size: 11px;

    &.is-rounded {
      min-width: 55px;
    }

    @include mobile {
      border-radius: 0 !important;
    }
  }
}
.compare-button {
  margin-left: 10px;
}
</style>
