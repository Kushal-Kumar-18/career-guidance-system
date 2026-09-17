"""
Market context.

Surfaces the career dataset's curated `job_growth` / `salary_range` fields
as plain, qualitative reference information (`market_outlook`), AND a
small, capped ranking adjustment (`market_relevance_adjustment`) derived
from the same static label.

Two different things happen with market data here, and they're kept
separate on purpose:

  1. `market_outlook()` — purely informational, shown alongside the score,
     never affects ranking.
  2. `market_relevance_adjustment()` — a genuine (small, capped) input to
     the final ranking number, added in `recommender.py` AFTER the fit
     score is computed. It is capped at ±3 points out of 100 — small
     enough that it can never close a meaningful fit gap (the smallest
     skill-importance weight alone is worth more than the full swing of
     this adjustment), but real enough to act as a tie-breaker/nudge
     between otherwise-similar candidates. See recommender.py for exactly
     how it's combined, and MARKET_ADJUSTMENT_CAP below for the number.

This still uses the STATIC `job_growth` label, not the live Adzuna feed
(`live_market` in marketSignalService.js) - live per-request market data
is only fetched for the top 5 *already-ranked* results (to respect
Adzuna's rate limits), which structurally means it can't be computed for
all 148 careers before ranking without either a full live query per
request (infeasible) or a slow background refresh job (not implemented).
Using the static label keeps the adjustment available for every career on
every request, honestly labeled as static, while the live snapshot
remains a separate, clearly-live display field. If a future version adds
a periodic background refresh of live data for the whole dataset, that
would be the natural way to make this adjustment live too.

The dataset's job_growth labels are static, curated snapshots (not a live
feed) - callers should treat them as general reference information, not a
promise about a specific person's odds.
"""
from __future__ import annotations

from typing import Dict


_NOTES = {
    'very high': 'Demand for this role has been growing quickly and postings are relatively plentiful.',
    'high': 'This role has solid, above-average hiring demand.',
    'medium': 'This role has steady, moderate hiring demand.',
    'low': 'Hiring demand for this role tends to be limited or slow-growing.',
    'variable': 'Hiring demand for this role varies significantly by sub-specialty or region.',
}


def market_outlook(job_growth_label: str, salary_range: str) -> Dict[str, str]:
    key = str(job_growth_label or 'medium').strip().lower()
    note = _NOTES.get(key, _NOTES['medium'])
    return {
        'label': job_growth_label or 'Medium',
        'note': note,
        'typical_salary_range': salary_range or 'Not available',
        'source': 'Curated reference data maintained in the career dataset, not a live labor-market feed.',
    }


# Fraction on a 0..1 scale, centered at 0.5 = neutral ("Medium"). 'variable'
# is treated as neutral rather than penalized — genuine uncertainty about
# demand isn't the same as low demand, and shouldn't be scored as if it
# were.
_RELEVANCE_FRACTION = {
    'very high': 1.0,
    'high': 0.75,
    'medium': 0.5,
    'low': 0.25,
    'variable': 0.5,
}

# The cap, in points out of 100 — same scale as fit_score. Deliberately
# small relative to fit_scorer.WEIGHTS (skills alone is worth 35): this
# should be able to nudge between two careers that are otherwise close in
# fit, never override a real difference in how well someone's evidence
# matches a career's requirements. Documented explicitly per the request
# to keep this "a secondary signal, not the dominant one."
MARKET_ADJUSTMENT_CAP = 3.0


def market_relevance_adjustment(job_growth_label: str) -> float:
    """Returns a value in [-MARKET_ADJUSTMENT_CAP, +MARKET_ADJUSTMENT_CAP],
    derived from the same static job_growth label as market_outlook().
    'Medium' (or an unrecognized label) always returns exactly 0.0 -
    the adjustment only ever pushes away from neutral in proportion to
    how far the label is from 'Medium'."""
    key = str(job_growth_label or 'medium').strip().lower()
    fraction = _RELEVANCE_FRACTION.get(key, 0.5)
    return round((fraction - 0.5) * 2 * MARKET_ADJUSTMENT_CAP, 2)
