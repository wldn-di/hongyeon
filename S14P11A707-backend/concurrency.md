제공해주신 내용을 바탕으로 가독성을 높여 정리한 **기술 분석 보고서(Markdown)**입니다. 팀 내 공유나 위키(Wiki), 이슈 트래커 등에 바로 붙여넣어 사용하실 수 있습니다.

---

# 🚀 동시 채팅(심문) 성능 저하 및 장애 원인 분석 보고서

## 1. 분석 대상 및 범위

* **대상 API:** `POST /api/sessions/{sessionId}/suspects/{suspectId}/chat`
* **핵심 구현체:** `GameSessionServiceImpl.chatWithSuspect()`
* 파일 경로: `src/main/java/com/ssafy/s14p11a707/game/service/GameSessionServiceImpl.java`



---

## 2. 핵심 결론 (요약)

> **"Vertex AI의 쿼터 제한만이 유일한 원인이 아닙니다."**

동시 채팅 시 발생하는 느려짐/터짐 현상은 대개 다음 두 가지 원인이 복합적으로 작용합니다.

1. **외부 요인:** AI 모델(GenAI/Vertex/Gemini)의 호출 지연 및 쿼터 제한으로 인한 응답 대기/429 에러.
2. **내부 요인:** **"긴 DB 트랜잭션 + 요청 스레드 블로킹"** 구조로 인한 DB 커넥션 고갈 및 스레드 잠식.

즉, **Vertex 쿼터를 증설하더라도 내부 구조(2번)를 개선하지 않으면 "동시 5명 접속 시 장애"는 계속 발생**할 수 있습니다.

---

## 3. 상세 코드 분석 (병목 지점)

### ① 요청 스레드 블로킹 (Blocking I/O)

* **현상:** `chatWithSuspect()` 내부에서 `chatClient...blockLast()`를 호출합니다.
* **문제점:** AI 응답이 올 때까지(수 초~수십 초) **Tomcat의 HTTP 요청 처리 스레드가 점유**된 상태로 대기합니다.
* **결과:** 동시 사용자가 조금만 늘어도 가용 스레드가 고갈되어 전체 서버 응답성이 급격히 저하됩니다.

### ② 과도한 트랜잭션 범위 (Long Transaction)

* **현상:** `chatWithSuspect()` 메서드 전체에 `@Transactional`이 걸려 있습니다.
* **문제점:**
1. DB 조회 (세션/용의자/단서)
2. **AI 호출 (외부 통신, 긴 대기 시간)** 👈 *여기가 문제*
3. DB 저장


* 위 과정 내내 DB 커넥션(Connection)을 물고 있습니다.


* **결과:** `HikariPool` 커넥션이 AI 응답 시간만큼 낭비되며, 빠르게 고갈됩니다. (다른 API까지 연쇄 장애 유발)

### ③ 비효율적인 대화 이력 로딩

* **현상:** `CustomChatMemoryRepository.findByConversationId()` 호출 시 `chat_messages` 테이블에서 **전체 이력**을 조회합니다.
* **문제점:** `advisor` 설정에서 `maxMessages`를 제한했더라도, DB 레벨에서는 전체를 다 읽어온 후 메모리에서 자릅니다.
* **결과:** 대화가 길어질수록 DB I/O 부하 및 직렬화 비용이 증가합니다.

### ④ 무거운 프롬프트 구성 비용

* **현상:** `buildScenarioContext()`가 매 요청마다 방대한 시나리오 정보를 DB에서 조회하여 긴 문자열로 조립합니다.
* **결과:** 프롬프트가 길어짐 → AI 처리 시간 증가 → 토큰 비용 증가 → 장애 가능성 상승.

---

## 4. Vertex AI와의 상관관계

### Vertex가 "직접 원인"인 경우

* **증상:** `429 Too Many Requests`, `RESOURCE_EXHAUSTED`, `Quota exceeded` 에러 발생.
* **원인:** 프로젝트/리전의 RPM(분당 요청 수) 또는 TPM(분당 토큰 수) 한계 도달.

### Vertex가 "직접 원인이 아닌" 경우 (내부 문제)

아래 문제들은 Vertex 쿼터를 늘려도 해결되지 않습니다.

* **스레드 블로킹:** `blockLast()` 사용.
* **DB 커넥션 고갈:** 트랜잭션 내에서 AI 호출 수행.
* **대화 이력 전체 조회:** 쿼리 최적화 부재.
* **백프레셔 부재:** 동시 요청 제어 장치 없음.

---

## 5. 증상별 진단 체크리스트

| 구분 | 주요 증상 및 로그 메시지 | 의심 영역 |
| --- | --- | --- |
| **외부 요인** | `429`, `RESOURCE_EXHAUSTED`, `quota`, `rate limit` | **Vertex/Gemini 쿼터 부족**<br>

<br>(특정 트래픽 급증 시 발생, 재시도 시 성공) |
| **내부 요인** | `HikariPool... Connection is not available`<br>

<br>`request timed out`<br>

<br>전체 API 속도 저하 | **DB 트랜잭션 및 스레드 고갈**<br>

<br>(소수 인원에서도 지속적 발생 가능) |

---

## 6. 개선 로드맵 (우선순위)

### 🔥 P0. 핵심 구조 개선 (즉시 적용 필요)

1. **AI 호출 트랜잭션 분리 (가장 중요)**
* 기존: `[TX 시작] -> DB 조회 -> AI 호출(대기) -> DB 저장 -> [TX 종료]`
* **변경:** `[TX] DB 조회` -> `[No-TX] AI 호출` -> `[TX] 결과 저장`
* *효과: DB 커넥션 점유 시간을 수십 초에서 수 밀리초(ms) 단위로 단축.*


2. **대화 이력 조회 최적화**
* 전체 조회가 아닌 **최근 N개**만 가져오도록 쿼리 변경 (`ORDER BY created_at DESC LIMIT N`).



### ⚡ P1. 안정성 확보

1. **동시 요청 제한 (Rate Limiting/Locking)**
* 동일 세션/사용자의 중복 요청 방지 (세마포어, Redis Lock 등 활용).
* *효과: "따닥" 클릭으로 인한 불필요한 리소스 낭비 방지.*


2. **프롬프트 컨텍스트 캐싱**
* 변하지 않는 시나리오 정보는 최초 1회 로딩 후 Redis나 메모리에 캐싱하여 재사용.



### 🛡️ P2. 장애 방어 (Resilience)

1. **Circuit Breaker 도입**
* 외부 AI 응답이 일정 시간 이상 지연되면 즉시 에러를 반환하거나 기본 응답 처리하여 서버 자원 보호.

인메모리 메시지큐