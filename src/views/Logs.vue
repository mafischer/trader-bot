<template>
  <div class="logs">
    <div v-for="(log, index) in logs" :key="index">
      <div v-if="log.level === 'info'">
        <span class="font-weight-bold">{{log.timestamp}}:  </span>
        <span class="green--text">{{log.message}}</span>
      </div>
      <div v-else-if="log.level === 'error'">
        <span class="font-weight-bold">{{log.timestamp}}:  </span>
        <span class="red--text font-italic">{{log.message}}</span>
      </div>
      <div v-else>
        <span class="font-weight-bold">{{log.timestamp}}:  </span>
        <span class="blue--text">{{log.message}}</span>
      </div>
    </div>
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
  data() {
    return {
      logs: null,
    };
  },
  mounted() {
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
};
</script>
