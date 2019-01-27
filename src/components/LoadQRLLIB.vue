<template>
  <div class="container mt-5 mb-5 p-5 shadow">
    <div class="row justify-content-center">
      <div class="col-12">
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
        <div class="row justify-content-center mt-3">
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
            <div class="dropdown-menu dropdown-menu-right">
              <a class="dropdown-item" v-on:click="thisHeight(8)">Tree Height: 8, Signatures: 256</a>
              <a class="dropdown-item" v-on:click="thisHeight(10)">Tree Height: 10, Signatures: 1,024</a>
              <a class="dropdown-item" v-on:click="thisHeight(12)">Tree Height: 12, Signatures: 4,096</a>
              <a class="dropdown-item" v-on:click="thisHeight(14)">Tree Height: 14, Signatures: 16,384</a>
              <a class="dropdown-item" v-on:click="thisHeight(16)">Tree Height: 16, Signatures: 65,536</a>
              <a class="dropdown-item" v-on:click="thisHeight(18)">Tree Height: 18, Signatures: 262,144</a>
            </div>
          </div>
        </div>
        <div class="row justify-content-center mt-3">
          <div>Hash function: {{ hash() }}</div>&nbsp;&nbsp;|&nbsp;&nbsp;
          <div>Tree height: {{ height() }}</div>
        </div>
        <div class="row justify-content-center mt-3">
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
        <div class="row justify-content-center"><img src="key.png" width="320px"></div>
        <strong>Address: </strong>
        <p id="address" class="wrap"></p>
          <div class="alert alert-success" role="alert">
            It's okay to share your address with others
          </div>
        <strong>Private Key: </strong>
        <p id="pk" class="wrap"></p>
          <div class="alert alert-danger" role="alert">
            Do not share your private key with anyone!
          </div>
        <strong>Mnemonic: </strong>
        <p id="mnemonic" class="word"></p>
        <div class="alert alert-danger" role="alert">
          Do not share your mnemonic phrase with anyone!
        </div>
      </div>
      <div class="mt-5" id="pdfSave" style="display: none;">
        <button class="btn btn-primary mr-2" v-on:click="printWallet">Print</button>
        <button id="clickPdfSave" class="btn btn-primary" v-on:click="pdfSave">Save PDF</button>
        <small class="pl-2">Remember to move the PDF file to a secure location</small>
      </div>
    </div>
  </div>
</template>
<script>
/* eslint new-cap:0, import/order:0 */
/* global QRLLIB */
import Crypto from 'crypto';
import $ from 'jquery';
import html2pdf from 'html2pdf.js';
import print from 'print-js';

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
    printWallet() {
      print({
        printable: 'generated',
        type: 'html',
        targetStyles: ['*'],
        header: 'The Quantum Resistant Ledger',
        headerStyle: 'font-family: Roboto; font-weight: 500; font-size: 24px;',
      });
    },
    pdfSave() {
      // WIP PDF generation
      // TODO: make this prettier...
      const element = $('#generated').get(0);
      html2pdf(element, {
        margin: 20,
        filename: 'qrl-wallet.pdf',
        image: { type: 'jpeg', quality: 1.0 },
      });
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
        switch (hashFunctionSelection) {
          case 'SHAKE_128':
            hashFunction = QRLLIB.eHashFunction.SHAKE_128;
            break;
          case 'SHAKE_256':
            hashFunction = QRLLIB.eHashFunction.SHAKE_256;
            break;
          case 'SHA2_256':
            hashFunction = QRLLIB.eHashFunction.SHA2_256;
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
          $('#generatingSpinner').hide();
          $('#address').text(Q.getAddress());
          $('#pk').text(Q.getPK());
          $('#mnemonic').text(Q.getMnemonic());
          $('#generated').show();
          $('#pdfSave').show();
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

h1.display-4 {
  font-size: 2
.5rem !important;
  text-align: center !important;
}

#address, #mnemonic, #pk {
  font-family: 'Hack';
}

</style>
