(function () {
  "use strict";

  function byIds(ids) {
    ids = ids || [];
    return (window.ChengshangData.historySources || []).filter(function (source) {
      return ids.indexOf(source.id) !== -1;
    });
  }

  function renderList(ids) {
    return byIds(ids).map(function (source) {
      var item = document.createElement("li");
      var link = document.createElement("a");
      link.href = source.url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = source.institution + "：《" + source.title + "》";
      item.appendChild(link);
      return item;
    });
  }

  window.ChengshangHistory = { byIds: byIds, renderList: renderList };
}());
