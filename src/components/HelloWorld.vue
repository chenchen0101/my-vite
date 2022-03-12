<template>
  <div>
    {{ name }}
  </div>
</template>

<script>
import { toRefs, reactive } from "vue";

export default {
  setup() {
    const state = reactive({
      name: "ccc",
    });
    return { ...toRefs(state) };
  },
};
</script>

<style>
</style>