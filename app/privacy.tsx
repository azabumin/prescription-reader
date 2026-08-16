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
  vi: {
    title: 'Chính Sách Bảo Mật',
    updated: 'Cập nhật lần cuối: Tháng 8 năm 2026',
    sections: [
      {
        heading: 'Cách Xử Lý Ảnh',
        body: 'Ảnh bạn chụp hoặc chọn sẽ được gửi đến máy chủ của chúng tôi để phân tích và chuyển trực tiếp đến mô hình AI của Anthropic. Ảnh không được lưu trữ trên máy chủ của chúng tôi, và không có gì còn lại sau khi phân tích hoàn tất. Không có hệ thống đăng nhập hay tài khoản, vì vậy ảnh không bao giờ được lưu trữ theo cách liên kết với một cá nhân cụ thể.',
      },
      {
        heading: 'Thông Tin Chúng Tôi Lưu Giữ',
        body: 'Để duy trì dịch vụ miễn phí, chúng tôi chỉ tạm thời ghi lại số lượt phân tích hàng ngày theo địa chỉ IP, trong vòng 24 giờ. Thông tin này sẽ tự động bị xóa vào ngày hôm sau và không được sử dụng cho bất kỳ mục đích nào khác.',
      },
      {
        heading: 'Lịch Sử Đã Lưu & Nhắc Nhở Lịch',
        body: 'Kết quả phân tích (tên thuốc, lịch trình dùng thuốc, v.v. dưới dạng văn bản) chỉ được lưu trong trình duyệt của thiết bị này để bạn có thể xem lại sau. Ảnh không bao giờ được bao gồm trong bộ nhớ này và không bao giờ được gửi đi bất cứ đâu. Tính năng "Thêm Vào Lịch" tạo và tải xuống tệp trực tiếp trên thiết bị của bạn — nó không bao giờ gửi bất kỳ thông tin nào đến máy chủ của chúng tôi hoặc bên thứ ba.',
      },
      {
        heading: 'Quảng Cáo',
        body: 'Trang web này có thể hiển thị quảng cáo thông qua Google AdSense. Google có thể sử dụng cookie để hiển thị quảng cáo dựa trên sở thích; bạn có thể tắt quảng cáo cá nhân hóa tại Cài đặt Quảng cáo của Google (adssettings.google.com).',
      },
      {
        heading: 'Liên Hệ',
        body: 'Nếu bạn có thắc mắc về chính sách này, vui lòng mở một issue trên kho lưu trữ GitHub của ứng dụng.',
      },
    ],
  },
  zh: {
    title: '隐私政策',
    updated: '最后更新:2026年8月',
    sections: [
      {
        heading: '照片处理方式',
        body: '您拍摄或选择的照片会被发送到我们的服务器进行分析,并直接传递给Anthropic的AI模型。照片不会存储在我们的服务器上,分析完成后不会留下任何痕迹。由于没有登录或账户系统,照片永远不会以与特定个人关联的方式被存储。',
      },
      {
        heading: '我们保留的信息',
        body: '为了保持本服务免费,我们仅临时记录每个IP地址每日的分析次数,保留24小时。该信息将在次日自动删除,不会用于任何其他目的。',
      },
      {
        heading: '保存的历史记录与日历提醒',
        body: '分析结果(药品名称、服药时间表等文本内容)仅保存在本设备的浏览器中,以便您日后查看。照片绝不会包含在此存储中,也绝不会被发送到任何地方。"添加到日历"功能会直接在您的设备上创建并下载文件——它绝不会向我们的服务器或第三方发送任何信息。',
      },
      {
        heading: '广告',
        body: '本网站可能通过Google AdSense展示广告。Google可能使用Cookie显示基于兴趣的广告;您可以在Google广告设置(adssettings.google.com)中关闭个性化广告。',
      },
      { heading: '联系我们', body: '如果您对本政策有任何疑问,请在应用的GitHub仓库中提交issue。' },
    ],
  },
  id: {
    title: 'Kebijakan Privasi',
    updated: 'Terakhir diperbarui: Agustus 2026',
    sections: [
      {
        heading: 'Cara Foto Ditangani',
        body: 'Foto yang Anda ambil atau pilih dikirim ke server kami untuk dianalisis dan diteruskan langsung ke model AI Anthropic. Foto tidak disimpan di server kami, dan tidak ada yang tersisa setelah analisis selesai. Tidak ada sistem login atau akun, sehingga foto tidak pernah disimpan dengan cara yang terhubung ke individu tertentu.',
      },
      {
        heading: 'Informasi yang Kami Simpan',
        body: 'Untuk menjaga layanan ini tetap gratis, kami hanya mencatat sementara jumlah analisis harian per alamat IP, selama 24 jam. Informasi ini akan otomatis terhapus keesokan harinya dan tidak digunakan untuk tujuan lain.',
      },
      {
        heading: 'Riwayat Tersimpan & Pengingat Kalender',
        body: 'Hasil analisis (nama obat, jadwal dosis, dll. sebagai teks) hanya disimpan di browser perangkat ini agar Anda dapat melihatnya kembali nanti. Foto tidak pernah disertakan dalam penyimpanan ini dan tidak pernah dikirim ke mana pun. Fitur "Tambahkan ke Kalender" membuat dan mengunduh file langsung di perangkat Anda — fitur ini tidak pernah mengirim informasi apa pun ke server kami atau pihak ketiga.',
      },
      {
        heading: 'Iklan',
        body: 'Situs ini mungkin menampilkan iklan melalui Google AdSense. Google dapat menggunakan cookie untuk menampilkan iklan berbasis minat; Anda dapat menonaktifkan iklan yang dipersonalisasi di Setelan Iklan Google (adssettings.google.com).',
      },
      {
        heading: 'Kontak',
        body: 'Jika Anda memiliki pertanyaan tentang kebijakan ini, silakan buka issue di repositori GitHub aplikasi.',
      },
    ],
  },
  tl: {
    title: 'Patakaran sa Privacy',
    updated: 'Huling na-update: Agosto 2026',
    sections: [
      {
        heading: 'Paano Hinahawakan ang mga Larawan',
        body: 'Ang mga larawang kinuha o pinili mo ay ipinapadala sa aming server para sa pagsusuri at direktang ipinapasa sa AI model ng Anthropic. Hindi nakaimbak ang mga larawan sa aming server, at walang naiiwan kapag tapos na ang pagsusuri. Walang sistema ng pag-login o account, kaya hindi kailanman naiimbak ang mga larawan sa paraang naka-link sa isang partikular na tao.',
      },
      {
        heading: 'Impormasyong Iniimbak Namin',
        body: 'Upang mapanatiling libre ang serbisyong ito, pansamantala lang naming itinatala ang bilang ng pang-araw-araw na pagsusuri kada IP address, sa loob ng 24 oras. Awtomatikong buburahin ang impormasyong ito kinabukasan at hindi ito ginagamit para sa anumang ibang layunin.',
      },
      {
        heading: 'Naka-save na Kasaysayan at Paalala sa Kalendaryo',
        body: 'Ang mga resulta ng pagsusuri (mga pangalan ng gamot, iskedyul ng pag-inom, atbp. bilang teksto) ay naka-save lamang sa browser ng device na ito upang mabalikan mo ang mga ito sa ibang pagkakataon. Hindi kailanman kasama ang mga larawan sa storage na ito at hindi kailanman ipinapadala kahit saan. Ang feature na "Idagdag sa Kalendaryo" ay gumagawa at nagda-download ng file direkta sa iyong device — hindi ito kailanman nagpapadala ng anumang impormasyon sa aming server o sa third party.',
      },
      {
        heading: 'Advertising',
        body: 'Maaaring magpakita ang site na ito ng mga ad sa pamamagitan ng Google AdSense. Maaaring gumamit ang Google ng cookies upang magpakita ng mga ad batay sa interes; maaari mong i-off ang mga personalized na ad sa Ad Settings ng Google (adssettings.google.com).',
      },
      {
        heading: 'Makipag-ugnayan',
        body: 'Kung may mga tanong ka tungkol sa patakarang ito, mangyaring mag-open ng issue sa GitHub repository ng app.',
      },
    ],
  },
  th: {
    title: 'นโยบายความเป็นส่วนตัว',
    updated: 'อัปเดตล่าสุด: สิงหาคม 2026',
    sections: [
      {
        heading: 'วิธีจัดการรูปภาพ',
        body: 'รูปภาพที่คุณถ่ายหรือเลือกจะถูกส่งไปยังเซิร์ฟเวอร์ของเราเพื่อวิเคราะห์และส่งต่อไปยังโมเดล AI ของ Anthropic โดยตรง รูปภาพจะไม่ถูกจัดเก็บบนเซิร์ฟเวอร์ของเรา และจะไม่มีสิ่งใดหลงเหลืออยู่หลังจากวิเคราะห์เสร็จสิ้น เนื่องจากไม่มีระบบเข้าสู่ระบบหรือบัญชีผู้ใช้ รูปภาพจึงไม่เคยถูกจัดเก็บในลักษณะที่เชื่อมโยงกับบุคคลใดบุคคลหนึ่ง',
      },
      {
        heading: 'ข้อมูลที่เราเก็บไว้',
        body: 'เพื่อให้บริการนี้ฟรีต่อไป เราจะบันทึกจำนวนการวิเคราะห์รายวันต่อที่อยู่ IP เพียงชั่วคราวเป็นเวลา 24 ชั่วโมงเท่านั้น ข้อมูลนี้จะถูกลบโดยอัตโนมัติในวันถัดไปและไม่ถูกนำไปใช้เพื่อวัตถุประสงค์อื่นใด',
      },
      {
        heading: 'ประวัติที่บันทึกไว้และการแจ้งเตือนในปฏิทิน',
        body: 'ผลการวิเคราะห์ (ชื่อยา ตารางการใช้ยา ฯลฯ ในรูปแบบข้อความ) จะถูกบันทึกไว้ในเบราว์เซอร์ของอุปกรณ์นี้เท่านั้น เพื่อให้คุณย้อนกลับมาดูได้ในภายหลัง รูปภาพจะไม่ถูกรวมอยู่ในการจัดเก็บนี้และจะไม่ถูกส่งไปที่ใดเลย ฟีเจอร์ "เพิ่มลงในปฏิทิน" จะสร้างและดาวน์โหลดไฟล์โดยตรงบนอุปกรณ์ของคุณ — จะไม่ส่งข้อมูลใดๆ ไปยังเซิร์ฟเวอร์ของเราหรือบุคคลที่สาม',
      },
      {
        heading: 'โฆษณา',
        body: 'เว็บไซต์นี้อาจแสดงโฆษณาผ่าน Google AdSense Google อาจใช้คุกกี้เพื่อแสดงโฆษณาตามความสนใจ คุณสามารถปิดโฆษณาที่ปรับให้เหมาะกับคุณได้ที่การตั้งค่าโฆษณาของ Google (adssettings.google.com)',
      },
      {
        heading: 'ติดต่อเรา',
        body: 'หากคุณมีคำถามเกี่ยวกับนโยบายนี้ กรุณาเปิด issue บน GitHub repository ของแอป',
      },
    ],
  },
  my: {
    title: 'ကိုယ်ရေးအချက်အလက် မူဝါဒ',
    updated: 'နောက်ဆုံးမွမ်းမံသည့်ရက်: ၂၀၂၆ ခုနှစ် သြဂုတ်လ',
    sections: [
      {
        heading: 'ဓာတ်ပုံများကို ကိုင်တွယ်ပုံ',
        body: 'သင်ရိုက်ကူး သို့မဟုတ် ရွေးချယ်သော ဓာတ်ပုံများကို ခွဲခြမ်းစိတ်ဖြာရန် ကျွန်ုပ်တို့၏ ဆာဗာသို့ ပေးပို့ပြီး Anthropic ၏ AI မော်ဒယ်သို့ တိုက်ရိုက် ပေးပို့ပါသည်။ ဓာတ်ပုံများကို ကျွန်ုပ်တို့ ဆာဗာတွင် သိမ်းဆည်းမထားပါ၊ ခွဲခြမ်းစိတ်ဖြာမှု ပြီးဆုံးပါက မည်သည့်အရာမျှ မကျန်ရှိတော့ပါ။ လော့ဂ်အင် သို့မဟုတ် အကောင့်စနစ် မရှိသောကြောင့် ဓာတ်ပုံများကို သီးခြားပုဂ္ဂိုလ်တစ်ဦးနှင့် ချိတ်ဆက်သည့် နည်းလမ်းဖြင့် ဘယ်တော့မှ မသိမ်းဆည်းပါ။',
      },
      {
        heading: 'ကျွန်ုပ်တို့ သိမ်းဆည်းထားသည့် အချက်အလက်',
        body: 'ဤဝန်ဆောင်မှုကို အခမဲ့ ဆက်လက်ထားရှိရန်၊ IP လိပ်စာတစ်ခုချင်းစီအလိုက် နေ့စဉ် ခွဲခြမ်းစိတ်ဖြာမှု အရေအတွက်ကိုသာ ၂၄ နာရီအတွင်း ယာယီမှတ်တမ်းတင်ပါသည်။ ဤအချက်အလက်ကို နောက်တစ်နေ့တွင် အလိုအလျောက် ဖျက်ပစ်ပြီး အခြားရည်ရွယ်ချက်အတွက် အသုံးမပြုပါ။',
      },
      {
        heading: 'သိမ်းဆည်းထားသော မှတ်တမ်းနှင့် ပြက္ခဒိန် သတိပေးချက်များ',
        body: 'ခွဲခြမ်းစိတ်ဖြာမှု ရလဒ်များ (ဆေးအမည်များ၊ ဆေးသောက်ချိန်ဇယားများ စသည်ဖြင့် စာသားအနေဖြင့်) ကို နောက်ပိုင်းတွင် ပြန်ကြည့်နိုင်ရန် ဤစက်ပစ္စည်း၏ ဘရောက်ဇာတွင်သာ သိမ်းဆည်းထားပါသည်။ ဓာတ်ပုံများကို ဤသိုလှောင်မှုတွင် ဘယ်တော့မှ ထည့်သွင်းမထားပါ၊ ဘယ်နေရာသို့မှ ပေးပို့ခြင်းလည်း မရှိပါ။ "ပြက္ခဒိန်သို့ ထည့်ရန်" ဝန်ဆောင်မှုသည် သင့်စက်ပစ္စည်းပေါ်တွင် ဖိုင်တစ်ခုကို တိုက်ရိုက် ဖန်တီးပြီး ဒေါင်းလုဒ်လုပ်ပေးသည် — ၎င်းသည် ကျွန်ုပ်တို့ ဆာဗာ သို့မဟုတ် တတိယပါတီသို့ မည်သည့်အချက်အလက်ကိုမျှ ဘယ်တော့မှ ပေးပို့ခြင်း မရှိပါ။',
      },
      {
        heading: 'ကြော်ငြာများ',
        body: 'ဤဆိုက်သည် Google AdSense မှတစ်ဆင့် ကြော်ငြာများ ပြသနိုင်ပါသည်။ Google သည် စိတ်ဝင်စားမှုအခြေခံ ကြော်ငြာများ ပြသရန် ကွတ်ကီးများ အသုံးပြုနိုင်ပါသည်၊ Google ၏ ကြော်ငြာ ဆက်တင်များ (adssettings.google.com) တွင် ပုဂ္ဂိုလ်ရေးသီးသန့် ကြော်ငြာများကို ပိတ်နိုင်ပါသည်။',
      },
      {
        heading: 'ဆက်သွယ်ရန်',
        body: 'ဤမူဝါဒနှင့်ပတ်သက်၍ သင့်တွင် မေးခွန်းများရှိပါက အက်ပ်၏ GitHub repository တွင် issue တစ်ခု ဖွင့်ပေးပါ။',
      },
    ],
  },
  ne: {
    title: 'गोपनीयता नीति',
    updated: 'अन्तिम अद्यावधिक: अगस्ट २०२६',
    sections: [
      {
        heading: 'फोटोहरू कसरी ह्यान्डल गरिन्छ',
        body: 'तपाईंले खिच्नु भएको वा छान्नु भएको फोटोहरू विश्लेषणको लागि हाम्रो सर्भरमा पठाइन्छ र सीधै Anthropic को AI मोडेलमा पास गरिन्छ। फोटोहरू हाम्रो सर्भरमा भण्डारण गरिँदैन, र विश्लेषण पूरा भएपछि केही पनि बाँकी रहँदैन। लगइन वा खाता प्रणाली नभएकोले, फोटोहरू कहिल्यै पनि कुनै विशेष व्यक्तिसँग जोडिने तरिकाले भण्डारण गरिँदैन।',
      },
      {
        heading: 'हामीले राख्ने जानकारी',
        body: 'यो सेवा निःशुल्क राख्न, हामी प्रत्येक IP ठेगानाको दैनिक विश्लेषण संख्या मात्र २४ घण्टाको लागि अस्थायी रूपमा लग गर्छौं। यो जानकारी भोलिपल्ट स्वचालित रूपमा मेटिन्छ र अन्य कुनै उद्देश्यको लागि प्रयोग गरिँदैन।',
      },
      {
        heading: 'सुरक्षित इतिहास र क्यालेन्डर रिमाइन्डरहरू',
        body: 'विश्लेषण परिणामहरू (औषधिको नाम, सेवन तालिका, आदि पाठको रूपमा) पछि हेर्न सक्नुभएको लागि यो उपकरणको ब्राउजरमा मात्र सुरक्षित गरिन्छ। फोटोहरू यस भण्डारणमा कहिल्यै समावेश गरिँदैन र कहीं पनि पठाइँदैन। "क्यालेन्डरमा थप्नुहोस्" सुविधाले तपाईंको उपकरणमा सीधै फाइल सिर्जना गर्छ र डाउनलोड गर्छ — यसले हाम्रो सर्भर वा तेस्रो पक्षमा कुनै जानकारी कहिल्यै पठाउँदैन।',
      },
      {
        heading: 'विज्ञापन',
        body: 'यो साइटले Google AdSense मार्फत विज्ञापनहरू देखाउन सक्छ। Google ले रुचिमा आधारित विज्ञापनहरू देखाउन कुकीहरू प्रयोग गर्न सक्छ; तपाईं Google को विज्ञापन सेटिङहरू (adssettings.google.com) मा व्यक्तिगत विज्ञापनहरू बन्द गर्न सक्नुहुन्छ।',
      },
      {
        heading: 'सम्पर्क',
        body: 'यदि तपाईंसँग यो नीतिको बारेमा प्रश्नहरू छन् भने, कृपया एपको GitHub रिपोजिटरीमा issue खोल्नुहोस्।',
      },
    ],
  },
  pt: {
    title: 'Política de Privacidade',
    updated: 'Última atualização: agosto de 2026',
    sections: [
      {
        heading: 'Como as Fotos São Tratadas',
        body: 'As fotos que você tira ou escolhe são enviadas ao nosso servidor para análise e repassadas diretamente ao modelo de IA da Anthropic. As fotos não são armazenadas em nosso servidor, e nada permanece após a conclusão da análise. Não há sistema de login ou conta, portanto as fotos nunca são armazenadas de forma vinculada a uma pessoa específica.',
      },
      {
        heading: 'Informações que Mantemos',
        body: 'Para manter este serviço gratuito, registramos temporariamente apenas o número de análises diárias por endereço IP, por 24 horas. Essas informações são excluídas automaticamente no dia seguinte e não são usadas para nenhuma outra finalidade.',
      },
      {
        heading: 'Histórico Salvo e Lembretes de Calendário',
        body: 'Os resultados da análise (nomes de medicamentos, horários de dosagem, etc. como texto) são salvos apenas no navegador deste dispositivo para que você possa consultá-los depois. As fotos nunca são incluídas neste armazenamento e nunca são enviadas a lugar nenhum. O recurso "Adicionar ao Calendário" cria e baixa um arquivo diretamente no seu dispositivo — ele nunca envia nenhuma informação ao nosso servidor ou a terceiros.',
      },
      {
        heading: 'Publicidade',
        body: 'Este site pode exibir anúncios através do Google AdSense. O Google pode usar cookies para mostrar anúncios baseados em interesses; você pode desativar os anúncios personalizados nas Configurações de Anúncios do Google (adssettings.google.com).',
      },
      {
        heading: 'Contato',
        body: 'Se você tiver dúvidas sobre esta política, abra uma issue no repositório GitHub do aplicativo.',
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
