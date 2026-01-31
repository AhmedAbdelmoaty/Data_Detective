// منطق تقييم بسيط لـ Level 1 (Case001)
// الهدف: تقييم جودة الاستبعاد/الدعم بدون كشف "الإجابة" بشكل مباشر.

export type ReasonRef = `${"evidence" | "interview" | "data"}:${string}`;

export type SupportRule = {
  primary: ReasonRef[];
  secondary: ReasonRef[];
  misleading: ReasonRef[];
};

export const case001Rules = {
  // H1: ضعف فريق المبيعات
  h1: {
    locks: ["evidence:ev1", "interview:q2_2"] as ReasonRef[],
    traps: ["interview:q2_1"] as ReasonRef[],
    supports: { primary: [], secondary: [], misleading: [] } as SupportRule,
  },

  // H2: جودة الاستفسارات سيئة
  h2: {
    locks: [] as ReasonRef[],
    traps: [] as ReasonRef[],
    // دعم: (ثانوي) من التسويق + (أساسي) من المبيعات + (أساسي) من البيانات
    supports: {
      primary: ["interview:q2_2", "data:insight_leads_quality_combined"],
      secondary: ["interview:q1_1"],
      misleading: [],
    } as SupportRule,
  },

  // H3: ركود السوق
  h3: {
    locks: ["evidence:ev2"] as ReasonRef[],
    traps: ["interview:q1_2"] as ReasonRef[],
    supports: { primary: [], secondary: [], misleading: [] } as SupportRule,
  },

  // H4: منافس جديد خطف العملاء
  h4: {
    locks: ["interview:q2_3"] as ReasonRef[],
    traps: ["evidence:ev3"] as ReasonRef[],
    supports: { primary: [], secondary: [], misleading: [] } as SupportRule,
  },
} as const;
