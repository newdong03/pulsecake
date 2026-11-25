# Meet your Cake — 부스 체험 웹

아이패드(834×1194, 세로) 기준 5화면: main → loading → result → reply1 → reply2 (+ QR → 폰에서 카드 저장)

## 폴더
- `index.html` `style.css` `app.js` — 화면 / 스타일 / 동작
- `assets/` — 배경, 케이크 4종(cake·slice·card), 심볼, 모자
- `fonts/` — Poppins, Pretendard (인터넷 없어도 동작하도록 포함)
- 메시지 분석은 `app.js` 안의 단어 사전(`DICT`, `NOUNS`)으로 브라우저에서 처리합니다. API·서버 불필요. 단어를 추가/삭제하면 분류가 바뀝니다.

## 내 컴퓨터에서 보기
`index.html`을 더블클릭해도 5화면과 카드 생성은 동작합니다. 다만 QR에 들어가는 주소가 내 컴퓨터 파일 경로라서, **QR로 폰에서 여는 것은 배포 후에만** 됩니다.
(`start.bat` → `http://localhost:8080` 으로 열어도 됩니다. 파이썬 필요)

## 아이패드·QR까지 쓰려면 (배포)
QR은 "카드를 폰에서 열어주는 주소"를 담기 때문에 **인터넷에 올린 주소**가 필요합니다.
1. Vercel(vercel.com)에 이 폴더를 올리기 (드래그 앤 드롭 가능)
2. 주소가 생기면 아이패드 Safari에서 열기 → 공유 → "홈 화면에 추가" (전체 화면)
3. 같은 와이파이의 폰으로 QR 스캔해서 확인

## 디버그 주소 (화면별 확인)
`index.html#s=result&c=2` (c=1 코랄 / 2 핑크 / 3 하늘 / 4 연두), `#s=reply1&c=3`, `#s=reply2&c=4`
