import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Avatar } from '../common/Avatar';
import { Gibbon } from '../mascot/Gibbon';
import { MessageList } from './MessageList';
import { EmojiPickerDialog } from './EmojiPickerDialog';
import { ReactionsDialog } from './ReactionsDialog';
import { myReactionOf } from '../../utils/reactions';
import { MessageActionsDialog } from './MessageActionsDialog';
import { ForwardMessageDialog } from './ForwardMessageDialog';
import { useChatMembers } from '../../hooks/useChatMembers';
import { TypingIndicator } from './TypingIndicator';
import { acknowledgeIncomingMessages, loadOlder, reactToMessage, retryPendingMessage, sendChatMessage } from '../../services/chatSync';
import { sendTyping } from '../../services/websocket/realtime';
import { useAuthStore } from '../../store/authStore';
import { useChatStore } from '../../store/chatStore';
import { useUiStore } from '../../store/uiStore';
import { useContactNames } from '../../store/contactsStore';
import { chatTitle, opponentOf } from '../../utils/format';
import type { MessageRead, UserStatus } from '../../types/api';

export function ChatWindow() {
  const contactNames = useContactNames();
  const myIdForTitle = useAuthStore((state) => state.user?.id ?? null);
  const myId = useAuthStore((state) => state.user?.id ?? null);
  const activeChatId = useChatStore((state) => state.activeChatId);
  const chat = useChatStore((state) => state.chats.find((item) => item.id === state.activeChatId) ?? null);
  const messages = useChatStore((state) => (state.activeChatId ? state.messagesByChat[state.activeChatId] : undefined));
  const messagesStatus = useChatStore((state) => (state.activeChatId ? state.messagesStatus[state.activeChatId] : undefined));
  const hasOlder = useChatStore((state) => (state.activeChatId ? state.hasOlderByChat[state.activeChatId] ?? false : false));
  const pending = useChatStore((state) => (state.activeChatId ? state.pendingByChat[state.activeChatId] : undefined));
  const notices = useChatStore((state) => (state.activeChatId ? state.noticesByChat[state.activeChatId] : undefined));
  const presence = useChatStore((state) => state.presence);
  const blockedUserIds = useChatStore((state) => state.blockedUserIds);
  const chatSocket = useChatStore((state) => state.socketStatus.chat);
  const rightPanelOpen = useUiStore((state) => state.rightPanelOpen);
  const toggleRightPanel = useUiStore((state) => state.toggleRightPanel);
  const setMemberProfile = useUiStore((state) => state.setMemberProfile);
  const memberRolesVersion = useChatStore((state) =>
    state.activeChatId ? state.memberRolesVersion[state.activeChatId] ?? 0 : 0,
  );
  const roles = useChatMembers(
    chat?.type === 'group' ? activeChatId : null,
    `${chat?.members.map((member) => member.id).join(',') ?? ''}:${memberRolesVersion}`,
  );
  const [actionMessage, setActionMessage] = useState<MessageRead | null>(null);
  const [reactionDialog, setReactionDialog] = useState<{ mode: 'pick' | 'who'; messageId: string } | null>(null);
  const [forwardMessage, setForwardMessage] = useState<MessageRead | null>(null);
  const [replyTo, setReplyTo] = useState<MessageRead | null>(null);

  useEffect(() => {
    setReplyTo(null);
  }, [activeChatId]);

  useEffect(() => {
    if (myId !== null && messages && activeChatId) acknowledgeIncomingMessages(activeChatId, messages, myId);
  }, [activeChatId, messages, myId]);

  if (!chat || !activeChatId || myId === null) {
    return (
      <section className="chat-window chat-window--empty glass">
        <Gibbon size={180} />
        <h2>Выберите диалог</h2>
        <p className="muted">Здесь появятся сообщения выбранного собеседника.</p>
      </section>
    );
  }

  const title = chatTitle(chat, contactNames, myIdForTitle);
  const opponent = opponentOf(chat, myId);
  const opponentBlocked = opponent !== null && blockedUserIds.includes(opponent.id);
  const memberNames = Object.fromEntries(chat.members.map((member) => [member.id, member.name]));
  const roleByUser = new Map((roles.members ?? []).map((member) => [member.id, member.role]));
  const myRole = roleByUser.get(myId);
  const reactionTarget = reactionDialog
    ? (messages ?? []).find((item) => item.id === reactionDialog.messageId) ?? null
    : null;
  const openSenderProfile = (senderId: number) => {
    if (blockedUserIds.includes(senderId)) return;
    const member = chat?.members.find((item) => item.id === senderId);
    if (member) setMemberProfile(member);
  };
  const canManageMessage = (message: MessageRead) => {
    if (message.sender_id === myId || myRole === 'OWNER') return true;
    const senderRole = roleByUser.get(message.sender_id);
    return myRole === 'ADMIN' && senderRole !== undefined && senderRole !== 'OWNER';
  };

  const status: UserStatus | null = opponent ? (presence[opponent.id] ?? null) : null;
  const subtitle =
    chat.type === 'group'
      ? `${chat.members.length} участников`
      : status === 'online'
        ? 'В сети'
        : 'Не в сети';

  return (
    <section className="chat-window glass">
      <button
        type="button"
        className="chat-header chat-header--button"
        onClick={toggleRightPanel}
        aria-expanded={rightPanelOpen}
        aria-label={chat.type === 'group' ? 'Информация о группе' : 'Информация о собеседнике'}
      >
        <Avatar name={title} size={44} status={chat.type === 'direct' ? status : null} />
        <div className="chat-header__meta">
          <h2>{title}</h2>
          <span className="muted">{subtitle}</span>
        </div>
      </button>

      <MessageList
        chatId={activeChatId}
        messages={messages ?? []}
        pending={pending ?? []}
        notices={notices ?? []}
        myId={myId}
        loading={messagesStatus === 'loading'}
        failed={messagesStatus === 'error'}
        hasOlder={hasOlder}
        memberNames={memberNames}
        onLoadOlder={() => void loadOlder(activeChatId)}
        onRetry={(localId) => retryPendingMessage(activeChatId, localId)}
        onMessageAction={setActionMessage}
        onSenderClick={openSenderProfile}
        onReactionsClick={(message) => setReactionDialog({ mode: 'who', messageId: message.id })}
      />

      <AnimatePresence>
        {actionMessage && (
          <MessageActionsDialog
            message={actionMessage}
            canEdit={actionMessage.sender_id === myId}
            canDelete={canManageMessage(actionMessage)}
            onClose={() => setActionMessage(null)}
            onForward={() => {
              setForwardMessage(actionMessage);
              setActionMessage(null);
            }}
            onReply={() => {
              setReplyTo(actionMessage);
              setActionMessage(null);
            }}
            onReact={() => {
              setReactionDialog({ mode: 'pick', messageId: actionMessage.id });
              setActionMessage(null);
            }}
          />
        )}
        {reactionTarget && reactionDialog?.mode === 'pick' && (
          <EmojiPickerDialog
            key="reaction-pick"
            currentEmoji={myReactionOf(reactionTarget.reactions, myId)}
            onPick={(emoji) => {
              void reactToMessage(reactionTarget.chat_id, reactionTarget.id, emoji);
              setReactionDialog(null);
            }}
            onClose={() => setReactionDialog(null)}
          />
        )}
        {reactionTarget && reactionDialog?.mode === 'who' && (
          <ReactionsDialog
            key="reaction-who"
            reactions={reactionTarget.reactions}
            myId={myId}
            nameOf={(userId) => chat.members.find((member) => member.id === userId)?.name ?? 'Участник'}
            onOpenProfile={(userId) => {
              setReactionDialog(null);
              openSenderProfile(userId);
            }}
            onRemoveMine={(emoji) => {
              void reactToMessage(reactionTarget.chat_id, reactionTarget.id, emoji);
              setReactionDialog(null);
            }}
            onClose={() => setReactionDialog(null)}
          />
        )}
        {forwardMessage && (
          <ForwardMessageDialog message={forwardMessage} onClose={() => setForwardMessage(null)} />
        )}
      </AnimatePresence>

      <div className="chat-footer">
        <TypingIndicator chatId={activeChatId} myId={myId} />
        {replyTo && (
          <div className="composer__reply">
            <div className="composer__reply-body">
              <span className="composer__reply-title">Ответ: {memberNames[replyTo.sender_id] ?? 'Участник'}</span>
              <span className="composer__reply-text">{replyTo.content}</span>
            </div>
            <button
              type="button"
              className="composer__reply-close"
              aria-label="Отменить ответ"
              onClick={() => setReplyTo(null)}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
                <path d="M2 2 L12 12 M12 2 L2 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        )}
        {opponentBlocked ? (
          <p className="muted composer-blocked">Чат недоступен: пользователь заблокирован.</p>
        ) : (
        <Composer
          chatId={activeChatId}
          connected={chatSocket === 'open'}
          replyToId={replyTo?.id ?? null}
          onReplySent={() => setReplyTo(null)}
        />
        )}
      </div>
    </section>
  );
}

interface ComposerProps {
  chatId: string;
  connected: boolean;
  replyToId: string | null;
  onReplySent: () => void;
}

function Composer({ chatId, connected, replyToId, onReplySent }: ComposerProps) {
  const [text, setText] = useState('');
  const [justSent, setJustSent] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const element = textareaRef.current;
    if (!element) return;
    element.style.height = 'auto';
    element.style.height = `${Math.min(element.scrollHeight, 160)}px`;
  }, [text]);

  useEffect(() => {
    setText('');
  }, [chatId]);

  const send = () => {
    if (!connected || text.trim().length === 0) return;
    sendChatMessage(chatId, text, replyToId);
    setText('');
    onReplySent();
    setJustSent((count) => count + 1);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      send();
    }
  };

  const handleChange = (value: string) => {
    setText(value);
    if (value.trim().length > 0) sendTyping();
  };

  return (
    <div className="composer">
      <textarea
        ref={textareaRef}
        className="field composer__input"
        rows={1}
        maxLength={10000}
        value={text}
        onChange={(event) => handleChange(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={connected ? 'Напишите сообщение' : 'Подключаемся к чату...'}
        aria-label="Текст сообщения"
      />
      <motion.button
        type="button"
        className="btn-primary composer__send"
        onClick={send}
        disabled={!connected || text.trim().length === 0}
        whileTap={{ scale: 0.92 }}
        aria-label="Отправить"
      >
        <AnimatePresence mode="wait">
          <motion.span
            key={justSent}
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 420, damping: 18 }}
          >
            Отправить
          </motion.span>
        </AnimatePresence>
      </motion.button>
    </div>
  );
}
