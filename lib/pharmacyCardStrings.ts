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
  { code: 'beef', label: { ja: '牛由来の成分', ko: '소 유래 성분', en: 'Beef-derived ingredients', vi: 'Thành phần từ bò', zh: '牛源成分', id: 'Bahan dari sapi', tl: 'Sangkap mula sa baka', th: 'ส่วนผสมจากวัว', my: 'နွား (အမဲ) မှ ရသော ပါဝင်ပစ္စည်း', ne: 'गाईबाट बनेको पदार्थ', pt: 'Ingredientes de origem bovina' } },
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
  pregnant: (w: string) => (w ? `妊娠中（${w}週）` : '妊娠中'),
  nursing: (a: string) => (a ? `授乳中（お子さん ${a}歳）` : '授乳中'),
  ingredient: '成分名',
  aiLabel: (langJa: string) => `AI翻訳（原文は${langJa}）`,
  originalShort: (langJa: string) => `原文（${langJa}）`,
  aiFoot: '※「AI翻訳」は、ご本人が書いた文章をAIで翻訳したものです。誤りがある可能性があるため、必要に応じて原文やご本人にご確認ください。',
};

type UiKey =
  | 'linkLabel' | 'title' | 'intro' | 'localNote' | 'autosave' | 'jpLevel' | 'jpNone' | 'jpLittle' | 'jpOk'
  | 'yes' | 'no' | 'allergy' | 'adr' | 'adrDrug' | 'conditions' | 'pregnancy' | 'avoid' | 'meds'
  | 'medsFromHistory' | 'medsNoHistory' | 'medsPreferJa' | 'medsHide' | 'medsShowHidden' | 'medsOther' | 'child' | 'weight' | 'notes' | 'freeHint'
  | 'show' | 'showHint' | 'edit' | 'clear' | 'clearAsk' | 'clearYes' | 'clearNo' | 'cleared' | 'empty'
  | 'conditionsOther' | 'pregnancyWeek' | 'nursingChildAge' | 'avoidOther' | 'medsOtherIngredient' | 'translate' | 'translateNote' | 'translating' | 'translated' | 'translateFailed' | 'translateLimit' | 'translatePending';

export const CARD_UI: Record<Lang, Record<UiKey, string>> = {
  ja: {
    linkLabel: '薬局で見せるメモ', title: '薬局で見せるメモ',
    intro: 'アレルギーや使っている薬などを、あなたの言語で入力しておきましょう。薬局で「薬局の方に見せる」を押すと、日本語で表示されます。',
    localNote: 'このメモはこの端末の中だけに保存されます。自由に書いた欄だけは、「日本語に翻訳する」を押したときに翻訳のため送信されます（保存はされません）。', autosave: '入力した内容は自動で保存されます。',
    jpLevel: '日本語はどのくらい話せますか', jpNone: 'ほとんど話せない', jpLittle: '少し話せる', jpOk: '話せる', yes: 'ある', no: 'ない',
    allergy: '薬や食べ物のアレルギーはありますか', adr: '薬で具合が悪くなったことはありますか（副作用）', adrDrug: '原因の薬の名前か成分名（わかれば）',
    conditions: 'いま治療している病気', pregnancy: '妊娠・授乳', avoid: '避けたい成分（宗教・食事など）', meds: 'いま使っている薬',
    medsFromHistory: '処方箋ヘルパーの記録から選ぶ', medsNoHistory: '記録はまだありません。処方箋を分析すると、ここから選べます。', medsPreferJa: '同じ薬が言語違いで2つあるときは、日本語の方を1つだけ選ぶと、薬局の方が読みやすくなります。', medsHide: '候補から外す', medsShowHidden: '外した薬をもとに戻す（{n}件）', medsOther: 'そのほかの薬（母国でもらった薬など。自由に入力）',
    child: '子どもの薬です（体重を伝える）', weight: '体重（kg）', notes: 'そのほか伝えたいこと',
    freeHint: '自由に書いた欄は、下の「日本語に翻訳する」を押すと、AIで日本語に翻訳されます。押さない場合は、書いたまま薬局に表示されます。',
    show: '薬局の方に見せる（日本語）', showHint: 'この画面を薬局の方に見せてください。', edit: 'メモを直す',
    clear: 'メモを消す', clearAsk: 'このメモを消しますか？', clearYes: '消す', clearNo: 'やめる', cleared: 'メモを消しました。', empty: 'まだ何も入力されていません。',
    conditionsOther: 'その他の病気（自由に入力）', pregnancyWeek: '妊娠週数（何週目）', nursingChildAge: '授乳中のお子さんの年齢（歳）', avoidOther: 'その他の避けたい成分（自由に入力）', medsOtherIngredient: 'その薬の成分名（わかれば。わからなければ空欄で大丈夫です）',
    translate: '日本語に翻訳する', translateNote: '翻訳のため、自由に書いた文章だけをAI（Anthropic社）に送ります。メモのほかの内容は送らず、保存もされません。', translating: '翻訳しています…', translated: '日本語に翻訳しました。', translateFailed: '翻訳できませんでした。少し時間をおいて、もう一度お試しください。翻訳しない場合は、書いたまま表示されます。', translateLimit: '今日の翻訳の回数の上限に達しました。明日もう一度お試しください。', translatePending: 'まだ日本語に翻訳していない欄があります。',
  },
  ko: {
    linkLabel: '약국에서 보여 주는 메모', title: '약국에서 보여 주는 메모',
    intro: '알레르기나 사용 중인 약 등을 자신의 언어로 입력해 두세요. 약국에서 「약국 직원에게 보여 주기」를 누르면 일본어로 표시됩니다.',
    localNote: '이 메모는 이 기기 안에만 저장됩니다. 자유롭게 쓴 칸만은 「일본어로 번역」을 눌렀을 때 번역을 위해 전송됩니다(저장되지 않음).', autosave: '입력한 내용은 자동으로 저장됩니다.',
    jpLevel: '일본어는 어느 정도 할 수 있나요?', jpNone: '거의 못 함', jpLittle: '조금 할 수 있음', jpOk: '할 수 있음', yes: '있음', no: '없음',
    allergy: '약이나 음식 알레르기가 있나요?', adr: '약을 먹고 몸이 안 좋았던 적이 있나요? (부작용)', adrDrug: '원인이 된 약의 이름이나 성분명(알면)',
    conditions: '지금 치료 중인 병', pregnancy: '임신·수유', avoid: '피하고 싶은 성분(종교·식생활 등)', meds: '지금 사용 중인 약',
    medsFromHistory: '처방전 도우미 기록에서 고르기', medsNoHistory: '아직 기록이 없습니다. 처방전을 분석하면 여기서 고를 수 있습니다.', medsPreferJa: '같은 약이 언어별로 두 개 있으면 일본어 쪽 하나만 고르면 약국 직원이 읽기 쉽습니다.', medsHide: '후보에서 숨기기', medsShowHidden: '숨긴 약 다시 보기({n}개)', medsOther: '그 밖의 약(본국에서 받은 약 등, 자유 입력)',
    child: '아이의 약입니다(체중을 알림)', weight: '체중(kg)', notes: '그 밖에 전하고 싶은 것',
    freeHint: '자유롭게 쓴 칸은 아래 「일본어로 번역」을 누르면 AI로 일본어로 번역됩니다. 누르지 않으면 쓴 그대로 약국에 표시됩니다.',
    show: '약국 직원에게 보여 주기(일본어)', showHint: '이 화면을 약국 직원에게 보여 주세요.', edit: '메모 고치기',
    clear: '메모 지우기', clearAsk: '이 메모를 지울까요?', clearYes: '지우기', clearNo: '취소', cleared: '메모를 지웠습니다.', empty: '아직 아무것도 입력하지 않았습니다.',
    conditionsOther: '그 밖의 병(자유 입력)', pregnancyWeek: '임신 주수(몇 주째)', nursingChildAge: '수유 중인 아이의 나이(세)', avoidOther: '그 밖에 피하고 싶은 성분(자유 입력)', medsOtherIngredient: '그 약의 성분명(알면. 모르면 비워 두어도 됩니다)',
    translate: '일본어로 번역', translateNote: '번역을 위해 자유롭게 쓴 글만 AI(Anthropic사)로 보냅니다. 메모의 다른 내용은 보내지 않으며 저장되지도 않습니다.', translating: '번역하고 있습니다…', translated: '일본어로 번역했습니다.', translateFailed: '번역하지 못했습니다. 잠시 후 다시 시도해 주세요. 번역하지 않으면 쓴 그대로 표시됩니다.', translateLimit: '오늘 번역할 수 있는 횟수를 다 썼습니다. 내일 다시 시도해 주세요.', translatePending: '아직 일본어로 번역하지 않은 칸이 있습니다.',
  },
  en: {
    linkLabel: 'Pharmacy memo', title: 'Memo to show at the pharmacy',
    intro: 'Enter your allergies, medicines and other important information in your own language. At the pharmacy, tap "Show to pharmacy staff" and it will appear in Japanese.',
    localNote: 'This memo is saved only on this device. Only the text you type yourself is sent, when you tap "Translate into Japanese", to be translated (it is not stored).', autosave: 'What you enter is saved automatically.',
    jpLevel: 'How much Japanese do you speak?', jpNone: 'Hardly at all', jpLittle: 'A little', jpOk: 'Yes, I can', yes: 'Yes', no: 'No',
    allergy: 'Do you have any allergies to medicines or foods?', adr: 'Have you ever felt unwell from a medicine? (side effects)', adrDrug: 'Name or ingredient of the medicine that caused it (if you know)',
    conditions: 'Illnesses you are being treated for now', pregnancy: 'Pregnancy / breastfeeding', avoid: 'Ingredients you want to avoid (religion, diet, etc.)', meds: 'Medicines you use now',
    medsFromHistory: 'Choose from your Prescription Helper history', medsNoHistory: 'No history yet. After you analyze a prescription, you can choose from it here.', medsPreferJa: 'If the same medicine appears twice in different languages, choose only the Japanese one — it is easiest for the pharmacy staff to read.', medsHide: 'Hide from this list', medsShowHidden: 'Show hidden medicines again ({n})', medsOther: 'Other medicines (e.g., from your home country; type freely)',
    child: 'This is for a child (tell the weight)', weight: 'Weight (kg)', notes: 'Anything else you want to tell the pharmacy',
    freeHint: 'Tap "Translate into Japanese" below and the AI will translate what you typed yourself. If you don’t, it is shown to the pharmacy exactly as written.',
    show: 'Show to pharmacy staff (Japanese)', showHint: 'Please show this screen to the pharmacy staff.', edit: 'Edit memo',
    clear: 'Delete memo', clearAsk: 'Delete this memo?', clearYes: 'Delete', clearNo: 'Cancel', cleared: 'The memo was deleted.', empty: 'Nothing has been entered yet.',
    conditionsOther: 'Other illnesses (type freely)', pregnancyWeek: 'Weeks pregnant', nursingChildAge: 'Age of the child you are breastfeeding (years)', avoidOther: 'Other ingredients to avoid (type freely)', medsOtherIngredient: 'Their ingredient names (if you know; fine to leave blank)',
    translate: 'Translate into Japanese', translateNote: 'Only the text you typed yourself is sent to an AI (Anthropic) for translation. Nothing else in the memo is sent, and nothing is stored.', translating: 'Translating…', translated: 'Translated into Japanese.', translateFailed: 'Could not translate. Please try again in a little while. If not translated, it is shown as written.', translateLimit: 'You have reached today’s translation limit. Please try again tomorrow.', translatePending: 'Some fields have not been translated into Japanese yet.',
  },
  vi: {
    linkLabel: 'Ghi chú cho nhà thuốc', title: 'Ghi chú đưa cho nhà thuốc xem',
    intro: 'Hãy nhập dị ứng, thuốc đang dùng và các thông tin quan trọng bằng ngôn ngữ của bạn. Tại nhà thuốc, bấm "Cho nhân viên nhà thuốc xem" để hiển thị bằng tiếng Nhật.',
    localNote: 'Ghi chú này chỉ được lưu trên thiết bị này. Chỉ phần chữ bạn tự viết mới được gửi đi để dịch khi bạn bấm "Dịch sang tiếng Nhật" (không được lưu lại).', autosave: 'Nội dung nhập sẽ được lưu tự động.',
    jpLevel: 'Bạn nói tiếng Nhật ở mức nào?', jpNone: 'Hầu như không', jpLittle: 'Một chút', jpOk: 'Có thể nói', yes: 'Có', no: 'Không',
    allergy: 'Bạn có dị ứng với thuốc hoặc thức ăn không?', adr: 'Bạn đã từng bị khó chịu do thuốc chưa? (tác dụng phụ)', adrDrug: 'Tên thuốc hoặc tên hoạt chất gây ra (nếu biết)',
    conditions: 'Bệnh đang điều trị', pregnancy: 'Mang thai / cho con bú', avoid: 'Thành phần muốn tránh (tôn giáo, ăn uống…)', meds: 'Thuốc đang dùng',
    medsFromHistory: 'Chọn từ Lịch Sử Quét của Trợ Lý Đơn Thuốc', medsNoHistory: 'Chưa có lịch sử. Sau khi phân tích đơn thuốc, bạn có thể chọn ở đây.', medsPreferJa: 'Nếu cùng một thuốc xuất hiện hai lần bằng hai ngôn ngữ, chỉ cần chọn tên tiếng Nhật để nhân viên nhà thuốc dễ đọc.', medsHide: 'Ẩn khỏi danh sách', medsShowHidden: 'Hiện lại thuốc đã ẩn ({n})', medsOther: 'Thuốc khác (như thuốc mang từ nước nhà, nhập tự do)',
    child: 'Đây là thuốc cho trẻ em (cho biết cân nặng)', weight: 'Cân nặng (kg)', notes: 'Điều khác muốn nói với nhà thuốc',
    freeHint: 'Bấm "Dịch sang tiếng Nhật" bên dưới, AI sẽ dịch phần bạn tự viết sang tiếng Nhật. Nếu không bấm, nội dung sẽ hiển thị nguyên văn cho nhà thuốc.',
    show: 'Cho nhân viên nhà thuốc xem (tiếng Nhật)', showHint: 'Vui lòng đưa màn hình này cho nhân viên nhà thuốc xem.', edit: 'Sửa ghi chú',
    clear: 'Xóa ghi chú', clearAsk: 'Xóa ghi chú này?', clearYes: 'Xóa', clearNo: 'Hủy', cleared: 'Đã xóa ghi chú.', empty: 'Chưa nhập gì.',
    conditionsOther: 'Bệnh khác (nhập tự do)', pregnancyWeek: 'Tuổi thai (tuần thứ mấy)', nursingChildAge: 'Tuổi của con đang bú (tuổi)', avoidOther: 'Thành phần khác muốn tránh (nhập tự do)', medsOtherIngredient: 'Tên hoạt chất của thuốc đó (nếu biết, không biết thì để trống)',
    translate: 'Dịch sang tiếng Nhật', translateNote: 'Chỉ phần chữ bạn tự viết được gửi đến AI (Anthropic) để dịch. Các nội dung khác của ghi chú không được gửi và không được lưu lại.', translating: 'Đang dịch…', translated: 'Đã dịch sang tiếng Nhật.', translateFailed: 'Không dịch được. Vui lòng thử lại sau ít phút. Nếu không dịch, nội dung sẽ hiển thị nguyên văn.', translateLimit: 'Bạn đã dùng hết số lần dịch hôm nay. Vui lòng thử lại vào ngày mai.', translatePending: 'Vẫn còn ô chưa được dịch sang tiếng Nhật.',
  },
  zh: {
    linkLabel: '给药店看的备忘', title: '给药店看的备忘',
    intro: '请用您的语言提前填写过敏、正在使用的药等信息。在药店点击「给药店工作人员看」，就会用日语显示。',
    localNote: '此备忘只保存在本设备中。只有您自由填写的文字，会在您点击「翻译成日语」时被发送用于翻译（不会被保存）。', autosave: '填写的内容会自动保存。',
    jpLevel: '您的日语水平如何？', jpNone: '几乎不会', jpLittle: '会一点', jpOk: '会', yes: '有', no: '没有',
    allergy: '您对药物或食物过敏吗？', adr: '您曾经因为用药而身体不适吗？（副作用）', adrDrug: '引起副作用的药名或成分名（如果知道）',
    conditions: '正在治疗的疾病', pregnancy: '怀孕／哺乳', avoid: '想避免的成分（宗教、饮食等）', meds: '正在使用的药',
    medsFromHistory: '从处方助手的历史记录中选择', medsNoHistory: '还没有记录。分析处方后，就可以在这里选择。', medsPreferJa: '同一种药以不同语言出现两次时，只选日语的那一个，药店工作人员更容易看懂。', medsHide: '从候选中隐藏', medsShowHidden: '重新显示已隐藏的药（{n}）', medsOther: '其他药（如从本国带来的药，自由填写）',
    child: '这是儿童用药（告知体重）', weight: '体重（kg）', notes: '其他想告诉药店的事',
    freeHint: '点击下方「翻译成日语」，AI 会把您自由填写的文字翻译成日语。不点击的话，会按原样显示给药店。',
    show: '给药店工作人员看（日语）', showHint: '请把这个画面给药店工作人员看。', edit: '修改备忘',
    clear: '删除备忘', clearAsk: '要删除这个备忘吗？', clearYes: '删除', clearNo: '取消', cleared: '已删除备忘。', empty: '还没有填写任何内容。',
    conditionsOther: '其他疾病（自由填写）', pregnancyWeek: '怀孕周数（第几周）', nursingChildAge: '正在哺乳的孩子的年龄（岁）', avoidOther: '其他想避免的成分（自由填写）', medsOtherIngredient: '这些药的成分名（如果知道；不知道可以不填）',
    translate: '翻译成日语', translateNote: '只会把您自由填写的文字发送给 AI（Anthropic 公司）进行翻译。备忘的其他内容不会发送，也不会被保存。', translating: '正在翻译…', translated: '已翻译成日语。', translateFailed: '翻译失败。请稍后再试。如果不翻译，会按原样显示。', translateLimit: '今天的翻译次数已达上限，请明天再试。', translatePending: '还有尚未翻译成日语的栏目。',
  },
  id: {
    linkLabel: 'Catatan untuk apotek', title: 'Catatan untuk ditunjukkan di apotek',
    intro: 'Isi alergi, obat yang sedang dipakai, dan informasi penting lainnya dalam bahasa Anda. Di apotek, ketuk "Tunjukkan ke petugas apotek" agar ditampilkan dalam bahasa Jepang.',
    localNote: 'Catatan ini hanya disimpan di perangkat ini. Hanya teks yang Anda ketik sendiri yang dikirim untuk diterjemahkan saat Anda mengetuk "Terjemahkan ke bahasa Jepang" (tidak disimpan).', autosave: 'Isian Anda tersimpan otomatis.',
    jpLevel: 'Seberapa bisa Anda berbahasa Jepang?', jpNone: 'Hampir tidak bisa', jpLittle: 'Sedikit', jpOk: 'Bisa', yes: 'Ada', no: 'Tidak ada',
    allergy: 'Apakah Anda punya alergi obat atau makanan?', adr: 'Pernahkah Anda merasa tidak enak badan karena obat? (efek samping)', adrDrug: 'Nama obat atau nama bahan aktif penyebabnya (jika tahu)',
    conditions: 'Penyakit yang sedang diobati', pregnancy: 'Kehamilan / menyusui', avoid: 'Bahan yang ingin dihindari (agama, pola makan, dll.)', meds: 'Obat yang sedang dipakai',
    medsFromHistory: 'Pilih dari riwayat Asisten Resep Obat', medsNoHistory: 'Belum ada riwayat. Setelah menganalisis resep, Anda bisa memilih di sini.', medsPreferJa: 'Jika obat yang sama muncul dua kali dalam bahasa berbeda, pilih yang berbahasa Jepang saja agar mudah dibaca petugas apotek.', medsHide: 'Sembunyikan dari daftar', medsShowHidden: 'Tampilkan lagi obat yang disembunyikan ({n})', medsOther: 'Obat lain (misalnya dari negara asal, ketik bebas)',
    child: 'Ini obat untuk anak (beri tahu berat badan)', weight: 'Berat badan (kg)', notes: 'Hal lain yang ingin disampaikan ke apotek',
    freeHint: 'Ketuk "Terjemahkan ke bahasa Jepang" di bawah, AI akan menerjemahkan teks yang Anda ketik sendiri. Jika tidak, teks ditampilkan ke apotek apa adanya.',
    show: 'Tunjukkan ke petugas apotek (bahasa Jepang)', showHint: 'Tunjukkan layar ini kepada petugas apotek.', edit: 'Ubah catatan',
    clear: 'Hapus catatan', clearAsk: 'Hapus catatan ini?', clearYes: 'Hapus', clearNo: 'Batal', cleared: 'Catatan sudah dihapus.', empty: 'Belum ada yang diisi.',
    conditionsOther: 'Penyakit lain (ketik bebas)', pregnancyWeek: 'Usia kehamilan (minggu ke berapa)', nursingChildAge: 'Usia anak yang sedang disusui (tahun)', avoidOther: 'Bahan lain yang ingin dihindari (ketik bebas)', medsOtherIngredient: 'Nama bahan aktif obat itu (jika tahu; boleh dikosongkan)',
    translate: 'Terjemahkan ke bahasa Jepang', translateNote: 'Hanya teks yang Anda ketik sendiri yang dikirim ke AI (Anthropic) untuk diterjemahkan. Isi catatan lainnya tidak dikirim dan tidak disimpan.', translating: 'Sedang menerjemahkan…', translated: 'Sudah diterjemahkan ke bahasa Jepang.', translateFailed: 'Gagal menerjemahkan. Silakan coba lagi sebentar lagi. Jika tidak diterjemahkan, teks ditampilkan apa adanya.', translateLimit: 'Batas terjemahan hari ini sudah tercapai. Silakan coba lagi besok.', translatePending: 'Masih ada kolom yang belum diterjemahkan ke bahasa Jepang.',
  },
  tl: {
    linkLabel: 'Memo para sa botika', title: 'Memo na ipapakita sa botika',
    intro: 'Isulat sa sarili mong wika ang iyong allergy, mga gamot na ginagamit, at iba pang mahalagang impormasyon. Sa botika, pindutin ang "Ipakita sa staff ng botika" at lalabas ito sa wikang Hapon.',
    localNote: 'Ang memo na ito ay naka-save lang sa device na ito. Ang tekstong ikaw mismo ang sumulat lang ang ipinapadala para maisalin, kapag pinindot mo ang "Isalin sa Japanese" (hindi ito itinatago).', autosave: 'Awtomatikong nase-save ang iyong isinulat.',
    jpLevel: 'Gaano ka marunong mag-Japanese?', jpNone: 'Halos hindi', jpLittle: 'Kaunti', jpOk: 'Oo, marunong', yes: 'Mayroon', no: 'Wala',
    allergy: 'May allergy ka ba sa gamot o pagkain?', adr: 'Nakaramdam ka na ba ng masama dahil sa gamot? (side effect)', adrDrug: 'Pangalan o sangkap ng gamot na naging sanhi (kung alam mo)',
    conditions: 'Mga sakit na ginagamot ngayon', pregnancy: 'Pagbubuntis / pagpapasuso', avoid: 'Mga sangkap na gustong iwasan (relihiyon, pagkain, atbp.)', meds: 'Mga gamot na ginagamit ngayon',
    medsFromHistory: 'Pumili mula sa kasaysayan ng Katulong sa Reseta', medsNoHistory: 'Wala pang kasaysayan. Pagkatapos mag-analyze ng reseta, makakapili ka rito.', medsPreferJa: 'Kung lumabas nang dalawang beses ang parehong gamot sa magkaibang wika, piliin lang ang nasa Japanese para madaling mabasa ng staff ng botika.', medsHide: 'Itago sa listahan', medsShowHidden: 'Ipakita muli ang mga itinagong gamot ({n})', medsOther: 'Iba pang gamot (hal. mula sa sariling bansa, malayang isulat)',
    child: 'Para sa bata ito (sabihin ang timbang)', weight: 'Timbang (kg)', notes: 'Iba pang gustong sabihin sa botika',
    freeHint: 'Pindutin ang "Isalin sa Japanese" sa ibaba at isasalin ng AI ang iyong isinulat. Kung hindi, ipapakita ito sa botika nang eksakto.',
    show: 'Ipakita sa staff ng botika (Japanese)', showHint: 'Pakipakita ang screen na ito sa staff ng botika.', edit: 'Baguhin ang memo',
    clear: 'Burahin ang memo', clearAsk: 'Burahin ang memo na ito?', clearYes: 'Burahin', clearNo: 'Kanselahin', cleared: 'Nabura na ang memo.', empty: 'Wala pang nakasulat.',
    conditionsOther: 'Iba pang sakit (malayang isulat)', pregnancyWeek: 'Ilang linggo nang buntis', nursingChildAge: 'Edad ng batang pinapasuso (taon)', avoidOther: 'Iba pang sangkap na gustong iwasan (malayang isulat)', medsOtherIngredient: 'Mga sangkap ng gamot na iyon (kung alam mo; puwedeng iwanang blangko)',
    translate: 'Isalin sa Japanese', translateNote: 'Ang tekstong ikaw mismo ang sumulat lang ang ipinapadala sa AI (Anthropic) para maisalin. Hindi ipinapadala ang iba pang laman ng memo, at walang itinatago.', translating: 'Isinasalin…', translated: 'Naisalin na sa Japanese.', translateFailed: 'Hindi naisalin. Pakisubukang muli mamaya. Kung hindi naisalin, ipapakita ito nang eksakto.', translateLimit: 'Naabot mo na ang limitasyon ng pagsasalin ngayong araw. Pakisubukang muli bukas.', translatePending: 'May mga field pang hindi naisasalin sa Japanese.',
  },
  th: {
    linkLabel: 'บันทึกสำหรับร้านยา', title: 'บันทึกสำหรับแสดงที่ร้านยา',
    intro: 'กรอกข้อมูลการแพ้ ยาที่ใช้อยู่ และข้อมูลสำคัญอื่น ๆ เป็นภาษาของคุณ เมื่ออยู่ที่ร้านยา ให้แตะ "แสดงให้เจ้าหน้าที่ร้านยาดู" แล้วข้อมูลจะแสดงเป็นภาษาญี่ปุ่น',
    localNote: 'บันทึกนี้ถูกเก็บไว้ในอุปกรณ์นี้เท่านั้น มีเพียงข้อความที่คุณพิมพ์เองที่จะถูกส่งไปแปลเมื่อคุณแตะ "แปลเป็นภาษาญี่ปุ่น" (ไม่มีการเก็บไว้)', autosave: 'ข้อมูลที่กรอกจะถูกบันทึกโดยอัตโนมัติ',
    jpLevel: 'คุณพูดภาษาญี่ปุ่นได้แค่ไหน', jpNone: 'แทบไม่ได้', jpLittle: 'ได้นิดหน่อย', jpOk: 'ได้', yes: 'มี', no: 'ไม่มี',
    allergy: 'คุณแพ้ยาหรืออาหารหรือไม่', adr: 'คุณเคยมีอาการไม่สบายจากยาหรือไม่ (ผลข้างเคียง)', adrDrug: 'ชื่อยาหรือชื่อตัวยาที่เป็นสาเหตุ (ถ้าทราบ)',
    conditions: 'โรคที่กำลังรักษาอยู่', pregnancy: 'การตั้งครรภ์ / ให้นมบุตร', avoid: 'ส่วนผสมที่ต้องการหลีกเลี่ยง (ศาสนา อาหาร ฯลฯ)', meds: 'ยาที่ใช้อยู่ตอนนี้',
    medsFromHistory: 'เลือกจากประวัติของผู้ช่วยอ่านใบสั่งยา', medsNoHistory: 'ยังไม่มีประวัติ หลังจากวิเคราะห์ใบสั่งยาแล้ว จะเลือกได้ที่นี่', medsPreferJa: 'หากยาตัวเดียวกันแสดงสองครั้งเป็นคนละภาษา ให้เลือกเฉพาะชื่อภาษาญี่ปุ่น เจ้าหน้าที่ร้านยาจะอ่านได้ง่าย', medsHide: 'ซ่อนจากรายการ', medsShowHidden: 'แสดงยาที่ซ่อนไว้อีกครั้ง ({n})', medsOther: 'ยาอื่น ๆ (เช่น ยาจากประเทศบ้านเกิด พิมพ์เอง)',
    child: 'เป็นยาสำหรับเด็ก (แจ้งน้ำหนัก)', weight: 'น้ำหนัก (กก.)', notes: 'เรื่องอื่นที่อยากบอกร้านยา',
    freeHint: 'แตะ "แปลเป็นภาษาญี่ปุ่น" ด้านล่าง แล้ว AI จะแปลข้อความที่คุณพิมพ์เองเป็นภาษาญี่ปุ่น ถ้าไม่แตะ จะแสดงให้ร้านยาดูตามที่พิมพ์',
    show: 'แสดงให้เจ้าหน้าที่ร้านยาดู (ภาษาญี่ปุ่น)', showHint: 'กรุณาแสดงหน้าจอนี้ให้เจ้าหน้าที่ร้านยาดู', edit: 'แก้ไขบันทึก',
    clear: 'ลบบันทึก', clearAsk: 'ลบบันทึกนี้หรือไม่', clearYes: 'ลบ', clearNo: 'ยกเลิก', cleared: 'ลบบันทึกแล้ว', empty: 'ยังไม่ได้กรอกข้อมูล',
    conditionsOther: 'โรคอื่น ๆ (พิมพ์เอง)', pregnancyWeek: 'อายุครรภ์ (สัปดาห์ที่เท่าไร)', nursingChildAge: 'อายุของลูกที่กำลังให้นม (ปี)', avoidOther: 'ส่วนผสมอื่นที่ต้องการหลีกเลี่ยง (พิมพ์เอง)', medsOtherIngredient: 'ชื่อตัวยาของยานั้น (ถ้าทราบ ไม่ทราบเว้นว่างได้)',
    translate: 'แปลเป็นภาษาญี่ปุ่น', translateNote: 'จะส่งเฉพาะข้อความที่คุณพิมพ์เองไปให้ AI (บริษัท Anthropic) แปล ข้อมูลอื่นในบันทึกจะไม่ถูกส่ง และไม่มีการเก็บไว้', translating: 'กำลังแปล…', translated: 'แปลเป็นภาษาญี่ปุ่นแล้ว', translateFailed: 'แปลไม่สำเร็จ กรุณาลองใหม่อีกครั้งในภายหลัง ถ้าไม่แปล จะแสดงตามที่พิมพ์', translateLimit: 'ใช้การแปลครบจำนวนของวันนี้แล้ว กรุณาลองใหม่พรุ่งนี้', translatePending: 'ยังมีช่องที่ยังไม่ได้แปลเป็นภาษาญี่ปุ่น',
  },
  my: {
    linkLabel: 'ဆေးဆိုင်ပြရန် မှတ်စု', title: 'ဆေးဆိုင်တွင် ပြရန် မှတ်စု',
    intro: 'ဓာတ်မတည့်မှု၊ သုံးနေသောဆေးနှင့် အရေးကြီးသော အချက်အလက်များကို သင့်ဘာသာစကားဖြင့် ဖြည့်ထားပါ။ ဆေးဆိုင်တွင် "ဆေးဆိုင်ဝန်ထမ်းကို ပြရန်" ကို နှိပ်လျှင် ဂျပန်ဘာသာဖြင့် ပြသပါမည်။',
    localNote: 'ဤမှတ်စုကို ဤစက်ထဲတွင်သာ သိမ်းဆည်းပါသည်။ သင်ကိုယ်တိုင် ရေးသော စာသားကိုသာ "ဂျပန်ဘာသာသို့ ပြန်ရန်" ကို နှိပ်သည့်အခါ ဘာသာပြန်ရန် ပို့ပါသည် (မသိမ်းဆည်းပါ)။', autosave: 'ဖြည့်ထားသည်များကို အလိုအလျောက် သိမ်းဆည်းပါသည်။',
    jpLevel: 'ဂျပန်စကား ဘယ်လောက် ပြောတတ်ပါသလဲ', jpNone: 'လုံးဝနီးပါး မပြောတတ်', jpLittle: 'နည်းနည်း ပြောတတ်', jpOk: 'ပြောတတ်', yes: 'ရှိ', no: 'မရှိ',
    allergy: 'ဆေး သို့မဟုတ် အစားအစာနှင့် ဓာတ်မတည့်မှု ရှိပါသလား', adr: 'ဆေးကြောင့် နေမကောင်းဖြစ်ဖူးပါသလား (ဘေးထွက်ဆိုးကျိုး)', adrDrug: 'ဖြစ်စေသော ဆေးအမည် သို့မဟုတ် ပါဝင်ဆေးအမည် (သိလျှင်)',
    conditions: 'လက်ရှိ ကုသနေသော ရောဂါ', pregnancy: 'ကိုယ်ဝန် / နို့တိုက်ခြင်း', avoid: 'ရှောင်လိုသော ပါဝင်ပစ္စည်း (ဘာသာ၊ အစားအသောက် စသည်)', meds: 'လက်ရှိ သုံးနေသော ဆေး',
    medsFromHistory: 'ဆေးညွှန်း အကူအညီ မှတ်တမ်းမှ ရွေးရန်', medsNoHistory: 'မှတ်တမ်း မရှိသေးပါ။ ဆေးညွှန်းကို စိစစ်ပြီးနောက် ဤနေရာမှ ရွေးနိုင်ပါသည်။', medsPreferJa: 'ဆေးတစ်မျိုးတည်းကို ဘာသာစကားမတူဘဲ နှစ်ခု ပြနေပါက ဂျပန်ဘာသာဖြင့် ရေးထားသည့် တစ်ခုကိုသာ ရွေးပါ။ ဆေးဆိုင်ဝန်ထမ်း ဖတ်ရလွယ်ပါသည်။', medsHide: 'စာရင်းမှ ဖျောက်ရန်', medsShowHidden: 'ဖျောက်ထားသော ဆေးများကို ပြန်ပြရန် ({n})', medsOther: 'အခြားဆေး (မိခင်နိုင်ငံမှ ယူလာသော ဆေး စသည်၊ လွတ်လပ်စွာ ရေးရန်)',
    child: 'ကလေးအတွက် ဆေးဖြစ်သည် (ကိုယ်အလေးချိန် ပြောရန်)', weight: 'ကိုယ်အလေးချိန် (kg)', notes: 'ဆေးဆိုင်ကို ပြောလိုသော အခြားအချက်',
    freeHint: 'အောက်ရှိ "ဂျပန်ဘာသာသို့ ပြန်ရန်" ကို နှိပ်လျှင် သင်ကိုယ်တိုင် ရေးသော စာကို AI က ဂျပန်ဘာသာသို့ ပြန်ပေးပါမည်။ မနှိပ်လျှင် ရေးထားသည့်အတိုင်း ဆေးဆိုင်တွင် ပြသပါမည်။',
    show: 'ဆေးဆိုင်ဝန်ထမ်းကို ပြရန် (ဂျပန်ဘာသာ)', showHint: 'ဤမျက်နှာပြင်ကို ဆေးဆိုင်ဝန်ထမ်းကို ပြပါ။', edit: 'မှတ်စု ပြင်ရန်',
    clear: 'မှတ်စု ဖျက်ရန်', clearAsk: 'ဤမှတ်စုကို ဖျက်မလား', clearYes: 'ဖျက်မည်', clearNo: 'မလုပ်တော့ပါ', cleared: 'မှတ်စုကို ဖျက်ပြီးပါပြီ။', empty: 'ဘာမှ မဖြည့်ရသေးပါ။',
    conditionsOther: 'အခြားရောဂါ (လွတ်လပ်စွာ ရေးရန်)', pregnancyWeek: 'ကိုယ်ဝန် ရက်သတ္တပတ် (ဘယ်နှပတ်မြောက်)', nursingChildAge: 'နို့တိုက်နေသော ကလေး၏ အသက် (နှစ်)', avoidOther: 'ရှောင်လိုသော အခြားပါဝင်ပစ္စည်း (လွတ်လပ်စွာ ရေးရန်)', medsOtherIngredient: 'ထိုဆေး၏ ပါဝင်ဆေးအမည် (သိလျှင်၊ မသိလျှင် ကွက်လပ်ထားနိုင်သည်)',
    translate: 'ဂျပန်ဘာသာသို့ ပြန်ရန်', translateNote: 'သင်ကိုယ်တိုင် ရေးသော စာသားကိုသာ ဘာသာပြန်ရန် AI (Anthropic ကုမ္ပဏီ) သို့ ပို့ပါသည်။ မှတ်စု၏ အခြားအကြောင်းအရာများကို မပို့ပါ၊ မသိမ်းဆည်းပါ။', translating: 'ဘာသာပြန်နေသည်…', translated: 'ဂျပန်ဘာသာသို့ ပြန်ပြီးပါပြီ။', translateFailed: 'ဘာသာမပြန်နိုင်ပါ။ ခဏနေမှ ထပ်ကြိုးစားပါ။ ဘာသာမပြန်လျှင် ရေးထားသည့်အတိုင်း ပြသပါမည်။', translateLimit: 'ယနေ့ ဘာသာပြန်နိုင်သော အကြိမ်ရေ ပြည့်သွားပါပြီ။ မနက်ဖြန် ထပ်ကြိုးစားပါ။', translatePending: 'ဂျပန်ဘာသာသို့ မပြန်ရသေးသော အကွက်များ ရှိပါသည်။',
  },
  ne: {
    linkLabel: 'फार्मेसीलाई देखाउने नोट', title: 'फार्मेसीमा देखाउने नोट',
    intro: 'आफ्नो एलर्जी, प्रयोग गरिरहेको औषधि र अन्य महत्त्वपूर्ण जानकारी आफ्नै भाषामा लेख्नुहोस्। फार्मेसीमा "फार्मेसीका कर्मचारीलाई देखाउनुहोस्" थिच्दा जापानी भाषामा देखिन्छ।',
    localNote: 'यो नोट यही उपकरणमा मात्र सुरक्षित हुन्छ। तपाईंले आफैँ लेखेको पाठ मात्र "जापानीमा अनुवाद गर्नुहोस्" थिच्दा अनुवादका लागि पठाइन्छ (सुरक्षित गरिँदैन)।', autosave: 'लेखेको कुरा आफैँ सुरक्षित हुन्छ।',
    jpLevel: 'तपाईं कति जापानी बोल्न सक्नुहुन्छ?', jpNone: 'लगभग बोल्न सक्दिन', jpLittle: 'अलिअलि', jpOk: 'बोल्न सक्छु', yes: 'छ', no: 'छैन',
    allergy: 'तपाईंलाई औषधि वा खानेकुराको एलर्जी छ?', adr: 'औषधिका कारण कहिल्यै अस्वस्थ हुनुभएको छ? (साइड इफेक्ट)', adrDrug: 'कारण बनेको औषधिको नाम वा तत्वको नाम (थाहा भए)',
    conditions: 'अहिले उपचार गराइरहेको रोग', pregnancy: 'गर्भावस्था / स्तनपान', avoid: 'बेवास्ता गर्न चाहेका पदार्थ (धर्म, खानपान आदि)', meds: 'अहिले प्रयोग गरिरहेको औषधि',
    medsFromHistory: 'प्रेस्क्रिप्शन सहायकको इतिहासबाट छान्नुहोस्', medsNoHistory: 'अहिलेसम्म इतिहास छैन। प्रेस्क्रिप्शन विश्लेषण गरेपछि यहाँबाट छान्न सकिन्छ।', medsPreferJa: 'एउटै औषधि फरक भाषामा दुई पटक देखिएमा जापानी भाषाको मात्र छान्नुहोस्; फार्मेसीका कर्मचारीलाई पढ्न सजिलो हुन्छ।', medsHide: 'सूचीबाट लुकाउनुहोस्', medsShowHidden: 'लुकाइएका औषधि फेरि देखाउनुहोस् ({n})', medsOther: 'अन्य औषधि (जस्तै आफ्नो देशबाट ल्याएको, आफैँ लेख्नुहोस्)',
    child: 'यो बच्चाको औषधि हो (तौल बताउनुहोस्)', weight: 'तौल (kg)', notes: 'फार्मेसीलाई भन्न चाहेका अन्य कुरा',
    freeHint: 'तलको "जापानीमा अनुवाद गर्नुहोस्" थिच्दा तपाईंले आफैँ लेखेको कुरा AI ले जापानीमा अनुवाद गर्छ। नथिचे, जस्तो लेख्नुभयो त्यस्तै फार्मेसीमा देखिन्छ।',
    show: 'फार्मेसीका कर्मचारीलाई देखाउनुहोस् (जापानी)', showHint: 'कृपया यो स्क्रिन फार्मेसीका कर्मचारीलाई देखाउनुहोस्।', edit: 'नोट सम्पादन',
    clear: 'नोट मेटाउनुहोस्', clearAsk: 'यो नोट मेटाउने?', clearYes: 'मेटाउनुहोस्', clearNo: 'रद्द गर्नुहोस्', cleared: 'नोट मेटाइयो।', empty: 'अहिलेसम्म केही लेखिएको छैन।',
    conditionsOther: 'अन्य रोग (आफैँ लेख्नुहोस्)', pregnancyWeek: 'गर्भ कति हप्ताको (हप्ता)', nursingChildAge: 'स्तनपान गराइरहेको बच्चाको उमेर (वर्ष)', avoidOther: 'बेवास्ता गर्न चाहेका अन्य पदार्थ (आफैँ लेख्नुहोस्)', medsOtherIngredient: 'ती औषधिका तत्वको नाम (थाहा भए; थाहा नभए खाली छाड्न सकिन्छ)',
    translate: 'जापानीमा अनुवाद गर्नुहोस्', translateNote: 'तपाईंले आफैँ लेखेको पाठ मात्र अनुवादका लागि AI (Anthropic कम्पनी) मा पठाइन्छ। नोटका अन्य कुरा पठाइँदैनन् र केही पनि सुरक्षित गरिँदैन।', translating: 'अनुवाद हुँदैछ…', translated: 'जापानीमा अनुवाद गरियो।', translateFailed: 'अनुवाद गर्न सकिएन। केही समयपछि फेरि प्रयास गर्नुहोस्। अनुवाद नभए जस्तो लेख्नुभयो त्यस्तै देखिन्छ।', translateLimit: 'आजको अनुवाद गर्न सकिने सीमा पुग्यो। भोलि फेरि प्रयास गर्नुहोस्।', translatePending: 'जापानीमा अनुवाद नगरिएका खाली ठाउँहरू छन्।',
  },
  pt: {
    linkLabel: 'Nota para a farmácia', title: 'Nota para mostrar na farmácia',
    intro: 'Escreva no seu idioma suas alergias, os remédios que usa e outras informações importantes. Na farmácia, toque em "Mostrar à equipe da farmácia" e tudo aparecerá em japonês.',
    localNote: 'Esta nota fica salva apenas neste aparelho. Só o texto que você mesmo escreve é enviado para tradução, quando você toca em "Traduzir para japonês" (não fica guardado).', autosave: 'O que você preencher é salvo automaticamente.',
    jpLevel: 'Quanto você fala japonês?', jpNone: 'Quase nada', jpLittle: 'Um pouco', jpOk: 'Sim, falo', yes: 'Sim', no: 'Não',
    allergy: 'Você tem alergia a remédios ou alimentos?', adr: 'Você já passou mal por causa de algum remédio? (efeitos colaterais)', adrDrug: 'Nome ou princípio ativo do remédio que causou (se souber)',
    conditions: 'Doenças em tratamento agora', pregnancy: 'Gravidez / amamentação', avoid: 'Ingredientes que deseja evitar (religião, dieta etc.)', meds: 'Remédios que usa agora',
    medsFromHistory: 'Escolher do histórico do Assistente de Receita', medsNoHistory: 'Ainda não há histórico. Depois de analisar uma receita, você poderá escolher aqui.', medsPreferJa: 'Se o mesmo remédio aparecer duas vezes em idiomas diferentes, escolha só o nome em japonês — é o mais fácil para a equipe da farmácia ler.', medsHide: 'Ocultar da lista', medsShowHidden: 'Mostrar de novo os remédios ocultos ({n})', medsOther: 'Outros remédios (ex.: trazidos do seu país; escreva livremente)',
    child: 'É remédio para criança (informar o peso)', weight: 'Peso (kg)', notes: 'Outras coisas que quer dizer à farmácia',
    freeHint: 'Toque em "Traduzir para japonês" abaixo e a IA traduzirá o que você mesmo escreveu. Se não tocar, aparece para a farmácia exatamente como foi escrito.',
    show: 'Mostrar à equipe da farmácia (japonês)', showHint: 'Mostre esta tela à equipe da farmácia.', edit: 'Editar nota',
    clear: 'Apagar nota', clearAsk: 'Apagar esta nota?', clearYes: 'Apagar', clearNo: 'Cancelar', cleared: 'A nota foi apagada.', empty: 'Nada foi preenchido ainda.',
    conditionsOther: 'Outras doenças (escreva livremente)', pregnancyWeek: 'Semanas de gravidez', nursingChildAge: 'Idade da criança que você amamenta (anos)', avoidOther: 'Outros ingredientes a evitar (escreva livremente)', medsOtherIngredient: 'Princípios ativos desses remédios (se souber; pode deixar em branco)',
    translate: 'Traduzir para japonês', translateNote: 'Só o texto que você mesmo escreveu é enviado a uma IA (Anthropic) para tradução. O restante da nota não é enviado e nada fica guardado.', translating: 'Traduzindo…', translated: 'Traduzido para japonês.', translateFailed: 'Não foi possível traduzir. Tente de novo daqui a pouco. Se não for traduzido, aparece como foi escrito.', translateLimit: 'Você atingiu o limite de traduções de hoje. Tente de novo amanhã.', translatePending: 'Ainda há campos não traduzidos para japonês.',
  },
};
