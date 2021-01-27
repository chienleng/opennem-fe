<template>
  <div class="select is-rounded">
    <select
      v-if="options.length > 0"
      v-model="selected">
      <option
        v-for="(d, i) in options"
        :key="`option-${i}`"
      >
        {{ d.label }}
      </option>
    </select>
  </div>
</template>

<script>
export default {
  props: {
    options: {
      type: Array,
      default: () => []
    }
  },

  data() {
    return {
      selected: null
    }
  },

  watch: {
    selected(val) {
      this.$emit('change', val)
    }
  },

  created() {
    this.selected = this.options.length > 0 ? this.options[0].label : ''
  }
}
</script>

<style lang="scss" scoped>
.select {
  width: 100%;
  margin-bottom: 1rem;
  select {
    display: block;
    width: 100%;
  }
}
</style>
