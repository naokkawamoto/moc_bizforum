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
    var visitorJobTitles = ['部長', '課長', '主任', 'マネージャー', '担当', '室長'];
    var visitorSessions = ['セッションA', 'ネットワーキング', '基調講演', 'ダイアログ', 'セッションB'];
    var lotteryResults = ['当選', 'ブランク'];
    var attendanceStatuses = ['本人出席', '欠席', 'キャンセル'];
    var salesKeyRotation = ['yamada', 'sato', 'suzuki', 'takahashi', 'watanabe'];
    var kanaLastPool = ['タナカ', 'タカハシ', 'イトウ', 'スズキ', 'ヤマモト', 'ナカムラ', 'コバヤシ', 'サトウ', 'カトウ', 'ヨシダ'];
    var kanaFirstPool = ['イチロウ', 'ミサキ', 'ケンタ', 'マリコ', 'タケシ', 'ユウコ', 'ハナコ', 'リョウ', 'ユミ', 'ダイスケ'];

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
      visitorData.push({
        userid: 'U' + String(i + 1).padStart(3, '0'),
        lotteryResult: lotteryResults[i % lotteryResults.length],
        attendanceStatus: attendanceStatuses[i % attendanceStatuses.length],
        company: companies[c],
        dept: visitorDepts[i % visitorDepts.length],
        jobTitle: visitorJobTitles[i % visitorJobTitles.length],
        lastName: sp.last,
        firstName: sp.first,
        name: names[n],
        kanaLast: kanaLastPool[i % kanaLastPool.length],
        kanaFirst: kanaFirstPool[i % kanaFirstPool.length],
        email: 'guest' + String(i + 1).padStart(3, '0') + '@example.com',
        session: visitorSessions[i % visitorSessions.length],
        staffId: salesMeta.staffId,
        staffName: salesMeta.name,
        present: present
      });
    }

    var filterStaff = document.getElementById('filterStaff');
    var filterName = document.getElementById('filterName');
    var btnApply = document.getElementById('btnApply');
    var btnReset = document.getElementById('btnReset');
    var perPageSelect = document.getElementById('perPage');
    var tbody = document.getElementById('visitorTbody');
    var countLabel = document.getElementById('countLabel');
    var pageInfo = document.getElementById('pageInfo');
    var paginationList = document.getElementById('paginationList');
    var btnPrintAll = document.getElementById('btnPrintAll');
    var btnPrintSettings = document.getElementById('btnPrintSettings');
    var previewModal = document.getElementById('previewModal');
    var btnPrintOne = document.getElementById('btnPrintOne');
    var addVisitorModal = document.getElementById('addVisitorModal');
    var addVisitorCompany = document.getElementById('addVisitorCompany');
    var addVisitorDept = document.getElementById('addVisitorDept');
    var addVisitorJobTitle = document.getElementById('addVisitorJobTitle');
    var addVisitorLastName = document.getElementById('addVisitorLastName');
    var addVisitorFirstName = document.getElementById('addVisitorFirstName');
    var addVisitorFullName = document.getElementById('addVisitorFullName');
    var addVisitorKanaLast = document.getElementById('addVisitorKanaLast');
    var addVisitorKanaFirst = document.getElementById('addVisitorKanaFirst');
    var addVisitorEmail = document.getElementById('addVisitorEmail');
    var addVisitorSession = document.getElementById('addVisitorSession');
    var addVisitorSalesStaff = document.getElementById('addVisitorSalesStaff');
    var addVisitorSaveBtn = document.getElementById('addVisitorSaveBtn');
    var btnAddVisitor = document.getElementById('btnAddVisitor');
    var btnBulkAddCsv = document.getElementById('btnBulkAddCsv');
    var btnEditVisitors = document.getElementById('btnEditVisitors');
    var printSettingsModal = document.getElementById('printSettingsModal');
    var printSettingsSaveBtn = document.getElementById('printSettingsSaveBtn');

    var currentPage = 1;
    var filteredData = [];
    var currentPreviewVisitor = null;
    var isVisitorEditMode = false;

    function escCell(s) {
      if (s == null) return '';
      return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    function getStaffOptionKey(v) {
      var keys = Object.keys(SALES_STAFF_META);
      for (var i = 0; i < keys.length; i++) {
        var k = keys[i];
        if (SALES_STAFF_META[k].name === v.staffName) return k;
      }
      return '';
    }

    function attendanceSelectHtml(v) {
      var opts = ['本人出席', '欠席', 'キャンセル'];
      var html = '<select class="form-select form-select-sm js-attendance" data-userid="' + String(v.userid || '').replace(/"/g, '&quot;') + '">';
      for (var i = 0; i < opts.length; i++) {
        var selected = v.attendanceStatus === opts[i] ? ' selected' : '';
        html += '<option value="' + opts[i] + '"' + selected + '>' + opts[i] + '</option>';
      }
      html += '</select>';
      return html;
    }

    function staffSelectHtml(v) {
      var selectedKey = getStaffOptionKey(v);
      var html = '<select class="form-select form-select-sm js-staff" data-userid="' + String(v.userid || '').replace(/"/g, '&quot;') + '">';
      html += '<option value="">選択なし</option>';
      Object.keys(SALES_STAFF_META).forEach(function (k) {
        var meta = SALES_STAFF_META[k];
        var selected = selectedKey === k ? ' selected' : '';
        html += '<option value="' + k + '"' + selected + '>' + meta.name + '</option>';
      });
      html += '</select>';
      return html;
    }

    function renderRow(v) {
      var tr = document.createElement('tr');
      if (isVisitorEditMode) {
        tr.innerHTML =
          '<td class="text-nowrap">' + escCell(v.userid) + '</td>' +
          '<td>' + attendanceSelectHtml(v) + '</td>' +
          '<td>' + escCell(v.company) + '</td>' +
          '<td>' + escCell(v.dept) + '</td>' +
          '<td>' + escCell(v.jobTitle) + '</td>' +
          '<td>' + escCell(v.name) + '</td>' +
          '<td>' + escCell(v.kanaLast) + '</td>' +
          '<td>' + escCell(v.kanaFirst) + '</td>' +
          '<td>' + escCell(v.email) + '</td>' +
          '<td>' + escCell(v.session) + '</td>' +
          '<td class="text-center text-muted">—</td>' +
          '<td>' + staffSelectHtml(v) + '</td>';
      } else {
        tr.innerHTML =
          '<td class="text-nowrap">' + escCell(v.userid) + '</td>' +
          '<td>' + escCell(v.attendanceStatus) + '</td>' +
          '<td>' + escCell(v.company) + '</td>' +
          '<td>' + escCell(v.dept) + '</td>' +
          '<td>' + escCell(v.jobTitle) + '</td>' +
          '<td>' + escCell(v.name) + '</td>' +
          '<td>' + escCell(v.kanaLast) + '</td>' +
          '<td>' + escCell(v.kanaFirst) + '</td>' +
          '<td>' + escCell(v.email) + '</td>' +
          '<td>' + escCell(v.session) + '</td>' +
          '<td class="text-center"><button type="button" class="btn btn-outline-primary btn-sm btn-preview" data-userid="' + String(v.userid || '').replace(/"/g, '&quot;') + '" data-name="' + (v.name || '').replace(/"/g, '&quot;') + '" data-company="' + (v.company || '').replace(/"/g, '&quot;') + '">プレビュー</button></td>' +
          '<td>' + escCell(v.staffName) + '</td>';

        tr.querySelector('.btn-preview') && tr.querySelector('.btn-preview').addEventListener('click', function (e) {
          e.stopPropagation();
          var uid = this.getAttribute('data-userid');
          currentPreviewVisitor = visitorData.find(function (x) { return x.userid === uid; });
          var modal = new bootstrap.Modal(previewModal);
          modal.show();
        });
      }

      return tr;
    }

    function updateVisitorEditButton() {
      if (!btnEditVisitors) return;
      if (isVisitorEditMode) {
        btnEditVisitors.classList.remove('btn-outline-secondary');
        btnEditVisitors.classList.add('btn-primary');
        btnEditVisitors.innerHTML = '<i class="bi bi-check-lg me-1"></i>保存';
      } else {
        btnEditVisitors.classList.remove('btn-primary');
        btnEditVisitors.classList.add('btn-outline-secondary');
        btnEditVisitors.innerHTML = '<i class="bi bi-pencil-square me-1"></i>編集';
      }
    }

    function saveVisitorInlineEdits() {
      if (!tbody) return;
      tbody.querySelectorAll('select.js-attendance').forEach(function (el) {
        var uid = el.getAttribute('data-userid');
        var v = visitorData.find(function (x) { return x.userid === uid; });
        if (v) v.attendanceStatus = el.value;
      });
      tbody.querySelectorAll('select.js-staff').forEach(function (el) {
        var uid = el.getAttribute('data-userid');
        var v = visitorData.find(function (x) { return x.userid === uid; });
        if (!v) return;
        var key = el.value;
        if (!key || !SALES_STAFF_META[key]) {
          v.staffId = '';
          v.staffName = '';
          return;
        }
        v.staffId = SALES_STAFF_META[key].staffId;
        v.staffName = SALES_STAFF_META[key].name;
      });
    }

    function visitorSearchMatches(v, q) {
      if (!q) return true;
      var hay = [
        v.userid || '',
        v.name || '',
        v.company || '',
        v.dept || '',
        v.jobTitle || '',
        v.lastName || '',
        v.firstName || '',
        v.kanaLast || '',
        v.kanaFirst || '',
        v.email || '',
        v.session || ''
      ].join(' ');
      return hay.indexOf(q) >= 0;
    }

    function getFiltered() {
      var staffVal = filterStaff ? filterStaff.value : '';
      var nameVal = filterName ? filterName.value.trim() : '';
      return visitorData.filter(function (v) {
        var showStaff = !staffVal || v.staffId === staffVal;
        var showSearch = visitorSearchMatches(v, nameVal);
        return showStaff && showSearch;
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
        currentPage = 1;
        render();
      });
    }
    if (filterName) filterName.addEventListener('input', function () { currentPage = 1; render(); });
    if (perPageSelect) perPageSelect.addEventListener('change', function () { currentPage = 1; render(); });

    if (btnPrintAll) btnPrintAll.addEventListener('click', function () {
      alert('全来場者の名札を印刷します。\n※実際の実装では印刷ダイアログを表示します。');
    });

    if (btnPrintSettings && printSettingsModal) {
      btnPrintSettings.addEventListener('click', function () {
        var m = new bootstrap.Modal(printSettingsModal);
        m.show();
      });
    }

    if (printSettingsSaveBtn && printSettingsModal) {
      printSettingsSaveBtn.addEventListener('click', function () {
        alert('印刷設定を保存しました。\n※実際の実装ではサーバーに保存します。');
        var inst = bootstrap.Modal.getInstance(printSettingsModal);
        if (inst) inst.hide();
      });
    }

    function clearAddVisitorForm() {
      var ids = ['addVisitorCompany', 'addVisitorDept', 'addVisitorJobTitle', 'addVisitorLastName', 'addVisitorFirstName', 'addVisitorFullName', 'addVisitorKanaLast', 'addVisitorKanaFirst', 'addVisitorEmail', 'addVisitorSession', 'addVisitorSalesStaff'];
      ids.forEach(function (id) {
        var el = document.getElementById(id);
        if (el) el.value = '';
      });
    }

    if (btnAddVisitor) btnAddVisitor.addEventListener('click', function () {
      clearAddVisitorForm();
      var modal = new bootstrap.Modal(addVisitorModal);
      modal.show();
    });

    if (addVisitorSaveBtn) addVisitorSaveBtn.addEventListener('click', function () {
      var company = addVisitorCompany ? addVisitorCompany.value.trim() : '';
      var dept = addVisitorDept ? addVisitorDept.value.trim() : '';
      var jobTitle = addVisitorJobTitle ? addVisitorJobTitle.value.trim() : '';
      var lastName = addVisitorLastName ? addVisitorLastName.value.trim() : '';
      var firstName = addVisitorFirstName ? addVisitorFirstName.value.trim() : '';
      var fullNameInput = addVisitorFullName ? addVisitorFullName.value.trim() : '';
      var kanaLast = addVisitorKanaLast ? addVisitorKanaLast.value.trim() : '';
      var kanaFirst = addVisitorKanaFirst ? addVisitorKanaFirst.value.trim() : '';
      var email = addVisitorEmail ? addVisitorEmail.value.trim() : '';
      var session = addVisitorSession ? addVisitorSession.value : '';
      var salesKey = addVisitorSalesStaff ? addVisitorSalesStaff.value : '';

      if (!company) {
        alert('会社名を入力してください。');
        return;
      }
      if (!lastName || !firstName) {
        alert('姓・名を入力してください。');
        return;
      }
      if (!email) {
        alert('メールアドレスを入力してください。');
        return;
      }
      if (!salesKey || !SALES_STAFF_META[salesKey]) {
        alert('営業担当者を選択してください。');
        return;
      }
      var fullName = fullNameInput || (lastName + ' ' + firstName).trim();
      var salesMeta = SALES_STAFF_META[salesKey];

      var maxNum = visitorData.reduce(function (m, v) {
        var n = parseInt((v.userid || '').replace(/\D/g, ''), 10);
        return isNaN(n) ? m : Math.max(m, n);
      }, 0);
      var newUserid = 'U' + String(maxNum + 1).padStart(3, '0');
      visitorData.push({
        userid: newUserid,
        lotteryResult: 'ブランク',
        attendanceStatus: '本人出席',
        company: company,
        dept: dept,
        jobTitle: jobTitle,
        lastName: lastName,
        firstName: firstName,
        name: fullName,
        kanaLast: kanaLast,
        kanaFirst: kanaFirst,
        email: email,
        session: session,
        staffId: salesMeta.staffId,
        staffName: salesMeta.name,
        present: false
      });
      bootstrap.Modal.getInstance(addVisitorModal).hide();
      render();
      alert('来場者を登録しました。（' + fullName + '）');
    });

    if (btnBulkAddCsv) btnBulkAddCsv.addEventListener('click', function () {
      var csvModalEl = document.getElementById('visitorCsvImportModal');
      if (!csvModalEl) return;
      var csvModal = new bootstrap.Modal(csvModalEl);
      csvModal.show();
    });

    if (btnPrintOne) btnPrintOne.addEventListener('click', function () {
      if (currentPreviewVisitor) {
        alert(currentPreviewVisitor.name + ' の名札を印刷します。\n※実際の実装では印刷ダイアログを表示します。');
        bootstrap.Modal.getInstance(previewModal).hide();
      }
    });

    if (btnEditVisitors) {
      btnEditVisitors.addEventListener('click', function () {
        if (isVisitorEditMode) {
          saveVisitorInlineEdits();
          isVisitorEditMode = false;
          updateVisitorEditButton();
          render();
          alert('来場者リストの編集を保存しました。');
          return;
        }
        isVisitorEditMode = true;
        updateVisitorEditButton();
        render();
      });
    }

    updateVisitorEditButton();
    render();
  });
})();
