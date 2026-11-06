import { useLayoutEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { groupReactions } from '../../utils/reactions';
import { MessageBubble, type BubbleStatus } from './MessageBubble';
import { dayKey, dayLabel } from '../../utils/format';
import type { MessageRead } from '../../types/api';
import type { PendingMessage, SystemNotice } from '../../store/chatStore';

interface MessageListProps {
  chatId: string;
  messages: MessageRead[];
  pending: PendingMessage[];
  notices: SystemNotice[];
  myId: number;
  loading: boolean;
  failed: boolean;
  hasOlder: boolean;
  memberNames: Record<number, string>;
  onLoadOlder: () => void;
  onRetry: (localId: string) => void;
  onMessageAction: (message: MessageRead) => void;
  onSenderClick: (senderId: number) => void;
  onReactionsClick: (message: MessageRead) => void;
}

const NEAR_BOTTOM_PX = 140;
const LOAD_OLDER_PX = 80;

interface Row {
  key: string;
  kind: 'divider' | 'sent' | 'pending' | 'notice';
  label?: string;
  unread?: boolean;
  message?: MessageRead;
  pending?: PendingMessage;
  showSender: boolean;
}

function buildRows(messages: MessageRead[], pending: PendingMessage[], notices: SystemNotice[]): Row[] {
  const combined: Array<{ time: string; row: Omit<Row, 'key' | 'showSender'> }> = [
    ...messages.map((message) => ({ time: message.created_at, row: { kind: 'sent' as const, message } })),
    ...pending.map((item) => ({ time: item.createdAt, row: { kind: 'pending' as const, pending: item } })),
    ...notices.map((notice) => ({
      time: notice.createdAt,
      row: { kind: 'notice' as const, label: notice.text, unread: notice.unread },
    })),
  ].sort((a, b) => a.time.localeCompare(b.time));

  const rows: Row[] = [];
  let lastDay: string | null = null;
  let lastSender: number | null = null;
  combined.forEach(({ time, row }) => {
    const day = dayKey(time);
    if (day !== lastDay) {
      rows.push({ key: `day-${day}`, kind: 'divider', label: dayLabel(time), showSender: false });
      lastDay = day;
      lastSender = null;
    }
    const sender = row.kind === 'sent' ? row.message?.sender_id ?? null : null;
    const id = row.kind === 'sent' ? row.message?.id : row.pending?.localId;
    rows.push({ ...row, key: id ?? `${row.kind}-${time}`, showSender: sender !== lastSender, });
    lastSender = sender;
  });
  return rows;
}

export function MessageList({
  chatId,
  messages,
  pending,
  notices,
  myId,
  loading,
  failed,
  hasOlder,
  memberNames,
  onLoadOlder,
  onRetry,
  onMessageAction,
  onSenderClick,
  onReactionsClick,
}: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const previousHeight = useRef<number | null>(null);
  const previousFirstId = useRef<string | null>(null);
  const [flashId, setFlashId] = useState<string | null>(null);

  const jumpToMessage = (messageId: string) => {
    const target = scrollRef.current?.querySelector<HTMLElement>(`[data-message-id="${messageId}"]`);
    if (!target) return;
    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setFlashId(messageId);
    window.setTimeout(() => setFlashId((current) => (current === messageId ? null : current)), 1600);
  };
  const previousChat = useRef<string | null>(null);
  const rows = buildRows(messages, pending, notices);
  const firstId = messages[0]?.id ?? null;
  const lastCount = rows.length;

  useLayoutEffect(() => {
    const element = scrollRef.current;
    if (!element) return;
    if (previousChat.current !== chatId) {
      previousChat.current = chatId;
      previousFirstId.current = null;
      element.scrollTop = element.scrollHeight;
      return;
    }
    if (previousHeight.current !== null && firstId !== previousFirstId.current) {
      element.scrollTop += element.scrollHeight - previousHeight.current;
      previousHeight.current = null;
    } else {
      const distance = element.scrollHeight - element.scrollTop - element.clientHeight;
      if (distance < NEAR_BOTTOM_PX) element.scrollTop = element.scrollHeight;
    }
    previousFirstId.current = firstId;
  }, [chatId, firstId, lastCount]);

  const handleScroll = () => {
    const element = scrollRef.current;
    if (!element || loading || !hasOlder) return;
    if (element.scrollTop < LOAD_OLDER_PX) {
      previousHeight.current = element.scrollHeight;
      onLoadOlder();
    }
  };

  const statusFor = (message: MessageRead): BubbleStatus => {
    if (message.sender_id !== myId) return 'incoming';
    const readers = message.reads.filter((receipt) => receipt.user_id !== myId);
    return readers.length > 0 ? 'read' : 'sent';
  };

  return (
    <div className="message-list" ref={scrollRef} onScroll={handleScroll}>
      {loading && <p className="muted list-note">Загружаем историю...</p>}
      {failed && messages.length === 0 && (
        <p className="error-text list-note">Не удалось загрузить сообщения. Выберите чат снова.</p>
      )}
      {hasOlder && !loading && <p className="muted list-note list-note--small">Прокрутите вверх, чтобы загрузить историю</p>}
      {!loading && !failed && messages.length === 0 && pending.length === 0 && (
        <p className="muted list-note">Сообщений пока нет. Начните разговор первым.</p>
      )}
      <AnimatePresence initial={false}>
        {rows.map((row) => {
          if (row.kind === 'divider' || row.kind === 'notice') {
            return (
              <div key={row.key} className={row.unread ? 'day-divider day-divider--unread' : 'day-divider'}>
                <span>
                  {row.unread && <i className="notice-dot" aria-label="Непрочитано" />}
                  {row.label}
                </span>
              </div>
            );
          }
          if (row.kind === 'pending' && row.pending) {
            const item = row.pending;
            return (
              <MessageBubble
                key={row.key}
                content={item.content}
                createdAt={item.createdAt}
                own
                status={item.status === 'failed' ? 'failed' : 'sending'}
                failure={item.failure}
                onRetry={() => onRetry(item.localId)}
                showSender={false}
                senderName=""
              />
            );
          }
          if (row.kind === 'sent' && row.message) {
            const message = row.message;
            const own = message.sender_id === myId;
            return (
              <motion.div
                key={row.key}
                data-message-id={message.id}
                className={flashId === message.id ? 'message-row--flash' : undefined}
                layout="position"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              >
                <MessageBubble
                  content={message.content}
                  createdAt={message.created_at}
                  editedAt={message.edited_at}
                  forwardedFrom={message.forwarded_from_name}
                  replyTo={
                    message.reply_to
                      ? {
                        id: message.reply_to.id,
                        senderName: memberNames[message.reply_to.sender_id] ?? 'Участник',
                        content: message.reply_to.content,
                      }
                      : null
                  }
                  own={own}
                  status={statusFor(message)}
                  failure={null}
                  showSender={row.showSender && !own}
                  senderName={memberNames[message.sender_id] ?? 'Участник'}
                  onSenderClick={() => onSenderClick(message.sender_id)}
                  reactions={groupReactions(message.reactions, myId)}
                  onReactionsClick={() => onReactionsClick(message)}
                  onReplyClick={jumpToMessage}
                  onClick={() => onMessageAction(message)}
                />
              </motion.div>
            );
          }
          return null;
        })}
      </AnimatePresence>
    </div>
  );
}
