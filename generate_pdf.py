"""
generate_pdf.py
Generates a styled PDF of the portfolio using Playwright.

Usage:
    python generate_pdf.py [output_filename]

Default output: portfolio.pdf
"""

import asyncio
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


# Injected CSS that runs only in @media print to fix common PDF issues:
# - force background colors / images to print
# - remove sticky navbar, cursor elements, scroll indicator, footer copyright
# - flatten AOS animations so all content is visible
# - expand skill bars to their data-width values
# - tighten about section spacing
PRINT_CSS = """
@media print {
  /* ── Hide interactive / decorative elements ───────────────── */
  #particles-canvas,
  .cursor, .cursor-follower,
  .scroll-indicator,
  #navbar,
  .orb,
  .hero-bg-gradient,
  .footer-bottom { display: none !important; }

  /* ── Make every section visible (undo AOS hidden state) ─────── */
  [data-aos] {
    opacity: 1 !important;
    transform: none !important;
    transition: none !important;
  }

  /* ── Backgrounds & colours ───────────────────────────────── */
  * {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  body { background: #0f0e17 !important; }

  /* ── Page layout ─────────────────────────────────────────── */
  html, body { width: 100%; margin: 0; padding: 0; }

  .section { page-break-inside: avoid; }

  /* ── Tighten about section vertical spacing ──────────────── */
  .about.section { padding: 48px 0 !important; }
  .about-grid     { gap: 32px !important; }
  .about-bio      { margin-bottom: 10px !important; }
  .about-stats    { margin-top: 16px !important; }

  /* ── Skill bars: drive width from data-width attr ────────── */
  .skill-fill { transition: none !important; }
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

        # Load the page and wait for all network requests to finish
        await page.goto(url, wait_until="networkidle")

        # Wait for the typing animation to finish writing "Software Developer"
        # (starts after 1800 ms delay + ~18 chars × 95 ms ≈ 3.5 s total)
        print("Waiting for typed text...")
        await page.wait_for_function(
            "document.getElementById('typed-text')?.textContent === 'Software Developer'",
            timeout=12000,
        )
        print("Typed text ready.")

        # Inject the print CSS overrides
        await page.add_style_tag(content=PRINT_CSS)

        # Drive skill-bar widths and counters; freeze typed text & hide blink cursor
        await page.evaluate("""() => {
            // Skill bars (normally driven by IntersectionObserver)
            document.querySelectorAll('.skill-fill').forEach(el => {
                const w = el.dataset.width;
                if (w) el.style.width = w + '%';
            });
            // Stat counters
            document.querySelectorAll('[data-target]').forEach(el => {
                el.textContent = el.dataset.target;
            });
            // Hide the blinking cursor next to the typed text
            const blink = document.querySelector('.cursor-blink');
            if (blink) blink.style.display = 'none';
        }""")

        # Brief pause for style changes to settle
        await page.wait_for_timeout(400)

        await page.pdf(
            path=str(OUTPUT_FILE),
            format="A4",
            print_background=True,
            margin={"top": "0", "right": "0", "bottom": "0", "left": "0"},
            scale=0.78,
        )

        await browser.close()

    size_kb = OUTPUT_FILE.stat().st_size // 1024
    print(f"Done!   {OUTPUT_FILE.name}  ({size_kb} KB)")


if __name__ == "__main__":
    asyncio.run(generate())
