const { spawn } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const log = fs.createWriteStream(path.join(root, "dev-live.log"), { flags: "a" });
const nextBin = path.join(root, "node_modules", "next", "dist", "bin", "next");
const port = process.env.PORT || "3012";

function write(line) {
  log.write(`[${new Date().toISOString()}] ${line}\n`);
}

write(`starting next dev on ${port}`);

const child = spawn(process.execPath, [nextBin, "dev", "--turbopack", "--hostname", "0.0.0.0", "--port", port], {
  cwd: root,
  stdio: ["pipe", "pipe", "pipe"],
  windowsHide: true
});

child.stdout.pipe(log);
child.stderr.pipe(log);
child.stdin.write("\n");

child.on("exit", (code, signal) => {
  write(`next dev exited code=${code} signal=${signal}`);
});

setInterval(() => {
  if (!child.killed) child.stdin.write("\n");
}, 30000);
