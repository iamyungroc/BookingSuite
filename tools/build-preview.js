/* ============================================================
   build-preview.js — generates self-contained single-file
   builds (preview-landing.html / preview-app.html) that render
   inside sandboxed viewers with no network access (all CSS &
   JS inlined, icons embedded as data-URIs).

   Usage:  node tools/build-preview.js
   Run it after any change to css/, js/ or the HTML shells.
   The multi-file originals (index.html / app.html) remain the
   deployable production build.
   ============================================================ */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const read = (p) => fs.readFileSync(path.join(ROOT, p), "utf8");
const b64 = (p) => "data:image/png;base64," + fs.readFileSync(path.join(ROOT, p)).toString("base64");

const ICONS = {
  "assets/icon-192.png": b64("assets/icon-192.png"),
  "assets/icon-32.png": b64("assets/icon-32.png"),
  "assets/icon-180.png": b64("assets/icon-180.png"),
};

function inline(html, { appLink, legalLink, fromLegal } = {}) {
  let out = html;

  /* stylesheets -> <style> */
  out = out.replace(/<link rel="stylesheet" href="([^"]+)">/g, (_, href) => "<style>\n" + read(href) + "\n</style>");

  /* scripts -> inline <script> */
  out = out.replace(/<script src="([^"]+)"><\/script>/g, (_, src) => {
    let js = read(src);
    Object.entries(ICONS).forEach(([p, uri]) => { js = js.split('"' + p + '"').join('"' + uri + '"'); });
    return "<script>\n" + js + "\n</script>";
  });

  /* img / link icon attributes -> data URIs */
  Object.entries(ICONS).forEach(([p, uri]) => { out = out.split(p).join(uri); });

  /* cross-links between preview builds */
  if (appLink) out = out.split('href="app.html"').join('href="preview-app.html"');
  if (legalLink) out = out.split('href="legal.html').join('href="preview-legal.html');
  if (fromLegal) {
    out = out.split('href="index.html"').join('href="preview-landing.html"');
    out = out.split('href="app.html"').join('href="preview-app.html"');
  }

  return out;
}

fs.writeFileSync(path.join(ROOT, "preview-landing.html"), inline(read("index.html"), { appLink: true, legalLink: true }));
fs.writeFileSync(path.join(ROOT, "preview-app.html"), inline(read("app.html"), { legalLink: true }));
fs.writeFileSync(path.join(ROOT, "preview-legal.html"), inline(read("legal.html"), { fromLegal: true }));

["preview-landing.html", "preview-app.html", "preview-legal.html"].forEach((f) =>
  console.log(f.padEnd(22), (fs.statSync(path.join(ROOT, f)).size / 1024).toFixed(0) + " KB"));
console.log("done — self-contained preview builds written.");
