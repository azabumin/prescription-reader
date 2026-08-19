import { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ScrollView } from 'react-native';
import { Link } from 'expo-router';

import { staticPageStyles as s } from '../components/staticPageStyles';
import { COLORS, SPACING } from '../constants/theme';
import { detectDefaultLang, STRINGS } from '../lib/i18n';
import { loadLangPref } from '../lib/langPref';
import type { Lang } from '../types';

type Row = { label: string; value: string };

const CONTENT: Record<Lang, { title: string; updated: string; rows: Row[]; note?: string }> = {
  ja: {
    title: '特定商取引法に基づく表記',
    updated: '最終更新日: 2026年8月',
    rows: [
      { label: '販売業者', value: '株式会社PRIAMOS' },
      { label: '運営統括責任者', value: '代表取締役　閔鐘基' },
      { label: '所在地', value: '東京都江戸川区西葛西8-15-6-703' },
      { label: '電話番号', value: '080-3155-5076' },
      { label: 'メールアドレス', value: 'azabumin@gmail.com' },
      {
        label: '販売価格',
        value: '月額プラン ¥480（税込）\n※12ヶ月連続でご利用いただいた場合、13ヶ月目のご利用料金が無料になります。',
      },
      {
        label: '商品代金以外の必要料金',
        value: 'インターネット接続料金など、通信に関する費用はお客様のご負担となります。',
      },
      { label: 'お支払い方法', value: 'クレジットカード決済（ZEUS決済代行）' },
      {
        label: 'お支払い時期',
        value: 'ご登録時に決済され、以降は毎月自動更新（自動課金）となります。',
      },
      { label: 'サービス提供時期', value: 'お支払い完了後、直ちにご利用いただけます。' },
      {
        label: '返品・キャンセルについて',
        value:
          'デジタルサービスの性質上、お支払い済みの料金の返金は原則としてお受けしておりません。次回の自動更新の停止（解約）はいつでもマイページから手続きいただけます。解約後も、お支払い済みの期間の終了日まで引き続きサービスをご利用いただけます。',
      },
      { label: '動作環境', value: '最新のWebブラウザ（Chrome、Safari等）でご利用いただけます。' },
    ],
  },
  ko: {
    title: '특정상거래법에 따른 표기',
    updated: '최종 수정일: 2026년 8월',
    rows: [
      { label: '판매업자', value: '株式会社PRIAMOS (주식회사 PRIAMOS)' },
      { label: '운영총괄책임자', value: '대표이사 민종기 (閔鐘基)' },
      { label: '소재지', value: '東京都江戸川区西葛西8-15-6-703 (일본 도쿄도 에도가와구 니시카사이)' },
      { label: '전화번호', value: '080-3155-5076' },
      { label: '이메일 주소', value: 'azabumin@gmail.com' },
      {
        label: '판매가격',
        value: '월간 플랜 ¥480 (세금 포함)\n※12개월 연속 이용 시, 13개월째 이용료가 무료가 됩니다.',
      },
      {
        label: '상품대금 이외 필요 요금',
        value: '인터넷 접속료 등 통신 관련 비용은 고객님 부담입니다.',
      },
      { label: '결제 방법', value: '신용카드 결제 (ZEUS 결제대행)' },
      {
        label: '결제 시기',
        value: '등록 시 결제되며, 이후 매월 자동으로 갱신(자동 결제)됩니다.',
      },
      { label: '서비스 제공 시기', value: '결제 완료 후 즉시 이용하실 수 있습니다.' },
      {
        label: '환불·해지 안내',
        value:
          '디지털 서비스의 특성상, 이미 결제하신 요금은 원칙적으로 환불해 드리지 않습니다. 다음 자동 갱신 중지(해지)는 마이페이지에서 언제든지 신청하실 수 있습니다. 해지 후에도 이미 결제하신 기간의 종료일까지는 계속 서비스를 이용하실 수 있습니다.',
      },
      { label: '동작 환경', value: '최신 웹 브라우저(Chrome, Safari 등)에서 이용하실 수 있습니다.' },
    ],
    note: '※ 본 페이지는 일본 특정상거래법에 따른 법정 고지사항입니다. 원문(일본어)이 법적 효력을 가지며, 이 번역은 참고용으로 제공됩니다.',
  },
  en: {
    title: 'Notice Under Japan’s Act on Specified Commercial Transactions',
    updated: 'Last updated: August 2026',
    rows: [
      { label: 'Business Name', value: 'PRIAMOS Co., Ltd. (株式会社 PRIAMOS)' },
      { label: 'Responsible Officer', value: 'Jong-gi Min, Representative Director (閔鐘基)' },
      { label: 'Address', value: '8-15-6-703 Nishikasai, Edogawa-ku, Tokyo, Japan' },
      { label: 'Phone Number', value: '080-3155-5076' },
      { label: 'Email Address', value: 'azabumin@gmail.com' },
      {
        label: 'Price',
        value: 'Monthly Plan ¥480 (tax included)\n※If you use the service for 12 consecutive months, the 13th month is free.',
      },
      {
        label: 'Additional Fees',
        value: 'Internet connection charges and other communication costs are the customer’s responsibility.',
      },
      { label: 'Payment Method', value: 'Credit card (processed via ZEUS)' },
      {
        label: 'Payment Timing',
        value: 'Charged at the time of registration; thereafter renews automatically every month (auto-billing).',
      },
      { label: 'Service Delivery Timing', value: 'The service is available immediately after payment is completed.' },
      {
        label: 'Refunds & Cancellation',
        value:
          'Due to the nature of digital services, fees already paid are not refundable in principle. You may stop the next automatic renewal (cancel) at any time from My Page. Even after cancellation, you can continue using the service until the end of the period you already paid for.',
      },
      { label: 'System Requirements', value: 'Available on the latest web browsers (Chrome, Safari, etc.).' },
    ],
    note: '※ This page is a legal disclosure required under Japan’s Act on Specified Commercial Transactions. The Japanese original is the legally binding version; this translation is provided for convenience only.',
  },
  vi: {
    title: 'Thông Báo Theo Luật Giao Dịch Thương Mại Đặc Định Của Nhật Bản',
    updated: 'Cập nhật lần cuối: Tháng 8 năm 2026',
    rows: [
      { label: 'Đơn Vị Kinh Doanh', value: 'PRIAMOS Co., Ltd. (株式会社PRIAMOS)' },
      { label: 'Người Chịu Trách Nhiệm', value: 'Đại diện: Jong-gi Min (閔鐘基)' },
      { label: 'Địa Chỉ', value: '8-15-6-703 Nishikasai, Edogawa-ku, Tokyo, Japan' },
      { label: 'Số Điện Thoại', value: '080-3155-5076' },
      { label: 'Địa Chỉ Email', value: 'azabumin@gmail.com' },
      {
        label: 'Giá Bán',
        value: 'Gói tháng ¥480 (đã bao gồm thuế)\n※Nếu bạn sử dụng dịch vụ liên tục trong 12 tháng, tháng thứ 13 sẽ được miễn phí.',
      },
      {
        label: 'Phí Bổ Sung',
        value: 'Cước phí kết nối internet và các chi phí liên lạc khác do khách hàng chi trả.',
      },
      { label: 'Phương Thức Thanh Toán', value: 'Thanh toán bằng thẻ tín dụng (xử lý qua ZEUS)' },
      {
        label: 'Thời Điểm Thanh Toán',
        value: 'Được tính phí tại thời điểm đăng ký; sau đó tự động gia hạn hàng tháng (tự động thanh toán).',
      },
      { label: 'Thời Điểm Cung Cấp Dịch Vụ', value: 'Dịch vụ khả dụng ngay sau khi hoàn tất thanh toán.' },
      {
        label: 'Hoàn Tiền & Hủy Dịch Vụ',
        value:
          'Do tính chất của dịch vụ kỹ thuật số, các khoản phí đã thanh toán về nguyên tắc sẽ không được hoàn lại. Bạn có thể dừng gia hạn tự động tiếp theo (hủy) bất cứ lúc nào từ Trang Của Tôi. Ngay cả sau khi hủy, bạn vẫn có thể tiếp tục sử dụng dịch vụ cho đến hết thời hạn đã thanh toán.',
      },
      { label: 'Yêu Cầu Hệ Thống', value: 'Khả dụng trên các trình duyệt web mới nhất (Chrome, Safari, v.v.).' },
    ],
    note: '※ Trang này là thông báo pháp lý bắt buộc theo Luật Giao dịch Thương mại Đặc định của Nhật Bản. Bản gốc tiếng Nhật là phiên bản có giá trị pháp lý; bản dịch này chỉ mang tính tham khảo.',
  },
  zh: {
    title: '根据日本《特定商取引法》的表示',
    updated: '最后更新:2026年8月',
    rows: [
      { label: '经营者名称', value: 'PRIAMOS股份有限公司(株式会社PRIAMOS)' },
      { label: '运营负责人', value: '代表董事 闵钟基(閔鐘基)' },
      { label: '所在地', value: '8-15-6-703 Nishikasai, Edogawa-ku, Tokyo, Japan' },
      { label: '电话号码', value: '080-3155-5076' },
      { label: '电子邮箱', value: 'azabumin@gmail.com' },
      {
        label: '销售价格',
        value: '月付方案 ¥480(含税)\n※如果您连续使用本服务12个月,第13个月将免费。',
      },
      { label: '商品价款以外的费用', value: '互联网连接费用等通信相关费用由客户自行承担。' },
      { label: '支付方式', value: '信用卡支付(通过ZEUS代收)' },
      {
        label: '支付时间',
        value: '注册时收费;此后每月自动续费(自动扣款)。',
      },
      { label: '服务提供时间', value: '支付完成后即可立即使用服务。' },
      {
        label: '退款与取消',
        value:
          '鉴于数字服务的性质,已支付的费用原则上不予退还。您可以随时在"我的页面"中停止下一次自动续费(取消)。即使取消后,您仍可继续使用服务直至已支付期限结束。',
      },
      { label: '使用环境', value: '可在最新版网页浏览器(Chrome、Safari等)上使用。' },
    ],
    note: '※ 本页面是根据日本《特定商取引法》要求的法定披露内容。日文原文具有法律效力,本译文仅供参考。',
  },
  id: {
    title: 'Pemberitahuan Berdasarkan Undang-Undang Transaksi Komersial Tertentu Jepang',
    updated: 'Terakhir diperbarui: Agustus 2026',
    rows: [
      { label: 'Nama Bisnis', value: 'PRIAMOS Co., Ltd. (株式会社PRIAMOS)' },
      { label: 'Penanggung Jawab', value: 'Direktur Perwakilan: Jong-gi Min (閔鐘基)' },
      { label: 'Alamat', value: '8-15-6-703 Nishikasai, Edogawa-ku, Tokyo, Japan' },
      { label: 'Nomor Telepon', value: '080-3155-5076' },
      { label: 'Alamat Email', value: 'azabumin@gmail.com' },
      {
        label: 'Harga',
        value: 'Paket Bulanan ¥480 (termasuk pajak)\n※Jika Anda menggunakan layanan ini selama 12 bulan berturut-turut, bulan ke-13 akan gratis.',
      },
      {
        label: 'Biaya Tambahan',
        value: 'Biaya koneksi internet dan biaya komunikasi lainnya menjadi tanggung jawab pelanggan.',
      },
      { label: 'Metode Pembayaran', value: 'Kartu kredit (diproses melalui ZEUS)' },
      {
        label: 'Waktu Pembayaran',
        value: 'Ditagih pada saat pendaftaran; selanjutnya diperbarui secara otomatis setiap bulan (penagihan otomatis).',
      },
      { label: 'Waktu Penyediaan Layanan', value: 'Layanan tersedia segera setelah pembayaran selesai.' },
      {
        label: 'Pengembalian Dana & Pembatalan',
        value:
          'Karena sifat layanan digital, biaya yang sudah dibayarkan pada prinsipnya tidak dapat dikembalikan. Anda dapat menghentikan perpanjangan otomatis berikutnya (membatalkan) kapan saja dari Halaman Saya. Bahkan setelah pembatalan, Anda tetap dapat menggunakan layanan hingga akhir periode yang sudah dibayar.',
      },
      { label: 'Persyaratan Sistem', value: 'Tersedia di browser web terbaru (Chrome, Safari, dll.).' },
    ],
    note: '※ Halaman ini adalah pengungkapan hukum yang diwajibkan berdasarkan Undang-Undang Transaksi Komersial Tertentu Jepang. Naskah asli berbahasa Jepang adalah versi yang mengikat secara hukum; terjemahan ini hanya disediakan untuk kenyamanan.',
  },
  tl: {
    title: 'Paunawa Ayon sa Batas ng Japan sa mga Tinukoy na Transaksyong Komersyal',
    updated: 'Huling na-update: Agosto 2026',
    rows: [
      { label: 'Pangalan ng Negosyo', value: 'PRIAMOS Co., Ltd. (株式会社PRIAMOS)' },
      { label: 'Responsableng Opisyal', value: 'Representative Director: Jong-gi Min (閔鐘基)' },
      { label: 'Address', value: '8-15-6-703 Nishikasai, Edogawa-ku, Tokyo, Japan' },
      { label: 'Numero ng Telepono', value: '080-3155-5076' },
      { label: 'Email Address', value: 'azabumin@gmail.com' },
      {
        label: 'Presyo',
        value: 'Buwanang Plano ¥480 (kasama ang buwis)\n※Kung gagamitin mo ang serbisyo nang 12 magkakasunod na buwan, libre ang ika-13 buwan.',
      },
      {
        label: 'Karagdagang Bayad',
        value: 'Ang mga bayarin sa koneksyon sa internet at iba pang gastos sa komunikasyon ay pananagutan ng customer.',
      },
      { label: 'Paraan ng Pagbabayad', value: 'Credit card (pinoproseso sa pamamagitan ng ZEUS)' },
      {
        label: 'Oras ng Pagbabayad',
        value: 'Sisingilin sa oras ng pagpaparehistro; pagkatapos ay awtomatikong nag-re-renew bawat buwan (auto-billing).',
      },
      { label: 'Oras ng Paghahatid ng Serbisyo', value: 'Available agad ang serbisyo pagkatapos makumpleto ang bayad.' },
      {
        label: 'Refund at Pagkansela',
        value:
          'Dahil sa katangian ng mga digital na serbisyo, ang mga bayad na na-charge ay hindi na maibabalik sa prinsipyo. Maaari mong ihinto ang susunod na awtomatikong pag-renew (kanselahin) anumang oras mula sa My Page. Kahit pagkatapos kanselahin, maaari mo pa ring gamitin ang serbisyo hanggang sa katapusan ng panahong nabayaran mo na.',
      },
      { label: 'Mga Kinakailangan sa Sistema', value: 'Available sa pinakabagong mga web browser (Chrome, Safari, atbp.).' },
    ],
    note: '※ Ang pahinang ito ay isang legal na paglalahad na kinakailangan sa ilalim ng Batas ng Japan sa mga Tinukoy na Transaksyong Komersyal. Ang orihinal na Japanese ang legal na bersyon; ang salin na ito ay para lamang sa kaginhawaan.',
  },
  th: {
    title: 'ประกาศตามพระราชบัญญัติธุรกรรมพาณิชย์เฉพาะของญี่ปุ่น',
    updated: 'อัปเดตล่าสุด: สิงหาคม 2026',
    rows: [
      { label: 'ชื่อผู้ประกอบการ', value: 'PRIAMOS Co., Ltd. (株式会社PRIAMOS)' },
      { label: 'ผู้รับผิดชอบดำเนินงาน', value: 'กรรมการผู้แทน: Jong-gi Min (閔鐘基)' },
      { label: 'ที่อยู่', value: '8-15-6-703 Nishikasai, Edogawa-ku, Tokyo, Japan' },
      { label: 'หมายเลขโทรศัพท์', value: '080-3155-5076' },
      { label: 'อีเมล', value: 'azabumin@gmail.com' },
      {
        label: 'ราคาขาย',
        value: 'แผนรายเดือน ¥480 (รวมภาษี)\n※หากคุณใช้บริการต่อเนื่อง 12 เดือน เดือนที่ 13 จะไม่มีค่าใช้จ่าย',
      },
      {
        label: 'ค่าใช้จ่ายเพิ่มเติม',
        value: 'ค่าบริการเชื่อมต่ออินเทอร์เน็ตและค่าใช้จ่ายด้านการสื่อสารอื่นๆ เป็นความรับผิดชอบของลูกค้า',
      },
      { label: 'วิธีการชำระเงิน', value: 'บัตรเครดิต (ดำเนินการผ่าน ZEUS)' },
      {
        label: 'กำหนดเวลาชำระเงิน',
        value: 'เรียกเก็บเงินเมื่อลงทะเบียน จากนั้นจะต่ออายุอัตโนมัติทุกเดือน (เรียกเก็บเงินอัตโนมัติ)',
      },
      { label: 'กำหนดเวลาให้บริการ', value: 'บริการพร้อมใช้งานทันทีหลังจากชำระเงินเสร็จสมบูรณ์' },
      {
        label: 'การคืนเงินและการยกเลิก',
        value:
          'เนื่องจากลักษณะของบริการดิจิทัล ค่าธรรมเนียมที่ชำระแล้วโดยหลักการจะไม่สามารถขอคืนได้ คุณสามารถหยุดการต่ออายุอัตโนมัติครั้งถัดไป (ยกเลิก) ได้ทุกเมื่อจากหน้า My Page แม้หลังจากยกเลิกแล้ว คุณยังคงสามารถใช้บริการต่อไปได้จนกว่าจะสิ้นสุดระยะเวลาที่ชำระเงินไว้แล้ว',
      },
      { label: 'ข้อกำหนดของระบบ', value: 'ใช้งานได้บนเว็บเบราว์เซอร์รุ่นล่าสุด (Chrome, Safari ฯลฯ)' },
    ],
    note: '※ หน้านี้เป็นการเปิดเผยข้อมูลทางกฎหมายที่กำหนดโดยพระราชบัญญัติธุรกรรมพาณิชย์เฉพาะของญี่ปุ่น ต้นฉบับภาษาญี่ปุ่นเป็นเวอร์ชันที่มีผลผูกพันทางกฎหมาย การแปลนี้จัดทำขึ้นเพื่อความสะดวกเท่านั้น',
  },
  my: {
    title: 'ဂျပန်နိုင်ငံ၏ သတ်မှတ်ကုန်သွယ်မှုဆိုင်ရာ အက်ဥပဒေအရ အသိပေးချက်',
    updated: 'နောက်ဆုံးမွမ်းမံသည့်ရက်: ၂၀၂၆ ခုနှစ် သြဂုတ်လ',
    rows: [
      { label: 'စီးပွားရေးလုပ်ငန်း အမည်', value: 'PRIAMOS Co., Ltd. (株式会社PRIAMOS)' },
      { label: 'တာဝန်ခံ အရာရှိ', value: 'Representative Director: Jong-gi Min (閔鐘基)' },
      { label: 'လိပ်စာ', value: '8-15-6-703 Nishikasai, Edogawa-ku, Tokyo, Japan' },
      { label: 'ဖုန်းနံပါတ်', value: '080-3155-5076' },
      { label: 'အီးမေးလ်လိပ်စာ', value: 'azabumin@gmail.com' },
      {
        label: 'ဈေးနှုန်း',
        value: 'လစဉ်အစီအစဉ် ¥480 (အခွန်ပါ)\n※၁၂ လ ဆက်တိုက် အသုံးပြုပါက ၁၃ လမြောက်ကို အခမဲ့ ရရှိမည် ဖြစ်သည်။',
      },
      {
        label: 'ထပ်ဆောင်း ကုန်ကျစရိတ်',
        value: 'အင်တာနက် ချိတ်ဆက်ခ နှင့် အခြား ဆက်သွယ်ရေးဆိုင်ရာ ကုန်ကျစရိတ်များသည် customer ၏ တာဝန် ဖြစ်သည်။',
      },
      { label: 'ငွေပေးချေမှု နည်းလမ်း', value: 'အကြွေးဝယ်ကတ် (ZEUS မှတစ်ဆင့် လုပ်ဆောင်သည်)' },
      {
        label: 'ငွေပေးချေမှု အချိန်',
        value: 'မှတ်ပုံတင်ချိန်တွင် ငွေကောက်ခံပြီး၊ ထို့နောက် လစဉ် အလိုအလျောက် သက်တမ်းတိုးမည် (auto-billing)။',
      },
      { label: 'ဝန်ဆောင်မှု ပေးအပ်မည့် အချိန်', value: 'ငွေပေးချေမှု ပြီးဆုံးပြီးနောက် ဝန်ဆောင်မှုကို ချက်ချင်း အသုံးပြုနိုင်ပါသည်။' },
      {
        label: 'ငွေပြန်အမ်းခြင်းနှင့် ပယ်ဖျက်ခြင်း',
        value:
          'ဒစ်ဂျစ်တယ် ဝန်ဆောင်မှုများ၏ သဘောသဘာဝကြောင့်၊ ပေးချေပြီးသား ကြေးများကို အခြေခံမူအရ ငွေပြန်အမ်းမည် မဟုတ်ပါ။ နောက်တစ်ကြိမ် အလိုအလျောက် သက်တမ်းတိုးခြင်းကို My Page မှ အချိန်မရွေး ရပ်တန့် (ပယ်ဖျက်) နိုင်ပါသည်။ ပယ်ဖျက်ပြီးနောက်တွင်ပင်၊ သင် ပေးချေပြီးသား ကာလ၏ အဆုံးထိ ဝန်ဆောင်မှုကို ဆက်လက် အသုံးပြုနိုင်ပါသည်။',
      },
      { label: 'စနစ် လိုအပ်ချက်များ', value: 'နောက်ဆုံးပေါ် ဝဘ်ဘရောက်ဇာများ (Chrome, Safari စသည်) တွင် အသုံးပြုနိုင်ပါသည်။' },
    ],
    note: '※ ဤစာမျက်နှာသည် ဂျပန်နိုင်ငံ၏ သတ်မှတ်ကုန်သွယ်မှုဆိုင်ရာ အက်ဥပဒေအရ လိုအပ်သော ဥပဒေရေးရာ ထုတ်ဖော်ချက် ဖြစ်ပါသည်။ ဂျပန်ဘာသာ မူရင်းသည် ဥပဒေအရ အကျိုးသက်ရောက်သော ဗားရှင်း ဖြစ်ပြီး၊ ဤဘာသာပြန်ချက်ကို အဆင်ပြေမှုအတွက်သာ ပေးထားခြင်း ဖြစ်ပါသည်။',
  },
  ne: {
    title: 'जापानको विशेष वाणिज्य कारोबार ऐन अन्तर्गत सूचना',
    updated: 'अन्तिम अद्यावधिक: अगस्ट २०२६',
    rows: [
      { label: 'व्यवसायको नाम', value: 'PRIAMOS Co., Ltd. (株式会社PRIAMOS)' },
      { label: 'जिम्मेवार अधिकारी', value: 'प्रतिनिधि निर्देशक: Jong-gi Min (閔鐘基)' },
      { label: 'ठेगाना', value: '8-15-6-703 Nishikasai, Edogawa-ku, Tokyo, Japan' },
      { label: 'फोन नम्बर', value: '080-3155-5076' },
      { label: 'इमेल ठेगाना', value: 'azabumin@gmail.com' },
      {
        label: 'मूल्य',
        value: 'मासिक योजना ¥480 (कर सहित)\n※यदि तपाईंले लगातार १२ महिना सेवा प्रयोग गर्नुभयो भने, १३ औं महिना निःशुल्क हुन्छ।',
      },
      {
        label: 'थप शुल्कहरू',
        value: 'इन्टरनेट जडान शुल्क र अन्य सञ्चार लागतहरू ग्राहकको जिम्मेवारी हो।',
      },
      { label: 'भुक्तानी विधि', value: 'क्रेडिट कार्ड (ZEUS मार्फत प्रशोधन गरिन्छ)' },
      {
        label: 'भुक्तानी समय',
        value: 'दर्ता गर्दा शुल्क लिइन्छ; त्यसपछि हरेक महिना स्वचालित रूपमा नवीकरण हुन्छ (स्वचालित बिलिङ)।',
      },
      { label: 'सेवा प्रदान गर्ने समय', value: 'भुक्तानी पूरा भएपछि सेवा तुरुन्तै उपलब्ध हुन्छ।' },
      {
        label: 'फिर्ता र रद्दीकरण',
        value:
          'डिजिटल सेवाहरूको प्रकृतिका कारण, पहिले नै तिरिसकेको शुल्क सिद्धान्ततः फिर्ता गरिँदैन। तपाईंले My Page बाट जुनसुकै बेला अर्को स्वचालित नवीकरण रोक्न (रद्द गर्न) सक्नुहुन्छ। रद्द गरेपछि पनि, तपाईंले पहिले नै तिरिसकेको अवधिको अन्त्यसम्म सेवा प्रयोग गर्न जारी राख्न सक्नुहुन्छ।',
      },
      { label: 'प्रणाली आवश्यकताहरू', value: 'नवीनतम वेब ब्राउजरहरूमा उपलब्ध (Chrome, Safari, आदि)।' },
    ],
    note: '※ यो पृष्ठ जापानको विशेष वाणिज्य कारोबार ऐन अन्तर्गत आवश्यक कानूनी खुलासा हो। जापानी मूल पाठ कानुनी रूपमा बाध्यकारी संस्करण हो; यो अनुवाद सुविधाको लागि मात्र प्रदान गरिएको हो।',
  },
  pt: {
    title: 'Aviso Nos Termos da Lei de Transações Comerciais Específicas do Japão',
    updated: 'Última atualização: agosto de 2026',
    rows: [
      { label: 'Nome da Empresa', value: 'PRIAMOS Co., Ltd. (株式会社PRIAMOS)' },
      { label: 'Responsável', value: 'Diretor Representante: Jong-gi Min (閔鐘基)' },
      { label: 'Endereço', value: '8-15-6-703 Nishikasai, Edogawa-ku, Tokyo, Japan' },
      { label: 'Número de Telefone', value: '080-3155-5076' },
      { label: 'Endereço de E-mail', value: 'azabumin@gmail.com' },
      {
        label: 'Preço',
        value: 'Plano Mensal ¥480 (imposto incluído)\n※Se você usar o serviço por 12 meses consecutivos, o 13º mês será gratuito.',
      },
      {
        label: 'Taxas Adicionais',
        value: 'As taxas de conexão à internet e outros custos de comunicação são de responsabilidade do cliente.',
      },
      { label: 'Método de Pagamento', value: 'Cartão de crédito (processado via ZEUS)' },
      {
        label: 'Prazo de Pagamento',
        value: 'Cobrado no momento do registro; depois renova automaticamente todo mês (cobrança automática).',
      },
      { label: 'Prazo de Fornecimento do Serviço', value: 'O serviço fica disponível imediatamente após a conclusão do pagamento.' },
      {
        label: 'Reembolsos e Cancelamento',
        value:
          'Devido à natureza dos serviços digitais, as taxas já pagas não são reembolsáveis em princípio. Você pode interromper a próxima renovação automática (cancelar) a qualquer momento em Minha Página. Mesmo após o cancelamento, você pode continuar usando o serviço até o final do período já pago.',
      },
      { label: 'Requisitos do Sistema', value: 'Disponível nos navegadores web mais recentes (Chrome, Safari, etc.).' },
    ],
    note: '※ Esta página é uma divulgação legal exigida pela Lei de Transações Comerciais Específicas do Japão. O original em japonês é a versão juridicamente vinculativa; esta tradução é fornecida apenas para conveniência.',
  },
};

export default function TokushohoScreen() {
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

        <View style={rowStyles.table}>
          {content.rows.map((row) => (
            <View key={row.label} style={rowStyles.row}>
              <Text style={rowStyles.label}>{row.label}</Text>
              <Text style={rowStyles.value}>{row.value}</Text>
            </View>
          ))}
        </View>

        {content.note && <Text style={[s.muted, { marginTop: SPACING.md }]}>{content.note}</Text>}
      </View>
    </ScrollView>
  );
}

const rowStyles = StyleSheet.create({
  table: {
    marginTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  row: {
    flexDirection: 'row',
    paddingVertical: SPACING.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: SPACING.sm,
  },
  label: {
    width: 150,
    flexShrink: 0,
    fontSize: 13.5,
    fontWeight: '700',
    color: COLORS.primaryDark,
  },
  value: {
    flex: 1,
    fontSize: 13.5,
    color: COLORS.text,
    lineHeight: 20,
  },
});
