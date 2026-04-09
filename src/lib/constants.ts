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

// ── 反思问题集（8 个每日 + 6 个每周，基于心理学/哲学理论体系） ──

// 每个问题带 framework（中文体系标签）和 source（具体来源）
// framework 格式：「体系·子领域」，帮助用户了解正在用什么方式反思

export const DAILY_QUESTION_SETS = {
  'CBT认知重构': [
    { q: '今天有没有一个瞬间，我的想法让情绪变差了？那个想法是什么？', framework: 'CBT·自动思维', source: 'Beck 认知治疗' },
    { q: '那个想法是事实，还是我的推断？有什么证据支持或反对它？', framework: 'CBT·证据检验', source: 'Beck 认知治疗' },
    { q: '如果朋友遇到同样的事跟我这么说，我会怎么回应ta？', framework: 'CBT·双重标准', source: 'Beck 认知治疗' },
    { q: '今天我有没有用「总是」「从来不」这样的词形容自己？实际情况是什么？', framework: 'CBT·去极端化', source: 'Burns 认知扭曲' },
    { q: '今天我有没有把一件事的结果等同于我整个人生的价值？', framework: 'CBT·去标签化', source: 'Burns 认知扭曲' },
    { q: '今天发生了什么不好的事？最坏的结果是什么？最可能的结果是什么？', framework: 'CBT·去灾难化', source: 'Burns 认知扭曲' },
    { q: '今天我有没有在读别人的心思（猜测ta对我的看法）？我确定吗？', framework: 'CBT·读心术检验', source: 'Burns 认知扭曲' },
    { q: '今天我有没有因为一个细节就否定了整件事？如果用0-10分评价，实际有多严重？', framework: 'CBT·灰度思考', source: 'Burns 认知扭曲' },
    { q: '今天我有没有「应该」句式出现？（我应该在/我必须/我不得不）换成「我选择」会怎样？', framework: 'CBT·应该句式', source: 'Ellis 理性情绪' },
    { q: '如果用旁观者的角度看今天发生的事，我会有什么不同的评价？', framework: 'CBT·认知距离', source: 'Beck 认知治疗' },
  ] as const,

  'ACT接纳承诺': [
    { q: '今天我有没有在跟某个想法「较劲」？如果只是看着它飘过呢？', framework: 'ACT·认知解离', source: 'Hayes 接纳承诺疗法' },
    { q: '今天我试图推开或压抑的情绪是什么？如果我允许它在这里呢？', framework: 'ACT·接纳', source: 'Hayes 接纳承诺疗法' },
    { q: '今天我的行为是在朝我真正在乎的方向走，还是在逃避不舒服？', framework: 'ACT·价值方向', source: 'Hayes 接纳承诺疗法' },
    { q: '如果我正在做对今天来说最重要的事，我此刻应该正在做什么？', framework: 'ACT·承诺行动', source: 'Hayes 接纳承诺疗法' },
    { q: '今天我把自己当成了「观察者」还是「被想法带走的人」？', framework: 'ACT·观察者自我', source: 'Hayes 接纳承诺疗法' },
    { q: '今天我在回避什么感受？那个回避让我付出了什么代价？', framework: 'ACT·经验性回避', source: 'Hayes 接纳承诺疗法' },
    { q: '今天有没有一个想法让我停下了脚步？那个想法是真的有用，还是只是在保护我不冒险？', framework: 'ACT·想法vs事实', source: 'Hayes 接纳承诺疗法' },
    { q: '此刻如果我完全接受现在的心情，不做任何改变，我会做什么？', framework: 'ACT·当下接纳', source: 'Hayes 接纳承诺疗法' },
    { q: '今天我做的事里，哪件是「哪怕不舒服也值得做」的？', framework: 'ACT·意义优先', source: 'Hayes 接纳承诺疗法' },
  ] as const,

  '斯多葛省察': [
    { q: '今天有哪些事在我的控制范围之外，我却在为此焦虑？', framework: '斯多葛·控制二分', source: 'Epictetus' },
    { q: '今天我有没有把「偏好」当成了「必须」？如果我把它降级为「有则更好」呢？', framework: '斯多葛·偏好vs必须', source: 'Epictetus' },
    { q: '今天发生了什么让我不舒服的事？这件事本身是坏的，还是我对它的判断让它变坏了？', framework: '斯多葛·判断先行', source: 'Marcus Aurelius' },
    { q: '今天我有没有为还没发生的事浪费精力？那些事有多少真的发生了？', framework: '斯多葛·当下专注', source: 'Seneca' },
    { q: '今天我做了什么让世界变得稍微好一点的事？', framework: '斯多葛·公民责任', source: 'Marcus Aurelius' },
    { q: '今天我有没有提醒自己：这件事也会过去？', framework: '斯多葛·无常', source: 'Marcus Aurelius' },
    { q: '如果我今晚就要离开，我今天过得是否问心无愧？', framework: '斯多葛·终日检视', source: 'Seneca' },
    { q: '今天我有没有因为别人的行为而影响自己的内心平静？那个行为真的值得我付出平静吗？', framework: '斯多葛·内在堡垒', source: 'Marcus Aurelius' },
    { q: '今天我面临的困难，是不是也在锻炼我某种品格？', framework: '斯多葛·障碍即道路', source: 'Marcus Aurelius' },
    { q: '今天我有没有把时间花在了真正重要的事上？还是被琐事消耗了？', framework: '斯多葛·时间审视', source: 'Seneca' },
  ] as const,

  '正念觉察': [
    { q: '此刻我的身体感觉如何？不需要改变它，只是注意到了什么？', framework: '正念·身体扫描', source: 'Kabat-Zinn MBSR' },
    { q: '今天我有没有一个时刻是完全「在这里」的？那个时刻我在做什么？', framework: '正念·当下锚点', source: 'Kabat-Zinn MBSR' },
    { q: '今天我的呼吸有没有变得急促或浅短的时候？当时发生了什么？', framework: '正念·呼吸觉察', source: 'Thich Nhat Hanh' },
    { q: '今天我有没有在自动模式下做事情（吃饭、走路、说话）？选一件事重新「体验」会怎样？', framework: '正念·自动模式', source: 'Kabat-Zinn MBSR' },
    { q: '今天我的思绪最常飘到哪里？过去还是未来？', framework: '正念·思绪观察', source: 'Segal MBCT' },
    { q: '如果给自己的觉察程度打0-10分，今天是几分？什么让它高或低？', framework: '正念·觉察刻度', source: 'Langer 专念' },
    { q: '今天我有没有注意到自己正在评判某事？评判本身没问题——注意到评判就是觉察。', framework: '正念·不评判', source: 'Kabat-Zinn MBSR' },
    { q: '今天我的五种感官分别接收到了什么？选一个最深刻的写下来。', framework: '正念·感官锚定', source: 'Kabat-Zinn MBSR' },
    { q: '今天我做了什么「微小的正念」？哪怕是认真喝了一口水、深呼吸了一次。', framework: '正念·微实践', source: 'Thich Nhat Hanh' },
  ] as const,

  'PERMA幸福': [
    { q: '今天让我微笑的瞬间是什么？（积极情绪）', framework: 'PERMA·积极情绪', source: 'Seligman 积极心理学' },
    { q: '今天我做什么事的时候感觉时间过得很快？（投入）', framework: 'PERMA·投入', source: 'Seligman 积极心理学' },
    { q: '今天我和谁有了一次有意义的互动？（关系）', framework: 'PERMA·关系', source: 'Seligman 积极心理学' },
    { q: '今天我做的哪件事让我觉得「这很重要」？（意义）', framework: 'PERMA·意义', source: 'Seligman 积极心理学' },
    { q: '今天我完成了一件什么事，不管多小？（成就）', framework: 'PERMA·成就', source: 'Seligman 积极心理学' },
    { q: '今天的积极情绪和消极情绪比例大概是多少？1:1？2:1？更高？', framework: 'PERMA·情绪比率', source: 'Fredrickson 拓展构建' },
    { q: '今天我有没有主动创造一个积极情绪的时刻？还是只是在等它发生？', framework: 'PERMA·主动创造', source: 'Seligman 积极心理学' },
    { q: '今天我有没有感到自己被理解或被支持？那个时刻是什么？', framework: 'PERMA·被支持感', source: 'Seligman 积极心理学' },
    { q: '今天我在做的事里，哪件是「因为想做」而不是「因为应该做」？', framework: 'PERMA·内在动机', source: 'Seligman 积极心理学' },
  ] as const,

  '依纳爵省察': [
    { q: '回顾今天，哪个时刻让我感到最有活力、最充实？（安慰时刻）', framework: '省察·安慰', source: 'Ignatius 依纳爵' },
    { q: '哪个时刻让我感到沉重、退缩或不安？（荒凉时刻）', framework: '省察·荒凉', source: 'Ignatius 依纳爵' },
    { q: '在安慰的时刻，是什么让我感到充实？那个感受指向了我内心什么渴望？', framework: '省察·渴望辨识', source: 'Ignatius 依纳爵' },
    { q: '在荒凉的时刻，我内心发生了什么？我是否被某种恐惧或自我否定带走了？', framework: '省察·荒凉根源', source: 'Ignatius 依纳爵' },
    { q: '今天我是否对某个人或某件事感到感恩？那种感恩的感觉是什么样的？', framework: '省察·感恩', source: 'Ignatius 依纳爵' },
    { q: '今天我有没有注意到自己内心的某种倾向或模式在重复出现？', framework: '省察·模式辨识', source: 'Ignatius 依纳爵' },
    { q: '如果明天我想多靠近「安慰」、少掉进「荒凉」，我可以做的一个小选择是什么？', framework: '省察·选择', source: 'Ignatius 依纳爵' },
    { q: '今天我有没有忽略某个微小的内在声音或直觉？它可能在说什么？', framework: '省察·微小声音', source: 'Ignatius 依纳爵' },
  ] as const,

  '反省Hansei': [
    { q: '今天我做了什么？如实描述，不加评判。', framework: 'Hansei·如实观察', source: '日本反省传统' },
    { q: '今天有什么没有达到我预期的？差距在哪里？', framework: 'Hansei·差距发现', source: '日本反省传统' },
    { q: '那个差距是因为能力不足、方法不对，还是态度问题？', framework: 'Hansei·根因分析', source: '丰田改善法' },
    { q: '如果重新来一次，我会做什么不同的选择？', framework: 'Hansei·改善', source: '日本反省传统' },
    { q: '今天我有没有假装没看到什么问题？为什么？', framework: 'Hansei·盲点', source: '日本反省传统' },
    { q: '今天我从谁身上学到了什么？', framework: 'Hansei·他者之镜', source: '日本反省传统' },
    { q: '今天我有没有因为面子或自尊，错过了一个学习的机会？', framework: 'Hansei·谦虚', source: '日本反省传统' },
    { q: '今天的反省里，有没有一个我可以立刻行动的改善点？', framework: 'Hansei·行动', source: '丰田改善法' },
    { q: '今天我有没有对自己说「这次够了」但其实还可以更好？', framework: 'Hansei·自我诚实', source: '日本反省传统' },
  ] as const,

  '表达性书写': [
    { q: '今天最让我心烦或困扰的事是什么？把它写出来，不用管逻辑。', framework: '表达·情绪释放', source: 'Pennebaker 表达性书写' },
    { q: '这件事让我感觉到了什么？不是「我觉得」，是「我感受到」的身体感觉。', framework: '表达·身体感受', source: 'Pennebaker 表达性书写' },
    { q: '关于这件事，我之前没敢对自己说的真话是什么？', framework: '表达·隐藏真相', source: 'Pennebaker 表达性书写' },
    { q: '如果我继续写15分钟，不停笔，我会写出什么？试着写下去。', framework: '表达·自由书写', source: 'Pennebaker 表达性书写' },
    { q: '这件事和我过去经历过的什么事有相似之处？', framework: '表达·模式链接', source: 'Pennebaker 表达性书写' },
    { q: '关于这件事，我现在的理解和一个月前有什么不同？', framework: '表达·视角变化', source: 'Pennebaker 表达性书写' },
    { q: '写完这些之后，我的感受有没有变化？身体有没有放松一点？', framework: '表达·书写效果', source: 'Pennebaker 表达性书写' },
    { q: '如果这件事有一个意义或教训，它可能是什么？', framework: '表达·意义建构', source: 'Pennebaker 表达性书写' },
  ] as const,
} as const;

export const WEEKLY_QUESTION_SETS = {
  'KPT复盘': [
    { q: '本周哪些事做对了，值得继续保持？（Keep）', framework: 'KPT·Keep', source: '日本复盘法' },
    { q: '本周遇到了什么问题或卡点？（Problem）', framework: 'KPT·Problem', source: '日本复盘法' },
    { q: '下周我想尝试的一个小改变是什么？（Try）', framework: 'KPT·Try', source: '日本复盘法' },
    { q: '本周我浪费最多时间的事是什么？下周怎么减少它？', framework: 'KPT·效率审查', source: '日本复盘法' },
    { q: '本周我说的最多的一句话/最常有的想法是什么？它帮到我了还是限制我了？', framework: 'KPT·语言模式', source: '日本复盘法' },
    { q: '本周如果给自己打分（0-10），几分？扣分在哪里？', framework: 'KPT·量化自评', source: '日本复盘法' },
    { q: '下周我最想完成的一件事是什么？什么条件下算「完成」？', framework: 'KPT·单点聚焦', source: '日本复盘法' },
  ] as const,

  'Ryff幸福六维': [
    { q: '本周我有没有独立做决定的时刻？还是多数时候在迎合他人？（自主）', framework: 'Ryff·自主', source: 'Carol Ryff 心理幸福感' },
    { q: '本周我对生活的方向感如何？有在朝想去的方向走吗？（环境掌控）', framework: 'Ryff·环境掌控', source: 'Carol Ryff 心理幸福感' },
    { q: '本周我在个人成长上有什么新的进展？（个人成长）', framework: 'Ryff·个人成长', source: 'Carol Ryff 心理幸福感' },
    { q: '本周我和谁的关系让我感到满意或不满？为什么？（积极关系）', framework: 'Ryff·积极关系', source: 'Carol Ryff 心理幸福感' },
    { q: '本周我有没有觉得自己在过着有意义的生活？意义来自哪里？（生活目的）', framework: 'Ryff·生活目的', source: 'Carol Ryff 心理幸福感' },
    { q: '本周我有多了解自己？有没有发现一个以前没注意到的特质？（自我接纳）', framework: 'Ryff·自我接纳', source: 'Carol Ryff 心理幸福感' },
    { q: '六维里本周最弱的是哪一维？最想改善的一小步是什么？', framework: 'Ryff·短板觉察', source: 'Carol Ryff 心理幸福感' },
  ] as const,

  '自我书写': [
    { q: '写一封信给十年前的自己，告诉ta你现在最想让ta知道的一件事。', framework: '书写·过去自我', source: 'Peterson 自我书写' },
    { q: '写一封信给十年后的自己，问ta三个你最想知道答案的问题。', framework: '书写·未来自我', source: 'Peterson 自我书写' },
    { q: '如果你最好的朋友面临和你本周一样的困境，你会对ta说什么？', framework: '书写·友善视角', source: 'Peterson 自我书写' },
    { q: '本周你有没有一个「如果当时……就好了」的想法？现在重新看，你能原谅当时的自己吗？', framework: '书写·自我宽恕', source: 'Neff 自我关怀' },
    { q: '本周你最害怕的一件事是什么？如果那件事真的发生了，然后呢？', framework: '书写·恐惧探索', source: 'Peterson 自我书写' },
    { q: '用三个词形容本周的自己。为什么是这三个词？', framework: '书写·自我画像', source: 'Peterson 自我书写' },
    { q: '本周你放弃了什么？那个放弃是有意识的选择，还是惯性逃避？', framework: '书写·放弃审视', source: 'Peterson 自我书写' },
  ] as const,

  '教练式发问': [
    { q: '本周你最想解决但又一直在拖延的问题是什么？', framework: '教练·聚焦', source: 'ICF 教练模型' },
    { q: '如果这个问题已经解决了，你的生活会有什么不同？', framework: '教练·奇迹提问', source: '焦点解决疗法' },
    { q: '你已经在用什么方式应对这个问题？哪些是有效的？', framework: '教练·资源识别', source: 'ICF 教练模型' },
    { q: '如果1-10分评估你解决问题的意愿，几分？什么能让它再加1分？', framework: '教练·意愿刻度', source: '焦点解决疗法' },
    { q: '本周你对自己说了什么「不可能」？那个不可能是真的不可能，还是只是没试过？', framework: '教练·限制性信念', source: 'ICF 教练模型' },
    { q: '如果下周只做一件事来推进这个目标，那是什么？', framework: '教练·最小行动', source: 'ICF 教练模型' },
  ] as const,

  '富兰克林美德': [
    { q: '本周我在节制（饮食、情绪、言语）上表现如何？', framework: '美德·节制', source: 'Benjamin Franklin' },
    { q: '本周我有没有沉默是金的时刻？说了不该说的话吗？', framework: '美德·沉默', source: 'Benjamin Franklin' },
    { q: '本周我做事有没有条理？有没有在混乱中浪费时间？', framework: '美德·秩序', source: 'Benjamin Franklin' },
    { q: '本周我许下的承诺都兑现了吗？', framework: '美德·决心', source: 'Benjamin Franklin' },
    { q: '本周我有没有在消费上做到节俭？钱花在了真正重要的地方吗？', framework: '美德·节俭', source: 'Benjamin Franklin' },
    { q: '本周我有没有勤奋地投入重要的事，而不是忙于琐碎？', framework: '美德·勤勉', source: 'Benjamin Franklin' },
    { q: '本周我有没有对人不真诚？有没有该说真话的时候选择了沉默？', framework: '美德·真诚', source: 'Benjamin Franklin' },
    { q: '本周我有没有行善？哪怕是很小的善意？', framework: '美德·公正', source: 'Benjamin Franklin' },
    { q: '本周我有没有做到适度？在饮食、娱乐、工作中有没有走极端？', framework: '美德·适度', source: 'Benjamin Franklin' },
    { q: '本周我有没有保持整洁？居住环境、数字空间、思维？', framework: '美德·整洁', source: 'Benjamin Franklin' },
    { q: '本周我有没有让自己平静下来，而不是被激怒或焦虑牵着走？', framework: '美德·宁静', source: 'Benjamin Franklin' },
    { q: '本周我有没有坚守贞洁（对自己的身体和亲密关系保持尊重）？', framework: '美德·贞洁', source: 'Benjamin Franklin' },
    { q: '本周我有没有学习或模仿别人的优点？', framework: '美德·谦逊', source: 'Benjamin Franklin' },
  ] as const,

  '关系复盘': [
    { q: '本周我和谁的关系有了正向进展？是什么促成的？', framework: '关系·正向变化', source: 'Gottman 亲密关系' },
    { q: '本周我在哪段关系里感到了不舒服？那种不舒服是什么？', framework: '关系·不适觉察', source: 'Gottman 亲密关系' },
    { q: '本周我有没有主动表达过欣赏或感谢？对方的反应如何？', framework: '关系·欣赏表达', source: 'Gottman 亲密关系' },
    { q: '本周我有没有在某个对话中「赢了争论但输了关系」？', framework: '关系·沟通代价', source: 'Gottman 亲密关系' },
    { q: '本周我对家人/亲密的人说了什么让我后悔的话？如果重来，我会怎么表达？', framework: '关系·语言修复', source: '非暴力沟通' },
    { q: '本周我有没有把自己的需求说出来，而不是期待对方猜到？', framework: '关系·需求表达', source: '非暴力沟通' },
    { q: '本周我在关系中的边界感如何？有没有过度付出或过度退让？', framework: '关系·边界', source: '非暴力沟通' },
  ] as const,
} as const;

export type DailySetKey = keyof typeof DAILY_QUESTION_SETS;
export type WeeklySetKey = keyof typeof WEEKLY_QUESTION_SETS;

export const DAILY_SET_KEYS = Object.keys(DAILY_QUESTION_SETS) as DailySetKey[];
export const WEEKLY_SET_KEYS = Object.keys(WEEKLY_QUESTION_SETS) as WeeklySetKey[];

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
