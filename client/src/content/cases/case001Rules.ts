// قواعد تقييم Case001 (Level 1)
// الفكرة: تصنيف "المعلومة" حسب دورها مع كل فرضية:
// - anti: ينفع لنفي الفرضية (يستخدم في الاستبعاد)
// - pro: ينفع لدعم الفرضية (يستخدم في دعم الفرضية النهائية)
// - decoy: يبدو كأنه يدعم الفرضية لكنه مضلل/غير كافي (يظهر كـ "فخ" فقط في دعم فرضية خاطئة)
// - أي شيء خارج القوائم = غير مفيد (irrelevant)

export type ReasonRef = `${"evidence" | "interview" | "data"}:${string}`;

export type HypothesisReasonProfile = {
  anti: ReasonRef[];
  pro: ReasonRef[];
  decoy: ReasonRef[];
};

export const case001Rules: Record<"h1" | "h2" | "h3" | "h4", HypothesisReasonProfile> = {
  // H1: ضعف فريق المبيعات
  h1: {
    // ينفي فرضية المبيعات
    anti: ["evidence:ev1", "interview:q2_2"],
    // لا نستخدم دعم مباشر لـ H1 في Level 1
    pro: [],
    // يبدو كأنه يدعم H1 (يوحي إن الضغط أكبر) لكنه مش دليل كافي لوحده
    decoy: ["interview:q2_1"],
  },

  // H2: جودة الاستفسارات سيئة (الفرضية الصحيحة)
  h2: {
    anti: [],
    // يدعم H2
    pro: ["interview:q1_1", "interview:q2_2", "data:insight_leads_quality_combined"],
    decoy: [],
  },

  // H3: ركود السوق
  h3: {
    anti: ["evidence:ev2"],
    pro: [],
    // يبدو كأنه يدعم H3 ("السوق هادي") لكنه مش تشخيصي للمشكلة هنا
    decoy: ["interview:q1_2"],
  },

  // H4: منافس جديد خطف العملاء
  h4: {
    anti: ["interview:q2_3"],
    pro: [],
    // يبدو كأنه يدعم H4 (ذكر منافس جديد) لكنه مش دليل كافي لحسم السبب
    decoy: ["evidence:ev3"],
  },
} as const;
