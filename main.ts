// Entry for post-x-promote-make-your-own-bounty-01 (Node 22, standard library only).
// The entry is the X post itself: one post of your own on X that quotes make.fun's
// make-your-own-bounty post (https://x.com/makefunai/status/2124915864336236646)
// or links to it, with a photo of its own attached, make.fun or the @makefunai tag
// and your play code in its text. POST.json names the post; the house reads its
// replies, reposts and quotes from X. Nothing this program writes is scored.
//
// This program copies POST.json from the repository root to the output directory.
// The source path is resolved through import.meta.url, never a relative path:
// the grader runs node from a different working directory, so a relative path
// would fail with ENOENT. That is all the program has to do.
//
// Run locally:
//   MAKEFUN_OUTPUT_DIR=out node main.ts
// (the grader sets MAKEFUN_OUTPUT_DIR itself; outside it, "out" is the default.)

import { copyFileSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? 'out';

// Validate the entry data before copying anything: a placeholder or
// malformed POST.json must fail loudly here instead of silently shipping
// a useless entry to the grader.
const postJsonPath = join(here, 'POST.json');
let post;
try {
  post = JSON.parse(readFileSync(postJsonPath, 'utf8'));
} catch (err) {
  throw new Error('POST.json is not valid JSON (' + postJsonPath + '): ' + err.message);
}
if (typeof post !== 'object' || post === null || Array.isArray(post)) {
  throw new Error('POST.json must contain a JSON object with a "url" field');
}
const url = post.url;
if (typeof url !== 'string' || url.trim() === '') {
  throw new Error('POST.json: field "url" is required and must not be empty');
}
let parsed;
try {
  parsed = new URL(url.trim());
} catch {
  throw new Error('POST.json: field "url" is not a valid URL: ' + url);
}
if (parsed.protocol !== 'https:' || !/^(x\.com|twitter\.com)$/.test(parsed.hostname)) {
  throw new Error(`POST.json: field "url" must be an https://x.com (or twitter.com) post URL, got: ${url}`);
}
if (!/^\/[^/]+\/status\/\d+$/.test(parsed.pathname)) {
  throw new Error(`POST.json: field "url" must point to an X post (…/status/<id>), got: ${url}`);
}

// The post text must exist and not be empty, so a missing/blank draft can
// never be submitted as the entry text by accident.
const postText = readFileSync(join(here, 'POST_TEXT.txt'), 'utf8').trim();
if (postText === '') {
  throw new Error('POST_TEXT.txt must not be empty');
}
if (!postText.includes('makefun-')) {
  throw new Error('POST_TEXT.txt must contain the play code (makefun-…)');
}

mkdirSync(out, { recursive: true });
copyFileSync(postJsonPath, join(out, 'POST.json'));
console.log(`Copied POST.json for ${url}`);
