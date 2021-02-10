<template>
  <v-app id="inspire">
    <v-navigation-drawer
      v-model="drawer"
      app
    >
      <v-list>
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
      </v-list>
    </v-navigation-drawer>

    <v-app-bar
      app
      color="primary"
      dark
    >
      <v-app-bar-nav-icon @click="drawer = !drawer"></v-app-bar-nav-icon>

      <v-toolbar-title>Home</v-toolbar-title>
    </v-app-bar>

    <v-main>
      <div id="nav">
        <router-link to="/">Home</router-link> |
        <router-link to="/strategies">Strategies</router-link> |
        <router-link v-if="$store.state.credentials === null" to="/login">Login</router-link>
        <router-link v-else to="/logout">Logout</router-link>
      </div>
      <router-view/>
      <!-- <HelloWorld/> -->
    </v-main>
  </v-app>
</template>

<script>
// import HelloWorld from './components/HelloWorld.vue';

export default {
  name: 'App',

  components: {
    // HelloWorld,
  },

  data: () => ({
    drawer: null,
    links: [
      ['mdi-home', 'Home', '/'],
      ['mdi-sigma', 'Strategies', '/strategies'],
      ['mdi-login', 'Login', '/login'],
      ['mdi-logout', 'Logout', '/logout'],
    ],
  }),
};
</script>
