# Applikon — `spec/`

Specifications for Applikon, written **spec-first** (specs before code).

## 🔄 Workflow
- v1 — the first, organic pass where I learned spec-driven development hands-on.
- From v2 — a leaner, repeatable process, documented in `PROCESS.md`.

## 📐 Conventions

- Each version is its own folder (`v1/`, `v2/`, …), following `PROCESS.md`.
- v2 artifacts are numbered: `01-brief.md` → `02-user-stories.md` → `03-plan.md`.

## 🗂️ Structure

```
spec/
├── PROCESS.md                   ← how specs are written here (the house process)
├── v1/                          ← the MVP, built in numbered phases
│   ├── 01-vision/               ← MVP scope
│   ├── 02-implementation/       ← MVP implementation plan
│   ├── 03-review/               ← MVP code review
│   ├── 04-mvp-refactoring/      ← refactoring & learning (Claude as mentor)
│   ├── 05-additional-features/  ← i18n, onboarding, gamification
│   ├── 06-cleanup/              ← technical cleanup
│   ├── 07-privacy-rodo/         ← RODO & privacy policy
│   ├── 08-user-data/            ← account management
│   ├── 09-security-refactoring/ ← OWASP audit, timing-attack fix, HMAC-SHA256 tokens
│   ├── 10-logging/              ← production observability
│   ├── 11-swagger/              ← API documentation
│   ├── 12-ci/                   ← GitHub Actions CI
│   ├── 13-docker-registry/      ← Docker & GHCR
│   ├── 14-rebrand-applikon/     ← rebrand EasyApply → Applikon
│   ├── 15-landing-page/         ← public landing page
│   ├── architecture.md          ← package structure, REST endpoints, DB schema, FE
│   ├── as-built.md              ← plan vs reality, deviations, phase history
│   └── security.md              ← security rules, auth flow
├── v2/                          ← Screening Companion (planning)
│   └── 01-brief.md              ← requirements (cheat sheet + board cleanup, no AI)
└── deployment/                  ← production deployment guides (Hetzner)
```
