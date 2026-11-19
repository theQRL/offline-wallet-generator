import { createRouter, createWebHashHistory } from "vue-router";
import Home from "./views/Home.vue";

// Keep vue-router pinned to 5.4.0 until its unconditional sessionStorage writes
// in 5.5.x can be disabled. Both builds must remain storage-free.
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
