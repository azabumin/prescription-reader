import { useEffect, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { Link } from 'expo-router';

import { staticPageStyles as s } from '../components/staticPageStyles';
import { detectDefaultLang, STRINGS } from '../lib/i18n';
import { loadLangPref } from '../lib/langPref';
import type { Lang } from '../types';

// This page only has copy written for these three languages. A user who picked one of the
// other 8 (vi/zh/id/tl/th/my/ne/pt) sees English here rather than a language they didn't pick.
type ContentLang = 'ja' | 'ko' | 'en';
const CONTENT_LANGS: ContentLang[] = ['ja', 'ko', 'en'];

function resolveContentLang(lang: Lang): ContentLang {
  return (CONTENT_LANGS as string[]).includes(lang) ? (lang as ContentLang) : 'en';
}

const CONTENT: Record<
  ContentLang,
  { title: string; updated: string; sections: { heading: string; body: string }[] }
> = {
  ko: {
    title: '개인정보처리방침',
    updated: '최종 수정일: 2026년 8월',
    sections: [
      {
        heading: '사진 처리 방식',
        body: '촬영하거나 선택한 사진은 분석을 위해 서버로 전송되고, Anthropic의 AI 모델로 곧바로 전달됩니다. 사진은 저희 서버에 저장되지 않으며, 분석이 끝나면 남지 않습니다. 로그인이나 회원가입이 없어 사진을 특정 개인과 연결해 보관하지 않습니다.',
      },
      {
        heading: '남기는 정보',
        body: '무료로 계속 서비스하기 위해, 접속 IP 주소를 기준으로 하루 이용 횟수만 24시간 동안 임시로 기록합니다. 이 정보는 다음 날 자동으로 사라지며, 다른 목적으로 쓰이지 않습니다.',
      },
      {
        heading: '기록 저장 및 캘린더 알림',
        body: '분석 결과(약 이름, 복용 시간표 등 텍스트)는 다시 보실 수 있도록 이 기기의 브라우저에만 저장됩니다. 사진은 이 저장에 포함되지 않으며, 어디로도 전송되지 않습니다. "캘린더에 알림 추가" 기능은 기기에서 직접 파일을 만들어 다운로드할 뿐, 저희 서버나 제3자에게 아무 정보도 전달하지 않습니다.',
      },
      {
        heading: '광고',
        body: '이 사이트는 Google AdSense를 통해 광고를 표시할 수 있습니다. Google은 쿠키를 사용해 관심사 기반 광고를 보여줄 수 있으며, Google 광고 설정(adssettings.google.com)에서 개인 맞춤 광고를 끌 수 있습니다.',
      },
      { heading: '문의', body: '이 방침에 대해 궁금한 점이 있으면 앱 저장소(GitHub)의 이슈로 남겨주세요.' },
    ],
  },
  ja: {
    title: 'プライバシーポリシー',
    updated: '最終更新日: 2026年8月',
    sections: [
      {
        heading: '写真の取り扱い',
        body: '撮影または選択した写真は、分析のためサーバーに送信され、そのままAnthropicのAIモデルに渡されます。写真は当方のサーバーには保存されず、分析後に残ることはありません。ログインや会員登録がないため、写真を特定の個人と結び付けて保存することもありません。',
      },
      {
        heading: '記録する情報',
        body: '無料でサービスを継続するため、接続元IPアドレスごとの1日あたりの利用回数のみ、24時間だけ一時的に記録します。この情報は翌日に自動的に消去され、他の目的には使用しません。',
      },
      {
        heading: '履歴の保存とカレンダーリマインダー',
        body: '分析結果(お薬の名前、服用スケジュールなどのテキスト)は、後で見返せるようこの端末のブラウザ内にのみ保存されます。写真はこの保存には含まれず、どこにも送信されません。「カレンダーにリマインダーを追加」機能は端末上でファイルを作成してダウンロードするだけで、当方のサーバーや第三者に情報が送られることはありません。',
      },
      {
        heading: '広告',
        body: '当サイトはGoogle AdSenseを通じて広告を表示する場合があります。Googleはクッキーを使用して興味・関心に基づく広告を表示することがあり、Google広告設定(adssettings.google.com)からパーソナライズ広告をオフにできます。',
      },
      {
        heading: 'お問い合わせ',
        body: 'このポリシーについてご質問がある場合は、アプリのリポジトリ(GitHub)のIssueにてご連絡ください。',
      },
    ],
  },
  en: {
    title: 'Privacy Policy',
    updated: 'Last updated: August 2026',
    sections: [
      {
        heading: 'How Photos Are Handled',
        body: "Photos you take or choose are sent to our server for analysis and passed directly to Anthropic's AI model. Photos are not stored on our server, and nothing remains once analysis is complete. There is no login or account system, so photos are never stored in a way that's linked to a specific person.",
      },
      {
        heading: 'Information We Keep',
        body: 'To keep this service free, we temporarily log only the number of daily analyses per IP address, for 24 hours. This information is automatically deleted the next day and is not used for any other purpose.',
      },
      {
        heading: 'Saved History & Calendar Reminders',
        body: 'Analysis results (medication names, dosing schedules, etc. as text) are saved only in this device\'s browser so you can look back at them later. Photos are never included in this storage and are never sent anywhere. The "Add to Calendar" feature creates and downloads a file directly on your device — it never sends any information to our server or a third party.',
      },
      {
        heading: 'Advertising',
        body: "This site may display ads through Google AdSense. Google may use cookies to show interest-based ads; you can turn off personalized ads at Google's Ad Settings (adssettings.google.com).",
      },
      {
        heading: 'Contact',
        body: "If you have questions about this policy, please open an issue on the app's GitHub repository.",
      },
    ],
  },
};

export default function PrivacyScreen() {
  const [lang, setLang] = useState<Lang>(detectDefaultLang());
  useEffect(() => {
    loadLangPref().then((saved) => {
      if (saved) setLang(saved);
    });
  }, []);
  const content = CONTENT[resolveContentLang(lang)];

  return (
    <ScrollView contentContainerStyle={s.container}>
      <Link href="/" style={s.backLink}>
        {STRINGS[lang].backToApp}
      </Link>

      <View style={s.langBlock}>
        <Text style={s.pageTitle}>{content.title}</Text>
        <Text style={s.muted}>{content.updated}</Text>

        {content.sections.map((section) => (
          <View key={section.heading}>
            <Text style={s.sectionHeading}>{section.heading}</Text>
            <Text style={s.body}>{section.body}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
