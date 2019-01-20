/* eslint new-cap:0, import/order:0 */
/* global QRLLIB */
import 'bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'roboto-fontface/css/roboto/roboto-fontface.css';
import { QRLLIBmodule } from 'qrllib/build/offline-libjsqrl'; // eslint-disable-line no-unused-vars
import Vue from 'vue';
import Vuex from 'vuex';
import App from './App.vue';
import router from './router';
import store from './store';
import $ from 'jquery';
import { library } from '@fortawesome/fontawesome-svg-core';
import { faCheck } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';

Vue.use(Vuex);

library.add(faCheck);

Vue.component('font-awesome-icon', FontAwesomeIcon);

const waitForQRLLIB = (callBack) => {
  setTimeout(() => {
    // Test the QRLLIB object has the str2bin function.
    // This is sufficient to tell us QRLLIB has loaded.
    if (typeof QRLLIB.str2bin === 'function') {
      callBack();
    } else {
      return waitForQRLLIB(callBack);
    }
    return false;
  }, 50);
};

Vue.config.productionTip = false;

new Vue({
  router,
  store,
  render: h => h(App),
}).$mount('#app');

waitForQRLLIB(() => {
  // Object.definePrototype(Vue.prototype, '$QRLLIB', { value: QRLLIB });
  $('#loading').hide();
  $('#loaded').show();
});
