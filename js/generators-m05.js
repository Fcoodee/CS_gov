/* مولِّدات المعيار 5 (البرمجة): تتبّع شيفرة وهياكل بيانات. مولَّدة آليًا وغير مراجَعة رسميًا. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory(require("./generators.js"));
  else factory(root.CSGen);
})(typeof self !== "undefined" ? self : this, function (G) {
  "use strict";
  var H = G.helpers, build = H.build, need = H.need;
  var RL = "ص67–72", RS = "ص89–93", RT = "ص94–97", RA = "ص75–81";
  function ex(s) { return "`" + s + "`"; }
  function rangeArr(a, b, s) { var o = []; for (var i = a; s > 0 ? i < b : i > b; i += s) o.push(i); return o; }
  function pick3(r, ok, cands, generic) {
    var seen = {}; seen[ok] = 1; var out = [];
    cands.forEach(function (c) { if (!seen[c.t] && out.length < 3) { seen[c.t] = 1; out.push(c); } });
    var g = 0; while (out.length < 3 && g++ < 60) { var c2 = generic(r); if (!seen[c2.t]) { seen[c2.t] = 1; out.push(c2); } }
    need(out.length === 3, "not enough wrongs"); return out;
  }
  function W(w) { return { t: w.t, name: w.name, why: w.why, steps: w.steps }; }

  /* 1) عدد دورات for in range */
  G.register("rangecount", { std: 5, ind: 2, lvl: "تطبيق", ref: RL, name: "عدد دورات range", gen: function (r) {
    var a = r.int(0, 5), s = r.pick([1, 2, 3, 4]), n = r.int(3, 9), b = a + s * n + r.int(0, s - 1);
    var arr = rangeArr(a, b, s), ok = arr.length;
    var cands = [
      { t: String(ok + 1), name: "اعتبار النهاية مشمولة", why: "end في range غير مشمولة.", steps: ["range تتوقف قبل " + b + ".", "العدد = " + ok + " لا " + (ok + 1) + "."] },
      { t: String(b - a), name: "تجاهل الخطوة", why: "اعتُبرت الخطوة 1.", steps: ["الخطوة " + s + " وليست 1.", "القيم: " + arr.join("، ") + " = " + ok + " قيمة."] },
      { t: String(Math.ceil((b - a) / s) + 1), name: "زيادة واحد", why: "أُضيف واحد خطأً.", steps: ["ceil((end−start)/step) = " + ok + ".", "لا حاجة إلى +1."] },
      { t: String(Math.floor((b - a) / s) - (((b - a) % s) ? 0 : 1)), name: "خطأ في التقريب", why: "قُرِّب الناتج خطأً.", steps: ["القيم الفعلية: " + arr.join("، ") + ".", "عددها " + ok + "."] }
    ];
    var ws = pick3(r, String(ok), cands, function (rr) { return { t: String(ok + rr.pick([-2, 2, 3, -1, 4])), name: "عدّ خاطئ", why: "عدّ غير مطابق.", steps: ["اكتب قيم المتغير: " + arr.join("، ") + ".", "عددها " + ok + "."] }; }).filter(function (w) { return +w.t > 0; });
    need(ws.length === 3, "neg");
    return build({ tpl: "rangecount", ind: 2, lvl: "تطبيق", ref: RL, params: { a: a, b: b, s: s },
      stem: "كم مرة تُنفَّذ الحلقة " + ex("for i in range(" + a + ", " + b + ", " + s + ")") + " في بايثون؟",
      correct: { t: String(ok), why: "القيم: " + arr.join("، ") + "." },
      wrongs: ws.map(W),
      steps: ["range(start, end, step): تبدأ من " + a + " وتتوقف قبل " + b + " بخطوة " + s + ".", "القيم: " + arr.join("، ") + ".", "عددها " + ok + "."],
      verify: "تحقق: القيمة الأخيرة " + arr[arr.length - 1] + " < " + b + " والتالية " + (arr[arr.length - 1] + s) + " ≥ " + b + ".",
      hint: "هل النهاية مشمولة؟ وبكم تزداد i في كل دورة؟",
      concept: "range(start, end, step) لا تشمل end." });
  } });

  /* 2) مجموع قيم الحلقة */
  G.register("rangesum", { std: 5, ind: 2, lvl: "تطبيق", ref: RL, name: "مجموع قيم الحلقة", gen: function (r) {
    var a = r.int(0, 3), s = r.pick([1, 2, 3]), n = r.int(3, 6), b = a + s * n, arr = rangeArr(a, b, s);
    var sum = arr.reduce(function (x, y) { return x + y; }, 0);
    var incl = sum + b, noFirst = sum - arr[0], prod = arr.length;
    var cands = [
      { t: String(incl), name: "تضمين النهاية", why: "end غير مشمولة.", steps: ["القيم تنتهي عند " + arr[arr.length - 1] + ".", "المجموع " + sum + " لا " + incl + "."] },
      { t: String(noFirst), name: "إهمال أول قيمة", why: "بدأ المجموع من القيمة الثانية.", steps: ["القيمة الأولى هي " + arr[0] + " وتُحسب.", "المجموع " + sum + "."] },
      { t: String(arr.length * (arr.length + 1) / 2), name: "مجموع الأعداد 1..n", why: "طُبِّقت صيغة 1+…+n.", steps: ["القيم ليست 1..n بل " + arr.join("، ") + ".", "المجموع " + sum + "."] },
      { t: String(sum - arr[arr.length - 1]), name: "إهمال آخر قيمة", why: "حُذفت آخر قيمة.", steps: ["آخر قيمة " + arr[arr.length - 1] + " تُحسب.", "المجموع " + sum + "."] }
    ];
    var ws = pick3(r, String(sum), cands, function (rr) { return { t: String(sum + rr.pick([-3, 3, 5, -5, 7])), name: "خطأ في الجمع", why: "جمع غير مطابق.", steps: ["اجمع: " + arr.join(" + ") + " = " + sum + "."] .concat(["الناتج المقترح مختلف."]) }; });
    return build({ tpl: "rangesum", ind: 2, lvl: "تطبيق", ref: RL, params: { a: a, b: b, s: s },
      stem: "ما قيمة المتغير total بعد تنفيذ: " + ex("total = 0") + " ثم " + ex("for i in range(" + a + ", " + b + ", " + s + "): total += i") + " ؟",
      correct: { t: String(sum), why: arr.join(" + ") + " = " + sum + "." },
      wrongs: ws.map(W),
      steps: ["قيم i: " + arr.join("، ") + " (النهاية " + b + " غير مشمولة).", "total يجمع كل قيمة: " + arr.join(" + ") + ".", "الناتج " + sum + "."],
      verify: "تحقق: عدد القيم " + arr.length + " ومتوسطها " + (sum / arr.length) + ".",
      hint: "اكتب قيم i أولًا ثم اجمعها.", concept: "total += i يضيف قيمة i في كل دورة." });
  } });

  /* 3) عمليات المكدس */
  G.register("stackops", { std: 5, ind: 3, lvl: "تطبيق", ref: RS, name: "عمليات المكدس", gen: function (r) {
    var n = r.int(4, 6), vals = r.shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]).slice(0, n), ops = [], st = [], log = [];
    var pushes = vals.slice(); var pi = 0, popsLeft = 0;
    var steps = r.int(n + 1, n + 3);
    for (var i = 0; i < steps; i++) {
      var canPop = st.length > 1, canPush = pi < pushes.length;
      var doPop = canPop && (!canPush || r.int(0, 2) === 0);
      if (doPop) { var v = st.pop(); ops.push("Pop"); log.push("Pop ← " + v); }
      else { st.push(pushes[pi]); ops.push("Push(" + pushes[pi] + ")"); log.push("Push " + pushes[pi]); pi++; }
    }
    need(st.length >= 1, "empty");
    var top = st[st.length - 1], size = st.length;
    var asked = r.pick(["top", "size"]);
    var okv = asked === "top" ? top : size;
    var full = pushes.slice(0, pi);
    var cands = asked === "top" ? [
      { t: String(st[0]), name: "قراءة القاع بدل القمة", why: "المكدس LIFO: القمة هي آخر المضاف.", steps: ["القاع هو " + st[0] + ".", "القمة هي " + top + "."] },
      { t: String(full[full.length - 1]), name: "تجاهل عمليات Pop", why: "آخر ما أُضيف أُزيل ببعض عمليات Pop.", steps: ["آخر Push كان " + full[full.length - 1] + ".", "لكن Pop أزالت عناصر؛ القمة الحالية " + top + "."] },
      { t: String(full[0]), name: "قاعدة FIFO", why: "اعتُبر الأول دخولًا هو الأول خروجًا.", steps: ["المكدس يتبع LIFO وليس FIFO.", "القمة " + top + "."] }
    ] : [
      { t: String(pi), name: "تجاهل Pop", why: "لم تُطرح العناصر المحذوفة.", steps: ["عدد Push = " + pi + ".", "عدد Pop = " + (pi - size) + " فالحجم " + size + "."] },
      { t: String(pi - size), name: "عدد Pop بدل الحجم", why: "عُدّت العناصر المحذوفة.", steps: ["الحجم = Push − Pop = " + size + "."] .concat(["العدد المقترح هو عدد Pop."]) },
      { t: String(size + 1), name: "زيادة واحد", why: "خطأ في العدّ.", steps: ["الحجم = " + pi + " − " + (pi - size) + " = " + size + "."] .concat(["لا زيادة."]) }
    ];
    var ws = pick3(r, String(okv), cands, function (rr) { return { t: String(okv + rr.pick([-1, 2, 3, 4])), name: "عدّ خاطئ", why: "ناتج غير مطابق.", steps: ["تتبّع المكدس بعد كل عملية.", "النتيجة " + okv + "."] }; }).filter(function (w) { return +w.t >= 0; });
    need(ws.length === 3, "neg");
    return build({ tpl: "stackops", ind: 3, lvl: "تطبيق", ref: RS, params: { ops: ops, asked: asked },
      stem: "مكدس فارغ نُفِّذت عليه العمليات بالترتيب: " + ex(ops.join(", ")) + " . " + (asked === "top" ? "ما العنصر في قمة المكدس؟" : "كم عنصرًا في المكدس؟"),
      correct: { t: String(okv), why: asked === "top" ? "المكدس LIFO: القمة آخر ما بقي." : "الحجم = عدد Push − عدد Pop." },
      wrongs: ws.map(W),
      steps: ["نتتبّع: " + log.join("؛ ") + ".", "المكدس النهائي من القاع إلى القمة: [" + st.join(", ") + "].", asked === "top" ? "القمة " + top + "." : "الحجم " + size + "."],
      verify: "لا Pop على مكدس فارغ هنا (لا Underflow).", hint: "ارسم المكدس عموديًا، والعنصر المضاف أخيرًا يخرج أولًا.",
      concept: "المكدس LIFO: الإضافة والحذف من القمة." });
  } });

  /* 4) عمليات الطابور */
  G.register("queueops", { std: 5, ind: 3, lvl: "تطبيق", ref: RS, name: "عمليات الطابور", gen: function (r) {
    var n = r.int(4, 6), vals = r.shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]).slice(0, n), q = [], ops = [], log = [], pi = 0;
    var steps = r.int(n + 1, n + 3);
    for (var i = 0; i < steps; i++) {
      var canDeq = q.length > 1, canEnq = pi < vals.length;
      if (canDeq && (!canEnq || r.int(0, 2) === 0)) { var v = q.shift(); ops.push("Dequeue"); log.push("Dequeue ← " + v); }
      else { q.push(vals[pi]); ops.push("Enqueue(" + vals[pi] + ")"); log.push("Enqueue " + vals[pi]); pi++; }
    }
    var front = q[0], rear = q[q.length - 1], asked = r.pick(["front", "rear"]);
    var okv = asked === "front" ? front : rear;
    var all = vals.slice(0, pi);
    var cands = [
      { t: String(asked === "front" ? rear : front), name: "خلط المؤشرين", why: "Front للأول وRear للأخير.", steps: ["Front = " + front + " وRear = " + rear + "."] .concat(["اختير المؤشر المعاكس."]) },
      { t: String(all[0]), name: "تجاهل Dequeue", why: "حُذفت عناصر من الأمام.", steps: ["أول من دخل كان " + all[0] + " لكنه خرج.", "Front الحالي " + front + "."] },
      { t: String(all[all.length - 1]), name: "الخلط مع آخر مُضاف دون اعتبار الحذف", why: "آخر مُضاف هو Rear دائمًا.", steps: ["آخر Enqueue كان " + all[all.length - 1] + ".", "Rear = " + rear + "."] }
    ];
    var ws = pick3(r, String(okv), cands, function (rr) { return { t: String(okv + rr.pick([-1, 1, 2, 3])), name: "عدّ خاطئ", why: "ناتج غير مطابق.", steps: ["تتبّع الطابور خطوة خطوة.", "النتيجة " + okv + "."] }; }).filter(function (w) { return +w.t >= 0; });
    need(ws.length === 3, "neg");
    return build({ tpl: "queueops", ind: 3, lvl: "تطبيق", ref: RS, params: { ops: ops, asked: asked },
      stem: "طابور فارغ نُفِّذت عليه العمليات بالترتيب: " + ex(ops.join(", ")) + " . ما العنصر " + (asked === "front" ? "الأمامي (Front)" : "الأخير (Rear)") + "؟",
      correct: { t: String(okv), why: asked === "front" ? "Front هو أقدم عنصر باقٍ (FIFO)." : "Rear هو آخر عنصر أُضيف وبقي." },
      wrongs: ws.map(W),
      steps: ["نتتبّع: " + log.join("؛ ") + ".", "الطابور من الأمام إلى الخلف: [" + q.join(", ") + "].", (asked === "front" ? "Front " + front : "Rear " + rear) + "."],
      verify: "الحذف من الأمام والإضافة من الخلف.", hint: "من يخرج أولًا في FIFO؟", concept: "الطابور FIFO: الإضافة من النهاية (Rear) والحذف من البداية (Front)." });
  } });

  /* 5) شجرة ثنائية: BFS / DFS */
  function genTree(r, n) {
    var labels = "ABCDEFGHIJ".split("").slice(0, n), ch = {}; labels.forEach(function (l) { ch[l] = []; });
    for (var i = 1; i < n; i++) { for (var t = 0; t < 40; t++) { var p = labels[r.int(0, i - 1)]; if (ch[p].length < 2) { ch[p].push(labels[i]); break; } } }
    return { labels: labels, ch: ch };
  }
  function bfs(T) { var q = [T.labels[0]], o = []; while (q.length) { var x = q.shift(); o.push(x); T.ch[x].forEach(function (c) { q.push(c); }); } return o; }
  function pre(T, x, o) { o = o || []; o.push(x); T.ch[x].forEach(function (c) { pre(T, c, o); }); return o; }
  function post(T, x, o) { o = o || []; T.ch[x].forEach(function (c) { post(T, c, o); }); o.push(x); return o; }
  G.register("treetrav", { std: 5, ind: 3, lvl: "تطبيق", ref: RT, name: "تجوال الشجرة BFS/DFS", gen: function (r) {
    var n = r.int(6, 8), T, B, D, tries = 0;
    do { T = genTree(r, n); B = bfs(T).join(" "); D = pre(T, "A").join(" "); } while (B === D && tries++ < 50);
    need(B !== D, "same");
    var kind = r.pick(["BFS", "DFS"]), ok = kind === "BFS" ? B : D;
    var P = post(T, "A").join(" "), rb = bfs(T).slice().reverse().join(" "), other = kind === "BFS" ? D : B;
    var desc = T.labels.filter(function (l) { return T.ch[l].length; }).map(function (l) { return l + " ← " + T.ch[l].join("،"); }).join("؛ ");
    var cands = [
      { t: other, name: "الخلط بين BFS وDFS", why: "نُفّذ الأسلوب الآخر.", steps: ["BFS يزور المستوى كاملًا قبل النزول؛ DFS ينزل في فرع حتى النهاية.", "المطلوب " + kind + " = " + ok + "."] },
      { t: P, name: "الترتيب اللاحق (Postorder)", why: "زيارة الجذر آخرًا.", steps: ["في DFS المطلوب هنا يزور العقدة قبل أبنائها.", "الترتيب اللاحق يعطي " + P + "."] },
      { t: rb, name: "عكس ترتيب BFS", why: "قُرئت المستويات من الأسفل.", steps: ["BFS من الجذر إلى الأسفل.", "العكس " + rb + " ليس تجوالًا من الجذر."] },
      { t: T.labels.join(" "), name: "الترتيب الأبجدي", why: "قُرئت العقد بأسمائها.", steps: ["أسماء العقد لا تحدد ترتيب الزيارة.", "الصحيح " + ok + "."] }
    ];
    var ws = pick3(r, ok, cands, function (rr) { var a = ok.split(" "), i = rr.int(0, a.length - 2); var t = a[i]; a[i] = a[i + 1]; a[i + 1] = t; return { t: a.join(" "), name: "تبديل عقدتين متجاورتين", why: "خطأ في ترتيب الزيارة.", steps: ["تحقق من ترتيب الأبناء (اليسار أولًا).", "الصحيح " + ok + "."] }; });
    return build({ tpl: "treetrav", ind: 3, lvl: "تطبيق", ref: RT, params: { ch: T.ch, kind: kind, n: n },
      stem: "شجرة ثنائية جذرها A، وأبناء كل عقدة بالترتيب (الأيسر أولًا): " + desc + ". ما ترتيب زيارة العقد في البحث " + (kind === "BFS" ? "بأولوية الاتساع (BFS)" : "بأولوية العمق (DFS) بزيارة العقدة قبل أبنائها") + "؟",
      correct: { t: ex(ok), why: kind === "BFS" ? "مستوى بعد مستوى باستخدام طابور." : "نزول في الفرع الأيسر حتى النهاية ثم الرجوع (باستخدام مكدس)." },
      wrongs: ws.map(function (w) { return { t: ex(w.t), name: w.name, why: w.why, steps: w.steps }; }),
      steps: [kind === "BFS" ? "BFS يستخدم طابورًا: نزور الجذر ثم أبناءه ثم أبناء الأبناء." : "DFS يستخدم مكدسًا: ننزل في أول ابن حتى الورقة ثم نعود.", "التتبّع يعطي: " + ok + "."],
      verify: "عدد العقد المزارة " + n + " وكل عقدة مرة واحدة.", hint: kind === "BFS" ? "طابور: ابدأ بالجذر وأضف أبناء كل عقدة تُزار." : "مكدس/عودية: انزل إلى أول ابن دائمًا.",
      concept: "BFS: مستوى مستوى (طابور). DFS: عمق أولًا (مكدس)." });
  } });

  /* 6) خصائص الشجرة */
  G.register("treeprops", { std: 5, ind: 3, lvl: "تطبيق", ref: RT, name: "خصائص الشجرة", gen: function (r) {
    var t = r.pick(["edges", "levelmax", "totalmax"]), n = r.int(5, 15), d = r.int(2, 5);
    var ok, stem, why, cands, concept;
    if (t === "edges") { ok = n - 1; stem = "شجرة تحتوي " + n + " عقدة. كم عدد حوافها (Edges)؟"; why = "الحواف = n − 1 = " + ok + ".";
      cands = [{ t: String(n), name: "الحواف = n", why: "ما من حافة للجذر.", steps: ["الجذر بلا أصل فلا حافة له.", "الصحيح " + ok + "."] }, { t: String(n + 1), name: "الحواف = n+1", why: "زيادة غير مبررة.", steps: ["كل عقدة عدا الجذر لها حافة واحدة إلى أصلها.", "الصحيح " + ok + "."] }, { t: String(n - 2), name: "n − 2", why: "نقص حافة.", steps: ["n−1 عقدة غير جذر ولكل منها حافة.", "الصحيح " + ok + "."] }]; concept = "في أي شجرة: الحواف = n − 1."; }
    else if (t === "levelmax") { ok = Math.pow(2, d - 1); stem = "في شجرة ثنائية، ما أقصى عدد للعقد في المستوى رقم " + d + " (الجذر في المستوى 1)؟"; why = "2^(" + d + "−1) = " + ok + ".";
      cands = [{ t: String(Math.pow(2, d)), name: "2^d", why: "رقّم الجذر 0 خطأً.", steps: ["الجذر في المستوى 1 فالأس d−1.", "الصحيح " + ok + "."] }, { t: String(2 * d), name: "2d", why: "ضرب بدل الأس.", steps: ["كل مستوى يضاعف العدد: أس لا ضرب.", "الصحيح " + ok + "."] }, { t: String(d * d), name: "d²", why: "تربيع.", steps: ["العدد يتضاعف مع كل مستوى.", "الصحيح " + ok + "."] }]; concept = "أقصى عدد للعقد في المستوى L من شجرة ثنائية: 2^(L−1)."; }
    else { ok = Math.pow(2, d) - 1; stem = "ما أقصى عدد للعقد في شجرة ثنائية لها " + d + " مستويات؟"; why = "2^" + d + " − 1 = " + ok + ".";
      cands = [{ t: String(Math.pow(2, d)), name: "2^d", why: "نُسي طرح 1.", steps: ["1+2+…+2^(d−1) = 2^d − 1.", "الصحيح " + ok + "."] }, { t: String(Math.pow(2, d - 1)), name: "عقد المستوى الأخير فقط", why: "حُسب مستوى واحد.", steps: ["المطلوب مجموع كل المستويات.", "الصحيح " + ok + "."] }, { t: String(2 * d - 1), name: "2d − 1", why: "نمو خطي بدل الأسي.", steps: ["النمو أسي.", "الصحيح " + ok + "."] }]; concept = "أقصى عقد في d مستويات: 2^d − 1."; }
    var ws = pick3(r, String(ok), cands, function (rr) { return { t: String(ok + rr.pick([2, 3, 5, 7])), name: "حساب خاطئ", why: "ناتج غير مطابق للقاعدة.", steps: ["القاعدة: " + why, "الصحيح " + ok + "."] }; });
    return build({ tpl: "treeprops", ind: 3, lvl: "تطبيق", ref: RT, params: { t: t, n: n, d: d },
      stem: stem, correct: { t: String(ok), why: why }, wrongs: ws.map(W),
      steps: ["القاعدة: " + why, "نعوّض القيم: " + ok + "."], verify: t === "edges" ? "شجرة من عقدتين: حافة واحدة = 2−1." : "مستويان: " + (t === "levelmax" ? "المستوى 2 يتسع لعقدتين" : "3 عقد") + ".",
      hint: "ما الذي يتضاعف عند كل مستوى؟", concept: concept });
  } });

  /* 7) تعابير بايثون على قائمة */
  G.register("pylist", { std: 5, ind: 2, lvl: "تطبيق", ref: RA, name: "قوائم بايثون", gen: function (r) {
    var L = r.shuffle([2, 3, 4, 5, 6, 7, 8, 9]).slice(0, r.int(5, 6)), n = L.length;
    var kind = r.pick(["idx", "neg", "slice", "rev", "len", "step"]);
    var j = r.int(1, n - 2), i0 = r.int(0, j - 1);
    var expr, val, wrongs, why;
    var f = function (a) { return "[" + a.join(", ") + "]"; };
    if (kind === "idx") { var k = r.int(0, n - 1); expr = "a[" + k + "]"; val = String(L[k]); why = "الفهرس يبدأ من 0 فالعنصر رقم " + k + " هو " + L[k] + ".";
      wrongs = [{ t: String(L[k + 1 < n ? k + 1 : k - 1]), name: "العدّ من 1", why: "الفهرس يبدأ من 0.", steps: ["a[0] هو أول عنصر.", "a[" + k + "] = " + L[k] + "."] }, { t: String(L[n - 1 - k]), name: "العدّ من النهاية", why: "اعتُبر الفهرس من آخر القائمة.", steps: ["الفهرس الموجب يعدّ من البداية.", "a[" + k + "] = " + L[k] + "."] }, { t: String(k), name: "الفهرس نفسه", why: "أُعيد الفهرس لا القيمة.", steps: ["المطلوب القيمة المخزنة عند الفهرس.", "= " + L[k] + "."] }]; }
    else if (kind === "neg") { var m = r.int(1, 3); expr = "a[-" + m + "]"; val = String(L[n - m]); why = "الفهرس السالب يعدّ من النهاية: a[-" + m + "] = " + L[n - m] + ".";
      wrongs = [{ t: String(L[m]), name: "اعتبار السالب موجبًا", why: "-" + m + " ليس " + m + ".", steps: ["السالب من النهاية.", "a[-" + m + "] = " + L[n - m] + "."] }, { t: String(L[m - 1]), name: "العدّ من البداية", why: "السالب لا يعدّ من البداية.", steps: ["a[-1] هو آخر عنصر.", "a[-" + m + "] = " + L[n - m] + "."] }, { t: String(L[n - m - 1 >= 0 ? n - m - 1 : 0]), name: "خطأ بمقدار واحد", why: "a[-1] هو الأخير لا قبله.", steps: ["a[-1] آخر عنصر.", "a[-" + m + "] = " + L[n - m] + "."] }]; }
    else if (kind === "slice") { expr = "a[" + i0 + ":" + (j + 1) + "]"; var sl = L.slice(i0, j + 1); val = f(sl); why = "القطع a[s:e] تشمل s وتستثني e: " + val + ".";
      wrongs = [{ t: f(L.slice(i0, j + 2)), name: "تضمين النهاية", why: "e غير مشمولة.", steps: ["الفهرس " + (j + 1) + " غير مشمول.", "الصحيح " + val + "."] }, { t: f(L.slice(i0 + 1, j + 1)), name: "استثناء البداية", why: "s مشمولة.", steps: ["الفهرس " + i0 + " مشمول.", "الصحيح " + val + "."] }, { t: f(L.slice(i0 + 1, j + 2)), name: "إزاحة بمقدار واحد", why: "العدّ من 1.", steps: ["الفهرس يبدأ من 0.", "الصحيح " + val + "."] }]; }
    else if (kind === "rev") { expr = "a[::-1]"; val = f(L.slice().reverse()); why = "الخطوة -1 تعكس القائمة.";
      var srt = L.slice().sort(function (x, y) { return x - y; });
      wrongs = [{ t: f(L), name: "الإبقاء على القائمة", why: "الخطوة -1 تعكس الترتيب.", steps: ["a[::-1] يمرّ من النهاية إلى البداية.", "الصحيح " + val + "."] }, { t: f(srt), name: "الخلط مع الترتيب", why: "العكس ليس ترتيبًا تصاعديًا.", steps: ["العكس يقلب مواضع العناصر كما هي.", "الصحيح " + val + "."] }, { t: f(L.slice().reverse().slice(1)), name: "حذف عنصر", why: "العكس يحتفظ بكل العناصر.", steps: ["عدد العناصر ثابت.", "الصحيح " + val + "."] }]; }
    else if (kind === "len") { expr = "len(a)"; val = String(n); why = "عدد عناصر القائمة = " + n + ".";
      wrongs = [{ t: String(n - 1), name: "آخر فهرس", why: "آخر فهرس n−1 لا العدد.", steps: ["الفهارس من 0 إلى " + (n - 1) + ".", "len = " + n + "."] }, { t: String(n + 1), name: "زيادة واحد", why: "خطأ عدّ.", steps: ["عدّ العناصر فقط.", "len = " + n + "."] }, { t: String(L.reduce(function (x, y) { return x + y; }, 0)), name: "مجموع العناصر", why: "len لا تجمع القيم.", steps: ["len تعدّ ولا تجمع.", "len = " + n + "."] }]; }
    else { var s = r.pick([2, 3]); expr = "a[::" + s + "]"; var st = L.filter(function (_, i) { return i % s === 0; }); val = f(st); why = "كل عنصر رقم " + s + " ابتداءً من الفهرس 0.";
      wrongs = [{ t: f(L.filter(function (_, i) { return i % s === 1; })), name: "البدء من الفهرس 1", why: "القطع يبدأ من 0.", steps: ["الفهرس 0 هو الأول.", "الصحيح " + val + "."] }, { t: f(L.filter(function (_, i) { return i % s !== 0; })), name: "تخطي المطلوب", why: "عُكس الاختيار.", steps: ["الخطوة تختار ولا تحذف.", "الصحيح " + val + "."] }, { t: f(L.slice(0, st.length)), name: "أخذ البداية فقط", why: "اعتُبر القطع أول عناصر.", steps: ["الخطوة تقفز بين الفهارس.", "الصحيح " + val + "."] }]; }
    var okt = val;
    var seen = {}; seen[okt] = 1; var ws = wrongs.filter(function (w) { if (seen[w.t]) return false; seen[w.t] = 1; return true; });
    var g = 0; while (ws.length < 3 && g++ < 30) { var c = String(parseInt(okt, 10) + g); if (kind === "idx" || kind === "neg" || kind === "len") { if (!seen[c]) { seen[c] = 1; ws.push({ t: c, name: "قيمة قريبة", why: "قيمة غير مطابقة.", steps: ["تتبّع الفهرس بدقة.", "الصحيح " + okt + "."] }); } } else break; }
    need(ws.length === 3, "wrongs");
    return build({ tpl: "pylist", ind: 2, lvl: "تطبيق", ref: RA, params: { a: L, expr: expr },
      stem: "إذا كانت " + ex("a = " + f(L)) + " في بايثون، فما ناتج " + ex(expr) + " ؟",
      correct: { t: ex(okt), why: why }, wrongs: ws.slice(0, 3).map(function (w) { w = W(w); w.t = ex(w.t); return w; }),
      steps: ["الفهارس: " + L.map(function (v, i) { return i + "→" + v; }).join("، ") + ".", why], verify: "القائمة تحوي " + n + " عناصر وفهارسها 0–" + (n - 1) + ".",
      hint: "من أي فهرس يبدأ العدّ؟ وهل النهاية مشمولة في القطع؟", concept: "فهرس القائمة يبدأ من 0؛ القطع a[s:e] يستثني e؛ السالب من النهاية." });
  } });

  /* 8) عوامل بايثون: // % ** */
  G.register("pyops", { std: 5, ind: 2, lvl: "تطبيق", ref: RA, name: "عوامل بايثون", gen: function (r) {
    var op = r.pick(["//", "%", "**"]), a, b, v;
    if (op === "**") { a = r.int(2, 5); b = r.int(2, 4); v = Math.pow(a, b); } else { b = r.int(2, 9); a = r.int(b + 1, 60); v = op === "//" ? Math.floor(a / b) : a % b; }
    var cands;
    if (op === "//") cands = [{ t: (a / b).toFixed(2).replace(/\.?0+$/, ""), name: "القسمة العادية", why: "// تعطي الجزء الصحيح فقط.", steps: ["a / b = " + (a / b).toFixed(2) + " (عشري).", "a // b يقطع الكسر: " + v + "."] }, { t: String(a % b), name: "الخلط مع الباقي", why: "% يعطي الباقي لا الناتج.", steps: ["الباقي " + (a % b) + ".", "ناتج // هو " + v + "."] }, { t: String(Math.ceil(a / b)), name: "التقريب للأعلى", why: "// تقرّب للأسفل.", steps: ["// = floor.", "الناتج " + v + "."] }];
    else if (op === "%") cands = [{ t: String(Math.floor(a / b)), name: "الخلط مع //", why: "% يعطي الباقي.", steps: ["a // b = " + Math.floor(a / b) + ".", "الباقي " + v + "."] }, { t: String(b - v), name: "المتمم", why: "ليس b − الباقي.", steps: ["الباقي = a − b × (a//b) = " + v + "."] .concat(["لا يُطرح من المقسوم عليه."]) }, { t: (a / b).toFixed(2).replace(/\.?0+$/, ""), name: "القسمة العادية", why: "% ليست قسمة.", steps: ["a / b = " + (a / b).toFixed(2) + ".", "الباقي " + v + "."] }];
    else cands = [{ t: String(a * b), name: "الضرب بدل الأس", why: "** أس لا ضرب.", steps: [a + " × " + b + " = " + (a * b) + " ليس الأس.", a + "^" + b + " = " + v + "."] }, { t: String(Math.pow(b, a)), name: "عكس الأساس والأس", why: "الأساس " + a + " والأس " + b + ".", steps: [b + "^" + a + " = " + Math.pow(b, a) + ".", "المطلوب " + a + "^" + b + " = " + v + "."] }, { t: String(a + b), name: "الجمع", why: "** ليست جمعًا.", steps: ["ناتج الجمع " + (a + b) + ".", "الصحيح " + v + "."] }];
    var ws = pick3(r, String(v), cands, function (rr) { return { t: String(v + rr.pick([1, 2, 3, -1])), name: "حساب خاطئ", why: "ناتج غير مطابق.", steps: ["أعد الحساب: " + v + "."] .concat(["الناتج المقترح مختلف."]) }; });
    return build({ tpl: "pyops", ind: 2, lvl: "تطبيق", ref: RA, params: { op: op, a: a, b: b },
      stem: "ما ناتج " + ex(a + " " + op + " " + b) + " في بايثون؟",
      correct: { t: String(v), why: op === "//" ? "القسمة الصحيحة: " + a + " ÷ " + b + " ثم الجزء الصحيح." : op === "%" ? "الباقي بعد قسمة " + a + " على " + b + "." : a + " مرفوعة إلى " + b + "." },
      wrongs: ws.map(W),
      steps: [op === "//" ? a + " ÷ " + b + " = " + (a / b).toFixed(2) + " نأخذ الجزء الصحيح." : op === "%" ? a + " = " + b + " × " + Math.floor(a / b) + " + " + v + " فالباقي " + v + "." : a + "^" + b + " بضرب " + a + " في نفسها " + b + " مرات.", "الناتج " + v + "."],
      verify: op === "//" ? "تحقق: " + b + " × " + v + " ≤ " + a + " < " + b + " × " + (v + 1) + "." : op === "%" ? "تحقق: " + b + " × " + Math.floor(a / b) + " + " + v + " = " + a + "." : "تحقق: بالضرب المتتالي.",
      hint: "ماذا يعني هذا العامل بالضبط؟", concept: "// قسمة صحيحة، % الباقي، ** الأس." });
  } });

  /* 9) ++ في C/C++/Java: a = b++ مقابل a = ++b */
  G.register("incdec", { std: 5, ind: 2, lvl: "تطبيق", ref: "ص74", name: "زيادة ما قبل وما بعد", gen: function (r) {
    var b0 = r.int(2, 9), pre = r.int(0, 1) === 1, a = pre ? b0 + 1 : b0, b = b0 + 1;
    var ok = "a = " + a + ", b = " + b;
    var cands = [{ t: "a = " + (pre ? b0 : b0 + 1) + ", b = " + b, name: "عكس معنى ما قبل/ما بعد", why: pre ? "++b تزيد ثم تُسند." : "b++ تُسند ثم تزيد.", steps: [pre ? "++b: b تصبح " + b + " ثم تُسند إلى a." : "b++: تُسند القيمة القديمة " + b0 + " ثم تزيد.", "الصحيح " + ok + "."] },
      { t: "a = " + a + ", b = " + b0, name: "نسيان زيادة b", why: "b تزيد في الحالتين.", steps: ["كلا الشكلين يزيد b بواحد.", "الصحيح " + ok + "."] },
      { t: "a = " + b0 + ", b = " + b0, name: "عدم تنفيذ الزيادة", why: "الزيادة تنفَّذ.", steps: ["b تصبح " + b + ".", "الصحيح " + ok + "."] },
      { t: "a = " + (b + 1) + ", b = " + (b + 1), name: "زيادة مضاعفة", why: "تُنفَّذ زيادة واحدة فقط.", steps: ["++ تزيد 1 فقط.", "الصحيح " + ok + "."] }];
    var ws = pick3(r, ok, cands, function (rr) { return { t: "a = " + (a + rr.pick([2, 3])) + ", b = " + b, name: "حساب خاطئ", why: "قيمة غير مطابقة.", steps: ["تتبّع التعليمة بدقة.", "الصحيح " + ok + "."] }; });
    return build({ tpl: "incdec", ind: 2, lvl: "تطبيق", ref: "ص74", params: { b0: b0, pre: pre },
      stem: "في C++ كانت " + ex("b = " + b0) + " ثم نُفِّذت " + ex("a = " + (pre ? "++b" : "b++")) + " . ما قيمتا a وb؟",
      correct: { t: ex(ok), why: pre ? "++b تزيد b أولًا ثم تُسند." : "b++ تُسند القيمة الحالية ثم تزيد." },
      wrongs: ws.map(function (w) { w = W(w); w.t = ex(w.t); return w; }),
      steps: [pre ? "++b: تُزاد b إلى " + b + " ثم تُسند: a = " + a + "." : "b++: تُسند b الحالية: a = " + b0 + " ثم تُزاد b إلى " + b + ".", "النتيجة " + ok + "."],
      verify: "في الحالتين b تزيد 1؛ الفرق في قيمة a فقط.", hint: "هل الزيادة قبل الإسناد أم بعده؟", concept: "++x: زد ثم استخدم. x++: استخدم ثم زد." });
  } });
  return G;
});
