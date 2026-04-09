// ===== Shared Constants =====

export const HABIT_KEYS = ['冥想', '运动', '阅读', '早睡', '喝水', '反思'] as const;

export const EXPENSE_CATEGORIES = [
  { key: 'food', label: '餐饮', color: '#E8963F' },
  { key: 'transport', label: '交通', color: '#5B9BD5' },
  { key: 'shopping', label: '购物', color: '#9B8FD6' },
  { key: 'housing', label: '居住', color: '#C9A96E' },
  { key: 'health', label: '健康', color: '#5BAD6F' },
  { key: 'education', label: '学习', color: '#5B9BD5' },
  { key: 'entertainment', label: '娱乐', color: '#D9534F' },
  { key: 'child', label: '孩子', color: '#E8963F' },
  { key: 'gift', label: '人情', color: '#9B8FD6' },
  { key: 'other_exp', label: '其他', color: '#A0A0A0' },
] as const;

export const INCOME_CATEGORIES = [
  { key: 'salary', label: '工资', color: '#5BAD6F' },
  { key: 'bonus', label: '奖金', color: '#C9A96E' },
  { key: 'invest', label: '投资收益', color: '#5B9BD5' },
  { key: 'freelance', label: '副业', color: '#9B8FD6' },
  { key: 'other_inc', label: '其他', color: '#A0A0A0' },
] as const;

export const VISION = [
  { text: '健康的身体', icon: '♥', img: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400&q=60', color: '#5BAD6F' },
  { text: '稳定的内在', icon: '◎', img: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400&q=60', color: '#5B9BD5' },
  { text: '温暖的家庭', icon: '◇', img: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=400&q=60', color: '#E8963F' },
  { text: '自由的金钱', icon: '↗', img: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400&q=60', color: '#C9A96E' },
  { text: '从容地生活', icon: '◉', img: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=400&q=60', color: '#9B8FD6' },
  { text: '想去的地方', icon: '✈', img: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=400&q=60', color: '#D9534F' },
] as const;

export const DIMENSIONS = [
  { key: 'energy', label: 'Energy', icon: '⚡', color: '#5BAD6F' },
  { key: 'inner', label: 'Inner', icon: '○', color: '#5B9BD5' },
  { key: 'family', label: 'Family', icon: '◇', color: '#E8963F' },
  { key: 'workMoney', label: 'Work', icon: '□', color: '#C9A96E' },
  { key: 'growth', label: 'Growth', icon: '↑', color: '#9B8FD6' },
] as const;

// Vision Distance 默认值 - 初始为空，用于 Reset
export const DISTANCE_DIMS_DEFAULT = [
  { label: '身体健康', color: '#5BAD6F', current: 0 },
  { label: '内在稳定', color: '#5B9BD5', current: 0 },
  { label: '家庭关系', color: '#E8963F', current: 0 },
  { label: '财务自由', color: '#C9A96E', current: 0 },
  { label: '个人成长', color: '#9B8FD6', current: 0 },
  { label: '生活品质', color: '#D9534F', current: 0 },
] as const;

export const QUOTES = [
  { text: '真正的自由不是想做什么就做什么，而是能够选择不做什么。', book: '被讨厌的勇气', author: '岸见一郎' },
  { text: '我们无法控制发生在我们身上的事情，但我们可以控制自己如何回应。', book: '活出生命的意义', author: '维克多·弗兰克尔' },
  { text: '不是因为没有希望才坚持，而是因为坚持了才看到希望。', book: '也许你该找个人聊聊', author: '洛莉·戈特利布' },
  { text: '人只有在不去控制的时候，才能体验到真正的平静。', book: '当下的力量', author: '埃克哈特·托利' },
  { text: '你不需要看到整个楼梯，只需要迈出第一步。', book: '马丁·路德·金演讲集', author: '马丁·路德·金' },
  { text: '焦虑的本质是对未来的过度想象。回到当下，问题往往不存在。', book: '正念的奇迹', author: '一行禅师' },
  { text: '改变始于觉察。当你看到自己的模式，改变就已经在发生了。', book: '少有人走的路', author: 'M·斯科特·派克' },
  { text: '身体是心灵的庙宇。照顾好身体，就是在尊重自己。', book: '身体的智慧', author: 'Bessel van der Kolk' },
  { text: '真正的自律不是强迫自己做什么，而是创造一个让你想做的环境。', book: '原子习惯', author: 'James Clear' },
  { text: '完美是进步的敌人。完成比完美重要一千倍。', book: '完成比完美更重要', author: 'Sheryl Sandberg' },
  { text: '你的注意力在哪里，你的生命就在哪里。保护你的注意力。', book: '深度工作', author: '卡尔·纽波特' },
  { text: '允许自己不完美，是完美主义者最难的功课。', book: '自我关怀', author: 'Kristin Neff' },
  { text: '给孩子最好的礼物，是一个情绪稳定的父母。', book: '全脑教养法', author: 'Daniel J. Siegel' },
  { text: '慢慢来，比较快。', book: '正念的奇迹', author: '一行禅师' },
  { text: '记录本身就是一种觉察，觉察本身就是一种疗愈。', book: '书写疗愈', author: 'James Pennebaker' },
  { text: '你不需要成为别人，你只需要成为完整的自己。', book: '被讨厌的勇气', author: '阿德勒' },
  { text: '情绪不是你的敌人，它们是信使。学会听它们说什么。', book: '情绪的语言', author: 'Karla McLaren' },
  { text: '今天是你余生中最年轻的一天。', book: '你当像鸟飞往你的山', author: '塔拉·韦斯特弗' },
] as const;

// ── 8 套每日反思问题集 ──
export const DAILY_QUESTION_SETS = {
  '自我觉察': [
    { q: '今天我做了什么让自己感到骄傲的事？', framework: '自我觉察·成就' },
    { q: '如果今天可以重来，我会改变什么？', framework: '自我觉察·反思' },
    { q: '今天我的注意力花在了哪里？值得吗？', framework: '自我觉察·专注' },
    { q: '今天我有没有给自己留出「什么都不做」的时间？', framework: '自我觉察·休息' },
    { q: '今天哪个瞬间让我感觉「活着真好」？', framework: '自我觉察·正念' },
    { q: '今天我对孩子/家人说了什么让我满意的话？', framework: '自我觉察·家庭' },
    { q: '今天我的身体在告诉我什么？', framework: '自我觉察·身体' },
  ] as const,
  '感恩日记': [
    { q: '今天最让我心存感激的一件事是什么？', framework: '感恩·日常' },
    { q: '今天有谁的出现让我感到温暖？', framework: '感恩·关系' },
    { q: '今天有什么小事顺利进行，让我感到轻松？', framework: '感恩·小确幸' },
    { q: '今天我照顾自己的方式是？', framework: '感恩·自我关怀' },
  ] as const,
  '身体对话': [
    { q: '今天我的身体哪个部位最放松？哪个最紧绷？', framework: '身体·扫描' },
    { q: '今天我的身体发出了什么信号？我回应了吗？', framework: '身体·信号' },
    { q: '今天我吃了什么，身体感觉如何？', framework: '身体·饮食' },
    { q: '今天我的能量水平如何？什么时候最高/最低？', framework: '身体·能量' },
  ] as const,
  '情绪记录': [
    { q: '今天最强烈的情绪是什么？它出现在什么情境？', framework: '情绪·识别' },
    { q: '这个情绪在告诉我什么需求或信念？', framework: '情绪·信息' },
    { q: '今天我如何回应了自己的情绪？接纳还是抗拒？', framework: '情绪·回应' },
    { q: '如果用一种颜色和形状形容今天的心情，是什么？', framework: '情绪·具象' },
  ] as const,
  'CBT认知重构': [
    { q: '今天有没有哪个瞬间我在「灾难化」或「非黑即白」地想问题？', framework: 'CBT·自动思维' },
    { q: '那个想法的证据支持和不支持各是什么？', framework: 'CBT·证据检验' },
    { q: '如果朋友遇到同样的情况，我会怎么对她/他说？', framework: 'CBT·双重标准' },
    { q: '用更平衡的方式重新描述这件事，我会怎么说？', framework: 'CBT·认知重构' },
    { q: '我今天的思维陷阱是什么？过度概括、读心术、还是应该句式？', framework: 'CBT·思维陷阱' },
  ] as const,
  'ACT接纳承诺': [
    { q: '今天我在逃避什么不舒服的感受？用什么方式逃避的？', framework: 'ACT·经验性回避' },
    { q: '如果我不再和这个情绪对抗，它会如何变化？', framework: 'ACT·接纳' },
    { q: '今天我的行为是否符合我真正在乎的价值？', framework: 'ACT·价值方向' },
    { q: '如果带着这个不适感去做一件重要的事，我会做什么？', framework: 'ACT·承诺行动' },
    { q: '我能像观察云朵一样观察自己的想法吗？它只是想法，不是事实。', framework: 'ACT·认知解离' },
  ] as const,
  '斯多葛省察': [
    { q: '今天哪些事情在我的控制范围之外？我是否为它们浪费了精力？', framework: '斯多葛·控制二分' },
    { q: '今天我是否在用「事情应该如此」的标准要求现实？', framework: '斯多葛·应然执念' },
    { q: '如果今天是我生命的最后一天，我对自己度过的方式满意吗？', framework: '斯多葛·终末省察' },
    { q: '今天我有没有预想困难（消极想象），从而更珍惜当下拥有的？', framework: '斯多葛·消极想象' },
  ] as const,
  '表达性书写': [
    { q: '此刻我心里最想说却没说出口的话是什么？', framework: '书写·未言之声' },
    { q: '如果我给今天的自己写一封信，我会说什么？', framework: '书写·自我对话' },
    { q: '有什么感受我一直在压着？写出来会怎样？', framework: '书写·情绪释放' },
    { q: '写完这些之后，我的身体感觉有什么变化？', framework: '书写·身心回响' },
  ] as const,
} as const;

// ── 6 套每周反思问题集 ──
export const WEEKLY_QUESTION_SETS = {
  'KPT复盘': [
    { q: '本周我最大的成就是什么？', framework: 'KPT·Keep' },
    { q: '本周最大的困扰或卡点是什么？', framework: 'KPT·Problem' },
    { q: '下周我想尝试的一个小改变是什么？', framework: 'KPT·Try' },
    { q: '本周我在哪些方面对自己的表现满意？', framework: 'KPT·自评' },
    { q: '本周的时间分配是否符合我的优先级？', framework: 'KPT·对齐' },
    { q: '本周我学到了什么新东西？', framework: 'KPT·成长' },
    { q: '本周有没有什么是我想做但一直没做的？为什么？', framework: 'KPT·回避' },
  ] as const,
  '成长复盘': [
    { q: '本周我最大的成长是什么？', framework: '成长·突破' },
    { q: '本周我在认知上有什么新发现？', framework: '成长·洞察' },
    { q: '本周我对自己有什么新的理解？', framework: '成长·自识' },
  ] as const,
  '关系复盘': [
    { q: '本周我和谁的关系有了进展？', framework: '关系·进展' },
    { q: '本周我如何在沟通上做出了调整？', framework: '关系·沟通' },
    { q: '本周我想对谁表达感谢？为什么？', framework: '关系·感恩' },
  ] as const,
  'Ryff幸福六维': [
    { q: '本周我在自我接纳方面做得如何？有没有对自己更宽容一点？', framework: 'Ryff·自我接纳' },
    { q: '本周我与他人的关系是否让我感到温暖和支持？', framework: 'Ryff·积极关系' },
    { q: '本周我是否感到自己在持续成长，而不是停滞不前？', framework: 'Ryff·个人成长' },
    { q: '本周我的生活是否有方向感和意义感？', framework: 'Ryff·生活目的' },
    { q: '本周我是否觉得自己有能力应对生活的挑战？', framework: 'Ryff·环境掌控' },
    { q: '本周我是否在按自己的价值观生活，而不是随波逐流？', framework: 'Ryff·自主性' },
  ] as const,
  '教练式发问': [
    { q: '如果下周只能专注一件事，那会是什么？', framework: '教练·聚焦' },
    { q: '本周我在哪个时刻最有能量？那个时刻有什么共同点？', framework: '教练·能量' },
    { q: '如果我最好的朋友遇到和我一样的情况，我会建议她/他怎么做？', framework: '教练·换位' },
    { q: '本周有什么事我一直在拖延？拖延背后真正的原因是什么？', framework: '教练·拖延' },
    { q: '我在用「没时间」还是「不是优先级」来解释自己的选择？', framework: '教练·优先级' },
  ] as const,
  '富兰克林美德': [
    { q: '本周我在「节制」方面做得如何？有没有在饮食、情绪或言语上过度？', framework: '美德·节制' },
    { q: '本周我是否做到了「沉默」——只说有益的话，避免闲聊？', framework: '美德·沉默' },
    { q: '本周我在「秩序」方面如何？生活和工作的条理性有没有改善？', framework: '美德·秩序' },
    { q: '本周我是否做到了「决心」——决定了就去做？', framework: '美德·决心' },
    { q: '本周我在「节俭」方面做得如何？消费是否合理？', framework: '美德·节俭' },
    { q: '本周我是否保持了「勤勉」——不浪费时间，专注于重要的事？', framework: '美德·勤勉' },
    { q: '本周我在「真诚」方面如何？有没有言行不一致的地方？', framework: '美德·真诚' },
  ] as const,
} as const;

// ── 自动轮换 key 列表（用于按天/周轮换 set）──
export const DAILY_SET_KEYS = Object.keys(DAILY_QUESTION_SETS) as string[];
export const WEEKLY_SET_KEYS = Object.keys(WEEKLY_QUESTION_SETS) as string[];

export type DailySetKey = keyof typeof DAILY_QUESTION_SETS;
export type WeeklySetKey = keyof typeof WEEKLY_QUESTION_SETS;

// ── 兼容旧代码：DAILY_QUESTIONS 取第一套的全量题 ──
export const DAILY_QUESTIONS = DAILY_QUESTION_SETS['自我觉察'];
export const WEEKLY_QUESTIONS = WEEKLY_QUESTION_SETS['KPT复盘'];

export const DEFAULT_GOALS = [
  { title: '冥想习惯养成', desc: '每天冥想10分钟，连续30天', progress: 0, color: '#5BAD6F', dimension: 'energy', year: new Date().getFullYear(),
    autoCalc: { type: 'habit_rate' as const, habit: '冥想', windowDays: 30 } },
  { title: '读完12本书', desc: '每月1本，涵盖心理学/健康/AI', progress: 0, color: '#5B9BD5', dimension: 'growth', year: new Date().getFullYear(),
    autoCalc: { type: 'library_count' as const, itemType: 'book' as const, statusFilter: 'completed', target: 12 } },
  { title: '体重管理', desc: '达到目标BMI范围并维持', progress: 0, color: '#E8963F', dimension: 'energy', year: new Date().getFullYear() },
] as const;

export const DEFAULT_PROJECTS = [
  { title: 'Life OS 系统', desc: '个人生活管理系统搭建与迭代', status: 'active' as const, color: '#9B8FD6' },
  { title: 'AI视频创作', desc: '用Remotion制作第一条科普视频', status: 'planning' as const, color: '#5B9BD5' },
  { title: '家庭年度旅行', desc: '暑假带娃出行计划', status: 'planning' as const, color: '#E8963F' },
] as const;

export const INSIGHTS = {
  recent: [
    '你最近3天的觉察记录显示，你提到了 4 次「控制感」和 2 次「焦虑」。一个值得注意的模式是：当你完成运动的那天，焦虑出现的频率明显降低。这不是巧合——运动对皮质醇的调节有科学依据。',
    '过去一周你在「三件事」里写了 5 次「阅读」相关的内容，而且在觉察记录中提到了 James Clear 的《原子习惯》。你的行动和输入正在形成正向循环——这是习惯养成的关键信号。',
    '你本周的「开心小事」里出现最多的关键词是「孩子」和「安静的时光」。这可能说明你正在两种截然不同的状态之间寻找平衡——热闹的家庭陪伴 vs 独处的恢复。',
    '从你的习惯打卡来看，冥想和运动的「共现率」达到 67%（两者同一天都完成）。这说明它们在你心中已经绑定成了一组习惯——这是系统性行为改变的好兆头。',
  ],
  monthly: [
    '3月数据分析：你的冥想连续天数从上个月的 12 天提升到了 18 天，运动频率从 55% 提升到 72%。但「早睡」的完成率从 48% 下降到 35%，和深夜使用手机的时间明显正相关。建议：把冥想时间挪到睡前，一举两得。',
    '本月支出结构变化：餐饮占比从 38% 降到 29%，但「学习/教育」从 8% 升到 15%。这是一个健康的转变——你在对自己投资。不过「购物」类有一笔异常大的支出，可以回顾一下是否属于冲动消费。',
    '本月觉察日记的情绪词频分析：「平静」出现了 12 次（上月 6 次），「焦虑」从 18 次降到 11 次。你的内在状态确实在好转，虽然你自己可能还没完全感受到。数据不会说谎。',
  ],
  yearly: [
    '2026 Q1 整体回顾：你在「Being」（自我认知和觉察）维度进步最大，觉察记录从每月 8 条增长到 22 条。但「Doing」（行动落地）维度还有空间——很多觉察停留在「知道」层面，尚未变成「做到」。下个季度的关键词可以是「从知到行」。',
    '年度目标追踪：4 个核心目标的加权完成率是 39%。按目前速度，年末大概率能完成 70-80%。最有希望达成的是「冥想习惯」（72%），最需要加速的是「副业收入」（15%）。建议：把大目标拆解成每周可验证的小里程碑。',
    '你 2026 年最大的认知升级：从「管理自己」到「观察自己」。你在觉察日记中的用词从「我应该」「我必须」逐渐转向「我注意到」「我观察到」。这个转变比任何具体目标都重要——它在改变你和自己的关系。',
  ],
  finance: [
    '本月支出分布：餐饮 28%、居住 22%、教育 18%、购物 14%、交通 8%、其他 10%。与上个月相比，「餐饮」下降了 5 个百分点——这可能和你减少外卖的尝试有关。小额消费（50 元以下）出现了 37 笔，累积起来是一笔不小的数目。',
    '储蓄信号：过去 4 周，你的收入支出比为 1.15，略高于健康线 1.1。但「意外支出」占比从 5% 上升到 12%，主要来自医疗和家用品。建议在 Money 页面设立一个「应急缓冲」分类，每月固定转入 5% 作为弹性资金。',
    '消费节律观察：你每周的支出高峰集中在周三和周六。周三偏「线上消费」（网购、订阅），周六偏「线下消费」（外出、孩子活动）。这种模式很稳定——了解自己的消费节律，比盲目记账更有用。',
    '投资账户提醒：本月你查看投资账户的频率是 22 次（日均接近 1 次）。研究显示，频繁查看投资组合会导致 2.7 倍的焦虑感增加，却不会改善决策质量。一个简单的实验：尝试把查看频率降到每周一次，观察你的情绪变化。',
  ],
} as const;
