/* فحوص مستقلة لمولِّدات المعيار 5: تتبّع الشيفرة بمحاكاة منفصلة */
"use strict";
module.exports = function (assert, strip) {
  const txt = (q) => q.stem.replace(/`/g, "");
  const rng = (a, b, s) => { const o = []; for (let i = a; i < b; i += s) o.push(i); return o; };
  const lst = (a) => "[" + a.join(", ") + "]";
  const nots = (q, want) => q.opts.slice(1).forEach((o) => assert.notStrictEqual(strip(o.t), want));
  const parseTree = (s) => { const ch = {}; for (const part of /ثنائية.*?: (.*?)\. ما/.exec(s)[1].split("؛")) { const [p, c] = part.split("←").map((x) => x.trim()); ch[p] = c.split("،").map((x) => x.trim()); } return ch; };
  return {
    rangecount(q) { const m = /range\((\d+), (\d+), (\d+)\)/.exec(txt(q)); const n = rng(+m[1], +m[2], +m[3]).length; assert.strictEqual(+strip(q.opts[0].t), n); nots(q, String(n)); },
    rangesum(q) { const m = /range\((\d+), (\d+), (\d+)\)/.exec(txt(q)); const s = rng(+m[1], +m[2], +m[3]).reduce((x, y) => x + y, 0); assert.strictEqual(+strip(q.opts[0].t), s); nots(q, String(s)); },
    stackops(q) { const ops = /: (.*?) \. /.exec(txt(q))[1].split(", "); const st = []; ops.forEach((o) => { if (o === "Pop") { assert.ok(st.length > 0, "underflow"); st.pop(); } else st.push(+/\((\d+)\)/.exec(o)[1]); });
      const want = /قمة/.test(q.stem) ? st[st.length - 1] : st.length; assert.strictEqual(+strip(q.opts[0].t), want); nots(q, String(want)); },
    queueops(q) { const ops = /: (.*?) \. /.exec(txt(q))[1].split(", "); const d = []; ops.forEach((o) => { if (o === "Dequeue") { assert.ok(d.length > 0); d.shift(); } else d.push(+/\((\d+)\)/.exec(o)[1]); });
      const want = /Front/.test(q.stem) ? d[0] : d[d.length - 1]; assert.strictEqual(+strip(q.opts[0].t), want); nots(q, String(want)); },
    treetrav(q) { const ch = parseTree(txt(q)); const order = []; const bfs = ["A"]; while (bfs.length) { const x = bfs.shift(); order.push(x); (ch[x] || []).forEach((c) => bfs.push(c)); }
      const dfs = []; (function d(x) { dfs.push(x); (ch[x] || []).forEach(d); })("A");
      const isB = /BFS/.test(q.stem.split("في البحث")[1]); const want = (isB ? order : dfs).join(" "); assert.strictEqual(strip(q.opts[0].t), want); nots(q, want); assert.deepStrictEqual(q.params.ch && Object.keys(q.params.ch).length >= order.length, true);
      assert.ok(Object.values(ch).every((c) => c.length <= 2), "not binary"); assert.strictEqual(order.length, new Set(order).size); },
    treeprops(q) { const { t, n, d } = q.params; const want = t === "edges" ? n - 1 : t === "levelmax" ? 2 ** (d - 1) : 2 ** d - 1; assert.strictEqual(+strip(q.opts[0].t), want); nots(q, String(want)); },
    pylist(q) { const a = JSON.parse(/a = (\[[^\]]*\])/.exec(txt(q))[1]); const e = /ناتج (.*?) \؟/.exec(txt(q))[1].trim(); let want;
      if (e === "len(a)") want = String(a.length); else if (e === "a[::-1]") want = lst(a.slice().reverse()); else if (/^a\[::(\d+)\]$/.test(e)) { const s = +/::(\d+)/.exec(e)[1]; want = lst(a.filter((_, i) => i % s === 0)); }
      else if (/^a\[-(\d+)\]$/.test(e)) want = String(a[a.length - +/-(\d+)/.exec(e)[1]]); else if (/^a\[(\d+):(\d+)\]$/.test(e)) { const m = /(\d+):(\d+)/.exec(e); want = lst(a.slice(+m[1], +m[2])); } else if (/^a\[(\d+)\]$/.test(e)) want = String(a[+/(\d+)/.exec(e)[1]]); else assert.fail("unknown expr " + e);
      assert.strictEqual(strip(q.opts[0].t), want); nots(q, want); },
    pyops(q) { const m = /(\d+) (\/\/|%|\*\*) (\d+)/.exec(txt(q)); const a = +m[1], b = +m[3]; const want = m[2] === "//" ? Math.floor(a / b) : m[2] === "%" ? a % b : a ** b; assert.strictEqual(+strip(q.opts[0].t), want); nots(q, String(want)); },
    incdec(q) { const b0 = +/b = (\d+)/.exec(txt(q))[1]; const pre = /\+\+b/.test(txt(q)); const a = pre ? b0 + 1 : b0; const want = "a = " + a + ", b = " + (b0 + 1); assert.strictEqual(strip(q.opts[0].t), want); nots(q, want); }
  };
};
