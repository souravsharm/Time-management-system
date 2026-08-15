/**
 * Publishes the static export to the `gh-pages` branch.
 *
 * GitHub Pages serves that branch directly, so no CI is involved — run
 * `npm run deploy` whenever you want the live site updated.
 *
 * A project site lives at /<repo>, so the build is given NEXT_PUBLIC_BASE_PATH
 * derived from the git remote. Getting that wrong 404s every asset.
 */
import { execFileSync } from "node:child_process";
import { cpSync, existsSync, readdirSync, rmSync } from "node:fs";
import { join } from "node:path";

const BRANCH = "gh-pages";
const WORKTREE = ".gh-pages";
const OUT = "out";

function git(args, options = {}) {
  return execFileSync("git", args, { encoding: "utf8", stdio: "pipe", ...options }).trim();
}

function run(command, args, env) {
  execFileSync(command, args, {
    stdio: "inherit",
    shell: process.platform === "win32",
    env: { ...process.env, ...env }
  });
}

function repoName() {
  const url = git(["remote", "get-url", "origin"]);
  const match = url.match(/([^/:]+?)(\.git)?$/);
  if (!match) throw new Error(`Could not read a repository name from remote: ${url}`);
  return match[1];
}

function cleanupWorktree() {
  try {
    git(["worktree", "remove", WORKTREE, "--force"]);
  } catch {
    rmSync(WORKTREE, { recursive: true, force: true });
    try {
      git(["worktree", "prune"]);
    } catch {
      /* nothing to prune */
    }
  }
}

const name = repoName();
const basePath = `/${name}`;

if (git(["status", "--porcelain"])) {
  console.warn("Working tree has uncommitted changes — deploying them as they are.\n");
}

console.log(`Building for https://<owner>.github.io${basePath}/ …\n`);
rmSync(OUT, { recursive: true, force: true });
run("npx", ["next", "build"], { NEXT_PUBLIC_BASE_PATH: basePath });

if (!existsSync(join(OUT, ".nojekyll"))) {
  throw new Error(
    "out/.nojekyll is missing. GitHub Pages runs Jekyll on branch deploys and will " +
      "drop the _next/ directory without it. Check that public/.nojekyll exists."
  );
}

console.log(`\nPublishing to ${BRANCH} …`);
cleanupWorktree();

// Reuse the branch if it exists anywhere, otherwise start it with no history.
let hasBranch = false;
try {
  git(["rev-parse", "--verify", BRANCH]);
  hasBranch = true;
} catch {
  try {
    git(["ls-remote", "--exit-code", "--heads", "origin", BRANCH]);
    git(["fetch", "origin", `${BRANCH}:${BRANCH}`]);
    hasBranch = true;
  } catch {
    hasBranch = false;
  }
}

if (hasBranch) {
  git(["worktree", "add", WORKTREE, BRANCH]);
} else {
  git(["worktree", "add", "--detach", WORKTREE]);
  git(["-C", WORKTREE, "checkout", "--orphan", BRANCH]);
}

// Replace the branch contents wholesale so deleted files don't linger.
for (const entry of readdirSync(WORKTREE)) {
  if (entry === ".git") continue;
  rmSync(join(WORKTREE, entry), { recursive: true, force: true });
}
cpSync(OUT, WORKTREE, { recursive: true });

git(["-C", WORKTREE, "add", "-A"]);

const staged = git(["-C", WORKTREE, "status", "--porcelain"]);
if (!staged) {
  console.log("No change since the last deploy.");
} else {
  const sha = git(["rev-parse", "--short", "HEAD"]);
  git(["-C", WORKTREE, "commit", "-m", `Publish site from ${sha}`]);
  run("git", ["-C", WORKTREE, "push", "-u", "origin", BRANCH]);
  console.log(`\nPublished. Live at https://<owner>.github.io${basePath}/`);
}

cleanupWorktree();
