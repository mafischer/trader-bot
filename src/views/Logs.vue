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
      let count = 0;
      const self = this;
      if (self.logFile !== `info-${DateTime.local().toFormat('yyyy-MM-dd')}.log`) {
        self.logFile = `info-${DateTime.local().toFormat('yyyy-MM-dd')}.log`;
        self.logs = [];
      }
      const readInterface = readline.createInterface({
        input: fs.createReadStream(path.resolve(self.$store.state.home, `info-${DateTime.local().toFormat('yyyy-MM-dd')}.log`)),
        output: process.stdout,
        console: false,
      });
      readInterface.on('line', (line) => {
        count += 1;
        if (self.logs.length < count) {
          self.logs.push(JSON.parse(line));
        }
      });
    },
  },
  data() {
    return {
      logInterval: null,
      logs: [],
      logFile: null,
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
    self.logFile = `info-${DateTime.local().toFormat('yyyy-MM-dd')}.log`;
    self.fetchLogs();
    self.logInterval = setInterval(() => {
      self.fetchLogs();
    }, 5000);
  },
  beforeDestroy() {
    if (this.logInterval) {
      clearInterval(this.logInterval);
    }
  },
};
</script>
