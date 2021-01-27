<template>
  <div
    :class="{ 'is-active': dropdownActive }"
    class="dropdown">
    <a
      v-on-clickaway="handleClickAway"
      class="dropdown-trigger"
      @click="handleClick"
    >
      <span>
        <strong>{{ viewLabel }}</strong>
        <i class="fal fa-chevron-down" />
      </span>
    </a>

    <transition name="slide-down-fade">
      <div
        v-if="dropdownActive"
        class="dropdown-menu">
        <div class="dropdown-content">
          <nuxt-link
            v-for="view in views"
            v-show="showLink(view.id)"
            :key="view.id"
            :to="`/${view.id}/${regionId}/`"
            class="dropdown-item"
            @click.native="handleViewClick(view.id)"
          >
            {{ view.label }}
          </nuxt-link>
        </div>
      </div>
    </transition>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import { mixin as clickaway } from 'vue-clickaway'
import VIEWS from '~/constants/views.js'

export default {
  mixins: [clickaway],

  data() {
    return {
      dropdownActive: false,
      views: VIEWS
    }
  },

  computed: {
    ...mapGetters({
      featureAuEnergy: 'feature/auEnergy'
    }),
    regionId() {
      return this.$route.params.region
    },
    currentView() {
      return this.$store.getters.currentView
    },
    viewLabel() {
      const view = this.views.find(d => d.id === this.currentView)
      return view ? view.label : ''
    }
  },

  created() {
    if (this.featureMetrics) {
      this.views = VIEWS
    }
  },

  methods: {
    handleClick() {
      this.dropdownActive = !this.dropdownActive
    },
    handleViewClick(view) {
      this.$store.dispatch('currentView', view)
    },
    handleClickAway() {
      this.dropdownActive = false
    },
    showLink(view) {
      if (this.featureAuEnergy) {
        return true
      }
      if (this.regionId === 'au' && view === 'energy') {
        return false
      }
      return true
    }
  }
}
</script>
<style lang="scss" scoped>
.dropdown-menu {
  display: block;
}
</style>
