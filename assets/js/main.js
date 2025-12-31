function setupYouTubeThumbnailPlayer(video) {
    const wrap = el("video-wrap");
    const thumbBtn = el("video-thumb");
    const thumbImg = el("video-thumb-img");
    const iframe = el("video-embed");
  
    if (!video || !video.youtubeId) return;
  
    // Extract YouTube ID from URL or use as-is if already just an ID
    let id = video.youtubeId.trim();
    const urlMatch = id.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/);
    if (urlMatch) {
      id = urlMatch[1];
    }
    
    wrap.style.display = "block";
  
    // Try maxres thumbnail, fallback to hqdefault if maxres missing
    const maxres = `https://img.youtube.com/vi/${id}/maxresdefault.jpg`;
    const hq = `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
  
    thumbImg.src = maxres;
    thumbImg.onerror = () => { thumbImg.src = hq; };
  
    thumbBtn.addEventListener("click", () => {
      thumbBtn.style.display = "none";
      iframe.style.display = "block";
  
      // Privacy-enhanced embed, autoplay on click
      iframe.src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`;
    }, { once: true });
  }
  

async function loadPaper() {
    const res = await fetch("data/paper.json", { cache: "no-store" });
    return await res.json();
  }


  
  function el(id){ return document.getElementById(id); }
  function safeText(node, text) { node.textContent = text ?? ""; }
  
  function makeButton({label, href, style="primary"}) {
    const a = document.createElement("a");
    a.className = style === "secondary" ? "btn secondary" : "btn";
    a.href = href;
    a.target = "_blank";
    a.rel = "noopener";
    a.textContent = label;
    return a;
  }
  
  function renderAuthorsPills(container, authors) {
    container.innerHTML = "";
    (authors || []).forEach(a => {
      const span = document.createElement("span");
      span.className = "author-pill";
      if (a.coFirst) {
        span.innerHTML = `${a.name}<sup>*</sup>`;
        span.title = "* Equal contribution";
      } else {
        span.textContent = a.name;
      }
      container.appendChild(span);
    });
    // Add note about co-first authors if any exist
    const hasCoFirst = (authors || []).some(a => a.coFirst);
    if (hasCoFirst) {
      const note = document.createElement("span");
      note.className = "author-note";
      note.textContent = "* Equal contribution";
      note.style.cssText = "color: var(--muted); font-size: 0.85rem; margin-left: 8px;";
      container.appendChild(note);
    }
  }
  
  function renderPeople(container, authors) {
    container.innerHTML = "";
    (authors || []).forEach(a => {
      const card = document.createElement("div");
      card.className = "person";
      const links = (a.links || []).map(l => `<a href="${l.href}" target="_blank" rel="noopener">${l.label}</a>`).join("");
      let nameDisplay = a.name;
      if (a.coFirst) {
        nameDisplay = `${a.name}<sup style="color: var(--accent);">*</sup>`;
      } else if (a.coAdvisor) {
        nameDisplay = `${a.name}<sup style="color: var(--accent);">†</sup>`;
      }
      card.innerHTML = `
        <img src="${a.photo || "assets/authors/placeholder.jpg"}" alt="${a.name}" loading="lazy" onerror="this.src='assets/authors/placeholder.jpg'; this.onerror=null;" />
        <div>
          <div class="name">${nameDisplay}</div>
          <div class="meta">${a.affil || ""}</div>
          <div class="links">${links}</div>
        </div>
      `;
      container.appendChild(card);
    });
    // Add notes about co-first and co-advisor
    const hasCoFirst = (authors || []).some(a => a.coFirst);
    const hasCoAdvisor = (authors || []).some(a => a.coAdvisor);
    if (hasCoFirst || hasCoAdvisor) {
      const noteDiv = document.createElement("div");
      noteDiv.className = "author-notes";
      noteDiv.style.cssText = "margin-top: 12px; color: var(--muted); font-size: 0.9rem;";
      const notes = [];
      if (hasCoFirst) notes.push("* Equal contribution");
      if (hasCoAdvisor) notes.push("† Equal advising");
      noteDiv.textContent = notes.join(" • ");
      container.appendChild(noteDiv);
    }
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
  
  function renderFeaturedAndStrip(featured, gallery) {
    const featuredImg = el("featured-img");
    const featuredCap = el("featured-caption");
    const strip = el("thumb-strip");
    const stripWrap = strip.parentElement;
    
    // Remove any existing show more button
    const existingBtn = stripWrap.querySelector("#show-more-figures");
    if (existingBtn) existingBtn.remove();
  
    // Default featured: explicit featured OR first gallery item
    const first = featured || (gallery && gallery[0]) || null;
    if (first) {
      // Handle PDFs with iframe, images with img tag
      if (first.src.endsWith('.pdf')) {
        featuredImg.style.display = 'none';
        let pdfFrame = featuredImg.parentElement.querySelector('iframe.pdf-viewer');
        if (!pdfFrame) {
          pdfFrame = document.createElement('iframe');
          pdfFrame.className = 'pdf-viewer';
          pdfFrame.style.cssText = 'width: 100%; height: 600px; border: 0; border-radius: 14px;';
          featuredImg.parentElement.appendChild(pdfFrame);
        }
        pdfFrame.src = first.src;
        pdfFrame.alt = first.alt || "Figure";
      } else {
        const pdfFrame = featuredImg.parentElement.querySelector('iframe.pdf-viewer');
        if (pdfFrame) pdfFrame.remove();
        featuredImg.style.display = 'block';
        featuredImg.src = first.src;
        featuredImg.alt = first.alt || "Figure";
      }
      safeText(featuredCap, first.caption || "");
    }
  
    // Filter out System_Overview.png from gallery if it's the teaser
    const systemOverviewPath = "assets/img/figures/System_Overview.png";
    const filteredGallery = (gallery || []).filter(f => f.src !== systemOverviewPath);
    
    // Show first 3 by default, rest hidden
    const initialCount = 3;
    let showingAll = false;
    
    strip.innerHTML = "";
    filteredGallery.forEach((f, idx) => {
      const t = document.createElement("div");
      t.className = "thumb" + ((first && f.src === first.src) ? " active" : "");
      if (idx >= initialCount) {
        t.style.display = "none";
      }
      // Handle PDFs in thumbnails - use first page as thumbnail or show PDF icon
      if (f.src.endsWith('.pdf')) {
        t.innerHTML = `
          <div style="width: 100%; height: 105px; background: var(--card); border-radius: 10px; display: flex; align-items: center; justify-content: center; border: 1px solid var(--border);">
            <span style="color: var(--muted); font-size: 0.85rem;">📄 PDF</span>
          </div>
          <div class="cap">${f.caption || ""}</div>
        `;
      } else {
        t.innerHTML = `
          <img src="${f.src}" alt="${f.alt || "Figure"}" loading="lazy" />
          <div class="cap">${f.caption || ""}</div>
        `;
      }
      t.addEventListener("click", () => {
        // Handle PDFs with iframe, images with img tag
        if (f.src.endsWith('.pdf')) {
          featuredImg.style.display = 'none';
          let pdfFrame = featuredImg.parentElement.querySelector('iframe.pdf-viewer');
          if (!pdfFrame) {
            pdfFrame = document.createElement('iframe');
            pdfFrame.className = 'pdf-viewer';
            pdfFrame.style.cssText = 'width: 100%; height: 600px; border: 0; border-radius: 14px;';
            featuredImg.parentElement.appendChild(pdfFrame);
          }
          pdfFrame.src = f.src;
          pdfFrame.alt = f.alt || "Figure";
        } else {
          const pdfFrame = featuredImg.parentElement.querySelector('iframe.pdf-viewer');
          if (pdfFrame) pdfFrame.remove();
          featuredImg.style.display = 'block';
          featuredImg.src = f.src;
          featuredImg.alt = f.alt || "Figure";
        }
        safeText(featuredCap, f.caption || "");
        // active state
        [...strip.querySelectorAll(".thumb")].forEach(x => x.classList.remove("active"));
        t.classList.add("active");
      });
      strip.appendChild(t);
    });
    
    // Show more button
    if (filteredGallery.length > initialCount) {
      const btn = document.createElement("button");
      btn.id = "show-more-figures";
      btn.className = "btn secondary";
      btn.textContent = `Show ${filteredGallery.length - initialCount} more figures`;
      btn.style.marginTop = "12px";
      btn.addEventListener("click", () => {
        showingAll = !showingAll;
        [...strip.querySelectorAll(".thumb")].forEach((thumb, idx) => {
          if (idx >= initialCount) {
            thumb.style.display = showingAll ? "flex" : "none";
          }
        });
        btn.textContent = showingAll 
          ? "Show fewer figures" 
          : `Show ${filteredGallery.length - initialCount} more figures`;
      });
      stripWrap.appendChild(btn);
    }
  }
  
  function renderLogos(container, institutions) {
    container.innerHTML = "";
    
    // Group by position
    const grouped = {
      "center-top": [],
      "left-bottom": [],
      "right-bottom": [],
      "center-bottom": []
    };
    
    (institutions || []).forEach(inst => {
      const pos = inst.position || "center-top";
      if (grouped[pos]) {
        grouped[pos].push(inst);
      }
    });
    
    // Create grid layout
    const grid = document.createElement("div");
    grid.className = "logos-grid";
    grid.style.cssText = "display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin: 20px 0;";
    
    // Top row: center labs
    const topRow = document.createElement("div");
    topRow.style.cssText = "grid-column: 1 / -1; display: flex; justify-content: center; gap: 20px; flex-wrap: wrap;";
    grouped["center-top"].forEach(inst => {
      const a = document.createElement(inst.href ? "a" : "div");
      a.className = "logo-card";
      if (inst.href) {
        a.href = inst.href;
        a.target = "_blank";
        a.rel = "noopener";
      }
      a.innerHTML = `
        <img src="${inst.logoSrc}" alt="${inst.name} logo" loading="lazy" />
        <div class="label">${inst.name}</div>
      `;
      topRow.appendChild(a);
    });
    grid.appendChild(topRow);
    
    // Bottom row: left, center, right
    const bottomRow = document.createElement("div");
    bottomRow.style.cssText = "grid-column: 1 / -1; display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; align-items: center;";
    
    // Left
    const leftCol = document.createElement("div");
    leftCol.style.cssText = "display: flex; justify-content: flex-start;";
    grouped["left-bottom"].forEach(inst => {
      const a = document.createElement(inst.href ? "a" : "div");
      a.className = "logo-card";
      if (inst.href) {
        a.href = inst.href;
        a.target = "_blank";
        a.rel = "noopener";
      }
      a.innerHTML = `
        <img src="${inst.logoSrc}" alt="${inst.name} logo" loading="lazy" />
        <div class="label">${inst.name}</div>
      `;
      leftCol.appendChild(a);
    });
    bottomRow.appendChild(leftCol);
    
    // Center
    const centerCol = document.createElement("div");
    centerCol.style.cssText = "display: flex; justify-content: center;";
    grouped["center-bottom"].forEach(inst => {
      const a = document.createElement(inst.href ? "a" : "div");
      a.className = "logo-card";
      if (inst.href) {
        a.href = inst.href;
        a.target = "_blank";
        a.rel = "noopener";
      }
      a.innerHTML = `
        <img src="${inst.logoSrc}" alt="${inst.name} logo" loading="lazy" />
        <div class="label">${inst.name}</div>
      `;
      centerCol.appendChild(a);
    });
    bottomRow.appendChild(centerCol);
    
    // Right
    const rightCol = document.createElement("div");
    rightCol.style.cssText = "display: flex; justify-content: flex-end;";
    grouped["right-bottom"].forEach(inst => {
      const a = document.createElement(inst.href ? "a" : "div");
      a.className = "logo-card";
      if (inst.href) {
        a.href = inst.href;
        a.target = "_blank";
        a.rel = "noopener";
      }
      a.innerHTML = `
        <img src="${inst.logoSrc}" alt="${inst.name} logo" loading="lazy" />
        <div class="label">${inst.name}</div>
      `;
      rightCol.appendChild(a);
    });
    bottomRow.appendChild(rightCol);
    
    grid.appendChild(bottomRow);
    container.appendChild(grid);
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
    // Hide caption for teaser
    const teaserCaption = el("teaser-caption");
    if (teaserCaption) teaserCaption.style.display = "none";
  
    safeText(el("paper-abstract"), p.abstract);
  
    renderFeaturedAndStrip(p.featuredFigure, p.galleryFigures);
  
    setupYouTubeThumbnailPlayer(p.video);

  
    renderPeople(el("people-grid"), p.authors);
  
    safeText(el("ack-text"), p.acknowledgements || "");
    
    renderLogos(el("logos-row"), p.institutions);
  
    safeText(el("doi-line"), p.doi ? `DOI: ${p.doi}` : "");
    safeText(el("bibtex-block"), p.bibtex);
    setupCopyBibtex(p.bibtex);
  
    safeText(el("footer-left"), p.footerLeft || "");
    safeText(el("last-updated"), p.lastUpdated ? `Last updated: ${p.lastUpdated}` : "");
  })();
  