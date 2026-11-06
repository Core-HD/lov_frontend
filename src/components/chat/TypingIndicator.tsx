import { useChatStore } from '../../store/chatStore';

interface TypingIndicatorProps {
  chatId: string;
  myId: number;
}

export function TypingIndicator({ chatId, myId }: TypingIndicatorProps) {
  const typing = useChatStore((state) => state.typingByChat[chatId]);
  const someoneElseTyping = Object.keys(typing ?? {}).some((id) => Number(id) !== myId);

  return (
    <div className="typing-slot" aria-live="polite">
      {someoneElseTyping && (
        <div className="typing">
          <span className="typing__dots" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
          <span className="muted">Печатает...</span>
        </div>
      )}
    </div>
  );
}
