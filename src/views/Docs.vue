<template>
  <div class="card bg-base-200 shadow-lg mx-auto my-8 max-w-4xl">
    <div class="card-body">
      <h1 class="card-title text-3xl mb-4">Documentation</h1>

      <div class="space-y-4">
        <p>This software will allow you to generate a wallet for use on the QRL network. For security, it is designed to be used in an offline environment. It is recommended to use this software from a bootable OS (e.g. Desktop Ubuntu distribution) without any network connection.</p>

        <p>To run offline, download the latest .zip file from the <a class="link link-primary" href="https://github.com/theQRL/offline-wallet-generator/releases">GitHub Releases</a> page, extract the zip then run the offline.html file in your browser.</p>

        <p>Generate new QRL wallets directly in your browser using the QRLLIB WebAssembly library. When the library has loaded successfully, a green checkmark will appear in the footer.</p>

        <h3 class="font-semibold">Configuration Options:</h3>
        <ul class="list-disc list-inside space-y-1">
          <li><strong>Hash Function:</strong> SHAKE_128 (default), SHAKE_256, or SHA2_256</li>
          <li><strong>Tree Height:</strong> Determines the number of signatures available (default: 10 = 1,024 signatures)</li>
        </ul>
        <p>The defaults are suitable for most users. Higher tree heights provide more signatures but take longer to generate. Read more at <a class="link link-primary" href="https://docs.theqrl.org/wallet/basics/#qrl-web-wallet">the QRL docs site</a>.</p>

        <h3 class="font-semibold mt-4">Generation Process:</h3>
        <p>Click <strong>Generate</strong> to create a new wallet. A spinner will display with estimated and elapsed time. Generation typically takes a few seconds with default settings, but may take up to 30 minutes on older hardware with maximum tree height.</p>

        <h3 class="font-semibold mt-4">Wallet Output:</h3>
        <p>Once generated, your wallet details are displayed:</p>
        <ul class="list-disc list-inside space-y-1">
          <li><strong>Address:</strong> Your public QRL address (safe to share)</li>
          <li><strong>Mnemonic:</strong> 34-word recovery phrase (keep secret)</li>
          <li><strong>Hexseed:</strong> Hexadecimal seed (keep secret)</li>
        </ul>

        <h3 class="font-semibold mt-4">Saving Your Wallet:</h3>
        <ul class="list-disc list-inside space-y-1">
          <li><strong>Print:</strong> Print wallet details directly</li>
          <li><strong>Save PDF:</strong> Download as a PDF document</li>
          <li><strong>Save JSON (encrypted):</strong> Password-protected format compatible with the QRL web wallet (recommended)</li>
          <li><strong>Save JSON (unencrypted):</strong> Plain format compatible with QRL web wallet and QRL nodes</li>
        </ul>

        <h3 class="font-semibold mt-4">Regenerate from Existing:</h3>
        <p>You can also regenerate a wallet by entering an existing hexseed or mnemonic phrase. This is useful for verifying backups or recovering wallet details.</p>

        <div class="alert alert-error mt-4">
          <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Never share your mnemonic phrase or hexseed. Anyone with access to these can control your funds.</span>
        </div>
      </div>
    </div>
  </div>
</template>
