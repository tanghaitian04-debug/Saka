(function () {
  "use strict";
  window.ChengshangData = window.ChengshangData || {};

  var CHAPTER = "shanghai_ch01";
  var ROOT = "./assets/images/chapters/shanghai_ch01/";
  var ARCHIVE = "./assets/images/archive/";

  function choice(id, text, effects, result, extra) {
    return Object.assign({ id: id, text: text, effects: effects || {}, result: result }, extra || {});
  }

  function base(id, stage, date, time, location, type, title, narration, image, next) {
    return {
      id: id,
      chapterId: CHAPTER,
      stage: stage,
      date: date,
      time: time,
      location: location,
      type: type,
      title: title,
      narration: narration,
      dialogue: [],
      image: image,
      audio: { ambience: "", sfx: "", optional: true },
      requirements: [],
      next: next || null
    };
  }

  var events = [];

  var p00 = base("sh01_p00", 1, "1937-08-09", "傍晚", "上海·闸北与虹桥之间", "narration", "风雨压城",
    "虹桥机场附近的枪声尚未传遍全城，报馆已经加印号外，车站开始拥挤。街面仍有电车经过，店铺却比平日更早落闸。你不知道战争会在几天后把上海变成什么样，只知道眼前有人在等你做决定。",
    ROOT + "prologue.jpg", "sh01_p01");
  p00.stageIntro = true;
  p00.task = "确认你要守住的人、物件或线路。";
  events.push(p00);

  var p01 = base("sh01_p01", 1, "1937-08-10", "上午", "上海·闸北救护站", "dialogue", "一张不断加长的名单",
    "救护站把能找到的床板、门板都靠在墙边。陆文清把登记簿翻到空白页，提醒每个人：真正混乱到来之前，名字和去向必须写清楚。",
    ROOT + "clinic.jpg", "sh01_p02");
  p01.dialogue = [
    { speaker: "陆文清", role: "救护站负责人", text: "先别谈能救多少人。告诉我，谁负责记录，谁去找车，谁能在天黑前回来。" },
    { speaker: "沈玉兰", role: "难民互助队", text: "北站那边已经有人拖家带口过去。我需要一个确切的收容地点，不能再让他们来回走。" }
  ];
  events.push(p01);

  var p02 = base("sh01_p02", 1, "1937-08-10", "中午", "上海·闸北救护站", "choice", "先守住哪一件事",
    "局势尚未完全失控，但人手只够先处理一件事。每一个选择都合理，也都会让另一处更脆弱。",
    ARCHIVE + "city-map.svg", "@identity:1");
  p02.choices = [
    choice("a", "先核实通往北站与租界边缘的安全路线", { mental: -2 }, "你得到一张较可靠的街区路线，但救护站的准备慢了半个时辰。", { setFlags: ["routeSurveyed"] }),
    choice("b", "先清点药品、粮食与可用车辆", { supplies: 1 }, "物资数字终于对得上，但两条未经核实的消息已经传开。", { setFlags: ["inventoryChecked"] }),
    choice("c", "先逐户通知附近仍有老人孩子的家庭", { mental: -4, trust: { shen_yulan: 2 } }, "更多人知道去哪里集合，你也更早看见他们无法全部带走的行李。", { setFlags: ["neighborsWarned"] }),
    choice("d", "先把姓名、伤势与联络人写入登记簿", { mental: -1, trust: { lu_wenqing: 2 } }, "这本簿子后来成为寻找失散者的依据，但眼前没有立刻少一名伤员。", { setFlags: ["namesRecorded"] })
  ];
  events.push(p02);

  var p03 = base("sh01_p03", 1, "1937-08-11", "黄昏", "上海·住处或值勤点", "item", "只能带走三件东西",
    "行李必须轻到能够奔跑。证件、食物、工具、家书和一件属于家人的旧物摆在面前。你无法证明哪一件在三天后更重要。",
    ARCHIVE + "handcart-inventory.svg", "@identity:2");
  p03.choices = [
    choice("a", "带证件、工具和少量食物", { supplies: 2 }, "这是最实用的组合，却没有给私人记忆留下位置。", { addItems: ["train_ticket"], setFlags: ["packedPractical"] }),
    choice("b", "带家书、证件和一件旧物", { mental: 4 }, "包袱不重，但每次打开都提醒你还有人在等消息。", { addItems: ["family_letter", "shop_key"], setFlags: ["keptMemory"] }),
    choice("c", "带药品、绷带和登记本", { supplies: 1, trust: { lu_wenqing: 1 } }, "你把私人物品留在原处，换来几次紧急处置的机会。", { addItems: ["medical_tag"], setFlags: ["packedMedical"] }),
    choice("d", "只带空包，把重量留给途中需要的人", { mental: -2, trust: { shen_yulan: 1 } }, "你起步时最轻，却也失去了能证明身份和住址的东西。", { setFlags: ["emptyPack"] })
  ];
  p03.afterPool = ["sh01_hidden_key", "sh01_random_rumor"];
  events.push(p03);

  var p04 = base("sh01_p04", 1, "1937-08-13", "下午", "上海·闸北", "transition", "第一声近炮",
    "下午，枪炮声在闸北连成一片。电车停在半路，店门一扇接一扇落下。几分钟前还在争论去留的人开始向同一个方向奔跑。",
    ROOT + "zhabei-street.jpg", "sh01_p05");
  p04.stageEnd = true;
  events.push(p04);

  var p05 = base("sh01_p05", 2, "1937-08-13", "傍晚", "上海·闸北街区", "route", "四条都不安全的路",
    "救护站与北站之间的主路被碎砖和人群堵住。你必须选择一条路线，每条路都有不同的风险与可以帮助的人。",
    ROOT + "zhabei-street.jpg", null);
  p05.stageIntro = true;
  p05.task = "穿过闸北，把第一批人或消息送到目的地。";
  p05.choices = [
    choice("a", "沿铁路围墙走：路短，但可能遭到空袭", { hp: -5, mental: -3 }, "你贴着围墙前进，碎石擦伤手臂，却抢回了时间。", { next: "sh01_p05a", setFlags: ["railRoute"] }),
    choice("b", "穿过里弄：路窄，邻里消息更多", { mental: -2, trust: { shen_yulan: 1 } }, "里弄几次被锁住，你用居民提供的小门绕过去。", { next: "sh01_p05b", setFlags: ["laneRoute"] }),
    choice("c", "绕向租界边缘：距离远，检查更严格", { supplies: -1 }, "你花掉一份食物换来向导，避开了最密集的火力。", { next: "sh01_p05c", setFlags: ["borderRoute"] }),
    choice("d", "跟随担架队：速度慢，但互相照应", { mental: -4, trust: { lu_wenqing: 2 } }, "你一路听着担架上的呻吟，队伍没有丢下任何人。", { next: "sh01_p05d", setFlags: ["stretcherRoute"], effects: { mental: -4, trust: { lu_wenqing: 2 }, rescueScore: 1 } })
  ];
  events.push(p05);

  [
    ["sh01_p05a", "铁路围墙下", "一节空货车停在侧线上，车门敞开。何树仁正尝试把三名伤员抬上去。", ROOT + "station.jpg", { trust: { he_shuren: 2 }, rescueScore: 1 }],
    ["sh01_p05b", "里弄后门", "沈玉兰带着七个孩子从后门钻出。最后一位老人不肯离开装着祖先牌位的屋子。", ROOT + "shelter.jpg", { trust: { shen_yulan: 2 }, rescueScore: 1 }],
    ["sh01_p05c", "界线之外", "路障前的队伍越来越长。你看见有人把伤员证件夹在衣襟里，以免他失去姓名。", ROOT + "street-crossing.jpg", { mental: -2, evidence: 1 }],
    ["sh01_p05d", "担架队", "一副担架的绑带断了。你们拆下一条门帘重新打结，速度慢下来，却没有把人放回路边。", ROOT + "clinic.jpg", { mental: -3, rescueScore: 2 }]
  ].forEach(function (data) {
    var event = base(data[0], 2, "1937-08-13", "入夜", "上海·闸北", "narration", data[1], data[2], data[3], "@identity:3");
    event.onEnterEffects = data[4];
    events.push(event);
  });

  var p06 = base("sh01_p06", 2, "1937-08-14", "凌晨", "上海·临时收容点", "priority", "先把谁送上车",
    "车厢只剩三个位置，面前却有四组人。不存在不会后悔的排序。",
    ROOT + "station.jpg", "@identity:4");
  p06.choices = [
    choice("a", "两名失去意识的重伤员", { supplies: -1, mental: -4 }, "重伤员被固定在车厢角落，一名能行走的伤员留下帮忙。", { setFlags: ["priorityWounded"], effects: { supplies: -1, mental: -4, rescueScore: 2 } }),
    choice("b", "带着婴儿的母亲和一名老人", { mental: -3, trust: { shen_yulan: 2 } }, "车门关上时，老人把住址塞给你，请你替他找家人。", { setFlags: ["priorityFamily"], effects: { mental: -3, rescueScore: 2 } }),
    choice("c", "掌握线路的扳道工与电报员", { trust: { he_shuren: 2 } }, "他们活着抵达下一站，可能让后续更多车次继续运行。", { setFlags: ["priorityWorkers"], effects: { rescueScore: 1 } }),
    choice("d", "让所有能走的人下车，腾位给三名最虚弱者", { hp: -5, mental: -5 }, "你与能走的人留在原地，下一程必须徒步。", { setFlags: ["priorityWeak"], effects: { hp: -5, mental: -5, rescueScore: 3 } })
  ];
  p06.afterPool = ["sh01_hidden_list", "sh01_random_child"];
  events.push(p06);

  var p07 = base("sh01_p07", 2, "1937-08-16", "清晨", "上海·苏州河畔", "transition", "城市分成两种声音",
    "一边是炮声、警报和倒塌的砖木，一边仍有人排队买水、递送报纸。苏州河没有把战争隔开，只把两种生活并排摆在眼前。",
    ROOT + "suzhou-river.jpg", "sh01_p08");
  p07.stageEnd = true;
  events.push(p07);

  var p08 = base("sh01_p08", 3, "1937-08-18", "上午", "上海·联合救护点", "resource", "十二份物资，二十七个人",
    "药品、食物、煤油和车位都不足。你必须公开分配原则，否则争执会先耗尽队伍。",
    ARCHIVE + "ration-ledger.svg", "@identity:5");
  p08.stageIntro = true;
  p08.task = "维持救护与运输网络，不让资源在混乱中消失。";
  p08.resource = { available: 12, labels: ["急救", "口粮", "运输"] };
  p08.choices = [
    choice("a", "急救6／口粮3／运输3", { supplies: -2, mental: -2 }, "重伤者得到更稳定的处置，但能维持行动的人开始挨饿。", { setFlags: ["medicalPriority"] }),
    choice("b", "急救4／口粮5／运输3", { supplies: -1 }, "队伍体力较稳定，重伤处理必须更谨慎。", { setFlags: ["balancedSupply"] }),
    choice("c", "急救3／口粮3／运输6", { supplies: -2, trust: { he_shuren: 1 } }, "更多人能被送走，留下的救护点几乎没有余量。", { setFlags: ["transportPriority"] }),
    choice("d", "急救4／口粮4／运输4，并保留一份登记备查", { mental: -1, trust: { lu_wenqing: 1, he_shuren: 1 } }, "分配速度最慢，却减少了冒领与重复登记。", { setFlags: ["auditedSupply"] })
  ];
  p08.afterPool = ["sh01_hidden_medicine", "sh01_random_fire"];
  events.push(p08);

  var p09 = base("sh01_p09", 3, "1937-08-20", "深夜", "上海·报馆地下室", "dialogue", "消息必须有来源",
    "方景之把四张互相矛盾的电报排在桌上。战况、道路和伤亡数字都在变化，错误消息同样会让人走向危险。",
    ARCHIVE + "newspaper.svg", "sh01_p10");
  p09.dialogue = [
    { speaker: "方景之", role: "报馆校对兼联络员", text: "‘听说’两个字不能印。谁看见、几点、哪条路——少一样都可能害人。" },
    { speaker: "何树仁", role: "铁路扳道工", text: "北站侧线还能走到明早六点。六点以后，我不敢保证。" }
  ];
  events.push(p09);

  var p10 = base("sh01_p10", 3, "1937-08-21", "凌晨", "上海·报馆地下室", "choice", "哪条消息可以送出",
    "你只能让通讯员带走一份抄件。四条消息都有价值，也都有尚未核实的部分。",
    ARCHIVE + "telegram.svg", "@identity:6");
  p10.choices = [
    choice("a", "发送已核实的伤员转运时间与车次", { trust: { he_shuren: 2 } }, "消息具体、可执行，却没有描述街区遭受的破坏。", { setFlags: ["sentTransportMessage"] }),
    choice("b", "发送轰炸现场记录与两名目击者证词", { mental: -2 }, "报道风险更高，但留下了可交叉核验的现场证据。", { addItems: ["press_note"], setFlags: ["evidenceSecured"] }),
    choice("c", "发送收容点缺粮与缺药清单", { trust: { lu_wenqing: 2, shen_yulan: 1 } }, "援助可能更快到来，但线路与阵地信息没有送出。", { setFlags: ["sentReliefMessage"] }),
    choice("d", "暂缓发送，再用一小时核对全部来源", { mental: -3 }, "准确度提高，通讯窗口却缩短了。", { setFlags: ["verifiedBeforeSending"] })
  ];
  p10.afterPool = ["sh01_hidden_witness", "sh01_random_blackout"];
  events.push(p10);

  var p11 = base("sh01_p11", 3, "1937-08-22", "黄昏", "上海·北站附近", "transition", "第一阶段的尽头",
    "你们维持住了一条线：也许是救护、铁路、消息，也许只是邻里之间不肯松开的手。远处的战事仍在扩大，上海北部的压力开始向罗店、宝山方向延伸。",
    ROOT + "rail-yard.jpg", "sh01_p12");
  p11.stageEnd = true;
  events.push(p11);

  var p12 = base("sh01_p12", 4, "1937-08-22", "夜间", "上海·北部转运线", "crisis", "警报之后没有灯",
    "停电与警报同时到来。一辆载有伤员和孩子的手推车翻在岔路口，远处建筑正在燃烧，通讯员催促你立刻离开。",
    ROOT + "night-evacuation.jpg", "@identity:7");
  p12.stageIntro = true;
  p12.task = "在黑暗中恢复队伍，决定谁留下处理后果。";
  p12.choices = [
    choice("a", "先抬起手推车，所有人一起走", { hp: -20, mental: -4 }, "你肩背拉伤，但车上的人和物资都没有被丢下。", { setFlags: ["savedHandcart"], effects: { hp: -20, mental: -4, rescueScore: 2, characterStates: { shen_yulan: { status: "随车撤离，继续清点儿童" } } } }),
    choice("b", "先带能走的人离开，再派两人返回", { mental: -3 }, "大队脱离危险，返回的人承担了更高风险。", { setFlags: ["splitRescue"], effects: { rescueScore: 1 } }),
    choice("c", "放弃物资，只抬走伤员和孩子", { supplies: -3, mental: -2 }, "队伍速度恢复，几天后你们会为这批物资付出代价。", { setFlags: ["abandonedSupplies"] }),
    choice("d", "利用短暂火光重新清点姓名和方向", { hp: -5, trust: { shen_yulan: 2 } }, "你们多停留了几分钟，却避免一名孩子在黑暗里走失。", { setFlags: ["headcountInDark"], effects: { hp: -5, rescueScore: 2 } })
  ];
  p12.afterPool = ["sh01_hidden_fuel", "sh01_random_collapse"];
  events.push(p12);

  var p13 = base("sh01_p13", 4, "1937-08-22", "午夜", "上海·北部转运线", "map", "最后一段路",
    "主路被封，剩下四条路线：桥下、货栈、里弄和铁路检修道。你只能依据此前保存的信息作判断。",
    ARCHIVE + "city-map.svg", null);
  p13.choices = [
    choice("a", "走桥下低路，避开火光但可能积水", { hp: -5 }, "积水没过小腿，队伍在桥洞下避过一次搜查。", { next: "sh01_p13a", setFlags: ["finalLowRoute"] }),
    choice("b", "穿货栈，利用墙体遮蔽", { mental: -3 }, "货栈里有倒塌风险，也留下了可用绳索和木板。", { next: "sh01_p13b", setFlags: ["finalWarehouseRoute"] }),
    choice("c", "回到熟悉的里弄，依靠居民引路", { trust: { shen_yulan: 2 } }, "两户居民打开相通的后门，让担架能够横着穿过。", { next: "sh01_p13c", setFlags: ["finalLaneRoute"] }),
    choice("d", "走铁路检修道，争取赶上临时列车", { supplies: -1, trust: { he_shuren: 2 } }, "你用最后一份口粮换来检修道钥匙。", { next: "sh01_p13d", setFlags: ["finalRailRoute"], requirements: [{ path: "stats.supplies", op: "gte", value: 1 }], lockedReason: "至少需要1份物资换取检修道钥匙" })
  ];
  events.push(p13);

  [
    ["sh01_p13a", "桥洞回声", "水里漂着纸张和木屑。队伍不敢说话，只能靠拉住前一人的衣角确认方向。", ROOT + "night-evacuation.jpg", { mental: -2 }],
    ["sh01_p13b", "货栈断梁", "一根断梁挡住担架。你们用绳索把它吊起，只够让人一个个钻过去。", ROOT + "warehouse.jpg", { hp: -5 }],
    ["sh01_p13c", "相通的后门", "门后不是安全，只是愿意互相开门的人。每经过一户，都有人悄悄加入队伍。", ROOT + "shelter.jpg", { trust: { shen_yulan: 1 } }],
    ["sh01_p13d", "检修道", "何树仁认出远处两短一长的提灯信号。临时列车还没有开走。", ROOT + "rail-yard.jpg", { trust: { he_shuren: 1 } }]
  ].forEach(function (data) {
    var event = base(data[0], 4, "1937-08-22", "后半夜", "上海·北部转运线", "narration", data[1], data[2], data[3], "sh01_p14");
    event.onEnterEffects = data[4];
    events.push(event);
  });

  var p14 = base("sh01_p14", 4, "1937-08-22", "黎明前", "上海·临时列车旁", "dialogue", "车门关闭以前",
    "车厢里的人挤在一起。陆文清仍在核对伤员牌，沈玉兰寻找最后一个孩子，何树仁盯着线路信号，方景之把一卷底片塞进内衣口袋。",
    ROOT + "station.jpg", "sh01_p15");
  p14.dialogue = [
    { speaker: "高义成", role: "守军班长", text: "命令是护送到这里。可后面还有一副担架没到。" },
    { speaker: "陆文清", role: "救护站负责人", text: "列车不会等我们的良心准备好。决定谁回去，谁留在车上。" },
    { speaker: "沈玉兰", role: "难民互助队", text: "我记得那孩子的名字。只要名字还在，就不能当他已经不见了。" }
  ];
  p14.afterPool = ["sh01_hidden_names", "sh01_random_stranger"];
  events.push(p14);

  var p15 = base("sh01_p15", 4, "1937-08-22", "黎明前", "上海·临时列车旁", "climax", "不可逆的分工",
    "炮声更近，信号员示意列车将在十分钟内开出。你必须决定最后的分工。这个决定会改变同伴去向，也可能让某份证据永远留在上海。",
    ROOT + "climax-train.jpg", "sh01_p16");
  p15.choices = [
    choice("a", "自己返回寻找失联担架，让同伴护送列车", { hp: -25, mental: -6 }, "你逆着人群回到黑暗里，同伴按你的安排留在车上。", { setFlags: ["returnedForStretcher"], effects: { hp: -25, mental: -6, rescueScore: 2, characterStates: { gao_yicheng: { injured: true, status: "协助担架队时负伤，已上车" } } } }),
    choice("b", "留在列车维持秩序，派最熟悉路线的人返回", { mental: -5 }, "列车上的混乱得到控制，返回者的命运暂时无法确认。", { setFlags: ["sentCompanionBack", "companionAtRisk", "companionLost"], effects: { mental: -5, characterStates: { he_shuren: { missing: true, status: "返回检修信号后失去联络" } } } }),
    choice("c", "优先把名单、底片和电报抄件交给可靠乘客", { mental: -3 }, "证据离开火线，但你必须接受一名伤员暂时留在站台。", { setFlags: ["evidenceSecured", "leftOneWounded"], addMemories: ["film_roll", "telegram"] }),
    choice("d", "放弃开车时刻，要求再等五分钟", { hp: -10, trust: { he_shuren: -2 } }, "五分钟换回两个人，也让列车暴露在更高风险中。", { setFlags: ["delayedTrain"], effects: { hp: -10, rescueScore: 3, characterStates: { lu_wenqing: { injured: true, status: "护送最后一副担架时轻伤" } } } })
  ];
  p15.stageEnd = true;
  events.push(p15);

  var p16 = base("sh01_p16", 5, "1937-08-22", "破晓", "上海·北部转运线", "choice", "火光中的最后选择",
    "列车或队伍即将离开这一片街区。你还能做最后一件事，但不能同时完成四件。",
    ROOT + "retreat.jpg", null);
  p16.stageIntro = true;
  p16.task = "完成本章最后托付，并承担无法挽回的代价。";
  p16.choices = [
    choice("a", "把剩余物资全部留给救护站", { supplies: -3, trust: { lu_wenqing: 3 } }, "物资被贴上日期和用途，你自己几乎空手离开。", { next: "sh01_p16a", setFlags: ["suppliedClinic"], requirements: [{ path: "stats.supplies", op: "gte", value: 3 }], lockedReason: "需要至少3份可用物资" }),
    choice("b", "带走失散者名单，承诺继续寻找", { mental: -4, trust: { shen_yulan: 3 } }, "名单贴身保存，未解决的姓名成为下一程的责任。", { next: "sh01_p16b", setFlags: ["evidenceSecured", "keptMissingList"] }),
    choice("c", "修复最后一次通讯，把列车位置发往下一站", { supplies: -1, trust: { he_shuren: 3 } }, "短促电报码越过中断线路，下一站提前准备了担架。", { next: "sh01_p16c", setFlags: ["sentFinalSignal", "chapterTaskDone"] }),
    choice("d", "留下照看不能移动的人，等下一支队伍", { hp: -20, mental: -6 }, "你错过眼前的撤离机会，却没有让不能移动的人独自面对天亮。", { next: "sh01_p16d", setFlags: ["stayedWithWounded"], effects: { hp: -20, mental: -6, rescueScore: 2, characterStates: { lu_wenqing: { status: "留在临时救护点等待接应" } } } })
  ];
  events.push(p16);

  [
    ["sh01_p16a", "空下来的背包", "列车启动时，你的背包只剩一封信。救护站的灯却因此多亮了几个小时。", ARCHIVE + "ration-ledger.svg", { flags: { chapterTaskDone: true } }],
    ["sh01_p16b", "一页页姓名", "名单被油纸包住。有人活着，有人失踪，但他们没有在混乱中变成无名者。", ARCHIVE + "casualty-list.svg", { flags: { chapterTaskDone: true, evidenceSecured: true } }],
    ["sh01_p16c", "两短一长", "远处终于回了两短一长的信号。那不是胜利，只说明下一站听见了。", ARCHIVE + "telegram.svg", { flags: { chapterTaskDone: true } }],
    ["sh01_p16d", "没有车轮的清晨", "你们留在破墙后等待。天亮后，一支担架队循着昨夜留下的布条找来。", ROOT + "ending-dawn.jpg", { flags: { chapterTaskDone: true }, hp: -5 }]
  ].forEach(function (data) {
    var event = base(data[0], 5, "1937-08-22", "清晨", "上海·北部街区", "narration", data[1], data[2], data[3], "@identity:8");
    event.onEnterEffects = data[4];
    events.push(event);
  });

  var p17 = base("sh01_p17", 5, "1937-08-22", "上午", "上海西行方向", "ending", "上海仍在身后燃烧",
    "你没有改变会战的走向。你只是让几个人、几件物品或几行文字越过了这一天。",
    ROOT + "ending-dawn.jpg", null);
  p17.history = {
    fact: "1937年8月13日淞沪会战全面爆发。上海军民在持续战事中组织救护、运输、后援和新闻记录。",
    fiction: "本章玩家角色、陆文清、何树仁、沈玉兰、方景之与高义成为基于历史环境创作的普通人物，不对应具体历史人物。",
    sourceIds: ["saac_shanghai_archives", "saac_battle_archives"]
  };
  events.push(p17);

  var identityNext = {
    1: "sh01_p03", 2: "sh01_p04", 3: "sh01_p06", 4: "sh01_p07",
    5: "sh01_p09", 6: "sh01_p11", 7: "sh01_p13", 8: "sh01_p17"
  };

  var identityImages = {
    soldier: ROOT + "soldier-line.jpg",
    medic: ROOT + "clinic.jpg",
    journalist: ROOT + "press-room.jpg",
    civilian: ROOT + "shelter.jpg",
    transport: ROOT + "rail-yard.jpg"
  };

  var identityScenarios = {
    soldier: [
      ["命令与街口", "高义成收到的警戒命令与街口实际人流相冲突。", ["先疏散街口再回报", "严格封锁街口", "请示后再行动", "留一人维持通道"], ["clearedStreet", "obeyedOrder", "waitedOrder", "keptPassage"]],
      ["六个人的弹药", "小队只有十八发可调配弹药，真正任务是护送而非交火。", ["平均分配", "集中给警戒手", "保留一半应急", "把两人改为担架手"], ["ammoEven", "ammoGuard", "ammoSaved", "twoStretcher"]],
      ["屋顶观察点", "观察点能看清道路，也更容易暴露。", ["自己上屋顶", "两人轮换", "只观察五分钟", "改用街角居民消息"], ["roofSelf", "roofShift", "roofBrief", "civilianIntel"]],
      ["掉队的新兵", "一名新兵因恐惧停在墙后，队伍不能无限等待。", ["留下陪他呼吸稳定", "命令他立即跟上", "收走武器让他搬物资", "交给后方救护站"], ["calmedRecruit", "forcedRecruit", "reassignedRecruit", "sentRecruitBack"]],
      ["未经核实的命令", "口头命令要求改变路线，却没有签章和传令兵姓名。", ["按原命令执行", "先核实传令来源", "派一人试探新路线", "让两队分别行动"], ["heldOrder", "verifiedOrder", "scoutedOrder", "splitSquad"]],
      ["小队只剩四人", "连续勤务后两人受伤，小队人数下降。", ["把伤者送走", "伤者留在轻任务", "全队休息十分钟", "请求与邻队合并"], ["evacuatedSquad", "lightDuty", "briefRest", "mergedSquad"]],
      ["回去的人", "一副担架没有按时出现，高义成看着你等决定。", ["你和他一起返回", "让他返回你守车", "派两名状态最好的人", "用信号灯引导不返回"], ["soldierReturned", "gaoReturned", "bestReturned", "signalOnly"]],
      ["最后一发信号弹", "信号弹可指示撤离，也会暴露位置。", ["立刻发射", "等队伍更近", "改用布条标记", "交给下一支队伍"], ["flareNow", "flareLater", "clothMarks", "passedFlare"]]
    ],
    medic: [
      ["第一批伤员", "五名伤员同时送到，陆文清要求你先稳定最危险者。", ["先处理呼吸困难者", "先止住大出血", "先给能行走者包扎", "先登记全部伤势"], ["airwayFirst", "bleedingFirst", "walkingFirst", "triageFirst"]],
      ["九瓶药", "药柜只剩九瓶常用药，补给时间未知。", ["按重伤优先", "每人只用最低剂量", "保留三瓶应急", "与附近诊所交换"], ["medHeavy", "medMinimum", "medReserve", "medExchange"]],
      ["没有床位", "走廊已满，新的担架还在门口。", ["清空办公室铺地", "把稳定者转到民宅", "只接收重伤", "请求铁路提供空车厢"], ["officeBeds", "homeWard", "heavyOnly", "railWard"]],
      ["无法同时手术", "两名伤员都需要手术，器械只够一台。", ["先处理失血更快者", "先处理成功率更高者", "分组同时准备", "请本人清醒时表达意愿"], ["bleedSurgery", "successSurgery", "parallelPrep", "patientChoice"]],
      ["绷带要不要重用", "干净绷带见底，旧绷带经过煮沸仍有风险。", ["只用于轻伤", "全部使用", "撕床单替代", "减少包扎频率"], ["reuseLight", "reuseAll", "sheetBandage", "lessBandage"]],
      ["医疗压力", "连续工作让你开始手抖。", ["休息十五分钟", "喝水继续", "让助手接手", "只做分诊不做操作"], ["medicRest", "medicContinue", "assistantTakes", "triageOnly"]],
      ["不能移动的伤员", "警报要求撤离，但两名伤员无法移动。", ["留下照看", "用门板抬走", "给药后请邻里守护", "先送其他人再返回"], ["medicStayed", "doorStretcher", "neighborCare", "medicReturn"]],
      ["最后一张分诊牌", "最后一名伤员没有姓名，只能写下外貌与发现地点。", ["详细记录并保存", "只写伤势", "交给伤员本人", "钉在担架上"], ["unknownRecorded", "injuryOnly", "patientKeeps", "tagStretcher"]]
    ],
    journalist: [
      ["第一张照片", "街口人群与远处烟柱同时进入取景框。", ["拍疏散人群", "拍被毁街面", "拍救护登记", "暂不拍先核实地点"], ["photoCrowd", "photoStreet", "photoRelief", "verifyPhoto"]],
      ["胶卷只有六卷", "报馆要求节省底片，但现场每天都在变化。", ["每个地点只拍一张", "集中拍人物证词", "集中拍城市破坏", "保留两卷到后期"], ["filmOneShot", "filmWitness", "filmDamage", "filmReserve"]],
      ["未经证实的伤亡数字", "两个来源给出完全不同的数字。", ["只写已核实下限", "同时注明两种说法", "暂不报道数字", "再找第三方核对"], ["lowerBound", "twoClaims", "noNumber", "thirdSource"]],
      ["底片与伤员", "你能继续拍摄，也能放下相机帮忙抬担架。", ["立刻帮抬", "先拍一张再帮", "请旁人帮抬继续记录", "把相机交给方景之"], ["cameraDown", "photoThenHelp", "delegateHelp", "cameraToFang"]],
      ["通讯窗口", "电话线只能维持几分钟。", ["先发经过核实的短讯", "先发完整长稿", "先报告救护需求", "先确认家人安全"], ["sentBrief", "sentFull", "sentRelief", "calledFamily"]],
      ["暴露风险", "有人注意到你反复记录街区破坏。", ["藏起相机", "公开记者身份", "把底片交给路人", "离开现场换衣服"], ["hidCamera", "showedPressCard", "passedFilm", "changedClothes"]],
      ["一卷不能重拍的底片", "撤离前必须决定底片由谁携带。", ["贴身携带", "交给可靠乘客", "分装两处", "藏在物资箱"], ["filmSelf", "filmPassenger", "filmSplit", "filmCrate"]],
      ["最后一句稿件", "电报只够再发一句。", ["写伤员列车已开出", "写街区仍有居民", "写已核实破坏地点", "写留下者姓名"], ["lastTrainLine", "lastResidentsLine", "lastDamageLine", "lastNamesLine"]]
    ],
    civilian: [
      ["铺门要不要锁", "邻里催你离开，姨母却担心铺里仅剩的家当。", ["锁门带钥匙", "敞门给邻里避难", "搬出粮食再走", "留下纸条说明去向"], ["lockedShop", "openedShop", "sharedFood", "leftNote"]],
      ["寻找表妹", "有人说在北站见过她，也有人说她去了收容点。", ["先去北站", "先去收容点", "请邻里分头找", "守在约定地点"], ["searchStation", "searchShelter", "splitSearch", "waitMeeting"]],
      ["熟悉的小路", "一条小路近但有倒墙，一条大路远且拥挤。", ["带人走小路", "先独自探路", "走大路", "只告诉熟人小路"], ["laneGroup", "laneScout", "mainRoad", "laneTrusted"]],
      ["七份食物", "同行者增加到十二人。", ["老人孩子优先", "平均分", "保留两份夜里用", "拿一份换路线消息"], ["foodWeak", "foodEqual", "foodReserve", "foodIntel"]],
      ["邻里争执", "两家人为一个手推车位置争吵。", ["按伤弱排序", "抽签", "轮流推车", "拆掉行李只载人"], ["cartWeak", "cartDraw", "cartShift", "cartPeople"]],
      ["家人的线索", "有人带来一张写错一个字的名单。", ["相信名单立刻去找", "核对笔迹和地点", "请沈玉兰查收容点", "先完成当前护送"], ["followList", "verifyList", "askShen", "finishEscort"]],
      ["门后的哭声", "撤离途中，一扇半塌的门后传来孩子哭声。", ["立刻进去", "先检查墙体", "呼喊让孩子回应", "记下位置请求救援"], ["enterDoor", "checkWall", "callChild", "markDoor"]],
      ["钥匙还在手里", "离开街区前，你最后一次摸到铺门钥匙。", ["继续保留", "交给邻里长者", "挂在路标上", "丢下减轻负担"], ["keepKey", "giveKey", "keyMarker", "dropKey"]]
    ],
    transport: [
      ["临时车次", "北站需要在军需、伤员和平民之间重排两节车厢。", ["伤员优先", "平民家庭优先", "军需优先", "混编并留通道"], ["carWounded", "carFamilies", "carSupply", "carMixed"]],
      ["线路故障", "一段信号线中断，现场可能仍有落石。", ["亲自检修", "派两人检修", "改用手旗", "暂停该线"], ["repairSelf", "repairTeam", "useFlags", "closeLine"]],
      ["燃料只有八份", "机车、救护车和发电机都需要燃料。", ["机车四车两电二", "机车三车三电二", "机车五车二电一", "各留一份应急"], ["fuelRail", "fuelBalanced", "fuelEvac", "fuelReserve"]],
      ["超载的车厢", "人数超过核定容量，关门可能夹伤人。", ["严格限员", "拆行李腾空间", "加挂货车", "分两次发车"], ["capacityStrict", "removeLuggage", "addFreight", "twoTrips"]],
      ["一封优先电报", "线路只够发送一封完整电报。", ["发送线路中断位置", "发送伤员人数", "发送难民数量", "发送物资需求"], ["wireLine", "wireWounded", "wireRefugees", "wireSupply"]],
      ["设备过热", "发电设备温度过高，再运行可能彻底损坏。", ["停机冷却", "降负荷运行", "拆备用件更换", "坚持到下一封电报"], ["coolEquipment", "lowLoad", "swapPart", "riskEquipment"]],
      ["最后一个车位", "守军、医生和带孩子的妇女都在等。", ["给医生", "给带孩子者", "给传令兵", "让最虚弱者坐"], ["seatMedic", "seatFamily", "seatRunner", "seatWeak"]],
      ["发车信号", "线路前方没有完整回令，只有模糊灯号。", ["按时发车", "等待五分钟", "派人步行确认", "低速试行"], ["departNow", "waitFive", "walkerCheck", "slowDepart"]]
    ]
  };

  var identityVoices = {
    soldier: {
      speaker: "高义成", role: "守军班长", lines: [
        "命令写得清楚，街口的情形却变了。你先说看见了什么。",
        "子弹省下来不是怯，是要留给真正过不去的时候。",
        "担架从我们身后过，枪口就得朝外，不能乱。",
        "掉队的人不只少一支枪，他还带走旁人的胆气。",
        "先报人数，再报伤势。别把愿望当成回令。",
        "我会复述命令，也会把这里的实情一并报上去。",
        "这段路谁去都危险。定下来，就别让第二个人白跑。",
        "发车以后我们仍有职责，只是未必还在同一处。"
      ]
    },
    medic: {
      speaker: "陆文清", role: "救护站负责人", lines: [
        "先分诊。喊得最响的人，未必是最危险的人。",
        "药瓶见底以前，每一针都要写下去向。",
        "能走的扶着墙走，床位留给不能移动的。",
        "我知道他在等，但下一名伤员也在等。",
        "绷带可以省，消毒不能省；感染不会听炮声停下。",
        "把姓名系在衣襟上，转运中不能再丢一次。",
        "你若进去，就先看屋梁。救人不能再添一个伤员。",
        "最后一副担架交给谁，要连同理由一起记下。"
      ]
    },
    journalist: {
      speaker: "方景之", role: "报馆校对兼联络员", lines: [
        "照片能说明现场，不能替我们核对时间和地点。",
        "底片只有六张，不要让愤怒替你按快门。",
        "他愿意作证，也要问清他究竟站在哪里。",
        "通讯一断，抄件就分两份走，不能押在一个人身上。",
        "数字写得越大，越要有第二个来源。",
        "先救眼前的人，还是先保住证据，你得知道各自会失去什么。",
        "搜查时最显眼的不是相机，是你急着藏东西的样子。",
        "稿子发不出去，姓名和日期仍要留下。"
      ]
    },
    civilian: {
      speaker: "沈玉兰", role: "难民互助队", lines: [
        "先数孩子，再数包袱；少一个人，走多远都不算到。",
        "这扇门我认得，后院能不能通，要问住在里面的人。",
        "粮食分出去就回不来，可人饿着也走不动。",
        "老人不肯走有他的缘故，别用催牲口的口气催他。",
        "名单若错一个字，找人的路就会多绕一整天。",
        "行李自己背。背不动的，就得现在决定留下什么。",
        "门后若真有人，先听墙响不响，再进去。",
        "钥匙留着不是为了铺子，是为了让后来的人知道这里有人住过。"
      ]
    },
    transport: {
      speaker: "何树仁", role: "铁路扳道工", lines: [
        "两节车厢、三种人，不先定顺序，谁也走不了。",
        "信号线断在三百步外。修得快不等于回得来。",
        "燃料只够一次改点，别把‘也许’排进时刻表。",
        "车厢还能挤，车门不能夹着人开。",
        "一封电报只写一件最要紧的事，收报的人才来得及做。",
        "机器热得烫手，再撑一刻，明天就没有机器。",
        "最后一个座位给谁，要看下一站因此能多救几个人。",
        "没有完整回令就发车，是冒险；停在这里，同样是。"
      ]
    }
  };

  Object.keys(identityScenarios).forEach(function (identityId) {
    identityScenarios[identityId].forEach(function (scenario, index) {
      var number = index + 1;
      var event = base(
        "sh01_" + identityId + "_" + String(number).padStart(2, "0"),
        Math.min(5, Math.ceil(number / 2)),
        number <= 2 ? "1937-08-11" : number <= 4 ? "1937-08-14" : number <= 6 ? "1937-08-20" : "1937-08-22",
        number % 2 ? "白天" : "夜间",
        "上海·身份专属现场",
        number === 5 ? "resource" : number === 7 ? "crisis" : "choice",
        scenario[0],
        scenario[1],
        identityImages[identityId],
        identityNext[number]
      );
      event.identities = [identityId];
      event.identityExclusive = true;
      event.dialogue = [{ speaker: identityVoices[identityId].speaker, role: identityVoices[identityId].role, text: identityVoices[identityId].lines[index] }];
      if (identityId === "medic" && number === 3) event.type = "triage";
      if (identityId === "journalist" && number === 5) event.type = "intel";
      if (identityId === "civilian" && number === 4) event.type = "dialogue-choice";
      if (identityId === "transport" && number === 1) event.type = "evacuation";
      if (identityId === "soldier" && number === 7) event.type = "rescue";
      event.choices = scenario[2].map(function (text, choiceIndex) {
        var costs = [
          { mental: -2 },
          { mental: -3, supplies: choiceIndex === 1 ? -1 : 0 },
          { mental: -1 },
          { hp: choiceIndex === 3 && number === 7 ? -10 : 0, mental: -2 }
        ][choiceIndex];
        return choice(
          String.fromCharCode(97 + choiceIndex),
          text,
          costs,
          "你的决定改变了这一身份能够看见的信息、可用资源或同伴状态。",
          { setFlags: [scenario[3][choiceIndex]], specialtyEffects: number % 2 ? {} : { pressure: 2 } }
        );
      });
      var resourceKeys = { soldier: "ammo", medic: "medicine", journalist: "film", civilian: "food", transport: "fuel" };
      var resourceKey = resourceKeys[identityId];
      event.choices[0].requirements = [{ path: "specialty." + resourceKey, op: "gte", value: 1 }];
      event.choices[0].lockedReason = "该行动需要消耗1点身份专属资源";
      event.choices[0].specialtyEffects = Object.assign({}, event.choices[0].specialtyEffects || {});
      event.choices[0].specialtyEffects[resourceKey] = -1;
      events.push(event);
    });
  });

  var bonusSpecs = [
    ["sh01_hidden_key", "condition", "锁后的纸条", "铺门钥匙打开了后门，门缝里夹着铺主留下的收容点地址。", ARCHIVE + "shop-key.svg", "@identity:2", [{ path: "inventory", op: "contains", value: "shop_key" }], "foundShelterAddress"],
    ["sh01_hidden_list", "condition", "名单上的重复姓名", "你发现同一名伤员被登记了两次，纠正后空出一个车位。", ARCHIVE + "casualty-list.svg", "@identity:4", [{ path: "flags.namesRecorded", op: "eq", value: true }], "correctedDuplicate"],
    ["sh01_hidden_medicine", "condition", "药箱夹层", "此前带出的药箱夹层还有两卷绷带，正好够处理一名重伤者。", ARCHIVE + "medical-tag.svg", "@identity:5", [{ path: "flags.packedMedical", op: "eq", value: true }], "foundBandages"],
    ["sh01_hidden_witness", "condition", "第二名目击者", "一名扳道工独立描述了同一时间和地点，现场记录终于可以相互印证。", ARCHIVE + "field-notebook.svg", "@identity:6", [{ path: "flags.namesRecorded", op: "eq", value: true }], "secondWitness"],
    ["sh01_hidden_fuel", "condition", "保留下来的燃料", "早先没有动用的燃料让一辆救护车重新启动。", ARCHIVE + "ration-ledger.svg", "@identity:7", [{ path: "flags.transportPriority", op: "eq", value: true }], "usedReserveFuel"],
    ["sh01_hidden_names", "condition", "有人回应名字", "你读出名单上的姓名，人群里终于有人替一名失散者应声。", ARCHIVE + "casualty-list.svg", "sh01_p15", [{ path: "flags.namesRecorded", op: "eq", value: true }], "nameAnswered"],
    ["sh01_random_rumor", "random", "未经证实的封路消息", "一个陌生人说前路已经封死。你必须判断是否因此改变安排。", ROOT + "street-crossing.jpg", "@identity:2", [], "heardRumor"],
    ["sh01_random_child", "random", "走失的孩子", "孩子只记得母亲衣服的颜色。沈玉兰把线索写在纸板上。", ROOT + "shelter.jpg", "@identity:4", [], "helpedLostChild"],
    ["sh01_random_fire", "random", "煤油灯倒下", "争执中煤油灯倒在地上，众人用湿毯压住火苗。", ROOT + "clinic.jpg", "@identity:5", [], "stoppedLampFire"],
    ["sh01_random_blackout", "random", "整条街熄灯", "电流突然中断，最后一段电报只能靠手摇机断续发出。", ROOT + "press-room.jpg", "@identity:6", [], "manualTelegraph"],
    ["sh01_random_collapse", "random", "二次坍塌", "身后墙体再次坍塌，回头路被封住。", ROOT + "night-evacuation.jpg", "@identity:7", [], "routeCollapsed"],
    ["sh01_random_stranger", "random", "陌生人的托付", "陌生人把一张车票塞给你，请你若活着离开就交给他的家人。", ARCHIVE + "train-ticket.svg", "sh01_p15", [], "acceptedTicket"]
  ];

  bonusSpecs.forEach(function (spec) {
    var event = base(spec[0], 3, "1937-08-22", "不定", "上海·途中", "narration", spec[2], spec[3], spec[4], spec[5]);
    event.bonus = true;
    event.bonusType = spec[1];
    event.requirements = spec[6];
    event.chance = spec[1] === "random" ? 0.5 : 1;
    event.onEnterEffects = { flags: {} };
    event.onEnterEffects.flags[spec[7]] = true;
    if (spec[0] === "sh01_random_collapse") event.onEnterEffects.hp = -5;
    events.push(event);
  });

  window.ChengshangData.events = (window.ChengshangData.events || []).concat(events);
}());
