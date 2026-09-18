// Shared JS for interview-prep HTML guides

(function () {
  'use strict';

  // ===== Site navigation config =====
  // Single source of truth for the topic + guide tree. The sidebar panel
  // renders only the topics (flat list); the `guides` array is also used
  // to drive auto-injected breadcrumbs on chapter pages and to mark a
  // topic active when the user is inside one of its guides.
  // A guide may belong to a named sub-collection (a folder grouping several
  // guides under a topic, e.g. a multi-course curriculum). Guides carry an
  // optional `group: { name, folder }` so breadcrumbs/paths reflect the nesting.
  const DPE_CURRICULUM = { name: 'Becoming a Data Platform Engineer', folder: 'becoming-a-data-platform-engineer' };

  const SITE_NAV = [
    {
      name: 'AI Engineering',
      folder: 'ai-engineering',
      guides: [
        { name: 'AI Agents in Compliance', folder: 'ai-engineer-compliance' },
        { name: 'AI Agents Architect — Finance', folder: 'ai-agents-finance-architect' },
        { name: 'AI Agents Architect — HR', folder: 'ai-agents-hr-architect' },
        { name: 'Senior AI Compute Infrastructure Engineer', folder: 'ai-compute-infrastructure' },
        { name: 'Senior SWE — AI Infrastructure (Rust)', folder: 'ai-infrastructure-swe' },
        { name: 'Build an Inference Gateway in Rust', folder: 'build-inference-gateway-rust' },
        { name: 'PagedAttention from First Principles', folder: 'paged-attention-deep-dive' }
      ]
    },
    {
      name: 'Data Engineering',
      folder: 'data-engineering',
      guides: [
        { name: 'Data Analytics Engineering', folder: 'data-analytics-interview-prep' },
        { name: 'Senior Data Analytics Engineer', folder: 'senior-data-analytics-engineer' },
        { name: 'Forward Deployed Engineer — Data Engineering', folder: 'fde-data-engineering' },
        { name: 'Document AI Extraction — Deep Dive', folder: 'document-ai-extraction-deep-dive' },
        { name: 'Build a Contract-Intelligence Pipeline', folder: 'build-contract-intelligence-pipeline' },
        { name: 'The FDE-DE Playbook', folder: 'fde-de-playbook' },
        { name: 'Contract Data Model — Reference', folder: 'contract-data-model-reference' },
        { name: 'Enterprise Integration Atlas', folder: 'enterprise-integration-atlas' },
        { name: 'Data Engineering for Neoclouds', folder: 'data-engineering-for-neoclouds' },
        { name: 'First Data Hire — DE Interview Prep', folder: 'first-data-hire-de-prep' },
        { name: 'Production Data Pipelines', folder: 'production-data-pipelines' },
        { name: 'Data Systems Design', folder: 'data-systems-design' }
      ]
    },
    {
      name: 'Data Platform',
      folder: 'data-platform',
      guides: [
        { name: 'Start Here & Roadmap', folder: 'start-here-roadmap', group: DPE_CURRICULUM },
        { name: 'Orientation & Setup', folder: 'orientation-setup', group: DPE_CURRICULUM },
        { name: 'Foundations', folder: 'foundations', group: DPE_CURRICULUM },
        { name: 'The DE Craft', folder: 'the-de-craft', group: DPE_CURRICULUM },
        { name: 'Tooling & the Modern Stack', folder: 'tooling-stack', group: DPE_CURRICULUM },
        { name: 'Capstone Labs', folder: 'capstone-labs', group: DPE_CURRICULUM },
        { name: 'Career & Getting the Job', folder: 'career', group: DPE_CURRICULUM },
        { name: 'Glossary & Cheat Sheets', folder: 'glossary', group: DPE_CURRICULUM },
        { name: 'Data Platform Systems Design — GPU Marketplace', folder: 'data-platform-systems-design' },
        { name: 'ML Data Architecture', folder: 'ml-data-architecture' },
        { name: 'ML Data Architecture — Interview Prep', folder: 'ml-data-architecture-interview-prep' }
      ]
    },
    {
      name: 'Data Science',
      folder: 'data-science',
      guides: [
        { name: 'Product & Analytics Data Science', folder: 'product-analytics-ds' },
        { name: 'Full-Stack & Applied Data Science', folder: 'full-stack-applied-ds' },
        { name: 'Data Science for Neoclouds', folder: 'data-science-for-neoclouds' },
        { name: 'Senior Data Scientist, Business Analytics — Interview Prep', folder: 'senior-ds-business-analytics-prep' },
        { name: 'Venice.ai — Company Research', folder: 'venice-ai-company-research' }
      ]
    },
    {
      name: 'DeFi Engineering',
      folder: 'defi-engineering',
      guides: [
        { name: 'Senior DeFi Protocol Engineer', folder: 'senior-defi-protocol-engineer' },
        { name: 'Smart Contract Security Engineer', folder: 'smart-contract-security-engineer' },
        { name: 'Senior Smart Contract Engineer', folder: 'senior-smart-contract-engineer' }
      ]
    },
    {
      name: 'Neocloud',
      folder: 'neocloud',
      guides: [
        { name: 'Vast.AI — Comprehensive', folder: 'vast-ai' },
        { name: 'RunPod', folder: 'runpod' },
        { name: 'CoreWeave', folder: 'coreweave' },
        { name: 'Crusoe', folder: 'crusoe' },
        { name: 'Together.AI', folder: 'together-ai' },
        { name: 'Lambda', folder: 'lambda' },
        { name: 'Hyperbolic', folder: 'hyperbolic' },
        { name: 'Nebius', folder: 'nebius' },
        { name: 'TensorDock', folder: 'tensordock' },
        { name: 'Neocloud — History & Future', folder: 'neocloud-history-future' },
        { name: 'Physical Futures Marketplaces', folder: 'compute-futures-marketplaces' },
        { name: 'The Neocloud Landscape — Comparison', folder: 'neocloud-comparison' }
      ]
    },
    {
      name: 'Product Management',
      folder: 'product-management',
      guides: [
        { name: 'Senior PM — Platform (Onboarding & KYC)', folder: 'senior-pm-platform' },
        { name: 'Senior PM — Payments (Emerging Markets)', folder: 'senior-pm-payments' },
        { name: 'Payments Rails Atlas', folder: 'payments-rails-atlas' },
        { name: 'Choosing a KYC Vendor', folder: 'choosing-a-kyc-vendor' }
      ]
    },
    {
      name: 'Claude Skills',
      folder: 'claude-skills',
      guides: [
        { name: 'Data Engineering Skills', folder: 'data-engineering-skills' },
        { name: 'dbt Agent Skills', folder: 'dbt-agent-skills' },
        { name: 'Astronomer Agents — Airflow skills', folder: 'astronomer-agents' },
        { name: 'SkillSpector', folder: 'skillspector' }
      ]
    }
  ];

  // Look up the topic + guide a folder belongs to. Returns
  // { topic, guide } where guide is null when the folder IS a topic.
  function lookupContext(folder) {
    if (!folder) return null;
    for (const t of SITE_NAV) {
      if (t.folder === folder) return { topic: t, guide: null };
      const g = t.guides.find(g => g.folder === folder);
      if (g) return { topic: t, guide: g };
    }
    return null;
  }

  // ===== Resolve repo-root prefix from the current page =====
  // The CSS link is already correct for the current page's depth, so we
  // reuse it to derive how many "../" we need to reach the repo root.
  function getRootPrefix() {
    const link = document.querySelector('link[href*="assets/style.css"]');
    if (!link) return '';
    const href = link.getAttribute('href');
    return href.replace(/assets\/style\.css(\?.*)?$/, '');
  }

  // Identify the current guide folder (if any) from the URL path.
  function getCurrentFolder() {
    const parts = location.pathname.split('/').filter(Boolean);
    // Drop the trailing filename, the remaining last segment is the folder.
    if (parts.length < 2) return null;
    return parts[parts.length - 2];
  }

  function isHome() {
    const parts = location.pathname.split('/').filter(Boolean);
    // Root index: path ends with /index.html and there's no preceding folder
    // (or empty path on a server that resolves / to index.html).
    if (parts.length === 0) return true;
    return parts.length === 1 && /index\.html?$/i.test(parts[0]);
  }

  // ===== Inject the universal site nav into every .sidebar nav =====
  function injectSiteNav() {
    const nav = document.querySelector('.sidebar nav');
    if (!nav) return;

    const root = getRootPrefix();
    const currentFolder = getCurrentFolder();
    const onHome = isHome();

    const wrap = document.createElement('div');
    wrap.className = 'site-nav';

    // Section label
    const sectionLabel = document.createElement('div');
    sectionLabel.className = 'site-nav-label';
    sectionLabel.textContent = 'Browse all guides';
    wrap.appendChild(sectionLabel);

    // Home link
    const home = document.createElement('a');
    home.href = root + 'index.html';
    home.className = 'site-nav-home';
    home.innerHTML = '<span aria-hidden="true">←</span> Home';
    if (onHome) home.classList.add('active');
    wrap.appendChild(home);

    // Flat list of topic links — active if the user is on the topic
    // page itself or inside one of its guide folders.
    SITE_NAV.forEach(topic => {
      const a = document.createElement('a');
      a.href = root + topic.folder + '/index.html';
      a.className = 'site-nav-guide';
      a.textContent = topic.name;
      const inGuide = topic.guides.some(g => g.folder === currentFolder || (g.group && g.group.folder === currentFolder));
      if (topic.folder === currentFolder || inGuide) {
        a.classList.add('active');
      }
      wrap.appendChild(a);
    });

    nav.insertBefore(wrap, nav.firstChild);
  }

  // ===== Reorder sidebar so Navigation comes before chapter sections =====
  // Chapter pages hand-author their sidebar as <h2>Sections|Tools|…</h2>
  // followed by <h2>Navigation</h2>. We want Navigation to sit at the top of
  // the manual sidebar (just under the injected Browse-all-guides panel) so
  // the "↺ All guides" / "Next →" links are always within easy reach.
  function reorderSidebarSections() {
    const nav = document.querySelector('.sidebar nav');
    if (!nav) return;
    const h2s = Array.from(nav.children).filter(el => el.tagName === 'H2');
    if (h2s.length < 2) return;
    const navH2 = h2s.find(h => h.textContent.trim() === 'Navigation');
    if (!navH2) return;
    const firstOther = h2s.find(h => h !== navH2);
    if (!firstOther) return;
    const kids = Array.from(nav.children);
    if (kids.indexOf(navH2) < kids.indexOf(firstOther)) return; // already in order

    // Collect the Navigation group: its h2 + every sibling until the next h2.
    const group = [navH2];
    let cur = navH2.nextElementSibling;
    while (cur && cur.tagName !== 'H2') {
      group.push(cur);
      cur = cur.nextElementSibling;
    }
    group.forEach(el => nav.insertBefore(el, firstOther));
  }

  // ===== Auto-injected breadcrumb (chapter pages only) =====
  // Hub pages (root, topic, guide) carry a hand-authored <nav class="crumbs">.
  // Chapter pages don't, so we inject one here so users always have a
  // 1-click path back to the guide overview / topic / home.
  function injectBreadcrumb() {
    const main = document.querySelector('main');
    if (!main) return;
    if (main.querySelector('.crumbs')) return; // hub page — skip

    const ctx = lookupContext(getCurrentFolder());
    if (!ctx || !ctx.guide) return; // only inject on chapter pages

    const root = getRootPrefix();
    const h1 = main.querySelector('h1');
    const pageTitle = h1 ? h1.textContent.trim() : document.title;

    const crumbs = document.createElement('nav');
    crumbs.className = 'crumbs';
    crumbs.setAttribute('aria-label', 'Breadcrumb');

    function link(href, text) {
      const a = document.createElement('a');
      a.href = href;
      a.textContent = text;
      return a;
    }
    function sep(char) {
      const s = document.createElement('span');
      s.className = 'sep';
      s.textContent = char;
      return s;
    }

    crumbs.appendChild(link(root + 'index.html', '← Home'));
    crumbs.appendChild(sep('·'));
    crumbs.appendChild(link(root + ctx.topic.folder + '/index.html', ctx.topic.name));
    crumbs.appendChild(sep('›'));
    // Guides may live inside a named group folder (e.g. a curriculum); reflect it.
    const groupPrefix = ctx.guide.group ? ctx.guide.group.folder + '/' : '';
    if (ctx.guide.group) {
      crumbs.appendChild(link(root + ctx.topic.folder + '/' + ctx.guide.group.folder + '/index.html', ctx.guide.group.name));
      crumbs.appendChild(sep('›'));
    }
    crumbs.appendChild(link(root + ctx.topic.folder + '/' + groupPrefix + ctx.guide.folder + '/index.html', ctx.guide.name));
    crumbs.appendChild(sep('›'));
    const current = document.createElement('span');
    current.setAttribute('aria-current', 'page');
    current.textContent = pageTitle;
    crumbs.appendChild(current);

    main.insertBefore(crumbs, main.firstChild);
  }

  // ===== Filter bar (homepage card filter) =====
  function initFilterBar() {
    const input = document.getElementById('guideFilter');
    if (!input) return;
    const cards = Array.from(document.querySelectorAll('.guide-card'));
    const sections = Array.from(document.querySelectorAll('[data-topic-section]'));
    const countEl = document.getElementById('filterCount');

    function apply() {
      const q = input.value.trim().toLowerCase();
      let visible = 0;
      cards.forEach(c => {
        const match = !q || c.textContent.toLowerCase().includes(q);
        c.hidden = !match;
        if (match) visible++;
      });
      sections.forEach(s => {
        const anyVisible = s.querySelector('.guide-card:not([hidden])');
        s.hidden = !anyVisible;
      });
      if (countEl) {
        countEl.textContent = q ? `${visible} matching` : '';
      }
    }

    input.addEventListener('input', apply);
  }

  // ===== Syntax highlighting =====
  function applyHighlighting() {
    if (window.hljs) {
      document.querySelectorAll('pre code').forEach(block => hljs.highlightElement(block));
    }
  }

  // ===== Copy buttons =====
  function initCopyButtons() {
    document.querySelectorAll('.copy-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const wrap = btn.closest('.code-wrap');
        if (!wrap) return;
        const code = wrap.querySelector('pre code').innerText;
        navigator.clipboard.writeText(code).then(() => {
          const orig = btn.textContent;
          btn.textContent = 'Copied!';
          btn.classList.add('copied');
          setTimeout(() => { btn.textContent = orig; btn.classList.remove('copied'); }, 1500);
        });
      });
    });
  }

  // ===== Tabs =====
  function initTabs() {
    document.querySelectorAll('.tabs').forEach(tabs => {
      const buttons = tabs.querySelectorAll('.tab-button');
      const panes = tabs.querySelectorAll('.tab-pane');
      buttons.forEach(btn => {
        btn.addEventListener('click', () => {
          const target = btn.dataset.tab;
          buttons.forEach(b => b.classList.remove('active'));
          panes.forEach(p => p.classList.remove('active'));
          btn.classList.add('active');
          const pane = tabs.querySelector(`[data-pane="${target}"]`);
          if (pane) pane.classList.add('active');
        });
      });
    });
  }

  // ===== Checklist with localStorage =====
  function initChecklist() {
    document.querySelectorAll('.checklist').forEach(list => {
      const key = list.dataset.storageKey || 'checklist-default';
      const saved = JSON.parse(localStorage.getItem(key) || '{}');
      list.querySelectorAll('li').forEach(li => {
        const k = li.dataset.key;
        if (!k) return;
        if (saved[k]) li.classList.add('checked');
        li.addEventListener('click', () => {
          li.classList.toggle('checked');
          saved[k] = li.classList.contains('checked');
          localStorage.setItem(key, JSON.stringify(saved));
        });
      });
    });
  }

  // ===== Scrollspy =====
  function initScrollspy() {
    const navLinks = document.querySelectorAll('.sidebar a[href^="#"], .section-nav a[href^="#"], .topic-chips a[href^="#"]');
    const sections = Array.from(navLinks).map(a => {
      const id = a.getAttribute('href').slice(1);
      return document.getElementById(id);
    }).filter(Boolean);
    if (!sections.length) return;

    function update() {
      let active = null;
      for (const sec of sections) {
        const rect = sec.getBoundingClientRect();
        if (rect.top < 120) active = sec;
      }
      navLinks.forEach(link => link.classList.remove('active'));
      if (active) {
        document.querySelectorAll(`.sidebar a[href="#${active.id}"], .section-nav a[href="#${active.id}"], .topic-chips a[href="#${active.id}"]`)
          .forEach(l => l.classList.add('active'));
      }
    }
    window.addEventListener('scroll', update, { passive: true });
    update();
  }

  // ===== Theme toggle =====
  function initTheme() {
    const toggle = document.getElementById('themeToggle');
    if (!toggle) return;
    const savedTheme = localStorage.getItem('prep-theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    toggle.textContent = savedTheme === 'dark' ? '☀️' : '🌙';
    toggle.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme');
      const next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      toggle.textContent = next === 'dark' ? '☀️' : '🌙';
      localStorage.setItem('prep-theme', next);
    });
  }

  // ===== Drill mode (hide all answers/solutions) =====
  function initDrillMode() {
    const checkbox = document.getElementById('drillToggle');
    if (!checkbox) return;
    const saved = localStorage.getItem('drill-mode') === 'true';
    checkbox.checked = saved;
    if (saved) document.body.classList.add('drill-mode');
    checkbox.addEventListener('change', () => {
      document.body.classList.toggle('drill-mode', checkbox.checked);
      // Close all reveals when entering drill mode
      if (checkbox.checked) {
        document.querySelectorAll('.reveal:not([data-force-open])').forEach(r => r.removeAttribute('open'));
      }
      localStorage.setItem('drill-mode', checkbox.checked);
    });
  }

  // ===== Practice tracker =====
  function initPracticeTracker() {
    const buttons = document.querySelectorAll('.practice-check');
    if (!buttons.length) return;
    const storageKey = document.body.dataset.practiceKey || 'practice-default';
    const saved = JSON.parse(localStorage.getItem(storageKey) || '{}');

    function updateProgress() {
      const total = buttons.length;
      const done = Object.values(saved).filter(Boolean).length;
      const progEl = document.getElementById('practiceProgress');
      if (progEl) progEl.textContent = `${done} / ${total} practiced`;
    }

    buttons.forEach(btn => {
      const id = btn.dataset.id;
      if (!id) return;
      if (saved[id]) btn.classList.add('done');
      btn.addEventListener('click', e => {
        e.preventDefault();
        e.stopPropagation();
        btn.classList.toggle('done');
        saved[id] = btn.classList.contains('done');
        localStorage.setItem(storageKey, JSON.stringify(saved));
        updateProgress();
      });
    });
    updateProgress();
  }

  // ===== Mobile TOC toggle =====
  function initMobileTOC() {
    const btn = document.querySelector('.mobile-toc-toggle');
    const sidebar = document.querySelector('.sidebar');
    if (btn && sidebar) {
      btn.addEventListener('click', () => sidebar.classList.toggle('open'));
    }
  }

  // ===== Top navigation (global bar + guide sub-bar), shared with the home page =====
  // Loads assets/nav.css + assets/nav.js and mounts the bars at the top of <body>.
  // Replaces the old "Browse all guides" sidebar panel.
  function mountTopNav() {
    const root = getRootPrefix();
    if (!document.querySelector('link[href*="assets/nav.css"]')) {
      const css = document.createElement('link');
      css.rel = 'stylesheet'; css.href = root + 'assets/nav.css?v=12';
      document.head.appendChild(css);
      const fonts = document.createElement('link');
      fonts.rel = 'stylesheet';
      fonts.href = 'https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;1,9..144,400&family=Inter:wght@400;500&family=JetBrains+Mono:wght@400;500&family=Patrick+Hand&display=swap';
      document.head.appendChild(fonts);
    }
    // Derive the guide path ('topic/[group/]guide') and current chapter file from the URL.
    const parts = location.pathname.split('/').filter(Boolean);
    let current = null;
    if (parts.length && /\.html?$/i.test(parts[parts.length - 1])) current = parts.pop();
    if (current && /^index\.html?$/i.test(current)) current = null;
    let guidePath = parts.length >= 2 ? parts.join('/') : null;
    const s = document.createElement('script');
    s.src = root + 'assets/nav.js?v=12';
    s.onload = () => {
      if (!window.FG) return;
      // Clean-URL hosts (Cloudflare Pages) serve chapters without ".html". If the path isn't a
      // known guide but its parent is, the last segment is the chapter slug — resolve it.
      const C = window.FG.CHAPTERS || {};
      if (guidePath && !C[guidePath] && parts.length >= 3) {
        const parent = parts.slice(0, -1).join('/');
        if (C[parent]) {
          const slug = parts[parts.length - 1];
          const all = []; (C[parent].sections || []).forEach(sec => sec.chapters.forEach(c => all.push(c.f)));
          current = all.find(f => f === slug || f.replace(/\.html?$/i, '') === slug) || (slug + '.html');
          guidePath = parent;
        }
      }
      window.FG.mount({ base: root, guidePath, current });
      enhanceChapter(root, guidePath, current);
    };
    document.head.appendChild(s);
  }

  // ===== Chapter pages: "NN of M" in the eyebrow, rail meta, support card, prev/next cards =====
  // Driven by the chapter manifest nav.js ships (FG.CHAPTERS) — no per-page markup needed.
  function enhanceChapter(root, guidePath, current) {
    const g = guidePath && current && window.FG.CHAPTERS && window.FG.CHAPTERS[guidePath];
    if (!g) return;
    const all = [];
    (g.sections || []).forEach(s => s.chapters.forEach(c => all.push(c)));
    const idx = all.findIndex(c => c.f === current);
    if (idx < 0) return;
    const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
    const num = all[idx].n, total = all.length, base = root + guidePath + '/';

    const eyebrow = document.querySelector('main .hero .eyebrow');
    if (eyebrow && !/\bof\s+\d+\s*$/.test(eyebrow.textContent)) eyebrow.appendChild(document.createTextNode(' · ' + num + ' of ' + total));

    const rail = document.querySelector('.sidebar nav');
    if (rail) { const m = document.createElement('p'); m.className = 'chapter-meta'; m.textContent = 'Chapter ' + num + ' of ' + total; rail.appendChild(m); }

    const main = document.querySelector('main');
    if (!main) return;
    const wrap = document.createElement('div'); wrap.className = 'chapter-end';
    const sup = document.createElement('div'); wrap.appendChild(sup);
    if (window.FG.supportCard) window.FG.supportCard(sup, { base: root });
    const prev = all[idx - 1], next = all[idx + 1];
    const pnx = document.createElement('nav'); pnx.className = 'pnx'; pnx.setAttribute('aria-label', 'Chapter navigation');
    pnx.innerHTML =
      (prev ? `<a href="${base + prev.f}"><span class="k">← Previous · ${esc(prev.n)}</span><span class="t">${esc(prev.t)}</span></a>` : '<span></span>') +
      (next ? `<a class="next" href="${base + next.f}"><span class="k">Next · ${esc(next.n)} →</span><span class="t">${esc(next.t)}</span></a>` : '<span></span>');
    wrap.appendChild(pnx);
    const footer = main.querySelector(':scope > footer');
    footer ? main.insertBefore(wrap, footer) : main.appendChild(wrap);
  }

  // ===== Collapse the sidebar where it carries no chapter navigation =====
  // Topic pages and guide hubs only ever held the (retired) site-nav panel or
  // an "On this page" list the sub-bar now covers; chapter pages keep their
  // Sections/Navigation rail. Detect by the hand-authored <h2>Navigation</h2>.
  function collapseEmptySidebar() {
    const layout = document.querySelector('.layout');
    const nav = document.querySelector('.sidebar nav');
    if (!layout || !nav) return;
    const hasChapterNav = Array.from(nav.querySelectorAll('h2')).some(h => h.textContent.trim() === 'Navigation');
    if (!hasChapterNav) layout.classList.add('no-sidebar');
  }

  // ===== Tag chapter cards that carry a number so CSS can lay them out as number | body =====
  function markNumberedCards() {
    document.querySelectorAll('.guide-card').forEach(card => {
      if (card.querySelector(':scope > .number')) card.classList.add('numbered');
    });
  }

  // ===== Boot =====
  document.addEventListener('DOMContentLoaded', () => {
    mountTopNav();
    collapseEmptySidebar();
    markNumberedCards();
    reorderSidebarSections();
    injectBreadcrumb();
    initFilterBar();
    applyHighlighting();
    initCopyButtons();
    initTabs();
    initChecklist();
    initScrollspy();
    initTheme();
    initDrillMode();
    initPracticeTracker();
    initMobileTOC();
  });
})();
