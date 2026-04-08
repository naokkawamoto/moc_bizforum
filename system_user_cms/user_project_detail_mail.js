(function () {
  'use strict';

  fetch('user_header.html').then(function (r) { return r.text(); }).then(function (html) {
    var el = document.getElementById('header-container');
    if (el) el.innerHTML = html;
  }).catch(function () {});
  fetch('user_footer.html').then(function (r) { return r.text(); }).then(function (html) {
    var el = document.getElementById('footer-container');
    if (el) el.innerHTML = html;
  }).catch(function () {});

  document.addEventListener('DOMContentLoaded', function () {
    var MAIL_KEYS = ['mail1', 'mail2', 'mail3', 'mail4'];
    var MAIL_LABELS = { mail1: 'メール1', mail2: 'メール2', mail3: 'メール3', mail4: 'メール4' };

    var SALES_STAFF_META = {
      yamada: { staffId: 'yamada', name: '山田 太郎' },
      sato: { staffId: 'sato', name: '佐藤 花子' },
      suzuki: { staffId: 'suzuki', name: '鈴木 次郎' },
      takahashi: { staffId: 'yamada', name: '高橋 誠' },
      watanabe: { staffId: 'suzuki', name: '渡辺 直樹' }
    };
    var names = ['田中 一郎', '高橋 美咲', '伊藤 健太', '渡辺 真理子', '山本 翔', '中村 恵子', '小林 直樹', '加藤 優', '吉田 さくら', '松本 大輔'];
    var companies = ['株式会社サンプル', 'サンプル商事株式会社', '東京テック株式会社', '株式会社グローバル企画', 'デジタルイノベーション株式会社'];
    var visitorDepts = ['マーケティング部', '開発本部', '人事総務', '研究開発室', '海外営業'];
    var visitorSessions = ['セッションA', 'ネットワーキング', '基調講演', 'ダイアログ', 'セッションB'];
    var salesKeyRotation = ['yamada', 'sato', 'suzuki', 'takahashi', 'watanabe'];

    var visitorData = [];
    for (var i = 0; i < 100; i++) {
      var salesMeta = SALES_STAFF_META[salesKeyRotation[i % salesKeyRotation.length]];
      var mail1Sent = i < 60;
      var mail2Sent = i < 30;
      var mail3Sent = i < 10;
      var mail4Sent = i < 5;
      visitorData.push({
        userid: 'U' + String(i + 1).padStart(3, '0'),
        company: companies[i % companies.length],
        dept: visitorDepts[i % visitorDepts.length],
        name: names[i % names.length],
        email: 'guest' + String(i + 1).padStart(3, '0') + '@example.com',
        session: visitorSessions[i % visitorSessions.length],
        staffId: salesMeta.staffId,
        staffName: salesMeta.name,
        mail1Sent: mail1Sent,
        mail2Sent: mail2Sent,
        mail3Sent: mail3Sent,
        mail4Sent: mail4Sent
      });
    }

    var filterStaff = document.getElementById('filterStaff');
    var filterName = document.getElementById('filterName');
    var filterMail1 = document.getElementById('filterMail1');
    var filterMail2 = document.getElementById('filterMail2');
    var filterMail3 = document.getElementById('filterMail3');
    var filterMail4 = document.getElementById('filterMail4');
    var btnApply = document.getElementById('btnApply');
    var btnReset = document.getElementById('btnReset');
    var perPageSelect = document.getElementById('perPage');
    var tbody = document.getElementById('visitorTbody');
    var countLabel = document.getElementById('countLabel');
    var pageInfo = document.getElementById('pageInfo');
    var paginationList = document.getElementById('paginationList');
    var currentPage = 1;
    var filteredData = [];

    var autoDeliverySchedules = {
      mail1: { year: 2026, month: 2, day: 26, hour: 10, minute: 0 },
      mail2: { year: 2026, month: 3, day: 4, hour: 9, minute: 0 },
      mail3: { year: 2026, month: 3, day: 4, hour: 14, minute: 0 },
      mail4: { year: 2026, month: 3, day: 5, hour: 8, minute: 0 }
    };
    var mailSendHistory = { mail1: [], mail2: [], mail3: [], mail4: [] };
    var pendingSendUnsentKey = null;

    function pad2(n) { n = parseInt(n, 10) || 0; return (n < 10 ? '0' : '') + n; }
    function escapeHtml(s) { return s == null ? '' : String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
    function formatJpDateOnly(d) { return d.getFullYear() + '年' + (d.getMonth() + 1) + '月' + d.getDate() + '日'; }
    function formatJpTimeHm(d) { return d.getHours() + '時' + pad2(d.getMinutes()) + '分'; }
    function formatJpDeliveryDatetime(s) { return s.year + '年' + s.month + '月' + s.day + '日' + s.hour + '時' + pad2(s.minute) + '分'; }

    function updateDeliveryDatetimeDisplay() {
      MAIL_KEYS.forEach(function (k) {
        var el = document.getElementById('deliveryDatetime' + k.charAt(0).toUpperCase() + k.slice(1));
        if (el) el.textContent = formatJpDeliveryDatetime(autoDeliverySchedules[k]);
      });
    }

    function setCount(id, val) { var el = document.getElementById(id); if (el) el.textContent = val; }

    function updateMailDeliveryCounts() {
      var total = visitorData.length;
      MAIL_KEYS.forEach(function (k) {
        var sent = visitorData.filter(function (v) { return v[k + 'Sent']; }).length;
        var unsent = total - sent;
        setCount('mailTotalCount' + k.charAt(0).toUpperCase() + k.slice(1), total);
        setCount('mailSentCount' + k.charAt(0).toUpperCase() + k.slice(1), sent);
        setCount('mailUnsentCount' + k.charAt(0).toUpperCase() + k.slice(1), unsent);
        var btn = document.querySelector('.btn-send-unsent-' + k);
        if (btn) btn.disabled = unsent === 0;
      });
    }

    function visitorSearchMatches(v, q) {
      if (!q) return true;
      return (v.name + ' ' + v.company).indexOf(q) >= 0;
    }

    function getFiltered() {
      var staffVal = filterStaff ? filterStaff.value : '';
      var nameVal = filterName ? filterName.value.trim() : '';
      var mailVals = {
        mail1: filterMail1 ? filterMail1.value : '',
        mail2: filterMail2 ? filterMail2.value : '',
        mail3: filterMail3 ? filterMail3.value : '',
        mail4: filterMail4 ? filterMail4.value : ''
      };
      return visitorData.filter(function (v) {
        var okStaff = !staffVal || v.staffId === staffVal;
        var okName = visitorSearchMatches(v, nameVal);
        var okMails = MAIL_KEYS.every(function (k) {
          var val = mailVals[k];
          if (!val) return true;
          return val === 'sent' ? !!v[k + 'Sent'] : !v[k + 'Sent'];
        });
        return okStaff && okName && okMails;
      });
    }

    function renderRow(v) {
      var tr = document.createElement('tr');
      tr.innerHTML =
        '<td>' + v.userid + '</td>' +
        '<td>' + v.name + '</td>' +
        '<td>' + v.company + '</td>' +
        '<td>' + v.staffName + '</td>' +
        MAIL_KEYS.map(function (k) {
          return '<td class="text-center">' + (v[k + 'Sent'] ? '<span class="badge bg-success">送信済</span>' : '<span class="badge bg-secondary">未送信</span>') + '</td>';
        }).join('');
      return tr;
    }

    function render() {
      filteredData = getFiltered();
      var perPageVal = perPageSelect ? parseInt(perPageSelect.value, 10) : 50;
      var perPage = Math.max(1, perPageVal || 50);
      var totalPages = Math.max(1, Math.ceil(filteredData.length / perPage));
      if (currentPage > totalPages) currentPage = totalPages;
      var start = (currentPage - 1) * perPage;
      var end = Math.min(start + perPage, filteredData.length);
      var pageData = filteredData.slice(start, end);
      if (countLabel) countLabel.textContent = '全' + filteredData.length + '件';
      if (pageInfo) pageInfo.textContent = filteredData.length === 0 ? '0件' : (start + 1) + '-' + end + '件目を表示（' + currentPage + '/' + totalPages + 'ページ）';
      if (tbody) {
        tbody.innerHTML = '';
        pageData.forEach(function (v) { tbody.appendChild(renderRow(v)); });
      }
      updateMailDeliveryCounts();
      if (!paginationList) return;
      paginationList.innerHTML = '';
      if (totalPages <= 1) return;
      var liPrev = document.createElement('li');
      liPrev.className = 'page-item' + (currentPage === 1 ? ' disabled' : '');
      liPrev.innerHTML = '<a class="page-link" href="#">«</a>';
      if (currentPage > 1) liPrev.querySelector('a').onclick = function (e) { e.preventDefault(); currentPage--; render(); };
      paginationList.appendChild(liPrev);
      var from = Math.max(1, currentPage - 2), to = Math.min(totalPages, currentPage + 2);
      for (var p = from; p <= to; p++) {
        var li = document.createElement('li');
        li.className = 'page-item' + (p === currentPage ? ' active' : '');
        li.innerHTML = '<a class="page-link" href="#">' + p + '</a>';
        (function (x) { li.querySelector('a').onclick = function (e) { e.preventDefault(); currentPage = x; render(); }; })(p);
        paginationList.appendChild(li);
      }
      var liNext = document.createElement('li');
      liNext.className = 'page-item' + (currentPage === totalPages ? ' disabled' : '');
      liNext.innerHTML = '<a class="page-link" href="#">»</a>';
      if (currentPage < totalPages) liNext.querySelector('a').onclick = function (e) { e.preventDefault(); currentPage++; render(); };
      paginationList.appendChild(liNext);
    }

    function openSendUnsentModal(key) {
      var prop = key + 'Sent';
      var unsent = visitorData.filter(function (v) { return !v[prop]; });
      if (unsent.length === 0) return;
      pendingSendUnsentKey = key;
      var label = MAIL_LABELS[key] || key;
      var intro = document.getElementById('sendUnsentModalIntro');
      if (intro) intro.textContent = '「' + label + '」を、以下 ' + Math.min(40, unsent.length) + ' 件の宛先に送信します。';
      var title = document.getElementById('sendUnsentMailModalLabel');
      if (title) title.textContent = '未送信ユーザーへの送信（' + label + '）';
      var body = document.getElementById('sendUnsentModalTbody');
      if (body) {
        body.innerHTML = '';
        unsent.slice(0, 40).forEach(function (v) {
          var tr = document.createElement('tr');
          tr.innerHTML = '<td>' + escapeHtml(v.email) + '</td><td>' + escapeHtml(v.company) + '</td><td>' + escapeHtml(v.name) + '</td>';
          body.appendChild(tr);
        });
      }
      new bootstrap.Modal(document.getElementById('sendUnsentMailModal')).show();
    }

    function executeSendUnsent() {
      var key = pendingSendUnsentKey;
      if (!key) return;
      var prop = key + 'Sent';
      var unsent = visitorData.filter(function (v) { return !v[prop]; });
      unsent.forEach(function (v) { v[prop] = true; });
      if (!mailSendHistory[key]) mailSendHistory[key] = [];
      if (unsent.length) mailSendHistory[key].push({ at: new Date(), count: unsent.length });
      var inst = bootstrap.Modal.getInstance(document.getElementById('sendUnsentMailModal'));
      if (inst) inst.hide();
      pendingSendUnsentKey = null;
      render();
      alert((MAIL_LABELS[key] || key) + 'を未送信ユーザー ' + unsent.length + ' 件に送信しました。');
    }

    function renderMailSendHistoryTable(key) {
      var tb = document.getElementById('mailSendHistoryModalTbody');
      if (!tb) return;
      var list = (mailSendHistory[key] || []).slice().sort(function (a, b) { return b.at - a.at; });
      tb.innerHTML = '';
      if (!list.length) {
        tb.innerHTML = '<tr><td colspan="3" class="text-center text-muted py-3">送信履歴はまだありません。</td></tr>';
        return;
      }
      list.forEach(function (r) {
        var tr = document.createElement('tr');
        tr.innerHTML = '<td>' + formatJpDateOnly(r.at) + '</td><td>' + formatJpTimeHm(r.at) + '</td><td class="text-end">' + r.count + '件</td>';
        tb.appendChild(tr);
      });
    }

    window.openMailSendHistoryModal = function (key) {
      var label = MAIL_LABELS[key] || key;
      var title = document.getElementById('mailSendHistoryModalLabel');
      var lead = document.getElementById('mailSendHistoryModalLead');
      if (title) title.textContent = '送信履歴（' + label + '）';
      if (lead) lead.textContent = '「' + label + '」の送信履歴です。';
      renderMailSendHistoryTable(key);
      new bootstrap.Modal(document.getElementById('mailSendHistoryModal')).show();
    };

    var mailTemplates = {
      mail1: { subject: '【リマインド】イベントのご案内（メール1）', body: '{{氏名}} 様\n\nメール1本文です。' },
      mail2: { subject: '【ご案内】イベントのご案内（メール2）', body: '{{氏名}} 様\n\nメール2本文です。' },
      mail3: { subject: '【当日】イベントのご案内（メール3）', body: '{{氏名}} 様\n\nメール3本文です。' },
      mail4: { subject: '【最終】イベントのご案内（メール4）', body: '{{氏名}} 様\n\nメール4本文です。' }
    };
    var currentMailKey = '';
    window.openMailContentModal = function (key) {
      currentMailKey = key;
      var label = MAIL_LABELS[key] || key;
      var title = document.getElementById('mailContentModalLabel');
      if (title) title.textContent = 'リマインドメール 内容確認・編集（' + label + '）';
      var subj = document.getElementById('mailContentSubject');
      var txt = document.getElementById('mailContentText');
      if (mailTemplates[key]) {
        if (subj) subj.value = mailTemplates[key].subject;
        if (txt) txt.value = mailTemplates[key].body;
      }
      new bootstrap.Modal(document.getElementById('mailContentModal')).show();
    };

    var saveBtn = document.getElementById('mailContentSaveBtn');
    if (saveBtn) {
      saveBtn.addEventListener('click', function () {
        if (!currentMailKey || !mailTemplates[currentMailKey]) return;
        var subj = document.getElementById('mailContentSubject');
        var txt = document.getElementById('mailContentText');
        mailTemplates[currentMailKey].subject = subj ? subj.value.trim() : '';
        mailTemplates[currentMailKey].body = txt ? txt.value : '';
        var inst = bootstrap.Modal.getInstance(document.getElementById('mailContentModal'));
        if (inst) inst.hide();
        alert('メール内容を保存しました。');
      });
    }

    if (btnApply) btnApply.addEventListener('click', function () { currentPage = 1; render(); });
    if (btnReset) btnReset.addEventListener('click', function () {
      if (filterStaff) filterStaff.value = '';
      if (filterName) filterName.value = '';
      if (filterMail1) filterMail1.value = '';
      if (filterMail2) filterMail2.value = '';
      if (filterMail3) filterMail3.value = '';
      if (filterMail4) filterMail4.value = '';
      currentPage = 1;
      render();
    });
    if (filterName) filterName.addEventListener('input', function () { currentPage = 1; render(); });
    if (perPageSelect) perPageSelect.addEventListener('change', function () { currentPage = 1; render(); });

    MAIL_KEYS.forEach(function (k) {
      var btn = document.querySelector('.btn-send-unsent-' + k);
      if (btn) btn.addEventListener('click', function () { openSendUnsentModal(k); });
    });
    var confirmBtn = document.getElementById('sendUnsentModalConfirmBtn');
    if (confirmBtn) confirmBtn.addEventListener('click', executeSendUnsent);
    document.querySelectorAll('.btn-mail-send-history').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var key = this.getAttribute('data-key');
        if (key) window.openMailSendHistoryModal(key);
      });
    });

    updateDeliveryDatetimeDisplay();
    render();
  });
})();
