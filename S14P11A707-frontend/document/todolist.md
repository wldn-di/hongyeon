문제 설명:
현재 로그인되지 않은 상태에서 게임플레이나 /my-bookshelf 접근 시
다음 문제가 발생한다.

- 로그인 요구 페이지가 /me 경로를 사용하고 있음
- 로그인 시 실제 페이지 이동(/me → / → 다시 게임플레이)이 발생
- 그 결과 화면이 깜빡이고 홈 ↔ 게임플레이가 반복 이동함
- 사용자가 의도하지 않은 페이지 전환이 일어남

목표:
로그인은 "페이지 이동 없이" UI 컴포넌트(게이트/모달)로 처리하고,
로그인 성공 시 현재 화면 컨텍스트를 유지한 채
원래 하려던 동작(수사록 열기, 게임플레이 계속)을 즉시 수행한다.

요구사항:

1. /me를 로그인 페이지로 사용하지 않는다.
2. /login 또는 /me로의 라우트 이동을 제거한다.
3. 로그인 요구는 라우터가 아니라 UI 상태로 처리한다.
4. LoginGate(또는 AuthGate) 컴포넌트를 전역으로 추가한다.
5. 로그인되지 않은 상태에서:
   - /my-bookshelf 버튼 클릭 시
   - 게임플레이 진입 또는 플레이 중 보호 기능 접근 시
     페이지 이동 없이 로그인 UI를 띄운다.
6. 로그인 성공 시:
   - 홈으로 이동하지 않는다.
   - 기존 URL을 유지한다.
   - 원래 요청했던 행동을 즉시 실행한다.
7. /my-bookshelf는 SPA 라우트로 추가하되,
   로그인 요구는 라우트 가드가 아니라 UI 게이트로 처리한다.
8. RequireAuth 같은 라우터 기반 리다이렉트는
   게임플레이와 수사록에는 적용하지 않는다.

구현 지침:

- React + React Router v6
- AuthContext에 loginGate 상태(open, onSuccess)를 추가
- openLoginGate(callback) 패턴 사용
- LoginGate 컴포넌트는 App 루트에서 항상 렌더링
- 로그인 성공 시 callback 실행 후 게이트 닫기
- navigate(), redirect(), replace() 사용 금지 (로그인 플로우에서)

산출물:

- AuthContext 수정 코드
- LoginGate 컴포넌트 코드
- /my-bookshelf 버튼 클릭 처리 예시
- 게임플레이에서 로그인 요구 처리 예시
- 제거해야 할 기존 /me 기반 로그인 리다이렉트 로직 명시

---

## 구현 결과 (wouter 기반)

이 프로젝트는 라우터로 `wouter`를 사용 중이라, 요구사항의 “Router 이동 없이 게이트로 처리”를 동일한 방식으로 구현했습니다.

### 1) AuthContext (loginGate 상태 + openLoginGate)

`src/contexts/AuthContext.jsx`

- `state.loginGate = { open, redirectTo }`
- `actions.openLoginGate(onSuccess, { redirectTo })`
- `actions.closeLoginGate()`
- 로그인 성공(user 세팅) 시 `onSuccess` 실행 후 게이트 닫기

### 2) LoginGate 전역 컴포넌트

`src/components/ui/LoginGate.jsx`

- 라우트 이동 없이 모달 UI만 표시
- 로그인 버튼은 `actions.login({ redirectTo })` 호출 (백엔드 OAuth 플로우가 원래 경로로 복귀)

### 3) /my-bookshelf 버튼 클릭 (페이지 이동 없이 게이트 오픈)

`src/components/layout/Header.jsx`

- 비로그인 상태에서 내 수사록 클릭 시 `preventDefault()` 후 `openLoginGate(..., { redirectTo: "/my-bookshelf" })`

### 4) 게임플레이 진입 시 게이트 오픈

`src/pages/GameRoom.jsx`

- 비로그인 상태로 `/game/:scenarioId`, `/room/:...` 진입 시 1회 자동으로 `openLoginGate()` 오픈

### 5) 기존 /me 기반 리다이렉트 제거

- 라우터 가드(리다이렉트) 제거: `src/app/routes.jsx`에서 보호 라우트 래핑 제거
- 기존 로그인 요구 모달(라우트 이동) 제거: `src/components/ui/LoginRequiredModal.jsx` 삭제
- API 401 처리 시 라우트 이동 대신 게이트 오픈: `src/api/client/axios.js`
