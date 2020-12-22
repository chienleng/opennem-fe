<template>
  <div class="card-wrapper">
    <div class="column-headers">
      <div
        :style="{ width: hideRegionColumn ? '60%' : '50%'}"
        class="name-col col-header"
        @click="sort('displayName')"
      >
        Name
        <i
          v-if="sortBy === 'displayName'"
          :class="getColumnIcon('displayName')"
          class="fal" />
      </div>

      <div
        v-show="!hideRegionColumn"
        class="region-col col-header"
      >
        <span @click="sort('regionId')">
          Region
          <i
            v-if="sortBy === 'regionId'"
            :class="getColumnIcon('regionId')"
            class="fal" />
        </span>
      </div>

      <div
        class="tech-col col-header"
      >
        <span @click="sort('fuelTechs')">
          {{ techHeaderName }}
          <i
            v-if="sortBy === 'fuelTechs'"
            :class="getColumnIcon('fuelTechs')"
            class="fal" />
        </span>
      </div>

      <div
        class="cap-col col-header"
        @click="sort('generatorCap')"
      >
        Gen. Capacity
        <i
          v-if="sortBy === 'generatorCap'"
          :class="getColumnIcon('generatorCap')"
          class="fal" />
      </div>
    </div>

    <div
      v-for="(facility, index) in filteredFacilities"
      :id="facility.stationId"
      :key="index"
      :class="{
        'is-selected': isSelected(facility.stationId),
        'is-inactive': !active(facility.status)
      }"
      class="card"
      @mouseover="handleRowHover(facility)"
      @mouseout="handleRowOut"
      @click="handleRowClick(facility)"
      @dblclick="handleRowDoubleClick(facility)"
    >
      <div
        class="bar-left"
        style="display: flex; position: absolute; left: 0; height: 100%;">
        <span
          v-for="(ft, ftIndex) in facility.fuelTechs"
          :key="ftIndex"
          :style="{
            backgroundColor: getColour(ft),
            backgroundImage: getBgImage(facility.status),
            backgroundSize: '5px 5px',
            opacity: getOpacity(ft)
          }"
          class="source-colour-side" />
      </div>

      <div class="facility-detail">
        <div
          :style="{ width: hideRegionColumn ? '60%' : '50%'}"
          class="name-col">
          <h2 class="station-name">
            {{ facility.displayName }}
          </h2>
          <span
            v-if="!facility.hasLocation"
            class="has-location-icon fa-stack fa-1x">
            <i class="fal fa-map-marker-alt fa-stack-1x"/>
            <i class="fal fa-ban fa-stack-2x" />
          </span>
        </div>

        <div
          v-show="!hideRegionColumn"
          class="region-col">
          <small style="color: #666;">{{ getRegionLabel(facility.regionId) }}</small>
        </div>

        <div class="tech-col stat">
          <div
            v-if="facility.genFuelTechs.length"
            class="stat-value">
            <span
              v-for="(ft, genFtIndex) in facility.genFuelTechs"
              :key="genFtIndex"
              :style="{ opacity: getOpacity(ft) }"
            >
              {{ getFtLabel(ft) }}
              <small v-if="facility.genFuelTechs.length > 1">
                ({{ facility.fuelTechRegisteredCap[ft] | facilityFormatNumber }}<span v-if="facility.fuelTechRegisteredCap[ft] < 1">kW</span><span v-else>MW</span>)
              </small>
              <span v-if="genFtIndex !== facility.genFuelTechs.length - 1"><br></span>
            </span>
          </div>
          <div
            v-if="facility.loadFuelTechs.length"
            class="stat-value">
            <em
              v-for="(ft, loadFtIndex) in facility.loadFuelTechs"
              :key="loadFtIndex"
              :style="{ opacity: getOpacity(ft) }"
            >
              {{ getFtLabel(ft) }}
              <small>({{ facility.fuelTechRegisteredCap[ft] | facilityFormatNumber }}<span v-if="facility.fuelTechRegisteredCap[ft] < 1">kW</span><span v-else>MW</span>)</small>
              <span v-if="loadFtIndex !== facility.loadFuelTechs.length - 1"><br></span>
            </em>
          </div>
        </div>

        <div class="cap-col stat">
          <div
            v-show="facility.generatorCap"
            class="stat-value has-text-right">
            <span
              v-tooltip.auto="{
                content: getFacilityInfoTooltip(facility),
                trigger: tabletBreak ? 'click' : 'hover'
              }"
              v-if="hasHiddenCapacity(facility)"
              class="has-hidden-capacity"><i class="fal fa-info-circle"/></span>
            {{ getGeneratorCap(facility) | facilityFormatNumber }}
            <span
              v-if="getGeneratorCap(facility) !== 0 && getGeneratorCap(facility) < 1"
              class="unit">kW</span>
            <span
              v-if="getGeneratorCap(facility) !== 0 && getGeneratorCap(facility) >= 1"
              class="unit">MW</span>
          </div>
          <div
            v-show="!facility.generatorCap"
            class="stat-value has-text-right">
            –
          </div>
        </div>
      </div>
    </div>

    <totals
      :position="totalsPosition"
      :div-width="divWidth"
      :total-facilities="totalFacilities"
      :total-cap="totalCap"
      class="facilities-total"
    />
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import _debounce from 'lodash.debounce'
import _includes from 'lodash.includes'
import _uniqBy from 'lodash.uniqby'
import * as FUEL_TECHS from '~/constants/energy-fuel-techs/group-default.js'
import {
  FACILITY_OPERATING,
  getFacilityStatusLabelById
} from '~/constants/facility-status.js'
import { FacilityRegions } from '~/constants/facility-regions.js'
import Totals from './Totals'

const colHeaders = [
  {
    id: 'fuelTechsColours',
    label: ''
  },
  {
    id: 'stationName',
    label: 'Name'
  },
  {
    id: 'regionId',
    label: 'Region'
  },
  {
    id: 'fuelTechs',
    label: 'Technology'
  },
  {
    id: 'generatorCap',
    label: 'Capacity (MW)'
  }
]

export default {
  components: {
    Totals
  },

  props: {
    filteredFacilities: {
      type: Array,
      default: () => []
    },
    selectedFacility: {
      type: Object,
      default: () => null
    },
    selectedTechs: {
      type: Array,
      default: () => []
    },
    selectedStatuses: {
      type: Array,
      default: () => []
    },
    sortBy: {
      type: String,
      default: () => ''
    },
    orderBy: {
      type: String,
      default: () => ''
    },
    hideRegionColumn: {
      type: Boolean,
      default: () => false
    }
  },

  data() {
    return {
      colHeaders,
      selected: null,
      divWidth: 0,
      divHeight: 0,
      windowHeight: 0,
      waitForDblClickCB: false
    }
  },

  computed: {
    ...mapGetters({
      windowWidth: 'app/windowWidth',
      tabletBreak: 'app/tabletBreak'
    }),
    queryFacilityId() {
      return this.$route.query.selected
    },
    techHeaderName() {
      return this.tabletBreak ? 'Tech' : 'Technology'
    },
    totalsPosition() {
      return this.divHeight > this.windowHeight ? 'fixed' : 'static'
    },
    totalFacilities() {
      return this.filteredFacilities.length
    },
    totalCap() {
      let total = 0
      this.filteredFacilities.forEach(facility => {
        if (this.selectedTechs.length === 0) {
          total += facility.generatorCap
        } else {
          this.selectedTechs.forEach(ft => {
            if (facility.fuelTechRegisteredCap[ft]) {
              total += facility.fuelTechRegisteredCap[ft]
            }
          })
        }
      })
      return total
    }
  },

  watch: {
    selectedFacility(selected) {
      if (selected) {
        this.selected = selected
        const $selected = document.getElementById(selected.stationId)
        if (
          $selected.getBoundingClientRect().top < 110 ||
          $selected.getBoundingClientRect().top >= this.windowHeight - 60
        ) {
          $selected.scrollIntoView({
            behavior: 'auto',
            block: 'center'
          })
        }
      }
    },

    filteredFacilities() {
      this.$nextTick(() => {
        this.divHeight = this.$el.offsetHeight
      })

      if (this.queryFacilityId) {
        const find = this.filteredFacilities.find(
          f => f.facilityId === this.queryFacilityId
        )
        if (find) {
          this.handleRowClick(find)
        }
      }
    }
  },

  mounted() {
    if (process.client) {
      this.windowHeight = window.innerHeight
      this.divWidth = this.calculateDivWidth()

      window.addEventListener(
        'resize',
        _debounce(() => {
          this.windowHeight = window.innerHeight
          this.divWidth = this.calculateDivWidth()
        }, 200)
      )

      window.addEventListener('keydown', e => {
        const isUp = e.keyCode === 38
        const isDown = e.keyCode === 40
        const selectedId = this.selectedFacility
          ? this.selectedFacility.stationId
          : null
        const length = this.filteredFacilities.length
        const index = this.filteredFacilities.findIndex(
          f => f.stationId === selectedId
        )
        if (index !== -1) {
          if (isUp) {
            e.preventDefault()
            if (index <= 0) {
            } else {
              this.$emit(
                'facilitySelect',
                this.filteredFacilities[index - 1],
                true
              )
            }
          } else if (isDown) {
            e.preventDefault()
            if (index >= length - 1) {
            } else {
              this.$emit(
                'facilitySelect',
                this.filteredFacilities[index + 1],
                true
              )
            }
          }
        }
      })
    }
  },

  updated() {
    this.$nextTick(() => {
      this.divHeight = this.$el.offsetHeight
    })
  },

  methods: {
    calculateDivWidth() {
      if (this.tabletBreak) {
        return this.windowWidth
      }
      return this.$el.offsetWidth - 13
    },
    active(status) {
      return status === FACILITY_OPERATING
    },
    sort(colId) {
      this.$emit('orderChanged', colId)
    },
    handleRowClick: _debounce(function(facility) {
      console.log(`${facility.displayName} view model`, facility)
      console.log(`${facility.displayName} json obj`, facility.jsonData)
      if (!this.tabletBreak) {
        if (this.selected === facility && !this.waitForDblClickCB) {
          this.selected = null
          this.$emit('facilitySelect', null, true)
        } else {
          this.selected = facility
          this.waitForDblClickCB = false
          this.$emit('facilitySelect', facility, true)
        }
      }
    }, 200),
    // eslint-disable-next-line
    handleRowHover: _debounce(function(facility) {
      this.$emit('facilityHover', facility, true)
    }, 200),
    // eslint-disable-next-line
    handleRowOut: _debounce(function() {
      this.$emit('facilityMouseout')
    }, 200),
    shouldRightAligned(colHeaderId) {
      return colHeaderId === 'generatorCap'
    },
    handleRowDoubleClick(facility) {
      this.waitForDblClickCB = true
      this.$emit('openFacilityView', facility)
    },
    getColumnIcon(colHeaderId) {
      if (colHeaderId === this.sortBy) {
        if (this.orderBy === 'asc') {
          return 'fa-sort-up'
        }
        return 'fa-sort-down'
      }
      return ''
    },
    getFtLabel(ft) {
      const ftLabel = FUEL_TECHS.FUEL_TECH_LABEL[ft]
      if (ftLabel) {
        if (ft === FUEL_TECHS.BATTERY_DISCHARGING) {
          return 'Battery'
        }
        if (ft === FUEL_TECHS.SOLAR_UTILITY || ft === FUEL_TECHS.SOLAR) {
          return 'Solar'
        }
        return ftLabel
      }
      return ft || '—'
    },
    getRegionLabel(code) {
      const find = FacilityRegions.find(region => region.id === code)
      return find ? find.abbr : code
    },
    getColour(fuelTech) {
      const ftColour = FUEL_TECHS.DEFAULT_FUEL_TECH_COLOUR[fuelTech]
      return ftColour || 'transparent'
    },
    getBgImage(status) {
      // if (status === 'committed')
      //   return 'linear-gradient(transparent 50%, rgba(255,255,255,.5) 50%)'
      // if (status === 'commissioning')
      //   return 'linear-gradient(transparent 80%, rgba(255,255,255,.5) 80%)'
      return 'none'
    },
    getOpacity(fuelTech) {
      if (this.selectedTechs.length === 0) {
        return 1
      }
      return _includes(this.selectedTechs, fuelTech) ? 1 : 0.3
    },
    getGeneratorCap(facility) {
      if (this.selectedTechs.length === 0) {
        return facility.generatorCap
      }

      let cap = 0
      this.selectedTechs.forEach(d => {
        if (
          FUEL_TECHS.FUEL_TECH_CATEGORY[d] !== 'load' &&
          facility.fuelTechRegisteredCap[d]
        ) {
          cap += facility.fuelTechRegisteredCap[d]
        }
      })

      return cap
    },
    getFacilityInfoTooltip(facility) {
      const units = facility.units
      let string = ''
      const excluded = []
      units.forEach(u => {
        let isTechExcluded = false,
          isStatusExcluded = false
        if (
          (this.selectedTechs.length > 0 &&
            this.selectedTechs.indexOf(u.fuelTech) === -1) ||
          (this.selectedStatuses.length > 0 &&
            this.selectedStatuses.indexOf(u.status) === -1)
        ) {
          excluded.push(u)
        }
      })

      const uniq = _uniqBy(excluded, 'name')

      uniq.forEach(e => {
        const ftLabel = this.getFtLabel(e.fuelTech)
        const statusLabel = getFacilityStatusLabelById(e.status)
        const regCap = this.$options.filters.facilityFormatNumber(e.regCap)
        const unit = regCap < 1 ? 'kW' : 'MW'
        string += `<span>&#8226; ${ftLabel}: <strong>${regCap} ${unit}</strong> (${statusLabel})</span>`
      })

      return `Capacity that is excluded by filter:<div class="tooltip-list">${string}</div>`
    },
    hasHiddenCapacity(facility) {
      const ftBoolArr = []
      if (this.selectedTechs.length > 0) {
        facility.fuelTechs.forEach(ft => {
          let isSelected = false
          this.selectedTechs.forEach(selectedFt => {
            if (selectedFt === ft) {
              isSelected = true
            }
          })
          ftBoolArr.push(isSelected)
        })
      } else {
        ftBoolArr.push(true)
      }

      const statusBoolArr = []
      if (this.selectedStatuses.length > 0) {
        facility.unitStatuses.forEach(status => {
          let isSelected = false
          this.selectedStatuses.forEach(selectedStatus => {
            if (selectedStatus === status) {
              isSelected = true
            }
          })
          statusBoolArr.push(isSelected)
        })
      } else {
        statusBoolArr.push(true)
      }

      return !(
        ftBoolArr.reduce((a, b) => a && b) &&
        statusBoolArr.reduce((a, b) => a && b)
      )
    },
    isSelected(stationId) {
      if (this.selected) {
        return stationId === this.selected.stationId
      }
      return false
    },
    isSelectedStatus(status) {
      return this.selectedStatuses.indexOf(status) > -1
    }
  }
}
</script>

<style lang="scss" scoped>
@import '~/assets/scss/responsive-mixins.scss';
@import '~/assets/scss/variables.scss';

.card-wrapper {
  margin-bottom: 2rem;
  position: relative;
  padding: 0 10px;

  @include tablet {
    padding: 0;
  }
}

.card {
  margin-bottom: 1px;
  font-size: 70%;
  // transition: all 0.1s ease-in-out;
  cursor: pointer;
  opacity: 0.9;
  z-index: 9;
  box-shadow: none;
  min-height: 25px;

  &.is-inactive {
    opacity: 0.55;
  }
  &:hover {
    opacity: 1;
    box-shadow: 0 0 5px rgba(100, 100, 100, 0.2);
    opacity: 1;
    z-index: 10;
  }

  &.is-selected {
    box-shadow: 0 0 5px rgba(100, 100, 100, 0.2);
    opacity: 1;
    transform: scale(1.02);
    z-index: 10;
    border: 2px solid $opennem-link-color;
  }

  .card-content {
    padding: 0;
  }
}

.facility-detail {
  min-height: 25px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stat {
  .stat-label {
    color: #999;
    font-size: 9px;
    font-weight: 600;
  }
  .stat-value {
    color: #000;
    .unit {
      font-size: 9px;
      position: relative;
      left: -3px;
    }
  }
}

.detail .stat {
  margin-bottom: 5px;
}

.unit-tooltip {
  text-transform: capitalize;
}

.source-colour-side {
  width: 3px;
  height: 100%;
  background-color: rgba(100, 100, 100, 0.8);

  @include tablet {
    width: 6px;
  }
}

.station-name {
  font-weight: 600;
  font-size: 12px;
  display: inline-block;

  @include tablet {
    font-size: 14px;
  }
}
.has-location-icon {
  position: relative;
  top: -1px;
  left: 2px;
  font-size: 0.8em;
  opacity: 0.75;
  .fa-map-marker-alt {
    font-size: 1.3em;
    color: #000;
  }
  .fa-ban {
    color: $opennem-link-color;
  }
}
.max-capcity {
  font-size: 70%;
  color: #787878;

  .unit {
    font-size: 80%;
    left: -2px;
  }
}
.column-headers {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 5px;
  position: sticky;
  top: 44px;
  background-color: $beige-lighter;
  padding-bottom: 5px;
  z-index: 11;
  border-bottom: 1px solid #333;

  @include tablet {
    top: 40px;
    margin-left: -7px;
    margin-right: -7px;
    padding-left: 7px;
    padding-right: 7px;
  }
}
.col-header {
  cursor: pointer;
  font-family: $header-font-family;
  font-size: 9px;
  font-weight: 600;
  user-select: none;
  padding-top: 5px;

  @include tablet {
    font-size: 11px;
  }
}

.name-col {
  margin-left: 1rem;

  @include tablet {
    margin-left: 2rem;
  }
}
.region-col {
  width: 11%;

  &.col-header {
    white-space: nowrap;
  }
}
.tech-col {
  width: 25%;

  .stat-value {
    font-size: 8px;

    @include tablet {
      font-size: 9px;
    }
  }

  &.col-header {
    white-space: nowrap;
  }
}

.cap-col {
  width: 20%;
  text-align: right;
  margin-right: 15px;

  &.col-header {
    white-space: nowrap;
  }

  .stat-value {
    font-size: 12px;

    @include tablet {
      font-size: 14px;
    }
  }

  .has-hidden-capacity {
    font-size: 10px;
  }

  &.stat .unit {
    font-size: 8px;
    left: 0;

    @include tablet {
      font-size: 10px;
    }
  }
}
</style>
