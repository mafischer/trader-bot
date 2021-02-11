<template>
  <div>
    <v-form v-if="$store.state.credentials === null" id="sso" @submit.prevent="loginCb">
      <v-text-field v-model="password" type="password" placeholder="Enter password"></v-text-field>
      <v-btn color="blue" text type="submit">Login</v-btn>
    </v-form>
    <v-form v-else-if="$store.state.credentials.robinhood === undefined" id="rh" @submit.prevent="robinhoodCb">
      <v-text-field v-model="ruser" label="Robinhood Userid" type="text" placeholder="Enter userid"></v-text-field>
      <v-text-field v-model="rpw" label="Robinhood Password" type="password" placeholder="Enter password"></v-text-field>
      <v-btn color="light-green" type="submit">Save Credentials</v-btn>
    </v-form>
    <v-form v-else-if="$store.state.credentials.twitter === undefined" id="rh" @submit.prevent="twitterCb">
      <v-text-field v-model="ttoken" label="Twitter Bearer Token" type="text" placeholder="Enter Token"></v-text-field>
      <v-text-field v-model="tkey" label="Twitter Consumer Key" type="text" placeholder="Enter Key"></v-text-field>
      <v-text-field v-model="tsecret" label="Twitter Consumer Secret" type="text" placeholder="Enter Secret"></v-text-field>
      <v-btn color="blue" type="submit">submit</v-btn>
    </v-form>
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
      tsecret: null,
      tkey: null,
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
        } = await login({
          filename: path.resolve(home, 'trader.db'),
          password: this.password,
          log: self.$store.log,
        });
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
      const self = this;
      const credentials = {
        ...self.$store.state.credentials,
        twitter: {
          bearer_token: self.ttoken,
          consumer_key: self.tkey,
          consumer_secret: self.tsecret,
        },
      };
      await updateCredentials(self.$store.state.db, self.$store.state.cryptr, credentials);
      self.$store.commit('updateCredentials', credentials);
    },
  },
};
</script>
