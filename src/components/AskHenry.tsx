"use client";

import { useEffect, useRef, useState } from "react";
import { IconPaperclip, IconSend } from "@tabler/icons-react";

interface Msg {
  role: "user" | "assistant";
  text: string;
  image?: { media_type: string; data: string; preview: string };
}

const SUGGESTIONS = [
  "What's the latest FNSKU label requirement?",
  "How do I enroll an ASIN in Subscribe & Save?",
  "How do I get Climate Pledge Friendly certified?",
  "How do I file a chargeback dispute successfully?",
  "When is Prime Day this year?",
  "How do I get approved to sell in a gated category?",
];

// Render a tiny subset of markdown (**bold**) safely as React nodes.
function renderText(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) =>
    p.startsWith("**") && p.endsWith("**") ? (
      <strong key={i}>{p.slice(2, -2)}</strong>
    ) : (
      <span key={i}>{p}</span>
    )
  );
}

export default function AskHenry({ seed }: { seed?: { text: string; nonce: number } }) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState<{ media_type: string; data: string; preview: string } | null>(
    null
  );
  const [streaming, setStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, streaming]);

  // When a question is seeded from another tab (e.g. a Playbook), send it.
  useEffect(() => {
    if (seed && seed.text) {
      void send(seed.text);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seed?.nonce]);

  function onPickImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result);
      const data = result.split(",")[1] ?? "";
      setPending({ media_type: file.type, data, preview: result });
    };
    reader.readAsDataURL(file);
  }

  async function send(textArg?: string) {
    const text = (textArg ?? input).trim();
    if ((!text && !pending) || streaming) return;

    const userMsg: Msg = {
      role: "user",
      text: text || "Please review this label/document.",
      image: pending ?? undefined,
    };
    const history = [...messages, userMsg];
    setMessages([...history, { role: "assistant", text: "" }]);
    setInput("");
    setPending(null);
    setStreaming(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: history.map((m) => ({
            role: m.role,
            text: m.text,
            image: m.image ? { media_type: m.image.media_type, data: m.image.data } : undefined,
          })),
        }),
      });

      if (!res.body) throw new Error("No response stream.");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setMessages((prev) => {
          const next = [...prev];
          next[next.length - 1] = { role: "assistant", text: acc };
          return next;
        });
      }
    } catch (e) {
      setMessages((prev) => {
        const next = [...prev];
        next[next.length - 1] = {
          role: "assistant",
          text: `Sorry — something went wrong: ${(e as Error).message}`,
        };
        return next;
      });
    } finally {
      setStreaming(false);
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  return (
    <div>
      <div className="page-head">
        <h1>Ask an Amazonian</h1>
        <p>
          Label rules, program enrollment (SNS, Climate Pledge, Vine), category approvals, chargeback
          disputes, event dates — ask anything. HENRY checks the latest published guidance for you.
          Upload a label photo and he&apos;ll flag what&apos;s missing.
        </p>
      </div>

      <div className="chat">
        <div className="messages" ref={scrollRef}>
          {messages.length === 0 && (
            <div className="empty-hint">
              Pick a question below or type your own. HENRY answers like a CSM who&apos;s saved your
              account a dozen times.
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`msg ${m.role}`}>
              {m.image && <img className="thumb" src={m.image.preview} alt="upload" />}
              {m.text === "" && streaming && i === messages.length - 1 ? (
                <span className="typing">HENRY is thinking…</span>
              ) : (
                renderText(m.text)
              )}
            </div>
          ))}
        </div>

        <div className="composer">
          {messages.length === 0 && (
            <div className="suggestions">
              {SUGGESTIONS.map((s) => (
                <button key={s} className="suggestion" onClick={() => send(s)} disabled={streaming}>
                  {s}
                </button>
              ))}
            </div>
          )}

          <div className="attach-row">
            <button className="ghost" onClick={() => fileRef.current?.click()} disabled={streaming}>
              <IconPaperclip size={15} stroke={2} />
              Scan a label
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              style={{ display: "none" }}
              onChange={onPickImage}
            />
            {pending && (
              <span className="attach-preview">
                <img src={pending.preview} alt="preview" />
                label attached
                <button
                  className="ghost"
                  style={{ padding: "2px 8px" }}
                  onClick={() => setPending(null)}
                >
                  ✕
                </button>
              </span>
            )}
          </div>

          <div className="field">
            <textarea
              rows={1}
              placeholder="Ask HENRY anything about selling on Amazon…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              disabled={streaming}
            />
            <button
              className="primary"
              onClick={() => send()}
              disabled={streaming || (!input.trim() && !pending)}
            >
              {streaming ? "…" : <><IconSend size={15} stroke={2} />Send</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
