<template>
  <div class="home">
    <StrategySelector :strategies='strategies' :elected='elected'/>
  </div>
</template>

<script>
// @ is an alias to /src
import StrategySelector from '@/components/StrategySelector.vue';
import { remote } from 'electron';
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
    };
  },
  methods: {
    async removeStrategy(id) {
      await db.run(`
        DELETE FROM elected_strategies
        WHERE id = $id;
      `, { $id: id });
      await this.updateStrategies();
    },
    async updateStrategies(chosen) {
      const self = this;
      if (Array.isArray(chosen)) {
        Promise.all(chosen.map((strategy) => (async () => {
          db.run(`
            INSERT INTO elected_strategies (id)
            VALUES ($id)
            ON CONFLICT(id) DO UPDATE
            SET updated_at = CURRENT_TIMESTAMP;
          `, { $id: strategy.id });
        })()));
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
          SELECT s.*, es.updated_at FROM elected_strategies es
          JOIN strategies s
          ON es.id = s.id;
        `),
      ]);
      self.strategies = strategies;
      self.elected = elected;
    },
  },
  async mounted() {
    if (db === null) {
      db = await openDb(path.resolve(home, 'trader.db'));
    }
    await this.updateStrategies(this.elected);
  },
  created() {
    if (this.$store.state.credentials === null) {
      this.$router.push('/login');
    }
  },
};
</script>
