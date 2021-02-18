<template>
  <div class="strategies">
    <h1>Pick an Available Strategy</h1>
    <v-form id="strat" @submit.prevent="stratCb">
      <v-select
        v-model="strategy"
        placeholder="select a strategy"
        no-data-text="no strategies available"
        :items="availableStrategies"
        label="Strategies"
        required
      >
      </v-select>
      <v-card v-if="strategy !== null">
        <v-card-title>{{strategy.name}}</v-card-title>
        <v-card-subtitle >About</v-card-subtitle>
        <v-card-text>{{strategy.description}}</v-card-text>
        <v-divider  v-if="allocatedAccounts.length > 0" class="mx-4"></v-divider>
        <v-card-subtitle v-if="allocatedAccounts.length > 0">Allocated Assets - ${{allocatedCapital}}</v-card-subtitle>
        <v-chip-group v-if="allocatedAccounts.length > 0">
          <v-chip
            v-for="account in allocatedAccounts"
            :key="account.id"
            class="ma-2"
            close
            text-color="light-green"
            column
            @click:close="account.selected = false"
          >
            {{`${account.broker}: ${account.id} - $${account.allocation}`}}
          </v-chip>
        </v-chip-group>
        <v-divider class="mx-4"></v-divider>
        <v-card-subtitle>Available Accounts</v-card-subtitle>
        <v-card-text>
          <div v-for="(account, key, index) in strategy.accounts" :key="index">
            <v-checkbox
              :label="`${account.broker}: ${account.id} - Cash Assets: $${Math.floor(account.portfolio_cash)}`"
              v-model="account.selected"
            >
            </v-checkbox>
            <v-slider
              v-model="account.allocation"
              color="blue"
              track-color="grey"
              always-dirty
              min="0"
              :max="Math.floor(account.portfolio_cash)"
              :label="`Capital Allocation - $${account.allocation}`"
            >
            </v-slider>
          </div>
        </v-card-text>
        <v-card-actions>
          <v-btn :disabled="allocatedCapital <= 0" type="submit" text color="light-green">Add</v-btn>
        </v-card-actions>
      </v-card>
    </v-form>
    <br>
    <h1>Active Strategies:</h1>
    <div v-for="chosen in active" v-bind:key="chosen.id">
      <v-card>
        <v-card-title>{{chosen.name}}</v-card-title>
        <v-card-subtitle >About</v-card-subtitle>
        <v-card-text>{{chosen.description}}</v-card-text>
        <v-divider class="mx-4"></v-divider>
        <v-card-subtitle >Allocated Assets - ${{chosen.allocation}}</v-card-subtitle>
        <v-chip-group v-if="chosen.allocations && chosen.allocations.length > 0">
          <v-chip
            v-for="account in chosen.allocations"
            :key="account.id"
            class="ma-2"
            text-color="light-green"
            column
          >
            {{`${account.broker}: ${account.id} - $${account.allocation}`}}
          </v-chip>
        </v-chip-group>
        <v-divider class="mx-4"></v-divider>
        <v-card-actions>
          <v-btn color="amber" text v-on:click="pauseStrategy(chosen)">Pause</v-btn>
          <v-btn color="red" text v-on:click="removeStrategy(chosen)">Remove</v-btn>
        </v-card-actions>
      </v-card>
    </div>
    <h1>Paused Strategies:</h1>
    <div v-for="chosen in paused" v-bind:key="chosen.id">
      <v-card>
        <v-card-title>{{chosen.name}}</v-card-title>
        <v-card-subtitle >About</v-card-subtitle>
        <v-card-text>{{chosen.description}}</v-card-text>
        <v-divider class="mx-4"></v-divider>
        <v-card-subtitle >Allocated Assets - ${{chosen.allocation}}</v-card-subtitle>
        <v-chip-group v-if="chosen.allocations && chosen.allocations.length > 0">
          <v-chip
            v-for="account in chosen.allocations"
            :key="account.id"
            class="ma-2"
            text-color="light-green"
            column
          >
            {{`${account.broker}: ${account.id} - $${account.allocation}`}}
          </v-chip>
        </v-chip-group>
        <v-divider class="mx-4"></v-divider>
        <v-card-actions>
          <v-btn color="light-green" text v-on:click="resumeStrategy(chosen)">Resume</v-btn>
          <v-btn color="red" text v-on:click="removeStrategy(chosen)">Remove</v-btn>
        </v-card-actions>
      </v-card>
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
    allocatedAccounts() {
      let accounts = [];
      if (this.strategy) {
        accounts = this.strategy.accounts.filter((account) => (account.selected));
      }
      return accounts;
    },
    allocatedCapital() {
      let capital = 0;
      if (this.strategy) {
        capital = this.strategy.accounts.reduce((cap, account) => (cap + account.allocation), capital);
      }
      return capital;
    },
    availableStrategies() {
      let available = [];
      let accounts = [];
      if (Array.isArray(this.$store.state.accounts)) {
        accounts = this.$store.state.accounts;
      }
      if (Array.isArray(this.strategies)) {
        available = this.strategies.map((s) => ({
          text: s.name,
          value: {
            ...s,
            accounts: accounts.map((act) => ({
              ...act,
              selected: false,
              allocation: 0,
            })),
          },
        }));
      }
      return available;
    },
    active() {
      if (Array.isArray(this.elected)) {
        return this.elected.filter((e) => (e.active === 1));
      }
      return [];
    },
    paused() {
      if (Array.isArray(this.elected)) {
        return this.elected.filter((e) => (e.active === 0));
      }
      return [];
    },
  },
  methods: {
    removeStrategy(strategy) {
      this.$parent.removeStrategy(strategy);
    },
    pauseStrategy(strategy) {
      this.$parent.pauseStrategy(strategy);
    },
    resumeStrategy(strategy) {
      this.$parent.resumeStrategy(strategy);
    },
    stratCb() {
      const electee = {
        ...this.strategy,
        // active by default
        active: 1,
      };
      if (this.active.indexOf(this.strategy) === -1) {
        this.elected.push(electee);
        this.strategy = null;
      }
      this.$parent.addStrategy(electee);
    },
  },
  props: {
    strategies: Array,
    elected: Array,
  },
};
</script>
