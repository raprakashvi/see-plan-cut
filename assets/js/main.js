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
      } else if (a.coAdvisor) {
        span.innerHTML = `${a.name}<sup>†</sup>`;
        span.title = "† Equal advising";
      } else {
        span.textContent = a.name;
      }
      container.appendChild(span);
    });
    // Add notes about co-first and co-advisor authors if any exist
    const hasCoFirst = (authors || []).some(a => a.coFirst);
    const hasCoAdvisor = (authors || []).some(a => a.coAdvisor);
    const notes = [];
    if (hasCoFirst) notes.push("* Equal contribution");
    if (hasCoAdvisor) notes.push("† Equal advising");
    if (notes.length > 0) {
      const note = document.createElement("span");
      note.className = "author-note";
      note.textContent = notes.join(" • ");
      note.style.cssText = "color: var(--muted); font-size: 0.85rem; margin-left: 8px;";
      container.appendChild(note);
    }
  }

  function renderTags(container, tags) {
    container.innerHTML = "";
    if (!tags || tags.length === 0) return;
    
    (tags || []).forEach(tag => {
      const span = document.createElement("span");
      span.className = "tag";
      span.textContent = tag;
      container.appendChild(span);
    });
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
  
    // Filter out System_Overview.png from gallery if it's the teaser
    const systemOverviewPath = "assets/img/figures/System_Overview.png";
    const filteredGallery = (gallery || []).filter(f => f.src !== systemOverviewPath);
    
    if (filteredGallery.length === 0) return;
    
    let currentIndex = 0;
    let autoRotateInterval = null;
    let isPaused = false;
    
    // Function to update featured image
    function updateFeatured(index) {
      const figure = filteredGallery[index];
      featuredImg.src = figure.src;
      featuredImg.alt = figure.alt || "Figure";
      safeText(featuredCap, figure.caption || "");
      
      // Update active state in thumbnails
      [...strip.querySelectorAll(".thumb")].forEach((thumb, idx) => {
        thumb.classList.toggle("active", idx === index);
      });
    }
    
    // Function to start auto-rotation
    function startAutoRotate() {
      if (autoRotateInterval) clearInterval(autoRotateInterval);
      autoRotateInterval = setInterval(() => {
        if (!isPaused) {
          currentIndex = (currentIndex + 1) % filteredGallery.length;
          updateFeatured(currentIndex);
        }
      }, 4000); // Change every 4 seconds
    }
    
    // Function to pause auto-rotation
    function pauseAutoRotate() {
      isPaused = true;
    }
    
    // Function to resume auto-rotation
    function resumeAutoRotate() {
      isPaused = false;
    }
    
    // Initialize with first figure
    updateFeatured(0);
    
    // Pause on hover, resume on leave
    const featuredFigure = featuredImg.closest('.featured-figure');
    if (featuredFigure) {
      featuredFigure.addEventListener('mouseenter', pauseAutoRotate);
      featuredFigure.addEventListener('mouseleave', resumeAutoRotate);
    }
    
    // Show first 3 by default, rest hidden
    const initialCount = 3;
    let showingAll = false;
    
    strip.innerHTML = "";
    filteredGallery.forEach((f, idx) => {
      const t = document.createElement("div");
      t.className = "thumb" + (idx === 0 ? " active" : "");
      if (idx >= initialCount) {
        t.style.display = "none";
      }
      t.innerHTML = `
        <img src="${f.src}" alt="${f.alt || "Figure"}" loading="lazy" />
        <div class="cap">${f.caption || ""}</div>
      `;
      t.addEventListener("click", () => {
        currentIndex = idx;
        updateFeatured(idx);
        pauseAutoRotate();
        // Resume after 10 seconds of inactivity
        setTimeout(() => {
          resumeAutoRotate();
        }, 10000);
      });
      strip.appendChild(t);
    });
    
    // Start auto-rotation
    startAutoRotate();
    
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
    
    // Helper function to create logo HTML with SVG color handling
    function createLogoHTML(inst) {
      if (inst.logoSrc.endsWith('.svg')) {
        // Duke Blue color filter for SVG: #00539B
        return `<img src="${inst.logoSrc}" alt="${inst.name} logo" loading="lazy" style="filter: brightness(0) saturate(100%) invert(15%) sepia(95%) saturate(5000%) hue-rotate(195deg) brightness(0.6) contrast(1.2);" />`;
      } else {
        return `<img src="${inst.logoSrc}" alt="${inst.name} logo" loading="lazy" />`;
      }
    }
    
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
        ${createLogoHTML(inst)}
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
        ${createLogoHTML(inst)}
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
        ${createLogoHTML(inst)}
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
        ${createLogoHTML(inst)}
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
  
    renderTags(el("tags-row"), p.tags);
  
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
  