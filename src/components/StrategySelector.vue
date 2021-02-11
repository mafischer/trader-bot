<template>
  <div class="strategies">
    <h1>Pick an Available Strategy</h1>
    <v-form id="strat" @submit.prevent="stratCb">
      <v-select
        v-model="strategy"
        placeholder="select a strategy"
        no-data-text="no strategies available"
        :items="availableStrategies "
        label="Strategies"
        required
      >
      </v-select>
      <v-card v-if="strategy !== null">
        <v-card-title>{{strategy.name}}</v-card-title>
        <v-card-text>{{strategy.description}}</v-card-text>
        <v-card-actions>
          <v-btn type="submit" text color="light-green">Add</v-btn>
        </v-card-actions>
      </v-card>
    </v-form>
    <br>
    <h1>Active Strategies:</h1>
    <div v-for="chosen in elected" v-bind:key="chosen.id">
      <v-card>
        <v-card-title>{{chosen.name}}</v-card-title>
        <v-card-text>{{chosen.description}}</v-card-text>
        <v-card-actions>
          <v-btn color="amber" text v-on:click="pauseStrategy(chosen.id)">Pause</v-btn>
          <v-btn color="red" text v-on:click="removeStrategy(chosen.id)">Remove</v-btn>
        </v-card-actions>
      </v-card>
      <p></p>
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
  computed: {
    availableStrategies() {
      let available = [];
      if (Array.isArray(this.strategies)) {
        available = this.strategies.map((s) => ({
          text: s.name,
          value: s,
        }));
      }
      return available;
    },
  },
  methods: {
    removeStrategy(id) {
      this.$parent.removeStrategy(id);
    },
    pauseStrategy(id) {
      this.$parent.removeStrategy(id);
    },
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
