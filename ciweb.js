// ═══════════════════════════════════════
//  CIWeb — Shared JS
//  blogs.json se data fetch karta hai
//  index.html + blogs.html dono use karte hain
// ═══════════════════════════════════════

// ── Language System ──
function cwSetLang(l) {
  localStorage.setItem('ciweb_lang', l);
  document.querySelectorAll('[data-en][data-hi]').forEach(function(el) {
    el.textContent = l === 'en' ? el.dataset.en : el.dataset.hi;
  });
  var hi = document.getElementById('cw-hi');
  var en = document.getElementById('cw-en');
  if (hi) hi.classList.toggle('on', l === 'hi');
  if (en) en.classList.toggle('on', l === 'en');
  window.dispatchEvent(new Event('langChanged'));
}
window.cwSetLang = cwSetLang;

// ── Blog Helpers ──
function cwLang() { return localStorage.getItem('ciweb_lang') || 'hi'; }
function cwTitle(b) { return cwLang() === 'en' ? b.title_en : b.title_hi; }
function cwDesc(b)  { return cwLang() === 'en' ? b.desc_en  : b.desc_hi;  }

// ── Fetch blogs.json ──
function cwFetchBlogs(callback) {
  fetch('blogs.json?v=' + Date.now())
    .then(function(r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    })
    .then(function(data) {
      callback(null, data);
    })
    .catch(function(err) {
      console.error('CIWeb: blogs.json load failed', err);
      callback(err, []);
    });
}

// ── INDEX PAGE: render latest 3 blogs ──
function cwInitIndex() {
  cwFetchBlogs(function(err, blogs) {
    var grid = document.getElementById('blog-grid');
    var cEl  = document.getElementById('blog-count');
    if (!grid) return;

    if (cEl) cEl.textContent = blogs.length + '+';

    function render() {
      var lang = cwLang();
      var html = '';
      var show = Math.min(blogs.length, 3);
      for (var i = 0; i < show; i++) {
        var b = blogs[i];
        var title = lang === 'en' ? b.title_en : b.title_hi;
        var desc  = lang === 'en' ? b.desc_en  : b.desc_hi;
        html += '<a class="blog-card" href="' + b.link + '">'
              + '<span class="card-tag">' + b.tag + '</span>'
              + '<h3>' + title + '</h3>'
              + '<p>' + desc + '</p>'
              + '<div class="card-footer">'
              + '<span>&#128197; ' + b.date + '</span>'
              + '<span class="read-arrow">Padho &rarr;</span>'
              + '</div></a>';
      }
      grid.innerHTML = html || '<p style="color:var(--muted);padding:1rem">Koi blog nahi mila.</p>';
    }

    render();
    window.addEventListener('langChanged', render);
  });
}

// ── BLOGS PAGE: full list + search + filter ──
function cwInitBlogs() {
  var _all = [];
  var _tag = 'all';

  var grid = document.getElementById('blog-grid');
  var info = document.getElementById('results-info');
  if (!grid) return;

  function render(blogs) {
    var lang = cwLang();
    if (!blogs || !blogs.length) {
      if (info) info.innerHTML = '';
      grid.innerHTML = '<div class="empty-state"><h3>Koi result nahi &#128577;</h3><p>Doosra keyword try karo.</p></div>';
      return;
    }
    if (info) info.innerHTML = '<strong>' + blogs.length + '</strong> blogs';
    var html = '';
    for (var i = 0; i < blogs.length; i++) {
      var b = blogs[i];
      var title = lang === 'en' ? b.title_en : b.title_hi;
      var desc  = lang === 'en' ? b.desc_en  : b.desc_hi;
      html += '<a class="blog-card" href="' + b.link + '">'
            + '<span class="card-tag">' + (b.tag || 'Tech') + '</span>'
            + '<h3>' + title + '</h3>'
            + '<p>' + desc + '</p>'
            + '<div class="card-footer">'
            + '<span>&#128197; ' + b.date + '</span>'
            + '<span class="read-arrow">Padho &rarr;</span>'
            + '</div></a>';
    }
    grid.innerHTML = html;
  }

  function applyFilters() {
    var q = (document.getElementById('search-input') || {value:''}).value.trim().toLowerCase();
    var filtered = _all.slice();
    if (_tag !== 'all') {
      filtered = filtered.filter(function(b) { return (b.tag||'Tech') === _tag; });
    }
    if (q) {
      filtered = filtered.filter(function(b) {
        var t = cwLang()==='en' ? b.title_en : b.title_hi;
        var d = cwLang()==='en' ? b.desc_en  : b.desc_hi;
        return t.toLowerCase().indexOf(q) > -1 ||
               d.toLowerCase().indexOf(q) > -1 ||
               (b.tag||'').toLowerCase().indexOf(q) > -1;
      });
    }
    render(filtered);
  }
  window.cwApplyFilters = applyFilters;

  function buildTags() {
    var seen = {}, tags = [];
    for (var i = 0; i < _all.length; i++) {
      var t = _all[i].tag || 'Tech';
      if (!seen[t]) { seen[t] = true; tags.push(t); }
    }
    var old = document.querySelectorAll('.tag-btn[data-dyn]');
    old.forEach(function(b) { b.remove(); });
    var container = document.getElementById('tag-filters');
    if (!container) return;
    tags.forEach(function(tag) {
      var btn = document.createElement('button');
      btn.className = 'tag-btn';
      btn.textContent = tag;
      btn.setAttribute('data-dyn', '1');
      btn.addEventListener('click', function() {
        _tag = tag;
        document.querySelectorAll('.tag-btn').forEach(function(b) { b.classList.remove('active'); });
        btn.classList.add('active');
        applyFilters();
      });
      container.appendChild(btn);
    });
  }

  // All-tag button
  var allBtn = document.getElementById('tag-all');
  if (allBtn) {
    allBtn.addEventListener('click', function() {
      _tag = 'all';
      document.querySelectorAll('.tag-btn').forEach(function(b) { b.classList.remove('active'); });
      allBtn.classList.add('active');
      applyFilters();
    });
  }

  // Search input
  var searchInput = document.getElementById('search-input');
  var clearBtn    = document.getElementById('clear-btn');
  if (searchInput) {
    searchInput.addEventListener('input', function() {
      if (clearBtn) clearBtn.style.display = this.value ? 'block' : 'none';
      applyFilters();
    });
  }
  if (clearBtn) {
    clearBtn.addEventListener('click', function() {
      searchInput.value = '';
      clearBtn.style.display = 'none';
      applyFilters();
    });
  }

  window.addEventListener('langChanged', applyFilters);

  cwFetchBlogs(function(err, blogs) {
    _all = blogs;
    buildTags();
    render(blogs);
  });
}

// ── Init lang on load ──
document.addEventListener('DOMContentLoaded', function() {
  var saved = localStorage.getItem('ciweb_lang') || 'hi';
  cwSetLang(saved);
});
