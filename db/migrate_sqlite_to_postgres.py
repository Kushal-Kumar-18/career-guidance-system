"""
Migrate data from the legacy career_guidance.db (SQLite) into the new
PostgreSQL schema (schema.sql).

Usage:
    pip install psycopg2-binary
    export DATABASE_URL=postgresql://user:pass@localhost:5432/career_guidance
    python migrate_sqlite_to_postgres.py path/to/career_guidance.db

Notes:
- Run schema.sql against the target Postgres database FIRST.
- This script is idempotent for users/profiles (upsert on unique keys)
  but simply inserts for append-only history/log tables — do not run
  it twice against the same target without truncating first, or you
  will duplicate history rows.
- Column renames from the old schema are handled explicitly below:
    users.password        -> users.password_hash
    profiles.experience    -> profiles.experience_years
    test_questions.options_json -> test_questions.options
    skill_test_results.answers_json -> skill_test_results.answers
- Existing password hashes were produced by Flask-Bcrypt and remain
  valid bcrypt hashes — no rehash needed as long as the new backend
  also verifies with bcrypt.
"""
import json
import os
import sqlite3
import sys

import psycopg2
import psycopg2.extras


def get_sqlite_conn(path):
    conn = sqlite3.connect(path)
    conn.row_factory = sqlite3.Row
    return conn


def get_pg_conn():
    dsn = os.environ.get("DATABASE_URL")
    if not dsn:
        raise SystemExit("Set DATABASE_URL to the target Postgres connection string")
    return psycopg2.connect(dsn)


def table_exists(sconn, name):
    row = sconn.execute(
        "SELECT name FROM sqlite_master WHERE type='table' AND name=?", (name,)
    ).fetchone()
    return row is not None


def migrate_users(sconn, pconn):
    if not table_exists(sconn, "users"):
        return {}
    rows = sconn.execute("SELECT * FROM users").fetchall()
    id_map = {}
    with pconn.cursor() as cur:
        for r in rows:
            cur.execute(
                """INSERT INTO users (username, email, password_hash, role, created_at, last_login)
                   VALUES (%s, %s, %s, %s, %s, %s)
                   ON CONFLICT (username) DO UPDATE SET email = EXCLUDED.email
                   RETURNING id""",
                (r["username"], r["email"], r["password"], r["role"] or "user",
                 r["created_at"], r["last_login"]),
            )
            new_id = cur.fetchone()[0]
            id_map[r["id"]] = new_id
    pconn.commit()
    print(f"  users: migrated {len(rows)} rows")
    return id_map


def migrate_profiles(sconn, pconn, user_id_map):
    if not table_exists(sconn, "profiles"):
        return
    rows = sconn.execute("SELECT * FROM profiles").fetchall()
    with pconn.cursor() as cur:
        for r in rows:
            new_user_id = user_id_map.get(r["user_id"])
            if new_user_id is None:
                continue
            cur.execute(
                """INSERT INTO profiles
                   (user_id, education, skills, interests, experience_years,
                    certifications, projects, preferred_location, salary_expectation, updated_at)
                   VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                   ON CONFLICT (user_id) DO NOTHING""",
                (new_user_id, r["education"], r["skills"], r["interests"], r["experience"],
                 r["certifications"], r["projects"], r["preferred_location"],
                 r["salary_expectation"], r["updated_at"]),
            )
    pconn.commit()
    print(f"  profiles: migrated {len(rows)} rows")


def _json_or_none(text):
    if text in (None, ""):
        return None
    try:
        return json.dumps(json.loads(text))
    except (TypeError, ValueError):
        # Legacy rows sometimes stored a plain string, not JSON — wrap it
        return json.dumps(text)


SIMPLE_TABLE_MAP = {
    # sqlite_table: (pg_table, [(sqlite_col, pg_col, is_json), ...])
    "recommendation_history": ("recommendation_history", [
        ("career_name", "career_name", False),
        ("match_score", "match_score", False),
        ("skill_gaps", "skill_gaps", True),
        ("recommended_courses", "recommended_courses", True),
        ("created_at", "created_at", False),
    ]),
    "activity_logs": ("activity_logs", [
        ("action", "action", False),
        ("details", "details", False),
        ("timestamp", "timestamp", False),
    ]),
    "saved_careers": ("saved_careers", [
        ("career_name", "career_name", False),
        ("notes", "notes", False),
        ("saved_at", "saved_at", False),
    ]),
    "game_results": ("game_results", [
        ("career", "career", False),
        ("performance_score", "performance_score", False),
        ("stress_score", "stress_score", False),
        ("learning_score", "learning_score", False),
        ("performance_level", "performance_level", False),
        ("badges_earned", "badges_earned", False),
        ("created_at", "created_at", False),
    ]),
}


def migrate_simple_tables(sconn, pconn, user_id_map):
    for sqlite_table, (pg_table, cols) in SIMPLE_TABLE_MAP.items():
        if not table_exists(sconn, sqlite_table):
            continue
        rows = sconn.execute(f"SELECT * FROM {sqlite_table}").fetchall()
        pg_cols = ["user_id"] + [c[1] for c in cols]
        placeholders = ", ".join(["%s"] * len(pg_cols))
        with pconn.cursor() as cur:
            for r in rows:
                new_user_id = user_id_map.get(r["user_id"])
                if new_user_id is None:
                    continue
                values = [new_user_id]
                for sqlite_col, _, is_json in cols:
                    v = r[sqlite_col]
                    values.append(_json_or_none(v) if is_json else v)
                cur.execute(
                    f"INSERT INTO {pg_table} ({', '.join(pg_cols)}) VALUES ({placeholders})",
                    values,
                )
        pconn.commit()
        print(f"  {sqlite_table}: migrated {len(rows)} rows")


def migrate_resumes(sconn, pconn, user_id_map):
    if not table_exists(sconn, "resumes"):
        return
    rows = sconn.execute("SELECT * FROM resumes").fetchall()
    with pconn.cursor() as cur:
        for r in rows:
            new_user_id = user_id_map.get(r["user_id"])
            if new_user_id is None:
                continue
            cur.execute(
                """INSERT INTO resumes
                   (user_id, phone, summary, institution, graduation_year,
                    experience_json, ats_score, last_updated)
                   VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                   ON CONFLICT (user_id) DO NOTHING""",
                (new_user_id, r["phone"], r["summary"], r["institution"], r["graduation_year"],
                 _json_or_none(r["experience_json"]), r["ats_score"], r["last_updated"]),
            )
    pconn.commit()
    print(f"  resumes: migrated {len(rows)} rows")


def migrate_skill_tests(sconn, pconn, user_id_map):
    if not table_exists(sconn, "skill_tests"):
        return
    test_id_map = {}
    tests = sconn.execute("SELECT * FROM skill_tests").fetchall()
    with pconn.cursor() as cur:
        for r in tests:
            new_user_id = user_id_map.get(r["user_id"])
            if new_user_id is None:
                continue
            cur.execute(
                """INSERT INTO skill_tests (user_id, skill_name, difficulty, total_questions, status, created_at)
                   VALUES (%s, %s, %s, %s, %s, %s) RETURNING id""",
                (new_user_id, r["skill_name"], r["difficulty"], r["total_questions"],
                 r["status"], r["created_at"]),
            )
            test_id_map[r["id"]] = cur.fetchone()[0]
    pconn.commit()
    print(f"  skill_tests: migrated {len(tests)} rows")

    if table_exists(sconn, "test_questions"):
        questions = sconn.execute("SELECT * FROM test_questions").fetchall()
        with pconn.cursor() as cur:
            for r in questions:
                new_test_id = test_id_map.get(r["test_id"])
                if new_test_id is None:
                    continue
                cur.execute(
                    """INSERT INTO test_questions (test_id, question_text, options, correct_answer, difficulty)
                       VALUES (%s, %s, %s, %s, %s)""",
                    (new_test_id, r["question_text"], _json_or_none(r["options_json"]),
                     r["correct_answer"], r["difficulty"]),
                )
        pconn.commit()
        print(f"  test_questions: migrated {len(questions)} rows")

    if table_exists(sconn, "skill_test_results"):
        results = sconn.execute("SELECT * FROM skill_test_results").fetchall()
        with pconn.cursor() as cur:
            for r in results:
                new_user_id = user_id_map.get(r["user_id"])
                new_test_id = test_id_map.get(r["test_id"])
                if new_user_id is None or new_test_id is None:
                    continue
                cur.execute(
                    """INSERT INTO skill_test_results
                       (user_id, test_id, skill_name, score, percentage, proficiency_level, answers, completed_at)
                       VALUES (%s, %s, %s, %s, %s, %s, %s, %s)""",
                    (new_user_id, new_test_id, r["skill_name"], r["score"], r["percentage"],
                     r["proficiency_level"], _json_or_none(r["answers_json"]), r["completed_at"]),
                )
        pconn.commit()
        print(f"  skill_test_results: migrated {len(results)} rows")


JOB_TABLE_MAP = {
    "job_postings": [
        "title", "company", "location", "description", "salary_min", "salary_max",
        "contract_type", "source", "url", "career_category", "fetched_date",
    ],
    "skill_demand": [
        "skill_name", "demand_count", "percentage", "career_category", "date_recorded",
    ],
    "skill_trends": [
        "skill_name", "trend_7d", "trend_30d", "trend_90d", "career_category", "last_updated",
    ],
    "location_demand": [
        "location", "skill_name", "job_count", "avg_salary", "career_category", "date_recorded",
    ],
    "market_insights": [
        "career_category", "total_jobs", "unique_skills", "avg_skills_per_job",
        "top_location", "analysis_data", "created_at",
    ],
}


def migrate_job_tables(sconn, pconn):
    for table, cols in JOB_TABLE_MAP.items():
        if not table_exists(sconn, table):
            continue
        rows = sconn.execute(f"SELECT * FROM {table}").fetchall()
        placeholders = ", ".join(["%s"] * len(cols))
        with pconn.cursor() as cur:
            for r in rows:
                values = []
                for c in cols:
                    v = r[c]
                    values.append(_json_or_none(v) if c == "analysis_data" else v)
                cur.execute(
                    f"INSERT INTO {table} ({', '.join(cols)}) VALUES ({placeholders}) ON CONFLICT DO NOTHING",
                    values,
                )
        pconn.commit()
        print(f"  {table}: migrated {len(rows)} rows")


def main():
    if len(sys.argv) != 2:
        raise SystemExit("Usage: python migrate_sqlite_to_postgres.py path/to/career_guidance.db")
    sqlite_path = sys.argv[1]

    sconn = get_sqlite_conn(sqlite_path)
    pconn = get_pg_conn()

    print("Migrating users...")
    user_id_map = migrate_users(sconn, pconn)
    print("Migrating profiles...")
    migrate_profiles(sconn, pconn, user_id_map)
    print("Migrating recommendation/activity/saved-careers/game tables...")
    migrate_simple_tables(sconn, pconn, user_id_map)
    print("Migrating resumes...")
    migrate_resumes(sconn, pconn, user_id_map)
    print("Migrating skill tests/questions/results...")
    migrate_skill_tests(sconn, pconn, user_id_map)
    print("Migrating job-market tables...")
    migrate_job_tables(sconn, pconn)

    sconn.close()
    pconn.close()
    print("Done.")


if __name__ == "__main__":
    main()
