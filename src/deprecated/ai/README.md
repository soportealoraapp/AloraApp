# Deprecated — AI Modules

| Module | Former Path | Consumers | Replacement | Reason |
|--------|-------------|-----------|-------------|--------|
| compatibility-v2/ | src/ai/compatibility-v2/ | discover-ranking.ts (deprecated) | engine.ts | 10-dimension AI engine never connected to live feed |
| hybrid-model/ | src/ai/compatibility/hybrid-model/ | None | engine.ts | 3-variable scorer, 0 consumers |
| matching/ | src/ai/matching/ | None | engine.ts | Hardcoded stub, 0 consumers |
| nlp/ | src/ai/nlp/ | None | — | message-analyzer.ts never imported |
| date-coaching/ | src/ai/date-coaching/ | None | — | date-prep.ts never imported |

**Deprecated on**: 2026-06-06
