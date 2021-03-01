import Vue from 'vue';
import Vuex from 'vuex';
import equal from 'deep-equal';

Vue.use(Vuex);

export default new Vuex.Store({
  state: {
    cryptr: null,
    credentials: null,
    db: null,
    log: null,
    home: null,
    brokers: {},
    accounts: [],
    positions: [],
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
    updateHome(state, home) {
      state.home = home;
    },
    updateAccounts(state, accounts) {
      if (!equal(state.accounts, accounts)) {
        state.accounts = accounts;
      }
    },
    updatePositions(state, positions) {
      if (!equal(state.postions, positions)) {
        state.positions = positions;
      }
    },
    addBroker(state, broker) {
      const brokers = {
        ...state.brokers,
      };
      brokers[broker.name] = broker.broker;
      state.brokers = brokers;
    },
  },
  actions: {
  },
  modules: {
  },
});
