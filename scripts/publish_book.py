#!/usr/bin/env python3
"""
publish_book.py

Build Open Principles of Microeconomics. One command: sync the interactive
figure library and shortcode from the installed interactive_textbook_pipeline
package, regenerate changed figure PNGs, render the book with Quarto, verify
that every figure and app link in the built site resolves, then move the PDF
and DOCX out of the HTML output directory.

Usage (from anywhere):
    python scripts/publish_book.py                # HTML only
    python scripts/publish_book.py --pdf --docx   # also the print editions
    python scripts/publish_book.py --check        # fail if any figure PNG would change
    python scripts/publish_book.py --skip-figures # reuse the PNGs on disk
    python scripts/publish_book.py --site         # also copy the HTML into the website repo

Setup (once):
    pip install -e path/to/interactive_textbook_pipeline
    playwright install chromium

The HTML output goes to HTML_open_principles_of_microeconomics/ (set in
_quarto.yml) and is committed, since it is what gets hosted. Print editions go
to OTHER_RENDERED_open_principles_of_microeconomics/.
"""
import argparse
import filecmp
import os
import pathlib
import shutil
import sys

from interactive_textbook_pipeline import build, output_dir

REPO = pathlib.Path(__file__).resolve().parent.parent
BOOK = REPO / "open_principles_of_microeconomics"
OTHER = REPO / "OTHER_RENDERED_open_principles_of_microeconomics"

# The website repo sits at a different path on different machines; try the
# known locations and fail loudly rather than publishing into a new directory.
SITE_CANDIDATES = [
    REPO.parent / "jandrewjohnson.github.io" / "open_principles_of_microeconomics",
]


def move_print_editions(html_dir):
    OTHER.mkdir(exist_ok=True)
    moved = 0
    for f in list(html_dir.glob("*.pdf")) + list(html_dir.glob("*.docx")):
        dst = OTHER / f.name
        shutil.move(str(f), str(dst))
        print(f"moved {f.name} -> {dst.relative_to(REPO)}")
        moved += 1
    if moved == 0:
        print("no PDF or DOCX in the HTML output to move")


def copy_to_site(html_dir):
    site = next((p for p in SITE_CANDIDATES if p.is_dir()), None)
    if site is None:
        sys.exit("!! website repo not found; looked for:\n   " + "\n   ".join(str(p) for p in SITE_CANDIDATES))
    copied = 0
    for src in html_dir.rglob("*"):
        if not src.is_file():
            continue
        rel = src.relative_to(html_dir)
        dst = site / rel
        if dst.exists() and filecmp.cmp(src, dst, shallow=False):
            continue
        dst.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(src, dst)
        copied += 1
    print(f"copied {copied} changed file(s) to {site}")
    print("commit and push the website repo yourself; this script does not.")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--pdf", action="store_true", help="also render the PDF")
    ap.add_argument("--docx", action="store_true", help="also render the DOCX")
    ap.add_argument("--check", action="store_true", help="fail if any figure PNG would change")
    ap.add_argument("--skip-figures", action="store_true", help="do not re-render figure PNGs")
    ap.add_argument("--site", action="store_true", help="copy the HTML into the website repo")
    args = ap.parse_args()

    os.environ.setdefault("QUARTO_PYTHON", sys.executable)

    # HTML first: it is the edition that gets link-verified.
    build(BOOK, to="html", skip_figures=args.skip_figures, check=args.check)

    for fmt, wanted in (("pdf", args.pdf), ("docx", args.docx)):
        if wanted:
            build(BOOK, to=fmt, skip_figures=True)

    html_dir = output_dir(BOOK)
    move_print_editions(html_dir)

    if args.site:
        copy_to_site(html_dir)

    print("\nbook build complete")


if __name__ == "__main__":
    main()
