import { useEffect, useRef, useState } from 'react';

function formatTime(iso) {
  const date = new Date(iso);

  return date.toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatDate(iso) {
  const date = new Date(iso);
  const now = new Date();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const messageDate = new Date(date);
  messageDate.setHours(0, 0, 0, 0);

  const diffDays = Math.round(
    (today - messageDate) / (1000 * 60 * 60 * 24)
  );

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';

  return date.toLocaleDateString([], {
    day: 'numeric',
    month: 'short',
    year:
      date.getFullYear() !== now.getFullYear()
        ? 'numeric'
        : undefined,
  });
}

function getInitials(username = '') {
  const parts = username.trim().split(/\s+/).filter(Boolean);

  if (!parts.length) return '?';

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function Avatar({ user, size = 'md' }) {
  const username = user?.username || 'User';
  const avatarUrl = user?.avatarUrl;

  return (
    <div className={`chat-avatar chat-avatar-${size}`}>
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={`${username}'s avatar`}
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
        />
      ) : (
        <span>{getInitials(username)}</span>
      )}
    </div>
  );
}

export default function ChatPanel({
  messages,
  currentUserId,
  onSend,
  onLoadOlder,
  hasMore,
  loadingOlder,
}) {
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);

  const listRef = useRef(null);
  const shouldStickToBottomRef = useRef(true);

  useEffect(() => {
    if (shouldStickToBottomRef.current && listRef.current) {
      requestAnimationFrame(() => {
        if (listRef.current) {
          listRef.current.scrollTop = listRef.current.scrollHeight;
        }
      });
    }
  }, [messages]);

  const handleScroll = () => {
    const el = listRef.current;

    if (!el) return;

    shouldStickToBottomRef.current =
      el.scrollHeight - el.scrollTop - el.clientHeight < 60;

    if (el.scrollTop < 40 && hasMore && !loadingOlder) {
      onLoadOlder();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const trimmed = draft.trim();

    if (!trimmed || sending) return;

    setSending(true);

    try {
      const ack = await onSend(trimmed);

      if (ack?.ok) {
        setDraft('');
      } else {
        console.error('Chat send failed:', ack?.error);
      }
    } catch (error) {
      console.error('Chat send failed:', error);
    } finally {
      setSending(false);
    }
  };

  let previousMessage = null;
  let previousDate = null;

  return (
    <div className="chat-panel">

      {/* Header */}
      <div className="chat-header">
        <div>
          <div className="chat-header-title">
            Team Chat
          </div>

          <div className="chat-header-subtitle">
            Collaborate with your team
          </div>
        </div>
      </div>

      {/* Messages */}
      <div
        className="chat-messages"
        ref={listRef}
        onScroll={handleScroll}
      >
        {loadingOlder && (
          <div className="chat-loading">
            <span className="chat-loading-dot" />
            Loading older messages...
          </div>
        )}

        {messages.length === 0 && !loadingOlder && (
          <div className="chat-empty">
            <div className="chat-empty-icon">
              💬
            </div>

            <strong>No messages yet</strong>

            <span>
              Start a conversation with your team.
            </span>
          </div>
        )}

        {messages.map((message, index) => {
          const isOwn =
            message.user?.id === currentUserId;

          const currentDate = new Date(message.createdAt)
            .toDateString();

          const showDate =
            currentDate !== previousDate;

          const previousUserId =
            previousMessage?.user?.id;

          const isSameSender =
            previousUserId === message.user?.id &&
            !showDate;

          previousDate = currentDate;
          previousMessage = message;

          return (
            <div key={message._id || index}>

              {/* Date separator */}
              {showDate && (
                <div className="chat-date-separator">
                  <span>
                    {formatDate(message.createdAt)}
                  </span>
                </div>
              )}

              <div
                className={[
                  'chat-message-row',
                  isOwn ? 'is-own' : 'is-other',
                  isSameSender ? 'is-grouped' : '',
                ].join(' ')}
              >

                {/* Incoming avatar */}
                {!isOwn && (
                  <div className="chat-avatar-slot">
                    {!isSameSender && (
                      <Avatar user={message.user} />
                    )}
                  </div>
                )}

                <div className="chat-message-content">

                  {/* Username only on first message in group */}
                  {!isOwn && !isSameSender && (
                    <div className="chat-message-author">
                      {message.user?.username || 'Unknown user'}
                    </div>
                  )}

                  <div
                    className={[
                      'chat-bubble',
                      isOwn
                        ? 'chat-bubble-own'
                        : 'chat-bubble-other',
                    ].join(' ')}
                  >
                    <span className="chat-message-text">
                      {message.content}
                    </span>

                    <span className="chat-message-time">
                      {formatTime(message.createdAt)}
                    </span>
                  </div>

                </div>

                {/* Own avatar */}
                {isOwn && (
                  <div className="chat-avatar-slot chat-avatar-own-slot">
                    {!isSameSender && (
                      <Avatar
                        user={{
                          ...message.user,
                          username:
                            message.user?.username || 'You',
                        }}
                      />
                    )}
                  </div>
                )}

              </div>
            </div>
          );
        })}
      </div>

      {/* Composer */}
      <form
        className="chat-composer"
        onSubmit={handleSubmit}
      >
        <input
          type="text"
          placeholder="Write a message..."
          value={draft}
          maxLength={4000}
          disabled={sending}
          onChange={(e) => setDraft(e.target.value)}
        />

        <button
          type="submit"
          disabled={!draft.trim() || sending}
          aria-label="Send message"
          title="Send message"
        >
          {sending ? (
            <span className="chat-send-spinner" />
          ) : (
            <svg
              width="17"
              height="17"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M22 2L11 13" />
              <path d="M22 2L15 22L11 13L2 9L22 2Z" />
            </svg>
          )}
        </button>
      </form>
    </div>
  );
}