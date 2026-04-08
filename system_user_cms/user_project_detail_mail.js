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
    /** user_project_create 来場者リストの営業担当者に対応（絞り込み用 staffId へマップ） */
    var SALES_STAFF_META = {
      yamada: { staffId: 'yamada', name: '山田 太郎' },
      sato: { staffId: 'sato', name: '佐藤 花子' },
      suzuki: { staffId: 'suzuki', name: '鈴木 次郎' },
      takahashi: { staffId: 'yamada', name: '高橋 誠' },
      watanabe: { staffId: 'suzuki', name: '渡辺 直樹' }
    };
    var names = ['田中 一郎', '高橋 美咲', '伊藤 健太', '渡辺 真理子', '山本 翔', '中村 恵子', '小林 直樹', '加藤 優', '吉田 さくら', '松本 大輔', '井上 あかり', '木村 拓也', '林 由美', '斎藤 健', '清水 麻衣', '山口 涼太', '森 絵里香', '池田 翔太', '橋本 美羽', '山崎 竜也', '石川 花', '前田 勇気', '藤田 さやか', '岡田 蓮', '長谷川 萌', '村上 翼', '近藤 彩', '遠藤 陽太', '青木 凛', '坂本 結衣'];
    var companies = ['株式会社サンプル', 'サンプル商事株式会社', '東京テック株式会社', '株式会社グローバル企画', 'デジタルイノベーション株式会社', '株式会社未来創研', 'ベンチャーキャピタル株式会社', '株式会社スタートアップラボ', '株式会社イノベーション', 'テクノロジー株式会社', '株式会社グロース', '株式会社ネクスト', '株式会社ビジョン', '株式会社フューチャー', '株式会社クリエイト', '株式会社ソリューション', '株式会社パートナーズ', '株式会社ビジネス開発', '株式会社新規事業', '株式会社戦略企画'];
    var visitorDepts = ['マーケティング部', '開発本部', '人事総務', '研究開発室', '海外営業'];
    var visitorSessions = ['セッションA', 'ネットワーキング', '基調講演', 'ダイアログ', 'セッションB'];
    var salesKeyRotation = ['yamada', 'sato', 'suzuki', 'takahashi', 'watanabe'];

    function splitFullName(full) {
      var t = (full || '').trim().split(/\s+/);
      if (t.length >= 2) return { last: t[0], first: t.slice(1).join(' ') };
      return { last: t[0] || '', first: '' };
    }

    var VISITOR_TOTAL = 100;
    var visitorData = [];
    for (var i = 0; i < VISITOR_TOTAL; i++) {
      var n = i % names.length;
      var c = i % companies.length;
      var sk = salesKeyRotation[i % salesKeyRotation.length];
      var salesMeta = SALES_STAFF_META[sk];
      var sp = splitFullName(names[n]);
      var present = Math.random() < 0.7;
      var week1Sent = i < 60;
      var day1Sent = i < 30;
      visitorData.push({
        userid: 'U' + String(i + 1).padStart(3, '0'),
        company: companies[c],
        dept: visitorDepts[i % visitorDepts.length],
        lastName: sp.last,
        firstName: sp.first,
        name: names[n],
        kanaLast: '',
        kanaFirst: '',
        email: 'guest' + String(i + 1).padStart(3, '0') + '@example.com',
        session: visitorSessions[i % visitorSessions.length],
        staffId: salesMeta.staffId,
        staffName: salesMeta.name,
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
    var mailSentCount1week = document.getElementById('mailSentCount1week');
    var mailUnsentCount1week = document.getElementById('mailUnsentCount1week');
    var mailSentCount1day = document.getElementById('mailSentCount1day');
    var mailUnsentCount1day = document.getElementById('mailUnsentCount1day');
    var mailTotalCount1week = document.getElementById('mailTotalCount1week');
    var mailTotalCount1day = document.getElementById('mailTotalCount1day');
    var btnSendUnsentWeek1 = document.querySelector('.btn-send-unsent-week1');
    var btnSendUnsentDay1 = document.querySelector('.btn-send-unsent-day1');
    var currentPage = 1;
    var filteredData = [];
    var autoDeliverySchedules = {
      '1week': { year: 2026, month: 2, day: 26, hour: 10, minute: 0 },
      '1day': { year: 2026, month: 3, day: 4, hour: 9, minute: 0 }
    };

    /** 同一タイミングで複数回送信したときの履歴（モック初期データあり） */
    var mailSendHistory = {
      '1week': [
        { at: new Date(2026, 1, 18, 11, 5), count: 40 },
        { at: new Date(2026, 1, 22, 14, 30), count: 20 }
      ],
      '1day': [
        { at: new Date(2026, 2, 3, 9, 0), count: 12 }
      ]
    };
    var pendingSendUnsentKey = null;

    function pad2(n) {
      var x = parseInt(n, 10);
      if (isNaN(x)) return '00';
      return (x < 10 ? '0' : '') + x;
    }

    function formatJpDateOnly(d) {
      if (!(d instanceof Date) || isNaN(d.getTime())) return '—';
      return d.getFullYear() + '年' + (d.getMonth() + 1) + '月' + d.getDate() + '日';
    }

    function formatJpTimeHm(d) {
      if (!(d instanceof Date) || isNaN(d.getTime())) return '—';
      return d.getHours() + '時' + pad2(d.getMinutes()) + '分';
    }

    function escapeHtml(s) {
      if (s == null) return '';
      return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    function formatJpDeliveryDatetime(s) {
      if (!s) return '—';
      var mi = pad2(s.minute != null ? s.minute : 0);
      return s.year + '年' + s.month + '月' + s.day + '日' + s.hour + '時' + mi + '分';
    }

    function updateDeliveryDatetimeDisplay() {
      var el1w = document.getElementById('deliveryDatetime1week');
      var el1d = document.getElementById('deliveryDatetime1day');
      if (el1w) el1w.textContent = formatJpDeliveryDatetime(autoDeliverySchedules['1week']);
      if (el1d) el1d.textContent = formatJpDeliveryDatetime(autoDeliverySchedules['1day']);
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
        '<td class="text-center">' + day1Status + '</td>';

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

    function visitorSearchMatches(v, q) {
      if (!q) return true;
      var hay = [
        v.name || '',
        v.company || '',
        v.lastName || '',
        v.firstName || '',
        v.kanaLast || '',
        v.kanaFirst || ''
      ].join(' ');
      return hay.indexOf(q) >= 0;
    }

    function getFiltered() {
      var staffVal = filterStaff ? filterStaff.value : '';
      var nameVal = filterName ? filterName.value.trim() : '';
      var week1Val = filterWeek1 ? filterWeek1.value : '';
      var day1Val = filterDay1 ? filterDay1.value : '';
      return visitorData.filter(function (v) {
        var showStaff = !staffVal || v.staffId === staffVal;
        var showSearch = visitorSearchMatches(v, nameVal);
        var showWeek1 = !week1Val || (week1Val === 'sent' && v.week1Sent) || (week1Val === 'unsent' && !v.week1Sent);
        var showDay1 = !day1Val || (day1Val === 'sent' && v.day1Sent) || (day1Val === 'unsent' && !v.day1Sent);
        return showStaff && showSearch && showWeek1 && showDay1;
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

    function openSendUnsentModal(key) {
      var unsent = visitorData.filter(function (v) { return key === '1week' ? !v.week1Sent : !v.day1Sent; });
      if (unsent.length === 0) return;
      pendingSendUnsentKey = key;
      var label = key === '1week' ? '1週間前' : '前日';
      var showCount = Math.min(40, unsent.length);
      var intro = document.getElementById('sendUnsentModalIntro');
      if (intro) {
        intro.textContent = '「' + label + '」リマインドメールを、以下 ' + showCount + ' 件の宛先に送信します。';
      }
      var moreNote = document.getElementById('sendUnsentModalMoreNote');
      if (moreNote) {
        if (unsent.length > 40) {
          moreNote.textContent = '未送信は全 ' + unsent.length + ' 件あります。一覧は先頭40件を表示します。送信では未送信の全件に対して処理します。';
          moreNote.classList.remove('d-none');
        } else {
          moreNote.textContent = '';
          moreNote.classList.add('d-none');
        }
      }
      var title = document.getElementById('sendUnsentMailModalLabel');
      if (title) title.textContent = '未送信ユーザーへの送信（' + label + '）';
      var tbody = document.getElementById('sendUnsentModalTbody');
      if (tbody) {
        tbody.innerHTML = '';
        unsent.slice(0, 40).forEach(function (v) {
          var tr = document.createElement('tr');
          tr.innerHTML =
            '<td>' + escapeHtml(v.email || '') + '</td>' +
            '<td>' + escapeHtml(v.company || '') + '</td>' +
            '<td>' + escapeHtml(v.name || '') + '</td>';
          tbody.appendChild(tr);
        });
      }
      var modal = new bootstrap.Modal(document.getElementById('sendUnsentMailModal'));
      modal.show();
    }

    function executeSendUnsent() {
      var key = pendingSendUnsentKey;
      if (!key) return;
      var unsent = visitorData.filter(function (v) { return key === '1week' ? !v.week1Sent : !v.day1Sent; });
      var sendCount = unsent.length;
      if (sendCount > 0) {
        if (!mailSendHistory[key]) mailSendHistory[key] = [];
        mailSendHistory[key].push({ at: new Date(), count: sendCount });
      }
      unsent.forEach(function (v) {
        if (key === '1week') v.week1Sent = true;
        else v.day1Sent = true;
      });
      var label = key === '1week' ? '1週間前' : '前日';
      var modalEl = document.getElementById('sendUnsentMailModal');
      if (modalEl) {
        var inst = bootstrap.Modal.getInstance(modalEl);
        if (inst) inst.hide();
      }
      pendingSendUnsentKey = null;
      render();
      alert(label + 'リマインドメールを未送信ユーザー ' + sendCount + ' 件に送信しました。\n※実際の実装では送信処理を行います。');
    }

    function renderMailSendHistoryTable(key) {
      var tbody = document.getElementById('mailSendHistoryModalTbody');
      if (!tbody) return;
      var list = (mailSendHistory[key] || []).slice();
      list.sort(function (a, b) {
        var ta = a.at instanceof Date ? a.at.getTime() : new Date(a.at).getTime();
        var tb = b.at instanceof Date ? b.at.getTime() : new Date(b.at).getTime();
        return tb - ta;
      });
      tbody.innerHTML = '';
      if (list.length === 0) {
        var tr0 = document.createElement('tr');
        tr0.innerHTML = '<td colspan="3" class="text-center text-muted py-3">送信履歴はまだありません。</td>';
        tbody.appendChild(tr0);
        return;
      }
      list.forEach(function (row) {
        var d = row.at instanceof Date ? row.at : new Date(row.at);
        var tr = document.createElement('tr');
        tr.innerHTML =
          '<td>' + escapeHtml(formatJpDateOnly(d)) + '</td>' +
          '<td>' + escapeHtml(formatJpTimeHm(d)) + '</td>' +
          '<td class="text-end">' + escapeHtml(String(row.count)) + '件</td>';
        tbody.appendChild(tr);
      });
    }

    window.openMailSendHistoryModal = function (key) {
      var label = key === '1week' ? '1週間前' : '前日';
      var titleEl = document.getElementById('mailSendHistoryModalLabel');
      if (titleEl) titleEl.textContent = '送信履歴（' + label + '）';
      var leadEl = document.getElementById('mailSendHistoryModalLead');
      if (leadEl) {
        leadEl.textContent = '「' + label + '」のメールは、未送信者への再送などで複数回送信できます。実行ごとに年月日・時刻と送信数を記録します。';
      }
      renderMailSendHistoryTable(key);
      var modal = new bootstrap.Modal(document.getElementById('mailSendHistoryModal'));
      modal.show();
    };

    if (btnSendUnsentWeek1) btnSendUnsentWeek1.addEventListener('click', function () {
      openSendUnsentModal('1week');
    });
    if (btnSendUnsentDay1) btnSendUnsentDay1.addEventListener('click', function () {
      openSendUnsentModal('1day');
    });

    var sendUnsentModalConfirmBtn = document.getElementById('sendUnsentModalConfirmBtn');
    if (sendUnsentModalConfirmBtn) {
      sendUnsentModalConfirmBtn.addEventListener('click', function () {
        executeSendUnsent();
      });
    }

    document.querySelectorAll('.btn-mail-send-history').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var key = this.getAttribute('data-key');
        if (key) window.openMailSendHistoryModal(key);
      });
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

    updateDeliveryDatetimeDisplay();
    render();
  });
})();
