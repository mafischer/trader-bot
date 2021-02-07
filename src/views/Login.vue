<template>
  <div>
    <form v-if="$store.state.credentials === null" id="sso" @submit.prevent="loginCb">
      <label for="password">Password</label>
      <input v-model="password" type="password" placeholder="Enter password"/>
      <button type="submit">submit</button>
      <button>Logout</button>
    </form>
    <form v-else-if="$store.state.credentials.robinhood === undefined" id="rh" @submit.prevent="robinhoodCb">
      <label for="ruser">Robinhood Userid</label>
      <input v-model="ruser" type="text" placeholder="Enter Userid"/>
      <br>
      <label for="rpw">Robinhood Password</label>
      <input v-model="rpw" type="password" placeholder="Enter password"/>
      <button type="submit">Login</button>
    </form>
    <form v-else-if="$store.state.credentials.twitter === undefined" id="rh" @submit.prevent="twitterCb">
      <p>{{ $store.state.credentials.twitter }}</p>
      <label for="ttoken">Twitter Bearer Token</label>
      <input v-model="ttoken" type="text" placeholder="Enter Token"/>
      <button type="submit">submit</button>
    </form>
  </div>
</template>

<script>
import { remote, ipcRenderer } from 'electron';
import path from 'path';
import prompt from 'electron-prompt';
import {
  login,
  robinhood,
  updateCredentials,
  missingCredentials,
} from '../lib/login';

const { app, dialog } = remote;
const home = app.getAppPath('userData');
const browserWindow = remote.getCurrentWindow();

ipcRenderer.on('worker-log', async (event, log) => {
  console.log(log);
});

// import { openDb } from '../util/db';

export default {
  name: 'Login',
  data() {
    return {
      password: null,
      rpw: null,
      ruser: null,
      rh: null,
      ttoken: null,
      home,
    };
  },
  updated() {
    this.$nextTick(async () => {
      // Code that will run only after the
      // entire view has been re-rendered
      if (this.$store.state.credentials) {
        const missing = await missingCredentials(this.$store.state.credentials);
        if (missing.length === 0) {
          this.$router.push('/');
        }
      }
    });
  },
  methods: {
    async loginCb() {
      // eslint-disable-next-line func-names
      const self = this;
      try {
        const {
          credentials,
          cryptr,
          db,
          missing,
        } = await login(path.resolve(home, 'trader.db'), this.password);
        self.$store.commit('updateCredentials', credentials);
        self.$store.commit('updateCryptr', cryptr);
        self.$store.commit('updateDb', db);
        if (missing.length > 0) {
          dialog.showMessageBoxSync({
            type: 'info',
            message: `The following credentials are missing:\n${JSON.stringify(missing)}`,
            title: 'Missing Credentials',
          });
        } else {
          // dialog.showMessageBoxSync({
          //   type: 'info',
          //   message: 'All services successfully logged in!',
          //   title: 'Logged In',
          // });
          ipcRenderer.send('login', credentials);
          // redirect to home
          this.$router.push({ path: '/' });
        }
      } catch (err) {
        this.password = null;
        dialog.showErrorBox('Login Failed', err.message);
      }
    },
    async robinhoodCb() {
      const self = this;
      try {
        const { rh, data } = await robinhood(this.ruser, this.rpw);
        if (data && data.mfa_required) {
          // prompt for mfa
          const mfaCode = await prompt({
            title: 'MFA Code',
            label: 'MFA Code',
            inputAttrs: {
              type: 'number',
            },
            type: 'input',
          }, browserWindow);
          if (mfaCode !== null) {
            rh.set_mfa_code(mfaCode, async () => {
              const token = rh.auth_token();
              const credentials = {
                ...self.$store.credentials,
                robinhood: {
                  token,
                },
              };
              await updateCredentials(self.$store.state.db, self.$store.state.cryptr, credentials);
              self.$store.commit('updateCredentials', credentials);
            });
          }
        } else {
          console.log('multi-factor auth is not required');
          const token = rh.auth_token();
          self.$store.commit('updateCredentials', {
            ...self.$store.credentials,
            robinhood: {
              token,
            },
          });
        }
      } catch (err) {
        self.rpw = null;
        self.ruser = null;
        console.log(err);
        dialog.showErrorBox('Login Failed', err.message);
      }
    },
    async twitterCb() {
      await updateCredentials(this.$store.state.db, this.$store.state.cryptr, {
        ...this.$store.state.credentials,
        twitter: this.ttoken,
      });
    },
  },
};
</script>
