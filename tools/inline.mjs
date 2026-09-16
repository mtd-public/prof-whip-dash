/**
 * Builds each page as one self-contained HTML file for publishing as an
 * Artifact: JS and CSS inlined, no asset requests, no import map, no CDN.
 * The normal `npm run build` output (multi-file, hashed) is what ships to
 * GitHub Pages; this is only for the hosted preview links.
 */
import { build } from 'vite'
import react from '@vitejs/plugin-react'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const pages = [
  { input: 'index.html', out: 'whipdash-game.html' },
  { input: 'board.html', out: 'whipdash-board.html' },
  { input: 'camera.html', out: 'whipdash-camera.html' },
]

mkdirSync(join(root, 'artifact'), { recursive: true })

for (const page of pages) {
  const outDir = join(root, '.artifact-build', page.input.replace('.html', ''))
  await build({
    root,
    base: './',
    logLevel: 'warn',
    plugins: [react()],
    build: {
      outDir,
      emptyOutDir: true,
      rollupOptions: {
        input: resolve(root, page.input),
        output: {
          inlineDynamicImports: true,
          entryFileNames: 'app.js',
          assetFileNames: 'app[extname]',
        },
      },
    },
  })

  let html = readFileSync(join(outDir, page.input), 'utf8')
  const js = readFileSync(join(outDir, 'app.js'), 'utf8')
  // Replacer functions, not template strings: minified code is full of `$&`
  // and `$'`, which String.replace would otherwise expand.
  html = html.replace(
    /<script type="module"[^>]*src="[^"]*app\.js"[^>]*><\/script>/,
    () => `<script type="module">\n${js.replace(/<\/script/g, '<\\/script')}\n</script>`,
  )
  try {
    const css = readFileSync(join(outDir, 'app.css'), 'utf8')
    html = html.replace(/<link rel="stylesheet"[^>]*href="[^"]*app\.css"[^>]*>/, () => `<style>\n${css}\n</style>`)
  } catch {
    /* a page with no stylesheet asset */
  }

  // On Pages the board links to ./index.html; a published artifact has to
  // point at the game's own URL instead.
  if (process.env.GAME_URL) {
    html = html.replace(
      'href="./index.html"',
      () => `href="${process.env.GAME_URL}" target="_blank" rel="noopener"`,
    )
  }

  // The Artifact host supplies the document skeleton (doctype, charset,
  // viewport, safe-area padding), so hand it head + body content only.
  const head = (html.match(/<head>([\s\S]*?)<\/head>/) ?? [, ''])[1]
    // Keep the charset declaration: the page's copy is harmless next to the
    // host's, and without one a plain static server mangles every glyph.
    .replace(/<meta name="viewport"[^>]*>/g, '')
    .trim()
  const body = (html.match(/<body>([\s\S]*?)<\/body>/) ?? [, ''])[1].trim()
  const target = join(root, 'artifact', page.out)
  writeFileSync(target, `${head}\n\n${body}\n`)
  console.log(`${page.out}  ${(Buffer.byteLength(head + body) / 1024).toFixed(0)} kB`)
}
