# 연주 평가 프로그램 — API 명세서

**문서 버전:** 1.0  
**작성일:** 2026-02-16  
**관련 문서:** [요구사항문서.md](./요구사항문서.md), [화면설계서.md](./화면설계서.md)

---

## 1. 개요

### 1.1 기본 정보

| 항목 | 내용 |
|------|------|
| 베이스 URL | `https://api.example.com/v1` (실서비스 시 교체) / 개발: `http://localhost:3000/api/v1` |
| 인코딩 | UTF-8 |
| 데이터 형식 | JSON (요청/응답 본문) |
| 인증 | API 키는 세션/쿠키 또는 요청 헤더로 전달 (상세는 기술설계서 참조) |

### 1.2 공통 규칙

- **요청**: `Content-Type: application/json` (본문이 있는 경우). 파일 업로드는 `multipart/form-data`.
- **응답**: 성공 시 `2xx`, 클라이언트 오류 `4xx`, 서버 오류 `5xx`.
- **에러 응답 본문**: 아래 "5. 에러 응답" 형식 통일.

---

## 2. API 목록 요약

| 메서드 | 경로 | 설명 |
|--------|------|------|
| POST | `/api/v1/settings/api-key` | Gemini API 키 저장/갱신 |
| GET | `/api/v1/settings/api-key` | API 키 등록 여부 확인 (키 값은 반환하지 않음) |
| POST | `/api/v1/upload/score` | 악보 파일 업로드 |
| POST | `/api/v1/validate/youtube` | YouTube URL 검증 |
| POST | `/api/v1/upload/performance` | 본인 연주 동영상 **파일** 업로드 (YouTube URL 사용 시에는 호출 불필요) |
| POST | `/api/v1/evaluate` | 평가 작업 제출 — 본인 연주는 **YouTube URL 또는 업로드한 파일** 중 하나로 전달. 완료 시 **이력에 저장** |
| GET | `/api/v1/evaluate/:jobId` | 평가 작업 상태/결과 조회 (비동기 시) |
| GET | `/api/v1/history` | 평가 이력 목록 조회 (세션별, 최신순) |
| GET | `/api/v1/history/:id` | 평가 이력 한 건 상세 조회 (저장된 결과 전체) |
| DELETE | `/api/v1/history/:id` | 평가 이력 한 건 삭제 |

---

## 3. 엔드포인트 상세

### 3.1 API 키 설정

#### 3.1.1 API 키 저장

사용자가 입력한 Gemini API 키를 서버에 암호화 저장한다. 세션 또는 클라이언트 식별자와 매핑한다.

**요청**

```
POST /api/v1/settings/api-key
Content-Type: application/json
```

**Request Body**

```json
{
  "apiKey": "AIza..."
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| apiKey | string | O | Google AI Studio 등에서 발급한 Gemini API 키 |

**Response — 200 OK**

```json
{
  "ok": true,
  "message": "API 키가 저장되었습니다."
}
```

**Response — 400 Bad Request** (형식 오류 등)

```json
{
  "ok": false,
  "error": {
    "code": "INVALID_API_KEY",
    "message": "API 키 형식이 올바르지 않습니다."
  }
}
```

---

#### 3.1.2 API 키 등록 여부 확인

평가 시작 전에 키가 있는지 확인할 때 사용. 키 값은 절대 반환하지 않는다.

**요청**

```
GET /api/v1/settings/api-key
```

**Response — 200 OK**

```json
{
  "ok": true,
  "hasApiKey": true
}
```

`hasApiKey: false` 이면 설정 화면으로 유도.

---

### 3.2 악보 업로드

#### POST /api/v1/upload/score

악보 파일(PDF 또는 이미지)을 업로드하고, 서버에서 보관할 식별자와 메타정보를 반환한다.

**요청**

```
POST /api/v1/upload/score
Content-Type: multipart/form-data
```

| 파트명 | 타입 | 필수 | 설명 |
|--------|------|------|------|
| file | file | O | 악보 파일. PDF, PNG, JPG, JPEG, WEBP 등 |

**제한**

- 파일 크기: 최대 20MB
- 허용 MIME: `application/pdf`, `image/png`, `image/jpeg`, `image/webp`

**Response — 200 OK**

```json
{
  "ok": true,
  "data": {
    "scoreId": "sc_abc123def456",
    "fileName": "sonata.pdf",
    "fileSize": 1048576,
    "pageCount": 3,
    "mimeType": "application/pdf"
  }
}
```

| 필드 | 타입 | 설명 |
|------|------|------|
| scoreId | string | 이후 평가 요청 시 사용할 식별자 |
| fileName | string | 원본 파일명 |
| fileSize | number | 바이트 단위 |
| pageCount | number | PDF인 경우 페이지 수, 이미지는 1 (선택 구현) |
| mimeType | string | 서버가 인식한 MIME 타입 |

**Response — 400** (형식/용량 오류)

```json
{
  "ok": false,
  "error": {
    "code": "INVALID_SCORE_FILE",
    "message": "지원하지 않는 파일 형식이거나 20MB를 초과합니다."
  }
}
```

---

### 3.3 YouTube URL 검증

#### POST /api/v1/validate/youtube

YouTube URL이 유효하고(공개 등) 접근 가능한지 검증한다. 참조 연주/본인 연주 모두 동일 API 사용 가능.

**요청**

```
POST /api/v1/validate/youtube
Content-Type: application/json
```

**Request Body**

```json
{
  "url": "https://www.youtube.com/watch?v=xxxxx"
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| url | string | O | YouTube 동영상 URL (watch, youtu.be 등) |

**Response — 200 OK (유효)**

```json
{
  "ok": true,
  "data": {
    "valid": true,
    "videoId": "xxxxx",
    "title": "연주 제목 (가능한 경우)",
    "durationSeconds": 300
  }
}
```

**Response — 200 OK (무효)**

```json
{
  "ok": true,
  "data": {
    "valid": false,
    "reason": "비공개 또는 삭제된 영상입니다."
  }
}
```

**Response — 400** (URL 형식 오류)

```json
{
  "ok": false,
  "error": {
    "code": "INVALID_YOUTUBE_URL",
    "message": "YouTube URL 형식이 올바르지 않습니다."
  }
}
```

---

### 3.4 본인 연주 동영상 업로드 (파일 방식)

#### POST /api/v1/upload/performance

본인 연주를 **동영상 파일**로 제출할 때 사용한다. **YouTube URL로 제출할 경우에는 이 API를 호출하지 않고**, 평가 요청(3.5)에서 `performance.type: "youtube"`, `performance.youtubeUrl`만 전달하면 된다.  
파일 업로드 시 대용량이므로 청크 업로드 또는 진행률 응답은 구현 시 선택.

**요청**

```
POST /api/v1/upload/performance
Content-Type: multipart/form-data
```

| 파트명 | 타입 | 필수 | 설명 |
|--------|------|------|------|
| file | file | O | 동영상 파일 (MP4, MOV, WEBM 등) |

**제한**

- 파일 크기: 최대 500MB (설정 가능)
- 허용 MIME: `video/mp4`, `video/quicktime`, `video/webm`

**Response — 200 OK**

```json
{
  "ok": true,
  "data": {
    "performanceId": "perf_xyz789",
    "fileName": "my_recording.mp4",
    "fileSize": 52428800,
    "mimeType": "video/mp4",
    "durationSeconds": 180
  }
}
```

| 필드 | 타입 | 설명 |
|------|------|------|
| performanceId | string | 평가 요청 시 사용할 식별자 |
| durationSeconds | number | 재생 시간(초). 메타데이터에서 추출, 선택 구현 |

**Response — 400**

```json
{
  "ok": false,
  "error": {
    "code": "INVALID_VIDEO_FILE",
    "message": "지원하지 않는 동영상 형식이거나 500MB를 초과합니다."
  }
}
```

---

### 3.5 평가 실행

#### POST /api/v1/evaluate

악보·참조 연주·본인 연주 정보를 받아 Gemini로 평가를 요청한다.  
**본인 연주**는 **YouTube URL**(`performance.type: "youtube"`) 또는 **업로드한 동영상 파일**(`performance.type: "upload"`, `performanceId`) 중 **하나만** 넣으면 된다.  
구현 방식에 따라 **동기**(응답 대기 후 결과 반환) 또는 **비동기**(jobId 반환 후 폴링) 중 선택.

**요청**

```
POST /api/v1/evaluate
Content-Type: application/json
```

**Request Body (본인 연주 = 파일 업로드)**

```json
{
  "scoreId": "sc_abc123def456",
  "referenceYoutubeUrl": "https://www.youtube.com/watch?v=ref123",
  "performance": {
    "type": "upload",
    "performanceId": "perf_xyz789"
  }
}
```

**Request Body (본인 연주 = YouTube)**

```json
{
  "scoreId": "sc_abc123def456",
  "referenceYoutubeUrl": "https://www.youtube.com/watch?v=ref123",
  "performance": {
    "type": "youtube",
    "youtubeUrl": "https://www.youtube.com/watch?v=my123"
  }
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| scoreId | string | O | 3.2에서 반환한 악보 식별자 |
| referenceYoutubeUrl | string | O | 참조(프로) 연주 YouTube URL |
| performance | object | O | 본인 연주 출처 |
| performance.type | string | O | `"upload"` \| `"youtube"` |
| performance.performanceId | string | 조건부 | type이 `upload`일 때 필수 |
| performance.youtubeUrl | string | 조건부 | type이 `youtube`일 때 필수 |

**Response — 200 OK (동기 방식, 평가 완료)**

평가가 완료되면 **이력에 자동 저장**되고, 응답에 `evaluationId`(이력 ID)가 포함된다.

```json
{
  "ok": true,
  "data": {
    "jobId": "job_ev_001",
    "evaluationId": "eval_abc123",
    "status": "completed",
    "result": {
      "totalScore": 78,
      "maxScore": 100,
      "summary": {
        "technical": "음정과 리듬은 안정적이나, 고음역 음색이 다소 불안정합니다.",
        "expression": "다이내믹스 대비 프레이징이 다소 경직되어 있습니다."
      },
      "sections": [
        {
          "label": "마디 1–4",
          "difference": "프로는 도입부를 더 약하게 시작해 점점 크레셋도합니다.",
          "suggestion": "p로 시작해 2마디째부터 크레셋도를 시도해 보세요."
        },
        {
          "label": "마디 5–8",
          "difference": "템포가 참조 연주보다 약간 빠릅니다.",
          "suggestion": "메트로놈으로 60 BPM에 맞춰 연습한 뒤 루바토를 더해 보세요."
        }
      ]
    }
  }
}
```

| 필드 | 타입 | 설명 |
|------|------|------|
| evaluationId | string | 이력에 저장된 평가의 고유 ID. 이력 상세/삭제 시 사용 |

**Response — 200 OK (비동기 방식, 작업 생성됨)**

```json
{
  "ok": true,
  "data": {
    "jobId": "job_ev_001",
    "status": "processing"
  }
}
```

이후 클라이언트는 `GET /api/v1/evaluate/job_ev_001` 로 폴링하여 `status`가 `completed` 또는 `failed`가 될 때까지 대기.

**Response — 202 Accepted (비동기, 대기 중)**

서버가 비동기만 지원할 경우 본문은 위와 동일하고, HTTP 상태 코드만 202로 반환할 수 있다.

**Response — 400** (필수 값 누락, API 키 없음 등)

```json
{
  "ok": false,
  "error": {
    "code": "MISSING_API_KEY",
    "message": "Gemini API 키를 먼저 설정해 주세요."
  }
}
```

```json
{
  "ok": false,
  "error": {
    "code": "INVALID_INPUT",
    "message": "scoreId가 유효하지 않거나 만료되었습니다."
  }
}
```

**Response — 503** (Gemini 오류 등)

```json
{
  "ok": false,
  "error": {
    "code": "GEMINI_ERROR",
    "message": "평가 처리 중 오류가 발생했습니다. API 키와 할당량을 확인해 주세요."
  }
}
```

---

### 3.6 평가 작업 조회 (비동기 시)

#### GET /api/v1/evaluate/:jobId

비동기로 제출한 평가 작업의 상태와 결과를 조회한다.

**요청**

```
GET /api/v1/evaluate/job_ev_001
```

**Response — 200 OK (처리 중)**

```json
{
  "ok": true,
  "data": {
    "jobId": "job_ev_001",
    "status": "processing",
    "progress": "참조 연주와 비교 중입니다."
  }
}
```

**Response — 200 OK (완료)**

완료 시 이력에 저장되며 `evaluationId`가 포함된다.

```json
{
  "ok": true,
  "data": {
    "jobId": "job_ev_001",
    "evaluationId": "eval_abc123",
    "status": "completed",
    "result": {
      "totalScore": 78,
      "maxScore": 100,
      "summary": { "technical": "...", "expression": "..." },
      "sections": [ ... ]
    }
  }
}
```

**Response — 200 OK (실패)**

```json
{
  "ok": true,
  "data": {
    "jobId": "job_ev_001",
    "status": "failed",
    "errorMessage": "영상을 분석할 수 없습니다."
  }
}
```

**Response — 404**

```json
{
  "ok": false,
  "error": {
    "code": "JOB_NOT_FOUND",
    "message": "해당 평가 작업을 찾을 수 없습니다."
  }
}
```

---

### 3.7 이력 목록 조회

#### GET /api/v1/history

현재 세션에 저장된 평가 이력 목록을 **최신순**으로 반환한다.

**요청**

```
GET /api/v1/history
```

**Query (선택)**

| 파라미터 | 타입 | 설명 |
|----------|------|------|
| limit | number | 조회 개수 (기본 50, 최대 100) |
| offset | number | 건너뛸 개수 (페이지네이션) |

**Response — 200 OK**

```json
{
  "ok": true,
  "data": {
    "items": [
      {
        "id": "eval_abc123",
        "createdAt": "2026-02-16T14:30:00.000Z",
        "totalScore": 78,
        "maxScore": 100,
        "referenceYoutubeUrl": "https://www.youtube.com/watch?v=ref123",
        "performanceType": "youtube",
        "performanceSummary": "https://www.youtube.com/watch?v=my123"
      },
      {
        "id": "eval_def456",
        "createdAt": "2026-02-15T10:00:00.000Z",
        "totalScore": 82,
        "maxScore": 100,
        "referenceYoutubeUrl": "https://www.youtube.com/watch?v=ref456",
        "performanceType": "upload",
        "performanceSummary": "my_recording.mp4"
      }
    ],
    "total": 2
  }
}
```

| 필드 | 타입 | 설명 |
|------|------|------|
| items[].id | string | 이력 ID (상세/삭제 시 사용) |
| items[].createdAt | string | ISO 8601 평가 일시 |
| items[].totalScore | number | 총점 |
| items[].maxScore | number | 100 |
| items[].referenceYoutubeUrl | string | 참조(프로) 연주 URL (선택 노출) |
| items[].performanceType | string | `"youtube"` \| `"upload"` |
| items[].performanceSummary | string | 본인 연주 요약(URL 또는 파일명 등) |
| total | number | 해당 세션의 전체 이력 개수 |

---

### 3.8 이력 상세 조회

#### GET /api/v1/history/:id

저장된 평가 한 건의 **전체 결과**를 반환한다.

**요청**

```
GET /api/v1/history/eval_abc123
```

**Response — 200 OK**

```json
{
  "ok": true,
  "data": {
    "id": "eval_abc123",
    "createdAt": "2026-02-16T14:30:00.000Z",
    "result": {
      "totalScore": 78,
      "maxScore": 100,
      "summary": {
        "technical": "음정과 리듬은 안정적이나...",
        "expression": "다이내믹스 대비 프레이징이..."
      },
      "sections": [
        {
          "label": "마디 1–4",
          "difference": "프로는 도입부를 더 약하게...",
          "suggestion": "p로 시작해 2마디째부터..."
        }
      ]
    },
    "referenceYoutubeUrl": "https://www.youtube.com/watch?v=ref123",
    "performanceType": "youtube",
    "performanceSummary": "https://www.youtube.com/watch?v=my123"
  }
}
```

**Response — 404**

```json
{
  "ok": false,
  "error": {
    "code": "EVALUATION_NOT_FOUND",
    "message": "해당 평가 이력을 찾을 수 없습니다."
  }
}
```

---

### 3.9 이력 삭제

#### DELETE /api/v1/history/:id

저장된 평가 이력 한 건을 삭제한다. 해당 세션 소유만 삭제 가능.

**요청**

```
DELETE /api/v1/history/eval_abc123
```

**Response — 200 OK**

```json
{
  "ok": true,
  "message": "평가 이력이 삭제되었습니다."
}
```

**Response — 404**

```json
{
  "ok": false,
  "error": {
    "code": "EVALUATION_NOT_FOUND",
    "message": "해당 평가 이력을 찾을 수 없습니다."
  }
}
```

---

## 4. 데이터 타입 정의

### 4.1 평가 결과 (Result)

| 필드 | 타입 | 설명 |
|------|------|------|
| totalScore | number | 0~100 점수 |
| maxScore | number | 100 (고정) |
| summary | object | 기술/표현 요약 |
| summary.technical | string | 기술적 평가 요약 |
| summary.expression | string | 표현적 평가 요약 |
| sections | array | 마디(구간)별 비교 |
| sections[].label | string | 예: "마디 1–4" |
| sections[].difference | string | 프로 대비 차이 설명 |
| sections[].suggestion | string | 개선 제안 |

### 4.2 작업 상태 (Job Status)

| 값 | 설명 |
|----|------|
| processing | 처리 중 |
| completed | 완료 (result 포함) |
| failed | 실패 (errorMessage 포함) |

---

## 5. 에러 응답 공통 형식

모든 오류 응답 본문은 다음 구조를 따른다.

```json
{
  "ok": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "사용자에게 보여줄 한글 메시지"
  }
}
```

### 5.1 에러 코드 목록

| 코드 | HTTP | 설명 |
|------|------|------|
| INVALID_API_KEY | 400 | API 키 형식 오류 |
| INVALID_SCORE_FILE | 400 | 악보 파일 형식/용량 오류 |
| INVALID_VIDEO_FILE | 400 | 동영상 파일 형식/용량 오류 |
| INVALID_YOUTUBE_URL | 400 | YouTube URL 형식 오류 |
| MISSING_API_KEY | 400 | API 키 미설정 |
| INVALID_INPUT | 400 | scoreId/performanceId 등 잘못됨 또는 만료 |
| JOB_NOT_FOUND | 404 | 해당 jobId 없음 |
| EVALUATION_NOT_FOUND | 404 | 해당 이력 id 없음 |
| GEMINI_ERROR | 503 | Gemini API 호출 실패/할당량 초과 |
| INTERNAL_ERROR | 500 | 서버 내부 오류 |

---

## 6. 문서 이력

| 버전 | 일자 | 변경 내용 |
|------|------|-----------|
| 1.0 | 2026-02-16 | 최초 작성 |
| 1.1 | 2026-02-16 | 이력 목록/상세/삭제 API 및 평가 완료 시 이력 저장(evaluationId) 반영 |
