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

  window.goVisitor = function (userId) {
    location.href = 'user_visitor_detail.html?id=' + encodeURIComponent(userId);
  };
  window.goStaff = function (staffId) {
    location.href = 'user_staff_detail.html?id=' + encodeURIComponent(staffId);
  };

  document.addEventListener('DOMContentLoaded', function () {
    /** ファイル名等に使うイベントコード（先頭列の来場者識別は各行の userid） */
    var EVENT_CODE = 'NBCS2026-M0305';
    /** 入退場・CSV「すべてのプログラム」列の定義順（key は visitor オブジェクトのプロパティ名） */
    var PROGRAM_DEFS = [
      { key: 'keynote', label: '基調講演' },
      { key: 'sa', label: 'セッションA' },
      { key: 'sb', label: 'セッションB' },
      { key: 'sc', label: 'セッションC' },
      { key: 'sd', label: 'セッションD' },
      { key: 'dialog', label: 'ダイアログセッション' },
      { key: 'net', label: 'ネットワーキング' }
    ];

    function pad2(n) {
      return String(n).padStart(2, '0');
    }
    function csvEscape(cell) {
      var s = cell == null ? '' : String(cell);
      if (/[",\r\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
      return s;
    }
    function buildCsvHeaderRow() {
      var headers = [
        'イベント識別番号',
        '会社名',
        '部門',
        '氏名',
        '姓（カナ）',
        '名（カナ）',
        'メールアドレス',
        'イベント入退場',
        '入場時刻',
        '退場時刻',
        '基調講演参加',
        '入場時間１',
        '退場時間１',
        '入場時間２',
        '退場時間２',
        '入場時間３',
        '退場時間３'
      ];
      PROGRAM_DEFS.forEach(function (def) {
        headers.push(def.label + '参加', def.label + '入場', def.label + '退場');
      });
      return headers.map(csvEscape).join(',');
    }
    function keynoteJoinLabel(v) {
      if (!v.present) return '不参加';
      return v.keynote === 2 ? '参加' : '不参加';
    }
    function eventInOutLabel(v) {
      if (!v.present) return '未入場';
      return '入場済';
    }
    function buildCsvRow(v) {
      var slots = v.programSlots || [];
      var p1 = slots[1] || {};
      var p2 = slots[2] || {};
      var p3 = slots[3] || {};
      var cells = [
        v.userid || '',
        v.company || '',
        v.dept || '',
        v.name || '',
        v.kanaLast || '',
        v.kanaFirst || '',
        v.email || '',
        eventInOutLabel(v),
        v.eventEntryTime || '',
        v.eventExitTime || '',
        keynoteJoinLabel(v),
        p1.enterAt || '',
        p1.exitAt || '',
        p2.enterAt || '',
        p2.exitAt || '',
        p3.enterAt || '',
        p3.exitAt || ''
      ];
      slots.forEach(function (s) {
        cells.push(s.joinLabel || '', s.enterAt || '', s.exitAt || '');
      });
      return cells.map(csvEscape).join(',');
    }
    function downloadCsv(filename, csvText) {
      var bom = '\uFEFF';
      var blob = new Blob([bom + csvText], { type: 'text/csv;charset=utf-8;' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }

    var staffs = [
      { id: 'yamada', name: '山田 太郎' },
      { id: 'sato', name: '佐藤 花子' },
      { id: 'suzuki', name: '鈴木 次郎' }
    ];
    var names = ['田中 一郎', '高橋 美咲', '伊藤 健太', '渡辺 真理子', '山本 翔', '中村 恵子', '小林 直樹', '加藤 優', '吉田 さくら', '松本 大輔', '井上 あかり', '木村 拓也', '林 由美', '斎藤 健', '清水 麻衣', '山口 涼太', '森 絵里香', '池田 翔太', '橋本 美羽', '山崎 竜也'];
    var companies = ['株式会社サンプル', 'サンプル商事株式会社', '東京テック株式会社', '株式会社グローバル企画', 'デジタルイノベーション株式会社', '株式会社未来創研', 'ベンチャーキャピタル株式会社', '株式会社スタートアップラボ', '株式会社イノベーション', 'テクノロジー株式会社', '株式会社グロース', '株式会社ネクスト', '株式会社ビジョン', '株式会社フューチャー', '株式会社クリエイト', '株式会社ソリューション', '株式会社パートナーズ', '株式会社ビジネス開発', '株式会社新規事業', '株式会社戦略企画'];
    var visitorDepts = ['マーケティング部', '開発本部', '人事総務', '研究開発室', '海外営業'];
    var kanaLastPool = ['タナカ', 'タカハシ', 'イトウ', 'スズキ', 'ヤマモト', 'ナカムラ', 'コバヤシ', 'サトウ'];
    var kanaFirstPool = ['イチロウ', 'ミサキ', 'ケンタ', 'マリコ', 'タケシ', 'ユウコ', 'ハナコ', 'リョウ'];

    function splitFullName(full) {
      var t = (full || '').trim().split(/\s+/);
      if (t.length >= 2) return { last: t[0], first: t.slice(1).join(' ') };
      return { last: t[0] || '', first: '' };
    }
    var VISITOR_TOTAL = 100;
    var visitorData = [];
    var i, n, c, s;
    for (i = 0; i < VISITOR_TOTAL; i++) {
      n = i % names.length;
      c = i % companies.length;
      s = staffs[i % 3];
      var present = Math.random() < 0.7;
      var sp = splitFullName(names[n]);
      var v = {
        userid: 'U' + String(i + 1).padStart(3, '0'),
        name: names[n],
        lastName: sp.last,
        firstName: sp.first,
        company: companies[c],
        dept: visitorDepts[i % visitorDepts.length],
        email: 'guest' + String(i + 1).padStart(3, '0') + '@example.com',
        kanaLast: kanaLastPool[i % kanaLastPool.length],
        kanaFirst: kanaFirstPool[i % kanaFirstPool.length],
        staffId: s.id,
        staffName: s.name,
        registrationType: '事前',
        present: present,
        keynote: present ? (Math.random() < 0.5 ? 2 : 0) : 0,
        sa: present ? (Math.random() < 0.5 ? 2 : 0) : 0,
        sb: present ? (Math.random() < 0.5 ? 2 : 0) : 0,
        sc: present ? (Math.random() < 0.6 ? 2 : 0) : 0,
        sd: 0,
        dialog: 0,
        net: 0
      };
      var eventEntryTime = '';
      var eventExitTime = '';
      if (present) {
        eventEntryTime = pad2(13) + ':' + pad2(1 + (i % 8) * 4);
        eventExitTime = pad2(17) + ':' + pad2(20 + (i % 15));
      }
      v.eventEntryTime = eventEntryTime;
      v.eventExitTime = eventExitTime;
      v.programSlots = [];
      var pi, def, joined, enterAt, exitAt, baseMin, endMin;
      for (pi = 0; pi < PROGRAM_DEFS.length; pi++) {
        def = PROGRAM_DEFS[pi];
        joined = present && v[def.key] === 2;
        enterAt = '';
        exitAt = '';
        if (joined) {
          baseMin = 13 * 60 + 10 + pi * 25 + (i % 7) * 3;
          endMin = baseMin + 20 + ((i + pi) % 25);
          enterAt = pad2(Math.floor(baseMin / 60)) + ':' + pad2(baseMin % 60);
          exitAt = pad2(Math.floor(endMin / 60)) + ':' + pad2(endMin % 60);
        }
        v.programSlots.push({
          joinLabel: joined ? '参加' : '不参加',
          enterAt: enterAt,
          exitAt: exitAt
        });
      }
      visitorData.push(v);
    }
    visitorData.unshift({
      userid: 'U101',
      name: '当日 来場者',
      lastName: '当日',
      firstName: '来場者',
      company: '当日登録株式会社',
      dept: '営業本部',
      email: 'today101@example.com',
      kanaLast: 'トウジツ',
      kanaFirst: 'ライジョウシャ',
      staffId: 'yamada',
      staffName: '山田 太郎',
      registrationType: '当日',
      present: true,
      keynote: 2,
      sa: 0,
      sb: 0,
      sc: 0,
      sd: 0,
      dialog: 0,
      net: 0,
      eventEntryTime: '13:10',
      eventExitTime: '',
      programSlots: [
        { joinLabel: '参加', enterAt: '13:10', exitAt: '' },
        { joinLabel: '不参加', enterAt: '', exitAt: '' },
        { joinLabel: '不参加', enterAt: '', exitAt: '' },
        { joinLabel: '不参加', enterAt: '', exitAt: '' },
        { joinLabel: '不参加', enterAt: '', exitAt: '' },
        { joinLabel: '不参加', enterAt: '', exitAt: '' },
        { joinLabel: '不参加', enterAt: '', exitAt: '' }
      ]
    });

    var filterStaff = document.getElementById('filterStaff');
    var filterSession = document.getElementById('filterSession');
    var filterName = document.getElementById('filterName');
    var btnApply = document.getElementById('btnApply');
    var btnReset = document.getElementById('btnReset');
    var perPageSelect = document.getElementById('perPage');
    var tbody = document.getElementById('visitorTbody');
    var countLabel = document.getElementById('countLabel');
    var pageInfo = document.getElementById('pageInfo');
    var paginationList = document.getElementById('paginationList');

    var currentPage = 1;
    var filteredData = [];

    function badgeStatus(status) {
      if (status === 2) return '<span class="badge badge-status-done">参加済</span>';
      return '<span class="badge badge-status-none">不参加</span>';
    }

    function renderRow(v) {
      var tr = document.createElement('tr');
      tr.className = 'visitor-row';
      tr.setAttribute('data-userid', v.userid);
      tr.setAttribute('data-staff', v.staffId);
      tr.setAttribute('data-keynote', v.keynote);
      tr.setAttribute('data-sa', v.sa);
      tr.setAttribute('data-sc', v.sc);
      tr.setAttribute('data-sd', v.sd);
      tr.setAttribute('data-dialog', v.dialog);
      tr.setAttribute('data-net', v.net);
      tr.onclick = function () { window.goVisitor(v.userid); };
      var raichoHtml = v.present ? '<span class="badge bg-success">入場</span>' : '<span class="badge bg-secondary">未入場</span>';
      var taijoHtml = v.eventExitTime ? '<span class="badge bg-danger">退場</span>' : '<span class="badge bg-secondary">未退場</span>';
      var regTypeHtml = (v.registrationType === '当日')
        ? '<span class="badge bg-warning text-dark">当日</span>'
        : '<span class="badge bg-secondary">事前</span>';
      var staffCell = '<td onclick="event.stopPropagation(); window.goStaff(\'' + v.staffId + '\')"><a href="user_staff_detail.html?id=' + encodeURIComponent(v.staffId) + '" class="staff-link">' + v.staffName + '</a></td>';
      var k0 = v.present ? v.keynote : 0;
      var sa0 = v.present ? v.sa : 0;
      var sb0 = v.present ? v.sb : 0;
      var sc0 = v.present ? v.sc : 0;
      var sd0 = v.present ? v.sd : 0;
      var d0 = v.present ? v.dialog : 0;
      var n0 = v.present ? v.net : 0;
      tr.innerHTML = '<td>' + v.userid + '</td><td class="text-center">' + regTypeHtml + '</td><td>' + v.company + '</td><td>' + v.name + '</td>' + staffCell +
        '<td class="text-center">' + raichoHtml + '</td>' +
        '<td class="text-center">' + badgeStatus(k0) + '</td>' +
        '<td class="text-center">' + badgeStatus(sa0) + '</td>' +
        '<td class="text-center">' + badgeStatus(sb0) + '</td>' +
        '<td class="text-center">' + badgeStatus(sc0) + '</td>' +
        '<td class="text-center">' + badgeStatus(sd0) + '</td>' +
        '<td class="text-center">' + badgeStatus(d0) + '</td>' +
        '<td class="text-center">' + badgeStatus(n0) + '</td>' +
        '<td class="text-center">' + taijoHtml + '</td>';
      return tr;
    }

    function visitorSearchMatches(v, q) {
      if (!q) return true;
      var hay = [
        v.userid || '',
        v.name || '',
        v.company || '',
        v.dept || '',
        v.lastName || '',
        v.firstName || '',
        v.kanaLast || '',
        v.kanaFirst || '',
        v.email || ''
      ].join(' ');
      return hay.indexOf(q) >= 0;
    }

    function getFiltered() {
      var staffVal = filterStaff ? filterStaff.value : '';
      var sessionVal = filterSession ? filterSession.value : '';
      var nameVal = filterName ? filterName.value.trim() : '';
      var attrMap = { keynote: 'keynote', session_a: 'sa', session_b: 'sb', session_c: 'sc', session_d: 'sd', dialog: 'dialog', networking: 'net' };
      return visitorData.filter(function (v) {
        var showStaff = !staffVal || v.staffId === staffVal;
        var showSession = true;
        if (sessionVal && attrMap[sessionVal]) showSession = v[attrMap[sessionVal]] === 2;
        var showSearch = visitorSearchMatches(v, nameVal);
        return showStaff && showSession && showSearch;
      });
    }

    function render() {
      filteredData = getFiltered();
      var perPageVal = perPageSelect ? parseInt(perPageSelect.value, 10) : 20;
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
        if (filterSession) filterSession.value = '';
        if (filterName) filterName.value = '';
        currentPage = 1;
        render();
      });
    }
    if (filterName) filterName.addEventListener('input', function () { currentPage = 1; render(); });
    if (perPageSelect) perPageSelect.addEventListener('change', function () { currentPage = 1; render(); });

    var btnCsv = document.getElementById('btnCsv');
    var btnAddTodayVisitor = document.getElementById('btnAddTodayVisitor');
    if (btnAddTodayVisitor) {
      btnAddTodayVisitor.addEventListener('click', function () {
        location.href = 'user_visitor_create_today.html';
      });
    }
    if (btnCsv) {
      btnCsv.addEventListener('click', function () {
        var list = getFiltered();
        var lines = [buildCsvHeaderRow()];
        var ci;
        for (ci = 0; ci < list.length; ci++) lines.push(buildCsvRow(list[ci]));
        downloadCsv('来場入退場_' + EVENT_CODE + '.csv', lines.join('\r\n'));
      });
    }

    render();
  });
})();
