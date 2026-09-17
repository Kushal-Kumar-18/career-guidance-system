# Comprehensive Career Database - 100+ Careers across ALL sectors

CAREER_DATABASE = {
    # ========== TECHNOLOGY & IT (20 careers) ==========
    'Software Developer': {
        'skills': ['python', 'java', 'javascript', 'c++', 'programming', 'coding', 'git', 'algorithms', 
                  'data structures', 'object oriented', 'oop', 'software', 'development', 'debugging', 'api', 'rest'],
        'interests': ['technology', 'computers', 'problem solving', 'innovation', 'coding', 'programming',
                     'software', 'apps', 'web', 'logic', 'automation'],
        'education': ['B.Tech', 'BCA', 'MCA', 'B.Sc Computer Science', 'B.E', 'M.Tech', 'Bootcamp'],
        'salary_range': '₹3.5-15 LPA',
        'job_growth': 'Very High',
        'courses': ['Python Programming', 'Java Full Stack', 'Data Structures & Algorithms', 
                   'Web Development', 'Git & GitHub', 'Software Design Patterns']
    },
    
    'Data Scientist': {
        'skills': ['python', 'r', 'statistics', 'machine learning', 'ml', 'data analysis', 'sql', 
              'pandas', 'numpy', 'scipy', 'data', 'analytics', 'visualization', 'modeling', 'tableau', 'power bi'],
        'interests': ['data', 'analytics', 'mathematics', 'research', 'statistics', 'patterns',
                     'insights', 'numbers', 'science', 'ai', 'artificial intelligence'],
        'education': ['B.Tech', 'M.Tech', 'B.Sc Statistics', 'MCA', 'B.Sc Mathematics', 'MBA Analytics', 'PhD'],
        'salary_range': '₹6-25 LPA',
        'job_growth': 'Very High',
        'courses': ['Machine Learning', 'Deep Learning', 'Statistics for Data Science', 
                   'Python for Data Science', 'SQL & Databases', 'Data Visualization']
    },
    
    'Web Developer': {
        'skills': ['html', 'css', 'javascript', 'react', 'angular', 'vue', 'node', 'express', 'mongodb', 
                  'sql', 'responsive', 'frontend', 'backend', 'api', 'git', 'typescript', 'AI'],
        'interests': ['web', 'design', 'programming', 'creativity', 'user experience', 'technology', 
                     'internet', 'coding', 'visual', 'interactive'],
        'education': ['B.Tech', 'BCA', 'MCA', 'B.Sc IT', 'Bootcamp', 'Self-taught'],
        'salary_range': '₹3-12 LPA',
        'job_growth': 'Very High',
        'courses': ['HTML/CSS/JavaScript', 'React.js', 'Node.js', 'MongoDB', 'Full Stack Development', 'REST APIs']
    },
    
    'Mobile App Developer': {
        'skills': ['android', 'ios', 'kotlin', 'swift', 'flutter', 'react native', 'mobile', 'java', 
                  'objective c', 'app development', 'firebase', 'api', 'ui', 'ux'],
        'interests': ['mobile', 'apps', 'technology', 'programming', 'innovation', 'smartphones', 
                     'development', 'coding', 'user experience'],
        'education': ['B.Tech', 'BCA', 'MCA', 'B.Sc Computer Science', 'Bootcamp'],
        'salary_range': '₹4-18 LPA',
        'job_growth': 'Very High',
        'courses': ['Android Development', 'iOS Development', 'Flutter', 'React Native', 'Mobile UI/UX', 'Firebase']
    },
    
    'DevOps Engineer': {
        'skills': ['docker', 'kubernetes', 'jenkins', 'ci cd', 'linux', 'aws', 'azure', 'gcp', 'automation', 
                  'scripting', 'monitoring', 'git', 'infrastructure', 'terraform', 'ansible'],
        'interests': ['automation', 'technology', 'systems', 'efficiency', 'cloud', 'infrastructure', 
                     'deployment', 'operations', 'scalability'],
        'education': ['B.Tech', 'MCA', 'B.E', 'M.Tech', 'B.Sc Computer Science'],
        'salary_range': '₹6-25 LPA',
        'job_growth': 'Very High',
        'courses': ['Docker & Kubernetes', 'AWS/Azure/GCP', 'CI/CD Pipeline', 'Linux Administration', 
                   'DevOps Tools', 'Infrastructure as Code']
    },
    
    'Cybersecurity Analyst': {
        'skills': ['security', 'networking', 'ethical hacking', 'linux', 'cybersecurity', 'firewall', 
                  'penetration testing', 'cryptography', 'security audit', 'incident response', 'vulnerability'],
        'interests': ['security', 'technology', 'problem solving', 'investigation', 'hacking', 'protection', 
                     'networks', 'cyber', 'defense'],
        'education': ['B.Tech', 'MCA', 'B.Sc Computer Science', 'B.E', 'M.Tech Cybersecurity', 'CEH', 'CISSP'],
        'salary_range': '₹5-20 LPA',
        'job_growth': 'Very High',
        'courses': ['Ethical Hacking', 'Network Security', 'Cybersecurity Fundamentals', 'Linux Security', 
                   'CISSP Prep', 'Penetration Testing']
    },
    
    'Cloud Architect': {
        'skills': ['aws', 'azure', 'gcp', 'cloud', 'architecture', 'networking', 'security', 'scalability', 
                  'microservices', 'serverless', 'infrastructure', 'devops', 'kubernetes'],
        'interests': ['cloud', 'technology', 'architecture', 'scalability', 'systems', 'infrastructure', 
                     'innovation', 'design'],
        'education': ['B.Tech', 'M.Tech', 'B.E', 'MCA', 'Cloud Certifications'],
        'salary_range': '₹10-40 LPA',
        'job_growth': 'Very High',
        'courses': ['AWS Solutions Architect', 'Azure Administrator', 'Google Cloud', 'Cloud Security', 
                   'Microservices', 'Cloud Native']
    },
    
    'AI/ML Engineer': {
        'skills': ['python', 'machine learning', 'deep learning', 'tensorflow', 'pytorch', 'ai', 
                  'neural networks', 'nlp', 'computer vision', 'algorithms', 'mathematics', 'data science'],
        'interests': ['artificial intelligence', 'machine learning', 'research', 'innovation', 'technology', 
                     'algorithms', 'data', 'automation', 'ai', 'future tech'],
        'education': ['B.Tech', 'M.Tech', 'B.Sc Computer Science', 'PhD', 'Research'],
        'salary_range': '₹8-30 LPA',
        'job_growth': 'Very High',
        'courses': ['Machine Learning', 'Deep Learning', 'Natural Language Processing', 'Computer Vision', 
                   'TensorFlow/PyTorch', 'AI Ethics']
    },
    
    'Blockchain Developer': {
        'skills': ['blockchain', 'solidity', 'ethereum', 'smart contracts', 'web3', 'cryptocurrency', 
                  'cryptography', 'distributed systems', 'javascript', 'truffle', 'hardhat'],
        'interests': ['blockchain', 'cryptocurrency', 'technology', 'decentralization', 'innovation', 
                     'finance', 'security', 'future tech'],
        'education': ['B.Tech', 'MCA', 'B.Sc Computer Science', 'M.Tech', 'Self-taught'],
        'salary_range': '₹6-28 LPA',
        'job_growth': 'Very High',
        'courses': ['Blockchain Fundamentals', 'Solidity', 'Ethereum Development', 'Smart Contracts', 
                   'Web3.js', 'DeFi']
    },
    
    'Game Developer': {
        'skills': ['unity', 'unreal', 'c#', 'c++', 'game design', '3d modeling', 'animation', 
                  'game mechanics', 'physics', 'programming', 'graphics'],
        'interests': ['gaming', 'creativity', 'programming', 'graphics', 'storytelling', 'entertainment', 
                     'technology', 'innovation'],
        'education': ['B.Tech', 'BCA', 'B.Sc Computer Science', 'Game Design', 'Animation'],
        'salary_range': '₹3-18 LPA',
        'job_growth': 'High',
        'courses': ['Unity Game Development', 'Unreal Engine', 'C# for Games', 'Game Design', 
                   '3D Modeling', 'Game Physics']
    },
    
    'UI/UX Designer': {
        'skills': ['ui', 'ux', 'figma', 'adobe xd', 'sketch', 'wireframes', 'prototypes', 'user research', 
                  'design thinking', 'usability', 'interaction', 'photoshop', 'illustrator'],
        'interests': ['design', 'user experience', 'creativity', 'aesthetics', 'psychology', 'problem solving', 
                     'empathy', 'innovation'],
        'education': ['B.Design', 'Any Graduate', 'BCA', 'B.Sc IT', 'Design Courses'],
        'salary_range': '₹3.5-16 LPA',
        'job_growth': 'Very High',
        'courses': ['UI/UX Design', 'Figma', 'User Research', 'Design Thinking', 'Interaction Design', 
                   'Usability Testing']
    },
    
    'Database Administrator': {
        'skills': ['sql', 'mysql', 'postgresql', 'oracle', 'mongodb', 'database', 'backup', 'recovery', 
                  'performance tuning', 'security', 'query optimization'],
        'interests': ['databases', 'technology', 'data', 'systems', 'organization', 'problem solving', 
                     'optimization'],
        'education': ['B.Tech', 'MCA', 'B.Sc Computer Science', 'BCA'],
        'salary_range': '₹4-16 LPA',
        'job_growth': 'High',
        'courses': ['Database Management', 'SQL', 'MySQL/PostgreSQL', 'Database Security', 'Performance Tuning']
    },
    
    'Network Engineer': {
        'skills': ['networking', 'cisco', 'routing', 'switching', 'tcp ip', 'lan', 'wan', 'vpn', 
                  'firewall', 'network security', 'troubleshooting'],
        'interests': ['networking', 'technology', 'infrastructure', 'connectivity', 'problem solving', 
                     'communication systems'],
        'education': ['B.Tech', 'B.E', 'Diploma Networking', 'CCNA', 'CCNP'],
        'salary_range': '₹3.5-14 LPA',
        'job_growth': 'Medium',
        'courses': ['Networking Fundamentals', 'CCNA', 'Network Security', 'Routing & Switching', 
                   'Network Administration']
    },
    
    'System Administrator': {
        'skills': ['linux', 'windows server', 'networking', 'security', 'backup', 'monitoring', 
                  'troubleshooting', 'shell scripting', 'active directory', 'virtualization'],
        'interests': ['systems', 'technology', 'networks', 'problem solving', 'infrastructure', 
                     'maintenance', 'security'],
        'education': ['B.Tech', 'BCA', 'B.Sc Computer Science', 'MCA', 'Diploma IT'],
        'salary_range': '₹3-12 LPA',
        'job_growth': 'Medium',
        'courses': ['Linux Administration', 'Windows Server', 'Networking', 'System Security', 
                   'Shell Scripting', 'Virtualization']
    },
    
    'Data Engineer': {
        'skills': ['python', 'sql', 'spark', 'hadoop', 'etl', 'data pipeline', 'kafka', 'airflow', 
                  'data warehouse', 'big data', 'databases', 'aws'],
        'interests': ['data', 'engineering', 'systems', 'architecture', 'scalability', 'analytics', 
                     'technology', 'problem solving'],
        'education': ['B.Tech', 'M.Tech', 'MCA', 'B.Sc Computer Science'],
        'salary_range': '₹6-22 LPA',
        'job_growth': 'Very High',
        'courses': ['Data Engineering', 'Apache Spark', 'ETL Processes', 'Data Warehousing', 'Kafka', 'Big Data']
    },
    
    'Quality Assurance Engineer': {
        'skills': ['testing', 'selenium', 'automation', 'qa', 'test cases', 'bug tracking', 'agile', 
                  'manual testing', 'api testing', 'quality', 'jira'],
        'interests': ['quality', 'testing', 'problem solving', 'attention to detail', 'technology', 
                     'software', 'improvement'],
        'education': ['B.Tech', 'BCA', 'MCA', 'B.Sc Computer Science'],
        'salary_range': '₹3-14 LPA',
        'job_growth': 'High',
        'courses': ['Software Testing', 'Selenium Automation', 'API Testing', 'Test Automation', 
                   'Agile Testing', 'Performance Testing']
    },
    
    'IT Support Specialist': {
        'skills': ['troubleshooting', 'hardware', 'software', 'networking', 'customer service', 
                  'windows', 'mac', 'technical support', 'ticketing', 'documentation'],
        'interests': ['technology', 'helping people', 'problem solving', 'computers', 'support', 
                     'communication'],
        'education': ['BCA', 'B.Sc IT', 'Diploma IT', 'Any Graduate with IT Knowledge'],
        'salary_range': '₹2-8 LPA',
        'job_growth': 'Medium',
        'courses': ['IT Support Fundamentals', 'Hardware & Software', 'Networking Basics', 
                   'Customer Service', 'Troubleshooting']
    },
    
    'Solutions Architect': {
        'skills': ['architecture', 'system design', 'cloud', 'aws', 'azure', 'scalability', 'microservices', 
                  'api design', 'security', 'technical leadership'],
        'interests': ['architecture', 'design', 'technology', 'systems', 'problem solving', 'innovation', 
                     'strategy'],
        'education': ['B.Tech', 'M.Tech', 'B.E', 'MCA'],
        'salary_range': '₹12-45 LPA',
        'job_growth': 'Very High',
        'courses': ['Solutions Architecture', 'Cloud Architecture', 'System Design', 'Microservices', 
                   'Enterprise Architecture']
    },
    
    'IoT Engineer': {
        'skills': ['iot', 'embedded systems', 'sensors', 'arduino', 'raspberry pi', 'mqtt', 'networking', 
                  'python', 'c', 'hardware', 'programming'],
        'interests': ['iot', 'technology', 'hardware', 'electronics', 'innovation', 'automation', 
                     'smart devices', 'connectivity'],
        'education': ['B.Tech ECE', 'B.Tech EEE', 'B.E', 'M.Tech IoT'],
        'salary_range': '₹4-18 LPA',
        'job_growth': 'Very High',
        'courses': ['IoT Fundamentals', 'Embedded Systems', 'Arduino', 'Raspberry Pi', 'IoT Protocols', 
                   'Sensor Networks']
    },
    
    'Technical Writer': {
        'skills': ['writing', 'technical writing', 'documentation', 'communication', 'api documentation', 
                  'user manuals', 'editing', 'research', 'clarity'],
        'interests': ['writing', 'technology', 'communication', 'documentation', 'clarity', 'teaching', 
                     'explanation'],
        'education': ['B.Tech', 'BCA', 'BA English', 'Any Graduate with Tech Knowledge'],
        'salary_range': '₹3-12 LPA',
        'job_growth': 'High',
        'courses': ['Technical Writing', 'Documentation', 'API Documentation', 'Content Management', 
                   'Writing for Tech']
    },

    # ========== BUSINESS & MANAGEMENT (15 careers) ==========
    'Business Analyst': {
        'skills': ['excel', 'sql', 'power bi', 'tableau', 'business', 'analytics', 'data analysis', 
                  'requirements', 'documentation', 'stakeholder', 'agile', 'scrum', 'communication'],
        'interests': ['business', 'analysis', 'problem solving', 'strategy', 'data', 'processes', 
                     'improvement', 'consulting', 'decision making'],
        'education': ['MBA', 'B.Tech', 'BBA', 'B.Com', 'Any Graduate with Analytics'],
        'salary_range': '₹4-16 LPA',
        'job_growth': 'Very High',
        'courses': ['Business Analysis', 'SQL for Business', 'Excel Advanced', 'Power BI', 
                   'Agile & Scrum', 'Data Visualization']
    },
    
    'Product Manager': {
        'skills': ['product management', 'strategy', 'roadmap', 'agile', 'scrum', 'analytics', 
                  'user research', 'prioritization', 'stakeholder', 'communication', 'market research'],
        'interests': ['product', 'strategy', 'business', 'technology', 'innovation', 'leadership', 
                     'user experience', 'problem solving', 'planning'],
        'education': ['MBA', 'B.Tech', 'BBA', 'Any Graduate with Tech Background'],
        'salary_range': '₹8-35 LPA',
        'job_growth': 'Very High',
        'courses': ['Product Management', 'Agile & Scrum', 'Product Strategy', 'User Research', 
                   'Product Analytics', 'Product Design']
    },
    
    'Project Manager': {
        'skills': ['project management', 'pmp', 'agile', 'scrum', 'planning', 'budgeting', 'risk management', 
                  'leadership', 'communication', 'team management', 'stakeholder'],
        'interests': ['management', 'leadership', 'organization', 'planning', 'coordination', 
                     'problem solving', 'teamwork'],
        'education': ['MBA', 'B.Tech', 'BBA', 'Any Graduate', 'PMP Certification'],
        'salary_range': '₹6-22 LPA',
        'job_growth': 'High',
        'courses': ['Project Management', 'PMP Certification', 'Agile Project Management', 
                   'Risk Management', 'Leadership Skills']
    },
    
    'Management Consultant': {
        'skills': ['consulting', 'strategy', 'analysis', 'problem solving', 'communication', 'presentation', 
                  'business', 'research', 'excel', 'powerpoint', 'financial analysis'],
        'interests': ['strategy', 'business', 'problem solving', 'consulting', 'analysis', 'advisory', 
                     'improvement', 'transformation'],
        'education': ['MBA', 'B.Tech', 'BBA', 'Economics', 'Top Tier Business School'],
        'salary_range': '₹10-50 LPA',
        'job_growth': 'High',
        'courses': ['Management Consulting', 'Business Strategy', 'Case Interview Prep', 
                   'Financial Analysis', 'PowerPoint']
    },
    
    'Human Resources Manager': {
        'skills': ['hr management', 'recruitment', 'employee relations', 'communication', 'training', 
                  'performance management', 'compliance', 'leadership', 'payroll', 'hr software'],
        'interests': ['people', 'management', 'communication', 'organizational development', 'leadership', 
                     'culture', 'recruitment', 'development'],
        'education': ['MBA HR', 'BBA', 'Any Graduate with HR Certification', 'Psychology'],
        'salary_range': '₹4-18 LPA',
        'job_growth': 'Medium',
        'courses': ['HR Management', 'Talent Acquisition', 'Employee Relations', 'Performance Management', 
                   'HR Analytics', 'Labor Laws']
    },
    
    'Operations Manager': {
        'skills': ['operations', 'supply chain', 'logistics', 'process improvement', 'management', 
                  'planning', 'budgeting', 'quality control', 'lean', 'six sigma'],
        'interests': ['operations', 'efficiency', 'management', 'logistics', 'optimization', 
                     'problem solving', 'improvement'],
        'education': ['MBA Operations', 'B.Tech', 'BBA', 'Engineering'],
        'salary_range': '₹5-20 LPA',
        'job_growth': 'High',
        'courses': ['Operations Management', 'Supply Chain', 'Six Sigma', 'Lean Management', 
                   'Process Optimization']
    },
    
    'Supply Chain Manager': {
        'skills': ['supply chain', 'logistics', 'procurement', 'inventory', 'vendor management', 
                  'negotiation', 'planning', 'forecasting', 'erp', 'analytics'],
        'interests': ['logistics', 'supply chain', 'operations', 'planning', 'efficiency', 
                     'coordination', 'management'],
        'education': ['MBA Supply Chain', 'B.Tech', 'BBA', 'Engineering'],
        'salary_range': '₹5-22 LPA',
        'job_growth': 'High',
        'courses': ['Supply Chain Management', 'Logistics', 'Procurement', 'Inventory Management', 
                   'ERP Systems']
    },
    
    'Business Development Manager': {
        'skills': ['business development', 'sales', 'communication', 'negotiation', 'networking', 
                  'strategy', 'market research', 'crm', 'presentation', 'relationship building'],
        'interests': ['business', 'sales', 'growth', 'networking', 'communication', 'strategy', 
                     'relationships', 'deals'],
        'education': ['MBA', 'BBA', 'B.Com', 'Any Graduate'],
        'salary_range': '₹4-20 LPA',
        'job_growth': 'High',
        'courses': ['Business Development', 'Sales Strategy', 'Negotiation', 'Market Research', 
                   'CRM', 'Communication']
    },
    
    'Risk Manager': {
        'skills': ['risk management', 'analysis', 'compliance', 'finance', 'auditing', 'assessment', 
                  'mitigation', 'reporting', 'regulations'],
        'interests': ['risk', 'analysis', 'finance', 'compliance', 'problem solving', 'assessment', 
                     'protection'],
        'education': ['MBA Finance', 'CA', 'CFA', 'B.Com', 'Risk Management Certification'],
        'salary_range': '₹6-25 LPA',
        'job_growth': 'High',
        'courses': ['Risk Management', 'Financial Risk', 'Compliance', 'Enterprise Risk Management', 
                   'Auditing']
    },
    
    'Change Management Consultant': {
        'skills': ['change management', 'organizational development', 'communication', 'training', 
                  'stakeholder management', 'leadership', 'strategy', 'transformation'],
        'interests': ['change', 'organizational development', 'people', 'transformation', 'strategy', 
                     'improvement', 'leadership'],
        'education': ['MBA', 'Organizational Psychology', 'HR', 'Business'],
        'salary_range': '₹7-28 LPA',
        'job_growth': 'High',
        'courses': ['Change Management', 'Organizational Development', 'Leadership', 
                   'Stakeholder Management', 'Communication']
    },
    
    'Strategy Consultant': {
        'skills': ['strategy', 'consulting', 'analysis', 'business', 'market research', 'problem solving', 
                  'presentation', 'financial modeling', 'communication'],
        'interests': ['strategy', 'business', 'consulting', 'problem solving', 'analysis', 'planning', 
                     'innovation'],
        'education': ['MBA', 'Top Tier Business School', 'Economics', 'Engineering'],
        'salary_range': '₹12-60 LPA',
        'job_growth': 'High',
        'courses': ['Business Strategy', 'Strategic Planning', 'Market Analysis', 'Financial Modeling', 
                   'Case Studies']
    },
    
    'Entrepreneur': {
        'skills': ['business', 'leadership', 'innovation', 'problem solving', 'communication', 'networking', 
                  'finance', 'marketing', 'sales', 'strategic thinking'],
        'interests': ['business', 'entrepreneurship', 'innovation', 'independence', 'creation', 'leadership', 
                     'problem solving', 'opportunity'],
        'education': ['Any Graduate', 'MBA', 'Business Courses', 'Self-taught'],
        'salary_range': '₹0-Unlimited',
        'job_growth': 'Variable',
        'courses': ['Entrepreneurship', 'Business Planning', 'Finance for Entrepreneurs', 'Marketing', 
                   'Leadership']
    },
    
    'Customer Success Manager': {
        'skills': ['customer service', 'communication', 'relationship management', 'problem solving', 
                  'crm', 'account management', 'analytics', 'training'],
        'interests': ['customers', 'relationships', 'helping people', 'communication', 'problem solving', 
                     'success', 'retention'],
        'education': ['Any Graduate', 'BBA', 'MBA', 'Communication'],
        'salary_range': '₹4-16 LPA',
        'job_growth': 'Very High',
        'courses': ['Customer Success', 'CRM', 'Communication Skills', 'Account Management', 
                   'Customer Service']
    },
    
    'Administrative Manager': {
        'skills': ['administration', 'organization', 'communication', 'planning', 'budgeting', 
                  'coordination', 'office management', 'multitasking', 'scheduling'],
        'interests': ['organization', 'management', 'coordination', 'office', 'planning', 'efficiency', 
                     'support'],
        'education': ['Any Graduate', 'BBA', 'MBA', 'Commerce'],
        'salary_range': '₹3-12 LPA',
        'job_growth': 'Medium',
        'courses': ['Office Administration', 'Management', 'Communication', 'Business Operations', 
                   'MS Office']
    },
    
    'Compliance Officer': {
        'skills': ['compliance', 'regulations', 'auditing', 'risk assessment', 'documentation', 
                  'reporting', 'legal knowledge', 'ethics', 'communication'],
        'interests': ['compliance', 'regulations', 'law', 'ethics', 'governance', 'risk', 'assessment'],
        'education': ['Law', 'CA', 'MBA', 'B.Com', 'Compliance Certification'],
        'salary_range': '₹5-20 LPA',
        'job_growth': 'High',
        'courses': ['Compliance Management', 'Regulatory Compliance', 'Risk Management', 'Auditing', 
                   'Corporate Law']
    },

    # ========== FINANCE & ACCOUNTING (12 careers) ==========
    'Financial Analyst': {
        'skills': ['finance', 'accounting', 'excel', 'financial modeling', 'analysis', 'budgeting', 
                  'forecasting', 'investment', 'valuation', 'reporting', 'powerpoint'],
        'interests': ['finance', 'analysis', 'numbers', 'markets', 'investment', 'economics', 
                     'business', 'data'],
        'education': ['MBA Finance', 'B.Com', 'CA', 'CFA', 'Economics'],
        'salary_range': '₹4-18 LPA',
        'job_growth': 'High',
        'courses': ['Financial Modeling', 'Excel for Finance', 'CFA Level 1', 'Investment Analysis', 
                   'Accounting']
    },
    
    'Chartered Accountant': {
        'skills': ['accounting', 'auditing', 'taxation', 'finance', 'gst', 'compliance', 'tally', 
                  'excel', 'financial reporting', 'ifrs', 'ind as'],
        'interests': ['accounting', 'finance', 'taxation', 'compliance', 'analysis', 'numbers', 
                     'precision', 'regulations'],
        'education': ['CA', 'B.Com', 'MBA Finance'],
        'salary_range': '₹6-30 LPA',
        'job_growth': 'High',
        'courses': ['CA Foundation', 'CA Intermediate', 'CA Final', 'Taxation', 'Auditing', 
                   'Financial Accounting']
    },
    
    'Investment Banker': {
        'skills': ['finance', 'investment', 'financial modeling', 'valuation', 'excel', 'powerpoint', 
                  'analysis', 'markets', 'networking', 'mergers', 'acquisitions'],
        'interests': ['finance', 'investment', 'markets', 'analysis', 'business', 'deals', 'money', 
                     'strategy', 'high finance'],
        'education': ['MBA Finance', 'CA', 'CFA', 'Economics', 'Top Tier'],
        'salary_range': '₹8-60 LPA',
        'job_growth': 'High',
        'courses': ['Investment Banking', 'Financial Modeling', 'Valuation', 'M&A', 'Excel', 
                   'Corporate Finance']
    },
    
    'Portfolio Manager': {
        'skills': ['investment', 'portfolio management', 'analysis', 'risk management', 'markets', 
                  'asset allocation', 'trading', 'financial analysis', 'research'],
        'interests': ['investment', 'markets', 'finance', 'analysis', 'strategy', 'risk', 'wealth management'],
        'education': ['MBA Finance', 'CFA', 'CA', 'Economics', 'B.Com'],
        'salary_range': '₹8-35 LPA',
        'job_growth': 'High',
        'courses': ['Portfolio Management', 'CFA', 'Investment Analysis', 'Risk Management', 'Asset Allocation']
    },
    
    'Tax Consultant': {
        'skills': ['taxation', 'gst', 'income tax', 'tds', 'compliance', 'accounting', 'tally', 
                  'tax planning', 'advisory', 'regulations'],
        'interests': ['taxation', 'finance', 'compliance', 'advisory', 'regulations', 'planning', 'numbers'],
        'education': ['CA', 'B.Com', 'MBA Finance', 'Tax Certification'],
        'salary_range': '₹4-20 LPA',
        'job_growth': 'High',
        'courses': ['Taxation', 'GST', 'Income Tax', 'Tax Planning', 'Compliance', 'Accounting']
    },
    
    'Credit Analyst': {
        'skills': ['credit analysis', 'financial analysis', 'risk assessment', 'excel', 'accounting', 
                  'banking', 'lending', 'reporting', 'due diligence'],
        'interests': ['finance', 'analysis', 'risk', 'banking', 'assessment', 'numbers', 'credit'],
        'education': ['B.Com', 'MBA Finance', 'CA', 'Economics'],
        'salary_range': '₹3.5-14 LPA',
        'job_growth': 'Medium',
        'courses': ['Credit Analysis', 'Financial Analysis', 'Risk Assessment', 'Banking', 'Excel']
    },
    
    'Financial Planner': {
        'skills': ['financial planning', 'investment', 'insurance', 'retirement planning', 'tax planning', 
                  'wealth management', 'communication', 'advisory'],
        'interests': ['finance', 'planning', 'helping people', 'investment', 'advisory', 'wealth', 'goals'],
        'education': ['B.Com', 'MBA Finance', 'CFP', 'CA', 'Any Graduate with CFP'],
        'salary_range': '₹3-18 LPA',
        'job_growth': 'High',
        'courses': ['Financial Planning', 'CFP Certification', 'Investment Planning', 'Tax Planning', 
                   'Retirement Planning']
    },
    
    'Equity Research Analyst': {
        'skills': ['equity research', 'financial modeling', 'valuation', 'analysis', 'markets', 
                  'excel', 'report writing', 'industry research'],
        'interests': ['stock market', 'research', 'analysis', 'finance', 'investment', 'companies', 'valuation'],
        'education': ['MBA Finance', 'CA', 'CFA', 'Economics', 'B.Com'],
        'salary_range': '₹5-22 LPA',
        'job_growth': 'High',
        'courses': ['Equity Research', 'Financial Modeling', 'Valuation', 'CFA', 'Stock Market Analysis']
    },
    
    'Treasury Analyst': {
        'skills': ['treasury', 'cash management', 'forex', 'financial analysis', 'risk management', 
                  'banking', 'excel', 'forecasting'],
        'interests': ['finance', 'treasury', 'cash management', 'analysis', 'banking', 'risk', 'markets'],
        'education': ['B.Com', 'MBA Finance', 'CA', 'Economics'],
        'salary_range': '₹4-16 LPA',
        'job_growth': 'Medium',
        'courses': ['Treasury Management', 'Cash Management', 'Foreign Exchange', 'Financial Analysis', 'Risk']
    },
    
    'Auditor': {
        'skills': ['auditing', 'accounting', 'compliance', 'internal audit', 'risk assessment', 
                  'reporting', 'analysis', 'regulations', 'documentation'],
        'interests': ['auditing', 'compliance', 'accuracy', 'regulations', 'investigation', 'analysis', 
                     'finance'],
        'education': ['CA', 'B.Com', 'MBA Finance', 'Internal Audit Certification'],
        'salary_range': '₹4-18 LPA',
        'job_growth': 'Medium',
        'courses': ['Auditing', 'Internal Audit', 'Compliance', 'Risk Assessment', 'Financial Accounting']
    },
    
    'Cost Accountant': {
        'skills': ['cost accounting', 'budgeting', 'variance analysis', 'cost control', 'financial analysis', 
                  'erp', 'excel', 'reporting'],
        'interests': ['accounting', 'cost management', 'budgeting', 'analysis', 'efficiency', 'numbers'],
        'education': ['CMA', 'B.Com', 'MBA Finance', 'CA'],
        'salary_range': '₹4-16 LPA',
        'job_growth': 'Medium',
        'courses': ['Cost Accounting', 'CMA', 'Budgeting', 'Cost Control', 'Management Accounting']
    },
    
    'Actuary': {
        'skills': ['actuarial science', 'statistics', 'mathematics', 'risk assessment', 'insurance', 
                  'modeling', 'analysis', 'excel', 'programming'],
        'interests': ['mathematics', 'statistics', 'risk', 'insurance', 'analysis', 'modeling', 'finance'],
        'education': ['B.Sc Statistics', 'B.Sc Mathematics', 'Actuarial Science', 'Economics'],
        'salary_range': '₹6-30 LPA',
        'job_growth': 'High',
        'courses': ['Actuarial Science', 'Statistics', 'Risk Modeling', 'Insurance', 'Financial Mathematics']
    },

    # ========== MARKETING & SALES (10 careers) ==========
    'Digital Marketing Specialist': {
        'skills': ['marketing', 'seo', 'sem', 'social media', 'content', 'analytics', 'google ads', 
                  'facebook ads', 'email marketing', 'copywriting', 'branding', 'campaigns'],
        'interests': ['marketing', 'communication', 'creativity', 'business', 'social media', 'advertising', 
                     'branding', 'trends', 'content creation'],
        'education': ['MBA', 'BBA', 'B.Com', 'Any Graduate', 'Mass Communication'],
        'salary_range': '₹3-14 LPA',
        'job_growth': 'Very High',
        'courses': ['Digital Marketing', 'SEO & SEM', 'Social Media Marketing', 'Content Marketing', 
                   'Google Analytics', 'Email Marketing']
    },
    
    'Content Writer': {
        'skills': ['writing', 'content', 'communication', 'seo', 'research', 'copywriting', 'editing', 
                  'grammar', 'storytelling', 'blogging', 'articles'],
        'interests': ['writing', 'creativity', 'communication', 'storytelling', 'reading', 'language', 
                     'journalism', 'content', 'blogging'],
        'education': ['BA English', 'Mass Communication', 'Journalism', 'Any Graduate'],
        'salary_range': '₹2-10 LPA',
        'job_growth': 'High',
        'courses': ['Content Writing', 'Creative Writing', 'SEO Writing', 'Copywriting', 
                   'Technical Writing', 'Blogging']
    },
    
    'Social Media Manager': {
        'skills': ['social media', 'content', 'marketing', 'communication', 'creativity', 'analytics', 
                  'campaigns', 'copywriting', 'graphics', 'trends', 'engagement'],
        'interests': ['social media', 'communication', 'creativity', 'trends', 'marketing', 'branding', 
                     'engagement', 'community'],
        'education': ['Any Graduate', 'Mass Communication', 'Marketing', 'BBA'],
        'salary_range': '₹3-12 LPA',
        'job_growth': 'Very High',
        'courses': ['Social Media Marketing', 'Content Strategy', 'Community Management', 'Analytics', 
                   'Copywriting']
    },
    
    'Sales Manager': {
        'skills': ['sales', 'communication', 'negotiation', 'leadership', 'crm', 'customer relations', 
                  'presentation', 'business development', 'persuasion', 'team management'],
        'interests': ['sales', 'communication', 'people', 'business', 'targets', 'achievement', 
                     'relationships', 'negotiation'],
        'education': ['MBA', 'BBA', 'B.Com', 'Any Graduate'],
        'salary_range': '₹4-20 LPA',
        'job_growth': 'High',
        'courses': ['Sales Management', 'Negotiation Skills', 'CRM', 'Business Development', 
                   'Communication', 'Leadership']
    },
    
    'Brand Manager': {
        'skills': ['branding', 'marketing', 'strategy', 'communication', 'creativity', 'research', 
                  'analytics', 'campaign management', 'advertising', 'positioning'],
        'interests': ['branding', 'marketing', 'creativity', 'business', 'strategy', 'design', 
                     'advertising', 'consumer behavior'],
        'education': ['MBA Marketing', 'BBA', 'Any Graduate', 'Mass Communication'],
        'salary_range': '₹6-25 LPA',
        'job_growth': 'High',
        'courses': ['Brand Management', 'Marketing Strategy', 'Consumer Behavior', 'Advertising', 
                   'Market Research']
    },
    
    'Market Research Analyst': {
        'skills': ['market research', 'analysis', 'surveys', 'data analysis', 'statistics', 'excel', 
                  'reporting', 'consumer behavior', 'presentation'],
        'interests': ['research', 'analysis', 'data', 'consumer behavior', 'markets', 'insights', 
                     'statistics', 'trends'],
        'education': ['MBA', 'BBA', 'Statistics', 'Economics', 'Any Graduate'],
        'salary_range': '₹3.5-14 LPA',
        'job_growth': 'High',
        'courses': ['Market Research', 'Data Analysis', 'Consumer Insights', 'Survey Design', 
                   'Statistics', 'Excel']
    },
    
    'Public Relations Manager': {
        'skills': ['public relations', 'communication', 'media relations', 'crisis management', 
                  'writing', 'networking', 'event management', 'presentation'],
        'interests': ['communication', 'public relations', 'media', 'networking', 'reputation', 
                     'people', 'events'],
        'education': ['Mass Communication', 'PR', 'Journalism', 'MBA', 'Any Graduate'],
        'salary_range': '₹4-18 LPA',
        'job_growth': 'Medium',
        'courses': ['Public Relations', 'Media Relations', 'Crisis Management', 'Communication', 
                   'Event Management']
    },
    
    'SEO Specialist': {
        'skills': ['seo', 'google analytics', 'keyword research', 'content optimization', 'link building', 
                  'technical seo', 'sem', 'analytics', 'html'],
        'interests': ['seo', 'digital marketing', 'analytics', 'technology', 'optimization', 'web', 
                     'search engines'],
        'education': ['Any Graduate', 'BCA', 'Marketing', 'Mass Communication'],
        'salary_range': '₹2.5-12 LPA',
        'job_growth': 'Very High',
        'courses': ['SEO Fundamentals', 'Advanced SEO', 'Google Analytics', 'Technical SEO', 
                   'Content Optimization']
    },
    
    'Email Marketing Specialist': {
        'skills': ['email marketing', 'copywriting', 'automation', 'analytics', 'mailchimp', 
                  'segmentation', 'campaigns', 'a/b testing', 'marketing'],
        'interests': ['marketing', 'communication', 'email', 'automation', 'analytics', 'campaigns', 
                     'creativity'],
        'education': ['Any Graduate', 'Marketing', 'Mass Communication', 'BBA'],
        'salary_range': '₹2.5-10 LPA',
        'job_growth': 'High',
        'courses': ['Email Marketing', 'Marketing Automation', 'Copywriting', 'Analytics', 
                   'Campaign Management']
    },
    
    'Advertising Manager': {
        'skills': ['advertising', 'marketing', 'creativity', 'campaign management', 'budgeting', 
                  'media planning', 'communication', 'analytics', 'negotiation'],
        'interests': ['advertising', 'creativity', 'marketing', 'campaigns', 'media', 'communication', 
                     'branding'],
        'education': ['MBA Marketing', 'Mass Communication', 'Advertising', 'BBA'],
        'salary_range': '₹5-22 LPA',
        'job_growth': 'Medium',
        'courses': ['Advertising', 'Media Planning', 'Campaign Management', 'Creative Strategy', 
                   'Digital Advertising']
    },

    # ========== DESIGN & CREATIVE (12 careers) ==========
    'Graphic Designer': {
        'skills': ['photoshop', 'illustrator', 'indesign', 'corel', 'design', 'creativity', 'visual', 
                  'branding', 'logo', 'typography', 'color theory', 'composition'],
        'interests': ['art', 'creativity', 'design', 'visual', 'graphics', 'illustration', 'branding', 
                     'aesthetics', 'colors', 'typography'],
        'education': ['B.Design', 'Fine Arts', 'Any Graduate', 'Diploma Design'],
        'salary_range': '₹2-10 LPA',
        'job_growth': 'High',
        'courses': ['Graphic Design Fundamentals', 'Adobe Photoshop', 'Illustrator', 'Brand Design', 
                   'Typography', 'Print Design']
    },
    
    'Video Editor': {
        'skills': ['video editing', 'premiere pro', 'after effects', 'final cut', 'storytelling', 
                  'color grading', 'motion graphics', 'sound editing', 'davinci resolve'],
        'interests': ['video', 'creativity', 'storytelling', 'films', 'editing', 'visual effects', 
                     'media', 'content creation'],
        'education': ['Any Graduate', 'Mass Communication', 'Film School', 'Self-taught'],
        'salary_range': '₹2.5-12 LPA',
        'job_growth': 'High',
        'courses': ['Video Editing', 'Premiere Pro', 'After Effects', 'Color Grading', 'Motion Graphics']
    },
    
    'Interior Designer': {
        'skills': ['interior design', 'autocad', 'sketchup', '3d modeling', 'creativity', 'space planning', 
                  'color theory', 'furniture', 'client management', '3ds max'],
        'interests': ['design', 'creativity', 'aesthetics', 'architecture', 'spaces', 'decoration', 
                     'art', 'functionality'],
        'education': ['B.Design Interior', 'Architecture', 'Diploma Interior Design'],
        'salary_range': '₹2.5-15 LPA',
        'job_growth': 'Medium',
        'courses': ['Interior Design', 'AutoCAD', 'SketchUp', '3D Visualization', 'Space Planning', 
                   'Design Principles']
    },
    
    'Fashion Designer': {
        'skills': ['fashion design', 'sketching', 'textiles', 'pattern making', 'creativity', 'sewing', 
                  'trends', 'color', 'styling', 'fashion illustration'],
        'interests': ['fashion', 'design', 'creativity', 'trends', 'art', 'textiles', 'style', 
                     'aesthetics', 'clothing'],
        'education': ['Fashion Design', 'B.Design', 'NIFT', 'Diploma Fashion'],
        'salary_range': '₹2-20 LPA',
        'job_growth': 'Medium',
        'courses': ['Fashion Design', 'Pattern Making', 'Textile Design', 'Fashion Illustration', 
                   'Merchandising', 'Garment Construction']
    },
    
    'Animator': {
        'skills': ['animation', '2d animation', '3d animation', 'maya', 'blender', 'after effects', 
                  'character design', 'storyboarding', 'creativity'],
        'interests': ['animation', 'art', 'creativity', 'storytelling', 'characters', 'graphics', 
                     'visual effects', 'entertainment'],
        'education': ['Animation', 'Fine Arts', 'Multimedia', 'Any Graduate'],
        'salary_range': '₹2.5-14 LPA',
        'job_growth': 'High',
        'courses': ['2D Animation', '3D Animation', 'Maya', 'Blender', 'Character Design', 'Storyboarding']
    },
    
    'Illustrator': {
        'skills': ['illustration', 'drawing', 'digital art', 'photoshop', 'illustrator', 'creativity', 
                  'concept art', 'sketching', 'visual storytelling'],
        'interests': ['art', 'drawing', 'creativity', 'illustration', 'visual', 'storytelling', 
                     'design', 'imagination'],
        'education': ['Fine Arts', 'Design', 'Any Graduate', 'Self-taught'],
        'salary_range': '₹2-12 LPA',
        'job_growth': 'Medium',
        'courses': ['Digital Illustration', 'Character Design', 'Concept Art', 'Adobe Illustrator', 
                   'Drawing Fundamentals']
    },
    
    'Industrial Designer': {
        'skills': ['industrial design', 'product design', 'cad', 'solidworks', 'sketching', 'prototyping', 
                  'ergonomics', '3d modeling', 'manufacturing'],
        'interests': ['design', 'products', 'innovation', 'creativity', 'engineering', 'aesthetics', 
                     'functionality'],
        'education': ['B.Design Industrial', 'Engineering', 'Product Design'],
        'salary_range': '₹3-16 LPA',
        'job_growth': 'Medium',
        'courses': ['Industrial Design', 'Product Design', 'CAD', 'Prototyping', 'Ergonomics', 
                   'Design Thinking']
    },
    
    'Packaging Designer': {
        'skills': ['packaging design', 'graphic design', 'illustrator', 'photoshop', 'structural design', 
                  'branding', 'print design', 'creativity'],
        'interests': ['design', 'packaging', 'creativity', 'branding', 'graphics', 'innovation', 
                     'product presentation'],
        'education': ['B.Design', 'Graphic Design', 'Fine Arts', 'Any Graduate'],
        'salary_range': '₹2.5-10 LPA',
        'job_growth': 'Medium',
        'courses': ['Packaging Design', 'Structural Design', 'Graphic Design', 'Branding', 
                   'Print Production']
    },
    
    'Landscape Architect': {
        'skills': ['landscape design', 'autocad', 'sketchup', 'horticulture', 'site planning', 
                  'environmental design', 'creativity', 'project management'],
        'interests': ['nature', 'design', 'environment', 'outdoors', 'plants', 'architecture', 
                     'aesthetics', 'sustainability'],
        'education': ['Landscape Architecture', 'Architecture', 'B.Design'],
        'salary_range': '₹3-14 LPA',
        'job_growth': 'Medium',
        'courses': ['Landscape Architecture', 'Site Planning', 'Horticulture', 'AutoCAD', 
                   'Environmental Design']
    },
    
    'Jewelry Designer': {
        'skills': ['jewelry design', 'sketching', 'cad', 'creativity', 'metalwork', 'gemology', 
                  '3d modeling', 'rendering', 'design'],
        'interests': ['jewelry', 'design', 'creativity', 'art', 'fashion', 'aesthetics', 'craftsmanship'],
        'education': ['Jewelry Design', 'Fine Arts', 'B.Design', 'Gemology'],
        'salary_range': '₹2-15 LPA',
        'job_growth': 'Medium',
        'courses': ['Jewelry Design', 'CAD for Jewelry', 'Gemology', 'Metalwork', 'Design Fundamentals']
    },
    
    'Exhibition Designer': {
        'skills': ['exhibition design', '3d design', 'autocad', 'sketchup', 'creativity', 'spatial design', 
                  'graphics', 'project management', 'visualization'],
        'interests': ['design', 'exhibitions', 'creativity', 'spaces', 'visual display', 'events', 
                     'art', 'presentation'],
        'education': ['B.Design', 'Interior Design', 'Architecture', 'Fine Arts'],
        'salary_range': '₹2.5-12 LPA',
        'job_growth': 'Medium',
        'courses': ['Exhibition Design', 'Spatial Design', '3D Visualization', 'AutoCAD', 'Event Design']
    },
    
    'Motion Graphics Designer': {
        'skills': ['motion graphics', 'after effects', 'cinema 4d', 'animation', 'design', 'video editing', 
                  'creativity', 'visual effects', 'storytelling'],
        'interests': ['motion graphics', 'animation', 'design', 'creativity', 'visual effects', 
                     'video', 'art', 'technology'],
        'education': ['Design', 'Animation', 'Multimedia', 'Any Graduate', 'Self-taught'],
        'salary_range': '₹3-14 LPA',
        'job_growth': 'High',
        'courses': ['Motion Graphics', 'After Effects', 'Cinema 4D', 'Animation', 'Visual Effects']
    },

    # ========== HEALTHCARE (15 careers) ==========
    'Medical Doctor': {
        'skills': ['medicine', 'diagnosis', 'treatment', 'patient care', 'anatomy', 'physiology', 
                  'medical knowledge', 'clinical skills', 'empathy', 'surgery'],
        'interests': ['healthcare', 'medicine', 'helping people', 'science', 'patient care', 'healing', 
                     'research', 'health'],
        'education': ['MBBS', 'MD', 'MS', 'Medical School'],
        'salary_range': '₹6-50 LPA',
        'job_growth': 'High',
        'courses': ['MBBS', 'Post-graduation Specialization', 'Medical Research', 'Clinical Training']
    },
    
    'Nurse': {
        'skills': ['nursing', 'patient care', 'medical procedures', 'compassion', 'communication', 
                  'first aid', 'medication', 'health assessment', 'documentation'],
        'interests': ['healthcare', 'helping people', 'medicine', 'patient care', 'compassion', 
                     'service', 'nursing'],
        'education': ['B.Sc Nursing', 'GNM', 'ANM', 'Post Basic Nursing'],
        'salary_range': '₹2.5-10 LPA',
        'job_growth': 'High',
        'courses': ['Nursing Fundamentals', 'Patient Care', 'Medical Procedures', 'Healthcare Management', 
                   'ICU Nursing']
    },
    
    'Pharmacist': {
        'skills': ['pharmacy', 'medicines', 'drug knowledge', 'patient counseling', 'dispensing', 
                  'chemistry', 'pharmacology', 'inventory', 'regulations'],
        'interests': ['pharmacy', 'healthcare', 'medicine', 'chemistry', 'patient care', 'science', 
                     'health'],
        'education': ['B.Pharm', 'M.Pharm', 'Pharm.D', 'Pharmacy'],
        'salary_range': '₹2.5-12 LPA',
        'job_growth': 'Medium',
        'courses': ['Pharmacy', 'Pharmacology', 'Clinical Pharmacy', 'Drug Chemistry', 'Hospital Pharmacy']
    },
    
    'Physiotherapist': {
        'skills': ['physiotherapy', 'rehabilitation', 'patient care', 'exercise therapy', 'manual therapy', 
                  'anatomy', 'assessment', 'treatment planning'],
        'interests': ['healthcare', 'helping people', 'rehabilitation', 'sports', 'therapy', 
                     'physical fitness', 'recovery'],
        'education': ['BPT', 'MPT', 'Physiotherapy'],
        'salary_range': '₹2.5-10 LPA',
        'job_growth': 'High',
        'courses': ['Physiotherapy', 'Rehabilitation', 'Sports Therapy', 'Manual Therapy', 'Orthopedics']
    },
    
    'Dentist': {
        'skills': ['dentistry', 'oral surgery', 'dental procedures', 'patient care', 'diagnosis', 
                  'treatment', 'dental hygiene', 'orthodontics'],
        'interests': ['healthcare', 'dentistry', 'helping people', 'oral health', 'medicine', 
                     'patient care', 'precision'],
        'education': ['BDS', 'MDS', 'Dental School'],
        'salary_range': '₹4-25 LPA',
        'job_growth': 'High',
        'courses': ['BDS', 'MDS Specialization', 'Orthodontics', 'Oral Surgery', 'Periodontics']
    },
    
    'Medical Lab Technician': {
        'skills': ['laboratory', 'testing', 'analysis', 'equipment operation', 'accuracy', 'pathology', 
                  'microbiology', 'documentation', 'quality control'],
        'interests': ['healthcare', 'laboratory', 'science', 'testing', 'analysis', 'precision', 
                     'medical technology'],
        'education': ['B.Sc MLT', 'DMLT', 'B.Sc Medical Lab Technology'],
        'salary_range': '₹2-8 LPA',
        'job_growth': 'Medium',
        'courses': ['Medical Lab Technology', 'Clinical Pathology', 'Microbiology', 'Laboratory Management']
    },
    
    'Radiologist': {
        'skills': ['radiology', 'imaging', 'diagnosis', 'x-ray', 'ct scan', 'mri', 'medical knowledge', 
                  'interpretation', 'patient care'],
        'interests': ['healthcare', 'medicine', 'imaging', 'diagnosis', 'technology', 'patient care', 
                     'radiology'],
        'education': ['MBBS', 'MD Radiology', 'DNB Radiology'],
        'salary_range': '₹8-40 LPA',
        'job_growth': 'High',
        'courses': ['MBBS', 'MD Radiology', 'Imaging Techniques', 'Diagnostic Radiology']
    },
    
    'Clinical Psychologist': {
        'skills': ['psychology', 'counseling', 'therapy', 'assessment', 'diagnosis', 'treatment planning', 
                  'empathy', 'communication', 'mental health'],
        'interests': ['psychology', 'mental health', 'helping people', 'counseling', 'therapy', 
                     'human behavior', 'empathy'],
        'education': ['M.Phil Clinical Psychology', 'M.A Psychology', 'PhD Psychology'],
        'salary_range': '₹3-15 LPA',
        'job_growth': 'High',
        'courses': ['Clinical Psychology', 'Counseling', 'Psychotherapy', 'Assessment', 'Mental Health']
    },
    
    'Dietitian/Nutritionist': {
        'skills': ['nutrition', 'diet planning', 'health assessment', 'counseling', 'meal planning', 
                  'nutrition science', 'communication', 'food science'],
        'interests': ['nutrition', 'health', 'food', 'wellness', 'helping people', 'diet', 'fitness'],
        'education': ['B.Sc Nutrition', 'M.Sc Dietetics', 'Nutrition & Dietetics'],
        'salary_range': '₹2.5-12 LPA',
        'job_growth': 'High',
        'courses': ['Nutrition Science', 'Dietetics', 'Clinical Nutrition', 'Sports Nutrition', 
                   'Diet Planning']
    },
    
    'Occupational Therapist': {
        'skills': ['occupational therapy', 'rehabilitation', 'patient care', 'assessment', 
                  'treatment planning', 'adaptive equipment', 'communication'],
        'interests': ['healthcare', 'rehabilitation', 'helping people', 'therapy', 'patient care', 
                     'recovery', 'independence'],
        'education': ['BOT', 'MOT', 'Occupational Therapy'],
        'salary_range': '₹2.5-10 LPA',
        'job_growth': 'High',
        'courses': ['Occupational Therapy', 'Rehabilitation', 'Pediatric OT', 'Geriatric OT']
    },
    
    'Medical Representative': {
        'skills': ['sales', 'communication', 'product knowledge', 'relationship building', 'presentation', 
                  'medical terminology', 'negotiation', 'territory management'],
        'interests': ['healthcare', 'sales', 'communication', 'medicine', 'business', 'relationships', 
                     'people'],
        'education': ['B.Pharm', 'Life Sciences', 'Any Graduate with Science Background'],
        'salary_range': '₹2.5-12 LPA',
        'job_growth': 'Medium',
        'courses': ['Pharmaceutical Sales', 'Medical Terminology', 'Communication Skills', 'Product Knowledge']
    },
    
    'Hospital Administrator': {
        'skills': ['healthcare management', 'administration', 'planning', 'budgeting', 'leadership', 
                  'operations', 'compliance', 'communication', 'coordination'],
        'interests': ['healthcare', 'management', 'administration', 'organization', 'leadership', 
                     'operations', 'healthcare systems'],
        'education': ['MBA Hospital Management', 'MHA', 'Any Graduate with Healthcare Management'],
        'salary_range': '₹5-20 LPA',
        'job_growth': 'High',
        'courses': ['Hospital Administration', 'Healthcare Management', 'Operations Management', 
                   'Healthcare Quality']
    },
    
    'Veterinarian': {
        'skills': ['veterinary medicine', 'animal care', 'diagnosis', 'treatment', 'surgery', 
                  'compassion', 'medical knowledge', 'communication'],
        'interests': ['animals', 'veterinary', 'healthcare', 'animal welfare', 'medicine', 'compassion', 
                     'nature'],
        'education': ['BVSc', 'MVSc', 'Veterinary Medicine'],
        'salary_range': '₹3-18 LPA',
        'job_growth': 'Medium',
        'courses': ['Veterinary Medicine', 'Animal Surgery', 'Veterinary Pathology', 'Animal Care']
    },
    
    'Speech Therapist': {
        'skills': ['speech therapy', 'communication disorders', 'assessment', 'treatment', 'patience', 
                  'rehabilitation', 'counseling', 'communication'],
        'interests': ['healthcare', 'therapy', 'helping people', 'communication', 'speech', 
                     'rehabilitation', 'children'],
        'education': ['BASLP', 'MASLP', 'Speech & Language Pathology'],
        'salary_range': '₹2.5-10 LPA',
        'job_growth': 'High',
        'courses': ['Speech Therapy', 'Audiology', 'Communication Disorders', 'Rehabilitation']
    },
    
    'Biomedical Engineer': {
        'skills': ['biomedical engineering', 'medical devices', 'equipment maintenance', 'electronics', 
                  'programming', 'problem solving', 'healthcare technology'],
        'interests': ['healthcare', 'engineering', 'technology', 'medical devices', 'innovation', 
                     'problem solving', 'biology'],
        'education': ['B.Tech Biomedical', 'M.Tech Biomedical', 'Engineering'],
        'salary_range': '₹3.5-16 LPA',
        'job_growth': 'High',
        'courses': ['Biomedical Engineering', 'Medical Devices', 'Healthcare Technology', 
                   'Biomechanics', 'Medical Imaging']
    },

    # ========== EDUCATION (10 careers) ==========
    'Teacher': {
        'skills': ['teaching', 'communication', 'patience', 'subject knowledge', 'classroom management', 
                  'lesson planning', 'assessment', 'motivation', 'creativity'],
        'interests': ['education', 'teaching', 'children', 'knowledge sharing', 'learning', 'mentoring', 
                     'development'],
        'education': ['B.Ed', 'M.Ed', 'Subject Graduation', 'Teaching Diploma', 'D.El.Ed'],
        'salary_range': '₹2.5-10 LPA',
        'job_growth': 'Medium',
        'courses': ['B.Ed', 'Teaching Methods', 'Child Psychology', 'Classroom Management', 
                   'Educational Technology']
    },
    
    'Corporate Trainer': {
        'skills': ['training', 'communication', 'presentation', 'public speaking', 'curriculum design', 
                  'assessment', 'coaching', 'facilitation', 'subject expertise'],
        'interests': ['training', 'teaching', 'communication', 'development', 'people', 'learning', 
                     'corporate', 'presentation'],
        'education': ['Any Graduate', 'MBA', 'Subject Expertise', 'Training Certification'],
        'salary_range': '₹3.5-15 LPA',
        'job_growth': 'High',
        'courses': ['Train the Trainer', 'Public Speaking', 'Instructional Design', 'Communication Skills', 
                   'Adult Learning']
    },
    
    'Principal/School Administrator': {
        'skills': ['educational leadership', 'administration', 'management', 'planning', 'budgeting', 
                  'communication', 'decision making', 'curriculum development'],
        'interests': ['education', 'leadership', 'management', 'administration', 'development', 
                     'organization', 'students'],
        'education': ['M.Ed', 'Educational Leadership', 'B.Ed with Experience'],
        'salary_range': '₹5-20 LPA',
        'job_growth': 'Medium',
        'courses': ['Educational Leadership', 'School Administration', 'Management', 'Curriculum Development']
    },
    
    'Education Counselor': {
        'skills': ['counseling', 'communication', 'guidance', 'assessment', 'career planning', 
                  'empathy', 'knowledge of education system', 'listening'],
        'interests': ['education', 'counseling', 'helping students', 'guidance', 'careers', 'development', 
                     'mentoring'],
        'education': ['M.Ed', 'Counseling', 'Psychology', 'Any Graduate with Counseling Certification'],
        'salary_range': '₹2.5-10 LPA',
        'job_growth': 'High',
        'courses': ['Career Counseling', 'Educational Psychology', 'Guidance', 'Student Development']
    },
    
    'E-Learning Developer': {
        'skills': ['instructional design', 'e-learning', 'lms', 'content development', 'multimedia', 
                  'articulate', 'captivate', 'video editing', 'creativity'],
        'interests': ['education', 'technology', 'e-learning', 'content creation', 'design', 'teaching', 
                     'innovation'],
        'education': ['Any Graduate', 'Education', 'Instructional Design', 'Multimedia'],
        'salary_range': '₹3-12 LPA',
        'job_growth': 'Very High',
        'courses': ['Instructional Design', 'E-Learning Development', 'Articulate Storyline', 
                   'LMS Administration', 'Multimedia']
    },
    
    'Librarian': {
        'skills': ['library management', 'cataloging', 'organization', 'information retrieval', 
                  'communication', 'research', 'digital libraries', 'customer service'],
        'interests': ['books', 'knowledge', 'organization', 'research', 'reading', 'information', 
                     'helping people', 'libraries'],
        'education': ['B.Lib.Sc', 'M.Lib.Sc', 'Library Science', 'Any Graduate with Library Science'],
        'salary_range': '₹2.5-8 LPA',
        'job_growth': 'Low',
        'courses': ['Library Science', 'Information Management', 'Digital Libraries', 'Cataloging', 
                   'Archives Management']
    },
    
    'Special Education Teacher': {
        'skills': ['special education', 'patience', 'empathy', 'teaching', 'individualized instruction', 
                  'communication', 'assessment', 'behavior management'],
        'interests': ['special education', 'children', 'helping others', 'teaching', 'compassion', 
                     'development', 'inclusion'],
        'education': ['B.Ed Special Education', 'M.Ed Special Education', 'Special Education Diploma'],
        'salary_range': '₹3-12 LPA',
        'job_growth': 'High',
        'courses': ['Special Education', 'Inclusive Education', 'Learning Disabilities', 
                   'Behavioral Management', 'IEP Development']
    },
    
    'Curriculum Designer': {
        'skills': ['curriculum development', 'instructional design', 'educational planning', 'assessment', 
                  'research', 'communication', 'creativity', 'subject knowledge'],
        'interests': ['education', 'curriculum', 'design', 'teaching', 'planning', 'innovation', 
                     'development'],
        'education': ['M.Ed', 'B.Ed', 'Subject Specialization', 'Instructional Design'],
        'salary_range': '₹3.5-14 LPA',
        'job_growth': 'Medium',
        'courses': ['Curriculum Development', 'Instructional Design', 'Assessment Design', 
                   'Educational Planning']
    },
    
    'Academic Researcher': {
        'skills': ['research', 'analysis', 'writing', 'critical thinking', 'subject expertise', 
                  'publication', 'data analysis', 'presentation'],
        'interests': ['research', 'academia', 'knowledge', 'analysis', 'discovery', 'teaching', 
                     'scholarship', 'subject mastery'],
        'education': ['PhD', 'M.Phil', 'Master\'s in Subject', 'Research Background'],
        'salary_range': '₹4-20 LPA',
        'job_growth': 'Medium',
        'courses': ['Research Methodology', 'Statistical Analysis', 'Academic Writing', 'Subject Specialization']
    },
    
    'Tutor/Private Teacher': {
        'skills': ['teaching', 'subject knowledge', 'communication', 'patience', 'explanation', 
                  'assessment', 'customization', 'motivation'],
        'interests': ['teaching', 'education', 'helping students', 'knowledge sharing', 'subjects', 
                     'mentoring', 'one-on-one'],
        'education': ['Subject Graduation', 'B.Ed', 'Any Graduate with Subject Expertise'],
        'salary_range': '₹2-12 LPA',
        'job_growth': 'High',
        'courses': ['Subject Mastery', 'Teaching Techniques', 'Student Psychology', 'Test Preparation']
    },

    # ========== ENGINEERING (Non-IT) (10 careers) ==========
    'Mechanical Engineer': {
        'skills': ['mechanical engineering', 'autocad', 'solidworks', 'manufacturing', 'design', 
                  'thermodynamics', 'mechanics', 'cad', 'problem solving', 'analysis'],
        'interests': ['engineering', 'machines', 'design', 'manufacturing', 'technology', 'mechanics', 
                     'innovation', 'automobiles'],
        'education': ['B.Tech Mechanical', 'B.E Mechanical', 'M.Tech', 'Diploma Mechanical'],
        'salary_range': '₹3-15 LPA',
        'job_growth': 'Medium',
        'courses': ['Mechanical Engineering', 'CAD', 'Manufacturing', 'Thermodynamics', 'Machine Design', 
                   'SolidWorks']
    },
    
    'Civil Engineer': {
        'skills': ['civil engineering', 'autocad', 'structural design', 'construction', 'surveying', 
                  'project management', 'estimation', 'planning', 'site management'],
        'interests': ['engineering', 'construction', 'infrastructure', 'design', 'buildings', 'planning', 
                     'architecture'],
        'education': ['B.Tech Civil', 'B.E Civil', 'M.Tech', 'Diploma Civil'],
        'salary_range': '₹3-12 LPA',
        'job_growth': 'Medium',
        'courses': ['Civil Engineering', 'AutoCAD', 'Structural Design', 'Project Management', 
                   'Estimation', 'Construction Management']
    },
    
    'Electrical Engineer': {
        'skills': ['electrical engineering', 'circuits', 'power systems', 'electronics', 'control systems', 
                  'plc', 'matlab', 'design', 'troubleshooting'],
        'interests': ['engineering', 'electronics', 'power', 'technology', 'circuits', 'automation', 
                     'electricity'],
        'education': ['B.Tech Electrical', 'B.E Electrical', 'M.Tech', 'Diploma Electrical'],
        'salary_range': '₹3.5-14 LPA',
        'job_growth': 'Medium',
        'courses': ['Electrical Engineering', 'Power Systems', 'Control Systems', 'PLC Programming', 
                   'MATLAB', 'Electrical Design']
    },
    
    'Electronics Engineer': {
        'skills': ['electronics', 'circuits', 'embedded systems', 'microcontrollers', 'pcb design', 
                  'programming', 'troubleshooting', 'testing'],
        'interests': ['electronics', 'technology', 'circuits', 'gadgets', 'innovation', 'design', 
                     'engineering'],
        'education': ['B.Tech ECE', 'B.E ECE', 'M.Tech', 'Diploma Electronics'],
        'salary_range': '₹3-14 LPA',
        'job_growth': 'Medium',
        'courses': ['Electronics Engineering', 'Embedded Systems', 'Microcontrollers', 'PCB Design', 
                   'VLSI Design']
    },
    
    'Chemical Engineer': {
        'skills': ['chemical engineering', 'process engineering', 'chemistry', 'plant operations', 
                  'safety', 'quality control', 'analysis', 'manufacturing'],
        'interests': ['chemistry', 'engineering', 'processes', 'manufacturing', 'innovation', 'science', 
                     'industry'],
        'education': ['B.Tech Chemical', 'B.E Chemical', 'M.Tech', 'Chemistry'],
        'salary_range': '₹3.5-16 LPA',
        'job_growth': 'Medium',
        'courses': ['Chemical Engineering', 'Process Engineering', 'Plant Operations', 'Safety Management', 
                   'Quality Control']
    },
    
    'Automotive Engineer': {
        'skills': ['automotive engineering', 'vehicle design', 'cad', 'manufacturing', 'testing', 
                  'problem solving', 'mechanics', 'electronics'],
        'interests': ['automobiles', 'cars', 'engineering', 'design', 'technology', 'innovation', 
                     'vehicles', 'mechanics'],
        'education': ['B.Tech Automobile', 'B.Tech Mechanical', 'M.Tech Automotive'],
        'salary_range': '₹3.5-18 LPA',
        'job_growth': 'High',
        'courses': ['Automotive Engineering', 'Vehicle Design', 'Automobile Technology', 'CAD', 
                   'Manufacturing']
    },
    
    'Aerospace Engineer': {
        'skills': ['aerospace engineering', 'aerodynamics', 'design', 'cad', 'analysis', 'simulation', 
                  'mathematics', 'problem solving'],
        'interests': ['aerospace', 'aviation', 'engineering', 'flight', 'space', 'technology', 
                     'innovation', 'aircraft'],
        'education': ['B.Tech Aerospace', 'M.Tech Aerospace', 'Engineering'],
        'salary_range': '₹4-20 LPA',
        'job_growth': 'Medium',
        'courses': ['Aerospace Engineering', 'Aerodynamics', 'Aircraft Design', 'Flight Mechanics', 
                   'Propulsion']
    },
    
    'Petroleum Engineer': {
        'skills': ['petroleum engineering', 'drilling', 'reservoir engineering', 'production', 
                  'geology', 'analysis', 'project management'],
        'interests': ['petroleum', 'oil', 'gas', 'engineering', 'energy', 'geology', 'exploration', 
                     'resources'],
        'education': ['B.Tech Petroleum', 'M.Tech Petroleum', 'Chemical Engineering'],
        'salary_range': '₹5-25 LPA',
        'job_growth': 'Medium',
        'courses': ['Petroleum Engineering', 'Drilling Engineering', 'Reservoir Engineering', 
                   'Production Engineering', 'Geology']
    },
    
    'Mining Engineer': {
        'skills': ['mining engineering', 'geology', 'surveying', 'blasting', 'mineral processing', 
                  'safety', 'planning', 'equipment'],
        'interests': ['mining', 'geology', 'minerals', 'engineering', 'exploration', 'resources', 
                     'earth sciences'],
        'education': ['B.Tech Mining', 'M.Tech Mining', 'Geology'],
        'salary_range': '₹4-18 LPA',
        'job_growth': 'Medium',
        'courses': ['Mining Engineering', 'Geology', 'Mineral Processing', 'Mine Planning', 
                   'Mine Safety']
    },
    
    'Environmental Engineer': {
        'skills': ['environmental engineering', 'pollution control', 'water treatment', 'waste management', 
                  'sustainability', 'analysis', 'regulations', 'project management'],
        'interests': ['environment', 'sustainability', 'pollution control', 'engineering', 'nature', 
                     'conservation', 'green technology'],
        'education': ['B.Tech Environmental', 'Civil Engineering', 'M.Tech Environmental'],
        'salary_range': '₹3-14 LPA',
        'job_growth': 'High',
        'courses': ['Environmental Engineering', 'Pollution Control', 'Water Treatment', 
                   'Waste Management', 'Sustainability']
    },

    # ========== MEDIA & ENTERTAINMENT (10 careers) ==========
    'Journalist': {
        'skills': ['writing', 'reporting', 'communication', 'research', 'interviewing', 'investigation', 
                  'editing', 'news', 'storytelling', 'ethics'],
        'interests': ['journalism', 'writing', 'news', 'current affairs', 'communication', 'investigation', 
                     'truth', 'storytelling'],
        'education': ['Journalism', 'Mass Communication', 'BA English', 'Any Graduate'],
        'salary_range': '₹2.5-12 LPA',
        'job_growth': 'Medium',
        'courses': ['Journalism', 'News Writing', 'Reporting', 'Media Ethics', 'Digital Journalism', 
                   'Investigative Journalism']
    },
    
    'Photographer': {
        'skills': ['photography', 'camera', 'lighting', 'composition', 'editing', 'photoshop', 
                  'lightroom', 'creativity', 'visual storytelling'],
        'interests': ['photography', 'art', 'creativity', 'visual', 'storytelling', 'aesthetics', 
                     'moments', 'images'],
        'education': ['Any Graduate', 'Photography Diploma', 'Fine Arts', 'Self-taught'],
        'salary_range': '₹2-15 LPA',
        'job_growth': 'Medium',
        'courses': ['Photography', 'Lighting', 'Photo Editing', 'Photoshop', 'Portrait Photography', 
                   'Commercial Photography']
    },
    
    'Film Director': {
        'skills': ['filmmaking', 'direction', 'storytelling', 'cinematography', 'editing', 'screenplay', 
                  'vision', 'leadership', 'creativity', 'collaboration'],
        'interests': ['films', 'storytelling', 'creativity', 'directing', 'cinema', 'art', 'entertainment', 
                     'visual storytelling'],
        'education': ['Film School', 'Mass Communication', 'Direction', 'Self-taught'],
        'salary_range': '₹3-50 LPA',
        'job_growth': 'Medium',
        'courses': ['Filmmaking', 'Direction', 'Screenplay Writing', 'Cinematography', 'Film Editing', 
                   'Film Theory']
    },
    
    'Actor': {
        'skills': ['acting', 'performance', 'expression', 'improvisation', 'dialogue delivery', 
                  'body language', 'emotional range', 'dedication'],
        'interests': ['acting', 'performance', 'entertainment', 'creativity', 'cinema', 'theater', 
                     'expression', 'art'],
        'education': ['Drama School', 'Theater', 'Acting Workshop', 'Any Background'],
        'salary_range': '₹2-100 LPA',
        'job_growth': 'Variable',
        'courses': ['Acting', 'Theater', 'Method Acting', 'Voice Training', 'Movement', 'Improvisation']
    },
    
    'Sound Engineer': {
        'skills': ['audio engineering', 'sound mixing', 'recording', 'editing', 'acoustics', 
                  'pro tools', 'logic pro', 'equipment', 'technical'],
        'interests': ['sound', 'audio', 'music', 'technology', 'recording', 'engineering', 'production'],
        'education': ['Audio Engineering', 'Sound Design', 'Music Production', 'Any Graduate'],
        'salary_range': '₹2.5-12 LPA',
        'job_growth': 'Medium',
        'courses': ['Audio Engineering', 'Sound Design', 'Mixing & Mastering', 'Pro Tools', 
                   'Music Production']
    },
    
    'Radio Jockey': {
        'skills': ['communication', 'voice', 'presentation', 'entertainment', 'speaking', 'hosting', 
                  'improvisation', 'music knowledge', 'audience engagement'],
        'interests': ['radio', 'entertainment', 'communication', 'voice', 'music', 'hosting', 
                     'speaking', 'audience'],
        'education': ['Mass Communication', 'Journalism', 'Any Graduate', 'Voice Training'],
        'salary_range': '₹2-10 LPA',
        'job_growth': 'Low',
        'courses': ['Radio Jockeying', 'Voice Modulation', 'Communication Skills', 'Mass Communication']
    },
    
    'Cinematographer': {
        'skills': ['cinematography', 'camera operation', 'lighting', 'composition', 'visual storytelling', 
                  'technical knowledge', 'creativity', 'collaboration'],
        'interests': ['cinematography', 'visual storytelling', 'films', 'camera', 'lighting', 'art', 
                     'creativity'],
        'education': ['Film School', 'Cinematography', 'Photography', 'Self-taught'],
        'salary_range': '₹3-25 LPA',
        'job_growth': 'Medium',
        'courses': ['Cinematography', 'Camera Operation', 'Lighting for Film', 'Visual Storytelling', 
                   'Film Production']
    },
    
    'Screenwriter': {
        'skills': ['writing', 'storytelling', 'screenplay', 'dialogue', 'creativity', 'structure', 
                  'character development', 'research', 'imagination'],
        'interests': ['writing', 'storytelling', 'films', 'creativity', 'narratives', 'characters', 
                     'cinema', 'drama'],
        'education': ['Film School', 'Creative Writing', 'English Literature', 'Any Graduate'],
        'salary_range': '₹2-20 LPA',
        'job_growth': 'Medium',
        'courses': ['Screenplay Writing', 'Story Structure', 'Dialogue Writing', 'Character Development', 
                   'Film Writing']
    },
    
    'VFX Artist': {
        'skills': ['visual effects', 'after effects', 'nuke', '3d modeling', 'compositing', 'animation', 
                  'creativity', 'technical skills'],
        'interests': ['visual effects', 'films', 'creativity', 'technology', 'graphics', 'animation', 
                     'art', 'cinema'],
        'education': ['VFX', 'Animation', 'Multimedia', 'Fine Arts', 'Any Graduate'],
        'salary_range': '₹3-18 LPA',
        'job_growth': 'High',
        'courses': ['VFX', 'After Effects', 'Nuke', 'Compositing', '3D Modeling', 'Visual Effects']
    },
    
    'Voiceover Artist': {
        'skills': ['voice', 'voice modulation', 'expression', 'acting', 'pronunciation', 'recording', 
                  'versatility', 'character voices'],
        'interests': ['voice acting', 'entertainment', 'expression', 'characters', 'recording', 
                     'performance', 'audio'],
        'education': ['Any Graduate', 'Voice Training', 'Theater', 'Acting'],
        'salary_range': '₹2-15 LPA',
        'job_growth': 'Medium',
        'courses': ['Voice Acting', 'Voice Modulation', 'Dubbing', 'Character Voices', 'Voice Training']
    },

    # ========== LEGAL (8 careers) ==========
    'Lawyer': {
        'skills': ['law', 'legal research', 'argumentation', 'communication', 'analysis', 'writing', 
                  'negotiation', 'court procedure', 'legal drafting'],
        'interests': ['law', 'justice', 'argumentation', 'debate', 'helping people', 'legal system', 
                     'advocacy', 'research'],
        'education': ['LLB', 'LLM', 'BA LLB', 'BBA LLB', 'Law School'],
        'salary_range': '₹3-50 LPA',
        'job_growth': 'High',
        'courses': ['Law', 'Legal Research', 'Constitutional Law', 'Criminal Law', 'Civil Law', 
                   'Corporate Law']
    },
    
    'Corporate Lawyer': {
        'skills': ['corporate law', 'contracts', 'mergers', 'acquisitions', 'compliance', 'negotiation', 
                  'legal drafting', 'business law'],
        'interests': ['law', 'business', 'corporate', 'contracts', 'compliance', 'legal advisory', 
                     'corporate world'],
        'education': ['LLB', 'LLM Corporate Law', 'BA LLB', 'BBA LLB'],
        'salary_range': '₹6-40 LPA',
        'job_growth': 'High',
        'courses': ['Corporate Law', 'Contract Law', 'M&A', 'Company Law', 'Securities Law', 
                   'Business Law']
    },
    
    'Legal Advisor': {
        'skills': ['legal advice', 'consulting', 'compliance', 'contracts', 'risk assessment', 
                  'legal research', 'communication', 'analysis'],
        'interests': ['law', 'advisory', 'consultation', 'compliance', 'business', 'legal matters', 
                     'problem solving'],
        'education': ['LLB', 'LLM', 'Law Degree'],
        'salary_range': '₹4-25 LPA',
        'job_growth': 'High',
        'courses': ['Legal Advisory', 'Contract Law', 'Compliance', 'Corporate Law', 'Risk Management']
    },
    
    'Patent Attorney': {
        'skills': ['patent law', 'intellectual property', 'legal research', 'technical knowledge', 
                  'patent drafting', 'prosecution', 'analysis'],
        'interests': ['patents', 'intellectual property', 'innovation', 'technology', 'law', 'research', 
                     'legal protection'],
        'education': ['LLB with Science/Tech Background', 'Patent Agent Exam', 'LLM IP'],
        'salary_range': '₹5-30 LPA',
        'job_growth': 'High',
        'courses': ['Patent Law', 'Intellectual Property', 'Patent Drafting', 'IP Litigation', 
                   'Trademark Law']
    },
    
    'Legal Researcher': {
        'skills': ['legal research', 'analysis', 'writing', 'attention to detail', 'databases', 
                  'case law', 'documentation', 'critical thinking'],
        'interests': ['research', 'law', 'analysis', 'writing', 'legal matters', 'case studies', 
                     'investigation'],
        'education': ['LLB', 'LLM', 'Law Degree'],
        'salary_range': '₹3-12 LPA',
        'job_growth': 'Medium',
        'courses': ['Legal Research', 'Legal Writing', 'Case Law Analysis', 'Research Methodology']
    },
    
    'Judge': {
        'skills': ['law', 'judgment', 'analysis', 'impartiality', 'legal knowledge', 'decision making', 
                  'ethics', 'communication'],
        'interests': ['law', 'justice', 'fairness', 'legal system', 'judgment', 'public service', 
                     'decision making'],
        'education': ['LLB', 'LLM', 'Law Practice Experience', 'Judicial Service Exam'],
        'salary_range': '₹8-30 LPA',
        'job_growth': 'Low',
        'courses': ['Law', 'Constitutional Law', 'Criminal Law', 'Civil Law', 'Judicial Services']
    },
    
    'Notary Public': {
        'skills': ['legal documentation', 'notarization', 'verification', 'authentication', 'legal knowledge', 
                  'attention to detail', 'ethics'],
        'interests': ['law', 'documentation', 'legal services', 'verification', 'public service', 
                     'legal formalities'],
        'education': ['Law Degree', 'Notary Certification', 'Legal Background'],
        'salary_range': '₹2-10 LPA',
        'job_growth': 'Low',
        'courses': ['Notary Public Training', 'Legal Documentation', 'Authentication Procedures']
    },
    
    'Paralegal': {
        'skills': ['legal research', 'documentation', 'case management', 'drafting', 'organization', 
                  'legal procedures', 'communication', 'support'],
        'interests': ['law', 'legal support', 'organization', 'research', 'documentation', 'legal system', 
                     'assistance'],
        'education': ['Law Degree', 'Paralegal Certification', 'Legal Studies'],
        'salary_range': '₹2.5-10 LPA',
        'job_growth': 'Medium',
        'courses': ['Paralegal Studies', 'Legal Research', 'Legal Documentation', 'Case Management']
    },

    # ========== HOSPITALITY & TOURISM (8 careers) ==========
    'Hotel Manager': {
        'skills': ['hotel management', 'hospitality', 'customer service', 'operations', 'leadership', 
                  'budgeting', 'communication', 'problem solving', 'coordination'],
        'interests': ['hospitality', 'management', 'customer service', 'hotels', 'people', 'operations', 
                     'service excellence'],
        'education': ['BHM', 'Hotel Management', 'Hospitality Management', 'MBA Hospitality'],
        'salary_range': '₹3-18 LPA',
        'job_growth': 'Medium',
        'courses': ['Hotel Management', 'Hospitality Operations', 'Customer Service', 'Hotel Operations', 
                   'Food & Beverage']
    },
    
    'Chef/Culinary Expert': {
        'skills': ['cooking', 'culinary arts', 'menu planning', 'food preparation', 'creativity', 
                  'kitchen management', 'food safety', 'presentation'],
        'interests': ['cooking', 'food', 'culinary arts', 'creativity', 'gastronomy', 'flavors', 
                     'cuisine', 'presentation'],
        'education': ['Culinary Arts', 'Hotel Management', 'Diploma in Cooking', 'Chef Training'],
        'salary_range': '₹2.5-20 LPA',
        'job_growth': 'High',
        'courses': ['Culinary Arts', 'Food Production', 'Bakery & Confectionery', 'International Cuisine', 
                   'Kitchen Management']
    },
    
    'Travel Agent': {
        'skills': ['travel planning', 'customer service', 'communication', 'sales', 'booking', 
                  'destination knowledge', 'itinerary planning', 'negotiation'],
        'interests': ['travel', 'tourism', 'destinations', 'customer service', 'planning', 'exploration', 
                     'cultures', 'geography'],
        'education': ['Tourism', 'Travel & Tourism', 'Hotel Management', 'Any Graduate'],
        'salary_range': '₹2-10 LPA',
        'job_growth': 'Medium',
        'courses': ['Travel & Tourism', 'Tour Planning', 'Destination Management', 'Customer Service', 
                   'Travel Operations']
    },
    
    'Tour Guide': {
        'skills': ['guiding', 'communication', 'public speaking', 'destination knowledge', 'storytelling', 
                  'customer service', 'languages', 'presentation'],
        'interests': ['tourism', 'travel', 'history', 'culture', 'people', 'destinations', 'storytelling', 
                     'guiding'],
        'education': ['Tourism', 'History', 'Any Graduate', 'Tour Guide Certification'],
        'salary_range': '₹2-8 LPA',
        'job_growth': 'Medium',
        'courses': ['Tour Guiding', 'Destination Knowledge', 'Communication Skills', 'Heritage Tourism', 
                   'Foreign Languages']
    },
    
    'Event Manager': {
        'skills': ['event planning', 'coordination', 'project management', 'budgeting', 'communication', 
                  'negotiation', 'creativity', 'vendor management', 'multitasking'],
        'interests': ['events', 'planning', 'coordination', 'creativity', 'organization', 'people', 
                     'execution', 'celebrations'],
        'education': ['Event Management', 'Hotel Management', 'Mass Communication', 'Any Graduate'],
        'salary_range': '₹2.5-15 LPA',
        'job_growth': 'High',
        'courses': ['Event Management', 'Event Planning', 'Project Management', 'Vendor Management', 
                   'Event Marketing']
    },
    
    'Flight Attendant': {
        'skills': ['customer service', 'communication', 'safety procedures', 'first aid', 'grooming', 
                  'presentation', 'problem solving', 'languages'],
        'interests': ['aviation', 'travel', 'customer service', 'people', 'flying', 'hospitality', 
                     'cultures', 'service'],
        'education': ['12th Pass', 'Hospitality', 'Cabin Crew Training', 'Any Graduate'],
        'salary_range': '₹3-10 LPA',
        'job_growth': 'Medium',
        'courses': ['Cabin Crew Training', 'Aviation Hospitality', 'Safety Procedures', 'First Aid', 
                   'Customer Service']
    },
    
    'Sommelier': {
        'skills': ['wine knowledge', 'tasting', 'pairing', 'customer service', 'communication', 
                  'beverage management', 'sensory analysis'],
        'interests': ['wine', 'beverages', 'food pairing', 'hospitality', 'gastronomy', 'tasting', 
                     'service excellence'],
        'education': ['Hotel Management', 'Sommelier Certification', 'Hospitality', 'Any Graduate'],
        'salary_range': '₹3-15 LPA',
        'job_growth': 'Medium',
        'courses': ['Sommelier Certification', 'Wine Knowledge', 'Food & Wine Pairing', 'Beverage Management']
    },
    
    'Cruise Ship Staff': {
        'skills': ['hospitality', 'customer service', 'communication', 'adaptability', 'teamwork', 
                  'entertainment', 'safety', 'multitasking'],
        'interests': ['travel', 'hospitality', 'sea', 'cruises', 'customer service', 'adventure', 
                     'entertainment', 'cultures'],
        'education': ['Hotel Management', 'Hospitality', 'Any Graduate', 'Specialized Training'],
        'salary_range': '₹3-12 LPA',
        'job_growth': 'Medium',
        'courses': ['Cruise Operations', 'Hospitality Management', 'Customer Service', 'Safety Training']
    },

    # ========== AGRICULTURE & ENVIRONMENT (6 careers) ==========
    'Agricultural Scientist': {
        'skills': ['agriculture', 'research', 'soil science', 'crop management', 'analysis', 
                  'experimentation', 'data collection', 'biotechnology'],
        'interests': ['agriculture', 'farming', 'research', 'science', 'crops', 'sustainability', 
                     'innovation', 'nature'],
        'education': ['B.Sc Agriculture', 'M.Sc Agriculture', 'Agricultural Engineering', 'PhD'],
        'salary_range': '₹3-15 LPA',
        'job_growth': 'Medium',
        'courses': ['Agricultural Science', 'Crop Science', 'Soil Science', 'Plant Breeding', 
                   'Agricultural Research']
    },
    
    'Horticulturist': {
        'skills': ['horticulture', 'plant science', 'gardening', 'landscaping', 'soil management', 
                  'pest control', 'cultivation', 'plant breeding'],
        'interests': ['plants', 'gardening', 'horticulture', 'nature', 'cultivation', 'landscaping', 
                     'flowers', 'vegetables'],
        'education': ['B.Sc Horticulture', 'M.Sc Horticulture', 'Agriculture'],
        'salary_range': '₹2.5-10 LPA',
        'job_growth': 'Medium',
        'courses': ['Horticulture', 'Plant Science', 'Landscaping', 'Gardening', 'Plant Breeding']
    },
    
    'Forestry Officer': {
        'skills': ['forestry', 'forest management', 'conservation', 'wildlife', 'ecology', 
                  'surveying', 'administration', 'environmental protection'],
        'interests': ['forests', 'nature', 'conservation', 'wildlife', 'environment', 'trees', 
                     'ecology', 'protection'],
        'education': ['B.Sc Forestry', 'M.Sc Forestry', 'Environmental Science', 'Forest Service Exam'],
        'salary_range': '₹4-15 LPA',
        'job_growth': 'Medium',
        'courses': ['Forestry', 'Forest Management', 'Wildlife Conservation', 'Ecology', 
                   'Environmental Science']
    },
    
    'Environmental Consultant': {
        'skills': ['environmental assessment', 'sustainability', 'compliance', 'analysis', 'reporting', 
                  'regulations', 'project management', 'consulting'],
        'interests': ['environment', 'sustainability', 'conservation', 'consulting', 'ecology', 
                     'green practices', 'compliance'],
        'education': ['Environmental Science', 'Engineering', 'Environmental Management', 'M.Sc'],
        'salary_range': '₹3.5-16 LPA',
        'job_growth': 'High',
        'courses': ['Environmental Consulting', 'Environmental Impact Assessment', 'Sustainability', 
                   'Environmental Regulations']
    },
    
    'Wildlife Biologist': {
        'skills': ['wildlife biology', 'research', 'field work', 'data analysis', 'conservation', 
                  'ecology', 'observation', 'documentation'],
        'interests': ['wildlife', 'animals', 'nature', 'conservation', 'research', 'biology', 
                     'ecology', 'outdoors'],
        'education': ['B.Sc Zoology', 'M.Sc Wildlife Biology', 'Environmental Science', 'PhD'],
        'salary_range': '₹3-12 LPA',
        'job_growth': 'Medium',
        'courses': ['Wildlife Biology', 'Conservation Biology', 'Ecology', 'Field Research', 
                   'Animal Behavior']
    },
    
    'Organic Farmer': {
        'skills': ['organic farming', 'agriculture', 'crop management', 'soil health', 'sustainability', 
                  'pest management', 'composting', 'business'],
        'interests': ['farming', 'agriculture', 'organic', 'sustainability', 'nature', 'healthy food', 
                     'environment', 'entrepreneurship'],
        'education': ['B.Sc Agriculture', 'Diploma Agriculture', 'Organic Farming Course', 'Self-taught'],
        'salary_range': '₹2-20 LPA',
        'job_growth': 'High',
        'courses': ['Organic Farming', 'Sustainable Agriculture', 'Soil Management', 'Composting', 
                   'Natural Pest Control']
    },

    # ========== SPORTS & FITNESS (6 careers) ==========
    'Sports Coach': {
        'skills': ['coaching', 'sports knowledge', 'training', 'motivation', 'communication', 
                  'strategy', 'fitness', 'leadership', 'analysis'],
        'interests': ['sports', 'coaching', 'fitness', 'training', 'athletes', 'competition', 
                     'development', 'teamwork'],
        'education': ['B.P.Ed', 'M.P.Ed', 'Sports Science', 'Coaching Certification', 'Any Graduate with Sports'],
        'salary_range': '₹2.5-15 LPA',
        'job_growth': 'High',
        'courses': ['Sports Coaching', 'Physical Education', 'Sports Science', 'Training Methods', 
                   'Sports Psychology']
    },
    
    'Fitness Trainer': {
        'skills': ['fitness training', 'exercise', 'nutrition', 'motivation', 'communication', 
                  'workout planning', 'anatomy', 'physiology'],
        'interests': ['fitness', 'health', 'exercise', 'training', 'wellness', 'helping people', 
                     'physical fitness', 'lifestyle'],
        'education': ['Any Graduate', 'Fitness Certification', 'Physical Education', 'Sports Science'],
        'salary_range': '₹2-10 LPA',
        'job_growth': 'High',
        'courses': ['Fitness Training', 'Personal Training', 'Nutrition', 'Exercise Science', 
                   'Strength Training']
    },
    
    'Yoga Instructor': {
        'skills': ['yoga', 'asanas', 'meditation', 'breathing', 'teaching', 'communication', 
                  'flexibility', 'wellness', 'mindfulness'],
        'interests': ['yoga', 'wellness', 'fitness', 'meditation', 'health', 'spirituality', 
                     'teaching', 'mindfulness'],
        'education': ['Yoga Certification', 'Yoga Teacher Training', 'Any Graduate', 'Yoga Diploma'],
        'salary_range': '₹2-12 LPA',
        'job_growth': 'High',
        'courses': ['Yoga Teacher Training', 'Yoga Philosophy', 'Meditation', 'Pranayama', 
                   'Therapeutic Yoga']
    },
    
    'Sports Nutritionist': {
        'skills': ['nutrition', 'diet planning', 'sports science', 'counseling', 'meal planning', 
                  'supplementation', 'analysis', 'communication'],
        'interests': ['nutrition', 'sports', 'health', 'fitness', 'diet', 'wellness', 'athletes', 
                     'performance'],
        'education': ['B.Sc Nutrition', 'Sports Nutrition', 'Dietetics', 'M.Sc Nutrition'],
        'salary_range': '₹3-14 LPA',
        'job_growth': 'High',
        'courses': ['Sports Nutrition', 'Nutrition Science', 'Diet Planning', 'Sports Supplements', 
                   'Performance Nutrition']
    },
    
    'Physiotherapist for Sports': {
        'skills': ['sports physiotherapy', 'rehabilitation', 'injury treatment', 'assessment', 
                  'manual therapy', 'exercise prescription', 'anatomy'],
        'interests': ['sports', 'physiotherapy', 'rehabilitation', 'injury recovery', 'athletics', 
                     'helping athletes', 'treatment'],
        'education': ['BPT', 'MPT Sports', 'Sports Physiotherapy'],
        'salary_range': '₹3-15 LPA',
        'job_growth': 'High',
        'courses': ['Sports Physiotherapy', 'Sports Injury Management', 'Rehabilitation', 
                   'Manual Therapy', 'Biomechanics']
    },
    
    'Sports Commentator': {
        'skills': ['commentary', 'communication', 'sports knowledge', 'voice', 'analysis', 
                  'presentation', 'quick thinking', 'enthusiasm'],
        'interests': ['sports', 'commentary', 'broadcasting', 'communication', 'analysis', 
                     'entertainment', 'voice', 'sports events'],
        'education': ['Mass Communication', 'Journalism', 'Sports Management', 'Any Graduate with Sports Knowledge'],
        'salary_range': '₹3-20 LPA',
        'job_growth': 'Medium',
        'courses': ['Sports Commentary', 'Broadcasting', 'Communication Skills', 'Sports Journalism', 
                   'Voice Modulation']
    },

    # ========== EMERGING & SPECIALIZED (6 careers) ==========
    'Data Privacy Officer': {
        'skills': ['data privacy', 'gdpr', 'compliance', 'cybersecurity', 'regulations', 'analysis', 
                  'risk assessment', 'documentation', 'communication'],
        'interests': ['privacy', 'data protection', 'compliance', 'cybersecurity', 'regulations', 
                     'legal', 'technology', 'ethics'],
        'education': ['Law', 'Cybersecurity', 'IT', 'Privacy Certification', 'Any Graduate with Specialization'],
        'salary_range': '₹6-25 LPA',
        'job_growth': 'Very High',
        'courses': ['Data Privacy', 'GDPR Compliance', 'Privacy Law', 'Cybersecurity', 
                   'Risk Management']
    },
    
    'Sustainability Manager': {
        'skills': ['sustainability', 'environmental management', 'project management', 'analysis', 
                  'reporting', 'strategy', 'communication', 'green practices'],
        'interests': ['sustainability', 'environment', 'green practices', 'corporate responsibility', 
                     'conservation', 'climate change', 'impact'],
        'education': ['Environmental Science', 'Sustainability', 'MBA Sustainability', 'Any Graduate'],
        'salary_range': '₹5-20 LPA',
        'job_growth': 'Very High',
        'courses': ['Sustainability Management', 'Environmental Strategy', 'Corporate Sustainability', 
                   'Green Business', 'ESG']
    },
    
    'Drone Pilot': {
        'skills': ['drone operation', 'piloting', 'aerial photography', 'regulations', 'technical knowledge', 
                  'navigation', 'maintenance', 'videography'],
        'interests': ['drones', 'aviation', 'technology', 'flying', 'photography', 'aerial views', 
                     'innovation', 'gadgets'],
        'education': ['Drone Pilot License', 'Any Graduate', 'Aviation', 'Technical Background'],
        'salary_range': '₹2.5-12 LPA',
        'job_growth': 'Very High',
        'courses': ['Drone Piloting', 'Aerial Photography', 'Drone Regulations', 'Flight Operations', 
                   'Drone Technology']
    },
    
    'Ethical Hacker': {
        'skills': ['ethical hacking', 'penetration testing', 'cybersecurity', 'networking', 'linux', 
                  'security tools', 'vulnerability assessment', 'coding'],
        'interests': ['hacking', 'cybersecurity', 'technology', 'security', 'problem solving', 
                     'testing', 'protection', 'networks'],
        'education': ['B.Tech', 'Cybersecurity', 'CEH', 'Any Graduate with Security Certification'],
        'salary_range': '₹5-22 LPA',
        'job_growth': 'Very High',
        'courses': ['Ethical Hacking', 'CEH Certification', 'Penetration Testing', 'Security Testing', 
                   'Network Security']
    },
    
    'Robotics Engineer': {
        'skills': ['robotics', 'programming', 'electronics', 'mechanics', 'automation', 'ai', 
                  'sensors', 'design', 'troubleshooting'],
        'interests': ['robotics', 'automation', 'technology', 'engineering', 'innovation', 'ai', 
                     'machines', 'future tech'],
        'education': ['B.Tech Robotics', 'Mechatronics', 'Electrical Engineering', 'M.Tech'],
        'salary_range': '₹4-20 LPA',
        'job_growth': 'Very High',
        'courses': ['Robotics', 'Automation', 'ROS', 'Embedded Systems', 'AI for Robotics', 
                   'Control Systems']
    },
    
    'UX Researcher': {
        'skills': ['user research', 'usability testing', 'interviews', 'surveys', 'analysis', 
                  'empathy', 'communication', 'data analysis', 'design thinking'],
        'interests': ['user experience', 'research', 'psychology', 'design', 'users', 'behavior', 
                     'testing', 'insights'],
        'education': ['Psychology', 'Design', 'HCI', 'Any Graduate with UX Specialization'],
        'salary_range': '₹4-18 LPA',
        'job_growth': 'Very High',
        'courses': ['UX Research', 'User Testing', 'Research Methods', 'Design Thinking', 
                   'User Psychology', 'Data Analysis']
    }
}

# Enhanced Skill Synonyms for better matching
SKILL_SYNONYMS = {
    # NOTE on provenance (see docs/AI_ML.md "Dataset provenance" for the
    # full breakdown): this table is manually curated from general
    # occupational/domain knowledge, not imported from a live external
    # taxonomy (O*NET/ESCO) - this sandbox has no network access to those
    # sources. It is reviewed and extended over time; treat entries as a
    # best-effort human-curated vocabulary, not an authoritative feed.
    'python': ['py', 'python3', 'python programming', 'python developer'],
    'javascript': ['js', 'java script', 'ecmascript', 'es6', 'node'],
    'machine learning': ['ml', 'machinelearning', 'machine-learning', 'predictive modeling'],
    'artificial intelligence': ['ai', 'a.i.', 'artificial-intelligence', 'deep learning'],
    'user interface': ['ui', 'u.i.', 'interface design'],
    'user experience': ['ux', 'u.x.', 'experience design'],
    'devops': ['dev ops', 'dev-ops', 'development operations'],
    'fullstack': ['full stack', 'full-stack', 'full stack developer'],
    'frontend': ['front end', 'front-end', 'client side'],
    'backend': ['back end', 'back-end', 'server side'],
    'database': ['db', 'databases', 'dbms', 'data storage'],
    'sql': ['structured query language', 'mysql', 'postgresql', 'database query'],
    'html': ['html5', 'hypertext', 'markup'],
    'css': ['css3', 'cascading style sheets', 'styling'],
    'react': ['reactjs', 'react.js', 'react framework'],
    'angular': ['angularjs', 'angular.js', 'angular framework'],
    'node': ['nodejs', 'node.js', 'node runtime'],
    'docker': ['containerization', 'containers', 'docker container'],
    'kubernetes': ['k8s', 'k8', 'container orchestration'],
    'aws': ['amazon web services', 'amazon cloud', 'aws cloud'],
    'azure': ['microsoft azure', 'ms azure', 'azure cloud'],
    'gcp': ['google cloud', 'google cloud platform', 'gcp cloud'],
    'cybersecurity': ['cyber security', 'information security', 'infosec', 'security'],
    'data science': ['data analysis', 'analytics', 'data analytics'],
    'digital marketing': ['online marketing', 'internet marketing', 'web marketing'],
    'graphic design': ['graphics', 'visual design', 'design'],
    'video editing': ['video production', 'editing', 'post production'],
    'content writing': ['content creation', 'copywriting', 'writing'],
    'social media': ['sm', 'social networking', 'social platforms'],
    'project management': ['pm', 'project coordination', 'pmp'],
    'business analysis': ['ba', 'business analytics', 'requirements analysis'],
    'sales': ['selling', 'business development', 'revenue generation'],
    'marketing': ['promotion', 'advertising', 'brand management'],
    'accounting': ['finance', 'bookkeeping', 'financial management'],
    'human resources': ['hr', 'people management', 'talent management'],
    'teaching': ['education', 'instruction', 'training'],
    'nursing': ['healthcare', 'patient care', 'medical care'],
    'law': ['legal', 'attorney', 'advocate'],
    'photography': ['photo', 'imaging', 'camera'],
    'cooking': ['culinary', 'chef', 'food preparation'],
    'fitness': ['gym', 'workout', 'exercise', 'physical training'],
    'programming': ['coding', 'development', 'software development'],

    # -- expanded coverage (Pass 10) -----------------------------------
    # Tech: more frameworks/tools that the original table missed entirely.
    'typescript': ['ts', 'typed javascript'],
    'vue': ['vuejs', 'vue.js'],
    'django': ['django framework', 'django rest framework', 'drf'],
    'flask': ['flask framework', 'flask api'],
    'spring boot': ['spring', 'springboot', 'spring framework'],
    '.net': ['dotnet', 'dot net', 'asp.net', 'c sharp'],
    'c#': ['csharp', 'c sharp'],
    'go': ['golang'],
    'rust': ['rust lang', 'rustlang'],
    'swift': ['swiftui', 'ios development'],
    'kotlin': ['kotlin android'],
    'flutter': ['flutter dart', 'cross platform mobile'],
    'react native': ['reactnative', 'react-native'],
    'mongodb': ['mongo', 'nosql database'],
    'redis': ['redis cache', 'in memory database'],
    'graphql': ['graph ql'],
    'terraform': ['iac', 'infrastructure as code'],
    'ci/cd': ['cicd', 'continuous integration', 'continuous deployment', 'continuous delivery'],
    'linux': ['unix', 'linux administration', 'shell scripting', 'bash'],
    'power bi': ['powerbi', 'microsoft power bi'],
    'tableau': ['tableau desktop', 'data viz tool'],
    'excel': ['ms excel', 'microsoft excel', 'spreadsheets', 'pivot tables'],
    'r': ['r programming', 'r language', 'rstudio'],
    'pytorch': ['torch'],
    'tensorflow': ['tf', 'keras'],
    'nlp': ['natural language processing', 'text mining', 'language models'],
    'computer vision': ['cv', 'image processing', 'opencv'],
    'big data': ['spark', 'hadoop', 'distributed computing'],
    'blockchain': ['distributed ledger', 'web3', 'smart contracts'],
    'solidity': ['smart contract development', 'ethereum development'],
    'penetration testing': ['pen testing', 'ethical hacking', 'vapt'],
    'network security': ['firewall management', 'network defense'],
    'salesforce': ['sfdc', 'crm platform'],
    'sap': ['sap erp', 'enterprise resource planning'],
    'jira': ['atlassian jira', 'issue tracking'],
    'figma': ['ui prototyping tool'],
    'adobe xd': ['xd', 'adobe experience design'],

    # Finance/accounting.
    'financial modeling': ['fin modeling', 'valuation modeling', 'excel modeling'],
    'taxation': ['tax planning', 'tax compliance', 'gst', 'income tax'],
    'auditing': ['internal audit', 'statutory audit', 'audit'],
    'investment banking': ['ib', 'equity capital markets', 'm&a'],
    'equity research': ['stock research', 'equity analysis'],
    'risk management': ['risk analysis', 'enterprise risk'],
    'gaap': ['generally accepted accounting principles', 'ind as'],
    'quickbooks': ['book keeping software'],
    'tally': ['tally erp', 'tally prime'],

    # Healthcare.
    'clinical research': ['clinical trials', 'gcp compliance'],
    'patient care': ['bedside manner', 'clinical care'],
    'pharmacology': ['drug therapy', 'medication management'],
    'diagnostic imaging': ['radiology', 'x-ray', 'mri', 'ct scan'],
    'physiotherapy': ['physical therapy', 'rehabilitation therapy'],

    # Legal.
    'contract drafting': ['legal drafting', 'contract review'],
    'litigation': ['court practice', 'trial advocacy'],
    'intellectual property': ['ip law', 'patent law', 'trademark law'],
    'compliance': ['regulatory compliance', 'corporate compliance'],

    # Business/ops.
    'supply chain': ['scm', 'logistics', 'procurement'],
    'six sigma': ['lean six sigma', 'process improvement'],
    'agile': ['scrum', 'kanban', 'agile methodology'],
    'stakeholder management': ['client management', 'relationship management'],
    'negotiation': ['deal making', 'contract negotiation'],
    'crm': ['customer relationship management'],

    # Creative/media.
    'illustrator': ['adobe illustrator', 'vector design'],
    'photoshop': ['adobe photoshop', 'photo editing software'],
    'indesign': ['adobe indesign', 'layout design'],
    'premiere pro': ['adobe premiere', 'premiere', 'video editing software'],
    'after effects': ['ae', 'motion graphics software'],
    'seo': ['search engine optimization', 'organic search'],
    'sem': ['search engine marketing', 'paid search'],
    'copywriting': ['ad copy', 'sales copy'],

    # Education.
    'curriculum design': ['curriculum development', 'instructional design'],
    'e-learning': ['online learning', 'elearning', 'lms'],

    # Engineering (non-software).
    'autocad': ['cad', 'computer aided design'],
    'solidworks': ['3d cad', 'mechanical cad'],
    'catia': ['3d modeling software'],
    'thermodynamics': ['heat transfer', 'thermal engineering'],
    'structural analysis': ['structural design', 'structural engineering'],
}


# Interest synonyms for better career matching
INTEREST_SYNONYMS = {
    'technology': ['tech', 'computers', 'it', 'digital', 'innovation'],
    'business': ['commerce', 'entrepreneurship', 'corporate', 'management'],
    'creativity': ['creative', 'art', 'artistic', 'design', 'imagination'],
    'helping people': ['helping others', 'service', 'care', 'support', 'assistance'],
    'analysis': ['analytical', 'analyzing', 'data analysis', 'research'],
    'communication': ['talking', 'speaking', 'presentation', 'writing'],
    'health': ['healthcare', 'medical', 'wellness', 'fitness'],
    'numbers': ['mathematics', 'calculations', 'quantitative', 'statistics'],
    'design': ['designing', 'visual', 'aesthetics', 'layout'],
    'teaching': ['education', 'training', 'mentoring', 'instruction'],
    'science': ['scientific', 'research', 'experiments', 'discovery'],
    'sports': ['athletics', 'games', 'physical activity', 'competition'],
    'environment': ['nature', 'sustainability', 'green', 'ecology'],
    'food': ['cooking', 'culinary', 'gastronomy', 'cuisine'],
    'travel': ['tourism', 'exploration', 'destinations', 'adventure'],
    'law': ['legal', 'justice', 'regulations', 'compliance'],
    'finance': ['money', 'investment', 'banking', 'financial'],
    'media': ['journalism', 'broadcasting', 'entertainment', 'content']
}

# Per-career skill importance tiers (essential/important/supporting/
# optional), computed once at import time from CAREER_DATABASE itself —
# see app/data/skill_importance.py for exactly how and why. This is a
# documented heuristic derived from the curated data above, not a
# separately-maintained file that can drift out of sync with it.
from app.data.skill_importance import build_skill_tiers  # noqa: E402

CAREER_SKILL_TIERS = build_skill_tiers(CAREER_DATABASE)
