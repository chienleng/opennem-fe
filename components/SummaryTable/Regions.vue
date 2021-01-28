<template>
  <div class="regions-table">
    <table class="table is-narrow is-fullwidth">
      <thead>
        <tr>
          <th>Region</th>
          <th>Energy</th>
          <th>Contribution</th>
          <th>Av.Value</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="(region, regionIndex) in domainRegions"
          :key="`region-${regionIndex}`">
          <td>
            <span
              :style="{ 'background-color': region.colour }"
              class="colour-square"
            />
            {{ region.label }}
          </td>
          <td>x</td>
          <td>x</td>
          <td>x</td>
        </tr>
      </tbody>
    </table>

  </div>
</template>

<script>
import { mapGetters } from 'vuex'

export default {
  props: {},

  data() {
    return {}
  },

  computed: {
    ...mapGetters({
      domainRegions: 'regionEnergy/domainRegions',
      datasetRegions: 'regionEnergy/datasetRegions'
    })
  },

  mounted() {},

  methods: {}
}
</script>

<style lang="scss" scoped>
.colour-square {
  display: inline-block;
  border: 1px solid transparent;
  width: 15px;
  height: 15px;
  border-radius: 1px;
  position: relative;
  top: 1px;
}
.regions-table {
  td,
  th {
    background: transparent;
  }
}
</style>
