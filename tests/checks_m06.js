/* فحوص مستقلة لمولِّدات المعيار 6: تنفيذ الاستعلام على الصفوف المطبوعة في نص السؤال */
"use strict";
module.exports = function (assert, strip) {
  const txt = (q) => q.stem.replace(/`/g, "");
  return {
    sqlresult(q) {
      const t = txt(q); const rows = [...t.matchAll(/\((\d+), (\w+), (\d+)\)/g)].map((m) => ({ id: +m[1], name: m[2], v: +m[3] }));
      assert.ok(rows.length >= 5); const m = /SELECT (.*?) FROM \w+(?: WHERE (\w+) (>|<|=) (\d+))?\s*؟/.exec(t.replace(/\s+/g, " ")); assert.ok(m, t);
      const cmp = (v) => (m[3] === ">" ? v > +m[4] : m[3] === "<" ? v < +m[4] : v === +m[4]); const sel = rows.filter((r) => cmp(r.v)); const vs = sel.map((r) => r.v); let want;
      if (m[1] === "COUNT(*)") want = sel.length; else if (/^SUM/.test(m[1])) want = vs.reduce((a, b) => a + b, 0); else if (/^MAX/.test(m[1])) want = Math.max(...vs); else if (/^MIN/.test(m[1])) want = Math.min(...vs); else { assert.strictEqual(sel.length, 1); want = sel[0].name; }
      assert.strictEqual(strip(q.opts[0].t), String(want)); q.opts.slice(1).forEach((o) => assert.notStrictEqual(strip(o.t), String(want)));
    },
    nfform(q) { const t = txt(q); const want = /هواتف/.test(t) ? "1NF" : /رقم_المادة/.test(t) ? "2NF" : /مدينة_القسم/.test(t) ? "3NF" : assert.fail("unknown nf scenario"); assert.strictEqual(strip(q.opts[0].t), want); q.opts.slice(1).forEach((o) => assert.notStrictEqual(strip(o.t), want)); },
    ercard(q) { const [c1, c2] = txt(q).split(": ")[1].split("، و"); const a = /عدة/.test(c1), b = /عدة/.test(c2); const want = !a && !b ? "1:1" : a && b ? "M:N" : "1:N"; assert.ok(strip(q.opts[0].t).includes(want), want + " vs " + q.opts[0].t);
      q.opts.slice(1).forEach((o) => assert.ok(!strip(o.t).includes(want))); }
  };
};
