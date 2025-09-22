(function () {
  function getPerPage() {
    var cfg = document.getElementById("pagination-config");
    var n = cfg ? parseInt(cfg.getAttribute("data-per-page"), 10) : 10;
    return isNaN(n) || n <= 0 ? 10 : n;
  }
  function getPosts() {
    try {
      var raw = document.getElementById("posts-data").textContent;
      return JSON.parse(raw) || [];
    } catch (e) {
      console.error("Failed to parse posts-data", e);
      return [];
    }
  }
  function getPageFromURL(url) {
    var u = url ? new URL(url, window.location.origin) : new URL(window.location.href);
    var p = parseInt(u.searchParams.get("page"), 10);
    if (!isNaN(p) && p > 0) return p;
    var m = u.pathname.match(/page(\d+)\/?$/);
    if (m) {
      var n = parseInt(m[1], 10);
      if (!isNaN(n) && n > 0) return n;
    }
    return 1;
  }
  function pageHref(n) {
    var u = new URL(window.location.href);
    if (n === 1) u.searchParams.delete("page");
    else u.searchParams.set("page", String(n));
    return u.pathname + (u.search ? u.search : "");
  }
  function renderPage(n) {
    var PER_PAGE = getPerPage();
    var posts = getPosts();

    var listEl   = document.getElementById("post-list");
    var pageText = document.getElementById("page-x-of-y");
    var prevLink = document.getElementById("prev-link");
    var nextLink = document.getElementById("next-link");
    if (!listEl || !pageText || !prevLink || !nextLink) return;

    var total = posts.length;
    var totalPages = Math.max(1, Math.ceil(total / PER_PAGE));
    var current = Math.min(Math.max(1, n), totalPages);

    var start = (current - 1) * PER_PAGE;
    var end   = Math.min(start + PER_PAGE, total);

    // Build list
    var html = "";
    for (var i = start; i < end; i++) {
      var p = posts[i];
      html += '<li class="post-item">'
            +   '<span><i><time datetime="' + p.date_iso + '" pubdate>'
            +      p.date_pretty
            +   '</time></i></span>'
            +   '<a href="' + p.url + '">' + p.title + '</a>'
            + '</li>';
    }
    listEl.innerHTML = html;

    // Page n/m
    pageText.textContent = "Page " + current + "/" + totalPages;

    // Wire links (always visible; disabled when not applicable)
    function armLink(a, enabled, targetPage) {
      a.classList.toggle("is-disabled", !enabled);
      a.setAttribute("aria-disabled", enabled ? "false" : "true");
      a.setAttribute("tabindex", enabled ? "0" : "-1");
      a.href = enabled ? pageHref(targetPage) : "#";

      a.onclick = function (e) {
        e.preventDefault();
        if (!enabled) return; // do nothing when disabled
        var href = pageHref(targetPage);
        history.pushState({ page: targetPage }, "", href);
        renderPage(targetPage);
      };
    }

    armLink(prevLink, current > 1, current - 1);
    armLink(nextLink, current < totalPages, current + 1);
  }

  function init() {
    if (!document.getElementById("posts-data")) return;
    renderPage(getPageFromURL());
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
  window.addEventListener("popstate", function () {
    renderPage(getPageFromURL());
  });
  document.addEventListener("turbo:load", init);
  document.addEventListener("turbolinks:load", init);
  document.addEventListener("pjax:end", init);
})();
