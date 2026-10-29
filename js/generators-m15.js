/* مولِّدات المعيار 15 (البرمجة والخوارزميات): مرور الفرز، البحث الثنائي والخطي. مولَّدة آليًا وغير مراجَعة رسميًا. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory(require("./generators.js"));
  else factory(root.CSGen);
})(typeof self !== "undefined" ? self : this, function (G) {
  "use strict";
  var H = G.helpers, build = H.build, need = H.need;
  var REF = "ص246";
  function ex(s) { return "`" + s + "`"; }
  function W(w) { return { t: w.t, name: w.name, why: w.why, steps: w.steps }; }
  function lst(a) { return "[" + a.join(", ") + "]"; }
  function pick3(r, ok, cands, generic) {
    var seen = {}; seen[ok] = 1; var out = [];
    cands.forEach(function (c) { if (!seen[c.t] && out.length < 3) { seen[c.t] = 1; out.push(c); } });
    var g = 0; while (out.length < 3 && g++ < 80) { var c2 = generic(r); if (!seen[c2.t]) { seen[c2.t] = 1; out.push(c2); } }
    need(out.length === 3, "not enough wrongs"); return out;
  }
  function distinctArr(r, n, lo, hi) { var s = {}, a = []; while (a.length < n) { var v = r.int(lo, hi); if (!s[v]) { s[v] = 1; a.push(v); } } return a; }
  function bubble(a, k) { var x = a.slice(), p, i; for (p = 0; p < k; p++) for (i = 0; i < x.length - 1 - p; i++) if (x[i] > x[i + 1]) { var t = x[i]; x[i] = x[i + 1]; x[i + 1] = t; } return x; }
  function selection(a, k) { var x = a.slice(), p, i; for (p = 0; p < k; p++) { var m = p; for (i = p + 1; i < x.length; i++) if (x[i] < x[m]) m = i; var t = x[p]; x[p] = x[m]; x[m] = t; } return x; }
  function insertion(a, k) { var x = a.slice(), i, j; for (i = 1; i <= k && i < x.length; i++) { var key = x[i]; j = i - 1; while (j >= 0 && x[j] > key) { x[j + 1] = x[j]; j--; } x[j + 1] = key; } return x; }
  function same(a, b) { return a.join() === b.join(); }

  /* 1) مرورات الفرز */
  G.register("sortpass", { std: 15, ind: 2, lvl: "تطبيق", ref: REF, name: "حالة المصفوفة بعد مرورات الفرز", gen: function (r) {
    var n = r.int(5, 7), a = distinctArr(r, n, 1, 40), alg = r.pick(["bubble", "selection", "insertion"]), k = r.int(1, 2);
    var f = { bubble: bubble, selection: selection, insertion: insertion }, ok = f[alg](a, alg === "insertion" ? k : k), names = { bubble: "الفقاعة (Bubble Sort)", selection: "الانتقاء (Selection Sort)", insertion: "الإدراج (Insertion Sort)" };
    need(!same(ok, a) && !same(ok, a.slice().sort(function (x, y) { return x - y; })), "trivial");
    var cands = [];
    ["bubble", "selection", "insertion"].filter(function (x) { return x !== alg; }).forEach(function (x) { var v = f[x](a, k); cands.push({ t: ex(lst(v)), name: "تطبيق خوارزمية أخرى (" + x + ")", why: "الخوارزمية المطلوبة " + alg + ".", steps: ["هذه الحالة تنتج عن خوارزمية مختلفة.", "المطلوب " + alg + ": " + lst(ok) + "."], _v: v }); });
    cands.push({ t: ex(lst(f[alg](a, k - 1))), name: "مرور واحد أقل", why: "عدد المرورات " + k + ".", steps: ["نُفّذ " + (k - 1) + " مرورًا فقط.", "المطلوب " + k + " : " + lst(ok) + "."] });
    cands.push({ t: ex(lst(a.slice().sort(function (x, y) { return x - y; }))), name: "الترتيب الكامل", why: "لم تكتمل المرورات المطلوبة فقط.", steps: ["الترتيب الكامل يحتاج مرورات أكثر.", "بعد " + k + " : " + lst(ok) + "."] });
    var ws = pick3(r, ex(lst(ok)), cands, function (rr) { var v = ok.slice(), i = rr.int(0, n - 2), t = v[i]; v[i] = v[i + 1]; v[i + 1] = t; return { t: ex(lst(v)), name: "تبديل خاطئ", why: "تبديل غير مطابق للخوارزمية.", steps: ["تتبّع المقارنات مرورًا بمرور.", "الصحيح " + lst(ok) + "."] }; });
    return build({ tpl: "sortpass", ind: 2, lvl: "تطبيق", ref: REF, params: { a: a, alg: alg, k: k },
      stem: "المصفوفة " + ex(lst(a)) + " رُتّبت تصاعديًا بالفرز " + names[alg] + ". ما حالتها بعد " + (k === 1 ? "المرور الأول" : "المرورين الأولين") + "؟",
      correct: { t: ex(lst(ok)), why: alg === "bubble" ? "كل مرور يدفع أكبر عنصر إلى نهايته." : alg === "selection" ? "كل مرور يضع أصغر عنصر متبقٍ في موضعه." : "كل مرور يدرج عنصرًا في الجزء المرتب." },
      wrongs: ws.map(W),
      steps: [alg === "bubble" ? "الفقاعة: نقارن المتجاورين ونبدّل إن كان الأول أكبر، فيستقر الأكبر في النهاية." : alg === "selection" ? "الانتقاء: نبحث عن أصغر عنصر في الجزء غير المرتب ونبدّله مع أول موضع فيه." : "الإدراج: نأخذ العنصر التالي ونُدرجه في مكانه داخل الجزء المرتب قبله.", "نطبّق " + k + (k === 1 ? " مرور" : " مرورين") + " فنحصل على " + lst(ok) + "."],
      verify: "عدد العناصر ثابت (" + n + ") والعناصر نفسها بلا فقد أو تكرار.", hint: "نفّذ المرور الأول على الورق ثم اتبعه بالثاني.", concept: "الفقاعة: أكبر عنصر ينتقل إلى النهاية. الانتقاء: أصغر عنصر يوضع في بداية الجزء غير المرتب. الإدراج: يبني جزءًا مرتبًا من اليسار." });
  } });

  /* 2) البحث الثنائي */
  function binary(a, t) { var lo = 0, hi = a.length - 1, c = 0; while (lo <= hi) { var m = Math.floor((lo + hi) / 2); c++; if (a[m] === t) return { c: c, found: true }; if (a[m] < t) lo = m + 1; else hi = m - 1; } return { c: c, found: false }; }
  G.register("binsearch", { std: 15, ind: 2, lvl: "تطبيق", ref: REF, name: "عدد مقارنات البحث الثنائي", gen: function (r) {
    var n = r.int(7, 15), a = distinctArr(r, n, 1, 90).sort(function (x, y) { return x - y; }), idx = r.int(0, n - 1), t = a[idx], res = binary(a, t), ok = res.c;
    var lin = idx + 1, cands = [{ t: String(lin), name: "عدد مقارنات البحث الخطي", why: "البحث الثنائي يقسم النطاق.", steps: ["الخطي يفحص العناصر واحدًا واحدًا (" + lin + ").", "الثنائي يحتاج " + ok + "."] }, { t: String(n), name: "فحص جميع العناصر", why: "الثنائي لا يفحص الكل.", steps: ["النطاق يتناصف كل مرة.", "الصحيح " + ok + "."] }, { t: String(Math.ceil(Math.log(n + 1) / Math.log(2))), name: "الحد الأقصى النظري", why: "الهدف قد يوجد قبل الحد الأقصى.", steps: ["الحد الأقصى ⌈log₂(n+1)⌉ حالة أسوأ.", "هنا وُجد الهدف بعد " + ok + "."] }];
    var ws = pick3(r, String(ok), cands, function (rr) { return { t: String(Math.max(1, ok + rr.pick([-1, 1, 2]))), name: "خطأ في تتبع النطاق", why: "اختيار منتصف خاطئ.", steps: ["المنتصف = ⌊(low+high)/2⌋.", "الصحيح " + ok + "."] }; });
    return build({ tpl: "binsearch", ind: 2, lvl: "تطبيق", ref: REF, params: { a: a, t: t },
      stem: "القائمة المرتبة " + ex(lst(a)) + ". كم مقارنة بالعنصر الأوسط يُجريها البحث الثنائي (المنتصف = ⌊(low+high)/2⌋) حتى يجد القيمة " + ex(String(t)) + "؟",
      correct: { t: String(ok), why: "تتبّع النطاق مع المنتصف يعطي " + ok + " مقارنة." }, wrongs: ws.map(W),
      steps: ["low=0، high=" + (n - 1) + ".", "في كل خطوة نقارن بالعنصر الأوسط وننصّف النطاق.", "وُجدت القيمة بعد " + ok + " مقارنة."],
      verify: "النتيجة ≤ ⌈log₂(" + (n + 1) + ")⌉ = " + Math.ceil(Math.log(n + 1) / Math.log(2)) + ".", hint: "احسب low وhigh وmid في كل خطوة وسجّل المقارنة.", concept: "البحث الثنائي يتطلب قائمة مرتبة وتتناصف مساحة البحث كل مقارنة: O(log n)." });
  } });

  /* 3) البحث الخطي */
  G.register("linsearch", { std: 15, ind: 2, lvl: "تطبيق", ref: REF, name: "مقارنات البحث الخطي", gen: function (r) {
    var n = r.int(6, 10), a = distinctArr(r, n, 1, 60), found = r.pick([true, true, false]), t, ok;
    if (found) { var idx = r.int(0, n - 1); t = a[idx]; ok = idx + 1; } else { do { t = r.int(1, 60); } while (a.indexOf(t) >= 0); ok = n; }
    var cands = found ? [{ t: String(ok - 1), name: "عدّ الفهرس بدل المقارنات", why: "المقارنات = الفهرس + 1.", steps: ["الفهرس يبدأ من 0.", "المقارنات " + ok + "."] }, { t: String(n), name: "فحص كل العناصر", why: "يتوقف البحث عند العثور.", steps: ["البحث الخطي يتوقف عند أول تطابق.", "الصحيح " + ok + "."] }, { t: String(Math.ceil(Math.log(n + 1) / Math.log(2))), name: "عدد مقارنات الثنائي", why: "القائمة غير مرتبة.", steps: ["الثنائي يتطلب ترتيبًا.", "الخطي: " + ok + "."] }]
      : [{ t: String(n - 1), name: "n − 1", why: "تُفحص كل العناصر.", steps: ["للتأكد من الغياب نفحص الجميع.", "الصحيح " + n + "."] }, { t: "0", name: "لا مقارنات", why: "يجب الفحص.", steps: ["لا يمكن الجزم بالغياب دون فحص.", "الصحيح " + n + "."] }, { t: String(Math.ceil(Math.log(n + 1) / Math.log(2))), name: "عدد مقارنات الثنائي", why: "القائمة غير مرتبة.", steps: ["الثنائي يتطلب ترتيبًا.", "الخطي: " + n + "."] }];
    var ws = pick3(r, String(ok), cands, function (rr) { return { t: String(Math.max(1, ok + rr.pick([-2, 1, 2]))), name: "خطأ في العدّ", why: "عدّ غير مطابق.", steps: ["قارن العنصر تلو الآخر من البداية.", "الصحيح " + ok + "."] }; });
    return build({ tpl: "linsearch", ind: 2, lvl: "تطبيق", ref: REF, params: { a: a, t: t },
      stem: "القائمة " + ex(lst(a)) + ". كم مقارنة يُجريها البحث الخطي (من البداية) عند البحث عن القيمة " + ex(String(t)) + (found ? "؟" : "؟ (القيمة غير موجودة)"),
      correct: { t: String(ok), why: found ? "الموضع " + ok + " فنقارن " + ok + " مرة ثم نتوقف." : "غائبة فنقارن بجميع العناصر الـ " + n + "." }, wrongs: ws.map(W),
      steps: ["نقارن العنصر الأول ثم الثاني… بالترتيب.", found ? "نتوقف عند أول تطابق: " + ok + " مقارنة." : "لا تطابق فنقارن كل العناصر: " + n + " مقارنة."],
      verify: "المقارنات ≤ " + n + ".", hint: "اعدّ كل مقارنة حتى التوقف.", concept: "الخطي لا يشترط ترتيبًا؛ أسوأ حالة n مقارنة: O(n)." });
  } });

  /* 4) تتبع حلقة بسيطة (مجموع المضاعفات) */
  G.register("loopsum", { std: 15, ind: 3, lvl: "تطبيق", ref: "ص252", name: "تتبّع حلقة وشرط", gen: function (r) {
    var n = r.int(5, 8), a = []; for (var i = 0; i < n; i++) a.push(r.int(1, 20)); var m = r.pick([2, 3, 4, 5]), op = r.pick(["sum", "count"]);
    var sel = a.filter(function (x) { return x % m === 0; }); need(sel.length >= 1 && sel.length < n, "sel");
    var ok = op === "sum" ? sel.reduce(function (s, x) { return s + x; }, 0) : sel.length, tot = a.reduce(function (s, x) { return s + x; }, 0);
    var other = op === "sum" ? sel.length : sel.reduce(function (s, x) { return s + x; }, 0), notm = a.filter(function (x) { return x % m !== 0; });
    var cands = [{ t: String(other), name: op === "sum" ? "عدّ العناصر بدل جمعها" : "جمع العناصر بدل عدّها", why: "السؤال عن " + (op === "sum" ? "المجموع" : "العدد") + ".", steps: ["الحلقة " + (op === "sum" ? "تجمع القيم" : "تزيد العدّاد بواحد") + ".", "الصحيح " + ok + "."] }, { t: String(tot), name: "تجاهل الشرط", why: "الشرط يُصفّي العناصر.", steps: ["الشرط x % " + m + " == 0 يختار المضاعفات فقط.", "الصحيح " + ok + "."] }, { t: String(op === "sum" ? notm.reduce(function (s, x) { return s + x; }, 0) : notm.length), name: "عكس الشرط", why: "اختيرت غير المضاعفات.", steps: ["الشرط للمضاعفات لا لغيرها.", "الصحيح " + ok + "."] }];
    var ws = pick3(r, String(ok), cands, function (rr) { return { t: String(Math.max(0, ok + rr.pick([-m, m, 1, 2]))), name: "خطأ حسابي", why: "ناتج غير مطابق.", steps: ["تتبّع القيم المختارة: " + lst(sel) + ".", "الصحيح " + ok + "."] }; });
    var code = op === "sum" ? "sum(x for x in a if x % " + m + " == 0)" : "len([x for x in a if x % " + m + " == 0])";
    return build({ tpl: "loopsum", ind: 3, lvl: "تطبيق", ref: "ص252", params: { a: a, m: m, op: op },
      stem: "إذا كانت " + ex("a = " + lst(a)) + " فما قيمة التعبير " + ex(code) + " في بايثون؟",
      correct: { t: String(ok), why: "العناصر المحققة للشرط: " + lst(sel) + " ← " + (op === "sum" ? "مجموعها" : "عددها") + " " + ok + "." }, wrongs: ws.map(W),
      steps: ["نمرّ على كل عنصر ونفحص x % " + m + " == 0.", "العناصر المختارة: " + lst(sel) + ".", (op === "sum" ? "المجموع = " : "العدد = ") + ok + "."],
      verify: "عدد العناصر المختارة " + sel.length + " من " + n + ".", hint: "علّم العناصر التي يقبل باقي قسمتها على " + m + " الصفر.", concept: "الحلقة + الشرط: نختار بالشرط ثم نجمع أو نعدّ." });
  } });
  return G;
});
