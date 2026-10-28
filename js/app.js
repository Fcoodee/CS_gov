/* واجهة محاكي الرخصة المهنية 1448 — المعيار الأول. بلا اعتماديات خارجية.
 * البيانات: window.CS_BANKS.m01 (data/standard-01.js) + المولِّدات window.CSGen (js/generators.js). */
(function(){
"use strict";
var BANK = window.CS_BANKS.m01, GEN = window.CSGen;
var Q = BANK.questions, IND = BANK.indicators, STD = BANK.standard;
var TPL = GEN.list(), TPLNAME = {}; TPL.forEach(function(t){ TPLNAME[t.id] = t.name; });
var byId = {}; Q.forEach(function(q){ byId[q.id] = q; });
var LET = ["أ","ب","ج","د"];
var DAY = 864e5, INTERVALS = [0,1,3,7];
var CFG = window.CS_CONFIG || {};
// تقدير غير موثّق رسميًا: عدد الأسئلة وزمن الاختبار الفعليان يُضبطان عبر window.CS_CONFIG
var EXAM_ITEMS = CFG.examItems || 88, EXAM_SECONDS = CFG.examSeconds || 7200;
var SECS_PER_ITEM = EXAM_SECONDS / EXAM_ITEMS;
var LONG_SIZES = [20, 30, 45];
var LS_KEY = "rkhsa1448.m1.v2";
var app = document.getElementById("app");

/* ---------- الحالة والحفظ (قاعدة الصفحة إن وُجدت، وإلا هذا المتصفح) ---------- */
var S = { v:2, q:{}, rv:{}, fs:{} };
var sync = "local", dbDoc = null, dbSaving = false, dbDirty = false, dbTimer = null;
function norm(x){ x = x && typeof x === "object" ? x : {}; return { v:2, q:x.q||{}, rv:x.rv||{}, fs:x.fs||{} }; }
function lsLoad(){ try{ var t = localStorage.getItem(LS_KEY); return t ? norm(JSON.parse(t)) : null; }catch(e){ return null; } }
function lsSave(){ try{ localStorage.setItem(LS_KEY, JSON.stringify(S)); }catch(e){} }
function persist(){ lsSave(); if(!dbDoc) return; dbDirty = true; clearTimeout(dbTimer); dbTimer = setTimeout(flush, 700); }
function flush(){
  if(!dbDoc || !dbDirty) return;
  if(dbSaving){ dbTimer = setTimeout(flush, 400); return; }
  dbSaving = true; dbDirty = false;
  dbDoc.set(JSON.parse(JSON.stringify(S))).then(function(){ sync = "db"; })
    .catch(function(){ sync = "local"; dbDoc = null; })
    .then(function(){ dbSaving = false; if(dbDirty) flush(); updateFooter(); });
}
function initDb(){
  try{
    if(!window.claude || !window.claude.use) return;
    window.claude.use("db").then(function(db){
      if(!db) return;
      var doc = db.doc("state/main");
      return doc.get().then(function(snap){
        if(snap.exists){ S = norm(snap.data()); lsSave(); } else { return doc.set(JSON.parse(JSON.stringify(S))); }
      }).then(function(){ dbDoc = doc; sync = "db"; if(view === "home" || view === "report") render(); else updateFooter(); });
    }).catch(function(){});
  }catch(e){}
}

/* ---------- مساعدات ---------- */
function esc(s){ return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"); }
function minus(s){ return s.replace(/(^|[^0-9A-Za-z])-(?=[0-9])/g, "$1−"); }
function fmt(s){
  var t = esc(s).replace(/\n/g, "<br>");
  t = t.replace(/\{\{([^}]+)\}\}/g, function(_, m){
    var rows = m.split(";").map(function(r){ return r.split(",").map(function(c){ return minus(c.trim()); }); });
    var cols = rows[0].length;
    var cells = rows.map(function(r){ return r.map(function(c){ return "<i>" + c + "</i>"; }).join(""); }).join("");
    return '<span class="mx" dir="ltr" style="--c:' + cols + '" role="img" aria-label="مصفوفة">' + cells + "</span>";
  });
  t = t.replace(/`([^`]+)`/g, function(_, e){
    e = minus(e).replace(/~\(([^)]*)\)/g, '<span class="ov">$1</span>').replace(/~([A-Za-z])/g, '<span class="ov">$1</span>');
    var L = e.replace(/<[^>]*>/g, "").length;
    return '<bdi class="expr' + (L > 26 ? " xs" : L > 18 ? " sm" : "") + '" dir="ltr">' + e + "</bdi>";
  });
  t = t.replace(/\[([0-9A-Za-z]+)\|(\d+)\]/g, '<bdi class="num" dir="ltr">$1<sub>$2</sub></bdi>');
  return t;
}
function shuffle(a){ a = a.slice(); for(var i=a.length-1;i>0;i--){ var j=Math.floor(Math.random()*(i+1)); var x=a[i]; a[i]=a[j]; a[j]=x; } return a; }
function fmtTime(s){ s=Math.max(0,Math.round(s)); var m=Math.floor(s/60), r=s%60; return m+":"+(r<10?"0":"")+r; }
function newSeed(){ return Math.floor(Math.random() * 2147483647) + 1; }
function fresh(tpl){ return GEN.make(tpl, newSeed()); }
/* المفتاح الإحصائي: السؤال الثابت بمعرّفه، والمولَّد بقالبه (مستوى المهارة لا النسخة) */
function sk(q){ return q.gen ? "g:" + q.tpl : q.id; }
function fromKey(k){ return k.indexOf("g:") === 0 ? (TPLNAME[k.slice(2)] ? fresh(k.slice(2)) : null) : (byId[k] || null); }
function lastOk(k){ var r = S.q[k]; return r && r.s ? (r.l ? "ok" : "no") : "none"; }
function dueKeys(){
  var now = Date.now();
  return Object.keys(S.q).filter(function(k){ var r = S.q[k]; return r.s > 0 && r.d <= now && fromKeyExists(k); })
    .sort(function(a,b){ return (S.q[a].b - S.q[b].b) || (S.q[a].d - S.q[b].d); });
}
function fromKeyExists(k){ return k.indexOf("g:") === 0 ? !!TPLNAME[k.slice(2)] : !!byId[k]; }
function record(k, ok){
  var r = S.q[k] || { b:0, d:0, s:0, c:0, l:0 };
  r.s++; if(ok){ r.c++; r.b = Math.min(r.b+1,3); r.d = Date.now() + INTERVALS[r.b]*DAY; } else { r.b = 0; r.d = Date.now(); }
  r.l = ok ? 1 : 0; S.q[k] = r; persist();
}
function acc(k){ var r = S.q[k]; return r && r.s ? r.c / r.s : -1; }

/* ---------- بناء الجلسات ---------- */
var view = "home", session = null, tick = null;
function mkItem(q){ return { q:q, id:q.id, order: shuffle([0,1,2,3]), chosen:null, checked:false, hint:false, solve:0, traces:false, mark:false, spent:0 }; }
function genItems(inds, n){
  var ts = TPL.filter(function(t){ return !inds || t.ind === inds; });
  ts = shuffle(ts).sort(function(a,b){ return acc("g:"+a.id) - acc("g:"+b.id); });
  var out = []; for(var i = 0; i < n; i++) out.push(mkItem(fresh(ts[i % ts.length].id)));
  return out;
}
function startPractice(ind, kind){
  var title;
  if(kind === "gen"){
    title = ind ? "أسئلة جديدة: " + IND[ind-1].short : "أسئلة جديدة على المعيار كله";
    begin("practice", genItems(ind, ind ? 10 : 12), title);
  } else {
    var pool = Q.filter(function(q){ return !ind || q.ind === ind; });
    title = ind ? "تدريب: " + IND[ind-1].short : "تدريب على المعيار كله";
    begin("practice", shuffle(pool).map(mkItem), title);
  }
}
function startReview(){
  var items = dueKeys().slice(0, 12).map(fromKey).filter(Boolean).map(mkItem);
  if(!items.length) return;
  begin("practice", items, "مراجعة مستحقة");
}
function startRetry(){
  var wrong = session.items.filter(function(it){ return it.chosen !== it.q.ans; });
  begin("practice", shuffle(wrong).map(function(it){ return mkItem(it.q.gen ? fresh(it.q.tpl) : it.q); }), "إعادة الأسئلة الخاطئة");
}
function startExam(n){
  var tot = Q.length, parts = IND.map(function(ind){
    var c = Q.filter(function(q){ return q.ind === ind.n; }).length; var x = n * c / tot; return { n:ind.n, k:Math.floor(x), f:x - Math.floor(x) };
  });
  var left = n - parts.reduce(function(a,p){ return a + p.k; }, 0);
  parts.slice().sort(function(a,b){ return b.f - a.f; }).slice(0, left).forEach(function(p){ p.k++; });
  var items = [];
  parts.forEach(function(p){
    var pool = shuffle(Q.filter(function(q){ return q.ind === p.n; }));
    pool.sort(function(a,b){ return ((S.q[a.id]&&S.q[a.id].s)||0) - ((S.q[b.id]&&S.q[b.id].s)||0); });
    var ts = shuffle(TPL.filter(function(t){ return t.ind === p.n; })), g = 0;
    for(var i = 0; i < p.k; i++) items.push(mkItem(i < pool.length ? pool[i] : fresh(ts[g++ % ts.length].id)));
  });
  begin("exam", shuffle(items), n === STD.expected ? "اختبار مصغّر بتوزيع المؤشرات" : "اختبار ممتد (" + n + " سؤالًا)", Math.round(n * SECS_PER_ITEM));
  startTick();
}
function begin(mode, items, title, secs){
  clearInterval(tick);
  var now = Date.now();
  session = { mode:mode, items:items, i:0, title:title, t0:now, qStart:now, deadline: secs ? now + secs * 1000 : null, done:false, warn:false };
  view = "quiz"; render(); window.scrollTo(0,0);
}
function leave(){
  var now = Date.now(), it = session.items[session.i];
  if(it && !session.done) it.spent = (it.spent || 0) + (now - session.qStart) / 1000;
  session.qStart = now;
}
function paceInfo(){
  var n = session.items.length, el = (Date.now() - session.t0) / 1000, exp = el / SECS_PER_ITEM;
  var ans = session.items.filter(function(it){ return it.chosen !== null; }).length, d = ans - exp;
  var txt = "أجبتَ عن " + ans + " من " + n + " · المتوقع حتى الآن ≈ " + Math.min(n, Math.floor(exp));
  var cls = "pace";
  if(el > 30){ if(d >= 0){ txt += " · وتيرتك متقدّمة"; cls += " ahead"; } else { txt += " · متأخّر بنحو " + Math.ceil(-d) + " سؤال"; cls += " behind"; } }
  return { txt:txt, cls:cls };
}
function startTick(){
  clearInterval(tick);
  tick = setInterval(function(){
    if(!session || !session.deadline || view !== "quiz"){ clearInterval(tick); return; }
    var left = (session.deadline - Date.now())/1000, el = document.getElementById("timer");
    if(el){ el.textContent = fmtTime(left); el.classList.toggle("low", left < 60); }
    var p = document.getElementById("pace"), pi = paceInfo(); if(p){ p.textContent = pi.txt; p.className = pi.cls; }
    if(left <= 0){ clearInterval(tick); finish(); }
  }, 1000);
}
function finish(){
  clearInterval(tick); leave();
  session.elapsed = (Date.now() - session.t0) / 1000;
  if(session.mode === "exam" && !session.done){
    session.items.forEach(function(it){ record(sk(it.q), it.chosen !== null && it.chosen === it.q.ans); });
  }
  session.done = true; view = "result"; render(); window.scrollTo(0,0);
}
function unanswered(){ return session.items.filter(function(it){ return it.chosen === null; }).length; }
function tryFinishExam(){
  var u = unanswered();
  if(u && !session.warn){ session.warn = true; render(); return; }
  finish();
}
function go(i){ leave(); session.i = Math.max(0, Math.min(session.items.length - 1, i)); session.warn = false; render(); window.scrollTo(0,0); }

/* ---------- العروض ---------- */
function bitsHtml(n){
  var b = ("00000000" + n.toString(2)).slice(-8).split("");
  return '<span class="bits" aria-hidden="true">' + b.map(function(x){ return '<i class="' + (x==="1"?"on":"") + '">' + x + "</i>"; }).join("") + "</span>";
}
function renderHome(){
  var due = dueKeys().length, rvKeys = Object.keys(S.rv);
  var done = rvKeys.filter(function(k){ return S.rv[k] === "ok"; }).length, flag = rvKeys.filter(function(k){ return S.rv[k] === "flag"; }).length;
  var h = '<header class="head"><div class="eyebrow">حاسب آلي · المعيار الأول: ' + esc(STD.name) + "</div>"
    + "<h1>محاكي الرخصة المهنية 1448</h1></header>"
    + '<div class="notice" role="note"><b>تدريبي وغير رسمي.</b> الأسئلة مؤلَّفة آليًا بمساعدة الذكاء الاصطناعي ولم تُراجَع بشريًا بعد، فلا تعتمد عليها وحدها ولا تعدّها ضمانًا للنتيجة.</div>';
  h += '<section class="card" aria-labelledby="std-h"><div class="row between"><div class="eyebrow">المعيار ' + STD.n + " من " + STD.of + "</div>"
    + '<div class="row" title="الوزن النسبي بالنظام الثنائي"><span class="small muted">الوزن ' + STD.weight + "%</span>" + bitsHtml(STD.weight) + "</div></div>"
    + '<h2 id="std-h" style="margin-top:6px">' + esc(STD.name) + "</h2>"
    + '<p class="muted" style="margin-top:4px">' + esc(STD.goal) + "</p>"
    + '<div class="chips" style="margin-top:12px"><span class="chip acc">الفقرات المتوقعة: ' + STD.expected + '</span><span class="chip">أسئلة ثابتة: ' + Q.length
    + '</span><span class="chip gen">قوالب مولِّدة: ' + TPL.length + " (نسخة جديدة كل مرة)</span></div>"
    + '<div class="act"><button class="btn primary" data-act="gen-all">أسئلة جديدة على المعيار كله</button>'
    + '<button class="btn" data-act="practice-all">الأسئلة الثابتة (' + Q.length + ")</button>"
    + '<button class="btn" data-act="review"' + (due ? "" : " disabled") + ">" + (due ? "مراجعة مستحقة (" + due + ")" : "لا مراجعة مستحقة الآن") + "</button></div></section>";
  h += '<section class="card" aria-labelledby="ex-h"><h2 id="ex-h">الاختبار</h2>'
    + '<p class="muted small" style="margin-top:4px">لا تغذية راجعة أثناء الاختبار. الممتد يدرّبك على التحمّل وإدارة الوقت: مؤشر وتيرة، علامة «للعودة»، متنقّل بين الأسئلة، وتقرير بالأبطأ زمنًا. الزمن لكل سؤال تقدير ≈ ' + Math.round(SECS_PER_ITEM) + " ثانية (7200 ÷ 88)، وهو غير موثّق رسميًا.</p>"
    + '<div class="act"><button class="btn" data-act="exam" data-n="' + STD.expected + '">مصغّر (' + STD.expected + ")</button>"
    + LONG_SIZES.map(function(n){ return '<button class="btn" data-act="exam" data-n="' + n + '">ممتد (' + n + ")</button>"; }).join("") + "</div></section>";
  h += '<section class="card" aria-labelledby="ind-h"><h2 id="ind-h">المؤشرات</h2><div class="legend" style="margin-block:8px 4px">'
    + '<span><b style="background:var(--good)"></b>صحيح آخر مرة</span><span><b style="background:var(--bad)"></b>خطأ آخر مرة</span><span><b style="background:var(--none)"></b>لم يُجَب</span></div>';
  IND.forEach(function(ind){
    var qs = Q.filter(function(q){ return q.ind === ind.n; }), ts = TPL.filter(function(t){ return t.ind === ind.n; });
    var ok = qs.filter(function(q){ return lastOk(q.id) === "ok"; }).length;
    h += '<div class="ind"><div class="txt"><h3>المؤشر ' + ind.n + ": " + esc(ind.short) + '</h3><p class="muted small">' + esc(ind.text) + "</p>"
      + '<div class="ribbon" role="img" aria-label="' + ok + " من " + qs.length + ' صحيحة آخر مرة">'
      + qs.map(function(q){ return '<b class="' + lastOk(q.id) + '" title="' + q.id + '"></b>'; }).join("") + "</div>"
      + '<div class="ribbon" role="img" aria-label="إتقان القوالب المولِّدة">'
      + ts.map(function(t){ return '<b class="' + lastOk("g:" + t.id) + '" title="' + esc(t.name) + '"></b>'; }).join("") + "</div>"
      + '<p class="small muted" style="margin-top:6px">' + qs.length + " سؤالًا ثابتًا + " + ts.length + " قوالب مولِّدة · مرجع الكتاب: " + esc(ind.pages) + "</p></div>"
      + '<div class="row" style="align-self:center;flex-wrap:wrap"><button class="btn" data-act="gen" data-ind="' + ind.n + '">أسئلة جديدة</button>'
      + '<button class="btn" data-act="practice" data-ind="' + ind.n + '">الثابتة</button></div></div>';
  });
  h += "</section>";
  h += '<section class="card"><div class="row between"><div><h3>حالة مراجعة الأسئلة</h3><p class="small muted">راجعتَ ' + done + " · أشرتَ إلى إشكال في " + flag
    + '</p></div><button class="btn" data-act="report">تقرير المراجعة</button></div></section>';
  h += '<details><summary>المصادر وحدود هذه الصفحة</summary><div class="small" style="display:flex;flex-direction:column;gap:8px">'
    + "<p><b>المؤشرات:</b> منقولة من غلاف المعيار الأول في كتاب «الرخصة المهنية، تخصص الحاسب الآلي، النسخة الرابعة» لمعلم الحاسب، وليست من الوثيقة الرسمية لهيئة تقويم التعليم والتدريب. طابقها مع الوثيقة الرسمية قبل الاعتماد.</p>"
    + "<p><b>الأسئلة:</b> أصيلة ومؤلَّفة بمساعدة Claude، وليست منقولة من الكتاب أو من اختبار رسمي أو من تجميعات متداولة. الموسومة «تعزيزي» تتجاوز ما يشرحه الكتاب.</p>"
    + "<p><b>المولِّدات:</b> كل نسخة تُولَّد من قالب وبذرة، وكل خيار خاطئ ناتج عن نموذج خطأ مسمّى ويُحسب بالكود. اختباراتها الآلية تعيد حساب الجواب مستقلًا على آلاف النسخ، لكنها لا تُغني عن مراجعتك. إحصاءاتك تُحفظ على مستوى القالب لا النسخة.</p>"
    + "<p><b>الاختبار:</b> عدد الأسئلة الفعلي وزمن الاختبار الرسميان غير موثّقين هنا؛ الوتيرة مبنية على قسمة ساعتين على 88 سؤالًا (تقدير).</p>"
    + "<p><b>طريقة الحل:</b> خطوات تُكشف تدريجيًا بعد إجابتك، مع تحقق ثانٍ، وتتبّع لكيفية الوصول إلى كل خيار خاطئ.</p>"
    + "<p><b>المراجعة المتباعدة:</b> الخطأ يعيد السؤال فورًا، والإجابة الصحيحة تؤجّله إلى يوم ثم 3 ثم 7 أيام.</p></div></details>";
  return h;
}
function tagsFor(q){
  return '<div class="chips"><span class="chip acc">المؤشر ' + q.ind + '</span><span class="chip">' + esc(q.lvl) + '</span><span class="chip">مرجع: ' + esc(q.ref) + "</span>"
    + (q.gen ? '<span class="chip gen">مولَّد: ' + esc(TPLNAME[q.tpl]) + "</span>" : "")
    + (q.extra ? '<span class="chip warn">تعزيزي: غير مشروح في الكتاب</span>' : "") + "</div>";
}
function navHtml(){
  var h = '<section class="card" aria-label="المتنقّل بين الأسئلة"><div class="row between"><h3>المتنقّل</h3><span class="small muted">مظلّل = مُجاب · شريط برتقالي = للعودة</span></div><div class="navg">';
  session.items.forEach(function(it, k){
    h += '<button data-act="jump" data-i="' + k + '" aria-label="السؤال ' + (k+1) + (it.chosen !== null ? " مُجاب" : "") + (it.mark ? " معلَّم" : "") + '" class="'
      + (it.chosen !== null ? "ans " : "") + (it.mark ? "mk " : "") + (k === session.i ? "cur" : "") + '">' + (k+1) + "</button>";
  });
  return h + '</div><div class="act"><button class="btn" data-act="finish-exam">إنهاء الاختبار</button></div></section>';
}
function renderQuiz(){
  var it = session.items[session.i], q = it.q, exam = session.mode === "exam", n = session.items.length;
  var h = '<div class="topbar"><button class="btn ghost" data-act="home">← الرئيسية</button>'
    + '<div class="row"><span class="small muted">' + esc(session.title) + "</span>"
    + (exam ? '<span>الزمن المتبقي: <span id="timer" class="timer">' + fmtTime((session.deadline - Date.now())/1000) + "</span></span>" : "") + "</div></div>";
  if(exam){ var pi = paceInfo(); h += '<div id="pace" class="' + pi.cls + '">' + pi.txt + "</div>"; }
  h += '<div class="progress" role="progressbar" aria-valuemin="0" aria-valuemax="' + n + '" aria-valuenow="' + (session.i+1) + '"><i style="width:' + ((session.i + (it.checked?1:0)) / n * 100) + '%"></i></div>'
    + '<section class="card">' + '<div class="row between"><span class="small muted">سؤال ' + (session.i+1) + " من " + n + "</span>" + (it.mark ? '<span class="chip warn">معلَّم للعودة</span>' : "") + "</div>" + tagsFor(q)
    + '<p class="stem">' + fmt(q.stem) + "</p>"
    + '<div class="opts" role="radiogroup" aria-label="الخيارات">';
  it.order.forEach(function(oi, pos){
    var cls = "opt", chk = it.chosen === oi;
    if(it.checked){ if(oi === q.ans) cls += " right"; else if(chk) cls += " wrong"; }
    h += '<button class="' + cls + '" role="radio" aria-checked="' + chk + '" data-act="pick" data-oi="' + oi + '"' + (it.checked ? " disabled" : "") + ">"
      + '<span class="lt">' + LET[pos] + '</span><span class="ot">' + fmt(q.opts[oi].t) + "</span></button>";
  });
  h += "</div>";
  if(it.hint && !it.checked) h += '<div class="hint"><b>سؤال يقودك:</b> ' + fmt(q.hint) + "</div>";
  if(it.checked && !exam) h += explainHtml(q, it);
  if(exam && session.warn) h += '<div class="warnbox" role="alert">لديك ' + unanswered() + " سؤالًا بلا إجابة. اضغط «إنهاء الاختبار» مرة أخرى للتأكيد، أو تنقّل إلى السؤال المتروك.</div>";
  h += '<div class="act">';
  if(!exam){
    if(!it.checked){
      h += '<button class="btn primary" data-act="check"' + (it.chosen === null ? " disabled" : "") + ">تحقق من إجابتي</button>"
        + '<button class="btn ghost" data-act="hint">' + (it.hint ? "إخفاء التلميح" : "تلميح") + "</button>";
    } else {
      h += '<button class="btn primary" data-act="next">' + (session.i === n-1 ? "إنهاء وعرض النتيجة" : "السؤال التالي") + "</button>";
    }
  } else {
    h += '<button class="btn ghost" data-act="prev"' + (session.i === 0 ? " disabled" : "") + ">السابق</button>"
      + '<button class="btn" data-act="mark" aria-pressed="' + it.mark + '">' + (it.mark ? "إلغاء العلامة" : "علّم للعودة") + "</button>"
      + (session.i === n-1 ? '<button class="btn primary" data-act="finish-exam">إنهاء الاختبار</button>' : '<button class="btn primary" data-act="next">التالي</button>');
  }
  h += "</div></section>";
  if(exam) h += navHtml();
  return h;
}
function olHtml(arr){ return '<ol class="steps">' + arr.map(function(t){ return "<li><div>" + fmt(t) + "</div></li>"; }).join("") + "</ol>"; }
function traceHtml(q, k){
  var t = q.traces && q.traces[String(k)]; if(!t) return "";
  return '<div class="trace"><b>كيف يصل المتعلم إلى هذا الخيار؟ ' + esc(t.name) + "</b>" + olHtml(t.steps) + "</div>";
}
function solveHtml(q, it, all){
  if(!q.steps) return "";
  var n = q.steps.length, k = all ? n : (it.solve || 0);
  if(k === 0) return '<div class="row"><button class="btn" data-act="solve">أرني طريقة الحل</button><span class="small muted">تُكشف الخطوات واحدة بواحدة</span></div>';
  var h = '<div class="solve"><h3>طريقة الحل</h3><ol class="steps">';
  for(var i = 0; i < k; i++) h += "<li><div>" + fmt(q.steps[i]) + "</div></li>";
  h += "</ol>";
  if(!all && k < n) h += '<div class="row"><button class="btn primary" data-act="solve-next">الخطوة التالية (' + k + " من " + n + ')</button><button class="btn ghost" data-act="solve-all">إظهار الكل</button></div>';
  if(k >= n){
    h += '<div class="verify"><b>تحقق:</b> ' + fmt(q.verify) + "</div>";
    if(it.chosen !== null && it.chosen !== q.ans) h += traceHtml(q, it.chosen);
    if(!all){
      h += '<div class="row"><button class="btn ghost" data-act="traces">' + (it.traces ? "إخفاء الأخطاء الشائعة" : "عرض الأخطاء الشائعة في الخيارات الأخرى") + "</button></div>";
      if(it.traces) Object.keys(q.traces).forEach(function(kk){ if(+kk !== it.chosen) h += traceHtml(q, kk); });
    } else {
      Object.keys(q.traces).forEach(function(kk){ if(+kk !== it.chosen) h += traceHtml(q, kk); });
    }
  }
  return h + "</div>";
}
function rvRow(q){
  var k = sk(q), st = S.rv[k] || "", lbl = q.gen ? "حكمك على هذا القالب:" : "حكمك على جودة السؤال:";
  return '<div class="row"><span class="small muted">' + lbl + "</span>"
    + '<button class="btn' + (st === "ok" ? " primary" : "") + '" data-act="rv" data-v="ok" data-id="' + esc(k) + '" data-seed="' + (q.seed || "") + '" aria-pressed="' + (st==="ok") + '">راجعته وهو سليم</button>'
    + '<button class="btn' + (st === "flag" ? " primary" : "") + '" data-act="rv" data-v="flag" data-id="' + esc(k) + '" data-seed="' + (q.seed || "") + '" aria-pressed="' + (st==="flag") + '">فيه إشكال</button></div>';
}
function explainHtml(q, it){
  var ok = it.chosen === q.ans;
  var h = '<div class="explain" aria-live="polite"><div class="verdict ' + (ok ? "ok" : "no") + '">' + (ok ? "إجابة صحيحة" : "إجابة غير صحيحة") + "</div>"
    + "<p>" + fmt(q.concept) + "</p><ul>";
  it.order.forEach(function(oi, pos){
    var right = oi === q.ans;
    h += '<li><span class="mark ' + (right ? "ok" : "no") + '">' + (right ? "✓" : "✗") + "</span><div><b>" + LET[pos] + ".</b> " + fmt(q.opts[oi].why) + "</div></li>";
  });
  return h + "</ul>" + solveHtml(q, it, false) + rvRow(q) + "</div>";
}
function renderResult(){
  var items = session.items, n = items.length, right = 0, per = {}, exam = session.mode === "exam";
  IND.forEach(function(i){ per[i.n] = { r:0, t:0 }; });
  items.forEach(function(it){ var q = it.q, ok = it.chosen === q.ans; if(ok) right++; per[q.ind].t++; if(ok) per[q.ind].r++; });
  var wrongN = items.filter(function(it){ return it.chosen !== it.q.ans; }).length;
  var h = '<header class="head"><div class="eyebrow">' + esc(session.title) + "</div><h1>النتيجة</h1></header>"
    + '<section class="card"><div class="score">' + right + " من " + n + '</div><p class="muted">' + Math.round(right / n * 100) + "% صحيحة</p>"
    + '<div class="scroll" style="margin-top:12px"><table class="tbl"><thead><tr><th>المؤشر</th><th>الصحيح</th></tr></thead><tbody>'
    + IND.filter(function(i){ return per[i.n].t; }).map(function(i){ return "<tr><td>" + i.n + ": " + esc(i.short) + "</td><td>" + per[i.n].r + " / " + per[i.n].t + "</td></tr>"; }).join("")
    + "</tbody></table></div>"
    + '<div class="act"><button class="btn primary" data-act="home">الرئيسية</button>'
    + (wrongN ? '<button class="btn" data-act="retry">إعادة الأسئلة الخاطئة (' + wrongN + ")</button>" : "") + "</div></section>";
  if(exam){
    var ans = items.filter(function(it){ return it.chosen !== null; }), skipped = n - ans.length, marked = items.filter(function(it){ return it.mark; }).length;
    var avg = ans.length ? ans.reduce(function(a, it){ return a + it.spent; }, 0) / ans.length : 0;
    var slow = items.map(function(it, k){ return { k:k, s:it.spent || 0, ok:it.chosen === it.q.ans, none:it.chosen === null, ind:it.q.ind }; })
      .sort(function(a,b){ return b.s - a.s; }).slice(0, 5);
    h += '<section class="card"><h2>إدارة الوقت</h2><div class="chips" style="margin-top:8px"><span class="chip">الزمن المستغرق: ' + fmtTime(session.elapsed) + '</span><span class="chip">المخصّص: ' + fmtTime(n * SECS_PER_ITEM)
      + '</span><span class="chip">متوسط السؤال: ' + Math.round(avg) + " ث (الهدف ≈ " + Math.round(SECS_PER_ITEM) + ' ث)</span><span class="chip ' + (skipped ? "bad" : "good") + '">بلا إجابة: ' + skipped
      + '</span><span class="chip">معلَّمة للعودة: ' + marked + "</span></div>"
      + '<h3 style="margin-top:12px">الأسئلة الأبطأ</h3><div class="scroll"><table class="tbl"><thead><tr><th>السؤال</th><th>الزمن</th><th>المؤشر</th><th>النتيجة</th></tr></thead><tbody>'
      + slow.map(function(x){ return "<tr><td>" + (x.k+1) + "</td><td>" + Math.round(x.s) + " ث</td><td>" + x.ind + "</td><td>" + (x.none ? "بلا إجابة" : x.ok ? "صحيح" : "خطأ") + "</td></tr>"; }).join("")
      + "</tbody></table></div><p class=\"small muted\" style=\"margin-top:8px\">الأسئلة التي استهلكت وقتًا أطول من " + Math.round(SECS_PER_ITEM * 2) + " ث تستحق أن تتدرّب على تعرّفها مبكرًا وتأجيلها بالعلامة.</p></section>";
  }
  h += '<section aria-label="تفاصيل الأسئلة"><h2 style="margin-bottom:8px">مراجعة الأسئلة</h2>';
  items.forEach(function(it, k){
    var q = it.q, ok = it.chosen === q.ans;
    h += "<details" + (ok ? "" : " open") + "><summary><span class=\"mark " + (ok ? "ok" : "no") + '">' + (ok ? "✓" : "✗") + "</span> السؤال " + (k+1) + " · المؤشر " + q.ind + (q.gen ? " · " + esc(TPLNAME[q.tpl]) : "") + "</summary>"
      + '<p class="stem" style="margin-top:0">' + fmt(q.stem) + "</p>"
      + "<p class=\"small\"><b>إجابتك:</b> " + (it.chosen === null ? "لم تُجِب" : fmt(q.opts[it.chosen].t)) + "</p>"
      + "<p class=\"small\"><b>الصحيحة:</b> " + fmt(q.opts[q.ans].t) + "</p>"
      + '<div class="explain">' + "<p>" + fmt(q.concept) + "</p>" + solveHtml(q, it, true)
      + (ok ? "" : "<p class=\"small muted\">" + (it.chosen === null ? "" : "<b>لماذا الخيار الذي اخترتَه غير صحيح؟</b> " + fmt(q.opts[it.chosen].why)) + "</p>")
      + rvRow(q) + "</div></details>";
  });
  return h + "</section>";
}
function reportText(){
  var ks = Object.keys(S.rv).filter(function(k){ return S.rv[k] === "flag"; });
  if(!ks.length) return "لا توجد أسئلة موسومة بإشكال.";
  return "أسئلة فيها إشكال:\n" + ks.map(function(k){
    if(k.indexOf("g:") === 0) return "- قالب مولَّد " + k.slice(2) + " (" + (TPLNAME[k.slice(2)] || "؟") + ")" + (S.fs[k] ? "، بذرة النسخة: " + S.fs[k] : "");
    var q = byId[k]; return "- " + k + ": " + (q ? q.stem.replace(/[`~{}]/g, "") : "");
  }).join("\n");
}
function badge(l){ return l === "ok" ? '<span class="chip good">صحيح</span>' : l === "no" ? '<span class="chip bad">خطأ</span>' : '<span class="chip">لم يُجَب</span>'; }
function rvBadge(st){ return st === "ok" ? '<span class="chip good">سليم</span>' : st === "flag" ? '<span class="chip bad">إشكال</span>' : '<span class="chip">بانتظار المراجعة</span>'; }
function renderReport(){
  var h = '<header class="head"><div class="eyebrow">المعيار الأول</div><h1>تقرير مراجعة الأسئلة</h1></header>'
    + '<p class="muted">الأسئلة مسودة حتى تحكم عليها. اعرض هنا ما راجعتَه وما أشرتَ إلى إشكال فيه، وانسخ الملخص لإرساله مع ملاحظاتك.</p>'
    + '<section class="card"><div class="scroll"><table class="tbl"><thead><tr><th>السؤال / القالب</th><th>المؤشر</th><th>الأخير</th><th>المراجعة</th></tr></thead><tbody>';
  Q.forEach(function(q){
    h += "<tr><td>" + q.id + (q.extra ? ' <span class="chip warn">تعزيزي</span>' : "") + "</td><td>" + esc(IND[q.ind-1].short) + "</td><td>" + badge(lastOk(q.id)) + "</td><td>" + rvBadge(S.rv[q.id]) + "</td></tr>";
  });
  TPL.forEach(function(t){
    h += "<tr><td>" + esc(t.name) + ' <span class="chip gen">مولَّد</span></td><td>' + esc(IND[t.ind-1].short) + "</td><td>" + badge(lastOk("g:" + t.id)) + "</td><td>" + rvBadge(S.rv["g:" + t.id]) + "</td></tr>";
  });
  h += '</tbody></table></div><div class="act"><button class="btn primary" data-act="home">الرئيسية</button><button class="btn" data-act="copy">نسخ ملخص الإشكالات</button>'
    + '<button class="btn ghost" data-act="reset">تصفير تقدّمي</button></div>'
    + '<textarea id="rpt" readonly aria-label="ملخص الإشكالات" hidden></textarea></section>';
  return h;
}
function updateFooter(){
  var f = document.getElementById("sync"); if(f) f.textContent = sync === "db" ? "التقدّم محفوظ في قاعدة بيانات الصفحة ويبقى بين الأجهزة." : "التقدّم محفوظ في هذا المتصفح فقط.";
}
function render(){
  var h = view === "home" ? renderHome() : view === "quiz" ? renderQuiz() : view === "result" ? renderResult() : renderReport();
  h += '<footer><span id="sync"></span><span>محاكي تدريبي مستقل، غير تابع لهيئة تقويم التعليم والتدريب ولا للمركز الوطني للقياس.</span></footer>';
  app.innerHTML = h; updateFooter();
}

/* ---------- الأحداث ---------- */
app.addEventListener("click", function(e){
  var el = e.target.closest("[data-act]"); if(!el || el.disabled) return;
  var a = el.getAttribute("data-act"), it = session && session.items[session.i];
  if(a === "home"){ clearInterval(tick); view = "home"; session = null; render(); window.scrollTo(0,0); }
  else if(a === "practice-all") startPractice(0, "static");
  else if(a === "practice") startPractice(+el.getAttribute("data-ind"), "static");
  else if(a === "gen-all") startPractice(0, "gen");
  else if(a === "gen") startPractice(+el.getAttribute("data-ind"), "gen");
  else if(a === "exam") startExam(+el.getAttribute("data-n"));
  else if(a === "review") startReview();
  else if(a === "report"){ view = "report"; render(); window.scrollTo(0,0); }
  else if(a === "solve"){ it.solve = 1; render(); }
  else if(a === "solve-next"){ it.solve = Math.min(it.solve + 1, it.q.steps.length); render(); }
  else if(a === "solve-all"){ it.solve = it.q.steps.length; render(); }
  else if(a === "traces"){ it.traces = !it.traces; render(); }
  else if(a === "retry") startRetry();
  else if(a === "pick"){ if(it && !it.checked){ it.chosen = +el.getAttribute("data-oi"); session.warn = false; render(); var b = app.querySelector('[aria-checked="true"]'); if(b) b.focus(); } }
  else if(a === "hint"){ it.hint = !it.hint; render(); }
  else if(a === "check"){ if(it.chosen !== null){ it.checked = true; record(sk(it.q), it.chosen === it.q.ans); render(); } }
  else if(a === "prev") go(session.i - 1);
  else if(a === "next"){ if(session.i === session.items.length - 1){ if(session.mode === "exam") tryFinishExam(); else { leave(); finish(); } } else go(session.i + 1); }
  else if(a === "jump") go(+el.getAttribute("data-i"));
  else if(a === "mark"){ it.mark = !it.mark; render(); }
  else if(a === "finish-exam") tryFinishExam();
  else if(a === "rv"){
    var id = el.getAttribute("data-id"), v = el.getAttribute("data-v"), sd = el.getAttribute("data-seed");
    if(S.rv[id] === v){ delete S.rv[id]; delete S.fs[id]; } else { S.rv[id] = v; if(sd) S.fs[id] = +sd; else delete S.fs[id]; }
    persist(); render();
  }
  else if(a === "copy"){
    var t = reportText(), ta = document.getElementById("rpt"); ta.value = t; ta.hidden = false; ta.select();
    try{ navigator.clipboard.writeText(t).catch(function(){}); }catch(err){}
  }
  else if(a === "reset"){
    if(el.getAttribute("data-sure") === "1"){ S = norm({}); persist(); view = "home"; render(); }
    else { el.setAttribute("data-sure", "1"); el.textContent = "اضغط مرة أخرى للتأكيد"; }
  }
});
document.addEventListener("keydown", function(e){
  if(view !== "quiz" || !session) return;
  if(/^[1-4]$/.test(e.key) && !e.ctrlKey && !e.metaKey && !e.altKey){
    var it = session.items[session.i]; if(it.checked) return;
    it.chosen = it.order[+e.key - 1]; session.warn = false; render(); var b = app.querySelector('[aria-checked="true"]'); if(b) b.focus();
  }
});

S = lsLoad() || S;
render();
initDb();
window.__cs = { get session(){ return session; }, startExam: startExam, fmt: fmt };   // لواجهات الاختبار الآلي
})();
