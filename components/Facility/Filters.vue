<template>
  <div class="facilities-options">
    <div class="filter-bar">
      <div class="field filter-station">
        <button
          v-if="tabletBreak && !searchOn"
          class="search-button button is-rounded is-small is-dark is-inverted"
          @click="toggleSearch"
        >
          <i class="fal fa-search" />
        </button>

        <p
          v-if="!tabletBreak || (tabletBreak && searchOn)"
          class="control has-icons-left has-icons-right">
          <input
            v-model="filterFacilityName"
            class="input is-small is-rounded filter-station-input"
            type="text"
            placeholder="Filter By Station Name"
            autofill="off"
            autocomplete="off"
            autocorrect="off"
            autocapitalize="off"
            spellcheck="false"
            @keyup="handleKeyup">
          <span class="icon is-small is-left">
            <i class="fal fa-search" />
          </span>

          <button
            v-if="(filterFacilityName && !tabletBreak) || (tabletBreak && searchOn)"
            class="close-button button is-rounded is-small is-dark is-inverted"
            @click="tabletBreak ? toggleSearch() : clearFilter()"
          >
            <i class="fal fa-times" />
          </button>
        </p>
      </div>

      <div
        v-on-clickaway="onClickAway"
        v-if="!searchOn"
        :class="{'is-active': techDropdownActive}"
        class="filter-tech dropdown">
        <button
          :class="{ 'is-inverted': selectedTechGroups.length === 0 }"
          class="dropdown-trigger button is-rounded is-small is-primary"
          @click="techDropdownActive = !techDropdownActive">
          <div class="dropdown-label">
            <strong>Technology</strong>
            <strong v-if="selectedTechGroups.length > 0">({{ selectedTechGroups.length }})</strong>
          </div>
          <i class="fal fa-chevron-down" />
        </button>

        <transition name="slide-down-fade">
          <div
            v-if="techDropdownActive"
            class="dropdown-menu">
            <div class="dropdown-content">
              <div
                v-for="(d, i) in allTechs"
                :key="i"
                class="dropdown-item">
                <div class="item-group">
                  <span
                    class="expand-collapse"
                    @click="handleExpandCollapseClick(d.id)">
                    <i
                      v-if="d.fields.length > 1 && isGroupExpanded(d.id)"
                      class="fal fa-fw fa-caret-down" />
                    <i
                      v-if="d.fields.length > 1 && !isGroupExpanded(d.id)"
                      class="fal fa-fw fa-caret-right" />
                  </span>
                  <span @click="handleTechGroupClick(d)">
                    <span
                      :style="{
                        backgroundColor: isGroupSelected(d.id) ? d.colour : '#fff',
                        'border-color': d.colour
                      }"
                      class="source-colour">
                      <i
                        v-if="hasSelection(d)"
                        class="checkmark-icon fal fa-minus" />
                      <i
                        v-else
                        class="checkmark-icon fal fa-check" />
                    </span>
                    {{ d.label }}
                  </span>
                </div>

                <div
                  v-show="d.fields.length > 1 && isGroupExpanded(d.id)"
                  class="subitem-group">
                  <div
                    v-for="(field, fIndex) in d.fields"
                    :key="fIndex">
                    <span @click="handleTechClick(d, field)">
                      <span
                        :style="{
                          backgroundColor: isTechSelected(field) ? getTechColour(field) : '#fff',
                          'border-color': getTechColour(field)
                        }"
                        class="source-colour">
                        <i class="checkmark-icon fal fa-check" />
                      </span>
                      {{ getTechLabel(field) }}
                    </span>
                  </div>
                </div>
              </div>

              <div
                class="buttons"
                style="border-top: 1px solid #eee;">
                <a
                  class="button is-rounded is-small is-inverted"
                  @click="clearSelectedTechs">Clear</a>
                <a
                  class="button is-rounded is-small is-primary is-outlined"
                  @click="techDropdownActive = false">Close</a>
              </div>
            </div>
          </div>
        </transition>
      </div>

      <status-filter
        v-if="!searchOn"
        :selected-statuses="selectedStatuses"
        class="filter-status"
        @selectedStatuses="handleStatusesSelected"
      />

      <facility-view-toggle
        v-if="tabletBreak"
        :view="selectedView"
        class="facility-view-toggle"
        @viewSelect="handleViewSelect"
      />
    </div>
  </div>
</template>

<script>
import { mapGetters, mapMutations } from 'vuex'
import _debounce from 'lodash.debounce'
import _includes from 'lodash.includes'
import _cloneDeep from 'lodash.clonedeep'
import { mixin as clickaway } from 'vue-clickaway'
import EventBus from '~/plugins/eventBus'
import * as FT from '~/constants/energy-fuel-techs/group-default.js'
import {
  FacilityGroups,
  FACILITY_GROUP_BATTERY,
  FACILITY_GROUP_SOLAR
} from '~/constants/facility-fuel-tech.js'
import StatusFilter from '~/components/Facility/StatusFilter'
import FacilityViewToggle from '~/components/Facility/ViewToggle'

export default {
  components: {
    StatusFilter,
    FacilityViewToggle
  },

  mixins: [clickaway],

  props: {
    selectedView: {
      type: String,
      default: () => 'list'
    },
    selectedTechs: {
      type: Array,
      default: () => []
    },
    selectedStatuses: {
      type: Array,
      default: () => []
    }
  },

  data() {
    return {
      filterFacilityName: '',
      techDropdownActive: false,
      allTechs: [],
      groupExpanded: [],
      simplifiedGroup: _cloneDeep(FacilityGroups),
      searchOn: false
    }
  },

  computed: {
    ...mapGetters({
      tabletBreak: 'app/tabletBreak',
      facilitySelectedTechGroups: 'facility/selectedTechGroups'
    }),
    selectedTechGroups: {
      get() {
        return this.facilitySelectedTechGroups
      },
      set(value) {
        this.setSelectedTechGroups(value)
      }
    }
  },

  mounted() {
    EventBus.$on('facilities.filter.clear', this.clearFilter)

    // Filter Group
    const groups = this.simplifiedGroup.filter(
      g => (g.type === 'source' && g.id !== FT.IMPORTS) || g.id === FT.PUMPS
    )
    const findSolarGroup = groups.find(g => g.id === FACILITY_GROUP_SOLAR)
    const findBatteryGroup = groups.find(g => g.id === FACILITY_GROUP_BATTERY)

    findSolarGroup.fields = [FT.SOLAR_UTILITY] // remove 'rooftop_solar'
    findBatteryGroup.label = 'Battery' // rename battery discharging

    groups.forEach(g => {
      this.allTechs.push(g)

      g.fields.forEach(f => {
        if (
          _includes(this.selectedTechs, f) &&
          !_includes(this.selectedTechGroups, g.id)
        ) {
          this.selectedTechGroups.push(g.id)
        }
      })
    })

    // this.allTechs.reverse()
  },
  beforeDestroy() {
    EventBus.$off('facilities.filter.clear')
  },
  methods: {
    ...mapMutations({
      setSelectedTechGroups: 'facility/selectedTechGroups'
    }),
    handleKeyup() {
      this.$emit('facilityNameFilter', this.filterFacilityName)
    },
    onClickAway() {
      this.techDropdownActive = false
    },
    toggleSearch() {
      this.searchOn = !this.searchOn
      if (!this.searchOn) {
        this.filterFacilityName = ''
        this.handleKeyup()
      }
    },
    isGroupSelected(groupId) {
      return _includes(this.selectedTechGroups, groupId)
    },
    isTechSelected(techId) {
      return _includes(this.selectedTechs, techId)
    },
    isGroupExpanded(groupId) {
      return _includes(this.groupExpanded, groupId)
    },
    hasSelection(group) {
      const fieldsLength = group.fields.length
      let fieldsSelected = 0
      group.fields.forEach(f => {
        if (_includes(this.selectedTechs, f)) {
          fieldsSelected += 1
        }
      })
      return fieldsSelected !== fieldsLength
    },
    getTechLabel(techId) {
      return FT.FUEL_TECH_LABEL[techId]
    },
    getTechColour(techId) {
      return FT.DEFAULT_FUEL_TECH_COLOUR[techId]
    },

    handleTechGroupClick(group) {
      const groupId = group.id
      const isGroupIncluded = _includes(this.selectedTechGroups, groupId)
      let selected = _cloneDeep(this.selectedTechs)
      if (isGroupIncluded) {
        this.selectedTechGroups = this.selectedTechGroups.filter(
          d => d !== groupId
        )
        group.fields.forEach(f => {
          selected = selected.filter(d => d !== f)
        })
      } else {
        this.selectedTechGroups.push(groupId)
        group.fields.forEach(f => {
          selected.push(f)
        })
      }
      this.$emit('techsSelect', selected)
    },
    handleTechClick(group, techId) {
      const isIncluded = _includes(this.selectedTechs, techId)
      let selected = _cloneDeep(this.selectedTechs)
      if (isIncluded) {
        selected = selected.filter(d => d !== techId)
      } else {
        selected.push(techId)
      }

      let fieldsSelected = 0
      group.fields.forEach(f => {
        if (_includes(selected, f)) {
          fieldsSelected += 1
        }
      })

      if (fieldsSelected === 0) {
        this.selectedTechGroups = this.selectedTechGroups.filter(
          d => d !== group.id
        )
      } else if (fieldsSelected !== 0) {
        const isGroupIncluded = _includes(this.selectedTechGroups, group.id)
        if (!isGroupIncluded) {
          this.selectedTechGroups.push(group.id)
        }
      }
      this.$emit('techsSelect', selected)
    },
    handleExpandCollapseClick(groupId) {
      const isIncluded = _includes(this.groupExpanded, groupId)
      if (isIncluded) {
        this.groupExpanded = this.groupExpanded.filter(d => d !== groupId)
      } else {
        this.groupExpanded.push(groupId)
      }
    },
    clearSelectedTechs() {
      this.selectedTechGroups = []
      this.$emit('techsSelect', [])
    },
    clearFilter() {
      this.filterFacilityName = ''
      this.handleKeyup()
    },
    handleStatusesSelected(selectedStatuses) {
      this.$emit('selectedStatuses', selectedStatuses)
    },

    handleViewSelect(view) {
      this.$emit('viewSelect', view)
    }
  }
}
</script>

<style lang="scss" scoped>
@import '~/assets/scss/responsive-mixins.scss';
@import '~/assets/scss/variables.scss';

.facilities-options {
  width: 100%;
  padding: 3px 0;
}
.dropdown-label {
  font-family: $family-primary;
  margin-right: 0.5rem;
  font-size: 11px;
  strong {
    font-weight: 600;
  }
}
.dropdown-menu {
  font-family: $family-primary;
  margin-left: 0.75rem;
  margin-top: 0.1rem;
  min-width: 200px;

  .dropdown-content {
    padding: 0.3rem 0;
  }

  .dropdown-item {
    font-size: 11px;
    padding: 0.25rem 0.4rem;
    cursor: pointer;
    user-select: none;

    .item-group {
      display: flex;
    }

    .subitem-group {
      margin: 4px 0 0;
      padding: 2px 19px;
      background-color: #efefef;
      box-shadow: inset 1px 1px 4px rgba(100, 100, 100, 0.1);
      border-radius: 2px;

      div {
        padding: 2px 0;
      }
    }
  }
}
.filter-bar {
  display: flex;
  margin: 5px 0 5px 10px;
  align-items: center;

  .filter-station {
    position: relative;
    margin: 0;
  }

  .filter-station-input {
    width: 200px;

    @include tablet {
      width: 230px;
      margin-right: 10px;
    }
  }

  .filter-tech,
  .filter-status,
  .search-button {
    margin: 0 3px;
  }

  .close-button {
    position: absolute;
    top: 3.5px;
    right: 4px;
    font-size: 9.5px;
    padding: 3px 6px 2px;
    width: 20px;
    height: 20px;
    color: $opennem-link-color;
    min-width: 0;
  }

  .search-button {
    font-size: 12px;
    padding: 2px 6px;
    width: 28px;
    height: 28px;
    color: $opennem-link-color;
    min-width: 0;
  }

  .buttons {
    padding: 0.4rem 0.5rem 0.1rem;
    margin-top: 0.3rem;
    display: flex;
    justify-content: space-between;
    text-align: right;

    .button {
      font-size: 10px;
      border: 1px solid #eee;
      padding-left: 1rem;
      padding-right: 1rem;
    }
  }
}
.expand-collapse {
  font-size: 13px;
  display: block;
  width: 19px;
  height: 15px;
  position: relative;
}
.source-colour {
  width: 15px;
  height: 15px;
  background-color: rgba(255, 255, 255, 0.8);
  display: inline-block;
  vertical-align: text-bottom;
  margin-right: 0.4rem;
  position: relative;
  top: 1px;
  border: 1px solid #000;
  border-radius: 1px;

  .checkmark-icon {
    position: relative;
    left: 2px;
    bottom: 1px;
    color: #fff;
  }
}
.control {
  &.has-icons-left {
    .icon.is-small {
      font-size: 13px;
    }
  }
  &.has-icons-right {
    .input {
      margin-right: 0;
      padding-right: 2.25em;
      font-size: 12px;
    }
  }
}

.facility-view-toggle {
  position: absolute;
  right: 1rem;
  top: 0px;
}
</style>
