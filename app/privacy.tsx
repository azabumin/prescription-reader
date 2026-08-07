import { ScrollView, Text, View } from 'react-native';
import { Link } from 'expo-router';

import { staticPageStyles as s } from '../components/staticPageStyles';

export default function PrivacyScreen() {
  return (
    <ScrollView contentContainerStyle={s.container}>
      <Link href="/" style={s.backLink}>
        ← 처방전 도우미로 돌아가기 / 処方箋ヘルパーに戻る
      </Link>

      <View style={s.langBlock}>
        <Text style={s.pageTitle}>개인정보처리방침</Text>
        <Text style={s.muted}>최종 수정일: 2026년 8월</Text>

        <Text style={s.sectionHeading}>사진 처리 방식</Text>
        <Text style={s.body}>
          촬영하거나 선택한 사진은 분석을 위해 서버로 전송되고, Anthropic의 AI 모델로 곧바로 전달됩니다.
          사진은 저희 서버에 저장되지 않으며, 분석이 끝나면 남지 않습니다. 로그인이나 회원가입이 없어 사진을
          특정 개인과 연결해 보관하지 않습니다.
        </Text>

        <Text style={s.sectionHeading}>남기는 정보</Text>
        <Text style={s.body}>
          무료로 계속 서비스하기 위해, 접속 IP 주소를 기준으로 하루 이용 횟수만 24시간 동안 임시로 기록합니다.
          이 정보는 다음 날 자동으로 사라지며, 다른 목적으로 쓰이지 않습니다.
        </Text>

        <Text style={s.sectionHeading}>광고</Text>
        <Text style={s.body}>
          이 사이트는 Google AdSense를 통해 광고를 표시할 수 있습니다. Google은 쿠키를 사용해 관심사 기반
          광고를 보여줄 수 있으며, Google 광고 설정(adssettings.google.com)에서 개인 맞춤 광고를 끌 수
          있습니다.
        </Text>

        <Text style={s.sectionHeading}>문의</Text>
        <Text style={s.body}>이 방침에 대해 궁금한 점이 있으면 앱 저장소(GitHub)의 이슈로 남겨주세요.</Text>
      </View>

      <View style={s.langBlock}>
        <Text style={s.pageTitle}>プライバシーポリシー</Text>
        <Text style={s.muted}>最終更新日: 2026年8月</Text>

        <Text style={s.sectionHeading}>写真の取り扱い</Text>
        <Text style={s.body}>
          撮影または選択した写真は、分析のためサーバーに送信され、そのままAnthropicのAIモデルに渡されます。
          写真は当方のサーバーには保存されず、分析後に残ることはありません。ログインや会員登録がないため、
          写真を特定の個人と結び付けて保存することもありません。
        </Text>

        <Text style={s.sectionHeading}>記録する情報</Text>
        <Text style={s.body}>
          無料でサービスを継続するため、接続元IPアドレスごとの1日あたりの利用回数のみ、24時間だけ一時的に
          記録します。この情報は翌日に自動的に消去され、他の目的には使用しません。
        </Text>

        <Text style={s.sectionHeading}>広告</Text>
        <Text style={s.body}>
          当サイトはGoogle AdSenseを通じて広告を表示する場合があります。Googleはクッキーを使用して興味・関心
          に基づく広告を表示することがあり、Google広告設定(adssettings.google.com)からパーソナライズ広告を
          オフにできます。
        </Text>

        <Text style={s.sectionHeading}>お問い合わせ</Text>
        <Text style={s.body}>
          このポリシーについてご質問がある場合は、アプリのリポジトリ(GitHub)のIssueにてご連絡ください。
        </Text>
      </View>
    </ScrollView>
  );
}
