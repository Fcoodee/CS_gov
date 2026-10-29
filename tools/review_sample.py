#!/usr/bin/env python3
"""يولّد عيّنة مراجعة بشرية (10% عشوائية ثابتة البذرة من بنوك 3–16) + كل أسئلة الدمج + أسئلة ص56/ص88 الجديدة.
الاستعمال: python3 tools/review_sample.py docs/review_sample.md
كل سؤال فيه خانة قرار للمراجع: ✅ سليم / ✏️ يحتاج تعديل / ❌ خاطئ."""
import json, random, re, sys, glob
random.seed(1448)
def load(p):
    s = open(p, encoding="utf-8").read()
    return json.loads(s[s.index("= {", s.index("window.CS_BANKS.")) + 2:].rstrip().rstrip(";"))
files = sorted(glob.glob("data/standard-*.js"))
out = ["# عيّنة المراجعة البشرية — محاكي الرخصة المهنية 1448\n",
       "> أسئلة هذه البنوك مؤلَّفة بمساعدة الذكاء الاصطناعي وغير مراجَعة رسميًا. هذه عيّنة 10% (بذرة 1448) لتقدير جودة الباقي؛ إن ظهر خطأ في أكثر من 1 من كل 20 فالبنك يحتاج مراجعة شاملة.\n"]
total = 0
for f in files:
    n = int(re.search(r"(\d+)", f).group(1))
    if n < 3: continue
    b = list(load(f)["questions"] if False else load(f)["questions"])
    k = max(3, round(len(b) * 0.10))
    pick = random.sample(b, k)
    if n == 5: pick += [q for q in b if q["ref"] in ("ص56", "ص88") and q not in pick]
    out.append(f"\n## المعيار {n} — {len(pick)} من {len(b)}\n"); total += len(pick)
    for q in sorted(pick, key=lambda q: q["id"]):
        out.append(f"### {q['id']} ({q['lvl']}، {q['ref']})\n{q['stem']}\n")
        for i, o in enumerate(q["opts"]): out.append(f"- {'✅' if i == 0 else '▫️'} {o['t']}  \n  _{o['why']}_")
        out.append(f"\nالمصدر/الشك: {q['verify']}\n\n**القرار:** ☐ سليم ☐ يحتاج تعديل ☐ خاطئ — ملاحظة: \n")
mix = load("data/integrated.js")["questions"]
out.append(f"\n## الدمج التربوي-التقني (تجريبي) — كل الأسئلة ({len(mix)})\n"); total += len(mix)
for q in mix:
    out.append(f"### {q['id']}\n{q['stem']}\n")
    for i, o in enumerate(q["opts"]): out.append(f"- {'✅' if i == 0 else '▫️'} {o['t']}")
    out.append(f"\nالمصدر/الشك: {q['verify']}\n\n**القرار:** ☐ سليم ☐ يحتاج تعديل ☐ خاطئ — ملاحظة: \n")
out.insert(2, f"**إجمالي الأسئلة في العيّنة: {total}**\n")
open(sys.argv[1], "w", encoding="utf-8").write("\n".join(out)); print("OK", total, "questions")
