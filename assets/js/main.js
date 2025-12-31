async function loadPaper() {
    const res = await fetch("data/paper.json", { cache: "no-store" });
    return await res.json();
  }
  
  function el(id){ return document.getElementById(id); }
  
  function makeButton({label, href, style="primary"}) {
    const a = document.createElement("a");
    a.className = style === "secondary" ? "btn secondary" : "btn";
    a.href = href;
    a.target = "_blank";
    a.rel = "noopener";
    a.textContent = label;
    return a;
  }
  
  function safeText(node, text) { node.textContent = text ?? ""; }
  
  function renderList(container, items) {
    container.innerHTML = "";
    (items || []).forEach(t => {
      const li = document.createElement("li");
      li.textContent = t;
      container.appendChild(li);
    });
  }
  
  function renderMetrics(container, metrics) {
    container.innerHTML = "";
    (metrics || []).forEach(m => {
      const d = document.createElement("div");
      d.className = "metric";
      d.innerHTML = `
        <div class="label">${m.label}</div>
        <div class="value">${m.value}</div>
        <div class="small">${m.context || ""}</div>
      `;
      container.appendChild(d);
    });
  }
  
  function renderFigures(container, figures) {
    container.innerHTML = "";
    (figures || []).forEach(f => {
      const card = document.createElement("div");
      card.className = "figure-card";
      card.innerHTML = `
        <img src="${f.src}" alt="${f.alt || "Figure"}" loading="lazy" />
        <div class="cap">${f.caption || ""}</div>
      `;
      container.appendChild(card);
    });
  }
  
  function renderAuthorsPills(container, authors) {
    container.innerHTML = "";
    (authors || []).forEach(a => {
      const span = document.createElement("span");
      span.className = "author-pill";
      span.textContent = a.name;
      container.appendChild(span);
    });
  }
  
  function renderPeople(container, authors) {
    container.innerHTML = "";
    (authors || []).forEach(a => {
      const card = document.createElement("div");
      card.className = "person";
      const links = (a.links || []).map(l => `<a href="${l.href}" target="_blank" rel="noopener">${l.label}</a>`).join("");
      card.innerHTML = `
        <img src="${a.photo || "assets/img/authors/placeholder.jpg"}" alt="${a.name}" loading="lazy" />
        <div>
          <div class="name">${a.name}</div>
          <div class="meta">${a.affil || ""}</div>
          <div class="links">${links}</div>
        </div>
      `;
      container.appendChild(card);
    });
  }
  
  function setupCopyBibtex(text) {
    const btn = el("copy-bib");
    btn.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(text);
        btn.textContent = "Copied";
        setTimeout(() => (btn.textContent = "Copy BibTeX"), 1100);
      } catch {
        btn.textContent = "Copy failed";
        setTimeout(() => (btn.textContent = "Copy BibTeX"), 1100);
      }
    });
  }
  
  (async function main(){
    const p = await loadPaper();
  
    document.title = p.shortTitle || p.title;
  
    safeText(el("paper-venue"), p.venueLine);
    safeText(el("paper-title"), p.title);
    safeText(el("paper-subtitle"), p.subtitle);
  
    renderAuthorsPills(el("author-list"), p.authors);
  
    const cta = el("cta-row");
    cta.innerHTML = "";
    (p.buttons || []).forEach(b => cta.appendChild(makeButton(b)));
  
    safeText(el("paper-affils"), p.affiliationsLine);
  
    el("teaser-img").src = p.teaser?.src || "assets/img/teaser.jpg";
    el("teaser-img").alt = p.teaser?.alt || "Teaser";
    safeText(el("teaser-caption"), p.teaser?.caption);
  
    safeText(el("paper-abstract"), p.abstract);
  
    renderList(el("paper-contribs"), p.contributions);
    renderList(el("paper-glance"), p.atAGlance);
  
    renderMetrics(el("paper-metrics"), p.metrics);
    safeText(el("metrics-note"), p.metricsNote);
  
    renderFigures(el("figure-grid"), p.figures);
  
    if (p.video?.embedUrl) {
      el("video-wrap").style.display = "block";
      el("video-embed").src = p.video.embedUrl;
    }
  
    renderPeople(el("people-grid"), p.authors);
  
    safeText(el("doi-line"), p.doi ? `DOI: ${p.doi}` : "");
    safeText(el("bibtex-block"), p.bibtex);
    setupCopyBibtex(p.bibtex);
  
    safeText(el("last-updated"), p.lastUpdated ? `Last updated: ${p.lastUpdated}` : "");
  })();
  