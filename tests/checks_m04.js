/* فحوص مستقلة لمولِّدات المعيار 4: إعادة حساب من نص السؤال لا من منطق المولِّد */
"use strict";
module.exports = function (assert, strip) {
  const parseIp = (s) => s.split(".").map(Number);
  const grab = (q, re) => { const m = re.exec(q.stem.replace(/`/g, "")); assert.ok(m, "cannot parse stem: " + q.stem); return m; };
  const cls = (o) => (o < 128 ? "A" : o < 192 ? "B" : o < 224 ? "C" : "D");
  return {
    ipclass(q) { const ip = parseIp(grab(q, /(\d+\.\d+\.\d+\.\d+)/)[1]); const want = "الفئة " + cls(ip[0]); assert.strictEqual(strip(q.opts[0].t), want);
      q.opts.slice(1).forEach((o) => assert.notStrictEqual(strip(o.t), want)); assert.ok(ip[0] !== 127 && ip[0] >= 1 && ip[0] <= 239); },
    netaddr(q) { const m = grab(q, /(\d+\.\d+\.\d+\.\d+).*?(\d+\.\d+\.\d+\.\d+).*?\/(\d+)/); const ip = parseIp(m[1]), mask = parseIp(m[2]), p = +m[3];
      assert.strictEqual(mask.map((b) => b.toString(2).padStart(8, "0")).join("").replace(/0+$/, "").length, p, "mask/prefix mismatch");
      const want = ip.map((v, i) => v & mask[i]).join("."); assert.strictEqual(strip(q.opts[0].t), want);
      q.opts.slice(1).forEach((o) => assert.notStrictEqual(strip(o.t), want)); },
    hostcount(q) { const p = +grab(q, /\/(\d+)/)[1]; const want = String(2 ** (32 - p) - 2); assert.strictEqual(strip(q.opts[0].t), want);
      q.opts.slice(1).forEach((o) => assert.notStrictEqual(strip(o.t), want)); },
    topolinks(q) { const { t, n } = q.params; const want = t === "mesh" ? (n * (n - 1)) / 2 : n; assert.ok(q.stem.includes(" " + n + " ")); assert.strictEqual(+strip(q.opts[0].t), want);
      q.opts.slice(1).forEach((o) => assert.notStrictEqual(+strip(o.t), want)); }
  };
};
