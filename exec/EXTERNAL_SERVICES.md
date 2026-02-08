# 외부 서비스 정리

이 문서는 프로젝트에서 사용하는 **외부 서비스**(인증/AI/스토리지 등)의 가입/설정/적용 방법을 정리합니다.

## 1) Keycloak (OIDC) + Google IdP (소셜 로그인)

### 용도
- 프론트에서 로그인 버튼 클릭 시 백엔드의 `/api/auth/login`을 통해 OIDC 로그인 플로우 시작
- Keycloak에서 Google IdP로 바로 이동하도록 `kc_idp_hint=google`을 강제 적용

### 설정 위치(레포)
- Backend OAuth2 설정: `S14P11A707-backend/src/main/resources/application.yml`
- 필요 환경변수(필수):
  - `KEYCLOAK_ISSUER_URI=https://auth.bunnect.kr/realms/hongyeon`
  - `KEYCLOAK_CLIENT_ID=hongyeon-backend`

### Keycloak 쪽 필수 설정(요약)
- Realm: `hongyeon` (예시)
- Client:
  - Client ID: `hongyeon-backend`
  - Client Type: Public Client(= client secret 없음) + PKCE
  - Valid Redirect URIs:
    - 로컬: `http://localhost:8080/oauth2/code/keycloak`
    - 배포: `https://<BACKEND_DOMAIN>/oauth2/code/keycloak`
- Identity Provider:
  - Google IdP 연결(클라이언트/시크릿은 Keycloak 쪽에서 관리)

### 동작 확인
- 프론트: 로그인 클릭
- 브라우저가 `http://localhost:8080/api/auth/login` -> Keycloak -> Google -> 앱 복귀되는지 확인

## 2) SSAFY GMS (OpenAI compatible)

### 용도
- Spring AI에서 Chat Completions(OpenAI 호환)을 호출하는 용도

### 설정 위치(레포)
- Backend 설정: `S14P11A707-backend/src/main/resources/application.yml`
- 필요 환경변수:
  - `GMS_KEY=S14P12A707-f2120964-8614-41cc-8e6e-9e12448fe8fc`
  - `GMS_URL=https://gms.ssafy.io/gmsapi/api.openai.com/v1/`
  - `GMS_PATH=chat/completions`
  - `GMS_MODEL=gpt-5.2`

### 동작 확인(간단)
- 시나리오 생성(v2) 또는 AI 채팅 기능 호출 시 서버 로그에서 모델 호출 로그가 찍히는지 확인

## 3) Google Cloud Vertex AI (Gemini/Imagen)

> 중요: 본 백엔드는 v2 시나리오 생성에서 `VertexAiAccountPool`을 사용하므로, 기본 실행에 Vertex 설정이 필요합니다.

### 용도
- Gemini(텍스트) / Imagen(이미지) 호출
- 계정 풀(복수 계정) + 동시성/쿼터 제어

### 설정 위치(레포)
- Vertex Client/Pool 설정: `S14P11A707-backend/src/main/java/com/ssafy/s14p11a707/config/VertexGenAiClientConfig.java`
- 환경변수 예시(로컬):
  - `APP_VERTEX_ENABLED=true`
  - `APP_VERTEX_PROJECT_ID=gen-lang-client-0967453258`
  - `APP_VERTEX_LOCATION=global`
  - `APP_VERTEX_CREDENTIALS_URI=file:/absolute/path/to/gcp1.json`
  - (옵션) 2계정 풀:
    - `APP_VERTEX_B_PROJECT_ID=hongyeon`
    - `APP_VERTEX_B_LOCATION=global`
    - `APP_VERTEX_B_CREDENTIALS_URI=file:/absolute/path/to/gcp2.json`

### GCP 쪽 준비사항(요약)
- Google Cloud Project 생성/선택
- Vertex AI API 활성화
- Service Account 생성
- Service Account Key(JSON) 발급 후 로컬에 저장
- 위 JSON 파일 경로를 `APP_VERTEX_CREDENTIALS_URI`로 지정

### 동작 확인
- 백엔드 부팅 시 다음 로그가 출력되는지 확인:
  - `[ai] Vertex GenAI client enabled ...`

## 4) MinIO (S3 compatible object storage)

### 용도
- 썸네일/인물/단서 이미지 등 파일 업로드/서빙

### 로컬 구성
- 로컬은 `S14P11A707-backend/compose.yml`로 자동 기동
- 포트:
  - API: `http://localhost:9000`
  - Console: `http://localhost:9001`
- 환경변수(백엔드):
  - `MINIO_ENDPOINT=http://localhost:9000`
  - `MINIO_PUBLIC_ENDPOINT=http://localhost:9000`
  - `MINIO_ACCESS_KEY=minioadmin`
  - `MINIO_SECRET_KEY=ssafy1031`
  - `MINIO_BUCKET=hongyeon`

### 주의사항
- `minio-init` 서비스가 버킷이 없으면 생성하고, 익명 다운로드를 허용하도록 설정합니다.

## 5) Redis

### 용도
- 캐시/동시성 제어/진행상황 관리 등에 사용

### 로컬 구성
- 로컬은 `S14P11A707-backend/compose.yml`로 자동 기동
- 포트:
  - `127.0.0.1:16379`
- 환경변수(백엔드):
  - `REDIS_HOST=localhost`
  - `REDIS_PORT=16379`
  - `REDIS_PASSWORD=` (미사용)

