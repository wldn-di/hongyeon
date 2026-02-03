# 프론트 배포 체크리스트 (FE용)

## 1) 필수 빌드 환경변수
프론트는 API 요청 Base URL로 `VITE_API_BASE_URL`을 사용합니다.  
배포 빌드 시 아래 값을 **반드시 주입**하세요(도메인/경로 변경 시 값만 바꾸면 됨).

- `VITE_API_BASE_URL=https://hongyeon.cloud-ip.cc`

## 2) 로컬에서 프로덕션 빌드 확인
- `VITE_API_BASE_URL=https://hongyeon.cloud-ip.cc npm ci`
- `VITE_API_BASE_URL=https://hongyeon.cloud-ip.cc npm run build`

## 3) 참고 (nginx.conf)
`nginx.conf`는 **프론트 컨테이너 내부 nginx**가 SPA 라우팅(`try_files … /index.html`)을 처리하기 위한 설정입니다.  
Nginx Proxy Manager(NPM)는 별도 컨테이너로, 외부 요청을 이 컨테이너로 전달(리버스 프록시)만 합니다.
