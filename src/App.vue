<template>
  <div>
    {{ title }}
    <HelloWorld />
  </div>
</template>

<script>
import { toRefs, reactive } from "vue";
import HelloWorld from "./components/HelloWorld.vue";
// import { reactive } from "@vue/reactivity";
export default {
  components: { HelloWorld },
  setup() {
    const state = reactive({
      title: "hello",
    });
    return { ...toRefs(state) };
  },
};
</script>

<style>
</style>