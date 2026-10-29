/* مولِّدات المعيار 7 (الأمن السيبراني): قيصر، فيجنر، فضاء المفاتيح. مولَّدة آليًا وغير مراجَعة رسميًا. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory(require("./generators.js"));
  else factory(root.CSGen);
})(typeof self !== "undefined" ? self : this, function (G) {
  "use strict";
  var H = G.helpers, build = H.build, need = H.need;
  var REF3 = "ص139–140";
  function ex(s) { return "`" + s + "`"; }
  function W(w) { return { t: ex(w.t), name: w.name, why: w.why, steps: w.steps }; }
  function pick3(r, ok, cands, generic) {
    var seen = {}; seen[ok] = 1; var out = [];
    cands.forEach(function (c) { if (c.t !== ok && !seen[c.t] && out.length < 3) { seen[c.t] = 1; out.push(c); } });
    var g = 0; while (out.length < 3 && g++ < 60) { var c2 = generic(r); if (!seen[c2.t]) { seen[c2.t] = 1; out.push(c2); } }
    need(out.length === 3, "not enough wrongs"); return out;
  }
  var A = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  function sh(s, k) { return s.split("").map(function (c) { return A[(A.indexOf(c) + k + 26 * 10) % 26]; }).join(""); }
  var WORDS = ["CYBER", "SECURE", "HELLO", "NETWORK", "ACCESS", "SHIELD", "SYSTEM", "PRIVACY", "DEFEND", "SAUDI", "VISION", "CIPHER"];

  /* 1) شيفرة قيصر: تشفير أو فك */
  G.register("caesar", { std: 7, ind: 3, lvl: "تطبيق", ref: REF3, name: "شيفرة قيصر", gen: function (r) {
    var w = r.pick(WORDS), k = r.int(1, 25), dec = r.int(0, 1) === 1;
    var plain = w, cipher = sh(w, k), given = dec ? cipher : plain, ok = dec ? plain : cipher;
    var cands = dec ? [{ t: sh(given, k), name: "الإزاحة في الاتجاه الخاطئ", why: "فك التشفير يعاكس اتجاه الإزاحة.", steps: ["فك التشفير = إزاحة بمقدار −" + k + ".", "أُزيحت الحروف بمقدار +" + k + " فضلت."] },
        { t: sh(given, -(k + 1)), name: "خطأ بمقدار واحد", why: "أُزيح بمقدار " + (k + 1) + " بدل " + k + ".", steps: ["المفتاح " + k + " لا " + (k + 1) + ".", "الصحيح " + ok + "."] },
        { t: sh(given, -(k - 1)), name: "خطأ بمقدار واحد", why: "أُزيح بمقدار " + (k - 1) + " بدل " + k + ".", steps: ["المفتاح " + k + " لا " + (k - 1) + ".", "الصحيح " + ok + "."] }] :
      [{ t: sh(given, -k), name: "الإزاحة في الاتجاه الخاطئ", why: "التشفير يزيح الحروف للأمام.", steps: ["التشفير = إزاحة بمقدار +" + k + ".", "أُزيحت بمقدار −" + k + " فضلت."] },
        { t: sh(given, k + 1), name: "خطأ بمقدار واحد", why: "أُزيح بمقدار " + (k + 1) + " بدل " + k + ".", steps: ["المفتاح " + k + " لا " + (k + 1) + ".", "الصحيح " + ok + "."] },
        { t: sh(given, k - 1), name: "خطأ بمقدار واحد", why: "أُزيح بمقدار " + (k - 1) + " بدل " + k + ".", steps: ["المفتاح " + k + " لا " + (k - 1) + ".", "الصحيح " + ok + "."] }];
    var ws = pick3(r, ok, cands, function (rr) { return { t: sh(ok, rr.int(1, 25)), name: "إزاحة عشوائية", why: "إزاحة غير مطابقة للمفتاح.", steps: ["طبّق الإزاحة " + (dec ? "العكسية" : "الأمامية") + " على كل حرف.", "الصحيح " + ok + "."] }; });
    var f = given[0], t0 = ok[0];
    return build({ tpl: "caesar", ind: 3, lvl: "تطبيق", ref: REF3, params: { w: w, k: k, dec: dec },
      stem: (dec ? "نص مشفّر بشيفرة قيصر بمفتاح (إزاحة) " + k + " هو " + ex(given) + " . ما النص الأصلي؟" : "شفّر الكلمة " + ex(given) + " بشيفرة قيصر بمفتاح (إزاحة) " + k + " . ما النص المشفّر؟"),
      correct: { t: ex(ok), why: dec ? "إزاحة كل حرف " + k + " خطوة للخلف." : "إزاحة كل حرف " + k + " خطوة للأمام." },
      wrongs: ws.map(W),
      steps: ["قيصر: كل حرف يُزاح " + (dec ? "للخلف" : "للأمام") + " بمقدار " + k + " في الأبجدية (بدوران).", "الحرف الأول: " + f + " → " + t0 + ".", "النتيجة " + ok + "."],
      verify: dec ? "تحقق: تشفير " + ok + " بمفتاح " + k + " يعيد " + given + "." : "تحقق: فك " + ok + " بمفتاح " + k + " يعيد " + given + ".",
      hint: dec ? "فك التشفير = عكس اتجاه الإزاحة." : "ابدأ بالحرف الأول: كم موضعًا تتقدم؟", concept: "قيصر: C = (P + k) mod 26 ؛ P = (C − k) mod 26." });
  } });

  /* 2) فيجنر بمفتاح قصير */
  G.register("vigenere", { std: 7, ind: 3, lvl: "تطبيق", ref: REF3, name: "شيفرة فيجنر", gen: function (r) {
    var p = r.pick(["HELLO", "CYBER", "SAUDI", "ACCESS", "DEFEND", "SHIELD"]), key = r.pick(["KEY", "SUN", "CAT", "BAD", "ODE", "FOX"]);
    var enc = function (s, k, dir) { return s.split("").map(function (c, i) { return A[(A.indexOf(c) + dir * A.indexOf(k[i % k.length]) + 26) % 26]; }).join(""); };
    var ok = enc(p, key, 1);
    var cands = [{ t: enc(p, key, -1), name: "طرح المفتاح بدل جمعه", why: "التشفير يجمع قيمة حرف المفتاح.", steps: ["التشفير: P + K (باقي 26).", "طُرح K فضلّ."] },
      { t: p.split("").map(function (c, i) { return A[(A.indexOf(c) + A.indexOf(key[0])) % 26]; }).join(""), name: "استعمال أول حرف من المفتاح فقط", why: "فيجنر يكرر المفتاح حرفًا بحرف.", steps: ["كل حرف في النص يقابله حرف مختلف من المفتاح بالتناوب.", "استُعمل حرف واحد (" + key[0] + ") فصارت الشيفرة قيصر."] },
      { t: p.split("").map(function (c, i) { return A[(A.indexOf(c) + A.indexOf(key[i % key.length]) + 1) % 26]; }).join(""), name: "ترقيم الأبجدية من 1", why: "A = 0 لا 1.", steps: ["قيمة A تساوي 0 في الحساب.", "أُضيف واحد زائد فضلّ."] },
      { t: p.split("").map(function (c, i) { return A[(A.indexOf(c) + A.indexOf(key[(i + 1) % key.length])) % 26]; }).join(""), name: "إزاحة محاذاة المفتاح", why: "المفتاح يبدأ من أول حرف.", steps: ["الحرف الأول من النص يقابل أول حرف من المفتاح.", "بدأ التطبيق من الحرف الثاني فضلّ."] }];
    var ws = pick3(r, ok, cands, function (rr) { return { t: sh(ok, rr.int(1, 25)), name: "إزاحة عشوائية", why: "غير مطابقة.", steps: ["اجمع كل حرف مع حرف المفتاح المقابل.", "الصحيح " + ok + "."] }; });
    var first = A[(A.indexOf(p[0]) + A.indexOf(key[0])) % 26];
    return build({ tpl: "vigenere", ind: 3, lvl: "تطبيق", ref: REF3, params: { p: p, key: key },
      stem: "شفّر الكلمة " + ex(p) + " بشيفرة فيجنر بالمفتاح " + ex(key) + " (A=0، B=1، …، Z=25). ما النص المشفّر؟",
      correct: { t: ex(ok), why: "كل حرف يُجمع مع حرف المفتاح المقابل (باقي 26)." }, wrongs: ws.map(W),
      steps: ["نكرر المفتاح تحت النص: " + p.split("").map(function (_, i) { return key[i % key.length]; }).join("") + ".", "الحرف الأول: " + p[0] + "(" + A.indexOf(p[0]) + ") + " + key[0] + "(" + A.indexOf(key[0]) + ") = " + first + ".", "نكمل بالمثل فنحصل على " + ok + "."],
      verify: "فك الشيفرة يطرح المفتاح ويعيد " + p + ".", hint: "اكتب المفتاح متكررًا تحت النص ثم اجمع حرفًا بحرف.", concept: "فيجنر: C_i = (P_i + K_i) mod 26 مع تكرار المفتاح." });
  } });

  /* 3) عدد المفاتيح الممكنة */
  G.register("keyspace", { std: 7, ind: 3, lvl: "تطبيق", ref: "ص136–143", name: "عدد المفاتيح الممكنة", gen: function (r) {
    var kind = r.pick(["bits", "hex", "pin", "alpha"]), n = r.int(3, 8), base, ok, stem, why;
    if (kind === "bits") { n = r.int(4, 12); ok = Math.pow(2, n); stem = "مفتاح تشفير طوله " + n + " بتًّا. كم عدد المفاتيح الممكنة؟"; why = "2^" + n + " = " + ok + "."; base = 2; }
    else if (kind === "hex") { n = r.int(2, 5); ok = Math.pow(16, n); stem = "مفتاح مكوَّن من " + n + " خانات بالنظام السداسي العشري (0–F). كم عدد المفاتيح الممكنة؟"; why = "16^" + n + " = " + ok + "."; base = 16; }
    else if (kind === "pin") { n = r.int(3, 6); ok = Math.pow(10, n); stem = "رمز سري من " + n + " أرقام عشرية. كم عدد الرموز الممكنة؟"; why = "10^" + n + " = " + ok + "."; base = 10; }
    else { n = r.int(2, 4); ok = Math.pow(26, n); stem = "كلمة سر من " + n + " حروف إنجليزية كبيرة فقط (26 حرفًا). كم عدد الكلمات الممكنة؟"; why = "26^" + n + " = " + ok + "."; base = 26; }
    var cands = [{ t: String(base * n), name: "ضرب بدل الأس", why: "العدد يتضاعف بعدد الخانات: أس لا ضرب.", steps: [base + " × " + n + " = " + (base * n) + " خطأ.", "الصحيح " + base + "^" + n + " = " + ok + "."] },
      { t: String(Math.pow(n, base > 100 ? 2 : base)), name: "عكس الأساس والأس", why: "الأساس " + base + " والأس " + n + ".", steps: ["الأساس هو عدد الرموز في الخانة الواحدة.", "الصحيح " + ok + "."] },
      { t: String(ok - 1), name: "طرح واحد", why: "كل التراكيب تُحسب.", steps: ["كل المفاتيح ممكنة بما فيها الأول.", "الصحيح " + ok + "."] },
      { t: String(ok * base), name: "خانة زائدة", why: "عدد الخانات " + n + " لا " + (n + 1) + ".", steps: ["الأس " + n + ".", "الصحيح " + ok + "."] },
      { t: String(Math.pow(base, n) / base), name: "خانة ناقصة", why: "عدد الخانات " + n + " لا " + (n - 1) + ".", steps: ["الأس " + n + ".", "الصحيح " + ok + "."] }];
    var ws = pick3(r, String(ok), cands, function (rr) { return { t: String(ok + rr.pick([10, 100, 2, 5])), name: "حساب خاطئ", why: "ناتج غير مطابق.", steps: ["العدد = (عدد الرموز)^(عدد الخانات).", "الصحيح " + ok + "."] }; });
    return build({ tpl: "keyspace", ind: 3, lvl: "تطبيق", ref: "ص136–143", params: { kind: kind, n: n, base: base },
      stem: stem, correct: { t: String(ok), why: why }, wrongs: ws.map(function (w) { return { t: w.t, name: w.name, why: w.why, steps: w.steps }; }),
      steps: ["لكل خانة " + base + " احتمالًا.", "عدد الخانات " + n + " فعدد التراكيب " + base + "^" + n + ".", "= " + ok + "."], verify: "إضافة خانة واحدة تضاعف العدد " + base + " مرة.", hint: "كم احتمالًا لكل خانة؟ وكم خانة؟", concept: "فضاء المفاتيح = (عدد الرموز)^(الطول)؛ كل بت إضافي يضاعفه." });
  } });
  return G;
});
