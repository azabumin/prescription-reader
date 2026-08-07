import { ScrollView, Text, View } from 'react-native';
import { Link } from 'expo-router';

import { staticPageStyles as s } from '../components/staticPageStyles';

export default function AboutScreen() {
  return (
    <ScrollView contentContainerStyle={s.container}>
      <Link href="/" style={s.backLink}>
        ← 처방전 도우미로 돌아가기 / 処方箋ヘルパーに戻る
      </Link>

      <View style={s.langBlock}>
        <Text style={s.pageTitle}>이 앱에 대하여</Text>
        <Text style={s.body}>
          처방전 도우미는 처방전이나 약봉투 사진을 찍으면 AI가 약 이름, 복용법, 주의사항을 쉬운 말로 정리해
          보여주는 무료 웹 앱입니다.
        </Text>
        <Text style={s.sectionHeading}>어떻게 동작하나요</Text>
        <Text style={s.body}>
          사진을 촬영하면 브라우저에서 바로 이미지가 처리되고, 분석을 위해 서버로 전송됩니다. 서버는 Anthropic의
          Claude AI 비전 모델을 이용해 사진 속 텍스트를 인식하고, 그 내용을 알아보기 쉬운 형태로 정리해서
          돌려줍니다.
        </Text>
        <Text style={s.sectionHeading}>누가 만들었나요</Text>
        <Text style={s.body}>
          개인이 만든 사이드 프로젝트입니다. 특정 기업이나 병원·약국과 제휴된 서비스가 아니며, 처방전에 적힌
          내용을 이해하기 쉽게 도와드리는 것이 목적입니다.
        </Text>
      </View>

      <View style={s.langBlock}>
        <Text style={s.pageTitle}>このアプリについて</Text>
        <Text style={s.body}>
          処方箋ヘルパーは、処方箋やお薬の袋を撮影すると、AIがお薬の名前・服用方法・注意事項をわかりやすく
          整理してくれる無料のウェブアプリです。
        </Text>
        <Text style={s.sectionHeading}>仕組み</Text>
        <Text style={s.body}>
          写真を撮影すると、ブラウザ上でまず画像が処理され、分析のためサーバーに送信されます。サーバーは
          AnthropicのClaude AIビジョンモデルを使って写真内のテキストを認識し、わかりやすい形にまとめてお返し
          します。
        </Text>
        <Text style={s.sectionHeading}>制作者について</Text>
        <Text style={s.body}>
          個人が制作したサイドプロジェクトです。特定の企業・病院・薬局と提携したサービスではなく、処方箋の
          内容を理解しやすくすることを目的としています。
        </Text>
      </View>
    </ScrollView>
  );
}
