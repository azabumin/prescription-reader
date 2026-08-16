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
    title: '이용약관',
    updated: '최종 수정일: 2026년 8월',
    sections: [
      {
        heading: '서비스 내용',
        body: '이 앱은 처방전·약봉투 사진을 AI로 분석해 이해하기 쉬운 형태로 정리해 보여주는 무료 도구입니다.',
      },
      {
        heading: '의료 조언이 아닙니다',
        body: '이 앱이 제공하는 정보는 사진에 적힌 내용을 AI가 읽고 쉬운 말로 옮긴 것으로, 진단·처방·의학적 조언을 대신하지 않습니다. 복용 방법이나 건강 상태에 대해 궁금하거나 걱정되는 점이 있으면 반드시 약사 또는 의사와 상담하세요. 사진 화질이나 필기체 등으로 인식이 부정확할 수 있습니다.',
      },
      {
        heading: '이용 제한',
        body: '서버 운영 비용을 감당할 수 있는 범위 내에서 서비스를 유지하기 위해, 하루 이용 가능 횟수에 제한을 둘 수 있습니다. 제한에 도달하면 다음 날 다시 이용하실 수 있습니다.',
      },
      {
        heading: '책임의 한계',
        body: '이 앱은 무료로 제공되며, 분석 결과의 정확성을 보장하지 않습니다. 이 앱의 정보를 이용해 발생한 결과에 대해 개발자는 법이 허용하는 범위 내에서 책임을 지지 않습니다.',
      },
      { heading: '약관 변경', body: '이 약관은 서비스 개선에 따라 사전 예고 없이 변경될 수 있습니다.' },
    ],
  },
  ja: {
    title: '利用規約',
    updated: '最終更新日: 2026年8月',
    sections: [
      {
        heading: 'サービス内容',
        body: '本アプリは、処方箋・お薬の袋の写真をAIで分析し、わかりやすい形にまとめて表示する無料のツールです。',
      },
      {
        heading: '医療アドバイスではありません',
        body: '本アプリが提供する情報は、写真に書かれた内容をAIが読み取りわかりやすく言い換えたものであり、診断・処方・医学的アドバイスに代わるものではありません。服用方法や健康状態について気になる点やご不安な点がある場合は、必ず薬剤師または医師にご相談ください。写真の画質や手書き文字などにより、認識結果が不正確になる場合があります。',
      },
      {
        heading: '利用制限',
        body: 'サーバー運営コストを賄える範囲でサービスを維持するため、1日あたりの利用回数に制限を設ける場合があります。制限に達した場合は、翌日以降に再度ご利用いただけます。',
      },
      {
        heading: '免責事項',
        body: '本アプリは無料で提供されており、分析結果の正確性を保証するものではありません。本アプリの情報を利用したことにより生じた結果について、開発者は法令が許す範囲で責任を負いません。',
      },
      { heading: '規約の変更', body: '本規約は、サービス改善に伴い予告なく変更される場合があります。' },
    ],
  },
  en: {
    title: 'Terms of Service',
    updated: 'Last updated: August 2026',
    sections: [
      {
        heading: 'Service Description',
        body: 'This app is a free tool that uses AI to analyze photos of prescriptions or medication labels and present the contents in an easy-to-understand form.',
      },
      {
        heading: 'Not Medical Advice',
        body: "The information this app provides is an AI's plain-language restatement of what's written in the photo — it is not a diagnosis, prescription, or medical advice. If you have questions or concerns about how to take your medication or about your health, please consult a pharmacist or doctor. Recognition may be inaccurate due to photo quality, handwriting, and similar factors.",
      },
      {
        heading: 'Usage Limits',
        body: 'To keep this service running within what server costs allow, we may limit the number of analyses available per day. If you reach the limit, you can use the service again the next day.',
      },
      {
        heading: 'Limitation of Liability',
        body: 'This app is provided free of charge, and the accuracy of analysis results is not guaranteed. To the extent permitted by law, the developer is not liable for any outcome resulting from use of information from this app.',
      },
      {
        heading: 'Changes to These Terms',
        body: 'These terms may change without prior notice as the service is improved.',
      },
    ],
  },
};

export default function TermsScreen() {
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
