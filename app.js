(function () {
  'use strict';

  var KEY = 'sat-tracker-v1';
  var TOPICS = [
    { group: 'Reading & Writing', items: [
      ['rw-craft', 'Craft and Structure', 'Vocabulary in context, text structure, cross-text connections'],
      ['rw-info', 'Information and Ideas', 'Central ideas, evidence, inferences, charts and data'],
      ['rw-conv', 'Standard English Conventions', 'Grammar, punctuation, sentence boundaries'],
      ['rw-expr', 'Expression of Ideas', 'Transitions, rhetorical synthesis']
    ]},
    { group: 'Math', items: [
      ['m-alg', 'Algebra', 'Linear equations, systems, inequalities, functions'],
      ['m-adv', 'Advanced Math', 'Quadratics, polynomials, exponentials, nonlinear equations'],
      ['m-data', 'Problem-Solving and Data Analysis', 'Ratios, percentages, statistics, probability'],
      ['m-geo', 'Geometry and Trigonometry', 'Area, volume, circles, triangles, trig']
    ]}
  ];
  var ALL_TOPICS = [];
  TOPICS.forEach(function (g) { g.items.forEach(function (t) { ALL_TOPICS.push({ id: t[0], name: t[1], group: g.group }); }); });
  var DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  function defaults() {
    return { profile: { name: '', testDate: '', target: 1400 }, scores: [], topics: {}, sessions: [], genDays: [1, 3, 5, 6] };
  }
  var state = load();

  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      if (raw) { return Object.assign(defaults(), JSON.parse(raw)); }
    } catch (e) {}
    return defaults();
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { alert('Could not save data in this browser.'); }
  }
  function $(id) { return document.getElementById(id); }
  function uid() { return Math.random().toString(36).slice(2, 10); }
  function iso(d) {
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  function parse(s) { var p = s.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function today() { var d = new Date(); d.setHours(0, 0, 0, 0); return d; }
  function esc(s) { var d = document.createElement('div'); d.textContent = s == null ? '' : s; return d.innerHTML; }
  function fmtDate(s) { return parse(s).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' }); }
  function mondayOf(d) { var x = new Date(d); var wd = (x.getDay() + 6) % 7; x.setDate(x.getDate() - wd); x.setHours(0, 0, 0, 0); return x; }
  function topicName(id) { var t = ALL_TOPICS.filter(function (x) { return x.id === id; })[0]; return t ? t.name : id; }
  function mastery(id) { return state.topics[id] || 3; }

  /* ---------- tabs ---------- */
  document.querySelectorAll('.tab').forEach(function (b) {
    b.addEventListener('click', function () {
      document.querySelectorAll('.tab').forEach(function (x) { x.classList.remove('active'); });
      document.querySelectorAll('.panel').forEach(function (x) { x.classList.remove('active'); });
      b.classList.add('active');
      $(b.dataset.tab).classList.add('active');
      renderAll();
    });
  });

  /* ---------- scores ---------- */
  $('s-date').value = iso(new Date());
  $('score-form').addEventListener('submit', function (e) {
    e.preventDefault();
    state.scores.push({
      id: uid(), date: $('s-date').value, name: $('s-name').value.trim(),
      rw: +$('s-rw').value, math: +$('s-math').value, notes: $('s-notes').value.trim()
    });
    state.scores.sort(function (a, b) { return a.date < b.date ? -1 : 1; });
    save();
    $('s-name').value = ''; $('s-rw').value = ''; $('s-math').value = ''; $('s-notes').value = '';
    renderAll();
  });

  function renderScores() {
    var tb = document.querySelector('#score-table tbody');
    if (!state.scores.length) { tb.innerHTML = '<tr><td colspan="7" class="empty">No practice tests logged yet.</td></tr>'; return; }
    tb.innerHTML = state.scores.slice().reverse().map(function (s) {
      return '<tr><td>' + esc(s.date) + '</td><td>' + esc(s.name) + '</td><td>' + s.rw + '</td><td>' + s.math +
        '</td><td><strong>' + (s.rw + s.math) + '</strong></td><td>' + esc(s.notes) +
        '</td><td class="x"><button data-del-score="' + s.id + '" title="Delete">✕</button></td></tr>';
    }).join('');
    tb.querySelectorAll('[data-del-score]').forEach(function (b) {
      b.addEventListener('click', function () {
        if (!confirm('Delete this result?')) return;
        state.scores = state.scores.filter(function (s) { return s.id !== b.dataset.delScore; });
        save(); renderAll();
      });
    });
  }

  /* ---------- chart ---------- */
  function renderChart() {
    var el = $('chart');
    var pts = state.scores;
    if (!pts.length) { el.innerHTML = '<p class="empty">Log a practice test to see the trend.</p>'; return; }
    var W = 700, H = 260, L = 44, R = 16, T = 14, B = 34;
    var target = +state.profile.target || null;
    var vals = [];
    pts.forEach(function (s) { vals.push(s.rw + s.math, s.rw, s.math); });
    if (target) vals.push(target);
    var min = Math.floor((Math.min.apply(null, vals) - 50) / 100) * 100;
    var max = Math.ceil((Math.max.apply(null, vals) + 50) / 100) * 100;
    min = Math.max(min, 200); max = Math.min(Math.max(max, min + 200), 1600);
    function x(i) { return pts.length === 1 ? (L + W - R) / 2 : L + i * (W - L - R) / (pts.length - 1); }
    function y(v) { return T + (max - v) * (H - T - B) / (max - min); }
    var s = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Score trend chart">';
    var step = (max - min) > 600 ? 200 : 100;
    for (var v = min; v <= max; v += step) {
      s += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + y(v) + '" y2="' + y(v) + '" stroke="var(--line)"/>' +
        '<text x="' + (L - 6) + '" y="' + (y(v) + 4) + '" text-anchor="end" font-size="11" fill="var(--muted)">' + v + '</text>';
    }
    if (target) s += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + y(target) + '" y2="' + y(target) + '" stroke="var(--c-target)" stroke-dasharray="6 4" stroke-width="2"/>';
    function line(fn, color) {
      var d = pts.map(function (p, i) { return (i ? 'L' : 'M') + x(i) + ' ' + y(fn(p)); }).join(' ');
      var out = '<path d="' + d + '" fill="none" stroke="' + color + '" stroke-width="2.5"/>';
      pts.forEach(function (p, i) { out += '<circle cx="' + x(i) + '" cy="' + y(fn(p)) + '" r="3.5" fill="' + color + '"><title>' + p.date + ': ' + fn(p) + '</title></circle>'; });
      return out;
    }
    // section scores are 200-800; plot them on their own scale, scaled to total range for readability
    s += line(function (p) { return p.rw + p.math; }, 'var(--c-total)');
    s += '</svg>';
    el.innerHTML = s;
    // second small chart for sections
    var sec = '<svg viewBox="0 0 ' + W + ' 200" role="img" aria-label="Section score chart" style="margin-top:12px">';
    var smin = 200, smax = 800;
    function ys(v) { return 10 + (smax - v) * (200 - 10 - 30) / (smax - smin); }
    [200, 400, 600, 800].forEach(function (v) {
      sec += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + ys(v) + '" y2="' + ys(v) + '" stroke="var(--line)"/>' +
        '<text x="' + (L - 6) + '" y="' + (ys(v) + 4) + '" text-anchor="end" font-size="11" fill="var(--muted)">' + v + '</text>';
    });
    function sline(fn, color) {
      var d = pts.map(function (p, i) { return (i ? 'L' : 'M') + x(i) + ' ' + ys(fn(p)); }).join(' ');
      var out = '<path d="' + d + '" fill="none" stroke="' + color + '" stroke-width="2.5"/>';
      pts.forEach(function (p, i) { out += '<circle cx="' + x(i) + '" cy="' + ys(fn(p)) + '" r="3.5" fill="' + color + '"><title>' + p.date + ': ' + fn(p) + '</title></circle>'; });
      return out;
    }
    sec += sline(function (p) { return p.rw; }, 'var(--c-rw)') + sline(function (p) { return p.math; }, 'var(--c-math)');
    pts.forEach(function (p, i) {
      if (pts.length <= 8 || i % Math.ceil(pts.length / 8) === 0) {
        sec += '<text x="' + x(i) + '" y="192" text-anchor="middle" font-size="10" fill="var(--muted)">' + p.date.slice(5) + '</text>';
      }
    });
    sec += '</svg>';
    el.innerHTML += sec;
  }

  /* ---------- topics ---------- */
  function renderTopics() {
    var html = '';
    TOPICS.forEach(function (g) {
      html += '<div class="group-title">' + g.group + '</div>';
      g.items.forEach(function (t) {
        var m = mastery(t[0]);
        html += '<div class="topic"><span class="name">' + t[1] + '</span><div class="stars">';
        for (var i = 1; i <= 5; i++) html += '<button data-topic="' + t[0] + '" data-v="' + i + '" class="' + (i === m ? 'on' : '') + '">' + i + '</button>';
        html += '</div><span class="desc">' + t[2] + '</span></div>';
      });
    });
    $('topic-list').innerHTML = html;
    $('topic-list').querySelectorAll('button').forEach(function (b) {
      b.addEventListener('click', function () { state.topics[b.dataset.topic] = +b.dataset.v; save(); renderAll(); });
    });
  }

  /* ---------- schedule ---------- */
  function renderDayPicker() {
    $('day-picker').innerHTML = [1, 2, 3, 4, 5, 6, 0].map(function (d) {
      return '<label><input type="checkbox" value="' + d + '"' + (state.genDays.indexOf(d) > -1 ? ' checked' : '') + '>' + DAYS[d] + '</label>';
    }).join('');
    $('day-picker').querySelectorAll('input').forEach(function (c) {
      c.addEventListener('change', function () {
        state.genDays = Array.prototype.map.call($('day-picker').querySelectorAll('input:checked'), function (i) { return +i.value; });
        save();
      });
    });
  }

  $('generate').addEventListener('click', function () {
    var testDate = state.profile.testDate;
    if (!testDate) { alert('Set the SAT test date in Settings first.'); return; }
    if (!state.genDays.length) { alert('Pick at least one study day.'); return; }
    var minutes = Math.max(15, +$('g-min').value || 60);
    var testEvery = +$('g-test').value;
    var start = today(), end = parse(testDate);
    if (end < start) { alert('The test date is in the past. Update it in Settings.'); return; }
    var limit = new Date(start); limit.setDate(limit.getDate() + 84);
    if (end > limit) end = limit;
    if (!confirm('This replaces all upcoming sessions that are not completed. Continue?')) return;
    var todayIso = iso(start);
    state.sessions = state.sessions.filter(function (s) { return s.done || s.date < todayIso; });

    // smooth weighted round-robin: weaker topics get picked more often
    var weights = {}, credit = {}, totalW = 0;
    ALL_TOPICS.forEach(function (t) { weights[t.id] = 6 - mastery(t.id); credit[t.id] = 0; totalW += weights[t.id]; });
    function pickTopic() {
      var best = null;
      ALL_TOPICS.forEach(function (t) { credit[t.id] += weights[t.id]; if (best === null || credit[t.id] > credit[best]) best = t.id; });
      credit[best] -= totalW;
      return best;
    }
    var startMon = mondayOf(start), added = 0;
    for (var d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      if (state.genDays.indexOf(d.getDay()) === -1) continue;
      var weekIdx = Math.floor((mondayOf(d) - startMon) / (7 * 864e5));
      var lastDayOfWeek = state.genDays.slice().sort(function (a, b) { return ((a + 6) % 7) - ((b + 6) % 7); }).pop();
      var isTest = testEvery > 0 && (weekIdx % testEvery === testEvery - 1) && d.getDay() === lastDayOfWeek;
      if (isTest) {
        state.sessions.push({ id: uid(), date: iso(d), topic: 'Full practice test (Bluebook) + review mistakes', minutes: 180, done: false });
      } else {
        state.sessions.push({ id: uid(), date: iso(d), topic: topicName(pickTopic()) + ' – practice & review', minutes: minutes, done: false });
      }
      added++;
    }
    save(); renderAll();
    alert(added + ' sessions planned.');
  });

  $('session-form').addEventListener('submit', function (e) {
    e.preventDefault();
    state.sessions.push({ id: uid(), date: $('a-date').value, topic: $('a-topic').value.trim(), minutes: +$('a-min').value, done: false });
    save(); $('a-topic').value = ''; renderAll();
  });
  $('a-date').value = iso(new Date());
  $('hide-done').addEventListener('change', renderSessions);
  $('clear-future').addEventListener('click', function () {
    if (!confirm('Remove all upcoming sessions that are not completed?')) return;
    var t = iso(today());
    state.sessions = state.sessions.filter(function (s) { return s.done || s.date < t; });
    save(); renderAll();
  });

  function renderSessions() {
    var list = state.sessions.slice().sort(function (a, b) { return a.date < b.date ? -1 : a.date > b.date ? 1 : 0; });
    if ($('hide-done').checked) list = list.filter(function (s) { return !s.done; });
    if (!list.length) { $('session-list').innerHTML = '<p class="empty">No sessions yet. Generate a plan or add one above.</p>'; return; }
    var t = iso(today()), html = '', lastWeek = '';
    list.forEach(function (s) {
      var wk = iso(mondayOf(parse(s.date)));
      if (wk !== lastWeek) { html += '<div class="week-title">Week of ' + fmtDate(wk) + '</div>'; lastWeek = wk; }
      var cls = 'session' + (s.done ? ' done' : '') + (s.date === t ? ' today' : '') + (!s.done && s.date < t ? ' overdue' : '');
      html += '<div class="' + cls + '"><input type="checkbox" data-done="' + s.id + '"' + (s.done ? ' checked' : '') + '>' +
        '<span class="sdate">' + fmtDate(s.date) + '</span><span class="stopic">' + esc(s.topic) + '</span>' +
        '<span class="smin">' + s.minutes + ' min</span><button data-del="' + s.id + '" title="Delete">✕</button></div>';
    });
    $('session-list').innerHTML = html;
    $('session-list').querySelectorAll('[data-done]').forEach(function (c) {
      c.addEventListener('change', function () {
        state.sessions.forEach(function (s) { if (s.id === c.dataset.done) s.done = c.checked; });
        save(); renderAll();
      });
    });
    $('session-list').querySelectorAll('[data-del]').forEach(function (b) {
      b.addEventListener('click', function () {
        state.sessions = state.sessions.filter(function (s) { return s.id !== b.dataset.del; });
        save(); renderAll();
      });
    });
  }

  /* ---------- dashboard ---------- */
  function renderDashboard() {
    var p = state.profile;
    $('greeting').textContent = p.name ? 'Keep going, ' + p.name + '! 💪' : 'Set your name and test date in Settings.';
    var days = '–';
    if (p.testDate) {
      var n = Math.round((parse(p.testDate) - today()) / 864e5);
      days = n >= 0 ? n : 'Done';
    }
    $('k-days').textContent = days;
    var sc = state.scores, latest = sc.length ? sc[sc.length - 1] : null;
    var best = sc.reduce(function (m, s) { return Math.max(m, s.rw + s.math); }, 0);
    $('k-latest').textContent = latest ? latest.rw + latest.math : '–';
    $('k-best').textContent = best || '–';
    $('k-target').textContent = p.target || '–';
    var gap = p.target && latest ? p.target - (latest.rw + latest.math) : null;
    $('k-gap').textContent = gap === null ? '' : gap > 0 ? gap + ' points to go' : 'Target reached 🎉';

    var mon = mondayOf(today()), sun = new Date(mon); sun.setDate(sun.getDate() + 6);
    var wk = state.sessions.filter(function (s) { return s.date >= iso(mon) && s.date <= iso(sun); });
    var doneMin = wk.filter(function (s) { return s.done; }).reduce(function (a, s) { return a + s.minutes; }, 0);
    var planMin = wk.reduce(function (a, s) { return a + s.minutes; }, 0);
    $('k-week').textContent = (doneMin / 60).toFixed(1).replace('.0', '') + 'h';
    $('k-week-sub').textContent = planMin ? 'of ' + (planMin / 60).toFixed(1).replace('.0', '') + 'h planned' : 'nothing planned';
    var done = state.sessions.filter(function (s) { return s.done; }).length;
    $('k-done').textContent = done;
    $('k-done-sub').textContent = 'of ' + state.sessions.length + ' total';

    var sorted = ALL_TOPICS.slice().sort(function (a, b) { return mastery(a.id) - mastery(b.id); }).slice(0, 3);
    $('focus').innerHTML = sorted.map(function (t) {
      return '<div class="focus-item"><span>' + t.name + ' <span class="badge">' + t.group + '</span></span><span>Confidence ' + mastery(t.id) + '/5</span></div>';
    }).join('');

    var t = iso(today());
    var next = state.sessions.filter(function (s) { return !s.done && s.date >= t; })
      .sort(function (a, b) { return a.date < b.date ? -1 : 1; }).slice(0, 3);
    var overdue = state.sessions.filter(function (s) { return !s.done && s.date < t; }).length;
    var html = overdue ? '<p class="hint" style="color:var(--bad)">' + overdue + ' earlier session(s) not yet ticked off.</p>' : '';
    html += next.length ? next.map(function (s) {
      return '<div class="focus-item"><span>' + fmtDate(s.date) + ' – ' + esc(s.topic) + '</span><span>' + s.minutes + ' min</span></div>';
    }).join('') : '<p class="empty">Nothing scheduled. Head to the Schedule tab.</p>';
    $('upnext').innerHTML = html;
  }

  /* ---------- settings ---------- */
  $('p-name').value = state.profile.name;
  $('p-date').value = state.profile.testDate;
  $('p-target').value = state.profile.target;
  $('save-profile').addEventListener('click', function () {
    state.profile = { name: $('p-name').value.trim(), testDate: $('p-date').value, target: +$('p-target').value || 1400 };
    save(); renderAll(); alert('Saved.');
  });
  $('export').addEventListener('click', function () {
    var blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'sat-tracker-backup-' + iso(new Date()) + '.json';
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
  });
  $('import').addEventListener('change', function (e) {
    var f = e.target.files[0]; if (!f) return;
    var r = new FileReader();
    r.onload = function () {
      try {
        var d = JSON.parse(r.result);
        if (!d || typeof d !== 'object' || !Array.isArray(d.scores)) throw new Error('bad');
        if (!confirm('Replace current data with this backup?')) return;
        state = Object.assign(defaults(), d); save();
        $('p-name').value = state.profile.name; $('p-date').value = state.profile.testDate; $('p-target').value = state.profile.target;
        renderAll();
      } catch (err) { alert('That file is not a valid backup.'); }
    };
    r.readAsText(f);
    e.target.value = '';
  });
  $('reset').addEventListener('click', function () {
    if (!confirm('Erase ALL data in this browser? This cannot be undone.')) return;
    state = defaults(); save();
    $('p-name').value = ''; $('p-date').value = ''; $('p-target').value = 1400;
    renderAll();
  });

  function renderAll() {
    renderDashboard(); renderChart(); renderScores(); renderTopics(); renderDayPicker(); renderSessions();
  }
  renderAll();
})();
