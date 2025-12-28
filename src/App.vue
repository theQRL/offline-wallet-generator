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
      <div>
        <img class="h-14" :src="logoSvg" alt="QRL Logo">
      </div>
    </footer>
  </div>
</template>

<script>
import logoSvgRaw from '/logo.svg?raw';

export default {
  name: 'App',
  data() {
    return {
      logoSvg: 'data:image/svg+xml;base64,' + btoa(logoSvgRaw)
    };
  }
};
</script>

<style>
html {
  position: relative;
  min-height: 100%;
}
</style>
