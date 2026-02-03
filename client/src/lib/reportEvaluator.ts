import { case001 } from "@/content/cases/case001";
import { case001Rules, ReasonRef } from "@/content/cases/case001Rules";

export type JustificationItem = { type: "evidence" | "interview" | "data"; id: string };

export type StepStatus = "ok" | "ok_noisy" | "invalid" | "trap";

export type StepResult = {
  stepKey: string; // e.g. "elim:h1" | "support:h2"
  hypothesisId: string;
  kind: "elimination" | "support";
  status: StepStatus;
  points: number;
  note: string; // short player-facing note (simple Arabic)
};

export type ReportOutcome = "accepted" | "review" | "rejected";

export type ReportEvaluation = {
  outcome: ReportOutcome;
  accepted: boolean; // outcome === "accepted"
  scorePercent: number;
  correctHypothesis: boolean;
  remainingHypothesisId: string;
  ledger: StepResult[]; // 4 items
  learningCards: string[];
  managerMessage: string;
};

const POINTS = {
  ok: 25,
  ok_noisy: 18,
  invalid: 0,
  trap: -10,
  bonusCorrect: 10,
} as const;

const NOISE_REVIEW_THRESHOLD = 3; // if noisy steps >= 3 => review (even if correct)

function unique<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}

function toReasonRef(item: JustificationItem): ReasonRef {
  return `${item.type}:${item.id}` as ReasonRef;
}

function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

function pickBySeed<T>(seed: string, options: T[]): T {
  const idx = hashStr(seed) % options.length;
  return options[idx];
}

type RuleProfile = { anti: ReasonRef[]; pro: ReasonRef[]; decoy: ReasonRef[] };

function getRule(hypothesisId: string): RuleProfile {
  return (case001Rules as any)[hypothesisId] as RuleProfile;
}

function splitRefsFor(hypothesisId: string, refs: ReasonRef[]) {
  const rule = getRule(hypothesisId);
  const inAnti = refs.filter((r) => rule.anti.includes(r));
  const inPro = refs.filter((r) => rule.pro.includes(r));
  const inDecoy = refs.filter((r) => rule.decoy.includes(r));
  const rest = refs.filter((r) => !rule.anti.includes(r) && !rule.pro.includes(r) && !rule.decoy.includes(r));
  return { rule, inAnti, inPro, inDecoy, rest };
}

const ELIM_NOTES = {
  invalid: [
    "الاستبعاد مش متأسس على سبب ينفي الفرضية بشكل واضح.",
    "التبرير هنا ما يدّيش سبب كافي لرفع الفرضية من الترابيزة.",
  ],
  ok_noisy: [
    "الاستبعاد مقبول—فيه سبب قوي… لكن سبب تاني ما أضافش فرق.",
    "قرار الاستبعاد ماشي… بس التبرير كان ممكن يبقى أنضف.",
    "وصلت لقرار صحيح، بس زودت سبب ما ساعدش في الصورة.",
  ],
  ok: [
    "استبعاد مرتب ومقنع.",
    "قرار واضح… والسبب اللي اخترته قفل الفرضية كويس.",
    "الفرضية اتشالت بشكل مريح.",
  ],
} as const;

const SUPPORT_NOTES = {
  invalid: [
    "الدعم مش متأسس على سبب يثبت الفرضية بشكل واضح.",
    "التبرير هنا ما يدّيش سبب كافي لتثبيت الفرضية على الترابيزة.",
  ],
  ok_noisy: [
    "الدعم مقبول—فيه سبب قوي… لكن سبب تاني ما أضافش فرق.",
    "قرار الدعم ماشي… بس التبرير كان ممكن يبقى أنضف.",
    "وصلت لقرار صحيح، بس زودت سبب ما ساعدش في الصورة.",
  ],
  ok: [
    "دعم مرتب ومقنع.",
    "قرار واضح… والسبب اللي اخترته قفل الفرضية كويس.",
    "الفرضية اتثبتت بشكل مريح.",
  ],
  trap: [
    "المعلومة اللي اعتمدت عليها شكلها قوي… بس مضللة لوحدها.",
    "ده نوع من المعلومات اللي بتشدّك بسرعة… لكنها ما تكفيش لقرار.",
    "اعتمدت على نقطة لامعة، بس ما تسندش الفرضية بالشكل اللي يطمن.",
  ],
} as const;

function noteForStep(status: StepStatus, kind: StepResult["kind"], seed: string) {
  if (kind === "elimination") {
    if (status === "trap") return pickBySeed(seed, SUPPORT_NOTES.trap);
    return pickBySeed(seed, ELIM_NOTES[status]);
  }
  return pickBySeed(seed, SUPPORT_NOTES[status]);
}

function evalElimination(hypothesisId: string, justifications: JustificationItem[]): StepResult {
  const refs = unique(justifications.map(toReasonRef));
  const { inAnti, inPro, inDecoy, rest } = splitRefsFor(hypothesisId, refs);
  const seed = `elim:${hypothesisId}:${refs.join("|")}`;

  if (refs.length === 0) {
    return {
      stepKey: `elim:${hypothesisId}`,
      hypothesisId,
      kind: "elimination",
      status: "invalid",
      points: POINTS.invalid,
      note: noteForStep("invalid", "elimination", seed),
    };
  }

  // لو اخترت أي سبب "مش للنفي" (pro/decoy) يبقى قرارك مش سليم حتى لو اخترت سبب واحد صحيح.
  if (inPro.length > 0 || inDecoy.length > 0) {
    return {
      stepKey: `elim:${hypothesisId}`,
      hypothesisId,
      kind: "elimination",
      status: "invalid",
      points: POINTS.invalid,
      note: noteForStep("invalid", "elimination", seed),
    };
  }

  if (inAnti.length === 0) {
    return {
      stepKey: `elim:${hypothesisId}`,
      hypothesisId,
      kind: "elimination",
      status: "invalid",
      points: POINTS.invalid,
      note: noteForStep("invalid", "elimination", seed),
    };
  }

  if (rest.length > 0) {
    return {
      stepKey: `elim:${hypothesisId}`,
      hypothesisId,
      kind: "elimination",
      status: "ok_noisy",
      points: POINTS.ok_noisy,
      note: noteForStep("ok_noisy", "elimination", seed),
    };
  }

  return {
    stepKey: `elim:${hypothesisId}`,
    hypothesisId,
    kind: "elimination",
    status: "ok",
    points: POINTS.ok,
    note: noteForStep("ok", "elimination", seed),
  };
}

function evalSupport(finalHypothesisId: string, justifications: JustificationItem[]): StepResult {
  const refs = unique(justifications.map(toReasonRef));
  const { inAnti, inPro, inDecoy, rest } = splitRefsFor(finalHypothesisId, refs);
  const correct = finalHypothesisId === case001.solution.correctHypothesisId;
  const seed = `support:${finalHypothesisId}:${refs.join("|")}`;

  if (refs.length === 0) {
    return {
      stepKey: `support:${finalHypothesisId}`,
      hypothesisId: finalHypothesisId,
      kind: "support",
      status: "invalid",
      points: POINTS.invalid,
      note: noteForStep("invalid", "support", seed),
    };
  }

  // دعم الفرضية الصحيحة
  if (correct) {
    // أي anti/decoy هنا يعتبر استخدام مش في مكانه
    if (inAnti.length > 0 || inDecoy.length > 0) {
      return {
        stepKey: `support:${finalHypothesisId}`,
        hypothesisId: finalHypothesisId,
        kind: "support",
        status: "invalid",
        points: POINTS.invalid,
        note: noteForStep("invalid", "support", seed),
      };
    }

    if (inPro.length === 0) {
      return {
        stepKey: `support:${finalHypothesisId}`,
        hypothesisId: finalHypothesisId,
        kind: "support",
        status: "invalid",
        points: POINTS.invalid,
        note: noteForStep("invalid", "support", seed),
      };
    }

    if (rest.length > 0) {
      return {
        stepKey: `support:${finalHypothesisId}`,
        hypothesisId: finalHypothesisId,
        kind: "support",
        status: "ok_noisy",
        points: POINTS.ok_noisy,
        note: noteForStep("ok_noisy", "support", seed),
      };
    }

    return {
      stepKey: `support:${finalHypothesisId}`,
      hypothesisId: finalHypothesisId,
      kind: "support",
      status: "ok",
      points: POINTS.ok,
      note: noteForStep("ok", "support", seed),
    };
  }

  // دعم فرضية خاطئة
  if (inDecoy.length > 0) {
    return {
      stepKey: `support:${finalHypothesisId}`,
      hypothesisId: finalHypothesisId,
      kind: "support",
      status: "trap",
      points: POINTS.trap,
      note: noteForStep("trap", "support", seed),
    };
  }

  // أي دعم آخر لفرضية خاطئة = غير صحيح
  return {
    stepKey: `support:${finalHypothesisId}`,
    hypothesisId: finalHypothesisId,
    kind: "support",
    status: "invalid",
    points: POINTS.invalid,
    note: noteForStep("invalid", "support", seed),
  };
}

const LEARNING_CARDS = {
  invalid: [
    "مش أي معلومة تنفع كسبب. السبب الصحيح هو اللي يغيّر قرارك بوضوح.",
    "التفسير يشرح… لكن الدليل هو اللي يرجّح احتمال ويضعّف احتمال تاني.",
  ],
  noise: [
    "كل دليل زيادة ممكن يزوّد التشويش. الوضوح أحيانًا في القليل.",
    "مش المهم كام دليل عندك… المهم هل الدليل ده فعلاً فارق.",
    "دليل واحد حاسم أحسن من أدلة كتير ما بتغيّرش النتيجة.",
  ],
  trap: [
    "التضليل أحيانًا يبدأ بمعلومة شكلها قوي… فتسحبك لقرار سريع.",
    "التضليل يخليك تفتّش عن اللي يؤكد فكرة في دماغك… قبل ما تراجع البدائل.",
  ],
  strong: [
    "قوة التحليل إنك تقفل البدائل واحدة واحدة… مش إنك تلاقي إجابة بسرعة.",
    "الثقة تيجي لما بدائل كتير تقع بأسباب واضحة.",
  ],
} as const;

function pickTwo(seed: string, options: readonly string[]) {
  if (options.length <= 2) return [...options];
  const first = pickBySeed(seed + "first", options);
  const remaining = options.filter((o) => o !== first);
  const second = pickBySeed(seed + "second", remaining);
  return [first, second];
}

function buildLearningCards(ledger: StepResult[]): string[] {
  const hasTrap = ledger.some((s) => s.status === "trap");
  const hasInvalid = ledger.some((s) => s.status === "invalid");
  const hasNoise = ledger.some((s) => s.status === "ok_noisy");

  if (!hasTrap && !hasInvalid && !hasNoise) {
    return [...LEARNING_CARDS.strong];
  }

  const seed = JSON.stringify(ledger);
  const priority: Array<"trap" | "invalid" | "noise"> = ["trap", "invalid", "noise"];
  const categories = priority.filter((cat) =>
    cat === "trap" ? hasTrap : cat === "invalid" ? hasInvalid : hasNoise
  );

  if (categories.length === 1) {
    const cat = categories[0];
    return pickTwo(seed + cat, LEARNING_CARDS[cat]);
  }

  if (categories.length === 2) {
    return categories.map((cat) => pickBySeed(seed + cat, LEARNING_CARDS[cat]));
  }

  return categories.map((cat) => pickBySeed(seed + cat, LEARNING_CARDS[cat]));
}

function managerNarrative(params: {
  outcome: ReportOutcome;
  correctHypothesis: boolean;
  ledger: StepResult[];
}): string {
  const { outcome, correctHypothesis, ledger } = params;

  const titles = {
    h1: case001.hypotheses.find((h) => h.id === "h1")?.title ?? "فرضية المبيعات",
    h2: case001.hypotheses.find((h) => h.id === "h2")?.title ?? "فرضية الجودة",
    h3: case001.hypotheses.find((h) => h.id === "h3")?.title ?? "فرضية السوق",
    h4: case001.hypotheses.find((h) => h.id === "h4")?.title ?? "فرضية المنافس",
  } as const;

  const seed = JSON.stringify(params);

  // pick 1-2 highlights
  const invalidSteps = ledger.filter((s) => s.status === "invalid");
  const noisySteps = ledger.filter((s) => s.status === "ok_noisy");
  const trapSteps = ledger.filter((s) => s.status === "trap");

  const mentionHyp = (s: StepResult) => {
    const title = case001.hypotheses.find((h) => h.id === s.hypothesisId)?.title ?? "فرضية";
    return title;
  };

  const openers = [
    "تمام… قرأت تقريرك كويس.",
    "خلّيني أقولك انطباعي بعد ما راجعت التقرير.",
    "اطلّعت على اللي وصلت له.",
  ];

  if (outcome === "accepted") {
    const positives = [
      `ريحني إنك قفلت الشكوك الأساسية واحدة واحدة، خصوصًا ${titles.h1}.`,
      `واضح إنك ما اتسحبتش وراء كلام شكله كبير… وده بان في استبعادك لـ ${titles.h3} و ${titles.h4}.`,
      "المنطق العام في التقرير راكب على الصورة اللي عندنا.",
    ];

    const smallNote = noisySteps.length
      ? pickBySeed(seed + "small", [
          "في حاجات اتقالت زيادة ملهاش لازمة… بس مش مأثرة على القرار.",
          "بس خلي بالك: كل ما التبرير يبقى أنضف، القرار يبقى أسهل.",
        ])
      : "";

    const ending = pickBySeed(seed + "end", [
      "أنا موافق نمشي على التقرير ده. خلّينا نبدأ إجراءات التنفيذ.",
      "تمام. هنمشي بالاتجاه ده ونبدأ الخطوات اللي قلت عليها.",
    ]);

    return [pickBySeed(seed + "op", openers), pickBySeed(seed + "pos", positives), smallNote, ending]
      .filter(Boolean)
      .join("\n");
  }

  if (outcome === "review") {
    // choose a specific hypothesis to mention if exists
    const target = invalidSteps[0] ?? noisySteps[0];
    const targetTitle = target ? mentionHyp(target) : "واحدة من الفرضيات";

    const lines = [
      "أنا مش ضد الاتجاه… بس مش قادر أوقع على القرار بالشكل ده.",
      `في جزء متعلق بـ ${targetTitle} لسه مش مطمّنني كفاية.`,
      "عايز نسخة أنضف من التقرير—اختصر الأسباب وخليها في صميم الموضوع.",
    ];

    const tone = pickBySeed(seed + "tone", [
      "ارجع راجع بسرعة وتعالى.",
      "لما تخلص، ابعتهولي تاني.",
      "قدّم نسخة تانية ونشوف." ,
    ]);

    return [pickBySeed(seed + "op", openers), ...lines, tone].join("\n");
  }

  // rejected
  const target = trapSteps[0] ?? invalidSteps[0];
  const targetTitle = target ? mentionHyp(target) : "الفرضية الأساسية";

  const lines = [
    "أنا مش هقدر أعتمد على التقرير ده.",
    correctHypothesis
      ? `حتى لو الاتجاه ممكن يكون قريب… طريقة قفل ${targetTitle} مش مطمّنة.`
      : "الفرضية اللي بنيت عليها القرار مش راكبة على الصورة اللي عندنا.",
    "ارجع راجع اللي عندك وقدّم تقرير جديد." ,
  ];

  const extra = pickBySeed(seed + "ex", [
    "خلّينا ناخدها بهدوء… بس لازم يبقى عندي سبب واضح قبل ما أتحرك.",
    "مش عايزين نتحرك على حدس… عايزين تقرير يخلّينا مطمّنين.",
    "دلوقتي مش مطمّن… وده قرار كبير.",
  ]);

  return [pickBySeed(seed + "op", openers), ...lines, extra].join("\n");
}

export function evaluateCase001Report(params: {
  eliminations: Array<{ hypothesisId: string; justifications: JustificationItem[] }>;
  finalHypothesisId: string;
  finalSupportJustifications: JustificationItem[];
}): ReportEvaluation {
  const { eliminations, finalHypothesisId, finalSupportJustifications } = params;

  const correctHypothesis = finalHypothesisId === case001.solution.correctHypothesisId;

  // Expected 4 hypotheses in case001
  const elimIds = case001.hypotheses
    .map((h) => h.id)
    .filter((hid) => hid !== finalHypothesisId);

  const ledger: StepResult[] = [];

  for (const hid of elimIds) {
    const elim = eliminations.find((e) => e.hypothesisId === hid);
    ledger.push(evalElimination(hid, elim?.justifications ?? []));
  }

  ledger.push(evalSupport(finalHypothesisId, finalSupportJustifications));

  const noisyCount = ledger.filter((s) => s.status === "ok_noisy").length;
  const anyInvalidElims = ledger
    .filter((s) => s.kind === "elimination")
    .some((s) => s.status === "invalid");
  const supportStep = ledger.find((s) => s.kind === "support")!;

  // score (0..100)
  // نستخدم سقف ثابت 110 (4 خطوات * 25 + بونص 10) علشان الفرق بين "نظيف" و"فيه ضوضاء" يبان.
  let points = ledger.reduce((a, s) => a + s.points, 0);
  if (correctHypothesis) points += POINTS.bonusCorrect;
  const maxPoints = POINTS.ok * 4 + POINTS.bonusCorrect; // 110
  const ratio = Math.max(0, Math.min(1, points / maxPoints));
  const scorePercent = Math.round(ratio * 100);

  // outcome rules
  let outcome: ReportOutcome;
  if (
    correctHypothesis &&
    !anyInvalidElims &&
    (supportStep.status === "ok" || supportStep.status === "ok_noisy") &&
    noisyCount < NOISE_REVIEW_THRESHOLD &&
    supportStep.status !== "trap"
  ) {
    outcome = "accepted";
  } else if (supportStep.status === "trap" || !correctHypothesis) {
    outcome = "rejected";
  } else {
    outcome = "review";
  }

  // If correct but too noisy => review (explicit)
  if (outcome === "accepted" && noisyCount >= NOISE_REVIEW_THRESHOLD) {
    outcome = "review";
  }

  const learningCards = buildLearningCards(ledger);

  const managerMessage = managerNarrative({ outcome, correctHypothesis, ledger });

  return {
    outcome,
    accepted: outcome === "accepted",
    scorePercent,
    correctHypothesis,
    remainingHypothesisId: finalHypothesisId,
    ledger,
    learningCards,
    managerMessage,
  };
}
