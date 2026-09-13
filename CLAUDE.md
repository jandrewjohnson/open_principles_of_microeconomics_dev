# Open Principles of Microeconomics

The APEC 1101 textbook: an open adaptation of OpenStax Principles of
Microeconomics 3e, 20 chapters plus appendices, written in Quarto. This repo
holds the **content**. The machinery for the interactive figures lives in the
`interactive_textbook_pipeline` package (sibling repo, `pip install -e`), and
its `docs/TEXTBOOK_FIGURES_GUIDE.md` is the reference for anything that
touches an app, the manifest, or the shortcode.

## Layout

    open_principles_of_microeconomics/   the Quarto book project
      _quarto.yml                        chapters, formats, pre-render hook, resources
      01_introduction.qmd ... 20_*.qmd   chapters; a1_ to a4_ are appendices
      images/, media/                    OpenStax figures and other static images
      figures.yml                        manifest of interactive figures (edit this)
      apps/*_textbook.html               the interactive apps (committed)
      apps/econ_viz_textbook.{js,css}    written by `itp sync`, gitignored, never edited here
      _extensions/appfig/                written by `itp sync`, gitignored
      figures/*.png                      rendered from the manifest (committed)
    interactive_originals/               pre-library versions of the apps, reference only
    tests/test_apps.py                   the pipeline's Playwright harness over apps/
    scripts/publish_book.py              the one build command
    HTML_open_principles_of_microeconomics/   built HTML, committed, what gets hosted
    OTHER_RENDERED_.../                  PDF and DOCX editions
    importing_openstax/                  the original docx-to-qmd conversion scripts

## Where things stand (2026-09-13)

The interactive figures arrived from the retired `apec3611-textbook` repo:
14 apps, 28 manifest entries, 28 PNGs. Fourteen of them are placed, one per
app, replacing the OpenStax JPEGs for figures 2.2 to 2.6 and 3.2 to 3.10, each
as `{{< appfig <name>_1 id="fig-X_Y" >}}` so the chapters' existing anchor
links still resolve. The book keeps its captions as the paragraph after the
figure, so no `caption` kwarg is used. Figures 3.11 to 3.15 and everything
from 3.16 on are still static; the other 14 manifest entries are non-default
states of the same apps and are not placed anywhere yet.

The book is published at justinandrewjohnson.com and is moving to UMN
Libraries. Two routes put it there, and both read the committed HTML folder:
`publish_book.py --publish` copies it into the `open_principles_of_microeconomics`
subtree of the website repo (changed files only, nothing deleted, orphans
reported) and commits and pushes, using `linneabean.publishing.site`; the
full-website script in `website_dev` copies the same folder in when the whole
site is rebuilt. Commit the HTML folder here after a build either way.

## Hard rules

- Never edit `apps/econ_viz_textbook.js` or `.css` or anything under
  `_extensions/appfig/` here. They are written by sync from the pipeline
  package and the build refuses to run over an edited copy. Change them in
  `interactive_textbook_pipeline` and run its tests.
- Never edit `interactive_originals/`. Ported apps go in `apps/<name>_textbook.html`.
- Every app file gets the `_textbook` suffix.
- The URL hash in `figures.yml` is a published contract. Changing an app's
  defaults moves every figure that inherits them; see the pipeline's CLAUDE.md.
- Slider, toggle and nudge keys follow the vocabulary in the guide, section 4.
- Font in apps is Source Sans 3. No em dashes in any text you write.
- After porting or adding an app: add it to `tests/test_apps.py` with a state
  that uses every key type, and add at least one non-default entry for it to
  `figures.yml`.

## Commands

```
pip install -e ../interactive_textbook_pipeline   # once
playwright install chromium                       # once
python -m pytest tests/ -q                        # all 14 apps, headless
python scripts/publish_book.py                    # HTML build with link verification
python scripts/publish_book.py --pdf --docx       # plus print editions
python scripts/publish_book.py --check            # fail if any PNG would change
python scripts/publish_book.py --publish          # also copy the HTML into the website repo, commit, push
python scripts/publish_book.py --publish --dry-run   # report what --publish would copy
itp sync open_principles_of_microeconomics        # after a fresh clone, before opening an app by hand
```

The full HTML render executes the Python chunks in chapter 3 and appendix 4
and takes several minutes.

## Definition of done for a port

1. `tests/test_apps.py` passes for the new app.
2. Side by side with `interactive_originals/<name>.html` at the default state,
   the plot matches apart from the font.
3. Every slider, toggle and draggable label from the original is present.
4. `figures.yml` has an entry and `itp render` produces a PNG without errors.
5. Any library addition has a row in the pipeline guide's helper table.
