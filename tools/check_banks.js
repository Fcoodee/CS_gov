/* فحص بنيوي لكل بنوك data/standard-*.js: الحقول، تفرّد المعرّفات، تفرّد الخيارات، اكتمال التتبّع */
"use strict";
const fs = require("fs"), path = require("path"), assert = require("assert"), vm = require("vm");
const dir = path.join(__dirname, "..", "data"); const win = { CS_BANKS: {} }; vm.createContext(win); win.window = win;
let total = 0;
for (const f of fs.readdirSync(dir).filter((x) => /^standard-\d+\.js$/.test(x)).sort()) {
  vm.runInContext(fs.readFileSync(path.join(dir, f), "utf8"), win);
}
for (const [k, b] of Object.entries(win.CS_BANKS)) {
  if (+k.slice(1) < 3) { console.log(k, b.questions.length, "questions (legacy schema: skipped)"); continue; } /* m01/m02 لهما بانيان وفحوص خاصة */
  const ids = new Set();
  assert.ok(b.indicators.length >= 1 && b.standard.expected > 0, k);
  for (const q of b.questions) {
    assert.ok(!ids.has(q.id), k + " dup id " + q.id); ids.add(q.id);
    assert.ok(q.ind >= 1 && q.ind <= b.indicators.length, q.id + " ind");
    assert.strictEqual(q.opts.length, 4, q.id); assert.strictEqual(q.ans, 0, q.id);
    assert.strictEqual(new Set(q.opts.map((o) => o.t)).size, 4, q.id + " distinct");
    q.opts.forEach((o) => assert.ok(o.t && o.why, q.id + " opt"));
    assert.ok(q.stem && q.hint && q.concept && q.verify && q.steps.length >= 2 && q.ref, q.id + " fields");
    for (const i of ["1", "2", "3"]) { const t = q.traces[i]; assert.ok(t && t.name && t.steps.length >= 2, q.id + " trace " + i); assert.strictEqual(t.result, q.opts[+i].t, q.id + " trace result"); }
    assert.ok(!/undefined|NaN|\bnull\b/.test(JSON.stringify(q)), q.id + " bad token");
    total++;
  }
  const per = b.indicators.map((_, i) => b.questions.filter((q) => q.ind === i + 1).length);
  console.log(k, b.questions.length, "questions; per indicator:", per.join("/"));
  per.forEach((c, i) => assert.ok(c >= 3, k + " indicator " + (i + 1) + " has only " + c));
}
console.log("OK banks:", Object.keys(win.CS_BANKS).length, "questions:", total);
