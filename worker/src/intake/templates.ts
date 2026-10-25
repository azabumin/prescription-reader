// Fixed pharmacy -> patient texts, translated ahead of time. The Japanese and the ko/en/zh/vi versions come from
// the demo the pharmacist reviewed; the other languages were added for the app's 11.
// STATUS_TEXT is also shown on the patient's status screen -- keep in sync with lib/sendStrings.ts.
import type { Lang } from './types';

export type TemplateKey = 't1' | 't2' | 't3' | 't4' | 't5';

export const REPLY_TEMPLATES: { key: TemplateKey; text: Record<Lang, string> }[] = [
  {
    key: 't1',
    text: {
      ja: '在庫が足りないため、一部のお薬は明日以降のお渡しになります。',
      ko: '재고가 부족하여 일부 약은 내일 이후에 드립니다.',
      en: 'We do not have enough of some medicines, so part of your medicine will be ready from tomorrow.',
      zh: '由于库存不足，部分药品将在明天以后交给您。',
      vi: 'Do thiếu hàng, một số thuốc sẽ được giao từ ngày mai trở đi.',
      id: 'Karena stok tidak cukup, sebagian obat Anda baru dapat diberikan mulai besok.',
      tl: 'Dahil kulang ang stock, ang ilan sa inyong gamot ay maibibigay simula bukas.',
      th: 'เนื่องจากยามีไม่พอ ยาบางส่วนจะจ่ายให้ได้ตั้งแต่วันพรุ่งนี้เป็นต้นไป',
      my: 'ဆေးလက်ကျန် မလုံလောက်သောကြောင့် ဆေးအချို့ကို မနက်ဖြန်မှစ၍ ပေးပါမည်။',
      ne: 'स्टक नपुग्ने भएकाले केही औषधि भोलिदेखि मात्र दिन सकिन्छ।',
      pt: 'Como não temos estoque suficiente, parte dos seus remédios será entregue a partir de amanhã.',
    },
  },
  {
    key: 't2',
    text: {
      ja: '保険証（マイナ保険証）とお薬手帳を持ってきてください。',
      ko: '건강보험증(마이나 보험증)과 약 수첩을 가져와 주세요.',
      en: 'Please bring your health insurance card (or My Number insurance card) and your medicine notebook.',
      zh: '请带上健康保险证（或个人编号保险证）和用药手册。',
      vi: 'Vui lòng mang theo thẻ bảo hiểm y tế (hoặc thẻ My Number dùng làm bảo hiểm) và sổ tay thuốc.',
      id: 'Mohon bawa kartu asuransi kesehatan (atau kartu My Number untuk asuransi) dan buku catatan obat Anda.',
      tl: 'Pakidala ang inyong health insurance card (o My Number insurance card) at ang inyong medicine notebook.',
      th: 'กรุณานำบัตรประกันสุขภาพ (หรือบัตร My Number ที่ใช้เป็นบัตรประกัน) และสมุดบันทึกยามาด้วย',
      my: 'ကျန်းမာရေးအာမခံကတ် (သို့မဟုတ် My Number အာမခံကတ်) နှင့် ဆေးမှတ်တမ်းစာအုပ်ကို ယူလာပါ။',
      ne: 'कृपया स्वास्थ्य बीमा कार्ड (वा My Number बीमा कार्ड) र औषधि पुस्तिका लिएर आउनुहोस्।',
      pt: 'Por favor, traga seu cartão do seguro de saúde (ou cartão My Number como seguro) e sua caderneta de medicamentos.',
    },
  },
  {
    key: 't3',
    text: {
      ja: 'ジェネリック医薬品（後発品）に変えてもよろしいですか。来局時にお聞かせください。',
      ko: '제네릭 의약품(복제약)으로 바꿔도 될까요? 오실 때 알려 주세요.',
      en: 'Is it OK to switch to a generic medicine? Please let us know when you come.',
      zh: '可以换成仿制药吗？请在来药店时告诉我们。',
      vi: 'Có thể đổi sang thuốc generic không? Vui lòng cho chúng tôi biết khi bạn đến.',
      id: 'Apakah boleh diganti dengan obat generik? Mohon beri tahu kami saat Anda datang.',
      tl: 'Puwede bang palitan ng generic na gamot? Pakisabi sa amin pagdating ninyo.',
      th: 'เปลี่ยนเป็นยาชื่อสามัญ (generic) ได้หรือไม่ กรุณาแจ้งเราเมื่อมาที่ร้านยา',
      my: 'ဂျင်နရစ်ဆေး (generic) သို့ ပြောင်းပေးလျှင် ရပါသလား။ ဆေးဆိုင်သို့ လာသောအခါ ပြောပြပေးပါ။',
      ne: 'जेनेरिक औषधिमा बदल्न मिल्छ? आउँदा हामीलाई भन्नुहोस्।',
      pt: 'Podemos trocar por um medicamento genérico? Por favor, nos diga quando vier.',
    },
  },
  {
    key: 't4',
    text: {
      ja: 'お薬の飲み方について、来局時にご説明します。少しお時間をください。',
      ko: '약 복용 방법은 오실 때 설명해 드립니다. 잠시 시간을 내 주세요.',
      en: 'We will explain how to take your medicine when you come. Please allow a little time.',
      zh: '来药店时，我们会说明服药方法。请预留一点时间。',
      vi: 'Chúng tôi sẽ giải thích cách dùng thuốc khi bạn đến. Xin vui lòng dành một chút thời gian.',
      id: 'Kami akan menjelaskan cara minum obat saat Anda datang. Mohon sediakan sedikit waktu.',
      tl: 'Ipapaliwanag namin kung paano inumin ang gamot pagdating ninyo. Pakiusap, maglaan ng kaunting oras.',
      th: 'เราจะอธิบายวิธีใช้ยาเมื่อคุณมาที่ร้านยา กรุณาเผื่อเวลาไว้เล็กน้อย',
      my: 'ဆေးဆိုင်သို့ လာသောအခါ ဆေးသောက်နည်းကို ရှင်းပြပေးပါမည်။ အချိန်အနည်းငယ် ပေးပါ။',
      ne: 'आउँदा औषधि कसरी खाने भनेर बुझाउनेछौं। कृपया अलिकति समय दिनुहोस्।',
      pt: 'Vamos explicar como tomar o remédio quando você vier. Por favor, reserve um pouco de tempo.',
    },
  },
  {
    key: 't5',
    text: {
      ja: '本日は19時で閉局します。それまでにお越しください。',
      ko: '오늘은 19시에 문을 닫습니다. 그 전에 와 주세요.',
      en: 'We close at 7:00 PM today. Please come before then.',
      zh: '本店今天19点关门，请在此之前来取药。',
      vi: 'Hôm nay nhà thuốc đóng cửa lúc 19 giờ. Vui lòng đến trước giờ đó.',
      id: 'Hari ini apotek tutup pukul 19.00. Mohon datang sebelum itu.',
      tl: 'Magsasara ang botika ngayong araw nang 7:00 PM. Pakiusap, pumunta bago iyon.',
      th: 'วันนี้ร้านยาปิดเวลา 19.00 น. กรุณามาก่อนเวลานั้น',
      my: 'ယနေ့ ဆေးဆိုင်ကို ညနေ ၇ နာရီ (19:00) တွင် ပိတ်ပါမည်။ ထိုမတိုင်မီ လာပါ။',
      ne: 'आज फार्मेसी साँझ ७ बजे (19:00) बन्द हुन्छ। कृपया त्यसअघि आउनुहोस्।',
      pt: 'Hoje a farmácia fecha às 19h. Por favor, venha antes disso.',
    },
  },
];

// The pharmacy's reply buttons as the patient reads them. `later` contains {time}.
export const STATUS_TEXT: Record<'ready' | 'inquiry' | 'later', Record<Lang, string>> = {
  ready: {
    ja: '薬の準備ができました。',
    ko: '약이 준비되었습니다.',
    en: 'Your medicine is ready.',
    zh: '您的药已经准备好了。',
    vi: 'Thuốc của bạn đã sẵn sàng.',
    id: 'Obat Anda sudah siap.',
    tl: 'Handa na ang inyong gamot.',
    th: 'ยาของคุณพร้อมแล้ว',
    my: 'သင့်ဆေး အဆင်သင့် ဖြစ်ပါပြီ။',
    ne: 'तपाईंको औषधि तयार छ।',
    pt: 'Seu remédio está pronto.',
  },
  inquiry: {
    ja: '薬局が病院に確認しています。少し時間がかかります。',
    ko: '약국이 병원에 확인하고 있습니다. 조금 시간이 걸립니다.',
    en: 'The pharmacy is checking with your doctor. It may take a little longer.',
    zh: '药店正在向医院确认，需要一些时间。',
    vi: 'Nhà thuốc đang xác nhận với bác sĩ. Có thể mất thêm thời gian.',
    id: 'Apotek sedang mengonfirmasi ke dokter. Mungkin perlu sedikit waktu.',
    tl: 'Kinukumpirma ng botika sa inyong doktor. Maaaring medyo matagalan.',
    th: 'ร้านยากำลังสอบถามกับแพทย์ อาจใช้เวลาสักครู่',
    my: 'ဆေးဆိုင်က ဆရာဝန်ထံ အတည်ပြုနေပါသည်။ အချိန်အနည်းငယ် ကြာနိုင်ပါသည်။',
    ne: 'फार्मेसीले डाक्टरसँग पुष्टि गर्दैछ। अलिकति समय लाग्न सक्छ।',
    pt: 'A farmácia está confirmando com o seu médico. Pode demorar um pouco.',
  },
  later: {
    ja: '{time}から受け取れます。',
    ko: '{time}부터 받을 수 있습니다.',
    en: 'You can pick it up from {time}.',
    zh: '{time}以后可以取药。',
    vi: 'Bạn có thể nhận thuốc từ {time}.',
    id: 'Anda dapat mengambilnya mulai pukul {time}.',
    tl: 'Maaari ninyo itong kunin simula {time}.',
    th: 'สามารถรับยาได้ตั้งแต่เวลา {time}',
    my: '{time} မှစ၍ လာယူနိုင်ပါသည်။',
    ne: '{time} देखि लिन सक्नुहुन्छ।',
    pt: 'Você pode retirar a partir das {time}.',
  },
};

export const LATER_TIMES = ['17:00', '18:00', '19:00', '20:00'] as const;
