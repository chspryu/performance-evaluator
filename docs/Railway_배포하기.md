# Railway로 연주 평가기 배포하기 (처음부터)

GitHub 저장소를 Railway에 연결해서, 누구나 접속할 수 있는 URL을 만듭니다.

---

## 준비

- 연주 평가기 코드가 **GitHub**에 올라와 있어야 합니다.  
  (아직이면 [GitHub에_올리기.md](./GitHub에_올리기.md) 참고)

---

## 1단계: Railway 가입 및 프로젝트 생성

1. **https://railway.app** 접속
2. **Login** 클릭 → **GitHub**로 로그인 (저장소 연결용)
3. **New Project** 클릭
4. **Deploy from GitHub repo** 선택
5. **Configure GitHub App** 이 나오면 **설치할 계정/조직** 선택 후 **저장소**에서 **performance-evaluator** (또는 사용 중인 저장소 이름) 선택 → **Install**
6. 다시 **New Project** → **Deploy from GitHub repo** → 방금 연결한 **performance-evaluator** 저장소 선택

저장소를 고르면 Railway가 **서비스 하나**를 만들고 **자동으로 빌드**를 시작합니다.

---

## 2단계: 설정 확인 (대시보드)

프로젝트에 **`railway.json`** 이 있어서 빌드/시작 명령은 자동으로 잡힙니다.  
**Root Directory**만 확인하세요.

1. 만들어진 **서비스** 클릭 (performance-evaluator 등)
2. **Settings** 탭
3. **Root Directory** → **비어 있어야 함** (저장소 루트 사용)
4. **Build Command** / **Start Command** → `railway.json` 때문에 이미 설정돼 있음 (건드리지 않아도 됨)

---

## 3단계: 환경 변수 설정

1. 같은 서비스에서 **Variables** 탭 클릭
2. **+ New Variable** 또는 **RAW Editor** 로 아래 두 개 추가

| 이름 | 값 |
|------|-----|
| `NODE_ENV` | `production` |
| `SESSION_SECRET` | **본인이 정한 긴 랜덤 문자열** (32자 이상 권장) |

- **SESSION_SECRET** 예: 영문+숫자 조합으로 `abc123def456...` 처럼 길게 만든 뒤 붙여넣기  
- 저장 후 재배포가 시작될 수 있습니다.

---

## 4단계: 공개 URL 만들기

1. 같은 서비스 **Settings** 탭
2. **Networking** 섹션에서 **Generate Domain** 클릭
3. 생성된 주소가 **공개 URL** (예: `https://performance-evaluator-production-xxxx.up.railway.app`)

이 주소로 접속하면 연주 평가기 화면이 나옵니다.

---

## 5단계: 배포 성공 여부 확인

1. **Deployments** 탭 → 가장 위 **배포** 클릭
2. **Build** 가 **Success** (초록) 이면 빌드 성공
3. **Deploy** 가 **Success** 이면 서버 실행 성공
4. **실패**면 해당 단계 **View Logs** 에서 에러 메시지 확인

---

## 6단계: 사용하기

1. **4단계**에서 만든 URL로 접속
2. **설정** → **Gemini** 또는 **ChatGPT(OpenAI)** 선택 후 **API 키** 입력·저장
3. 악보 / 참조 연주 / 본인 연주 입력 후 **평가** 진행

이 URL을 다른 사람에게 알려주면 같은 주소로 들어와 사용할 수 있습니다.

---

## 자주 나오는 문제

| 증상 | 확인할 것 |
|------|------------|
| Build 실패 | Deployments → 해당 배포 → View Logs. `npm` / `node` 에러가 있으면 로그 내용 확인. |
| Deploy 후 바로 종료 | Variables에 `NODE_ENV=production`, `SESSION_SECRET` 넣었는지 확인. |
| 접속해도 빈 화면/에러 | 4단계에서 **Generate Domain** 했는지, 올바른 URL로 접속했는지 확인. |

---

## 기존 Railway 프로젝트를 처음부터 다시 쓰고 싶을 때

- **같은 저장소로 그대로 다시 배포만** 하려면: GitHub에 push 하면 자동 재배포됩니다.
- **Railway 프로젝트를 아예 새로** 만들려면: Railway 대시보드에서 기존 프로젝트 **Delete** 후, 위 **1단계**부터 다시 진행하면 됩니다.

---

## 요약

| 순서 | 할 일 |
|------|--------|
| 1 | railway.app → GitHub 로그인 → New Project → Deploy from GitHub → 저장소 선택 |
| 2 | Settings에서 Root Directory 비움 확인 |
| 3 | Variables에 `NODE_ENV=production`, `SESSION_SECRET=랜덤문자열` 추가 |
| 4 | Settings → Networking → Generate Domain → URL 복사 |
| 5 | 그 URL로 접속 → 설정에서 API 키 입력 후 사용 |

끝.
