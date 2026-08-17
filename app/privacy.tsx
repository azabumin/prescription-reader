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
        body: '촬영하거나 선택한 사진은 분석을 위해 서버로 전송되고, Anthropic의 AI 모델로 곧바로 전달됩니다. 사진 자체는 저희 서버에 저장되지 않으며, 분석이 끝나면 남지 않습니다. 다만 이용을 위해서는 로그인이 필요하며, 분석 요청은 로그인하신 계정과 연결되어 처리됩니다.',
      },
      {
        heading: '계정 정보',
        body: '서비스 이용을 위해 이메일 주소와 비밀번호로 계정을 만드셔야 합니다. 비밀번호는 안전하게 암호화하여 저장하며, 저희도 원문 그대로는 확인할 수 없습니다. 계정과 함께 가입일, 무료체험 종료일, 구독 상태를 저장합니다. 계정 삭제를 원하시면 azabumin@gmail.com으로 문의해주세요.',
      },
      {
        heading: '결제 정보',
        body: '구독 결제는 결제대행사 ZEUS를 통해 처리되며, 카드 번호 등 결제 정보는 저희 서버에 저장되지 않습니다.',
      },
      {
        heading: '남기는 정보',
        body: '무료체험 종료 이후에도 서비스를 안정적으로 제공하기 위해, 접속 IP 주소를 기준으로 하루 이용 횟수만 24시간 동안 임시로 기록합니다. 이 정보는 다음 날 자동으로 사라지며, 다른 목적으로 쓰이지 않습니다.',
      },
      {
        heading: '기록 저장 및 캘린더 알림',
        body: '분석 결과(약 이름, 복용 시간표 등 텍스트)는 다시 보실 수 있도록 이 기기의 브라우저에만 저장됩니다. 사진은 이 저장에 포함되지 않으며, 어디로도 전송되지 않습니다. "캘린더에 알림 추가" 기능은 기기에서 직접 파일을 만들어 다운로드할 뿐, 저희 서버나 제3자에게 아무 정보도 전달하지 않습니다.',
      },
      {
        heading: '광고',
        body: '이 사이트는 Google AdSense를 통해 광고를 표시할 수 있습니다. Google은 쿠키를 사용해 관심사 기반 광고를 보여줄 수 있으며, Google 광고 설정(adssettings.google.com)에서 개인 맞춤 광고를 끌 수 있습니다.',
      },
      {
        heading: '문의',
        body: '이 방침에 대해 궁금한 점이 있으면 azabumin@gmail.com으로 문의하시거나 앱 저장소(GitHub)의 이슈로 남겨주세요.',
      },
    ],
  },
  ja: {
    title: 'プライバシーポリシー',
    updated: '最終更新日: 2026年8月',
    sections: [
      {
        heading: '写真の取り扱い',
        body: '撮影または選択した写真は、分析のためサーバーに送信され、そのままAnthropicのAIモデルに渡されます。写真そのものは当方のサーバーには保存されず、分析後に残ることはありません。ただし、ご利用にはログインが必要で、分析リクエストはログイン中のアカウントと紐づけて処理されます。',
      },
      {
        heading: 'アカウント情報',
        body: 'サービスのご利用には、メールアドレスとパスワードによるアカウント登録が必要です。パスワードは安全な方法で暗号化して保存しており、当方が元のパスワードを確認することはできません。アカウントとともに、登録日・無料体験終了日・サブスクリプションの状態を保存します。アカウントの削除をご希望の場合は、azabumin@gmail.comまでご連絡ください。',
      },
      {
        heading: '決済情報',
        body: 'サブスクリプションのお支払いは決済代行会社ZEUSを通じて処理され、カード番号などの決済情報は当方のサーバーには保存されません。',
      },
      {
        heading: '記録する情報',
        body: '無料体験終了後もサービスを安定してご提供するため、接続元IPアドレスごとの1日あたりの利用回数のみ、24時間だけ一時的に記録します。この情報は翌日に自動的に消去され、他の目的には使用しません。',
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
        body: 'このポリシーについてご質問がある場合は、azabumin@gmail.comまでご連絡いただくか、アプリのリポジトリ(GitHub)のIssueにてご連絡ください。',
      },
    ],
  },
  en: {
    title: 'Privacy Policy',
    updated: 'Last updated: August 2026',
    sections: [
      {
        heading: 'How Photos Are Handled',
        body: "Photos you take or choose are sent to our server for analysis and passed directly to Anthropic's AI model. The photo itself is not stored on our server, and nothing remains once analysis is complete. However, using the service requires logging in, and analysis requests are processed as tied to your logged-in account.",
      },
      {
        heading: 'Account Information',
        body: 'Using the service requires creating an account with an email address and password. Your password is stored encrypted, in a way that even we cannot recover the original. Along with your account, we store your signup date, trial end date, and subscription status. To delete your account, please contact azabumin@gmail.com.',
      },
      {
        heading: 'Payment Information',
        body: 'Subscription payments are processed through our payment provider, ZEUS. Card numbers and other payment details are never stored on our servers.',
      },
      {
        heading: 'Information We Keep',
        body: 'To keep the service running reliably beyond the free trial period, we temporarily log only the number of daily analyses per IP address, for 24 hours. This information is automatically deleted the next day and is not used for any other purpose.',
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
        body: "If you have questions about this policy, please contact azabumin@gmail.com or open an issue on the app's GitHub repository.",
      },
    ],
  },
  vi: {
    title: 'Chính Sách Bảo Mật',
    updated: 'Cập nhật lần cuối: Tháng 8 năm 2026',
    sections: [
      {
        heading: 'Cách Xử Lý Ảnh',
        body: 'Ảnh bạn chụp hoặc chọn sẽ được gửi đến máy chủ của chúng tôi để phân tích và chuyển trực tiếp đến mô hình AI của Anthropic. Bản thân bức ảnh không được lưu trữ trên máy chủ của chúng tôi, và không có gì còn lại sau khi phân tích hoàn tất. Tuy nhiên, để sử dụng dịch vụ bạn cần đăng nhập, và các yêu cầu phân tích được xử lý gắn liền với tài khoản đã đăng nhập của bạn.',
      },
      {
        heading: 'Thông Tin Tài Khoản',
        body: 'Để sử dụng dịch vụ, bạn cần tạo tài khoản bằng địa chỉ email và mật khẩu. Mật khẩu của bạn được lưu trữ dưới dạng mã hóa, đến mức ngay cả chúng tôi cũng không thể khôi phục mật khẩu gốc. Cùng với tài khoản, chúng tôi lưu ngày đăng ký, ngày kết thúc dùng thử và trạng thái đăng ký gói dịch vụ của bạn. Để xóa tài khoản, vui lòng liên hệ azabumin@gmail.com.',
      },
      {
        heading: 'Thông Tin Thanh Toán',
        body: 'Thanh toán gói đăng ký được xử lý thông qua nhà cung cấp dịch vụ thanh toán ZEUS. Số thẻ và các thông tin thanh toán khác không bao giờ được lưu trữ trên máy chủ của chúng tôi.',
      },
      {
        heading: 'Thông Tin Chúng Tôi Lưu Giữ',
        body: 'Để duy trì dịch vụ hoạt động ổn định sau thời gian dùng thử miễn phí, chúng tôi chỉ tạm thời ghi lại số lượt phân tích hàng ngày theo địa chỉ IP, trong vòng 24 giờ. Thông tin này sẽ tự động bị xóa vào ngày hôm sau và không được sử dụng cho bất kỳ mục đích nào khác.',
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
        body: 'Nếu bạn có thắc mắc về chính sách này, vui lòng liên hệ azabumin@gmail.com hoặc mở một issue trên kho lưu trữ GitHub của ứng dụng.',
      },
    ],
  },
  zh: {
    title: '隐私政策',
    updated: '最后更新:2026年8月',
    sections: [
      {
        heading: '照片处理方式',
        body: '您拍摄或选择的照片会被发送到我们的服务器进行分析,并直接传递给Anthropic的AI模型。照片本身不会存储在我们的服务器上,分析完成后不会留下任何痕迹。不过,使用本服务需要登录,分析请求会与您登录的账户关联处理。',
      },
      {
        heading: '账户信息',
        body: '使用本服务需要通过电子邮箱和密码创建账户。您的密码将以加密方式存储,即使是我们也无法还原出原始密码。除账户外,我们还会存储您的注册日期、试用期结束日期及订阅状态。如需删除账户,请联系azabumin@gmail.com。',
      },
      {
        heading: '支付信息',
        body: '订阅付款通过支付服务商ZEUS处理,银行卡号等支付信息不会存储在我们的服务器上。',
      },
      {
        heading: '我们保留的信息',
        body: '为了在免费试用期结束后仍能稳定提供服务,我们仅临时记录每个IP地址每日的分析次数,保留24小时。该信息将在次日自动删除,不会用于任何其他目的。',
      },
      {
        heading: '保存的历史记录与日历提醒',
        body: '分析结果(药品名称、服药时间表等文本内容)仅保存在本设备的浏览器中,以便您日后查看。照片绝不会包含在此存储中,也绝不会被发送到任何地方。"添加到日历"功能会直接在您的设备上创建并下载文件——它绝不会向我们的服务器或第三方发送任何信息。',
      },
      {
        heading: '广告',
        body: '本网站可能通过Google AdSense展示广告。Google可能使用Cookie显示基于兴趣的广告;您可以在Google广告设置(adssettings.google.com)中关闭个性化广告。',
      },
      { heading: '联系我们', body: '如果您对本政策有任何疑问,请联系azabumin@gmail.com,或在应用的GitHub仓库中提交issue。' },
    ],
  },
  id: {
    title: 'Kebijakan Privasi',
    updated: 'Terakhir diperbarui: Agustus 2026',
    sections: [
      {
        heading: 'Cara Foto Ditangani',
        body: 'Foto yang Anda ambil atau pilih dikirim ke server kami untuk dianalisis dan diteruskan langsung ke model AI Anthropic. Foto itu sendiri tidak disimpan di server kami, dan tidak ada yang tersisa setelah analisis selesai. Namun, untuk menggunakan layanan ini Anda harus masuk (login), dan permintaan analisis diproses terkait dengan akun Anda yang sedang login.',
      },
      {
        heading: 'Informasi Akun',
        body: 'Untuk menggunakan layanan ini, Anda perlu membuat akun dengan alamat email dan kata sandi. Kata sandi Anda disimpan dalam bentuk terenkripsi, sedemikian rupa sehingga bahkan kami tidak dapat memulihkan kata sandi asli. Bersama akun Anda, kami menyimpan tanggal pendaftaran, tanggal berakhirnya masa uji coba, dan status langganan Anda. Untuk menghapus akun Anda, silakan hubungi azabumin@gmail.com.',
      },
      {
        heading: 'Informasi Pembayaran',
        body: 'Pembayaran langganan diproses melalui penyedia pembayaran kami, ZEUS. Nomor kartu dan detail pembayaran lainnya tidak pernah disimpan di server kami.',
      },
      {
        heading: 'Informasi yang Kami Simpan',
        body: 'Untuk menjaga layanan tetap berjalan dengan andal setelah masa uji coba gratis berakhir, kami hanya mencatat sementara jumlah analisis harian per alamat IP, selama 24 jam. Informasi ini akan otomatis terhapus keesokan harinya dan tidak digunakan untuk tujuan lain.',
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
        body: 'Jika Anda memiliki pertanyaan tentang kebijakan ini, silakan hubungi azabumin@gmail.com atau buka issue di repositori GitHub aplikasi.',
      },
    ],
  },
  tl: {
    title: 'Patakaran sa Privacy',
    updated: 'Huling na-update: Agosto 2026',
    sections: [
      {
        heading: 'Paano Hinahawakan ang mga Larawan',
        body: 'Ang mga larawang kinuha o pinili mo ay ipinapadala sa aming server para sa pagsusuri at direktang ipinapasa sa AI model ng Anthropic. Ang mismong larawan ay hindi nakaimbak sa aming server, at walang naiiwan kapag tapos na ang pagsusuri. Gayunpaman, kailangan mong mag-log in upang magamit ang serbisyo, at ang mga hiling sa pagsusuri ay pinoproseso na naka-ugnay sa iyong naka-log in na account.',
      },
      {
        heading: 'Impormasyon ng Account',
        body: 'Upang magamit ang serbisyo, kailangan kang gumawa ng account gamit ang email address at password. Ang iyong password ay naka-imbak nang naka-encrypt, sa paraang kahit kami ay hindi na maibabalik ang orihinal na password. Kasama ng iyong account, iniimbak namin ang petsa ng pagpaparehistro, petsa ng pagtatapos ng libreng pagsubok, at status ng iyong subscription. Upang burahin ang iyong account, mangyaring makipag-ugnayan sa azabumin@gmail.com.',
      },
      {
        heading: 'Impormasyon sa Pagbabayad',
        body: 'Ang mga bayad sa subscription ay pinoproseso sa pamamagitan ng aming provider ng pagbabayad, ZEUS. Ang mga numero ng card at iba pang detalye ng pagbabayad ay hindi kailanman naiimbak sa aming mga server.',
      },
      {
        heading: 'Impormasyong Iniimbak Namin',
        body: 'Upang mapanatiling maaasahan ang serbisyo pagkatapos ng libreng panahon ng pagsubok, pansamantala lang naming itinatala ang bilang ng pang-araw-araw na pagsusuri kada IP address, sa loob ng 24 oras. Awtomatikong buburahin ang impormasyong ito kinabukasan at hindi ito ginagamit para sa anumang ibang layunin.',
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
        body: 'Kung may mga tanong ka tungkol sa patakarang ito, mangyaring makipag-ugnayan sa azabumin@gmail.com o mag-open ng issue sa GitHub repository ng app.',
      },
    ],
  },
  th: {
    title: 'นโยบายความเป็นส่วนตัว',
    updated: 'อัปเดตล่าสุด: สิงหาคม 2026',
    sections: [
      {
        heading: 'วิธีจัดการรูปภาพ',
        body: 'รูปภาพที่คุณถ่ายหรือเลือกจะถูกส่งไปยังเซิร์ฟเวอร์ของเราเพื่อวิเคราะห์และส่งต่อไปยังโมเดล AI ของ Anthropic โดยตรง ตัวรูปภาพเองจะไม่ถูกจัดเก็บบนเซิร์ฟเวอร์ของเรา และจะไม่มีสิ่งใดหลงเหลืออยู่หลังจากวิเคราะห์เสร็จสิ้น อย่างไรก็ตาม การใช้บริการนี้จำเป็นต้องเข้าสู่ระบบ และคำขอวิเคราะห์จะถูกประมวลผลโดยเชื่อมโยงกับบัญชีที่คุณเข้าสู่ระบบอยู่',
      },
      {
        heading: 'ข้อมูลบัญชี',
        body: 'การใช้บริการนี้จำเป็นต้องสร้างบัญชีด้วยอีเมลและรหัสผ่าน รหัสผ่านของคุณจะถูกจัดเก็บในรูปแบบเข้ารหัส จนกระทั่งแม้แต่เราก็ไม่สามารถกู้คืนรหัสผ่านต้นฉบับได้ นอกจากบัญชีแล้ว เรายังจัดเก็บวันที่สมัคร วันที่สิ้นสุดการทดลองใช้ และสถานะการสมัครสมาชิกของคุณ หากต้องการลบบัญชี กรุณาติดต่อ azabumin@gmail.com',
      },
      {
        heading: 'ข้อมูลการชำระเงิน',
        body: 'การชำระเงินค่าสมัครสมาชิกจะดำเนินการผ่านผู้ให้บริการชำระเงินของเรา ZEUS หมายเลขบัตรและรายละเอียดการชำระเงินอื่นๆ จะไม่ถูกจัดเก็บบนเซิร์ฟเวอร์ของเราเลย',
      },
      {
        heading: 'ข้อมูลที่เราเก็บไว้',
        body: 'เพื่อให้บริการดำเนินต่อไปได้อย่างเสถียรหลังจากช่วงทดลองใช้ฟรีสิ้นสุดลง เราจะบันทึกจำนวนการวิเคราะห์รายวันต่อที่อยู่ IP เพียงชั่วคราวเป็นเวลา 24 ชั่วโมงเท่านั้น ข้อมูลนี้จะถูกลบโดยอัตโนมัติในวันถัดไปและไม่ถูกนำไปใช้เพื่อวัตถุประสงค์อื่นใด',
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
        body: 'หากคุณมีคำถามเกี่ยวกับนโยบายนี้ กรุณาติดต่อ azabumin@gmail.com หรือเปิด issue บน GitHub repository ของแอป',
      },
    ],
  },
  my: {
    title: 'ကိုယ်ရေးအချက်အလက် မူဝါဒ',
    updated: 'နောက်ဆုံးမွမ်းမံသည့်ရက်: ၂၀၂၆ ခုနှစ် သြဂုတ်လ',
    sections: [
      {
        heading: 'ဓာတ်ပုံများကို ကိုင်တွယ်ပုံ',
        body: 'သင်ရိုက်ကူး သို့မဟုတ် ရွေးချယ်သော ဓာတ်ပုံများကို ခွဲခြမ်းစိတ်ဖြာရန် ကျွန်ုပ်တို့၏ ဆာဗာသို့ ပေးပို့ပြီး Anthropic ၏ AI မော်ဒယ်သို့ တိုက်ရိုက် ပေးပို့ပါသည်။ ဓာတ်ပုံကိုယ်တိုင်ကို ကျွန်ုပ်တို့ ဆာဗာတွင် သိမ်းဆည်းမထားပါ၊ ခွဲခြမ်းစိတ်ဖြာမှု ပြီးဆုံးပါက မည်သည့်အရာမျှ မကျန်ရှိတော့ပါ။ သို့သော် ဝန်ဆောင်မှုကို အသုံးပြုရန် လော့ဂ်အင် ဝင်ရန် လိုအပ်ပြီး၊ ခွဲခြမ်းစိတ်ဖြာမှု တောင်းဆိုချက်များကို သင့်လော့ဂ်အင်ဝင်ထားသော အကောင့်နှင့် ချိတ်ဆက်၍ လုပ်ဆောင်ပါသည်။',
      },
      {
        heading: 'အကောင့် အချက်အလက်',
        body: 'ဝန်ဆောင်မှုကို အသုံးပြုရန် အီးမေးလ်လိပ်စာနှင့် စကားဝှက်ဖြင့် အကောင့်တစ်ခု ဖန်တီးရန် လိုအပ်ပါသည်။ သင့်စကားဝှက်ကို ကျွန်ုပ်တို့ပင် မူရင်းအတိုင်း ပြန်ရယူ၍ မရနိုင်အောင် ကုဒ်ဝှက်ပြီး သိမ်းဆည်းထားပါသည်။ အကောင့်နှင့်အတူ မှတ်ပုံတင်ရက်၊ စမ်းသပ်ကာလ ကုန်ဆုံးရက်နှင့် စာရင်းသွင်းမှု အခြေအနေကို သိမ်းဆည်းထားပါသည်။ အကောင့်ဖျက်ရန် ရှိပါက azabumin@gmail.com သို့ ဆက်သွယ်ပါ။',
      },
      {
        heading: 'ငွေပေးချေမှု အချက်အလက်',
        body: 'စာရင်းသွင်းမှု ငွေပေးချေမှုများကို ကျွန်ုပ်တို့၏ ငွေပေးချေမှု ဝန်ဆောင်သူ ZEUS မှတစ်ဆင့် လုပ်ဆောင်ပြီး၊ ကတ်နံပါတ်နှင့် အခြား ငွေပေးချေမှု အသေးစိတ်များကို ကျွန်ုပ်တို့ ဆာဗာများတွင် ဘယ်တော့မှ သိမ်းဆည်းမထားပါ။',
      },
      {
        heading: 'ကျွန်ုပ်တို့ သိမ်းဆည်းထားသည့် အချက်အလက်',
        body: 'အခမဲ့ စမ်းသပ်ကာလ ကုန်ဆုံးပြီးနောက်လည်း ဝန်ဆောင်မှုကို တည်ငြိမ်စွာ ဆက်လက်ပေးအပ်နိုင်ရန်၊ IP လိပ်စာတစ်ခုချင်းစီအလိုက် နေ့စဉ် ခွဲခြမ်းစိတ်ဖြာမှု အရေအတွက်ကိုသာ ၂၄ နာရီအတွင်း ယာယီမှတ်တမ်းတင်ပါသည်။ ဤအချက်အလက်ကို နောက်တစ်နေ့တွင် အလိုအလျောက် ဖျက်ပစ်ပြီး အခြားရည်ရွယ်ချက်အတွက် အသုံးမပြုပါ။',
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
        body: 'ဤမူဝါဒနှင့်ပတ်သက်၍ သင့်တွင် မေးခွန်းများရှိပါက azabumin@gmail.com သို့ ဆက်သွယ်ပါ သို့မဟုတ် အက်ပ်၏ GitHub repository တွင် issue တစ်ခု ဖွင့်ပေးပါ။',
      },
    ],
  },
  ne: {
    title: 'गोपनीयता नीति',
    updated: 'अन्तिम अद्यावधिक: अगस्ट २०२६',
    sections: [
      {
        heading: 'फोटोहरू कसरी ह्यान्डल गरिन्छ',
        body: 'तपाईंले खिच्नु भएको वा छान्नु भएको फोटोहरू विश्लेषणको लागि हाम्रो सर्भरमा पठाइन्छ र सीधै Anthropic को AI मोडेलमा पास गरिन्छ। फोटो आफैं हाम्रो सर्भरमा भण्डारण गरिँदैन, र विश्लेषण पूरा भएपछि केही पनि बाँकी रहँदैन। तथापि, सेवा प्रयोग गर्न लगइन आवश्यक छ, र विश्लेषण अनुरोधहरू तपाईंको लगइन गरिएको खातासँग जोडिएर प्रशोधन गरिन्छ।',
      },
      {
        heading: 'खाता जानकारी',
        body: 'सेवा प्रयोग गर्न, तपाईंले इमेल ठेगाना र पासवर्डको साथ खाता सिर्जना गर्नुपर्छ। तपाईंको पासवर्ड इन्क्रिप्ट गरिएको रूपमा भण्डारण गरिन्छ, यसरी हामीले पनि मूल पासवर्ड फिर्ता प्राप्त गर्न सक्दैनौं। तपाईंको खातासँगै, हामी दर्ता मिति, परीक्षण समाप्ति मिति, र सदस्यता स्थिति भण्डारण गर्छौं। तपाईंको खाता मेटाउन चाहनुहुन्छ भने, कृपया azabumin@gmail.com मा सम्पर्क गर्नुहोस्।',
      },
      {
        heading: 'भुक्तानी जानकारी',
        body: 'सदस्यता भुक्तानीहरू हाम्रो भुक्तानी प्रदायक, ZEUS मार्फत प्रशोधन गरिन्छ। कार्ड नम्बर र अन्य भुक्तानी विवरणहरू हाम्रो सर्भरमा कहिल्यै भण्डारण गरिँदैन।',
      },
      {
        heading: 'हामीले राख्ने जानकारी',
        body: 'निःशुल्क परीक्षण अवधि समाप्त भएपछि पनि सेवालाई भरपर्दो रूपमा चलिरहन, हामी प्रत्येक IP ठेगानाको दैनिक विश्लेषण संख्या मात्र २४ घण्टाको लागि अस्थायी रूपमा लग गर्छौं। यो जानकारी भोलिपल्ट स्वचालित रूपमा मेटिन्छ र अन्य कुनै उद्देश्यको लागि प्रयोग गरिँदैन।',
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
        body: 'यदि तपाईंसँग यो नीतिको बारेमा प्रश्नहरू छन् भने, कृपया azabumin@gmail.com मा सम्पर्क गर्नुहोस् वा एपको GitHub रिपोजिटरीमा issue खोल्नुहोस्।',
      },
    ],
  },
  pt: {
    title: 'Política de Privacidade',
    updated: 'Última atualização: agosto de 2026',
    sections: [
      {
        heading: 'Como as Fotos São Tratadas',
        body: 'As fotos que você tira ou escolhe são enviadas ao nosso servidor para análise e repassadas diretamente ao modelo de IA da Anthropic. A própria foto não é armazenada em nosso servidor, e nada permanece após a conclusão da análise. No entanto, usar o serviço requer login, e as solicitações de análise são processadas vinculadas à sua conta conectada.',
      },
      {
        heading: 'Informações da Conta',
        body: 'Para usar o serviço, você precisa criar uma conta com endereço de e-mail e senha. Sua senha é armazenada de forma criptografada, de modo que nem mesmo nós podemos recuperar a senha original. Junto com sua conta, armazenamos a data de cadastro, a data de término do período de teste e o status da assinatura. Para excluir sua conta, entre em contato pelo azabumin@gmail.com.',
      },
      {
        heading: 'Informações de Pagamento',
        body: 'Os pagamentos de assinatura são processados por meio do nosso provedor de pagamento, ZEUS. Números de cartão e outros detalhes de pagamento nunca são armazenados em nossos servidores.',
      },
      {
        heading: 'Informações que Mantemos',
        body: 'Para manter o serviço funcionando de forma confiável após o período de teste gratuito, registramos temporariamente apenas o número de análises diárias por endereço IP, por 24 horas. Essas informações são excluídas automaticamente no dia seguinte e não são usadas para nenhuma outra finalidade.',
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
        body: 'Se você tiver dúvidas sobre esta política, entre em contato pelo azabumin@gmail.com ou abra uma issue no repositório GitHub do aplicativo.',
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
