(function () {
  "use strict";

  var OM = window.OM = window.OM || {};

  var ACCEPTED = [200, 201, 202];
  var RETRYABLE = [408, 425, 429];
  var FIELD_NAME = {
    "texts.uz.title": "Ўзбекча сарлавҳа", "texts.uz.body": "Ўзбекча матн",
    "texts.ru.title": "Русча сарлавҳа", "texts.ru.body": "Русча матн",
    "audience.org_type": "Ташкилот тури", "audience": "Қамров",
    "severity": "Муҳимлиги", "expires_at": "Амал қилиш муддати"
  };
  var MAX_ERRORS = 5;

  function label(path) {
    var key = Object.keys(FIELD_NAME).filter(function (p) {
      return path === p || path.indexOf(p + ".") === 0 || path.indexOf("payload." + p) === 0;
    }).sort(function (a, b) { return b.length - a.length; })[0];
    return key ? FIELD_NAME[key] : path;
  }

  function fieldErrors(data) {
    var errs = data && data.errors, out = [];
    if (Array.isArray(errs)) {
      errs.forEach(function (e) { if (e && e.field) out.push(label(String(e.field)) + ": " + String(e.message || "")); });
    } else if (errs && typeof errs === "object") {
      Object.keys(errs).forEach(function (k) { out.push(label(k) + ": " + String(errs[k])); });
    }
    return out.slice(0, MAX_ERRORS);
  }

  function readBody(res) {
    var type = (res.headers.get("content-type") || "").toLowerCase();
    return res.text().then(function (text) {
      if (type.indexOf("application/json") < 0) return { json: false, type: type || "—" };
      try {
        var data = JSON.parse(text);
        return { json: !!data && typeof data === "object", data: data, type: type };
      } catch (err) { return { json: false, type: type }; }
    });
  }

  function classify(res, body) {
    if (res.status === 409) return { kind: "duplicate", status: 409 };
    if (ACCEPTED.indexOf(res.status) > -1 && body.json) {
      var id = body.data.event_id != null ? body.data.event_id : body.data.id;
      return { kind: "sent", status: res.status, eventId: id == null ? null : String(id) };
    }
    if (res.ok) return { kind: "unknown", status: res.status, type: body.type };
    return {
      kind: "rejected", status: res.status, errors: body.json ? fieldErrors(body.data) : [],
      retry: res.status >= 500 || RETRYABLE.indexOf(res.status) > -1
    };
  }

  function post(url, payload, key, timeoutMs) {
    var ctrl = window.AbortController ? new AbortController() : null;
    var timer = setTimeout(function () { if (ctrl) ctrl.abort(); }, timeoutMs);
    return fetch(url, {
      method: "POST",
      redirect: "error",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json", "Idempotency-Key": key },
      body: JSON.stringify(payload),
      signal: ctrl ? ctrl.signal : undefined
    }).then(function (res) {
      return readBody(res).then(function (body) { return classify(res, body); });
    }).catch(function (err) {
      return { kind: err && err.name === "AbortError" ? "timeout" : "network" };
    }).then(function (outcome) {
      clearTimeout(timer);
      return outcome;
    });
  }

  OM.transport = { post: post, classify: classify, fieldErrors: fieldErrors };
})();
