# Codex TODO — Dummy 제거 + API 연동 (S14P11A707 FE)

## INPUTS (single source of truth)

- OpenAPI: ./openapi.json
- Wireframe images:
  - ./wireframe-scenarios-all.png
  - ./wireframe-scenarios-mine.png
- Wireframe spec: ./wireframe-scenarios.md

---

## HARD RULES (No Guessing)

- ONLY use endpoints and DTO fields defined in document/openapi.json
- Do NOT invent query params (sort/page/filter). If not in openapi, do client-side.
- Do NOT add new fields to DTOs. Map only existing fields.
- If UI needs a field not in DTO (e.g., estimatedTime), use safe default (0/null) and mark TODO.
- ScenarioListResponse has totalPages/totalElements/currentPage but milestone-1 uses page=0 only.
- Use credentials: "include" in HTTP requests (session-based auth).
- If /users/me/scenarios returns 401, show login CTA; do NOT fallback to ALL data.

### Scenario list APIs (must match openapi.json)

- ALL: GET /api/scenarios -> ScenarioListResponse
- MINE: GET /api/users/me/scenarios -> ScenarioListResponse
- ScenarioListResponse.content is Item[]
- Item fields:
  id,title,synopsis,genre,thumbnailUrl,playCount,avgRating(number),avgDifficulty(number),status,progress,generationMessage

---

## UI Mapping Rules (DTO -> UI model)

- thumbnail = thumbnailUrl
- rating = avgRating (float 0~5). DO NOT use rating/100 or \*100 mapping.
- difficultyLabel derived from avgDifficulty:
  - <= 2.4: easy
  - <= 3.6: medium
  - else: hard

---

## Auth handling

- If MINE returns 401:
  - show message: "로그인이 필요합니다."
  - login CTA: /api/auth/login?redirect=/scenarios

---

## Milestone-1: Scenarios Page (/scenarios)

### UI/UX requirements

- Tabs: [전체 시나리오] [내 시나리오]
  - ALL tab data: GET /api/scenarios
  - MINE tab data: GET /api/users/me/scenarios
- Search: title/synopsis (client-side)
- Filter: genre, difficultyLabel (client-side)
- Sort (client-side):
  - popular: playCount desc
  - rating: avgRating desc
  - difficulty: avgDifficulty desc (or use stored avgDifficulty)
- Grid: 3 cols desktop / 2 cols tablet / 1 col mobile
- Keep existing card UI components if possible

### Tab behavior

- On tab switch: reset page to 0
- Keep search/filter/sort state across tabs (do not reset)

### Empty/Error states

- MINE tab empty:
  - "아직 생성한 시나리오가 없습니다."
  - CTA "시나리오 생성하기" (TODO route)
- MINE tab 401:
  - login guidance + login CTA button

---

## Dummy / Mock removal scope (must)

Remove or replace ALL dummy/mock/fixture/seed/sample/fake usage.
Minimum targets:

- src/data/dummyData (if exists)
- src/dataSource/gameDataSource.js: remove dummyData import/use
- src/features/game/data/gamePlayDummy.js: remove or stop using (no dummy generation)
- src/pages/CoopLobby.jsx: remove dummyRooms (if no API, disable UI with "준비중" but no dummy)
- Any mock env flags (VITE*USE_MOCK*\*) 제거하거나 기본 false로 고정
- After changes, repo search for dummy/mock keywords should be 0.

---

## Files to modify (guide)

### Scenarios

- src/features/scenarios/api/scenario.api.js
  - fetchScenarioList({ page })
  - fetchMyScenarioList({ page })
- src/features/scenarios/api/scenario.mapper.js
  - thumbnailUrl -> thumbnail
  - avgRating -> rating(0~5 float)
  - avgDifficulty -> difficultyLabel
- src/pages/Scenarios.jsx
  - tab state + loading/error + API fetch (use feature api module)
  - reuse existing filter hooks (useScenarioFilters/useFilteredScenarios)
- Card components (remove rating/100)
  - src/features/game/components/ScenarioCard.jsx
  - src/features/scenarios/components/ScenarioDetailCard.jsx
  - display: Number(rating ?? 0).toFixed(1)

### Common API layer (must use)

- src/api/http.js (fetch wrapper)
- src/api/endpoints.js (endpoint paths)
- src/api/errors.js (error mapping)

---

## Done checklist (acceptance)

- `npm run dev` succeeds
- /scenarios renders:
  - ALL tab shows fetched scenarios
  - MINE tab shows my scenarios (or 401 login 안내)
  - 탭 전환 시 서로 다른 API 호출
  - 검색/필터/정렬 동작
  - rating is shown as 4.6 style (no /100)
- Keyword search results must be 0:
  - dummy|Dummy|mock|Mock|fixture|Fixture|seed|Seed|sample|Sample|fake|Fake
