# GitHub에 연주 평가기 올리기

코드를 GitHub에 올리면 백업·공유·배포(Railway, Render 등)에 쓸 수 있습니다.

---

## 1. Git 설치 (아직 없다면)

1. **https://git-scm.com/download/win** 에서 Windows용 Git 설치 파일 받기  
2. 설치 시 **“Git from the command line and also from 3rd-party software”** 옵션 선택  
3. 설치 후 **새 터미널(또는 Cursor 터미널)을 연 다음** 아래 단계 진행  

---

## 2. 터미널에서 프로젝트 폴더로 이동

```powershell
cd "C:\Users\CS Ryu\code\performance-evaluator"
```

---

## 3. Git 저장소 만들고 첫 커밋

아래를 **한 줄씩** 실행하세요.

```powershell
git init
git add .
git commit -m "연주 평가기 초기 커밋"
```

- `git add .` 는 `.gitignore` 에 있는 것(node_modules, .env, uploads 등)은 제외하고 나머지 파일만 넣습니다.

---

## 4. GitHub에서 새 저장소 만들기

1. 브라우저에서 **https://github.com** 접속 후 로그인  
2. 오른쪽 위 **+** → **New repository**  
3. **Repository name**: 예) `performance-evaluator`  
4. **Public** 선택  
5. **“Add a README file”** / **“Add .gitignore”** 는 **체크하지 마세요** (이미 로컬에 있음)  
6. **Create repository** 클릭  

---

## 5. GitHub에 올리기 (push)

만든 저장소 페이지에 나오는 주소를 사용합니다.  
예: `https://github.com/내아이디/performance-evaluator.git`

아래에서 **`내아이디`** 와 **`performance-evaluator`** 를 본인 계정·저장소 이름으로 바꾼 뒤 실행하세요.

```powershell
git remote add origin https://github.com/내아이디/performance-evaluator.git
git branch -M main
git push -u origin main
```

- **처음 push 할 때** 브라우저나 창이 뜨면 GitHub 로그인 하라고 나올 수 있습니다.  
- **비밀번호 대신** Personal Access Token을 쓰라고 하면:  
  - GitHub → **Settings** → **Developer settings** → **Personal access tokens** 에서 토큰 생성 후, 비밀번호 칸에 그 토큰을 입력하면 됩니다.

---

## 6. 올라간 뒤 수정사항 반영하기

나중에 코드를 고친 다음 다시 올리려면:

```powershell
cd "C:\Users\CS Ryu\code\performance-evaluator"
git add .
git commit -m "수정 내용 한 줄 설명"
git push
```

---

## 요약

| 단계 | 할 일 |
|------|--------|
| 1 | Git 설치 후 터미널 다시 열기 |
| 2 | `cd "C:\Users\CS Ryu\code\performance-evaluator"` |
| 3 | `git init` → `git add .` → `git commit -m "연주 평가기 초기 커밋"` |
| 4 | GitHub에서 새 저장소 만들기 (README 추가 안 함) |
| 5 | `git remote add origin https://github.com/내아이디/저장소이름.git` → `git push -u origin main` |

여기까지 하면 GitHub에 직접 올린 상태가 됩니다.
