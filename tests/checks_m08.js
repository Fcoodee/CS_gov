"use strict";
module.exports = function (assert, strip) {
  const nots = (q, w) => q.opts.slice(1).forEach((o) => assert.notStrictEqual(strip(o.t), w));
  const r2 = (x) => String(Math.round(x * 100) / 100);
  return {
    schedwait(q) {
      const t = q.stem.replace(/`/g, ""); const burst = {}; for (const m of /(P\d)=(\d+)/g[Symbol.matchAll](t)) burst[m[1]] = +m[2]; const names = Object.keys(burst);
      let order, want, ws = {};
      if (/FCFS/.test(t)) { let c = 0; names.forEach((p) => { ws[p] = c; c += burst[p]; }); }
      else if (/SJF/.test(t)) { let c = 0; names.slice().sort((a, b) => burst[a] - burst[b]).forEach((p) => { ws[p] = c; c += burst[p]; }); }
      else { const qn = +/شريحة زمنية (\d+)/.exec(t)[1]; const rem = { ...burst }; let clock = 0; const fin = {}; const qu = names.slice();
        while (qu.length) { const p = qu.shift(); const d = Math.min(qn, rem[p]); clock += d; rem[p] -= d; if (rem[p]) qu.push(p); else fin[p] = clock; } names.forEach((p) => (ws[p] = fin[p] - burst[p])); }
      want = r2(names.reduce((s, p) => s + ws[p], 0) / names.length); assert.strictEqual(strip(q.opts[0].t), want); nots(q, want);
    },
    pagefault(q) {
      const t = q.stem.replace(/`/g, ""); const ref = /مراجع الصفحات: ([\d ]+) وعدد/.exec(t)[1].trim().split(" ").map(Number); const F = +/الإطارات (\d+)/.exec(t)[1]; const fifo = /FIFO \(/.test(t);
      const mem = []; let faults = 0; const age = new Map();
      ref.forEach((p, i) => { if (!mem.includes(p)) { faults++; if (mem.length === F) { const victim = fifo ? mem[0] : mem.reduce((a, b) => (age.get(a) <= age.get(b) ? a : b)); mem.splice(mem.indexOf(victim), 1); } mem.push(p); } age.set(p, i); });
      assert.strictEqual(+strip(q.opts[0].t), faults); q.opts.slice(1).forEach((o) => assert.notStrictEqual(+strip(o.t), faults));
    }
  };
};
