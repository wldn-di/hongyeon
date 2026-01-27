# Wireframe Spec — Scenarios Page (/scenarios)

## Single Source of Truth

- OpenAPI: document/openapi.json
- DO NOT guess DTO fields or query params.

---

## Layout

- Tabs (2):
  - ALL (default): 전체 시나리오
  - MINE: 내 시나리오
- Note: UI layout is identical across tabs. Only the data source changes.
- Search / Filter / Sort must work the same on both tabs.

---

## Data Source (must)

- ALL tab:
  - GET /api/scenarios -> ScenarioListResponse
- MINE tab:
  - GET /api/users/me/scenarios -> ScenarioListResponse
  - If 401: show login guidance (do NOT fallback to ALL)

### Response DTO (must match openapi.json)

- ScenarioListResponse.content is `Item[]`
- Item fields:
  - id, title, synopsis, genre, thumbnailUrl, playCount, avgRating(number), avgDifficulty(number),
    status, progress, generationMessage

---

## UI Mapping Rules (DTO -> UI model)

- thumbnail = thumbnailUrl
- rating = avgRating (0~5 float). DO NOT use rating/100 or \*100.
- difficultyLabel derived from avgDifficulty:
  - <= 2.4: easy
  - <= 3.6: medium
  - else: hard
- Do NOT add new fields to DTOs.
- If UI needs a field not in DTO (e.g., estimatedTime), use safe default (0/null) and mark TODO.

---

## Controls

- Search input placeholder: "시나리오 검색..."
- Filter:
  - 장르 드롭다운 (client-side)
  - 난이도 드롭다운 (difficultyLabel 기준, client-side)
- Sort (client-side):
  - 인기순: playCount desc
  - 평점순: avgRating desc
  - 난이도순: avgDifficulty desc

### Query Params

- 1st milestone: do NOT use server query params (none guaranteed by openapi).
- Apply search/filter/sort on the client side after fetching page=0.

---

## Content

- Grid: 3 cols desktop / 2 cols tablet / 1 col mobile
- Card shows:
  - thumbnail
  - title
  - synopsis (truncate)
  - playCount
  - rating (0~5)
  - difficultyLabel (easy/medium/hard)

---

## Tab Behavior

- On tab switch: reset page to 0
- Keep search/filter/sort state across tabs (do not reset)

---

## Empty / Error

### MINE tab empty list

- Message: "아직 생성한 시나리오가 없습니다."
- CTA: "시나리오 생성하기" (TODO route)

### MINE tab 401

- Message: "로그인이 필요합니다."
- Login button: /api/auth/login?redirect=/scenarios

---

## Pagination

- ScenarioListResponse includes totalPages / totalElements / currentPage
- Milestone-1: fetch page=0 only (pagination UI is TODO)

---

## Networking rule

- Use credentials: "include" (session-based auth)
