/* 信稀塾 勉強タイプ診断：講師用・生徒用で共通の画面処理。ページごとの表示は opts.render で受け取る。 */
(function (global) {
  'use strict';
  var C = global.SinkiCore;

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return {'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c];
    });
  }

  function buildQuestions(box, onChange) {
    C.QUESTIONS.forEach(function (q, i) {
      var opts = q.opts || C.LIKERT;
      var html = '<div class="qbox" role="radiogroup" aria-labelledby="ql-' + q.id + '">' +
        '<span class="qtext" id="ql-' + q.id + '">Q' + (i + 1) + '. ' + esc(q.text) + '</span><div class="opts">';
      opts.forEach(function (o, j) {
        html += '<label><input type="radio" name="' + q.id + '" value="' + j + '">' + esc(o) + '</label>';
      });
      box.insertAdjacentHTML('beforeend', html + '</div></div>');
    });
    box.addEventListener('change', onChange);
  }

  function readAnswers() {
    var ans = {};
    C.QUESTIONS.forEach(function (q) {
      var el = document.querySelector('input[name="' + q.id + '"]:checked');
      ans[q.id] = el ? Number(el.value) : null;
    });
    return ans;
  }

  function init(opts) {
    document.addEventListener('DOMContentLoaded', function () {
      var bar = document.getElementById('progressBar');
      buildQuestions(document.getElementById('questions'), function () {
        if (!bar) return;
        var ans = readAnswers(), done = 0;
        C.QUESTIONS.forEach(function (q) { if (ans[q.id] !== null) done++; });
        bar.style.width = (done / C.QUESTIONS.length * 100) + '%';
      });

      document.getElementById('run').addEventListener('click', function () {
        var err = document.getElementById('err');
        err.textContent = '';
        var birth = document.getElementById('birth') ? document.getElementById('birth').value : '';
        var ans = readAnswers();
        var r = C.diagnose(ans, birth);
        if (r.missing) { err.textContent = (opts.missingText || '未回答があります：') + r.missing.join('、'); return; }
        r.answers = ans;

        document.getElementById('typeName').textContent = r.type.name;
        document.getElementById('typeCatch').textContent = r.type.catch;
        var MAX = 5.5, pos = function (v) { return (50 + Math.max(-1, Math.min(1, v / MAX)) * 50) + '%'; };
        document.getElementById('dotA').style.left = pos(r.A);
        document.getElementById('dotB').style.left = pos(r.B);

        document.getElementById('copyText').value = opts.render(r, esc);
        var res = document.getElementById('result');
        res.classList.remove('hidden');
        res.scrollIntoView({behavior: 'smooth'});
      });

      document.getElementById('copy').addEventListener('click', function () {
        var ta = document.getElementById('copyText');
        var done = function () { document.getElementById('copied').textContent = 'コピーしました'; };
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(ta.value).then(done, function () { ta.select(); document.execCommand('copy'); done(); });
        } else { ta.select(); document.execCommand('copy'); done(); }
      });
    });
  }

  global.SinkiUI = {init: init, esc: esc};
})(window);
