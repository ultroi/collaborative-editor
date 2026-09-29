import { useEffect, useMemo, useRef, useState } from 'react';

function getColorForUser(str) {
  if (!str) return '#858585';
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
  return '#' + '00000'.substring(0, 6 - c.length) + c;
}

function initials(name = '') {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function isOnline(person) {
  if (typeof person?.online === 'boolean') return person.online;
  if (person?.status) return person.status !== 'offline';
  return true;
}

function Avatar({ person, size = 'md', muted = false }) {
  const name = person?.username || person?.name || 'Unknown';
  const image = person?.avatarUrl || person?.avatar || person?.profilePicture || person?.photoUrl;
  const userColor = getColorForUser(name);

  return (
    <span 
      className={`collab-avatar collab-avatar-${size} ${muted ? 'is-muted' : ''}`}
      style={{ border: `2px solid ${userColor}` }} 
    >
      {image ? <img src={image} alt="" /> : initials(name)}
    </span>
  );
}

export default function PresenceBar({ connectionStatus, presence = [], currentUserId }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleOutside = (event) => {
      if (!ref.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const members = useMemo(() => {
    const unique = new Map();
    presence.forEach((person) => unique.set(String(person.userId), person));
    return [...unique.values()].sort((a, b) => {
      if (String(a.userId) === String(currentUserId)) return -1;
      if (String(b.userId) === String(currentUserId)) return 1;
      return (a.username || '').localeCompare(b.username || '');
    });
  }, [presence, currentUserId]);

  const online = members.filter(isOnline);
  const offline = members.filter((person) => !isOnline(person));
  const preview = online.slice(0, 4);
  const extra = Math.max(online.length - preview.length, 0);
  const connected = connectionStatus === 'connected';

  return (
    <div className="collaboration-control" ref={ref}>
      <button
        type="button"
        className={`collaboration-trigger ${open ? 'is-open' : ''}`}
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        title="Project members"
      >
        <span className={`collaboration-status-dot ${connected ? 'online' : 'offline'}`} />

        <span className="collaboration-avatars">
          {preview.map((person) => (
            <Avatar key={person.userId} person={person} size="sm" />
          ))}
          {extra > 0 && <span className="collaboration-more">+{extra}</span>}
        </span>

        <span className="collaboration-summary">
          <strong>{online.length}</strong>
          <span>{online.length === 1 ? 'member online' : 'members online'}</span>
        </span>

        <span className="collaboration-chevron">⌄</span>
      </button>

      {open && (
        <div className="collaboration-popover">
          <div className="collaboration-popover-head">
            <div>
              <strong>Project members</strong>
              <span>Live collaboration</span>
            </div>
            <span className={`collaboration-live-pill ${connected ? '' : 'is-offline'}`}>
              <i /> {connected ? 'LIVE' : 'OFFLINE'}
            </span>
          </div>

          <div className="collaboration-section">
            <div className="collaboration-section-title">
              <span>ONLINE</span>
              <b>{online.length}</b>
            </div>

            {online.length === 0 ? (
              <div className="collaboration-empty">No members online</div>
            ) : (
              online.map((person) => {
                const you = String(person.userId) === String(currentUserId);
                return (
                  <div className="collaboration-member" key={person.userId}>
                    <div className="collaboration-member-avatar">
                      <Avatar person={person} size="lg" />
                      <span className="member-online-dot" />
                    </div>
                    <div className="collaboration-member-info">
                      <div className="collaboration-member-name">
                        <strong>{person.username || 'Unknown'}</strong>
                        {you && <span className="you-badge">YOU</span>}
                      </div>
                      <span>
                        {person.viewingFileId ? 'Viewing a file' : 'In the workspace'}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {offline.length > 0 && (
            <div className="collaboration-section collaboration-offline-section">
              <div className="collaboration-section-title">
                <span>OFFLINE</span>
                <b>{offline.length}</b>
              </div>
              {offline.map((person) => (
                <div className="collaboration-member is-offline" key={person.userId}>
                  <Avatar person={person} size="lg" muted />
                  <div className="collaboration-member-info">
                    <strong>{person.username || 'Unknown'}</strong>
                    <span>Offline</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="collaboration-popover-footer">
            <span className={`footer-status-dot ${connected ? 'online' : 'offline'}`} />
            {connected ? 'Real-time collaboration is active' : 'Reconnecting to workspace…'}
          </div>
        </div>
      )}
    </div>
  );
}