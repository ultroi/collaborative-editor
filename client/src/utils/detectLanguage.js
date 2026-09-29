const EXTENSION_TO_LANGUAGE = {
  js: 'javascript',
  jsx: 'javascript',
  mjs: 'javascript',
  cjs: 'javascript',
  ts: 'typescript',
  tsx: 'typescript',
  json: 'json',
  html: 'html',
  htm: 'html',
  css: 'css',
  scss: 'scss',
  less: 'less',
  md: 'markdown',
  markdown: 'markdown',
  py: 'python',
  java: 'java',
  c: 'c',
  h: 'c',
  cpp: 'cpp',
  cc: 'cpp',
  hpp: 'cpp',
  cs: 'csharp',
  go: 'go',
  rs: 'rust',
  rb: 'ruby',
  php: 'php',
  sql: 'sql',
  sh: 'shell',
  bash: 'shell',
  yml: 'yaml',
  yaml: 'yaml',
  xml: 'xml',
  dockerfile: 'dockerfile',
  gitignore: 'plaintext',
  env: 'plaintext',
  txt: 'plaintext',
};

/**
 * Derives the Monaco language id from a file name. Falls back to
 * 'plaintext' for anything unrecognized rather than guessing wrong.
 */
export function detectLanguage(fileName = '') {
  const lower = fileName.toLowerCase();

  if (lower === 'dockerfile') return 'dockerfile';
  if (lower === '.gitignore' || lower === '.env') return 'plaintext';

  const ext = lower.includes('.') ? lower.split('.').pop() : '';
  return EXTENSION_TO_LANGUAGE[ext] || 'plaintext';
}