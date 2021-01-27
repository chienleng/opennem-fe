<template>
  <section>
    <div
      v-for="domain in xDomains"
      :key="domain.id"
      class="row">
      <span class="row-label">
        {{ domain.label }}
      </span>

      <div class="row-bar-wrapper">
        <div
          :style="{
            'width': `${getWidth(domain.id)}px`,
            'background-color': domain.colour,
            'opacity': getOpacity(domain.id)
          }"
          class="row-bar" />

        <div class="contribution">
          {{ getContribution(domain.id) | percentageFormatNumber }}
        </div>
      </div>

    </div>
  </section>
</template>

<script>
import { scaleLinear as d3ScaleLinear } from 'd3-scale'
import { max as d3Max } from 'd3-array'
import _debounce from 'lodash.debounce'

export default {
  props: {
    barWidth: {
      type: Number,
      default: () => 100
    },
    domains: {
      type: Array,
      default: () => []
    },
    dataset: {
      type: Array,
      default: () => []
    },
    hoverData: {
      type: Object,
      default: () => null
    },
    hoverOn: {
      type: Boolean,
      default: () => false
    },
    focusData: {
      type: Object,
      default: () => null
    },
    focusOn: {
      type: Boolean,
      default: () => false
    },
    highlightDomain: {
      type: String,
      default: null
    }
  },

  data() {
    return {
      x: null,
      xDomains: []
    }
  },

  computed: {
    barDataset() {
      const domains = this.xDomains
      const dataset = this.dataset

      if (this.hoverOn && this.hoverData) {
        return domains.map(domain => {
          const id = domain.id
          return {
            name: id,
            value: this.hoverData[id]
          }
        })
      } else if (this.focusOn && this.focusData) {
        return domains.map(domain => {
          const id = domain.id
          return {
            name: id,
            value: this.focusData[id]
          }
        })
      }

      return domains.map(domain => {
        const id = domain.id
        return {
          name: id,
          value: dataset.reduce((a, b) => a + (b[id] || 0), 0)
        }
      })
    },

    total() {
      return this.barDataset.reduce((a, b) => a + b.value, 0)
    }
  },

  watch: {
    domains(d) {
      this.xDomains = this.domains.slice(0)
    },
    total(d) {
      this.x.domain([0, d])
    },
    barWidth(d) {
      this.x.range([0, this.barWidth])
      this.xDomains = this.domains.slice(0)
    }
  },

  mounted() {
    this.x = d3ScaleLinear().range([0, this.barWidth])
    this.xDomains = this.domains.slice(0)
  },

  methods: {
    getWidth(id) {
      const find = this.barDataset.find(d => d.name === id)
      if (find) {
        this.x.domain([0, this.total])
        return this.x(find.value)
      }
      return 0
    },
    getContribution(id) {
      const find = this.barDataset.find(d => d.name === id)
      if (find) {
        return (find.value / this.total) * 100
      }
      return 0
    },
    getOpacity(domain) {
      if (
        this.highlightDomain === '' ||
        !this.highlightDomain ||
        this.highlightDomain === domain
      ) {
        return 1
      }
      return 0.2
    }
  }
}
</script>

<style lang="scss" scoped>
.row {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 2px 0;
  border-bottom: 1px solid #ddd;

  .row-label {
    font-size: 0.7em;
    font-weight: 600;
    text-align: right;
    width: 45%;
  }
  .row-bar-wrapper {
    width: 45%;
    margin-left: 1rem;
    display: flex;
    align-items: center;
  }
  .contribution {
    // width: 10%;
    font-size: 0.7em;
    margin-left: 0.25rem;
  }
  .row-bar {
    width: 1px;
    height: 15px;
    background-color: red;
  }
}
</style>
