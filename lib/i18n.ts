import { Platform } from 'react-native';
import type { Lang } from '../types';

export const STRINGS: Record<Lang, Record<string, string>> = {
  ko: {
    appTitle: '처방전 도우미',
    appSubtitle: '처방전이나 약봉투를 찍으면 쉬운 말로 설명해 드려요.',
    takePhoto: '카메라로 촬영',
    pickPhoto: '갤러리에서 선택',
    disclaimer:
      '* 이 안내는 처방전에 적힌 내용을 쉬운 말로 정리한 것으로, 의료 조언이 아닙니다. 복용 관련 궁금한 점은 약사·의사와 상담하세요.',
    analyzing: '사진을 분석하고 있어요...',
    retry: '다시 시도',
    tryAnother: '다른 사진으로 다시 분석하기',
    cameraPermissionDenied: '카메라 권한이 필요합니다. 브라우저 또는 기기 설정에서 권한을 허용해 주세요.',
    libraryPermissionDenied: '사진 접근 권한이 필요합니다. 브라우저 또는 기기 설정에서 권한을 허용해 주세요.',
    pickError: '사진을 불러오는 중 문제가 발생했습니다.',
    errorNetwork: '서버에 연결할 수 없습니다. 인터넷 연결을 확인해 주세요.',
    errorRateLimited: '오늘 사용 가능한 분석 횟수를 모두 사용했습니다. 내일 다시 시도해 주세요.',
    errorServer: '분석 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.',
    medicationSectionTitle: '약 정보',
    dosageLabel: '1회 복용량',
    frequencyLabel: '복용 시간',
    purposeLabel: '용도',
    precautionLabel: '주의사항',
    generalNotesTitle: '전체 안내',
    langToggle: '日本語',
    footerPrivacy: '개인정보처리방침',
    footerTerms: '이용약관',
    footerAbout: '소개',
    back: '뒤로',
  },
  ja: {
    appTitle: '処方箋ヘルパー',
    appSubtitle: '処方箋やお薬の袋を撮影すると、わかりやすく説明します。',
    takePhoto: 'カメラで撮影',
    pickPhoto: 'ギャラリーから選ぶ',
    disclaimer:
      '※ この説明は処方箋に書かれた内容をわかりやすくまとめたもので、医療アドバイスではありません。服用について気になる点は薬剤師・医師にご相談ください。',
    analyzing: '写真を分析しています...',
    retry: 'もう一度試す',
    tryAnother: '別の写真でもう一度分析する',
    cameraPermissionDenied: 'カメラの権限が必要です。ブラウザまたは端末の設定で許可してください。',
    libraryPermissionDenied: '写真へのアクセス権限が必要です。ブラウザまたは端末の設定で許可してください。',
    pickError: '写真の読み込み中に問題が発生しました。',
    errorNetwork: 'サーバーに接続できません。インターネット接続をご確認ください。',
    errorRateLimited: '本日利用できる分析回数の上限に達しました。明日もう一度お試しください。',
    errorServer: '分析中に問題が発生しました。しばらくしてからもう一度お試しください。',
    medicationSectionTitle: 'お薬情報',
    dosageLabel: '1回の服用量',
    frequencyLabel: '服用タイミング',
    purposeLabel: '用途',
    precautionLabel: '注意事項',
    generalNotesTitle: '全体のご案内',
    langToggle: '한국어',
    footerPrivacy: 'プライバシーポリシー',
    footerTerms: '利用規約',
    footerAbout: 'このアプリについて',
    back: '戻る',
  },
};

export function detectDefaultLang(): Lang {
  if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.language) {
    return navigator.language.toLowerCase().startsWith('ja') ? 'ja' : 'ko';
  }
  return 'ko';
}
