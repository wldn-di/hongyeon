# Codex 작업 지시서 — 시나리오 목록(검색/필터/정렬/페이지) + TOP10 연동

> 목표: **백엔드 feature 브랜치(이미 체크아웃한 최신 코드)** 기준으로 Swagger에 추가된 시나리오 목록/정렬/검색 API를 **프론트(React + wouter + axios)**에 연동한다.  
> 원칙: **최소 변경**, **새 라이브러리 추가 금지**, **기존 구조(apiClient/ENDPOINTS/ApiError) 유지**, **앱이 깨지지 않게 점진 적용**.

---

## 0) 프로젝트 전제/제약

- 프론트: React SPA, 라우팅은 `wouter`, HTTP는 `axios` 기반 `apiClient`를 사용 중
- 기존 API 모듈 패턴:
  - `src/features/**/api/*.js` (또는 유사)
  - `apiClient.get/post(...)` 사용
  - 에러는 `ApiError.fromAxiosError(error)`로 래핑
- **추가 패키지 설치 금지** (qs, lodash 등 X)
- 백엔드 API는 로컬에서 `http://localhost:8080` 로 동작한다고 가정
- 프론트는 Vite로 `http://localhost:5173`

---

## 1) 연동 대상 API (Swagger/백 브랜치 기준)

### 1-1. 시나리오 목록 통합 조회

`GET /api/scenarios`

Query parameters:

- `keyword` (string, optional)
- `genres` (array<string>, optional, 복수 가능)
- `difficulties` (array<string>, optional, easy|medium|hard 복수 가능)
- `sortBy` (string, optional: latest|popular|rating)
- `page` (int, 0-base, default 0)
- `size` (int, default 20)

주의:

- **배열 쿼리 직렬화**는 Spring이 받는 방식으로 맞춰야 함  
  → **기본적으로** `genres=crime&genres=mystery` 형태가 가장 호환적  
  → `genres[]=crime` 형식은 백 설정에 따라 실패할 수 있음

### 1-2. TOP 10 (캐시 TTL 5분)

- `GET /api/scenarios/top/rating` (평점 TOP10)
- `GET /api/scenarios/top/play-count` (플레이수 TOP10)

---

## 2) 작업 범위 (프론트)

### 2-1. API 모듈 수정/추가

- `src/features/scenarios/api/scenariosApi.js` (경로가 다르면 프로젝트 구조에 맞게)
  1. 기존 `fetchScenarios()`를 **확장**하여 필터 파라미터를 받을 수 있게 변경
     - 예: `fetchScenarios({ keyword, genres, difficulties, sortBy, page, size })`
  2. `fetchTopScenariosByRating()`, `fetchTopScenariosByPlayCount()` 추가
  3. **paramsSerializer** 구현 (배열 params 처리)

#### ✅ axios paramsSerializer 구현 가이드 (라이브러리 없이)

- `URLSearchParams`를 사용해 배열을 `key=value&key=value`로 구성
- undefined/null/빈 배열은 제외

예시(참고):

```js
const paramsSerializer = (params) => {
  const sp = new URLSearchParams();
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    if (Array.isArray(value)) {
      value.filter(Boolean).forEach((v) => sp.append(key, String(v)));
      return;
    }
    if (String(value).length === 0) return;
    sp.set(key, String(value));
  });
  return sp.toString();
};
```

- axios 호출 예:

```js
apiClient.get(ENDPOINTS.scenarios.list, {
  params,
  paramsSerializer,
});
```

### 2-2. hooks / state 수정

- `useScenarios.js`, `useFilteredScenarios.js`, `useScenarioFilters.js` 등
  - 새 필터 구조(genre, difficulty, sortBy, keyword, page, size)에 맞춰 호출 변경
  - page/size는 UI 페이지네이션과 연결
  - `sortBy` 변경 시 page 0으로 reset

### 2-3. UI(시나리오 목록 페이지) 연동

- 목록 화면에서 아래를 지원해야 함
  - 키워드 검색
  - 장르 멀티 선택
  - 난이도 멀티 선택
  - 정렬: latest / popular / rating
  - 페이지네이션 (0-base를 UI에서 1-base처럼 보이게 처리 가능)

- 상단에 TOP 섹션 2개(선택):
  - **평점 TOP 10**
  - **플레이 TOP 10**
  - TOP API 실패 시(404/500) **화면이 깨지지 않게 섹션만 숨김**

### 2-4. 렌더링 정책

- 시나리오 목록 렌더링은 **status === "COMPLETED"만 표시**
  - 백이 `COMPLETED`만 내려주더라도 프론트에서도 한 번 더 필터링
  - 실패/생성중 데이터는 목록에 카드로 노출하지 않음

---

## 3) 백 브랜치 기반 “검증 필수” (추측 금지)

Codex는 **Swagger만 보고 구현하지 말고**, 반드시 아래를 확인해야 함:

1. 로컬에서 백 실행 후, 프론트에서 실제 요청이 나가는지 Network 확인
2. 특히 `genres`, `difficulties`가 아래처럼 나가는지 확인:
   - ✅ `...?genres=crime&genres=mystery`
   - ✅ `...?difficulties=easy&difficulties=hard`
3. 백에서 실제로 필터링/정렬이 적용되는지 응답 변화로 확인

---

## 4) backward compatibility (백 합쳐지기 전/후 모두 대응)

현재는 백이 합쳐지기 전이므로, 아래 2가지 중 하나로 **앱이 깨지지 않게**:

- (권장) 목록은 새 `GET /api/scenarios`로 붙이되,
  - TOP 엔드포인트 호출은 실패 시 조용히 무시하고 섹션 숨김
- 기존 `searchScenarios()` 같은 레거시 함수는 유지하되,
  - 목록 페이지에서 쓰는 로직만 통합 API로 전환

---

## 5) 산출물(필수)

### 5-1. 코드 변경

- API 모듈 변경(필수)
- 훅 변경(필수)
- 목록 화면 UI 연결(필수)

### 5-2. 개발자 확인 로그/주석(선택)

- `paramsSerializer`가 어떤 형식으로 직렬화되는지 주석 1줄
- TOP 섹션 실패 시 fallback 처리 주석

---

## 6) Acceptance Criteria (완료 기준)

- [ ] keyword 검색 시 URL 쿼리에 `keyword=`가 붙고 결과가 변한다
- [ ] 장르 2개 이상 선택 시 `genres=a&genres=b`로 나간다
- [ ] 난이도 2개 이상 선택 시 `difficulties=a&difficulties=b`로 나간다
- [ ] sortBy 변경 시 결과 순서가 달라진다
- [ ] page/size 변경이 응답 `content`가 바뀌는 것으로 확인된다
- [ ] 목록 UI는 `COMPLETED`만 렌더링한다
- [ ] TOP 엔드포인트가 실패해도 앱이 깨지지 않는다(섹션만 숨김)
- [ ] 새 API가 합쳐지기 전/후 모두 프론트가 동작한다(최소한 목록 페이지는 정상)

---

## 7) 테스트 체크리스트 (Codex가 직접 수행)

1. 백 실행 (`:8080`)
2. 프론트 실행 (`:5173`)
3. 시나리오 목록 페이지 진입 → Network에서 `GET /api/scenarios` 확인
4. 장르 2개 선택 → Network query string 확인 + 결과 변화 확인
5. 난이도 2개 선택 → Network query string 확인 + 결과 변화 확인
6. sortBy 변경(latest/popular/rating) → 결과 변화 확인
7. TOP 엔드포인트 2개 호출 확인(정상/실패 모두 앱 안정)
8. 페이지네이션 클릭 → `page` 변경 확인

---

## 8) PR(또는 커밋) 메시지 가이드

- `feat(scenarios): integrate list filters/sort/pagination api`
- `feat(scenarios): add top rating/playcount sections with graceful fallback`
- `fix(scenarios): serialize array params for spring controller`

---

## 9) 참고: 프론트 파일 힌트(프로젝트에 맞게 조정)

- API: `src/features/scenarios/api/scenariosApi.js`
- Hooks: `src/features/scenarios/hooks/useScenarios.js`, `useFilteredScenarios.js`, `useScenarioFilters.js`
- UI: `src/pages/Scenarios.jsx` 또는 `src/features/scenarios/pages/ScenarioList.jsx`
- 컴포넌트: `ScenarioFilters.jsx`, `ScenarioDetailCard.jsx` 등

---

## 10) 마지막 요구사항(중요)

- **새로 클래스를 잔뜩 만들지 말 것**: 기존 패턴/파일을 확장
- **불필요한 중복 API 함수 생성 금지**: `fetchScenarios(filters)` 중심으로 통합
- **배열 params는 반드시 검증 후 확정**: Network/백 로그 기반으로 결정
