<template>
  <div class="home">
    <HelloWorld/>
    <!-- portfolio chart -->
  </div>
</template>

<script>
// @ is an alias for src directory
import HelloWorld from '@/components/HelloWorld.vue';

export default {
  name: 'Home',
  components: {
    HelloWorld,
  },
};
</script>
