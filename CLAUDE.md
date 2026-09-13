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
      drafts/                            not in the book; see below
    interactive_originals/               pre-library versions of the apps, reference only
    tests/test_apps.py                   the pipeline's Playwright harness over apps/
    scripts/publish_book.py              the one build command
    HTML_open_principles_of_microeconomics/   built HTML, committed, what gets hosted
    OTHER_RENDERED_.../                  PDF and DOCX editions
    importing_openstax/                  the original docx-to-qmd conversion scripts

## Where things stand (2026-09-13)

The interactive figures arrived from the retired `apec3611-textbook` repo:
14 apps, 28 manifest entries, 28 PNGs. **None of them is placed in a chapter
yet.** The OpenStax figures in chapters 2 and 3 are still the static JPEGs.
The two files in `drafts/` are placeholder chapters written only to exercise
the pipeline; they are not in `_quarto.yml` and should not be added. The work
to do is to put `{{< appfig ... >}}` calls into `02_choice_with_scarcity.qmd`
and `03_demand_and_supply.qmd` where the matching OpenStax figures are, then
delete `drafts/`.

The book is published at justinandrewjohnson.com and is moving to UMN
Libraries.

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
