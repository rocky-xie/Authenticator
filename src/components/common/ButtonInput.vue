<template>
  <button
    :class="{ 'button-small': type === 'small', button: !type }"
    v-on="$listeners"
  >
    <slot></slot>
  </button>
</template>
<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  props: ["type"],
});
</script>
