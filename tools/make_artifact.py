#!/usr/bin/env python3
"""يدمج index.html + css + js + data في صفحة واحدة (لنشرها كـ Artifact). الاستعمال: make_artifact.py out.html"""
import re, sys, pathlib
r = pathlib.Path(__file__).resolve().parent.parent
h = (r / "index.html").read_text(encoding="utf-8")
css = (r / "css/app.css").read_text(encoding="utf-8")
h = re.sub(r'<link rel="stylesheet" href="css/app.css">', lambda m: "<style>\n" + css + "\n</style>", h)
for s in re.findall(r'<script src="([^"]+)"></script>', h):
    h = h.replace(f'<script src="{s}"></script>', "<script>\n" + (r / s).read_text(encoding="utf-8").replace("</script", "<\\/script") + "\n</script>")
pathlib.Path(sys.argv[1]).write_text(h, encoding="utf-8")
