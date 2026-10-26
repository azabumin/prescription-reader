import { describe, expect, it } from 'vitest';

import { cardLead } from './pharmacyCardStrings';

describe('cardLead', () => {
  it('says the answers were sent when the pharmacy views a sent intake', () => {
    expect(cardLead('ja', '日本語', true)).toBe('以下は、ご本人が処方箋ヘルパーで入力し、送信した内容です。');
    expect(cardLead('vi', 'ベトナム語', true)).toBe(
      'この方の言語はベトナム語です。以下は、ご本人が処方箋ヘルパーで入力し、送信した内容を日本語で表示しています。',
    );
  });

  it('keeps the show-at-the-counter wording on the patient memo screen', () => {
    expect(cardLead('ja', '日本語', false)).toBe('以下は、ご本人が処方箋ヘルパーで入力した内容です。');
    expect(cardLead('vi', 'ベトナム語', false)).toBe(
      'この方の言語はベトナム語です。以下は、ご本人が処方箋ヘルパーで入力した内容を日本語で表示しています。',
    );
  });
});
