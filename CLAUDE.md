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

## Where things stand (2026-09-14)

The interactive figures arrived from the retired `apec3611-textbook` repo:
14 apps, 28 manifest entries, 28 PNGs. Fourteen of them are placed, one per
app, replacing the OpenStax JPEGs for figures 2.2 to 2.6 and 3.2 to 3.10, each
as `{{< appfig <name>_1 id="fig-X_Y" >}}` so the chapters' existing anchor
links still resolve. The book keeps its captions as the paragraph after the
figure, so no `caption` kwarg is used. Figures 3.11 to 3.15 and everything
from 3.16 on are still static; the other 14 manifest entries are non-default
states of the same apps and are not placed anywhere yet.

Chapter 1's opening image (an unnumbered two-panel matplotlib chart, shift in
supply beside shift in demand, copied from the chapter 3 Python cell) is now
`{{< appfig market_shifts_1 >}}`, the first app written from scratch for this
book rather than ported. Figure 1.7, the circular flow diagram, is
`{{< appfig circular_flow_1 id="fig_1_7" >}}`: two boxes and four arrows
labelled A to D in the figure's own words, as in the OpenStax original. It
started from the 3611 course's `circular_flow_explanation.html` but was cut
back to the book's figure (see the pipeline guide, section 5: a figure
matches the text around it, not the richest available diagram). The market
names are a toggle that defaults off; boxes and labels are draggable
(`@box.<id>`, `@flow.<id>`) and the animation is live only. Figures 3.11 to 3.14 (the four-step
supply shift from a cost increase) are one app, `supply_cost_shift`, with
four manifest states that differ only in toggles; the default is the last
step. Figure 3.15 (factors that shift
supply) is `supply_shift_factors`, the twin of `demand_shift_factors`. Figure 3.16 (the salmon
four-step example) is `four_step_salmon`, drawn through the schedule in
table 3.6, which it also shows as a panel. Figure 3.17 (print news, the
schematic demand-shift four-step example) is `four_step_print_news`. Figure 3.18 (the postal
example, two independent four-step panels) is `four_step_postal`. Figure 3.19 (both postal
shifts on one diagram, E₀ to E₃) is `four_step_postal_combined`. Figure 3.20 (the Clear It
Up on shifts versus movements, Lee's three shifts) is `shift_vs_movement`.
The Python cell that followed figure 3.18 is gone: a sentence after the
caption now introduces `{{< appfig market_shifts_postal >}}`, the chapter 1
opener app in its default state, as the numeric companion. Chapter 3 no
longer executes any code. Figures 3.21 (rent control, table 3.7's data) and 3.22 (a schematic wheat
price floor) are `price_ceiling` and `price_floor`. Figures 3.23 (consumer and producer surplus in the tablet market) and 3.24
(surplus under a price ceiling and a price floor, two panels) are `surplus`
and `surplus_price_controls`; both letter the areas as the book does and
shade them only behind a default-off toggle. That brings the count to 27
apps and 57 manifest entries. Every static diagram in chapters 1 to 3 is
now an app; chapter 3 ends with figure 3.24. Chapter 4 is complete apart
from the opening photograph: figures 4.2 to 4.5 are `labor_market_nurses`
(table 4.1), `labor_tech_shifts` (two schematic panels), `living_wage`
(table 4.4) and `financial_market_credit` (table 4.5); 4.6 and 4.7 are two
states of `global_borrower`; 4.8 is `credit_price_ceiling`; 4.9 is
`generic_market`; 4.10 and 4.11 are two states of `nurses_2030`. Chapter 5 is complete apart from
its opening photograph: 5.2 `elasticity_demand`, 5.3 `elasticity_supply`,
5.4 and 5.5 two states of `polar_elasticity`, 5.6 `unitary_demand`, 5.7
`unitary_supply`, 5.8 and 5.9 two states of `elasticity_pass_through`, 5.10
`tax_incidence`, 5.11 `oil_shock`. Chapter 6 is complete apart from its
opening photograph: 6.2 `jose_budget`, 6.3 `income_change`, 6.4
`price_change`, 6.5 `demand_derivation` (two panels stacked vertically, the
first use of the library's `top` panel offset), 6.6 `education_earnings` (a
bar chart of BLS data, drawn without axes). Chapter 7 is complete apart from
its three photographs: 7.2 `competition_spectrum` (no axes), 7.5
`lumberjacks_product` and 7.6 `tp_mp_general` (two panels each), 7.7
`total_cost_clip_joint` and 7.8 `cost_curves_clip_joint` (smooth monotone
curves through the Clip Joint tables), 7.9 `economies_of_scale`, 7.10
`srac_lrac`, 7.11 `lrac_shapes` (two panels). Chapter 8 is complete apart
from its opening photograph: 8.2 `raspberry_totals`, 8.3
`raspberry_marginal`, 8.4 `raspberry_market`, 8.5 `profit_loss_ac` (three
panels, two above one), 8.6 `shutdown_avc` (two panels), 8.7
`profit_loss_shutdown`, 8.8 `lrs_industry` (three panels). The raspberry
apps all derive their curves from table 8.1's total cost column. Chapter 9
is complete apart from its opening photograph: 9.2 `natural_monopoly`, 9.3
`perceived_demand` (two panels), 9.4 `healthpill_totals`, 9.5
`healthpill_marginal`, 9.6 `monopoly_profit_boxes`, 9.7
`monopoly_three_steps`, 9.8 `mr_below_demand`. The HealthPill apps share
one prelude built from table 9.3's total cost column. Chapter 10 is
complete apart from its opening photograph: 10.2 `three_perceived_demands`
(three panels), 10.3 `pizza_profit` (table 10.1), 10.4 `entry_exit` (two
panels), 10.5 `kinked_demand`. Chapter 11 is complete apart from its
opening photograph: 11.2 `merger_review` (two bar charts, the first bar
charts with rotated labels), 11.3 `natural_monopoly_regulation` (table
11.3). Chapter 12 is complete apart from its opening photograph: 12.2
`pollution_supply_shift` (table 12.2, with the book's broken price axis),
12.3 `pollution_charge`, 12.4 `protection_costs_benefits`, 12.5
`output_environment_ppf`. Chapter 13 is complete apart from its opening
photograph: 13.2 `innovation_capital` (table 13.1), 13.3
`flu_shots_subsidy`, 13.4 `patents_filed_granted` (a grouped bar chart).
Chapter 14 is complete apart from its opening photograph, and is the
biggest so far: sixteen figures across eleven apps. 14.2, 14.3 and 14.5 are
three states of `labor_marginal_product`; 14.4 and 14.6 two of
`labor_demand_equilibrium`; 14.7 `market_wage`; 14.8, 14.9 and 14.10 three
states of `monopsony`; 14.11 `union_membership`; 14.12 `union_wage_floor`;
14.13 `employment_by_sector`; 14.14 `bilateral_monopoly`; 14.15
`wage_ratios`; 14.16 `population_projection`; 14.17
`immigration_by_decade`. Chapter 15 is complete apart from its opening
photograph: 15.2 `poverty_rate`, 15.3 and 15.4 two states of `poverty_trap`,
15.5 `tax_credits_spending`, 15.6 `safety_net_spending`, 15.7
`medicaid_shares` (the book's only pie charts), 15.8 `lorenz_curve`, 15.9
`high_skilled_wages`, 15.10 `equality_output_tradeoff`. Chapter 16 has only
one diagram, 16.2 `insurance_flows`, and it is done. Chapter 17 is complete
apart from its opening photograph: 17.2 `corporate_profits`, 17.3
`banks_intermediaries`, 17.4 `cd_rates`, 17.5 `bond_rates`, 17.6
`stock_indexes` (the project's first right-hand axis on its own scale), 17.7
`new_home_prices`. Chapter 18 has one figure besides its opener, 18.2
`voting_cycle`, and it is done. Chapter 19 is complete apart from its opener:
19.2 `ppf_saudi_us`, 19.3 `saudi_gains_from_trade`, 19.4 `ppf_us_mexico`,
19.5 `toaster_oven_scale`. Chapter 20 is complete apart from its opener:
20.2 `sugar_trade_two_countries`, 20.3 `sugar_gains_from_trade`, 20.4
`us_sugar_tariff`. The appendices are done too. Appendix A1 (mathematics in
economics) has eleven figures and eleven apps: A1 `slope_intercept_line`, A2
`supply_demand_algebra`, A3 `length_weight`, A4 `altitude_air_density`, A5
`unemployment_rate`, A6 `age_distribution_pies`, A7 `population_bars`, A8
`age_distribution_bars`, A9 `unemployment_shape`, A10 `unemployment_scale`,
A11 `unemployment_window`. Appendix A2 (indifference curves) has eleven
figures in seven apps: B1 `lillys_indifference_curves`, B2
`lilly_budget_choice`, B3 `manuel_natasha`, B4 `substitution_income_effects`,
B5 `petunia_labor_supply`, B6 `quentin_saving`, and B7 to B11 as five states
of `effects_steps`. Appendices A3 and A4 have no figures at all. That is 135
apps and 278 manifest entries in all. Every figure in the book is now an app;
the only images left are the chapter openers, which are photographs and
portraits.

Environment: the `itp` shim on PATH resolves to `envs/env1`, whose Playwright
is the conda-forge Node CLI and cannot launch a browser. Use
`python -m interactive_textbook_pipeline ...` (base Python) instead; that is
what the scripts and tests already do.

The book is published at justinandrewjohnson.com and is moving to UMN
Libraries. Two routes put it there, and both read the committed HTML folder:
`publish_book.py` copies it into the `open_principles_of_microeconomics`
subtree of the website repo (changed files only, nothing deleted, orphans
reported) and commits and pushes, using `linneabean.publishing.site`; the
full-website script in `website_dev` copies the same folder in when the whole
site is rebuilt. `publish_book.py` commits the two rendered output folders in this repo
itself, nothing else; pushing this repo is up to you.

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
python scripts/publish_book.py                    # figures, HTML build, link verification, publish to the site
python scripts/publish_book.py --no-publish       # build only
python scripts/publish_book.py --full             # every chapter and every figure, after a retitle or a stale-looking page
python scripts/publish_book.py --dry-run          # build, then report what would be published
python scripts/publish_book.py --pdf --docx       # plus print editions (always full)
python scripts/publish_book.py --check            # fail if any PNG would change (always full)
python -m interactive_textbook_pipeline sync open_principles_of_microeconomics   # after a fresh clone, before opening an app by hand
```

The HTML build is incremental (2026-09-14): unchanged figures are not
screenshotted and only chapters whose source is newer than their HTML are
rendered. Measured: a full build is about 45 s, a no-change build 1 s, one
edited chapter 3 s. `_quarto.yml` has `freeze: auto`, so the Python chunks in
chapter 3 and appendix 4 only re-execute when those chapters change; the
`_freeze/` cache is committed. The mtime check cannot see a chapter retitle,
so use `--full` after one.

## Definition of done for a port

0. The default figure shows what the book's figure shows and what the
   surrounding text describes: same elements, same labels and letters,
   nothing extra. Extras from a richer source go behind toggles that
   default off (pipeline guide, section 5).
1. `tests/test_apps.py` passes for the new app.
2. Side by side with `interactive_originals/<name>.html` at the default state,
   the plot matches apart from the font.
3. Every slider, toggle and draggable label from the original is present.
4. `figures.yml` has an entry and `itp render` produces a PNG without errors.
5. Any library addition has a row in the pipeline guide's helper table.
