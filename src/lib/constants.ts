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

  // ── 正念与觉察（Ellen Langer / Kabat-Zinn / 一行禅师）──
  { text: '确定性是一种残酷的心态，它让我们对可能性视而不见。', book: '逆时针', author: 'Ellen Langer' },
  { text: '我们寻找什么，就会看到什么。你对情境的预设，决定了你多半会看到什么。', book: '逆时针', author: 'Ellen Langer' },
  { text: '生活中只有当下，没有别的。如果你让当下有意义，一切就都有意义。', book: '正念', author: 'Ellen Langer' },
  { text: '应该向不可能敞开自己，拥抱可能性的心理学。', book: '逆时针', author: 'Ellen Langer' },
  { text: '知道现状是什么，和知道可能是什么，不是同一回事。', book: '专念', author: 'Ellen Langer' },
  { text: '一旦你看到还有另一种视角，你就再也无法忽视其他观点的存在。', book: '逆时针', author: 'Ellen Langer' },
  { text: '压力不是事件本身的功能，而是我们对事件看法的功能。', book: '逆时针', author: 'Ellen Langer' },
  { text: '人们最专念的时候，就是在玩耍的时候。模糊工作与玩耍的界限，收获会更大。', book: '逆时针', author: 'Ellen Langer' },
  { text: '觉察只要求我们关注事物并看清其本来面目，并不要求我们改变任何东西。', book: '多舛的生命', author: 'Jon Kabat-Zinn' },
  { text: '不要试图把思绪推开，给它们空间，观察它们，然后放手。', book: '多舛的生命', author: 'Jon Kabat-Zinn' },
  { text: '你无法阻止海浪，但你可以学会冲浪。', book: '多舛的生命', author: 'Jon Kabat-Zinn' },
  { text: '对每一刻完全敞开心扉，充分接受它——耐心就是如此。', book: '多舛的生命', author: 'Jon Kabat-Zinn' },
  { text: '如果正念对你来说很重要，那么任何时刻都是练习它的机会。', book: '多舛的生命', author: 'Jon Kabat-Zinn' },
  { text: '我们不可能成为另一个人，我们唯一的希望是更完整地做自己。', book: '多舛的生命', author: 'Jon Kabat-Zinn' },
  { text: '我们必须小心，不要把一生都花在期待下一件事上。', book: '正念的奇迹', author: '一行禅师' },
  { text: '洗碗时，就只是洗碗。这就是正念的奇迹。', book: '正念的奇迹', author: '一行禅师' },
  { text: '感受来得来，去得去，如同空中的云。让它们来去自如。对它们微笑。', book: '正念的奇迹', author: '一行禅师' },
  { text: '你现在就能快乐。你不需要等到所有问题都解决之后才快乐。', book: '正念的奇迹', author: '一行禅师' },
  { text: '呼吸是连接身心的桥梁。', book: '正念的奇迹', author: '一行禅师' },

  // ── 斯多葛哲学 ──
  { text: '你拥有的力量掌控你的思想——而不是外在事件。意识到这一点，你就找到了力量。', book: '沉思录', author: '马可·奥勒留' },
  { text: '每天早晨对自己说：今天我会遇到多管闲事的人、忘恩负义的人、傲慢的人。但我不能因此烦恼。', book: '沉思录', author: '马可·奥勒留' },
  { text: '浪费时间就是浪费生命。', book: '沉思录', author: '马可·奥勒留' },
  { text: '你对事物的看法，取决于你自己。你可以选择移除那些让你痛苦的判断。', book: '沉思录', author: '马可·奥勒留' },
  { text: '不要解释你的哲学，而是去体现它。', book: '手册', author: '爱比克泰德' },
  { text: '有些事情在我们的控制之中，有些则不在。', book: '手册', author: '爱比克泰德' },
  { text: '不要祈求事情按你的意愿发生，而要祈求你能够坦然面对发生的事情。', book: '手册', author: '爱比克泰德' },
  { text: '人不是被事物本身所困扰，而是被他们对事物的看法所困扰。', book: '手册', author: '爱比克泰德' },
  { text: '困难是展现品格的良机。', book: '手册', author: '爱比克泰德' },
  { text: '我们常常在想象中受苦多于在现实中受苦。', book: '道德书简', author: '塞涅卡' },
  { text: '不再抱有希望，你就不再恐惧。希望和恐惧形影不离。', book: '道德书简', author: '塞涅卡' },
  { text: '贫穷的不是拥有太少的人，而是渴望更多的人。', book: '道德书简', author: '塞涅卡' },
  { text: '顺从自然生活，你永远不会贫穷；顺从他人看法生活，你永远不会富有。', book: '道德书简', author: '塞涅卡' },
  { text: '傻子的一生没有感恩，充满恐惧；他的一生全都指向未来。', book: '道德书简', author: '塞涅卡' },
  { text: '没有人能拥有平静的生活，如果他太在意延长它。', book: '道德书简', author: '塞涅卡' },

  // ── 心理学与认知 ──
  { text: '我们对自己认为熟知的事物确信不疑，但我们显然无法了解自己的无知程度。', book: '思考，快与慢', author: 'Daniel Kahneman' },
  { text: '人们容易因为不断重复而相信谎言，因为人们很难区分耳熟的话和真话。', book: '思考，快与慢', author: 'Daniel Kahneman' },
  { text: '亲眼所见的生动例子比统计数据更容易让人回想起来，但这不代表它更准确。', book: '思考，快与慢', author: 'Daniel Kahneman' },
  { text: '人们劳累或精力耗尽时，更容易受空洞却有说服力的信息影响。', book: '思考，快与慢', author: 'Daniel Kahneman' },
  { text: '我们对显而易见的东西看不见，且我们看不见自己的看不见。', book: '思考，快与慢', author: 'Daniel Kahneman' },
  { text: '了解更多的人做出的预测未必比了解少的人强多少。', book: '思考，快与慢', author: 'Daniel Kahneman' },
  { text: '在刺激与反应之间，有一个空间。在那个空间里，我们有选择反应的力量。', book: '活出生命的意义', author: 'Viktor Frankl' },
  { text: '活着就是受苦，生存就是在苦难中寻找意义。', book: '活出生命的意义', author: 'Viktor Frankl' },
  { text: '当我们无法改变处境时，我们就被挑战去改变自己。', book: '活出生命的意义', author: 'Viktor Frankl' },
  { text: '成功就像幸福一样，无法追求；它必须随之而来。', book: '活出生命的意义', author: 'Viktor Frankl' },
  { text: '那些知道"为什么"活着的人，几乎能承受任何"怎么活"的问题。', book: '活出生命的意义', author: 'Viktor Frankl' },
  { text: '意义不是被发现的，而是被创造的。', book: '活出生命的意义', author: 'Viktor Frankl' },
  { text: '我们最大的自由之一，就是选择对任何给定情况的态度。', book: '活出生命的意义', author: 'Viktor Frankl' },

  // ── 习惯与行为改变 ──
  { text: '你不会达到你目标的高度，你只会跌落到你系统的水平。', book: '原子习惯', author: 'James Clear' },
  { text: '习惯是自我提升的复利。', book: '原子习惯', author: 'James Clear' },
  { text: '你应该更关心你当前的轨迹，而不是你当前的结果。', book: '原子习惯', author: 'James Clear' },
  { text: '内在动机的终极形式，是当一个习惯成为你身份认同的一部分。', book: '原子习惯', author: 'James Clear' },
  { text: '你采取的每一个行动，都是对你想成为什么样的人投下的一票。', book: '原子习惯', author: 'James Clear' },
  { text: '成功最大的威胁不是失败，而是无聊。', book: '原子习惯', author: 'James Clear' },
  { text: '当你爱上过程而不是结果时，你就不需要等到允许自己快乐。', book: '原子习惯', author: 'James Clear' },
  { text: '你的结果是你习惯的滞后指标。', book: '原子习惯', author: 'James Clear' },
  { text: '目标适合确定方向，但系统最适合取得进步。', book: '原子习惯', author: 'James Clear' },
  { text: '错过一次是意外，错过两次是新习惯的开始。', book: '原子习惯', author: 'James Clear' },
  { text: '不要再等时机成熟。如果你想开始，就从你现在所在的地方开始。', book: '原子习惯', author: 'James Clear' },
  { text: '每当你想改变行为时，问自己：怎样才能让它变得显而易见、有吸引力、简单、令人满足？', book: '原子习惯', author: 'James Clear' },
  { text: '传统观念认为动机是改变习惯的关键，但事实是，我们真正的动机是偷懒和做方便的事。', book: '原子习惯', author: 'James Clear' },
  { text: '世界上最难的事情，就是让事情变得简单。', book: '微习惯', author: 'BJ Fogg' },
  { text: '庆祝是创造习惯的秘诀。当你为微小的成功庆祝时，你就在为大脑创造正向情绪。', book: '微习惯', author: 'BJ Fogg' },

  // ── 育儿与关系 ──
  { text: '纪律的真正含义是教导，而不是惩罚。门徒是学生，而不是行为后果的接受者。', book: '全脑教养法', author: 'Daniel Siegel' },
  { text: '当我们开始以开放和自我支持的方式认识自己时，我们就迈出了鼓励孩子认识自己的第一步。', book: '由内而外的教养', author: 'Daniel Siegel' },
  { text: '对于充分的情感沟通，一个人需要允许自己的心智状态受到对方的影响。', book: '心智的成长', author: 'Daniel Siegel' },
  { text: '悲伤只有在你开始接受你现在拥有的替代之物时，才能让你放下失去的东西。', book: '第七感', author: 'Daniel Siegel' },
  { text: '虽然育儿的日子可能显得很漫长，但岁月却如此短暂。', book: '全脑教养法', author: 'Daniel Siegel' },
  { text: '我们每个人都需要让心智向内专注的时期。独处是心智组织自身过程的必要体验。', book: '第七感', author: 'Daniel Siegel' },
  { text: '帮助孩子面对他们感受的四个技巧：倾听、简单回应、说出感受、用幻想实现愿望。', book: '如何说孩子才会听', author: 'Adele Faber' },
  { text: '所有的感受都是被接纳的，但某些行为必须受到限制。', book: '如何说孩子才会听', author: 'Adele Faber' },
  { text: '孩子需要他们的感受被理解和接纳，而不是被否定或纠正。', book: '如何说孩子才会听', author: 'Adele Faber' },
  { text: '父母如何看待孩子，会影响到孩子们的行为。做一个真实的自己更重要。', book: '如何说孩子才会听', author: 'Adele Faber' },
  { text: '不要以否定感受的方式来回应孩子，那会让他们觉得自己的感受是错的。', book: '如何说孩子才会听', author: 'Adele Faber' },
  { text: '与其给孩子建议，不如帮助他们自己找到答案。', book: '如何说孩子才会听', author: 'Adele Faber' },
  { text: '代替惩罚的方法是：表达感受、说明期望、给选择、体验后果。', book: '如何说孩子才会听', author: 'Adele Faber' },
  { text: '永远都不要低估你的话语对孩子的影响。', book: '如何说孩子才会听', author: 'Adele Faber' },

  // ── 人生智慧与自我成长 ──
  { text: '事情分崩离析是一种考验，也是一种疗愈。真相是，事情从来不会被真正解决。它们聚拢，又散开。', book: '当事情崩溃时', author: 'Pema Chödrön' },
  { text: '对自己最根本的伤害，就是没有勇气和尊重去诚实地审视自己。', book: '当事情崩溃时', author: 'Pema Chödrön' },
  { text: '你是天空，其他一切只是天气。', book: '当事情崩溃时', author: 'Pema Chödrön' },
  { text: '成长的本质是愿意让自己感到不舒服。', book: '当事情崩溃时', author: 'Pema Chödrön' },
  { text: '生命中最痛苦的时刻，往往也是最有力的觉醒时刻。', book: '当事情崩溃时', author: 'Pema Chödrön' },
  { text: '想要获得平静，不在于逃离困难，而在于改变与困难的关系。', book: '当事情崩溃时', author: 'Pema Chödrön' },
  { text: '痛苦是不可避免的，但受苦是可选择的。你不必喜欢它，但可以学会与它共处。', book: '当事情崩溃时', author: 'Pema Chödrön' },
  { text: '成功不在于过得没有问题，而在于你的问题是否变得更好。', book: '不在乎的微妙艺术', author: 'Mark Manson' },
  { text: '承认自己的平凡，是迈向非凡的第一步。', book: '不在乎的微妙艺术', author: 'Mark Manson' },
  { text: '你能承受多少痛苦，决定了你能取得多大的成功。', book: '不在乎的微妙艺术', author: 'Mark Manson' },
  { text: '大脑的负面偏见让我们天生更容易记住坏经历。你需要有意识地安装好经历。', book: '重塑大脑的幸福', author: 'Rick Hanson' },
  { text: '如果大脑将一个事件评估为有意义的，它在未来就更有可能被回忆起来。', book: '重塑大脑的幸福', author: 'Rick Hanson' },

  // ── 东方哲学 ──
  { text: '上善若水，水善利万物而不争。', book: '道德经', author: '老子' },
  { text: '合抱之木，生于毫末；九层之台，起于累土；千里之行，始于足下。', book: '道德经', author: '老子' },
  { text: '知人者智，自知者明。胜人者有力，自胜者强。', book: '道德经', author: '老子' },
  { text: '天下之至柔，驰骋天下之至坚。', book: '道德经', author: '老子' },
  { text: '祸兮福之所倚，福兮祸之所伏。', book: '道德经', author: '老子' },
  { text: '大器免成，大音希声，大象无形。', book: '道德经', author: '老子' },
  { text: '知足不辱，知止不殆，可以长久。', book: '道德经', author: '老子' },
  { text: '为无为，事无事，味无味。', book: '道德经', author: '老子' },
  { text: '至人无己，神人无功，圣人无名。', book: '逍遥游', author: '庄子' },
  { text: '吾生也有涯，而知也无涯。以有涯随无涯，殆已。', book: '养生主', author: '庄子' },
  { text: '天地与我并生，而万物与我为一。', book: '齐物论', author: '庄子' },
  { text: '举世而誉之而不加劝，举世而非之而不加沮。', book: '逍遥游', author: '庄子' },
  { text: '鹪鹩巢于深林，不过一枝；偃鼠饮河，不过满腹。', book: '逍遥游', author: '庄子' },
  { text: '子非鱼，安知鱼之乐？', book: '秋水', author: '庄子' },
  { text: '相濡以沫，不如相忘于江湖。', book: '大宗师', author: '庄子' },
  { text: '人生天地之间，若白驹过隙，忽然而已。', book: '知北游', author: '庄子' },
  { text: '菩提本无树，明镜亦非台。本来无一物，何处惹尘埃。', book: '六祖坛经', author: '惠能' },
  { text: '不是风动，不是幡动，仁者心动。', book: '六祖坛经', author: '惠能' },
  { text: '饥来吃饭，困来即眠。', book: '禅宗公案', author: '禅宗' },
  { text: '未参禅时，见山是山；参禅后，见山不是山；悟道后，见山还是山。', book: '禅宗公案', author: '青原惟信' },

  // ── 微信读书导入笔记（241条完整版）──

  // ACT就这么简单：接纳承诺疗法简明实操手册（路斯·哈里斯）
  { text: '接着，把你的注意力重新集中在需要它的地方，这样你就可以做你真正需要做的事情。', book: 'ACT就这么简单：接纳承诺疗法简明实操手册', author: '路斯·哈里斯' },
  { text: '治疗师：在这一整天中，只要你意识到自己开始"漂离"，就是说你已经陷入了你的想法和感受中，不能真正专注或投入你正在做的事情，那就抛锚。做一个我们在这里练习过的10秒钟版本的练习：确认任何正在吸引你注意力的想法和感受，然后回到你的身体并掌控身体，观察你周围的世界——你在哪里，你在做什么', book: 'ACT就这么简单：接纳承诺疗法简明实操手册', author: '路斯·哈里斯' },
  { text: '例如，内隐的避开行为可能包括思维反刍、担忧、注意力分散、不投入、强迫思维，而内隐的趋向行为可能包括认知解离、接纳、重新集中注意力、投入、制定策略和做', book: 'ACT就这么简单：接纳承诺疗法简明实操手册', author: '路斯·哈里斯' },
  { text: '因此，在ACT中，我们并不关注想法是真是假，而是它是否有效。', book: 'ACT就这么简单：接纳承诺疗法简明实操手册', author: '路斯·哈里斯' },
  { text: '"钩住"指的是认知融合和经验性回避这两个核心过程，ACT认为这两个过程是造成我们大部分心理痛苦的罪魁祸首。认知融合基本上意味着我们被我们的认知"支配"。经验性回避是一种持续的挣扎，以回避或摆脱我们不想要的想法和感受。', book: 'ACT就这么简单：接纳承诺疗法简明实操手册', author: '路斯·哈里斯' },
  { text: '我花在这些事情上的时间远远不够，如……', book: 'ACT就这么简单：接纳承诺疗法简明实操手册', author: '路斯·哈里斯' },
  { text: '想象你活在距今十年后的未来，你正在回顾今天的生活。完成这三个句子：', book: 'ACT就这么简单：接纳承诺疗法简明实操手册', author: '路斯·哈里斯' },
  { text: '认知解离的目的是减少认知对行为的问题性支配，并促进精神上的活在当下，投入到体验中。', book: 'ACT就这么简单：接纳承诺疗法简明实操手册', author: '路斯·哈里斯' },

  // 控糖革命（[法]杰西·安佐斯佩）
  { text: '用黄油或者橄榄油炒鸡蛋，再加几片牛油果，或者在希腊酸奶中加5颗杏仁、一些奇亚籽或者亚麻籽，都可以增加脂肪摄入量。不要喝脱脂酸奶。普通酸奶或者希腊酸奶都是不错的选择', book: '控糖革命', author: '[法]杰西·安佐斯佩' },
  { text: '在你的餐前开胃菜中加点儿醋。', book: '控糖革命', author: '[法]杰西·安佐斯佩' },
  { text: '将水果与一些其他食物一起吃，可以使血糖曲线更平稳', book: '控糖革命', author: '[法]杰西·安佐斯佩' },
  { text: '要寻找那些在包装上标明其含有高纤维和低糖的产品。', book: '控糖革命', author: '[法]杰西·安佐斯佩' },
  { text: '更饿。吃碳水化合物会让我们的饥饿感像过山车一样忽上忽下，吃脂肪和蛋白质则不会。', book: '控糖革命', author: '[法]杰西·安佐斯佩' },
  { text: '事实上，只要专注于使血糖曲线平稳，即使完全不考虑热量，也可以减肥。', book: '控糖革命', author: '[法]杰西·安佐斯佩' },
  { text: '在一大杯水中加入一汤匙醋混合而成的醋汁，在吃甜食前的几分钟先喝它，就会使随后出现的葡萄糖和果糖曲线变得平稳', book: '控糖革命', author: '[法]杰西·安佐斯佩' },
  { text: '合格的绿色开胃菜是什么样的？', book: '控糖革命', author: '[法]杰西·安佐斯佩' },
  { text: '单次运动多长时间最佳？', book: '控糖革命', author: '[法]杰西·安佐斯佩' },
  { text: '吃完开胃菜之后多久可以吃主菜？', book: '控糖革命', author: '[法]杰西·安佐斯佩' },
  { text: '花椰菜、抱子甘蓝、茄子、莴苣、豌豆苗、番茄，还有豆类以及黏性食物，如纳豆都可以，越多越好。', book: '控糖革命', author: '[法]杰西·安佐斯佩' },
  { text: '莫妮卡通常在餐后20分钟时开始运动，你可以选择餐后70分钟内的任一时间段运动。', book: '控糖革命', author: '[法]杰西·安佐斯佩' },
  { text: '最方便的开胃菜是什么？', book: '控糖革命', author: '[法]杰西·安佐斯佩' },
  { text: '看一下糖在该食品的成分表中是否排在前5，每5g的总碳水化合物中是否至少含有1g膳食纤维', book: '控糖革命', author: '[法]杰西·安佐斯佩' },
  { text: '一旦水果被榨成果汁、做成水果干、糖渍果脯、水果罐头或者果酱，我们就应该把水果当作甜点。', book: '控糖革命', author: '[法]杰西·安佐斯佩' },
  { text: '任何蔬菜都可以，不管是菠菜、蘑菇、番茄、西葫芦、菜蓟、德国泡菜，还是扁豆或者生菜。', book: '控糖革命', author: '[法]杰西·安佐斯佩' },
  { text: '只吃碳水化合物后胃促生长素会迅速波动，我们会感到比吃之前更饿', book: '控糖革命', author: '[法]杰西·安佐斯佩' },
  { text: '买任何东西时都不要误以为"低脂"对你更好：含脂肪5%的希腊酸奶要比低脂的酸奶更有助于维持血糖曲线的平稳。', book: '控糖革命', author: '[法]杰西·安佐斯佩' },
  { text: '比较纤维1号和家乐氏两种麦片的成分。纤维1号麦片中膳食纤维在总碳水化合物中的比率更高', book: '控糖革命', author: '[法]杰西·安佐斯佩' },
  { text: '如果水果被改变了形态或被加工，其中的纤维就会被破坏，水果就变成了和其他糖类一样的糖', book: '控糖革命', author: '[法]杰西·安佐斯佩' },
  { text: '如果糖排在前5位，那就说明这种产品中有很大一部分都是糖。', book: '控糖革命', author: '[法]杰西·安佐斯佩' },
  { text: '选择那些成分占比最接近1g膳食纤维对应5g总碳水化合物的产品。', book: '控糖革命', author: '[法]杰西·安佐斯佩' },

  // Thinking Our Way to Chronic Health（Ellen J. Langer）
  { text: 'This doesn\'t mean we should buy a house at random. I would argue for a very different approach. Rather than recommending endless analysis, my experience and research suggest taking a limited amount of information...', book: 'Thinking Our Way to Chronic Health', author: 'Ellen J. Langer' },
  { text: 'It is not that some things are predictable, and others are unpredictable. It\'s that virtually everything is unpredictable, including our human reactions to events.', book: 'Thinking Our Way to Chronic Health', author: 'Ellen J. Langer' },
  { text: 'Whether something is good or bad is in our heads, not in events.', book: 'Thinking Our Way to Chronic Health', author: 'Ellen J. Langer' },
  { text: 'Everything can be seen in either way depending on how we talk to ourselves.', book: 'Thinking Our Way to Chronic Health', author: 'Ellen J. Langer' },
  { text: 'When you are told to try, you implicitly acknowledge that failure is a real possibility. When you "just do it," you focus on process rather than outcome.', book: 'Thinking Our Way to Chronic Health', author: 'Ellen J. Langer' },
  { text: 'Behavior makes sense from the actor\'s perspective or else she or he wouldn\'t have done it.', book: 'Thinking Our Way to Chronic Health', author: 'Ellen J. Langer' },
  { text: 'everybody\'s behavior makes sense to them, or they wouldn\'t do it.', book: 'Thinking Our Way to Chronic Health', author: 'Ellen J. Langer' },
  { text: 'Do or do not. There is no try.', book: 'Thinking Our Way to Chronic Health', author: 'Ellen J. Langer' },
  { text: 'The future will be different from the past. What to do with all this uncertainty? Notice what is happening now.', book: 'Thinking Our Way to Chronic Health', author: 'Ellen J. Langer' },
  { text: 'regrets never make sense because they presuppose the alternative would have been better.', book: 'Thinking Our Way to Chronic Health', author: 'Ellen J. Langer' },
  { text: 'When you understand someone\'s behavior from their perspective, there is no need to blame, and there is nothing to forgive.', book: 'Thinking Our Way to Chronic Health', author: 'Ellen J. Langer' },

  // 看见孩子（[美] 贝姬·肯尼迪）
  { text: '在我看来，自信就是知道自己的感受，并且接受那个拥有当下感受的自己。', book: '看见孩子', author: '[美] 贝姬·肯尼迪' },
  { text: '快乐远没有心理韧性重要', book: '看见孩子', author: '[美] 贝姬·肯尼迪' },
  { text: '在我们家，我们喜欢接受挑战', book: '看见孩子', author: '[美] 贝姬·肯尼迪' },
  { text: '在我们家，努力比结果重要。', book: '看见孩子', author: '[美] 贝姬·肯尼迪' },
  { text: '我知道当个小孩很不容易，总是被父母要求做这做那！我们来玩个游戏吧。在接下来的5分钟里，你当大人，我当小孩。', book: '看见孩子', author: '[美] 贝姬·肯尼迪' },
  { text: '要想满足自己的需要，我或许就必须给他人造成不便或打扰，而这么做是没问题的。他人的痛苦不应成为我不去满足自己需求的原因。', book: '看见孩子', author: '[美] 贝姬·肯尼迪' },
  { text: '儿童最需要父母做的事情有：共情，倾听，接纳孩子本来的样子，通过稳定的陪伴给予孩子安全感，找出孩子的优势，允许孩子犯错。', book: '看见孩子', author: '[美] 贝姬·肯尼迪' },
  { text: '我们必须认清，我们是无法让他人避免不便或痛苦的。我们没有责任确保他人快乐，我们需要的是他人的合作，而非准许。', book: '看见孩子', author: '[美] 贝姬·肯尼迪' },
  { text: '把一只手放在心脏的位置，告诉自己："疲于应付没关系，犯错没关系，有些事情不知道也没关系，我无须事事完美。"', book: '看见孩子', author: '[美] 贝姬·肯尼迪' },
  { text: '快乐不是我养育孩子的终极目标。以快乐为目标会驱使我们代替孩子做事情，而不是锻炼他们自己解决问题的能力。', book: '看见孩子', author: '[美] 贝姬·肯尼迪' },
  { text: '实际上，我常常认为，对害羞和犹豫感到在意的与其说是孩子，倒不如说是父母。所以，我们介入其中往往只是想要缓解我们自己的不适。', book: '看见孩子', author: '[美] 贝姬·肯尼迪' },
  { text: '告知孩子实情往往需要我们对事情做出最简单、最直接的描述。"只讲事实，别的都不说。"', book: '看见孩子', author: '[美] 贝姬·肯尼迪' },
  { text: '"我不确定到底是怎么回事。我确定的是，我爱你，你是个好孩子，哪怕在你情绪不好的时候。"', book: '看见孩子', author: '[美] 贝姬·肯尼迪' },
  { text: '养育孩子的意思其实是在自己发展和成长的同时帮助孩子发展和成长。', book: '看见孩子', author: '[美] 贝姬·肯尼迪' },
  { text: '不高兴很正常，而且是学习的机会。我不怕不高兴，因为我从小就学会了忍受不高兴。', book: '看见孩子', author: '[美] 贝姬·肯尼迪' },
  { text: '虽然每个人都认为自己是就事论事，但实际上，他们努力捍卫的是自己和自己的想法的存在和价值。', book: '看见孩子', author: '[美] 贝姬·肯尼迪' },
  { text: '父母的职责是通过行为规则、接纳和共情来构建安全的成长环境。', book: '看见孩子', author: '[美] 贝姬·肯尼迪' },
  { text: '行为规则不是告诉孩子不要做什么，而是告诉孩子我们会怎么做。', book: '看见孩子', author: '[美] 贝姬·肯尼迪' },
  { text: '在坚持自己的主张时，别人可以不高兴。不高兴不代表他们是坏人，但也不能阻止我坚持自我。', book: '看见孩子', author: '[美] 贝姬·肯尼迪' },

  // Unwinding Anxiety（Judson Brewer）
  { text: 'of reward over and over before the new habit of not doing the old behavior takes hold. In other words, you need to groove that new neural pathway...', book: 'Unwinding Anxiety', author: 'Judson Brewer' },
  { text: 'If you are the avoid type, pay attention to related behaviors such as being overly judgmental (of yourself).', book: 'Unwinding Anxiety', author: 'Judson Brewer' },
  { text: 'Thoughts are just mental words and images that come and go and should be viewed with healthy skepticism.', book: 'Unwinding Anxiety', author: 'Judson Brewer' },
  { text: 'Second Gear Defined: The Gift of Disenchantment — paying attention to the results of your actions.', book: 'Unwinding Anxiety', author: 'Judson Brewer' },
  { text: 'I was not my thoughts; I was not my emotions; I was not my bodily sensations. I didn\'t have to be identified with any of these.', book: 'Unwinding Anxiety', author: 'Judson Brewer' },
  { text: 'Two steps forward, one step back becomes obsolete when we stop getting in our own way.', book: 'Unwinding Anxiety', author: 'Judson Brewer' },
  { text: 'Mindfulness is the awareness that arises through paying attention in the present moment, on purpose, nonjudgmentally.', book: 'Unwinding Anxiety', author: 'Judson Brewer' },
  { text: 'Mindfulness is not about stopping, emptying, or ridding ourselves of anything. Thoughts, emotions, and physical sensations make us human.', book: 'Unwinding Anxiety', author: 'Judson Brewer' },
  { text: 'Awareness. That\'s where the disenchantment presents are, waiting under the tree to be opened.', book: 'Unwinding Anxiety', author: 'Judson Brewer' },
  { text: 'Changing habits is hard work but doesn\'t have to be painful.', book: 'Unwinding Anxiety', author: 'Judson Brewer' },
  { text: 'Watch your thoughts. They become words. Watch your words. They become actions. Watch your actions. They become habits. Watch your habits. They become character. Watch your character. It becomes your destiny.', book: 'Unwinding Anxiety', author: 'Judson Brewer' },
  { text: 'correlation does not equal causation.', book: 'Unwinding Anxiety', author: 'Judson Brewer' },
  { text: 'It\'s very hard to get angry with your eyes wide open.', book: 'Unwinding Anxiety', author: 'Judson Brewer' },
  { text: 'Reward-based learning is based on rewards, not the triggers. That\'s where the money is.', book: 'Unwinding Anxiety', author: 'Judson Brewer' },
  { text: 'Worrying does not take away tomorrow\'s troubles. It takes away today\'s peace.', book: 'Unwinding Anxiety', author: 'Judson Brewer' },
  { text: 'what we do in the present sets our course in life.', book: 'Unwinding Anxiety', author: 'Judson Brewer' },
  { text: 'The only sustainable way to change a habit is to update its reward value.', book: 'Unwinding Anxiety', author: 'Judson Brewer' },
  { text: 'triggers are the least important part of the habit loop.', book: 'Unwinding Anxiety', author: 'Judson Brewer' },
  { text: 'Keep building your own faith, one moment at a time.', book: 'Unwinding Anxiety', author: 'Judson Brewer' },
  { text: 'want to give their children a gift, teach their children to love challenges, be intrigued by mistakes, enjoy effort.', book: 'Unwinding Anxiety', author: 'Judson Brewer' },

  // 力量从哪里来（李一诺）
  { text: '有孩子以后，你才真正觉得有了自己的家庭', book: '力量从哪里来', author: '李一诺' },
  { text: '从"为人"的层面看时间，时间就不是用来多做事了，而是关于选择，关于意义，关于自我认知。', book: '力量从哪里来', author: '李一诺' },
  { text: '目标开始，而不是从限制开始', book: '力量从哪里来', author: '李一诺' },
  { text: '想象一下，当你要离开这个世界的时候，你希望自己的家人如何跟你道别？', book: '力量从哪里来', author: '李一诺' },
  { text: '人生无非是一趟主观的旅程。', book: '力量从哪里来', author: '李一诺' },
  { text: '每个父母都希望孩子成功，表面是为孩子好，但究其根本，往往是为自己。焦虑的根源在于我们对自己的价值判断和不认可。', book: '力量从哪里来', author: '李一诺' },
  { text: '一个人真正意义上的成功，需要知道自己是谁，想去哪里，有学习能力，可以找到资源。', book: '力量从哪里来', author: '李一诺' },
  { text: '该做什么就做什么，别拿别人的错误惩罚自己', book: '力量从哪里来', author: '李一诺' },
  { text: '如何看待自己，如何看待他人，如何看待机会和欲望。', book: '力量从哪里来', author: '李一诺' },
  { text: '你可以不做具体工作，但要知道"民间疾苦"。', book: '力量从哪里来', author: '李一诺' },
  { text: '我们生气的原因，是我们心里有一个剧本，眼前的孩子却没有按照这个剧本演。要反思的不是孩子的"问题"，而是我们自己心中的剧本。', book: '力量从哪里来', author: '李一诺' },
  { text: '一个重要的成长就是意识到别人说的话都是他们内心的投射而已，和你并没有关系。', book: '力量从哪里来', author: '李一诺' },
  { text: '最终对我们情绪负责的只有我们自己。某个人说了一句话，激起了内心某个没有被治愈的地方，于是产生了情绪。', book: '力量从哪里来', author: '李一诺' },
  { text: '孩子既是我们的延续，更是我们的镜子，照见我们自己真实而完整的生命状态。', book: '力量从哪里来', author: '李一诺' },
  { text: '别人如何评价你，反映的是Ta的水平，而不是你的水平。', book: '力量从哪里来', author: '李一诺' },
  { text: '多考虑微观因素，少考虑宏观结果。', book: '力量从哪里来', author: '李一诺' },
  { text: '养育最大的困难，在父母的内心', book: '力量从哪里来', author: '李一诺' },

  // 福格行为模型（B.J.福格）
  { text: 'Principle 5: Harmony', book: '福格行为模型', author: 'B.J.福格' },
  { text: 'Principle 2: Manifestation', book: '福格行为模型', author: 'B.J.福格' },
  { text: 'Principle 4: Patience', book: '福格行为模型', author: 'B.J.福格' },
  { text: 'Principle 3: Magnetic Desire', book: '福格行为模型', author: 'B.J.福格' },
  { text: 'There is a practice called \'rapid prototyping\' which suggests generating as many ideas as possible.', book: '福格行为模型', author: 'B.J.福格' },
  { text: 'Principle 1: Abundance', book: '福格行为模型', author: 'B.J.福格' },
  { text: 'Principle 6: Universal Connection', book: '福格行为模型', author: 'B.J.福格' },
  { text: 'Think about how you can ameliorate the Xs. We are often most judgemental about others for things we fear in ourselves.', book: '福格行为模型', author: 'B.J.福格' },

  // 笑得出来的养育（李一诺）
  { text: '如果孩子想要一个玩具，你就说："那你来说服一下妈妈吧，说说为什么要给你买。"', book: '笑得出来的养育', author: '李一诺' },
  { text: '孩子不是问题，孩子需要你的帮助去解决问题。', book: '笑得出来的养育', author: '李一诺' },
  { text: '孩子只有感受到我们对他的接纳和支持，才有可能"入耳"。', book: '笑得出来的养育', author: '李一诺' },
  { text: '人的选择只有一个原则，那就是你的选择不要伤害到别人，其余的不是你该管的事。', book: '笑得出来的养育', author: '李一诺' },
  { text: '真正意义上的养育，需要我们面对人生最深的恐惧——对未来，对前途，对不确定。', book: '笑得出来的养育', author: '李一诺' },
  { text: '生活并没有什么"终极"出路。', book: '笑得出来的养育', author: '李一诺' },
  { text: '什么是长大了？能照顾自己就是长大了。如果你6岁能做到，6岁就长大了；如果你30岁都做不到，那么30岁也还没长大。', book: '笑得出来的养育', author: '李一诺' },
  { text: '学习，最底层的能力是专注。', book: '笑得出来的养育', author: '李一诺' },
  { text: '做父母才是终极的终身学习，因为每时每刻都有新的挑战出现。', book: '笑得出来的养育', author: '李一诺' },
  { text: '偶尔能想起，就很了不起！', book: '笑得出来的养育', author: '李一诺' },
  { text: '其实这样的人是存在的，而且很多。只不过像沙子里的金子，因为周围都是沙子，经常会感到孤独。', book: '笑得出来的养育', author: '李一诺' },
  { text: '我们沟通中的暴力是无处不在的。给他人贴标签，评判诟病，其实都是暴力沟通。', book: '笑得出来的养育', author: '李一诺' },
  { text: '我没房没车，没这没那，钱不够，怎么不匮乏？', book: '笑得出来的养育', author: '李一诺' },
  { text: '成年人的成长，说白了就是在修炼这内心的"空间"和"流动性"。有了它们，就有了生发智慧的可能性。', book: '笑得出来的养育', author: '李一诺' },
  { text: '自己的改变和对他人"不改变"的接纳，才是真正支持他人改变的条件。', book: '笑得出来的养育', author: '李一诺' },
  { text: '父母对孩子最大的影响，一是给孩子提供自由成长的环境，二是用激情和热情过好自己的生活。', book: '笑得出来的养育', author: '李一诺' },

  // 金钱的艺术（[美]摩根·豪泽尔）
  { text: '如果不控制你最大的开销，几乎不可能积累财富；如果不关心小额开销，也很难增加财富。', book: '金钱的艺术', author: '[美]摩根·豪泽尔' },
  { text: '一种健康的金钱观，是尊重他人的经历，珍视自己的处境，所有行为都有其合理性。', book: '金钱的艺术', author: '[美]摩根·豪泽尔' },
  { text: '使用金钱的方式有两种。一是将其视为改善生活的工具，二是将其作为衡量地位的标尺。许多人向往前者，却用一生追求后者。', book: '金钱的艺术', author: '[美]摩根·豪泽尔' },
  { text: '当你缺乏对比的参照时，再惊艳的事物也会显得平淡无奇。', book: '金钱的艺术', author: '[美]摩根·豪泽尔' },
  { text: '善于理财的一个关键，是对未来遗憾有精准的感知。你需要准确预判自己在未来不同时刻对今天决策的感受。', book: '金钱的艺术', author: '[美]摩根·豪泽尔' },
  { text: '世界不以个人的主观喜好运作。对你来说合理的消费，在我看来可能毫无意义。', book: '金钱的艺术', author: '[美]摩根·豪泽尔' },
  { text: '思想不断挣扎，认为别人拥有我们想要的东西，一旦拥有又发现另一个人拥有新东西，永远失望。', book: '金钱的艺术', author: '[美]摩根·豪泽尔' },
  { text: '金钱的最佳效用在于，它应该是助力实现自我的杠杆，而非定义身份价值的标尺。', book: '金钱的艺术', author: '[美]摩根·豪泽尔' },
  { text: '嫉妒是一种极其强大的情感。要欣赏自己所拥有的并不容易。', book: '金钱的艺术', author: '[美]摩根·豪泽尔' },
  { text: '当你嫉妒别人时，请记住：你对他们生活的想象，几乎总是片面的、不完整的。', book: '金钱的艺术', author: '[美]摩根·豪泽尔' },
  { text: '一旦意识到地位与嫉妒的游戏永无止境，想要获胜的唯一方式就是不再参与。', book: '金钱的艺术', author: '[美]摩根·豪泽尔' },
  { text: '人不是理性的，他们只善于合理化自己的行为。', book: '金钱的艺术', author: '[美]摩根·豪泽尔' },
  { text: '嫉妒与自省成反比。你越不了解自己，就越通过他人确认自己的价值。', book: '金钱的艺术', author: '[美]摩根·豪泽尔' },
  { text: '你以为自己想要的是豪车豪宅，但你真正渴望的其实是尊重、钦佩和关注。', book: '金钱的艺术', author: '[美]摩根·豪泽尔' },
  { text: '开车比你慢的都是傻子，开车比你快的都是疯子——我们总是觉得别人的选择跟自己不同就是错的。', book: '金钱的艺术', author: '[美]摩根·豪泽尔' },
  { text: '你梦想未来的快乐时，真正渴望的可能是那种满足于现状的心境，而非奢华本身。', book: '金钱的艺术', author: '[美]摩根·豪泽尔' },
  { text: '如果你想了解未来低收入群体会把钱花在哪里，看看今天高收入群体的消费。', book: '金钱的艺术', author: '[美]摩根·豪泽尔' },
  { text: '勿擅自评判别人怎么花钱', book: '金钱的艺术', author: '[美]摩根·豪泽尔' },

  // Awaken Your Genius（Ozan Varol）
  { text: 'Twitter makes me neurotic. Facebook makes me feel like I\'m reliving the worst parts of middle school. Instagram makes me feel "less than."', book: 'Awaken Your Genius', author: 'Ozan Varol' },
  { text: 'Research shows that dopamine rises from the anticipation of the reward, not the reward itself.', book: 'Awaken Your Genius', author: 'Ozan Varol' },
  { text: 'What fact would change my opinion on this subject?', book: 'Awaken Your Genius', author: 'Ozan Varol' },
  { text: 'If someone has made up their mind, facts often won\'t be enough to change it.', book: 'Awaken Your Genius', author: 'Ozan Varol' },
  { text: 'Stop overthinking and start experimenting, learning, and improving.', book: 'Awaken Your Genius', author: 'Ozan Varol' },
  { text: 'Don\'t blend ideas into your identity.', book: 'Awaken Your Genius', author: 'Ozan Varol' },
  { text: 'Above all, don\'t get distracted by the obvious bullet holes. The vulnerabilities often hide under a deceptively untarnished surface.', book: 'Awaken Your Genius', author: 'Ozan Varol' },
  { text: 'When a child asks "How did the dinosaurs die?", resist launching into a lesson. Instead ask "What do you think could have killed them?"', book: 'Awaken Your Genius', author: 'Ozan Varol' },
  { text: 'The way you raise your children is art.', book: 'Awaken Your Genius', author: 'Ozan Varol' },
  { text: 'How we spend our days is how we spend our lives. — Annie Dillard', book: 'Awaken Your Genius', author: 'Ozan Varol' },
  { text: 'Diversify yourself.', book: 'Awaken Your Genius', author: 'Ozan Varol' },
  { text: 'Facts drive beliefs? No. Beliefs drive the facts we choose to accept.', book: 'Awaken Your Genius', author: 'Ozan Varol' },
  { text: '这个故事的寓意很简单：我们的认知会塑造现实。我们看到的是我们所认为的样子。', book: 'Awaken Your Genius', author: 'Ozan Varol' },
  { text: 'rereading books you\'ve read is not waste of time. Every time I return to a book, it\'s a new person reading it.', book: 'Awaken Your Genius', author: 'Ozan Varol' },
  { text: 'You are the jailor. And you are the jailee.', book: 'Awaken Your Genius', author: 'Ozan Varol' },
  { text: 'Forget following passion. Follow your curiosity. What do you find interesting?', book: 'Awaken Your Genius', author: 'Ozan Varol' },
  { text: 'Instead of asking what\'s urgent, ask what\'s the most important thing I could be doing?', book: 'Awaken Your Genius', author: 'Ozan Varol' },
  { text: '既然你不愿意完全交换自己的生活和别人的生活，那就没必要羡慕他们了。', book: 'Awaken Your Genius', author: 'Ozan Varol' },
  { text: 'We\'re conditioned to look for external patches to internal holes.', book: 'Awaken Your Genius', author: 'Ozan Varol' },
  { text: 'We focus on consuming more information faster, while losing sight of nourishment already inside us.', book: 'Awaken Your Genius', author: 'Ozan Varol' },

  // 金钱心理学
  { text: '在理财方面，很少有什么事比明确投资目标且不受他人影响更重要。', book: '金钱心理学', author: '【美】摩根·豪泽尔' },
  { text: '如果想提高回报，最简单有效的方法就是拉长时间。', book: '金钱心理学', author: '【美】摩根·豪泽尔' },
  { text: '历史从来不会重复，人类却总会重蹈覆辙。', book: '金钱心理学', author: '【美】摩根·豪泽尔' },
  { text: '无论收入多高，如果无法限制当下花钱享乐的欲望，就无法积累财富。', book: '金钱心理学', author: '【美】摩根·豪泽尔' },

  // Make Your Kid a Money Genius（Beth Kobliner）
  { text: '我们必须要在消费时基于自己的价值观进行判断。', book: 'Make Your Kid a Money Genius', author: 'Beth Kobliner' },
  { text: '人们每天与金钱打交道的方式、消费习惯等会影响金钱观，而金钱观才是最重要的。', book: 'Make Your Kid a Money Genius', author: 'Beth Kobliner' },
  { text: 'when we launch into lecture mode, our kids tune out.', book: 'Make Your Kid a Money Genius', author: 'Beth Kobliner' },

  // Intimate Tales（Ali Wong）
  { text: 'it\'s so important to get out of your hometown and get away from your family.', book: 'Intimate Tales', author: 'Ali Wong' },

  // 成长树家庭教育法（诸葛越）
  { text: '我无条件地爱孩子，也爱做父母的这个过程。', book: '成长树家庭教育法', author: '诸葛越' },

  // 愿你可以自在张扬（刘开心）
  { text: '没有"公平"也没有"不公"，很多时候抱怨与颓丧仅仅是因为不满于现状。', book: '愿你可以自在张扬', author: '刘开心' },
  { text: '可是啊，你看这世界宏大。可是啊，终究是梦一场。', book: '愿你可以自在张扬', author: '刘开心' },
  { text: 'You don\'t necessarily have to fully accept yourself to survive. As long as you still like yourself in some way, you\'ll be just fine.', book: '愿你可以自在张扬', author: '刘开心' },
  { text: '使人更加强大的向来都是爱与呵护，而不是伤害与挫折。', book: '愿你可以自在张扬', author: '刘开心' },

  // 王小波：沉默的大多数
  { text: '当年我假装很受用，说身体在受罪思想却变好了，全是昧心话。身体在受罪，思想也更坏了。', book: '王小波：沉默的大多数', author: '王小波' },
  { text: '一般人认为善良而低智的人是无辜的。但人可以发展智力，后天的低智算不了无辜——没有比装傻更便当的了。', book: '王小波：沉默的大多数', author: '王小波' },
  { text: '愚蠢是一种极大的痛苦；降低人类的智能，乃是一种最大的罪孽。', book: '王小波：沉默的大多数', author: '王小波' },
  { text: '认为低智、偏执、思想贫乏是最大的邪恶', book: '王小波：沉默的大多数', author: '王小波' },
  { text: '一切的关键就在于必须承认一加一等于二；弄明白了这一点，其他一切全会迎刃而解。', book: '王小波：沉默的大多数', author: '王小波' },
  { text: '以愚蠢教人，那是善良的人所能犯下的最严重的罪孽。', book: '王小波：沉默的大多数', author: '王小波' },
  { text: '在西方人看来，人所受的苦和累可以减少，这是一切的基础。', book: '王小波：沉默的大多数', author: '王小波' },

  // 要有光（梁鸿）
  { text: '中国现在还延续着感性思维，自我感动，报恩教育。', book: '要有光', author: '梁鸿' },
  { text: '首先我对雅雅的关注太多，给孩子过多压力。其次我只关注学习，关注情绪太少，从来没有站在她的角度想问题。', book: '要有光', author: '梁鸿' },

  // 简单的逻辑学
  { text: '演绎论证得出的是必然性结论，而归纳论证只能得出可能性结论。', book: '简单的逻辑学', author: 'D.Q.麦克伦尼' },
  { text: '我们看到的外部世界只是大脑的创造品，观念将与世界脱节。', book: '简单的逻辑学', author: 'D.Q.麦克伦尼' },
  { text: '真实性针对命题内容，有效性针对论证结构。', book: '简单的逻辑学', author: 'D.Q.麦克伦尼' },
  { text: '窃取论题谬误也叫循环论证或恶性循环。', book: '简单的逻辑学', author: 'D.Q.麦克伦尼' },
  { text: '演绎论证是从一般到个别，归纳论证则恰恰相反。', book: '简单的逻辑学', author: 'D.Q.麦克伦尼' },

  // 高效能家庭的7個習慣
  { text: '这就是行为系统的运转方式', book: '高效能家庭习惯', author: '史蒂芬·柯维' },

  // 大脑训练手册
  { text: '写下每天做的三项积极的、有助于培育"根源"并创造理想未来的事情。可以是正念散步或在晚餐后拿起一本小说阅读。', book: '大脑训练手册', author: '塔拉·斯瓦特' },

  // 整体养育（陈忻）
  { text: 'manifesting, at its heart, is a practice of well-being, engagement with the world, and living a good life.', book: '整体养育', author: '陈忻' },

  // 正义的可能（周濂）
  { text: '王小波说，人一切的痛苦，本质上都是对自己无能的愤怒。', book: '正义的可能', author: '周濂' },

  // 坚毅（[美]安杰拉·达克沃思）
  { text: '如何设立多层次的目标，坚守终极目标，每天坚持刻意练习，直到养成有助于成功的好习惯。', book: '坚毅', author: '安杰拉·达克沃思' },
  { text: '用优点来比赛，用弱点来训练。重要的是人们能意识到技能可以通过努力来提高。', book: '坚毅', author: '安杰拉·达克沃思' },

  // The Source（Tara Swart）
  { text: '自尊是一个人对自我价值做出的判断，以及和这些判断有关的感受。', book: 'The Source', author: 'Tara Swart' },

  // The Almanack of Naval Ravikant
  { text: 'If you have nothing in your life, but you have at least one person that loves you unconditionally, it\'ll do wonders for your self-esteem.', book: 'Naval Ravikant', author: 'Eric Jorgenson' },
  { text: 'Getting rich is about knowing what to do, who to do it with, and when to do it.', book: 'Naval Ravikant', author: 'Eric Jorgenson' },

  // The Happiest Man on Earth
  { text: 'If you have good morale, if you can hang onto hope, your body can do miraculous things. Where there is life, there is hope.', book: 'The Happiest Man on Earth', author: 'Eddie Jaku' },

  // 驱动力（丹尼尔·平克）
  { text: '以乐为本的内在动机，也就是参与项目时能感受到的创造力是最强大、最常见的动机。', book: '驱动力', author: '丹尼尔·平克' },
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
