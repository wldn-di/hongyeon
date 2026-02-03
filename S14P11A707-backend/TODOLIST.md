# v2 시나리오 생성(Async + SSE + Redis + Spring AI Graph) TODO LIST

이 문서는 “바로 구현 들어갈 수 있게” 할 일을 최대한 구체적으로 쪼갠 작업 목록입니다.  
진행 상황(SSE)은 **재연결 시 리셋**(복구/리플레이/스냅샷 저장 안 함)으로 고정합니다.

---

## 0) 스코프 / Non-goals

- [ ] v1(`ScenarioApi`, `ScenarioServiceImpl`)는 **동작 유지**(기준 구현)하고, v2는 **생성만** 담당한다.
- [ ] v2는 “생성” 외의 목록/상세/삭제/랭킹 등은 **구현하지 않는다**(필요 시 v1 API 재사용).
- [ ] SSE는 **Last-Event-ID 리플레이 미지원**, 재연결 시 0부터 다시 시작.
- [ ] 이미지 “30장 고정” 없음. **엔티티 URL 필드 기반 가변 생성**.
- [ ] 이미지 생성 실패 시 **전체 FAILED**(부분 성공 허용 안 함).
- [ ] 이미지 생성은 **이미지 1장당 최대 2회 재시도(총 3회 시도)** 후 실패면 전체 FAILED.

---

## 1) 패키지/파일 구조(권장)

v2 코드는 v1과 섞이지 않게 별도 패키지로 분리:

- [ ] `com.ssafy.s14p11a707.scenario.v2.api`
- [ ] `com.ssafy.s14p11a707.scenario.v2.dto`
- [ ] `com.ssafy.s14p11a707.scenario.v2.service`
- [ ] `com.ssafy.s14p11a707.scenario.v2.graph` (StateGraph 구성)
- [ ] `com.ssafy.s14p11a707.scenario.v2.node` (각 Node 구현)
- [ ] `com.ssafy.s14p11a707.scenario.v2.stream` (SSE emitter repo/유틸)
- [ ] `com.ssafy.s14p11a707.scenario.v2.event` (Redis 메시지 모델/퍼블리셔/서브스크라이버)
- [ ] `com.ssafy.s14p11a707.scenario.v2.image` (이미지 생성/업로드/리트라이)

---

## 2) v2 API(엔드포인트) 정의

### 2.1 생성 요청 API

- [ ] `POST /api/v2/scenarios`
  - auth: 세션(OIDC) 필수(기존 `SecurityConfig` 정책 그대로면 자동 protected)
  - request: `ScenarioV2CreateRequest`
  - response: `ScenarioV2CreateResponse`
  - 동작:
    - [ ] (즉시) DB에 `Scenario` “stub” 저장: `generationStatus=GENERATING`, `creator=user`, `userSynopsis/genre/suspectCount/title` 등 최소 필드 세팅
    - [ ] (즉시) 응답 반환: `{scenarioId, status:"GENERATING" ...}`
    - [ ] (백그라운드) 그래프 실행(아래 4~7절)

### 2.2 SSE 연결 API

- [ ] `GET /api/v2/scenarios/stream` (SSE)
  - auth: 세션(OIDC) 필수
  - 동작:
    - [ ] `SseEmitter` 생성(timeout 예: 5분)
    - [ ] in-memory 저장소에 `userId -> emitter` 등록
    - [ ] `connect` 이벤트 1회 전송
    - [ ] 재연결은 “진행률 리셋”: 별도 복구 로직 없음(단순 연결만)

### 2.3 Swagger 문서(선택)

- [ ] `ScenarioV2ApiDoc` 인터페이스 추가(기존 패턴 따라 OpenAPI annotation)

---

## 3) v2 DTO / Event 스키마

### 3.1 DTO

- [ ] `ScenarioV2CreateRequest` (v1과 동일 필드라도 v2 전용 record로 새로 만든다)
  - `title`, `genre`, `suspectCount`, `userSynopsis` (+ 필요 시 style 확장)
- [ ] `ScenarioV2CreateResponse`
  - `scenarioId`, `status`, `estimatedTimeSeconds?`, `errorMessage?`

### 3.2 SSE 이벤트 DTO

- [ ] `ScenarioV2StreamEvent`
  - `scenarioId`
  - `type` (예: `TIMELINE`, `ROOMS`, `IMAGE_PROGRESS`, `COMPLETE`, `ERROR`…)
  - `progress` (0~100)
  - `message` (스토리텔링 문구)
  - `data` (optional: `{done,total}` 등)

### 3.3 Redis Pub/Sub 메시지 모델

- [ ] Redis로 publish/subscribe할 “내부 메시지” 모델 정의(= SSE DTO와 같게 가도 됨)
  - 최소 포함: `userId`, `scenarioId`, `type`, `progress`, `message`, `data`

---

## 4) SSE Emitter 관리(서버 메모리)

- [ ] `SseEmitterRepository`(혹은 `SseEmitterStore`) 구현
  - `ConcurrentHashMap<Long userId, SseEmitter>`
  - `put/get/remove`
  - `onCompletion/onTimeout/onError`에서 자동 remove
- [ ] 연결 중복 처리 정책 결정
  - [ ] 같은 userId가 다시 연결하면 “기존 emitter 종료 후 교체” (권장)

---

## 5) Redis Pub/Sub 브릿지(이벤트 전달)

현재 Redis는 캐시로만 쓰고 있으므로 pub/sub 구성 추가 필요:

- [ ] `RedisConfig`에 Pub/Sub 관련 bean 추가(캐시 설정은 이미 `RedisConfig`로 통합됨)
  - `ChannelTopic`(예: `scenario.v2.events`)
  - `RedisMessageListenerContainer`
  - 메시지 serializer(JSON)
- [ ] `ScenarioV2EventPublisher`
  - 그래프/노드에서 호출 → redis publish
- [ ] `ScenarioV2EventSubscriber`
  - redis message 수신 → userId로 emitter 찾아 `emitter.send(...)`
  - emitter 없으면 drop(로그만)

---

## 6) 비동기 실행(Async)

- [ ] `@EnableAsync` 추가 + 전용 executor 구성(`TaskExecutor`/`Executor`)
  - 이미지 병렬 executor와 “전체 시나리오 job executor”를 분리할지 결정(권장: 분리)
- [ ] `ScenarioV2Service`(생성 전용 서비스) 구현
  - `createScenario(request, userId) -> response` (즉시 반환)
  - `runScenarioGraphAsync(userId, scenarioId, request)` (백그라운드)
- [ ] 실패 시나리오 마킹
  - [ ] `ScenarioTransactionHelper.markFailed(scenarioId, msg)` 재사용(REQUIRES_NEW)

---

## 7) Spring AI Graph(StateGraph) 구성

### 7.1 의존성 확인

- [ ] Spring AI 1.1.2에서 StateGraph/Agent 지원 artifact 확인 후 `build.gradle`에 추가
  - 구현 전에 “정확한 group/artifact/version”을 먼저 확정

### 7.2 State 정의

- [ ] `ScenarioV2State` 설계/구현
  - 입력: `userId`, `scenarioId`, `request`
  - 중간 산출물: `timelineJson`, `scenarioBaseJson`, `charactersCluesTruthJson`, `roomsJson`
  - 평가/루프: `critiqueScore`, `critiqueFeedback`, `retryCount`
  - 이미지: `List<ImageJob> imageJobs`, `done/total`, `imageUrlsByEntityId`

### 7.3 Node 구현(권장 순서)

아래 노드들은 “오케스트레이션은 v2 service(혹은 graph runner)”, “로직은 node 클래스”로 분리:

- [ ] `TimelineNode`
  - v1의 “1단계 cast+timeline 생성” 프롬프트 기반
  - JSON 파싱/정규화(코드블록 제거 등)
- [ ] `ScenarioBaseNode`
  - v1의 “2단계 scenario(title/synopsis/synopsisDetail/story_config)” 프롬프트 기반
- [ ] `CharactersCluesTruthNode`
  - v1의 “3단계 victim/suspects/clues/truth_config” 프롬프트 기반
- [ ] `RoomsNode`
  - v1의 “4단계 rooms(6층)” 프롬프트 기반
- [ ] `ValidateNode` (결정론)
  - 스키마/개수/참조/중복/필드 누락 검증
  - “어디가 왜 문제인지” 구조화된 에러 리포트 생성
- [ ] `CritiqueNode` (LLM-as-judge)
  - 점수(0~100) + mustFix 목록 + 보강 지시문 생성
  - 출력 JSON 포맷 고정
- [ ] `RefineNode` (loop)
  - `retryCount++`
  - “최소 수정” 원칙: 기존 JSON을 편집(또는 특정 파트만 재생성)
  - 이후 `ValidateNode -> CritiqueNode`로 재진입
- [ ] `PersistNode`
  - 최종 JSON → 엔티티 저장(Scenario/Victim/Suspect/Clue/Room)
  - `RoomLayoutService.generateRandomLayout(roomType)` 재사용
  - clue transform 랜덤 배치 로직(v1 코드) 재사용
  - embeddings(v1 코드) 재사용
  - 저장 완료 시 progress 이벤트 publish
- [ ] `ImagePromptNode`
  - 이미지 대상 엔티티(Scenario/Victim/Suspects/Clues) 기준으로 `ImageJob` 목록 생성
  - objectKey 규칙 확정(예: `scenarios/{scenarioId}/...`)
  - 프롬프트 생성(genre/style 반영)
- [ ] `ImageBatchNode`
  - fixed thread pool(예: 5) + `CompletableFuture` 병렬 실행
  - 이미지 1장당 리트라이 2회(backoff 300ms→1s + jitter)
  - 성공마다 `IMAGE_PROGRESS(done/total)` publish
  - 모두 성공해야 다음 단계 진행
- [ ] `FinalizeNode`
  - Scenario `generationStatus=COMPLETED` 확정
  - `complete` 이벤트 publish(SSE로 최종 알림)

### 7.4 Mermaid/문서 동기화

- [ ] `plan.md`의 Mermaid/노드 표/진행률을 구현과 동기화(변경 시 즉시 업데이트)

---

## 8) 이미지 생성/업로드(MinIO)

현재 코드에 MinIO client/service가 없으므로 신규 구현:

- [ ] `MinioClient` Bean 구성(프로퍼티는 `application.yml`에 이미 존재)
- [ ] `ObjectStorageService`(혹은 `MinioStorageService`) 구현
  - `putObject(bucket, objectKey, bytes, contentType)`
  - public URL 생성 규칙(프론트가 접근 가능한 형태로)
- [ ] `ImageGenerator` 인터페이스 정의
  - (초기) Mock 구현(더미 이미지 바이트)로 병렬/리트라이/업로드 검증
  - (추후) 실제 이미지 모델/외부 API 연동 구현

### 8.1 트러블슈팅(이미지 URL/MinIO)

- [ ] 증상: 프론트에서 이미지가 깨지거나(404), MinIO가 403(AccessDenied) 반환
- [ ] 원인(핵심): 프론트는 `thumbnailUrl`/`portraitUrl`/`detailImageUrl`을 그대로 `<img src>`로 로드한다
  - 따라서 백엔드가 내려주는 URL이 **브라우저에서 접근 가능한 주소**여야 한다
- [ ] 원인(자주): 백엔드가 업로드 후 URL을 `MINIO_ENDPOINT` 기반으로 만들어 저장/응답함
  - 로컬(SSH 터널 `http://localhost:19000`) / 배포(도커 내부 `http://minio:9000`) 값이 섞이면 브라우저에서 접근 불가
- [ ] 원인(자주): 버킷이 비공개(`mc anonymous set none`)면 브라우저 direct GET이 403
- [ ] 해결(권장): **환경을 확실히 분리**하고, 배포 환경의 `MINIO_ENDPOINT`는 “브라우저 접근 가능한 도메인(리버스 프록시)”로 맞춘다
  - 예: `https://minio.hongyeon.cloud-ip.cc`
- [ ] 해결(대안): DB에는 URL 대신 objectKey만 저장하고, API 응답에서 공개 base URL을 조합해 내려준다(내부 업로드 endpoint와 공개 endpoint 분리)
- [ ] 해결(간단/주의): 버킷을 공개 다운로드로 열기 `mc anonymous set download local/<bucket>` (민감 이미지면 비권장)
- [ ] 리버스 프록시(Nginx Proxy Manager) 체크
  - [ ] upstream host는 `minio:9000`(서비스명) 사용
  - [ ] SSL 강제 적용은 인증서 발급 성공 후 켜기
  - [ ] DNS에 `minio` 서브도메인 A/CNAME 레코드 필요 + 서버 80/443 인바운드 오픈(HTTP-01 기준)
- [ ] docker-compose 포트 바인딩(권장)
  - [ ] 로컬: `minio`는 host-only로 포트 분리 바인딩(예: `127.0.0.1:19000->9000`, `127.0.0.1:19001->9001`)
  - [ ] 배포: MinIO 포트를 외부에 직접 노출하지 말고(NPM 통해서만 접근), 필요하면 `127.0.0.1`로만 제한 바인딩
- [ ] `.env` / `.env.dev`(환경별 엔드포인트) 정리
  - [ ] 로컬(`.env`): `MINIO_ENDPOINT=http://localhost:19000`처럼 로컬 compose 포트와 1:1로 맞춘다
  - [ ] 배포(`.env.dev`): `MINIO_ENDPOINT`를 브라우저가 접근 가능한 도메인(리버스 프록시)로 맞추거나, (대안) 코드에서 내부/공개 endpoint 분리 구현 후 내부(`http://minio:9000`)로 유지한다

---

## 9) 진행률/스토리텔링 메시지

- [ ] 이벤트 type별 기본 메시지 템플릿 준비(노드별 3~5개 랜덤 변형 가능)
- [ ] 이미지 진행 메시지 포맷 고정: `"증거 사진을 확보 중… ({done}/{total})"`
- [ ] progress 계산 로직 고정
  - 이미지 단계: `65 + floor(30 * done/total)`

---

## 10) 에러 처리 / 종료 처리

- [ ] 어떤 노드에서든 예외 발생 시:
  - [ ] scenario FAILED 마킹 + generationError 저장
  - [ ] `error` SSE 이벤트 발행
- [ ] emitter 종료 정책
  - [ ] `complete`/`error` 후 `emitter.complete()` (단, 동일 유저가 새 작업도 받을 수 있게 연결을 유지할지 여부 결정 필요)

---

## 11) 테스트(최소)

- [ ] `ValidateNode` 유닛 테스트(샘플 JSON 정상/비정상 케이스)
- [ ] `ImageBatchNode` 유닛 테스트(리트라이 동작/동시성 상한/진행 이벤트 카운트)
- [ ] (가능하면) 스프링 슬라이스 테스트로 SSE 이벤트 직렬화 확인
