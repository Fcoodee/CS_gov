/* اختبارات المولِّدات: إعادة حساب مستقلة من params، لا من منطق المولِّد. */
"use strict";
const assert = require("assert");
const G = require("../js/generators.js");
const SEEDS = +process.env.SEEDS || 400;

const strip = (t) => t.replace(/`/g, "");
/* محلّل عبارات منطقية مستقل: + أو، · و، ~ نفي */
function evalBool(src, env) {
  const s = src.replace(/\s+/g, ""); let i = 0;
  const expr = () => { let v = term(); while (s[i] === "+") { i++; v = v | term(); } return v; };
  const term = () => { let v = factor(); while (s[i] === "·") { i++; v = v & factor(); } return v; };
  const factor = () => {
    const c = s[i];
    if (c === "~") { i++; return 1 - factor(); }
    if (c === "(") { i++; const v = expr(); assert.strictEqual(s[i], ")"); i++; return v; }
    if (c === "1" || c === "0") { i++; return +c; }
    assert.ok(/[A-Z]/.test(c), "bad token " + c + " in " + src); i++; assert.ok(c in env, "unknown var " + c); return env[c];
  };
  const v = expr(); assert.strictEqual(i, s.length, "trailing in " + src); return v;
}
function tt(src, names) {
  const out = [];
  for (let m = 0; m < (1 << names.length); m++) {
    const env = {}; names.forEach((n, k) => (env[n] = (m >> (names.length - 1 - k)) & 1));
    out.push(evalBool(src, env));
  }
  return out.join("");
}
const same = (a, b, names) => tt(a, names) === tt(b, names);
const parseM = (t) => { const m = /\{\{([^}]+)\}\}/.exec(t)[1]; return m.split(";").map((r) => r.split(",").map(Number)); };
const det = (m) => m[0][0] * m[1][1] - m[0][1] * m[1][0];
const mul = (x, y) => [0, 1].map((i) => [0, 1].map((j) => x[i][0] * y[0][j] + x[i][1] * y[1][j]));

function generic(q, tpl, seed) {
  const tag = tpl + "#" + seed;
  assert.strictEqual(q.opts.length, 4, tag);
  assert.strictEqual(new Set(q.opts.map((o) => o.t)).size, 4, tag + " distinct options");
  assert.strictEqual(q.ans, 0, tag);
  assert.ok(q.steps.length >= 2 && q.verify && q.hint && q.concept && q.stem, tag + " fields");
  assert.deepStrictEqual(Object.keys(q.traces).sort(), ["1", "2", "3"], tag + " traces");
  for (let i = 1; i <= 3; i++) {
    const tr = q.traces[i];
    assert.ok(tr.name && tr.steps.length >= 2, tag + " trace " + i);
    assert.strictEqual(tr.result, q.opts[i].t, tag + " trace result == option");
  }
  const js = JSON.stringify(q);
  assert.ok(!/undefined|NaN|Infinity|null/.test(js), tag + " bad token: " + (js.match(/.{20}(undefined|NaN|Infinity|null).{20}/) || [""])[0]);
  q.opts.forEach((o) => assert.ok(o.why && o.why.length > 3, tag + " why"));
}

const checks = {
  hex2bin(q) { const v = parseInt(q.params.hex, 16); assert.strictEqual(strip(q.opts[0].t), v.toString(2)); q.opts.slice(1).forEach((o) => assert.notStrictEqual(parseInt(strip(o.t), 2), v)); },
  bin2oct(q) { const v = parseInt(q.params.bin, 2); assert.strictEqual(strip(q.opts[0].t), v.toString(8)); q.opts.slice(1).forEach((o) => assert.notStrictEqual(strip(o.t), v.toString(8))); },
  dec2hex(q) { const n = q.params.n; assert.strictEqual(strip(q.opts[0].t), n.toString(16).toUpperCase()); q.opts.slice(1).forEach((o) => assert.notStrictEqual(strip(o.t), n.toString(16).toUpperCase())); },
  binarith(q) { const { op, a, b } = q.params; const v = op === "+" ? a + b : a - b; assert.ok(v > 0); assert.strictEqual(parseInt(strip(q.opts[0].t), 2), v); q.opts.slice(1).forEach((o) => assert.notStrictEqual(parseInt(strip(o.t), 2), v));
    const m = /`([01]+) ([+−-]) ([01]+)`/.exec(q.stem.replace("−", "−")); assert.ok(m && parseInt(m[1], 2) === a && parseInt(m[3], 2) === b); },
  binmul(q) { const { a, b } = q.params; assert.strictEqual(parseInt(strip(q.opts[0].t), 2), a * b); q.opts.slice(1).forEach((o) => assert.notStrictEqual(parseInt(strip(o.t), 2), a * b)); },
  twos(q) { const n = q.params.n; const sg = (t) => { const v = parseInt(strip(t), 2); return v > 127 ? v - 256 : v; };
    assert.strictEqual(sg(q.opts[0].t), -n); assert.strictEqual(strip(q.opts[0].t).length, 8); q.opts.slice(1).forEach((o) => assert.notStrictEqual(sg(o.t), -n)); },
  oct2dec(q) { const v = parseInt(q.params.oct, 8); assert.strictEqual(+strip(q.opts[0].t), v); q.opts.slice(1).forEach((o) => assert.notStrictEqual(+strip(o.t), v)); },
  demorgan(q) { const { x, y } = q.params; const e = /`([^`]+)`/.exec(q.stem)[1]; assert.ok(same(e, strip(q.opts[0].t), [x, y]), e + " vs " + q.opts[0].t); q.opts.slice(1).forEach((o) => assert.ok(!same(e, strip(o.t), [x, y]))); },
  simplify(q) { const { x, y } = q.params; const e = /`([^`]+)`/.exec(q.stem)[1]; assert.ok(same(e, strip(q.opts[0].t), [x, y]), e); q.opts.slice(1).forEach((o) => assert.ok(!same(e, strip(o.t), [x, y]))); },
  truthcount(q) { const names = q.params.names; const t = tt(q.params.expr, names); const k = [...t].filter((c) => c === "1").length; assert.strictEqual(+strip(q.opts[0].t), k); q.opts.slice(1).forEach((o) => assert.notStrictEqual(+strip(o.t), k)); assert.deepStrictEqual(q.params.ones, [...t].map((c, i) => (c === "1" ? i : -1)).filter((i) => i >= 0)); },
  kmap3(q) { const { names, set } = q.params; const want = Array.from({ length: 8 }, (_, i) => (set.includes(i) ? "1" : "0")).join("");
    assert.strictEqual(tt(strip(q.opts[0].t), names), want); q.opts.slice(1).forEach((o) => assert.notStrictEqual(tt(strip(o.t), names), want));
    // البساطة: لا يوجد غطاء بعدد حدود أقل (فحص خشن: لا حدّ بلا لا لزوم، أي عدد الحدود ≤ عدد الحدود الدنيا)
    assert.ok(strip(q.opts[0].t).split("+").length <= set.length); },
  det2(q) { const m = q.params.m; assert.strictEqual(+strip(q.opts[0].t), det(m)); q.opts.slice(1).forEach((o) => assert.notStrictEqual(+strip(o.t), det(m))); },
  matmul2(q) { const { A, B } = q.params; assert.deepStrictEqual(parseM(q.opts[0].t), mul(A, B)); q.opts.slice(1).forEach((o) => assert.notDeepStrictEqual(parseM(o.t), mul(A, B))); },
  inv2(q) { const m = q.params.m; const D = det(m); const val = (t) => { const f = /`1\/(\d+)`/.exec(t); const k = f ? 1 / +f[1] : 1; return parseM(t).map((r) => r.map((x) => x * k)); };
    const I = mul(m, val(q.opts[0].t)); I.forEach((r, i) => r.forEach((x, j) => assert.ok(Math.abs(x - (i === j ? 1 : 0)) < 1e-9, "A*inv != I")));
    q.opts.slice(1).forEach((o) => { const P = mul(m, val(o.t)); assert.ok(P.some((r, i) => r.some((x, j) => Math.abs(x - (i === j ? 1 : 0)) > 1e-9)), "wrong option is an inverse"); }); assert.ok(D > 0); },
  singular(q) { assert.strictEqual(det(parseM(q.opts[0].t)), 0); q.opts.slice(1).forEach((o) => assert.notStrictEqual(det(parseM(o.t)), 0)); },
  matsize(q) { const { m, n, p, q: qq } = q.params; const dims = (t) => { const x = /(\d+)×(\d+)/.exec(t); return x ? [+x[1], +x[2]] : null; };
    if (n === p) assert.deepStrictEqual(dims(q.opts[0].t), [m, qq]); else assert.strictEqual(q.opts[0].t, "غير معرّف");
    q.opts.slice(1).forEach((o) => { if (n === p) assert.notDeepStrictEqual(dims(o.t), [m, qq]); else assert.notStrictEqual(o.t, "غير معرّف"); });
    assert.ok(q.opts.filter((o) => o.t === "غير معرّف").length === 1); }
};

let n = 0; const seen = {};
for (const tpl of G.templates) {
  assert.ok(checks[tpl], "missing check for " + tpl);
  const sigs = new Set();
  for (let seed = 1; seed <= SEEDS; seed++) {
    const q = G.make(tpl, seed);
    generic(q, tpl, seed); checks[tpl](q); n++;
    sigs.add(q.stem + "|" + q.opts.map((o) => o.t).join(","));
    // حتمية: نفس البذرة تعطي النسخة نفسها
    if (seed % 50 === 0) assert.deepStrictEqual(JSON.parse(JSON.stringify(G.make(tpl, seed))), JSON.parse(JSON.stringify(q)));
  }
  seen[tpl] = sigs.size;
  assert.ok(sigs.size >= 12, tpl + " has too little variety: " + sigs.size);
}
console.log("OK", n, "generated questions;", "distinct stems per template:", JSON.stringify(seen));
