import { useEffect, useRef, useState } from 'react';
import * as fileService from '../services/fileService';
import { getErrorMessage } from '../utils/getErrorMessage';

// Helper to generate a consistent color from a username/string
function getColorForUser(str) {
  if (!str) return '#858585';
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
  return '#' + '00000'.substring(0, 6 - c.length) + c;
}

function getFileType(filename = '') {
  const name = filename.toLowerCase();
  if (name.startsWith('.env')) return 'env';

  const extension = name.includes('.') ? name.split('.').pop() : '';

  const types = {
    js: 'js', jsx: 'jsx', ts: 'ts', tsx: 'tsx', json: 'json',
    html: 'html', htm: 'html', css: 'css', scss: 'css', sass: 'css', less: 'css',
    py: 'py', java: 'java', c: 'c', cpp: 'cpp', h: 'cpp', hpp: 'cpp',
    cs: 'cs', go: 'go', rs: 'rs', php: 'php', rb: 'rb', swift: 'swift', kt: 'kt',
    sql: 'sql', sh: 'shell', bash: 'shell', xml: 'xml', yaml: 'yaml', yml: 'yaml',
    md: 'md', txt: 'txt', csv: 'csv',
  };

  return types[extension] || 'file';
}

function FileIcon({ name, size = 18 }) {
  const type = getFileType(name);

  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    'aria-hidden': true,
    focusable: 'false',
  };

  const svg = {
    js: (
      <svg {...common}>
        <rect width="20" height="20" x="2" y="2" rx="2.5" fill="#F7DF1E" />
        <path fill="#111" d="M13.1 15.65c.38.62.86 1.08 1.72 1.08.72 0 1.18-.36 1.18-.86 0-.6-.47-.82-1.27-1.17l-.44-.19c-1.28-.55-2.13-1.24-2.13-2.7 0-1.34 1.02-2.35 2.62-2.35 1.14 0 1.96.4 2.55 1.43l-1.4.9c-.31-.55-.65-.77-1.15-.77-.52 0-.85.33-.85.77 0 .54.33.77 1.08 1.1l.44.19c1.5.64 2.35 1.36 2.35 2.85 0 1.63-1.27 2.52-2.97 2.52-1.66 0-2.73-.79-3.25-1.83l1.53-.87Zm-6.12-5.99h1.76v5.55c0 1.18.49 1.52 1.25 1.52.72 0 1.18-.42 1.18-1.52V9.66h1.76v5.62c0 1.96-1.08 2.98-2.91 2.98-1.85 0-3.04-1.02-3.04-2.98V9.66Z" />
      </svg>
    ),
    jsx: (
      <svg {...common}>
        <rect width="20" height="20" x="2" y="2" rx="2.5" fill="#61DAFB" />
        <ellipse cx="12" cy="12" rx="8.7" ry="3.25" stroke="#12313A" strokeWidth="1.4" />
        <ellipse cx="12" cy="12" rx="8.7" ry="3.25" transform="rotate(60 12 12)" stroke="#12313A" strokeWidth="1.4" />
        <ellipse cx="12" cy="12" rx="8.7" ry="3.25" transform="rotate(120 12 12)" stroke="#12313A" strokeWidth="1.4" />
        <circle cx="12" cy="12" r="1.65" fill="#12313A" />
      </svg>
    ),
    ts: (
      <svg {...common}>
        <rect width="20" height="20" x="2" y="2" rx="2.5" fill="#3178C6" />
        <path fill="#fff" d="M5.1 8.05h7.1v1.55H9.75v6.35H7.57V9.6H5.1V8.05Zm7.8 5.84c.43.36 1.08.73 1.93.73.74 0 1.18-.3 1.18-.77 0-.43-.32-.67-1.15-.96l-.63-.22c-1.29-.45-1.97-1.18-1.97-2.2 0-1.42 1.18-2.4 2.86-2.4 1 0 1.84.3 2.43.76l-.84 1.34c-.4-.32-.92-.54-1.5-.54-.55 0-.9.23-.9.64 0 .35.25.57.99.82l.65.22c1.36.46 2.11 1.2 2.11 2.3 0 1.48-1.24 2.57-3.15 2.57-1.15 0-2.25-.35-2.96-.93l.95-1.36Z" />
      </svg>
    ),
    tsx: (
      <svg {...common}>
        <rect width="20" height="20" x="2" y="2" rx="2.5" fill="#3178C6" />
        <ellipse cx="15.2" cy="8.8" rx="5.3" ry="2.2" stroke="#8ED6FF" strokeWidth="1.1" transform="rotate(25 15.2 8.8)" />
        <ellipse cx="15.2" cy="8.8" rx="5.3" ry="2.2" stroke="#8ED6FF" strokeWidth="1.1" transform="rotate(85 15.2 8.8)" />
        <circle cx="15.2" cy="8.8" r="1" fill="#8ED6FF" />
        <path fill="#fff" d="M3.9 11.2h6.3v1.3H8.1v5.05H6.55V12.5H3.9v-1.3Zm6.95 4.5c.3.25.75.5 1.33.5.51 0 .81-.2.81-.52 0-.29-.22-.46-.8-.66l-.43-.15c-.89-.31-1.36-.81-1.36-1.51 0-.97.81-1.64 1.96-1.64.7 0 1.26.21 1.67.52l-.57.93a1.95 1.95 0 0 0-.98-.34c-.38 0-.62.16-.62.44 0 .24.17.39.68.56l.45.15c.93.32 1.45.82 1.45 1.58 0 1.01-.85 1.76-2.16 1.76-.79 0-1.54-.24-2.03-.64l.6-.98Z" />
      </svg>
    ),
    json: (
      <svg {...common}>
        <rect width="20" height="20" x="2" y="2" rx="2.5" fill="#F2C94C" />
        <path fill="#3A3213" d="M8.1 6.1H6.7c-.8 0-1.25.45-1.25 1.25v2c0 .75-.25 1.05-.9 1.2v1.3c.65.14.9.45.9 1.2v2c0 .8.45 1.25 1.25 1.25h1.4v-1.25H7.6c-.32 0-.48-.18-.48-.52V13c0-1.05-.28-1.67-1.02-1.8.74-.14 1.02-.76 1.02-1.81V7.87c0-.34.16-.52.48-.52h.5V6.1Zm3.25 11.5c-.9-.4-1.5-1.16-1.5-2.3v-6.6c0-1.14.6-1.9 1.5-2.3l.54 1.1c-.35.2-.58.55-.58 1.2v6.6c0 .65.23 1 .58 1.2l-.54 1.1Zm4.55-1.25h1.4c.8 0 1.25-.45 1.25-1.25v-2c0-.75.25-1.06.9-1.2v-1.3c-.65-.15-.9-.46-.9-1.2v-2c0-.8-.45-1.25-1.25-1.25h-1.4v1.25h.5c.32 0 .48.18.48.52v1.5c0 1.05.28 1.67 1.02 1.81-.74.13-1.02.75-1.02 1.8v1.52c0 .34-.16.52-.48.52h-.5v1.28Z" />
      </svg>
    ),
    html: (
      <svg {...common}>
        <path fill="#E34F26" d="M3.2 2h17.6l-1.6 17.8L12 22l-7.2-2.2L3.2 2Z" />
        <path fill="#fff" d="M6.15 5h11.7l-.2 2.05H8.58l.2 2.08h8.66l-.7 7.25L12 17.75l-4.74-1.37-.32-3.22h2.08l.16 1.63L12 15.55l2.82-.76.25-2.42H7.1L6.15 5Z" />
      </svg>
    ),
    css: (
      <svg {...common}>
        <path fill="#1572B6" d="M3.2 2h17.6l-1.6 17.8L12 22l-7.2-2.2L3.2 2Z" />
        <path fill="#fff" d="M6.1 5h11.8l-.2 2.05H8.38l.18 2.08h9.02l-.7 7.27L12 17.8l-4.9-1.4-.32-3.24h2.1l.14 1.63L12 15.57l2.84-.76.24-2.42H6.98L6.1 5Z" />
        <path fill="#D6ECFA" d="M12 5v10.58l2.84-.77.24-2.42H12V9.13h5.38L17.9 5H12Z" />
      </svg>
    ),
    py: (
      <svg {...common}>
        <path fill="#3776AB" d="M12 2c-2.8 0-2.65 1.2-2.65 1.2v1.78h2.7v.53H8.28C5.1 5.5 4 7.25 4 9.95c0 2.7 2.05 2.92 2.05 2.92h2.2V11.1s-.12-2.05 2.08-2.05h3.47c2.08 0 3.2-1.18 3.2-3.1V4.6C17 2.25 14.77 2 12 2Zm-1.48 1.36c.47 0 .84.38.84.84a.84.84 0 1 1-1.68 0c0-.46.38-.84.84-.84Z" />
        <path fill="#FFD43B" d="M12.05 22c2.8 0 2.65-1.2 2.65-1.2v-1.78H12v-.53h3.77C18.9 18.5 20 16.75 20 14.05c0-2.7-2.05-2.92-2.05-2.92h-2.2v1.77s.12 2.05-2.08 2.05H10.2c-2.08 0-3.2 1.18-3.2 3.1v1.35C7 21.75 9.23 22 12.05 22Zm1.48-1.36a.84.84 0 1 1 .01-1.68.84.84 0 0 1-.01 1.68Z" />
      </svg>
    ),
    java: (
      <svg {...common}>
        <circle cx="12" cy="12" r="10" fill="#E76F00" />
        <path fill="#fff" d="M8 13.15h8.2c-.15 1.94-1.68 3.2-4.03 3.2-1.94 0-3.33-.98-4.17-3.2Zm1.08-1.7c-.46-1.05.2-1.83 1.18-2.42-.18.64-.08 1.03.34 1.33.58.4 1.42.62 1.82 1.1H9.08Zm2.25-3.1c.3-.8 1.08-1.34 1.82-1.7-.18.63-.05 1.03.32 1.36.44.4 1.08.66 1.32 1.2-.89-.1-2.26-.24-3.46-.86Z" />
      </svg>
    ),
    c: (
      <svg {...common}>
        <circle cx="12" cy="12" r="10" fill="#A8B9CC" />
        <path fill="#17334D" d="M16.8 9.25c-.75-1-1.92-1.6-3.42-1.6-2.38 0-4.12 1.78-4.12 4.35s1.74 4.35 4.12 4.35c1.5 0 2.67-.6 3.42-1.6l-1.55-1.15c-.4.5-.97.82-1.7.82-1.13 0-1.96-.9-1.96-2.42s.83-2.42 1.96-2.42c.73 0 1.3.32 1.7.82l1.55-1.15Z" />
      </svg>
    ),
    cpp: (
      <svg {...common}>
        <circle cx="12" cy="12" r="10" fill="#00599C" />
        <path fill="#fff" d="M9.4 9.95c-.45-.48-.99-.73-1.62-.73-1.33 0-2.3 1.1-2.3 2.78s.97 2.78 2.3 2.78c.63 0 1.17-.25 1.62-.73l1.26 1.12a3.92 3.92 0 0 1-2.98 1.24c-2.32 0-4-1.75-4-4.41s1.68-4.41 4-4.41c1.17 0 2.2.44 2.98 1.24L9.4 9.95Zm4.8 1.13h1.18v-1.2h.95v1.2h1.18v.94h-1.18v1.2h-.95v-1.2H14.2v-.94Z" />
        <path fill="#fff" d="M18.08 12.99h.86v-.93h.78v.93h.86v.72h-.86v.93h-.78v-.93h-.86v-.72Z" />
      </svg>
    ),
    cs: (
      <svg {...common}>
        <rect x="2" y="2" width="20" height="20" rx="4" fill="#68217A" />
        <path fill="#fff" d="M10.1 8.2c-.66-.38-1.37-.57-2.13-.57-1.96 0-3.37 1.35-3.37 3.55 0 2.2 1.41 3.55 3.37 3.55.76 0 1.47-.19 2.13-.57l-.57-1.14c-.4.21-.85.32-1.3.32-1 0-1.67-.71-1.67-2.16s.67-2.16 1.67-2.16c.45 0 .9.11 1.3.32l.57-1.14Zm1.22 2.04h1.18V9.06h1.07v1.18h1.18v1.02h-1.18v1.18H12.5v-1.18h-1.18v-1.02Zm3.08 0h1V9.25h.92v.99h.98v.89h-.98v1h-.92v-.99h-1v-.89Z" />
      </svg>
    ),
    go: (
      <svg {...common}>
        <rect x="2" y="2" width="20" height="20" rx="4" fill="#00ADD8" />
        <path fill="#fff" d="M5.25 10.25h6.2v1.15H9.1c-.06 1.32-.82 2.2-2.22 2.56l-.47-1.06c.89-.26 1.38-.74 1.48-1.5H5.25v-1.15Zm7.08-1.8h4.4v1.08h-1.55v4.45h-1.3V9.53h-1.55V8.45Zm-5.83 5.35c.32.3.75.47 1.3.47.61 0 1.04-.24 1.04-.63 0-.35-.25-.5-.91-.69l-.4-.12c-.95-.27-1.48-.71-1.48-1.45 0-.91.79-1.53 1.98-1.53.72 0 1.34.2 1.79.53l-.58.96c-.31-.22-.7-.35-1.16-.35-.5 0-.76.17-.76.44 0 .22.2.37.73.52l.42.13c1.15.32 1.68.78 1.68 1.58 0 .99-.84 1.66-2.34 1.66-1 0-1.72-.28-2.18-.68l.87-.84Z" />
      </svg>
    ),
    rs: (
      <svg {...common}>
        <rect x="2" y="2" width="20" height="20" rx="4" fill="#DEA584" />
        <path fill="#2A221D" d="M7 7.3h7.15c1.75 0 2.86.84 2.86 2.17 0 .93-.52 1.56-1.47 1.87.88.25 1.33.83 1.33 1.77v1.6h-1.68v-1.45c0-.7-.32-1-1.1-1H8.7v2.45H7V7.3Zm1.7 1.48v2.03h5.05c.95 0 1.45-.34 1.45-1.02 0-.68-.5-1.01-1.45-1.01H8.7Z" />
      </svg>
    ),
    php: (
      <svg {...common}>
        <ellipse cx="12" cy="12" rx="10" ry="7.3" fill="#777BB3" />
        <path fill="#fff" d="M6.1 15.1 7.2 8.8h2.05c1.35 0 2.07.67 1.86 1.86-.2 1.16-1.08 1.8-2.43 1.8H7.95l-.47 2.64H6.1Zm2.1-4.73-.18 1.02h.65c.51 0 .78-.22.86-.68.08-.45-.1-.67-.61-.67H8.2Zm3.38 4.73 1.1-6.3h1.38l-.4 2.3h1.07c1.33 0 2.06.66 1.85 1.87-.2 1.16-1.08 1.8-2.42 1.8h-1.34l-.1.33h-1.14Zm2.05-2.64h.7c.5 0 .78-.23.86-.68.08-.46-.11-.68-.61-.68h-.72l-.23 1.36Z" />
      </svg>
    ),
    rb: (
      <svg {...common}>
        <circle cx="12" cy="12" r="10" fill="#CC342D" />
        <path fill="#fff" d="M7.2 7.3h3.95c1.92 0 3.18.96 3.18 2.43 0 .92-.49 1.58-1.3 1.93l2.08 3.04h-2.1l-1.73-2.67H9.1v2.67H7.2V7.3Zm1.9 1.54v1.7h1.77c.79 0 1.25-.28 1.25-.85 0-.56-.46-.85-1.25-.85H9.1Z" />
      </svg>
    ),
    swift: (
      <svg {...common}>
        <circle cx="12" cy="12" r="10" fill="#F05138" />
        <path fill="#fff" d="M6 14.8c2.78 1.64 5.25 1.37 7.05.27-1.7-2.16-3.53-3.53-5.4-4.96 1.84.8 3.46 1.57 4.93 2.68-.7-1.52-1.3-2.5-2.38-3.79 2.37 1.35 4.25 3.08 5.4 5.02.7-.32 1.29-.75 1.8-1.24-.15 1.02-.58 1.8-1.23 2.48-1.07 1.12-2.55 1.83-4.2 1.94-2.2.15-4.32-.71-5.97-2.4Z" />
      </svg>
    ),
    kt: (
      <svg {...common}>
        <rect x="2" y="2" width="20" height="20" rx="4" fill="#7F52FF" />
        <path fill="#fff" d="M6 6h3.1L6 10.1V6Zm0 5.3L11.3 6H15l-5.4 5.3 5.85 6.7h-3.7L8 13.14l-2 2v-3.84Z" />
      </svg>
    ),
    shell: (
      <svg {...common}>
        <rect x="2" y="2" width="20" height="20" rx="3" fill="#222" />
        <path fill="#fff" d="m7 8 4 4-4 4 1.1 1.1 5.1-5.1L8.1 6.9 7 8Zm6.4 7.1h4.6v1.5h-4.6v-1.5Z" />
      </svg>
    ),
    md: (
      <svg {...common}>
        <rect x="2" y="4" width="20" height="16" rx="2.5" fill="#222" />
        <path fill="#fff" d="M5.2 16V8.3h2.15l1.72 2.2 1.72-2.2h2.15V16h-2v-4.75l-1.87 2.4-1.87-2.4V16h-2Zm9.3 0v-4h-2l3.5-3.6 3.5 3.6h-2v4h-3Z" />
      </svg>
    ),
    yaml: (
      <svg {...common}>
        <rect x="2" y="2" width="20" height="20" rx="4" fill="#CB171E" />
        <path fill="#fff" d="M6 7h2.05l1.7 3.06L11.45 7h2.04l-2.77 4.62V17H8.98v-5.38L6 7Zm7.35 0h1.9l.93 5.3L17.1 7H19l-1.25 10H15.8l-.7-5.2-.72 5.2h-1.93L13.35 7Z" />
      </svg>
    ),
    xml: (
      <svg {...common}>
        <rect x="2" y="2" width="20" height="20" rx="4" fill="#F16529" />
        <path fill="#fff" d="m7 8-3 4 3 4 1.2-1.05L6 12l2.2-2.95L7 8Zm10 0-1.2 1.05L18 12l-2.2 2.95L17 16l3-4-3-4Zm-5.3-.6-2.2 9.2h1.85l2.2-9.2H11.7Z" />
      </svg>
    ),
    sql: (
      <svg {...common}>
        <ellipse cx="12" cy="6.8" rx="7.2" ry="3.1" fill="#336791" />
        <path fill="#336791" d="M4.8 6.8v5.2c0 1.7 3.22 3.1 7.2 3.1 3.98 0 7.2-1.4 7.2-3.1V6.8c0 1.71-3.22 3.1-7.2 3.1-3.98 0-7.2-1.39-7.2-3.1Zm0 5.2v5.2c0 1.71 3.22 3.1 7.2 3.1 3.98 0 7.2-1.39 7.2-3.1V12c0 1.71-3.22 3.1-7.2 3.1-3.98 0-7.2-1.39-7.2-3.1Z" />
        <ellipse cx="12" cy="6.8" rx="7.2" ry="3.1" fill="none" stroke="#fff" strokeWidth=".8" />
      </svg>
    ),
    txt: (
      <svg {...common}>
        <path fill="#9AA0A6" d="M6 2h8l5 5v15H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Z" />
        <path fill="#fff" d="M13 2v6h6M8 11h8v1.4H8V11Zm0 3h8v1.4H8V14Zm0 3h5v1.4H8V17Z" />
      </svg>
    ),
    csv: (
      <svg {...common}>
        <path fill="#217346" d="M6 2h8l5 5v15H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Z" />
        <path fill="#fff" d="M13 2v6h6M8 11h8v1.3H8V11Zm0 3h8v1.3H8V14Zm0 3h6v1.3H8V17Z" />
      </svg>
    ),
    env: (
      <svg {...common}>
        <rect x="2" y="2" width="20" height="20" rx="4" fill="#6E9F18" />
        <path fill="#fff" d="M6 7h12v1.5H6V7Zm0 3.3h7.8v1.5H6v-1.5Zm0 3.3h10v1.5H6v-1.5Zm0 3.3h5.6v1.5H6v-1.5Z" />
      </svg>
    ),
    file: (
      <svg {...common}>
        <path d="M6 2.8h7.6L19 8.2V20a1.8 1.8 0 0 1-1.8 1.8H6A1.8 1.8 0 0 1 4.2 20V4.6A1.8 1.8 0 0 1 6 2.8Z" fill="#6E7480" />
        <path d="M13.3 2.8v5.7H19" fill="none" stroke="#D7DAE0" strokeWidth="1.2" />
        <path d="M7.4 12h8.2M7.4 15h8.2M7.4 18h5.7" stroke="#D7DAE0" strokeWidth="1.1" strokeLinecap="round" />
      </svg>
    ),
  };

  return (
    <span className={`tree-file-icon tree-file-icon-${type}`} aria-hidden="true">
      {svg[type] || svg.file}
    </span>
  );
}

function FolderIcon({ open = false }) {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3.5 7.5a2 2 0 0 1 2-2h4.1l2 2H18.5a2 2 0 0 1 2 2v8.5a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2Z" />
      {open && <path d="M4 10h16" opacity=".45" />}
    </svg>
  );
}

function MoreIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="5" cy="12" r="1" />
      <circle cx="12" cy="12" r="1" />
      <circle cx="19" cy="12" r="1" />
    </svg>
  );
}

export default function FileTreeNode({
  projectId,
  node,
  depth,
  selectedId,
  onSelect,
  onCreateChild,
  onDelete,
  onTreeChange,
  locks = {},
  userById = {},
  renamingId = null,
  onRenameSubmit,
  onRenameCancel,
  onOpenMenu,
  currentUserId,
}) {
  const [expanded, setExpanded] = useState(depth === 0);
  
  const [creatingType, setCreatingType] = useState(null);
  const [inputValue, setInputValue] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [renameValue, setRenameValue] = useState(node.name || '');

  const inputRef = useRef(null);
  const renameRef = useRef(null);

  const isFolder = node.type === 'folder';
  const isSelected = selectedId === node._id;
  const children = node.children || [];
  
  // Lock logic
  const lock = !isFolder ? locks?.[node._id] : null;
  const isMe = lock?.userId === currentUserId;
  const rawLockOwnerName = lock ? (userById[lock.userId] || 'someone') : null;
  const lockOwnerName = isMe ? 'You' : rawLockOwnerName;
  const lockColor = lock ? getColorForUser(rawLockOwnerName) : null;
  
  const isRenaming = renamingId === node._id;

  useEffect(() => {
    if (creatingType) inputRef.current?.focus();
  }, [creatingType]);

  useEffect(() => {
    if (isRenaming) {
      setRenameValue(node.name || '');
      requestAnimationFrame(() => {
        renameRef.current?.focus();
        renameRef.current?.select();
      });
    }
  }, [isRenaming, node.name]);

  const handleClick = () => {
    if (isRenaming) return;

    if (isFolder) {
      setExpanded((value) => !value);
    } else {
      onSelect(node);
    }
  };

  const startCreation = (type) => {
    if (!node.access?.write || creating) return;
    setExpanded(true);
    setCreatingType(type);
    setInputValue('');
    setCreateError('');
  };

  const cancelCreation = () => {
    if (creating) return;
    setCreatingType(null);
    setInputValue('');
    setCreateError('');
  };

  const submitCreation = async () => {
    const name = inputValue.trim();
    if (!name || !creatingType || creating) return;

    setCreating(true);
    setCreateError('');

    try {
      await fileService.createNode(projectId, {
        name,
        type: creatingType,
        parentId: node._id,
      });

      setCreatingType(null);
      setInputValue('');
      await onTreeChange?.();
    } catch (err) {
      setCreateError(getErrorMessage(err, `Could not create ${creatingType}`));
    } finally {
      setCreating(false);
    }
  };

  const handleCreateKeyDown = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      submitCreation();
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      cancelCreation();
    }
  };

  const submitRename = async () => {
    const name = renameValue.trim();
    if (!name) return;

    if (name === node.name) {
      onRenameCancel?.();
      return;
    }

    await onRenameSubmit?.(node, name);
  };

  const handleRenameKeyDown = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      submitRename();
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      onRenameCancel?.();
    }
  };

  return (
    <div className="tree-node">
      <div
        className={`tree-row ${isSelected ? 'selected' : ''} ${isRenaming ? 'is-renaming' : ''}`}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={handleClick}
      >
        {isFolder ? (
          <span className={`tree-chevron ${expanded ? 'expanded' : ''}`}>›</span>
        ) : (
          <span className="tree-chevron-spacer" />
        )}

        {isFolder ? (
          <span className={`tree-folder-icon ${expanded ? 'expanded' : ''}`}><FolderIcon open={expanded} /></span>
        ) : (
          <FileIcon name={node.name} />
        )}

        {isRenaming ? (
          <input
            ref={renameRef}
            className="tree-inline-rename"
            value={renameValue}
            onChange={(event) => setRenameValue(event.target.value)}
            onKeyDown={handleRenameKeyDown}
            onBlur={submitRename}
            onClick={(event) => event.stopPropagation()}
          />
        ) : (
          <span className="tree-name" title={node.name}>{node.name}</span>
        )}

        {/* Colored Dot Lock Indicator */}
        {lock && (
          <span className="tree-lock" title={`Working: ${lockOwnerName}`} aria-label="Locked">
            <span 
              style={{ 
                display: 'inline-block',
                width: '8px', 
                height: '8px', 
                borderRadius: '50%', 
                backgroundColor: lockColor,
                marginRight: '4px'
              }} 
            />
          </span>
        )}

        {/* Inline Actions (+ file, + folder) */}
        {!isRenaming && isFolder && node.access?.write && expanded && (
          <div className="tree-inline-actions" onClick={(event) => event.stopPropagation()}>
            <button
              type="button"
              className="tree-inline-action"
              aria-label={`Create file inside ${node.name}`}
              title="New file"
              onClick={() => startCreation('file')}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
                <path d="M14 2v6h6" />
                <path d="M12 18v-5" />
                <path d="M9.5 15.5h5" />
              </svg>
            </button>

            <button
              type="button"
              className="tree-inline-action"
              aria-label={`Create folder inside ${node.name}`}
              title="New folder"
              onClick={() => startCreation('folder')}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M3 7.5A2.5 2.5 0 0 1 5.5 5h4l2 2H19A2.5 2.5 0 0 1 21.5 9.5v8A2.5 2.5 0 0 1 19 20H5a2 2 0 0 1-2-2Z" />
                <path d="M12 11v5" />
                <path d="M9.5 13.5h5" />
              </svg>
            </button>
          </div>
        )}

        {/* More Options (...) - Now passes lock info */}
        {!isRenaming && (
          <button
            type="button"
            className="tree-more-btn"
            aria-label={`More actions for ${node.name}`}
            title="More actions"
            onClick={(event) => {
              event.stopPropagation();
              onOpenMenu?.(node, event.currentTarget, { isLocked: !!lock, ownerName: lockOwnerName, ownerColor: lockColor });
            }}
          >
            <MoreIcon />
          </button>
        )}
      </div>

      {creatingType && (
        <div className="tree-create-row" style={{ paddingLeft: `${depth * 16 + 42}px` }}>
          <span className="tree-create-icon">
            {creatingType === 'folder' ? <FolderIcon open={false} /> : <FileIcon name="untitled.txt" size={17} />}
          </span>
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            disabled={creating}
            className="inline-file-input"
            placeholder={creatingType === 'folder' ? 'Folder name...' : 'File name...'}
            onChange={(event) => {
              setInputValue(event.target.value);
              setCreateError('');
            }}
            onKeyDown={handleCreateKeyDown}
            onBlur={() => {
              if (!creating && !inputValue.trim()) cancelCreation();
            }}
            onClick={(event) => event.stopPropagation()}
          />
        </div>
      )}

      {createError && (
        <div className="tree-create-error" style={{ paddingLeft: `${depth * 16 + 42}px` }}>
          {createError}
        </div>
      )}

      {isFolder && expanded && children.length > 0 && (
        <div className="tree-children">
          {children.map((child) => (
            <FileTreeNode
              key={child._id}
              projectId={projectId}
              node={child}
              depth={depth + 1}
              selectedId={selectedId}
              onSelect={onSelect}
              onCreateChild={onCreateChild}
              onDelete={onDelete}
              onTreeChange={onTreeChange}
              locks={locks}
              userById={userById}
              renamingId={renamingId}
              onRenameSubmit={onRenameSubmit}
              onRenameCancel={onRenameCancel}
              onOpenMenu={onOpenMenu}
              currentUserId={currentUserId} 
            />
          ))}
        </div>
      )}
    </div>
  );
}