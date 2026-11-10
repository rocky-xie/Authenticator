<template>
  <div class="control-group">
    <label class="combo-label" style="margin: 20px 10px">{{ label }}</label>
    <select
      style="margin: 20px 10px"
      :value="value"
      :disabled="disabled"
      @input="$emit('input', $event.target.value)"
      @change="$emit('change')"
    >
      <slot></slot>
    </select>
  </div>
</template>
<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  props: ["label", "value", "disabled"],
});
</script>
