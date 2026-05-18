import {
  ArticleResult,
  CalendarItem,
  PerformanceResult,
  PublishPackage,
  TitleResult,
  TopicResult
} from "@/lib/types";

const titleTypes = [
  "悬念型",
  "反常识型",
  "数字型",
  "情绪型",
  "趋势型",
  "财经媒体型",
  "知识升级型",
  "朋友圈转发型"
];

export function topicMock(input: {
  domain?: string;
  audience?: string;
  positioning?: string;
}): TopicResult {
  const domain = input.domain || "AI 与商业";
  const audience = input.audience || "关注趋势的知识型读者";
  const positioning = input.positioning || "专业、可信、有前瞻判断的公众号";

  return {
    recommendations: [
      `${domain}正在从工具竞争进入基础设施竞争，普通人该看懂哪三条主线`,
      `${audience}最容易低估的变量：成本下降后，行业会先重排哪里`,
      `${positioning}可以持续追踪的年度母题：技术红利、监管边界与商业兑现`
    ],
    angles: [
      "把热点拆成产业链上中下游，而不是复述新闻",
      "从资本开支、用户习惯、组织效率三个维度解释趋势",
      "用一个生活类比降低理解门槛，再给出专业判断"
    ],
    controversy: [
      "这到底是生产力革命，还是新一轮概念泡沫",
      "效率提升是否会先带来岗位重组，而不是收入增长",
      "大公司会垄断红利，还是小团队反而更容易突围"
    ],
    hooks: [
      "很多人以为变化发生在应用层，真正的牌桌其实在底层成本。",
      "这不是一个新工具的问题，而是一次行业资产负债表的重写。",
      "今天看不懂这条线，半年后很可能只能看见结果。"
    ],
    informationGain: [
      "给出一张趋势拆解表：技术成本、商业场景、监管变量、用户行为",
      "列出 3 个可观察指标，帮助读者判断趋势是否真的落地",
      "区分短期情绪和长期结构，避免简单追热点"
    ],
    titles: [
      `${domain}的真正拐点，不在新闻里`,
      `未来 6 个月，${audience}要盯紧这个信号`,
      `别再只看热搜了：${domain}已经换了竞争规则`
    ],
    structures: [
      "开头反常识判断 -> 三个底层变量 -> 一个案例 -> 风险提醒 -> 行动建议",
      "热点事件 -> 产业链拆解 -> 谁受益谁承压 -> 未来信号 -> 总结金句",
      "生活类比 -> 专业解释 -> 数据/案例 -> 读者决策清单"
    ]
  };
}

export function articleMock(input: {
  topic?: string;
  positioning?: string;
  audience?: string;
  style?: string;
  intensity?: number;
}): ArticleResult {
  const topic = input.topic || "AI 时代的内容生产重构";
  const audience = input.audience || "公众号运营者";
  const style = input.style || "AI 科技趋势";

  return {
    title: `${topic}：真正的机会不在热闹处`,
    subtitle: `写给${audience}的一份结构化判断`,
    opening:
      "过去一年，很多人把变化理解成工具更新。但更深的变化是生产关系正在被重新分配：谁能更快找到选题、组织证据、形成观点，谁就拥有更低的内容成本和更高的判断密度。",
    sections: [
      {
        heading: "一、变化首先发生在成本结构",
        body:
          `在${style}语境下，内容竞争不再只是文笔竞争，而是选题速度、资料组织和表达颗粒度的综合竞争。真正拉开差距的，是把灵感变成稳定流程的能力。`,
        evidence: "可观察指标：选题周期、初稿时间、复用素材比例、发布后互动转化。"
      },
      {
        heading: "二、爆款不是情绪堆叠，而是信息增量",
        body:
          "读者愿意转发的内容通常同时满足三个条件：说出了他们隐约感到但没说清的判断，提供了一个新的解释框架，并且降低了他们向别人复述的成本。",
        evidence: "类比：好文章像一张压缩地图，让读者用更少路径看清复杂地形。"
      },
      {
        heading: "三、运营系统会替代临时手感",
        body:
          "当账号进入稳定更新阶段，随机灵感会变成瓶颈。选题库、标题实验、发布日历和数据复盘会让内容生产从个人体力活变成可迭代的运营资产。",
        evidence: "案例：同一主题可拆为深度稿、短视频口播、小红书标题和朋友圈转发文案。"
      }
    ],
    quotes: [
      "内容的护城河不是写得更久，而是判断得更准、组织得更快。",
      "真正的爆款不是制造焦虑，而是替读者完成一次认知升级。",
      "运营系统的价值，是把一次灵感沉淀成下一次增长。"
    ],
    conclusion:
      "未来的公众号竞争，会从单篇文章竞争升级为内容资产竞争。能把选题、写作、分发和复盘连成闭环的账号，会更早看见确定性。",
    cta:
      "如果你也在搭建自己的内容系统，欢迎在评论区留下你的账号领域，我会挑几个方向做选题拆解。"
  };
}

export function titlesMock(input: { topic?: string; audience?: string }): TitleResult[] {
  const topic = input.topic || "AI 时代的公众号运营";
  const audience = input.audience || "内容创作者";

  return titleTypes.map((type, index) => ({
    type,
    title:
      [
        `为什么${topic}的关键，不是多写几篇`,
        `你以为${topic}是工具问题，其实是系统问题`,
        `${topic}的 7 个增长信号`,
        `还在靠灵感更新？${audience}该换打法了`,
        `${topic}正在进入自动化运营阶段`,
        `${topic}背后，一场内容效率重估开始了`,
        `看懂${topic}，等于看懂下一代内容生产方式`,
        `这篇讲透${topic}，建议转给还在手写选题的人`
      ][index],
    score: 82 + ((index * 3) % 14),
    risk: index === 1 ? "反常识表达需在正文快速给证据" : "风险较低，注意避免夸大确定性",
    audience,
    reason: "标题有明确冲突点和读者收益，适合引出结构化正文。"
  }));
}

export function packageMock(article?: ArticleResult): PublishPackage {
  const data = article || articleMock({});
  const markdown = [
    `# ${data.title}`,
    `> ${data.subtitle}`,
    "",
    data.opening,
    "",
    ...data.sections.flatMap((section) => [
      `## ${section.heading}`,
      section.body,
      `**案例/数据点：** ${section.evidence}`,
      ""
    ]),
    "## 金句",
    ...data.quotes.map((quote) => `- ${quote}`),
    "",
    "## 总结",
    data.conclusion,
    "",
    data.cta
  ].join("\n");

  return {
    markdown,
    wechatLayout: markdown
      .replace(/^# /gm, "【")
      .replace(/^> /gm, "导语：")
      .replace(/^## /gm, "\n▌"),
    summary: `${data.title}。文章从成本结构、信息增量和运营系统三个维度，解释内容生产的下一阶段。`,
    coverPrompt:
      "Bloomberg 风格金融终端画面，深色背景，金色与绿色数据线，中心为中文短标题，真实杂志封面质感，文字少而清晰。",
    imagePrompts: [
      "公众号配图，深色数据看板，展示选题、写作、分发、复盘四个模块，中文标签简短清晰。",
      "财经科技信息图，内容生产漏斗，从热点到标题到文章到转化，专业克制风格。"
    ],
    posterCopy: `主标题：${data.title}\n副标题：把一次灵感变成可复用的增长系统`,
    momentsCopy: `今天这篇写给还在靠灵感更新的人：${data.title}。真正的差距，开始出现在系统能力上。`,
    xiaohongshuTitles: [
      "公众号运营别再靠灵感了",
      "内容创作者的自动化工作流",
      "一套方法提升选题和写作效率"
    ],
    shortVideoOutline: [
      "3 秒钩子：你不是缺选题，你是缺系统",
      "拆解：选题、标题、正文、分发、复盘五步闭环",
      "案例：同一个主题如何变成多平台内容包",
      "结尾：把内容从手艺变成资产"
    ]
  };
}

export function performanceMock(input: Record<string, number | string>): PerformanceResult {
  const reads = Number(input.reads || 2400);
  const likes = Number(input.likes || 120);
  const shares = Number(input.shares || 48);
  const completion = Number(input.completion || 42);
  const score = Math.min(96, Math.round(55 + likes / 12 + shares / 6 + completion / 3 + reads / 900));

  return {
    score,
    titleAnalysis:
      score >= 80
        ? "标题完成了明确利益点与情绪钩子的组合，适合继续做同类角度 A/B 测试。"
        : "标题有主题但冲突不足，建议加入反常识判断、时间窗口或明确读者收益。",
    topicAnalysis:
      "选题具备延展性，可拆成深度稿、清单稿和短视频口播；下一轮应补充更具体的案例或数据锚点。",
    improvements: [
      "开头 150 字内给出更强判断，降低读者滑走率",
      "正文增加一张结构图或三列表格，提高收藏率",
      "结尾不要只求关注，改成邀请读者提交自己的账号领域"
    ],
    reusablePatterns: [
      "热点事件 + 底层变量 + 读者行动清单",
      "反常识标题 + 三段式解释 + 金句收束",
      "长文首发公众号，拆条分发小红书和短视频"
    ],
    avoid: [
      "标题承诺过大但正文证据不足",
      "只复述新闻，没有给出账号自己的判断",
      "过多抽象概念，缺少读者能转述的句子"
    ]
  };
}

export function weeklyPlanMock(positioning: string): CalendarItem[] {
  const base = positioning || "AI 财经趋势号";
  const statuses = ["待选题", "写作中", "待审核", "待发布", "已发布", "复盘中", "待选题"];
  return Array.from({ length: 7 }).map((_, index) => ({
    id: crypto.randomUUID(),
    date: new Date(Date.now() + index * 86400000).toISOString().slice(0, 10),
    topic: `${base}周计划 ${index + 1}：趋势信号与读者行动`,
    status: statuses[index],
    platform: index % 2 === 0 ? "公众号" : "公众号 / 小红书",
    owner: index % 3 === 0 ? "主编" : "运营"
  }));
}
