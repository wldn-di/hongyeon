# New TODO (이번 대화 세션 정리)

> 목적: 기존 `TODOLIST.md`에 있던 “이전 작업/다른 주제”는 건드리지 않고, **이번 세션에서 합의/논의한 내용만** 별도 파일로 정리.

---

## 1) Spring AI: “시나리오 생성 노드”만 `gemini-3.0-pro` + thinking budget 최대 (A안)

### 1.1 전제/현상 정리
- [ ] `.env` vs `application.yml`에 모델 설정이 중복/충돌하는지 정리(전역 기본 모델 1개로 고정)
- [ ] “노드별로만 모델/옵션 다르게”는 **설정만으로는 불가** → **전용 `ChatClient` Bean 분리(A안)** 로 해결

### 1.2 설정값(운영 파라미터) 정의
- [ ] 시나리오 생성 전용 설정 키를 앱 prefix로 분리(예시)
  - [ ] `APP_SCENARIO_V2_LLM_MODEL` (예: `gemini-3.0-pro` / 실제 model id 확정 필요)
  - [ ] `APP_SCENARIO_V2_LLM_THINKING_LEVEL=HIGH`
  - [ ] `APP_SCENARIO_V2_LLM_THINKING_BUDGET=<MAX>` (모델 상한 확인 후 확정)
  - [ ] `APP_SCENARIO_V2_LLM_INCLUDE_THOUGHTS=true` (**Gemini 3 Pro + function calling 시 필요할 수 있음**)
  - [ ] (선택) `APP_SCENARIO_V2_LLM_MAX_OUTPUT_TOKENS=...`
  - [ ] (선택) `APP_SCENARIO_V2_LLM_TEMPERATURE=...`
  - [ ] (선택) `APP_SCENARIO_V2_LLM_RESPONSE_MIME_TYPE=application/json`

### 1.3 전용 ChatClient 분리(A안)
- [ ] `scenarioGenChatClient` Bean 추가(기본 옵션: model + thinkingLevel + thinkingBudget + includeThoughts + json 응답 등)
- [ ] 기존 공용 `genAiChatClient`는 Flash 계열(속도/비용)로 유지

### 1.4 “생성 노드”만 전용 ChatClient 주입
- [ ] 아래 노드들만 `@Qualifier("scenarioGenChatClient")`로 교체
  - [ ] `TimelineNode`
  - [ ] `ScenarioBaseNode`
  - [ ] `CharactersCluesTruthNode`
  - [ ] `RoomsNode`
  - [ ] (선택) `ImagePromptNode` (이미지 프롬프트 품질이 필요하면)
- [ ] `ValidateNode / CritiqueNode / RefineNode / PersistNode / ImageBatchNode / FinalizeNode`는 기존 공용 유지

### 1.5 “max thinking budget” 값 확정
- [ ] `gemini-3.0-pro`의 **정확한 model id** 확정(프로바이더/리전/Vertex 여부에 따라 문자열이 달라질 수 있음)
- [ ] thinking-budget 상한을 점진적으로 올려 “허용 최대값/에러 패턴” 확인 후 `APP_SCENARIO_V2_LLM_THINKING_BUDGET`에 고정

### 1.6 Node별 thinking 적용 후보(전부 점검 결과)
> “thinking 설정”은 `ChatOptions`(공용 옵션)만으로는 표현이 안 되므로, **Google 전용 옵션(`GoogleGenAiChatOptions`)이 들어가야 함**.

- [ ] `TimelineNode` (LLM 호출: O)
  - [ ] 추천: `thinking-level=HIGH` (타임라인/인물 생성 + 제약(용의자 수/JSON 구조) 준수)
  - [ ] `thinking-budget`: 중간~높음(초기 1회 생성이라 투자 가치 있음)
- [ ] `ScenarioBaseNode` (LLM 호출: O)
  - [ ] 추천: `thinking-level=HIGH` (타임라인 기반으로 시놉시스/반전/incident_time을 논리적으로 구성)
  - [ ] `thinking-budget`: 중간(구조는 단순하지만 개연성 품질 영향)
- [ ] `CharactersCluesTruthNode` (LLM 호출: O, 실패(구조) 발생 지점)
  - [ ] 추천: `thinking-level=HIGH` (가장 복잡: suspects(N)/clues(8~12)/truth_config_json 상호 참조 + 깊은 중첩 JSON)
  - [ ] `thinking-budget`: 높음(여기서 구조/개연성 깨지면 후속 루프 비용이 더 커짐)
- [ ] `RoomsNode` (LLM 호출: O)
  - [ ] 추천: `thinking-level=HIGH` (rooms 6개 + floor_number 1..6 + clues를 description에 “자연스럽게” 배치)
  - [ ] `thinking-budget`: 중간(제약 + 서술 결합)
- [ ] `CritiqueNode` (LLM 호출: O, 루프에서 반복될 수 있음)
  - [ ] 추천: `thinking-level=HIGH` (모순/비현실/단서-진실 연결 누락 탐지 품질에 직결)
  - [ ] `thinking-budget`: 낮음~중간(반복 호출 가능 → 과투자 시 비용/지연 증가)
- [ ] `RefineNode` (LLM 호출: O, 루프에서 반복될 수 있음)
  - [ ] 추천: `thinking-level=HIGH` (검증 이슈를 “최소 수정”으로 고치면서 배열 길이/구조 보존)
  - [ ] `thinking-budget`: 중간(반복 호출 가능하지만 수정 난이도 높음)
- [ ] `ValidateNode` (LLM 호출: X) → 해당 없음
- [ ] `PersistNode` (LLM 호출: X) → 해당 없음
- [ ] `ImagePromptNode` (LLM 호출: X / 현재는 템플릿 문자열) → 해당 없음
- [ ] `ImageBatchNode` (LLM 호출: X / Imagen 호출) → 해당 없음
- [ ] `FinalizeNode` (LLM 호출: X) → 해당 없음

---

## 2) 이미지 프롬프트: 시대/인종/연령 + 시나리오 맥락으로 일관성 강화(“같은 얼굴 재현”은 제외)

### 2.1 목표
- [ ] 같은 시나리오 내 이미지가 “같은 시대/지역/조명/톤”으로 보이게 만들기
- [ ] 인물은 **페르소나(직업/배경/역할)에 맞는 얼굴/복장/분위기**가 나오게 만들기  
      (같은 인물 얼굴을 재현/재사용하는 요구는 없음)

### 2.2 Visual Bible(시나리오 공통 비주얼 가이드) 스키마 정의
- [ ] 시대/연대 + 지역(문화권)
- [ ] 계절/날씨/시간대 + 조명(예: 네온, 자연광, 텅스텐)
- [ ] 톤/장르(예: noir/cinematic/realistic) + 색감(팔레트) + 질감(필름 그레인 등)
- [ ] 금지 요소(시대착오 소품, 워터마크, 텍스트/로고 등)
- [ ] 인물 가이드(연령대/인종·외형 특징/직업별 복장 규칙 + 인물 간 차별화 포인트)

### 2.3 Visual Bible 생성/저장 위치 결정
- [ ] 생성 방식(택1)
  - [ ] A) LLM이 시나리오 생성 단계에서 `visual_bible_json`까지 함께 생성(추천)
  - [ ] B) 사용자 입력에 시대/지역/분위기 필드를 추가해 확정값으로 받기
  - [ ] C) 서버 규칙 기반(genre/style) 기본 매핑
- [ ] 저장 위치(택1)
  - [ ] A) `scenario_json` 또는 `story_config_json` 내부에 포함
  - [ ] B) `Scenario`에 전용 컬럼 추가

### 2.4 ImagePromptNode 프롬프트 템플릿 재구성
- [ ] “공통 Prefix + 대상별 Suffix”로 변경
  - [ ] Prefix: Visual Bible 요약(시대/지역/톤/팔레트/금지 요소)
  - [ ] Thumbnail: synopsis(또는 synopsisDetail) + 사건 분위기 + 대표 장소/시간대 반영
  - [ ] Portrait(피해자/용의자): 역할 + 직업/배경 + 시대에 맞는 의상/헤어/표정(페르소나) 반영
  - [ ] Clue: “어디서 발견되는지(현장/방/맥락)” + 재질/상태 + 증거사진 구도(클로즈업) 반영

### 2.5 Imagen 옵션(텍스트 기반 일관성 보조) 적용 검토
> 현재는 `aspectRatio/outputMimeType`만 사용 중이라 변동이 커질 수 있음.
- [ ] `negativePrompt` 공통 템플릿 정의(텍스트/워터마크/로고/시대착오 소품 배제)
- [ ] `guidanceScale` 정책 결정
- [ ] `enhancePrompt` 사용 여부 결정
- [ ] `personGeneration` 정책 결정(성인만 허용 등) — 연령 가이드와 일치

---

## 3) 오류 분석: `clues must be an array` (원인 가설 정리)

### 3.1 어디서 뜨는 메시지인가
- [ ] `CharactersCluesTruthNode` 내부 검증에서 발생 가능(LLM이 만든 characters JSON이 `clues: [...]` 형태가 아닐 때)
- [ ] `ValidateNode`의 draft 검증에서 발생 가능(조립된 draft의 `clues`가 배열이 아닐 때)

### 3.2 직접 원인(가장 흔한 케이스)
- [ ] LLM 출력에서 `clues`가
  - [ ] 아예 누락되거나
  - [ ] 객체 `{...}` 로 나오거나(예: `clues: { items: [...] }`)
  - [ ] 문자열로 나오거나(예: `"clues": "[{...}]"`)
  - [ ] 다른 위치에 중첩되어 나오거나(예: `scenario.clues` / `data.clues` 등)

### 3.3 간접 원인(형태가 틀어지는 트리거)
- [ ] LLM이 JSON 외의 텍스트를 섞어 내고, 정규화가 “원치 않는 JSON 조각”만 추출하는 경우
- [ ] LLM이 여러 JSON 블록을 출력해 첫 블록만 추출되는 경우(첫 블록에 `clues`가 없을 수 있음)
- [ ] JSON이 깨진 상태로 오고 자동 닫힘(`autoCloseJson`) 후 파싱은 되지만 타입이 기대와 다르게 굳는 경우

### 3.4 재발 방지 방향(코드 수정은 별도 작업)
- [ ] 프롬프트를 더 “스키마 고정” 형태로 강화(최상위 키/`clues` 타입을 예시와 함께 강제)
- [ ] (선택) 후처리/조립 단계에서 `clues`가 단일 오브젝트면 배열로 래핑하는 등 복구 전략 검토
- [ ] invalid 출력이 나왔을 때 “어떤 JSON이 들어왔는지” 재현 가능한 로그/스냅샷 전략 검토
