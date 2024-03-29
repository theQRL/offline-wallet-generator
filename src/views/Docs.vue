<template>
  <div class="container mt-5 mb-5 p-5 shadow">
    <div class="row">
      <div class="col-12">
        <h1 class="display-4">
          Documentation
        </h1>
      </div>
    </div>
    <div class="row p-3">
      <p>This software will allow you to generate a wallet for use on the QRL network.  For security, it is designed to be used in an offline environment.  It is recommended to use this software from a bootable OS (e.g. Desktop Ubuntu distribution) without any network connection.</p>
      <p>To run offline, download the latest .zip file from the <a href="https://github.com/theQRL/offline-wallet-generator/releases">GitHub Releases</a> page, extract the zip then
      run the offline.html file in your browser.</p>
    </div>
    <div class="row p-3">
      <img src="@/assets/qrl-vue-wallet.png" style="width:170px;" class="rounded bordered mb-1" alt="QRLLIB">
      <p>The software uses the core QRL library (QRLLIB) which required a modern browser with webassembly capabilities.  If the software has loaded correctly the version of QRLLIB and a check mark will be shown as in the picture above.</p>
    </div>
    <div class="row p-3">
      <img src="@/assets/qrl-vue-wallet_1.png" style="width:342px;" class="rounded bordered mb-1" alt="Options">
      <p>You can configure the settings of the wallet to be generated by adjusting the dropdowns.  The defaults are fine for most users.  You can read more about the tree height and hash function options at <a href="https://docs.theqrl.org/wallet/basics/#qrl-web-wallet">the QRL docs site</a>.  Bear in mind that large tree heights will need longer to generate, especially on older computers.  Once the options have been reviewed, click <strong>Generate</strong> to begin.</p>
    </div>
    <div class="row p-3">
      <img src="@/assets/qrl-vue-wallet_2.png" style="width:210px;" class="rounded bordered mb-1" alt="Spinner">
      <p>A spinner will show while the wallet is being created.  Please be patient: the generation of an address may take up to 30 mins on old hardware if the largest tree height has been selected.  On modern hardware and with default options, wallet generation usually takes only a couple of seconds.</p>
    </div>
    <div class="row p-3">
      <img src="@/assets/qrl-vue-wallet_3.png" style="width:253px;" class="rounded bordered mb-1" alt="Output">
      <p>The generated wallet can be printed, saved as a PDF or exported as JSON, in both password protected and unprotected formats. Both the protected and unprotected JSON files can be use in the QRL web wallet.  The unprotected format can also be used in a QRL node.  If you select the password protected option, which is recommended in most cases, do not forget the password as funds may be lost if you do.</p>
    </div>
    <div class="row p-3">
      <img src="@/assets/qrl-vue-wallet_4.png" style="width:487px;" class="rounded bordered mb-1" alt="JSON">
      <p>The <strong>Save encrypted</strong> option becomes available when the password boxes contain matching passwords.</p>
    </div>
    <div class="row p-3">
      <img src="@/assets/qrl-vue-wallet_5.png" style="width:486px;" class="rounded bordered mb-1" alt="JSON">
      <p>If you untick the option to use the password protected file format, the <strong>Save unencrypted</strong> option becomes available.</p>
    </div>
    <div class="row p-3">
      <p>Whichever option for saving the wallet details you choose, be careful to guard the mnemonic phrase, hexseed (and private key in the JSON files) carefully: sharing these details could result in loss of funds.</p>
    </div>
  </div>
</template>
<style scoped>
.container {
  background: #f0f0f0;
}

.display-4 {
  font-size: 2.5rem !important; /* csslint allow: important */
}

.bordered {
  -webkit-box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24) !important;
  -moz-box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24) !important;
  -ms-box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24) !important;
  -o-box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24) !important;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24) !important;
  border: #bdbdbd 1px solid;
}
</style>
