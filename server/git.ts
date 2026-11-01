// The only way the server runs git (T121, ADR-0103). A universe's folder is written from outside, so nothing in it decides what
// runs: hooks and the file system monitor are off whatever its configuration says, tree entries that are git's folder in
// disguise are refused on every system, and git never climbs out of the folder to find a repository (the kernel's, above it).

import { execFile } from 'node:child_process';
import path from 'node:path';

// Not an empty value: git would look for its hooks at the root of the disk (`/pre-commit`).
const NO_HOOKS = '/dev/null';
const HARDENED = ['-c', `core.hooksPath=${NO_HOOKS}`, '-c', 'core.fsmonitor=false', '-c', 'core.protectNTFS=true', '-c', 'core.protectHFS=true', '-c', 'core.autocrlf=false', '-c', 'core.quotepath=false'];

export interface GitOptions {
  /** Name and email of this command only: the machine's global configuration is never touched. */
  author: [string, string];
  env?: NodeJS.ProcessEnv;
  input?: string;
  maxBuffer?: number;
}

export function runGit(cwd: string, args: string[], opts: GitOptions): Promise<string> {
  const full = [...HARDENED, '-c', `user.name=${opts.author[0]}`, '-c', `user.email=${opts.author[1]}`, ...args];
  const env = { ...(opts.env ?? process.env), GIT_CEILING_DIRECTORIES: path.dirname(path.resolve(cwd)) };
  return new Promise((resolve, reject) => {
    const child = execFile('git', full, { cwd, env, maxBuffer: opts.maxBuffer ?? 64 * 1024 * 1024, windowsHide: true }, (err, stdout, stderr) => (err ? reject(new Error(String(stderr || err.message).trim())) : resolve(String(stdout))));
    if (opts.input !== undefined) child.stdin?.end(opts.input, 'utf8');
  });
}
