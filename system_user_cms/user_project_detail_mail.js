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
    var MAIL_KEYS = ['mail1', 'mail2', 'mail3', 'mail4', 'mail5'];
    var MAIL_LABELS = {
      mail1: '受講票送付',
      mail2: '1週間前メール',
      mail3: '3日前メール',
      mail4: '前日メール',
      mail5: '新規メール'
    };

    /** メール種別名の先頭3文字＋…（来場者リスト列見出し・絞り込みラベル用） */
    function abbrevMailTypeLabel(full) {
      var s = String(full == null ? '' : full).trim();
      if (!s) return '—';
      if (s.length <= 3) return s;
      return s.slice(0, 3) + '...';
    }

    function getMailTypeDisplayName(key) {
      var suffix = key.charAt(0).toUpperCase() + key.slice(1);
      var view = document.getElementById('mailTypeView' + suffix);
      if (view && view.textContent && String(view.textContent).trim()) return String(view.textContent).trim();
      return MAIL_LABELS[key] || '';
    }

    function syncVisitorMailColumnLabels() {
      MAIL_KEYS.forEach(function (k) {
        var full = getMailTypeDisplayName(k);
        var abbr = abbrevMailTypeLabel(full);
        document.querySelectorAll('[data-visitor-mail-col="' + k + '"]').forEach(function (el) {
          el.textContent = abbr;
          el.setAttribute('title', full);
        });
        var th = document.querySelector('th[data-col-mail-key="' + k + '"]');
        if (th) th.setAttribute('data-col-label', full);
        var group = document.querySelector('.th-col-ctrl[data-mail-sort-group="' + k + '"]');
        if (group) group.setAttribute('aria-label', full + 'の並べ替え');
      });
    }

    var names = ['田中 一郎', '高橋 美咲', '伊藤 健太', '渡辺 真理子', '山本 翔', '中村 恵子', '小林 直樹', '加藤 優', '吉田 さくら', '松本 大輔'];
    var companies = ['株式会社サンプル', 'サンプル商事株式会社', '東京テック株式会社', '株式会社グローバル企画', 'デジタルイノベーション株式会社'];
    var visitorDepts = ['マーケティング部', '開発本部', '人事総務', '研究開発室', '海外営業'];
    /** 単一・複数（カンマ区切り）の選択セッション例 */
    var visitorSessionDisplays = [
      'セッションA',
      'セッションB',
      'セッションA,セッションB,セッションC',
      'ネットワーキング',
      '基調講演',
      'セッションA,セッションB',
      'ダイアログ',
      'セッションC,セッションD',
      'セッションA,セッションB,セッションC,ネットワーキング'
    ];
    /** 出欠状況の取りうる値（空文字は空欄） */
    var attendanceStatuses = ['本人出席', '代理出席', '当日出席', '交代出席', '欠席', '申込者', 'キャンセル', '抽選漏れ', ''];
    /** 抽選結果の取りうる値（空文字は空欄） */
    var lotteryResults = ['当選', '抽選漏れ', ''];

    var visitorData = [];
    for (var i = 0; i < 100; i++) {
      var mail1Sent = i < 60;
      var mail2Sent = i < 30;
      var mail3Sent = i < 10;
      var mail4Sent = i < 5;
      var mail5Sent = i < 2;
      visitorData.push({
        userid: 'U' + String(i + 1).padStart(3, '0'),
        lotteryResult: lotteryResults[i % lotteryResults.length],
        attendanceStatus: attendanceStatuses[i % attendanceStatuses.length],
        company: companies[i % companies.length],
        dept: visitorDepts[i % visitorDepts.length],
        name: names[i % names.length],
        email: 'guest' + String(i + 1).padStart(3, '0') + '@example.com',
        session: visitorSessionDisplays[i % visitorSessionDisplays.length],
        mail1Sent: mail1Sent,
        mail2Sent: mail2Sent,
        mail3Sent: mail3Sent,
        mail4Sent: mail4Sent,
        mail5Sent: mail5Sent
      });
    }
    visitorData.forEach(function (v) {
      if (v.lotteryResult === 'ブランク') v.lotteryResult = '';
    });

    var filterName = document.getElementById('filterName');
    var filterMail1 = document.getElementById('filterMail1');
    var filterMail2 = document.getElementById('filterMail2');
    var filterMail3 = document.getElementById('filterMail3');
    var filterMail4 = document.getElementById('filterMail4');
    var filterMail5 = document.getElementById('filterMail5');
    var btnApply = document.getElementById('btnApply');
    var btnReset = document.getElementById('btnReset');
    var perPageSelect = document.getElementById('perPage');
    var tbody = document.getElementById('visitorTbody');
    var countLabel = document.getElementById('countLabel');
    var pageInfo = document.getElementById('pageInfo');
    var paginationList = document.getElementById('paginationList');
    var mailDeliveryCard = document.getElementById('mailDeliveryCard');
    var btnMailDeliveryEdit = document.getElementById('btnMailDeliveryEdit');
    var btnMailDeliverySave = document.getElementById('btnMailDeliverySave');
    var btnAddMail5 = document.getElementById('btnAddMail5');
    var mailRow5 = document.getElementById('mailRow5');
    var addMailRow = document.getElementById('addMailRow');
    var currentPage = 1;
    var filteredData = [];

    var autoDeliverySchedules = {
      mail1: { year: 2026, month: 2, day: 26, hour: 10, minute: 0 },
      mail2: { year: 2026, month: 3, day: 4, hour: 9, minute: 0 },
      mail3: { year: 2026, month: 3, day: 4, hour: 14, minute: 0 },
      mail4: { year: 2026, month: 3, day: 5, hour: 8, minute: 0 },
      mail5: { year: 2026, month: 3, day: 5, hour: 12, minute: 0 }
    };
    var mailSendHistory = { mail1: [], mail2: [], mail3: [], mail4: [], mail5: [] };
    var pendingSendUnsentKey = null;
    var editingDeliveryKey = null;
    var SEND_UNSENT_DEFAULT_SUBJECT = '【受講証のご案内】●月●日開催_●セミナー名短縮版●';
    var SEND_UNSENT_DEFAULT_BODY = '{!Lead.Company} \n{!Lead.Name}　様　　　　　　　　　　　　　      　{!Lead.JP__c} \n\nこの度は、「●セミナー名短縮版●」へお申込いただき、\n誠にありがとうございます。\n受講証（二次元コード）及び当日の詳細についてご案内いたします。\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ \n受┃講┃証┃ \n━┛━┛━┛\n{!Lead.QRCodeURL_TEXT__c}\n\n■受　付■ \n当日は●●：●●より●会場名●\n【●F／●部屋名● 前】にて受付を開始いたします。 \n\nご来場の際は、上記受講証URLをクリックして表示される\n【二次元コード】と【お名刺を1枚】ご提示ください。\n受講証の二次元コードで受付を行います。\n\n二次元コードはモバイル画面またはプリントアウトしてお持ちください。\n（二次元コードが表示されるまでに、お時間がかかる場合がございます）\n\n複数人でお申込の場合、受講証はお一人ずつご提示ください。\nそれぞれ皆様にメールにてお送りしております。\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n以下に、開催概要についてもご案内いたします。\n\n======================================================\n●セミナー名●\nhttp://www.b-forum.net/●開催概要ＵＲＬ●/\n\n主催：●会社名●\n協力：株式会社ビジネス・フォーラム事務局 \n======================================================\n \n■開催日■ \n20●●年 ●月 ●日（●）●●：●●～●●：●●（受付開始 ●●：●●～）\n\n■会　場■ \n●会場名●　●F／●部屋名●\n●会場住所●\n●会場ＵＲＬ●\n●アクセス●\n\n■講　演■ \n●●：●●より講演を開始いたします。\n\n■プログラム■ \nhttps://www.b-forum.net/event/●ＪＰ●/#program\n\n■代理のご参加■\n当日のご出席がかなわなくなった場合、代理の方のご出席も承っております。\n代理出席をご希望の際は、お手数ですが\n署名欄の連絡先までお問い合わせください。\n\n■キャンセルについて■\n事前登録制のため、キャンセルをご希望の場合は\nお手数ですが、ご一報くださいますようお願い申し上げます。\n\nこの度はお申込み誠にありがとうございました。 \nご来場賜りますこと、心よりお待ち申し上げております。\n\n*********************************************\n株式会社ビジネス・フォーラム事務局\n担当：●Ｊ●/●Ｐ●\nTEL：03-3518-6531　　FAX：03-3518-6534\nE-Mail：customer1@b-forum.net\nhttp://www.b-forum.net\n*********************************************';

    var HELP_TEXT = {
      nonCancel: '出欠がキャンセル・申込者・抽選漏れの来場者にはメールを送りません。その他の出欠は送信対象です。',
      optionalSend: '配信予約時間前の場合、任意の時間に配信可能です。'
    };

    /** 出欠がこれらのときはメール対象外（一覧の送信済／未送信表示も未送信扱い） */
    function isAttendanceMailSuppressed(status) {
      return status === 'キャンセル' || status === '申込者' || status === '抽選漏れ';
    }

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
    function setMailDeliveryEditMode(editing) {
      if (!mailDeliveryCard) return;
      if (editing) {
        mailDeliveryCard.classList.add('delivery-edit-mode');
        if (btnMailDeliveryEdit) btnMailDeliveryEdit.classList.add('d-none');
        if (btnMailDeliverySave) btnMailDeliverySave.classList.remove('d-none');
      } else {
        mailDeliveryCard.classList.remove('delivery-edit-mode');
        if (btnMailDeliveryEdit) btnMailDeliveryEdit.classList.remove('d-none');
        if (btnMailDeliverySave) btnMailDeliverySave.classList.add('d-none');
      }
    }
    function saveMailTypeLabels() {
      MAIL_KEYS.forEach(function (k) {
        var suffix = k.charAt(0).toUpperCase() + k.slice(1);
        var input = document.getElementById('mailTypeInput' + suffix);
        var view = document.getElementById('mailTypeView' + suffix);
        if (!input || !view) return;
        var val = (input.value || '').trim() || MAIL_LABELS[k] || k;
        input.value = val;
        view.textContent = val;
        MAIL_LABELS[k] = val;
      });
      syncVisitorMailColumnLabels();
    }
    function addMail5Row() {
      if (!mailRow5) return;
      mailRow5.classList.remove('d-none');
      if (addMailRow) addMailRow.classList.add('d-none');
      var view = document.getElementById('mailTypeViewMail5');
      var input = document.getElementById('mailTypeInputMail5');
      if (view && !view.textContent.trim()) view.textContent = '新規メール';
      if (input && !input.value.trim()) input.value = '新規メール';
      MAIL_LABELS.mail5 = (view && view.textContent.trim()) || '新規メール';
      syncVisitorMailColumnLabels();
      render();
    }
    window.toggleMailDeliveryEdit = function (editing) {
      if (!editing) saveMailTypeLabels();
      setMailDeliveryEditMode(!!editing);
      if (!editing) alert('メール配信管理の設定を保存しました。');
    };

    /** 出欠がキャンセル・申込者・抽選漏れの場合は全メールを未送信扱い */
    function effectiveMailSent(v, k) {
      if (isAttendanceMailSuppressed(v.attendanceStatus)) return false;
      return !!v[k + 'Sent'];
    }

    function displayLotteryCell(v) {
      var s = v.lotteryResult;
      if (s == null || s === '' || s === 'ブランク') return '';
      return String(s);
    }
    function displayAttendanceCell(v) {
      var s = v.attendanceStatus;
      if (s == null || s === '') return '';
      return String(s);
    }

    /** 列ソート（▲▼）。col が null なら未適用 */
    var sortState = { col: null, dir: 'asc' };
    var visitorTableEl = document.getElementById('visitorTable');

    function numericUserId(v) {
      return parseInt(String(v.userid || '').replace(/\D/g, ''), 10) || 0;
    }

    function getCellStringForSort(v, col) {
      switch (col) {
        case 'userid':
          return v.userid || '';
        case 'lottery':
          return displayLotteryCell(v);
        case 'attendance':
          return displayAttendanceCell(v);
        case 'company':
          return v.company || '';
        case 'name':
          return v.name || '';
        case 'mail1':
        case 'mail2':
        case 'mail3':
        case 'mail4':
        case 'mail5':
          return effectiveMailSent(v, col) ? '送信済' : '未送信';
        default:
          return '';
      }
    }

    function applySort(arr) {
      if (!sortState || !sortState.col) return arr.slice();
      var col = sortState.col;
      var dir = sortState.dir === 'desc' ? -1 : 1;
      return arr.slice().sort(function (a, b) {
        var cmp;
        if (col === 'userid') {
          cmp = numericUserId(a) - numericUserId(b);
        } else {
          cmp = getCellStringForSort(a, col).localeCompare(getCellStringForSort(b, col), 'ja');
        }
        if (cmp !== 0) return cmp * dir;
        return numericUserId(a) - numericUserId(b);
      });
    }

    function updateSortUiState() {
      if (!visitorTableEl) return;
      visitorTableEl.querySelectorAll('.btn-col-sort').forEach(function (b) {
        b.classList.remove('btn-primary', 'text-white');
        var c = b.getAttribute('data-col');
        if (sortState && sortState.col && sortState.dir && c === sortState.col && b.getAttribute('data-dir') === sortState.dir) {
          b.classList.add('btn-primary', 'text-white');
        }
      });
    }

    function setCount(id, val) { var el = document.getElementById(id); if (el) el.textContent = val; }

    function updateMailDeliveryCounts() {
      var total = visitorData.length;
      MAIL_KEYS.forEach(function (k) {
        var sent = visitorData.filter(function (v) { return effectiveMailSent(v, k); }).length;
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
      var nameVal = filterName ? filterName.value.trim() : '';
      var mailVals = {
        mail1: filterMail1 ? filterMail1.value : '',
        mail2: filterMail2 ? filterMail2.value : '',
        mail3: filterMail3 ? filterMail3.value : '',
        mail4: filterMail4 ? filterMail4.value : '',
        mail5: filterMail5 ? filterMail5.value : ''
      };
      var base = visitorData.filter(function (v) {
        var okName = visitorSearchMatches(v, nameVal);
        var okMails = MAIL_KEYS.every(function (k) {
          var val = mailVals[k];
          if (!val) return true;
          return val === 'sent' ? effectiveMailSent(v, k) : !effectiveMailSent(v, k);
        });
        return okName && okMails;
      });
      return applySort(base);
    }

    function renderRow(v) {
      var tr = document.createElement('tr');
      tr.innerHTML =
        '<td>' + v.userid + '</td>' +
        '<td>' + displayLotteryCell(v) + '</td>' +
        '<td>' + displayAttendanceCell(v) + '</td>' +
        '<td>' + v.company + '</td>' +
        '<td>' + v.name + '</td>' +
        MAIL_KEYS.map(function (k) {
          var ok = effectiveMailSent(v, k);
          return '<td class="text-center">' + (ok ? '<span class="badge bg-success">送信済</span>' : '<span class="badge bg-secondary">未送信</span>') + '</td>';
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
      updateSortUiState();
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
      var unsent = visitorData.filter(function (v) {
        return !isAttendanceMailSuppressed(v.attendanceStatus) && !v[prop];
      });
      if (unsent.length === 0) return;
      pendingSendUnsentKey = key;
      var label = MAIL_LABELS[key] || key;
      var intro = document.getElementById('sendUnsentModalIntro');
      if (intro) intro.textContent = '「' + label + '」を、以下 ' + Math.min(40, unsent.length) + ' 件の宛先に送信します。';
      var title = document.getElementById('sendUnsentMailModalLabel');
      if (title) title.textContent = '未送信ユーザーへの送信（' + label + '）';
      var unsentSubject = document.getElementById('sendUnsentModalSubject');
      var unsentBody = document.getElementById('sendUnsentModalBody');
      if (unsentSubject) unsentSubject.value = SEND_UNSENT_DEFAULT_SUBJECT;
      if (unsentBody) unsentBody.value = SEND_UNSENT_DEFAULT_BODY;
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
      var unsent = visitorData.filter(function (v) {
        return !isAttendanceMailSuppressed(v.attendanceStatus) && !v[prop];
      });
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
      mail4: { subject: '【最終】イベントのご案内（メール4）', body: '{{氏名}} 様\n\nメール4本文です。' },
      mail5: { subject: '【追加】イベントのご案内（メール5）', body: '{{氏名}} 様\n\nメール5本文です。' }
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
    if (btnMailDeliveryEdit) {
      btnMailDeliveryEdit.addEventListener('click', function () {
        window.toggleMailDeliveryEdit(true);
      });
    }
    if (btnMailDeliverySave) {
      btnMailDeliverySave.addEventListener('click', function () {
        window.toggleMailDeliveryEdit(false);
      });
    }
    if (btnAddMail5) {
      btnAddMail5.addEventListener('click', function () {
        addMail5Row();
      });
    }
    if (visitorTableEl) {
      visitorTableEl.addEventListener('click', function (e) {
        var sortBtn = e.target.closest('.btn-col-sort');
        if (!sortBtn || sortBtn.disabled) return;
        e.preventDefault();
        sortState = { col: sortBtn.getAttribute('data-col'), dir: sortBtn.getAttribute('data-dir') };
        currentPage = 1;
        render();
      });
    }
    if (btnReset) btnReset.addEventListener('click', function () {
      if (filterName) filterName.value = '';
      if (filterMail1) filterMail1.value = '';
      if (filterMail2) filterMail2.value = '';
      if (filterMail3) filterMail3.value = '';
      if (filterMail4) filterMail4.value = '';
      if (filterMail5) filterMail5.value = '';
      sortState = { col: null, dir: 'asc' };
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

    function initDeliveryEditForm() {
      var yEl = document.getElementById('editDeliveryYear');
      var mEl = document.getElementById('editDeliveryMonth');
      var dEl = document.getElementById('editDeliveryDay');
      var hEl = document.getElementById('editDeliveryHour');
      var minEl = document.getElementById('editDeliveryMinute');
      if (!yEl || !mEl || !dEl || !hEl || !minEl) return;
      yEl.innerHTML = '';
      for (var yi = 2024; yi <= 2030; yi++) yEl.innerHTML += '<option value="' + yi + '">' + yi + '年</option>';
      mEl.innerHTML = '';
      for (var mi = 1; mi <= 12; mi++) mEl.innerHTML += '<option value="' + mi + '">' + mi + '月</option>';
      dEl.innerHTML = '';
      for (var di = 1; di <= 31; di++) dEl.innerHTML += '<option value="' + di + '">' + di + '日</option>';
      hEl.innerHTML = '';
      for (var hi = 0; hi <= 23; hi++) hEl.innerHTML += '<option value="' + hi + '">' + hi + '時</option>';
      minEl.innerHTML = '';
      for (var m2 = 0; m2 <= 59; m2++) minEl.innerHTML += '<option value="' + m2 + '">' + pad2(m2) + '分</option>';
    }

    function openMailHelpModal(key) {
      var body = document.getElementById('mailHelpModalBody');
      var title = document.getElementById('mailHelpModalLabel');
      var text = HELP_TEXT[key];
      if (!text) return;
      if (title) title.textContent = key === 'optionalSend' ? '任意配信について' : 'メール配信について';
      if (body) body.textContent = text;
      new bootstrap.Modal(document.getElementById('mailHelpModal')).show();
    }

    document.addEventListener('click', function (e) {
      var hb = e.target.closest('.mail-help-btn');
      if (hb) {
        e.preventDefault();
        var hk = hb.getAttribute('data-help');
        if (hk) openMailHelpModal(hk);
        return;
      }
      var eb = e.target.closest('.btn-edit-delivery');
      if (eb) {
        e.preventDefault();
        var mk = eb.getAttribute('data-mail-key');
        if (!mk || !autoDeliverySchedules[mk]) return;
        editingDeliveryKey = mk;
        var sch = autoDeliverySchedules[mk];
        var lead = document.getElementById('deliveryScheduleEditLead');
        if (lead) lead.textContent = '「' + (MAIL_LABELS[mk] || mk) + '」の配信日時を編集します。';
        var yEl = document.getElementById('editDeliveryYear');
        var mEl = document.getElementById('editDeliveryMonth');
        var dEl = document.getElementById('editDeliveryDay');
        var hEl = document.getElementById('editDeliveryHour');
        var minEl = document.getElementById('editDeliveryMinute');
        if (yEl) yEl.value = String(sch.year);
        if (mEl) mEl.value = String(sch.month);
        if (dEl) dEl.value = String(sch.day);
        if (hEl) hEl.value = String(sch.hour);
        if (minEl) minEl.value = String(sch.minute);
        new bootstrap.Modal(document.getElementById('deliveryScheduleEditModal')).show();
      }
    });

    var deliveryScheduleSaveBtn = document.getElementById('deliveryScheduleSaveBtn');
    if (deliveryScheduleSaveBtn) {
      deliveryScheduleSaveBtn.addEventListener('click', function () {
        if (!editingDeliveryKey || !autoDeliverySchedules[editingDeliveryKey]) return;
        var y = parseInt(document.getElementById('editDeliveryYear').value, 10);
        var mo = parseInt(document.getElementById('editDeliveryMonth').value, 10);
        var da = parseInt(document.getElementById('editDeliveryDay').value, 10);
        var ho = parseInt(document.getElementById('editDeliveryHour').value, 10);
        var mi = parseInt(document.getElementById('editDeliveryMinute').value, 10);
        autoDeliverySchedules[editingDeliveryKey] = {
          year: y, month: mo, day: da, hour: ho, minute: isNaN(mi) ? 0 : mi
        };
        updateDeliveryDatetimeDisplay();
        var inst = bootstrap.Modal.getInstance(document.getElementById('deliveryScheduleEditModal'));
        if (inst) inst.hide();
        editingDeliveryKey = null;
        alert('配信日時を変更しました。');
      });
    }

    initDeliveryEditForm();
    updateDeliveryDatetimeDisplay();
    setMailDeliveryEditMode(false);
    syncVisitorMailColumnLabels();
    render();
  });
})();
