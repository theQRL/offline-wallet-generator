import Vue from "vue";
import { createRouter, createWebHashHistory } from "vue-router";
import Home from "./views/Home.vue";

// Vue.use(Router);

export default new createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: "/",
      name: "home",
      component: Home,
      meta: {
        title: "QRL Offline Wallet Generator",
      },
    },
    {
      path: "/about",
      name: "about",
      // route level code-splitting
      // this generates a separate chunk (about.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import(/* webpackChunkName: "about" */ "./views/About.vue"),
      meta: {
        title: "QRL Offline Wallet Generator",
      },
    },
    {
      path: "/docs",
      name: "docs",
      // route level code-splitting
      // this generates a separate chunk (docs.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import(/* webpackChunkName: "docs" */ "./views/Docs.vue"),
      meta: {
        title: "QRL Offline Wallet Generator",
      },
    },
  ],
  linkActiveClass: "active",
});
