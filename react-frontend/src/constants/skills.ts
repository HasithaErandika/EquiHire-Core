/**
 * @fileoverview Skill categories for job creation and edit forms.
 */

export const SKILL_CATEGORIES: Record<string, string[]> = {
  Languages: [
    'Python', 'Java', 'C++', 'C#', 'JavaScript', 'TypeScript', 'Swift', 'Kotlin', 'Bash',
  ],
  'Web & Frameworks': [
    'React', 'Angular', 'Vue.js', 'Node.js', 'Spring Boot', 'Django', 'Flask', 'FastAPI',
    'React Native', 'Flutter', 'GraphQL', 'REST API', 'Microservices',
  ],
  'Data & AI': [
    'Machine Learning', 'Deep Learning', 'NLP', 'TensorFlow', 'PyTorch', 'Pandas',
    'NumPy', 'Scikit-learn', 'Hadoop', 'Spark', 'Kafka', 'PowerBI', 'Tableau',
  ],
  'Infrastructure & Cloud': [
    'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'Terraform', 'Jenkins',
    'Git', 'CI/CD', 'Linux', 'Redis',
  ],
  Databases: [
    'SQL', 'NoSQL', 'MongoDB', 'PostgreSQL', 'MySQL', 'Oracle',
  ],
  'Tools & Agile': [
    'Figma', 'Adobe XD', 'JIRA', 'Agile', 'Scrum',
  ],
};
