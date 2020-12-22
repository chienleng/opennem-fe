<template>
  <div class="panel">
    <button
      class="delete close-btn is-small"
      aria-label="delete"
      @click="handleDoneClick" />
    <div class="panel-heading">Features</div>
    <label
      class="panel-block"
      @click.stop>
      <input
        v-model="featureEmissions"
        type="checkbox" >
      Emissions Charts
    </label>

    <label class="panel-block">
      <input
        v-model="featureRegionCompare"
        type="checkbox">
      Compare Regions
    </label>

    <label
      class="panel-block"
      @click.stop>
      <input
        v-model="featureV3Paths"
        type="checkbox" >
      Use v3 paths
    </label>

    <label
      class="panel-block"
      @click.stop>
      <input
        v-model="featureMetrics"
        type="checkbox" >
      Metrics view
    </label>

    <label
      class="panel-block"
      @click.stop>
      <input
        v-model="featureAuEnergy"
        type="checkbox" >
      All Regions Energy view
    </label>
  </div>
</template>

<script>
export default {
  computed: {
    featureEmissions: {
      get: function() {
        return this.$store.getters['feature/emissions']
      },
      set: function(newValue) {
        this.$store.commit('feature/emissions', newValue)
      }
    },

    featureRegionCompare: {
      get: function() {
        return this.$store.getters['feature/regionCompare']
      },
      set: function(newValue) {
        this.$store.commit('feature/regionCompare', newValue)
      }
    },

    featureV3Paths: {
      get: function() {
        return this.$store.getters['feature/v3Paths']
      },
      set: function(newValue) {
        this.$store.commit('feature/v3Paths', newValue)
      }
    },

    featureMetrics: {
      get: function() {
        return this.$store.getters['feature/metrics']
      },
      set: function(newValue) {
        this.$store.commit('feature/metrics', newValue)
      }
    },

    featureAuEnergy: {
      get: function() {
        return this.$store.getters['feature/auEnergy']
      },
      set: function(newValue) {
        this.$store.commit('feature/auEnergy', newValue)
      }
    }
  },
  methods: {
    handleDoneClick() {
      this.$emit('done')
    }
  }
}
</script>

<style lang="scss" scoped>
@import '~/assets/scss/variables.scss';
.panel {
  background-color: #fff;
  position: relative;
  font-size: 0.9em;
  max-width: 200px;
  box-shadow: 1px 1px 2px rgba(10, 10, 10, 0.1);
  border-radius: 4px;

  &::after {
    content: '';
    transform: rotate(45deg);
    background: #fff;
    bottom: -5px;
    right: 10px;
    width: 10px;
    height: 10px;
    position: absolute;
    z-index: -1;
  }

  .panel-heading {
    background-color: #f5f5f5;
    font-size: 12px;
    font-family: $header-font-family;
  }

  .close-btn {
    position: absolute;
    right: -8px;
    top: -8px;
    border: 4px solid #f5f5f5;
    min-width: 22px;
    max-width: 22px;
    min-height: 22px;
    max-height: 22px;
    background-color: #999;
  }
}
.button.is-primary {
  border: 1px solid $opennem-link-color;
}
</style>
