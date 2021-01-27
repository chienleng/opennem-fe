<template>
  <div>
    <facility-filters
      :selected-view="selectedView"
      :selected-techs="selectedTechs"
      :selected-statuses="selectedStatuses"
      class="facility-filters"
      @techsSelect="handleTechsSelected"
      @selectedStatuses="handleStatusesSelected"
      @facilityNameFilter="handleFacilityNameFilter"
      @viewSelect="handleViewSelect"
    />

    <transition name="fade">
      <div
        v-if="!ready"
        class="facility-list-map-container loading-containers">
        <div class="facility-list">
          <div
            class="loader-block"
            style="height: 400px" />
        </div>
        <div
          class="facility-map"
          style="margin-top: 127px;">
          <div
            class="loader-block"
            style="height: 400px" />
        </div>
      </div>
    </transition>

    <div
      v-if="ready"
      class="facility-list-map-container">
      <facility-list
        v-if="!tabletBreak || (tabletBreak && selectedView === 'list')"
        :filtered-facilities="filteredFacilities"
        :selected-facility="selectedFacility"
        :selected-techs="selectedTechs"
        :selected-statuses="selectedStatuses"
        :sort-by="sortBy"
        :order-by="orderBy"
        :hide-region-column="!isNemRegion && !isAllRegion"
        class="facility-list"
        @orderChanged="handleOrderChange"
        @facilitySelect="handleFacilitySelect"
        @facilityHover="handleFacilityHover"
        @facilityMouseout="handleFacilityOut"
        @openFacilityView="handleOpenFacilityView"
      />

      <facility-map
        v-if="!tabletBreak || (tabletBreak && selectedView === 'map')"
        :data="filteredFacilities"
        :selected-facility="selectedFacility"
        :hovered-facility="hoveredFacility"
        :show-zoom-when-selected="shouldZoomWhenSelected"
        class="facility-map"
        @facilitySelect="handleFacilitySelect"
      />

      <transition name="slide-up-fade">
        <facility-card
          v-if="selectedFacility && tabletBreak"
          :selected-techs="selectedTechs"
          :facility="selectedFacility"
          @close="handleCloseDetail"
        />
      </transition>
    </div>
  </div>
</template>

<script>
import { mapGetters, mapMutations } from 'vuex'
import _debounce from 'lodash.debounce'
import _includes from 'lodash.includes'
import _orderBy from 'lodash.orderby'
import * as FUEL_TECHS from '~/constants/energy-fuel-techs/group-default.js'
import { FACILITY_OPERATING } from '~/constants/facility-status.js'
import {
  FacilityRegions,
  getNEMRegionArray,
  getFacilityRegionLabel
} from '~/constants/facility-regions.js'

import Http from '~/services/Http.js'
import FacilityDataParse from '@/data/parse/facility'
import FacilityFilters from '~/components/Facility/Filters.vue'
import FacilityList from '~/components/Facility/List.vue'
import FacilityMap from '~/components/Facility/Map.vue'
import FacilityCard from '~/components/Facility/Card.vue'

const ASCENDING = 'asc'
const DESCENDING = 'desc'

export default {
  layout: 'main',

  head() {
    return {
      title: ` Facilities: ${getFacilityRegionLabel(this.regionId)}`,
      meta: [
        {
          hid: 'twitter:title',
          name: 'twitter:title',
          content: `OpenNEM Facilities: ${getFacilityRegionLabel(
            this.regionId
          )}`
        },
        {
          hid: 'twitter:image:src',
          name: 'twitter:image:src',
          content: this.cardFilename
        },
        {
          hid: 'og:title',
          property: 'og:title',
          content: `OpenNEM Facilities: ${getFacilityRegionLabel(
            this.regionId
          )}`
        },
        {
          hid: 'og:image',
          property: 'og:image',
          content: this.cardFilename
        },
        {
          hid: 'og:image:width',
          property: 'og:image:width',
          content: '1447'
        },
        {
          hid: 'og:image:height',
          property: 'og:image:height',
          content: '932'
        }
      ]
    }
  },

  components: {
    FacilityFilters,
    FacilityList,
    FacilityMap,
    FacilityCard
  },

  data() {
    return {
      ready: false,
      filterString: '',
      facilityData: [],
      selectedFacility: null,
      hoveredFacility: null,
      selectedStatuses: [FACILITY_OPERATING],
      selectedTechs: [],
      selectedView: 'list',
      sortBy: 'displayName',
      orderBy: ASCENDING,
      totalFacilities: 0,
      shouldZoomWhenSelected: false,
      baseUrl: `${this.$config.url}/images/screens/`,
      useDev: this.$config.useDev
    }
  },

  computed: {
    ...mapGetters({
      hostEnv: 'hostEnv',
      windowWidth: 'app/windowWidth',
      tabletBreak: 'app/tabletBreak'
    }),
    filteredFacilities: {
      get() {
        return this.$store.getters['facility/filteredFacilities']
      },
      set(facilities) {
        this.setFilteredFacilities(facilities)
      }
    },
    facilityDataset() {
      return this.$store.getters['facility/dataset']
    },
    regionId() {
      return this.$route.params.region
    },
    isNemRegion() {
      return this.$route.params.region === 'nem'
    },
    isAllRegion() {
      return this.$route.params.region === 'au'
    },

    facilitySortBy() {
      return this.$store.getters['facility/sortBy']
    },
    facilityOrderBy() {
      return this.$store.getters['facility/orderBy']
    },
    facilitySelectedStatuses() {
      return this.$store.getters['facility/selectedStatuses']
    },
    facilitySelectedTechs() {
      return this.$store.getters['facility/selectedTechs']
    },
    facilitySelectedView() {
      return this.$store.getters['facility/selectedView']
    },
    cardFilename() {
      return this.useDev
        ? `${this.baseUrl}opennem-facilities-dev.png`
        : `${this.baseUrl}opennem-facilities-${this.regionId}.png`
    }
  },

  watch: {
    facilityData() {
      this.updateFacilitiesData()
    },
    selectedTechs() {
      this.updateFacilitiesData()
    },
    selectedStatuses() {
      this.updateFacilitiesData()
    },
    sortBy() {
      this.updateFacilitiesData()
    },
    orderBy() {
      this.updateFacilitiesData()
    },
    filterString() {
      this.updateFacilitiesData()
    }
  },

  mounted() {
    this.$store.dispatch('currentView', 'facilities')
    this.sortBy = this.facilitySortBy
    this.orderBy = this.facilityOrderBy
    this.selectedStatuses = this.facilitySelectedStatuses
    this.selectedTechs = this.facilitySelectedTechs
    this.selectedView = this.facilitySelectedView

    if (this.facilityDataset.length > 0) {
      this.facilityData = this.facilityDataset
      this.ready = true
    } else {
      this.fetchData()
    }
  },

  methods: {
    ...mapMutations({
      previousPath: 'facility/previousPath',
      setFilteredFacilities: 'facility/filteredFacilities'
    }),
    fetchData() {
      const urls = []

      if (this.hostEnv === 'prod') {
        urls.push('/facility/facility_registry.json')
      } else {
        urls.push(
          'https://s3-ap-southeast-2.amazonaws.com/data.opennem.org.au/v3/geo/au_facilities.json'
        )
      }

      if (urls.length > 0) {
        Http(urls)
          .then(responses => {
            this.handleResponses(responses)
          })
          .catch(e => {
            console.error(e)
          })
      } else {
        console.warn('fetchData', 'No urls provided')
      }
    },

    handleResponses(responses) {
      if (this.hostEnv === 'prod') {
        FacilityDataParse.flatten(responses[0]).then(res => {
          this.facilityData = res
          this.ready = true
          this.$store.dispatch('facility/dataset', res)
        })
      } else {
        if (responses.length > 0 && responses[0].features) {
          FacilityDataParse.flattenV3(responses[0].features).then(res => {
            this.facilityData = res
            this.ready = true
            this.$store.dispatch('facility/dataset', res)
          })
        } else {
          console.warn('There is an issue parsing the response.')
        }
      }
    },

    updateFacilitiesData() {
      const sortedData = _orderBy(
        this.facilityData,
        [
          d => {
            if (this.selectedTechs.length === 0) {
              return d[this.sortBy]
            }
            if (this.sortBy !== 'generatorCap') {
              return d[this.sortBy]
            }
            let totals = 0
            this.selectedTechs.forEach(ft => {
              totals += d.fuelTechRegisteredCap[ft] || 0
            })
            return totals
          }
        ],
        [this.orderBy]
      )

      const filtered = sortedData

      const that = this
      let regionIds = [this.regionId]
      if (this.regionId === 'au') {
        regionIds = []
      } else if (this.regionId === 'nem') {
        regionIds = getNEMRegionArray()
      }

      async function updateFilter() {
        return filtered.filter(
          g =>
            g.displayName
              .toLowerCase()
              .includes(that.filterString.toLowerCase()) &&
            (regionIds.length === 0 ||
              (regionIds.length > 0 &&
                _includes(regionIds, g.regionId.toLowerCase()))) &&
            (that.selectedStatuses.length <= 0 ||
              g.unitStatuses.some(r => that.selectedStatuses.includes(r))) &&
            (that.selectedTechs.length <= 0 ||
              g.fuelTechs.some(r => that.selectedTechs.includes(r)))
        )
      }

      updateFilter().then(facilities => {
        that.filteredFacilities = facilities
        that.totalFacilities = facilities.length

        const exportData = facilities.map(d => {
          // eslint-disable-line
          const region = FacilityRegions.find(r => r.id === d.regionId)
          return {
            'Facility Name': d.displayName,
            Status: d.status,
            Region: region ? region.label : '',
            Technology: d.fuelTechs.map(ft => FUEL_TECHS.FUEL_TECH_LABEL[ft]),
            'Generator Capacity (MW)': d.generatorCap,
            Latitude: d.location.latitude,
            Longitude: d.location.longitude
          }
        })

        that.$store.dispatch('facilityExportData', exportData)
      })
    },

    toggleOrder(order) {
      return order === ASCENDING ? DESCENDING : ASCENDING
    },

    setFilterString(string) {
      this.filterString = string
      this.updateFacilitiesData()
    },

    handleFacilityNameFilter(string) {
      this.filterString = string
    },
    handleOrderChange(orderName) {
      if (this.sortBy === orderName) {
        this.orderBy = this.toggleOrder(this.orderBy)
      } else {
        this.orderBy = ASCENDING
      }
      this.sortBy = orderName

      this.$store.dispatch('facility/sortBy', this.sortBy)
      this.$store.dispatch('facility/orderBy', this.orderBy)
    },
    handleFacilitySelect(facility, shouldZoom) {
      if (facility) {
        this.$router.push({ query: { selected: facility.facilityId } })
      } else {
        this.$router.push({ query: {} })
      }
      this.selectedFacility = facility
      this.shouldZoomWhenSelected = shouldZoom
    },
    handleFacilityHover(facility, shouldZoom) {
      this.hoveredFacility = facility
      this.shouldZoomWhenSelected = shouldZoom
    },
    handleFacilityOut() {
      this.hoveredFacility = null
    },
    handleTechsSelected(techs) {
      this.selectedTechs = techs
      this.$store.dispatch('facility/selectedTechs', this.selectedTechs)
    },
    handleStatusesSelected(statuses) {
      this.selectedStatuses = statuses
      this.$store.dispatch('facility/selectedStatuses', this.selectedStatuses)
    },
    handleViewSelect(view) {
      this.selectedView = view
      this.$store.dispatch('facility/selectedView', this.selectedView)
    },
    handleCloseDetail() {
      this.selectedFacility = null
    },
    handleOpenFacilityView(facility) {
      this.handleFacilitySelect(facility, true)
      this.previousPath(this.$route.fullPath)

      const id = facility.facilityId
      const network = facility.network
      this.$router.push({
        path: `/facility/${encodeURIComponent(network)}/${encodeURIComponent(
          id
        )}/`
      })
    }
  }
}
</script>

<style lang="scss" scoped>
@import '~/assets/scss/responsive-mixins.scss';
@import '~/assets/scss/variables.scss';

.facility-filters {
  position: sticky;
  top: 0;
  background-color: $beige-lighter;
  z-index: 99;
}

.facility-list-map-container {
  @include tablet {
    padding: 1rem;
    display: flex;
  }

  .facility-list {
    @include tablet {
      width: 50%;
      padding: 0 1rem;
      padding-left: 0;
    }
  }
  .facility-map {
    padding-top: 1rem;
    @include tablet {
      width: 50%;
      position: fixed;
      right: 0;
      top: 0;
      z-index: 999;
      padding: 0 1rem 0 0;
    }
  }
}
</style>
