#!/usr/bin/env python3
"""
publish_book.py

Build Open Principles of Microeconomics, and optionally publish it. One
command: sync the interactive figure library and shortcode from the installed
interactive_textbook_pipeline package, regenerate changed figure PNGs, render
the book with Quarto, verify that every figure and app link in the built site
resolves, then move the PDF and DOCX out of the HTML output directory.

Usage (from anywhere):
    python scripts/publish_book.py                # HTML only
    python scripts/publish_book.py --pdf --docx   # also the print editions
    python scripts/publish_book.py --check        # fail if any figure PNG would change
    python scripts/publish_book.py --skip-figures # reuse the PNGs on disk
    python scripts/publish_book.py --publish      # also push the HTML to the website repo
    python scripts/publish_book.py --publish --dry-run   # report what --publish would copy

Setup (once):
    pip install -e path/to/interactive_textbook_pipeline
    playwright install chromium

The HTML output goes to HTML_open_principles_of_microeconomics/ (set in
_quarto.yml) and is committed, since it is what gets hosted. Print editions go
to OTHER_RENDERED_open_principles_of_microeconomics/.

Publishing: --publish copies the HTML into the open_principles_of_microeconomics
subtree of the website repo the same way the course sites do (changed files
only, nothing deleted, orphans reported), then commits and pushes that repo.
The full-website script in website_dev also copies the committed HTML folder
in, so a website rebuild republishes the same content.
"""
import argparse
import os
import pathlib
import shutil
import sys

from interactive_textbook_pipeline import build, output_dir

REPO = pathlib.Path(__file__).resolve().parent.parent

try:
    from linneabean.publishing.site import find_repo, publish_subtree
except ImportError:
    # linneabean is a devstack repo checked out beside this one; its publishing
    # module needs nothing beyond the standard library, so use the source tree
    # when the package is not installed in this Python.
    for _parent in (REPO.parent, REPO.parent.parent):
        _src = _parent / "linneabean" / "linneabean_dev"
        if (_src / "linneabean").is_dir():
            sys.path.insert(0, str(_src))
            break
    from linneabean.publishing.site import find_repo, publish_subtree
BOOK = REPO / "open_principles_of_microeconomics"
OTHER = REPO / "OTHER_RENDERED_open_principles_of_microeconomics"
SUBTREE = "open_principles_of_microeconomics"

# The website repo sits at a different path on different machines.
SITE_CANDIDATES = [
    REPO.parent / "jandrewjohnson.github.io",
    REPO.parent.parent.parent / "Publishing" / "Website" / "jandrewjohnson.github.io",
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


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--pdf", action="store_true", help="also render the PDF")
    ap.add_argument("--docx", action="store_true", help="also render the DOCX")
    ap.add_argument("--check", action="store_true", help="fail if any figure PNG would change")
    ap.add_argument("--skip-figures", action="store_true", help="do not re-render figure PNGs")
    ap.add_argument("--publish", action="store_true", help="copy the HTML into the website repo, commit and push")
    ap.add_argument("--dry-run", action="store_true", help="with --publish: only report what would be copied")
    ap.add_argument("--no-push", action="store_true", help="with --publish: commit the website repo but do not push")
    args = ap.parse_args()

    os.environ.setdefault("QUARTO_PYTHON", sys.executable)

    # HTML first: it is the edition that gets link-verified.
    build(BOOK, to="html", skip_figures=args.skip_figures, check=args.check)

    for fmt, wanted in (("pdf", args.pdf), ("docx", args.docx)):
        if wanted:
            build(BOOK, to=fmt, skip_figures=True)

    html_dir = output_dir(BOOK)
    move_print_editions(html_dir)

    if args.publish:
        site = find_repo(SITE_CANDIDATES, base=REPO)
        print("website repo:", site)
        publish_subtree(
            html_dir, site, SUBTREE,
            source_dirs=[BOOK],
            message="Update Open Principles of Microeconomics",
            push=not args.no_push,
            dry_run=args.dry_run,
        )

    print("\nbook build complete")


if __name__ == "__main__":
    main()
