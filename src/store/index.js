import Vue from 'vue';
import Vuex from 'vuex';

Vue.use(Vuex);

export default new Vuex.Store({
  state: {
    cryptr: null,
    credentials: null,
    db: null,
    log: null,
  },
  mutations: {
    updateCredentials(state, credentials) {
      state.credentials = credentials;
    },
    updateCryptr(state, cryptr) {
      state.cryptr = cryptr;
    },
    updateDb(state, db) {
      state.db = db;
    },
    updateLog(state, log) {
      state.log = log;
    },
  },
  actions: {
  },
  modules: {
  },
});
