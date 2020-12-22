<template>
  <div>
    <!-- <tile-selector
      class="tile-selector"
      :tile="selectedTile"
      @tileSelect="handleTileSelect"
    /> -->
    <div
      id="map"
      :style="{ height: mapHeight }" />
    <div class="attribution">
      Map tiles by <a href="http://stamen.com">Stamen Design</a>, under <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a>. Data by <a href="http://openstreetmap.org">OpenStreetMap</a>, under <a href="http://www.openstreetmap.org/copyright">ODbL</a>.
    </div>

    <!-- <div
      id="map"
      style="height: 400px">
      <no-ssr>
        <l-map
          :zoom="13"
          :center="mapCentre">
          <l-tile-layer :url="tileLayer" />
          <l-marker :lat-lng="[47.413220, -1.219482]" />
        </l-map>
      </no-ssr>
    </div> -->

    <totals
      v-if="tabletBreak"
      :position="'fixed'"
      :div-width="divWidth"
      :total-facilities="totalFacilities"
      :total-cap="totalCap"
    />
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import _debounce from 'lodash.debounce'
import _includes from 'lodash.includes'
import _isEmpty from 'lodash.isempty'
import _orderBy from 'lodash.orderby'
// import L from 'leaflet'
import { scaleLinear as d3ScaleLinear } from 'd3-scale'
import * as FUEL_TECHS from '~/constants/energy-fuel-techs/group-default.js'
import { getRegionLocationById } from '~/constants/facility-regions.js'
// import * as L from 'vue2-leaflet'

// import TileSelector from './MapTileSelector';
import Totals from './Totals'

export default {
  components: {
    // TileSelector,
    Totals
  },
  props: {
    data: {
      type: Array,
      default: () => []
    },
    selectedFacility: {
      type: Object,
      default: () => null
    },
    hoveredFacility: {
      type: Object,
      default: () => null
    },
    shouldZoomWhenSelected: {
      type: Boolean,
      default: () => false
    }
  },

  data() {
    return {
      facilitiesData: [],
      tileLayer:
        '//stamen-tiles-{s}.a.ssl.fastly.net/toner-lite/{z}/{x}/{y}{r}.png',
      tileLayers: {
        // 'toner-lite': L.tileLayer(
        //   '//stamen-tiles-{s}.a.ssl.fastly.net/toner-lite/{z}/{x}/{y}{r}.{ext}',
        //   {
        //     minZoom: 0,
        //     maxZoom: 18,
        //     ext: 'png'
        //   }
        // ),
        // terrain: L.tileLayer(
        //   '//stamen-tiles-{s}.a.ssl.fastly.net/terrain/{z}/{x}/{y}{r}.{ext}',
        //   {
        //     minZoom: 0,
        //     maxZoom: 18,
        //     ext: 'png'
        //   }
        // )
      },
      selectedTile: 'toner-lite',
      marker: null,
      // marker: L.icon({
      //   iconUrl: '/images/marker.png',
      //   shadowUrl: '/images/marker-shadow.png',
      //   iconSize: [25, 41],
      //   iconAnchor: [12, 41],
      //   shadowSize: [41, 41]
      // }),
      map: null,
      selectedMarker: null,
      hoveredMarker: null,
      facilitiesFeature: null,
      emissionsFeature: null,
      windowHeight: 800,
      divWidth: 0,
      mapCentre: [-29.186936, 143.633537]
    }
  },

  computed: {
    ...mapGetters({
      tabletBreak: 'app/tabletBreak'
    }),

    mapHeight() {
      const offset = this.tabletBreak ? 49 : 50
      return `${this.windowHeight - offset}px`
    },

    facilitySelectedTechs() {
      // return this.$store.getters.facilitySelectedTechs
      return []
    },

    totalFacilities() {
      return this.facilitiesData.length
    },

    totalCap() {
      let total = 0
      this.facilitiesData.forEach(facility => {
        if (this.facilitySelectedTechs.length === 0) {
          total += facility.generatorCap
        } else {
          this.facilitySelectedTechs.forEach(ft => {
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
    selectedTile(tile) {
      Object.keys(this.tileLayers).forEach(layer => {
        this.tileLayers[layer].remove()
      })
      this.tileLayers[tile].addTo(this.map)
    },
    data(newData) {
      const sorted = _orderBy(newData, [this.getGeneratorCap], ['desc'])
      this.facilitiesData = sorted
      this.updateMap(sorted)
    },
    hoveredFacility(facility) {
      if (facility) {
        const selected = this.selectedFacility
        const selectedId = selected ? selected.stationId : ''
        const hasLocation = facility.location

        if (selectedId !== facility.stationId) {
          if (this.hoveredMarker) {
            this.hoveredMarker.remove()
          }

          if (hasLocation.latitude && hasLocation.longitude) {
            const lat = hasLocation.latitude
            const lng = hasLocation.longitude

            this.hoveredMarker = L.popup({
              autoClose: false,
              autoPan: false,
              className: 'map-popup'
            })
              .setLatLng([lat, lng])
              .setContent(facility.displayName)

            this.hoveredMarker.openOn(this.map)
          }
        }
      } else if (this.hoveredMarker) {
        this.hoveredMarker.remove()
      }
    },
    selectedFacility(facility) {
      if (facility) {
        const hasLocation = facility.location

        if (this.selectedMarker) {
          this.selectedMarker.remove()
        }

        if (hasLocation.latitude && hasLocation.longitude) {
          const lat = hasLocation.latitude
          const lng = hasLocation.longitude
          // const loc = new L.LatLng(lat, lng)

          this.selectedMarker = L.popup({
            autoClose: false,
            autoPan: false,
            closeOnClick: false,
            className: 'map-popup selected'
          })
            .setLatLng([lat, lng])
            .setContent(facility.displayName)
          this.selectedMarker.openOn(this.map)
          this.map.setView([lat, lng], 7)
        } else {
          // no lat/lng, so use region or state
          const location = getRegionLocationById(facility.regionId)
          if (location) {
            this.map.setView([location[0], location[1]], 6)
          }
        }
      } else if (this.selectedMarker) {
        this.selectedMarker.remove()
        const bounds = this.facilitiesFeature.getBounds()
        if (!_isEmpty(bounds)) {
          this.map.fitBounds(this.facilitiesFeature.getBounds())
        }
      }
    }
  },

  mounted() {
    const sorted = _orderBy(this.data, [this.getGeneratorCap], ['desc'])
    this.facilitiesData = sorted

    this.tileLayers = {
      'toner-lite': L.tileLayer(
        '//stamen-tiles-{s}.a.ssl.fastly.net/toner-lite/{z}/{x}/{y}{r}.{ext}',
        {
          minZoom: 0,
          maxZoom: 18,
          ext: 'png'
        }
      ),
      terrain: L.tileLayer(
        '//stamen-tiles-{s}.a.ssl.fastly.net/terrain/{z}/{x}/{y}{r}.{ext}',
        {
          minZoom: 0,
          maxZoom: 18,
          ext: 'png'
        }
      )
    }

    this.marker = L.icon({
      iconUrl: '/images/marker.png',
      shadowUrl: '/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      shadowSize: [41, 41]
    })

    this.$nextTick(() => {
      this.setup()
      this.updateMap(this.facilitiesData)
    })

    if (process.client) {
      this.divWidth = this.$el.offsetWidth
      this.windowHeight = window.innerHeight
      window.addEventListener(
        'resize',
        _debounce(() => {
          this.divWidth = this.$el.offsetWidth
          this.windowHeight = window.innerHeight
        }, 200)
      )
    }
  },

  methods: {
    setup() {
      this.map = L.map('map', {
        attributionControl: false,
        maxZoom: 10,
        minZoom: 4,
        zoomAnimation: true,
        zoomControl: false
      }).setView([-29.186936, 143.633537], 4)
      this.facilitiesFeature = L.featureGroup()
      this.emissionsFeature = L.featureGroup()
      this.tileLayers[this.selectedTile].addTo(this.map)

      const attr = L.control.attribution({
        position: 'bottomleft',
        prefix: false
      })
      const zoom = L.control.zoom({
        position: 'topright'
      })

      this.map.addControl(attr)
      this.map.addControl(zoom)
    },

    handleMapCircleClicked(facility) {
      this.$emit('facilitySelect', facility, false)
    },

    getColour(fuelTechs, facility) {
      const ftCaps = facility.fuelTechRegisteredCap
      let highest = 0
      let highestFt = null
      Object.keys(ftCaps).forEach(d => {
        if (this.facilitySelectedTechs.length) {
          const included = _includes(this.facilitySelectedTechs, d)
          if (included) {
            if (ftCaps[d] >= highest) {
              highestFt = d
              highest = ftCaps[d]
            }
          }
        } else if (ftCaps[d] >= highest) {
          highestFt = d
          highest = ftCaps[d]
        }
      })

      const ftColour = FUEL_TECHS.DEFAULT_FUEL_TECH_COLOUR[highestFt]
      return ftColour || 'lightgrey'
    },

    getGeneratorCap(facility) {
      if (this.facilitySelectedTechs.length === 0) {
        return facility.generatorCap
      }

      let cap = 0
      this.facilitySelectedTechs.forEach(d => {
        if (
          FUEL_TECHS.FUEL_TECH_CATEGORY[d] !== 'load' &&
          facility.fuelTechRegisteredCap[d]
        ) {
          cap += facility.fuelTechRegisteredCap[d]
        }
      })
      return cap
    },

    selectedFacilityBounds() {
      const lat = this.selectedMarker._latlng.lat // eslint-disable-line
      const lng = this.selectedMarker._latlng.lng // eslint-disable-line
      const loc = new L.LatLng(lat, lng)
      this.map.panTo(loc)
    },

    handleTileSelect(tile) {
      this.selectedTile = tile
    },

    updateMap(data) {
      this.map.removeLayer(this.facilitiesFeature)
      this.facilitiesFeature = L.featureGroup()
      const self = this
      data.forEach(d => {
        const location = d.location
        if (location.latitude && location.longitude) {
          const lat = location.latitude
          const lng = location.longitude
          const radiusScale = d3ScaleLinear([0, Math.sqrt(3000)], [2000, 50000])
          const radius = radiusScale(Math.sqrt(this.getGeneratorCap(d)))
          const colour = this.getColour(d.fuelTechs, d)
          const circle = L.circle([lat, lng], {
            color: colour,
            fillColor: colour,
            fillOpacity: 0.55,
            opacity: 0.95,
            weight: 1,
            radius
          })

          circle.on({
            click() {
              self.handleMapCircleClicked(d)
            },
            mouseover() {
              const selected = self.selectedFacility
              const selectedId = selected ? selected.stationId : ''
              const circleBounds = circle.getBounds()
              const options = {
                _id: d.stationId,
                autoClose: false,
                autoPan: false,
                className: 'map-popup'
              }

              if (selectedId !== d.stationId) {
                if (self.hoveredMarker) {
                  self.hoveredMarker.remove()
                }

                self.hoveredMarker = L.popup(options)
                  .setLatLng([circleBounds._northEast.lat, lng]) // eslint-disable-line
                  .setContent(d.displayName)

                self.hoveredMarker.openOn(self.map)
              }
            },
            mouseout() {
              if (self.hoveredMarker) {
                self.hoveredMarker.remove()
              }
            }
          })
          circle.addTo(this.facilitiesFeature)
        }
      })

      this.map.addLayer(this.facilitiesFeature)

      const bounds = this.facilitiesFeature.getBounds()
      if (!_isEmpty(bounds)) {
        this.map.fitBounds(this.facilitiesFeature.getBounds())
      }
    }
  }
}
</script>

<style lang="scss" scoped>
@import '~/assets/scss/responsive-mixins.scss';

#map {
  width: 100%;
  height: 200px;
  z-index: 1;
  border-radius: 2px;
  // box-shadow: 0 0 20px rgba(0,0,0,.05);
  opacity: 0.95;
}

.tile-selector {
  position: absolute;
  right: 10px;
  bottom: 25px;
  z-index: 9;
}

.attribution {
  font-size: 9px;
  text-align: center;
  opacity: 0.75;
  padding-top: 5px;
}
</style>
