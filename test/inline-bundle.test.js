import assert from 'node:assert/strict';
import test from 'node:test';
import { inlineBundle, replaceCss, replaceScript } from '../scripts/vite-plugin-inline-bundle.mjs';

test('replaceScript inlines the matching script and neutralises closing tags', () => {
  const html = '<head><script type="module" crossorigin src="./index-abc.js"></script></head>';
  const out = replaceScript(html, 'index-abc.js', 'a("</script>");b("<!--");c(__VITE_PRELOAD__)\n');
  assert.equal(out, '<head><script type="module" crossorigin>a("\\x3C/script>");b("\\x3C!--");c(void 0)</script></head>');
});

test('replaceScript treats the filename literally and leaves other scripts alone', () => {
  const html = '<script src="./indexXabc.js"></script>';
  assert.equal(replaceScript(html, 'index.abc.js', 'x'), html);
});

test('replaceCss inlines the stylesheet and drops @charset', () => {
  const html = '<link rel="stylesheet" crossorigin href="./style-abc.css">';
  assert.equal(
    replaceCss(html, 'style-abc.css', '@charset "UTF-8";\nbody{}\n'),
    '<style rel="stylesheet" crossorigin>body{}</style>',
  );
});

test('config hook produces a single relative-path bundle', () => {
  const config = {};
  inlineBundle().config(config);
  assert.equal(config.base, './');
  assert.equal(config.build.assetsDir, '');
  assert.equal(config.build.cssCodeSplit, false);
  assert.equal(config.build.assetsInlineLimit(), true);
  assert.equal(config.build.rollupOptions.output.codeSplitting, false);
  const arrayConfig = { build: { rollupOptions: { output: [{}, {}] } } };
  inlineBundle().config(arrayConfig);
  assert.deepEqual(arrayConfig.build.rollupOptions.output.map((o) => o.codeSplitting), [false, false]);
});

test('generateBundle inlines assets into html and removes them from the bundle', () => {
  const bundle = {
    'index.html': { source: '<link href="./s.css"><script src="./m.js"></script>' },
    'm.js': { fileName: 'm.js', code: 'go()' },
    's.css': { fileName: 's.css', source: 'a{}' },
    'logo.svg': { fileName: 'logo.svg', source: '<svg/>' },
    'm.js.map': { fileName: 'm.js.map', source: '{}' },
    'skip.js': { fileName: 'skip.js' },
  };
  inlineBundle().generateBundle({}, bundle);
  assert.equal(bundle['index.html'].source, '<style>a{}</style><script>go()</script>');
  assert.deepEqual(Object.keys(bundle).sort(), ['index.html', 'logo.svg', 'm.js.map', 'skip.js']);
});
