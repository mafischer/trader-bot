<template>
  <div id="irrelevant">
    <p>Pay no attention to the man behind the curtain.</p>
  </div>
</template>

<script>
import { ipcRenderer, remote } from 'electron';
import { main, gracefulShutdown, strategyAction } from '../lib/trader';

const { app } = remote;
const internal = {
  home: app.getPath('userData'),
  log: (log) => {
    ipcRenderer.send('worker-log', log);
  },
};

ipcRenderer.on('strategy', async (event, { strategy, action }) => {
  strategyAction({
    strategy,
    action,
  });
});

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
  ipcRenderer.send('exit');
});

export default {
  data() {
    return {

    };
  },
};

</script>
