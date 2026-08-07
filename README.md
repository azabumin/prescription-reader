# 처방전 도우미 / 処方箋ヘルパー (prescription-reader)

처방전이나 약봉투 사진을 찍으면 AI가 약 이름·복용법·주의사항을 쉬운 말로 정리해주는 웹 앱.
한국어/일본어 두 언어를 지원합니다. GitHub Pages로 배포해 누구나 링크만 열면 바로 사용할 수 있습니다.

- **Live app:** https://azabumin.github.io/prescription-reader/
- **Frontend:** Expo + expo-router + react-native-web (`app/`)
- **Backend:** Cloudflare Worker, Claude 비전 API 프록시 (`worker/`) — 자세한 배포 방법은
  [`worker/README.md`](worker/README.md) 참고

## 로컬 개발

```bash
npm install
npm run web
```

## 배포

프론트엔드:

```bash
npm run deploy   # expo export -p web 후 gh-pages로 배포
```

백엔드(Worker)는 [`worker/README.md`](worker/README.md)의 안내를 따르세요.

## 구조

```
app/                   화면 (expo-router) — index(메인), about/privacy/terms(bilingual 정보 페이지)
components/AdBanner*    구글 애드센스 광고 자리 (승인 전까지는 아무것도 렌더링하지 않음)
constants/               테마, Worker URL, 애드센스 설정
lib/i18n.ts              한국어/일본어 UI 문구
lib/api.ts               Worker 호출
worker/                   Cloudflare Worker 백엔드 (Claude API 프록시 + 사용량 제한, lang 파라미터로 한/일 프롬프트 전환)
```

## 알아둘 점

- **의료 조언이 아닙니다.** 처방전에 적힌 내용을 AI가 쉬운 말로 옮긴 것일 뿐, 진단·처방을 대신하지 않습니다.
  화면과 이용약관에 이 점을 명시해뒀습니다.
- 사진은 서버에 저장되지 않습니다 — 분석 요청마다 Claude API로 바로 전달되고 응답만 반환합니다.
- 무료로 누구나 쓸 수 있도록 Worker에 하루 사용량 제한(rate limit)이 걸려 있습니다 —
  자세한 내용과 조정 방법은 `worker/README.md` 참고.
- **구글 애드센스**는 `constants/adsense.ts`에 publisher ID / slot ID를 넣기 전까지 비활성 상태입니다.
  등록·심사는 https://adsense.google.com 에서 직접 진행해야 합니다 (대신 해드릴 수 없는 부분입니다).
  승인 확률을 위해 개인정보처리방침·이용약관·소개 페이지를 미리 넣어뒀습니다.
