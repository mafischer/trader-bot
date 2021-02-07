<template>
  <div class="home">
    <StrategySelector :strategies='strategies'/>
  </div>
</template>

<script>
// @ is an alias to /src
import StrategySelector from '@/components/StrategySelector.vue';
import { remote } from 'electron';
import path from 'path';
import { openDb } from '../lib/db';

const { app } = remote;
const home = app.getAppPath('userData');
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
    };
  },
  async mounted() {
    if (db === null) {
      db = await openDb(path.resolve(home, 'trader.db'));
    }
    this.strategies = await db.all(`
      SELECT * FROM strategies;
    `);
  },
  created() {
    if (this.$store.state.credentials === null) {
      this.$router.push('/login');
    }
  },
};
</script>
