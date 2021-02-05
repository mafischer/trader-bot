import Vue from 'vue';
import Worker from './Worker.vue';

Vue.config.productionTip = false;

new Vue({
  render: (h) => h(Worker),
}).$mount('#worker');
