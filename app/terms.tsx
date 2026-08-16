import { useEffect, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { Link } from 'expo-router';

import { staticPageStyles as s } from '../components/staticPageStyles';
import { detectDefaultLang, STRINGS } from '../lib/i18n';
import { loadLangPref } from '../lib/langPref';
import type { Lang } from '../types';

const CONTENT: Record<
  Lang,
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
  vi: {
    title: 'Điều Khoản Sử Dụng',
    updated: 'Cập nhật lần cuối: Tháng 8 năm 2026',
    sections: [
      {
        heading: 'Mô Tả Dịch Vụ',
        body: 'Ứng dụng này là một công cụ miễn phí sử dụng AI để phân tích ảnh chụp đơn thuốc hoặc nhãn thuốc và trình bày nội dung dưới dạng dễ hiểu.',
      },
      {
        heading: 'Không Phải Lời Khuyên Y Tế',
        body: 'Thông tin mà ứng dụng này cung cấp là bản diễn giải bằng ngôn ngữ đơn giản của AI về những gì được ghi trong ảnh — đây không phải là chẩn đoán, đơn thuốc, hay lời khuyên y tế. Nếu bạn có thắc mắc hoặc lo lắng về cách dùng thuốc hoặc về sức khỏe của mình, vui lòng tham khảo ý kiến dược sĩ hoặc bác sĩ. Việc nhận dạng có thể không chính xác do chất lượng ảnh, chữ viết tay và các yếu tố tương tự.',
      },
      {
        heading: 'Giới Hạn Sử Dụng',
        body: 'Để duy trì dịch vụ trong phạm vi chi phí máy chủ cho phép, chúng tôi có thể giới hạn số lượt phân tích khả dụng mỗi ngày. Nếu bạn đạt đến giới hạn, bạn có thể sử dụng dịch vụ lại vào ngày hôm sau.',
      },
      {
        heading: 'Giới Hạn Trách Nhiệm',
        body: 'Ứng dụng này được cung cấp miễn phí, và độ chính xác của kết quả phân tích không được đảm bảo. Trong phạm vi pháp luật cho phép, nhà phát triển không chịu trách nhiệm đối với bất kỳ hậu quả nào phát sinh từ việc sử dụng thông tin từ ứng dụng này.',
      },
      {
        heading: 'Thay Đổi Điều Khoản',
        body: 'Các điều khoản này có thể thay đổi mà không cần thông báo trước khi dịch vụ được cải tiến.',
      },
    ],
  },
  zh: {
    title: '使用条款',
    updated: '最后更新:2026年8月',
    sections: [
      {
        heading: '服务说明',
        body: '本应用是一款免费工具,使用AI分析处方或药品标签的照片,并以通俗易懂的形式呈现内容。',
      },
      {
        heading: '并非医疗建议',
        body: '本应用提供的信息是AI对照片中内容的通俗语言复述——并非诊断、处方或医疗建议。如果您对用药方法或健康状况有任何疑问或担忧,请咨询药剂师或医生。由于照片质量、手写字迹等因素,识别结果可能不准确。',
      },
      {
        heading: '使用限制',
        body: '为了在服务器成本允许的范围内维持本服务,我们可能会限制每日可用的分析次数。如果您达到限制,可以在次日再次使用本服务。',
      },
      {
        heading: '责任限制',
        body: '本应用免费提供,不保证分析结果的准确性。在法律允许的范围内,开发者对因使用本应用信息而产生的任何后果不承担责任。',
      },
      { heading: '条款变更', body: '随着服务的改进,本条款可能会在不预先通知的情况下发生变更。' },
    ],
  },
  id: {
    title: 'Ketentuan Penggunaan',
    updated: 'Terakhir diperbarui: Agustus 2026',
    sections: [
      {
        heading: 'Deskripsi Layanan',
        body: 'Aplikasi ini adalah alat gratis yang menggunakan AI untuk menganalisis foto resep atau label obat dan menyajikan isinya dalam bentuk yang mudah dipahami.',
      },
      {
        heading: 'Bukan Nasihat Medis',
        body: 'Informasi yang diberikan aplikasi ini adalah penyampaian ulang oleh AI dalam bahasa sederhana atas apa yang tertulis dalam foto — ini bukan diagnosis, resep, atau nasihat medis. Jika Anda memiliki pertanyaan atau kekhawatiran tentang cara minum obat atau kesehatan Anda, silakan berkonsultasi dengan apoteker atau dokter. Pengenalan mungkin tidak akurat karena kualitas foto, tulisan tangan, dan faktor serupa.',
      },
      {
        heading: 'Batasan Penggunaan',
        body: 'Untuk menjaga layanan ini tetap berjalan sesuai biaya server yang memungkinkan, kami dapat membatasi jumlah analisis yang tersedia per hari. Jika Anda mencapai batas tersebut, Anda dapat menggunakan layanan ini lagi keesokan harinya.',
      },
      {
        heading: 'Batasan Tanggung Jawab',
        body: 'Aplikasi ini disediakan secara gratis, dan keakuratan hasil analisis tidak dijamin. Sejauh diizinkan oleh hukum, pengembang tidak bertanggung jawab atas hasil apa pun yang timbul dari penggunaan informasi dari aplikasi ini.',
      },
      {
        heading: 'Perubahan Ketentuan Ini',
        body: 'Ketentuan ini dapat berubah tanpa pemberitahuan sebelumnya seiring dengan peningkatan layanan.',
      },
    ],
  },
  tl: {
    title: 'Mga Tuntunin ng Paggamit',
    updated: 'Huling na-update: Agosto 2026',
    sections: [
      {
        heading: 'Paglalarawan ng Serbisyo',
        body: 'Ang app na ito ay isang libreng tool na gumagamit ng AI upang suriin ang mga litrato ng reseta o label ng gamot at ipakita ang mga nilalaman sa isang madaling maunawaang anyo.',
      },
      {
        heading: 'Hindi Medikal na Payo',
        body: 'Ang impormasyong ibinibigay ng app na ito ay muling pagsasabi ng AI sa simpleng wika ng nakasulat sa litrato — hindi ito diagnosis, reseta, o medikal na payo. Kung may mga tanong o alalahanin ka tungkol sa pag-inom ng iyong gamot o sa iyong kalusugan, mangyaring kumonsulta sa isang parmasyutiko o doktor. Maaaring hindi tumpak ang pagkilala dahil sa kalidad ng litrato, sulat-kamay, at katulad na mga salik.',
      },
      {
        heading: 'Mga Limitasyon sa Paggamit',
        body: 'Upang mapanatili ang serbisyong ito sa loob ng kayang gastusin sa server, maaari naming limitahan ang bilang ng mga magagamit na pagsusuri bawat araw. Kung maabot mo ang limitasyon, maaari mong gamitin muli ang serbisyo sa susunod na araw.',
      },
      {
        heading: 'Limitasyon ng Pananagutan',
        body: 'Ang app na ito ay ibinibigay nang libre, at ang katumpakan ng mga resulta ng pagsusuri ay hindi ginagarantiyahan. Hanggang sa saklaw na pinahihintulutan ng batas, ang developer ay hindi mananagot para sa anumang kinalabasan mula sa paggamit ng impormasyon mula sa app na ito.',
      },
      {
        heading: 'Mga Pagbabago sa mga Tuntuning Ito',
        body: 'Maaaring magbago ang mga tuntuning ito nang walang paunang abiso habang pinapabuti ang serbisyo.',
      },
    ],
  },
  th: {
    title: 'ข้อกำหนดการใช้งาน',
    updated: 'อัปเดตล่าสุด: สิงหาคม 2026',
    sections: [
      {
        heading: 'รายละเอียดบริการ',
        body: 'แอปนี้เป็นเครื่องมือฟรีที่ใช้ AI วิเคราะห์รูปถ่ายใบสั่งยาหรือฉลากยา และนำเสนอเนื้อหาในรูปแบบที่เข้าใจง่าย',
      },
      {
        heading: 'ไม่ใช่คำแนะนำทางการแพทย์',
        body: 'ข้อมูลที่แอปนี้ให้มาเป็นการอธิบายซ้ำด้วยภาษาง่ายๆ ของ AI จากสิ่งที่เขียนอยู่ในรูปภาพ — ไม่ใช่การวินิจฉัย ใบสั่งยา หรือคำแนะนำทางการแพทย์ หากคุณมีคำถามหรือข้อกังวลเกี่ยวกับวิธีการใช้ยาหรือสุขภาพของคุณ กรุณาปรึกษาเภสัชกรหรือแพทย์ การจดจำอาจไม่ถูกต้องเนื่องจากคุณภาพของรูปภาพ ลายมือ และปัจจัยที่คล้ายกัน',
      },
      {
        heading: 'ข้อจำกัดในการใช้งาน',
        body: 'เพื่อให้บริการนี้ดำเนินต่อไปได้ภายในงบประมาณค่าเซิร์ฟเวอร์ เราอาจจำกัดจำนวนการวิเคราะห์ที่ใช้ได้ต่อวัน หากคุณถึงขีดจำกัดแล้ว คุณสามารถใช้บริการอีกครั้งในวันถัดไป',
      },
      {
        heading: 'ข้อจำกัดความรับผิดชอบ',
        body: 'แอปนี้ให้บริการฟรี และไม่รับประกันความถูกต้องของผลการวิเคราะห์ ภายในขอบเขตที่กฎหมายอนุญาต ผู้พัฒนาจะไม่รับผิดชอบต่อผลลัพธ์ใดๆ ที่เกิดจากการใช้ข้อมูลจากแอปนี้',
      },
      {
        heading: 'การเปลี่ยนแปลงข้อกำหนดเหล่านี้',
        body: 'ข้อกำหนดเหล่านี้อาจเปลี่ยนแปลงได้โดยไม่ต้องแจ้งล่วงหน้าเมื่อมีการปรับปรุงบริการ',
      },
    ],
  },
  my: {
    title: 'အသုံးပြုမှု စည်းမျဉ်းများ',
    updated: 'နောက်ဆုံးမွမ်းမံသည့်ရက်: ၂၀၂၆ ခုနှစ် သြဂုတ်လ',
    sections: [
      {
        heading: 'ဝန်ဆောင်မှု ဖော်ပြချက်',
        body: 'ဤအက်ပ်သည် ဆေးညွှန်း သို့မဟုတ် ဆေးလိပ်စာအမှတ်တံဆိပ်များ၏ ဓာတ်ပုံများကို ခွဲခြမ်းစိတ်ဖြာရန်နှင့် အကြောင်းအရာများကို နားလည်ရလွယ်ကူသော ပုံစံဖြင့် တင်ပြရန် AI ကို အသုံးပြုသည့် အခမဲ့ ကိရိယာတစ်ခု ဖြစ်ပါသည်။',
      },
      {
        heading: 'ဆေးဘက်ဆိုင်ရာ အကြံဉာဏ် မဟုတ်ပါ',
        body: 'ဤအက်ပ်မှ ပေးသော အချက်အလက်သည် ဓာတ်ပုံထဲတွင် ရေးထားသည်များကို AI မှ ရိုးရှင်းသောဘာသာစကားဖြင့် ပြန်ပြောပြခြင်းသာ ဖြစ်ပြီး — ၎င်းသည် ရောဂါရှာဖွေမှု၊ ဆေးညွှန်း သို့မဟုတ် ဆေးဘက်ဆိုင်ရာ အကြံဉာဏ် မဟုတ်ပါ။ ဆေးသောက်ပုံ သို့မဟုတ် သင့်ကျန်းမာရေးနှင့် ပတ်သက်၍ မေးခွန်းများ သို့မဟုတ် စိုးရိမ်မှုများ ရှိပါက ဆေးဆိုင်သမား သို့မဟုတ် ဆရာဝန်ကို တိုင်ပင်ပါ။ ဓာတ်ပုံအရည်အသွေး၊ လက်ရေးနှင့် အလားတူ အချက်များကြောင့် အသိအမှတ်ပြုမှု မမှန်ကန်နိုင်ပါ။',
      },
      {
        heading: 'အသုံးပြုမှု ကန့်သတ်ချက်များ',
        body: 'ဤဝန်ဆောင်မှုကို ဆာဗာကုန်ကျစရိတ် ခွင့်ပြုသည့်ပမာဏအတွင်း ဆက်လက်လုပ်ဆောင်နိုင်ရန်၊ တစ်နေ့လျှင် ရရှိနိုင်သည့် ခွဲခြမ်းစိတ်ဖြာမှု အရေအတွက်ကို ကန့်သတ်ထားနိုင်ပါသည်။ ကန့်သတ်ချက်သို့ ရောက်ရှိပါက၊ နောက်တစ်နေ့တွင် ဝန်ဆောင်မှုကို ထပ်မံ အသုံးပြုနိုင်ပါသည်။',
      },
      {
        heading: 'တာဝန်ခံမှု ကန့်သတ်ချက်',
        body: 'ဤအက်ပ်ကို အခမဲ့ ပေးထားပြီး ခွဲခြမ်းစိတ်ဖြာမှု ရလဒ်များ၏ တိကျမှုကို အာမမခံပါ။ ဥပဒေ ခွင့်ပြုသည့် အတိုင်းအတာအထိ၊ ဤအက်ပ်မှ အချက်အလက်ကို အသုံးပြုခြင်းကြောင့် ဖြစ်ပေါ်လာသည့် မည်သည့်ရလဒ်အတွက်မဆို ဖန်တီးသူတွင် တာဝန်မရှိပါ။',
      },
      {
        heading: 'ဤစည်းမျဉ်းများ ပြောင်းလဲခြင်း',
        body: 'ဝန်ဆောင်မှု တိုးတက်လာသည်နှင့်အမျှ ဤစည်းမျဉ်းများကို ကြိုတင်အကြောင်းကြားခြင်း မရှိဘဲ ပြောင်းလဲနိုင်ပါသည်။',
      },
    ],
  },
  ne: {
    title: 'प्रयोगका सर्तहरू',
    updated: 'अन्तिम अद्यावधिक: अगस्ट २०२६',
    sections: [
      {
        heading: 'सेवा विवरण',
        body: 'यो एप एक निःशुल्क उपकरण हो जसले प्रेस्क्रिप्शन वा औषधिको लेबलका फोटोहरू विश्लेषण गर्न र सामग्रीलाई सजिलै बुझ्न सकिने रूपमा प्रस्तुत गर्न AI प्रयोग गर्छ।',
      },
      {
        heading: 'चिकित्सा सल्लाह होइन',
        body: 'यो एपले प्रदान गर्ने जानकारी फोटोमा लेखिएको कुराको AI को सरल भाषामा पुनःकथन हो — यो निदान, प्रेस्क्रिप्शन, वा चिकित्सा सल्लाह होइन। यदि तपाईंसँग औषधि सेवन वा स्वास्थ्यको बारेमा प्रश्न वा चिन्ता छ भने, कृपया फार्मासिस्ट वा डाक्टरसँग परामर्श लिनुहोस्। फोटोको गुणस्तर, हस्तलेखन, र समान कारकहरूको कारण पहिचान अशुद्ध हुन सक्छ।',
      },
      {
        heading: 'प्रयोग सीमाहरू',
        body: 'यो सेवालाई सर्भर लागतले अनुमति दिने दायराभित्र चलिरहन, हामीले प्रति दिन उपलब्ध विश्लेषण संख्या सीमित गर्न सक्छौं। यदि तपाईं सीमामा पुग्नुभयो भने, भोलिपल्ट फेरि सेवा प्रयोग गर्न सक्नुहुन्छ।',
      },
      {
        heading: 'दायित्व सीमा',
        body: 'यो एप निःशुल्क प्रदान गरिएको छ, र विश्लेषण परिणामको शुद्धताको ग्यारेन्टी छैन। कानूनले अनुमति दिएको हदसम्म, यो एपबाट प्राप्त जानकारी प्रयोग गर्दा हुने कुनै पनि परिणामको लागि विकासकर्ता जिम्मेवार हुँदैन।',
      },
      {
        heading: 'यी सर्तहरूमा परिवर्तनहरू',
        body: 'सेवा सुधार हुँदै जाँदा यी सर्तहरू पूर्व सूचना बिना परिवर्तन हुन सक्छन्।',
      },
    ],
  },
  pt: {
    title: 'Termos de Uso',
    updated: 'Última atualização: agosto de 2026',
    sections: [
      {
        heading: 'Descrição do Serviço',
        body: 'Este aplicativo é uma ferramenta gratuita que usa IA para analisar fotos de receitas ou rótulos de medicamentos e apresentar o conteúdo de forma fácil de entender.',
      },
      {
        heading: 'Não É Aconselhamento Médico',
        body: 'As informações fornecidas por este aplicativo são uma reformulação em linguagem simples pela IA do que está escrito na foto — não é um diagnóstico, receita ou aconselhamento médico. Se você tiver dúvidas ou preocupações sobre como tomar seu medicamento ou sobre sua saúde, consulte um farmacêutico ou médico. O reconhecimento pode ser impreciso devido à qualidade da foto, caligrafia e fatores semelhantes.',
      },
      {
        heading: 'Limites de Uso',
        body: 'Para manter este serviço dentro do que os custos de servidor permitem, podemos limitar o número de análises disponíveis por dia. Se você atingir o limite, poderá usar o serviço novamente no dia seguinte.',
      },
      {
        heading: 'Limitação de Responsabilidade',
        body: 'Este aplicativo é fornecido gratuitamente, e a precisão dos resultados da análise não é garantida. Na medida permitida por lei, o desenvolvedor não se responsabiliza por qualquer resultado decorrente do uso das informações deste aplicativo.',
      },
      {
        heading: 'Alterações a Estes Termos',
        body: 'Estes termos podem mudar sem aviso prévio à medida que o serviço é aprimorado.',
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
  const content = CONTENT[lang];

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
