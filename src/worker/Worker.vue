<template>
  <div id="irrelevant">
    <p>Nothing going on here</p>
  </div>
</template>

<script>
import { ipcRenderer, remote } from 'electron';
import { main, gracefulShutdown } from '../lib/trader';

function quit() {
  ipcRenderer.send('quit');
}

const { app } = remote;
const internal = {
  home: app.getAppPath('userData'),
  log: (log) => {
    ipcRenderer.send('worker-log', log);
  },
  quit,
};

ipcRenderer.on('login', async (event, creds) => {
  internal.credentials = creds;
  console.log('received login event');
  main(internal);
});

ipcRenderer.on('credentials-update', (event, creds) => {
  internal.credentials = creds;
});

ipcRenderer.on('quit', async () => {
  await gracefulShutdown();
});

export default {
  data() {
    return {

    };
  },
};

</script>
