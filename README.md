# QRL Offline Wallet Generator

## Use (the quick version)

- Download the latest **qrl-offline-wallet.zip** [release](https://github.com/theQRL/offline-wallet-generator/releases)
- Unarchive
- Open index.html in a modern browser (one which [supports webassembly](https://caniuse.com/#feat=wasm))
- Generate a wallet with the required settings (see [docs.theqrl.org](https://docs.theqrl.org))
- Save JSON/print/save PDF and print later
- No internet connection required

Help is available:

- [Discord community](https://discord.gg/jBT6BEp)
- <support@theqrl.org>

## Verify integrity (optional but recommended step prior to use)

- Obtain security@theqrl.org public PGP key from keyservers or [Github](https://raw.githubusercontent.com/theQRL/security/master/security.theqrl.org.gpg.asc)
- Check the PGP signature of the shasum hashes file:
```
gpg --verify shasum.256.pgp.asc
```
- This should display _gpg: Good signature from "Security team <security@theqrl.org>"_
- Check the shasum of the offline-wallet files:
```
shasum --check shasum.256.pgp.asc
```
- All files should be _OK_ (a _WARNING: 19 lines are improperly formatted_ is expected due to the file being PGP signed)

## Use (the longer version - with pictures)

This software will allow you to generate a wallet for use on the QRL network.  For security, it is designed to be used in an offline environment.  It is recommended to use this software from a bootable OS (e.g. Desktop Ubuntu distribution) without any network connection.

![Screenshot 1](https://github.com/theqrl/offline-wallet-generator/blob/master/src/assets/qrl-vue-wallet.png)

The software uses the core QRL library (QRLLIB) which requires a modern browser with webassembly capabilities.  If the software has loaded correctly, the version of QRLLIB and a check mark will be shown as in the picture above.

![Screenshot 2](https://github.com/theqrl/offline-wallet-generator/blob/master/src/assets/qrl-vue-wallet_1.png)

You can configure the settings of the wallet to be generated by adjusting the dropdowns.  The defaults are fine for most users.  You can read more about the tree height and hash function options at [the QRL docs site](https://docs.theqrl.org/wallet/basics/#qrl-web-wallet).  Bear in mind that large tree heights will need longer to generate, especially on older computers.  Once the options have been reviewed, click **Generate** to begin.

![Screenshot 3](https://github.com/theqrl/offline-wallet-generator/blob/master/src/assets/qrl-vue-wallet_2.png)

A spinner will show while the wallet is being created.  Please be patient: the generation of an address may take up to 30 mins on old hardware if the largest tree height has been selected.  On modern hardware and with default options, wallet generation usually takes only a couple of seconds.

![Screenshot 4](https://github.com/theqrl/offline-wallet-generator/blob/master/src/assets/qrl-vue-wallet_3.png)

The generated wallet can be printed, saved as a PDF or exported as JSON, in both password protected and unprotected formats. Both the protected and unprotected JSON files can be use in the QRL web wallet.  The unprotected format can also be used in a QRL node.  If you select the password protected option, which is recommended in most cases, do not forget the password as funds may be lost if you do.

![Screenshot 5](https://github.com/theqrl/offline-wallet-generator/blob/master/src/assets/qrl-vue-wallet_4.png)

The **Save encrypted** option becomes available when the password boxes contain matching passwords.

![Screenshot 6](https://github.com/theqrl/offline-wallet-generator/blob/master/src/assets/qrl-vue-wallet_5.png)

If you untick the option to use the password protected file format, the **Save unencrypted** option becomes available.

Whichever option for saving the wallet details you choose, be careful to guard the mnemonic phrase, hexseed (and private key in the JSON files) carefully: sharing these details could result in loss of funds.

## Developing/Building from source

### Dependencies

- npm (or yarn)
- @vue/cli v3 ([https://cli.vuejs.org/guide/installation.html](https://cli.vuejs.org/guide/installation.html))

### Project setup
```
npm install
```

### Compiles and hot-reloads for development
```
npm run serve
```

### Compiles and minifies for production
```
npm run build
```

### Run tests
```
npm run test
```

### Lints and fixes files
```
npm run lint
```

### Run end-to-end tests
```
npm run test:e2e
```

### Run unit tests
```
npm run test:unit
```

