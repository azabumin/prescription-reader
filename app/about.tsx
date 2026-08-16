import { useEffect, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { Link } from 'expo-router';

import { staticPageStyles as s } from '../components/staticPageStyles';
import { detectDefaultLang, STRINGS } from '../lib/i18n';
import { loadLangPref } from '../lib/langPref';
import type { Lang } from '../types';

const CONTENT: Record<Lang, { title: string; sections: { heading?: string; body: string }[] }> = {
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
  vi: {
    title: 'Về Ứng Dụng Này',
    sections: [
      {
        body: 'Trợ Lý Đơn Thuốc là một ứng dụng web miễn phí, đọc ảnh chụp đơn thuốc hoặc nhãn thuốc của bạn và sử dụng AI để giải thích tên thuốc, hướng dẫn liều dùng và các lưu ý bằng ngôn ngữ đơn giản, dễ hiểu.',
      },
      {
        heading: 'Cách Hoạt Động',
        body: 'Khi bạn chụp ảnh, ảnh sẽ được xử lý ngay trong trình duyệt của bạn và gửi đến máy chủ để phân tích. Máy chủ sử dụng mô hình AI thị giác Claude của Anthropic để đọc văn bản trong ảnh và sắp xếp thành bản tóm tắt dễ hiểu.',
      },
      {
        heading: 'Ai Đã Tạo Ra Ứng Dụng Này',
        body: 'Đây là một dự án cá nhân độc lập. Nó không liên kết với bất kỳ công ty, bệnh viện hay nhà thuốc nào — mục tiêu duy nhất là giúp bạn hiểu những gì được ghi trên đơn thuốc của mình.',
      },
    ],
  },
  zh: {
    title: '关于本应用',
    sections: [
      {
        body: '处方助手是一款免费的网页应用,通过读取您拍摄的处方或药品标签照片,使用AI以通俗易懂的语言解释药品名称、用法用量和注意事项。',
      },
      {
        heading: '工作原理',
        body: '拍照后,照片会先在您的浏览器中处理,然后发送到服务器进行分析。服务器使用Anthropic的Claude AI视觉模型读取照片中的文字,并整理成通俗易懂的摘要。',
      },
      {
        heading: '关于开发者',
        body: '这是一个独立的个人副业项目,与任何公司、医院或药房均无关联——唯一目的是帮助您理解处方上所写的内容。',
      },
    ],
  },
  id: {
    title: 'Tentang Aplikasi Ini',
    sections: [
      {
        body: 'Asisten Resep Obat adalah aplikasi web gratis yang membaca foto resep atau label obat Anda dan menggunakan AI untuk menjelaskan nama obat, petunjuk dosis, dan tindakan pencegahan dalam bahasa yang mudah dipahami.',
      },
      {
        heading: 'Cara Kerja',
        body: 'Saat Anda mengambil foto, foto tersebut langsung diproses di browser Anda dan dikirim ke server kami untuk dianalisis. Server menggunakan model AI visi Claude dari Anthropic untuk membaca teks dalam foto dan menyusunnya menjadi ringkasan yang mudah dipahami.',
      },
      {
        heading: 'Siapa yang Membuat Ini',
        body: 'Ini adalah proyek sampingan independen. Tidak berafiliasi dengan perusahaan, rumah sakit, atau apotek mana pun — satu-satunya tujuannya adalah membantu Anda memahami apa yang tertulis pada resep Anda.',
      },
    ],
  },
  tl: {
    title: 'Tungkol sa App na Ito',
    sections: [
      {
        body: 'Ang Katulong sa Reseta ay isang libreng web app na nagbabasa ng litrato ng iyong reseta o label ng gamot at gumagamit ng AI upang ipaliwanag ang mga pangalan ng gamot, tagubilin sa dosis, at mga babala sa simpleng wika.',
      },
      {
        heading: 'Paano Ito Gumagana',
        body: 'Kapag kumuha ka ng litrato, ito ay pinoproseso mismo sa iyong browser at ipinapadala sa aming server para sa pagsusuri. Ginagamit ng server ang Claude AI vision model ng Anthropic upang basahin ang teksto sa litrato at ayusin ito sa isang madaling maunawaang buod.',
      },
      {
        heading: 'Sino ang Gumawa Nito',
        body: 'Ito ay isang independiyenteng side project. Hindi ito kaugnay ng anumang kumpanya, ospital, o parmasya — ang tanging layunin nito ay tulungan kang maunawaan ang nakasulat sa iyong reseta.',
      },
    ],
  },
  th: {
    title: 'เกี่ยวกับแอปนี้',
    sections: [
      {
        body: 'ผู้ช่วยอ่านใบสั่งยาเป็นเว็บแอปฟรีที่อ่านรูปถ่ายใบสั่งยาหรือฉลากยาของคุณ และใช้ AI อธิบายชื่อยา วิธีใช้ยา และข้อควรระวังด้วยภาษาที่เข้าใจง่าย',
      },
      {
        heading: 'วิธีการทำงาน',
        body: 'เมื่อคุณถ่ายรูป รูปภาพจะถูกประมวลผลในเบราว์เซอร์ของคุณทันทีและส่งไปยังเซิร์ฟเวอร์เพื่อวิเคราะห์ เซิร์ฟเวอร์ใช้โมเดล AI วิชั่น Claude ของ Anthropic เพื่ออ่านข้อความในรูปภาพและจัดระเบียบให้เป็นสรุปที่เข้าใจง่าย',
      },
      {
        heading: 'ใครเป็นผู้สร้าง',
        body: 'นี่คือโปรเจกต์ส่วนตัวที่เป็นอิสระ ไม่ได้เกี่ยวข้องกับบริษัท โรงพยาบาล หรือร้านขายยาใดๆ — มีเป้าหมายเดียวคือช่วยให้คุณเข้าใจสิ่งที่เขียนอยู่บนใบสั่งยาของคุณ',
      },
    ],
  },
  my: {
    title: 'ဤအက်ပ်အကြောင်း',
    sections: [
      {
        body: 'ဆေးညွှန်း အကူအညီသည် သင့်ဆေးညွှန်း သို့မဟုတ် ဆေးလိပ်စာအမှတ်တံဆိပ်ကို ဓာတ်ပုံရိုက်ပြီး AI ကို အသုံးပြု၍ ဆေးအမည်၊ သောက်သုံးနည်းလမ်းညွှန်ချက်နှင့် သတိပြုရန်အချက်များကို ရိုးရှင်းသောဘာသာစကားဖြင့် ရှင်းပြပေးသည့် အခမဲ့ ဝဘ်အက်ပ် တစ်ခု ဖြစ်ပါသည်။',
      },
      {
        heading: 'အလုပ်လုပ်ပုံ',
        body: 'သင် ဓာတ်ပုံရိုက်သောအခါ၊ ၎င်းကို သင့်ဘရောက်ဇာတွင် ချက်ချင်း လုပ်ဆောင်ပြီး ခွဲခြမ်းစိတ်ဖြာရန် ဆာဗာသို့ ပေးပို့ပါသည်။ ဆာဗာသည် ဓာတ်ပုံထဲရှိ စာသားကို ဖတ်ရှုရန်နှင့် နားလည်ရလွယ်ကူသော အနှစ်ချုပ်အဖြစ် စုစည်းရန် Anthropic ၏ Claude AI vision မော်ဒယ်ကို အသုံးပြုပါသည်။',
      },
      {
        heading: 'ဘယ်သူကဖန်တီးသလဲ',
        body: 'ဤသည်မှာ လွတ်လပ်သော ကိုယ်ပိုင် ပရောဂျက်တစ်ခု ဖြစ်ပါသည်။ မည်သည့် ကုမ္ပဏီ၊ ဆေးရုံ သို့မဟုတ် ဆေးဆိုင်နှင့်မျှ ချိတ်ဆက်ထားခြင်း မရှိပါ — ရည်ရွယ်ချက်တစ်ခုတည်းမှာ သင့်ဆေးညွှန်းပေါ်တွင် ရေးထားသည်များကို နားလည်စေရန် ကူညီရန်သာ ဖြစ်သည်။',
      },
    ],
  },
  ne: {
    title: 'यस एपको बारेमा',
    sections: [
      {
        body: 'प्रेस्क्रिप्शन सहायक एउटा निःशुल्क वेब एप हो जसले तपाईंको प्रेस्क्रिप्शन वा औषधिको लेबलको फोटो पढेर AI प्रयोग गरी औषधिको नाम, मात्रा निर्देशन, र सावधानीहरू सजिलो भाषामा व्याख्या गर्छ।',
      },
      {
        heading: 'यसले कसरी काम गर्छ',
        body: 'तपाईंले फोटो खिच्दा, यो तपाईंको ब्राउजरमा नै प्रशोधन हुन्छ र विश्लेषणको लागि हाम्रो सर्भरमा पठाइन्छ। सर्भरले फोटोमा रहेको पाठ पढ्न र सजिलै बुझ्न सकिने सारांशमा व्यवस्थित गर्न Anthropic को Claude AI भिजन मोडेल प्रयोग गर्छ।',
      },
      {
        heading: 'यो कसले बनायो',
        body: 'यो एक स्वतन्त्र साइड प्रोजेक्ट हो। यो कुनै कम्पनी, अस्पताल, वा फार्मेसीसँग सम्बद्ध छैन — यसको एकमात्र उद्देश्य तपाईंको प्रेस्क्रिप्शनमा लेखिएको कुरा बुझ्न मद्दत गर्नु हो।',
      },
    ],
  },
  pt: {
    title: 'Sobre Este Aplicativo',
    sections: [
      {
        body: 'O Assistente de Receita é um aplicativo web gratuito que lê uma foto da sua receita ou rótulo de medicamento e usa IA para explicar os nomes dos medicamentos, instruções de dosagem e precauções em linguagem simples.',
      },
      {
        heading: 'Como Funciona',
        body: 'Quando você tira uma foto, ela é processada diretamente no seu navegador e enviada ao nosso servidor para análise. O servidor usa o modelo de visão de IA Claude da Anthropic para ler o texto na foto e organizá-lo em um resumo fácil de entender.',
      },
      {
        heading: 'Quem Fez Isso',
        body: 'Este é um projeto paralelo independente. Não é afiliado a nenhuma empresa, hospital ou farmácia — seu único objetivo é ajudá-lo a entender o que está escrito em sua receita.',
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
  const content = CONTENT[lang];

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
