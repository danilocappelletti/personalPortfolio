"""
generate_pdf.py
Generates a styled PDF of the portfolio using Playwright.

Usage:
    python generate_pdf.py [output_filename]

Default output: portfolio.pdf
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
OUTPUT_FILE   = PORTFOLIO_DIR / (sys.argv[1] if len(sys.argv) > 1 else "portfolio.pdf")
PUBLIC_URL    = "https://danilocappelletti.github.io/personalPortfolio/"


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
    .about-grid { grid-template-columns: 220px minmax(0, 1fr); gap: 28px; }
    .about-image-col { width: 100%; }
    .about-photo { width: 220px; height: 220px; }
    .about-bio { margin-bottom: 10px; }
    .about-stats { margin: 16px 0; }
    .capability { gap: 20px; padding: 24px 0; }
    .timeline-item { margin-bottom: 20px; }
    .timeline-card { padding: 20px; }
    .education-card, .languages-card { padding: 24px; }
    .education-card { flex-direction: column; align-items: flex-start; gap: 16px; }
    .featured-project, .project-card, .capability, .timeline-item,
    .education-card, .languages-card, .contact-item { break-inside: avoid; }
    h2, h3, dt { break-after: avoid; }
    p, dd { orphans: 3; widows: 3; }
}
"""


async def generate():
    url = HTML_FILE.as_uri()
    print(f"Source : {HTML_FILE}")
    print(f"Output : {OUTPUT_FILE}")

    async with async_playwright() as p:
        browser = await p.chromium.launch(
            args=["--no-sandbox", "--disable-setuid-sandbox"]
        )
        page = await browser.new_page(viewport={"width": 1280, "height": 900})
        await page.goto(url, wait_until="domcontentloaded", timeout=8000)
        await asyncio.sleep(0.2)
        await page.emulate_media(media="print", reduced_motion="reduce")
        await page.add_style_tag(content=PRINT_CSS)
        await page.evaluate("""publicUrl => {
            document.querySelectorAll('[data-target]').forEach(el => {
                el.textContent = el.dataset.target;
            });
            document.querySelectorAll('a[href]').forEach(link => {
                link.href = new URL(link.getAttribute('href'), publicUrl).href;
            });
            const link = document.createElement('a');
            link.id = 'pdf-portfolio-link';
            link.href = publicUrl;
            link.textContent = `Online portfolio: ${publicUrl}`;
            document.querySelector('.hero-content').appendChild(link);
            const year = document.getElementById('footer-year');
            if (year) year.textContent = new Date().getFullYear();
        }""", PUBLIC_URL)

        await page.pdf(
            path=str(OUTPUT_FILE),
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

        await browser.close()

    size_kb = OUTPUT_FILE.stat().st_size // 1024
    print(f"Done!   {OUTPUT_FILE.name}  ({size_kb} KB)")


if __name__ == "__main__":
    asyncio.run(generate())
