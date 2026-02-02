import { case001Rules, ReasonRef } from "@/content/cases/case001Rules";
import { case001 } from "@/content/cases/case001";

export type Tag = "LOCK" | "SUPPORT" | "TRAP" | "WEAK";
export type Grade = "strong" | "medium" | "weak" | "trap";
export type Verdict = "convincing" | "shaky" | "unconvincing";

export type StepEvaluation = {
  grade: Grade;
  points: number; // used to compute quality meter
  message: string; // simple, non-technical feedback
};

export type EliminationFeedback = {
  hypothesisId: string;
  evaluation: StepEvaluation;
};

export type ReportEvaluation = {
  percent: number;
  verdict: Verdict;
  accepted: boolean;
  correctHypothesis: boolean;
  managerNarrative: string;
  eliminationFeedback: EliminationFeedback[];
  finalSupport: StepEvaluation;
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function hashSeed(s: string): number {
  // deterministic hash (no crypto dependency)
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

function pickBySeed<T>(seed: string, options: T[]): T {
  const h = hashSeed(seed);
  return options[h % options.length];
}

export function tagReason(hypothesisId: string, reasonRef: ReasonRef): Tag {
  const rule = (case001Rules as any)[hypothesisId] as
    | { locks: ReasonRef[]; traps: ReasonRef[]; supports: ReasonRef[] }
    | undefined;

  // TRAP first: لو اللاعب لمس فخ… لازم يظهر كفخ حتى لو فيه سبب تاني قوي.
  if (rule?.traps?.includes(reasonRef)) return "TRAP";
  if (rule?.locks?.includes(reasonRef)) return "LOCK";
  if (rule?.supports?.includes(reasonRef)) return "SUPPORT";
  return "WEAK";
}

function gradeToPoints(grade: Grade): number {
  if (grade === "strong") return 2;
  if (grade === "medium") return 1;
  if (grade === "weak") return 0;
  return -1; // trap
}

function downgradeOne(grade: Exclude<Grade, "trap">): Exclude<Grade, "trap"> {
  if (grade === "strong") return "medium";
  if (grade === "medium") return "weak";
  return "weak";
}

function eliminationMessage(grade: Grade, mixedTrap: boolean): string {
  if (mixedTrap) {
    // This is the “picked a good reason + added noise/trap” pattern.
    return "فيه سبب كويس… لكن خلطته مع معلومة ممكن تكون مضللة. ده بيقلل الثقة في الاستبعاد.";
  }
  switch (grade) {
    case "strong":
      return "استبعادك كان واضح ومقنع… السبب اللي اخترته كفاية يقفل الفرضية.";
    case "medium":
      return "السبب مرتبط، بس مش قوي كفاية لوحده عشان يقفل الفرضية بثقة.";
    case "weak":
      return "السبب اللي اخترته بعيد أو عام… ومش بيساعد نقفل الفرضية.";
    case "trap":
      return "اعتمدت على معلومة شكلها مقنع… لكنها ممكن تودّي لاستنتاج غلط.";
  }
}

function supportMessage(grade: Grade, mixedTrap: boolean): string {
  if (mixedTrap) {
    return "دعمك فيه نقطة كويسة… لكن خلطتها مع سبب مضلل، فالدعم كله بقى أضعف.";
  }
  switch (grade) {
    case "strong":
      return "دعمك للنتيجة النهائية متماسك ومبني على سبب مناسب.";
    case "medium":
      return "فيه دعم، بس محتاج يكون أقوى/أوضح عشان يطمّن.";
    case "weak":
      return "الدعم اللي اخترته مش كفاية لتقوية النتيجة النهائية.";
    case "trap":
      return "سبب الدعم اللي اخترته ممكن يكون مضلل في الاتجاه ده.";
  }
}

export function evaluateElimination(hypothesisId: string, reasonRefs: ReasonRef[]): StepEvaluation {
  const tags = reasonRefs.map((r) => tagReason(hypothesisId, r));

  const hasLock = tags.includes("LOCK");
  const hasTrap = tags.includes("TRAP");
  const hasWeak = tags.includes("WEAK");

  // Base grade is the “best reason”.
  let base: Grade;
  if (hasLock) base = "strong";
  else if (hasWeak) base = "medium";
  else if (hasTrap) base = "trap";
  else base = "weak";

  // If player mixed a good reason with a trap, downgrade one level (not a full trap).
  const mixedTrap = base !== "trap" && hasTrap;
  const grade: Grade = mixedTrap ? downgradeOne(base as Exclude<Grade, "trap">) : base;

  return {
    grade,
    points: gradeToPoints(grade),
    message: eliminationMessage(grade, mixedTrap),
  };
}

export function evaluateSupport(finalHypothesisId: string, reasonRefs: ReasonRef[]): StepEvaluation {
  const tags = reasonRefs.map((r) => tagReason(finalHypothesisId, r));

  const hasSupport = tags.includes("SUPPORT");
  const hasTrap = tags.includes("TRAP");
  const hasWeak = tags.includes("WEAK");

  let base: Grade;
  if (hasSupport) base = "strong";
  else if (hasWeak) base = "medium";
  else if (hasTrap) base = "trap";
  else base = "weak";

  const mixedTrap = base !== "trap" && hasTrap;
  const grade: Grade = mixedTrap ? downgradeOne(base as Exclude<Grade, "trap">) : base;

  return {
    grade,
    points: gradeToPoints(grade),
    message: supportMessage(grade, mixedTrap),
  };
}

function percentFromPoints(totalPoints: number, correctBonus: number): number {
  // Score range (Level 1):
  // - 3 eliminations: each -1..+2 => -3..+6
  // - final support: -1..+2
  // - correct bonus: 0..+2
  const raw = totalPoints + correctBonus;
  const min = -4; // -3 + -1 + 0
  const max = 10; // +6 + +2 + +2
  const clamped = clamp(raw, min, max);
  const normalized = (clamped - min) / (max - min);
  return Math.round(normalized * 100);
}

function verdictFromPercent(percent: number): Verdict {
  if (percent >= 75) return "convincing";
  if (percent >= 45) return "shaky";
  return "unconvincing";
}

function verdictArabic(verdict: Verdict): string {
  if (verdict === "convincing") return "مقنع";
  if (verdict === "shaky") return "مهزوز";
  return "غير مقنع";
}

function buildManagerNarrative(params: {
  percent: number;
  verdict: Verdict;
  accepted: boolean;
  correctHypothesis: boolean;
  finalHypothesisId: string;
  eliminationFeedback: EliminationFeedback[];
  finalSupport: StepEvaluation;
}): string {
  const { verdict, accepted, correctHypothesis, finalHypothesisId, eliminationFeedback, finalSupport } = params;

  const seed = JSON.stringify(params);
  const opener = pickBySeed(seed + ":opener", [
    "تمام… قرأت تقريرك كويس.",
    "راجعت تقريرك بالكامل.",
    "اطلّعت على اللي كتبتّه في التقرير.",
  ]);

  const finalTitle = case001.hypotheses.find((h) => h.id === finalHypothesisId)?.title ?? "الفرضية الأساسية";

  const toneLine = (() => {
    if (verdict === "convincing")
      return pickBySeed(seed + ":tone:good", [
        "بشكل عام… طريقة تفكيرك مرتبة ومطمّنة.",
        "التقرير مترابط ومفهوم، وده مطمّن.",
        "فيه وضوح في المنهج اللي ماشي بيه.",
      ]);
    if (verdict === "shaky")
      return pickBySeed(seed + ":tone:mid", [
        "فيه شغل كويس… بس لسه في فجوات.",
        "التقرير ماشي في اتجاه مفهوم، لكن مش مطمّن بالكامل.",
        "أنا متردد شوية… محتاج تثبيت نقط قبل قرار كبير.",
      ]);
    return pickBySeed(seed + ":tone:bad", [
      "بصراحة… التقرير بالشكل ده مش مطمّن.",
      "فيه مشاكل في طريقة بناء الحُجج… ومش هينفع نمشي كده.",
      "أنا مش قادر أعتمد عليه دلوقتي.",
    ]);
  })();

  // Identify one strength and one weakness (without revealing the correct answer)
  const strongestElim = eliminationFeedback.find((x) => x.evaluation.grade === "strong");
  const trapElim = eliminationFeedback.find(
    (x) => x.evaluation.grade === "trap" || x.evaluation.message.includes("مضل")
  );
  const weakElim = eliminationFeedback.find((x) => x.evaluation.grade === "weak");
  const mediumElim = eliminationFeedback.find((x) => x.evaluation.grade === "medium");

  const strengthLine = (() => {
    if (strongestElim) {
      const title = case001.hypotheses.find((h) => h.id === strongestElim.hypothesisId)?.title ?? "واحدة من الفرضيات";
      return pickBySeed(seed + ":strength:elim", [
        `أكتر حاجة مطمّنة عندي: طريقة استبعادك لـ${title} كانت قوية وواضحة.`,
        `نقطة قوة واضحة: انت قفلت ${title} بشكل كويس.`,
      ]);
    }
    if (finalSupport.grade === "strong") {
      return pickBySeed(seed + ":strength:support", [
        "دعمك للفكرة الأساسية كان واضح ومتماسك.",
        "الجزء الأقوى عندك كان دعم النتيجة النهائية.",
      ]);
    }
    return pickBySeed(seed + ":strength:default", [
      "فيه محاولات كويسة عندك لترتيب الصورة العامة.",
      "واضح إنك بتحاول تمسك الخيط وتبني قرار.",
    ]);
  })();

  const weaknessLine = (() => {
    if (trapElim) {
      return pickBySeed(seed + ":weakness:trap", [
        "بس فيه نقطة خلتني أقلق: في جزء اعتمدت على معلومة ممكن تكون مضللة.",
        "اللي مش مطمّن: في مكان حصل انجذاب لمعلومة شكلها قوي… لكنها مش مضمونة.",
      ]);
    }
    if (finalSupport.grade === "trap" || finalSupport.message.includes("مضل")) {
      return pickBySeed(seed + ":weakness:supporttrap", [
        "كمان دعمك للفكرة الأساسية فيه معلومة ممكن تودّي لاتجاه غلط.",
        "الجزء اللي محتاج إعادة نظر: دعم النتيجة النهائية مش في مكانه.",
      ]);
    }
    if (weakElim || mediumElim || finalSupport.grade === "weak" || finalSupport.grade === "medium") {
      return pickBySeed(seed + ":weakness:weak", [
        "فيه جزء محتاج سند أقوى… بعض الاستبعادات/الدعم لسه عامة.",
        "المشكلة الأساسية: في نقاط اتقفلت بدرجة أقل من المطلوب.",
      ]);
    }
    return pickBySeed(seed + ":weakness:default", [
      "محتاج تشد الحُجج شوية قبل ما نعتمد على التقرير.",
      "فيه تفاصيل لو اتظبطت، التقرير هيبقى أقوى بكتير.",
    ]);
  })();

  const finalLine = (() => {
    const verdictAr = verdictArabic(verdict);
    if (!correctHypothesis) {
      return pickBySeed(seed + ":final:incorrect", [
        `بالنسبة للفكرة الأساسية (${finalTitle})… أنا مش شايفها راكبة على الصورة كاملة بالشكل الحالي.`,
        `الفرضية الأساسية اللي وصلت لها (${finalTitle}) محتاجة مراجعة… الصورة مش متماسكة معها.`,
      ]);
    }
    if (verdict === "convincing") {
      return pickBySeed(seed + ":final:good", [
        `بالنسبة للفكرة الأساسية (${finalTitle})… الطرح راكب على اللي جمعته من معلومات.`,
        `الخلاصة: ${finalTitle} متسقة مع الصورة اللي في التقرير.`,
      ]);
    }
    return pickBySeed(seed + ":final:mid", [
      `الفكرة الأساسية (${finalTitle}) ممكن… لكن محتاجة سند أقوى قبل ما نتحرك.`,
      `أنا فاهم اتجاهك في (${finalTitle})، بس محتاج تثبيت أكتر.`,
    ]) + ` (التقييم العام: ${verdictAr})`;
  })();

  const nextStep = (() => {
    if (accepted) {
      return pickBySeed(seed + ":next:accepted", [
        "تمام… هنمشي على التوصية دي، ونبدأ إجراءات واضحة ونراقب النتائج بسرعة.",
        "ممتاز. خلّينا نبدأ التنفيذ على ده، ومعاه متابعة أسبوعية عشان نتأكد إن الاتجاه صح.",
      ]);
    }
    if (verdict === "shaky") {
      return pickBySeed(seed + ":next:shaky", [
        "قبل ما ناخد قرار… عايزك ترجع تثبّت النقاط اللي لسه مهزوزة وتقدم نسخة أقوى.",
        "محتاج مراجعة سريعة: قوّي الحُجج في النقط اللي مش مقفولة… وبعدين ارجعلي.",
      ]);
    }
    return pickBySeed(seed + ":next:bad", [
      "مش هقدر أعتمد على التقرير بالشكل ده. ارجع راجع طريقة الاستبعاد والدعم وحاول تاني.",
      "لازم نعيد بناء التقرير بشكل أهدى وأوضح… حاول تاني بعد ما تقوي السند.",
    ]);
  })();

  return [opener, toneLine, strengthLine, weaknessLine, finalLine, nextStep].join("\n");
}

export function evaluateReport(params: {
  finalHypothesisId: string;
  eliminatedHypothesisIds: string[];
  eliminationReasonsByHypothesis: Record<string, ReasonRef[]>;
  finalSupportReasonRefs: ReasonRef[];
  correctHypothesisId: string;
}): ReportEvaluation {
  const {
    finalHypothesisId,
    eliminatedHypothesisIds,
    eliminationReasonsByHypothesis,
    finalSupportReasonRefs,
    correctHypothesisId,
  } = params;

  const eliminationFeedback: EliminationFeedback[] = eliminatedHypothesisIds.map((hid) => {
    const refs = eliminationReasonsByHypothesis[hid] ?? [];
    return { hypothesisId: hid, evaluation: evaluateElimination(hid, refs) };
  });

  const finalSupport = evaluateSupport(finalHypothesisId, finalSupportReasonRefs);

  const pointsSum =
    eliminationFeedback.reduce((acc, x) => acc + x.evaluation.points, 0) + finalSupport.points;

  const correctHypothesis = finalHypothesisId === correctHypothesisId;
  const correctBonus = correctHypothesis ? 2 : 0;
  const percent = percentFromPoints(pointsSum, correctBonus);
  const verdict = verdictFromPercent(percent);

  const accepted = Boolean(correctHypothesis && verdict === "convincing");

  const managerNarrative = buildManagerNarrative({
    percent,
    verdict,
    accepted,
    correctHypothesis,
    finalHypothesisId,
    eliminationFeedback,
    finalSupport,
  });

  return {
    percent,
    verdict,
    accepted,
    correctHypothesis,
    managerNarrative,
    eliminationFeedback,
    finalSupport,
  };
}
