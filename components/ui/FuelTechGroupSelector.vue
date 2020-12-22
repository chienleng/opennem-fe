<template>
  <div class="select is-rounded">
    <select v-model="selected">

      <optgroup label="Fuel Technology Grouping">
        <option
          v-for="(g, index) in groups"
          :key="index"
          :value="g">
          {{ g }}
        </option>
      </optgroup>

      <option
        v-if="showRegionCompareOption"
        disabled>——————————</option>
      <option
        v-if="showRegionCompareOption"
        value="regions">Compare Regions</option>
    </select>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'

const groups = [
  'Default',
  'Simplified',
  'Coal/Gas/Renewables',
  'Flexibility',
  'Renewable/Fossil',
  'Solar/Residual'
]

export default {
  data() {
    return {
      groups,
      selected: groups[0]
    }
  },

  computed: {
    ...mapGetters({
      featureRegionCompare: 'feature/regionCompare',
      fuelTechGroupName: 'fuelTechGroupName'
    }),
    regionId() {
      return this.$route.params.region
    },
    isRegionAuOrNem() {
      return this.regionId === 'nem' || this.regionId === 'au'
    },
    isRegionCompareRoute() {
      return this.$route.name === 'energy-region-view-regions'
    },
    showRegionCompareOption() {
      return this.isRegionAuOrNem && this.featureRegionCompare
    }
  },

  watch: {
    selected(newValue, oldValue) {
      // if (this.isRegionAuOrNem) {
      //   this.$store.dispatch('fuelTechGroupName', newValue)
      //   this.$router.push({ path: '/energy/nem/view/regions' })
      // } else {
      //   this.triggerGroupChange()
      //   if (oldValue === 'regions') {
      //     this.$router.push({ path: `/energy/${this.regionId}` })
      //   }
      // }

      this.triggerGroupChange()
    },
    fuelTechGroupName(group) {
      this.selected = group
    }
  },

  mounted() {
    if (this.fuelTechGroupName === 'regions') {
      if (this.regionId !== 'nem') {
        this.$store.dispatch('fuelTechGroupName', 'Default')
        this.selected = 'Default'
        this.$router.push({ path: `/energy/${this.regionId}` })
      } else {
        this.selected = this.fuelTechGroupName
      }
    } else if (this.isRegionCompareRoute) {
      this.$router.push({ path: `/energy/${this.regionId}` })
    } else {
      this.selected = this.fuelTechGroupName
    }
  },

  methods: {
    triggerGroupChange() {
      this.$store.dispatch('fuelTechGroupName', this.selected)
    }
  }
}
</script>
