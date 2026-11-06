import { motion } from 'framer-motion';
import { formatTime } from '../../utils/format';
import type { ReactionGroup } from '../../utils/reactions';

export type BubbleStatus = 'incoming' | 'sending' | 'sent' | 'read' | 'failed';

interface MessageBubbleProps {
  content: string;
  createdAt: string;
  own: boolean;
  status: BubbleStatus;
  failure: string | null;
  editedAt?: string | null;
  forwardedFrom?: string | null;
  replyTo?: { id: string; senderName: string; content: string } | null;
  onSenderClick?: () => void;
  onReplyClick?: (id: string) => void;
  showSender: boolean;
  senderName: string;
  onRetry?: () => void;
  onClick?: () => void;
  reactions?: ReactionGroup[];
  onReactionsClick?: () => void;
}

function Ticks({ read }: { read: boolean }) {
  return (
    <svg className={`ticks${read ? ' ticks--read' : ''}`} width="16" height="11" viewBox="0 0 16 11" aria-hidden="true">
      <path d="M1 5.5 L4.5 9 L10 2.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      {read && <path d="M6 5.5 L9.5 9 L15 2.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />}
    </svg>
  );
}

export function MessageBubble({
  content,
  createdAt,
  own,
  status,
  failure,
  editedAt,
  forwardedFrom,
  replyTo,
  onSenderClick,
  onReplyClick,
  showSender,
  senderName,
  onRetry,
  onClick,
  reactions,
  onReactionsClick,
}: MessageBubbleProps) {
  const failed = status === 'failed';
  return (
    <div className={`bubble-row${own ? ' bubble-row--own' : ''}`}>
      <motion.div
        className={`bubble${own ? ' bubble--own' : ''}${failed ? ' bubble--failed' : ''}${onClick ? ' bubble--actionable' : ''}`}
        whileHover={{ y: -1 }}
        onClick={onClick}
        role={onClick ? 'button' : undefined}
        tabIndex={onClick ? 0 : undefined}
        transition={{ duration: 0.2 }}
      >
        {showSender &&
          (onSenderClick ? (
            <button
              type="button"
              className="bubble__sender bubble__sender--link"
              onClick={(event) => {
                event.stopPropagation();
                onSenderClick();
              }}
            >
              {senderName}
            </button>
          ) : (
            <span className="bubble__sender">{senderName}</span>
          ))}
        {forwardedFrom && <span className="bubble__forwarded">Переслано от {forwardedFrom}</span>}
        {replyTo && (
          <button
            type="button"
            className="bubble__reply"
            onClick={(event) => {
              event.stopPropagation();
              onReplyClick?.(replyTo.id);
            }}
          >
            <span className="bubble__reply-sender">{replyTo.senderName}</span>
            <span className="bubble__reply-text">{replyTo.content}</span>
          </button>
        )}
        <p className="bubble__text">{content}</p>
      {reactions && reactions.length > 0 && (
          reactions.length >= 3 ? (
            <button
              type="button"
              className="bubble__reaction-stack"
              aria-label="Показать реакции"
              onClick={(event) => {
                event.stopPropagation();
                onReactionsClick?.();
              }}
            >
              <span className="bubble__reaction-stack-icons">
                {reactions.slice(0, 3).map((group, index) => (
                  <span key={group.emoji} className="bubble__reaction-stack-icon" style={{ zIndex: 3 - index }}>
                    {group.emoji}
                  </span>
                ))}
              </span>
              <span className="bubble__reaction-count">{reactions.reduce((sum, group) => sum + group.count, 0)}</span>
            </button>
          ) : (
            <span className="bubble__reactions">
              {reactions.map((group) => (
                <button
                  key={group.emoji}
                  type="button"
                  className={`bubble__reaction${group.mine ? ' bubble__reaction--mine' : ''}`}
                  onClick={(event) => {
                    event.stopPropagation();
                    onReactionsClick?.();
                  }}
                >
                  <span>{group.emoji}</span>
                  {group.count > 1 && <span className="bubble__reaction-count">{group.count}</span>}
                </button>
              ))}
            </span>
          )
        )}
        <span className="bubble__meta">
          {editedAt && <span>изменено</span>}
          <span>{formatTime(createdAt)}</span>
          {own && status === 'sending' && <span className="bubble__state">Отправка...</span>}
          {own && (status === 'sent' || status === 'read') && <Ticks read={status === 'read'} />}
        </span>
      </motion.div>
      {failed && (
        <div className="bubble-failure">
          <span className="error-text">{failure ?? 'Не отправлено'}</span>
          {onRetry && (
            <button type="button" className="link-button" onClick={onRetry}>
              Повторить
            </button>
          )}
        </div>
      )}
    </div>
  );
}
