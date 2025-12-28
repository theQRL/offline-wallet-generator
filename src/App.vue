<template>
  <div id="app" class="min-h-screen flex flex-col">
    <nav class="navbar bg-neutral shadow-lg">
      <div class="navbar-start">
        <ul class="menu menu-horizontal px-1">
          <li>
            <router-link to="/" class="text-neutral-content hover:text-white" :class="{ 'bg-secondary text-white': $route.path === '/' }">Home</router-link>
          </li>
          <li>
            <router-link to="/docs" class="text-neutral-content hover:text-white" :class="{ 'bg-secondary text-white': $route.path === '/docs' }">Docs</router-link>
          </li>
          <li>
            <router-link to="/about" class="text-neutral-content hover:text-white" :class="{ 'bg-secondary text-white': $route.path === '/about' }">About</router-link>
          </li>
        </ul>
      </div>
    </nav>

    <main class="flex-grow">
      <router-view />
    </main>

    <div class="h-20 bg-base-300"></div>

    <footer class="footer footer-center p-4 bg-neutral text-neutral-content border-t border-black/40 shadow-[0_-5px_5px_-5px_rgba(0,0,0,0.22)]">
      <div class="flex items-center gap-4">
        <img class="h-14" :src="logoSvg" alt="QRL Logo">
        <div v-if="qrllibLoaded" class="text-left">
          <p class="text-sm text-neutral-content/80"><font-awesome-icon icon="check" class="text-success mr-1" />QRL Library loaded</p>
          <p class="text-xs text-neutral-content/60">qrllib v1.2.4</p>
        </div>
      </div>
    </footer>
  </div>
</template>

<script>
/* global QRLLIB */
import logoSvgRaw from '/logo.svg?raw';

export default {
  name: 'App',
  data() {
    return {
      qrllibLoaded: false,
      logoSvg: 'data:image/svg+xml;base64,' + btoa(logoSvgRaw)
    };
  },
  mounted() {
    this.checkQRLLIB();
  },
  methods: {
    checkQRLLIB() {
      if (typeof QRLLIB !== 'undefined' && typeof QRLLIB.str2bin === 'function') {
        this.qrllibLoaded = true;
      } else {
        setTimeout(() => this.checkQRLLIB(), 100);
      }
    }
  }
};
</script>

<style>
html {
  position: relative;
  min-height: 100%;
}
</style>
