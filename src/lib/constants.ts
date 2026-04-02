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

export const DISTANCE_DIMS = [
  { label: '身体健康', color: '#5BAD6F', current: 65 },
  { label: '内在稳定', color: '#5B9BD5', current: 55 },
  { label: '家庭关系', color: '#E8963F', current: 78 },
  { label: '财务自由', color: '#C9A96E', current: 30 },
  { label: '个人成长', color: '#9B8FD6', current: 50 },
  { label: '生活品质', color: '#D9534F', current: 60 },
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

export const DAILY_QUESTIONS = [
  { q: '今天我做了什么让自己感到骄傲的事？', framework: 'Gratitude' },
  { q: '如果今天可以重来，我会改变什么？', framework: 'Reflection' },
  { q: '今天我的注意力花在了哪里？值得吗？', framework: 'Deep Work' },
  { q: '今天我有没有给自己留出「什么都不做」的时间？', framework: 'Rest' },
  { q: '今天哪个瞬间让我感觉「活着真好」？', framework: 'Mindfulness' },
  { q: '今天我对孩子/家人说了什么让我满意的话？', framework: 'Family' },
  { q: '今天我的身体在告诉我什么？', framework: 'Body' },
] as const;

export const WEEKLY_QUESTIONS = [
  { q: '本周我最大的成就是什么？', framework: 'KPT-Keep' },
  { q: '本周最大的困扰或卡点是什么？', framework: 'KPT-Problem' },
  { q: '下周我想尝试的一个小改变是什么？', framework: 'KPT-Try' },
  { q: '本周我在哪些方面对自己的表现满意？', framework: 'Self-Review' },
  { q: '本周的时间分配是否符合我的优先级？', framework: 'Alignment' },
  { q: '本周我学到了什么新东西？', framework: 'Growth' },
  { q: '本周有没有什么是我想做但一直没做的？为什么？', framework: 'Avoidance' },
] as const;

export const DEFAULT_GOALS = [
  { title: '冥想习惯养成', desc: '每天冥想10分钟，连续30天', progress: 0, color: '#5BAD6F', dimension: 'energy', year: new Date().getFullYear(),
    autoCalc: { type: 'habit_rate' as const, habit: '冥想', windowDays: 30 } },
  { title: '读完12本书', desc: '每月1本，涵盖心理学/健康/AI', progress: 0, color: '#5B9BD5', dimension: 'growth', year: new Date().getFullYear(),
    autoCalc: { type: 'library_count' as const, itemType: 'book' as const, statusFilter: 'completed', target: 12 } },
  { title: '副业收入5000/月', desc: 'AI相关项目或内容创作', progress: 0, color: '#C9A96E', dimension: 'workMoney', year: new Date().getFullYear(),
    autoCalc: { type: 'money_monthly' as const, category: 'freelance', direction: 'income' as const, target: 5000 } },
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
