// منطق تقييم بسيط لـ Level 1 (Case001)
// الهدف: تقييم جودة الاستبعاد/الدعم بدون كشف "الإجابة" بشكل مباشر.

export type ReasonRef = `${'evidence' | 'interview' | 'data'}:${string}`;

export const case001Rules = {
  // H1: ضعف فريق المبيعات
  h1: {
    locks: ["evidence:ev1", "interview:q2_2"] as ReasonRef[],
    traps: ["interview:q2_1"] as ReasonRef[],
    supports: [] as ReasonRef[],
  },

  // H2: جودة الاستفسارات سيئة
  h2: {
    locks: [] as ReasonRef[],
    traps: [] as ReasonRef[],
    // دعم: (جزء ضعيف) من التسويق + (قوي) من المبيعات + (قوي) من البيانات
    supports: ["interview:q1_1", "interview:q2_2", "data:insight_b", "data:insight_a"] as ReasonRef[],
  },

  // H3: ركود السوق
  h3: {
    locks: ["evidence:ev2"] as ReasonRef[],
    traps: ["interview:q1_2"] as ReasonRef[],
    supports: [] as ReasonRef[],
  },

  // H4: منافس جديد خطف العملاء
  h4: {
    locks: ["interview:q2_3"] as ReasonRef[],
    traps: ["evidence:ev3"] as ReasonRef[],
    supports: [] as ReasonRef[],
  },
} as const;
