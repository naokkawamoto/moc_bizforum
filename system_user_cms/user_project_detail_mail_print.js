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
    var staffs = [
      { id: 'yamada', name: '山田 太郎' },
      { id: 'sato', name: '佐藤 花子' },
      { id: 'suzuki', name: '鈴木 次郎' }
    ];
    var names = ['田中 一郎', '高橋 美咲', '伊藤 健太', '渡辺 真理子', '山本 翔', '中村 恵子', '小林 直樹', '加藤 優', '吉田 さくら', '松本 大輔', '井上 あかり', '木村 拓也', '林 由美', '斎藤 健', '清水 麻衣', '山口 涼太', '森 絵里香', '池田 翔太', '橋本 美羽', '山崎 竜也', '石川 花', '前田 勇気', '藤田 さやか', '岡田 蓮', '長谷川 萌', '村上 翼', '近藤 彩', '遠藤 陽太', '青木 凛', '坂本 結衣'];
    var companies = ['株式会社サンプル', 'サンプル商事株式会社', '東京テック株式会社', '株式会社グローバル企画', 'デジタルイノベーション株式会社', '株式会社未来創研', 'ベンチャーキャピタル株式会社', '株式会社スタートアップラボ', '株式会社イノベーション', 'テクノロジー株式会社', '株式会社グロース', '株式会社ネクスト', '株式会社ビジョン', '株式会社フューチャー', '株式会社クリエイト', '株式会社ソリューション', '株式会社パートナーズ', '株式会社ビジネス開発', '株式会社新規事業', '株式会社戦略企画'];
    var VISITOR_TOTAL = 100;
    var visitorData = [];
    for (var i = 0; i < VISITOR_TOTAL; i++) {
      var n = i % names.length;
      var c = i % companies.length;
      var s = staffs[i % 3];
      var present = Math.random() < 0.7;
      var week1Sent = i < 60;
      var day1Sent = i < 30;
      visitorData.push({
        userid: 'U' + String(i + 1).padStart(3, '0'),
        name: names[n],
        company: companies[c],
        staffId: s.id,
        staffName: s.name,
        present: present,
        week1Sent: week1Sent,
        day1Sent: day1Sent
      });
    }

    var filterStaff = document.getElementById('filterStaff');
    var filterName = document.getElementById('filterName');
    var filterWeek1 = document.getElementById('filterWeek1');
    var filterDay1 = document.getElementById('filterDay1');
    var btnApply = document.getElementById('btnApply');
    var btnReset = document.getElementById('btnReset');
    var perPageSelect = document.getElementById('perPage');
    var tbody = document.getElementById('visitorTbody');
    var countLabel = document.getElementById('countLabel');
    var pageInfo = document.getElementById('pageInfo');
    var paginationList = document.getElementById('paginationList');
    var btnPrintAll = document.getElementById('btnPrintAll');
    var previewModal = document.getElementById('previewModal');
    var previewCompany = document.getElementById('previewCompany');
    var previewName = document.getElementById('previewName');
    var btnPrintOne = document.getElementById('btnPrintOne');
    var mailSentCount1week = document.getElementById('mailSentCount1week');
    var mailUnsentCount1week = document.getElementById('mailUnsentCount1week');
    var mailSentCount1day = document.getElementById('mailSentCount1day');
    var mailUnsentCount1day = document.getElementById('mailUnsentCount1day');
    var mailTotalCount1week = document.getElementById('mailTotalCount1week');
    var mailTotalCount1day = document.getElementById('mailTotalCount1day');
    var btnSendUnsentWeek1 = document.querySelector('.btn-send-unsent-week1');
    var btnSendUnsentDay1 = document.querySelector('.btn-send-unsent-day1');
    var autoDeliveryStatus1week = document.getElementById('autoDeliveryStatus1week');
    var autoDeliveryStatus1day = document.getElementById('autoDeliveryStatus1day');
    var addVisitorModal = document.getElementById('addVisitorModal');
    var addVisitorName = document.getElementById('addVisitorName');
    var addVisitorCompany = document.getElementById('addVisitorCompany');
    var addVisitorStaff = document.getElementById('addVisitorStaff');
    var addVisitorSaveBtn = document.getElementById('addVisitorSaveBtn');
    var btnAddVisitor = document.getElementById('btnAddVisitor');
    var btnBulkAddCsv = document.getElementById('btnBulkAddCsv');

    var currentPage = 1;
    var filteredData = [];
    var currentPreviewVisitor = null;
    var autoDeliverySchedules = { '1week': null, '1day': null };

    function openAutoDeliveryModal(key) {
      var label = (key === '1week') ? '1週間前' : '前日';
      var timingEl = document.getElementById('autoDeliveryModalTimingLabel');
      if (timingEl) timingEl.textContent = 'タイミング：' + label;
      var s = autoDeliverySchedules[key];
      var yearEl = document.getElementById('autoDeliveryYear');
      var monthEl = document.getElementById('autoDeliveryMonth');
      var dayEl = document.getElementById('autoDeliveryDay');
      var hourEl = document.getElementById('autoDeliveryHour');
      if (yearEl) yearEl.value = s ? s.year : new Date().getFullYear();
      if (monthEl) monthEl.value = s ? s.month : new Date().getMonth() + 1;
      if (dayEl) dayEl.value = s ? s.day : new Date().getDate();
      if (hourEl) hourEl.value = s ? s.hour : 10;
      window._currentAutoDeliveryKey = key;
      var modal = new bootstrap.Modal(document.getElementById('autoDeliveryModal'));
      modal.show();
    }

    function updateAutoDeliveryStatusDisplay() {
      var s1 = autoDeliverySchedules['1week'];
      var s2 = autoDeliverySchedules['1day'];
      if (autoDeliveryStatus1week) {
        autoDeliveryStatus1week.textContent = s1 ? (s1.year + '/' + s1.month + '/' + s1.day + ' ' + s1.hour + ':00') : '未設定';
        autoDeliveryStatus1week.className = s1 ? 'small text-success' : 'small text-muted';
      }
      if (autoDeliveryStatus1day) {
        autoDeliveryStatus1day.textContent = s2 ? (s2.year + '/' + s2.month + '/' + s2.day + ' ' + s2.hour + ':00') : '未設定';
        autoDeliveryStatus1day.className = s2 ? 'small text-success' : 'small text-muted';
      }
    }

    function renderRow(v) {
      var tr = document.createElement('tr');
      var week1Status = v.week1Sent ? '<span class="badge bg-success">送信済</span>' : '<span class="badge bg-secondary">未送信</span>';
      var day1Status = v.day1Sent ? '<span class="badge bg-success">送信済</span>' : '<span class="badge bg-secondary">未送信</span>';

      tr.innerHTML =
        '<td>' + v.userid + '</td>' +
        '<td>' + v.name + '</td>' +
        '<td>' + v.company + '</td>' +
        '<td>' + v.staffName + '</td>' +
        '<td class="text-center">' + week1Status + '</td>' +
        '<td class="text-center">' + day1Status + '</td>' +
        '<td class="text-center"><button type="button" class="btn btn-outline-primary btn-sm btn-preview" data-userid="' + v.userid + '" data-name="' + (v.name || '').replace(/"/g, '&quot;') + '" data-company="' + (v.company || '').replace(/"/g, '&quot;') + '">プレビュー</button></td>';

      tr.querySelector('.btn-preview') && tr.querySelector('.btn-preview').addEventListener('click', function (e) {
        e.stopPropagation();
        var uid = this.getAttribute('data-userid');
        currentPreviewVisitor = visitorData.find(function (x) { return x.userid === uid; });
        if (previewCompany) previewCompany.textContent = currentPreviewVisitor ? currentPreviewVisitor.company : '—';
        if (previewName) previewName.textContent = currentPreviewVisitor ? currentPreviewVisitor.name : '—';
        var modal = new bootstrap.Modal(previewModal);
        modal.show();
      });

      return tr;
    }

    function updateMailDeliveryCounts() {
      var total = visitorData.length;
      var week1Sent = visitorData.filter(function (v) { return v.week1Sent; }).length;
      var week1Unsent = total - week1Sent;
      var day1Sent = visitorData.filter(function (v) { return v.day1Sent; }).length;
      var day1Unsent = total - day1Sent;
      if (mailTotalCount1week) mailTotalCount1week.textContent = total;
      if (mailTotalCount1day) mailTotalCount1day.textContent = total;
      if (mailSentCount1week) mailSentCount1week.textContent = week1Sent;
      if (mailUnsentCount1week) mailUnsentCount1week.textContent = week1Unsent;
      if (mailSentCount1day) mailSentCount1day.textContent = day1Sent;
      if (mailUnsentCount1day) mailUnsentCount1day.textContent = day1Unsent;
      if (btnSendUnsentWeek1) { btnSendUnsentWeek1.disabled = week1Unsent === 0; }
      if (btnSendUnsentDay1) { btnSendUnsentDay1.disabled = day1Unsent === 0; }
    }

    function getFiltered() {
      var staffVal = filterStaff ? filterStaff.value : '';
      var nameVal = filterName ? filterName.value.trim() : '';
      var week1Val = filterWeek1 ? filterWeek1.value : '';
      var day1Val = filterDay1 ? filterDay1.value : '';
      return visitorData.filter(function (v) {
        var showStaff = !staffVal || v.staffId === staffVal;
        var showName = !nameVal || (v.name && v.name.indexOf(nameVal) >= 0);
        var showWeek1 = !week1Val || (week1Val === 'sent' && v.week1Sent) || (week1Val === 'unsent' && !v.week1Sent);
        var showDay1 = !day1Val || (day1Val === 'sent' && v.day1Sent) || (day1Val === 'unsent' && !v.day1Sent);
        return showStaff && showName && showWeek1 && showDay1;
      });
    }

    function render() {
      filteredData = getFiltered();
      var perPageVal = perPageSelect ? parseInt(perPageSelect.value, 10) : 50;
      var perPage = perPageVal === 0 ? filteredData.length : Math.max(1, perPageVal);
      var totalPages = Math.max(1, Math.ceil(filteredData.length / perPage));
      if (currentPage > totalPages) currentPage = totalPages;
      var start = (currentPage - 1) * perPage;
      var end = Math.min(start + perPage, filteredData.length);
      var pageData = filteredData.slice(start, end);

      if (countLabel) countLabel.textContent = '全' + filteredData.length + '件';
      if (pageInfo) {
        if (filteredData.length === 0) pageInfo.textContent = '0件';
        else pageInfo.textContent = (start + 1) + '-' + end + '件目を表示（' + currentPage + '/' + totalPages + 'ページ）';
      }

      if (tbody) tbody.innerHTML = '';
      if (pageData && tbody) pageData.forEach(function (v) { tbody.appendChild(renderRow(v)); });

      updateMailDeliveryCounts();

      if (paginationList) paginationList.innerHTML = '';
      if (totalPages <= 1 || !paginationList) return;

      var li = document.createElement('li');
      li.className = 'page-item' + (currentPage === 1 ? ' disabled' : '');
      li.innerHTML = '<a class="page-link" href="#" aria-label="前へ">«</a>';
      if (currentPage > 1) li.querySelector('a').onclick = function (e) { e.preventDefault(); currentPage--; render(); };
      paginationList.appendChild(li);

      var from = Math.max(1, currentPage - 2);
      var to = Math.min(totalPages, currentPage + 2);
      for (var p = from; p <= to; p++) {
        (function (p) {
          var li2 = document.createElement('li');
          li2.className = 'page-item' + (p === currentPage ? ' active' : '');
          li2.innerHTML = '<a class="page-link" href="#">' + p + '</a>';
          li2.querySelector('a').onclick = function (e) { e.preventDefault(); currentPage = p; render(); };
          paginationList.appendChild(li2);
        })(p);
      }
      li = document.createElement('li');
      li.className = 'page-item' + (currentPage === totalPages ? ' disabled' : '');
      li.innerHTML = '<a class="page-link" href="#" aria-label="次へ">»</a>';
      if (currentPage < totalPages) li.querySelector('a').onclick = function (e) { e.preventDefault(); currentPage++; render(); };
      paginationList.appendChild(li);
    }

    if (btnApply) btnApply.addEventListener('click', function () { currentPage = 1; render(); });
    if (btnReset) {
      btnReset.addEventListener('click', function () {
        if (filterStaff) filterStaff.value = '';
        if (filterName) filterName.value = '';
        if (filterWeek1) filterWeek1.value = '';
        if (filterDay1) filterDay1.value = '';
        currentPage = 1;
        render();
      });
    }
    if (filterName) filterName.addEventListener('input', function () { currentPage = 1; render(); });
    if (perPageSelect) perPageSelect.addEventListener('change', function () { currentPage = 1; render(); });

    if (btnPrintAll) btnPrintAll.addEventListener('click', function () {
      alert('全来場者のネームカードを印刷します。\n※実際の実装では印刷ダイアログを表示します。');
    });

    if (btnAddVisitor) btnAddVisitor.addEventListener('click', function () {
      if (addVisitorName) addVisitorName.value = '';
      if (addVisitorCompany) addVisitorCompany.value = '';
      if (addVisitorStaff) addVisitorStaff.value = '';
      var modal = new bootstrap.Modal(addVisitorModal);
      modal.show();
    });

    if (addVisitorSaveBtn) addVisitorSaveBtn.addEventListener('click', function () {
      var name = addVisitorName ? addVisitorName.value.trim() : '';
      var company = addVisitorCompany ? addVisitorCompany.value.trim() : '';
      var staffVal = addVisitorStaff ? addVisitorStaff.value : '';
      if (!name) {
        alert('来場者名を入力してください。');
        return;
      }
      if (!company) {
        alert('会社名を入力してください。');
        return;
      }
      var staff = staffs.find(function (s) { return s.id === staffVal; });
      var staffId = staff ? staff.id : (staffs[0] ? staffs[0].id : '');
      var staffName = staff ? staff.name : (staffs[0] ? staffs[0].name : '');
      var maxNum = visitorData.reduce(function (m, v) {
        var n = parseInt((v.userid || '').replace(/\D/g, ''), 10);
        return isNaN(n) ? m : Math.max(m, n);
      }, 0);
      var newUserid = 'U' + String(maxNum + 1).padStart(3, '0');
      visitorData.push({
        userid: newUserid,
        name: name,
        company: company,
        staffId: staffId,
        staffName: staffName,
        present: false,
        week1Sent: false,
        day1Sent: false
      });
      bootstrap.Modal.getInstance(addVisitorModal).hide();
      render();
      updateMailDeliveryCounts();
      alert('来場者を登録しました。（' + name + '）');
    });

    if (btnBulkAddCsv) btnBulkAddCsv.addEventListener('click', function () {
      alert('一括追加CSVは準備中です。\n※CSVファイルをアップロードして来場者を一括登録する機能です。');
    });

    if (btnSendUnsentWeek1) btnSendUnsentWeek1.addEventListener('click', function () {
      var unsent = visitorData.filter(function (v) { return !v.week1Sent; });
      unsent.forEach(function (v) { v.week1Sent = true; });
      render();
      alert('1週間前リマインドメールを未送信ユーザー ' + unsent.length + ' 件に送信しました。\n※実際の実装では送信処理を行います。');
    });
    if (btnSendUnsentDay1) btnSendUnsentDay1.addEventListener('click', function () {
      var unsent = visitorData.filter(function (v) { return !v.day1Sent; });
      unsent.forEach(function (v) { v.day1Sent = true; });
      render();
      alert('前日リマインドメールを未送信ユーザー ' + unsent.length + ' 件に送信しました。\n※実際の実装では送信処理を行います。');
    });

    document.querySelectorAll('.btn-auto-delivery').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var key = this.getAttribute('data-key');
        if (key) openAutoDeliveryModal(key);
      });
    });

    var autoDeliverySaveBtn = document.getElementById('autoDeliverySaveBtn');
    if (autoDeliverySaveBtn) autoDeliverySaveBtn.addEventListener('click', function () {
      var key = window._currentAutoDeliveryKey;
      if (!key) return;
      var year = parseInt(document.getElementById('autoDeliveryYear').value, 10);
      var month = parseInt(document.getElementById('autoDeliveryMonth').value, 10);
      var day = parseInt(document.getElementById('autoDeliveryDay').value, 10);
      var hour = parseInt(document.getElementById('autoDeliveryHour').value, 10);
      if (isNaN(year) || isNaN(month) || isNaN(day) || isNaN(hour)) {
        alert('西暦・月・日・時間を正しく入力してください。');
        return;
      }
      autoDeliverySchedules[key] = { year: year, month: month, day: day, hour: hour };
      updateAutoDeliveryStatusDisplay();
      bootstrap.Modal.getInstance(document.getElementById('autoDeliveryModal')).hide();
      alert('自動配信を設定しました。\n※実際の実装ではスケジュール登録を行います。');
    });

    if (btnPrintOne) btnPrintOne.addEventListener('click', function () {
      if (currentPreviewVisitor) {
        alert(currentPreviewVisitor.name + ' のネームカードを印刷します。\n※実際の実装では印刷ダイアログを表示します。');
        bootstrap.Modal.getInstance(previewModal).hide();
      }
    });

    // メール内容確認モーダル（1週間前・前日）
    var mailTemplates = {
      '1week': {
        subject: '【リマインド】New Business Creation Strategy 2026 まであと1週間です',
        body: '{{氏名}} 様\n\nいつもお世話になっております。\n主催者株式会社でございます。\n\nイベント「New Business Creation Strategy 2026」の開催まで、あと1週間となりました。\n\n■ イベント概要\n・日時：2026年3月5日（木）13:00～17:40\n・会場：会場開催（東京）\n\nご参加の準備が整いましたら、当日は受付にてQRコードのご提示をお願いいたします。\n\n主催者株式会社'
      },
      '1day': {
        subject: '【明日開催】New Business Creation Strategy 2026 のご案内',
        body: '{{氏名}} 様\n\nいつもお世話になっております。\n主催者株式会社でございます。\n\nイベント「New Business Creation Strategy 2026」は明日の開催となります。\n\n■ 開催日時\n2026年3月5日（木）13:00～17:40\n\n■ 会場\n会場開催（東京）\n\n■ ご持参いただくもの\n・本メールの控え（または受付QRコード）・名刺\n\n受付は開始30分前より行います。お気をつけてお越しください。\n\n主催者株式会社'
      }
    };
    var currentMailKey = '';

    window.openMailContentModal = function (key) {
      currentMailKey = key;
      var title = document.getElementById('mailContentModalLabel');
      var label = (key === '1week') ? '1週間前' : '前日';
      if (title) title.textContent = 'リマインドメール 内容確認・編集（' + label + '）';
      var subj = document.getElementById('mailContentSubject');
      var ta = document.getElementById('mailContentText');
      var t = mailTemplates[key];
      if (t) {
        if (subj) subj.value = t.subject || '';
        if (ta) ta.value = t.body || '';
      }
      var modal = new bootstrap.Modal(document.getElementById('mailContentModal'));
      modal.show();
    };

    window.sendReminderMail = function (key) {
      var label = (key === '1week') ? '1週間前' : '前日';
      alert(label + 'のリマインドメールを送信しました。\n※実際の実装では送信処理を行います。');
    };

    document.getElementById('mailContentSaveBtn').addEventListener('click', function () {
      var subj = document.getElementById('mailContentSubject');
      var ta = document.getElementById('mailContentText');
      if (currentMailKey && mailTemplates[currentMailKey]) {
        mailTemplates[currentMailKey].subject = subj ? subj.value.trim() : '';
        mailTemplates[currentMailKey].body = ta ? ta.value : '';
        bootstrap.Modal.getInstance(document.getElementById('mailContentModal')).hide();
        alert('メール内容を保存しました。');
      }
    });

    render();
  });
})();
