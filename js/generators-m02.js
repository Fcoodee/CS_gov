/* مولِّدات المعيار 2 (التصميم المنطقي). تُسجَّل في CSGen. الأسئلة مولَّدة آليًا وغير مراجَعة رسميًا. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory(require("./generators.js"));
  else factory(root.CSGen);
})(typeof self !== "undefined" ? self : this, function (G) {
  "use strict";
  var H = G.helpers, build = H.build, need = H.need, B = H.B, bin = H.bin;
  var REF1 = "ص23–26", REF2 = "ص27–30", REF3 = "ص31";
  function rev(s) { return s.split("").reverse().join(""); }
  function bitsStr(n, w) { return bin(n, w); }

  /* 1) جامع كامل */
  G.register("fulladder", { std: 2, ind: 1, lvl: "تطبيق", ref: REF1, name: "الجامع الكامل", gen: function (r) {
    var a = r.int(0, 1), b = r.int(0, 1), c = r.int(0, 1);
    var s1 = a ^ b, c1 = a & b, sum = s1 ^ c, c2 = s1 & c, cout = c1 | c2;
    var fmt = function (s, co) { return "Sum=" + s + ", Cout=" + co; };
    var ok = fmt(sum, cout);
    var pool = [
      { t: fmt(s1, c1), name: "إهمال حمل الدخل Cin", why: "اعتُبر الجمع بين A وB فقط.", steps: ["الجامع النصفي الأول فقط: Sum=" + s1 + " و Carry=" + c1 + ".", "لم يُمرَّر الناتج إلى الجامع النصفي الثاني مع Cin=" + c + "، فضاع أثر Cin."] },
      { t: fmt(cout, sum), name: "تبديل Sum وCout", why: "خلط بين خرج المجموع وخرج الحمل.", steps: ["الصحيح Sum=" + sum + " و Cout=" + cout + ".", "كُتبت القيمتان بالعكس."] },
      { t: fmt(sum, c1), name: "الاكتفاء بحمل الجامع الأول", why: "نُسي حمل الجامع الثاني وبوابة OR.", steps: ["حمل الجامع الأول c1=" + c1 + " وحمل الثاني c2=" + c2 + ".", "الحمل النهائي = c1 OR c2 = " + cout + "، لكن أُخذ c1 وحده (" + c1 + ")."] },
      { t: fmt(sum, c2), name: "الاكتفاء بحمل الجامع الثاني", why: "نُسي حمل الجامع الأول.", steps: ["حمل الجامع الأول c1=" + c1 + " وحمل الثاني c2=" + c2 + ".", "الحمل النهائي = c1 OR c2 = " + cout + "، لكن أُخذ c2 وحده (" + c2 + ")."] },
      { t: fmt(sum, c1 & c), name: "الحمل بـ AND بين A وB وCin", why: "اعتُبر الحمل 1 فقط إذا اجتمعت المداخل الثلاثة.", steps: ["الحمل يكفي أن يكون اثنان من المداخل الثلاثة = 1، لا الثلاثة.", "AND للثلاثة تعطي " + (a & b & c) + " بينما الحمل الصحيح " + cout + "."].slice(0, 2) },
      { t: fmt(a | b | c, cout), name: "المجموع بـ OR", why: "استُعملت OR بدل XOR للمجموع.", steps: ["OR للمداخل الثلاثة = " + (a | b | c) + ".", "المجموع الصحيح هو XOR (يساوي 1 عند عدد فردي من الآحاد) = " + sum + "."] }
    ].filter(function (w) { return w.t !== ok; });
    var seen = {}; var ws = r.shuffle(pool).filter(function (w) { if (seen[w.t]) return false; seen[w.t] = 1; return true; }).slice(0, 3);
    need(ws.length === 3, "pool too small");
    return build({ tpl: "fulladder", ind: 1, lvl: "تطبيق", ref: REF1, params: { a: a, b: b, c: c },
      stem: "جامع كامل مدخلاته A=" + a + " وB=" + b + " وCin=" + c + ". ما قيمة المجموع Sum وحمل الخرج Cout؟",
      correct: { t: B(ok), why: "جامعان نصفيان وبوابة OR: " + a + "+" + b + "+" + c + " = " + (2 * cout + sum) + " بالعشري." },
      wrongs: ws.map(function (w) { return { t: B(w.t), name: w.name, why: w.why, steps: w.steps }; }),
      steps: ["الجامع النصفي الأول (A وB): " + B("Sum1 = " + a + " XOR " + b + " = " + s1) + " ، " + B("Carry1 = " + a + " AND " + b + " = " + c1) + ".",
        "الجامع النصفي الثاني (Sum1 وCin): " + B("Sum = " + s1 + " XOR " + c + " = " + sum) + " ، " + B("Carry2 = " + s1 + " AND " + c + " = " + c2) + ".",
        "بوابة OR للحملين: " + B("Cout = " + c1 + " OR " + c2 + " = " + cout) + "."],
      verify: "تحقق عشريًا: " + a + " + " + b + " + " + c + " = " + (a + b + c) + " = " + B(bin(a + b + c, 2)) + "، أي Cout=" + cout + " وSum=" + sum + ".",
      hint: "الجامع الكامل = جامعان نصفيان + ماذا؟ وأين يدخل حمل الدخل؟",
      concept: "الجامع الكامل: جامعان نصفيان وبوابة OR؛ Sum = A⊕B⊕Cin، وCout = A·B + (A⊕B)·Cin." });
  } });

  /* يختار 3 قيم خاطئة مميّزة: نماذج الخطأ المسمّاة أولًا ثم قيم عامة عند الحاجة */
  function fill3(r, ok, N, cands, generic) {
    var used = {}; used[ok] = 1; var out = [];
    cands.forEach(function (c) { if (c.v >= 0 && c.v < N && !used[c.v] && out.length < 3) { used[c.v] = 1; out.push(c); } });
    var rest = r.shuffle(Array.from({ length: N }, function (_, i) { return i; }).filter(function (v) { return !used[v]; }));
    while (out.length < 3 && rest.length) out.push(generic(rest.shift()));
    need(out.length === 3, "not enough distinct wrongs");
    return out;
  }

  /* 2) فاك الشفرة */
  G.register("decoder", { std: 2, ind: 1, lvl: "تطبيق", ref: REF1, name: "فاك الشفرة (Decoder)", gen: function (r) {
    var n = r.pick([2, 3]), N = 1 << n, k = r.int(0, N - 1), code = bitsStr(k, n);
    var names = []; for (var i = n - 1; i >= 0; i--) names.push("A" + i);
    var kr = parseInt(rev(code), 2), kc = N - 1 - k;
    var O = function (x) { return B("O" + x); };
    var ws = fill3(r, k, N, [
      { v: kr, name: "قراءة المداخل بترتيب معكوس", why: "عُكس ترتيب الخانات.", steps: ["قُرئ الرمز " + rev(code) + " بدل " + code + ".", "فصار الرقم " + kr + " بدل " + k + "؛ والخانة الأعلى وزنًا هي " + names[0] + " (الأولى من اليسار)."] },
      { v: kc, name: "استعمال المكمل", why: "قُلبت الخانات.", steps: ["قُلب الرمز إلى " + bin(kc, n) + ".", "الـ Decoder لا يقلب الرمز؛ يفعّل المخرج الذي رقمه يساوي قيمة الرمز."] },
      { v: k + 1, name: "الترقيم من 1", why: "بدأ العدّ من 1 بدل 0.", steps: ["المخارج تُرقَّم من O0 وليس O1.", "فأُزيحت النتيجة بمقدار واحد."] },
      { v: k - 1, name: "الإزاحة بمقدار واحد نحو الأدنى", why: "نُقص واحد خطأً.", steps: ["الرمز " + code + " يساوي " + k + " بالضبط.", "نُقص واحد فصار " + (k - 1) + "."] }
    ], function (v) { return { v: v, name: "تفعيل مخرج غير مطابق للرمز", why: "O" + v + " لا يطابق الرمز.", steps: ["الرمز " + code + " يساوي " + k + " عشريًا لا " + v + ".", "المخرج المفعَّل رقمه يساوي قيمة الرمز فقط."] }; });
    return build({ tpl: "decoder", ind: 1, lvl: "تطبيق", ref: REF1, params: { n: n, k: k },
      stem: "فاك شفرة (Decoder) بـ " + n + " مداخل و" + N + " مخارج. إذا كانت المداخل " + B(names.join("") + " = " + code) + " فأي مخرج يصبح 1؟",
      correct: { t: O(k), why: "الرمز " + code + " يساوي " + k + " عشريًا فيُفعَّل المخرج O" + k + "." },
      wrongs: ws.map(function (w) { return { t: O(w.v), name: w.name, why: w.why, steps: w.steps }; }),
      steps: ["عدد المخارج = 2^" + n + " = " + N + " مخرجًا، يُفعَّل واحد فقط في كل مرة.",
        "حوّل الرمز إلى عشري: " + B(code + " = " + k) + " (أعلى خانة " + names[0] + ").", "المخرج المفعَّل هو " + O(k) + " ويبقى غيره 0."],
      verify: "تحقق بجدول الحقيقة: في الصف " + code + " يكون " + B("O" + k + " = 1") + " وبقية المخارج صفر.",
      hint: "كم يساوي الرمز المُدخَل بالعشري؟ وهل تُرقَّم المخارج من 0؟",
      concept: "Decoder: x مداخل → 2^x مخرج، يُفعَّل المخرج الذي رقمه يساوي قيمة الرمز." });
  } });

  /* 3) المشفّر */
  G.register("encoder", { std: 2, ind: 1, lvl: "تطبيق", ref: REF1, name: "المشفّر (Encoder)", gen: function (r) {
    var n = r.pick([2, 3]), N = 1 << n, k = r.int(0, N - 1), code = bitsStr(k, n);
    var kr = parseInt(rev(code), 2), kc = N - 1 - k;
    var Y = []; for (var i = n - 1; i >= 0; i--) Y.push("Y" + i);
    var ws = fill3(r, k, N, [
      { v: kc, name: "إخراج المكمل", why: "قُلبت الخانات.", steps: ["رقم المدخل الفعّال " + k + " = " + code + ".", "أُخرج " + bin(kc, n) + " وهو مكمله، وليس رمز الرقم."] },
      { v: k + 1, name: "ترقيم المداخل من 1", why: "رُقّمت المداخل من 1.", steps: ["المداخل تُرقَّم من D0.", "فالمدخل D" + k + " رقمه " + k + " لا " + (k + 1) + "."] },
      { v: kr, name: "عكس ترتيب الخانات", why: "قُرئت الخانات من الأدنى وزنًا.", steps: ["الرمز الصحيح " + code + " بأعلى خانة " + Y[0] + " على اليسار.", "عُكس فصار " + rev(code) + "."] },
      { v: k - 1, name: "نقص واحد", why: "نُقص واحد من الرقم.", steps: ["رقم المدخل الفعّال " + k + ".", "نُقص واحد فصار " + (k - 1) + "."] }
    ], function (v) { return { v: v, name: "رمز غير مطابق لرقم المدخل", why: "الرمز " + bin(v, n) + " يمثل " + v + " لا " + k + ".", steps: ["رقم المدخل الفعّال " + k + ".", "الرمز " + bin(v, n) + " يمثل " + v + " وليس " + k + "."] }; });
    return build({ tpl: "encoder", ind: 1, lvl: "تطبيق", ref: REF1, params: { n: n, k: k },
      stem: "مشفّر (Encoder) بـ " + N + " مداخل D0–D" + (N - 1) + " ومخرج رمز من " + n + " خانات. إذا كان المدخل الفعّال الوحيد هو " + B("D" + k) + " فما قيمة " + B(Y.join("")) + "؟",
      correct: { t: B(code), why: "الـ Encoder يخرج رقم المدخل الفعّال بالثنائي: " + k + " = " + code + "." },
      wrongs: ws.map(function (w) { return { t: B(bin(w.v, n)), name: w.name, why: w.why, steps: w.steps }; }),
      steps: ["المدخل الفعّال هو D" + k + " ورقمه " + k + ".", "اكتب الرقم بالثنائي بـ " + n + " خانات: " + B(k + " = " + code) + ".", "الخرج: " + B(Y.join("") + " = " + code) + "."],
      verify: "تحقق بالعكس: فاك شفرة بالرمز " + code + " يُفعّل المخرج O" + k + "، أي يرجع إلى المدخل D" + k + ".",
      hint: "ما رقم المدخل الفعّال؟ وكيف يُكتب بالثنائي بعدد الخانات المطلوب؟",
      concept: "Encoder: يحوّل المدخل الفعّال إلى رمز ثنائي (عكس عمل الـ Decoder)." });
  } });

  /* 4) الدامج */
  G.register("mux", { std: 2, ind: 1, lvl: "تطبيق", ref: REF1, name: "الدامج (MUX)", gen: function (r) {
    var n = r.pick([2, 3]), N = 1 << n, k = r.int(0, N - 1), code = bitsStr(k, n);
    var S = []; for (var i = n - 1; i >= 0; i--) S.push("S" + i);
    var kr = parseInt(rev(code), 2), kc = N - 1 - k;
    var A = function (x) { return B("A" + x); };
    var ws = fill3(r, k, N, [
      { v: kr, name: "عكس ترتيب خطوط الاختيار", why: "عُكس ترتيب الخانات.", steps: ["قُرئ الرمز " + rev(code) + " بدل " + code + ".", "وأعلى خانة هي " + S[0] + " على اليسار."] },
      { v: kc, name: "استعمال المكمل", why: "قُلبت إشارات الاختيار.", steps: ["قُلب الرمز إلى " + bin(kc, n) + ".", "الـ MUX يستعمل إشارات الاختيار كما هي دون قلب."] },
      { v: k + 1, name: "الترقيم من 1", why: "بدأ ترقيم المداخل من A1.", steps: ["المداخل ترقّم من A0.", "فأُزيحت النتيجة بمقدار واحد."] },
      { v: k - 1, name: "نقص واحد", why: "نُقص واحد من رقم المدخل.", steps: ["الرمز " + code + " يساوي " + k + ".", "نُقص واحد فصار " + (k - 1) + "."] }
    ], function (v) { return { v: v, name: "اختيار مدخل لا يطابق الرمز", why: "A" + v + " لا يطابق الرمز " + code + ".", steps: ["الرمز " + code + " يساوي " + k + " لا " + v + ".", "المدخل المختار رقمه يساوي قيمة إشارات الاختيار."] }; });
    return build({ tpl: "mux", ind: 1, lvl: "تطبيق", ref: REF1, params: { n: n, k: k },
      stem: "دامج (Multiplexer) بـ " + N + " مداخل بيانات A0–A" + (N - 1) + " ومخرج واحد Y. إذا كانت إشارات الاختيار " + B(S.join("") + " = " + code) + " فأي مدخل يظهر على Y؟",
      correct: { t: A(k), why: "قيمة إشارات الاختيار " + code + " = " + k + " فتختار A" + k + "." },
      wrongs: ws.map(function (w) { return { t: A(w.v), name: w.name, why: w.why, steps: w.steps }; }),
      steps: ["عدد خطوط الاختيار = " + n + " فيمكن اختيار 2^" + n + " = " + N + " مدخلًا.", "حوّل إشارات الاختيار إلى عشري: " + B(code + " = " + k) + ".", "المدخل المُمرَّر إلى المخرج هو " + A(k) + "."],
      verify: "تحقق: في جدول الحقيقة الصف " + code + " يعطي Y = A" + k + ".",
      hint: "كم يساوي رمز الاختيار عشريًا؟ هل تبدأ المداخل من A0؟",
      concept: "MUX: يختار إشارة واحدة من عدة إشارات بحسب قيمة إشارات الاختيار؛ n خطوط اختيار تخدم 2ⁿ مدخلًا." });
  } });

  /* 5) جامع متتابع (ripple) */
  G.register("ripple", { std: 2, ind: 1, lvl: "تطبيق", ref: REF1, name: "جامع 3 خانات بجوامع كاملة", gen: function (r) {
    var a = r.int(1, 7), b = r.int(1, 7), sum = a + b;
    var A = bin(a, 3), Bb = bin(b, 3);
    var carry = 0, lines = [], sb = [];
    for (var i = 0; i < 3; i++) {
      var ai = (a >> i) & 1, bi = (b >> i) & 1, s = ai ^ bi ^ carry, co = (ai & bi) | ((ai ^ bi) & carry);
      lines.push("الخانة " + i + ": " + B(ai + " + " + bi + " + " + carry + " = " + co + s) + " ← Sum=" + s + "، Cout=" + co);
      sb.push(s); carry = co;
    }
    var okS = String(carry) + sb.slice().reverse().join(""), ok = stripLead(okS);
    need(parseInt(ok, 2) === sum, "self");
    var xor = bin(a ^ b, 3), drop = bin(sum & 7, 3);
    // سلسلة حمل مقطوعة عند الخانة 1
    var c2 = 0, sb2 = [];
    for (var j = 0; j < 3; j++) {
      var aj = (a >> j) & 1, bj = (b >> j) & 1, cin = j === 1 ? 0 : c2; sb2.push(aj ^ bj ^ cin); c2 = (aj & bj) | ((aj ^ bj) & cin);
    }
    var cut = stripLead(String(c2) + sb2.slice().reverse().join(""));
    var okT = ok;
    need(new Set([okT, stripLead(xor), stripLead(drop), cut]).size === 4, "x");
    return build({ tpl: "ripple", ind: 1, lvl: "تطبيق", ref: REF1, params: { a: a, b: b },
      stem: "رُبطت ثلاثة جوامع كاملة على التتابع (حمل كل خانة إلى التي تليها) لجمع " + B(A) + " و" + B(Bb) + ". ما الناتج الكامل بما فيه حمل الخرج الأخير؟",
      correct: { t: B(okT), why: "حمل كل خانة يدخل الخانة التالية: " + a + " + " + b + " = " + sum + "." },
      wrongs: [
        { t: B(stripLead(xor)), name: "إهمال كل الحمول (XOR)", why: "اقتُصر على Sum لكل خانة بلا حمل.", steps: ["الجمع بلا حمل هو XOR: " + B(A + " ⊕ " + Bb + " = " + xor) + ".", "بالعشري " + parseInt(xor, 2) + " بدل " + sum + "."] },
        { t: B(stripLead(drop)), name: "إسقاط حمل الخرج الأخير", why: "حُذفت الخانة الرابعة.", steps: ["الخانات الثلاث الدنيا فقط: " + B(drop) + ".", "حمل الخانة الأخيرة هو الخانة الرابعة من الناتج وإسقاطه يعطي باقي القسمة على 8."] },
        { t: B(cut), name: "قطع سلسلة الحمل عند الخانة 1", why: "لم يُمرَّر حمل الخانة 0 إلى الخانة 1.", steps: ["افتُرض Cin=0 للخانة 1 رغم أن حمل الخانة 0 هو " + (((a & 1) & (b & 1))) + ".", "فتغيّرت بقية الخانات وجاء الناتج " + B(cut) + " (" + parseInt(cut, 2) + ")."] }
      ],
      steps: ["قدّر بالعشري: " + a + " + " + b + " = " + sum + ".", "مرّر الحمل خانة خانة (Cin للخانة 0 يساوي 0):\n" + lines.join("\n"), "ضع حمل الخرج الأخير كأعلى خانة: " + B(ok) + "."],
      verify: "تحقق: " + B(ok) + " = " + sum + " = " + a + " + " + b + ".",
      hint: "ما الذي يدخل Cin لكل خانة؟ وأين يذهب Cout للخانة الأخيرة؟",
      concept: "الجامع المتتابع: Cout لكل جامع كامل هو Cin للذي يليه؛ حمل الأخير يصبح خانة إضافية." });
    function stripLead(s) { return H.stripZ(s); }
  } });

  /* 6) قلّابات: تتابع Q */
  var FF = {
    D: { ins: ["D"], ok: function (q, v) { return v[0]; }, label: "D",
      wrongs: [
        { name: "نفي الدخل", why: "اعتُبر D معكوسًا.", f: function (q, v) { return 1 - v[0]; }, rule: "Q = ~D" },
        { name: "تأخير نبضة إضافية", why: "ظُنّ أن الخرج يتأخر نبضة بعد التقاط D.", f: null, lag: true, rule: "Q يأخذ دخل النبضة السابقة" },
        { name: "اعتباره قلّاب T", why: "عومل D كأنه T.", f: function (q, v) { return q ^ v[0]; }, rule: "Q = Q ⊕ D" }
      ] },
    T: { ins: ["T"], ok: function (q, v) { return q ^ v[0]; }, label: "T",
      wrongs: [
        { name: "اعتباره قلّاب D", why: "عومل T كأنه D.", f: function (q, v) { return v[0]; }, rule: "Q = T" },
        { name: "عكس معنى T", why: "التبديل عند T=0 والثبات عند T=1.", f: function (q, v) { return q ^ (1 - v[0]); }, rule: "تبديل عند T=0" },
        { name: "الوضع فقط", why: "T=1 تضع Q=1 دائمًا.", f: function (q, v) { return q | v[0]; }, rule: "Q = Q + T" }
      ] },
    JK: { ins: ["J", "K"], ok: function (q, v) { var j = v[0], k = v[1]; return j && k ? 1 - q : j ? 1 : k ? 0 : q; }, label: "JK",
      wrongs: [
        { name: "J=K=1 تضع Q=1", why: "خلط حالة التبديل بحالة الوضع.", f: function (q, v) { var j = v[0], k = v[1]; return j && k ? 1 : j ? 1 : k ? 0 : q; }, rule: "J=K=1 ← Q=1" },
        { name: "J=K=1 تُبقي Q", why: "عوملت حالة التبديل كأنها ثبات.", f: function (q, v) { var j = v[0], k = v[1]; return j && k ? q : j ? 1 : k ? 0 : q; }, rule: "J=K=1 ← ثبات" },
        { name: "J=K=0 تصفّر Q", why: "عوملت حالة الثبات كأنها استرجاع.", f: function (q, v) { var j = v[0], k = v[1]; return j && k ? 1 - q : j ? 1 : 0; }, rule: "J=K=0 ← Q=0" }
      ] },
    SR: { ins: ["S", "R"], ok: function (q, v) { var s = v[0], r = v[1]; return s ? 1 : r ? 0 : q; }, label: "SR",
      wrongs: [
        { name: "تبديل معنى S وR", why: "عُكس الوضع بالاسترجاع.", f: function (q, v) { var s = v[0], r = v[1]; return r ? 1 : s ? 0 : q; }, rule: "S استرجاع وR وضع" },
        { name: "S=R=0 تصفّر Q", why: "عوملت حالة عدم التغيير كاسترجاع.", f: function (q, v) { var s = v[0], r = v[1]; return s ? 1 : 0 * r; }, rule: "S=R=0 ← Q=0" },
        { name: "S=R=0 تبدّل Q", why: "عوملت حالة عدم التغيير كتبديل.", f: function (q, v) { var s = v[0], r = v[1]; return s ? 1 : r ? 0 : 1 - q; }, rule: "S=R=0 ← تبديل" }
      ] }
  };
  G.register("ffseq", { std: 2, ind: 2, lvl: "تطبيق", ref: REF2, name: "تتابع خرج القلّاب", gen: function (r) {
    var type = r.pick(["D", "T", "JK", "SR"]), d = FF[type], P = 5, q0 = r.int(0, 1), inputs = [];
    for (var i = 0; i < P; i++) {
      var v;
      do { v = d.ins.map(function () { return r.int(0, 1); }); } while (type === "SR" && v[0] && v[1]);
      inputs.push(v);
    }
    function run(model, lag) {
      var q = q0, out = [];
      for (var i = 0; i < P; i++) {
        if (lag) q = i === 0 ? q0 : inputs[i - 1][0]; else q = model(q, inputs[i]);
        out.push(q);
      }
      return out;
    }
    var good = run(d.ok), seqs = d.wrongs.map(function (w) { return run(w.f, w.lag); });
    var txt = function (a) { return a.join(","); };
    need(new Set([txt(good)].concat(seqs.map(txt))).size === 4, "x");
    var inLine = d.ins.map(function (nm, k) { return B(nm + " = " + inputs.map(function (v) { return v[k]; }).join(",")); }).join(" ، ");
    var line = function (arr) {
      return arr.map(function (qq, i) { var qp = i ? arr[i - 1] : q0; return "النبضة " + (i + 1) + ": " + d.ins.map(function (nm, k) { return nm + "=" + inputs[i][k]; }).join(" ") + " ← Q: " + qp + "→" + qq; });
    };
    var rule = { D: "الخرج بعد الحافة = D", T: "T=1 تبديل، T=0 ثبات", JK: "J=K=0 ثبات، J=1,K=0 وضع، J=0,K=1 استرجاع، J=K=1 تبديل", SR: "S=1 وضع، R=1 استرجاع، S=R=0 ثبات" }[type];
    return build({ tpl: "ffseq", ind: 2, lvl: "تطبيق", ref: REF2, params: { type: type, q0: q0, inputs: inputs },
      stem: "قلّاب " + type + " متزامن، حالته الابتدائية Q=" + q0 + ". وردت " + P + " نبضات ساعة بالمدخلات التالية (قيمة كل نبضة بالترتيب): " + inLine + ". ما قيم Q بعد كل نبضة؟",
      correct: { t: B(txt(good)), why: "تطبيق جدول القلّاب " + type + " نبضة نبضة." },
      wrongs: d.wrongs.map(function (w, i) {
        var dif = 0; while (seqs[i][dif] === good[dif]) dif++;
        return { t: B(txt(seqs[i])), name: w.name, why: w.why,
          steps: ["قاعدة الخطأ: " + w.rule + ".", "عند النبضة " + (dif + 1) + " (" + d.ins.map(function (nm, k) { return nm + "=" + inputs[dif][k]; }).join(" ") + ") والخرج السابق " + (dif ? good[dif - 1] : q0) + ": الصحيح " + good[dif] + " بينما قاعدة الخطأ تعطي " + seqs[dif === undefined ? 0 : i][dif] + "."] };
      }),
      steps: ["قاعدة القلّاب " + type + ": " + rule + ".", "طبّقها نبضة نبضة بادئًا من Q=" + q0 + ":\n" + line(good).join("\n"), "تتابع Q: " + B(txt(good)) + "."],
      verify: "تحقق: كل نبضة تعتمد على الحالة السابقة (الدخل الحالي والخرج السابق)، وهذا ما يجعل القلّاب دائرة تسلسلية.",
      hint: "ما قاعدة هذا القلّاب؟ وما الخرج السابق عند كل نبضة؟",
      concept: "القلّابات: SR (وضع/استرجاع)، D (ينقل الدخل)، JK (يحل حالة الحظر ويبدّل عند J=K=1)، T (تبديل عند T=1)." });
  } });

  /* 7) العدّاد */
  G.register("counter", { std: 2, ind: 2, lvl: "تطبيق", ref: REF2, name: "حالة العدّاد بعد نبضات", gen: function (r) {
    var n = r.pick([3, 4]), M = 1 << n, s = r.int(0, M - 1), p = r.int(M + 1, 3 * M);
    var ok = (s + p) % M, w1 = s + p, w2 = (s + p - 1) % M, w3 = (s + p) % (M / 2);
    need(new Set([ok, w1, w2, w3]).size === 4, "x");
    var b = function (v) { return B(bin(v, n)); };
    return build({ tpl: "counter", ind: 2, lvl: "تطبيق", ref: REF2, params: { n: n, s: s, p: p },
      stem: "عدّاد تصاعدي ثنائي من " + n + " قلّابات قيمته الحالية " + B(bin(s, n)) + ". ما قيمته بعد " + p + " نبضة؟",
      correct: { t: b(ok), why: "(" + s + " + " + p + ") mod " + M + " = " + ok + "." },
      wrongs: [
        { t: B(bin(w1)), name: "نسيان الالتفاف", why: "العدّاد لا يتجاوز " + (M - 1) + "، ويعود إلى 0.", steps: ["الناتج بلا باقي القسمة: " + s + " + " + p + " = " + w1 + " أي " + bin(w1) + ".", "لكن العدّاد بـ " + n + " قلّابات لا يحمل أكثر من " + n + " خانات."] },
        { t: b(w2), name: "إسقاط نبضة", why: "عدّت النبضات واحدة أقل.", steps: ["عدّ " + (p - 1) + " نبضة بدل " + p + ".", "فنقص الناتج واحدًا: " + w2 + "."] },
        { t: b(w3), name: "حساب بباقي أصغر", why: "استُعمل 2^" + (n - 1) + " بدل 2^" + n + ".", steps: ["ظُنّ أن للعدّاد " + (M / 2) + " حالة فقط.", "عدد حالاته 2^" + n + " = " + M + "."] }
      ],
      steps: ["عدد حالات العدّاد = 2^" + n + " = " + M + " (من 0 إلى " + (M - 1) + ").", "القيمة الحالية " + B(bin(s, n) + " = " + s) + ".", "بعد " + p + " نبضة: " + B("(" + s + " + " + p + ") mod " + M + " = " + ok) + ".", "الناتج بالثنائي: " + b(ok) + "."],
      verify: "تحقق: " + p + " نبضة = " + Math.floor(p / M) + " دورة كاملة (" + (Math.floor(p / M) * M) + " نبضة) + " + (p % M) + " نبضة من " + s + " فتصل إلى " + ok + ".",
      hint: "كم حالة للعدّاد؟ وماذا يحدث بعد آخر قيمة؟",
      concept: "عدّاد من n قلّابات: 2ⁿ حالة (0 إلى 2ⁿ−1)، ويعود إلى 0 بعد القيمة العظمى." });
  } });

  /* 8) عدد القلّابات */
  G.register("ffcount", { std: 2, ind: 2, lvl: "فهم", ref: REF2, name: "عدد القلّابات اللازمة", gen: function (r) {
    var M = r.pick([15, 31, 63, 100, 200, 255, 300, 1000]), n = M.toString(2).length;
    var opts = [n, n - 1, n + 1, 2 * n];
    need(new Set(opts).size === 4, "x");
    return build({ tpl: "ffcount", ind: 2, lvl: "فهم", ref: REF2, params: { max: M },
      stem: "كم قلّابًا يلزم لبناء عدّاد ثنائي يعدّ من 0 حتى " + B(String(M)) + " على الأقل؟",
      correct: { t: B(String(n)), why: "تكفي " + n + " قلّابات: 2^" + n + " = " + (1 << n) + " > " + M + "." },
      wrongs: [
        { t: B(String(n - 1)), name: "نقص قلّاب", why: "2^" + (n - 1) + " = " + (1 << (n - 1)) + " لا تصل إلى " + M + ".", steps: ["بـ " + (n - 1) + " قلّابات أكبر قيمة " + ((1 << (n - 1)) - 1) + ".", "وهي أقل من " + M + "."] },
        { t: B(String(n + 1)), name: "قلّاب زائد", why: "يكفي " + n + ".", steps: ["بـ " + n + " قلّابات أكبر قيمة " + ((1 << n) - 1) + " ≥ " + M + ".", "فالقلّاب الإضافي لا يلزم."] },
        { t: B(String(2 * n)), name: "ضرب عدد الخانات في 2", why: "لا دليل على هذا المضاعف.", steps: ["كل خانة ثنائية تحتاج قلّابًا واحدًا.", "فعدد القلّابات = عدد الخانات " + n + "."] }
      ],
      steps: ["العدّاد من n قلّابات يعدّ حتى 2ⁿ−1.", "المطلوب 2ⁿ − 1 ≥ " + M + ", أي 2ⁿ ≥ " + (M + 1) + ".", "أصغر n يحقق ذلك: " + B("n = " + n) + " (فإن " + B(M + " = " + M.toString(2)) + " يحتاج " + n + " خانات)."],
      verify: "تحقق: بـ " + n + " قلّابات أكبر قيمة " + ((1 << n) - 1) + " ≥ " + M + "، وبـ " + (n - 1) + " قلّابات أكبر قيمة " + ((1 << (n - 1)) - 1) + " < " + M + ".",
      hint: "كل قلّاب يخزّن خانة ثنائية واحدة. كم خانة يحتاج الرقم الأكبر؟",
      concept: "عدد القلّابات = عدد الخانات الثنائية اللازمة لتمثيل أكبر قيمة." });
  } });

  /* 9) نقل التوازي والتوالي */
  G.register("transfer", { std: 2, ind: 3, lvl: "فهم", ref: REF3, name: "النقل على التوازي والتوالي", gen: function (r) {
    var k = r.pick([8, 16, 32, 64]);
    var ok = k + " نبضة / 1 نبضة", w1 = "1 نبضة / " + k + " نبضة", w2 = k + " نبضة / " + k + " نبضة", w3 = (k / 2) + " نبضة / 1 نبضة";
    return build({ tpl: "transfer", ind: 3, lvl: "فهم", ref: REF3, params: { k: k },
      stem: "لنقل بيانات من " + k + " بت: كم نبضة ساعة تلزم على التوالي (بت واحد في كل نبضة)، وكم على التوازي (ناقل عرضه " + k + " بت)؟ (الترتيب: التوالي / التوازي)",
      correct: { t: B(ok), why: "التوالي بت لكل نبضة، والتوازي كل الخانات معًا." },
      wrongs: [
        { t: B(w1), name: "عكس التوالي والتوازي", why: "عُكس معنى النقلين.", steps: ["التوازي يرسل الخانات كلها في نبضة واحدة.", "التوالي هو الذي يحتاج " + k + " نبضة."] },
        { t: B(w2), name: "اعتبارهما متساويين", why: "لا يوجد فرق في الزمن.", steps: ["لو كان التوازي مثل التوالي لما وُجد داعٍ لـ " + k + " خطوط.", "التوازي أسرع بعدد الخطوط مرة."] },
        { t: B(w3), name: "نصف الخانات على التوالي", why: "التوالي بت واحد في كل نبضة لا اثنان.", steps: ["بت واحد في كل نبضة يعني " + k + " نبضة.", "لا يُنقل نصف العدد في نبضة."] }
      ],
      steps: ["على التوالي: خط واحد، بت واحد في كل نبضة ← " + k + " نبضة.", "على التوازي: " + k + " خطًا، كل الخانات في نبضة واحدة ← 1 نبضة.", "الناتج: " + B(ok) + "."],
      verify: "تحقق: التوازي أسرع " + k + " مرة لكنه يحتاج " + k + " خطًا بدل خط واحد (مقايضة السرعة بالكلفة).",
      hint: "كم خطًّا في كل نوع؟ وكم بتًّا يمرّ عبر الخط في كل نبضة؟",
      concept: "النقل على التوازي: كل الخانات معًا عبر خطوط متعددة. النقل على التوالي: خانة بعد خانة عبر خط واحد." });
  } });
  return G;
});
