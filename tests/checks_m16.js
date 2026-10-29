"use strict";
module.exports = function (assert, strip) {
  const nots = (q, w) => q.opts.slice(1).forEach((o) => assert.notStrictEqual(strip(o.t), w));
  const txt = (q) => q.stem.replace(/`/g, "");
  const r2 = (x) => String(Math.round(x * 100) / 100);
  return {
    stats(q) {
      const t = txt(q); const a = /: ([\d, ]+)\. ما/.exec(t)[1].split(",").map(Number); const n = a.length; const s = a.slice().sort((x, y) => x - y);
      let want; if (/المتوسط الحسابي/.test(t)) want = r2(a.reduce((x, y) => x + y, 0) / n);
      else if (/الوسيط/.test(t)) want = r2(n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2);
      else if (/المنوال/.test(t)) { const c = {}; a.forEach((x) => (c[x] = (c[x] || 0) + 1)); const m = Math.max(...Object.values(c)); const mo = Object.keys(c).filter((k) => c[k] === m); assert.strictEqual(mo.length, 1); want = mo[0]; }
      else want = String(s[n - 1] - s[0]);
      assert.strictEqual(strip(q.opts[0].t), want); nots(q, want);
    },
    excelfn(q) {
      const t = txt(q); const a = []; for (const m of /A(\d+)=(\d+)/g[Symbol.matchAll](t)) a[+m[1] - 1] = +m[2]; const f = /=([A-Z]+)\(/.exec(t)[1];
      let want; if (f === "SUM") want = a.reduce((x, y) => x + y, 0); else if (f === "AVERAGE") want = a.reduce((x, y) => x + y, 0) / a.length; else if (f === "MAX") want = Math.max(...a); else if (f === "MIN") want = Math.min(...a); else if (f === "COUNT") want = a.length; else { const k = +/">(\d+)"/.exec(t)[1]; want = a.filter((x) => x > k).length; }
      want = r2(want); assert.strictEqual(strip(q.opts[0].t), want); nots(q, want);
    }
  };
};
