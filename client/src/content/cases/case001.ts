import { Case } from "@shared/schema";

export const case001: Case = {
  id: "case001",
  title: "لغز شركة الأمل العقارية",
  briefing: {
    sender: "الرئيس التنفيذي",
    text: "أهلاً بك أيها المحقق. نحن في وضع حرج. انخفضت مبيعاتنا بنسبة 40% في آخر 10 أيام بشكل مفاجئ، رغم أننا ضاعفنا ميزانية التسويق! نحتاج منك أن تكشف السبب الحقيقي وراء هذا الانهيار قبل فوات الأوان. كل الأقسام تلوم بعضها البعض.",
  },
  resources: {
    initialTime: 100,
    initialTrust: 100,
  },
  evidence: [
    {
      id: "ev1",
      title: "بريد إلكتروني من التسويق",
      description: "تم إطلاق حملة 'تيك توك' الجديدة في الأول من أكتوبر.",
      type: "email",
      cost: 5,
      isKey: true,
    },
    {
      id: "ev2",
      title: "سجل الخادم التقني",
      description: "صيانة روتينية للخادم يوم 3 أكتوبر. توقف لمدة 15 دقيقة.",
      type: "report",
      cost: 10,
      isKey: false,
    },
    {
      id: "ev3",
      title: "تقرير المبيعات الأسبوعي",
      description: "عدد العملاء المحتملين (Leads) ارتفع بنسبة 300%، لكن نسبة التحويل (Conversion) انخفضت بنسبة 90%.",
      type: "report",
      cost: 15,
      isKey: true,
    },
    {
      id: "ev4",
      title: "شكوى عميل",
      description: "العميل يشتكي من تأخر الرد على الهاتف.",
      type: "document",
      cost: 5,
      isKey: false,
    },
    {
      id: "ev5",
      title: "نص الإعلان الترويجي",
      description: "فيلات فاخرة - خصم 50% لفترة محدودة! (أسلوب نقر مخادع)",
      type: "document",
      cost: 10,
      isKey: true,
    },
    {
      id: "ev6",
      title: "عينة من قائمة العملاء",
      description: "الأسماء والوظائف: طالب، طالب جامعي، عاطل عن العمل، حديث التخرج.",
      type: "document",
      cost: 15,
      isKey: true,
    },
    {
      id: "ev7",
      title: "أخبار المنافسين",
      description: "السوق العقاري يشهد ركوداً طفيفاً بنسبة 5%.",
      type: "report",
      cost: 5,
      isKey: false,
    },
    {
      id: "ev8",
      title: "مذكرة من الرئيس التنفيذي",
      description: "يجب تحقيق أهداف الربع الرابع بأي ثمن.",
      type: "document",
      cost: 0,
      isKey: false,
    },
  ],
  dataSets: [
    {
      name: "سجل المبيعات اليومي",
      description: "يظهر عدد العملاء المحتملين والمبيعات الفعلية خلال أسبوعين.",
      rows: [
        { id: 1, date: "2023-09-25", leads: 50, sales: 5 },
        { id: 2, date: "2023-09-26", leads: 45, sales: 4 },
        { id: 3, date: "2023-09-27", leads: 55, sales: 6 },
        { id: 4, date: "2023-09-28", leads: 48, sales: 5 },
        { id: 5, date: "2023-09-29", leads: 52, sales: 5 },
        { id: 6, date: "2023-09-30", leads: 50, sales: 5 },
        { id: 7, date: "2023-10-01", leads: 150, sales: 2 },
        { id: 8, date: "2023-10-02", leads: 300, sales: 1 },
        { id: 9, date: "2023-10-03", leads: 450, sales: 0 },
        { id: 10, date: "2023-10-04", leads: 400, sales: 1 },
        { id: 11, date: "2023-10-05", leads: 380, sales: 0 },
      ],
    },
    {
      name: "إنفاق قنوات التسويق",
      description: "توزيع الميزانية على المنصات المختلفة.",
      rows: [
        { id: 1, channel: "Google Ads", cost: 5000, clicks: 200 },
        { id: 2, channel: "Facebook", cost: 3000, clicks: 150 },
        { id: 3, channel: "TikTok", cost: 15000, clicks: 5000 },
        { id: 4, channel: "LinkedIn", cost: 2000, clicks: 50 },
      ],
    },
  ],
  stakeholders: [
    {
      id: "s1",
      name: "سارة (مديرة التسويق)",
      role: "مدير التسويق",
      avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&h=150&fit=crop", // Business woman
      questions: [
        {
          id: "q1_1",
          text: "كيف تصفين أداء الحملة الأخيرة؟",
          response: "إنها حملة رائعة! لقد حققنا انتشاراً فيروسياً (Viral). الجميع يتحدث عنا!",
          cost: 10,
        },
        {
          id: "q1_2",
          text: "من هو الجمهور المستهدف في هذه الحملة؟",
          response: "استهدفنا الجميع! أردنا أقصى قدر من الانتشار والوعي بالعلامة التجارية.",
          cost: 15,
        },
        {
          id: "q1_3",
          text: "لماذا اخترتم تيك توك تحديداً؟",
          response: "لأنه المنصة الأسرع نمواً، والتكلفة لكل نقرة رخيصة جداً.",
          cost: 10,
        },
      ],
    },
    {
      id: "s2",
      name: "أحمد (مدير المبيعات)",
      role: "مدير المبيعات",
      avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&h=150&fit=crop", // Business man
      questions: [
        {
          id: "q2_1",
          text: "لماذا انخفضت المبيعات؟",
          response: "لا أعرف! الفريق يعمل بجد، لكن الهواتف لا تتوقف عن الرنين لأشخاص غير جادين.",
          cost: 10,
        },
        {
          id: "q2_2",
          text: "ما هي جودة العملاء القادمين من الحملة؟",
          response: "سيئة جداً. معظمهم يسألون إن كنا نوزع فيلات مجانية! إنهم أطفال.",
          cost: 15,
        },
        {
          id: "q2_3",
          text: "هل هناك مشكلة في فريق المبيعات؟",
          response: "إطلاقاً. فريقي هو الأفضل، لكننا نضيع وقتنا مع عملاء لا يملكون المال.",
          cost: 10,
        },
      ],
    },
  ],
  solution: {
    options: [
      { id: "opt1", text: "فريق المبيعات غير مدرب للتعامل مع الضغط.", isCorrect: false },
      { id: "opt2", text: "خلل تقني في الموقع يمنع إتمام الصفقات.", isCorrect: false },
      { id: "opt3", text: "استهداف خاطئ في التسويق (الكمية مقابل الجودة).", isCorrect: true },
      { id: "opt4", text: "الركود الاقتصادي العام في السوق.", isCorrect: false },
    ],
    requiredEvidenceIds: ["ev3", "ev5", "ev6"],
    feedbackCorrect: "أحسنت! التحليل دقيق. التسويق ركز على جلب عدد ضخم من الزيارات الرخيصة من فئة عمرية لا تملك القدرة الشرائية (طلاب)، مما أغرق فريق المبيعات وأضاع وقتهم.",
    feedbackIncorrect: "تحليل غير دقيق. راجع الأدلة مرة أخرى. هل المشكلة في الموظفين أم في نوعية العملاء؟",
  },
};
