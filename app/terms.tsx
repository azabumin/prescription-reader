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
        body: '이 앱은 처방전·약봉투 사진을 AI로 분석해 이해하기 쉬운 형태로 정리해 보여주는 서비스입니다. 가입 후 7일간 무료로 체험하실 수 있으며, 이후에는 구독이 필요합니다.',
      },
      {
        heading: '의료 조언이 아닙니다',
        body: '이 앱이 제공하는 정보는 사진에 적힌 내용을 AI가 읽고 쉬운 말로 옮긴 것으로, 진단·처방·의학적 조언을 대신하지 않습니다. 복용 방법이나 건강 상태에 대해 궁금하거나 걱정되는 점이 있으면 반드시 약사 또는 의사와 상담하세요. 사진 화질이나 필기체 등으로 인식이 부정확할 수 있습니다.',
      },
      {
        heading: '계정',
        body: '서비스 이용을 위해 이메일과 비밀번호로 계정을 만드셔야 합니다. 비밀번호 등 계정 정보는 이용자 본인이 안전하게 관리하셔야 하며, 계정을 통해 이루어진 이용에 대한 책임은 이용자 본인에게 있습니다. 부정 이용이나 이 약관 위반이 확인되는 경우 계정을 정지하거나 해지할 수 있습니다.',
      },
      {
        heading: '구독 및 결제',
        body: '가입 시점부터 7일간 무료로 이용하실 수 있으며, 이후 계속 이용하시려면 월간 구독이 필요합니다. 12개월 연속으로 이용하시면 13개월째 이용료가 무료가 됩니다. 결제는 신용카드로 결제대행사 ZEUS를 통해 처리되며, 구독은 매 결제 주기마다 자동으로 갱신됩니다. 디지털 서비스의 특성상 이미 결제하신 요금은 원칙적으로 환불해 드리지 않습니다. 다음 자동 갱신 중지(해지)는 마이페이지에서 언제든지 신청하실 수 있으며, 해지 후에도 이미 결제하신 기간의 종료일까지는 계속 서비스를 이용하실 수 있습니다.',
      },
      {
        heading: '이용 제한',
        body: '서버 운영 비용을 감당할 수 있는 범위 내에서 서비스를 유지하기 위해, 하루 이용 가능 횟수에 제한을 둘 수 있습니다. 제한에 도달하면 다음 날 다시 이용하실 수 있습니다.',
      },
      {
        heading: '책임의 한계',
        body: '이 앱은 분석 결과의 정확성을 보장하지 않습니다. 이 앱의 정보를 이용해 발생한 결과에 대해 개발자는 법이 허용하는 범위 내에서 책임을 지지 않습니다.',
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
        body: '本アプリは、処方箋・お薬の袋の写真をAIで分析し、わかりやすい形にまとめて表示するサービスです。ご登録から7日間は無料でお試しいただけ、以降はサブスクリプションのご契約が必要です。',
      },
      {
        heading: '医療アドバイスではありません',
        body: '本アプリが提供する情報は、写真に書かれた内容をAIが読み取りわかりやすく言い換えたものであり、診断・処方・医学的アドバイスに代わるものではありません。服用方法や健康状態について気になる点やご不安な点がある場合は、必ず薬剤師または医師にご相談ください。写真の画質や手書き文字などにより、認識結果が不正確になる場合があります。',
      },
      {
        heading: 'アカウント',
        body: 'サービスのご利用には、メールアドレスとパスワードによるアカウント登録が必要です。パスワードなどのアカウント情報はお客様ご自身で安全に管理いただく必要があり、アカウントを通じて行われた利用についてはお客様ご本人が責任を負います。不正利用や本規約違反が確認された場合、アカウントを停止または解約することがあります。',
      },
      {
        heading: 'サブスクリプションとお支払い',
        body: 'ご登録時点から7日間は無料でご利用いただけ、以降も引き続きご利用いただくには月額のサブスクリプションが必要です。12ヶ月連続でご利用いただくと、13ヶ月目のご利用料金が無料になります。お支払いはクレジットカードにより決済代行会社ZEUSを通じて処理され、サブスクリプションは各契約期間ごとに自動的に更新されます。デジタルサービスの性質上、お支払い済みの料金の返金は原則としてお受けしておりません。次回の自動更新の停止(解約)はいつでもマイページから手続きいただけ、解約後もお支払い済みの期間の終了日まで引き続きサービスをご利用いただけます。',
      },
      {
        heading: '利用制限',
        body: 'サーバー運営コストを賄える範囲でサービスを維持するため、1日あたりの利用回数に制限を設ける場合があります。制限に達した場合は、翌日以降に再度ご利用いただけます。',
      },
      {
        heading: '免責事項',
        body: '本アプリは、分析結果の正確性を保証するものではありません。本アプリの情報を利用したことにより生じた結果について、開発者は法令が許す範囲で責任を負いません。',
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
        body: 'This app is a tool that uses AI to analyze photos of prescriptions or medication labels and present the contents in an easy-to-understand form. You can try it free for 7 days after signing up; a subscription is required after that.',
      },
      {
        heading: 'Not Medical Advice',
        body: "The information this app provides is an AI's plain-language restatement of what's written in the photo — it is not a diagnosis, prescription, or medical advice. If you have questions or concerns about how to take your medication or about your health, please consult a pharmacist or doctor. Recognition may be inaccurate due to photo quality, handwriting, and similar factors.",
      },
      {
        heading: 'Account',
        body: 'Using the service requires creating an account with an email and password. You are responsible for keeping your account information (such as your password) secure, and you are responsible for any use of the service through your account. We may suspend or terminate an account if we find fraudulent use or a violation of these terms.',
      },
      {
        heading: 'Subscription & Payment',
        body: 'You can use the service free for 7 days from the time you sign up; continued use after that requires a monthly subscription. If you use the service for 12 consecutive months, the 13th month is free. Payment is made by credit card and processed through our payment provider, ZEUS, and the subscription renews automatically each billing period. Due to the nature of digital services, fees already paid are not refundable in principle. You may stop the next automatic renewal (cancel) at any time from My Page, and even after cancellation you can continue using the service until the end of the period you already paid for.',
      },
      {
        heading: 'Usage Limits',
        body: 'To keep this service running within what server costs allow, we may limit the number of analyses available per day. If you reach the limit, you can use the service again the next day.',
      },
      {
        heading: 'Limitation of Liability',
        body: 'This app does not guarantee the accuracy of analysis results. To the extent permitted by law, the developer is not liable for any outcome resulting from use of information from this app.',
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
        body: 'Ứng dụng này là một công cụ sử dụng AI để phân tích ảnh chụp đơn thuốc hoặc nhãn thuốc và trình bày nội dung dưới dạng dễ hiểu. Bạn có thể dùng thử miễn phí 7 ngày sau khi đăng ký; sau đó cần có gói đăng ký để tiếp tục sử dụng.',
      },
      {
        heading: 'Không Phải Lời Khuyên Y Tế',
        body: 'Thông tin mà ứng dụng này cung cấp là bản diễn giải bằng ngôn ngữ đơn giản của AI về những gì được ghi trong ảnh — đây không phải là chẩn đoán, đơn thuốc, hay lời khuyên y tế. Nếu bạn có thắc mắc hoặc lo lắng về cách dùng thuốc hoặc về sức khỏe của mình, vui lòng tham khảo ý kiến dược sĩ hoặc bác sĩ. Việc nhận dạng có thể không chính xác do chất lượng ảnh, chữ viết tay và các yếu tố tương tự.',
      },
      {
        heading: 'Tài Khoản',
        body: 'Để sử dụng dịch vụ, bạn cần tạo tài khoản bằng email và mật khẩu. Bạn có trách nhiệm bảo mật thông tin tài khoản (như mật khẩu) và chịu trách nhiệm về mọi hoạt động sử dụng dịch vụ thông qua tài khoản của mình. Chúng tôi có thể tạm ngừng hoặc chấm dứt tài khoản nếu phát hiện sử dụng gian lận hoặc vi phạm các điều khoản này.',
      },
      {
        heading: 'Gói Đăng Ký & Thanh Toán',
        body: 'Bạn có thể sử dụng dịch vụ miễn phí trong 7 ngày kể từ khi đăng ký; để tiếp tục sử dụng sau đó cần có gói đăng ký hàng tháng. Nếu bạn sử dụng dịch vụ liên tục trong 12 tháng, tháng thứ 13 sẽ được miễn phí. Thanh toán được thực hiện bằng thẻ tín dụng, xử lý qua nhà cung cấp thanh toán ZEUS, và gói đăng ký sẽ tự động gia hạn theo mỗi chu kỳ thanh toán. Do tính chất của dịch vụ kỹ thuật số, các khoản phí đã thanh toán về nguyên tắc sẽ không được hoàn lại. Bạn có thể dừng gia hạn tự động tiếp theo (hủy) bất cứ lúc nào từ Trang Của Tôi, và ngay cả sau khi hủy, bạn vẫn có thể tiếp tục sử dụng dịch vụ cho đến hết thời hạn đã thanh toán.',
      },
      {
        heading: 'Giới Hạn Sử Dụng',
        body: 'Để duy trì dịch vụ trong phạm vi chi phí máy chủ cho phép, chúng tôi có thể giới hạn số lượt phân tích khả dụng mỗi ngày. Nếu bạn đạt đến giới hạn, bạn có thể sử dụng dịch vụ lại vào ngày hôm sau.',
      },
      {
        heading: 'Giới Hạn Trách Nhiệm',
        body: 'Ứng dụng này không đảm bảo độ chính xác của kết quả phân tích. Trong phạm vi pháp luật cho phép, nhà phát triển không chịu trách nhiệm đối với bất kỳ hậu quả nào phát sinh từ việc sử dụng thông tin từ ứng dụng này.',
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
        body: '本应用是一款使用AI分析处方或药品标签照片,并以通俗易懂的形式呈现内容的工具。注册后可免费试用7天,此后需订阅才能继续使用。',
      },
      {
        heading: '并非医疗建议',
        body: '本应用提供的信息是AI对照片中内容的通俗语言复述——并非诊断、处方或医疗建议。如果您对用药方法或健康状况有任何疑问或担忧,请咨询药剂师或医生。由于照片质量、手写字迹等因素,识别结果可能不准确。',
      },
      {
        heading: '账户',
        body: '使用本服务需要通过邮箱和密码创建账户。您需自行妥善保管账户信息(如密码),并对通过您账户进行的任何使用行为负责。如发现欺诈使用或违反本条款的行为,我们可能会暂停或终止账户。',
      },
      {
        heading: '订阅与付款',
        body: '注册后可免费使用7天;此后如需继续使用,需订阅月付方案。如果您连续使用本服务12个月,第13个月将免费。付款通过信用卡完成,由支付服务商ZEUS处理,订阅将在每个计费周期自动续费。鉴于数字服务的性质,已支付的费用原则上不予退还。您可以随时在"我的页面"中停止下一次自动续费(取消),即使取消后,您仍可继续使用服务直至已支付期限结束。',
      },
      {
        heading: '使用限制',
        body: '为了在服务器成本允许的范围内维持本服务,我们可能会限制每日可用的分析次数。如果您达到限制,可以在次日再次使用本服务。',
      },
      {
        heading: '责任限制',
        body: '本应用不保证分析结果的准确性。在法律允许的范围内,开发者对因使用本应用信息而产生的任何后果不承担责任。',
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
        body: 'Aplikasi ini adalah alat yang menggunakan AI untuk menganalisis foto resep atau label obat dan menyajikan isinya dalam bentuk yang mudah dipahami. Anda dapat mencobanya gratis selama 7 hari setelah mendaftar; setelah itu diperlukan langganan.',
      },
      {
        heading: 'Bukan Nasihat Medis',
        body: 'Informasi yang diberikan aplikasi ini adalah penyampaian ulang oleh AI dalam bahasa sederhana atas apa yang tertulis dalam foto — ini bukan diagnosis, resep, atau nasihat medis. Jika Anda memiliki pertanyaan atau kekhawatiran tentang cara minum obat atau kesehatan Anda, silakan berkonsultasi dengan apoteker atau dokter. Pengenalan mungkin tidak akurat karena kualitas foto, tulisan tangan, dan faktor serupa.',
      },
      {
        heading: 'Akun',
        body: 'Untuk menggunakan layanan ini, Anda perlu membuat akun dengan email dan kata sandi. Anda bertanggung jawab untuk menjaga keamanan informasi akun Anda (seperti kata sandi), dan Anda bertanggung jawab atas segala penggunaan layanan melalui akun Anda. Kami dapat menangguhkan atau menghentikan akun jika ditemukan penggunaan yang curang atau pelanggaran terhadap ketentuan ini.',
      },
      {
        heading: 'Langganan & Pembayaran',
        body: 'Anda dapat menggunakan layanan ini secara gratis selama 7 hari sejak mendaftar; penggunaan berkelanjutan setelah itu memerlukan langganan bulanan. Jika Anda menggunakan layanan ini selama 12 bulan berturut-turut, bulan ke-13 akan gratis. Pembayaran dilakukan dengan kartu kredit dan diproses melalui penyedia pembayaran kami, ZEUS, dan langganan diperpanjang secara otomatis setiap periode penagihan. Karena sifat layanan digital, biaya yang sudah dibayarkan pada prinsipnya tidak dapat dikembalikan. Anda dapat menghentikan perpanjangan otomatis berikutnya (membatalkan) kapan saja dari Halaman Saya, dan bahkan setelah pembatalan, Anda tetap dapat menggunakan layanan hingga akhir periode yang sudah dibayar.',
      },
      {
        heading: 'Batasan Penggunaan',
        body: 'Untuk menjaga layanan ini tetap berjalan sesuai biaya server yang memungkinkan, kami dapat membatasi jumlah analisis yang tersedia per hari. Jika Anda mencapai batas tersebut, Anda dapat menggunakan layanan ini lagi keesokan harinya.',
      },
      {
        heading: 'Batasan Tanggung Jawab',
        body: 'Aplikasi ini tidak menjamin keakuratan hasil analisis. Sejauh diizinkan oleh hukum, pengembang tidak bertanggung jawab atas hasil apa pun yang timbul dari penggunaan informasi dari aplikasi ini.',
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
        body: 'Ang app na ito ay isang tool na gumagamit ng AI upang suriin ang mga litrato ng reseta o label ng gamot at ipakita ang mga nilalaman sa isang madaling maunawaang anyo. Maaari mo itong subukan nang libre sa loob ng 7 araw pagkatapos mag-sign up; kailangan ng subscription pagkatapos noon.',
      },
      {
        heading: 'Hindi Medikal na Payo',
        body: 'Ang impormasyong ibinibigay ng app na ito ay muling pagsasabi ng AI sa simpleng wika ng nakasulat sa litrato — hindi ito diagnosis, reseta, o medikal na payo. Kung may mga tanong o alalahanin ka tungkol sa pag-inom ng iyong gamot o sa iyong kalusugan, mangyaring kumonsulta sa isang parmasyutiko o doktor. Maaaring hindi tumpak ang pagkilala dahil sa kalidad ng litrato, sulat-kamay, at katulad na mga salik.',
      },
      {
        heading: 'Account',
        body: 'Upang gamitin ang serbisyo, kailangan kang gumawa ng account gamit ang email at password. Ikaw ang responsable sa pananatiling secure ng impormasyon ng iyong account (tulad ng password), at ikaw ang mananagot sa anumang paggamit ng serbisyo sa pamamagitan ng iyong account. Maaari naming suspindihin o wakasan ang isang account kung matuklasan ang mapanlinlang na paggamit o paglabag sa mga tuntuning ito.',
      },
      {
        heading: 'Subscription at Pagbabayad',
        body: 'Maaari mong gamitin ang serbisyo nang libre sa loob ng 7 araw mula nang mag-sign up ka; kailangan ng buwanang subscription para sa patuloy na paggamit pagkatapos noon. Kung gagamitin mo ang serbisyo nang 12 magkakasunod na buwan, libre ang ika-13 buwan. Ang pagbabayad ay gagawin gamit ang credit card at pinoproseso sa pamamagitan ng aming provider ng pagbabayad, ZEUS, at awtomatikong nagre-renew ang subscription sa bawat billing period. Dahil sa katangian ng mga digital na serbisyo, ang mga bayad na na-charge ay hindi na maibabalik sa prinsipyo. Maaari mong ihinto ang susunod na awtomatikong pag-renew (kanselahin) anumang oras mula sa My Page, at kahit pagkatapos kanselahin, maaari mo pa ring gamitin ang serbisyo hanggang sa katapusan ng panahong nabayaran mo na.',
      },
      {
        heading: 'Mga Limitasyon sa Paggamit',
        body: 'Upang mapanatili ang serbisyong ito sa loob ng kayang gastusin sa server, maaari naming limitahan ang bilang ng mga magagamit na pagsusuri bawat araw. Kung maabot mo ang limitasyon, maaari mong gamitin muli ang serbisyo sa susunod na araw.',
      },
      {
        heading: 'Limitasyon ng Pananagutan',
        body: 'Hindi ginagarantiyahan ng app na ito ang katumpakan ng mga resulta ng pagsusuri. Hanggang sa saklaw na pinahihintulutan ng batas, ang developer ay hindi mananagot para sa anumang kinalabasan mula sa paggamit ng impormasyon mula sa app na ito.',
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
        body: 'แอปนี้เป็นเครื่องมือที่ใช้ AI วิเคราะห์รูปถ่ายใบสั่งยาหรือฉลากยา และนำเสนอเนื้อหาในรูปแบบที่เข้าใจง่าย คุณสามารถทดลองใช้ฟรีได้ 7 วันหลังจากลงทะเบียน หลังจากนั้นจำเป็นต้องสมัครสมาชิก',
      },
      {
        heading: 'ไม่ใช่คำแนะนำทางการแพทย์',
        body: 'ข้อมูลที่แอปนี้ให้มาเป็นการอธิบายซ้ำด้วยภาษาง่ายๆ ของ AI จากสิ่งที่เขียนอยู่ในรูปภาพ — ไม่ใช่การวินิจฉัย ใบสั่งยา หรือคำแนะนำทางการแพทย์ หากคุณมีคำถามหรือข้อกังวลเกี่ยวกับวิธีการใช้ยาหรือสุขภาพของคุณ กรุณาปรึกษาเภสัชกรหรือแพทย์ การจดจำอาจไม่ถูกต้องเนื่องจากคุณภาพของรูปภาพ ลายมือ และปัจจัยที่คล้ายกัน',
      },
      {
        heading: 'บัญชี',
        body: 'การใช้บริการนี้จำเป็นต้องสร้างบัญชีด้วยอีเมลและรหัสผ่าน คุณมีหน้าที่รับผิดชอบในการรักษาความปลอดภัยของข้อมูลบัญชี (เช่น รหัสผ่าน) และคุณต้องรับผิดชอบต่อการใช้งานบริการใดๆ ผ่านบัญชีของคุณ เราอาจระงับหรือยกเลิกบัญชีหากพบการใช้งานที่ฉ้อโกงหรือละเมิดข้อกำหนดเหล่านี้',
      },
      {
        heading: 'การสมัครสมาชิกและการชำระเงิน',
        body: 'คุณสามารถใช้บริการฟรีได้ 7 วันนับจากวันที่ลงทะเบียน หลังจากนั้นจำเป็นต้องสมัครสมาชิกรายเดือนเพื่อใช้งานต่อ หากคุณใช้บริการต่อเนื่อง 12 เดือน เดือนที่ 13 จะไม่มีค่าใช้จ่าย การชำระเงินทำผ่านบัตรเครดิตและดำเนินการผ่านผู้ให้บริการชำระเงินของเรา ZEUS และการสมัครสมาชิกจะต่ออายุอัตโนมัติทุกรอบการเรียกเก็บเงิน เนื่องจากลักษณะของบริการดิจิทัล ค่าธรรมเนียมที่ชำระแล้วโดยหลักการจะไม่สามารถขอคืนได้ คุณสามารถหยุดการต่ออายุอัตโนมัติครั้งถัดไป (ยกเลิก) ได้ทุกเมื่อจากหน้า My Page และแม้หลังจากยกเลิกแล้ว คุณยังคงสามารถใช้บริการต่อไปได้จนกว่าจะสิ้นสุดระยะเวลาที่ชำระเงินไว้แล้ว',
      },
      {
        heading: 'ข้อจำกัดในการใช้งาน',
        body: 'เพื่อให้บริการนี้ดำเนินต่อไปได้ภายในงบประมาณค่าเซิร์ฟเวอร์ เราอาจจำกัดจำนวนการวิเคราะห์ที่ใช้ได้ต่อวัน หากคุณถึงขีดจำกัดแล้ว คุณสามารถใช้บริการอีกครั้งในวันถัดไป',
      },
      {
        heading: 'ข้อจำกัดความรับผิดชอบ',
        body: 'แอปนี้ไม่รับประกันความถูกต้องของผลการวิเคราะห์ ภายในขอบเขตที่กฎหมายอนุญาต ผู้พัฒนาจะไม่รับผิดชอบต่อผลลัพธ์ใดๆ ที่เกิดจากการใช้ข้อมูลจากแอปนี้',
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
        body: 'ဤအက်ပ်သည် ဆေးညွှန်း သို့မဟုတ် ဆေးလိပ်စာအမှတ်တံဆိပ်များ၏ ဓာတ်ပုံများကို ခွဲခြမ်းစိတ်ဖြာရန်နှင့် အကြောင်းအရာများကို နားလည်ရလွယ်ကူသော ပုံစံဖြင့် တင်ပြရန် AI ကို အသုံးပြုသည့် ကိရိယာတစ်ခု ဖြစ်ပါသည်။ မှတ်ပုံတင်ပြီးနောက် ၇ ရက်ကြာ အခမဲ့ စမ်းသပ်နိုင်ပြီး၊ ထို့နောက် စာရင်းသွင်းမှု လိုအပ်ပါသည်။',
      },
      {
        heading: 'ဆေးဘက်ဆိုင်ရာ အကြံဉာဏ် မဟုတ်ပါ',
        body: 'ဤအက်ပ်မှ ပေးသော အချက်အလက်သည် ဓာတ်ပုံထဲတွင် ရေးထားသည်များကို AI မှ ရိုးရှင်းသောဘာသာစကားဖြင့် ပြန်ပြောပြခြင်းသာ ဖြစ်ပြီး — ၎င်းသည် ရောဂါရှာဖွေမှု၊ ဆေးညွှန်း သို့မဟုတ် ဆေးဘက်ဆိုင်ရာ အကြံဉာဏ် မဟုတ်ပါ။ ဆေးသောက်ပုံ သို့မဟုတ် သင့်ကျန်းမာရေးနှင့် ပတ်သက်၍ မေးခွန်းများ သို့မဟုတ် စိုးရိမ်မှုများ ရှိပါက ဆေးဆိုင်သမား သို့မဟုတ် ဆရာဝန်ကို တိုင်ပင်ပါ။ ဓာတ်ပုံအရည်အသွေး၊ လက်ရေးနှင့် အလားတူ အချက်များကြောင့် အသိအမှတ်ပြုမှု မမှန်ကန်နိုင်ပါ။',
      },
      {
        heading: 'အကောင့်',
        body: 'ဝန်ဆောင်မှုကို အသုံးပြုရန် အီးမေးလ်နှင့် စကားဝှက်ဖြင့် အကောင့်တစ်ခု ဖန်တီးရန် လိုအပ်ပါသည်။ သင့်အကောင့် အချက်အလက် (စကားဝှက်ကဲ့သို့) ကို လုံခြုံစွာ ထိန်းသိမ်းရန် တာဝန်ရှိပြီး၊ သင့်အကောင့်မှတစ်ဆင့် ဝန်ဆောင်မှုကို အသုံးပြုမှု မည်သည့်အရာမဆို အတွက် တာဝန်ရှိပါသည်။ လိမ်လည်အသုံးပြုမှု သို့မဟုတ် ဤစည်းမျဉ်းများ ချိုးဖောက်မှု တွေ့ရှိပါက အကောင့်ကို ဆိုင်းငံ့ သို့မဟုတ် ပယ်ဖျက်နိုင်ပါသည်။',
      },
      {
        heading: 'စာရင်းသွင်းမှုနှင့် ငွေပေးချေမှု',
        body: 'မှတ်ပုံတင်ချိန်မှစ၍ ၇ ရက်ကြာ အခမဲ့ အသုံးပြုနိုင်ပြီး၊ ထို့နောက် ဆက်လက်အသုံးပြုရန် လစဉ် စာရင်းသွင်းမှု လိုအပ်ပါသည်။ ၁၂ လ ဆက်တိုက် အသုံးပြုပါက ၁၃ လမြောက်ကို အခမဲ့ ရရှိမည် ဖြစ်သည်။ ငွေပေးချေမှုကို အကြွေးဝယ်ကတ်ဖြင့် ကျွန်ုပ်တို့၏ ငွေပေးချေမှု ဝန်ဆောင်သူ ZEUS မှတစ်ဆင့် လုပ်ဆောင်ပြီး၊ စာရင်းသွင်းမှုသည် ငွေတောင်းခံသည့် ကာလတိုင်း အလိုအလျောက် သက်တမ်းတိုးမည် ဖြစ်သည်။ ဒစ်ဂျစ်တယ် ဝန်ဆောင်မှုများ၏ သဘောသဘာဝကြောင့်၊ ပေးချေပြီးသား ကြေးများကို အခြေခံမူအရ ငွေပြန်အမ်းမည် မဟုတ်ပါ။ နောက်တစ်ကြိမ် အလိုအလျောက် သက်တမ်းတိုးခြင်းကို My Page မှ အချိန်မရွေး ရပ်တန့် (ပယ်ဖျက်) နိုင်ပြီး၊ ပယ်ဖျက်ပြီးနောက်တွင်ပင်၊ သင် ပေးချေပြီးသား ကာလ၏ အဆုံးထိ ဝန်ဆောင်မှုကို ဆက်လက် အသုံးပြုနိုင်ပါသည်။',
      },
      {
        heading: 'အသုံးပြုမှု ကန့်သတ်ချက်များ',
        body: 'ဤဝန်ဆောင်မှုကို ဆာဗာကုန်ကျစရိတ် ခွင့်ပြုသည့်ပမာဏအတွင်း ဆက်လက်လုပ်ဆောင်နိုင်ရန်၊ တစ်နေ့လျှင် ရရှိနိုင်သည့် ခွဲခြမ်းစိတ်ဖြာမှု အရေအတွက်ကို ကန့်သတ်ထားနိုင်ပါသည်။ ကန့်သတ်ချက်သို့ ရောက်ရှိပါက၊ နောက်တစ်နေ့တွင် ဝန်ဆောင်မှုကို ထပ်မံ အသုံးပြုနိုင်ပါသည်။',
      },
      {
        heading: 'တာဝန်ခံမှု ကန့်သတ်ချက်',
        body: 'ဤအက်ပ်သည် ခွဲခြမ်းစိတ်ဖြာမှု ရလဒ်များ၏ တိကျမှုကို အာမမခံပါ။ ဥပဒေ ခွင့်ပြုသည့် အတိုင်းအတာအထိ၊ ဤအက်ပ်မှ အချက်အလက်ကို အသုံးပြုခြင်းကြောင့် ဖြစ်ပေါ်လာသည့် မည်သည့်ရလဒ်အတွက်မဆို ဖန်တီးသူတွင် တာဝန်မရှိပါ။',
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
        body: 'यो एप एक उपकरण हो जसले प्रेस्क्रिप्शन वा औषधिको लेबलका फोटोहरू विश्लेषण गर्न र सामग्रीलाई सजिलै बुझ्न सकिने रूपमा प्रस्तुत गर्न AI प्रयोग गर्छ। साइन अप गरेपछि तपाईं ७ दिनसम्म निःशुल्क प्रयास गर्न सक्नुहुन्छ; त्यसपछि सदस्यता आवश्यक हुन्छ।',
      },
      {
        heading: 'चिकित्सा सल्लाह होइन',
        body: 'यो एपले प्रदान गर्ने जानकारी फोटोमा लेखिएको कुराको AI को सरल भाषामा पुनःकथन हो — यो निदान, प्रेस्क्रिप्शन, वा चिकित्सा सल्लाह होइन। यदि तपाईंसँग औषधि सेवन वा स्वास्थ्यको बारेमा प्रश्न वा चिन्ता छ भने, कृपया फार्मासिस्ट वा डाक्टरसँग परामर्श लिनुहोस्। फोटोको गुणस्तर, हस्तलेखन, र समान कारकहरूको कारण पहिचान अशुद्ध हुन सक्छ।',
      },
      {
        heading: 'खाता',
        body: 'सेवा प्रयोग गर्न, तपाईंले इमेल र पासवर्डको साथ खाता सिर्जना गर्नुपर्छ। तपाईं आफ्नो खाता जानकारी (जस्तै पासवर्ड) सुरक्षित राख्न जिम्मेवार हुनुहुन्छ, र तपाईंको खाता मार्फत सेवाको कुनै पनि प्रयोगको लागि तपाईं जिम्मेवार हुनुहुन्छ। ठगी प्रयोग वा यी सर्तहरूको उल्लंघन फेला परेमा हामी खाता निलम्बन वा समाप्त गर्न सक्छौं।',
      },
      {
        heading: 'सदस्यता र भुक्तानी',
        body: 'साइन अप गरेको समयदेखि तपाईं ७ दिनसम्म सेवा निःशुल्क प्रयोग गर्न सक्नुहुन्छ; त्यसपछि निरन्तर प्रयोगको लागि मासिक सदस्यता आवश्यक हुन्छ। यदि तपाईंले लगातार १२ महिना सेवा प्रयोग गर्नुभयो भने, १३ औं महिना निःशुल्क हुन्छ। भुक्तानी क्रेडिट कार्डबाट गरिन्छ र हाम्रो भुक्तानी प्रदायक, ZEUS मार्फत प्रशोधन गरिन्छ, र सदस्यता प्रत्येक बिलिङ अवधिमा स्वचालित रूपमा नवीकरण हुन्छ। डिजिटल सेवाहरूको प्रकृतिका कारण, पहिले नै तिरिसकेको शुल्क सिद्धान्ततः फिर्ता गरिँदैन। तपाईंले My Page बाट जुनसुकै बेला अर्को स्वचालित नवीकरण रोक्न (रद्द गर्न) सक्नुहुन्छ, र रद्द गरेपछि पनि, तपाईंले पहिले नै तिरिसकेको अवधिको अन्त्यसम्म सेवा प्रयोग गर्न जारी राख्न सक्नुहुन्छ।',
      },
      {
        heading: 'प्रयोग सीमाहरू',
        body: 'यो सेवालाई सर्भर लागतले अनुमति दिने दायराभित्र चलिरहन, हामीले प्रति दिन उपलब्ध विश्लेषण संख्या सीमित गर्न सक्छौं। यदि तपाईं सीमामा पुग्नुभयो भने, भोलिपल्ट फेरि सेवा प्रयोग गर्न सक्नुहुन्छ।',
      },
      {
        heading: 'दायित्व सीमा',
        body: 'यो एपले विश्लेषण परिणामको शुद्धताको ग्यारेन्टी दिँदैन। कानूनले अनुमति दिएको हदसम्म, यो एपबाट प्राप्त जानकारी प्रयोग गर्दा हुने कुनै पनि परिणामको लागि विकासकर्ता जिम्मेवार हुँदैन।',
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
        body: 'Este aplicativo é uma ferramenta que usa IA para analisar fotos de receitas ou rótulos de medicamentos e apresentar o conteúdo de forma fácil de entender. Você pode experimentá-lo gratuitamente por 7 dias após se cadastrar; depois disso, é necessária uma assinatura.',
      },
      {
        heading: 'Não É Aconselhamento Médico',
        body: 'As informações fornecidas por este aplicativo são uma reformulação em linguagem simples pela IA do que está escrito na foto — não é um diagnóstico, receita ou aconselhamento médico. Se você tiver dúvidas ou preocupações sobre como tomar seu medicamento ou sobre sua saúde, consulte um farmacêutico ou médico. O reconhecimento pode ser impreciso devido à qualidade da foto, caligrafia e fatores semelhantes.',
      },
      {
        heading: 'Conta',
        body: 'Para usar o serviço, você precisa criar uma conta com e-mail e senha. Você é responsável por manter as informações da sua conta (como a senha) seguras, e é responsável por qualquer uso do serviço através da sua conta. Podemos suspender ou encerrar uma conta se identificarmos uso fraudulento ou violação destes termos.',
      },
      {
        heading: 'Assinatura e Pagamento',
        body: 'Você pode usar o serviço gratuitamente por 7 dias a partir do cadastro; o uso contínuo depois disso requer uma assinatura mensal. Se você usar o serviço por 12 meses consecutivos, o 13º mês será gratuito. O pagamento é feito por cartão de crédito e processado por meio do nosso provedor de pagamento, ZEUS, e a assinatura é renovada automaticamente a cada período de cobrança. Devido à natureza dos serviços digitais, as taxas já pagas não são reembolsáveis em princípio. Você pode interromper a próxima renovação automática (cancelar) a qualquer momento em Minha Página, e mesmo após o cancelamento, você pode continuar usando o serviço até o final do período já pago.',
      },
      {
        heading: 'Limites de Uso',
        body: 'Para manter este serviço dentro do que os custos de servidor permitem, podemos limitar o número de análises disponíveis por dia. Se você atingir o limite, poderá usar o serviço novamente no dia seguinte.',
      },
      {
        heading: 'Limitação de Responsabilidade',
        body: 'Este aplicativo não garante a precisão dos resultados da análise. Na medida permitida por lei, o desenvolvedor não se responsabiliza por qualquer resultado decorrente do uso das informações deste aplicativo.',
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
