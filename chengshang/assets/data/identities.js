(function () {
  "use strict";
  window.ChengshangData = window.ChengshangData || {};

  window.ChengshangData.identities = [
    {
      id: "soldier",
      title: "中国守军士兵",
      icon: "兵",
      personas: [
        { id: "soldier_m", name: "周怀远", gender: "男", age: 24 },
        { id: "soldier_f", name: "沈秋禾", gender: "女", age: 22 }
      ],
      origin: "江南乡镇普通家庭",
      occupation: "国民革命军基层士兵／战地勤务兵",
      family: "家人留在后方，只有一封尚未寄出的家书。",
      reason: "随部队进入上海，负责阵地联络、掩护和伤员转移。",
      initial: { hp: 100, mental: 88, supplies: 4, trust: 0 },
      specialty: { ammo: 18, morale: 70, squad: 6, obedience: 55, injury: 0 },
      ability: "战地判断：可识别部分火力与掩体风险。",
      risk: "前线暴露高，命令与实际情况经常冲突。",
      duties: "保持小队、传递命令、掩护撤离、避免无谓伤亡。",
      portrait: "背着旧帆布包的灰蓝军装背影，帽檐压低，衣角有泥。"
    },
    {
      id: "medic",
      title: "战地医护人员",
      icon: "医",
      personas: [
        { id: "medic_f", name: "林静云", gender: "女", age: 27 },
        { id: "medic_m", name: "顾维诚", gender: "男", age: 31 }
      ],
      origin: "上海教会医院与本地医校背景",
      occupation: "外科护士／青年医生",
      family: "父母已撤往苏州，弟弟仍在上海求学。",
      reason: "伤员不断送入，医院不愿在最需要人手时关闭。",
      initial: { hp: 100, mental: 82, supplies: 3, trust: 3 },
      specialty: { medicine: 9, bandages: 14, beds: 8, wounded: 5, pressure: 25 },
      ability: "紧急处置：可用较少药品稳定重伤者。",
      risk: "资源枯竭与救治排序会持续消耗精神。",
      duties: "分诊、手术准备、转移伤员、维持病区秩序。",
      portrait: "旧白褂外罩深色棉衣，袖口卷起，随身药箱磨损。"
    },
    {
      id: "journalist",
      title: "战地记者",
      icon: "记",
      personas: [
        { id: "journalist_m", name: "许观澜", gender: "男", age: 29 },
        { id: "journalist_f", name: "唐若蘅", gender: "女", age: 26 }
      ],
      origin: "上海报馆编辑部",
      occupation: "摄影记者／文字记者",
      family: "与母亲同住，报馆已协助她撤往法租界亲友家。",
      reason: "相信普通人的遭遇必须留下可核验记录。",
      initial: { hp: 100, mental: 85, supplies: 2, trust: 1 },
      specialty: { film: 6, evidence: 1, report: 15, exposure: 10, communication: 70 },
      ability: "现场记录：在高风险场景保存证据并解锁档案。",
      risk: "携带胶卷与笔记会增加搜查和暴露风险。",
      duties: "核实消息、记录现场、保护底片、设法发稿。",
      portrait: "深灰长衫外套旧风衣，胸前小型相机，皮带磨白。"
    },
    {
      id: "civilian",
      title: "城市平民",
      icon: "民",
      personas: [
        { id: "civilian_m", name: "陈阿顺", gender: "男", age: 19 },
        { id: "civilian_f", name: "苏巧珍", gender: "女", age: 23 }
      ],
      origin: "闸北小商铺家庭",
      occupation: "商铺学徒／缝纫铺帮工",
      family: "与姨母和十岁的表妹共同生活，铺主一家去向不明。",
      reason: "需要找到家人，并帮助街坊离开最危险的街区。",
      initial: { hp: 100, mental: 78, supplies: 5, trust: 4 },
      specialty: { food: 7, familySafety: 45, neighborhoodTrust: 55, load: 2, shelterInfo: 35 },
      ability: "熟悉街巷：可发现小路、邻里藏身处和民间消息。",
      risk: "缺少正式证件与组织保护，家人状态直接影响行动。",
      duties: "寻找家人、照看邻里、管理食物与行李、判断避难路线。",
      portrait: "褪色棉布短褂，背着包袱，手里攥着铺门钥匙。"
    },
    {
      id: "transport",
      title: "交通与电报人员",
      icon: "路",
      personas: [
        { id: "transport_m", name: "赵明川", gender: "男", age: 34 },
        { id: "transport_f", name: "叶素琴", gender: "女", age: 28 }
      ],
      origin: "沪宁铁路与上海电报系统基层职员",
      occupation: "铁路调度员／电报机务员",
      family: "妻儿或母亲已乘早班车离沪，自己留下维持线路。",
      reason: "只要线路还能工作，就可能多送走一车人、多传出一条消息。",
      initial: { hp: 100, mental: 84, supplies: 3, trust: 2 },
      specialty: { fuel: 8, lineStatus: 75, communication: 80, capacity: 36, equipment: 85 },
      ability: "线路调度：可重排车次、修复部分通讯并开放撤离路线。",
      risk: "设备故障、拥挤和军民运输冲突会迅速消耗资源。",
      duties: "维持线路、安排车厢、传送电报、保护设备记录。",
      portrait: "深色铁路制服，铜扣暗淡，携带扳手袋和电报抄件。"
    }
  ];
}());
