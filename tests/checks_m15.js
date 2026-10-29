"use strict";
module.exports = function (assert, strip) {
  const nots = (q, w) => q.opts.slice(1).forEach((o) => assert.notStrictEqual(strip(o.t), w));
  const txt = (q) => q.stem.replace(/`/g, "");
  const lst = (a) => "[" + a.join(", ") + "]";
  const arr = (t) => JSON.parse(/(\[[\d, ]+\])/.exec(t)[1]);
  return {
    sortpass(q) {
      const t = txt(q); const a = arr(t); const k = /المرورين/.test(t) ? 2 : 1; let x = a.slice();
      if (/Bubble/.test(t)) { for (let p = 0; p < k; p++) for (let i = 0; i < x.length - 1 - p; i++) if (x[i] > x[i + 1]) [x[i], x[i + 1]] = [x[i + 1], x[i]]; }
      else if (/Selection/.test(t)) { for (let p = 0; p < k; p++) { let m = p; for (let i = p + 1; i < x.length; i++) if (x[i] < x[m]) m = i; [x[p], x[m]] = [x[m], x[p]]; } }
      else { for (let i = 1; i <= k; i++) { const key = x[i]; let j = i - 1; while (j >= 0 && x[j] > key) { x[j + 1] = x[j]; j--; } x[j + 1] = key; } }
      assert.strictEqual(strip(q.opts[0].t), lst(x)); nots(q, lst(x)); assert.deepStrictEqual(x.slice().sort((p, r) => p - r), a.slice().sort((p, r) => p - r));
    },
    binsearch(q) {
      const t = txt(q); const a = arr(t); const target = +/القيمة (\d+)/.exec(t)[1]; let lo = 0, hi = a.length - 1, c = 0, done = false;
      while (lo <= hi) { const m = (lo + hi) >> 1; c++; if (a[m] === target) { done = true; break; } if (a[m] < target) lo = m + 1; else hi = m - 1; }
      assert.ok(done); for (let i = 1; i < a.length; i++) assert.ok(a[i - 1] < a[i]); assert.strictEqual(+strip(q.opts[0].t), c); nots(q, String(c));
    },
    linsearch(q) {
      const t = txt(q); const a = arr(t); const target = +/القيمة (\d+)/.exec(t)[1]; const i = a.indexOf(target); const want = i < 0 ? a.length : i + 1;
      assert.strictEqual(/غير موجودة/.test(t), i < 0); assert.strictEqual(+strip(q.opts[0].t), want); nots(q, String(want));
    },
    loopsum(q) {
      const t = txt(q); const a = arr(t); const m = +/% (\d+)/.exec(t)[1]; const sel = a.filter((x) => x % m === 0);
      const want = /sum\(/.test(t) ? sel.reduce((s, x) => s + x, 0) : sel.length; assert.strictEqual(+strip(q.opts[0].t), want); nots(q, String(want));
    }
  };
};
