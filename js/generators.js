/* مولِّدات أسئلة المعيار 1 (الرياضيات) — تعمل في المتصفح وفي Node.
 * كل نسخة (instance) تُولَّد من قالب + بذرة، وتحمل: صيغة السؤال، 4 خيارات (الصحيح أولًا)،
 * خطوات الحل، التحقق، وتتبّع خطأ لكل مشتّت. نموذج الخطأ مسمّى ومحسوب، لا عشوائي.
 * الأسئلة مولَّدة آليًا وغير مراجَعة رسميًا. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.CSGen = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  /* ---------- أدوات ---------- */
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function RNG(seed) {
    var f = mulberry32(seed >>> 0);
    return {
      int: function (a, b) { return a + Math.floor(f() * (b - a + 1)); },
      pick: function (arr) { return arr[Math.floor(f() * arr.length)]; },
      shuffle: function (arr) {
        var a = arr.slice();
        for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(f() * (i + 1)); var x = a[i]; a[i] = a[j]; a[j] = x; }
        return a;
      }
    };
  }
  function Collision(msg) { this.message = msg || "collision"; }
  function need(c, m) { if (!c) throw new Collision(m); }
  function bin(n, w) { var s = n.toString(2); while (s.length < (w || 0)) s = "0" + s; return s; }
  function stripZ(s) { var t = s.replace(/^0+/, ""); return t === "" ? "0" : t; }
  function B(s) { return "`" + s + "`"; }
  function M(rows) { return "{{" + rows.map(function (r) { return r.join(","); }).join(";") + "}}"; }
  function det2(m) { return m[0][0] * m[1][1] - m[0][1] * m[1][0]; }
  function mul2(x, y) {
    return [0, 1].map(function (i) { return [0, 1].map(function (j) { return x[i][0] * y[0][j] + x[i][1] * y[1][j]; }); });
  }

  function build(s) {
    var wrongs = s.wrongs, texts = [s.correct.t].concat(wrongs.map(function (w) { return w.t; }));
    need(wrongs.length === 3, "need 3 wrongs");
    need(new Set(texts).size === 4, "duplicate options");
    var traces = {};
    wrongs.forEach(function (w, i) { traces[i + 1] = { name: w.name, steps: w.steps, result: w.t }; });
    return {
      tpl: s.tpl, ind: s.ind, lvl: s.lvl, ref: s.ref, gen: true, extra: false,
      stem: s.stem,
      opts: [{ t: s.correct.t, why: s.correct.why }].concat(wrongs.map(function (w) { return { t: w.t, why: w.why }; })),
      ans: 0, hint: s.hint, concept: s.concept, steps: s.steps, verify: s.verify, traces: traces, params: s.params
    };
  }

  /* ---------- جبر منطقي: دوال وصيغ ---------- */
  var NAMES = ["A", "B", "C", "D", "X", "Y", "Z", "P", "Q", "R"];
  function pickNames(r, n) { return r.shuffle(NAMES).slice(0, n); }
  function rows2() { return [[0, 0], [0, 1], [1, 0], [1, 1]]; }
  function firstDiff2(f, g) {
    var rs = rows2();
    for (var i = 0; i < 4; i++) { var a = rs[i][0], b = rs[i][1]; if (f(a, b) !== g(a, b)) return { a: a, b: b, f: f(a, b), g: g(a, b) }; }
    return null;
  }
  function eq2(f, g) { return firstDiff2(f, g) === null; }
  function table2(f) { return rows2().map(function (r) { return "(" + r[0] + "," + r[1] + ")←" + f(r[0], r[1]); }).join(" ، "); }
  function traceDiff(opt, target, n1, n2) {
    var d = firstDiff2(target, opt.f);
    return "عند (" + n1 + "," + n2 + ") = (" + d.a + "," + d.b + "): الدالة المعطاة تساوي " + d.f + " بينما هذا الخيار يعطي " + d.g + ".";
  }
  var N = function (x) { return 1 - x; };

  /* ---------- قوالب ---------- */
  var T = {};

  /* 1) سداسي عشري → ثنائي */
  T.hex2bin = { ind: 1, lvl: "تطبيق", ref: "ص7–9", name: "تحويل سداسي عشري إلى ثنائي", gen: function (r) {
    var HEX = "0123456789ABCDEF", d = [r.int(1, 15), r.int(0, 15), r.int(0, 15)];
    var hex = d.map(function (x) { return HEX[x]; }).join("");
    var groups = d.map(function (x) { return bin(x, 4); });
    var ok = stripZ(groups.join(""));
    var rev = stripZ(groups.slice().reverse().join(""));
    var nopad = d.map(function (x) { return x.toString(2); }).join("");
    var fi = r.int(0, 11), fl = groups.join("").split(""); fl[fi] = fl[fi] === "1" ? "0" : "1";
    var flip = stripZ(fl.join(""));
    need(rev !== ok && nopad !== ok && flip !== ok && d[1] < 8 + 0 && true, "x");
    var gi = Math.floor(fi / 4);
    return build({ tpl: "hex2bin", ind: 1, lvl: "تطبيق", ref: "ص7–9", params: { hex: hex },
      stem: "حوّل العدد " + "[" + hex + "|16] إلى النظام الثنائي.",
      correct: { t: B(ok), why: "كل رقم سداسي عشري يقابل 4 خانات ثنائية: " + groups.join(" | ") + "." },
      wrongs: [
        { t: B(rev), name: "عكس ترتيب المجموعات", why: "عُكس ترتيب المجموعات الأربعية.",
          steps: ["حوّل صحيحًا: " + groups.join(" | ") + ".", "ثم رتّبها من اليمين إلى اليسار بدل اليسار إلى اليمين فنتج " + B(rev) + "."] },
        { t: B(nopad), name: "نسيان ملء كل رقم بأربع خانات", why: "حُذفت الأصفار اليسارية داخل المجموعات.",
          steps: ["حوّل كل رقم بلا ملء: " + d.map(function (x, i) { return B(HEX[x] + "←" + x.toString(2)); }).join(" ، ") + ".", "الجمع بلا ملء يضيّع مواضع الخانات فنتج " + B(nopad) + " وطوله " + nopad.length + " بدل " + ok.length + "."] },
        { t: B(flip), name: "خطأ في خانة واحدة", why: "قُلبت خانة واحدة من الناتج الصحيح.",
          steps: ["المجموعات الصحيحة: " + groups.join(" | ") + ".", "في المجموعة رقم " + (gi + 1) + " قُلبت خانة واحدة فنتج " + B(flip) + ".", "اختبار العودة: تحويل الناتج إلى سداسي عشري لا يعيد " + hex + "."] }
      ],
      steps: [
        "كل رقم سداسي عشري يقابل 4 خانات ثنائية، لأن 16 = 2⁴.",
        "حوّل كل رقم: " + d.map(function (x, i) { return B(HEX[x] + " = " + groups[i]); }).join(" ، ") + ".",
        "ضع المجموعات بالترتيب وأزل الأصفار اليسارية: " + B(ok) + "."
      ],
      verify: "تحقق بالعودة: قسّم " + B(ok) + " من اليمين إلى رباعيات فتحصل على " + bin(parseInt(ok, 2), Math.ceil(ok.length / 4) * 4).match(/.{4}/g).join(" | ") + " أي " + hex + ".",
      hint: "كل رقم سداسي عشري = كم خانة ثنائية؟ وهل تحتفظ بالأصفار داخل المجموعات؟",
      concept: "16 = 2⁴ فالتحويل بين السداسي عشري والثنائي مباشر: رقم ↔ 4 خانات." });
  } };

  /* 2) ثنائي → ثماني */
  T.bin2oct = { ind: 1, lvl: "تطبيق", ref: "ص7–9", name: "تحويل ثنائي إلى ثماني", gen: function (r) {
    var len = r.pick([7, 8, 10]), v = r.int(1 << (len - 1), (1 << len) - 1), b = bin(v, len);
    var oct = v.toString(8);
    var padL = b; while (padL.length % 3) padL = "0" + padL;
    var gL = padL.match(/.{3}/g);
    var padR = b; while (padR.length % 3) padR += "0";
    var leftGrp = padR.match(/.{3}/g).map(function (x) { return parseInt(x, 2); }).join("");
    var dec = String(v);
    var o = oct.split(""), k = -1;
    for (var i = 0; i < o.length - 1; i++) if (o[i] !== o[i + 1]) { k = i; break; }
    need(k >= 0, "no swap");
    var t = o[k]; o[k] = o[k + 1]; o[k + 1] = t; var sw = o.join("");
    need(sw[0] !== "0", "leading zero");
    need(leftGrp !== oct && dec !== oct, "x");
    return build({ tpl: "bin2oct", ind: 1, lvl: "تطبيق", ref: "ص7–9", params: { bin: b },
      stem: "حوّل العدد " + "[" + b + "|2] إلى النظام الثماني.",
      correct: { t: B(oct), why: "تجميع من اليمين إلى ثلاثيات: " + gL.join(" | ") + "." },
      wrongs: [
        { t: B(leftGrp), name: "التجميع من اليسار", why: "بدأ التجميع من الطرف الخطأ.",
          steps: ["جمّع من اليسار وأكمل الأخيرة بأصفار يمينية: " + padR.match(/.{3}/g).join(" | ") + ".", "فنتج " + B(leftGrp) + "؛ والتجميع الصحيح يبدأ من اليمين."] },
        { t: B(dec), name: "كتابة القيمة العشرية", why: "ذُكرت القيمة العشرية بدل التمثيل الثماني.",
          steps: ["حسب قيمة العدد: " + B(b + " = " + v) + " عشريًا.", "ثم كتبها كأنها الناتج الثماني، وهذا خلط بين القيمة والتمثيل."] },
        { t: B(sw), name: "إبدال موضع رقمين", why: "بُدِّل موضع رقمين متجاورين.",
          steps: ["الأرقام الصحيحة: " + gL.map(function (x) { return parseInt(x, 2); }).join("، ") + ".", "بُدِّل موضع رقمين متجاورين فنتج " + B(sw) + "."] }
      ],
      steps: [
        "كل رقم ثماني يقابل 3 خانات ثنائية، لأن 8 = 2³.",
        "قسّم من اليمين إلى ثلاثيات وأكمل الأخيرة بأصفار يسارية: " + B(gL.join(" | ")) + ".",
        "حوّل كل ثلاثية: " + gL.map(function (g) { return B(g + " ← " + parseInt(g, 2)); }).join(" ، ") + ".",
        "اجمع الأرقام بالترتيب: " + B(oct) + "."
      ],
      verify: "تحقق بالعشري: " + B(oct + " = " + v) + " و" + B(b + " = " + v) + ". القيمتان متطابقتان.",
      hint: "من أي طرف يبدأ التجميع؟ وكم خانة تقابل الرقم الثماني؟",
      concept: "8 = 2³: تجميع الخانات في ثلاثيات من اليمين." });
  } };

  /* 3) عشري → سداسي عشري */
  T.dec2hex = { ind: 1, lvl: "تطبيق", ref: "ص7–9", name: "تحويل عشري إلى سداسي عشري", gen: function (r) {
    var HEX = "0123456789ABCDEF", n = r.int(256, 4095), hex = n.toString(16).toUpperCase();
    var q1 = Math.floor(n / 16), r1 = n % 16, q2 = Math.floor(q1 / 16), r2 = q1 % 16, r3 = q2 % 16;
    var digs = [HEX[Math.floor(q2 / 16) % 16], HEX[r3], HEX[r2], HEX[r1]].join("").replace(/^0+/, "");
    need(digs === hex, "self-check");
    var rev = hex.split("").reverse().join("");
    var last = hex.length - 1, ld = HEX.indexOf(hex[last]);
    var off = hex.slice(0, last) + HEX[ld === 15 ? 14 : ld + 1];
    var dec = hex.split("").map(function (c) { return String(HEX.indexOf(c)); }).join("");
    need(rev !== hex && dec !== hex && /[A-F]/.test(hex), "x");
    var divs = [], x = n;
    while (x > 0) { divs.push("`" + x + " = 16×" + Math.floor(x / 16) + " + " + (x % 16) + "`" + (x % 16 > 9 ? " ← الباقي " + HEX[x % 16] : "")); x = Math.floor(x / 16); }
    return build({ tpl: "dec2hex", ind: 1, lvl: "تطبيق", ref: "ص7–9", params: { n: n },
      stem: "حوّل العدد العشري " + B(String(n)) + " إلى النظام السداسي عشري.",
      correct: { t: B(hex), why: "القسمة المتكررة على 16 وقراءة البواقي من الأخير إلى الأول." },
      wrongs: [
        { t: B(rev), name: "قراءة البواقي بترتيب الحساب", why: "قُرئت البواقي من الأول إلى الأخير.",
          steps: ["البواقي بترتيب الحساب: " + hex.split("").reverse().join("، ") + ".", "قراءتها كما جاءت تعطي " + B(rev) + "؛ الصحيح من الأخير إلى الأول."] },
        { t: B(off), name: "خطأ في الباقي الأول", why: "الباقي الأول مُسجَّل بقيمة مختلفة.",
          steps: ["الباقي الأول الصحيح " + (n % 16) + " (" + HEX[n % 16] + ").", "سُجِّل رقم مختلف فنتج " + B(off) + "، واختبار الضرب يكشفه: القيمة العائدة لا تساوي " + n + "."] },
        { t: B(dec), name: "كتابة الأرقام 10–15 بالعشري", why: "كُتبت الرموز A–F كأعداد عشرية.",
          steps: ["الأرقام الصحيحة: " + hex.split("").map(function (c) { return String(HEX.indexOf(c)); }).join("، ") + ".", "كُتبت كأعداد عشرية متجاورة فنتج " + B(dec) + "، بينما الأرقام 10–15 ترمز بالحروف A–F."] }
      ],
      steps: [
        "اقسم على 16 مرارًا واحتفظ بالباقي في كل مرة:\n" + divs.join("\n"),
        "الأرقام 10–15 ترمز A–F.",
        "اقرأ البواقي من الأخير إلى الأول: " + B(hex) + "."
      ],
      verify: "تحقق: " + hex.split("").map(function (c, i) { return c + "×16^" + (hex.length - 1 - i); }).join(" + ") + " = " + n + ".",
      hint: "على أي عدد تقسم؟ وبأي ترتيب تُقرأ البواقي؟",
      concept: "التحويل من العشري إلى أساس b بالقسمة المتكررة على b وقراءة البواقي معكوسة." });
  } };

  /* 4) طرح/جمع ثنائي */
  T.binarith = { ind: 1, lvl: "تطبيق", ref: "ص7–9", name: "جمع وطرح ثنائي", gen: function (r) {
    var isSub = r.int(0, 1) === 0, w = 5;
    var a = r.int(12, 31), b = r.int(3, a - 2);
    if (isSub) {
      var res = a - b, x = a ^ b, ok = bin(res), wa = a + b, wb = res - 1;
      need(x !== res && x > 0 && wa !== res && wb >= 0, "x");
      // اطرح عمودًا عمودًا
      var A = bin(a, w).split("").map(Number).reverse(), Bb = bin(b, w).split("").map(Number).reverse(), lines = [], borrow = 0, borrows = 0;
      for (var i = 0; i < w; i++) {
        var x1 = A[i] - borrow; borrow = 0;
        if (x1 < Bb[i]) { x1 += 2; borrow = 1; borrows++; }
        lines.push("الخانة " + i + ": " + B(A[i] + " − " + Bb[i]) + (borrow ? " (استعارة)" : "") + " ← " + B(String(x1 - Bb[i])));
      }
      need(borrows > 0, "no borrow");
      return build({ tpl: "binarith", ind: 1, lvl: "تطبيق", ref: "ص7–9", params: { op: "-", a: a, b: b },
        stem: "ما ناتج " + B(bin(a) + " − " + bin(b)) + " في النظام الثنائي؟",
        correct: { t: B(ok), why: "الطرح عمودًا عمودًا مع الاستعارة." },
        wrongs: [
          { t: B(bin(wa)), name: "الجمع بدل الطرح", why: "نُفِّذ الجمع لا الطرح.", steps: ["بالعشري: " + a + " + " + b + " = " + wa + ".", "هذا ناتج الجمع " + B(bin(wa)) + " لا الطرح."] },
          { t: B(bin(x)), name: "تجاهل الاستعارة (XOR)", why: "طُرحت كل خانة منفردة دون استعارة.",
            steps: ["طرح كل خانة بدون استعارة هو XOR: " + B(bin(a, w) + " ⊕ " + bin(b, w) + " = " + bin(x, w)) + ".", "بالعشري تساوي " + x + " بينما الصحيح " + res + "."] },
          { t: B(bin(wb)), name: "استعارة زائدة", why: "حُسبت استعارة إضافية.", steps: ["الصحيح " + res + " بالعشري.", "استعارة زائدة تنقص الناتج بواحد فيصير " + wb + " أي " + B(bin(wb)) + "."] }
        ],
        steps: ["قدّر بالعشري: " + B(bin(a) + " = " + a) + " و" + B(bin(b) + " = " + b) + " والمتوقع " + res + ".", "ساوِ الطولين واطرح من اليمين:\n" + lines.join("\n"), "اقرأ الناتج من اليسار: " + B(ok) + "."],
        verify: "تحقق بالجمع العكسي: " + B(ok + " + " + bin(b) + " = " + bin(a)) + ".",
        hint: "أين تحتاج إلى استعارة؟ وماذا يحدث للخانة المستعارة منها؟",
        concept: "الطرح الثنائي: إذا كان المطروح أكبر نستعير 1 من الخانة الأعلى فتصير الخانة الحالية +2." });
    }
    var sum = a + b, okA = bin(sum), xa = a ^ b, oa = a | b, wb2 = sum - 1;
    need(xa !== sum && oa !== sum && xa !== oa && wb2 !== xa && wb2 !== oa, "x");
    var A2 = bin(a, w + 1).split("").map(Number).reverse(), B2 = bin(b, w + 1).split("").map(Number).reverse(), c = 0, ln = [];
    for (var j = 0; j <= w; j++) {
      var s = A2[j] + B2[j] + c; ln.push("الخانة " + j + ": " + B(A2[j] + " + " + B2[j] + (c ? " + 1" : "")) + " ← " + B(String(s % 2)) + (s > 1 ? "، حمل 1" : "")); c = s > 1 ? 1 : 0;
    }
    return build({ tpl: "binarith", ind: 1, lvl: "تطبيق", ref: "ص7–9", params: { op: "+", a: a, b: b },
      stem: "ما ناتج " + B(bin(a) + " + " + bin(b)) + " في النظام الثنائي؟",
      correct: { t: B(okA), why: "الجمع عمودًا عمودًا مع الحمل." },
      wrongs: [
        { t: B(bin(xa)), name: "تجاهل الحمل (XOR)", why: "جُمعت كل خانة دون حمل.", steps: ["جمع بلا حمل هو XOR: " + B(bin(a, w) + " ⊕ " + bin(b, w) + " = " + bin(xa, w)) + ".", "بالعشري " + xa + " بدل " + sum + "."] },
        { t: B(bin(oa)), name: "الخلط بين الجمع وOR", why: "استعمل OR بدل الجمع.", steps: ["OR للخانات: " + B(bin(a, w) + " | " + bin(b, w) + " = " + bin(oa, w)) + ".", "بالعشري " + oa + " بدل " + sum + "، لأن 1+1 = 10 لا 1."] },
        { t: B(bin(wb2)), name: "نسيان حمل أخير", why: "فُقد حمل بين الخانات.", steps: ["الصحيح " + sum + " بالعشري.", "فقدان حمل واحد ينقص الناتج بواحد: " + wb2 + " أي " + B(bin(wb2)) + "."] }
      ],
      steps: ["قدّر بالعشري: " + a + " + " + b + " = " + sum + ".", "اجمع من اليمين مع الحمل:\n" + ln.join("\n"), "اقرأ الناتج: " + B(okA) + "."],
      verify: "تحقق بالطرح العكسي: " + B(okA + " − " + bin(b) + " = " + bin(a)) + ".",
      hint: "ماذا يساوي 1 + 1 في النظام الثنائي؟ وأين يذهب الحمل؟",
      concept: "الجمع الثنائي: 1+1 = 10، أي كتابة 0 وحمل 1 إلى الخانة التالية." });
  } };

  /* 5) ضرب ثنائي */
  T.binmul = { ind: 1, lvl: "تطبيق", ref: "ص7–9", name: "ضرب ثنائي", gen: function (r) {
    var a = r.int(5, 31), b = r.pick([3, 5, 6, 7]), prod = a * b;
    var bits = []; for (var i = 0; i < 3; i++) if ((b >> i) & 1) bits.push(i);
    var partials = bits.map(function (i) { return a << i; });
    var sumNoTop = partials.slice(0, -1).reduce(function (x, y) { return x + y; }, 0);
    var pc = bits.length * a;
    var add = a + b;
    need(new Set([prod, sumNoTop, pc, add]).size === 4 && sumNoTop > 0, "x");
    return build({ tpl: "binmul", ind: 1, lvl: "تطبيق", ref: "ص7–9", params: { a: a, b: b },
      stem: "ما ناتج " + B(bin(a) + " × " + bin(b)) + " في النظام الثنائي؟",
      correct: { t: B(bin(prod)), why: "جمع الجداءات الجزئية بعد الإزاحة." },
      wrongs: [
        { t: B(bin(add)), name: "الجمع بدل الضرب", why: "جُمع العددان.", steps: ["بالعشري: " + a + " + " + b + " = " + add + ".", "هذا ناتج الجمع لا الضرب."] },
        { t: B(bin(sumNoTop)), name: "إهمال جداء جزئي", why: "حُذف الجداء الأخير.", steps: ["الجداءات الجزئية: " + partials.map(function (p) { return bin(p); }).join(" ، ") + ".", "أُهمل الأخير فكان المجموع " + sumNoTop + " أي " + B(bin(sumNoTop)) + "."] },
        { t: B(bin(pc)), name: "نسيان الإزاحة", why: "جُمعت الجداءات بلا إزاحة.", steps: ["كل جداء جزئي كتب بلا إزاحة: " + a + " مكررة " + bits.length + " مرات.", "فالمجموع " + pc + " أي " + B(bin(pc)) + "."] }
      ],
      steps: ["قدّر بالعشري: " + a + " × " + b + " = " + prod + ".",
        "حلّل المضروب فيه إلى خاناته الواحدة، وأزِح المضروب بحسب موضع كل واحدة: " + partials.map(function (p, i) { return B(bin(p)) + " (إزاحة " + bits[i] + ")"; }).join(" ، ") + ".",
        "اجمع الجداءات الجزئية: " + B(bin(prod)) + "."],
      verify: "تحقق: " + B(bin(prod)) + " = " + prod + " = " + a + " × " + b + ".",
      hint: "كم جداءً جزئيًا تحتاج؟ وكم تزيح كل واحد؟",
      concept: "الضرب الثنائي = إزاحات وجمع: كل خانة 1 في المضروب فيه تعطي نسخة مزاحة من المضروب." });
  } };

  /* 6) المكمل الثنائي */
  T.twos = { ind: 1, lvl: "تطبيق", ref: "ص7–9", name: "المكمل الثنائي", gen: function (r) {
    var n = r.int(3, 120); need(n !== 64, "x");
    var pos = bin(n, 8), inv = pos.split("").map(function (c) { return c === "1" ? "0" : "1"; }).join(""), ok = bin(256 - n, 8);
    var sm = "1" + bin(n, 7);
    need(new Set([ok, inv, sm, pos]).size === 4, "x");
    return build({ tpl: "twos", ind: 1, lvl: "تطبيق", ref: "ص7–9", params: { n: n },
      stem: "ما تمثيل العدد " + B("-" + n) + " بالمكمل الثنائي في 8 خانات؟",
      correct: { t: B(ok), why: "اقلب خانات " + n + " ثم أضف 1." },
      wrongs: [
        { t: B(sm), name: "إشارة وقيمة", why: "استعمل طريقة الإشارة والقيمة.", steps: ["بت الإشارة 1 ثم " + n + " في سبع خانات: " + B(sm) + ".", "اختبار الجمع مع +" + n + ": " + B(bin((parseInt(sm, 2) + n) & 255, 8)) + " وليس صفرًا."] },
        { t: B(inv), name: "المكمل الأحادي فقط", why: "نُسي جمع 1.", steps: ["قلب الخانات فقط: " + B(inv) + ".", "اختبار الجمع مع +" + n + ": " + B(bin((parseInt(inv, 2) + n) & 255, 8)) + " وليس صفرًا؛ ينقصه 1."] },
        { t: B(pos), name: "العدد الموجب نفسه", why: "لم تُطبَّق خطوات النفي.", steps: ["هذا تمثيل +" + n + " نفسه.", "الجمع معه: " + B(bin((parseInt(pos, 2) * 2) & 255, 8)) + " وليس صفرًا."] }
      ],
      steps: ["اكتب +" + n + " بثماني خانات: " + B(pos) + ".", "اقلب كل خانة: " + B(inv) + ".", "أضف 1: " + B(ok) + "."],
      verify: "تحقق: " + B(ok) + " + " + B(pos) + " = 100000000 ، وتُهمل الخانة التاسعة فيبقى صفرًا.",
      hint: "ما الخطوتان اللتان تحوّلان العدد الموجب إلى سالبه؟",
      concept: "المكمل الثنائي: اقلب الخانات ثم أضف 1؛ هكذا يعمل الجمع مع الأعداد السالبة بدائرة واحدة." });
  } };

  /* 7) ثماني → عشري */
  T.oct2dec = { ind: 1, lvl: "تطبيق", ref: "ص7–9", name: "تحويل ثماني إلى عشري", gen: function (r) {
    var d = [r.int(1, 7), r.int(0, 7), r.int(1, 7)], o = d.join(""), v = d[0] * 64 + d[1] * 8 + d[2];
    var rev = d[0] + d[1] * 8 + d[2] * 64, dr = parseInt(o, 10), up = v * 8;
    need(new Set([v, rev, dr, up]).size === 4, "x");
    return build({ tpl: "oct2dec", ind: 1, lvl: "تطبيق", ref: "ص7–9", params: { oct: o },
      stem: "ما القيمة العشرية للعدد " + "[" + o + "|8]؟",
      correct: { t: B(String(v)), why: d[0] + "×64 + " + d[1] + "×8 + " + d[2] + "." },
      wrongs: [
        { t: B(String(rev)), name: "عكس الأوزان", why: "الأوزان مرتبة من اليمين خطأً.", steps: ["الأوزان الصحيحة: 64 ، 8 ، 1 من اليسار.", "عُكست فكان الحساب " + d[0] + "×1 + " + d[1] + "×8 + " + d[2] + "×64 = " + rev + "."] },
        { t: B(String(dr)), name: "قراءة العدد كأنه عشري", why: "قُرئ العدد كعشري.", steps: ["الرموز نفسها لكن الأساس 8 لا 10.", "قراءته كعشري تعطي " + dr + "."] },
        { t: B(String(up)), name: "بدء الأوزان من 8 لا من 1", why: "بدأت الأوزان بـ 8¹.", steps: ["الوزن الأصغر هو 8⁰ = 1.", "ابتداؤها بـ 8¹ يضرب الناتج بـ 8: " + v + "×8 = " + up + "."] }
      ],
      steps: ["الأوزان من اليمين: " + B("1 ، 8 ، 64") + ".", "اضرب: " + B(d[0] + "×64 = " + d[0] * 64) + " ، " + B(d[1] + "×8 = " + d[1] * 8) + " ، " + B(d[2] + "×1 = " + d[2]) + ".", "اجمع: " + B(String(v)) + "."],
      verify: "تحقق بالعودة: " + v + " ÷ 8 يعطي الباقي " + (v % 8) + " وهو الرقم الأخير " + d[2] + ".",
      hint: "ما وزن الخانة الأولى من اليمين؟ وما أساس هذا النظام؟",
      concept: "قيمة العدد = مجموع (الرقم × الأساس مرفوعًا إلى موضعه)." });
  } };

  /* ---------- جبر منطقي ---------- */
  function simpleBool(r, id, defs) {
    var v = r.pick(defs), nm = pickNames(r, 2), x = nm[0], y = nm[1];
    var st = v.make(x, y), target = v.f;
    var wr = st.wrongs.map(function (w) { return { s: w.s, f: w.f }; });
    wr.forEach(function (w) { need(!eq2(target, w.f), "wrong equals target"); });
    need(eq2(target, st.ok.f), "ok != target");
    var wrongs = wr.map(function (w, i) {
      return { t: B(w.s), name: st.wrongs[i].name, why: st.wrongs[i].why, steps: [st.wrongs[i].step, traceDiff(w, target, x, y)] };
    });
    return build({ tpl: id, ind: 2, lvl: v.lvl || "فهم", ref: "ص10–16", params: { x: x, y: y, v: v.id },
      stem: st.stem, correct: { t: B(st.ok.s), why: st.okwhy }, wrongs: wrongs,
      steps: st.steps, verify: "تحقق بجدول الحقيقة: " + table2(target) + " = " + table2(st.ok.f) + ".", hint: st.hint, concept: st.concept });
  }

  T.demorgan = { ind: 2, lvl: "فهم", ref: "ص10–16", name: "قانون دي مورجان", gen: function (r) {
    return simpleBool(r, "demorgan", [(function () {
      return r.int(0, 1) ? {
        id: "or", f: function (a, b) { return N(a | b); },
        make: function (x, y) { return {
          stem: "أي العبارات التالية تكافئ " + B("~(" + x + "+" + y + ")") + "؟",
          ok: { s: "~" + x + "·~" + y, f: function (a, b) { return N(a) & N(b); } },
          okwhy: "دي مورجان: نفي المجموع = جداء النفيين.",
          wrongs: [
            { s: "~" + x + "+~" + y, f: function (a, b) { return N(a) | N(b); }, name: "تغيير الإشارة دون العملية", why: "هذه صيغة نفي الجداء.", step: "نُفي كل متغير لكن بقيت العملية + بدل ·." },
            { s: "~" + x + "·" + y, f: function (a, b) { return N(a) & b; }, name: "نفي أحد المتغيرين فقط", why: "نُفي متغير واحد.", step: "دي مورجان تنفي كل المتغيرات." },
            { s: x + "·" + y, f: function (a, b) { return a & b; }, name: "حذف النفي", why: "أُسقط النفي كليًا.", step: "حُذف الخط ولم تُنفَ المتغيرات." }
          ],
          steps: ["اكسر الخط الأطول فوق المجموع.", "بدّل العملية: + تصير ·.", "انفِ كل متغير: " + B("~" + x + "·~" + y) + "."],
          hint: "ماذا يحدث للعملية ولكل متغير عند كسر الخط؟", concept: "~(A+B) = ~A·~B و~(A·B) = ~A+~B." }; }
      } : {
        id: "and", f: function (a, b) { return N(a & b); },
        make: function (x, y) { return {
          stem: "أي العبارات التالية تكافئ " + B("~(" + x + "·" + y + ")") + "؟",
          ok: { s: "~" + x + "+~" + y, f: function (a, b) { return N(a) | N(b); } },
          okwhy: "دي مورجان: نفي الجداء = مجموع النفيين.",
          wrongs: [
            { s: "~" + x + "·~" + y, f: function (a, b) { return N(a) & N(b); }, name: "تغيير الإشارة دون العملية", why: "هذه صيغة نفي المجموع.", step: "نُفي كل متغير لكن بقيت العملية · بدل +." },
            { s: x + "+~" + y, f: function (a, b) { return a | N(b); }, name: "نفي أحد المتغيرين فقط", why: "نُفي متغير واحد.", step: "دي مورجان تنفي كل المتغيرات." },
            { s: x + "+" + y, f: function (a, b) { return a | b; }, name: "حذف النفي", why: "أُسقط النفي كليًا.", step: "حُذف الخط ولم تُنفَ المتغيرات." }
          ],
          steps: ["اكسر الخط الأطول فوق الجداء.", "بدّل العملية: · تصير +.", "انفِ كل متغير: " + B("~" + x + "+~" + y) + "."],
          hint: "ماذا يحدث للعملية ولكل متغير عند كسر الخط؟", concept: "~(A+B) = ~A·~B و~(A·B) = ~A+~B." }; }
      };
    })()]);
  } };

  T.simplify = { ind: 2, lvl: "تطبيق", ref: "ص10–16", name: "تبسيط جبري", gen: function (r) {
    var defs = [
      { id: "s1", f: function (a, b) { return a; }, lvl: "تطبيق", make: function (x, y) { return {
        stem: "بسّط العبارة " + B(x + "·" + y + " + " + x + "·~" + y) + ".",
        ok: { s: x, f: function (a, b) { return a; } }, okwhy: "عامل مشترك ثم قانون المكمل.",
        wrongs: [
          { s: y, f: function (a, b) { return b; }, name: "الخلط بين المتغيرين", why: "العامل المشترك هو " + x + ".", step: "اعتُبر " + y + " هو العامل المشترك." },
          { s: x + "·" + y, f: function (a, b) { return a & b; }, name: "الاكتفاء بحد واحد", why: "أُهمل الحد الثاني.", step: "أُخذ الحد الأول فقط." },
          { s: "1", f: function () { return 1; }, name: "اختزال خاطئ إلى 1", why: "نُسي أن العامل " + x + " يبقى.", step: "طُبِّق " + y + "+~" + y + "=1 ثم أُسقط العامل " + x + "." }
        ],
        steps: ["أخرج العامل المشترك: " + B(x + "·(" + y + " + ~" + y + ")") + ".", "قانون المكمل: " + B(y + " + ~" + y + " = 1") + ".", "قانون الواحد: " + B(x + "·1 = " + x) + "."],
        hint: "ما العامل المشترك بين الحدين؟ وماذا يساوي مجموع متغير ومكمله؟", concept: "A·B + A·~B = A·(B+~B) = A." }; } },
      { id: "s2", f: function (a, b) { return a | b; }, lvl: "تطبيق", make: function (x, y) { return {
        stem: "بسّط العبارة " + B(x + " + ~" + x + "·" + y) + ".",
        ok: { s: x + "+" + y, f: function (a, b) { return a | b; } }, okwhy: "قانون الامتصاص: A + ~A·B = A + B.",
        wrongs: [
          { s: x + "·" + y, f: function (a, b) { return a & b; }, name: "الخلط بين + و·", why: "العملية تبقى +.", step: "كُتب جداء المتغيرين." },
          { s: x, f: function (a, b) { return a; }, name: "إهمال الحد الثاني", why: "الحد الثاني يضيف " + y + ".", step: "أُهمل الحد " + "~" + x + "·" + y + "." },
          { s: "~" + x + "+" + y, f: function (a, b) { return N(a) | b; }, name: "نفي الحد الأول", why: "لا يُنفى " + x + ".", step: "نُفي المتغير في الحد الأول." }
        ],
        steps: ["وزّع: " + B(x + " + ~" + x + "·" + y + " = (" + x + " + ~" + x + ")·(" + x + " + " + y + ")") + ".", "قانون المكمل: " + B(x + " + ~" + x + " = 1") + ".", "الناتج: " + B(x + " + " + y) + "."],
        hint: "جرّب التوزيع بصيغة (مجموع)·(مجموع).", concept: "A + ~A·B = A + B (الامتصاص)." }; } },
      { id: "s3", f: function (a, b) { return a; }, lvl: "تطبيق", make: function (x, y) { return {
        stem: "بسّط العبارة " + B(x + "·(" + x + " + " + y + ")") + ".",
        ok: { s: x, f: function (a, b) { return a; } }, okwhy: "قانون الامتصاص: A·(A+B) = A.",
        wrongs: [
          { s: x + "+" + y, f: function (a, b) { return a | b; }, name: "حذف الجداء", why: "الجداء يقيّد الناتج.", step: "أُسقط العامل " + x + " الخارجي." },
          { s: y, f: function (a, b) { return b; }, name: "الخلط بين المتغيرين", why: "الناتج " + x + " لا " + y + ".", step: "أُخذ المتغير الآخر." },
          { s: x + "·" + y, f: function (a, b) { return a & b; }, name: "توزيع غير مكتمل", why: "الحد " + x + "·" + x + " يساوي " + x + " وليس 0.", step: "أُهمل الحد " + x + "·" + x + "." }
        ],
        steps: ["وزّع: " + B(x + "·" + x + " + " + x + "·" + y) + ".", "قانون التكرار: " + B(x + "·" + x + " = " + x) + ".", "فالعبارة " + B(x + " + " + x + "·" + y) + " ثم أخرج العامل: " + B(x + "·(1 + " + y + ") = " + x) + "."],
        hint: "وزّع ثم استعمل A·A = A.", concept: "A·(A+B) = A (الامتصاص)." }; } },
      { id: "s4", f: function (a, b) { return a; }, lvl: "تطبيق", make: function (x, y) { return {
        stem: "بسّط العبارة " + B("(" + x + " + " + y + ")·(" + x + " + ~" + y + ")") + ".",
        ok: { s: x, f: function (a, b) { return a; } }, okwhy: "توزيع ثم قانون المكمل.",
        wrongs: [
          { s: y, f: function (a, b) { return b; }, name: "الخلط بين المتغيرين", why: "المتغير المشترك " + x + ".", step: "اعتُبر " + y + " هو المشترك." },
          { s: x + "+" + y, f: function (a, b) { return a | b; }, name: "إهمال العامل الثاني", why: "العاملان معًا يعطيان " + x + ".", step: "أُخذ العامل الأول فقط." },
          { s: "1", f: function () { return 1; }, name: "اختزال خاطئ إلى 1", why: "الناتج يتبع " + x + ".", step: "طُبِّق المكمل ثم أُسقط " + x + "." }
        ],
        steps: ["وزّع بالصيغة (X+Y)(X+Z) = X + Y·Z: " + B(x + " + " + y + "·~" + y) + ".", "قانون التنافي: " + B(y + "·~" + y + " = 0") + ".", "فالناتج " + B(x + " + 0 = " + x) + "."],
        hint: "كون المتغير المشترك x يسهّل الصيغة (X+Y)(X+Z).", concept: "(X+Y)(X+Z) = X + Y·Z." }; } }
    ];
    return simpleBool(r, "simplify", defs);
  } };

  /* عدّ صفوف الجدول = 1 */
  T.truthcount = { ind: 2, lvl: "فهم", ref: "ص10–16", name: "عدّ صفوف جدول الحقيقة", gen: function (r) {
    var nm = pickNames(r, 3), a = nm[0], b = nm[1], c = nm[2];
    var defs = [
      { s: a + "·" + b + " + " + c, f: function (x, y, z) { return (x & y) | z; } },
      { s: "(" + a + " + " + b + ")·~" + c, f: function (x, y, z) { return (x | y) & N(z); } },
      { s: "~" + a + "·" + b + " + " + a + "·~" + b + "·" + c, f: function (x, y, z) { return (N(x) & y) | (x & N(y) & z); } },
      { s: a + "·" + b + "·" + c + " + ~" + a + "·~" + b, f: function (x, y, z) { return (x & y & z) | (N(x) & N(y)); } },
      { s: "(" + a + " + ~" + b + ")·(" + b + " + " + c + ")", f: function (x, y, z) { return (x | N(y)) & (y | z); } }
    ];
    var d = r.pick(defs), ones = [], zeros = [];
    for (var m = 0; m < 8; m++) { var x = (m >> 2) & 1, y = (m >> 1) & 1, z = m & 1; (d.f(x, y, z) ? ones : zeros).push(m); }
    var k = ones.length;
    need(k >= 2 && k <= 6, "degenerate");
    var cand = [8 - k, k + 1, k - 1, k + 2].filter(function (v) { return v >= 0 && v <= 8 && v !== k; });
    var w = [8 - k, k + 1, k - 1].filter(function (v, i, arr) { return v >= 0 && v <= 8 && v !== k && arr.indexOf(v) === i; });
    if (w.length < 3) w.push(k + 2 <= 8 && k + 2 !== k ? k + 2 : k - 2);
    need(new Set(w.concat([k])).size === 4, "x");
    var mn = function (m) { return bin(m, 3); };
    var names = [
      { name: "عدّ الأصفار بدل الآحاد", step: "عُدّت الصفوف التي تساوي 0 وعددها " + (8 - k) + "." },
      { name: "عدّ صف زائد", step: "أُضيف صف لا تتحقق فيه الدالة." },
      { name: "إسقاط صف", step: "أُسقط صف تتحقق فيه الدالة." }
    ];
    return build({ tpl: "truthcount", ind: 2, lvl: "فهم", ref: "ص10–16", params: { expr: d.s, names: nm, ones: ones },
      stem: "كم صفًّا من الصفوف الثمانية في جدول حقيقة الدالة " + B("F = " + d.s) + " يكون فيه F = 1؟",
      correct: { t: B(String(k)), why: "الصفوف التي تساوي 1: " + ones.map(mn).join("، ") + "." },
      wrongs: w.slice(0, 3).map(function (v, i) {
        var nmI = v === 8 - k ? names[0] : v === k + 1 || v === k + 2 ? names[1] : names[2];
        return { t: B(String(v)), name: nmI.name, why: nmI.name + ".", steps: [nmI.step, "العدد الصحيح للصفوف هو " + k + " وليس " + v + "."] };
      }),
      steps: ["اكتب الصفوف الثمانية للمتغيرات " + B(a + b + c) + " من 000 إلى 111.", "قيّم الدالة في كل صف: الآحاد عند " + ones.map(mn).join("، ") + ".", "عدّها: " + B(String(k)) + "."],
      verify: "تحقق: عدد الآحاد " + k + " + عدد الأصفار " + (8 - k) + " = 8.",
      hint: "ابنِ الصفوف الثمانية ثم قيّم الدالة صفًّا صفًّا.", concept: "جدول الحقيقة لدالة بـ n متغيرات فيه 2ⁿ صفًّا؛ عدّ الآحاد يتم بالتقييم الصفّي." });
  } };

  /* خريطة كارنو لثلاثة متغيرات */
  function cubes3() {
    var cs = [];
    for (var mask = 0; mask < 8; mask++) for (var val = 0; val < 8; val++) {
      if (val & ~mask & 7) continue; // قيمة الخانة الحرة صفر
      var cov = []; for (var m = 0; m < 8; m++) if ((m & mask) === val) cov.push(m);
      cs.push({ mask: mask, val: val, cov: cov });
    }
    return cs;
  }
  var CUBES3 = cubes3();
  function minimize3(set) {
    var s = {}; set.forEach(function (m) { s[m] = 1; });
    var imps = CUBES3.filter(function (c) { return c.cov.every(function (m) { return s[m]; }); });
    var primes = imps.filter(function (c) { return !imps.some(function (d) { return d !== c && d.cov.length > c.cov.length && c.cov.every(function (m) { return d.cov.indexOf(m) >= 0; }); }); });
    var best = null;
    for (var sub = 1; sub < (1 << primes.length); sub++) {
      var ch = [], covered = {};
      for (var i = 0; i < primes.length; i++) if (sub & (1 << i)) { ch.push(primes[i]); primes[i].cov.forEach(function (m) { covered[m] = 1; }); }
      if (!set.every(function (m) { return covered[m]; })) continue;
      var lits = ch.reduce(function (a, c) { return a + ((c.mask & 4 ? 1 : 0) + (c.mask & 2 ? 1 : 0) + (c.mask & 1 ? 1 : 0)); }, 0);
      var key = ch.length * 100 + lits;
      if (!best || key < best.key) best = { key: key, ch: ch };
    }
    return best.ch;
  }
  function term3(c, nm) {
    var parts = [];
    [4, 2, 1].forEach(function (bit, i) { if (c.mask & bit) parts.push((c.val & bit ? "" : "~") + nm[i]); });
    return parts.join("·");
  }
  function expr3(ch, nm) { return ch.map(function (c) { return term3(c, nm); }).join(" + "); }

  T.kmap3 = { ind: 2, lvl: "تطبيق", ref: "ص10–16", name: "تبسيط بخريطة كارنو", gen: function (r) {
    var nm = pickNames(r, 3), k = r.int(3, 6), all = r.shuffle([0, 1, 2, 3, 4, 5, 6, 7]), set = all.slice(0, k).sort(function (a, b) { return a - b; });
    var ch = minimize3(set), ok = expr3(ch, nm);
    need(ch.every(function (c) { return c.mask !== 0; }), "const");
    var wrongSets = [];
    r.shuffle([0, 1, 2, 3, 4, 5, 6, 7]).forEach(function (m) {
      if (wrongSets.length >= 3) return;
      var ns = set.indexOf(m) >= 0 ? set.filter(function (x) { return x !== m; }) : set.concat([m]).sort(function (a, b) { return a - b; });
      if (ns.length < 1 || ns.length > 7) return;
      var wch = minimize3(ns); if (wch.some(function (c) { return c.mask === 0; })) return;
      var e = expr3(wch, nm); if (e === ok || wrongSets.some(function (w) { return w.e === e; })) return;
      wrongSets.push({ e: e, m: m, add: set.indexOf(m) < 0 });
    });
    need(wrongSets.length === 3, "wrong sets");
    var cells = function (c) { return "{" + c.cov.join("،") + "}"; };
    return build({ tpl: "kmap3", ind: 2, lvl: "تطبيق", ref: "ص10–16", params: { names: nm, set: set },
      stem: "الدالة " + B("F(" + nm.join(",") + ")") + " تساوي 1 عند الحدود الدنيا Σ(" + set.join("،") + ") وتساوي 0 فيما عداها. ما أبسط صيغة لها؟",
      correct: { t: B(ok), why: "تجميع كل المجموعات الأكبر الممكنة على الخريطة." },
      wrongs: wrongSets.map(function (w) {
        return { t: B(w.e), name: w.add ? "إضافة خلية ليست ضمن الدالة" : "إسقاط خلية من الدالة",
          why: w.add ? "تضمّن الحد الأدنى " + w.m + " وهو ليس ضمن الدالة." : "أهمل الحد الأدنى " + w.m + ".",
          steps: [w.add ? "هذه الصيغة تعطي 1 عند الحد الأدنى " + w.m + " بينما الدالة تعطي 0 هناك." : "هذه الصيغة تعطي 0 عند الحد الأدنى " + w.m + " بينما الدالة تعطي 1 هناك.", "إذن لا تطابق الدالة المعطاة."] };
      }),
      steps: [
        "ارسم الخريطة بترتيب غراي (00، 01، 11، 10) لأن كل متجاورين يختلفان في خانة واحدة، وضع 1 في الخلايا " + B(set.join("،")) + ".",
        "جمّع أكبر مجموعات ممكنة (أحجامها 1 أو 2 أو 4 أو 8) مع الالتفاف: " + ch.map(function (c) { return B(cells(c)); }).join(" ، ") + ".",
        "في كل مجموعة أبقِ المتغيرات التي لا تتغير قيمتها: " + ch.map(function (c) { return B(term3(c, nm)); }).join(" ، ") + ".",
        "اجمع الحدود: " + B(ok) + "."
      ],
      verify: "تحقق: الحدود الدنيا المغطاة بالمجموعات هي " + B(ch.reduce(function (a, c) { return a.concat(c.cov); }, []).filter(function (v, i, arr) { return arr.indexOf(v) === i; }).sort(function (a, b) { return a - b; }).join("،")) + " وتطابق الدالة المعطاة تمامًا.",
      hint: "هل رتبت الأعمدة بترتيب غراي؟ وهل جمّعت أكبر مجموعات ممكنة، بما فيها الالتفاف؟",
      concept: "خريطة كارنو: مجموعات من 2ⁿ خلية متجاورة (تشمل التفاف الأطراف)؛ المتغير الذي يتغير داخل المجموعة يُحذف." });
  } };

  /* ---------- مصفوفات ---------- */
  T.det2 = { ind: 3, lvl: "تطبيق", ref: "ص17–21", name: "محدد 2×2", gen: function (r) {
    var a = r.int(-3, 9), b = r.int(-3, 9), c = r.int(-3, 9), d = r.int(-3, 9), D = a * d - b * c;
    var w1 = a * d + b * c, w2 = a * c - b * d, w3 = a * b - c * d;
    need(new Set([D, w1, w2, w3]).size === 4, "x");
    return build({ tpl: "det2", ind: 3, lvl: "تطبيق", ref: "ص17–21", params: { m: [[a, b], [c, d]] },
      stem: "ما محدد المصفوفة " + M([[a, b], [c, d]]) + "؟",
      correct: { t: B(String(D)), why: "ad − bc." },
      wrongs: [
        { t: B(String(w1)), name: "جمع الجداءين", why: "المحدد يطرح الجداء الثاني.", steps: [B(a + "×" + d + " + " + b + "×" + c + " = " + w1), "جُمع الجداءان بدل طرحهما."] },
        { t: B(String(w2)), name: "الضرب بالأعمدة", why: "استعمل عناصر العمود لا القطرين.", steps: [B(a + "×" + c + " − " + b + "×" + d + " = " + w2), "أُخذ جداء العمودين بدل القطرين."] },
        { t: B(String(w3)), name: "ضرب عناصر الصف", why: "استعمل عناصر الصف لا القطرين.", steps: [B(a + "×" + b + " − " + c + "×" + d + " = " + w3), "أُخذ جداء الصفين بدل القطرين."] }
      ],
      steps: ["حدّد القطر الرئيسي (" + a + " و" + d + ") والقطر الآخر (" + b + " و" + c + ").", "جداء الرئيسي: " + B(a + "×" + d + " = " + a * d) + " ، وجداء الآخر: " + B(b + "×" + c + " = " + b * c) + ".", "المحدد: " + B(a * d + " − (" + b * c + ") = " + D) + "."],
      verify: "تحقق بالمنقولة: " + M([[a, c], [b, d]]) + " محددها " + B(a + "×" + d + " − " + c + "×" + b + " = " + (a * d - c * b)) + " أيضًا.",
      hint: "من أي جداء تطرح أي جداء؟", concept: "محدد 2×2 = ad − bc (القطر الرئيسي ناقص القطر الآخر)." });
  } };

  T.matmul2 = { ind: 3, lvl: "تطبيق", ref: "ص17–21", name: "ضرب مصفوفتين 2×2", gen: function (r) {
    var A = [[r.int(0, 4), r.int(0, 4)], [r.int(0, 4), r.int(0, 4)]], Bm = [[r.int(0, 4), r.int(0, 4)], [r.int(0, 4), r.int(0, 4)]];
    var P = mul2(A, Bm), Q = mul2(Bm, A), H = [[A[0][0] * Bm[0][0], A[0][1] * Bm[0][1]], [A[1][0] * Bm[1][0], A[1][1] * Bm[1][1]]];
    var Tt = [[P[0][0], P[1][0]], [P[0][1], P[1][1]]];
    var key = function (m) { return JSON.stringify(m); };
    need(new Set([key(P), key(Q), key(H), key(Tt)]).size === 4, "x");
    var cell = function (i, j) { return "(" + (i + 1) + "," + (j + 1) + "): " + B(A[i][0] + "×" + Bm[0][j] + " + " + A[i][1] + "×" + Bm[1][j] + " = " + P[i][j]); };
    return build({ tpl: "matmul2", ind: 3, lvl: "تطبيق", ref: "ص17–21", params: { A: A, B: Bm },
      stem: "إذا كانت A = " + M(A) + " و B = " + M(Bm) + " فما ناتج AB؟",
      correct: { t: M(P), why: "صف من A × عمود من B." },
      wrongs: [
        { t: M(Q), name: "الضرب بالترتيب المعاكس", why: "ناتج BA لا AB.", steps: ["BA = " + M(Q), "الضرب غير تبديلي."] },
        { t: M(H), name: "الضرب عنصرًا بعنصر", why: "ضرب هادامار لا ضرب المصفوفات.", steps: ["ضرب العناصر المتناظرة: " + M(H), "لكن ضرب المصفوفات هو صف × عمود."] },
        { t: M(Tt), name: "منقولة الناتج", why: "كُتب الناتج مقلوبًا.", steps: ["مُدِّل الصفوف بالأعمدة: " + M(Tt), "الناتج الصحيح غير مقلوب."] }
      ],
      steps: ["حجم الناتج 2×2.", cell(0, 0) + "\n" + cell(0, 1), cell(1, 0) + "\n" + cell(1, 1), "الناتج: " + M(P)],
      verify: "تحقق: مجموع عناصر AB = " + (P[0][0] + P[0][1] + P[1][0] + P[1][1]) + " ومجموع عناصر المنقولة نفسه، والحساب عبر الأعمدة يعطي المجموع ذاته.",
      hint: "كل عنصر هو جداء صف من A في عمود من B.", concept: "(AB)ᵢⱼ = مجموع (A[i,k] × B[k,j]); الضرب غير تبديلي." });
  } };

  T.inv2 = { ind: 3, lvl: "تطبيق", ref: "ص17–21", name: "معكوس 2×2", gen: function (r) {
    var a, b, c, d, D, tries = 0;
    do { a = r.int(1, 9); b = r.int(1, 9); c = r.int(1, 9); d = r.int(1, 9); D = a * d - b * c; tries++; } while (!([2, 4, 5, 10].indexOf(D) >= 0 && a !== d) && tries < 400);
    need([2, 4, 5, 10].indexOf(D) >= 0 && a !== d, "no matrix");
    var f = "`1/" + D + "` ";
    var ok = f + M([[d, -b], [-c, a]]);
    var w1 = f + M([[d, b], [c, a]]), w2 = M([[d, -b], [-c, a]]), w3 = f + M([[a, -b], [-c, d]]);
    return build({ tpl: "inv2", ind: 3, lvl: "تطبيق", ref: "ص17–21", params: { m: [[a, b], [c, d]], det: D },
      stem: "ما معكوس المصفوفة " + M([[a, b], [c, d]]) + "؟",
      correct: { t: ok, why: "المحدد " + D + ": بدّل a وd، وغيّر إشارتي b وc، ثم اقسم على المحدد." },
      wrongs: [
        { t: w1, name: "نسيان تغيير إشارتي القطر الآخر", why: "لم تُغيَّر إشارتا b وc.", steps: ["بعد التبديل بقيت الإشارتان: " + M([[d, b], [c, a]]), "ضربها في الأصلية لا يعطي الوحدة: المدخل (1,2) = " + B(a + "×" + b + " + " + b + "×" + a + " = " + 2 * a * b) + " بدل 0."] },
        { t: w2, name: "نسيان القسمة على المحدد", why: "لم تُقسم على المحدد " + D + ".", steps: ["توقف قبل القسمة: " + M([[d, -b], [-c, a]]), "ضربها في الأصلية يعطي " + D + " أمثال الوحدة: المدخل (1,1) = " + (a * d - b * c) + " بدل 1."] },
        { t: w3, name: "عدم تبديل موضعي القطر الرئيسي", why: "لم يُبدَّل a وd.", steps: ["أُبقي a وd في مكانيهما: " + M([[a, -b], [-c, d]]), "ضربها في الأصلية: المدخل (1,1) = " + B(a + "×" + a + " + " + b + "×(" + (-c) + ") = " + (a * a - b * c)) + " ولا يعطي " + D + "."] }
      ],
      steps: ["المحدد: " + B("ad − bc = " + a + "×" + d + " − " + b + "×" + c + " = " + D) + " ≠ 0 فالمعكوس موجود.",
        "بدّل a وd: " + B(a + " ↔ " + d) + " وغيّر إشارتي b وc: " + M([[d, -b], [-c, a]]),
        "اضرب في " + B("1/" + D) + ": " + ok],
      verify: "تحقق: العنصر (1,1) من حاصل ضرب الأصلية في المعكوس:\n" + B(a + "×" + d + " + " + b + "×(" + (-c) + ") = " + (a * d - b * c)) + "\n" + B(D + " ÷ " + D + " = 1") + ".",
      hint: "احسب المحدد أولًا، ثم ماذا تفعل بالقطر الرئيسي وبالقطر الآخر؟",
      concept: "معكوس 2×2 = (1/(ad−bc)) × {{d,−b;−c,a}}." });
  } };

  T.singular = { ind: 3, lvl: "فهم", ref: "ص17–21", name: "المصفوفة المنفردة", gen: function (r) {
    var a = r.int(1, 5), b = r.int(1, 5), k = r.pick([2, 3]), sing = r.int(0, 1) ? [[a, b], [a * k, b * k]] : [[a, a * k], [b, b * k]];
    var others = [];
    var guard = 0;
    while (others.length < 3 && guard++ < 200) {
      var m = [[r.int(1, 6), r.int(0, 6)], [r.int(0, 6), r.int(1, 6)]];
      if (det2(m) !== 0 && !others.some(function (o) { return JSON.stringify(o) === JSON.stringify(m); })) others.push(m);
    }
    need(others.length === 3 && det2(sing) === 0, "x");
    var t = function (m) { return det2(m); };
    return build({ tpl: "singular", ind: 3, lvl: "فهم", ref: "ص17–21", params: { sing: sing, others: others },
      stem: "أي المصفوفات التالية ليس لها معكوس؟",
      correct: { t: M(sing), why: "محددها صفر لأن أحد صفيها (أو عموديها) مضاعف للآخر." },
      wrongs: others.map(function (m) {
        return { t: M(m), name: "خيار قابل للعكس", why: "محدده " + t(m) + " ≠ 0.", steps: ["المحدد: " + B(m[0][0] + "×" + m[1][1] + " − " + m[0][1] + "×" + m[1][0] + " = " + t(m)), "المحدد لا يساوي صفرًا فللمصفوفة معكوس."] };
      }),
      steps: ["المعكوس يوجد إذا وفقط إذا كان المحدد ≠ 0.", "احسب المحدد لكل خيار: " + [sing].concat(others).map(function (m) { return M(m) + " ← " + t(m); }).join(" ، ") + ".", "الخيار الوحيد بمحدد صفر هو " + M(sing)],
      verify: "تحقق بالتناسب: " + (sing[1][0] === sing[0][0] * k ? "الصف الثاني = " + k + " × الصف الأول." : "العمود الثاني = " + k + " × العمود الأول."),
      hint: "ما الشرط على المحدد؟ وهل بين الصفوف تناسب؟", concept: "المصفوفة المنفردة محددها صفر، وليس لها معكوس." });
  } };

  T.matsize = { ind: 3, lvl: "فهم", ref: "ص17–21", name: "حجم الجداء", gen: function (r) {
    var m = r.int(2, 4), n = r.int(2, 4), defined = r.int(0, 1) === 0, p, q;
    if (defined) { p = n; q = r.int(2, 5); } else { p = r.int(2, 5); need(p !== n, "x"); q = r.int(2, 4); }
    var z = function (u, v) { return B(u + "×" + v); };
    var spec;
    if (defined) {
      var ok = z(m, q), w = [z(q, m), z(m, n), "غير معرّف"];
      need(new Set([ok].concat(w)).size === 4, "x");
      spec = { ok: ok, why: "صفوف A × أعمدة B.", w: [
        { t: w[0], name: "عكس الترتيب", why: "هذا حجم BA.", steps: ["حجم BA هو " + z(q, m) + ".", "الجداء AB حجمه صفوف الأولى × أعمدة الثانية."] },
        { t: w[1], name: "حجم المصفوفة الأولى", why: "حجم الناتج لا يساوي حجم A.", steps: ["أُخذ حجم A.", "الناتج يأخذ أعمدة B " + q + " لا أعمدة A."] },
        { t: w[2], name: "اعتقاد خاطئ بأن الجداء غير معرّف", why: "البعدان الداخليان متساويان (" + n + ").", steps: ["عدد أعمدة A = " + n + " = عدد صفوف B = " + p + ".", "الشرط متحقق فالجداء معرّف."] }
      ], steps: ["حجم A = " + z(m, n) + " وحجم B = " + z(p, q) + ".", "شرط الضرب: أعمدة A (" + n + ") = صفوف B (" + p + "). متحقق.", "حجم الناتج = صفوف A × أعمدة B = " + ok + "."] };
    } else {
      var ok2 = "غير معرّف", w2 = [z(m, q), z(n, p), z(m, p)];
      need(new Set([ok2].concat(w2)).size === 4, "x");
      spec = { ok: ok2, why: "أعمدة A لا تساوي صفوف B.", w: [
        { t: w2[0], name: "تجاهل شرط الضرب", why: "الشرط غير متحقق.", steps: ["أعمدة A = " + n + " وصفوف B = " + p + " مختلفان.", "حساب صفوف A × أعمدة B دون فحص الشرط خطأ."] },
        { t: w2[1], name: "خلط الأبعاد", why: "ليس هذا حجم الجداء.", steps: ["قُلبت الأبعاد الداخلية.", "الجداء أصلًا غير معرّف لأن " + n + " ≠ " + p + "."] },
        { t: w2[2], name: "أخذ صفوف A وصفوف B", why: "خلط بين الصفوف والأعمدة.", steps: ["أُخذ عدد صفوف B بدل أعمدتها.", "الجداء أصلًا غير معرّف."] }
      ], steps: ["حجم A = " + z(m, n) + " وحجم B = " + z(p, q) + ".", "شرط الضرب: أعمدة A (" + n + ") يجب أن تساوي صفوف B (" + p + ").", "غير متحقق: الجداء غير معرّف."] };
    }
    return build({ tpl: "matsize", ind: 3, lvl: "فهم", ref: "ص17–21", params: { m: m, n: n, p: p, q: q },
      stem: "حجم A هو " + z(m, n) + " وحجم B هو " + z(p, q) + ". ما حجم الجداء AB؟",
      correct: { t: spec.ok === "غير معرّف" ? spec.ok : spec.ok, why: spec.why }, wrongs: spec.w, steps: spec.steps,
      verify: defined ? "تحقق: الأبعاد الداخلية " + n + " و" + p + " تُلغي بعضها، والخارجية " + m + " و" + q + " هي حجم الناتج." : "تحقق: الأبعاد الداخلية " + n + " و" + p + " مختلفة فلا جداء.",
      hint: "قارن عدد أعمدة الأولى بعدد صفوف الثانية.", concept: "AB معرّف إذا كان أعمدة A = صفوف B، وحجمه صفوف A × أعمدة B." });
  } };

  /* ---------- الواجهة العامة ---------- */
  var ORDER = ["hex2bin", "bin2oct", "dec2hex", "binarith", "binmul", "twos", "oct2dec", "demorgan", "simplify", "truthcount", "kmap3", "det2", "matmul2", "inv2", "singular", "matsize"];

  function make(tplId, seed) {
    var t = T[tplId]; if (!t) throw new Error("unknown template " + tplId);
    var s = seed >>> 0;
    for (var k = 0; k < 60; k++) {
      var r = RNG((s + k * 7919) >>> 0);
      try {
        var q = t.gen(r);
        q.id = "g:" + tplId + ":" + s; q.seed = s;
        return q;
      } catch (e) { if (!(e instanceof Collision)) throw e; }
    }
    throw new Error("could not generate " + tplId + " for seed " + seed);
  }

  function list() {
    return ORDER.map(function (id) { return { id: id, ind: T[id].ind, name: T[id].name }; });
  }

  return { make: make, list: list, templates: ORDER, _minimize3: minimize3, _expr3: expr3 };
});
