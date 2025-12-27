/* global QRLLIB */
// Web Worker for wallet generation - keeps UI responsive during heavy computation

// Polyfill window and document for libraries that expect browser environment
self.window = self;
self.document = { createElement: () => ({}) };

// Load QRLLIB in the worker context
importScripts('qrllib.js');

self.onmessage = async function(e) {
  const { randomSeed, xmssHeight, hashFunction, regen, hexseedMnemonic } = e.data;

  // Wait for QRLLIB to be ready
  const waitForQRLLIB = () => {
    return new Promise((resolve) => {
      const check = () => {
        if (typeof QRLLIB !== 'undefined' && typeof QRLLIB.Xmss !== 'undefined') {
          resolve();
        } else {
          setTimeout(check, 100);
        }
      };
      check();
    });
  };

  await waitForQRLLIB();

  const toUint8Vector = arr => {
    const vec = new QRLLIB.Uint8Vector();
    for (let i = 0; i < arr.length; i += 1) {
      vec.push_back(arr[i]);
    }
    return vec;
  };

  let hashFn = QRLLIB.eHashFunction.SHAKE_128;
  switch (hashFunction) {
    case 'SHAKE_128':
      hashFn = QRLLIB.eHashFunction.SHAKE_128;
      break;
    case 'SHAKE_256':
      hashFn = QRLLIB.eHashFunction.SHAKE_256;
      break;
    case 'SHA2_256':
      hashFn = QRLLIB.eHashFunction.SHA2_256;
      break;
  }

  try {
    let XMSS_OBJECT = null;

    if (!regen) {
      const seedVector = toUint8Vector(new Uint8Array(randomSeed));
      XMSS_OBJECT = await new QRLLIB.Xmss.fromParameters(seedVector, xmssHeight, hashFn);
    } else {
      if (hexseedMnemonic.trim().length === 102) {
        XMSS_OBJECT = QRLLIB.Xmss.fromHexSeed(hexseedMnemonic);
      } else if (hexseedMnemonic.trim().split(' ').length === 34) {
        XMSS_OBJECT = QRLLIB.Xmss.fromMnemonic(hexseedMnemonic.trim());
      } else {
        self.postMessage({ error: 'Invalid hexseed/mnemonic' });
        return;
      }
    }

    self.postMessage({
      address: XMSS_OBJECT.getAddress(),
      pk: XMSS_OBJECT.getPK(),
      hexseed: XMSS_OBJECT.getHexSeed(),
      mnemonic: XMSS_OBJECT.getMnemonic(),
    });
  } catch (err) {
    self.postMessage({ error: err.message || 'Wallet generation failed' });
  }
};
