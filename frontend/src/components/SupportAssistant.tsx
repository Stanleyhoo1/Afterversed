import { FormEvent, useCallback, useState } from "react";
import { cn } from "@/lib/utils";

type SupportMessage = {
  sender: "user" | "assistant";
  text: string;
};

const SupportAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [messages, setMessages] = useState<SupportMessage[]>([]);

  const handleSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const trimmed = inputValue.trim();
      if (!trimmed) {
        return;
      }

      setMessages(prev => [
        ...prev,
        { sender: "user", text: trimmed },
        { sender: "assistant", text: trimmed },
      ]);
      setInputValue("");
    },
    [inputValue],
  );

  const floatingButtonClasses = [
    "h-14 w-14 rounded-full bg-primary text-2xl text-primary-foreground shadow-xl transition hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
    !isOpen ? "animate-gentle-float" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {isOpen && (
        <div className="w-80 max-w-[calc(100vw-3rem)] rounded-2xl border border-border bg-card shadow-2xl flex flex-col overflow-hidden">
          <div className="flex items-center justify-between bg-muted/40 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-foreground">Need someone to talk to?</p>
              <p className="text-xs text-muted-foreground">Share anything—I'll reflect it back.</p>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="h-7 w-7 inline-flex items-center justify-center rounded-full text-muted-foreground hover:bg-muted/60 hover:text-foreground transition"
              aria-label="Close support chat"
            >
              ×
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 max-h-[50vh]">
            {messages.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Say anything you need to. I'll echo it back so you can see your words.
              </p>
            ) : (
              messages.map((message, index) => (
                <div
                  key={`${message.sender}-${index}`}
                  className={cn(
                    "max-w-[85%] rounded-2xl px-4 py-2 text-sm shadow-sm",
                    message.sender === "user"
                      ? "ml-auto bg-primary text-primary-foreground"
                      : "mr-auto bg-muted text-foreground",
                  )}
                >
                  {message.text}
                </div>
              ))
            )}
          </div>
          <form onSubmit={handleSubmit} className="border-t border-border bg-card/80 px-4 py-3 flex items-center gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={(event) => setInputValue(event.target.value)}
              placeholder="Type a thought…"
              className="flex-1 rounded-full border border-border bg-background px-4 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            />
            <button
              type="submit"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition hover:bg-primary/90 disabled:opacity-60"
              disabled={!inputValue.trim()}
              aria-label="Send"
            >
              ↩
            </button>
          </form>
        </div>
      )}
      <button
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        className={floatingButtonClasses}
        style={isOpen ? { transform: "translateY(0)" } : undefined}
        aria-label={isOpen ? "Close support chat" : "Open support chat"}
      >
        {isOpen ? "×" : "💬"}
      </button>
    </div>
  );
};

export default SupportAssistant;
