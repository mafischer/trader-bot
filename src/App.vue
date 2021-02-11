<template>
  <v-app id="inspire">
    <v-navigation-drawer
      v-model="drawer"
      color="light-green lighten-5"
      app
    >
      <v-list v-if="!loggedIn">
        <v-list-item to="/login">
          <v-list-item-icon>
            <v-icon>mdi-login</v-icon>
          </v-list-item-icon>

          <v-list-item-content>
            <v-list-item-title>Login</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
      </v-list>
      <v-list v-else>
        <v-list-item
          v-for="[icon, text, href] in links"
          :key="icon"
          link
          :to="href"
        >
          <v-list-item-icon>
            <v-icon>{{ icon }}</v-icon>
          </v-list-item-icon>

          <v-list-item-content>
            <v-list-item-title>{{ text }}</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
        <v-list-item to="/logout">
          <v-list-item-icon>
            <v-icon>mdi-logout</v-icon>
          </v-list-item-icon>

          <v-list-item-content>
            <v-list-item-title>Logout</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
      </v-list>
    </v-navigation-drawer>

    <v-app-bar
      app
      color="light-green"
      dark
    >
      <v-app-bar-nav-icon @click="drawer = !drawer"></v-app-bar-nav-icon>

      <v-toolbar-title>{{ $route.name }}</v-toolbar-title>
    </v-app-bar>

    <v-main>
      <router-view/>
    </v-main>
  </v-app>
</template>

<script>
import { remote, ipcRenderer } from 'electron';
import getLogger from './logger';

const { app } = remote;
const home = app.getAppPath('userData');
const logger = getLogger(home);

ipcRenderer.on('worker-log', async (event, { level, log }) => {
  logger.log(level, log);
});

export default {
  name: 'App',
  created() {
    // store log function in vuex
    this.$store.commit('updateLog', logger.log);
    if (!this.loggedIn) {
      this.$router.push('/login');
    }
  },
  computed: {
    loggedIn() {
      const { credentials } = this.$store.state;
      return credentials !== null
        && Object.prototype.hasOwnProperty.call(credentials, 'robinhood')
        && Object.prototype.hasOwnProperty.call(credentials, 'twitter');
    },
  },
  data: () => ({
    drawer: null,
    links: [
      ['mdi-home', 'Home', '/'],
      ['mdi-sigma', 'Strategies', '/strategies'],
    ],
  }),
};
</script>
