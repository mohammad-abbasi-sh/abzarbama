#!/usr/bin/env python3
"""Assemble abzarbama/index.html from the template + verified tool cores.

Sources (never hand-edit the generated file):
  src/template.html   HTML shell with {{PLACEHOLDERS}}
  src/hub.css         hub styles
  src/hub.js          hub shell: tabs, intent router, tool UIs
  iran-mcp-router/index.html   script blocks 0/1/2 (catalog, rules, route core)
  persian-geo-analyzer/index.html   script before /* ---------- UI ---------- */

Usage: python3 scripts/build.py
"""
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
GP = Path.home() / "workspace" / "github-profile" / "projects"

def read(p):
    return Path(p).read_text(encoding="utf-8")

def extract_router():
    html = read(GP / "iran-mcp-router" / "index.html")
    blocks = re.findall(r"<script>(.*?)</script>", html, re.S)
    if len(blocks) != 3:
        raise SystemExit(f"expected 3 script blocks in router index.html, got {len(blocks)}")
    data, rules, ui = blocks
    cut = ui.find('const $q = document.getElementById')
    if cut < 0:
        raise SystemExit("router UI cut marker not found")
    core = ui[:cut]
    if "function route(" not in core:
        raise SystemExit("route() missing from extracted router core")
    return data, rules, core

def extract_geo():
    html = read(GP / "persian-geo-analyzer" / "index.html")
    m = re.search(r"<script>(.*?)</script>", html, re.S)
    if not m:
        raise SystemExit("no script block in geo index.html")
    js = m.group(1)
    cut = js.find("/* ---------- UI ---------- */")
    if cut < 0:
        raise SystemExit("geo UI cut marker not found")
    core = js[:cut]
    if "function scoreText(" not in core or "function suggestFixes(" not in core:
        raise SystemExit("scoreText/suggestFixes missing from extracted geo core")
    return core

def main():
    data, rules, rcore = extract_router()
    gcore = extract_geo()
    tpl = read(ROOT / "src" / "template.html")
    out = (tpl
           .replace("{{HUB_CSS}}", read(ROOT / "src" / "hub.css"))
           .replace("{{ROUTER_DATA}}", data)
           .replace("{{ROUTER_RULES}}", rules)
           .replace("{{ROUTER_CORE}}", rcore)
           .replace("{{GEO_CORE}}", gcore)
           .replace("{{HUB_JS}}", read(ROOT / "src" / "hub.js")))
    if "{{" in out:
        raise SystemExit("unreplaced placeholder remains")
    dest = ROOT / "index.html"
    dest.write_text(out, encoding="utf-8")
    print(f"built {dest} ({dest.stat().st_size/1024:.0f} KB)")

if __name__ == "__main__":
    main()
