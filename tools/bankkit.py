"""أداة مشتركة لتأليف بنوك المعايير 3–16. الأسئلة مؤلَّفة بمساعدة الذكاء الاصطناعي وغير مراجَعة رسميًا.
  mc():  سؤال باختيارات؛ كل مشتّت = (نص, اسم الخطأ, سبب) ويُولَّد التتبّع منهما ومن سبب الصحيح.
  mcx(): سؤال بتتبّع صريح لكل مشتّت = (نص, اسم, سبب, [خطوات]) — للأسئلة الحسابية.
الاستعمال: bk = Bank(...); bk.mc(...); bk.write(path)"""
import json

class Bank:
    def __init__(self, n, key, name, weight, expected, goal, indicators):
        self.std = dict(n=n, name=name, of=16, weight=weight, expected=expected, goal=goal)
        self.key = key; self.inds = indicators; self.Q = []; self.seq = {}

    def _add(self, ind, lvl, ref, stem, correct, wrongs, hint, concept, steps, verify, extra):
        assert 1 <= ind <= len(self.inds), (self.key, ind)
        if len(steps) == 1: steps.append("إذن الجواب: " + correct[0] + ".")
        assert len(wrongs) == 3 and len(steps) >= 2 and verify and hint and concept and stem, (self.key, stem[:40])
        texts = [correct[0]] + [w[0] for w in wrongs]
        assert len(set(texts)) == 4, (self.key, "duplicate options", stem[:50])
        assert all(t.strip() for t in texts)
        self.seq[ind] = self.seq.get(ind, 0) + 1
        qid = f"m{self.std['n']}-{ind}.{self.seq[ind]}"
        return qid

    def mc(self, ind, lvl, ref, stem, correct, wrongs, hint, concept, steps, verify, extra=False):
        """correct=(نص, سبب)؛ wrongs=[(نص, اسم الخطأ, سبب)]"""
        qid = self._add(ind, lvl, ref, stem, correct, wrongs, hint, concept, steps, verify, extra)
        tr = {}
        for i, w in enumerate(wrongs):
            assert len(w) == 3, (qid, "wrong must be (text,name,why)")
            tr[str(i + 1)] = dict(name=w[1], steps=[w[2], "الصحيح: " + correct[1]], result=w[0])
        self.Q.append(dict(id=qid, ind=ind, lvl=lvl, ref=ref, stem=stem,
            opts=[dict(t=correct[0], why=correct[1])] + [dict(t=w[0], why=w[2]) for w in wrongs], ans=0,
            hint=hint, concept=concept, extra=extra, steps=steps, verify=verify, traces=tr))
        return qid

    def mcx(self, ind, lvl, ref, stem, correct, wrongs, hint, concept, steps, verify, extra=False):
        """wrongs=[(نص, اسم الخطأ, سبب, [خطوات التتبع])]"""
        qid = self._add(ind, lvl, ref, stem, correct, wrongs, hint, concept, steps, verify, extra)
        for w in wrongs: assert len(w) == 4 and len(w[3]) >= 2, (qid, "explicit trace needs >=2 steps")
        self.Q.append(dict(id=qid, ind=ind, lvl=lvl, ref=ref, stem=stem,
            opts=[dict(t=correct[0], why=correct[1])] + [dict(t=w[0], why=w[2]) for w in wrongs], ans=0,
            hint=hint, concept=concept, extra=extra, steps=steps, verify=verify,
            traces={str(i + 1): dict(name=w[1], steps=w[3], result=w[0]) for i, w in enumerate(wrongs)}))
        return qid

    def write(self, out):
        ids = [q["id"] for q in self.Q]; assert len(ids) == len(set(ids))
        bank = dict(version="0.1-draft", standard=self.std, indicators=self.inds, questions=self.Q)
        s = json.dumps(bank, ensure_ascii=False, indent=1).replace("</", "<\\/")
        open(out, "w", encoding="utf-8").write(
            f"/* مولَّد آليًا من tools/{getattr(self, 'script', 'build_bank_m%02d.py' % self.std['n'])} — لا تعدّله يدويًا */\n"
            f"window.CS_BANKS = window.CS_BANKS || {{}};\nwindow.CS_BANKS.{self.key} = {s};\n")
        print("OK", self.key, len(self.Q), "questions;", sum(1 for q in self.Q if q["extra"]), "extra")
