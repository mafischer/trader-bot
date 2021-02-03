<template>
  <div>
    <h1 v-show="$store.state.credentials === null">Successfully logged out!</h1>
  </div>
</template>

<script>
export default {
  name: 'Logout',
  created() {
    this.$store.commit('updateCredentials', null);
    this.$store.commit('updateCryptr', null);
  },
};
</script>
