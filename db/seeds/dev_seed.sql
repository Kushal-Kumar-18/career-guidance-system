-- Development seed data (section 12: development data strategy).
-- Safe to run repeatedly against a fresh schema; do NOT run against
-- production. No real user credentials — this is a synthetic demo account.
--
-- Password for the seeded user is "password123" (bcrypt hash below).
-- Regenerate with: node -e "console.log(require('bcryptjs').hashSync('password123', 12))"

INSERT INTO users (username, email, password_hash, role)
VALUES ('demo_user', 'demo@example.com', '$2a$12$g6WSzVLrIVpdFqDmGu3.duCEvDxz3PLcTcLLmJIUCJtJnV5jTDhsu', 'user')
ON CONFLICT (email) DO NOTHING;

INSERT INTO profiles (user_id, education, skills, interests, experience_years, certifications, projects)
SELECT id, 'B.Tech Computer Science', 'python, sql, machine learning, statistics, pandas',
       'data, ai, analytics', 2, '', 'Built a movie recommendation engine using collaborative filtering.'
FROM users WHERE email = 'demo@example.com'
ON CONFLICT (user_id) DO NOTHING;
