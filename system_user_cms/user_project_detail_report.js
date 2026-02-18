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
    var staffs = [
      { id: 'yamada', name: '山田 太郎' },
      { id: 'sato', name: '佐藤 花子' },
      { id: 'suzuki', name: '鈴木 次郎' }
    ];
    var names = ['田中 一郎', '高橋 美咲', '伊藤 健太', '渡辺 真理子', '山本 翔', '中村 恵子', '小林 直樹', '加藤 優', '吉田 さくら', '松本 大輔', '井上 あかり', '木村 拓也', '林 由美', '斎藤 健', '清水 麻衣', '山口 涼太', '森 絵里香', '池田 翔太', '橋本 美羽', '山崎 竜也'];
    var companies = ['株式会社サンプル', 'サンプル商事株式会社', '東京テック株式会社', '株式会社グローバル企画', 'デジタルイノベーション株式会社', '株式会社未来創研', 'ベンチャーキャピタル株式会社', '株式会社スタートアップラボ', '株式会社イノベーション', 'テクノロジー株式会社', '株式会社グロース', '株式会社ネクスト', '株式会社ビジョン', '株式会社フューチャー', '株式会社クリエイト', '株式会社ソリューション', '株式会社パートナーズ', '株式会社ビジネス開発', '株式会社新規事業', '株式会社戦略企画'];
    var VISITOR_TOTAL = 100;
    var visitorData = [];
    var i, n, c, s, vip;
    for (i = 0; i < VISITOR_TOTAL; i++) {
      n = i % names.length;
      c = i % companies.length;
      s = staffs[i % 3];
      vip = (i % 10 === 0) ? 1 : 0;
      var present = Math.random() < 0.7;
      visitorData.push({
        userid: 'U' + String(i + 1).padStart(3, '0'),
        name: names[n],
        company: companies[c],
        staffId: s.id,
        staffName: s.name,
        vip: vip,
        present: present,
        keynote: present ? (Math.random() < 0.5 ? 2 : 0) : 0,
        sa: present ? (Math.random() < 0.5 ? 2 : 0) : 0,
        sb: present ? (Math.random() < 0.5 ? 2 : 0) : 0,
        sc: present ? (Math.random() < 0.6 ? 1 : 0) : 0,
        sd: 0,
        dialog: 0,
        net: 0
      });
    }

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
      if (status === 1) return '<span class="badge badge-status-joining">参加中</span>';
      if (status === 2) return '<span class="badge badge-status-done">参加済み</span>';
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
      var vipHtml = v.vip ? '<span class="badge bg-danger">VIP</span>' : '—';
      var raichoHtml = v.present ? '<span class="badge bg-danger">来場</span>' : '<span class="badge bg-secondary">未来場</span>';
      var staffCell = '<td onclick="event.stopPropagation(); window.goStaff(\'' + v.staffId + '\')"><a href="user_staff_detail.html?id=' + encodeURIComponent(v.staffId) + '" class="staff-link">' + v.staffName + '</a></td>';
      var k0 = v.present ? v.keynote : 0;
      var sa0 = v.present ? v.sa : 0;
      var sb0 = v.present ? v.sb : 0;
      var sc0 = v.present ? v.sc : 0;
      var sd0 = v.present ? v.sd : 0;
      var d0 = v.present ? v.dialog : 0;
      var n0 = v.present ? v.net : 0;
      tr.innerHTML = '<td>' + v.userid + '</td><td>' + v.name + '</td><td>' + v.company + '</td>' + staffCell +
        '<td class="text-center">' + raichoHtml + '</td>' +
        '<td class="text-center">' + vipHtml + '</td>' +
        '<td class="text-center">' + badgeStatus(k0) + '</td>' +
        '<td class="text-center">' + badgeStatus(sa0) + '</td>' +
        '<td class="text-center">' + badgeStatus(sb0) + '</td>' +
        '<td class="text-center">' + badgeStatus(sc0) + '</td>' +
        '<td class="text-center">' + badgeStatus(sd0) + '</td>' +
        '<td class="text-center">' + badgeStatus(d0) + '</td>' +
        '<td class="text-center">' + badgeStatus(n0) + '</td>';
      return tr;
    }

    function getFiltered() {
      var staffVal = filterStaff ? filterStaff.value : '';
      var sessionVal = filterSession ? filterSession.value : '';
      var nameVal = filterName ? filterName.value.trim() : '';
      var attrMap = { keynote: 'keynote', session_a: 'sa', session_b: 'sb', session_c: 'sc', session_d: 'sd', dialog: 'dialog', networking: 'net' };
      return visitorData.filter(function (v) {
        var showStaff = !staffVal || v.staffId === staffVal;
        var showSession = true;
        if (sessionVal && attrMap[sessionVal]) showSession = v[attrMap[sessionVal]] === 1 || v[attrMap[sessionVal]] === 2;
        var showName = !nameVal || (v.name && v.name.indexOf(nameVal) >= 0);
        return showStaff && showSession && showName;
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

    render();
  });
})();
