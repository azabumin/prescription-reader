import type { Lang } from '../types';

// Strings for the "memo to show at the pharmacy" screen. Kept apart from lib/i18n.ts so the
// feature stays self-contained. The patient fills the form in their own language; the card the
// pharmacist reads is always Japanese (JA_CARD + the `ja` option labels).

type Labels = Record<Lang, string>;
export type CardOption = { code: string; label: Labels };

export const ALLERGY_OPTIONS: CardOption[] = [
  { code: 'penicillin', label: { ja: 'ペニシリン系の抗菌薬', ko: '페니실린계 항생제', en: 'Penicillin antibiotics', vi: 'Kháng sinh nhóm penicillin', zh: '青霉素类抗生素', id: 'Antibiotik golongan penisilin', tl: 'Antibiotikong penicillin', th: 'ยาปฏิชีวนะกลุ่มเพนิซิลลิน', my: 'ပင်နီဆလင်အုပ်စု ပဋိဇီဝဆေး', ne: 'पेनिसिलिन समूहका एन्टिबायोटिक', pt: 'Antibióticos do grupo penicilina' } },
  { code: 'cephem', label: { ja: 'セフェム系の抗菌薬', ko: '세팔로스포린계 항생제', en: 'Cephalosporin antibiotics', vi: 'Kháng sinh nhóm cephalosporin', zh: '头孢类抗生素', id: 'Antibiotik golongan sefalosporin', tl: 'Antibiotikong cephalosporin', th: 'ยาปฏิชีวนะกลุ่มเซฟาโลสปอริน', my: 'ဆက်ဖလိုစပိုရင်အုပ်စု ပဋိဇီဝဆေး', ne: 'सेफालोस्पोरिन समूहका एन्टिबायोटिक', pt: 'Antibióticos do grupo cefalosporina' } },
  { code: 'nsaid', label: { ja: '解熱鎮痛薬（アスピリン、イブプロフェン、ロキソプロフェンなど）', ko: '해열진통제(아스피린, 이부프로펜, 록소프로펜 등)', en: 'Pain/fever medicines (aspirin, ibuprofen, loxoprofen, etc.)', vi: 'Thuốc giảm đau hạ sốt (aspirin, ibuprofen, loxoprofen…)', zh: '解热镇痛药（阿司匹林、布洛芬、洛索洛芬等）', id: 'Obat pereda nyeri/demam (aspirin, ibuprofen, loxoprofen, dll.)', tl: 'Gamot sa sakit/lagnat (aspirin, ibuprofen, loxoprofen, atbp.)', th: 'ยาแก้ปวดลดไข้ (แอสไพริน ไอบูโพรเฟน ล็อกโซโพรเฟน ฯลฯ)', my: 'အကိုက်အခဲ/အဖျားကျဆေး (အက်စ်ပရင်၊ အိုင်ဗျူပရိုဖင်၊ လော့ဆိုပရိုဖင် စသည်)', ne: 'दुखाइ/ज्वरो कम गर्ने औषधि (एस्पिरिन, आइबुप्रोफेन, लोक्सोप्रोफेन आदि)', pt: 'Analgésicos/antitérmicos (aspirina, ibuprofeno, loxoprofeno etc.)' } },
  { code: 'contrast', label: { ja: '造影剤', ko: '조영제', en: 'Contrast dye (for X-ray/CT)', vi: 'Thuốc cản quang', zh: '造影剂', id: 'Zat kontras (untuk rontgen/CT)', tl: 'Contrast dye (para sa X-ray/CT)', th: 'สารทึบรังสี', my: 'ဓာတ်မှန်/CT ရိုက်ရာတွင် သုံးသော ဆေးရည်', ne: 'कन्ट्रास्ट औषधि (एक्स-रे/सिटीका लागि)', pt: 'Contraste (para raio X/tomografia)' } },
  { code: 'localAnesthetic', label: { ja: '局所麻酔薬（歯科など）', ko: '국소마취제(치과 등)', en: 'Local anesthetics (e.g., at the dentist)', vi: 'Thuốc gây tê tại chỗ (nha khoa…)', zh: '局部麻醉药（牙科等）', id: 'Obat bius lokal (misalnya di dokter gigi)', tl: 'Lokal na anestisya (hal. sa dentista)', th: 'ยาชาเฉพาะที่ (เช่น ทำฟัน)', my: 'နေရာအလိုက် ထုံဆေး (သွားဆေးခန်း စသည်)', ne: 'स्थानीय एनेस्थेसिया औषधि (दन्त उपचार आदि)', pt: 'Anestésicos locais (ex.: no dentista)' } },
  { code: 'egg', label: { ja: '卵', ko: '달걀', en: 'Egg', vi: 'Trứng', zh: '鸡蛋', id: 'Telur', tl: 'Itlog', th: 'ไข่', my: 'ကြက်ဥ', ne: 'अण्डा', pt: 'Ovo' } },
  { code: 'milk', label: { ja: '牛乳', ko: '우유', en: 'Milk', vi: 'Sữa bò', zh: '牛奶', id: 'Susu sapi', tl: 'Gatas', th: 'นมวัว', my: 'နွားနို့', ne: 'दूध', pt: 'Leite' } },
  { code: 'wheat', label: { ja: '小麦', ko: '밀', en: 'Wheat', vi: 'Lúa mì', zh: '小麦', id: 'Gandum', tl: 'Trigo', th: 'ข้าวสาลี', my: 'ဂျုံ', ne: 'गहुँ', pt: 'Trigo' } },
  { code: 'soy', label: { ja: '大豆', ko: '대두(콩)', en: 'Soy', vi: 'Đậu nành', zh: '大豆', id: 'Kedelai', tl: 'Soya', th: 'ถั่วเหลือง', my: 'ပဲပုပ် (ဆိုယာပဲ)', ne: 'भटमास', pt: 'Soja' } },
  { code: 'peanut', label: { ja: 'ピーナッツ・ナッツ類', ko: '땅콩·견과류', en: 'Peanuts / tree nuts', vi: 'Đậu phộng, các loại hạt', zh: '花生、坚果', id: 'Kacang tanah / kacang-kacangan', tl: 'Mani at iba pang nuts', th: 'ถั่วลิสง/ถั่วเปลือกแข็ง', my: 'မြေပဲ/အခွံမာသီး', ne: 'बदाम/नट्स', pt: 'Amendoim/castanhas' } },
  { code: 'shellfish', label: { ja: 'えび・かに', ko: '새우·게', en: 'Shrimp / crab', vi: 'Tôm, cua', zh: '虾、蟹', id: 'Udang / kepiting', tl: 'Hipon / alimango', th: 'กุ้ง/ปู', my: 'ပုစွန်/ဂဏန်း', ne: 'झिंगा/गँगटा', pt: 'Camarão/caranguejo' } },
];

export const ADR_OPTIONS: CardOption[] = [
  { code: 'rash', label: { ja: '発疹・かゆみ', ko: '발진·가려움', en: 'Rash / itching', vi: 'Phát ban, ngứa', zh: '皮疹、瘙痒', id: 'Ruam / gatal', tl: 'Pantal / pangangati', th: 'ผื่น/คัน', my: 'အဖုအပိမ့်/ယားယံ', ne: 'दाना/चिलाउने', pt: 'Erupção/coceira' } },
  { code: 'breathing', label: { ja: '息苦しさ・ぜんそく発作', ko: '호흡곤란·천식 발작', en: 'Difficulty breathing / asthma attack', vi: 'Khó thở, lên cơn hen', zh: '呼吸困难、哮喘发作', id: 'Sesak napas / serangan asma', tl: 'Hirap huminga / atake ng hika', th: 'หายใจลำบาก/หอบหืดกำเริบ', my: 'အသက်ရှူကျပ်/ပန်းနာထ', ne: 'सास फेर्न गाह्रो/दम बढ्ने', pt: 'Falta de ar/crise de asma' } },
  { code: 'swelling', label: { ja: '顔・唇・のどの腫れ', ko: '얼굴·입술·목의 부기', en: 'Swelling of the face / lips / throat', vi: 'Sưng mặt, môi, họng', zh: '脸、嘴唇、喉咙肿胀', id: 'Bengkak di wajah / bibir / tenggorokan', tl: 'Pamamaga ng mukha / labi / lalamunan', th: 'หน้า/ปาก/คอบวม', my: 'မျက်နှာ/နှုတ်ခမ်း/လည်ချောင်း ရောင်', ne: 'अनुहार/ओठ/घाँटी सुन्निने', pt: 'Inchaço no rosto/lábios/garganta' } },
  { code: 'stomach', label: { ja: '胃痛・吐き気', ko: '위통·메스꺼움', en: 'Stomach pain / nausea', vi: 'Đau dạ dày, buồn nôn', zh: '胃痛、恶心', id: 'Sakit perut / mual', tl: 'Sakit ng tiyan / pagduduwal', th: 'ปวดท้อง/คลื่นไส้', my: 'အစာအိမ်နာ/ပျို့အန်ချင်', ne: 'पेट दुख्ने/वाकवाकी', pt: 'Dor de estômago/náusea' } },
  { code: 'drowsy', label: { ja: '強い眠気・めまい', ko: '심한 졸음·어지럼증', en: 'Strong drowsiness / dizziness', vi: 'Buồn ngủ nhiều, chóng mặt', zh: '严重嗜睡、头晕', id: 'Sangat mengantuk / pusing', tl: 'Matinding antok / pagkahilo', th: 'ง่วงมาก/เวียนหัว', my: 'အလွန်အိပ်ချင်/မူးဝေ', ne: 'धेरै निद्रा लाग्ने/रिँगटा', pt: 'Sonolência forte/tontura' } },
  { code: 'diarrhea', label: { ja: '下痢', ko: '설사', en: 'Diarrhea', vi: 'Tiêu chảy', zh: '腹泻', id: 'Diare', tl: 'Pagtatae', th: 'ท้องเสีย', my: 'ဝမ်းလျှော', ne: 'पखाला', pt: 'Diarreia' } },
];

export const CONDITION_OPTIONS: CardOption[] = [
  { code: 'hypertension', label: { ja: '高血圧', ko: '고혈압', en: 'High blood pressure', vi: 'Huyết áp cao', zh: '高血压', id: 'Tekanan darah tinggi', tl: 'Altapresyon', th: 'ความดันโลหิตสูง', my: 'သွေးတိုး', ne: 'उच्च रक्तचाप', pt: 'Pressão alta' } },
  { code: 'diabetes', label: { ja: '糖尿病', ko: '당뇨병', en: 'Diabetes', vi: 'Tiểu đường', zh: '糖尿病', id: 'Diabetes', tl: 'Diyabetis', th: 'เบาหวาน', my: 'ဆီးချို', ne: 'मधुमेह', pt: 'Diabetes' } },
  { code: 'heart', label: { ja: '心臓の病気', ko: '심장 질환', en: 'Heart disease', vi: 'Bệnh tim', zh: '心脏病', id: 'Penyakit jantung', tl: 'Sakit sa puso', th: 'โรคหัวใจ', my: 'နှလုံးရောဂါ', ne: 'मुटुरोग', pt: 'Doença cardíaca' } },
  { code: 'asthma', label: { ja: 'ぜんそく', ko: '천식', en: 'Asthma', vi: 'Hen suyễn', zh: '哮喘', id: 'Asma', tl: 'Hika', th: 'หอบหืด', my: 'ပန်းနာရင်ကျပ်', ne: 'दम', pt: 'Asma' } },
  { code: 'kidney', label: { ja: '腎臓の病気', ko: '신장 질환', en: 'Kidney disease', vi: 'Bệnh thận', zh: '肾脏疾病', id: 'Penyakit ginjal', tl: 'Sakit sa bato', th: 'โรคไต', my: 'ကျောက်ကပ်ရောဂါ', ne: 'मृगौला रोग', pt: 'Doença renal' } },
  { code: 'liver', label: { ja: '肝臓の病気', ko: '간 질환', en: 'Liver disease', vi: 'Bệnh gan', zh: '肝脏疾病', id: 'Penyakit hati', tl: 'Sakit sa atay', th: 'โรคตับ', my: 'အသည်းရောဂါ', ne: 'कलेजो रोग', pt: 'Doença hepática' } },
  { code: 'ulcer', label: { ja: '胃・十二指腸潰瘍', ko: '위·십이지장 궤양', en: 'Stomach / duodenal ulcer', vi: 'Loét dạ dày, tá tràng', zh: '胃、十二指肠溃疡', id: 'Tukak lambung / usus dua belas jari', tl: 'Ulser sa sikmura / duodenum', th: 'แผลในกระเพาะ/ลำไส้เล็กส่วนต้น', my: 'အစာအိမ်/အူသိမ် အနာ', ne: 'पेट/आन्द्राको घाउ (अल्सर)', pt: 'Úlcera gástrica/duodenal' } },
  { code: 'glaucoma', label: { ja: '緑内障', ko: '녹내장', en: 'Glaucoma', vi: 'Tăng nhãn áp (glôcôm)', zh: '青光眼', id: 'Glaukoma', tl: 'Glaucoma', th: 'ต้อหิน', my: 'မျက်လုံးဖိအားများ ရောဂါ (Glaucoma)', ne: 'ग्लुकोमा (आँखाको दबाब)', pt: 'Glaucoma' } },
  { code: 'prostate', label: { ja: '前立腺肥大', ko: '전립선 비대', en: 'Enlarged prostate', vi: 'Phì đại tuyến tiền liệt', zh: '前列腺增生', id: 'Pembesaran prostat', tl: 'Paglaki ng prostate', th: 'ต่อมลูกหมากโต', my: 'ဆီးကျိတ်ကြီး', ne: 'प्रोस्टेट बढेको', pt: 'Próstata aumentada' } },
  { code: 'epilepsy', label: { ja: 'てんかん', ko: '뇌전증(간질)', en: 'Epilepsy', vi: 'Động kinh', zh: '癫痫', id: 'Epilepsi', tl: 'Epilepsy', th: 'โรคลมชัก', my: 'ဝက်ရူးပြန်ရောဂါ', ne: 'छारे रोग', pt: 'Epilepsia' } },
  { code: 'thyroid', label: { ja: '甲状腺の病気', ko: '갑상선 질환', en: 'Thyroid disease', vi: 'Bệnh tuyến giáp', zh: '甲状腺疾病', id: 'Penyakit tiroid', tl: 'Sakit sa thyroid', th: 'โรคไทรอยด์', my: 'သိုင်းရွိုက်ဂလင်း ရောဂါ', ne: 'थाइराइड रोग', pt: 'Doença da tireoide' } },
];

export const PREGNANCY_OPTIONS: CardOption[] = [
  { code: 'pregnant', label: { ja: '妊娠中', ko: '임신 중', en: 'Pregnant', vi: 'Đang mang thai', zh: '怀孕中', id: 'Sedang hamil', tl: 'Buntis', th: 'ตั้งครรภ์', my: 'ကိုယ်ဝန်ဆောင်နေ', ne: 'गर्भवती', pt: 'Grávida' } },
  { code: 'breastfeeding', label: { ja: '授乳中', ko: '수유 중', en: 'Breastfeeding', vi: 'Đang cho con bú', zh: '哺乳期', id: 'Sedang menyusui', tl: 'Nagpapasuso', th: 'ให้นมบุตร', my: 'နို့တိုက်နေ', ne: 'स्तनपान गराउँदै', pt: 'Amamentando' } },
];

export const AVOID_OPTIONS: CardOption[] = [
  { code: 'pork', label: { ja: '豚由来の成分（ゼラチンなど）', ko: '돼지 유래 성분(젤라틴 등)', en: 'Pork-derived ingredients (e.g., gelatin)', vi: 'Thành phần từ lợn (như gelatin)', zh: '猪源成分（如明胶）', id: 'Bahan dari babi (misalnya gelatin)', tl: 'Sangkap mula sa baboy (hal. gelatin)', th: 'ส่วนผสมจากหมู (เช่น เจลาติน)', my: 'ဝက်မှ ရသော ပါဝင်ပစ္စည်း (ဂျယ်လတင် စသည်)', ne: 'सुँगुरबाट बनेको पदार्थ (जिलेटिन आदि)', pt: 'Ingredientes de origem suína (ex.: gelatina)' } },
  { code: 'alcohol', label: { ja: 'アルコールを含む薬', ko: '알코올이 든 약', en: 'Medicines containing alcohol', vi: 'Thuốc có chứa cồn', zh: '含酒精的药', id: 'Obat yang mengandung alkohol', tl: 'Gamot na may alkohol', th: 'ยาที่มีแอลกอฮอล์', my: 'အရက်ပါသော ဆေး', ne: 'अल्कोहल भएको औषधि', pt: 'Remédios com álcool' } },
  { code: 'animal', label: { ja: '動物由来の成分（ベジタリアン）', ko: '동물 유래 성분(채식)', en: 'Animal-derived ingredients (vegetarian)', vi: 'Thành phần từ động vật (ăn chay)', zh: '动物源成分（素食）', id: 'Bahan dari hewan (vegetarian)', tl: 'Sangkap mula sa hayop (vegetarian)', th: 'ส่วนผสมจากสัตว์ (มังสวิรัติ)', my: 'တိရစ္ဆာန်မှ ရသော ပါဝင်ပစ္စည်း (သက်သတ်လွတ်)', ne: 'पशुजन्य पदार्थ (शाकाहारी)', pt: 'Ingredientes de origem animal (vegetariano)' } },
];

export function optionLabel(list: CardOption[], code: string, lang: Lang): string {
  return list.find((o) => o.code === code)?.label[lang] ?? code;
}

// Japanese name of each language, for the line telling the pharmacist which language the
// patient speaks and what the untranslated free text is written in.
export const LANG_NAME_JA: Labels = {
  ja: '日本語', ko: '韓国語', en: '英語', vi: 'ベトナム語', zh: '中国語', id: 'インドネシア語',
  tl: 'フィリピン語（タガログ語）', th: 'タイ語', my: 'ミャンマー語', ne: 'ネパール語', pt: 'ポルトガル語',
};

// The pharmacist-facing card: always Japanese.
export const JA_CARD = {
  heading: '薬局の方へ',
  lead: (langJa: string) => `この方の言語は${langJa}です。以下は、ご本人が処方箋ヘルパーで入力した内容を日本語で表示しています。`,
  leadJa: '以下は、ご本人が処方箋ヘルパーで入力した内容です。',
  jp: '日本語',
  jpLevel: { none: 'ほとんど話せません', little: '少し話せます', ok: '話せます' },
  allergy: 'アレルギー',
  adr: '副作用歴',
  conditions: '治療中の病気',
  pregnancy: '妊娠・授乳',
  avoid: '避けたい成分',
  meds: '使用中の薬',
  child: '小児',
  childWeight: (w: string) => `体重 ${w} kg`,
  childNoWeight: '体重は未記入',
  notes: 'その他',
  none: 'なし',
  unanswered: '未記入',
  noneEntered: '記入なし',
  yesUnspecified: 'あり（詳しくは未記入）',
  original: (langJa: string) => `本人の記載（${langJa}・翻訳なし）`,
  originalJa: '本人の記載',
  fromHistory: (langJa: string) => `処方箋ヘルパーの記録より（${langJa}で表示）`,
  foot: '※ ご本人の申告です。内容の確認とご判断は、薬剤師の方にお願いいたします。',
  updated: (d: string) => `最終更新：${d}`,
};

type UiKey =
  | 'linkLabel' | 'title' | 'intro' | 'localNote' | 'autosave' | 'jpLevel' | 'jpNone' | 'jpLittle' | 'jpOk'
  | 'yes' | 'no' | 'allergy' | 'adr' | 'adrDrug' | 'conditions' | 'pregnancy' | 'avoid' | 'meds'
  | 'medsFromHistory' | 'medsNoHistory' | 'medsOther' | 'child' | 'weight' | 'notes' | 'freeHint'
  | 'show' | 'showHint' | 'edit' | 'clear' | 'clearAsk' | 'clearYes' | 'clearNo' | 'cleared' | 'empty';

export const CARD_UI: Record<Lang, Record<UiKey, string>> = {
  ja: {
    linkLabel: '薬局で見せるメモ', title: '薬局で見せるメモ',
    intro: 'アレルギーや使っている薬などを、あなたの言語で入力しておきましょう。薬局で「薬局の方に見せる」を押すと、日本語で表示されます。',
    localNote: 'このメモはこの端末の中だけに保存され、インターネットには送信されません。', autosave: '入力した内容は自動で保存されます。',
    jpLevel: '日本語はどのくらい話せますか', jpNone: 'ほとんど話せない', jpLittle: '少し話せる', jpOk: '話せる', yes: 'ある', no: 'ない',
    allergy: '薬や食べ物のアレルギーはありますか', adr: '薬で具合が悪くなったことはありますか（副作用）', adrDrug: 'どの薬でしたか（わかれば）',
    conditions: 'いま治療している病気', pregnancy: '妊娠・授乳', avoid: '避けたい成分（宗教・食事など）', meds: 'いま使っている薬',
    medsFromHistory: '処方箋ヘルパーの記録から選ぶ', medsNoHistory: '記録はまだありません。処方箋を分析すると、ここから選べます。', medsOther: 'そのほかの薬（自由に入力）',
    child: '子どもの薬です（体重を伝える）', weight: '体重（kg）', notes: 'そのほか伝えたいこと',
    freeHint: '自由入力の欄は翻訳されず、入力したまま薬局に表示されます。',
    show: '薬局の方に見せる（日本語）', showHint: 'この画面を薬局の方に見せてください。', edit: 'メモを直す',
    clear: 'メモを消す', clearAsk: 'このメモを消しますか？', clearYes: '消す', clearNo: 'やめる', cleared: 'メモを消しました。', empty: 'まだ何も入力されていません。',
  },
  ko: {
    linkLabel: '약국에서 보여 주는 메모', title: '약국에서 보여 주는 메모',
    intro: '알레르기나 사용 중인 약 등을 자신의 언어로 입력해 두세요. 약국에서 「약국 직원에게 보여 주기」를 누르면 일본어로 표시됩니다.',
    localNote: '이 메모는 이 기기 안에만 저장되며 인터넷으로 전송되지 않습니다.', autosave: '입력한 내용은 자동으로 저장됩니다.',
    jpLevel: '일본어는 어느 정도 할 수 있나요?', jpNone: '거의 못 함', jpLittle: '조금 할 수 있음', jpOk: '할 수 있음', yes: '있음', no: '없음',
    allergy: '약이나 음식 알레르기가 있나요?', adr: '약을 먹고 몸이 안 좋았던 적이 있나요? (부작용)', adrDrug: '어떤 약이었나요? (알면)',
    conditions: '지금 치료 중인 병', pregnancy: '임신·수유', avoid: '피하고 싶은 성분(종교·식생활 등)', meds: '지금 사용 중인 약',
    medsFromHistory: '처방전 도우미 기록에서 고르기', medsNoHistory: '아직 기록이 없습니다. 처방전을 분석하면 여기서 고를 수 있습니다.', medsOther: '그 밖의 약(자유 입력)',
    child: '아이의 약입니다(체중을 알림)', weight: '체중(kg)', notes: '그 밖에 전하고 싶은 것',
    freeHint: '자유 입력란의 글은 번역되지 않고 입력한 그대로 약국에 표시됩니다.',
    show: '약국 직원에게 보여 주기(일본어)', showHint: '이 화면을 약국 직원에게 보여 주세요.', edit: '메모 고치기',
    clear: '메모 지우기', clearAsk: '이 메모를 지울까요?', clearYes: '지우기', clearNo: '취소', cleared: '메모를 지웠습니다.', empty: '아직 아무것도 입력하지 않았습니다.',
  },
  en: {
    linkLabel: 'Pharmacy memo', title: 'Memo to show at the pharmacy',
    intro: 'Enter your allergies, medicines and other important information in your own language. At the pharmacy, tap "Show to pharmacy staff" and it will appear in Japanese.',
    localNote: 'This memo is saved only on this device and is never sent over the internet.', autosave: 'What you enter is saved automatically.',
    jpLevel: 'How much Japanese do you speak?', jpNone: 'Hardly at all', jpLittle: 'A little', jpOk: 'Yes, I can', yes: 'Yes', no: 'No',
    allergy: 'Do you have any allergies to medicines or foods?', adr: 'Have you ever felt unwell from a medicine? (side effects)', adrDrug: 'Which medicine was it? (if you know)',
    conditions: 'Illnesses you are being treated for now', pregnancy: 'Pregnancy / breastfeeding', avoid: 'Ingredients you want to avoid (religion, diet, etc.)', meds: 'Medicines you use now',
    medsFromHistory: 'Choose from your Prescription Helper history', medsNoHistory: 'No history yet. After you analyze a prescription, you can choose from it here.', medsOther: 'Other medicines (type freely)',
    child: 'This is for a child (tell the weight)', weight: 'Weight (kg)', notes: 'Anything else you want to tell the pharmacy',
    freeHint: 'Text you type yourself is not translated; it is shown to the pharmacy exactly as written.',
    show: 'Show to pharmacy staff (Japanese)', showHint: 'Please show this screen to the pharmacy staff.', edit: 'Edit memo',
    clear: 'Delete memo', clearAsk: 'Delete this memo?', clearYes: 'Delete', clearNo: 'Cancel', cleared: 'The memo was deleted.', empty: 'Nothing has been entered yet.',
  },
  vi: {
    linkLabel: 'Ghi chú cho nhà thuốc', title: 'Ghi chú đưa cho nhà thuốc xem',
    intro: 'Hãy nhập dị ứng, thuốc đang dùng và các thông tin quan trọng bằng ngôn ngữ của bạn. Tại nhà thuốc, bấm "Cho nhân viên nhà thuốc xem" để hiển thị bằng tiếng Nhật.',
    localNote: 'Ghi chú này chỉ được lưu trên thiết bị này và không được gửi qua internet.', autosave: 'Nội dung nhập sẽ được lưu tự động.',
    jpLevel: 'Bạn nói tiếng Nhật ở mức nào?', jpNone: 'Hầu như không', jpLittle: 'Một chút', jpOk: 'Có thể nói', yes: 'Có', no: 'Không',
    allergy: 'Bạn có dị ứng với thuốc hoặc thức ăn không?', adr: 'Bạn đã từng bị khó chịu do thuốc chưa? (tác dụng phụ)', adrDrug: 'Đó là thuốc gì? (nếu biết)',
    conditions: 'Bệnh đang điều trị', pregnancy: 'Mang thai / cho con bú', avoid: 'Thành phần muốn tránh (tôn giáo, ăn uống…)', meds: 'Thuốc đang dùng',
    medsFromHistory: 'Chọn từ Lịch Sử Quét của Trợ Lý Đơn Thuốc', medsNoHistory: 'Chưa có lịch sử. Sau khi phân tích đơn thuốc, bạn có thể chọn ở đây.', medsOther: 'Thuốc khác (nhập tự do)',
    child: 'Đây là thuốc cho trẻ em (cho biết cân nặng)', weight: 'Cân nặng (kg)', notes: 'Điều khác muốn nói với nhà thuốc',
    freeHint: 'Nội dung bạn tự nhập sẽ không được dịch, mà hiển thị nguyên văn cho nhà thuốc.',
    show: 'Cho nhân viên nhà thuốc xem (tiếng Nhật)', showHint: 'Vui lòng đưa màn hình này cho nhân viên nhà thuốc xem.', edit: 'Sửa ghi chú',
    clear: 'Xóa ghi chú', clearAsk: 'Xóa ghi chú này?', clearYes: 'Xóa', clearNo: 'Hủy', cleared: 'Đã xóa ghi chú.', empty: 'Chưa nhập gì.',
  },
  zh: {
    linkLabel: '给药店看的备忘', title: '给药店看的备忘',
    intro: '请用您的语言提前填写过敏、正在使用的药等信息。在药店点击「给药店工作人员看」，就会用日语显示。',
    localNote: '此备忘只保存在本设备中，不会通过网络发送。', autosave: '填写的内容会自动保存。',
    jpLevel: '您的日语水平如何？', jpNone: '几乎不会', jpLittle: '会一点', jpOk: '会', yes: '有', no: '没有',
    allergy: '您对药物或食物过敏吗？', adr: '您曾经因为用药而身体不适吗？（副作用）', adrDrug: '是哪种药？（如果知道）',
    conditions: '正在治疗的疾病', pregnancy: '怀孕／哺乳', avoid: '想避免的成分（宗教、饮食等）', meds: '正在使用的药',
    medsFromHistory: '从处方助手的历史记录中选择', medsNoHistory: '还没有记录。分析处方后，就可以在这里选择。', medsOther: '其他药（自由填写）',
    child: '这是儿童用药（告知体重）', weight: '体重（kg）', notes: '其他想告诉药店的事',
    freeHint: '自己填写的文字不会被翻译，会按原样显示给药店。',
    show: '给药店工作人员看（日语）', showHint: '请把这个画面给药店工作人员看。', edit: '修改备忘',
    clear: '删除备忘', clearAsk: '要删除这个备忘吗？', clearYes: '删除', clearNo: '取消', cleared: '已删除备忘。', empty: '还没有填写任何内容。',
  },
  id: {
    linkLabel: 'Catatan untuk apotek', title: 'Catatan untuk ditunjukkan di apotek',
    intro: 'Isi alergi, obat yang sedang dipakai, dan informasi penting lainnya dalam bahasa Anda. Di apotek, ketuk "Tunjukkan ke petugas apotek" agar ditampilkan dalam bahasa Jepang.',
    localNote: 'Catatan ini hanya disimpan di perangkat ini dan tidak dikirim melalui internet.', autosave: 'Isian Anda tersimpan otomatis.',
    jpLevel: 'Seberapa bisa Anda berbahasa Jepang?', jpNone: 'Hampir tidak bisa', jpLittle: 'Sedikit', jpOk: 'Bisa', yes: 'Ada', no: 'Tidak ada',
    allergy: 'Apakah Anda punya alergi obat atau makanan?', adr: 'Pernahkah Anda merasa tidak enak badan karena obat? (efek samping)', adrDrug: 'Obat apa? (jika tahu)',
    conditions: 'Penyakit yang sedang diobati', pregnancy: 'Kehamilan / menyusui', avoid: 'Bahan yang ingin dihindari (agama, pola makan, dll.)', meds: 'Obat yang sedang dipakai',
    medsFromHistory: 'Pilih dari riwayat Asisten Resep Obat', medsNoHistory: 'Belum ada riwayat. Setelah menganalisis resep, Anda bisa memilih di sini.', medsOther: 'Obat lain (ketik bebas)',
    child: 'Ini obat untuk anak (beri tahu berat badan)', weight: 'Berat badan (kg)', notes: 'Hal lain yang ingin disampaikan ke apotek',
    freeHint: 'Teks yang Anda ketik sendiri tidak diterjemahkan; akan ditampilkan ke apotek apa adanya.',
    show: 'Tunjukkan ke petugas apotek (bahasa Jepang)', showHint: 'Tunjukkan layar ini kepada petugas apotek.', edit: 'Ubah catatan',
    clear: 'Hapus catatan', clearAsk: 'Hapus catatan ini?', clearYes: 'Hapus', clearNo: 'Batal', cleared: 'Catatan sudah dihapus.', empty: 'Belum ada yang diisi.',
  },
  tl: {
    linkLabel: 'Memo para sa botika', title: 'Memo na ipapakita sa botika',
    intro: 'Isulat sa sarili mong wika ang iyong allergy, mga gamot na ginagamit, at iba pang mahalagang impormasyon. Sa botika, pindutin ang "Ipakita sa staff ng botika" at lalabas ito sa wikang Hapon.',
    localNote: 'Ang memo na ito ay naka-save lang sa device na ito at hindi ipinapadala sa internet.', autosave: 'Awtomatikong nase-save ang iyong isinulat.',
    jpLevel: 'Gaano ka marunong mag-Japanese?', jpNone: 'Halos hindi', jpLittle: 'Kaunti', jpOk: 'Oo, marunong', yes: 'Mayroon', no: 'Wala',
    allergy: 'May allergy ka ba sa gamot o pagkain?', adr: 'Nakaramdam ka na ba ng masama dahil sa gamot? (side effect)', adrDrug: 'Anong gamot ito? (kung alam mo)',
    conditions: 'Mga sakit na ginagamot ngayon', pregnancy: 'Pagbubuntis / pagpapasuso', avoid: 'Mga sangkap na gustong iwasan (relihiyon, pagkain, atbp.)', meds: 'Mga gamot na ginagamit ngayon',
    medsFromHistory: 'Pumili mula sa kasaysayan ng Katulong sa Reseta', medsNoHistory: 'Wala pang kasaysayan. Pagkatapos mag-analyze ng reseta, makakapili ka rito.', medsOther: 'Iba pang gamot (malayang isulat)',
    child: 'Para sa bata ito (sabihin ang timbang)', weight: 'Timbang (kg)', notes: 'Iba pang gustong sabihin sa botika',
    freeHint: 'Hindi isinasalin ang sarili mong isinulat; ipapakita ito sa botika nang eksakto.',
    show: 'Ipakita sa staff ng botika (Japanese)', showHint: 'Pakipakita ang screen na ito sa staff ng botika.', edit: 'Baguhin ang memo',
    clear: 'Burahin ang memo', clearAsk: 'Burahin ang memo na ito?', clearYes: 'Burahin', clearNo: 'Kanselahin', cleared: 'Nabura na ang memo.', empty: 'Wala pang nakasulat.',
  },
  th: {
    linkLabel: 'บันทึกสำหรับร้านยา', title: 'บันทึกสำหรับแสดงที่ร้านยา',
    intro: 'กรอกข้อมูลการแพ้ ยาที่ใช้อยู่ และข้อมูลสำคัญอื่น ๆ เป็นภาษาของคุณ เมื่ออยู่ที่ร้านยา ให้แตะ "แสดงให้เจ้าหน้าที่ร้านยาดู" แล้วข้อมูลจะแสดงเป็นภาษาญี่ปุ่น',
    localNote: 'บันทึกนี้ถูกเก็บไว้ในอุปกรณ์นี้เท่านั้น และไม่ถูกส่งผ่านอินเทอร์เน็ต', autosave: 'ข้อมูลที่กรอกจะถูกบันทึกโดยอัตโนมัติ',
    jpLevel: 'คุณพูดภาษาญี่ปุ่นได้แค่ไหน', jpNone: 'แทบไม่ได้', jpLittle: 'ได้นิดหน่อย', jpOk: 'ได้', yes: 'มี', no: 'ไม่มี',
    allergy: 'คุณแพ้ยาหรืออาหารหรือไม่', adr: 'คุณเคยมีอาการไม่สบายจากยาหรือไม่ (ผลข้างเคียง)', adrDrug: 'เป็นยาอะไร (ถ้าทราบ)',
    conditions: 'โรคที่กำลังรักษาอยู่', pregnancy: 'การตั้งครรภ์ / ให้นมบุตร', avoid: 'ส่วนผสมที่ต้องการหลีกเลี่ยง (ศาสนา อาหาร ฯลฯ)', meds: 'ยาที่ใช้อยู่ตอนนี้',
    medsFromHistory: 'เลือกจากประวัติของผู้ช่วยอ่านใบสั่งยา', medsNoHistory: 'ยังไม่มีประวัติ หลังจากวิเคราะห์ใบสั่งยาแล้ว จะเลือกได้ที่นี่', medsOther: 'ยาอื่น ๆ (พิมพ์เอง)',
    child: 'เป็นยาสำหรับเด็ก (แจ้งน้ำหนัก)', weight: 'น้ำหนัก (กก.)', notes: 'เรื่องอื่นที่อยากบอกร้านยา',
    freeHint: 'ข้อความที่พิมพ์เองจะไม่ถูกแปล และจะแสดงให้ร้านยาดูตามที่พิมพ์',
    show: 'แสดงให้เจ้าหน้าที่ร้านยาดู (ภาษาญี่ปุ่น)', showHint: 'กรุณาแสดงหน้าจอนี้ให้เจ้าหน้าที่ร้านยาดู', edit: 'แก้ไขบันทึก',
    clear: 'ลบบันทึก', clearAsk: 'ลบบันทึกนี้หรือไม่', clearYes: 'ลบ', clearNo: 'ยกเลิก', cleared: 'ลบบันทึกแล้ว', empty: 'ยังไม่ได้กรอกข้อมูล',
  },
  my: {
    linkLabel: 'ဆေးဆိုင်ပြရန် မှတ်စု', title: 'ဆေးဆိုင်တွင် ပြရန် မှတ်စု',
    intro: 'ဓာတ်မတည့်မှု၊ သုံးနေသောဆေးနှင့် အရေးကြီးသော အချက်အလက်များကို သင့်ဘာသာစကားဖြင့် ဖြည့်ထားပါ။ ဆေးဆိုင်တွင် "ဆေးဆိုင်ဝန်ထမ်းကို ပြရန်" ကို နှိပ်လျှင် ဂျပန်ဘာသာဖြင့် ပြသပါမည်။',
    localNote: 'ဤမှတ်စုကို ဤစက်ထဲတွင်သာ သိမ်းဆည်းပြီး အင်တာနက်မှ မပို့ပါ။', autosave: 'ဖြည့်ထားသည်များကို အလိုအလျောက် သိမ်းဆည်းပါသည်။',
    jpLevel: 'ဂျပန်စကား ဘယ်လောက် ပြောတတ်ပါသလဲ', jpNone: 'လုံးဝနီးပါး မပြောတတ်', jpLittle: 'နည်းနည်း ပြောတတ်', jpOk: 'ပြောတတ်', yes: 'ရှိ', no: 'မရှိ',
    allergy: 'ဆေး သို့မဟုတ် အစားအစာနှင့် ဓာတ်မတည့်မှု ရှိပါသလား', adr: 'ဆေးကြောင့် နေမကောင်းဖြစ်ဖူးပါသလား (ဘေးထွက်ဆိုးကျိုး)', adrDrug: 'ဘယ်ဆေးလဲ (သိလျှင်)',
    conditions: 'လက်ရှိ ကုသနေသော ရောဂါ', pregnancy: 'ကိုယ်ဝန် / နို့တိုက်ခြင်း', avoid: 'ရှောင်လိုသော ပါဝင်ပစ္စည်း (ဘာသာ၊ အစားအသောက် စသည်)', meds: 'လက်ရှိ သုံးနေသော ဆေး',
    medsFromHistory: 'ဆေးညွှန်း အကူအညီ မှတ်တမ်းမှ ရွေးရန်', medsNoHistory: 'မှတ်တမ်း မရှိသေးပါ။ ဆေးညွှန်းကို စိစစ်ပြီးနောက် ဤနေရာမှ ရွေးနိုင်ပါသည်။', medsOther: 'အခြားဆေး (လွတ်လပ်စွာ ရေးရန်)',
    child: 'ကလေးအတွက် ဆေးဖြစ်သည် (ကိုယ်အလေးချိန် ပြောရန်)', weight: 'ကိုယ်အလေးချိန် (kg)', notes: 'ဆေးဆိုင်ကို ပြောလိုသော အခြားအချက်',
    freeHint: 'ကိုယ်တိုင်ရေးသော စာကို ဘာသာမပြန်ပါ။ ရေးထားသည့်အတိုင်း ဆေးဆိုင်တွင် ပြသပါမည်။',
    show: 'ဆေးဆိုင်ဝန်ထမ်းကို ပြရန် (ဂျပန်ဘာသာ)', showHint: 'ဤမျက်နှာပြင်ကို ဆေးဆိုင်ဝန်ထမ်းကို ပြပါ။', edit: 'မှတ်စု ပြင်ရန်',
    clear: 'မှတ်စု ဖျက်ရန်', clearAsk: 'ဤမှတ်စုကို ဖျက်မလား', clearYes: 'ဖျက်မည်', clearNo: 'မလုပ်တော့ပါ', cleared: 'မှတ်စုကို ဖျက်ပြီးပါပြီ။', empty: 'ဘာမှ မဖြည့်ရသေးပါ။',
  },
  ne: {
    linkLabel: 'फार्मेसीलाई देखाउने नोट', title: 'फार्मेसीमा देखाउने नोट',
    intro: 'आफ्नो एलर्जी, प्रयोग गरिरहेको औषधि र अन्य महत्त्वपूर्ण जानकारी आफ्नै भाषामा लेख्नुहोस्। फार्मेसीमा "फार्मेसीका कर्मचारीलाई देखाउनुहोस्" थिच्दा जापानी भाषामा देखिन्छ।',
    localNote: 'यो नोट यही उपकरणमा मात्र सुरक्षित हुन्छ र इन्टरनेटमार्फत पठाइँदैन।', autosave: 'लेखेको कुरा आफैँ सुरक्षित हुन्छ।',
    jpLevel: 'तपाईं कति जापानी बोल्न सक्नुहुन्छ?', jpNone: 'लगभग बोल्न सक्दिन', jpLittle: 'अलिअलि', jpOk: 'बोल्न सक्छु', yes: 'छ', no: 'छैन',
    allergy: 'तपाईंलाई औषधि वा खानेकुराको एलर्जी छ?', adr: 'औषधिका कारण कहिल्यै अस्वस्थ हुनुभएको छ? (साइड इफेक्ट)', adrDrug: 'कुन औषधि थियो? (थाहा भए)',
    conditions: 'अहिले उपचार गराइरहेको रोग', pregnancy: 'गर्भावस्था / स्तनपान', avoid: 'बेवास्ता गर्न चाहेका पदार्थ (धर्म, खानपान आदि)', meds: 'अहिले प्रयोग गरिरहेको औषधि',
    medsFromHistory: 'प्रेस्क्रिप्शन सहायकको इतिहासबाट छान्नुहोस्', medsNoHistory: 'अहिलेसम्म इतिहास छैन। प्रेस्क्रिप्शन विश्लेषण गरेपछि यहाँबाट छान्न सकिन्छ।', medsOther: 'अन्य औषधि (आफैँ लेख्नुहोस्)',
    child: 'यो बच्चाको औषधि हो (तौल बताउनुहोस्)', weight: 'तौल (kg)', notes: 'फार्मेसीलाई भन्न चाहेका अन्य कुरा',
    freeHint: 'आफैँ लेखेको पाठ अनुवाद हुँदैन; जस्तो लेख्नुभयो त्यस्तै फार्मेसीमा देखिन्छ।',
    show: 'फार्मेसीका कर्मचारीलाई देखाउनुहोस् (जापानी)', showHint: 'कृपया यो स्क्रिन फार्मेसीका कर्मचारीलाई देखाउनुहोस्।', edit: 'नोट सम्पादन',
    clear: 'नोट मेटाउनुहोस्', clearAsk: 'यो नोट मेटाउने?', clearYes: 'मेटाउनुहोस्', clearNo: 'रद्द गर्नुहोस्', cleared: 'नोट मेटाइयो।', empty: 'अहिलेसम्म केही लेखिएको छैन।',
  },
  pt: {
    linkLabel: 'Nota para a farmácia', title: 'Nota para mostrar na farmácia',
    intro: 'Escreva no seu idioma suas alergias, os remédios que usa e outras informações importantes. Na farmácia, toque em "Mostrar à equipe da farmácia" e tudo aparecerá em japonês.',
    localNote: 'Esta nota fica salva apenas neste aparelho e nunca é enviada pela internet.', autosave: 'O que você preencher é salvo automaticamente.',
    jpLevel: 'Quanto você fala japonês?', jpNone: 'Quase nada', jpLittle: 'Um pouco', jpOk: 'Sim, falo', yes: 'Sim', no: 'Não',
    allergy: 'Você tem alergia a remédios ou alimentos?', adr: 'Você já passou mal por causa de algum remédio? (efeitos colaterais)', adrDrug: 'Qual remédio? (se souber)',
    conditions: 'Doenças em tratamento agora', pregnancy: 'Gravidez / amamentação', avoid: 'Ingredientes que deseja evitar (religião, dieta etc.)', meds: 'Remédios que usa agora',
    medsFromHistory: 'Escolher do histórico do Assistente de Receita', medsNoHistory: 'Ainda não há histórico. Depois de analisar uma receita, você poderá escolher aqui.', medsOther: 'Outros remédios (escreva livremente)',
    child: 'É remédio para criança (informar o peso)', weight: 'Peso (kg)', notes: 'Outras coisas que quer dizer à farmácia',
    freeHint: 'O texto que você escreve não é traduzido; aparece para a farmácia exatamente como foi escrito.',
    show: 'Mostrar à equipe da farmácia (japonês)', showHint: 'Mostre esta tela à equipe da farmácia.', edit: 'Editar nota',
    clear: 'Apagar nota', clearAsk: 'Apagar esta nota?', clearYes: 'Apagar', clearNo: 'Cancelar', cleared: 'A nota foi apagada.', empty: 'Nada foi preenchido ainda.',
  },
};
