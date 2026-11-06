import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Avatar } from '../common/Avatar';
import { UserProfileBody } from './UserProfileBody';
import { GroupManagePanel } from './GroupManagePanel';
import { useChatMembers } from '../../hooks/useChatMembers';
import { useChatDescription } from '../../hooks/useChatDescription';
import { useAuthStore } from '../../store/authStore';
import { useChatStore } from '../../store/chatStore';
import { useUiStore } from '../../store/uiStore';
import { useContactNames } from '../../store/contactsStore';
import { chatTitle, opponentOf } from '../../utils/format';
import type { ChatRole } from '../../types/api';

type PanelTab = 'members' | 'manage';

const ROLE_LABELS: Partial<Record<ChatRole, string>> = { OWNER: 'Владелец', ADMIN: 'Админ' };
const MANAGER_ROLES: readonly ChatRole[] = ['OWNER', 'ADMIN'];

export function RightPanel() {
  const contactNames = useContactNames();
  const myIdForTitle = useAuthStore((state) => state.user?.id ?? null);
  const open = useUiStore((state) => state.rightPanelOpen);
  const chat = useChatStore((state) => state.chats.find((item) => item.id === state.activeChatId) ?? null);
  const presence = useChatStore((state) => state.presence);
  const myId = useAuthStore((state) => state.user?.id ?? null);
  const setMemberProfile = useUiStore((state) => state.setMemberProfile);
  const [tab, setTab] = useState<PanelTab>('members');
  const groupChatId = open && chat?.type === 'group' ? chat.id : null;
  const rolesVersion = useChatStore((state) => (chat ? state.memberRolesVersion[chat.id] ?? 0 : 0));
  const bumpMemberRoles = useChatStore((state) => state.bumpMemberRoles);
  const roles = useChatMembers(
    groupChatId,
    `${chat?.members.map((member) => member.id).join(',') ?? ''}:${rolesVersion}`,
  );
  const description = useChatDescription(groupChatId);

  if (!chat || myId === null) return null;
  const opponent = opponentOf(chat, myId);
  const title = chatTitle(chat, contactNames, myIdForTitle);
  const roleByUser = new Map((roles.members ?? []).map((member) => [member.id, member.role]));
  const myRole = roleByUser.get(myId);
  const canManage = myRole !== undefined && MANAGER_ROLES.includes(myRole);
  const activeTab: PanelTab = canManage ? tab : 'members';

  return (
    <AnimatePresence initial={false}>
      {open && (
        <motion.aside
          key="info-panel"
          className="info-panel glass"
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 'var(--info-width)', opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          aria-label="Информация о чате"
        >
          <div className="info-panel__inner">
            {chat.type === 'group' ? (
              <>
                <div className="info-panel__hero">
                  <Avatar name={title} size={72} />
                  <h3>{title}</h3>
                  <span className="muted">Групповой чат</span>
                </div>

                {canManage && (
                  <div className="info-panel__tabs" role="tablist">
                    <button
                      type="button"
                      role="tab"
                      aria-selected={activeTab === 'members'}
                      className="info-panel__tab"
                      onClick={() => setTab('members')}
                    >
                      Участники
                    </button>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={activeTab === 'manage'}
                      className="info-panel__tab"
                      onClick={() => setTab('manage')}
                    >
                      Управление
                    </button>
                  </div>
                )}

                {activeTab === 'members' ? (
                  <>
                  <section className="info-panel__section">
                    <h4>Описание</h4>
                    {description.loading ? (
                      <p className="muted">Загружаем описание...</p>
                    ) : description.failed ? (
                      <p className="muted">Не удалось загрузить описание</p>
                    ) : description.description?.trim() ? (
                      <p className="info-panel__description">{description.description}</p>
                    ) : (
                      <p className="muted">Описание не добавлено</p>
                    )}
                  </section>

                  <section className="info-panel__section">
                    <h4>Участники</h4>
                    {roles.failed && <p className="muted">Не удалось загрузить роли участников</p>}
                    <ul className="info-panel__members">
                      {chat.members
                        .filter((member) => member.id !== myId)
                        .map((member) => {
                          const roleLabel = ROLE_LABELS[roleByUser.get(member.id) ?? 'USER'];
                          return (
                            <li key={member.id}>
                              <button type="button" className="info-panel__member" onClick={() => setMemberProfile(member)}>
                                <Avatar name={member.name} size={32} status={presence[member.id] ?? null} />
                                <div>
                                  <span className="info-panel__member-name">
                                    {member.name}
                                    {roleLabel && <span className="role-badge">{roleLabel}</span>}
                                  </span>
                                  <span className="muted">@{member.username}</span>
                                </div>
                              </button>
                            </li>
                          );
                        })}
                    </ul>
                  </section>
                  </>
                ) : (
                  <GroupManagePanel
                    key={chat.id}
                    chatId={chat.id}
                    currentTitle={chat.title ?? title}
                    members={roles.members ?? []}
                    onMembersChanged={() => bumpMemberRoles(chat.id)}
                  />
                )}
              </>
            ) : (
              opponent && (
                <section className="info-panel__section">
                  <UserProfileBody
                    username={opponent.username}
                    fallbackName={title}
                    status={presence[opponent.id] ?? null}
                  />
                </section>
              )
            )}

            <section className="info-panel__section">
              <h4>Медиа и файлы</h4>
              <p className="muted">Вложения пока не поддерживаются, поэтому здесь ничего не отображается.</p>
            </section>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
