const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

function findFile(namePart) {
  const stack = ["src"];
  while (stack.length) {
    const dir = stack.pop();
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, ent.name);
      if (ent.isDirectory()) stack.push(p);
      else if (ent.name.includes(namePart)) return p;
    }
  }
  return null;
}

const modal = findFile("CreateSigningLinkModal");
const quick = findFile("QuickAddModals");
const log = fs.readFileSync("tsc.log", "utf8");
const errRe = /^(.+?)\((\d+),(\d+)\): error TS2322: Type '(.+)' is not assignable to type '(.+)'\./gm;
let m;
let fixed = 0;
while ((m = errRe.exec(log))) {
  const file = m[1].replace(/\\/g, "/");
  if (!/CreateSigningLinkModal|QuickAddModals/.test(file)) continue;
  const base = path.basename(file);
  const target = [file, modal, quick].find((p) => p && fs.existsSync(p) && path.basename(p) === base);
  if (!target) continue;
  const lines = fs.readFileSync(target, "utf8").split(/\r?\n/);
  const idx = Number(m[2]) - 1;
  let line = lines[idx] || "";
  const from = m[4];
  const to = m[5];
  if (/recipient_email/.test(to) && !/recipient_email/.test(line)) {
    if (/\bemail\s*:/.test(line)) line = line.replace(/\bemail(\s*:)/, "recipient_email$1");
    else if (/\bclient_email\s*:/.test(line)) line = line.replace(/\bclient_email(\s*:)/, "recipient_email$1");
    lines[idx] = line;
    fs.writeFileSync(target, lines.join("\n"));
    fixed++;
  }
  if (/string/.test(to) && /undefined/.test(from) && /recipient_email\s*:\s*\w+/.test(line) && !/\.trim\(\)/.test(line)) {
    lines[idx] = line.replace(/recipient_email(\s*:\s*)(\w+)/, "recipient_email$1$2.trim()");
    fs.writeFileSync(target, lines.join("\n"));
    fixed++;
  }
}

try {
  execSync("npm run build", { stdio: "pipe" });
  fs.writeFileSync("signing-tsc-fix.result", "ok:" + fixed);
  process.exit(0);
} catch (e) {
  const out = (e.stdout || "").toString() + (e.stderr || "").toString();
  fs.writeFileSync("tsc.log", out);
  fs.writeFileSync("signing-tsc-fix.result", "fail:" + fixed + ":" + ((out.match(/error TS/g) || []).length));
  process.exit(1);
}
