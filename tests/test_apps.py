"""
Headless checks that every interactive app in the book must pass. The harness
lives in interactive_textbook_pipeline; this file only lists the apps, each
with one representative non-default state that touches every key type the app
supports (a slider, a toggle, a nudge).

Run:  python -m pytest tests/ -q
One:  python -m pytest tests/ -q -k supply
"""
import pathlib

from interactive_textbook_pipeline.apptest import app_tests, browser  # noqa: F401

APPS_DIR = pathlib.Path(__file__).resolve().parent.parent / "open_principles_of_microeconomics" / "apps"

# name -> a state string using every key type the app has
APPS = {
    "supply_shifts_textbook": "v=1&@pt.J=0,-20&dq_s1=-2&p=22000&show_s1=0",
    "budget_constraint_textbook": "v=1&@pt.C=0,-20&lbl_x=Trips&m=14&sel=C&show_shading=0",
    "equilibrium_textbook": "v=1&@pt.E=0,-20&dq_d=40&p=1.2&show_brackets=0",
    "comparative_advantage_textbook": "v=1&@pt.br.A=0,-20&max_wheat_us=80&show_shading=0",
    "ppf_textbook": "v=1&@pt.B=0,-20&lbl_x=Schools&max_education=150&sel=B&show_shading=0",
    "efficiency_ppf_textbook": "v=1&@pt.R=0,-20&lbl_y=Clinics&r_education=40&sel=R&show_gain=0",
    "demand_curve_textbook": "v=1&@an.2=10,0&dq_d=40&sel=2&show_annot=0",
    "supply_curve_textbook": "v=1&@an.2=10,0&dq_s=40&sel=2&show_annot=0",
    "demand_basic_textbook": "v=1&@an.P0=0,-10&n_d=1.5&show_arrows=0&t=0.6",
    "demand_two_points_textbook": "v=1&@an.Q1=0,10&show_arrows=0&t0=0.3&t1=0.7",
    "demand_shifts_textbook": "v=1&@pt.Q=0,-20&dq_d1=4&p=24000&show_d2=0",
    "demand_shift_dd_textbook": "v=1&@an.Q1=0,10&dq_d1=25&show_arrows=0&t=0.6",
    "demand_shift_factors_textbook": "v=1&@d0.a=0,-10&dq_d1=40&show_arrows=0",
    "individual_vs_social_textbook": "v=1&@x.soc=0,-10&max_g1_ind=120&n_ppf=1&show_shading=0",
}

TestApp = app_tests(APPS_DIR, APPS)
