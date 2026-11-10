<template>
  <div class="control-group">
    <label class="combo-label">{{ label }}</label>
    <input
      class="checkbox"
      type="checkbox"
      :checked="checked"
      @change="$emit('change', $event.target.checked)"
    />
  </div>
</template>
<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  props: {
    label: String,
    checked: Boolean,
  },
  model: {
    prop: "checked",
    event: "change",
  },
});
</script>
