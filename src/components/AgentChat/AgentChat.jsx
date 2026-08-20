import { useState } from "react";
import Navbar from "../Navbar/Navbar";
import "./AgentChat.css";

const AGENT_URL = "http://localhost:8000";

const AgentChat = () => {
  const [imageUrl, setImageUrl] = useState("");
  const [userText, setUserText] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [messages, setMessages] = useState([
    { role: "agent", text: "👋 Hello! Send me a product image URL and details, and I'll analyze it for you." }
  ]);
  const [product, setProduct] = useState(null);
  const [conversation, setConversation] = useState([]);
  const [loading, setLoading] = useState(false);
  const [awaitingConfirm, setAwaitingConfirm] = useState(false);

  const addMessage = (role, text) =>
    setMessages((prev) => [...prev, { role, text }]);

  const handleAnalyze = async () => {
    if (!imageUrl.trim() || !userText.trim()) return;

    addMessage("user", `🖼️ ${imageUrl}\n📝 ${userText}`);
    setLoading(true);

    try {
      const res = await fetch(`${AGENT_URL}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image_url: imageUrl, user_text: userText, admin_notes: adminNotes }),
      });
      const data = await res.json();

      if (data.product) {
        setProduct(data.product);
        setConversation(data.conversation);
        setAwaitingConfirm(true);
      } else {
        setConversation(data.conversation);
      }
      addMessage("agent", data.message);
    } catch {
      addMessage("agent", "❌ Connection error. Make sure the server is running.");
    } finally {
      setLoading(false);
      setImageUrl("");
      setUserText("");
      setAdminNotes("");
    }
  };

  const handleAdminMessage = async () => {
    if (!adminNotes.trim()) return;

    addMessage("user", `💬 ${adminNotes}`);
    setLoading(true);

    try {
      const res = await fetch(`${AGENT_URL}/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: adminNotes, conversation }),
      });
      const data = await res.json();
      if (data.product) {
        setProduct(data.product);
        setConversation(data.conversation);
        setAwaitingConfirm(true);
      } else {
        setConversation(data.conversation);
      }
      addMessage("agent", data.message);
    } catch {
      addMessage("agent", "❌ Connection error.");
    } finally {
      setLoading(false);
      setAdminNotes("");
    }
  };

  const handleConfirm = async () => {
    setAwaitingConfirm(false);
    addMessage("user", "✅ Approved — add to store");
    setLoading(true);

    try {
      const res = await fetch(`${AGENT_URL}/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product, conversation }),
      });

      if (!res.ok) {
        const err = await res.json();
        const errorList = Array.isArray(err.detail) ? err.detail.join("\n") : err.detail;
        addMessage("agent", `❌ Validation failed:\n${errorList}`);
        setAwaitingConfirm(true);
        return;
      }

      const data = await res.json();
      if (data.success) {
        addMessage("agent", `✅ Product "${data.saved_product.name}" added to the store successfully! 🎉`);
        setProduct(null);
        setConversation([]);
      }
    } catch {
      addMessage("agent", "❌ Error saving the product.");
    } finally {
      setLoading(false);
    }
  };

  const handleReject = () => {
    setAwaitingConfirm(false);
    addMessage("user", "❌ Rejected the product");
    addMessage("agent", "Got it! What would you like to change?");
  };

  return (
    <>
      <Navbar />
      <div className="agent-chat-wrapper">
        <div className="agent-chat-container">
          <div className="chat-header">🤖 AI Product Agent</div>

          <div className="chat-messages">
            {messages.map((msg, i) => (
              <div key={i} className={`chat-bubble ${msg.role}`}>
                {msg.role === "agent" && <span className="bubble-avatar">🤖</span>}
                <div className="bubble-text">
                  {msg.text.split("\n").map((line, j) => (
                    <span key={j}>{line}<br /></span>
                  ))}
                </div>
                {msg.role === "user" && <span className="bubble-avatar">👤</span>}
              </div>
            ))}
            {loading && (
              <div className="chat-bubble agent">
                <span className="bubble-avatar">🤖</span>
                <div className="bubble-text typing">
                  <span /><span /><span />
                </div>
              </div>
            )}
          </div>

          {awaitingConfirm && product && (
            <div className="confirm-bar">
              <p>Approve and add <strong>{product.name}</strong> to the store?</p>
              <div className="confirm-buttons">
                <button className="btn-approve" onClick={handleConfirm}>✅ Approve</button>
                <button className="btn-reject" onClick={handleReject}>❌ Reject</button>
              </div>
            </div>
          )}

          {!awaitingConfirm && (
            <div className="chat-input-area">
              <input
                type="text"
                placeholder="🔗 Product image URL"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
              />
              <input
                type="text"
                placeholder="📝 Name, price (e.g. Name: Alpine Pro, Price: 300)"
                value={userText}
                onChange={(e) => setUserText(e.target.value)}
              />
              <button onClick={handleAnalyze} disabled={loading}>
                {loading ? "Analyzing..." : "Send to Agent ➤"}
              </button>
              <hr style={{ width: "100%", margin: "4px 0", opacity: 0.3 }} />
              <input
                type="text"
                placeholder="💬 Admin message (e.g. the description is too long)"
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAdminMessage()}
              />
              <button onClick={handleAdminMessage} disabled={loading || !adminNotes.trim()}>
                Send Message 💬
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default AgentChat;
