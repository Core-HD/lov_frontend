import { useMemo, useState, type FormEvent } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Avatar } from '../common/Avatar';
import { Gibbon } from '../mascot/Gibbon';
import { refreshChats, leaveGroup, selectChat, blockOpponent } from '../../services/chatSync';
import { renameContact } from '../../services/api/contacts';
import { useChatMembers } from '../../hooks/useChatMembers';
import { useAuthStore } from '../../store/authStore';
import { lastMessageOf, unreadCountOf, useChatStore } from '../../store/chatStore';
import { useUiStore } from '../../store/uiStore';
import { contactsToken, useContactNames, useContactsStore } from '../../store/contactsStore';
import { chatTitle, formatListTime, opponentOf } from '../../utils/format';
import type { ChatSummary, MessageRead, UserStatus } from '../../types/api';
import { describeError } from './ContactsDialog';

export function ChatList() {
  const contactNames = useContactNames();
  const myIdForTitle = useAuthStore((state) => state.user?.id ?? null);
  const myId = useAuthStore((state) => state.user?.id ?? null);
  const chats = useChatStore((state) => state.chats);
  const chatsStatus = useChatStore((state) => state.chatsStatus);
  const chatsError = useChatStore((state) => state.chatsError);
  const messagesByChat = useChatStore((state) => state.messagesByChat);
  const activeChatId = useChatStore((state) => state.activeChatId);
  const presence = useChatStore((state) => state.presence);
  const noticesByChat = useChatStore((state) => state.noticesByChat);
  const notificationsSocket = useChatStore((state) => state.socketStatus.notifications);
  const setNewChatOpen = useUiStore((state) => state.setNewChatOpen);
  const setNewGroupOpen = useUiStore((state) => state.setNewGroupOpen);
  const setContactsOpen = useUiStore((state) => state.setContactsOpen);
  const setProfileOpen = useUiStore((state) => state.setProfileOpen);
  const user = useAuthStore((state) => state.user);
  const [query, setQuery] = useState('');
  const [chatMenu, setChatMenu] = useState(false);

  const rows = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return chats
      .map((chat) => ({
        chat,
        last: lastMessageOf(messagesByChat[chat.id]),
        unread:
          (user ? unreadCountOf(messagesByChat[chat.id], user.id) : 0) +
          (chat.id === activeChatId ? 0 : (noticesByChat[chat.id] ?? []).filter((notice) => notice.unread).length),
      }))
      .filter(({ chat }) => normalized === '' || chatTitle(chat, contactNames, myIdForTitle).toLowerCase().includes(normalized))
      .sort((a, b) => activityOf(b.chat, b.last).localeCompare(activityOf(a.chat, a.last)));
  }, [chats, messagesByChat, noticesByChat, activeChatId, query, contactNames, myIdForTitle, user]);

  const connectionLost = notificationsSocket !== 'open';

  return (
    <aside className="sidebar glass">
      <header className="sidebar__header">
        <div className="sidebar__brand">
          <Gibbon size={44} />
          <div>
            <h2>GibbonChat</h2>
            <span className="muted sidebar__subtitle">Ваши диалоги</span>
          </div>
        </div>
        <div className="sidebar__actions">
          <button
            type="button"
            className="sidebar__profile"
            onClick={() => setProfileOpen(true)}
            aria-label="Профиль и настройки"
            title="Профиль и настройки"
          >
            <Avatar name={user?.name ?? '?'} size={36} />
          </button>
        </div>
      </header>

      <div className="sidebar__create">
        <button type="button" className="btn-ghost sidebar__create-btn" onClick={() => { setChatMenu(false); setContactsOpen(true); }}>
          + Создать контакт
        </button>
        <div className="sidebar__create-wrap">
          <button
            type="button"
            className="btn-primary sidebar__create-btn"
            aria-expanded={chatMenu}
            onClick={() => setChatMenu((v) => !v)}
          >
            + Создать чат
          </button>
          {chatMenu && (
            <div className="glass sidebar__menu" role="menu">
              <button type="button" role="menuitem" onClick={() => { setChatMenu(false); setNewChatOpen(true); }}>
                Личный чат
              </button>
              <button type="button" role="menuitem" onClick={() => { setChatMenu(false); setNewGroupOpen(true); }}>
                Группа
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="sidebar__search">
        <input
          className="field"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Поиск по диалогам"
          aria-label="Поиск по диалогам"
        />
      </div>

      <AnimatePresence>
        {connectionLost && (
          <motion.div
            className="connection-banner"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <span className="connection-dot" /> Соединение восстанавливается...
          </motion.div>
        )}
      </AnimatePresence>

      <div className="chat-list" role="listbox" aria-label="Список диалогов">
        {chatsStatus === 'loading' && chats.length === 0 && <p className="muted list-note">Загружаем диалоги...</p>}
        {chatsStatus === 'error' && (
          <div className="list-note">
            <p className="error-text">{chatsError}</p>
            <button type="button" className="btn-ghost" onClick={() => void refreshChats()}>
              Повторить
            </button>
          </div>
        )}
        {chatsStatus === 'ready' && chats.length === 0 && (
          <div className="list-note">
            <p className="muted">Пока нет диалогов. Начните первый разговор.</p>
          </div>
        )}
        {chats.length > 0 && rows.length === 0 && <p className="muted list-note">Ничего не найдено</p>}
        {rows.map(({ chat, last, unread }, index) => (
          <ChatListItem
            key={chat.id}
            chat={chat}
            last={last}
            index={index}
            active={chat.id === activeChatId}
            unread={unread}
            online={myId === null ? null : presenceOf(chat, myId, presence)}
            onSelect={() => selectChat(chat.id)}
          />
        ))}
      </div>

    </aside>
  );
}

function presenceOf(chat: ChatSummary, myId: number, presence: Record<number, UserStatus>): UserStatus | null {
  const opponent = opponentOf(chat, myId);
  return opponent ? (presence[opponent.id] ?? null) : null;
}

function activityOf(chat: ChatSummary, last: MessageRead | undefined): string {
  return last?.created_at ?? chat.created_at;
}

interface ChatListItemProps {
  chat: ChatSummary;
  last: MessageRead | undefined;
  index: number;
  active: boolean;
  unread: number;
  online: UserStatus | null;
  onSelect: () => void;
}

function ChatListItem({ chat, last, index, active, unread, online, onSelect }: ChatListItemProps) {
  const contactNames = useContactNames();
  const myIdForTitle = useAuthStore((state) => state.user?.id ?? null);
  const title = chatTitle(chat, contactNames, myIdForTitle);
  const myId = useAuthStore((state) => state.user?.id ?? null);
  const [renaming, setRenaming] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const opponent = myId === null ? null : opponentOf(chat, myId);
  const rolesVersion = useChatStore((state) => state.memberRolesVersion[chat.id] ?? 0);
  const groupMembers = useChatMembers(chat.type === 'group' ? chat.id : null, String(rolesVersion));
  const myRole = groupMembers.members?.find((member) => member.id === myId)?.role ?? null;
  const blockedUserIds = useChatStore((state) => state.blockedUserIds);
  const canRename = chat.type === 'direct' && opponent !== null;
  const canBlock = chat.type === 'direct' && opponent !== null && !blockedUserIds.includes(opponent.id);
  const canLeave = chat.type === 'group' && myRole !== null && myRole !== 'OWNER';
  const preview = last
    ? `${last.sender_id === myId ? 'Вы: ' : ''}${last.content}`
    : chat.type === 'group'
      ? `${chat.members.length} участников`
      : 'Нет сообщений';

  if (renaming && opponent) {
    return (
      <div className="chat-row">
        <ChatRenameForm contactUserId={opponent.id} initialName={title} onDone={() => setRenaming(false)} />
      </div>
    );
  }

  const handleBlock = () => {
    if (!opponent) return;
    if (!window.confirm(`Заблокировать «${title}»? Вы не сможете писать друг другу.`)) return;
    void blockOpponent(opponent).catch(() => {
      useChatStore.getState().setNotice('Не удалось заблокировать пользователя. Попробуйте ещё раз.');
    });
  };

  const handleLeave = () => {
    if (!window.confirm(`Покинуть группу «${title}»?`)) return;
    void leaveGroup(chat.id);
  };

  return (
    <div className="chat-row">
      <motion.button
        type="button"
        role="option"
        aria-selected={active}
        className={`chat-item${active ? ' chat-item--active' : ''}`}
        onClick={onSelect}
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: Math.min(index * 0.03, 0.3), duration: 0.35 }}
        whileTap={{ scale: 0.99 }}
      >
        <Avatar name={title} size={44} status={chat.type === 'direct' ? online : null} />
        <span className="chat-item__body">
          <span className="chat-item__top">
            <span className="chat-item__title">{title}</span>
            {last && <span className="chat-item__time">{formatListTime(last.created_at)}</span>}
          </span>
          <span className="chat-item__bottom">
            <span className="chat-item__preview">{preview}</span>
            {unread > 0 && <span className="unread-badge">{unread > 99 ? '99+' : unread}</span>}
          </span>
        </span>
      </motion.button>
      {(canRename || canLeave) && (
        <div className="chat-row__menu">
          <button
            type="button"
            className="chat-row__action"
            aria-label="Действия с чатом"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            title="Действия"
            onClick={() => setMenuOpen((open) => !open)}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <circle cx="12" cy="5" r="1.8" />
              <circle cx="12" cy="12" r="1.8" />
              <circle cx="12" cy="19" r="1.8" />
            </svg>
          </button>
          {menuOpen &&
            createPortal(
              <div className="chat-menu-overlay" onClick={() => setMenuOpen(false)}>
                <div className="glass chat-menu" role="menu" aria-label="Действия с чатом" onClick={(event) => event.stopPropagation()}>
                  {canRename && (
                    <button type="button" role="menuitem" onClick={() => { setMenuOpen(false); setRenaming(true); }}>
                      Переименовать
                    </button>
                  )}
                  {canBlock && (
                    <button type="button" role="menuitem" className="chat-menu__danger" onClick={() => { setMenuOpen(false); handleBlock(); }}>
                      Заблокировать
                    </button>
                  )}
                  {canLeave && (
                    <button type="button" role="menuitem" className="chat-menu__danger" onClick={() => { setMenuOpen(false); handleLeave(); }}>
                      Покинуть группу
                    </button>
                  )}
                </div>
              </div>,
              document.body,
            )}
        </div>
      )}
    </div>
  );
}

interface ChatRenameFormProps {
  contactUserId: number;
  initialName: string;
  onDone: () => void;
}

function ChatRenameForm({ contactUserId, initialName, onDone }: ChatRenameFormProps) {
  const load = useContactsStore((state) => state.load);
  const [name, setName] = useState(initialName);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || trimmed.length > 16) {
      setError('Имя — от 1 до 16 символов.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await renameContact(contactsToken(), contactUserId, trimmed);
      await load();
      onDone();
    } catch (e) {
      setError(describeError(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="chat-rename" onSubmit={handleSubmit} noValidate>
      <input
        className="field"
        value={name}
        maxLength={16}
        autoFocus
        aria-label="Новое имя контакта"
        onChange={(event) => setName(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Escape') onDone();
        }}
      />
      <div className="chat-rename__actions">
        <button type="button" className="btn-ghost" onClick={onDone} disabled={busy}>
          Отмена
        </button>
        <button type="submit" className="btn-primary" disabled={busy}>
          {busy ? 'Сохраняем…' : 'Сохранить'}
        </button>
      </div>
      {error && <p className="error-text" role="alert">{error}</p>}
    </form>
  );
}
