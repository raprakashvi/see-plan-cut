# Paper Website Template

A simple, clean template for creating academic paper websites.

**Template by Ravi Prakash** - [raprakashvi.github.io](https://raprakashvi.github.io/)

## Local Preview

To view the site locally:

```bash
# Python 3
python3 -m http.server 8000

# Or Python 2
python -m SimpleHTTPServer 8000

# Or using Node.js (if you have http-server installed)
npx http-server
```

Then open http://localhost:8000 in your browser.

## Quick Start

1. **Edit `data/paper.json`** - This is the main file where all content lives:
   - Update paper title, abstract, authors
   - Add your figures (PNG/JPG) to `assets/img/figures/`
   - Add author photos to `assets/img/authors/` (or `assets/authors/`)
   - Add logos to `assets/img/logo/`
   - Update video YouTube ID if you have one
   - Add author links (personal websites, etc.)

2. **Replace images**:
   - `assets/img/figures/System_Overview.png` - Main teaser image (top right)
   - `assets/img/figures/*.png` - Your paper figures
   - `assets/img/authors/*.jpg` - Author photos
   - `assets/img/logo/*` - Institution/lab logos

3. **Update `index.html`** (optional):
   - Change page title in `<title>` tag
   - Update navigation links if needed

4. **Deploy**: Upload to GitHub Pages, Netlify, or any static hosting.

## Key Files

- `data/paper.json` - All content (paper info, authors, figures, etc.)
- `index.html` - Main HTML structure
- `assets/css/style.css` - Styling
- `assets/js/main.js` - JavaScript functionality

That's it! Most changes are in `paper.json`.
