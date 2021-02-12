<template>
  <div class="logs">
    <v-data-table
      :headers="headers"
      :items="logs"
      class="elevation-1"
    >
    </v-data-table>
  </div>
</template>

<script>
// @ is an alias for src directory
import readline from 'readline';
import fs from 'fs';
import path from 'path';
import { DateTime } from 'luxon';

export default {
  name: 'Logs',
  methods: {
    fetchLogs() {
      const self = this;
      self.logs = [];
      const readInterface = readline.createInterface({
        input: fs.createReadStream(path.resolve(self.$store.state.home, `info-${DateTime.local().toFormat('yyyy-MM-dd')}.log`)),
        output: process.stdout,
        console: false,
      });
      readInterface.on('line', (line) => {
        self.logs.push(JSON.parse(line));
      });
    },
  },
  data() {
    return {
      logInterval: null,
      logs: [],
      headers: [{
        text: 'Level',
        align: 'start',
        value: 'level',
      },
      {
        text: 'Timestamp',
        value: 'timestamp',
      },
      {
        text: 'Message',
        value: 'message',
      }],
    };
  },
  created() {
    const self = this;
    self.fetchLogs();
    self.logInterval = setInterval(() => {
      self.fetchLogs();
      console.log('fetching');
    }, 5000);
  },
  beforeDestroy() {
    if (this.logInterval) {
      clearInterval(this.logInterval);
    }
  },
};
</script>
