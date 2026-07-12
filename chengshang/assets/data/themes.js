(function () {
  "use strict";

  window.ChengshangData = window.ChengshangData || {};

  window.ChengshangData.themes = [
    {
      id: "shanghai",
      title: "淞沪会战",
      period: "1937年8月13日—11月12日",
      location: "上海及周边地区",
      summary: "从战火逼近到全线撤退，普通军民在城市、阵地、医院与交通线上维持一条条脆弱的生命线。",
      tone: "城市战·救援·撤离·证据",
      chapterIds: ["shanghai_ch01", "shanghai_ch02", "shanghai_ch03", "shanghai_ch04"]
    },
    {
      id: "nanjing",
      title: "南京保卫战",
      period: "1937年11月13日—1938年1月31日",
      location: "南京、外围防线与国际安全区",
      summary: "上海撤退之后，首都防务、民众疏散、城防崩解与人道救援接连展开；玩家只能守住眼前的人与证据。",
      tone: "城防·难民·救护·存证",
      chapterIds: ["nanjing_ch01", "nanjing_ch02", "nanjing_ch03", "nanjing_ch04"]
    }
  ];
}());
