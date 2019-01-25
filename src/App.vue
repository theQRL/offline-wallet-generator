<template>
  <div id="app">
  <nav class="navbar navbar-light" style="background-color: #f9dfe7;">

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
    <router-view/>
    <footer class="footer">
       <div class="container d-flex justify-content-center pt-3">
         <img height="30px" src="logo.svg">
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
</style>
