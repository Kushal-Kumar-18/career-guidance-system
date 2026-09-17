// Curated multiple-choice question bank for the most commonly claimed
// skills (drawn from the career dataset's skill vocabulary). Skills not
// present here fall back to the template generator in
// skillTestService.js#generateTemplateQuestions — see PHASE1_NOTES.md:
// the legacy question-generation module wasn't included in the handoff,
// so this bank + fallback is a fresh, documented implementation.
//
// Each entry: { question_text, options: [4], correct_answer: index, difficulty }

const QUESTION_BANK = {
  python: [
    { question_text: 'Which keyword defines a function in Python?', options: ['func', 'def', 'function', 'lambda'], correct_answer: 1, difficulty: 'beginner' },
    { question_text: 'What data type is returned by `range(5)`?', options: ['list', 'range object', 'tuple', 'generator'], correct_answer: 1, difficulty: 'beginner' },
    { question_text: 'Which of these is used for exception handling?', options: ['try/except', 'catch/throw', 'error/handle', 'on/rescue'], correct_answer: 0, difficulty: 'beginner' },
    { question_text: 'What does a Python list comprehension `[x*2 for x in range(3)]` evaluate to?', options: ['[0, 2, 4]', '[1, 2, 3]', '[0, 1, 2]', '[2, 4, 6]'], correct_answer: 0, difficulty: 'intermediate' },
    { question_text: 'Which module is commonly used for numerical arrays in Python?', options: ['array', 'numpy', 'math', 'stats'], correct_answer: 1, difficulty: 'intermediate' },
    { question_text: 'What is the time complexity of dictionary lookup in CPython, on average?', options: ['O(n)', 'O(log n)', 'O(1)', 'O(n log n)'], correct_answer: 2, difficulty: 'advanced' },
  ],
  javascript: [
    { question_text: 'Which keyword declares a block-scoped variable in modern JavaScript?', options: ['var', 'let', 'def', 'const int'], correct_answer: 1, difficulty: 'beginner' },
    { question_text: 'What does `===` check in JavaScript?', options: ['Value only', 'Value and type', 'Reference only', 'Type only'], correct_answer: 1, difficulty: 'beginner' },
    { question_text: 'What is returned by an `async function` by default?', options: ['undefined', 'a Promise', 'the resolved value', 'a callback'], correct_answer: 1, difficulty: 'intermediate' },
    { question_text: 'What does `Array.prototype.map` return?', options: ['A new array', 'The same array mutated', 'A single value', 'undefined'], correct_answer: 0, difficulty: 'intermediate' },
    { question_text: 'What is a closure in JavaScript?', options: ['A syntax error', 'A function bundled with its lexical scope', 'A type of loop', 'A CSS property'], correct_answer: 1, difficulty: 'advanced' },
  ],
  react: [
    { question_text: 'What hook is used to add state to a function component?', options: ['useEffect', 'useState', 'useRef', 'useMemo'], correct_answer: 1, difficulty: 'beginner' },
    { question_text: 'What does JSX compile down to?', options: ['HTML strings', 'React.createElement calls', 'CSS modules', 'Web Components'], correct_answer: 1, difficulty: 'beginner' },
    { question_text: 'When does `useEffect` with an empty dependency array run?', options: ['Every render', 'Once after the initial render', 'Never', 'Only on unmount'], correct_answer: 1, difficulty: 'intermediate' },
    { question_text: 'What is the purpose of a `key` prop in a list?', options: ['Styling', 'Help React identify which items changed', 'Accessibility only', 'Required for CSS'], correct_answer: 1, difficulty: 'intermediate' },
    { question_text: 'What problem does `useMemo` primarily solve?', options: ['Avoiding unnecessary re-computation', 'Fetching data', 'Routing', 'Global state'], correct_answer: 0, difficulty: 'advanced' },
  ],
  sql: [
    { question_text: 'Which SQL clause filters rows before aggregation?', options: ['HAVING', 'WHERE', 'GROUP BY', 'ORDER BY'], correct_answer: 1, difficulty: 'beginner' },
    { question_text: 'Which JOIN returns only matching rows from both tables?', options: ['LEFT JOIN', 'RIGHT JOIN', 'INNER JOIN', 'FULL OUTER JOIN'], correct_answer: 2, difficulty: 'beginner' },
    { question_text: 'What does a PRIMARY KEY constraint guarantee?', options: ['Uniqueness only', 'Uniqueness and non-null', 'Sorted order', 'Foreign reference'], correct_answer: 1, difficulty: 'intermediate' },
    { question_text: 'What does `HAVING` do that `WHERE` cannot?', options: ['Filter before grouping', 'Filter aggregated results', 'Join tables', 'Sort results'], correct_answer: 1, difficulty: 'intermediate' },
    { question_text: 'What is a common purpose of a database index?', options: ['Enforce foreign keys', 'Speed up read queries', 'Encrypt data', 'Normalize schema'], correct_answer: 1, difficulty: 'advanced' },
  ],
  'machine learning': [
    { question_text: 'What is overfitting?', options: ['Model performs well on unseen data', 'Model memorizes training data and generalizes poorly', 'Model underperforms everywhere', 'A type of data cleaning'], correct_answer: 1, difficulty: 'beginner' },
    { question_text: 'Which is a supervised learning task?', options: ['Clustering', 'Classification', 'Dimensionality reduction', 'Anomaly detection (unsupervised)'], correct_answer: 1, difficulty: 'beginner' },
    { question_text: 'What does cross-validation help estimate?', options: ['Training speed', 'Generalization performance', 'Feature count', 'Data size'], correct_answer: 1, difficulty: 'intermediate' },
    { question_text: 'What is the purpose of a regularization term (e.g. L2)?', options: ['Speed up training', 'Penalize model complexity to reduce overfitting', 'Increase variance', 'Normalize inputs'], correct_answer: 1, difficulty: 'intermediate' },
    { question_text: 'What does a ROC curve plot?', options: ['Precision vs Recall', 'True Positive Rate vs False Positive Rate', 'Loss vs Epoch', 'Bias vs Variance'], correct_answer: 1, difficulty: 'advanced' },
  ],
  docker: [
    { question_text: 'What is a Docker image?', options: ['A running process', 'A read-only template used to create containers', 'A virtual machine', 'A network protocol'], correct_answer: 1, difficulty: 'beginner' },
    { question_text: 'Which command starts a container from an image?', options: ['docker build', 'docker run', 'docker pull', 'docker init'], correct_answer: 1, difficulty: 'beginner' },
    { question_text: 'What does a Dockerfile define?', options: ['Runtime container logs', 'Steps to build an image', 'Kubernetes deployment', 'Network firewall rules'], correct_answer: 1, difficulty: 'intermediate' },
    { question_text: 'What is the purpose of Docker volumes?', options: ['Persist data outside the container lifecycle', 'Increase CPU limits', 'Compress images', 'Manage secrets only'], correct_answer: 0, difficulty: 'intermediate' },
    { question_text: 'What does multi-stage build primarily optimize?', options: ['Network speed', 'Final image size', 'Container name', 'Volume mounting'], correct_answer: 1, difficulty: 'advanced' },
  ],
  git: [
    { question_text: 'Which command stages changes for commit?', options: ['git commit', 'git add', 'git push', 'git stage'], correct_answer: 1, difficulty: 'beginner' },
    { question_text: 'What does `git clone` do?', options: ['Creates a new branch', 'Copies a remote repository locally', 'Merges two branches', 'Deletes history'], correct_answer: 1, difficulty: 'beginner' },
    { question_text: 'What is a merge conflict?', options: ['A network error', 'Overlapping changes Git cannot auto-resolve', 'A missing commit', 'A broken remote'], correct_answer: 1, difficulty: 'intermediate' },
    { question_text: 'What does `git rebase` do differently from `git merge`?', options: ['Nothing, they are identical', 'Rewrites commit history onto a new base', 'Deletes branches', 'Only works on remotes'], correct_answer: 1, difficulty: 'advanced' },
  ],
  aws: [
    { question_text: 'What does S3 primarily provide?', options: ['Object storage', 'Relational database', 'DNS management', 'Container orchestration'], correct_answer: 0, difficulty: 'beginner' },
    { question_text: 'What is an IAM role used for?', options: ['Billing reports', 'Granting permissions to AWS resources/identities', 'Load balancing', 'DNS routing'], correct_answer: 1, difficulty: 'intermediate' },
    { question_text: 'What does EC2 provide?', options: ['Serverless functions only', 'Resizable virtual compute instances', 'Managed relational databases', 'CDN edge caching'], correct_answer: 1, difficulty: 'beginner' },
    { question_text: 'What is the purpose of a VPC?', options: ['Isolated virtual network for your resources', 'A billing dashboard', 'A CI/CD pipeline', 'A logging service'], correct_answer: 0, difficulty: 'advanced' },
  ],
  communication: [
    { question_text: 'What is "active listening"?', options: ['Waiting for your turn to speak', 'Fully concentrating, understanding, and responding thoughtfully', 'Speaking louder', 'Interrupting to clarify quickly'], correct_answer: 1, difficulty: 'beginner' },
    { question_text: 'When giving constructive feedback, it is best to:', options: ['Focus on the person\'s character', 'Focus on specific, observable behavior', 'Avoid giving examples', 'Give feedback publicly always'], correct_answer: 1, difficulty: 'intermediate' },
    { question_text: 'In a disagreement at work, the most productive first step is usually:', options: ['Escalate immediately', 'Seek to understand the other perspective', 'Avoid the conversation', 'Assert your position loudly'], correct_answer: 1, difficulty: 'intermediate' },
  ],
};

module.exports = { QUESTION_BANK };
