(function () {
  "use strict";

  var OM = window.OM = window.OM || {};
  var geo = OM.geo, time = OM.time, $ = OM.ui.$;

  var TIMEOUT_MS = 15000;
  var RETRY = { gapMs: 2500, windowMs: 30000, max: 5 };
  var HTTP_REASON = {
    400: "Сервер маълумотни қабул қилмади", 401: "Кириш муддати тугаган — қайта киринг", 403: "Бу амал учун рухсат йўқ",
    409: "Бу хабар аввалроқ юборилган", 413: "Хабар жуда катта", 422: "Сервер маълумотни қабул қилмади",
    429: "Сервер банд — бироздан кейин уриниб кўринг"
  };

  var ctx = null, job = null, attempts = [], tick = 0, openedAt = 0;
  var BACKDROP_GRACE_MS = 600;

  function endpoint() {
    var meta = document.querySelector('meta[name="om-announce-endpoint"]');
    return meta ? meta.getAttribute("content").trim() : "";
  }

  function newKey() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return "k-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 12);
  }

  function reasonOf(status) {
    if (HTTP_REASON[status]) return HTTP_REASON[status] + " (" + status + ").";
    return status >= 500 ? "Серверда хатолик (" + status + ")." : "Сервер хато жавоб берди (" + status + ").";
  }

  function retryWait(now) {
    attempts = attempts.filter(function (t) { return now - t < RETRY.windowMs; });
    var last = attempts[attempts.length - 1] || 0;
    var gap = Math.max(0, last + RETRY.gapMs - now);
    var windowWait = attempts.length >= RETRY.max ? attempts[0] + RETRY.windowMs - now : 0;
    return Math.max(gap, windowWait);
  }

  function setBusy(on) {
    var b = $("submitBtn");
    b.disabled = on;
    b.setAttribute("aria-busy", on ? "true" : "false");
    $("submitLabel").textContent = on ? "Юборилмоқда…" : "Юбориш";
  }

  function render(phase, sub) {
    OM.resultView.render(phase, sub, job, { send: send, copy: copyJson });
  }

  function paintRetry() {
    var b = $("retryBtn");
    clearTimeout(tick);
    if (!b) return;
    var wait = retryWait(Date.now());
    b.disabled = wait > 0;
    b.querySelector("span").textContent = wait > 0 ? "Қайта уриниш (" + Math.ceil(wait / 1000) + ")" : "Қайта уриниш";
    if (wait > 0) tick = setTimeout(paintRetry, Math.min(1000, wait));
  }

  function copyJson() {
    var text = JSON.stringify(job.body, null, 2);
    var done = function () { if (window.omToast) window.omToast("Маълумот нусхаланди", "ok"); };
    var fail = function () { if (window.omToast) window.omToast("Нусха олиб бўлмади — матнни белгилаб олинг", "warn"); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, fail);
    else fail();
  }

  function finish(phase, sub) {
    setBusy(false);
    job.inflight = false;
    if (phase === "sent") { job.sent = sub; ctx.refresh(); }
    render(phase, sub);
    if (phase === "failed") paintRetry();
  }

  function send() {
    if (!job || job.inflight || retryWait(Date.now()) > 0) return;
    if (navigator.onLine === false) { attempts.push(Date.now()); finish("failed", "Интернет алоқаси йўқ. Уланиш тиклангач қайта уриниб кўринг."); return; }
    job.inflight = true;
    attempts.push(Date.now());
    setBusy(true);
    render("sending", "Сервер жавобини кутяпмиз.");
    var ctrl = window.AbortController ? new AbortController() : null;
    var timer = setTimeout(function () { if (ctrl) ctrl.abort(); }, TIMEOUT_MS);
    fetch(job.url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Idempotency-Key": job.key },
      body: JSON.stringify(job.body),
      signal: ctrl ? ctrl.signal : undefined
    }).then(function (res) {
      clearTimeout(timer);
      if (!res.ok) { finish("failed", reasonOf(res.status) + " Маълумот ўзгармаган — қайта уриниш мумкин."); return; }
      return res.json().catch(function () { return {}; }).then(function (data) {
        var id = data && (data.event_id != null ? data.event_id : data.id);
        finish("sent", id != null ? "Сервер қабул қилди · event_id " + id + "." : "Сервер қабул қилди.");
      });
    }).catch(function (err) {
      clearTimeout(timer);
      var timeout = err && err.name === "AbortError";
      finish("failed", timeout
        ? "Сервер " + TIMEOUT_MS / 1000 + " сонияда жавоб бермади. Хабар етиб бормаган бўлиши мумкин — қайта уриниш такрорий юбормайди."
        : "Серверга уланиб бўлмади. Қайта уриниш такрорий юбормайди.");
    });
  }

  function sameMessage(prev, body, expiry) {
    if (!prev || prev.url !== endpoint() || prev.expiry !== expiry) return false;
    if (expiry === "custom") return JSON.stringify(prev.body) === JSON.stringify(body);
    var a = JSON.parse(JSON.stringify(prev.body)), b = JSON.parse(JSON.stringify(body));
    a.payload.expires_at = b.payload.expires_at = "";
    return JSON.stringify(a) === JSON.stringify(b) && Date.parse(prev.body.payload.expires_at) - Date.now() > time.MINUTE;
  }

  function showDialog() {
    var dlg = $("resultDialog");
    openedAt = Date.now();
    if (typeof dlg.showModal === "function") dlg.showModal();
    else dlg.setAttribute("open", "");
    document.body.setAttribute("data-modal", "true");
  }

  function open(body, selection, expiry) {
    var url = endpoint(), prev = job, same = sameMessage(prev, body, expiry);
    if (prev && prev.inflight) return;
    showDialog();
    if (same && prev.sent) { render("sent", prev.sent); return; }
    if (!same) {
      job = { body: body, selection: selection, expiry: expiry, key: newKey(), url: url, inflight: false, sent: null };
      attempts = [];
    }
    if (!url) {
      render("draft", "Сервер манзили созланмаган, шунинг учун хабар ҳеч қаерга кетмади. Уланганда серверга айнан шу маълумот юборилади.");
      return;
    }
    if (same && retryWait(Date.now()) > 0) { render("failed", "Олдинги уриниш муваффақиятсиз тугади."); paintRetry(); return; }
    render("review", reviewText(selection));
    $("confirmSend").focus();
  }

  function reviewText(selection) {
    var reach = geo.reach(selection), path = geo.pathNames(selection);
    var who = (path ? path.join(" / ") : "Танланган ҳудуд") + (reach == null ? "" : " · тахминан " + geo.formatPop(reach) + " киши");
    return who + ". Юборилгандан кейин хабарни қайтариб бўлмайди.";
  }

  function sentFor(body, expiry) {
    return !!(job && job.sent && body && sameMessage(job, body, expiry));
  }

  function init(context) {
    ctx = context;
    var dlg = $("resultDialog");
    dlg.addEventListener("cancel", function (e) { if (job && job.inflight) e.preventDefault(); });
    dlg.addEventListener("close", function () {
      clearTimeout(tick);
      document.body.removeAttribute("data-modal");
      $("submitBtn").focus({ preventScroll: true });
    });
    $("resultClose").addEventListener("click", function () { if (!(job && job.inflight)) dlg.close(); });
    dlg.addEventListener("click", function (e) {
      if (e.target !== dlg || (job && job.inflight) || Date.now() - openedAt < BACKDROP_GRACE_MS) return;
      var r = dlg.getBoundingClientRect();
      var inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
      if (!inside) dlg.close();
    });
  }

  function busy() { return !!(job && job.inflight); }

  OM.submit = { init: init, open: open, busy: busy, sentFor: sentFor, retryWait: retryWait, reasonOf: reasonOf };
})();
