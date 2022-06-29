<template>
  <div id="app">
    <nav class="navbar navbar-light">
      <ul class="nav nav-pills">
        <li class="nav-item">
          <router-link class="nav-link" to="/">Home</router-link>
        </li>
        <li>
          <router-link class="nav-link" to="/docs">Docs</router-link>
        </li>
        <li>
          <router-link class="nav-link" to="/about">About</router-link>
        </li>
      </ul>
      <!-- Navbar content -->
    </nav>
    <router-view />
    <div style="min-height: 80px; background: #cdcdcd;">
      <br />
    </div>
    <footer class="footer">
      <div class="container d-flex justify-content-center">
        <img style="height:60px;" src="logo.svg">
      </div>
    </footer>
  </div>
</template>

<style>
html {
  position: relative;
  min-height: 100%;
}

body {
  font-family: 'Roboto';
  background: #cdcdcd;
}

.text-primary {
  color: #dc255d !important;
}

.footer {
  position: absolute;
  bottom: 0;
  width: 100%;
  height: 60px;
  line-height: 60px;
  background-color: #f5f5f5;
}

.navbar {
  background-color: #0b181e;
  box-shadow: 0 5px 5px -5px rgba(0, 0, 0, 0.62) !important;
}

.navbar .nav .nav-link {
  color: #ecf0f1;
  border-radius: .25rem;
  margin: 0 0.25em;
}

.navbar .nav .nav-link:not(.disabled):hover,
.navbar .nav .nav-link:not(.disabled):focus {
  color: #ffffff;
}

.navbar .nav .nav-item .active:not(.router-link-exact-active) {
  background-color: #0b181e;
}

.shadow {
  -webkit-box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24) !important;
  -moz-box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24) !important;
  -ms-box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24) !important;
  -o-box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24) !important;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24) !important;
}

.footer {
  background-color: #0b181e;
  box-shadow: 0 -5px 5px -5px rgba(0, 0, 0, 0.22) !important;
  border-top: 1px solid rgba(0, 0, 0, 0.42) !important;
}

.dropdown-item.active, .dropdown-item:active {
  background-color: #ffa729;
}

.btn-primary {
  background-color: #ffa729;
  border: unset;
  color: #fff;
  transition: opacity .2s ease-in-out,color .2s ease-in-out,background-color .2s ease-in-out;
}

.nav-pills .nav-link.active, .nav-pills .show>.nav-link {
  background-color: #4aafff;
  color: #fff;
}

.btn-primary:hover, .btn-primary:focus, .btn-primary:active {
  background-color: #a97301;
  border: unset;
  transition: opacity .2s ease-in-out,color .2s ease-in-out,background-color .2s ease-in-out;
}
</style>
