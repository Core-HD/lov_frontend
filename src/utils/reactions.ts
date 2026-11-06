import type { MessageRead } from '../types/api';

export interface ReactionGroup {
  emoji: string;
  count: number;
  mine: boolean;
}

export function groupReactions(reactions: MessageRead['reactions'], myId: number): ReactionGroup[] {
  const groups = new Map<string, ReactionGroup>();
  for (const reaction of reactions) {
    const group = groups.get(reaction.emoji) ?? { emoji: reaction.emoji, count: 0, mine: false };
    group.count += 1;
    if (reaction.user_id === myId) group.mine = true;
    groups.set(reaction.emoji, group);
  }
  return [...groups.values()];
}

export function myReactionOf(reactions: MessageRead['reactions'], myId: number): string | null {
  return reactions.find((reaction) => reaction.user_id === myId)?.emoji ?? null;
}
