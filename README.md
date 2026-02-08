# 🕵️ Detective AI - AI 기반 범죄 수사 추리 게임

사용자가 입력한 간단한 시놉시스를 기반으로 AI가 완전한 추리 스토리를 자동 생성하는 웹 기반 방탈출 추리 게임입니다. 플레이어는 6층 건물을 탐색하며 단서를 수집하고, AI 용의자를 심문하여 범인을 찾아내는 몰입형 추리 경험을 제공합니다.

## 📋 목차

- [프로젝트 개요](#-프로젝트-개요)
- [핵심 기능](#-핵심-기능)
- [기술 스택](#-기술-스택)
- [시스템 아키텍처](#-시스템-아키텍처)
- [데이터베이스 설계](#-데이터베이스-설계)
- [시작하기](#-시작하기)
- [API 명세](#-api-명세)
- [게임 시스템](#-게임-시스템)
- [프로젝트 구조](#-프로젝트-구조)

---

## 🎯 프로젝트 개요

### 프로젝트 소개

**Detective AI**는 생성형 AI 기술을 활용한 웹 기반 추리 게임으로, 플레이어가 직접 시놉시스를 입력하면 AI가 피해자, 용의자, 단서, 전체 스토리를 자동 생성합니다. 플레이어는 2D 맵을 탐색하고 AI 용의자와 실시간으로 대화하며 범인을 찾아냅니다.

### 핵심 컨셉

- 🤖 **AI 시나리오 생성**: 짧은 시놉시스 입력만으로 피해자, 용의자(4~5명), 알리바이, 단서 자동 생성
- 💬 **인터랙티브 심문**: AI 기반 용의자와 자연어 대화로 정보 수집 (ChatMemory로 대화 기록 관리)
- 🕸️ **시각적 추리보드**: 피해자 중심으로 단서와 용의자 관계를 실로 연결하여 정리
- 🎮 **솔로 모드**: 1인 플레이, 개인 체력 100으로 진행

### 타겟 유저

- 🕵️ 추리/미스터리 장르 애호가
- 🎮 방탈출 게임을 즐기는 20~30대
- 📖 몰입형 스토리 게임을 선호하는 유저

---

## ✨ 핵심 기능

### 1. AI 시나리오 생성 (Vertex API + Spring AI)

```java
// 사용자 입력
{
  "title": "사라진 보석",
  "genre": "THRILLER",
  "suspectCount": 4,
  "synopsis": "호화로운 별장에서 보석이 사라진다..."
}

// AI 생성 결과
{
  "victim": { "name": "김보석", "profile": "...", "secret": "..." },
  "suspects": [
    {
      "name": "용의자 이름",
      "personality": "성격 특성",
      "secret": "들키면 인생이 끝나는 비밀",
      "alibi": {
        "level1_claimed": "거짓 알리바이",
        "level2_partial": "부분 진실",
        "level3_actual": "실제 행적"
      }
    }
  ],
  "clues": [ /* 최대 20개 */ ],
  "floors": [ /* 6개 층 정보 */ ]
}
```

**특징**
- 시놉시스 입력 → ChatClient로 전달 → 구조화된 JSON 응답 파싱
- 피해자, 용의자, 단서, 전체 스토리 자동 생성
- 나노바나나 API로 캐릭터 프로필 이미지 자동 생성 (누아르 풍 픽셀/일러스트)

### 2. 용의자 심문 시스템 (GMS API)

**용의자 심문 레벨 시스템**

| Level   | 조건 | 응답 유형 |
|---------|------|-----------|
| Level 1 | 단서/모순 미발견 | 거짓 알리바이 진술 |
| Level 2 | 모순 + 증거 제시 | 완전 인정 + 비밀 실토 |

**기능**
- ChatMemory로 대화 기록 관리
- 캐릭터 성격과 비밀을 컨텍스트로 주입
- 일관된 페르소나 응답 및 실시간 대화 스트리밍
- 단서 기반 심문 (`@단서명` 형식으로 단서 ID 파싱)

### 3. 2D 맵 탐색 (Phaser)

- 6층 건물, 각 층 1개 방 구조
- 방향키/WASD로 캐릭터 조작
- 엘리베이터로 층 이동
- 단서 오브젝트 스페스바로 획득 → 인벤토리 저장
- 곳곳에 등장하는 미니게임

### 4. 추리보드 시스템

**노드 유형**

| 유형 | 설명 | 배치 방식 |
|------|------|-----------|
| 피해자 | 보드 중앙 고정 | 게임 시작 시 자동 |
| 용의자 | 피해자 주변 배치 | 게임 시작 시 자동 |
| 단서 | 인벤토리에서 추가 | 수동 추가 |
| 메모 | 자유 텍스트 | 수동 추가 |
| 장소 | 장소 목록에서 추가 | 수동 추가 |

**연결선 유형**

- 🔴 **확정 (붉은 실)**: 최종 추리 결과 (제출용)
- 🟡 **의심 (노란 실)**: 추측/메모용

**필수 붉은 실 연결 구조**
```
피해자 ─── 용의자(범인) ─── 범행도구(단서) ─── 장소
                │
                ├── 범행동기 (메모)
                └── 사인 (메모)
```

### 5. 채점 시스템

**채점 항목**

| 항목 | 채점 방식 | 비고 |
|------|-----------|------|
| 범인 | ID 완전 일치 | 오답 시 재시도 가능 (최대 3회) |
| 범행 도구 | ID 완전 일치 | 단서 ID 매칭 |
| 범행 장소 | ID 완전 일치 | 층/방 ID 매칭 |
| 범행 동기 | 임베딩 유사도 (pgvector) | 자유 텍스트 입력 |
| 사인 | 임베딩 유사도 (pgvector) | 자유 텍스트 입력 |

**랭크 기준**
- S / A / B / C / F (상세 점수 배점 조정 필요)

### 6. 내 책장 & 랭킹

**기록 유형**

| 유형 | 설명 | 가능 액션 |
|------|------|-----------|
| 완료한 기록 | 정답 성공 | 재플레이 (랭킹 미반영) |
| 미완의 기록 | 중도 탈주 | 이어하기 (7일간 세션 유지) |
| 미제사건 기록 | 정답 실패 | 재플레이 (처음부터) |

**랭킹 시스템**
- 시나리오별 랭킹 (top 3)
- 종합 랭킹 (top 10)
- 최초 클리어 기록만 반영

---

## 🛠 기술 스택

| 영역 | 기술 | 비고 |
|------|------|------|
| **Backend** | Spring Boot 3.x, Java 21 | |
| **Frontend** | React | |
| **2D Game Engine** | Phaser | 맵 탐색 구현 |
| **Database** | PostgreSQL 16+ | pgvector로 벡터 검색 |
| **AI/LLM** | Spring AI + Vertex API | 시나리오 생성, 용의자 심문 |
| **Image Generation** | 나노바나나 API | 캐릭터 프로필 생성 |
| **Authentication** | Google OAuth 2.0 | |
| **Scheduler** | Spring Scheduler | 세션 만료 처리 |

---

## 🏗 시스템 아키텍처

### 전체 구조

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend (React)                    │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ 시나리오  │  │  게임    │  │ 추리보드  │  │ 내책장   │   │
│  │  생성    │  │  플레이  │  │          │  │          │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Backend (Spring Boot)                    │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │  Auth    │  │ Scenario │  │   Game   │  │  Review  │   │
│  │ Service  │  │ Service  │  │ Service  │  │ Service  │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │   AI     │  │  Chat    │  │ Inquiry  │  │ Ranking  │   │
│  │ Service  │  │ Service  │  │ Service  │  │ Service  │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
         ┌──────────────────┼──────────────────┐
         ▼                  ▼                  ▼
┌───────────────┐  ┌───────────────┐  ┌───────────────┐
│  PostgreSQL   │  │  Vertex API   │  │ 나노바나나   │
│   + pgvector  │  │  (Spring AI)  │  │     API       │
└───────────────┘  └───────────────┘  └───────────────┘
```

### AI 통합 구조

```
┌─────────────────────────────────────────────────────────┐
│                    Spring AI Layer                      │
│  ┌──────────────────┐    ┌──────────────────┐          │
│  │  Vertex API      │    │   GMS API        │          │
│  │  (시나리오 생성)  │    │  (용의자 심문)   │          │
│  └──────────────────┘    └──────────────────┘          │
│           │                        │                    │
│           ▼                        ▼                    │
│  ┌──────────────────┐    ┌──────────────────┐          │
│  │   ChatClient     │    │   ChatMemory     │          │
│  │   (구조화된 JSON) │    │  (대화 기록 관리) │          │
│  └──────────────────┘    └──────────────────┘          │
└─────────────────────────────────────────────────────────┘
```

---

## 🗄 데이터베이스 설계

### 주요 테이블 (14개)

```sql
-- 사용자
users (id, email, nickname, oauth_provider, created_at)

-- 시나리오
scenarios (id, creator_id, title, genre, synopsis, difficulty_level,
           victim_data, suspect_data, clue_data, floor_data, story_metadata,
           thumbnail_url, created_at)

-- 게임 세션
game_sessions (id, user_id, scenario_id, current_floor, health,
               status, is_first_play, created_at, expires_at)

-- 용의자
suspects (id, scenario_id, name, profile, relationship, personality,
          secret, defense_strategy, alibi_data, image_url)

-- 단서
clues (id, scenario_id, name, description, type, floor,
       related_suspect_id, location_x, location_y)

-- 추리보드 노드/연결
board_nodes (id, session_id, type, content, x, y)
board_connections (id, session_id, from_node_id, to_node_id, connection_type)

-- 채팅 로그
chat_logs (id, session_id, suspect_id, role, content, created_at)

-- 수사보고서
game_results (id, session_id, rank, score, suspect_answer_id,
              motive_clue_id, cause_clue_id, weapon_clue_id,
              location_floor_id, ai_evaluation, created_at)
```

### pgvector 활용

```sql
-- 범행 동기/사인 유사도 검색
CREATE TABLE clues (
  id SERIAL PRIMARY KEY,
  motive_embedding vector(1536),  -- OpenAI embedding
  cause_embedding vector(1536)
);

-- 코사인 유사도 검색
SELECT 1 - (motive_embedding <=> $1) AS similarity
FROM clues
ORDER BY similarity DESC
LIMIT 5;
```

---

## 🚀 시작하기

### 선행 조건

- Java 21+
- Node.js 18+
- PostgreSQL 16+ with pgvector extension
- Google OAuth credentials
- Vertex API / GMS API key
- 나노바나나 API key

### 설치

```bash
# 백엔드
git clone https://github.com/your-org/detective-ai.git
cd detective-ai/backend
./gradlew bootRun

# 프론트엔드
cd frontend
npm install
npm start
```

### 환경 설정

```properties
# application.yml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/detective_ai
    username: ${DB_USERNAME}
    password: ${DB_PASSWORD}
  ai:
    vertex:
      api-key: ${VERTEX_API_KEY}
      project-id: ${PROJECT_ID}
    openai:
      api-key: ${OPENAI_API_KEY}

oauth:
  google:
    client-id: ${GOOGLE_CLIENT_ID}
    client-secret: ${GOOGLE_CLIENT_SECRET}

image:
  nanovana:
    api-key: ${NANOVANA_API_KEY}
```

---

## 📡 API 명세

### 시나리오 관련

| 메서드 | 엔드포인트 | 설명 |
|--------|-----------|------|
| POST | /api/scenarios | 시나리오 생성 |
| GET | /api/scenarios | 시나리오 목록 조회 |
| GET | /api/scenarios/{id} | 시나리오 상세 조회 |
| DELETE | /api/scenarios/{id} | 시나리오 삭제 |

### 게임 세션 관련

| 메서드 | 엔드포인트 | 설명 |
|--------|-----------|------|
| POST | /api/sessions | 게임 세션 생성 |
| GET | /api/sessions/{id} | 세션 정보 조회 |
| PUT | /api/sessions/{id}/floor | 층 이동 |
| PUT | /api/sessions/{id}/health | 체력 업데이트 |

### 용의자 심문 관련

| 메서드 | 엔드포인트 | 설명 |
|--------|-----------|------|
| POST | /api/sessions/{id}/interrogate | 용의자 심문 |
| GET | /api/sessions/{id}/chats | 채팅 기록 조회 |

### 추리보드 관련

| 메서드 | 엔드포인트 | 설명 |
|--------|-----------|------|
| POST | /api/sessions/{id}/board/nodes | 노드 생성 |
| POST | /api/sessions/{id}/board/connections | 연결 생성 |
| GET | /api/sessions/{id}/board | 추리보드 조회 |

### 제출/채점 관련

| 메서드 | 엔드포인트 | 설명 |
|--------|-----------|------|
| POST | /api/sessions/{id}/submit | 최종 제출 |
| GET | /api/sessions/{id}/result | 수사보고서 조회 |


---

## 🎮 게임 시스템

### 체력 시스템

| 행동 | 체력 소모 | 비고 |
|------|-----------|------|
| 용의자 심문 | -5 | AI 채팅 1회당 |
| 체력 0 도달 | - | 채팅 이용 x |

### 게임 진행 흐름

```
1. 시나리오 선택/생성
   ↓
2. 게임 세션 생성 및 입장
   ↓
3. 오프닝 멘트 + 피해자 정보 공개
   ↓
4. 게임 플레이
   ├─ 2D 맵 탐색 (단서 수집)
   ├─ 용의자 심문 (AI 채팅)
   └─ 추리보드 정리
   ↓
5. 최종 제출
   ├─ 성공 → 에필로그 + 범인 독백 + 수사보고서
   └─ 실패 → 재시도 (최대 3회) 또는 게임 오버
```

### 게임 종료 조건

| 조건 | 결과 | 내 책장 기록 |
|------|------|--------------|
| 정답 제출 성공 | 에필로그 + 범인 독백 + 수사보고서 | 완료한 기록 |
| 정답 제출 실패 | 범인 ???의 독백 | 미제사건 기록 |
| 중도 탈주 | 세션 유지 (7일간) | 미완의 기록 |

---

## 📁 프로젝트 구조

```
detective-ai/
├── backend/
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/detectiveai/
│   │   │   │   ├── auth/           # 인증 (Google OAuth)
│   │   │   │   ├── scenario/       # 시나리오 관리
│   │   │   │   ├── game/           # 게임 세션 관리
│   │   │   │   ├── ai/             # AI 서비스 (Vertex, GMS)
│   │   │   │   ├── chat/           # 용의자 심문
│   │   │   │   ├── board/          # 추리보드
│   │   │   │   ├── inquiry/        # 제출/채점
│   │   │   │   ├── library/        # 내 책장
│   │   │   │   ├── ranking/        # 랭킹
│   │   │   │   └── review/         # 리뷰
│   │   │   └── resources/
│   │   │       ├── application.yml
│   │   │       └── sql/
│   │   └── test/
│   └── build.gradle
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ScenarioList/
│   │   │   ├── ScenarioCreate/
│   │   │   ├── GamePlay/
│   │   │   │   ├── PhaserGame/    # 2D 맵 탐색
│   │   │   │   ├── Chat/          # 용의자 심문
│   │   │   │   └── Board/         # 추리보드
│   │   │   └── Library/
│   │   ├── pages/
│   │   └── api/
│   └── package.json
│
└── docs/
    ├── api.md
    ├── database.md
    └── planning.md
```

---

## 👥 팀

- **팀명**: 지금 잠이 와?
- **프로젝트 기간**: 2025.01 ~ 2025.02


---

**Built with ❤️ using Spring AI & Phaser**
