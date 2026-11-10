"""
generate_pdf.py
Generates a styled PDF of the portfolio in each supported language, plus a
one-page Europass CV (europass.html) per language.

Usage:
    python generate_pdf.py [en|it ...]

Default: builds portfolio_en.pdf, portfolio_it.pdf, europass_en.pdf and europass_it.pdf.
"""

import asyncio
import os
import sys
from pathlib import Path

try:
    from playwright.async_api import async_playwright
except ImportError:
    print("Playwright not found. Installing...")
    os.system(f"{sys.executable} -m pip install playwright")
    os.system(f"{sys.executable} -m playwright install chromium")
    from playwright.async_api import async_playwright


PORTFOLIO_DIR = Path(__file__).parent.resolve()
HTML_FILE     = PORTFOLIO_DIR / "index.html"
EUROPASS_FILE = PORTFOLIO_DIR / "europass.html"
PUBLIC_URL    = "https://danilocappelletti.github.io/personalPortfolio/"
LANGUAGES     = {
    "en": {"link_label": "Online portfolio:", "title": "Danilo Cappelletti - Portfolio"},
    "it": {"link_label": "Portfolio online:", "title": "Danilo Cappelletti - Portfolio"},
}


PRINT_CSS = """
@media print {
    #navbar, .skip-link, .cursor, .cursor-follower,
    .about-image-bg, .about-badge, .edu-decoration,
    .footer { display: none !important; }
    body::before, body::after { display: none !important; }
    *, *::before, *::after {
        animation: none !important;
        transition: none !important;
        box-shadow: none !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
    html { font-size: 14px; }
    html, body { width: 100%; margin: 0; padding: 0; overflow: visible !important; }
    [data-aos], .hero-content > * { opacity: 1 !important; transform: none !important; }
    .container { padding: 0 32px; }
    .hero { min-height: 0 !important; padding: 36px 32px !important; }
    .hero-name { font-size: 3.5rem; }
    .hero-description, .hero-title, .hero-cta { margin-bottom: 16px; }
    .hero-socials { display: none; }
    #pdf-portfolio-link { display: block; margin-top: 18px; color: var(--secondary); overflow-wrap: anywhere; }
    .section { padding: 32px 0 !important; break-inside: auto; }
    .section-header { margin-bottom: 24px; break-after: avoid; }
    .section-title { font-size: 2rem; }
    .featured-project { padding: 24px 0; margin-bottom: 24px; }
    .featured-heading { flex-direction: column; gap: 12px; margin-bottom: 20px; }
    .featured-heading h3 { font-size: 1.8rem; margin-bottom: 8px; }
    .featured-preview { max-width: 560px; }
    .project-preview { margin-bottom: 20px; break-inside: avoid; }
    .case-study { gap: 20px 28px; }
    .case-study dd { line-height: 1.6; }
    .projects-grid { gap: 20px; }
    .project-card { padding: 20px; }
    .project-bottom { margin-top: 16px; padding-top: 12px; }
    .about-grid { display: block !important; }
    .about-image-col { float: left; width: 220px; margin: 0 28px 16px 0; }
    .about-photo { width: 220px; height: 220px; }
    .about-bio { margin-bottom: 10px; }
    .about-stats { margin: 16px 0; }
    .capability { gap: 20px; padding: 24px 0; }
    .timeline-item { margin-bottom: 20px; }
    .timeline-card { padding: 20px; }
    .education-card, .languages-card { padding: 24px; }
    .education-card { flex-direction: column; align-items: flex-start; gap: 16px; }
    .project-card, .capability, .timeline-item,
    .education-card, .languages-card, .contact-item { break-inside: avoid; }
    h2, h3, dt { break-after: avoid; }
    p, dd { orphans: 3; widows: 3; }
}
"""


async def generate(browser, lang):
    output_file = PORTFOLIO_DIR / f"portfolio_{lang}.pdf"
    settings = LANGUAGES[lang]
    print(f"[{lang}] Output: {output_file.name}")

    # script.js reads dc-lang on load, so setting it before the page runs picks the language.
    context = await browser.new_context(viewport={"width": 1280, "height": 900})
    await context.add_init_script(f"localStorage.setItem('dc-lang', '{lang}')")
    page = await context.new_page()
    await page.goto(HTML_FILE.as_uri(), wait_until="load", timeout=30000)
    await page.evaluate("document.fonts.ready")
    # Lazy images and scroll-reveal sections never render without scrolling, so force them before printing.
    await page.evaluate("""async () => {
        document.querySelectorAll('img[loading="lazy"]').forEach(img => img.loading = 'eager');
        document.querySelectorAll('[data-aos]').forEach(el => el.classList.add('aos-animate'));
        await Promise.all([...document.images].map(img => img.complete ? null :
            new Promise(done => { img.onload = img.onerror = done; })));
    }""")
    await page.emulate_media(media="print", reduced_motion="reduce")
    await page.add_style_tag(content=PRINT_CSS)
    await page.evaluate("""([publicUrl, linkLabel, title]) => {
        document.title = title;
        document.querySelectorAll('[data-target]').forEach(el => {
            el.textContent = el.dataset.target;
        });
        document.querySelectorAll('a[href]').forEach(link => {
            link.href = new URL(link.getAttribute('href'), publicUrl).href;
        });
        const link = document.createElement('a');
        link.id = 'pdf-portfolio-link';
        link.href = publicUrl;
        link.textContent = `${linkLabel} ${publicUrl}`;
        document.querySelector('.hero-content').appendChild(link);
        const year = document.getElementById('footer-year');
        if (year) year.textContent = new Date().getFullYear();
    }""", [PUBLIC_URL, settings["link_label"], settings["title"]])

    await page.pdf(
        path=str(output_file),
        format="A4",
        print_background=True,
        display_header_footer=True,
        header_template="<span></span>",
        footer_template=(
            '<div style="width:100%;padding:0 24px;font-size:9px;color:#555;'
            'display:flex;justify-content:space-between">'
            f'<span>{PUBLIC_URL}</span>'
            '<span><span class="pageNumber"></span> / '
            '<span class="totalPages"></span></span></div>'
        ),
        margin={"top": "8mm", "right": "0", "bottom": "14mm", "left": "0"},
        scale=0.85,
    )
    await context.close()

    size_kb = output_file.stat().st_size // 1024
    print(f"[{lang}] Done: {output_file.name} ({size_kb} KB)")


async def generate_europass(browser, lang):
    output_file = PORTFOLIO_DIR / f"europass_{lang}.pdf"
    print(f"[europass {lang}] Output: {output_file.name}")

    # europass.html holds both languages; the lang attribute decides which one is printed.
    context = await browser.new_context(viewport={"width": 1280, "height": 900})
    page = await context.new_page()
    await page.goto(EUROPASS_FILE.as_uri(), wait_until="load", timeout=30000)
    await page.evaluate("lang => { document.documentElement.lang = lang; }", lang)
    await page.pdf(
        path=str(output_file),
        prefer_css_page_size=True,
        print_background=True,
    )
    await context.close()

    size_kb = output_file.stat().st_size // 1024
    print(f"[europass {lang}] Done: {output_file.name} ({size_kb} KB)")


async def main(langs):
    async with async_playwright() as p:
        browser = await p.chromium.launch(
            args=["--no-sandbox", "--disable-setuid-sandbox"]
        )
        for lang in langs:
            await generate(browser, lang)
            await generate_europass(browser, lang)
        await browser.close()


if __name__ == "__main__":
    requested = sys.argv[1:] or list(LANGUAGES)
    unknown = [lang for lang in requested if lang not in LANGUAGES]
    if unknown:
        sys.exit(f"Unsupported language(s): {', '.join(unknown)}. Use: {', '.join(LANGUAGES)}")
    asyncio.run(main(requested))
