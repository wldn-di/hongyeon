Already done:

- main.jsx has no ScenarioGenerationProvider
- AppShell mounts ScenarioGenerationProvider with enabled based on auth
- ScenarioGenerationProvider no longer renders overlay
- NotificationBell.jsx updated
- ScenarioGenerationStatusPanel.jsx exists
- TypewriterText.jsx exists

Please do ONLY the remaining tasks:

1. Ensure ScenarioGenerationContext stores stageType/meta/sseConnected correctly in all setGeneration calls
   - setGeneratingSnapshot and bootstrap setGeneration must spread initialState so fields don’t disappear.
   - SSE progress must set stageType=payload.type and meta=payload.data.
   - Connection error should set sseConnected=false without clearing generating state.

2. Update src/pages/CreateScenario.jsx
   - Import and render <ScenarioGenerationStatusPanel /> near top (below the page header).
   - When locked, show helper text: “생성 중에는 새 시나리오 생성이 불가합니다. 🔔에서 진행 상황을 확인하세요.”
   - Keep current disabled behavior, no global overlay.

3. Ensure src/components/layout/Header.jsx renders NotificationBell on the right.

Return minimal diffs only; do not rewrite working files unnecessarily.
