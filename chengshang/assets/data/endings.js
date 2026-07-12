(function () {
  "use strict";
  window.ChengshangData = window.ChengshangData || {};

  window.ChengshangData.endings = [
    {
      id: "sh01_evidence_saved",
      chapterId: "shanghai_ch01",
      title: "纸上仍有名字",
      tier: "hidden",
      description: "你没有改变战局，但胶卷、名单或电报抄件被送出火线。后来者因此知道这条街上发生过什么。",
      requirements: [{ path: "flags.evidenceSecured", op: "eq", value: true }]
    },
    {
      id: "sh01_rescue_line",
      chapterId: "shanghai_ch01",
      title: "一条没有断的路",
      tier: "good",
      description: "最后一批伤员与平民沿你维持的路线离开。你记不清所有人的姓名，只记得车轮碾过积水的声音。",
      requirements: [{ path: "stats.rescueScore", op: "gte", value: 4 }]
    },
    {
      id: "sh01_duty_cost",
      chapterId: "shanghai_ch01",
      title: "职责留下的伤",
      tier: "bittersweet",
      description: "任务完成了，但一名重要同伴没有随队归来。你带着伤势和无法回答的问题离开上海。",
      requirements: [{ path: "stats.hp", op: "gte", value: 1 }, { path: "flags.companionLost", op: "eq", value: true }]
    },
    {
      id: "sh01_wounded_survivor",
      chapterId: "shanghai_ch01",
      title: "担架上的清晨",
      tier: "wounded",
      description: "你重伤但被转移。意识恢复时，上海已经在身后，随身物件只剩一件。",
      requirements: [{ path: "stats.hp", op: "lte", value: 29 }, { path: "stats.hp", op: "gte", value: 1 }]
    },
    {
      id: "sh01_mission_incomplete",
      chapterId: "shanghai_ch01",
      title: "未完成的托付",
      tier: "survival",
      description: "你活了下来，却没能完成最初的托付。有人获救，也有人留在失去联系的街区。",
      requirements: [{ path: "stats.hp", op: "gte", value: 30 }]
    },
    {
      id: "sh01_failure",
      chapterId: "shanghai_ch01",
      title: "雨水盖过脚印",
      tier: "failure",
      description: "伤势、疲惫和错误路线让你倒在撤离完成之前。战局没有因一个人的倒下而停顿。",
      requirements: [{ path: "stats.hp", op: "lte", value: 0 }]
    }
  ];

  // 为七个开发版章节提供可达的生存与任务结局；后续可直接替换为正式多结局数据。
  window.ChengshangData.chapters.filter(function (chapter) {
    return chapter.id !== "shanghai_ch01";
  }).forEach(function (chapter) {
    window.ChengshangData.endings.push(
      {
        id: chapter.id + "_task",
        chapterId: chapter.id,
        title: "托付送达",
        tier: "good",
        description: "你在有限条件下完成了这一阶段最重要的托付，并保存了一份普通人的记录。",
        requirements: [{ path: "flags.chapterTaskDone", op: "eq", value: true }]
      },
      {
        id: chapter.id + "_survive",
        chapterId: chapter.id,
        title: "带着未竟之事离开",
        tier: "survival",
        description: "你活着离开本阶段，但资源与时间只允许保住一部分人和物件。",
        requirements: []
      }
    );
  });
}());
