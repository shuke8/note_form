(function () {
  "use strict";

  var OM = window.OM = window.OM || {};
  var ui = OM.ui, geo = OM.geo, time = OM.time, $ = ui.$;

  function summaryRows(body, selection) {
    var p = body.payload, sev = OM.fields.SEVERITY[p.severity], path = geo.pathNames(selection);
    var reach = geo.reach(selection);
    return [
      ["Қамров", path ? path.join(" / ") : "—"],
      ["Тахминий қамров", reach == null ? "—" : "~" + geo.formatPop(reach) + " киши"],
      ["Ташкилот тури", String(p.audience.org_type)],
      ["Муҳимлиги", sev ? sev.name : p.severity],
      ["Амал қилади", time.moment(Date.parse(p.expires_at), Date.now()) + " гача"]
    ];
  }

  var PHASE = {
    review: { icon: "i-triangle-alert", title: "Юборишни тасдиқланг", eyebrow: "Тасдиқлаш" },
    draft: { icon: "i-info", title: "Юборишга тайёр", eyebrow: "Юборишдан олдин" },
    sending: { icon: "i-clock", title: "Юборилмоқда…", eyebrow: "Юбориш натижаси" },
    sent: { icon: "i-check", title: "Юборилди", eyebrow: "Юбориш натижаси" },
    failed: { icon: "i-circle-alert", title: "Юборилмади", eyebrow: "Юбориш натижаси" }
  };

  function render(phase, sub, job, handlers) {
    var host = $("resultSlot"), p = PHASE[phase];
    host.textContent = "";
    var box = ui.node("div", "send-result");
    box.setAttribute("data-state", phase);
    var head = ui.node("div", "send-head");
    var mark = ui.node("span", "send-mark");
    mark.setAttribute("aria-hidden", "true");
    mark.appendChild(ui.icon(p.icon));
    var words = ui.node("div", "send-words");
    var title = ui.node("h2", "send-title", p.title);
    title.id = "resultTitle";
    words.appendChild(title);
    words.appendChild(ui.node("p", "send-sub", sub));
    head.appendChild(mark);
    head.appendChild(words);
    box.appendChild(head);
    box.appendChild(summary(job.body, job.selection));
    box.appendChild(jsonBlock(job.body));
    box.appendChild(actions(phase, handlers));
    host.appendChild(box);
    $("resultEyebrow").textContent = p.eyebrow;
    $("resultDialog").setAttribute("aria-busy", phase === "sending" ? "true" : "false");
    $("resultDialog").scrollTop = 0;
    if (phase === "sent" || phase === "failed" || phase === "draft") {
      title.tabIndex = -1;
      title.focus({ preventScroll: true });
    }
  }

  function summary(body, selection) {
    var dl = ui.node("dl", "send-grid");
    summaryRows(body, selection).forEach(function (row) {
      var wrap = document.createElement("div");
      wrap.appendChild(ui.node("dt", null, row[0]));
      wrap.appendChild(ui.node("dd", null, row[1]));
      dl.appendChild(wrap);
    });
    return dl;
  }

  function jsonBlock(body) {
    var wrap = ui.node("div", "send-json");
    var label = ui.node("p", "send-json-label", "Серверга кетадиган маълумот");
    label.id = "jsonLabel";
    var pre = ui.node("pre", "send-code", JSON.stringify(body, null, 2));
    pre.tabIndex = 0;
    pre.setAttribute("aria-labelledby", "jsonLabel");
    wrap.appendChild(label);
    wrap.appendChild(pre);
    return wrap;
  }

  function button(cls, iconName, label, onClick) {
    var b = ui.node("button", "btn " + cls);
    b.type = "button";
    if (iconName) b.appendChild(ui.icon(iconName));
    b.appendChild(ui.node("span", null, label));
    b.addEventListener("click", onClick);
    return b;
  }

  function actions(phase, handlers) {
    var row = ui.node("div", "send-actions");
    if (phase === "review") {
      var go = button("btn-solid", null, "Ҳа, юбориш", function () { handlers.send(); });
      go.id = "confirmSend";
      row.appendChild(go);
    }
    if (phase === "failed") {
      var retry = button("btn-solid", "i-rotate-ccw", "Қайта уриниш", function () { handlers.send(); });
      retry.id = "retryBtn";
      row.appendChild(retry);
    }
    row.appendChild(button("btn-outline", "i-copy", "Нусха олиш", function () { handlers.copy(); }));
    return row;
  }

  OM.resultView = { render: render };
})();
