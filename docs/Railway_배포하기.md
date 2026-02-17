# Railway로 연주 평가기 배포하기

GitHub에 올린 저장소를 Railway에 연결하면, 누구나 접속할 수 있는 URL이 만들어집니다.

---

## 1. Railway 가입 및 프로젝트 만들기

1. **https://railway.app** 접속 후 **Login** 클릭  
2. **GitHub로 로그인** (Deploy from GitHub 할 때 편함)  
3. **New Project** 클릭  
4. **Deploy from GitHub repo** 선택  
5. **GitHub 저장소 목록**에서 **performance-evaluator** (또는 올려둔 저장소 이름) 선택  
6. 저장소를 고르면 Railway가 자동으로 **한 개의 서비스**를 만들고 **배포를 시작**합니다  

---

## 2. 설정 확인 (이미 되어 있음)

프로젝트에 **`railway.json`** 이 있으면 Railway가 아래처럼 빌드·실행합니다.  
**별도로 입력할 필요 없습니다.**

- **Build Command**: `npm run build`  
  (프론트 빌드 + 백엔드 의존성 설치)
- **Start Command**: `npm run start`  
  (백엔드 서버 실행, 프론트는 같은 서버에서 서빙)

**Root Directory**는 비워 두세요 (저장소 루트 그대로 사용).

---

## 3. 환경 변수 넣기

1. Railway 대시보드에서 만든 **서비스(연주 평가기)** 클릭  
2. **Variables** 탭 클릭  
3. **+ New Variable** 또는 **RAW Editor**로 아래 변수 추가  

| 변수 이름 | 값 | 필수 |
|-----------|-----|------|
| `NODE_ENV` | `production` | 권장 |
| `SESSION_SECRET` | **아무 긴 랜덤 문자열** (예: `a1b2c3d4e5f6...` 32자 이상) | **필수** |

- **SESSION_SECRET**은 꼭 **본인이 만든 랜덤 문자열**로 넣어야 합니다.  
  (같은 값이면 안 되고, 예시 그대로 쓰지 마세요.)

저장하면 자동으로 다시 배포될 수 있습니다.

---

## 4. 공개 URL 만들기

1. 같은 서비스에서 **Settings** 탭 클릭  
2. **Networking** 섹션에서 **Generate Domain** 클릭  
3. 생긴 주소가 **공개 URL**입니다.  
   예: `https://performance-evaluator-production-xxxx.up.railway.app`  

이 주소를 브라우저에 넣으면 연주 평가기 화면이 뜹니다.

---

## 5. 배포 상태 확인

1. **Deployments** 탭에서 최신 배포 클릭  
2. **Building** → **Success** 로 바뀌면 성공  
3. **실패**면 **View Logs**에서 빨간 에러 메시지 확인  

자주 나오는 경우:
- **Build 실패**: 로그에 `npm` / `node` 관련 에러가 있는지 확인  
- **실행 후 바로 꺼짐**: **Variables**에 `SESSION_SECRET` 넣었는지 확인  

---

## 6. 사용 방법

1. **4번**에서 만든 URL로 접속  
2. **설정**에서 **Gemini** 또는 **ChatGPT(OpenAI)** 선택 후 **API 키** 입력·저장  
3. 악보·참조 연주·본인 연주 넣고 **평가** 진행  

이 URL을 다른 사람에게 알려주면, 그들도 같은 주소로 들어와서 사용할 수 있습니다.

---

## 7. 이후에 코드 수정했을 때

GitHub에 `git push` 하면 Railway가 **자동으로 다시 배포**합니다.  
(같은 저장소를 연결해 뒀다면 별도 버튼 누를 필요 없음)

---

## 요약

| 단계 | 할 일 |
|------|--------|
| 1 | railway.app → GitHub 로그인 → New Project → Deploy from GitHub → 저장소 선택 |
| 2 | railway.json 덕분에 Build/Start 설정은 자동 적용 |
| 3 | Variables에 `NODE_ENV=production`, `SESSION_SECRET=랜덤문자열` 추가 |
| 4 | Settings → Networking → Generate Domain → 나온 URL로 접속 |
| 5 | 접속 후 설정에서 API 키 입력하고 사용 |

여기까지 하면 Railway 배포가 끝납니다.
