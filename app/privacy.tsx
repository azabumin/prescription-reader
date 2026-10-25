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
    updated: '최종 수정일: 2026년 10월',
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
        heading: '약국에서 보여 주는 메모',
        body: '「약국에서 보여 주는 메모」에 입력한 내용(알레르기, 부작용 이력, 치료 중인 병, 사용 중인 약 등)은 이 기기의 브라우저에만 저장됩니다. 다만 자유롭게 쓴 칸의 글만은 「일본어로 번역」을 눌렀을 때에 한해 번역을 위해 저희 서버를 거쳐 Anthropic사의 AI 모델로 보내집니다. 메모의 다른 내용은 보내지 않으며, 보낸 글이나 번역이 저희 서버에 남지도 않습니다. 「메모 지우기」로 언제든지 삭제할 수 있습니다.',
      },
      {
        heading: '처방전을 약국에 보내는 기능',
        body: '약국의 QR 코드에서 「처방전을 약국에 보내기」를 사용하면, 처방전 사진, 초진 설문 답변, 받으러 갈 시각(입력한 경우 메일 주소)이 선택한 약국에 전달되도록 저희 서버에 임시로 저장됩니다. 회원가입은 필요 없습니다. 처방전 읽기와 자유롭게 쓴 칸의 일본어 번역에는 Anthropic사(미국)의 AI 모델을 사용합니다. 저장된 내용은 약국이 접수를 「완료」로 처리하면 삭제되며, 완료되지 않아도 보낸 지 7일 뒤 자동으로 삭제됩니다. 메일 주소는 약국에서 답장이 왔다는 것을 알리는 데만 쓰며, 메일에 약 이름 등은 쓰지 않습니다. 서비스 개선을 위해 접수부터 답장까지의 시간 등을 기록하지만, 개인을 특정할 수 있는 정보는 포함하지 않습니다.',
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
    updated: '最終更新日: 2026年10月',
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
        heading: '薬局で見せるメモ',
        body: '「薬局で見せるメモ」に入力した内容（アレルギー、副作用歴、治療中の病気、使用中の薬など）は、この端末のブラウザ内にのみ保存されます。ただし、自由に書いた欄の文章だけは、「日本語に翻訳する」を押したときに限り、翻訳のため当方のサーバーを経由してAnthropic社のAIモデルに送られます。メモのほかの内容は送られず、送った文章や翻訳が当方のサーバーに残ることもありません。「メモを消す」でいつでも削除できます。',
      },
      {
        heading: '処方箋を薬局に送る機能',
        body: '薬局のQRコードから「処方箋を薬局に送る」を使うと、処方箋の写真、初回アンケートの答え、受け取りの希望時刻（と、入力した場合はメールアドレス）が、選んだ薬局に届くよう当方のサーバーに一時的に保存されます。会員登録は不要です。処方箋の読み取りと、自由に書いた欄の日本語への翻訳には、Anthropic社（米国）のAIモデルを使います。保存した内容は、薬局が受付を「完了」にした時点で削除され、完了されなくても送信から7日で自動的に削除されます。メールアドレスは薬局から返信があったことをお知らせするためだけに使い、メールに薬の名前などは書きません。サービス改善のため、受付から返信までの時間などの記録を残しますが、個人を特定できる情報は含みません。',
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
    updated: 'Last updated: October 2026',
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
        heading: 'Pharmacy Memo',
        body: 'What you enter in the "Memo to show at the pharmacy" (allergies, side effects, illnesses, current medicines, etc.) is saved only in this device’s browser. The one exception is the text you type yourself in the free-text fields: only when you tap "Translate into Japanese" is that text sent through our server to Anthropic’s AI model to be translated. Nothing else in the memo is sent, and neither the text nor its translation is kept on our server. You can delete the memo at any time with "Delete memo".',
      },
      {
        heading: 'Sending a Prescription to a Pharmacy',
        body: 'When you use "Send your prescription to a pharmacy" from a pharmacy\'s QR code, the prescription photo, your questionnaire answers, the pickup time you chose (and your email address, if you enter one) are stored temporarily on our server so that they reach the pharmacy you chose. No account is needed. Anthropic\'s AI models (in the United States) are used to read the prescription and to translate what you wrote freely into Japanese. The stored content is deleted when the pharmacy marks the request as complete, and automatically 7 days after sending if it is not. Your email address is used only to tell you that the pharmacy has replied; the email does not include medicine names or other details. To improve the service we keep records such as the time from sending to the pharmacy\'s reply, without information that identifies you.',
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
    updated: 'Cập nhật lần cuối: Tháng 10 năm 2026',
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
        heading: 'Ghi Chú Cho Nhà Thuốc',
        body: 'Nội dung bạn nhập vào "Ghi chú đưa cho nhà thuốc xem" (dị ứng, tác dụng phụ, bệnh đang điều trị, thuốc đang dùng…) chỉ được lưu trong trình duyệt của thiết bị này. Riêng phần chữ bạn tự viết trong các ô nhập tự do: chỉ khi bạn bấm "Dịch sang tiếng Nhật", phần chữ đó mới được gửi qua máy chủ của chúng tôi đến mô hình AI của Anthropic để dịch. Các nội dung khác của ghi chú không được gửi, và phần chữ đã gửi cùng bản dịch không được lưu trên máy chủ của chúng tôi. Bạn có thể xóa bất cứ lúc nào bằng "Xóa ghi chú".',
      },
      {
        heading: 'Gửi Đơn Thuốc Đến Nhà Thuốc',
        body: 'Khi bạn dùng "Gửi đơn thuốc đến nhà thuốc" từ mã QR của nhà thuốc, ảnh đơn thuốc, câu trả lời phiếu hỏi, thời gian muốn nhận thuốc (và địa chỉ email nếu bạn nhập) được lưu tạm thời trên máy chủ của chúng tôi để gửi đến nhà thuốc bạn chọn. Không cần đăng ký tài khoản. Chúng tôi dùng mô hình AI của Anthropic (Hoa Kỳ) để đọc đơn thuốc và dịch phần bạn tự viết sang tiếng Nhật. Nội dung đã lưu sẽ bị xóa khi nhà thuốc đánh dấu "hoàn tất", và tự động bị xóa sau 7 ngày kể từ khi gửi nếu chưa hoàn tất. Địa chỉ email chỉ dùng để báo cho bạn biết nhà thuốc đã trả lời; email không ghi tên thuốc hay thông tin khác. Để cải thiện dịch vụ, chúng tôi lưu các thông tin như thời gian từ lúc gửi đến lúc nhà thuốc trả lời, không bao gồm thông tin xác định cá nhân.',
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
    updated: '最后更新:2026年10月',
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
        heading: '给药店看的备忘',
        body: '您在「给药店看的备忘」中填写的内容（过敏、副作用、正在治疗的疾病、正在使用的药等）只保存在本设备的浏览器中。唯一的例外是您在自由填写栏中写的文字：仅在您点击「翻译成日语」时，这些文字才会经由我们的服务器发送给 Anthropic 公司的 AI 模型进行翻译。备忘的其他内容不会发送，发送的文字及其译文也不会保存在我们的服务器上。您可以随时通过「删除备忘」删除。',
      },
      {
        heading: '把处方发送给药店',
        body: '通过药店的二维码使用“把处方发送给药店”时，处方照片、初诊问卷的回答、希望取药的时间（以及您填写的邮箱地址）会暂时保存在我们的服务器上，以便送达您选择的药店。无需注册账户。读取处方以及把您自由填写的内容翻译成日语时，会使用Anthropic公司（美国）的AI模型。保存的内容会在药店将受理标记为“完成”时删除；即使未完成，也会在发送7天后自动删除。邮箱地址仅用于通知您药店已回复，邮件中不写药名等内容。为改进服务，我们会保留从发送到药店回复所用时间等记录，但不包含可识别个人身份的信息。',
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
    updated: 'Terakhir diperbarui: Oktober 2026',
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
        heading: 'Catatan untuk Apotek',
        body: 'Isi "Catatan untuk ditunjukkan di apotek" (alergi, efek samping, penyakit yang sedang diobati, obat yang sedang dipakai, dll.) hanya disimpan di browser perangkat ini. Satu-satunya pengecualian adalah teks yang Anda ketik sendiri di kolom isian bebas: hanya saat Anda mengetuk "Terjemahkan ke bahasa Jepang", teks itu dikirim melalui server kami ke model AI Anthropic untuk diterjemahkan. Isi catatan lainnya tidak dikirim, dan teks beserta terjemahannya tidak disimpan di server kami. Anda bisa menghapusnya kapan saja dengan "Hapus catatan".',
      },
      {
        heading: 'Mengirim Resep ke Apotek',
        body: 'Saat Anda memakai "Kirim resep ke apotek" dari kode QR apotek, foto resep, jawaban kuesioner, waktu pengambilan yang Anda pilih (dan alamat email jika Anda mengisinya) disimpan sementara di server kami agar sampai ke apotek yang Anda pilih. Tidak perlu membuat akun. Model AI Anthropic (Amerika Serikat) digunakan untuk membaca resep dan menerjemahkan isian bebas Anda ke bahasa Jepang. Isi yang disimpan dihapus saat apotek menandai permintaan sebagai "selesai", dan otomatis dihapus 7 hari setelah dikirim jika belum selesai. Alamat email hanya dipakai untuk memberi tahu bahwa apotek sudah membalas; email tidak mencantumkan nama obat atau detail lain. Untuk meningkatkan layanan, kami menyimpan catatan seperti waktu dari pengiriman sampai balasan apotek, tanpa informasi yang dapat mengidentifikasi Anda.',
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
    updated: 'Huling na-update: Oktubre 2026',
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
        heading: 'Memo para sa Botika',
        body: 'Ang isinulat mo sa "Memo na ipapakita sa botika" (allergy, side effect, mga sakit na ginagamot, mga gamot na ginagamit, atbp.) ay naka-save lang sa browser ng device na ito. Ang tanging eksepsiyon ay ang tekstong ikaw mismo ang sumulat sa mga malayang field: kapag pinindot mo lang ang "Isalin sa Japanese", ipinapadala ang tekstong iyon sa pamamagitan ng aming server sa AI model ng Anthropic para maisalin. Hindi ipinapadala ang iba pang laman ng memo, at hindi itinatago sa aming server ang teksto at ang salin nito. Maaari mo itong burahin anumang oras gamit ang "Burahin ang memo".',
      },
      {
        heading: 'Pagpapadala ng Reseta sa Botika',
        body: 'Kapag ginamit mo ang "Ipadala ang reseta sa botika" mula sa QR code ng botika, pansamantalang iniimbak sa aming server ang litrato ng reseta, ang mga sagot sa questionnaire, ang oras na gusto mong kunin (at ang email address kung inilagay mo) para makarating sa botikang pinili mo. Hindi kailangan ng account. Gumagamit kami ng AI model ng Anthropic (Estados Unidos) para basahin ang reseta at isalin sa Japanese ang malaya mong isinulat. Binubura ang iniimbak na nilalaman kapag minarkahan ng botika na "tapos" ang kahilingan, at kusang binubura 7 araw pagkatapos ipadala kung hindi natapos. Ginagamit lang ang email address para sabihin sa iyo na sumagot na ang botika; walang pangalan ng gamot o ibang detalye sa email. Para mapabuti ang serbisyo, nagtatala kami ng mga bagay tulad ng tagal mula sa pagpapadala hanggang sa sagot ng botika, nang walang impormasyong makakakilala sa iyo.',
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
    updated: 'อัปเดตล่าสุด: ตุลาคม 2026',
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
        heading: 'บันทึกสำหรับร้านยา',
        body: 'ข้อมูลที่คุณกรอกใน "บันทึกสำหรับแสดงที่ร้านยา" (การแพ้ ผลข้างเคียง โรคที่กำลังรักษา ยาที่ใช้อยู่ ฯลฯ) จะถูกเก็บไว้ในเบราว์เซอร์ของอุปกรณ์นี้เท่านั้น ยกเว้นข้อความที่คุณพิมพ์เองในช่องกรอกอิสระ ซึ่งจะถูกส่งผ่านเซิร์ฟเวอร์ของเราไปยังโมเดล AI ของบริษัท Anthropic เพื่อแปล เฉพาะเมื่อคุณแตะ "แปลเป็นภาษาญี่ปุ่น" เท่านั้น ข้อมูลอื่นในบันทึกจะไม่ถูกส่ง และข้อความกับคำแปลจะไม่ถูกเก็บไว้ในเซิร์ฟเวอร์ของเรา คุณสามารถลบได้ทุกเมื่อด้วย "ลบบันทึก"',
      },
      {
        heading: 'การส่งใบสั่งยาไปที่ร้านยา',
        body: 'เมื่อคุณใช้ "ส่งใบสั่งยาไปที่ร้านยา" จาก QR โค้ดของร้านยา รูปใบสั่งยา คำตอบแบบสอบถาม เวลาที่ต้องการรับยา (และอีเมลหากคุณกรอก) จะถูกเก็บไว้ชั่วคราวบนเซิร์ฟเวอร์ของเราเพื่อส่งถึงร้านยาที่คุณเลือก ไม่ต้องสมัครบัญชี เราใช้โมเดล AI ของบริษัท Anthropic (สหรัฐอเมริกา) ในการอ่านใบสั่งยาและแปลข้อความที่คุณเขียนเองเป็นภาษาญี่ปุ่น ข้อมูลที่เก็บไว้จะถูกลบเมื่อร้านยากด "เสร็จสิ้น" และจะถูกลบอัตโนมัติภายใน 7 วันหลังส่งหากยังไม่เสร็จสิ้น อีเมลใช้เพื่อแจ้งว่าร้านยาตอบกลับแล้วเท่านั้น และในอีเมลจะไม่มีชื่อยาหรือรายละเอียดอื่น เพื่อปรับปรุงบริการ เราเก็บบันทึก เช่น เวลาตั้งแต่ส่งจนร้านยาตอบกลับ โดยไม่มีข้อมูลที่ระบุตัวบุคคลได้',
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
    updated: 'နောက်ဆုံးမွမ်းမံသည့်ရက်: ၂၀၂၆ ခုနှစ် အောက်တိုဘာလ',
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
        heading: 'ဆေးဆိုင်ပြရန် မှတ်စု',
        body: '"ဆေးဆိုင်တွင် ပြရန် မှတ်စု" တွင် ဖြည့်ထားသော အကြောင်းအရာများ (ဓာတ်မတည့်မှု၊ ဘေးထွက်ဆိုးကျိုး၊ ကုသနေသော ရောဂါ၊ သုံးနေသော ဆေး စသည်) ကို ဤစက်၏ ဘရောက်ဇာထဲတွင်သာ သိမ်းဆည်းပါသည်။ ခြွင်းချက်မှာ လွတ်လပ်စွာ ရေးသော အကွက်များတွင် သင်ကိုယ်တိုင် ရေးသော စာသားဖြစ်ပြီး "ဂျပန်ဘာသာသို့ ပြန်ရန်" ကို နှိပ်သည့်အခါမှသာ ထိုစာသားကို ဘာသာပြန်ရန် ကျွန်ုပ်တို့၏ ဆာဗာမှတစ်ဆင့် Anthropic ကုမ္ပဏီ၏ AI မော်ဒယ်သို့ ပို့ပါသည်။ မှတ်စု၏ အခြားအကြောင်းအရာများကို မပို့ပါ၊ စာသားနှင့် ဘာသာပြန်ချက်ကိုလည်း ကျွန်ုပ်တို့၏ ဆာဗာတွင် မသိမ်းဆည်းပါ။ "မှတ်စု ဖျက်ရန်" ဖြင့် အချိန်မရွေး ဖျက်နိုင်ပါသည်။',
      },
      {
        heading: 'ဆေးညွှန်းကို ဆေးဆိုင်သို့ ပို့ခြင်း',
        body: 'ဆေးဆိုင်၏ QR ကုဒ်မှ "ဆေးညွှန်းကို ဆေးဆိုင်သို့ ပို့ရန်" ကို အသုံးပြုသောအခါ ဆေးညွှန်း ဓာတ်ပုံ၊ မေးခွန်းလွှာ အဖြေများ၊ ဆေးလာယူလိုသည့် အချိန် (နှင့် ထည့်သွင်းပါက အီးမေးလ်လိပ်စာ) ကို သင်ရွေးသော ဆေးဆိုင်သို့ ရောက်စေရန် ကျွန်ုပ်တို့၏ ဆာဗာတွင် ယာယီ သိမ်းဆည်းပါသည်။ အကောင့်ဖွင့်ရန် မလိုပါ။ ဆေးညွှန်းဖတ်ရန်နှင့် သင်ကိုယ်တိုင်ရေးသော အပိုင်းကို ဂျပန်ဘာသာသို့ ပြန်ရန် Anthropic (အမေရိကန်) ၏ AI မော်ဒယ်ကို အသုံးပြုပါသည်။ သိမ်းဆည်းထားသော အကြောင်းအရာကို ဆေးဆိုင်က "ပြီးဆုံး" ဟု မှတ်သားသောအခါ ဖျက်ပြီး မပြီးဆုံးသေးလျှင်လည်း ပို့ပြီး ၇ ရက်အကြာတွင် အလိုအလျောက် ဖျက်ပါသည်။ အီးမေးလ်လိပ်စာကို ဆေးဆိုင်က အကြောင်းပြန်ကြောင်း အသိပေးရန်အတွက်သာ အသုံးပြုပြီး အီးမေးလ်တွင် ဆေးအမည် စသည်တို့ကို မရေးပါ။ ဝန်ဆောင်မှု တိုးတက်စေရန် ပို့ချိန်မှ ဆေးဆိုင် အကြောင်းပြန်ချိန်အထိ ကြာချိန် စသည့် မှတ်တမ်းများကို သိမ်းထားသော်လည်း ကိုယ်ရေးကို ခွဲခြားသိနိုင်သည့် အချက်အလက် မပါဝင်ပါ။',
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
    updated: 'अन्तिम अद्यावधिक: अक्टोबर २०२६',
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
        heading: 'फार्मेसीलाई देखाउने नोट',
        body: '"फार्मेसीमा देखाउने नोट" मा लेखिएका कुरा (एलर्जी, साइड इफेक्ट, उपचार गराइरहेको रोग, प्रयोग गरिरहेको औषधि आदि) यही उपकरणको ब्राउजरमा मात्र सुरक्षित हुन्छन्। अपवाद भनेको आफैँ लेख्ने खाली ठाउँमा तपाईंले लेखेको पाठ मात्र हो: "जापानीमा अनुवाद गर्नुहोस्" थिच्दा मात्र, त्यो पाठ अनुवादका लागि हाम्रो सर्भर हुँदै Anthropic कम्पनीको AI मोडेलमा पठाइन्छ। नोटका अन्य कुरा पठाइँदैनन्, र पाठ तथा त्यसको अनुवाद हाम्रो सर्भरमा राखिँदैन। "नोट मेटाउनुहोस्" थिचेर जुनसुकै बेला मेटाउन सकिन्छ।',
      },
      {
        heading: 'प्रेस्क्रिप्सन फार्मेसीमा पठाउने सुविधा',
        body: 'फार्मेसीको QR कोडबाट "प्रेस्क्रिप्सन फार्मेसीमा पठाउनुहोस्" प्रयोग गर्दा, प्रेस्क्रिप्सनको फोटो, प्रश्नावलीका जवाफ, औषधि लिन आउन चाहेको समय (र राख्नुभएमा इमेल ठेगाना) तपाईंले छानेको फार्मेसीमा पुग्न हाम्रो सर्भरमा अस्थायी रूपमा राखिन्छ। खाता बनाउन आवश्यक छैन। प्रेस्क्रिप्सन पढ्न र तपाईंले आफैं लेखेको भाग जापानीमा अनुवाद गर्न Anthropic (संयुक्त राज्य अमेरिका) को AI मोडेल प्रयोग गरिन्छ। राखिएको सामग्री फार्मेसीले "पूरा" गरेपछि मेटिन्छ, र पूरा नगरे पनि पठाएको ७ दिनपछि स्वतः मेटिन्छ। इमेल ठेगाना फार्मेसीले जवाफ दिएको जानकारी दिन मात्र प्रयोग गरिन्छ; इमेलमा औषधिको नाम आदि लेखिँदैन। सेवा सुधार गर्न, पठाएदेखि फार्मेसीको जवाफसम्मको समय जस्ता रेकर्ड राखिन्छ, तर व्यक्ति पहिचान हुने जानकारी समावेश हुँदैन।',
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
    updated: 'Última atualização: outubro de 2026',
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
        heading: 'Nota para a Farmácia',
        body: 'O que você preenche na "Nota para mostrar na farmácia" (alergias, efeitos colaterais, doenças em tratamento, remédios em uso etc.) fica salvo apenas no navegador deste aparelho. A única exceção é o texto que você mesmo escreve nos campos livres: somente quando você toca em "Traduzir para japonês", esse texto é enviado por meio do nosso servidor ao modelo de IA da Anthropic para ser traduzido. O restante da nota não é enviado, e o texto e a tradução não ficam guardados no nosso servidor. Você pode apagá-la a qualquer momento em "Apagar nota".',
      },
      {
        heading: 'Enviar a Receita para a Farmácia',
        body: 'Ao usar "Enviar a receita para a farmácia" pelo código QR da farmácia, a foto da receita, as respostas do questionário, o horário de retirada escolhido (e o seu e-mail, se você informar) ficam guardados temporariamente no nosso servidor para chegarem à farmácia que você escolheu. Não é preciso criar conta. Usamos modelos de IA da Anthropic (Estados Unidos) para ler a receita e traduzir para o japonês o que você escreveu livremente. O conteúdo guardado é apagado quando a farmácia marca o pedido como "concluído" e, se não for concluído, é apagado automaticamente 7 dias após o envio. O e-mail é usado apenas para avisar que a farmácia respondeu; o e-mail não inclui nomes de remédios nem outros detalhes. Para melhorar o serviço, guardamos registros como o tempo entre o envio e a resposta da farmácia, sem informações que identifiquem você.',
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
