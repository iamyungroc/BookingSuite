#!/usr/bin/env node
/* Rotate the admin PIN safely:
   1) node tools/pin-hash.js YOUR_NEW_PIN
   2) paste the printed hash into js/config.js -> studio.pinHash
   3) redeploy. The plaintext PIN never enters the repo. */
const s = process.argv[2];
if (!s) { console.log("usage: node tools/pin-hash.js <new-pin>"); process.exit(1); }
let h = 5381;
for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
console.log('pinHash: "h' + (h >>> 0) + '"');
