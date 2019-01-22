/* eslint no-unused-expressions: 0 */
// https://docs.cypress.io/api/introduction/api.html

describe('Loads correctly', () => {
  it('Visits the app root url', () => {
    cy.visit('/');
    cy.contains('h1', 'QRL Offline Wallet Generator');
  });
});

describe('Loads QRLLIB', () => {
  it('Verifies QRLLIB loads', () => {
    cy.visit('/');
    cy.wait(5000).then(() => {
      cy.get('#loaded').then(($btn) => {
        expect($btn).to.be.visible;
      });
    });
  });
});

describe('Generates an address', () => {
  it('Clicks the Generate button and ensures an address, pk and mnemonic are displayed', () => {
    cy.visit('/');
    cy.get('#startGeneration').click().then(() => {
      cy.wait(15000).then(() => {
        cy.get('#address').then(($address) => {
          expect($address).not.to.be.empty;
          expect($address).to.be.visible;
        });
        cy.get('#pk').then(($pk) => {
          expect($pk).not.to.be.empty;
          expect($pk).to.be.visible;
        });
        cy.get('#mnemonic').then(($mnemonic) => {
          expect($mnemonic).not.to.be.empty;
          expect($mnemonic).to.be.visible;
        });
      });
    });
  });
});
