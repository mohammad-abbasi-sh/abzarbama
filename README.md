# 🧰 Abzarbama — Persian Tools Hub

**همه‌ی ابزارهای فارسی، یه‌جا — ساده.**

Abzarbama is a single-page, offline-first hub that puts useful Persian tools behind one simple door. No technical knowledge needed: type what you need in plain Persian, and the hub routes you to the right tool.

🌐 **Live demo:** open `index.html` (fully self-contained, works offline)

## Tools inside

| Tool | What it does |
|------|--------------|
| 🧭 **Iran Web Router** | Type a task («قیمت سکه امامی») → get the best MCP server, suggested tool, install command and repo link — from 71 Iranian web servers. Powered by [iran-mcp-router](https://github.com/mohammad-abbasi-sh/iran-mcp-router). |
| 📊 **Persian GEO Analyzer** | Paste Persian text → get an AI-citability score (0–100), category breakdown and concrete fix suggestions. Powered by [persian-geo-analyzer](https://github.com/mohammad-abbasi-sh/persian-geo-analyzer). |

New tools are added regularly — each one appears as a new tab.

## How it works

- **One input, zero jargon.** The hero box detects your intent (keyword-based, client-side) and opens the right tool.
- **100% client-side.** All logic runs in your browser. Nothing is sent to any server.
- **Plug-in architecture.** Each tool is a self-contained JS module (`RouterNS`, `GeoNS`, …) + a tab + a pane in `src/hub.js`.

## Adding a new tool

1. Put the tool's core logic in a namespaced IIFE in `src/template.html` (see `RouterNS`/`GeoNS`), exposing a minimal API.
2. Add the tool id to `TOOL_ORDER` in `src/hub.js`, add its tab button + pane in the template, and wire its UI.
3. Add intent keywords to `INTENT_RULES` so the hero box can route to it.
4. Rebuild: `python3 scripts/build.py`, verify: `node scripts/verify.js`.

## Project layout

```
src/template.html   HTML shell ({{PLACEHOLDERS}})
src/hub.css         styles
src/hub.js          hub shell: tabs, intent router, tool UIs
scripts/build.py    assembles index.html from verified tool sources
scripts/verify.js   executes the built page's JS in Node with a DOM stub
index.html          generated, self-contained (the deliverable)
```

Tool logic is never hand-copied: `build.py` extracts it from the source repos' verified builds, and `verify.js` executes the final page's scripts (router queries, GEO scores, intent detection) before every release.

## License

MIT — see [LICENSE](LICENSE).

---

🇮🇷 نسخه‌ی فارسی: [README-fa.md](README-fa.md)
