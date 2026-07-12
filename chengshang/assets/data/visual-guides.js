(function () {
  "use strict";
  window.ChengshangData = window.ChengshangData || {};

  // 主要角色固定视觉锚点：后续生成图片时必须重复这些描述，优先使用背影和中远景。
  window.ChengshangData.characterVisualGuides = {
    lu_wenqing: "38岁清瘦男性，圆框眼镜，深灰长衫外罩磨旧白褂，袖口有碘酒旧痕，动作克制。",
    he_shuren: "42岁铁路工人，右眉旧疤、粗大指节，深蓝铁路制服，旧帆布工具袋，常带煤灰。",
    shen_yulan: "33岁短发女性，深褐棉布旗袍外罩短褂，左腕缠旧布，步伐快，神情警惕。",
    fang_jingzhi: "30岁苍白男性，旧西装背心、卷袖白衬衫，随身红蓝铅笔、报样和小胶卷盒。",
    gao_yicheng: "26岁基层守军班长，灰蓝旧军装、磨损绑腿、左靴底开裂，长期缺觉。"
  };

  // 画面元数据用于替换、预加载和审核；generated 为独立生成，derived 为同场景构图变体，archive 为档案式SVG。
  window.ChengshangData.sceneVisuals = [
    ["prologue.jpg", "generated", "战前黄昏街景", "远景"],
    ["clinic.jpg", "generated", "闸北临时救护站", "中景"],
    ["station.jpg", "generated", "北站伤员与平民转运", "中远景"],
    ["shelter.jpg", "generated", "里弄后门撤离", "中景"],
    ["street-crossing.jpg", "generated", "界线附近排队通行", "远景"],
    ["suzhou-river.jpg", "generated", "苏州河与仓库带", "远景"],
    ["night-evacuation.jpg", "generated", "停电后的手推车救援", "夜间中景"],
    ["warehouse.jpg", "generated", "货栈断梁与绳索通道", "中景"],
    ["climax-train.jpg", "generated", "临时列车开行前", "高潮大场面"],
    ["soldier-line.jpg", "generated", "守军小队在断墙后", "人物背影"],
    ["press-room.jpg", "generated", "报馆地下室核验电报", "近景"],
    ["ending-dawn.jpg", "generated", "西行铁路旁的清晨", "结尾远景"],
    ["cover.jpg", "derived", "第一章封面", "远景"],
    ["zhabei-street.jpg", "derived", "闸北街道", "街道中景"],
    ["rail-yard.jpg", "derived", "铁路侧线", "环境中景"],
    ["retreat.jpg", "derived", "离开街区", "人物背影"]
  ].map(function (entry) {
    return { path: "./assets/images/chapters/shanghai_ch01/" + entry[0], status: entry[1], alt: entry[2], camera: entry[3] };
  });
}());
