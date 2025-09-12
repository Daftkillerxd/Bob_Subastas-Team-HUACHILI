import { useEffect, useRef, useState } from "react";
import "./App.css";

export default function App() {
  const [messages, setMessages] = useState([
    {
      sender: "bot",
      text:
        "¡Hola! Soy tu asistente legal para consultas sobre herencia en Perú. ¿En qué puedo ayudarte hoy?",
      ts: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const listRef = useRef(null);

  const suggestions = [
    "¿Cómo se distribuye una herencia sin testamento?",
    "¿Qué documentos necesito para un proceso de herencia?",
    "¿Cuáles son los derechos de los herederos forzosos?",
    "¿Cuánto tiempo toma un proceso de sucesión?",
  ];

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTo({
        top: listRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages, loading]);

  const sendMessage = async (text) => {
    const userMessage = { sender: "user", text, ts: new Date().toISOString() };
    setMessages((m) => [...m, userMessage]);
    setLoading(true);

    try {
      const response = await fetch("https://proy2-chatbot-legal-frontend.onrender.com", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });

      // Logs de depuración (útiles mientras pruebas)
      console.log("[FRONT] status:", response.status);

      const data = await response.json().catch(() => ({}));
      console.log("[FRONT] data:", data);

      if (!response.ok) {
        // Si el backend devolvió error con detalle
        const detail =
          typeof data?.detail === "string" ? `\nDetalle: ${data.detail}` : "";
        setMessages((m) => [
          ...m,
          {
            sender: "bot",
            text: `⚠️ El servidor respondió con un error.${detail}`,
            ts: new Date().toISOString(),
          },
        ]);
        return;
      }

      // 👇 Usar la clave correcta que envía tu backend
      const botText =
        typeof data?.respuesta === "string"
          ? data.respuesta
          : "No pude responder ahora.";

      setMessages((m) => [
        ...m,
        { sender: "bot", text: botText, ts: new Date().toISOString() },
      ]);
    } catch (e) {
      console.error("[FRONT] fetch error:", e);
      setMessages((m) => [
        ...m,
        {
          sender: "bot",
          text: "⚠️ Error al conectar con el servidor.",
          ts: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const txt = input.trim();
    setInput("");
    await sendMessage(txt);
  };

  const handleSuggestion = (q) => {
    if (loading) return;
    setInput("");
    sendMessage(q);
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="page">
      {/* 👇 Wrapper que centra TODO */}
      <div className="wrap">
        <header className="hero">
          <h1>Chatbot Legal Especializado</h1>
          <p>
            Obtén respuestas inmediatas sobre herencia, sucesiones y derecho
            civil en Perú
          </p>
        </header>

        <section className="card">
          <div className="card-header">
            <div className="card-title">
              <div className="icon-badge">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M10 4h4a2 2 0 0 1 2 2v1h3a1 1 0 0 1 1 1v4.5a5.5 5.5 0 1 1-2 0V9h-2v1a1 1 0 0 1-1 1h-8a1 1 0 0 1-1-1V9H4v10h7.126a5.5 5.5 0 0 0 1.748 2H4a2 2 0 0 1-2-2V8a1 1 0 0 1 1-1h3V6a2 2 0 0 1 2-2Zm0 2v1h4V6h-4Zm9 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Z" />
                </svg>
              </div>
              <div>
                <h2>Chatbot Legal - Herencia en Perú</h2>
                <span>Consulta tus dudas sobre herencia y derecho sucesorio</span>
              </div>
            </div>
          </div>

          {/* Chips */}
          <div className="chips">
            {suggestions.map((s) => (
              <button key={s} className="chip" onClick={() => handleSuggestion(s)}>
                {s}
              </button>
            ))}
          </div>

          {/* Conversación */}
          <div className="chat-window" ref={listRef}>
            {messages.map((m, i) => (
              <Message key={i} sender={m.sender} text={m.text} ts={m.ts} />
            ))}
            {loading && <TypingBubble />}
          </div>

          {/* Input */}
          <div className="composer">
            <input
              placeholder="Escribe tu consulta sobre herencia..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              disabled={loading}
            />
            <button
              className="send"
              onClick={handleSend}
              disabled={loading || !input.trim()}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="currentColor"
                  d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"
                />
              </svg>
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

function Message({ sender, text, ts }) {
  const isUser = sender === "user";
  return (
    <div className={`msg-row ${isUser ? "right" : "left"}`}>
      {!isUser && <div className="avatar">⚖️</div>}
      <div className={`bubble ${isUser ? "user" : "bot"}`}>
        <div className="bubble-text">{text}</div>
        <div className="bubble-time">
          {new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </div>
      </div>
      {isUser && <div className="avatar you">🧑</div>}
    </div>
  );
}

function TypingBubble() {
  return (
    <div className="msg-row left">
      <div className="avatar">⚖️</div>
      <div className="bubble bot typing">
        <span className="dot"></span>
        <span className="dot"></span>
        <span className="dot"></span>
      </div>
    </div>
  );
}

