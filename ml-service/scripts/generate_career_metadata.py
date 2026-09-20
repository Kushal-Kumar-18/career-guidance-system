"""
Regenerates app/data/career_metadata.py from app/data/career_dataset.py.

Run this any time a career is added, removed, or moved between sections in
career_dataset.py:

    python scripts/generate_career_metadata.py

This does NOT invent any data. It only:
  1. Slugifies each career name into a stable `career_id`.
  2. Reads the "========== SECTION NAME (N careers) ==========" comment
     headers already present in career_dataset.py and assigns every career
     the domain of the section it physically appears under.

If a future edit to career_dataset.py removes/renames those section
headers, this script will fail loudly (a career with no domain) rather
than silently guessing - see `main()` below.
"""
from __future__ import annotations

import hashlib
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATASET_PATH = ROOT / "app" / "data" / "career_dataset.py"
OUTPUT_PATH = ROOT / "app" / "data" / "career_metadata.py"

SECTION_RE = re.compile(r"#\s*=+\s*([A-Z0-9 &()/,\-\u2013\u2014]+?)\s*\(\d+\s*careers?\)\s*=+", re.I)
KEY_RE = re.compile(r"^\s{4}'([^']+)':\s*\{")
# Any line that LOOKS like a section header (has the ==== markers) but
# didn't match SECTION_RE above is a bug, not something to silently
# skip - this is exactly how a previous run of this script silently
# mis-assigned the domain for every career following 5 section headers
# that used an em-dash (—) character the regex charset didn't include
# at the time (e.g. "TECHNOLOGY & IT — ADDITIONAL SPECIALIZATIONS"),
# causing them to inherit whatever domain came before instead. Those
# careers got silently pinned to the WRONG domain until this was
# noticed. This check exists so a future header punctuation choice
# fails loudly here instead of silently mis-labeling careers again.
LOOKS_LIKE_HEADER_RE = re.compile(r"#\s*=+.*=+\s*$")


# Acronyms that appear verbatim in career_dataset.py's section headers and
# must not be mangled by str.title() (which would turn "IT" into "It").
KNOWN_ACRONYMS = {"IT"}


def _titlecase_preserving_acronyms(text: str) -> str:
    """Title-cases each word, except a word that (ignoring surrounding
    parentheses) is a known acronym is upper-cased instead, e.g.
    'ENGINEERING (NON-IT)' -> 'Engineering (Non-IT)', not 'Engineering (Non-It)'.
    """
    out_words = []
    for word in text.split(" "):
        prefix = "(" if word.startswith("(") else ""
        suffix = ")" if word.endswith(")") else ""
        core = word[len(prefix): len(word) - len(suffix)] if suffix else word[len(prefix):]
        if core.upper() in KNOWN_ACRONYMS:
            out_words.append(prefix + core.upper() + suffix)
        elif "-" in core:
            out_words.append(prefix + "-".join(p.title() if p.upper() not in KNOWN_ACRONYMS else p.upper() for p in core.split("-")) + suffix)
        else:
            out_words.append(prefix + core.title() + suffix)
    return " ".join(out_words)


def slugify(name: str) -> str:
    s = name.lower()
    s = re.sub(r"[^a-z0-9]+", "-", s)
    return re.sub(r"-+", "-", s).strip("-")


def extract_order_and_domains(content: str):
    domain = None
    order = []
    domains = {}
    for lineno, line in enumerate(content.splitlines(), start=1):
        m = SECTION_RE.search(line)
        if m:
            domain = _titlecase_preserving_acronyms(m.group(1).strip())
            continue
        if LOOKS_LIKE_HEADER_RE.search(line) and "career" in line.lower():
            raise SystemExit(
                f"Line {lineno} looks like a section header but SECTION_RE didn't match it "
                f"(unusual punctuation in the header?): {line!r}. Fix the regex above rather "
                "than letting this silently fall through - see the comment on LOOKS_LIKE_HEADER_RE."
            )
        m2 = KEY_RE.match(line)
        if m2:
            name = m2.group(1)
            if domain is None:
                raise SystemExit(f"Career {name!r} appears before any section header - cannot derive a domain.")
            order.append(name)
            domains[name] = domain
    return order, domains


def main() -> None:
    content = DATASET_PATH.read_text(encoding="utf-8")
    order, domains = extract_order_and_domains(content)

    slugs = [slugify(n) for n in order]
    if len(set(slugs)) != len(slugs):
        dupes = {s for s in slugs if slugs.count(s) > 1}
        raise SystemExit(f"Slug collision(s) detected, refusing to generate: {dupes}")

    digest = hashlib.sha256(content.encode("utf-8")).hexdigest()[:12]

    lines = [
        '"""',
        "Career metadata derived from CAREER_DATABASE (app/data/career_dataset.py).",
        "",
        "WHAT THIS IS: two pieces of metadata derived directly from information the",
        "curated dataset already contains -- not invented:",
        "",
        "  - CAREER_ID: a stable, deterministic slug of the career name",
        '    (e.g. "Software Developer" -> "software-developer"). It never changes for',
        "    a given name, so it is safe to persist (e.g. in a candidate_snapshot or",
        "    saved-career reference) even if the *display* name is later reworded.",
        "",
        "  - CAREER_DOMAIN: the sector each career already belongs to in the source",
        "    file itself -- career_dataset.py groups every career under a",
        '    "========== SECTION NAME (N careers) ==========" comment header (e.g.',
        '    "TECHNOLOGY & IT", "HEALTHCARE"). This module records exactly that',
        "    grouping as data, generated by app/../scripts/generate_career_metadata.py",
        "    (which walks those headers in file order), rather than parsing comments",
        "    at import time, which would silently break if the file were reformatted.",
        "",
        "WHAT THIS DELIBERATELY DOES NOT INCLUDE: aliases, career_family/subdomains",
        "distinct from domain, prerequisites, and required_credentials as separate",
        "structured fields. The master prompt asked for these, but nothing in the",
        "existing dataset documents them, and fabricating plausible-looking values",
        'for 148 careers would violate the "do not invent missing data" instruction.',
        "Essential/important/supporting/optional skill tiers ARE already fully",
        "data-driven -- see app/data/skill_importance.py -- so they are intentionally",
        "not duplicated here as a static field. Populating aliases/subdomains/",
        "prerequisites for real needs a curated source (career-counseling input or",
        "an occupational taxonomy such as O*NET/ESCO); this module is written so",
        "that whoever adds that data only has to add fields here, never touch",
        "CAREER_DATABASE's scoring-relevant shape or the scoring engine itself.",
        '"""',
        "from __future__ import annotations",
        "",
        "from typing import Dict, Optional",
        "",
        "# Content hash of career_dataset.py at the time this file was generated.",
        "# Regenerate (scripts/generate_career_metadata.py) whenever that file",
        "# changes; a mismatch with career_dataset.DATASET_VERSION at runtime means",
        "# this metadata is stale relative to the dataset it describes.",
        f"GENERATED_FROM_DATASET_HASH = {digest!r}",
        "",
        "CAREER_ID: Dict[str, str] = {",
    ]
    for name in order:
        lines.append(f"    {name!r}: {slugify(name)!r},")
    lines.append("}")
    lines.append("")
    lines.append("CAREER_DOMAIN: Dict[str, str] = {")
    for name in order:
        lines.append(f"    {name!r}: {domains[name]!r},")
    lines.append("}")
    lines.append("")
    lines.append("")
    lines.append("def get_career_id(name: str) -> Optional[str]:")
    lines.append("    return CAREER_ID.get(name)")
    lines.append("")
    lines.append("")
    lines.append("def get_domain(name: str) -> Optional[str]:")
    lines.append("    return CAREER_DOMAIN.get(name)")
    lines.append("")

    OUTPUT_PATH.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"Wrote {OUTPUT_PATH} ({len(order)} careers, {len(set(domains.values()))} domains).")


if __name__ == "__main__":
    main()
