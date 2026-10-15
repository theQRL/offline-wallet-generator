// Inlines the built JS and CSS into index.html so the offline build is one
// file. Used only in `--mode offline` (see vite.config.js).
//
// Replaces vite-plugin-singlefile, whose only non-trivial dependency
// (micromatch -> braces) carries an unpatched high-severity advisory
// (GHSA-vfj7-8cjw-p6xm, no fixed version published) and was only used for an
// `inlinePattern` option this project never set. That kept a permanent
// failure in the `npm audit --audit-level=high` gate in ci.yml, for code the
// build never reached. Behaviour matches vite-plugin-singlefile 2.3.3 with
// default options, for Vite 8 (Rolldown).
//
// What actually guarantees a single file is the "output files: 1" assertion
// in scripts/check-offline-artifact.sh, not this plugin.

const isJsFile = /\.[mc]?js$/;
const isCssFile = /\.css$/;
const isHtmlFile = /\.html?$/;

export function replaceScript(html, scriptFilename, scriptCode) {
  const f = scriptFilename.replaceAll('.', '\\.');
  const reScript = new RegExp(`<script([^>]*?) src="(?:[^"]*?/)?${f}"([^>]*)></script>`);
  // Escape anything that could close the script element early.
  const code = scriptCode.replace(/"?__VITE_PRELOAD__"?/g, 'void 0').replace(/<(\/script>|!--)/g, '\\x3C$1');
  return html.replace(reScript, (_, beforeSrc, afterSrc) => `<script${beforeSrc}${afterSrc}>${code.trim()}</script>`);
}

export function replaceCss(html, cssFilename, cssCode) {
  const f = cssFilename.replaceAll('.', '\\.');
  const reStyle = new RegExp(`<link([^>]*?) href="(?:[^"]*?/)?${f}"([^>]*)>`);
  const code = cssCode.replace('@charset "UTF-8";', '');
  return html.replace(reStyle, (_, beforeSrc, afterSrc) => `<style${beforeSrc}${afterSrc}>${code.trim()}</style>`);
}

export function inlineBundle() {
  return {
    name: 'inline-bundle',
    enforce: 'post',
    config(config) {
      config.build ??= {};
      config.build.assetsInlineLimit = () => true;
      config.build.chunkSizeWarningLimit = 100000000;
      config.build.cssCodeSplit = false;
      // Relative URLs, with output in the dist root rather than dist/assets.
      config.base = './';
      config.build.assetsDir = '';
      config.build.rollupOptions ??= {};
      config.build.rollupOptions.output ??= {};
      const outputs = [config.build.rollupOptions.output].flat();
      for (const out of outputs) out.codeSplitting = false;
    },
    generateBundle(_options, bundle) {
      const names = Object.keys(bundle);
      const js = names.filter((n) => isJsFile.test(n));
      const css = names.filter((n) => isCssFile.test(n));
      const inlined = [];
      for (const name of names.filter((n) => isHtmlFile.test(n))) {
        const page = bundle[name];
        let html = page.source;
        for (const file of js) {
          if (bundle[file].code == null) continue;
          inlined.push(file);
          html = replaceScript(html, bundle[file].fileName, bundle[file].code);
        }
        for (const file of css) {
          inlined.push(file);
          html = replaceCss(html, bundle[file].fileName, bundle[file].source);
        }
        page.source = html;
      }
      for (const file of inlined) delete bundle[file];
    },
  };
}
