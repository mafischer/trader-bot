<template>
  <div class="home">
    <!-- portfolio chart -->
  </div>
</template>

<script>

export default {
  name: 'Home',
  created() {
    if (this.$store.state.credentials === null) {
      this.$router.push('/login');
    }
  },
};
</script>
