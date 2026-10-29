"use strict";
module.exports = function (assert, strip) {
  const A = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"; const nots = (q, w) => q.opts.slice(1).forEach((o) => assert.notStrictEqual(strip(o.t), w));
  return {
    caesar(q) { const t = q.stem.replace(/`/g, ""); const k = +/(\d+) (?:هو|\.)/.exec(t.replace("(إزاحة)", ""))[1]; const w = /([A-Z]{4,})/.exec(t)[1]; const dec = /النص الأصلي/.test(t);
      const want = w.split("").map((c) => A[(A.indexOf(c) + (dec ? -k : k) + 26) % 26]).join(""); assert.strictEqual(strip(q.opts[0].t), want); nots(q, want); assert.strictEqual(q.params.k, k); },
    vigenere(q) { const m = /الكلمة `([A-Z]+)`.*المفتاح `([A-Z]+)`/.exec(q.stem); const want = [...m[1]].map((c, i) => A[(A.indexOf(c) + A.indexOf(m[2][i % m[2].length])) % 26]).join(""); assert.strictEqual(strip(q.opts[0].t), want); nots(q, want); },
    keyspace(q) { const t = q.stem; let want; const n = +/(\d+) /.exec(t.replace(/^[^\d]*/, ""))[1];
      if (/بتًّا/.test(t)) want = 2 ** n; else if (/السداسي/.test(t)) want = 16 ** n; else if (/عشرية/.test(t)) want = 10 ** n; else if (/إنجليزية/.test(t)) want = 26 ** n; else assert.fail("kind");
      assert.strictEqual(+strip(q.opts[0].t), want); q.opts.slice(1).forEach((o) => assert.notStrictEqual(+strip(o.t), want)); }
  };
};
