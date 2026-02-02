# Home TOP API 전용 엔드포인트로 수정 (필수)

## 현재 문제

Home 진입 시 네트워크 호출이 아래처럼 나가고 있음(요청 실패):

- GET /api/scenarios?sortBy=popular&page=0&size=10
- GET /api/scenarios?sortBy=rating&page=0&size=10

요구사항은 list API sortBy가 아니라, 백에서 제공하는 전용 TOP API를 호출해야 함:

- GET /api/scenarios/top/play-count
- GET /api/scenarios/top/rating

또한 프로젝트에 이미 전용 TOP API를 호출하는 훅이 존재함:

- useTopScenarios() // 내부에서 fetchTopScenariosByPlayCount/Rating 호출

## 작업 지시

### 1) Home.jsx 수정

파일: src/pages/Home.jsx

- `useScenarios({ sortBy: 'popular' ... })` 호출 제거
- `useScenarios({ sortBy: 'rating' ... })` 호출 제거
- 대신 `useTopScenarios()` 사용

구현 가이드:

- import 변경:
  - remove: `useScenarios`
  - add: `useTopScenarios` from `@/features/scenarios/hooks/useTopScenarios`

- Home 내부:
  - `const { topByRating, topByPlayCount } = useTopScenarios()`
  - 인기 리스트: `const popularTop10 = topByPlayCount || []`
  - 평점 리스트: `const ratingTop10 = topByRating || []`

### 2) 렌더링 규칙(중요)

useTopScenarios의 반환값 정책:

- API 실패 시: null (섹션 숨김 의도)
- 성공했지만 데이터 없음: [] (섹션 유지)

따라서 Home에서 섹션을 아래처럼 조건부 렌더링:

- 인기 섹션은 `topByPlayCount !== null`일 때만 표시
- 평점 섹션은 `topByRating !== null`일 때만 표시

(로딩 스피너는 선택: 둘 다 null일 때 무한 스피너가 될 수 있으니,
가능하면 스피너 제거하거나 "TOP 데이터를 불러올 수 없습니다" 상태로 처리)

## 완료 기준(검증)

Home 진입 시 Network 탭에 아래 2개 요청만 떠야 함:

- /api/scenarios/top/play-count
- /api/scenarios/top/rating

list API sortBy 호출(`/api/scenarios?sortBy=...`)은 없어야 함.
