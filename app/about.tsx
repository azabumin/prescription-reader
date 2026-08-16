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

const CONTENT: Record<ContentLang, { title: string; sections: { heading?: string; body: string }[] }> = {
  ko: {
    title: '이 앱에 대하여',
    sections: [
      {
        body: '처방전 도우미는 처방전이나 약봉투 사진을 찍으면 AI가 약 이름, 복용법, 주의사항을 쉬운 말로 정리해 보여주는 무료 웹 앱입니다.',
      },
      {
        heading: '어떻게 동작하나요',
        body: '사진을 촬영하면 브라우저에서 바로 이미지가 처리되고, 분석을 위해 서버로 전송됩니다. 서버는 Anthropic의 Claude AI 비전 모델을 이용해 사진 속 텍스트를 인식하고, 그 내용을 알아보기 쉬운 형태로 정리해서 돌려줍니다.',
      },
      {
        heading: '누가 만들었나요',
        body: '개인이 만든 사이드 프로젝트입니다. 특정 기업이나 병원·약국과 제휴된 서비스가 아니며, 처방전에 적힌 내용을 이해하기 쉽게 도와드리는 것이 목적입니다.',
      },
    ],
  },
  ja: {
    title: 'このアプリについて',
    sections: [
      {
        body: '処方箋ヘルパーは、処方箋やお薬の袋を撮影すると、AIがお薬の名前・服用方法・注意事項をわかりやすく整理してくれる無料のウェブアプリです。',
      },
      {
        heading: '仕組み',
        body: '写真を撮影すると、ブラウザ上でまず画像が処理され、分析のためサーバーに送信されます。サーバーはAnthropicのClaude AIビジョンモデルを使って写真内のテキストを認識し、わかりやすい形にまとめてお返しします。',
      },
      {
        heading: '制作者について',
        body: '個人が制作したサイドプロジェクトです。特定の企業・病院・薬局と提携したサービスではなく、処方箋の内容を理解しやすくすることを目的としています。',
      },
    ],
  },
  en: {
    title: 'About This App',
    sections: [
      {
        body: 'Prescription Helper is a free web app that reads a photo of your prescription or medication label and uses AI to explain the medication names, dosage instructions, and precautions in plain language.',
      },
      {
        heading: 'How It Works',
        body: "When you take a photo, it's processed right in your browser and sent to our server for analysis. The server uses Anthropic's Claude AI vision model to read the text in the photo and organizes it into an easy-to-understand summary.",
      },
      {
        heading: 'Who Made This',
        body: "This is an independent side project. It isn't affiliated with any company, hospital, or pharmacy — its only goal is to help you understand what's written on your prescription.",
      },
    ],
  },
};

export default function AboutScreen() {
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
        {content.sections.map((section, i) => (
          <View key={i}>
            {section.heading && <Text style={s.sectionHeading}>{section.heading}</Text>}
            <Text style={s.body}>{section.body}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
