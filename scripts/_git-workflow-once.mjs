import { execSync } from "child_process";
import fs from "fs";
import path from "path";

const root = process.cwd();
const reportPath = path.join(root, "src", "_git_report.txt");
const targetMsg =
  "Improve managed properties UX - unit editing, cross-links, property cards, sidebar hierarchy";

function sh(cmd) {
  return execSync(cmd, { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
}

function shTry(cmd) {
  try {
    const out = sh(cmd);
    return { ok: true, out: out.trim(), err: "" };
  } catch (e) {
    const out = (e.stdout || "").toString().trim();
    const err = (e.stderr || "").toString().trim();
    return { ok: false, out, err: err || e.message };
  }
}

if (fs.existsSync(path.join(root, "scripts", "git-report.mjs"))) {
  shTry("node scripts/git-report.mjs");
}

let headSubject = "";
try {
  headSubject = sh("git log -1 --pretty=format:%s").trim();
} catch {}

if (headSubject !== targetMsg) {
  const patterns = [
    "unitsService", "UnitFormModal", "ManagedUnitsTable", "PropertiesPage", "PropertyDetailPage",
    "Sidebar", "UnitsPage", "LeasesPage", "PaymentsPage", "QuickAddModals", "QuickAddContext",
    "propertiesService", "leasesService", "auctionsService", "useBrokerSidebarData",
  ];
  const walk = (dir, acc = []) => {
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, ent.name);
      if (ent.isDirectory()) walk(p, acc);
      else acc.push(p);
    }
    return acc;
  };
  const all = walk(path.join(root, "src"));
  const toAdd = new Set();
  for (const f of all) {
    const base = path.basename(f);
    const rel = path.relative(root, f).replace(/\\/g, "/");
    if (patterns.some((p) => base.includes(p))) toAdd.add(rel);
    if (rel.includes("/services/") && base === "index.ts") toAdd.add(rel);
    if (/(types|domain|lib)\//.test(rel) && ["types.ts","domain.ts","property.ts","lease.ts","unit.ts","auction.ts"].includes(base)) toAdd.add(rel);
  }
  const schema = "schema.migration.favorites.sql";
  if (fs.existsSync(path.join(root, schema))) toAdd.add(schema);
  for (const f of toAdd) shTry(`git add -- "${f}"`);
  const staged = shTry("git diff --cached --name-only");
  if (staged.ok && staged.out) {
    sh(
      `git -c user.email="nexuservice@gmail.com" -c user.name="Michael Wiener" commit -m "${targetMsg.replace(/"/g, '\\"')}"`
    );
  }
}

const push = shTry("git push origin HEAD");
const hash = sh("git rev-parse HEAD").trim();
const branch = sh("git branch --show-current").trim();
const files = sh("git show --name-only --pretty=format: HEAD")
  .split(/\r?\n/)
  .filter(Boolean)
  .join("\n");
const pushLine = push.ok ? `SUCCESS: ${push.out || push.err}` : `FAILURE: ${push.err || push.out}`;

const body = [
  `commit_hash=${hash}`,
  `branch=${branch}`,
  `push=${pushLine}`,
  "files_in_commit:",
  files,
  "",
].join("\n");
fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, body, "utf8");
process.stdout.write(body);
