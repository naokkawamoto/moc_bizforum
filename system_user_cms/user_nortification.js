(function () {
  'use strict';

  // ダミーお知らせデータ（60件：50/100ページネーション確認用）
  var NOTICES = [
    { date: '03/05', time: '14:32', company: '株式会社サンプル', visitor: '田中 一郎', staff: 'yamada', staffName: '山田 太郎', event: 'New Business Creation Strategy 2026', program: 'セッションC', action: '来場', unread: 1 },
    { date: '03/05', time: '14:28', company: 'サンプル商事株式会社', visitor: '高橋 美咲', staff: 'sato', staffName: '佐藤 花子', event: 'New Business Creation Strategy 2026', program: '基調講演', action: '退場', unread: 0 },
    { date: '03/05', time: '14:15', company: '東京テック株式会社', visitor: '伊藤 健太', staff: 'suzuki', staffName: '鈴木 次郎', event: 'New Business Creation Strategy 2026', program: 'セッションC', action: '来場', unread: 1 },
    { date: '03/05', time: '13:55', company: '株式会社グローバル企画', visitor: '渡辺 真理子', staff: 'yamada', staffName: '山田 太郎', event: 'New Business Creation Strategy 2026', program: 'セッションB', action: '退場', unread: 0 },
    { date: '03/05', time: '13:45', company: 'デジタルイノベーション株式会社', visitor: '山本 翔', staff: 'sato', staffName: '佐藤 花子', event: 'New Business Creation Strategy 2026', program: '基調講演', action: '来場', unread: 1 },
    { date: '03/05', time: '13:30', company: '株式会社未来創研', visitor: '中村 恵子', staff: 'suzuki', staffName: '鈴木 次郎', event: 'New Business Creation Strategy 2026', program: 'セッションA', action: '来場', unread: 0 },
    { date: '03/05', time: '13:15', company: 'ベンチャーキャピタル株式会社', visitor: '小林 直樹', staff: 'yamada', staffName: '山田 太郎', event: 'New Business Creation Strategy 2026', program: '基調講演', action: '退場', unread: 0 },
    { date: '03/05', time: '13:00', company: '株式会社スタートアップラボ', visitor: '加藤 優', staff: 'sato', staffName: '佐藤 花子', event: 'New Business Creation Strategy 2026', program: '基調講演', action: '来場', unread: 1 },
    { date: '03/04', time: '17:20', company: '株式会社イノベーション', visitor: '吉田 さくら', staff: 'suzuki', staffName: '鈴木 次郎', event: '経営DXフォーラム 2026', program: 'ネットワーキング', action: '退場', unread: 0 },
    { date: '03/04', time: '16:45', company: 'テクノロジー株式会社', visitor: '松本 大輔', staff: 'yamada', staffName: '山田 太郎', event: '経営DXフォーラム 2026', program: 'ダイアログ', action: '来場', unread: 0 },
  ];

  // 60件になるまで複製して日時・担当・未読をばらす
  var baseLen = NOTICES.length;
  for (var i = 0; i < baseLen * 5; i++) {
    var src = NOTICES[i % baseLen];
    var d = new Date(2026, 2, 4 + Math.floor(i / 20), 9 + (i % 10), (i * 3) % 60);
    NOTICES.push({
      date: ('0' + (d.getMonth() + 1)).slice(-2) + '/' + ('0' + d.getDate()).slice(-2),
      time: ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2),
      company: src.company,
      visitor: src.visitor,
      staff: src.staff,
      staffName: src.staffName,
      event: src.event,
      program: src.program,
      action: src.action,
      unread: i % 3 === 0 ? 1 : 0
    });
  }

  function getStaffValues() {
    var checks = document.querySelectorAll('.staff-check:checked');
    return Array.prototype.map.call(checks, function (c) { return c.value; });
  }

  function getFilterState() {
    var staffValues = getStaffValues();
    var unreadOnly = document.getElementById('checkUnreadOnly') && document.getElementById('checkUnreadOnly').checked;
    var visitor = (document.getElementById('filterVisitor') && document.getElementById('filterVisitor').value.trim()) || '';
    var program = (document.getElementById('filterProgram') && document.getElementById('filterProgram').value) || '';
    return { staffValues: staffValues, unreadOnly: unreadOnly, visitor: visitor, program: program };
  }

  function filterNotices(list) {
    var state = getFilterState();
    return list.filter(function (n) {
      if (state.staffValues.length && state.staffValues.indexOf(n.staff) < 0) return false;
      if (state.unreadOnly && !n.unread) return false;
      if (state.visitor && n.visitor.indexOf(state.visitor) < 0) return false;
      if (state.program && n.program !== state.program) return false;
      return true;
    });
  }

  function buildText(n) {
    var actionText;
    if (n.program) {
      actionText = n.action === '来場' ? n.program + ' に入室' : n.program + ' から退室';
    } else {
      actionText = n.action === '来場' ? '来場' : 'から退場';
    }
    return '<div class="notice-timestamp">' + n.date + ' ' + n.time + '</div>' +
           '<div class="notice-company-visitor">' + n.company + ',' + n.visitor + '様</div>' +
           '<div class="notice-program-action">' + actionText + '</div>';
  }

  function renderList(filtered, perPage, page) {
    var listEl = document.getElementById('noticeList');
    if (!listEl) return;
    var start = (page - 1) * perPage;
    var pageItems = filtered.slice(start, start + perPage);
    listEl.innerHTML = pageItems.map(function (n) {
      var badge = n.unread ? '<span class="badge bg-danger ms-2">未読</span>' : '<span class="badge bg-secondary ms-2">既読</span>';
      return '<div class="list-group-item notice-item d-flex justify-content-between align-items-start' + (n.unread ? ' unread' : '') + '" data-staff="' + n.staff + '" data-unread="' + n.unread + '" data-visitor="' + (n.visitor || '').replace(/"/g, '&quot;') + '" data-program="' + (n.program || '').replace(/"/g, '&quot;') + '">' +
        '<div class="flex-grow-1">' + buildText(n) + '</div>' + badge + '</div>';
    }).join('');
  }

  function renderPagination(filtered, perPage, currentPage) {
    var total = filtered.length;
    var totalPages = Math.max(1, Math.ceil(total / perPage));
    var ul = document.getElementById('paginationList');
    var pageInfo = document.getElementById('pageInfo');
    var countLabel = document.getElementById('countLabel');
    if (!ul || !pageInfo || !countLabel) return;

    countLabel.textContent = '全' + total + '件';
    var start = (currentPage - 1) * perPage;
    var end = Math.min(start + perPage, total);
    if (total === 0) {
      pageInfo.textContent = '0件';
    } else {
      pageInfo.textContent = (start + 1) + '-' + end + '件目を表示（' + currentPage + '/' + totalPages + 'ページ）';
    }

    ul.innerHTML = '';
    if (totalPages <= 1) return;

    function addLi(content, active, disabled) {
      var li = document.createElement('li');
      li.className = 'page-item' + (active ? ' active' : '') + (disabled ? ' disabled' : '');
      li.innerHTML = content;
      ul.appendChild(li);
    }

    addLi('<a class="page-link" href="#" data-page="' + (currentPage - 1) + '">前へ</a>', false, currentPage <= 1);
    var shown = {};
    for (var p = 1; p <= totalPages; p++) {
      if (p === 1 || p === totalPages || (p >= currentPage - 2 && p <= currentPage + 2)) shown[p] = true;
    }
    var lastP = 0;
    for (var q = 1; q <= totalPages; q++) {
      if (shown[q]) {
        if (lastP && q - lastP > 1) addLi('<span class="page-link">…</span>', false, true);
        addLi('<a class="page-link" href="#" data-page="' + q + '">' + q + '</a>', q === currentPage, false);
        lastP = q;
      }
    }
    addLi('<a class="page-link" href="#" data-page="' + (currentPage + 1) + '">次へ</a>', false, currentPage >= totalPages);

    ul.querySelectorAll('a[data-page]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        e.preventDefault();
        var p = parseInt(a.getAttribute('data-page'), 10);
        if (p >= 1 && p <= totalPages) updateView(p);
      });
    });
  }

  var currentPage = 1;

  function updateView(page) {
    currentPage = Math.max(1, page);
    var perPage = parseInt(document.getElementById('perPage') && document.getElementById('perPage').value, 10) || 50;
    var filtered = filterNotices(NOTICES);
    var totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
    if (currentPage > totalPages) currentPage = totalPages;
    renderList(filtered, perPage, currentPage);
    renderPagination(filtered, perPage, currentPage);
  }

  function bindEvents() {
    document.querySelectorAll('.staff-check').forEach(function (cb) {
      cb.addEventListener('change', function () { currentPage = 1; updateView(1); });
    });
    if (document.getElementById('checkUnreadOnly')) {
      document.getElementById('checkUnreadOnly').addEventListener('change', function () { currentPage = 1; updateView(1); });
    }
    if (document.getElementById('btnSearch')) {
      document.getElementById('btnSearch').addEventListener('click', function () { currentPage = 1; updateView(1); });
    }
    if (document.getElementById('filterProgram')) {
      document.getElementById('filterProgram').addEventListener('change', function () { currentPage = 1; updateView(1); });
    }
    if (document.getElementById('btnReset')) {
      document.getElementById('btnReset').addEventListener('click', function () {
        if (document.getElementById('filterVisitor')) document.getElementById('filterVisitor').value = '';
        if (document.getElementById('filterProgram')) document.getElementById('filterProgram').value = '';
        currentPage = 1;
        updateView(1);
      });
    }
    if (document.getElementById('perPage')) {
      document.getElementById('perPage').addEventListener('change', function () { currentPage = 1; updateView(1); });
    }
  }

  // ヘッダー・フッター
  fetch('user_header.html').then(function (r) { return r.text(); }).then(function (html) {
    var el = document.getElementById('header-container');
    if (el) el.innerHTML = html;
  }).catch(function () {});
  fetch('user_footer.html').then(function (r) { return r.text(); }).then(function (html) {
    var el = document.getElementById('footer-container');
    if (el) el.innerHTML = html;
  }).catch(function () {});

  bindEvents();
  updateView(1);
})();
