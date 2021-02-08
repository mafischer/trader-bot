<template>
  <div class="strategies">
    <h1>Pick an Available Strategy</h1>
    <form id="strat" @submit.prevent="stratCb">
      <label>Strategies</label>
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
    </form>
    <br>
    <h1>Active Strategies:</h1>
    <div v-for="chosen in elected" v-bind:key="chosen.id">
      <span>{{chosen.name}}</span>
      <p>{{chosen.description}}</p>
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
  methods: {
    stratCb() {
      if (this.elected.indexOf(this.strategy) === -1) {
        this.elected.push(this.strategy);
        this.strategy = null;
      }
      this.$parent.updateStrategies(this.elected);
    },
  },
  props: {
    strategies: Array,
    elected: Array,
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
