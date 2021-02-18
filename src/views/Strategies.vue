<template>
  <div class="home">
    <StrategySelector :strategies='strategies' :elected='elected'/>
  </div>
</template>

<script>
// @ is an alias to /src
import StrategySelector from '@/components/StrategySelector.vue';
import { remote, ipcRenderer } from 'electron';
import path from 'path';
import { openDb } from '../lib/db';

const { app } = remote;
const home = app.getPath('userData');
let db = null;

export default {
  name: 'Home',
  components: {
    StrategySelector,
  },
  data() {
    return {
      db: null,
      strategies: null,
      elected: null,
      accounts: null,
    };
  },
  methods: {
    async addStrategy(strategy) {
      await this.updateStrategies([strategy]);
      ipcRenderer.send('strategy', {
        action: 'add',
        strategy,
      });
    },
    async pauseStrategy(strategy) {
      await db.run(`
        UPDATE elected_strategies
        set active = 0
        where id = $id;
      `, { $id: strategy.id });
      await this.updateStrategies();
      ipcRenderer.send('strategy', {
        action: 'pause',
        strategy,
      });
    },
    async resumeStrategy(strategy) {
      await db.run(`
        UPDATE elected_strategies
        set active = 1
        where id = $id;
      `, { $id: strategy.id });
      await this.updateStrategies();
      ipcRenderer.send('strategy', {
        action: 'resume',
        strategy,
      });
    },
    async removeStrategy(strategy) {
      await db.run(`
        DELETE FROM elected_strategies
        WHERE id = $id;
      `, { $id: strategy.id });
      await this.updateStrategies();
      ipcRenderer.send('strategy', {
        action: 'remove',
        strategy,
      });
    },
    async updateStrategies(chosen) {
      const self = this;
      if (Array.isArray(chosen)) {
        Promise.all(chosen.map((strat) => {
          const strategy = {
            id: strat.id,
            active: strat.active,
            allocation: strat.accounts.reduce((cap, account) => (cap + account.allocation), 0),
            allocations: strat.accounts.reduce((acc, curr) => {
              acc.push({
                id: curr.id,
                broker: curr.broker,
                allocation: curr.allocation,
              });
              return acc;
            }, []),
          };
          return (async () => {
            db.run(`
              INSERT INTO elected_strategies (id, active, allocation, allocations)
              VALUES ($id, $active, $allocation, $allocations)
              ON CONFLICT(id) DO UPDATE
              SET active = $active, allocation = $allocation, allocations = $allocations, updated_at = CURRENT_TIMESTAMP;
            `, {
              $id: strategy.id,
              $active: strategy.active,
              $allocation: strategy.allocation,
              $allocations: JSON.stringify(strategy.allocations),
            });
          })();
        }));
      }
      const [strategies, elected] = await Promise.all([
        db.all(`
          SELECT s.* FROM strategies s
          LEFT JOIN elected_strategies es
          on s.id = es.id
          where es.id is null;
          ;
        `),
        db.all(`
          SELECT s.*, es.active, es.allocation, es.allocations, es.updated_at FROM elected_strategies es
          JOIN strategies s
          ON es.id = s.id;
        `),
      ]);
      self.strategies = strategies;
      self.elected = elected.map((a) => ({
        ...a,
        allocations: JSON.parse(a.allocations),
      }));
    },
  },
  async mounted() {
    const self = this;
    if (db === null) {
      db = await openDb(path.resolve(home, 'trader.db'));
    }
    await this.updateStrategies(self.elected);
  },
  created() {
    if (this.$store.state.credentials === null) {
      this.$router.push('/login');
    }
  },
};
</script>
