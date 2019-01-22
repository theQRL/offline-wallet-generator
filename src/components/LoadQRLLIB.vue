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
              <a class="dropdown-item" v-on:click="thisHash('SHAKE_128')">SHAKE_128</a>
              <a class="dropdown-item" v-on:click="thisHash('SHAKE_256')">SHAKE_256</a>
              <a class="dropdown-item" v-on:click="thisHash('SHA2_256')">SHA2_256</a>
            </div>
          </div>
          &nbsp;
          <div class="btn-group">
            <button type="button" class="btn btn-small btn-secondary dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
              Tree height
            </button>
            <div class="dropdown-menu">
              <a class="dropdown-item" v-on:click="thisHeight(8)">Tree Height: 8, Signatures: 256</a>
              <a class="dropdown-item" v-on:click="thisHeight(10)">Tree Height: 10, Signatures: 1,024</a>
              <a class="dropdown-item" v-on:click="thisHeight(12)">Tree Height: 12, Signatures: 4,096</a>
              <a class="dropdown-item" v-on:click="thisHeight(14)">Tree Height: 14, Signatures: 16,384</a>
              <a class="dropdown-item" v-on:click="thisHeight(16)">Tree Height: 16, Signatures: 65,536</a>
              <a class="dropdown-item" v-on:click="thisHeight(18)">Tree Height: 18, Signatures: 262,144</a>
            </div>
          </div>
        </div>
        <div class="row justify-content-center mt-5">
          <div>Hash function: {{ hash() }}</div>&nbsp;&nbsp;|&nbsp;&nbsp;
          <div>Tree height: {{ height() }}</div>
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
        <strong>Address: </strong>
        <p id="address" class="wrap"></p>
        <strong>Private Key: </strong>
        <p id="pk" class="wrap"></p>
        <strong>Mnemonic: </strong>
        <p id="mnemonic" class="word"></p>
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
    height() {
      return this.$store.state.height;
    },
    hash() {
      return this.$store.state.hash;
    },
    thisHeight(height) {
      this.$store.state.height = height;
    },
    thisHash(hash) {
      this.$store.state.hash = hash;
    },
    generateWallet() {
      const hashFunctionSelection = this.$store.state.hash;
      const xmssHeight = this.$store.state.height;
      const toUint8Vector = (arr) => {
        const vec = new QRLLIB.Uint8Vector();
        for (let i = 0; i < arr.length; i += 1) {
          vec.push_back(arr[i]);
        }
        return vec;
      };
      async function makeWallet() {
        let XMSS_OBJECT = null;
        let hashFunction = QRLLIB.eHashFunction.SHAKE_128;
        console.log(hashFunctionSelection);
        switch (hashFunctionSelection) {
          case 'SHAKE_128':
            hashFunction = QRLLIB.eHashFunction.SHAKE_128;
            console.log('shake 128');
            break;
          case 'SHAKE_256':
            hashFunction = QRLLIB.eHashFunction.SHAKE_256;
            console.log('shake 256');
            break;
          case 'SHA2_256':
            hashFunction = QRLLIB.eHashFunction.SHA2_256;
            console.log('SHA2_256');
            break;
          default:
        }
        const randomSeed = toUint8Vector(Crypto.randomBytes(48));
        XMSS_OBJECT = await new QRLLIB.Xmss.fromParameters(randomSeed, xmssHeight, hashFunction);
        return XMSS_OBJECT;
      }
      async function gen() {
        $('#generateButton').hide();
        $('#generatingSpinner').show('fast', async function() { // eslint-disable-line
          const Q = await makeWallet();
          // console.log(Q);
          $('#generatingSpinner').hide();
          $('#address').text(Q.getAddress());
          $('#pk').text(Q.getPK());
          $('#mnemonic').text(Q.getMnemonic());
          $('#generated').show();
        });
      }
      // generate an address asynchronously
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
