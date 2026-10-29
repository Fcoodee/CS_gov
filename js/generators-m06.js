/* مولِّدات المعيار 6 (قواعد البيانات). مولَّدة آليًا وغير مراجَعة رسميًا. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory(require("./generators.js"));
  else factory(root.CSGen);
})(typeof self !== "undefined" ? self : this, function (G) {
  "use strict";
  var H = G.helpers, build = H.build, need = H.need;
  function ex(s) { return "`" + s + "`"; }
  function W(w) { return { t: w.t, name: w.name, why: w.why, steps: w.steps }; }
  function pick3(r, ok, cands, generic) {
    var seen = {}; seen[ok] = 1; var out = [];
    cands.forEach(function (c) { if (!seen[c.t] && out.length < 3) { seen[c.t] = 1; out.push(c); } });
    var g = 0; while (out.length < 3 && g++ < 60) { var c2 = generic(r); if (!seen[c2.t]) { seen[c2.t] = 1; out.push(c2); } }
    need(out.length === 3, "not enough wrongs"); return out;
  }

  /* 1) نتيجة استعلام SELECT على جدول صغير */
  var TBL = [{ t: "students", cols: ["id", "name", "score"], names: ["Ali", "Sara", "Omar", "Huda", "Nawaf", "Reem", "Faisal"], num: "score", lo: 40, hi: 100, dep: "الدرجة" },
    { t: "products", cols: ["id", "name", "price"], names: ["Pen", "Book", "Bag", "Lamp", "Mouse", "Cable", "Desk"], num: "price", lo: 10, hi: 90, dep: "السعر" },
    { t: "employees", cols: ["id", "name", "salary"], names: ["Nora", "Khalid", "Maha", "Saad", "Lina", "Majed", "Dana"], num: "salary", lo: 30, hi: 95, dep: "الراتب" }];
  G.register("sqlresult", { std: 6, ind: 5, lvl: "تطبيق", ref: "ص119–122", name: "نتيجة استعلام SQL", gen: function (r) {
    var T = r.pick(TBL), n = r.int(5, 7), nm = r.shuffle(T.names).slice(0, n), vals = [], i;
    var used = {}; for (i = 0; i < n; i++) { var v; do { v = r.int(T.lo, T.hi); } while (used[v]); used[v] = 1; vals.push(v); }
    var rows = nm.map(function (x, k) { return "(" + (k + 1) + ", " + x + ", " + vals[k] + ")"; });
    var th = r.int(Math.min.apply(null, vals) + 1, Math.max.apply(null, vals) - 1);
    var kind = r.pick(["count", "sum", "max", "min", "name"]);
    var op = r.pick([">", "<"]), pass = function (v) { return op === ">" ? v > th : v < th; };
    var sel = vals.filter(pass); need(sel.length >= 1, "empty");
    var q, ok, why, cands = [];
    var W0 = "WHERE " + T.num + " " + op + " " + th;
    if (kind === "count") { q = "SELECT COUNT(*) FROM " + T.t + " " + W0; ok = sel.length; why = "عدد الصفوف المحققة للشرط " + ok + ".";
      cands = [{ t: String(n), name: "تجاهل WHERE", why: "عُدّت كل الصفوف.", steps: ["COUNT(*) يعدّ الصفوف بعد تطبيق WHERE.", "الصحيح " + ok + "."] }, { t: String(vals.filter(function (v) { return op === ">" ? v >= th : v <= th; }).length), name: "الخلط بين > و ≥", why: "الشرط صارم.", steps: ["القيمة " + th + " لا تحقق الشرط الصارم.", "الصحيح " + ok + "."] }, { t: String(n - ok), name: "عدّ الصفوف غير المطابقة", why: "عُدّت الصفوف التي لا تحقق الشرط.", steps: ["COUNT يعدّ المطابقة.", "الصحيح " + ok + "."] }]; }
    else if (kind === "sum") { q = "SELECT SUM(" + T.num + ") FROM " + T.t + " " + W0; ok = sel.reduce(function (a, b) { return a + b; }, 0); why = "مجموع القيم المحققة للشرط: " + sel.join(" + ") + " = " + ok + ".";
      var all = vals.reduce(function (a, b) { return a + b; }, 0);
      cands = [{ t: String(all), name: "تجاهل WHERE", why: "جُمعت كل الصفوف.", steps: ["WHERE يصفّي قبل التجميع.", "الصحيح " + ok + "."] }, { t: String(all - ok), name: "جمع غير المطابقة", why: "عُكس الشرط.", steps: ["جُمعت القيم التي لا تحقق الشرط.", "الصحيح " + ok + "."] }, { t: String(sel.length), name: "العدّ بدل الجمع", why: "COUNT لا SUM.", steps: ["SUM يجمع القيم لا يعدّها.", "الصحيح " + ok + "."] }]; }
    else if (kind === "max") { q = "SELECT MAX(" + T.num + ") FROM " + T.t + " " + W0; ok = Math.max.apply(null, sel); why = "أكبر قيمة تحقق الشرط هي " + ok + ".";
      cands = [{ t: String(Math.max.apply(null, vals)), name: "تجاهل WHERE", why: "أُخذ الأكبر في الجدول كله.", steps: ["WHERE يصفّي أولًا.", "الصحيح " + ok + "."] }, { t: String(Math.min.apply(null, sel)), name: "MIN بدل MAX", why: "الأصغر لا الأكبر.", steps: ["MAX = أكبر قيمة.", "الصحيح " + ok + "."] }, { t: String(sel.length), name: "العدّ بدل MAX", why: "COUNT لا MAX.", steps: ["MAX تعيد قيمة من العمود.", "الصحيح " + ok + "."] }]; }
    else if (kind === "min") { q = "SELECT MIN(" + T.num + ") FROM " + T.t + " " + W0; ok = Math.min.apply(null, sel); why = "أصغر قيمة تحقق الشرط هي " + ok + ".";
      cands = [{ t: String(Math.min.apply(null, vals)), name: "تجاهل WHERE", why: "أُخذ الأصغر في الجدول كله.", steps: ["WHERE يصفّي أولًا.", "الصحيح " + ok + "."] }, { t: String(Math.max.apply(null, sel)), name: "MAX بدل MIN", why: "الأكبر لا الأصغر.", steps: ["MIN = أصغر قيمة.", "الصحيح " + ok + "."] }, { t: String(sel.length), name: "العدّ بدل MIN", why: "COUNT لا MIN.", steps: ["MIN تعيد قيمة من العمود.", "الصحيح " + ok + "."] }]; }
    else { var idx = vals.map(function (v, k) { return k; }).filter(function (k) { return pass(vals[k]); }); var star = r.pick(idx);
      q = "SELECT name FROM " + T.t + " WHERE " + T.num + " = " + vals[star]; ok = nm[star]; why = "الصف الذي " + T.num + " فيه " + vals[star] + " اسمه " + nm[star] + ".";
      var others = nm.filter(function (_, k) { return k !== star; }); cands = r.shuffle(others).slice(0, 3).map(function (x) { return { t: x, name: "صف مختلف", why: "هذا الاسم لصف قيمته مختلفة.", steps: ["الشرط يساوي " + vals[star] + " تمامًا.", "الصف المطابق هو " + nm[star] + "."] }; }); }
    var ws = pick3(r, String(ok), cands, function (rr) { return { t: String(Number(ok) + rr.pick([1, 2, 5, 10, -1])), name: "خطأ في الحساب", why: "ناتج غير مطابق.", steps: ["رتّب الصفوف المحققة للشرط ثم احسب.", "الصحيح " + ok + "."] }; });
    return build({ tpl: "sqlresult", ind: 5, lvl: "تطبيق", ref: "ص119–122", params: { t: T.t, rows: rows, kind: kind, op: op, th: th },
      stem: "جدول " + ex(T.t + "(" + T.cols.join(", ") + ")") + " صفوفه: " + ex(rows.join(" ")) + " . ما ناتج الاستعلام " + ex(q) + " ؟",
      correct: { t: String(ok), why: why }, wrongs: ws.map(function (w) { return W(w); }),
      steps: ["نطبّق الشرط أولًا " + (kind === "name" ? "" : ex(W0)) + " فنحصل على: " + (kind === "name" ? ex("= " + vals[star]) : sel.join("، ")) + ".", why],
      verify: "ترتيب التنفيذ: FROM ثم WHERE ثم دالة التجميع.", hint: "ابدأ بتصفية الصفوف بـ WHERE ثم طبّق الدالة.",
      concept: "WHERE يصفّي الصفوف قبل دوال التجميع COUNT/SUM/MAX/MIN." });
  } });

  /* 2) الشكل الطبيعي لجدول موصوف */
  var NFS = [
    { nf: "1NF", t: "الجدول يحتوي عمودًا بقيم متعددة في الخلية الواحدة", name: "مجموعات متكررة", fix: "الجدول غير مطبَّع (0NF): يلزم 1NF لتصبح كل خلية بقيمة واحدة." },
    { nf: "2NF", t: "مفتاحه الأساسي مركب، وأحد الأعمدة غير المفتاحية يعتمد على جزء من المفتاح فقط", name: "اعتماد جزئي", fix: "يلزم 2NF لإزالة الاعتماد الجزئي." },
    { nf: "3NF", t: "مفتاحه الأساسي مفرد، وأحد الأعمدة غير المفتاحية يعتمد على عمود غير مفتاحي آخر", name: "اعتماد متعدٍ", fix: "يلزم 3NF لإزالة الاعتماد المتعدي." }];
  var NFDOM = [{ tb: "الطلاب", pk: "رقم_الطالب", a: "اسم_الطالب" }, { tb: "الموظفون", pk: "رقم_الموظف", a: "اسم_الموظف" }, { tb: "الكتب", pk: "رقم_الكتاب", a: "عنوان_الكتاب" }, { tb: "المنتجات", pk: "رقم_المنتج", a: "اسم_المنتج" }];
  G.register("nfform", { std: 6, ind: 4, lvl: "تطبيق", ref: "ص114–118", name: "مشكلة التطبيع", gen: function (r) {
    var s = r.pick(NFS), d = r.pick(NFDOM), ok = s.nf;
    var desc = s.nf === "1NF" ? "جدول " + d.tb + " (" + d.pk + "، " + d.a + "، هواتف) وعمود «هواتف» يحوي أحيانًا أكثر من رقم في الخلية نفسها." :
      s.nf === "2NF" ? "جدول التسجيل (" + d.pk + "، رقم_المادة، الدرجة، " + d.a + ") مفتاحه الأساسي " + d.pk + " + رقم_المادة، و" + d.a + " يعتمد على " + d.pk + " وحده." :
      "جدول " + d.tb + " (" + d.pk + "، " + d.a + "، القسم، مدينة_القسم) مفتاحه الأساسي " + d.pk + " وحده، و«مدينة_القسم» تعتمد على «القسم» لا على " + d.pk + ".";
    var all = ["1NF", "2NF", "3NF"], others = all.filter(function (x) { return x !== ok; });
    var wn = { "1NF": "تكرار/تعدد القيم في الخلية الواحدة", "2NF": "الاعتماد الجزئي على جزء من المفتاح المركب", "3NF": "الاعتماد المتعدي بين عمودين غير مفتاحيين" };
    var cands = others.map(function (x) { return { t: x, name: "الخلط بين " + x + " و" + ok, why: x + " تعالج " + wn[x] + ".", steps: [x + " يعالج " + wn[x] + ".", "المشكلة هنا: " + s.name + " فيعالجها " + ok + "."] }; });
    cands.push({ t: "لا حاجة إلى تطبيع", name: "اعتبار الجدول سليمًا", why: "في الجدول مشكلة اعتماد أو تكرار ظاهرة.", steps: ["الوصف يتضمن " + s.name + ".", "إذًا يلزم " + ok + "."] });
    var ws = pick3(r, ok, cands, function () { return { t: "4NF", name: "شكل خارج المنهج", why: "المنهج يكتفي بـ 1NF–3NF.", steps: ["الأشكال المقصودة 1NF/2NF/3NF.", "الصحيح " + ok + "."] }; });
    return build({ tpl: "nfform", ind: 4, lvl: "تطبيق", ref: "ص114–118", params: { nf: ok },
      stem: "ما الشكل الطبيعي (التطبيع) الذي يعالج مشكلة هذا الجدول؟ " + desc,
      correct: { t: ok, why: s.fix }, wrongs: ws.map(function (w) { return W(w); }),
      steps: ["نحدد نوع المشكلة: " + s.name + ".", "1NF: قيمة واحدة في كل خلية. 2NF: لا اعتماد جزئي. 3NF: لا اعتماد متعدٍ.", "إذن " + ok + "."],
      verify: "التسلسل: 1NF ثم 2NF ثم 3NF، وكل مرحلة تشترط ما قبلها.", hint: "هل المشكلة تكرار؟ أم اعتماد على جزء من المفتاح؟ أم على عمود غير مفتاحي؟",
      concept: "1NF قيم ذرّية، 2NF يزيل الاعتماد الجزئي، 3NF يزيل الاعتماد المتعدي." });
  } });

  /* 3) نوع العلاقة في مخطط ER */
  var ENT = [[["طالب", "طلاب"], ["فصل", "فصول"]], [["معلم", "معلمون"], ["مادة", "مواد"]], [["عميل", "عملاء"], ["طلب", "طلبات"]], [["قسم", "أقسام"], ["موظف", "موظفون"]],
    [["كتاب", "كتب"], ["مؤلف", "مؤلفون"]], [["طبيب", "أطباء"], ["مريض", "مرضى"]], [["طالب", "طلاب"], ["نشاط", "أنشطة"]], [["مدرسة", "مدارس"], ["مدير", "مدراء"]]];
  G.register("ercard", { std: 6, ind: 2, lvl: "تطبيق", ref: "ص111–112", name: "نوع العلاقة في ER", gen: function (r) {
    var e0 = r.pick(ENT), sw = r.int(0, 1) === 1, p = sw ? [e0[1], e0[0]] : e0, a = r.int(0, 1) === 1, b = r.int(0, 1) === 1;
    var ok = !a && !b ? "واحد إلى واحد (1:1)" : (a && b ? "كثير إلى كثير (M:N)" : "واحد إلى كثير (1:N)");
    var side = function (x, many, y) { return "كل " + x[0] + " يرتبط مع " + (many ? "عدة " + y[1] : y[0] + " واحد فقط"); };
    var X = p[0][0], Y = p[1][0];
    var stem = "في مخطط الكيانات والعلاقات: " + side(p[0], a, p[1]) + "، و" + side(p[1], b, p[0]) + ". ما نوع العلاقة بين الكيانين؟";
    var all = ["واحد إلى واحد (1:1)", "واحد إلى كثير (1:N)", "كثير إلى كثير (M:N)"];
    var rest = all.filter(function (x) { return x !== ok; });
    var cands = rest.map(function (x) { return { t: x, name: "قراءة جهة واحدة فقط", why: "يجب فحص الاتجاهين معًا.", steps: ["الجهة الأولى: " + (a ? "عدة" : "واحد") + "، والثانية: " + (b ? "عدة" : "واحد") + ".", "إذن " + ok + "."] }; });
    cands.push({ t: "علاقة وراثة (IS-A)", name: "الخلط مع UML", why: "الوراثة مفهوم في UML.", steps: ["الوراثة تعني أن الابن يرث من الأب.", "النص يصف تعدد الارتباط لا الوراثة."] });
    var ws = pick3(r, ok, cands, function () { return { t: "علاقة تجميع", name: "مصطلح غير مناسب", why: "ليس من أنواع الأعداد.", steps: ["الأنواع المعتمدة: 1:1 و1:N وM:N.", "الصحيح " + ok + "."] }; });
    return build({ tpl: "ercard", ind: 2, lvl: "تطبيق", ref: "ص111–112", params: { a: a, b: b, X: X, Y: Y },
      stem: stem, correct: { t: ok, why: "الجهتان: " + (a ? "عدة" : "واحد") + " و" + (b ? "عدة" : "واحد") + "." }, wrongs: ws.map(function (w) { return W(w); }),
      steps: ["من جهة " + X + ": يرتبط بـ" + (a ? "عدة" : "واحد") + " " + Y + ".", "من جهة " + Y + ": يرتبط بـ" + (b ? "عدة" : "واحد") + " " + X + ".", "إذن " + ok + "."],
      verify: "واحد/واحد ← 1:1؛ عدة/عدة ← M:N؛ واحد/عدة ← 1:N.", hint: "اقرأ الجملتين: كم كيانًا يقابل الواحد في كل اتجاه؟", concept: "نوع العلاقة يُحدَّد من الاتجاهين: 1:1، 1:N، M:N." });
  } });
  return G;
});
