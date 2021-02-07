<template>
  <div class="strategies">
    <p>Pick a Strategy</p>
    <label>Strategy</label>
    <select v-model="strategy">
      <option value=null disabled selected>select a strategy</option>
      <option v-for="strategy in strategies" :value="strategy" v-bind:key="strategy.id">{{strategy.name}}</option>
    </select>
    <div v-if="strategy !== null">
      <span>Description:</span>
      <br>
      <p>{{strategy.description}}</p>
      <button>Continue</button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'StrategySelector',
  data() {
    return {
      strategy: null,
    };
  },
  props: {
    strategies: Array,
  },
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">
h3 {
  margin: 40px 0 0;
}
ul {
  list-style-type: none;
  padding: 0;
}
li {
  display: inline-block;
  margin: 0 10px;
}
a {
  color: #42b983;
}
</style>
