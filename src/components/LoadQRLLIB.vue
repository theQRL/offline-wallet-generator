<template>
<div class="container mt-5 p-5">

  <div class="row justify-content-center">
    <div class="col-10 offset-2">
      <h1 class="display-4">QRL Offline Wallet Generator</h1>
    </div>
  </div>

  <div id="loading">
    <div class="row justify-content-center">
      <p class="text-primary">Loading QRL Library...</p>
    </div>

    <div class="row justify-content-center">
      <p class="text-muted">qrllib v1.0.4</p>
    </div>

    <div class="row justify-content-center">
      <div class="spinner-grow text-primary" role="status">
        <span class="sr-only">Loading...</span>
      </div>
    </div>
  </div>
  <div id="loaded" style="display: none;">
    <div class="row justify-content-center">
      <p class="text-primary">Loaded QRL Library</p>
    </div>

    <div class="row justify-content-center">
      <p class="text-muted">qrllib v1.0.4</p>
    </div>

    <div class="row justify-content-center">
      <font-awesome-icon icon="check" />
    </div>

    <div id="generateButton">
    <div class="row justify-content-center mt-5">
      <div class="btn-group">
        <button type="button" class="btn btn-small btn-secondary dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
          Hash function
        </button>
        <div class="dropdown-menu">
          <a class="dropdown-item" href="#">SHAKE-128</a>
          <a class="dropdown-item" href="#">SHA246</a>
          <a class="dropdown-item" href="#">Something else here</a>
          <div class="dropdown-divider"></div>
          <a class="dropdown-item" href="#">Separated link</a>
        </div>
      </div>
      &nbsp;
      <div class="btn-group">
        <button type="button" class="btn btn-small btn-secondary dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
          Hash function
        </button>
        <div class="dropdown-menu">
          <a class="dropdown-item" href="#">SHAKE-128</a>
          <a class="dropdown-item" href="#">SHA246</a>
          <a class="dropdown-item" href="#">Something else here</a>
          <div class="dropdown-divider"></div>
          <a class="dropdown-item" href="#">Separated link</a>
        </div>
      </div>
    </div>

<div class="row justify-content-center mt-5">
      <button id="startGeneration" class="btn btn-primary" v-on:click="generateWallet">Generate</button>
</div>
    </div>

    <div class="mt-5" id="generatingSpinner" style="display: none;">
      <div class="row justify-content-center">
        <p>Generating new address...</p>
      </div>
      <div class="row justify-content-center">
        <div class="spinner-border" role="status">
          <span class="sr-only">Loading...</span>
        </div>
      </div>
    </div>

    <div class="mt-5" id="generated" style="display: none;">
    <strong>Address: </strong><p id="address" class="wrap"></p>
    <strong>Private Key: </strong><p id="pk" class="wrap"></p>
    <strong>Mnemonic: </strong><p id="mnemonic" class="word"></p>
    </div>

  </div>

</div>
</template>

<script>
/* eslint new-cap:0, import/order:0 */
/* global QRLLIB */
import Crypto from 'crypto';
import $ from 'jquery';

export default {
  name: 'LoadQRLLIB',
  mounted() {
    if ((typeof QRLLIB.str2bin) === 'function') {
      $('#loading').hide();
      $('#loaded').show();
    }
  },
  methods: {
    generateWallet() {
      const toUint8Vector = (arr) => {
        const vec = new QRLLIB.Uint8Vector();
        for (let i = 0; i < arr.length; i += 1) {
          vec.push_back(arr[i]);
        }
        return vec;
      };
      async function makeWallet() {
        let XMSS_OBJECT = null;
        const xmssHeight = 10;
        const hashFunction = QRLLIB.eHashFunction.SHA2_256;
        const randomSeed = toUint8Vector(Crypto.randomBytes(48));
        XMSS_OBJECT = await new QRLLIB.Xmss.fromParameters(randomSeed, xmssHeight, hashFunction);
        // const newAddress = XMSS_OBJECT.getAddress();
        // return newAddress;
        return XMSS_OBJECT;
      }
      async function gen() {
        $('#generateButton').hide();
        $('#generatingSpinner').show('fast', async function () { // eslint-disable-line
          const Q = await makeWallet();
          // console.log(Q);
          $('#generatingSpinner').hide();
          $('#address').text(Q.getAddress());
          $('#pk').text(Q.getPK());
          $('#mnemonic').text(Q.getMnemonic());
          $('#generated').show();
        });
      }
      // console.log('Making...');
      gen();
    },
  },
};
</script>

<!-- Scoped CSS: limited to this component only -->
<style scoped>
.container {
  background: #f0f0f0;
}
.wrap {
  word-break: break-all;
}
.word {
  word-break: normal;
}
</style>
