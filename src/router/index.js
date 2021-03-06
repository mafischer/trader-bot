import Vue from 'vue';
import VueRouter from 'vue-router';
import Home from '../views/Home.vue';
import Strategies from '../views/Strategies.vue';
import Logs from '../views/Logs.vue';
import Login from '../views/Login.vue';
import Logout from '../views/Logout.vue';

Vue.use(VueRouter);

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home,
  },
  {
    path: '/strategies',
    name: 'Strategies',
    component: Strategies,
  },
  {
    path: '/logs',
    name: 'Logs',
    component: Logs,
  },
  {
    path: '/login',
    name: 'Login',
    component: Login,
  },
  {
    path: '/logout',
    name: 'Logout',
    component: Logout,
  },
];

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes,
});

export default router;
