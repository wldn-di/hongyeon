# DB 덤프 정책

## 결론
- 본 제출물에서는 **DB 덤프(sql) 최신본을 제공하지 않습니다.**

## 사유
- 로컬 실행은 JPA DDL(`JPA_DDL_AUTO`) + `schema.sql(pgvector extension)` 조합으로 스키마를 재현할 수 있습니다.
- 샘플 데이터/운영 데이터는 민감할 수 있어, 덤프를 기본 산출물로 포함하지 않는 것으로 정리했습니다.

## 대체 재현 방법(로컬)

1) Backend `.env`에서 아래를 설정
- `JPA_DDL_AUTO=update` (또는 환경에 맞게 `create-drop`)
- `SQL_INIT_MODE=always` (pgvector extension 적용)

2) Backend 실행
- `cd S14P11A707-backend`
- `./gradlew bootRun`

3) DB 접속 확인
- Host: `127.0.0.1`
- Port: `15432` (로컬 compose 기준)
- DB: `hongyeon`
- User/Password: `.env` 기준

## 덤프가 꼭 필요한 경우(선택)

프로젝트 요구사항/채점 기준에서 덤프가 필요하면, 아래처럼 생성할 수 있습니다.

```bash
cd S14P11A707-backend
PGPASSWORD="$DB_PASSWORD" pg_dump \\
  -h 127.0.0.1 -p 15432 -U "$DB_USERNAME" \\
  --format=plain --no-owner --no-privileges \\
  --dbname=hongyeon \\
  > ../exec/hongyeon_dump.sql
```

> 주의: 덤프 파일에는 데이터가 포함될 수 있으므로 외부 공유에 유의하세요.

