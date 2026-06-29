# Applikon — Spec-Driven Process

## 🧭 Specs before code
Each version uses only the files it needs — skip the rest and
say why in `brief.md`. The process was distilled from building v1; v1's own
history is in `v1/as-built.md`.

## 📄 The files

| File | What's in it |
|------|--------------|
| `brief.md` | the idea · who it's for · what's **in and out of scope** |
| `user-stories.md` | user stories · **edge cases** (what happens when something goes wrong) · **acceptance criteria** (what "done" means, per feature) |
| `architecture.md` | tech choices · a short note per decision — what & why (industry name: "ADR") · only when there's something to design |
| `plan.md` | phases · tests · progress tracking · Definition of Done |
| `as-built.md` | what actually got built vs planned |

Files are numbered in order per version (v2: `01-brief.md`, `02-user-stories.md`,
`03-plan.md`). I drive this chain with my own `spec-assistant` skill.

## 🏁 Each version ends with

Working deploy · updated `as-built`. Conventional commits, scopes as in v1
(`backend`, `frontend`, `spec`, `db`, `infra`).
