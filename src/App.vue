<template>
  <ClickSpark>
    <router-view />
  </ClickSpark>
</template>
<script>
import ClickSpark from './components/ClickSpark/ClickSpark.vue'
import Prism from "./components/Prism/Prism.vue";
import {defineComponent} from "vue";

export default defineComponent({
  components: {Prism, ClickSpark}
})

</script>
<style>
/* Global styles can also go here or in style.css */
html, body {
  margin: 0;
  padding: 0;
  height: 100%;
  overflow: hidden;   /* 禁止滚动条 */
}
</style>
