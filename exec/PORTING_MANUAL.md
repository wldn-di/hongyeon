# 포팅 매뉴얼 (로컬 실행 중심)

> 주의: 본 문서는 **로컬에서 바로 실행**하기 위한 가이드입니다.  
> 특히 `S14P11A707-backend/.env`에는 키/비밀번호 등 민감정보가 들어가며, 이 레포의 `.gitignore`에서 **`.env` 및 `.env.*`는 커밋되지 않도록 무시**하도록 설정되어 있습니다.

## 1. 프로젝트 구성

- Backend: `S14P11A707-backend` (Spring Boot)
- Frontend: `S14P11A707-frontend` (Vite + React)
- 로컬 인프라(DB/Redis/MinIO): **Spring Boot Docker Compose Integration**으로 `S14P11A707-backend/compose.yml`을 자동 기동

## 2. 실행 환경/버전

### 2.1 Backend

- JVM: Java 21 (`S14P11A707-backend/build.gradle` toolchain)
- Framework/WAS: Spring Boot `3.5.9` + Embedded Tomcat(기본 내장 WAS)
- 빌드 도구: Gradle Wrapper `8.14.3` (`S14P11A707-backend/gradle/wrapper/gradle-wrapper.properties`)
- DB: PostgreSQL 16 + pgvector (`pgvector/pgvector:pg16`, `schema.sql`)
- Cache/Queue: Redis 7 (`redis:7-alpine`)
- Object Storage: MinIO (`minio/minio`)
- 인증: Keycloak(OIDC) + PKCE + Google IdP (`spring.security.oauth2.client.*`)
- IDE(권장): IntelliJ IDEA 2024.x 이상

### 2.2 Frontend

- Node.js: 20.x 권장 (`S14P11A707-frontend/Dockerfile` 기준)
- Vite: 5.x (`S14P11A707-frontend/package.json`)
- React: 18.x (`S14P11A707-frontend/package.json`)
- 웹서버(배포): Nginx `1.27-alpine` (`S14P11A707-frontend/Dockerfile`)
- IDE(권장): VSCode 최신

## 3. 로컬 실행 (Git clone 이후)

### 3.1 Backend `.env` 준비 (필수)

Backend는 `application.yml`에서 `${DB_URL}` 같은 값을 **필수로 참조**합니다.  
또한 Docker Compose도 `${DB_USERNAME}` 같은 변수를 참조하므로, `S14P11A707-backend/.env`를 준비하는 것을 기준으로 합니다.

1) `S14P11A707-backend/.env` 생성 (gitignore로 커밋 제외)

아래는 로컬 실행 기준 예시입니다.

```dotenv
# -----------------------------
# Keycloak (OIDC)
# -----------------------------
KEYCLOAK_ISSUER_URI=https://auth.bunnect.kr/realms/hongyeon
KEYCLOAK_CLIENT_ID=hongyeon-backend

# -----------------------------
# Database (PostgreSQL) - local via compose.yml port 15432
# -----------------------------
DB_URL=jdbc:postgresql://localhost:15432/hongyeon
DB_USERNAME=postgre
DB_PASSWORD=ssafy1031
DB_DRIVER=org.postgresql.Driver
JPA_DDL_AUTO=update

# schema.sql 실행 여부: always / never / embedded
SQL_INIT_MODE=always

# -----------------------------
# Session Cookie
# -----------------------------
SESSION_COOKIE_SECURE=false
SESSION_COOKIE_SAME_SITE=lax

# -----------------------------
# Auth Redirect (optional)
# -----------------------------
APP_AUTH_DEFAULT_REDIRECT_URL=/
APP_AUTH_ALLOWED_REDIRECT_ORIGINS=http://localhost:5173,http://i14a707.p.ssafy.io

# -----------------------------
# Redis - local via compose.yml port 16379
# -----------------------------
REDIS_HOST=localhost
REDIS_PORT=16379
REDIS_PASSWORD=

# -----------------------------
# MinIO - local via compose.yml port 9000/9001
# -----------------------------
MINIO_ENDPOINT=http://localhost:9000
MINIO_PUBLIC_ENDPOINT=http://localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=ssafy1031
MINIO_BUCKET=hongyeon

# -----------------------------
# Vertex AI (GenAI/Imagen) - REQUIRED for scenario v2
# -----------------------------
APP_VERTEX_ENABLED=true
APP_VERTEX_PROJECT_ID=gen-lang-client-0967453258
APP_VERTEX_LOCATION=global
# 로컬 PC에 있는 서비스 계정 JSON 경로로 수정 필요
APP_VERTEX_CREDENTIALS_URI=file:/home/ubuntu/.gcp/gcp1.json
APP_VERTEX_B_PROJECT_ID=hongyeon
APP_VERTEX_B_LOCATION=global
# 로컬 PC에 있는 서비스 계정 JSON 경로로 수정 필요
APP_VERTEX_B_CREDENTIALS_URI=file:/home/ubuntu/.gcp/gcp2.json
SPRING_AI_GOOGLE_GENAI_CHAT_OPTIONS_MODEL=gemini-3-pro-preview
APP_VERTEX_MODEL=gemini-3-pro-preview
APP_VERTEX_INCLUDE_THOUGHTS=false

# -----------------------------
# Scenario v2 Image (Imagen)
# -----------------------------
APP_SCENARIO_V2_IMAGE_MODEL=imagen-4.0-fast-generate-001
APP_SCENARIO_V2_IMAGE_MAX_REQUESTS_PER_MINUTE=20

# -----------------------------
# GMS (OpenAI-compatible)
# -----------------------------
GMS_KEY=S14P12A707-f2120964-8614-41cc-8e6e-9e12448fe8fc
GMS_URL=https://gms.ssafy.io/gmsapi/api.openai.com/v1/
GMS_PATH=chat/completions
GMS_MODEL=gpt-5.2
```

### 3.2 Backend 실행

Spring Boot는 실행 시 `S14P11A707-backend/compose.yml`을 감지하여 DB/Redis/MinIO를 자동으로 띄웁니다.

1) Docker Desktop 실행(필수)
2) Backend 실행 (둘 중 택1)

- CLI:
  - `cd S14P11A707-backend`
  - `./gradlew bootRun`
- IDE(IntelliJ):
  - Main class: `com.ssafy.s14p11a707.S14P11A707Application`
  - Working directory를 `S14P11A707-backend`로 설정 권장(그래야 `compose.yml` 자동 감지)

3) 확인
- `http://localhost:8080/actuator/health`
- `http://localhost:8080/swagger-ui/index.html`

> 참고: `S14P11A707-backend/src/main/resources/application.yml`에 `spring.docker.compose.lifecycle-management: start-only`를 설정했기 때문에,
> 앱을 꺼도 컨테이너는 유지됩니다. (내릴 때는 아래 “컨테이너 정리” 참고)

### 3.3 Frontend 실행

1) `S14P11A707-frontend/.env` 생성 (gitignore로 커밋 제외)

```dotenv
VITE_API_BASE_URL=http://localhost:8080
```

2) 실행
- `cd S14P11A707-frontend`
- `npm ci`
- `npm run dev`

3) 접속
- `http://localhost:5173`

## 4. 빌드 시 사용 환경변수(상세)

### 4.1 Backend (.env 기반)

Backend는 아래 파일/설정에서 값을 읽습니다.

- `.env` (권장, 로컬)
- 환경변수(IDE Run Config / shell export)
- `S14P11A707-backend/src/main/resources/application.yml`

주요 변수:

- 인증(Keycloak): `KEYCLOAK_ISSUER_URI`, `KEYCLOAK_CLIENT_ID`
- DB: `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`, `DB_DRIVER`, `JPA_DDL_AUTO`, `SQL_INIT_MODE`
- Redis: `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`
- MinIO: `MINIO_ENDPOINT`, `MINIO_PUBLIC_ENDPOINT`, `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY`, `MINIO_BUCKET`
- AI:
  - Vertex: `APP_VERTEX_*`
  - GMS: `GMS_*`

### 4.2 Frontend

- 로컬 개발: `VITE_API_BASE_URL`
- 도커 이미지 빌드: `S14P11A707-frontend/Dockerfile`의 `ARG VITE_API_BASE_URL`로 build-time bake

## 5. 배포 시 특이사항(요약)

- CI/CD는 `/.gitlab-ci.yml`에 정의되어 있습니다.
  - 프론트: Dockerfile로 정적 빌드 후 nginx 이미지 생성
  - 백: `./gradlew bootBuildImage`로 OCI 이미지 생성
  - 원격 서버에 `docker save | ssh ... docker load` 방식으로 이미지 전달 후 compose 재기동
- 서버(배포) compose는 레포의 `infra/docker-compose.yml`을 사용합니다.
  - 배포용 backend 컨테이너에는 `SPRING_DOCKER_COMPOSE_ENABLED=false`를 주입하여, 컨테이너 내부에서 compose가 다시 뜨지 않게 막습니다.

## 6. DB/계정/프로퍼티 정의 파일 목록

로컬 실행 및 ERD/DB 접속 정보 확인에 관련된 주요 파일:

- `S14P11A707-backend/src/main/resources/application.yml` (Spring 설정)
- `S14P11A707-backend/src/main/resources/schema.sql` (pgvector extension)
- `S14P11A707-backend/.env.example` (환경변수 템플릿)
- `S14P11A707-backend/.env` (로컬용, 커밋 제외)
- `S14P11A707-backend/compose.yml` (로컬 인프라 자동 기동용)
- `infra/docker-compose.yml` (배포/서버용)
- `S14P11A707-frontend/.env.example` (프론트 환경변수 템플릿)
- `S14P11A707-frontend/vite.config.js` (개발 프록시)
- `S14P11A707-frontend/Dockerfile` (배포 이미지 빌드 설정)
- `.gitlab-ci.yml` (배포 파이프라인)

## 7. 컨테이너 정리(로컬)

Backend 실행을 끄더라도 컨테이너는 유지됩니다. 필요하면 아래로 정리합니다.

```bash
cd S14P11A707-backend
docker compose -f compose.yml down
```

데이터까지 초기화(볼륨 삭제):

```bash
cd S14P11A707-backend
docker compose -f compose.yml down -v
```

