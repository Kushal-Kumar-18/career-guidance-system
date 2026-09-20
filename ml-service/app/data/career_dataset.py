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
        'skills': ['html', 'css', 'javascript', 'responsive design', 'cross-browser compatibility', 
                  'wordpress', 'cms', 'frontend frameworks', 'web design', 'ui implementation', 
                  'browser devtools', 'seo basics', 'git'],
        'interests': ['web', 'design', 'visual layout', 'creativity', 'user experience', 'technology', 
                     'internet', 'coding', 'websites', 'interactive'],
        'education': ['B.Tech', 'BCA', 'MCA', 'B.Sc IT', 'Bootcamp', 'Self-taught'],
        'salary_range': '₹3-12 LPA',
        'job_growth': 'Very High',
        'courses': ['HTML/CSS/JavaScript', 'Responsive Web Design', 'WordPress Development', 'Frontend Frameworks', 'SEO Fundamentals', 'Web Accessibility']
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
        'education': ['B.Design', 'B.Sc IT', 'BCA', 'Diploma in UI/UX Design', 'Self-taught with Strong Portfolio'],
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
        'education': ['BCA', 'B.Sc IT', 'Diploma in IT/Computer Hardware', 'ITIL Certification'],
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
        'education': ['B.Tech', 'BCA', 'B.A English', 'Technical Writing Certification'],
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
        'education': ['MBA', 'B.Tech', 'BBA', 'B.Com', 'Business Analytics Certification (CBAP/CCBA)'],
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
        'education': ['MBA', 'B.Tech', 'BBA', 'Product Management Certification'],
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
        'education': ['MBA', 'B.Tech', 'BBA', 'PMP Certification', 'PRINCE2 Certification'],
        'salary_range': '₹6-22 LPA',
        'job_growth': 'High',
        'courses': ['Project Management', 'PMP Certification', 'Agile Project Management', 
                   'Risk Management', 'Leadership Skills']
    },
    
    'Management Consultant': {
        'skills': ['management consulting', 'process improvement', 'operations analysis', 'organizational design', 
                  'change implementation', 'client management', 'business case development', 'excel', 
                  'powerpoint', 'financial analysis'],
        'interests': ['consulting', 'operations', 'process improvement', 'business', 'advisory', 
                     'implementation', 'organizational change'],
        'education': ['MBA', 'B.Tech', 'BBA', 'Economics', 'Top Tier Business School'],
        'salary_range': '₹10-50 LPA',
        'job_growth': 'High',
        'courses': ['Management Consulting', 'Process Improvement', 'Case Interview Prep', 
                   'Financial Analysis', 'Organizational Design']
    },
    
    'Human Resources Manager': {
        'skills': ['hr management', 'recruitment', 'employee relations', 'communication', 'training', 
                  'performance management', 'compliance', 'leadership', 'payroll', 'hr software'],
        'interests': ['people', 'management', 'communication', 'organizational development', 'leadership', 
                     'culture', 'recruitment', 'development'],
        'education': ['MBA HR', 'BBA', 'PG Diploma in HR', 'M.A Psychology'],
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
        'skills': ['business development', 'sales', 'communication', 'negotiation', 'professional networking', 
                  'strategy', 'market research', 'crm', 'presentation', 'relationship building'],
        'interests': ['business', 'sales', 'growth', 'professional networking', 'communication', 'strategy', 
                     'relationships', 'deals'],
        'education': ['MBA', 'BBA', 'B.Com', 'Sales/BD Certification'],
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
        'skills': ['corporate strategy', 'competitive analysis', 'market entry strategy', 'business model design', 
                  'growth strategy', 'financial modeling', 'market research', 'executive communication', 
                  'strategic frameworks'],
        'interests': ['corporate strategy', 'competitive analysis', 'business growth', 'markets', 
                     'long-term planning', 'innovation'],
        'education': ['MBA', 'Top Tier Business School', 'Economics', 'Engineering'],
        'salary_range': '₹12-60 LPA',
        'job_growth': 'High',
        'courses': ['Corporate Strategy', 'Strategic Planning', 'Competitive Analysis', 'Financial Modeling', 
                   'Case Studies']
    },
    
    'Entrepreneur': {
        'skills': ['business', 'leadership', 'innovation', 'problem solving', 'communication', 'professional networking', 
                  'finance', 'marketing', 'sales', 'strategic thinking'],
        'interests': ['business', 'entrepreneurship', 'innovation', 'independence', 'creation', 'leadership', 
                     'problem solving', 'opportunity'],
        'education': ['Any Graduate', 'MBA', 'Business Incubator/Accelerator Program', 'Self-taught'],
        'salary_range': '₹0-50 LPA',
        'job_growth': 'Variable',
        'courses': ['Entrepreneurship', 'Business Planning', 'Finance for Entrepreneurs', 'Marketing', 
                   'Leadership']
    },
    
    'Customer Success Manager': {
        'skills': ['customer service', 'communication', 'relationship management', 'problem solving', 
                  'crm', 'account management', 'analytics', 'training'],
        'interests': ['customers', 'relationships', 'helping people', 'communication', 'problem solving', 
                     'success', 'retention'],
        'education': ['BBA', 'MBA', 'B.Com', 'Any Graduate with Strong Communication Skills'],
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
        'education': ['BBA', 'B.Com', 'MBA', 'Any Graduate with Administration Experience'],
        'salary_range': '₹3-12 LPA',
        'job_growth': 'Medium',
        'courses': ['Office Administration', 'Management', 'Communication', 'Business Operations', 
                   'MS Office']
    },
    
    'Compliance Officer': {
        'skills': ['compliance', 'regulations', 'risk assessment', 'documentation', 
                  'reporting', 'legal knowledge', 'ethics', 'policy drafting', 'regulatory filings', 'communication'],
        'interests': ['compliance', 'regulations', 'law', 'ethics', 'governance', 'policy', 'risk'],
        'education': ['Law', 'CA', 'MBA', 'B.Com', 'Compliance Certification'],
        'salary_range': '₹5-20 LPA',
        'job_growth': 'High',
        'courses': ['Compliance Management', 'Regulatory Compliance', 'Policy & Ethics Frameworks', 
                   'Risk Management', 'Corporate Law']
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
                  'analysis', 'markets', 'client relationship building', 'mergers', 'acquisitions'],
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
        'education': ['B.Com', 'MBA Finance', 'CFP (Certified Financial Planner)', 'CA'],
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
        'skills': ['auditing', 'accounting', 'internal audit', 'risk assessment', 'financial statement analysis', 
                  'audit sampling techniques', 'reporting', 'analysis', 'documentation'],
        'interests': ['auditing', 'accuracy', 'financial verification', 'investigation', 'analysis', 
                     'finance'],
        'education': ['CA', 'B.Com', 'MBA Finance', 'Internal Audit Certification'],
        'salary_range': '₹4-18 LPA',
        'job_growth': 'Medium',
        'courses': ['Auditing', 'Internal Audit', 'Financial Statement Analysis', 'Audit Sampling & Techniques', 'Financial Accounting']
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
        'education': ['MBA', 'BBA', 'B.Com', 'Digital Marketing Certification', 'Mass Communication'],
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
        'education': ['B.A English', 'Mass Communication', 'Journalism', 'Any Graduate with Strong Writing Skills'],
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
        'education': ['BBA', 'Mass Communication', 'Marketing', 'Digital Marketing Certification'],
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
        'education': ['MBA', 'BBA', 'B.Com', 'Any Graduate with Sales Experience'],
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
        'education': ['MBA Marketing', 'BBA', 'Mass Communication', 'PG Diploma in Marketing'],
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
        'education': ['MBA', 'BBA', 'Statistics', 'Economics'],
        'salary_range': '₹3.5-14 LPA',
        'job_growth': 'High',
        'courses': ['Market Research', 'Data Analysis', 'Consumer Insights', 'Survey Design', 
                   'Statistics', 'Excel']
    },
    
    'Public Relations Manager': {
        'skills': ['public relations', 'communication', 'media relations', 'crisis management', 
                  'writing', 'media networking', 'event management', 'presentation'],
        'interests': ['communication', 'public relations', 'media', 'media networking', 'reputation', 
                     'people', 'events'],
        'education': ['Mass Communication', 'PR Diploma', 'Journalism', 'MBA'],
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
        'education': ['BCA', 'Marketing', 'Mass Communication', 'SEO/Digital Marketing Certification'],
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
        'education': ['Marketing', 'Mass Communication', 'BBA', 'Digital Marketing Certification'],
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
        'education': ['B.Design', 'Fine Arts', 'Diploma in Graphic Design', 'Any Graduate with Strong Design Portfolio'],
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
        'education': ['Diploma in Video Editing', 'Mass Communication', 'Film School', 'Self-taught with Portfolio'],
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
        'education': ['Diploma/Degree in Animation', 'Fine Arts', 'Multimedia', 'B.Design'],
        'salary_range': '₹2.5-14 LPA',
        'job_growth': 'High',
        'courses': ['2D Animation', '3D Animation', 'Maya', 'Blender', 'Character Design', 'Storyboarding']
    },
    
    'Illustrator': {
        'skills': ['illustration', 'drawing', 'digital art', 'photoshop', 'illustrator', 'creativity', 
                  'concept art', 'sketching', 'visual storytelling'],
        'interests': ['art', 'drawing', 'creativity', 'illustration', 'visual', 'storytelling', 
                     'design', 'imagination'],
        'education': ['Fine Arts', 'B.Design', 'Diploma in Illustration', 'Self-taught with Strong Portfolio'],
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
        'education': ['B.Design', 'Graphic Design', 'Fine Arts', 'Diploma in Packaging Design'],
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
        'education': ['Design', 'Animation Diploma', 'Multimedia', 'Self-taught with Portfolio'],
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
        'education': ['B.Pharm', 'Life Sciences', 'B.Sc (Any Science Stream)'],
        'salary_range': '₹2.5-12 LPA',
        'job_growth': 'Medium',
        'courses': ['Pharmaceutical Sales', 'Medical Terminology', 'Communication Skills', 'Product Knowledge']
    },
    
    'Hospital Administrator': {
        'skills': ['healthcare management', 'administration', 'planning', 'budgeting', 'leadership', 
                  'operations', 'compliance', 'communication', 'coordination'],
        'interests': ['healthcare', 'management', 'administration', 'organization', 'leadership', 
                     'operations', 'healthcare systems'],
        'education': ['MBA Hospital Management', 'MHA (Master of Hospital Administration)', 'BHA'],
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
                  'lesson planning', 'curriculum delivery', 'group facilitation', 'school administration coordination'],
        'interests': ['education', 'classroom teaching', 'children', 'school environment', 'curriculum', 
                     'mentoring', 'institutional learning'],
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
        'education': ['MBA', 'Subject-Specific Graduation', 'Training & Development Certification'],
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
        'education': ['M.Ed', 'M.A Psychology', 'PG Diploma in Counseling'],
        'salary_range': '₹2.5-10 LPA',
        'job_growth': 'High',
        'courses': ['Career Counseling', 'Educational Psychology', 'Guidance', 'Student Development']
    },
    
    'E-Learning Developer': {
        'skills': ['instructional design', 'e-learning', 'lms', 'content development', 'multimedia', 
                  'articulate', 'captivate', 'video editing', 'creativity'],
        'interests': ['education', 'technology', 'e-learning', 'content creation', 'design', 'teaching', 
                     'innovation'],
        'education': ['B.Ed', 'Instructional Design Certification', 'Multimedia', 'B.Tech/BCA'],
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
        'education': ['B.Lib.Sc', 'M.Lib.Sc', 'Library & Information Science Diploma'],
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
        'skills': ['teaching', 'subject knowledge', 'communication', 'patience', 'one-on-one explanation', 
                  'individualized learning plans', 'exam-focused coaching', 'flexible scheduling'],
        'interests': ['one-on-one teaching', 'helping students', 'individual mentoring', 'subjects', 
                     'exam preparation', 'personalized learning', 'self-employment'],
        'education': ['Subject Graduation', 'B.Ed', 'Postgraduate in Relevant Subject'],
        'salary_range': '₹2-12 LPA',
        'job_growth': 'High',
        'courses': ['Subject Mastery', 'One-on-One Teaching Techniques', 'Student Psychology', 'Competitive Exam Preparation']
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
        'education': ['Journalism', 'Mass Communication', 'B.A English'],
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
        'education': ['Photography Diploma', 'Fine Arts', 'Mass Communication', 'Self-taught with Strong Portfolio'],
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
        'education': ['Audio Engineering Diploma', 'Sound Design', 'Music Production Course'],
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
        'education': ['Mass Communication', 'Journalism', 'Voice & Diction Training'],
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
        'education': ['Film School', 'Creative Writing', 'English Literature'],
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
        'education': ['VFX Diploma', 'Animation', 'Multimedia', 'Fine Arts'],
        'salary_range': '₹3-18 LPA',
        'job_growth': 'High',
        'courses': ['VFX', 'After Effects', 'Nuke', 'Compositing', '3D Modeling', 'Visual Effects']
    },
    
    'Voiceover Artist': {
        'skills': ['voice', 'voice modulation', 'expression', 'acting', 'pronunciation', 'recording', 
                  'versatility', 'character voices'],
        'interests': ['voice acting', 'entertainment', 'expression', 'characters', 'recording', 
                     'performance', 'audio'],
        'education': ['Voice Training/Diction Course', 'Theater/Acting Diploma', 'Mass Communication'],
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
                  'kitchen management', 'food safety', 'plating and food presentation'],
        'interests': ['cooking', 'food', 'culinary arts', 'creativity', 'gastronomy', 'flavors', 
                     'cuisine', 'plating aesthetics'],
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
        'education': ['Diploma in Travel & Tourism', 'BBA Tourism', 'Hotel Management'],
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
        'education': ['Diploma/Degree in Tourism', 'History', 'Tour Guide Certification (Govt. approved)'],
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
        'education': ['Diploma/Degree in Event Management', 'BBA', 'Hotel Management', 'Mass Communication'],
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
        'education': ['12th Pass', 'Diploma in Aviation/Hospitality', 'Cabin Crew Training'],
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
        'education': ['Hotel Management Diploma', 'WSET/Sommelier Certification', 'Hospitality Degree'],
        'salary_range': '₹3-15 LPA',
        'job_growth': 'Medium',
        'courses': ['Sommelier Certification', 'Wine Knowledge', 'Food & Wine Pairing', 'Beverage Management']
    },
    
    'Cruise Ship Staff': {
        'skills': ['hospitality', 'customer service', 'communication', 'adaptability', 'teamwork', 
                  'entertainment', 'safety', 'multitasking'],
        'interests': ['travel', 'hospitality', 'sea', 'cruises', 'customer service', 'adventure', 
                     'entertainment', 'cultures'],
        'education': ['Hotel Management', 'Hospitality Diploma', 'STCW Safety Certification'],
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
        'education': ['B.P.Ed', 'M.P.Ed', 'Sports Science Degree', 'National Sports Coaching Certification'],
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
        'education': ['Fitness/Personal Training Certification', 'B.P.Ed', 'Sports Science'],
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
        'education': ['Yoga Teacher Training Certification (200/500 hr)', 'Yoga Diploma/Degree', 'B.P.Ed'],
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
    
    'Sports Physiotherapist': {
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
        'education': ['Mass Communication', 'Journalism', 'Sports Management Degree'],
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
        'education': ['Law (LLB)', 'B.Tech/BCA with Cybersecurity Background', 'CIPP/DPO Certification'],
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
        'education': ['Environmental Science', 'MBA Sustainability', 'M.Sc Environmental Management'],
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
        'education': ['DGCA Remote Pilot Certificate', 'Diploma in Aviation/Engineering', '12th Pass with Drone License'],
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
        'education': ['B.Tech Computer Science/IT', 'CEH Certification', 'BCA with Cybersecurity Specialization'],
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
        'education': ['Psychology', 'HCI (Human-Computer Interaction)', 'Design', 'M.Des'],
        'salary_range': '₹4-18 LPA',
        'job_growth': 'Very High',
        'courses': ['UX Research', 'User Testing', 'Research Methods', 'Design Thinking', 
                   'User Psychology', 'Data Analysis']
    },

    # ========== TECHNOLOGY & IT — ADDITIONAL SPECIALIZATIONS (15 careers) ==========
    
    'Frontend Developer': {
        'skills': ['html', 'css', 'javascript', 'react', 'vue', 'responsive design', 'accessibility', 'browser devtools', 'webpack', 'ui implementation'],
        'interests': ['web', 'visual design', 'user interface', 'interactivity', 'browsers', 'technology'],
        'education': ['B.Tech', 'BCA', 'MCA', 'B.Sc IT', 'Bootcamp', 'Self-taught'],
        'salary_range': '₹3.5-14 LPA',
        'job_growth': 'Very High',
        'courses': ['React.js', 'Advanced CSS', 'Web Accessibility', 'JavaScript ES6+', 'Frontend Performance', 'TypeScript']
    },
    'Backend Developer': {
        'skills': ['python', 'java', 'node', 'sql', 'rest api', 'microservices', 'database design', 'authentication', 'server architecture', 'caching'],
        'interests': ['systems', 'logic', 'architecture', 'data', 'problem solving', 'technology'],
        'education': ['B.Tech', 'BCA', 'MCA', 'B.Sc Computer Science', 'M.Tech'],
        'salary_range': '₹4-16 LPA',
        'job_growth': 'Very High',
        'courses': ['Backend Development', 'API Design', 'Database Management', 'System Design', 'Microservices', 'Node.js/Django']
    },
    'Full Stack Developer': {
        'skills': ['javascript', 'typescript', 'react', 'node', 'express', 'rest api', 'sql', 'nosql', 'mongodb', 'docker', 'system design', 'ci/cd', 'microservices', 'git'],
        'interests': ['end to end building', 'backend architecture', 'technology', 'problem solving', 'products', 'system design'],
        'education': ['B.Tech', 'BCA', 'MCA', 'B.Sc IT', 'Bootcamp'],
        'salary_range': '₹5-18 LPA',
        'job_growth': 'Very High',
        'courses': ['Full Stack Web Development', 'React & Node.js', 'REST APIs', 'SQL & NoSQL', 'Git & Deployment', 'System Design Basics']
    },
    'Embedded Software Engineer': {
        'skills': ['c', 'c++', 'embedded systems', 'microcontrollers', 'rtos', 'firmware', 'electronics', 'debugging', 'hardware interfacing', 'assembly'],
        'interests': ['hardware', 'electronics', 'low level programming', 'devices', 'technology', 'engineering'],
        'education': ['B.Tech Electronics', 'B.Tech ECE', 'B.Tech Computer Science', 'M.Tech Embedded Systems'],
        'salary_range': '₹4-18 LPA',
        'job_growth': 'High',
        'courses': ['Embedded C', 'Microcontroller Programming', 'RTOS', 'Firmware Development', 'Digital Electronics', 'IoT Hardware']
    },
    'API Developer': {
        'skills': ['rest api', 'graphql', 'node', 'python', 'api design', 'authentication', 'documentation', 'sql', 'microservices', 'postman'],
        'interests': ['integration', 'systems', 'backend', 'technology', 'logic'],
        'education': ['B.Tech', 'BCA', 'MCA', 'B.Sc Computer Science'],
        'salary_range': '₹4-15 LPA',
        'job_growth': 'High',
        'courses': ['API Design & Development', 'GraphQL', 'OAuth & API Security', 'API Documentation', 'Microservices']
    },
    'QA Automation Engineer': {
        'skills': ['selenium', 'test automation', 'python', 'java', 'ci/cd', 'test cases', 'bug tracking', 'api testing', 'quality assurance', 'jira'],
        'interests': ['quality', 'detail orientation', 'testing', 'technology', 'problem solving'],
        'education': ['B.Tech', 'BCA', 'MCA', 'B.Sc Computer Science', 'ISTQB Certification'],
        'salary_range': '₹4-15 LPA',
        'job_growth': 'High',
        'courses': ['Selenium WebDriver', 'Test Automation Frameworks', 'API Testing', 'CI/CD for Testing', 'Software Testing Life Cycle']
    },
    'Site Reliability Engineer': {
        'skills': ['linux', 'kubernetes', 'monitoring', 'incident response', 'automation', 'scripting', 'cloud', 'networking', 'ci/cd', 'reliability engineering'],
        'interests': ['reliability', 'systems', 'automation', 'problem solving', 'technology', 'operations'],
        'education': ['B.Tech', 'M.Tech', 'B.E', 'MCA'],
        'salary_range': '₹8-28 LPA',
        'job_growth': 'Very High',
        'courses': ['Site Reliability Engineering', 'Kubernetes', 'Monitoring & Observability', 'Incident Management', 'Cloud Infrastructure']
    },
    'Platform Engineer': {
        'skills': ['kubernetes', 'terraform', 'ci/cd', 'cloud', 'infrastructure automation', 'docker', 'networking', 'internal tooling', 'linux', 'devops'],
        'interests': ['infrastructure', 'automation', 'developer tools', 'technology', 'systems'],
        'education': ['B.Tech', 'M.Tech', 'MCA', 'B.E'],
        'salary_range': '₹8-28 LPA',
        'job_growth': 'Very High',
        'courses': ['Platform Engineering', 'Terraform', 'Kubernetes', 'Developer Experience', 'Cloud Infrastructure']
    },
    'Application Security Engineer': {
        'skills': ['secure coding', 'penetration testing', 'vulnerability assessment', 'sast', 'dast', 'cybersecurity', 'code review', 'threat modeling', 'owasp', 'programming'],
        'interests': ['security', 'problem solving', 'protection', 'technology', 'investigation'],
        'education': ['B.Tech', 'MCA', 'Cybersecurity Certification', 'M.Tech'],
        'salary_range': '₹7-26 LPA',
        'job_growth': 'Very High',
        'courses': ['Application Security', 'OWASP Top 10', 'Secure Code Review', 'Threat Modeling', 'SAST/DAST Tools']
    },
    'Cloud Security Engineer': {
        'skills': ['cloud security', 'aws', 'azure', 'gcp', 'iam', 'encryption', 'compliance', 'network security', 'security automation', 'cybersecurity'],
        'interests': ['cloud', 'security', 'protection', 'technology', 'compliance'],
        'education': ['B.Tech', 'MCA', 'Cloud Security Certification', 'M.Tech'],
        'salary_range': '₹8-28 LPA',
        'job_growth': 'Very High',
        'courses': ['Cloud Security', 'AWS/Azure Security', 'Identity & Access Management', 'Cloud Compliance', 'Security Automation']
    },
    'Security Architect': {
        'skills': ['security architecture', 'risk assessment', 'network security', 'cybersecurity strategy', 'compliance', 'encryption', 'identity management', 'cloud security', 'threat modeling'],
        'interests': ['security', 'architecture', 'strategy', 'protection', 'technology'],
        'education': ['B.Tech', 'M.Tech', 'CISSP Certification'],
        'salary_range': '₹15-40 LPA',
        'job_growth': 'High',
        'courses': ['Security Architecture', 'Enterprise Risk Management', 'CISSP Prep', 'Zero Trust Architecture', 'Compliance Frameworks']
    },
    'SOC Analyst': {
        'skills': ['siem', 'incident response', 'log analysis', 'threat detection', 'networking', 'cybersecurity', 'malware analysis', 'monitoring', 'linux'],
        'interests': ['security', 'monitoring', 'investigation', 'technology', 'protection'],
        'education': ['B.Tech', 'MCA', 'B.Sc Computer Science', 'Security Certification'],
        'salary_range': '₹4-16 LPA',
        'job_growth': 'Very High',
        'courses': ['SOC Fundamentals', 'SIEM Tools', 'Incident Response', 'Threat Detection', 'Log Analysis']
    },
    'Penetration Tester': {
        'skills': ['penetration testing', 'vulnerability assessment', 'exploitation', 'networking', 'linux', 'scripting', 'web application security', 'reporting', 'security tools'],
        'interests': ['hacking', 'security', 'testing', 'problem solving', 'technology'],
        'education': ['B.Tech Computer Science', 'OSCP Certification', 'CEH Certification'],
        'salary_range': '₹6-24 LPA',
        'job_growth': 'Very High',
        'courses': ['Penetration Testing', 'OSCP Prep', 'Web App Pentesting', 'Network Pentesting', 'Exploit Development Basics']
    },
    'AR/VR Developer': {
        'skills': ['unity', 'unreal', 'c#', '3d modeling', 'spatial computing', 'arkit', 'arcore', 'shader programming', 'game engines'],
        'interests': ['immersive technology', 'gaming', 'innovation', '3d', 'creativity', 'technology'],
        'education': ['B.Tech', 'BCA', 'Game Design', 'M.Tech'],
        'salary_range': '₹5-20 LPA',
        'job_growth': 'High',
        'courses': ['Unity for AR/VR', 'Unreal Engine', 'ARKit/ARCore', '3D Spatial Design', 'Shader Programming']
    },
    'Prompt Engineer': {
        'skills': ['prompt design', 'large language models', 'python', 'ai tools', 'natural language processing', 'evaluation', 'api integration', 'critical thinking'],
        'interests': ['ai', 'language', 'experimentation', 'technology', 'problem solving', 'writing'],
        'education': ['B.Tech Computer Science', 'Linguistics', 'B.Sc with Strong AI/NLP Aptitude'],
        'salary_range': '₹6-22 LPA',
        'job_growth': 'Very High',
        'courses': ['Prompt Engineering', 'LLM Fundamentals', 'AI Application Development', 'NLP Basics', 'AI Evaluation Methods']
    },

    # ========== DATA & ARTIFICIAL INTELLIGENCE (10 careers) ==========
    
    'Data Analyst': {
        'skills': ['excel', 'sql', 'data analysis', 'power bi', 'tableau', 'statistics', 'data cleaning', 'reporting', 'visualization', 'python'],
        'interests': ['data', 'analysis', 'numbers', 'patterns', 'reporting', 'insights'],
        'education': ['B.Sc Statistics', 'B.Com', 'B.Tech', 'BBA', 'B.Sc Mathematics', 'MBA Analytics'],
        'salary_range': '₹3.5-12 LPA',
        'job_growth': 'Very High',
        'courses': ['Excel for Data Analysis', 'SQL Fundamentals', 'Power BI/Tableau', 'Statistics for Analysts', 'Python for Data Analysis']
    },
    'Business Intelligence Analyst': {
        'skills': ['sql', 'power bi', 'data modeling', 'dashboards', 'business analysis', 'etl', 'reporting', 'kpi tracking', 'excel'],
        'interests': ['business', 'data', 'reporting', 'strategy', 'insights'],
        'education': ['B.Tech', 'BBA', 'MBA', 'B.Com', 'B.Sc Statistics'],
        'salary_range': '₹5-16 LPA',
        'job_growth': 'Very High',
        'courses': ['Business Intelligence Tools', 'Data Modeling', 'SQL for BI', 'Dashboard Design', 'KPI Frameworks']
    },
    'BI Developer': {
        'skills': ['sql', 'etl', 'data warehousing', 'power bi', 'ssrs', 'data modeling', 'python', 'database design'],
        'interests': ['data engineering', 'reporting', 'systems', 'technology', 'analysis'],
        'education': ['B.Tech', 'MCA', 'B.Sc Computer Science'],
        'salary_range': '₹6-20 LPA',
        'job_growth': 'High',
        'courses': ['BI Development', 'ETL Pipelines', 'Data Warehousing', 'Advanced SQL', 'Power BI/SSRS']
    },
    'Machine Learning Engineer': {
        'skills': ['python', 'machine learning', 'model deployment', 'mlops', 'tensorflow', 'pytorch', 'sql', 'algorithms', 'cloud', 'software engineering'],
        'interests': ['ai', 'machine learning', 'engineering', 'automation', 'technology', 'research'],
        'education': ['B.Tech', 'M.Tech', 'B.Sc Computer Science', 'PhD'],
        'salary_range': '₹8-32 LPA',
        'job_growth': 'Very High',
        'courses': ['Machine Learning Engineering', 'Model Deployment', 'MLOps', 'TensorFlow/PyTorch', 'Cloud ML Platforms']
    },
    'NLP Engineer': {
        'skills': ['nlp', 'python', 'transformers', 'text mining', 'machine learning', 'linguistics', 'deep learning', 'language models'],
        'interests': ['language', 'ai', 'text', 'research', 'technology'],
        'education': ['B.Tech', 'M.Tech', 'Computational Linguistics', 'PhD'],
        'salary_range': '₹8-30 LPA',
        'job_growth': 'Very High',
        'courses': ['Natural Language Processing', 'Transformer Models', 'Text Mining', 'Deep Learning for NLP', 'LLM Fine-tuning']
    },
    'Computer Vision Engineer': {
        'skills': ['computer vision', 'opencv', 'python', 'deep learning', 'image processing', 'machine learning', 'pytorch', 'algorithms'],
        'interests': ['ai', 'images', 'research', 'technology', 'innovation'],
        'education': ['B.Tech', 'M.Tech', 'B.Sc Computer Science', 'PhD'],
        'salary_range': '₹8-30 LPA',
        'job_growth': 'Very High',
        'courses': ['Computer Vision', 'OpenCV', 'Deep Learning for Images', 'Image Processing', 'Object Detection']
    },
    'Analytics Engineer': {
        'skills': ['sql', 'dbt', 'data modeling', 'python', 'data warehousing', 'etl', 'analytics', 'cloud data platforms'],
        'interests': ['data', 'engineering', 'analysis', 'systems', 'technology'],
        'education': ['B.Tech', 'MCA', 'B.Sc Statistics', 'B.Sc Computer Science'],
        'salary_range': '₹7-24 LPA',
        'job_growth': 'Very High',
        'courses': ['Analytics Engineering', 'dbt', 'Data Warehousing', 'Advanced SQL', 'Cloud Data Platforms']
    },
    'MLOps Engineer': {
        'skills': ['mlops', 'docker', 'kubernetes', 'ci/cd', 'python', 'model monitoring', 'cloud', 'machine learning', 'automation'],
        'interests': ['automation', 'ai', 'infrastructure', 'technology', 'systems'],
        'education': ['B.Tech', 'M.Tech', 'MCA'],
        'salary_range': '₹9-30 LPA',
        'job_growth': 'Very High',
        'courses': ['MLOps Fundamentals', 'Model Monitoring', 'Kubernetes for ML', 'CI/CD for ML Pipelines', 'Cloud ML Infrastructure']
    },
    'AI Research Scientist': {
        'skills': ['machine learning', 'deep learning', 'research', 'mathematics', 'python', 'algorithms', 'publications', 'experimentation'],
        'interests': ['research', 'ai', 'innovation', 'mathematics', 'discovery', 'science'],
        'education': ['M.Tech', 'PhD', 'B.Tech with Research', 'MS'],
        'salary_range': '₹10-40 LPA',
        'job_growth': 'Very High',
        'courses': ['Advanced Machine Learning', 'Deep Learning Theory', 'Research Methodology', 'Mathematics for AI', 'Academic Writing']
    },
    'Data Governance Analyst': {
        'skills': ['data governance', 'data quality', 'compliance', 'metadata management', 'sql', 'data privacy', 'documentation', 'analysis'],
        'interests': ['data', 'compliance', 'policy', 'organization', 'quality'],
        'education': ['B.Tech', 'MBA', 'B.Sc Statistics', 'Data Governance Certification'],
        'salary_range': '₹6-18 LPA',
        'job_growth': 'High',
        'courses': ['Data Governance', 'Data Quality Management', 'Data Privacy Regulations', 'Metadata Management']
    },

    # ========== ENGINEERING — ADDITIONAL DISCIPLINES (10 careers) ==========
    
    'Industrial Engineer': {
        'skills': ['process optimization', 'lean manufacturing', 'six sigma', 'operations research', 'supply chain', 'quality control', 'statistics', 'workflow design'],
        'interests': ['efficiency', 'systems', 'manufacturing', 'optimization', 'engineering'],
        'education': ['B.Tech Industrial Engineering', 'B.E', 'M.Tech'],
        'salary_range': '₹4-16 LPA',
        'job_growth': 'High',
        'courses': ['Lean Manufacturing', 'Six Sigma', 'Operations Research', 'Process Optimization', 'Supply Chain Fundamentals']
    },
    'Manufacturing Engineer': {
        'skills': ['manufacturing processes', 'cad', 'quality control', 'production planning', 'lean manufacturing', 'automation', 'materials', 'troubleshooting'],
        'interests': ['manufacturing', 'engineering', 'production', 'quality', 'technology'],
        'education': ['B.Tech Mechanical', 'B.Tech Manufacturing', 'B.E', 'M.Tech'],
        'salary_range': '₹4-16 LPA',
        'job_growth': 'High',
        'courses': ['Manufacturing Processes', 'CAD/CAM', 'Production Planning', 'Quality Systems', 'Lean Manufacturing']
    },
    'Mechatronics Engineer': {
        'skills': ['robotics', 'electronics', 'mechanical design', 'control systems', 'programming', 'sensors', 'automation', 'plc'],
        'interests': ['robotics', 'automation', 'engineering', 'technology', 'innovation'],
        'education': ['B.Tech Mechatronics', 'B.E', 'M.Tech'],
        'salary_range': '₹4-18 LPA',
        'job_growth': 'Very High',
        'courses': ['Mechatronics Systems', 'PLC Programming', 'Robotics Fundamentals', 'Control Systems', 'Sensors & Actuators']
    },
    'Control Systems Engineer': {
        'skills': ['control systems', 'plc', 'scada', 'instrumentation', 'automation', 'matlab', 'electrical engineering', 'process control'],
        'interests': ['automation', 'systems', 'engineering', 'problem solving', 'technology'],
        'education': ['B.Tech Electrical', 'B.Tech Instrumentation', 'B.E', 'M.Tech'],
        'salary_range': '₹5-18 LPA',
        'job_growth': 'High',
        'courses': ['Control Systems Design', 'PLC & SCADA', 'Process Automation', 'MATLAB/Simulink', 'Instrumentation']
    },
    'Structural Engineer': {
        'skills': ['structural analysis', 'structural design', 'autocad', 'staad pro', 'concrete design', 'steel design', 'building codes', 'load calculations'],
        'interests': ['construction', 'buildings', 'engineering', 'design', 'safety'],
        'education': ['B.Tech Civil', 'B.E Civil', 'M.Tech Structural Engineering'],
        'salary_range': '₹4-16 LPA',
        'job_growth': 'High',
        'courses': ['Structural Analysis', 'STAAD Pro/ETABS', 'Concrete & Steel Design', 'Building Codes', 'Earthquake Engineering']
    },
    'Instrumentation Engineer': {
        'skills': ['instrumentation', 'sensors', 'process control', 'plc', 'scada', 'calibration', 'automation', 'electrical systems'],
        'interests': ['measurement', 'automation', 'engineering', 'technology', 'precision'],
        'education': ['B.Tech Instrumentation', 'B.E', 'M.Tech'],
        'salary_range': '₹4-16 LPA',
        'job_growth': 'High',
        'courses': ['Industrial Instrumentation', 'Process Control', 'PLC & SCADA', 'Sensor Technology', 'Calibration Techniques']
    },
    'Marine Engineer': {
        'skills': ['marine engineering', 'ship systems', 'mechanical systems', 'maintenance', 'safety regulations', 'engine systems', 'troubleshooting'],
        'interests': ['ships', 'engineering', 'sea', 'machinery', 'travel'],
        'education': ['B.Tech Marine Engineering', 'B.E Marine', 'Marine Engineering Diploma'],
        'salary_range': '₹5-25 LPA',
        'job_growth': 'High',
        'courses': ['Marine Engineering Fundamentals', 'Ship Systems', 'Marine Safety', 'Engine Room Operations']
    },
    'Renewable Energy Engineer': {
        'skills': ['solar energy', 'wind energy', 'renewable systems design', 'electrical engineering', 'sustainability', 'project management', 'energy storage'],
        'interests': ['sustainability', 'environment', 'energy', 'engineering', 'innovation'],
        'education': ['B.Tech Electrical', 'B.Tech Renewable Energy', 'M.Tech Energy Systems'],
        'salary_range': '₹4-18 LPA',
        'job_growth': 'Very High',
        'courses': ['Solar PV Design', 'Wind Energy Systems', 'Renewable Energy Fundamentals', 'Energy Storage Technology']
    },
    'Textile Engineer': {
        'skills': ['textile technology', 'fabric manufacturing', 'quality control', 'textile chemistry', 'machinery operation', 'product development'],
        'interests': ['textiles', 'manufacturing', 'engineering', 'fashion', 'materials'],
        'education': ['B.Tech Textile Engineering', 'B.E', 'Diploma in Textile Technology'],
        'salary_range': '₹3.5-12 LPA',
        'job_growth': 'Medium',
        'courses': ['Textile Manufacturing', 'Fabric Technology', 'Textile Chemistry', 'Quality Control in Textiles']
    },
    'Production Engineer': {
        'skills': ['production planning', 'process improvement', 'quality control', 'manufacturing', 'cad', 'cost optimization', 'supply chain'],
        'interests': ['production', 'manufacturing', 'efficiency', 'engineering', 'operations'],
        'education': ['B.Tech Mechanical', 'B.Tech Production Engineering', 'B.E'],
        'salary_range': '₹4-15 LPA',
        'job_growth': 'High',
        'courses': ['Production Planning & Control', 'Manufacturing Technology', 'Quality Management', 'Cost Optimization']
    },

    # ========== ARCHITECTURE & CONSTRUCTION (6 careers) ==========
    
    'Architect': {
        'skills': ['architectural design', 'autocad', 'revit', 'sketchup', 'building codes', 'space planning', '3d modeling', 'sustainability', 'project coordination'],
        'interests': ['design', 'buildings', 'creativity', 'architecture', 'space', 'aesthetics'],
        'education': ['B.Arch', 'M.Arch'],
        'salary_range': '₹4-20 LPA',
        'job_growth': 'High',
        'courses': ['Architectural Design', 'Revit/AutoCAD', 'Building Codes & Regulations', 'Sustainable Architecture', '3D Visualization']
    },
    'Urban Planner': {
        'skills': ['urban planning', 'gis', 'land use planning', 'zoning regulations', 'sustainability', 'public policy', 'data analysis', 'urban design'],
        'interests': ['cities', 'planning', 'policy', 'sustainability', 'design', 'community'],
        'education': ['B.Planning', 'M.Planning', 'Urban Studies', 'B.Arch with Planning Specialization'],
        'salary_range': '₹4-16 LPA',
        'job_growth': 'High',
        'courses': ['Urban Planning Fundamentals', 'GIS for Planners', 'Land Use Policy', 'Sustainable Urban Design']
    },
    'Construction Project Manager': {
        'skills': ['project management', 'construction planning', 'budgeting', 'scheduling', 'site coordination', 'contract management', 'quality control', 'safety compliance'],
        'interests': ['construction', 'management', 'planning', 'leadership', 'buildings'],
        'education': ['B.Tech Civil', 'B.E Civil', 'PMP Certification', 'MBA Construction Management'],
        'salary_range': '₹6-22 LPA',
        'job_growth': 'High',
        'courses': ['Construction Project Management', 'PMP Certification', 'Construction Scheduling', 'Cost Estimation', 'Site Safety Management']
    },
    'Quantity Surveyor': {
        'skills': ['cost estimation', 'quantity takeoff', 'contract administration', 'budgeting', 'tendering', 'construction materials', 'autocad'],
        'interests': ['construction', 'numbers', 'budgeting', 'buildings', 'detail orientation'],
        'education': ['B.Tech Civil', 'B.Sc Quantity Surveying', 'Diploma in Civil Engineering'],
        'salary_range': '₹4-15 LPA',
        'job_growth': 'High',
        'courses': ['Quantity Surveying', 'Cost Estimation', 'Construction Contracts', 'Tendering Process', 'Bill of Quantities']
    },
    'Civil Site Engineer': {
        'skills': ['site supervision', 'construction management', 'surveying', 'autocad', 'quality control', 'safety regulations', 'structural basics', 'material estimation'],
        'interests': ['construction', 'site work', 'engineering', 'buildings', 'supervision'],
        'education': ['B.Tech Civil', 'B.E Civil', 'Diploma in Civil Engineering'],
        'salary_range': '₹3-12 LPA',
        'job_growth': 'High',
        'courses': ['Site Engineering', 'Construction Surveying', 'Quality Control on Site', 'Safety Management', 'Material Estimation']
    },
    'Building Services Engineer': {
        'skills': ['hvac', 'electrical systems', 'plumbing design', 'fire safety systems', 'building automation', 'energy efficiency', 'autocad'],
        'interests': ['buildings', 'systems', 'engineering', 'sustainability', 'technology'],
        'education': ['B.Tech Mechanical', 'B.Tech Electrical', 'B.E'],
        'salary_range': '₹4-16 LPA',
        'job_growth': 'High',
        'courses': ['Building Services Design', 'HVAC Systems', 'Fire & Safety Systems', 'Building Automation', 'Energy Efficiency']
    },

    # ========== HEALTHCARE & MEDICINE — SPECIALIZATIONS (14 careers) ==========
    
    'Surgeon': {
        'skills': ['surgical skills', 'anatomy', 'patient care', 'critical thinking', 'precision', 'medical diagnosis', 'sterile technique', 'decision making'],
        'interests': ['medicine', 'surgery', 'helping people', 'science', 'precision'],
        'education': ['MBBS', 'MS', 'MCh'],
        'salary_range': '₹10-50 LPA',
        'job_growth': 'High',
        'courses': ['Surgical Techniques', 'Advanced Anatomy', 'Critical Care', 'Patient Management', 'Surgical Specializations']
    },
    'Anesthesiologist': {
        'skills': ['anesthesia administration', 'patient monitoring', 'critical care', 'pharmacology', 'emergency response', 'precision', 'medical diagnosis'],
        'interests': ['medicine', 'science', 'helping people', 'precision', 'critical care'],
        'education': ['MBBS', 'MD Anesthesiology'],
        'salary_range': '₹10-45 LPA',
        'job_growth': 'High',
        'courses': ['Anesthesiology', 'Critical Care Medicine', 'Pain Management', 'Emergency Response', 'Pharmacology']
    },
    'Cardiologist': {
        'skills': ['cardiac diagnosis', 'patient care', 'medical imaging interpretation', 'pharmacology', 'critical thinking', 'ecg interpretation'],
        'interests': ['medicine', 'heart health', 'science', 'helping people', 'diagnosis'],
        'education': ['MBBS', 'MD', 'DM Cardiology'],
        'salary_range': '₹12-60 LPA',
        'job_growth': 'High',
        'courses': ['Cardiology Fundamentals', 'ECG Interpretation', 'Cardiac Imaging', 'Interventional Cardiology']
    },
    'Pediatrician': {
        'skills': ['child healthcare', 'patient care', 'medical diagnosis', 'communication', 'vaccination management', 'growth monitoring'],
        'interests': ['medicine', 'children', 'helping people', 'care', 'health'],
        'education': ['MBBS', 'MD Pediatrics'],
        'salary_range': '₹8-35 LPA',
        'job_growth': 'High',
        'courses': ['Pediatric Medicine', 'Child Growth & Development', 'Vaccination Protocols', 'Pediatric Emergency Care']
    },
    'Dermatologist': {
        'skills': ['skin diagnosis', 'patient care', 'cosmetic procedures', 'medical treatment', 'communication', 'precision'],
        'interests': ['medicine', 'skin health', 'aesthetics', 'science', 'helping people'],
        'education': ['MBBS', 'MD Dermatology'],
        'salary_range': '₹8-40 LPA',
        'job_growth': 'High',
        'courses': ['Dermatology Fundamentals', 'Cosmetic Dermatology', 'Skin Disease Management', 'Dermatologic Surgery']
    },
    'Ophthalmologist': {
        'skills': ['eye examination', 'surgical skills', 'patient care', 'medical diagnosis', 'precision', 'vision correction'],
        'interests': ['medicine', 'vision health', 'science', 'helping people', 'precision'],
        'education': ['MBBS', 'MS Ophthalmology'],
        'salary_range': '₹8-40 LPA',
        'job_growth': 'High',
        'courses': ['Ophthalmology', 'Eye Surgery Techniques', 'Vision Correction', 'Eye Disease Management']
    },
    'Psychiatrist': {
        'skills': ['mental health assessment', 'patient care', 'therapy techniques', 'pharmacology', 'communication', 'empathy', 'diagnosis'],
        'interests': ['mental health', 'medicine', 'helping people', 'psychology', 'care'],
        'education': ['MBBS', 'MD Psychiatry'],
        'salary_range': '₹8-35 LPA',
        'job_growth': 'Very High',
        'courses': ['Psychiatric Medicine', 'Psychotherapy Techniques', 'Psychopharmacology', 'Mental Health Assessment']
    },
    'Nurse Practitioner': {
        'skills': ['patient assessment', 'clinical care', 'diagnosis', 'treatment planning', 'pharmacology', 'communication', 'nursing'],
        'interests': ['healthcare', 'helping people', 'care', 'medicine', 'patient wellbeing'],
        'education': ['B.Sc Nursing', 'M.Sc Nursing', 'Nurse Practitioner Certification'],
        'salary_range': '₹5-18 LPA',
        'job_growth': 'Very High',
        'courses': ['Advanced Clinical Assessment', 'Pharmacology for Nurses', 'Chronic Disease Management', 'Patient Care Planning']
    },
    'Clinical Pharmacist': {
        'skills': ['pharmacology', 'medication management', 'patient counseling', 'drug interactions', 'clinical knowledge', 'dosage calculation'],
        'interests': ['medicine', 'helping people', 'science', 'healthcare', 'precision'],
        'education': ['B.Pharm', 'M.Pharm', 'Pharm.D'],
        'salary_range': '₹4-16 LPA',
        'job_growth': 'High',
        'courses': ['Clinical Pharmacy', 'Pharmacotherapy', 'Drug Interaction Management', 'Patient Counseling']
    },
    'Public Health Specialist': {
        'skills': ['epidemiology', 'public health policy', 'data analysis', 'community health', 'program management', 'health education', 'biostatistics'],
        'interests': ['health', 'community', 'policy', 'research', 'helping people'],
        'education': ['MBBS', 'MPH', 'B.Sc Public Health', 'M.Sc Epidemiology'],
        'salary_range': '₹5-20 LPA',
        'job_growth': 'Very High',
        'courses': ['Epidemiology', 'Public Health Policy', 'Biostatistics', 'Health Program Management', 'Community Health']
    },
    'Health Informatics Specialist': {
        'skills': ['health information systems', 'data analysis', 'electronic health records', 'healthcare it', 'data privacy', 'sql', 'healthcare workflows'],
        'interests': ['healthcare', 'technology', 'data', 'systems', 'innovation'],
        'education': ['B.Tech', 'MCA', 'Health Informatics Certification', 'MBA Healthcare'],
        'salary_range': '₹6-20 LPA',
        'job_growth': 'Very High',
        'courses': ['Health Informatics', 'Electronic Health Records', 'Healthcare Data Standards', 'Healthcare IT Systems']
    },
    'Medical Technologist': {
        'skills': ['laboratory techniques', 'diagnostic testing', 'sample analysis', 'quality control', 'medical equipment operation', 'microbiology'],
        'interests': ['laboratory', 'science', 'healthcare', 'precision', 'diagnosis'],
        'education': ['B.Sc Medical Lab Technology', 'M.Sc Medical Technology', 'DMLT'],
        'salary_range': '₹3-12 LPA',
        'job_growth': 'High',
        'courses': ['Medical Laboratory Techniques', 'Diagnostic Testing', 'Clinical Microbiology', 'Lab Equipment Operation']
    },
    'Genetic Counselor': {
        'skills': ['genetics', 'patient counseling', 'risk assessment', 'communication', 'medical knowledge', 'empathy', 'data interpretation'],
        'interests': ['genetics', 'helping people', 'science', 'counseling', 'medicine'],
        'education': ['M.Sc Genetic Counseling', 'M.Sc Genetics', 'MBBS with Genetics Specialization'],
        'salary_range': '₹5-18 LPA',
        'job_growth': 'High',
        'courses': ['Genetic Counseling', 'Medical Genetics', 'Risk Assessment', 'Patient Communication in Genetics']
    },
    'Clinical Research Associate': {
        'skills': ['clinical trials', 'gcp compliance', 'data collection', 'regulatory documentation', 'monitoring', 'medical knowledge', 'communication'],
        'interests': ['research', 'medicine', 'science', 'detail orientation', 'helping people'],
        'education': ['B.Pharm', 'B.Sc Life Sciences', 'M.Sc Clinical Research', 'MBBS'],
        'salary_range': '₹4-16 LPA',
        'job_growth': 'Very High',
        'courses': ['Clinical Research Fundamentals', 'GCP Guidelines', 'Clinical Trial Monitoring', 'Regulatory Compliance']
    },

    # ========== PHARMACY & LIFE SCIENCES (10 careers) ==========
    
    'Pharmacologist': {
        'skills': ['pharmacology', 'drug research', 'toxicology', 'laboratory techniques', 'data analysis', 'biochemistry', 'research'],
        'interests': ['science', 'medicine', 'research', 'chemistry', 'discovery'],
        'education': ['B.Pharm', 'M.Pharm', 'PhD Pharmacology'],
        'salary_range': '₹5-20 LPA',
        'job_growth': 'High',
        'courses': ['Pharmacology Research', 'Drug Development', 'Toxicology', 'Preclinical Studies']
    },
    'Biotechnologist': {
        'skills': ['molecular biology', 'genetic engineering', 'laboratory techniques', 'bioprocessing', 'research', 'data analysis', 'cell culture'],
        'interests': ['biology', 'science', 'research', 'innovation', 'discovery'],
        'education': ['B.Tech Biotechnology', 'B.Sc Biotechnology', 'M.Sc Biotechnology', 'PhD'],
        'salary_range': '₹4-18 LPA',
        'job_growth': 'Very High',
        'courses': ['Molecular Biology Techniques', 'Genetic Engineering', 'Bioprocess Technology', 'Cell Culture Methods']
    },
    'Microbiologist': {
        'skills': ['microbiology techniques', 'laboratory research', 'culturing', 'microscopy', 'data analysis', 'infection control', 'biochemistry'],
        'interests': ['biology', 'science', 'research', 'laboratory', 'discovery'],
        'education': ['B.Sc Microbiology', 'M.Sc Microbiology', 'PhD Microbiology'],
        'salary_range': '₹3.5-14 LPA',
        'job_growth': 'High',
        'courses': ['Microbiology Fundamentals', 'Microbial Culturing Techniques', 'Infection Control', 'Applied Microbiology']
    },
    'Geneticist': {
        'skills': ['genetics research', 'molecular biology', 'dna analysis', 'bioinformatics', 'laboratory techniques', 'data interpretation'],
        'interests': ['genetics', 'science', 'research', 'biology', 'discovery'],
        'education': ['B.Sc Genetics', 'M.Sc Genetics', 'PhD Genetics'],
        'salary_range': '₹5-20 LPA',
        'job_growth': 'High',
        'courses': ['Human Genetics', 'Molecular Genetics', 'DNA Sequencing', 'Bioinformatics for Genetics']
    },
    'Biochemist': {
        'skills': ['biochemistry', 'laboratory techniques', 'analytical chemistry', 'enzyme kinetics', 'protein purification', 'research', 'data analysis', 'molecular biology'],
        'interests': ['chemistry', 'biology', 'metabolic processes', 'science', 'research', 'discovery'],
        'education': ['B.Sc Biochemistry', 'M.Sc Biochemistry', 'PhD'],
        'salary_range': '₹4-16 LPA',
        'job_growth': 'High',
        'courses': ['Biochemistry Fundamentals', 'Analytical Chemistry', 'Enzyme Kinetics', 'Protein Purification Techniques', 'Metabolic Biochemistry']
    },
    'Molecular Biologist': {
        'skills': ['molecular biology', 'pcr', 'gene cloning', 'cell biology', 'laboratory research', 'bioinformatics', 'data analysis'],
        'interests': ['biology', 'science', 'research', 'discovery', 'laboratory'],
        'education': ['B.Sc Molecular Biology', 'M.Sc Molecular Biology', 'PhD'],
        'salary_range': '₹5-18 LPA',
        'job_growth': 'High',
        'courses': ['Molecular Biology Techniques', 'PCR & Gene Cloning', 'Cell Biology', 'Genomics']
    },
    'Bioinformatics Scientist': {
        'skills': ['bioinformatics', 'python', 'genomics', 'data analysis', 'statistics', 'molecular biology', 'programming', 'sequence analysis'],
        'interests': ['biology', 'data', 'computing', 'research', 'science'],
        'education': ['B.Tech Bioinformatics', 'M.Sc Bioinformatics', 'PhD'],
        'salary_range': '₹6-24 LPA',
        'job_growth': 'Very High',
        'courses': ['Bioinformatics Tools', 'Genomic Data Analysis', 'Python for Bioinformatics', 'Sequence Alignment Algorithms']
    },
    'Food Technologist': {
        'skills': ['food science', 'food safety', 'quality control', 'product development', 'food chemistry', 'processing techniques', 'regulations'],
        'interests': ['food', 'science', 'quality', 'innovation', 'health'],
        'education': ['B.Tech Food Technology', 'B.Sc Food Science', 'M.Tech Food Technology'],
        'salary_range': '₹3.5-14 LPA',
        'job_growth': 'High',
        'courses': ['Food Science Fundamentals', 'Food Safety & Quality', 'Product Development', 'Food Processing Technology']
    },
    'Toxicologist': {
        'skills': ['toxicology', 'risk assessment', 'laboratory techniques', 'data analysis', 'regulatory compliance', 'biochemistry'],
        'interests': ['science', 'safety', 'research', 'chemistry', 'health'],
        'education': ['B.Sc Toxicology', 'M.Sc Toxicology', 'PhD'],
        'salary_range': '₹5-18 LPA',
        'job_growth': 'Medium',
        'courses': ['Toxicology Fundamentals', 'Risk Assessment Methods', 'Regulatory Toxicology', 'Environmental Toxicology']
    },
    'Immunologist': {
        'skills': ['immunology', 'laboratory techniques', 'immunoassay techniques', 'vaccine development', 'molecular biology', 'research', 'data analysis', 'cell biology'],
        'interests': ['biology', 'immune system', 'science', 'research', 'medicine', 'discovery'],
        'education': ['B.Sc Immunology', 'M.Sc Immunology', 'PhD'],
        'salary_range': '₹5-20 LPA',
        'job_growth': 'High',
        'courses': ['Immunology Fundamentals', 'Immunoassay Techniques', 'Vaccine Research & Development', 'Clinical Immunology']
    },

    # ========== SCIENCE & RESEARCH (8 careers) ==========
    
    'Research Scientist': {
        'skills': ['research methodology', 'data analysis', 'experimentation', 'scientific writing', 'critical thinking', 'statistics', 'domain expertise'],
        'interests': ['research', 'science', 'discovery', 'curiosity', 'innovation'],
        'education': ['M.Sc', 'PhD', 'M.Tech with Research'],
        'salary_range': '₹5-22 LPA',
        'job_growth': 'High',
        'courses': ['Research Methodology', 'Scientific Writing', 'Statistical Analysis', 'Grant Writing']
    },
    'Physicist': {
        'skills': ['physics theory', 'quantum mechanics', 'mathematical modeling', 'experimental design', 'data analysis', 'research', 'laboratory techniques', 'programming'],
        'interests': ['physics', 'quantum phenomena', 'science', 'mathematics', 'research', 'discovery'],
        'education': ['B.Sc Physics', 'M.Sc Physics', 'PhD Physics'],
        'salary_range': '₹4-18 LPA',
        'job_growth': 'Medium',
        'courses': ['Advanced Physics', 'Quantum Mechanics', 'Mathematical Physics', 'Computational Physics', 'Research Methods in Physics']
    },
    'Chemist': {
        'skills': ['chemical analysis', 'laboratory techniques', 'research', 'quality control', 'chemical synthesis', 'data analysis'],
        'interests': ['chemistry', 'science', 'research', 'laboratory', 'discovery'],
        'education': ['B.Sc Chemistry', 'M.Sc Chemistry', 'PhD Chemistry'],
        'salary_range': '₹3.5-15 LPA',
        'job_growth': 'Medium',
        'courses': ['Analytical Chemistry', 'Organic Chemistry', 'Chemical Synthesis', 'Quality Control in Chemistry']
    },
    'Materials Scientist': {
        'skills': ['materials science', 'characterization techniques', 'research', 'data analysis', 'chemistry', 'engineering principles'],
        'interests': ['materials', 'science', 'engineering', 'research', 'innovation'],
        'education': ['B.Tech Materials Science', 'M.Tech', 'M.Sc Materials Science', 'PhD'],
        'salary_range': '₹5-20 LPA',
        'job_growth': 'High',
        'courses': ['Materials Characterization', 'Nanomaterials', 'Materials Engineering', 'Polymer Science']
    },
    'Geologist': {
        'skills': ['geological survey', 'mineral analysis', 'fieldwork', 'gis', 'data interpretation', 'geophysics'],
        'interests': ['earth sciences', 'fieldwork', 'science', 'exploration', 'research'],
        'education': ['B.Sc Geology', 'M.Sc Geology', 'PhD Geology'],
        'salary_range': '₹4-16 LPA',
        'job_growth': 'Medium',
        'courses': ['Physical Geology', 'Geological Mapping', 'GIS for Geology', 'Mineral Exploration']
    },
    'Astronomer': {
        'skills': ['astrophysics', 'celestial observation', 'astronomical data reduction', 'spectroscopy', 'data analysis', 'mathematical modeling', 'research', 'programming', 'telescope operation'],
        'interests': ['space', 'celestial objects', 'science', 'research', 'mathematics', 'discovery', 'curiosity'],
        'education': ['B.Sc Physics', 'M.Sc Astronomy', 'PhD Astrophysics'],
        'salary_range': '₹5-20 LPA',
        'job_growth': 'Low',
        'courses': ['Astrophysics Fundamentals', 'Observational Astronomy', 'Spectroscopy Techniques', 'Astronomical Data Analysis', 'Cosmology']
    },
    'Oceanographer': {
        'skills': ['marine science', 'data collection', 'fieldwork', 'gis', 'research', 'environmental analysis'],
        'interests': ['ocean', 'science', 'environment', 'research', 'exploration'],
        'education': ['B.Sc Oceanography', 'M.Sc Marine Science', 'PhD'],
        'salary_range': '₹4-16 LPA',
        'job_growth': 'Medium',
        'courses': ['Physical Oceanography', 'Marine Ecosystem Studies', 'Ocean Data Analysis', 'Fieldwork Techniques']
    },
    'Research Lab Technician': {
        'skills': ['laboratory techniques', 'sample handling', 'equipment operation', 'data recording', 'safety protocols', 'quality control'],
        'interests': ['laboratory', 'science', 'precision', 'detail orientation', 'research'],
        'education': ['B.Sc any Science', 'Diploma in Lab Technology'],
        'salary_range': '₹2.5-8 LPA',
        'job_growth': 'Medium',
        'courses': ['Laboratory Safety', 'Basic Lab Techniques', 'Equipment Handling', 'Sample Preparation']
    },

    # ========== MATHEMATICS, STATISTICS & ECONOMICS (6 careers) ==========
    
    'Statistician': {
        'skills': ['statistics', 'data analysis', 'r', 'sql', 'probability', 'sampling methods', 'hypothesis testing', 'excel'],
        'interests': ['numbers', 'analysis', 'mathematics', 'data', 'research'],
        'education': ['B.Sc Statistics', 'M.Sc Statistics', 'PhD Statistics'],
        'salary_range': '₹5-18 LPA',
        'job_growth': 'High',
        'courses': ['Applied Statistics', 'R Programming', 'Probability Theory', 'Statistical Modeling']
    },
    'Biostatistician': {
        'skills': ['biostatistics', 'clinical trial design', 'r', 'sas', 'data analysis', 'epidemiology', 'statistics'],
        'interests': ['statistics', 'healthcare', 'research', 'numbers', 'science'],
        'education': ['M.Sc Biostatistics', 'M.Sc Statistics', 'PhD Biostatistics'],
        'salary_range': '₹6-22 LPA',
        'job_growth': 'High',
        'courses': ['Biostatistics', 'Clinical Trial Statistics', 'SAS Programming', 'Survival Analysis']
    },
    'Operations Research Analyst': {
        'skills': ['operations research', 'optimization', 'mathematical modeling', 'statistics', 'python', 'linear programming', 'simulation'],
        'interests': ['mathematics', 'optimization', 'analysis', 'problem solving', 'logic'],
        'education': ['B.Tech', 'M.Sc Statistics', 'MBA Operations', 'M.Sc Mathematics'],
        'salary_range': '₹6-22 LPA',
        'job_growth': 'High',
        'courses': ['Operations Research', 'Optimization Techniques', 'Simulation Modeling', 'Linear & Integer Programming']
    },
    'Quantitative Analyst': {
        'skills': ['quantitative modeling', 'python', 'statistics', 'financial mathematics', 'programming', 'risk modeling', 'algorithms'],
        'interests': ['finance', 'mathematics', 'analysis', 'numbers', 'modeling'],
        'education': ['B.Tech', 'M.Sc Mathematics', 'M.Sc Statistics', 'MBA Finance', 'PhD'],
        'salary_range': '₹10-40 LPA',
        'job_growth': 'High',
        'courses': ['Quantitative Finance', 'Financial Modeling', 'Python for Quant Analysis', 'Derivatives Pricing']
    },
    'Economist': {
        'skills': ['economic analysis', 'econometrics', 'research', 'statistics', 'policy analysis', 'data interpretation', 'report writing'],
        'interests': ['economics', 'policy', 'research', 'numbers', 'analysis'],
        'education': ['B.A Economics', 'M.A Economics', 'PhD Economics'],
        'salary_range': '₹5-20 LPA',
        'job_growth': 'Medium',
        'courses': ['Microeconomics & Macroeconomics', 'Econometrics', 'Economic Policy Analysis', 'Applied Economics']
    },
    'Mathematician': {
        'skills': ['mathematical analysis', 'problem solving', 'abstract reasoning', 'modeling', 'research', 'programming'],
        'interests': ['mathematics', 'logic', 'research', 'problem solving', 'abstract thinking'],
        'education': ['B.Sc Mathematics', 'M.Sc Mathematics', 'PhD Mathematics'],
        'salary_range': '₹4-18 LPA',
        'job_growth': 'Medium',
        'courses': ['Advanced Mathematics', 'Mathematical Modeling', 'Applied Mathematics', 'Research in Pure Mathematics']
    },

    # ========== BANKING, INSURANCE & INVESTMENT (7 careers) ==========
    
    'Bank Branch Manager': {
        'skills': ['banking operations', 'customer relationship management', 'team leadership', 'financial products', 'compliance', 'sales', 'risk management'],
        'interests': ['banking', 'management', 'customer service', 'finance', 'leadership'],
        'education': ['B.Com', 'MBA Finance', 'IIBF Banking Certification'],
        'salary_range': '₹5-18 LPA',
        'job_growth': 'Medium',
        'courses': ['Retail Banking Operations', 'Branch Management', 'Banking Compliance', 'Customer Relationship Management']
    },
    'Loan Officer': {
        'skills': ['credit assessment', 'financial analysis', 'customer service', 'documentation', 'risk evaluation', 'banking regulations'],
        'interests': ['finance', 'banking', 'numbers', 'customer service', 'risk assessment'],
        'education': ['B.Com', 'BBA', 'MBA Finance'],
        'salary_range': '₹3-10 LPA',
        'job_growth': 'Medium',
        'courses': ['Credit Analysis', 'Loan Processing', 'Banking Regulations', 'Risk Assessment for Lending']
    },
    'Insurance Underwriter': {
        'skills': ['risk assessment', 'actuarial basics', 'policy evaluation', 'data analysis', 'financial analysis', 'regulations'],
        'interests': ['insurance', 'finance', 'risk assessment', 'numbers', 'analysis'],
        'education': ['B.Com', 'BBA', 'Insurance Certification', 'MBA'],
        'salary_range': '₹4-14 LPA',
        'job_growth': 'Medium',
        'courses': ['Insurance Underwriting', 'Risk Assessment', 'Insurance Regulations', 'Policy Analysis']
    },
    'Insurance Agent': {
        'skills': ['sales', 'customer relationship management', 'insurance products knowledge', 'policy underwriting basics', 'claims process knowledge', 'communication', 'negotiation', 'financial planning basics'],
        'interests': ['sales', 'insurance', 'risk protection', 'customer service', 'communication', 'finance'],
        'education': ['12th Pass/Any Graduate', 'IRDA Certification'],
        'salary_range': '₹2.5-10 LPA',
        'job_growth': 'Medium',
        'courses': ['Insurance Products', 'Policy Underwriting Basics', 'Claims Processing', 'IRDA Certification Prep', 'Customer Relationship Management']
    },
    'Company Secretary': {
        'skills': ['corporate law', 'compliance', 'corporate governance', 'documentation', 'regulatory filings', 'communication'],
        'interests': ['law', 'corporate', 'compliance', 'governance', 'detail orientation'],
        'education': ['CS (Company Secretary)', 'B.Com with CS', 'LLB with CS'],
        'salary_range': '₹5-18 LPA',
        'job_growth': 'Medium',
        'courses': ['Company Law', 'Corporate Governance', 'Secretarial Compliance', 'Regulatory Filings']
    },
    'Wealth Manager': {
        'skills': ['financial planning', 'investment advisory', 'client relationship management', 'portfolio management', 'tax planning', 'communication'],
        'interests': ['finance', 'investment', 'client service', 'numbers', 'advisory'],
        'education': ['B.Com', 'MBA Finance', 'CFP Certification', 'CFA'],
        'salary_range': '₹6-25 LPA',
        'job_growth': 'High',
        'courses': ['Wealth Management', 'Investment Advisory', 'Financial Planning', 'Estate & Tax Planning']
    },
    'Venture Capital Analyst': {
        'skills': ['financial modeling', 'market research', 'due diligence', 'startup evaluation', 'valuation', 'communication', 'startup ecosystem networking'],
        'interests': ['finance', 'startups', 'investment', 'innovation', 'analysis'],
        'education': ['MBA Finance', 'B.Com', 'CFA', 'Engineering with MBA'],
        'salary_range': '₹8-30 LPA',
        'job_growth': 'High',
        'courses': ['Venture Capital Fundamentals', 'Startup Valuation', 'Due Diligence', 'Financial Modeling for VC']
    },

    # ========== HUMAN RESOURCES — ADDITIONAL SPECIALIZATIONS (5 careers) ==========
    
    'Talent Acquisition Specialist': {
        'skills': ['recruitment', 'sourcing', 'interviewing', 'applicant tracking systems', 'employer branding', 'communication', 'negotiation'],
        'interests': ['people', 'hiring', 'communication', 'human resources', 'networking'],
        'education': ['BBA', 'MBA HR', 'PG Diploma in HR'],
        'salary_range': '₹4-14 LPA',
        'job_growth': 'High',
        'courses': ['Talent Acquisition', 'Recruitment Strategy', 'ATS Tools', 'Employer Branding']
    },
    'Learning & Development Manager': {
        'skills': ['training design', 'needs assessment', 'facilitation', 'e-learning', 'performance management', 'communication', 'curriculum design'],
        'interests': ['training', 'education', 'human resources', 'communication', 'development'],
        'education': ['MBA HR', 'PG Diploma in Training & Development', 'M.A Psychology'],
        'salary_range': '₹6-20 LPA',
        'job_growth': 'High',
        'courses': ['Learning & Development Strategy', 'Instructional Design', 'Training Facilitation', 'E-Learning Platforms']
    },
    'Compensation & Benefits Analyst': {
        'skills': ['compensation analysis', 'payroll', 'benefits administration', 'market benchmarking', 'excel', 'data analysis', 'compliance'],
        'interests': ['human resources', 'numbers', 'analysis', 'policy', 'finance'],
        'education': ['MBA HR', 'B.Com', 'PG Diploma in HR'],
        'salary_range': '₹5-16 LPA',
        'job_growth': 'Medium',
        'courses': ['Compensation & Benefits Design', 'Payroll Management', 'Salary Benchmarking', 'HR Compliance']
    },
    'HR Business Partner': {
        'skills': ['strategic hr', 'stakeholder management', 'employee relations', 'organizational development', 'communication', 'conflict resolution'],
        'interests': ['human resources', 'strategy', 'people', 'leadership', 'communication'],
        'education': ['MBA HR', 'PG Diploma in HR', 'M.A Psychology'],
        'salary_range': '₹8-25 LPA',
        'job_growth': 'High',
        'courses': ['Strategic HR Management', 'Organizational Development', 'Employee Relations', 'Change Management']
    },
    'Employee Relations Specialist': {
        'skills': ['conflict resolution', 'labor law', 'policy development', 'communication', 'employee engagement', 'investigation', 'mediation'],
        'interests': ['human resources', 'people', 'policy', 'communication', 'fairness'],
        'education': ['MBA HR', 'LLB', 'PG Diploma in HR'],
        'salary_range': '₹4-15 LPA',
        'job_growth': 'Medium',
        'courses': ['Employee Relations', 'Labor Law Fundamentals', 'Conflict Resolution', 'Workplace Investigations']
    },

    # ========== OPERATIONS, SUPPLY CHAIN & MANUFACTURING (7 careers) ==========
    
    'Logistics Manager': {
        'skills': ['logistics planning', 'transportation management', 'inventory management', 'vendor coordination', 'supply chain', 'cost optimization'],
        'interests': ['logistics', 'operations', 'planning', 'efficiency', 'management'],
        'education': ['BBA', 'MBA Supply Chain', 'B.Tech', 'Diploma in Logistics'],
        'salary_range': '₹5-18 LPA',
        'job_growth': 'High',
        'courses': ['Logistics Management', 'Transportation Planning', 'Warehouse Operations', 'Supply Chain Fundamentals']
    },
    'Procurement Specialist': {
        'skills': ['procurement', 'vendor management', 'negotiation', 'contract management', 'cost analysis', 'supply chain', 'sourcing'],
        'interests': ['procurement', 'negotiation', 'operations', 'finance', 'supply chain'],
        'education': ['BBA', 'MBA Supply Chain', 'B.Com', 'B.Tech'],
        'salary_range': '₹4-15 LPA',
        'job_growth': 'High',
        'courses': ['Strategic Procurement', 'Vendor Management', 'Contract Negotiation', 'Sourcing Strategy']
    },
    'Warehouse Manager': {
        'skills': ['inventory management', 'warehouse operations', 'logistics', 'team leadership', 'safety compliance', 'wms software'],
        'interests': ['operations', 'logistics', 'management', 'organization', 'efficiency'],
        'education': ['BBA', 'B.Tech', 'Diploma in Logistics & Supply Chain'],
        'salary_range': '₹4-14 LPA',
        'job_growth': 'Medium',
        'courses': ['Warehouse Management Systems', 'Inventory Control', 'Warehouse Safety', 'Logistics Operations']
    },
    'Supply Chain Analyst': {
        'skills': ['data analysis', 'supply chain optimization', 'excel', 'demand forecasting', 'erp systems', 'sql', 'reporting'],
        'interests': ['supply chain', 'analysis', 'data', 'operations', 'numbers'],
        'education': ['BBA', 'B.Tech', 'MBA Supply Chain', 'B.Sc Statistics'],
        'salary_range': '₹5-16 LPA',
        'job_growth': 'High',
        'courses': ['Supply Chain Analytics', 'Demand Forecasting', 'ERP Systems', 'Data-Driven Supply Chain']
    },
    'Production Manager': {
        'skills': ['production planning', 'team management', 'quality control', 'process improvement', 'manufacturing', 'cost control', 'safety compliance'],
        'interests': ['production', 'management', 'manufacturing', 'leadership', 'efficiency'],
        'education': ['B.Tech Mechanical', 'B.Tech Production', 'MBA Operations'],
        'salary_range': '₹6-20 LPA',
        'job_growth': 'Medium',
        'courses': ['Production Management', 'Lean Manufacturing', 'Quality Systems', 'Team Leadership in Manufacturing']
    },
    'Quality Control Engineer': {
        'skills': ['quality control', 'inspection techniques', 'quality standards', 'statistical process control', 'documentation', 'root cause analysis'],
        'interests': ['quality', 'manufacturing', 'precision', 'engineering', 'detail orientation'],
        'education': ['B.Tech', 'B.E', 'Diploma in Engineering', 'Six Sigma Certification'],
        'salary_range': '₹3.5-14 LPA',
        'job_growth': 'Medium',
        'courses': ['Quality Control Systems', 'Statistical Process Control', 'ISO Standards', 'Root Cause Analysis']
    },
    'Plant Manager': {
        'skills': ['plant operations', 'team leadership', 'production planning', 'safety management', 'cost control', 'process improvement', 'compliance'],
        'interests': ['manufacturing', 'management', 'leadership', 'operations', 'efficiency'],
        'education': ['B.Tech', 'MBA Operations', 'M.Tech Industrial Engineering'],
        'salary_range': '₹10-30 LPA',
        'job_growth': 'Medium',
        'courses': ['Plant Operations Management', 'Manufacturing Leadership', 'Safety & Compliance', 'Cost & Resource Optimization']
    },

    # ========== REAL ESTATE (4 careers) ==========
    
    'Real Estate Agent': {
        'skills': ['sales', 'negotiation', 'market knowledge', 'customer relationship management', 'property valuation basics', 'property listing management', 'site visits and inspections', 'communication'],
        'interests': ['real estate', 'sales', 'property showcasing', 'communication', 'negotiation', 'property'],
        'education': ['12th Pass/Any Graduate', 'Real Estate/RERA Certification', 'BBA'],
        'salary_range': '₹2.5-15 LPA',
        'job_growth': 'Medium',
        'courses': ['Real Estate Sales', 'Property Listing & Marketing', 'Site Inspection Fundamentals', 'RERA Regulations', 'Client Relationship Management']
    },
    'Property Manager': {
        'skills': ['property management', 'tenant relations', 'maintenance coordination', 'budgeting', 'lease administration', 'communication'],
        'interests': ['real estate', 'management', 'organization', 'customer service', 'property'],
        'education': ['BBA', 'Diploma in Real Estate Management'],
        'salary_range': '₹3.5-14 LPA',
        'job_growth': 'Medium',
        'courses': ['Property Management Fundamentals', 'Lease Administration', 'Facility Maintenance', 'Tenant Relations']
    },
    'Real Estate Developer': {
        'skills': ['project development', 'market analysis', 'financial planning', 'negotiation', 'regulatory knowledge', 'construction coordination'],
        'interests': ['real estate', 'business', 'construction', 'planning', 'investment'],
        'education': ['MBA Real Estate', 'B.Tech Civil', 'B.Arch', 'BBA'],
        'salary_range': '₹8-35 LPA',
        'job_growth': 'Medium',
        'courses': ['Real Estate Development', 'Project Feasibility Analysis', 'Real Estate Finance', 'RERA & Land Regulations']
    },
    'Real Estate Analyst': {
        'skills': ['market research', 'financial modeling', 'valuation', 'data analysis', 'excel', 'investment analysis'],
        'interests': ['real estate', 'finance', 'analysis', 'numbers', 'investment'],
        'education': ['MBA Finance', 'B.Com', 'B.Tech with Real Estate Specialization'],
        'salary_range': '₹5-18 LPA',
        'job_growth': 'Medium',
        'courses': ['Real Estate Valuation', 'Real Estate Financial Modeling', 'Market Research', 'Investment Analysis']
    },

    # ========== PUBLIC ADMINISTRATION & GOVERNMENT (6 careers) ==========
    
    'Civil Services Officer': {
        'skills': ['public administration', 'policy implementation', 'governance', 'leadership', 'communication', 'decision making', 'general knowledge'],
        'interests': ['governance', 'public service', 'leadership', 'policy', 'administration'],
        'education': ['Any Graduate', 'UPSC/State PSC Qualified'],
        'salary_range': '₹6-25 LPA',
        'job_growth': 'Medium',
        'courses': ['Public Administration', 'Governance & Policy', 'Indian Polity & Constitution', 'Administrative Law']
    },
    'Police Officer': {
        'skills': ['law enforcement', 'investigation', 'crime prevention', 'physical fitness', 'discipline', 'decision making', 'public safety', 'crisis management'],
        'interests': ['law enforcement', 'public service', 'justice', 'security', 'discipline', 'protecting people'],
        'education': ['Any Graduate (12th Pass for Constable)', 'SSC CGL/State PSC Qualified', 'Police Academy Training'],
        'salary_range': '₹4-18 LPA',
        'job_growth': 'Medium',
        'courses': ['Criminal Law', 'Forensic Investigation Basics', 'Physical Training', 'Public Safety Management', 'Indian Penal Code']
    },
    'Foreign Service Officer': {
        'skills': ['diplomacy', 'international relations', 'negotiation', 'communication', 'cross-cultural understanding', 'policy analysis'],
        'interests': ['diplomacy', 'international affairs', 'policy', 'communication', 'governance'],
        'education': ['Any Graduate', 'UPSC Qualified', 'M.A International Relations'],
        'salary_range': '₹8-25 LPA',
        'job_growth': 'Medium',
        'courses': ['Diplomacy & International Relations', 'Foreign Policy Analysis', 'Negotiation Skills', 'International Law Basics']
    },
    'Public Policy Analyst': {
        'skills': ['policy research', 'data analysis', 'report writing', 'stakeholder engagement', 'economics', 'public administration'],
        'interests': ['policy', 'research', 'governance', 'analysis', 'public service'],
        'education': ['M.A Public Policy', 'MPA', 'Economics'],
        'salary_range': '₹5-18 LPA',
        'job_growth': 'High',
        'courses': ['Public Policy Analysis', 'Policy Research Methods', 'Government Budgeting', 'Stakeholder Engagement']
    },
    'Municipal Administrator': {
        'skills': ['municipal governance', 'public administration', 'budgeting', 'urban services management', 'leadership', 'compliance'],
        'interests': ['governance', 'cities', 'administration', 'public service', 'management'],
        'education': ['MPA', 'Urban Management/Planning Degree', 'UPSC/State PSC Qualified'],
        'salary_range': '₹5-16 LPA',
        'job_growth': 'Medium',
        'courses': ['Municipal Governance', 'Urban Services Management', 'Public Budgeting', 'Civic Administration']
    },
    'Government Program Manager': {
        'skills': ['program management', 'policy implementation', 'stakeholder coordination', 'budgeting', 'monitoring and evaluation', 'communication'],
        'interests': ['governance', 'public service', 'management', 'policy', 'impact'],
        'education': ['MBA', 'MPA', 'M.A Public Policy'],
        'salary_range': '₹6-20 LPA',
        'job_growth': 'Medium',
        'courses': ['Public Program Management', 'Monitoring & Evaluation', 'Government Budgeting', 'Stakeholder Coordination']
    },

    # ========== PSYCHOLOGY, SOCIAL SCIENCES & COUNSELING (8 careers) ==========
    
    'Industrial-Organizational Psychologist': {
        'skills': ['organizational behavior', 'psychometrics', 'employee assessment', 'research methods', 'data analysis', 'consulting'],
        'interests': ['psychology', 'workplace', 'research', 'human behavior', 'organizations'],
        'education': ['M.A Psychology', 'M.Sc I-O Psychology', 'PhD'],
        'salary_range': '₹6-22 LPA',
        'job_growth': 'High',
        'courses': ['Organizational Psychology', 'Psychometric Assessment', 'Employee Engagement Research', 'Workplace Behavior Analysis']
    },
    'School Counselor': {
        'skills': ['counseling', 'student assessment', 'communication', 'career guidance', 'conflict resolution', 'empathy'],
        'interests': ['counseling', 'education', 'helping people', 'psychology', 'youth development'],
        'education': ['M.A Psychology', 'M.Ed Counseling', 'B.Ed with Counseling Specialization'],
        'salary_range': '₹3-10 LPA',
        'job_growth': 'Medium',
        'courses': ['School Counseling', 'Student Career Guidance', 'Adolescent Psychology', 'Conflict Resolution in Schools']
    },
    'Social Worker': {
        'skills': ['case management', 'counseling', 'community outreach', 'advocacy', 'communication', 'empathy', 'documentation'],
        'interests': ['helping people', 'community', 'social justice', 'counseling', 'advocacy'],
        'education': ['BSW', 'MSW'],
        'salary_range': '₹2.5-9 LPA',
        'job_growth': 'Medium',
        'courses': ['Social Work Practice', 'Case Management', 'Community Development', 'Counseling Skills for Social Workers']
    },
    'Sociologist': {
        'skills': ['social research', 'qualitative analysis', 'quantitative analysis', 'survey design', 'report writing', 'critical thinking'],
        'interests': ['society', 'research', 'social sciences', 'analysis', 'human behavior'],
        'education': ['B.A Sociology', 'M.A Sociology', 'PhD Sociology'],
        'salary_range': '₹3.5-14 LPA',
        'job_growth': 'Medium',
        'courses': ['Social Research Methods', 'Survey Design', 'Sociological Theory', 'Data Analysis in Social Sciences']
    },
    'Political Scientist': {
        'skills': ['political analysis', 'research', 'policy analysis', 'writing', 'critical thinking', 'public affairs'],
        'interests': ['politics', 'policy', 'research', 'governance', 'current affairs'],
        'education': ['B.A Political Science', 'M.A Political Science', 'PhD'],
        'salary_range': '₹4-15 LPA',
        'job_growth': 'Medium',
        'courses': ['Political Theory', 'Comparative Politics', 'Public Policy Analysis', 'Political Research Methods']
    },
    'International Relations Specialist': {
        'skills': ['international affairs', 'policy analysis', 'research', 'cross-cultural communication', 'negotiation', 'writing'],
        'interests': ['diplomacy', 'global affairs', 'policy', 'research', 'communication'],
        'education': ['B.A International Relations', 'M.A International Relations', 'M.A Political Science'],
        'salary_range': '₹4-16 LPA',
        'job_growth': 'Medium',
        'courses': ['International Relations Theory', 'Global Affairs Analysis', 'Diplomacy Fundamentals', 'International Political Economy']
    },
    'Counseling Psychologist': {
        'skills': ['therapy techniques', 'patient assessment', 'active listening', 'empathy', 'communication', 'case documentation'],
        'interests': ['psychology', 'helping people', 'counseling', 'mental health', 'care'],
        'education': ['M.A Psychology', 'M.Phil Clinical Psychology', 'PhD'],
        'salary_range': '₹4-16 LPA',
        'job_growth': 'Very High',
        'courses': ['Counseling Techniques', 'Psychological Assessment', 'Therapy Modalities', 'Ethics in Counseling']
    },
    'Career Counselor': {
        'skills': ['career assessment', 'counseling', 'communication', 'labor market knowledge', 'psychometric testing', 'empathy'],
        'interests': ['counseling', 'careers', 'helping people', 'education', 'guidance'],
        'education': ['M.A Psychology', 'PG Diploma in Career Counseling'],
        'salary_range': '₹3-10 LPA',
        'job_growth': 'High',
        'courses': ['Career Counseling Techniques', 'Psychometric Assessment Tools', 'Labor Market Trends', 'Student Guidance']
    },

    # ========== LANGUAGES & COMMUNICATION (4 careers) ==========
    
    'Translator': {
        'skills': ['language proficiency', 'translation', 'writing', 'cultural knowledge', 'attention to detail', 'research'],
        'interests': ['languages', 'writing', 'culture', 'communication', 'linguistics'],
        'education': ['B.A Languages/Linguistics', 'Diploma in Translation'],
        'salary_range': '₹2.5-10 LPA',
        'job_growth': 'Medium',
        'courses': ['Translation Techniques', 'Language Proficiency Certification', 'Localization Basics', 'Technical Translation']
    },
    'Interpreter': {
        'skills': ['language proficiency', 'simultaneous interpretation', 'listening skills', 'cultural knowledge', 'communication', 'quick thinking'],
        'interests': ['languages', 'communication', 'culture', 'public speaking', 'linguistics'],
        'education': ['B.A Languages', 'Interpretation Certification (Conference/Sign Language)'],
        'salary_range': '₹3-12 LPA',
        'job_growth': 'Medium',
        'courses': ['Simultaneous Interpretation', 'Consecutive Interpretation', 'Language Fluency Training', 'Professional Interpreting Ethics']
    },
    'Linguist': {
        'skills': ['linguistic analysis', 'research', 'phonetics', 'syntax analysis', 'language documentation', 'writing'],
        'interests': ['languages', 'research', 'linguistics', 'analysis', 'culture'],
        'education': ['B.A Linguistics', 'M.A Linguistics', 'PhD Linguistics'],
        'salary_range': '₹4-15 LPA',
        'job_growth': 'Low',
        'courses': ['Theoretical Linguistics', 'Computational Linguistics', 'Phonetics & Phonology', 'Language Documentation']
    },
    'Content Localization Specialist': {
        'skills': ['translation', 'cultural adaptation', 'content management', 'quality assurance', 'project coordination', 'language proficiency'],
        'interests': ['languages', 'content', 'culture', 'communication', 'media'],
        'education': ['B.A Languages', 'Localization/Translation Certification'],
        'salary_range': '₹3.5-13 LPA',
        'job_growth': 'High',
        'courses': ['Content Localization', 'Translation Quality Assurance', 'CAT Tools', 'Cross-Cultural Content Adaptation']
    },

    # ========== FASHION, TEXTILES & PERFORMING ARTS (10 careers) ==========
    
    'Fashion Stylist': {
        'skills': ['styling', 'fashion trends', 'wardrobe planning', 'creativity', 'communication', 'color theory', 'client management'],
        'interests': ['fashion', 'creativity', 'style', 'aesthetics', 'trends'],
        'education': ['Fashion Design Diploma', 'B.Des Fashion', 'Styling Certification'],
        'salary_range': '₹3-15 LPA',
        'job_growth': 'Medium',
        'courses': ['Fashion Styling', 'Trend Forecasting', 'Wardrobe Consulting', 'Color Theory for Stylists']
    },
    'Fashion Merchandiser': {
        'skills': ['merchandising', 'trend analysis', 'inventory planning', 'retail knowledge', 'vendor coordination', 'sales analysis'],
        'interests': ['fashion', 'retail', 'business', 'trends', 'planning'],
        'education': ['B.Des Fashion', 'BBA Retail', 'Fashion Merchandising Diploma'],
        'salary_range': '₹3.5-14 LPA',
        'job_growth': 'Medium',
        'courses': ['Fashion Merchandising', 'Retail Buying', 'Trend Forecasting', 'Inventory Planning']
    },
    'Textile Designer': {
        'skills': ['textile design', 'pattern making', 'fabric knowledge', 'cad for textiles', 'color theory', 'creativity'],
        'interests': ['textiles', 'design', 'creativity', 'fashion', 'art'],
        'education': ['B.Des Textile Design', 'Diploma in Textile Design'],
        'salary_range': '₹3-12 LPA',
        'job_growth': 'Medium',
        'courses': ['Textile Design Fundamentals', 'Pattern & Print Design', 'CAD for Textiles', 'Fabric Technology']
    },
    'Musician': {
        'skills': ['music performance', 'instrument proficiency', 'music theory', 'composition', 'creativity', 'stage presence'],
        'interests': ['music', 'performance', 'creativity', 'art', 'entertainment'],
        'education': ['B.A Music', 'Diploma in Music', 'Self-taught with Professional Training'],
        'salary_range': '₹2-20 LPA',
        'job_growth': 'Medium',
        'courses': ['Music Theory', 'Instrument Mastery', 'Music Composition', 'Live Performance Skills']
    },
    'Music Producer': {
        'skills': ['music production', 'audio engineering', 'daw software', 'sound mixing', 'creativity', 'composition'],
        'interests': ['music', 'production', 'technology', 'creativity', 'sound'],
        'education': ['Diploma in Music Production', 'B.A Music Technology', 'Self-taught'],
        'salary_range': '₹3-20 LPA',
        'job_growth': 'High',
        'courses': ['Music Production Fundamentals', 'DAW Software (Ableton/FL Studio)', 'Audio Mixing & Mastering', 'Sound Design']
    },
    'Choreographer': {
        'skills': ['dance technique', 'choreography', 'creativity', 'team direction', 'music interpretation', 'performance'],
        'interests': ['dance', 'performance', 'creativity', 'art', 'entertainment'],
        'education': ['B.A Dance', 'Diploma in Choreography', 'Professional Dance Training'],
        'salary_range': '₹2.5-15 LPA',
        'job_growth': 'Medium',
        'courses': ['Choreography Techniques', 'Dance Styles Mastery', 'Performance Direction', 'Music & Movement Interpretation']
    },
    'Dancer': {
        'skills': ['dance technique', 'performance', 'flexibility', 'rhythm', 'stage presence', 'discipline'],
        'interests': ['dance', 'performance', 'art', 'creativity', 'entertainment'],
        'education': ['B.A Dance', 'Professional Dance Training', 'Diploma in Performing Arts'],
        'salary_range': '₹2-12 LPA',
        'job_growth': 'Medium',
        'courses': ['Classical/Contemporary Dance Training', 'Performance Techniques', 'Choreography Basics', 'Stage Presence']
    },
    'Theatre Director': {
        'skills': ['direction', 'script analysis', 'actor coaching', 'creative vision', 'production management', 'communication'],
        'interests': ['theatre', 'performance', 'creativity', 'storytelling', 'art'],
        'education': ['B.A Theatre', 'Diploma in Direction', 'National School of Drama'],
        'salary_range': '₹3-15 LPA',
        'job_growth': 'Low',
        'courses': ['Theatre Direction', 'Script Analysis', 'Actor Coaching', 'Stage Production Management']
    },
    'Film Editor': {
        'skills': ['video editing software', 'storytelling', 'color grading', 'sound editing', 'creativity', 'attention to detail'],
        'interests': ['film', 'editing', 'creativity', 'storytelling', 'media'],
        'education': ['Diploma in Film Editing', 'B.A Mass Communication', 'Film Institute Training'],
        'salary_range': '₹3-16 LPA',
        'job_growth': 'High',
        'courses': ['Film Editing (Premiere Pro/DaVinci Resolve)', 'Color Grading', 'Sound Editing', 'Narrative Structure']
    },
    'Casting Director': {
        'skills': ['talent scouting', 'auditions management', 'industry connections', 'communication', 'judgment of talent', 'negotiation'],
        'interests': ['film', 'talent', 'entertainment', 'industry connections', 'creativity'],
        'education': ['B.A Mass Communication', 'Film Institute Training'],
        'salary_range': '₹3-15 LPA',
        'job_growth': 'Medium',
        'courses': ['Casting Process Fundamentals', 'Talent Evaluation', 'Audition Management', 'Industry Networking']
    },

    # ========== FOOD INDUSTRY (4 careers) ==========
    
    'Baker/Pastry Chef': {
        'skills': ['baking techniques', 'pastry making', 'recipe development', 'food presentation', 'creativity', 'kitchen management'],
        'interests': ['food', 'cooking', 'creativity', 'baking', 'culinary arts'],
        'education': ['Diploma in Baking & Pastry', 'Culinary Institute Certification'],
        'salary_range': '₹2.5-12 LPA',
        'job_growth': 'Medium',
        'courses': ['Baking Fundamentals', 'Pastry Arts', 'Cake Decoration', 'Bakery Management']
    },
    'Food Scientist': {
        'skills': ['food chemistry', 'product development', 'quality assurance', 'food safety', 'research', 'sensory analysis'],
        'interests': ['food', 'science', 'innovation', 'research', 'quality'],
        'education': ['B.Sc Food Science', 'B.Tech Food Technology', 'M.Sc Food Science'],
        'salary_range': '₹4-16 LPA',
        'job_growth': 'High',
        'courses': ['Food Chemistry', 'New Product Development', 'Food Safety Standards', 'Sensory Evaluation']
    },
    'Restaurant Manager': {
        'skills': ['operations management', 'customer service', 'staff management', 'inventory control', 'budgeting', 'food safety'],
        'interests': ['hospitality', 'food', 'management', 'customer service', 'operations'],
        'education': ['Hotel Management Diploma/Degree', 'BBA Hospitality'],
        'salary_range': '₹3-14 LPA',
        'job_growth': 'Medium',
        'courses': ['Restaurant Operations Management', 'Food & Beverage Service', 'Staff Training', 'Hospitality Financial Management']
    },
    'Culinary Instructor': {
        'skills': ['culinary techniques', 'teaching', 'recipe development', 'food safety', 'communication', 'curriculum design'],
        'interests': ['food', 'teaching', 'cooking', 'education', 'creativity'],
        'education': ['Culinary Institute Degree', 'Diploma in Culinary Arts with Teaching Experience'],
        'salary_range': '₹3-12 LPA',
        'job_growth': 'Medium',
        'courses': ['Culinary Arts Mastery', 'Teaching Methodology', 'Recipe Development', 'Kitchen Safety Standards']
    },

    # ========== RENEWABLE ENERGY & ENVIRONMENTAL SCIENCE (5 careers) ==========
    
    'Solar Energy Engineer': {
        'skills': ['solar pv design', 'electrical engineering', 'energy auditing', 'project management', 'renewable energy systems', 'autocad'],
        'interests': ['renewable energy', 'sustainability', 'engineering', 'innovation', 'environment'],
        'education': ['B.Tech Electrical', 'B.Tech Renewable Energy', 'M.Tech Solar Energy'],
        'salary_range': '₹4-16 LPA',
        'job_growth': 'Very High',
        'courses': ['Solar PV System Design', 'Energy Auditing', 'Renewable Energy Project Management', 'Grid Integration']
    },
    'Wind Energy Engineer': {
        'skills': ['wind turbine technology', 'mechanical engineering', 'electrical systems', 'project management', 'renewable energy', 'maintenance'],
        'interests': ['renewable energy', 'engineering', 'sustainability', 'innovation', 'environment'],
        'education': ['B.Tech Mechanical', 'B.Tech Electrical', 'M.Tech Renewable Energy'],
        'salary_range': '₹4-16 LPA',
        'job_growth': 'High',
        'courses': ['Wind Turbine Technology', 'Wind Farm Operations', 'Renewable Energy Systems', 'Maintenance & Reliability']
    },
    'Energy Analyst': {
        'skills': ['energy market analysis', 'data analysis', 'forecasting', 'sustainability reporting', 'excel', 'policy knowledge'],
        'interests': ['energy', 'analysis', 'sustainability', 'numbers', 'policy'],
        'education': ['B.Tech', 'M.Sc Energy Studies', 'MBA Energy Management'],
        'salary_range': '₹5-18 LPA',
        'job_growth': 'High',
        'courses': ['Energy Market Analysis', 'Energy Policy', 'Sustainability Reporting', 'Energy Forecasting']
    },
    'Environmental Scientist': {
        'skills': ['environmental research', 'data collection', 'fieldwork', 'gis', 'environmental regulations', 'report writing'],
        'interests': ['environment', 'science', 'sustainability', 'research', 'nature'],
        'education': ['B.Sc Environmental Science', 'M.Sc Environmental Science', 'PhD'],
        'salary_range': '₹3.5-14 LPA',
        'job_growth': 'High',
        'courses': ['Environmental Science Fundamentals', 'Environmental Impact Assessment', 'GIS for Environment', 'Environmental Regulations']
    },
    'Climate Change Analyst': {
        'skills': ['climate data analysis', 'policy analysis', 'gis', 'sustainability', 'research', 'report writing', 'modeling'],
        'interests': ['climate', 'environment', 'policy', 'research', 'sustainability'],
        'education': ['M.Sc Environmental Science', 'M.A Climate Studies', 'B.Tech with Environmental Specialization'],
        'salary_range': '₹5-18 LPA',
        'job_growth': 'Very High',
        'courses': ['Climate Science Fundamentals', 'Climate Policy Analysis', 'Carbon Accounting', 'Climate Risk Modeling']
    },

    # ========== AGRICULTURE & FOOD — ADDITIONAL ROLES (5 careers) ==========
    
    'Agronomist': {
        'skills': ['crop science', 'soil management', 'pest management', 'fieldwork', 'data analysis', 'sustainable farming'],
        'interests': ['agriculture', 'science', 'farming', 'nature', 'sustainability'],
        'education': ['B.Sc Agriculture', 'M.Sc Agronomy'],
        'salary_range': '₹3-12 LPA',
        'job_growth': 'Medium',
        'courses': ['Crop Science', 'Soil Fertility Management', 'Integrated Pest Management', 'Precision Agriculture']
    },
    'Dairy Technologist': {
        'skills': ['dairy processing', 'food safety', 'quality control', 'dairy chemistry', 'production management'],
        'interests': ['food', 'agriculture', 'science', 'quality', 'production'],
        'education': ['B.Tech Dairy Technology', 'B.Sc Dairy Science', 'M.Tech Dairy Technology'],
        'salary_range': '₹3-12 LPA',
        'job_growth': 'Medium',
        'courses': ['Dairy Processing Technology', 'Dairy Quality Control', 'Dairy Chemistry', 'Dairy Plant Management']
    },
    'Fisheries Officer': {
        'skills': ['aquaculture management', 'fisheries science', 'fieldwork', 'water quality management', 'regulations', 'sustainability'],
        'interests': ['fisheries', 'agriculture', 'nature', 'science', 'sustainability'],
        'education': ['B.F.Sc Fisheries Science', 'M.F.Sc'],
        'salary_range': '₹3-10 LPA',
        'job_growth': 'Medium',
        'courses': ['Fisheries Science', 'Aquaculture Management', 'Water Quality Management', 'Fisheries Policy']
    },
    'Poultry Farm Manager': {
        'skills': ['poultry management', 'animal husbandry', 'farm operations', 'biosecurity', 'feed management', 'team supervision'],
        'interests': ['agriculture', 'animals', 'farming', 'management', 'operations'],
        'education': ['B.Sc Agriculture', 'B.V.Sc', 'Diploma in Poultry Management'],
        'salary_range': '₹2.5-9 LPA',
        'job_growth': 'Medium',
        'courses': ['Poultry Farm Management', 'Animal Husbandry', 'Biosecurity Practices', 'Feed Formulation']
    },
    'Food Safety Officer': {
        'skills': ['food safety regulations', 'quality audits', 'hygiene standards', 'documentation', 'inspection', 'haccp'],
        'interests': ['food', 'safety', 'regulations', 'quality', 'health'],
        'education': ['B.Sc Food Science', 'B.Tech Food Technology', 'Food Safety Certification'],
        'salary_range': '₹3-12 LPA',
        'job_growth': 'High',
        'courses': ['Food Safety & HACCP', 'Regulatory Compliance in Food Industry', 'Quality Audits', 'Hygiene Standards']
    },

    # ========== AVIATION & MARITIME (5 careers) ==========
    
    'Commercial Pilot': {
        'skills': ['flying skills', 'navigation', 'aviation regulations', 'decision making', 'communication', 'situational awareness'],
        'interests': ['aviation', 'flying', 'travel', 'precision', 'adventure'],
        'education': ['Commercial Pilot License (CPL)', 'Aviation Degree with CPL'],
        'salary_range': '₹8-40 LPA',
        'job_growth': 'High',
        'courses': ['Commercial Pilot Training', 'Aviation Regulations (DGCA)', 'Instrument Flying', 'Crew Resource Management']
    },
    'Air Traffic Controller': {
        'skills': ['air traffic management', 'radar operations', 'communication', 'decision making', 'situational awareness', 'regulations'],
        'interests': ['aviation', 'precision', 'safety', 'communication', 'systems'],
        'education': ['B.Sc (Physics/Math)', 'B.Tech', 'AAI ATC Training Institute'],
        'salary_range': '₹6-20 LPA',
        'job_growth': 'Medium',
        'courses': ['Air Traffic Control Procedures', 'Radar & Navigation Systems', 'Aviation Communication Protocols', 'Airspace Management']
    },
    'Aircraft Maintenance Engineer': {
        'skills': ['aircraft systems', 'maintenance procedures', 'troubleshooting', 'safety regulations', 'technical documentation', 'mechanical skills'],
        'interests': ['aviation', 'engineering', 'machinery', 'precision', 'safety'],
        'education': ['B.Tech Aeronautical', 'AME License (DGCA)', 'Diploma in Aircraft Maintenance'],
        'salary_range': '₹4-18 LPA',
        'job_growth': 'High',
        'courses': ['Aircraft Maintenance Engineering', 'Aviation Safety Regulations', 'Aircraft Systems', 'AME License Preparation']
    },
    'Merchant Navy Officer': {
        'skills': ['navigation', 'ship operations', 'maritime regulations', 'leadership', 'safety management', 'technical knowledge'],
        'interests': ['sea', 'travel', 'adventure', 'engineering', 'leadership'],
        'education': ['B.Sc Nautical Science', 'Marine Engineering Degree', 'Merchant Navy Diploma'],
        'salary_range': '₹6-30 LPA',
        'job_growth': 'High',
        'courses': ['Nautical Science', 'Maritime Safety & Regulations', 'Ship Navigation', 'Cargo Operations']
    },
    'Ship Captain': {
        'skills': ['ship command', 'navigation', 'leadership', 'crisis management', 'maritime law', 'crew management'],
        'interests': ['sea', 'leadership', 'travel', 'adventure', 'responsibility'],
        'education': ['B.Sc Nautical Science with Sea Experience', 'Master Mariner Certification'],
        'salary_range': '₹15-45 LPA',
        'job_growth': 'Medium',
        'courses': ['Advanced Navigation', 'Ship Command & Leadership', 'Maritime Law', 'Crisis Management at Sea']
    },

    # ========== SKILLED TRADES & VOCATIONAL CAREERS (7 careers) ==========
    
    'Electrician': {
        'skills': ['electrical wiring', 'circuit troubleshooting', 'safety standards', 'blueprint reading', 'tools handling', 'maintenance'],
        'interests': ['electrical work', 'hands-on work', 'problem solving', 'technical skills', 'safety'],
        'education': ['ITI Electrician', 'Diploma in Electrical Engineering', 'Apprenticeship'],
        'salary_range': '₹2-9 LPA',
        'job_growth': 'Medium',
        'courses': ['Electrical Wiring & Safety', 'Circuit Troubleshooting', 'Industrial Electrical Systems', 'Electrical Code Compliance']
    },
    'Plumber': {
        'skills': ['pipe fitting', 'plumbing systems', 'troubleshooting', 'tools handling', 'blueprint reading', 'customer service'],
        'interests': ['hands-on work', 'technical skills', 'problem solving', 'construction'],
        'education': ['ITI Plumbing', 'Vocational Training Certificate', 'Apprenticeship'],
        'salary_range': '₹2-8 LPA',
        'job_growth': 'Medium',
        'courses': ['Plumbing Systems Fundamentals', 'Pipe Fitting Techniques', 'Water Supply & Drainage Systems', 'Plumbing Safety']
    },
    'Welder': {
        'skills': ['welding techniques', 'metal fabrication', 'blueprint reading', 'safety standards', 'quality inspection', 'tools handling'],
        'interests': ['hands-on work', 'manufacturing', 'precision', 'technical skills'],
        'education': ['ITI Welding', 'Diploma in Welding Technology', 'Apprenticeship'],
        'salary_range': '₹2-9 LPA',
        'job_growth': 'Medium',
        'courses': ['Welding Techniques (MIG/TIG/Arc)', 'Metal Fabrication', 'Welding Safety Standards', 'Quality Inspection']
    },
    'Automobile Technician': {
        'skills': ['vehicle diagnostics', 'engine repair', 'electrical systems', 'troubleshooting', 'tools handling', 'customer service'],
        'interests': ['automobiles', 'machinery', 'hands-on work', 'technical skills', 'problem solving'],
        'education': ['ITI Automobile Engineering', 'Diploma in Automobile Engineering', 'Apprenticeship'],
        'salary_range': '₹2-9 LPA',
        'job_growth': 'Medium',
        'courses': ['Automobile Diagnostics', 'Engine Repair & Maintenance', 'Vehicle Electrical Systems', 'Modern Automotive Technology']
    },
    'HVAC Technician': {
        'skills': ['hvac systems', 'installation', 'troubleshooting', 'refrigeration', 'electrical basics', 'maintenance'],
        'interests': ['technical skills', 'hands-on work', 'machinery', 'problem solving'],
        'education': ['ITI HVAC', 'Diploma in Mechanical Engineering', 'HVAC Certification'],
        'salary_range': '₹2.5-10 LPA',
        'job_growth': 'High',
        'courses': ['HVAC Systems Fundamentals', 'Refrigeration Technology', 'HVAC Installation & Maintenance', 'Energy Efficient Cooling Systems']
    },
    'Carpenter': {
        'skills': ['woodworking', 'furniture making', 'blueprint reading', 'tools handling', 'measurement precision', 'finishing techniques'],
        'interests': ['hands-on work', 'craftsmanship', 'creativity', 'construction'],
        'education': ['ITI Carpentry', 'Vocational Training Certificate', 'Apprenticeship'],
        'salary_range': '₹2-8 LPA',
        'job_growth': 'Medium',
        'courses': ['Carpentry Fundamentals', 'Furniture Making', 'Wood Finishing Techniques', 'Blueprint Reading for Carpenters']
    },
    'CNC Machinist': {
        'skills': ['cnc programming', 'machine operation', 'blueprint reading', 'precision measurement', 'quality control', 'tooling'],
        'interests': ['manufacturing', 'precision', 'technical skills', 'machinery'],
        'education': ['ITI Machinist', 'Diploma in Mechanical Engineering', 'CNC Certification'],
        'salary_range': '₹2.5-10 LPA',
        'job_growth': 'Medium',
        'courses': ['CNC Programming', 'Machine Operation & Setup', 'Precision Measurement', 'CAD/CAM for Machining']
    },

    # ========== EMERGING & FRONTIER TECHNOLOGY (5 careers) ==========
    
    'Quantum Computing Researcher': {
        'skills': ['quantum mechanics', 'quantum algorithms', 'programming', 'mathematics', 'research', 'linear algebra'],
        'interests': ['physics', 'computing', 'research', 'mathematics', 'innovation'],
        'education': ['M.Sc Physics', 'M.Tech Quantum Computing', 'PhD'],
        'salary_range': '₹10-35 LPA',
        'job_growth': 'High',
        'courses': ['Quantum Computing Fundamentals', 'Quantum Algorithms', 'Qiskit Programming', 'Quantum Mechanics for Computing']
    },
    'Digital Twin Engineer': {
        'skills': ['simulation modeling', 'iot', 'data integration', '3d modeling', 'programming', 'systems engineering'],
        'interests': ['technology', 'simulation', 'innovation', 'engineering', 'data'],
        'education': ['B.Tech', 'M.Tech', 'Engineering with Simulation Specialization'],
        'salary_range': '₹8-28 LPA',
        'job_growth': 'High',
        'courses': ['Digital Twin Technology', 'IoT Integration', 'Simulation Modeling', 'Systems Engineering']
    },
    'AI Ethics Specialist': {
        'skills': ['ai governance', 'ethics frameworks', 'policy analysis', 'critical thinking', 'research', 'communication'],
        'interests': ['ethics', 'ai', 'policy', 'technology', 'philosophy'],
        'education': ['M.A Philosophy', 'B.Tech with Ethics Specialization', 'Law with Tech Policy Focus'],
        'salary_range': '₹7-25 LPA',
        'job_growth': 'Very High',
        'courses': ['AI Ethics & Governance', 'Responsible AI Frameworks', 'AI Policy Analysis', 'Bias & Fairness in AI']
    },
    'RPA Developer': {
        'skills': ['robotic process automation', 'uipath', 'automation anywhere', 'programming', 'process analysis', 'workflow design'],
        'interests': ['automation', 'technology', 'efficiency', 'problem solving', 'process improvement'],
        'education': ['B.Tech', 'BCA', 'MCA', 'RPA Certification'],
        'salary_range': '₹5-18 LPA',
        'job_growth': 'High',
        'courses': ['RPA Development (UiPath/Automation Anywhere)', 'Process Mapping', 'Workflow Automation', 'RPA Governance']
    },
    'GIS Specialist': {
        'skills': ['gis software', 'spatial analysis', 'cartography', 'remote sensing', 'data analysis', 'programming'],
        'interests': ['geography', 'data', 'mapping', 'technology', 'environment'],
        'education': ['B.Sc Geography', 'M.Sc GIS', 'B.Tech with GIS Specialization'],
        'salary_range': '₹3.5-14 LPA',
        'job_growth': 'High',
        'courses': ['GIS Software (ArcGIS/QGIS)', 'Spatial Data Analysis', 'Remote Sensing', 'Cartography Fundamentals']
    },
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

# ---------------------------------------------------------------------
# Runtime dataset identity (master prompt section on the runtime
# dataset).
#
# Audit finding, updated when this file grew from 148 to 309 careers:
# this file is still the ONLY career dataset imported anywhere in the
# codebase (no second/duplicate CAREER_DATABASE exists). It now DOES
# contain a "Full Stack Developer" entry (checked for that exact name
# and case/hyphen variants) plus roughly 160 additional careers across
# new sections (Data & AI, additional Healthcare/Engineering
# specializations, Real Estate, Aviation & Maritime, Skilled Trades,
# etc. -- see the section headers above). This is the newer/expanded
# dataset that earlier project notes anticipated, not the old
# 148-career one anymore -- see tests/test_candidate_isolation_and_dataset.py
# ::TestRuntimeDatasetIntegrity::test_full_stack_developer_absence_is_a_known_finding_not_silently_reintroduced,
# which exists specifically to catch this transition and was updated
# accordingly rather than left silently failing.
import hashlib as _hashlib  # noqa: E402

with open(__file__, 'rb') as _self_f:
    # Hex digest of this file's own bytes at import time. Changes
    # automatically and deterministically whenever a career is added,
    # removed, or edited — no hand-maintained version string to forget to
    # bump, and independently verifiable by re-hashing the file.
    DATASET_VERSION = 'career-dataset-v1-' + _hashlib.sha256(_self_f.read()).hexdigest()[:12]

DATASET_CAREER_COUNT = len(CAREER_DATABASE)
CAREER_COUNT = DATASET_CAREER_COUNT

# Fail loudly at import time rather than silently drift: career_metadata.py
# is generated FROM this file (see ../../scripts/generate_career_metadata.py)
# and must describe every career actually present here. A mismatch means
# someone edited career_dataset.py without regenerating career_metadata.py.
from app.data import career_metadata as _career_metadata  # noqa: E402

_missing_metadata = set(CAREER_DATABASE) - set(_career_metadata.CAREER_ID)
if _missing_metadata:
    raise RuntimeError(
        'career_metadata.py is stale: missing career_id/domain for '
        f'{sorted(_missing_metadata)}. Run '
        '`python scripts/generate_career_metadata.py` from ml-service/ and retry.'
    )
