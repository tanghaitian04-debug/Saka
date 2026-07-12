(function () {
  "use strict";
  window.ChengshangData = window.ChengshangData || {};

  var A = "./assets/images/archive/";
  var scenarios = {
    shanghai_ch02: {
      opening: "北部道路不断易手，罗店方向的伤员与消息沿公路向南输送。",
      task: "维持一段转运线，让伤员、记录和补给至少有一项通过。",
      pressure: "一辆车、两副担架和三箱物资无法同时通过泥泞路段。",
      crisis: "前方桥面受损，队伍必须在天黑前决定绕行还是抢修。",
      closing: "道路没有真正安全过，但有人因为这次安排抵达下一处救护点。",
      sourceIds: ["saac_battle_archives"]
    },
    shanghai_ch03: {
      opening: "大场方向的压力增加，救护站和交通线开始按小时计算余量。",
      task: "在阵地收缩前完成伤员、设备与记录的分批转移。",
      pressure: "最后一辆车只能选择医疗器械、行动不便者或通讯设备。",
      crisis: "撤离命令与现场情况不一致，继续等待可能失去道路。",
      closing: "你带出的东西不多，却改变了下一站能够继续做什么。",
      sourceIds: ["saac_shanghai_archives"]
    },
    shanghai_ch04: {
      opening: "苏州河北岸仍有枪声，河对岸的人群能够看见四行仓库的坚守。",
      task: "在撤退与留守并行的夜里，把一份托付送过河或送上西行道路。",
      pressure: "租界边缘、仓库周围和撤退道路有不同规则，错误消息会害人。",
      crisis: "撤退人潮堵住路口，一名同伴和一箱记录只能优先带走一个。",
      closing: "孤楼仍在视线里，真正的撤退却已延伸到上海以西。",
      sourceIds: ["sihang_memorial", "saac_shanghai_archives"]
    },
    nanjing_ch01: {
      opening: "上海失守后的列车与徒步人群陆续抵达南京，下关与城内收容点迅速拥挤。",
      task: "核对去留消息，为一批家属、伤员或设备找到可靠去处。",
      pressure: "车票、船位、粮食和住处都不足，传言比正式通知更快。",
      crisis: "一份撤离名单与现场人数对不上，城外道路又传来新的警报。",
      closing: "城市仍在准备防御，很多人却已经失去第一次离开的机会。",
      sourceIds: ["nanjing_defense"]
    },
    nanjing_ch02: {
      opening: "12月5日起外围战斗展开，部队与民众向城墙方向收缩。",
      task: "让一支混合队伍赶在道路中断前进入城内或安全收容点。",
      pressure: "伤员、难民和物资车辆在同一条道路上相互阻塞。",
      crisis: "前方阵地后撤，城门方向出现拥堵，原定路线已经不可用。",
      closing: "你们越过最后一道外围路口时，身后的枪声已经连成一片。",
      sourceIds: ["nanjing_defense"]
    },
    nanjing_ch03: {
      opening: "12月9日至12日，光华门、雨花台与紫金山方向战斗加剧。",
      task: "在坚守命令与撤离准备交错时，完成一次救护、通讯或人员转移。",
      pressure: "命令多次变化，现场人员无法确认哪条撤退路线仍然存在。",
      crisis: "城门附近出现混乱，留下与离开都可能让同伴失去联系。",
      closing: "12日深夜，城市秩序迅速崩解。你只能确认身边少数人的去向。",
      sourceIds: ["nanjing_defense"]
    },
    nanjing_ch04: {
      opening: "12月13日城破以后，国际安全区与各收容所接纳大量难民。",
      task: "在不暴露他人的前提下分配食物、隐藏伤员并保存一份可核验证据。",
      pressure: "每一张名单、每一份口粮和每一次外出都可能带来风险。",
      crisis: "搜查临近，伤员、胶片与失踪者名单无法全部藏在同一地点。",
      closing: "你保存的不是胜利，而是姓名、证词与有人曾经互相救助的事实。",
      sourceIds: ["nanjing_archives", "nanjing_safety_zone"]
    }
  };

  function makeEvent(chapter, suffix, stage, type, title, narration, image, next) {
    return {
      id: chapter.id + "_" + suffix,
      chapterId: chapter.id,
      stage: stage,
      date: chapter.dateRange.split("—")[0].replace(/年|月/g, "-").replace(/日/g, ""),
      time: stage === 1 ? "清晨" : stage === 5 ? "黄昏" : "日间",
      location: chapter.location,
      type: type,
      title: title,
      narration: narration,
      dialogue: [],
      image: image,
      audio: { ambience: "", sfx: "", optional: true },
      requirements: [],
      next: next
    };
  }

  var compactEvents = [];
  window.ChengshangData.chapters.filter(function (chapter) {
    return chapter.id !== "shanghai_ch01";
  }).forEach(function (chapter) {
    var s = scenarios[chapter.id];
    var e0 = makeEvent(chapter, "p00", 1, "narration", "局势建立", s.opening, A + "city-map.svg", chapter.id + "_p01");
    e0.stageIntro = true;
    e0.task = s.task;
    compactEvents.push(e0);

    var e1 = makeEvent(chapter, "p01", 1, "choice", "先确认什么", s.task, A + "field-notebook.svg", chapter.id + "_p02");
    e1.choices = [
      { id: "a", text: "先核对人员姓名与去向", effects: { mental: -2 }, setFlags: ["compactNames"], result: "名单更准确，但路线确认慢了一步。" },
      { id: "b", text: "先核对道路与时间", effects: { supplies: -1 }, setFlags: ["compactRoute"], result: "路线信息更可靠，却有人因等待而焦躁。" },
      { id: "c", text: "先清点物资和工具", effects: { supplies: 1 }, setFlags: ["compactSupply"], result: "你避免了重复领取，也发现了真正的缺口。" },
      { id: "d", text: "先寻找最脆弱的人", effects: { mental: -3, rescueScore: 1 }, setFlags: ["compactWeak"], result: "行动速度降低，最容易被遗忘的人得到照看。" }
    ];
    e1.stageEnd = true;
    compactEvents.push(e1);

    var e2 = makeEvent(chapter, "p02", 2, "resource", "资源压力", s.pressure, A + "ration-ledger.svg", chapter.id + "_p03");
    e2.resource = { available: 9, labels: ["救护", "运输", "口粮"] };
    e2.stageIntro = true;
    e2.task = "在资源不足时维持救护、运输和口粮分配。";
    e2.choices = [
      { id: "a", text: "救护4／运输3／口粮2", effects: { mental: -2 }, setFlags: ["compactMedical"], result: "重伤者更稳定，队伍体力下降。" },
      { id: "b", text: "救护3／运输4／口粮2", effects: { supplies: -1, rescueScore: 1 }, setFlags: ["compactTransport"], result: "更多人能够离开，留下者物资更少。" },
      { id: "c", text: "救护2／运输3／口粮4", effects: { mental: 2 }, setFlags: ["compactFood"], result: "队伍保持体力，医疗余量不足。" },
      { id: "d", text: "各三份并留下完整记录", effects: { mental: -1 }, setFlags: ["compactAudit"], result: "分配较慢，但后续能够查清每份物资去向。" }
    ];
    e2.stageEnd = true;
    compactEvents.push(e2);

    var e3 = makeEvent(chapter, "p03", 3, "dialogue", "同伴的判断", s.pressure, A + "telegram.svg", chapter.id + "_p04");
    e3.dialogue = [
      { speaker: "同行者", role: "基于历史环境创作的普通人物", text: "我们做不到把所有东西都带走。至少要让下一站知道谁还在路上。" },
      { speaker: "玩家角色", role: "当前身份", text: "先把能核实的写下来。剩下的，不要假装已经解决。" }
    ];
    e3.stageIntro = true;
    e3.stageEnd = true;
    e3.task = "核实同伴判断，并把可执行的信息送往下一站。";
    compactEvents.push(e3);

    var e4 = makeEvent(chapter, "p04", 4, "crisis", "重大危机", s.crisis, A + "casualty-list.svg", chapter.id + "_p05");
    e4.choices = [
      { id: "a", text: "优先救助无法自行行动者", effects: { hp: -10, mental: -4, rescueScore: 2 }, setFlags: ["chapterTaskDone"], result: "你承担了更高风险，最虚弱的人没有被丢下。" },
      { id: "b", text: "优先维持路线和通讯", effects: { supplies: -2 }, setFlags: ["chapterTaskDone", "compactLineHeld"], result: "更多人获得路线信息，眼前救援力量减少。" },
      { id: "c", text: "优先保存名单与证据", effects: { mental: -3 }, setFlags: ["chapterTaskDone", "evidenceSecured"], result: "证据被分散保存，一部分物资没能带走。" },
      { id: "d", text: "分队行动并约定汇合点", effects: { mental: -5, rescueScore: 1 }, setFlags: ["chapterTaskDone", "compactSplit"], result: "任务同时推进，但同伴直到结算前都可能失联。" }
    ];
    e4.stageIntro = true;
    e4.stageEnd = true;
    e4.task = "在重大危机中完成本章最重要的托付。";
    compactEvents.push(e4);

    var e5 = makeEvent(chapter, "p05", 5, "archive", "留下记录", s.closing, A + "family-letter.svg", chapter.id + "_p06");
    e5.stageEnd = true;
    e5.stageIntro = true;
    e5.task = "整理幸存者、物件与证据，留下可核验记录。";
    e5.onEnterEffects = { addItems: ["press_note"] };
    compactEvents.push(e5);

    var e6 = makeEvent(chapter, "p06", 5, "ending", "这一阶段结束", s.closing, A + "city-map.svg", null);
    e6.history = {
      fact: "本章日期、地点与战局背景依据官方档案馆、纪念馆资料划分。",
      fiction: "玩家与同行普通人物均为历史环境下的虚构角色，不冒充真实历史人物。",
      sourceIds: s.sourceIds
    };
    compactEvents.push(e6);
  });

  window.ChengshangData.events = (window.ChengshangData.events || []).concat(compactEvents);
}());
