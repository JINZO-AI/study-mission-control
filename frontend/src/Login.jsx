import { useState } from "react";

const API = "http://localhost:8000/api";

const T = {
  bg:"#05080f",surf:"#0b1120",card:"#111827",border:"#1d2d44",
  acc:"#2dd4bf",accD:"rgba(45,212,191,0.10)",
  red:"#f87171",redD:"rgba(248,113,113,0.10)",
  grn:"#34d399",txt:"#dde8f5",sub:"#7f9bbf",mut:"#3d5068",
  fnt:"'Exo 2', sans-serif",mon:"'Fira Code', monospace",
};

const GS = `
  @import url('https://fonts.googleapis.com/css2?family=Exo+2:wght@300;400;500;600;700;800;900&family=Fira+Code:wght@400;500;600&display=swap');
  *{box-sizing:border-box;margin:0;padding:0;}
  body{background:${T.bg};}
  input::placeholder{color:${T.mut};}
`;

export default function Login({ onAuth }) {
  const [mode, setMode]       = useState("login"); // "login" | "register"
  const [name, setName]       = useState("");
  const [email, setEmail]     = useState("");
  const [password, setPass]   = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [success, setSuccess] = useState("");

  const inputStyle = {
    background: T.surf,
    border: `1px solid ${T.border}`,
    borderRadius: 8,
    color: T.txt,
    padding: "11px 14px",
    fontFamily: T.fnt,
    fontSize: 14,
    width: "100%",
    outline: "none",
    transition: "border-color 0.2s",
  };

  const labelStyle = {
    color: T.sub,
    fontSize: 10,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.1em",
    marginBottom: 6,
    display: "block",
  };

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (mode === "register" && password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const endpoint = mode === "login" ? "/login" : "/register";
      const body = mode === "login"
        ? { email, password }
        : { name, email, password, password_confirmation: confirm };

      const res = await fetch(API + endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        // Laravel validation errors come as { errors: { field: ["msg"] } }
        if (data.errors) {
          const msgs = Object.values(data.errors).flat();
          setError(msgs.join(" "));
        } else {
          setError(data.message || "Something went wrong.");
        }
        return;
      }

      // Store token + user info
      localStorage.setItem("smc_token", data.token);
      localStorage.setItem("smc_user",  JSON.stringify(data.user));

      setSuccess(mode === "login" ? "Welcome back! Loading..." : "Account created! Loading...");
      setTimeout(() => onAuth(data.token, data.user), 800);

    } catch (err) {
      setError("Cannot reach the API. Is Laravel running on localhost:8000?");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: "100vh", background: T.bg, display: "flex",
      alignItems: "center", justifyContent: "center",
      fontFamily: T.fnt, padding: 24,
    }}>
      <style>{GS}</style>

      {/* Stars background */}
      <div style={{
        position: "fixed", inset: 0, pointerEvents: "none", overflow: "hidden", zIndex: 0,
      }}>
        {Array.from({length: 60}).map((_, i) => (
          <div key={i} style={{
            position: "absolute",
            width: Math.random() > 0.7 ? 2 : 1,
            height: Math.random() > 0.7 ? 2 : 1,
            borderRadius: "50%",
            background: T.sub,
            opacity: Math.random() * 0.5 + 0.1,
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
          }} />
        ))}
      </div>

      <div style={{ width: "100%", maxWidth: 420, position: "relative", zIndex: 1 }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{
            fontFamily: T.mon, color: T.acc, fontSize: 11,
            letterSpacing: "0.25em", textTransform: "uppercase", marginBottom: 14,
          }}>EPIDS · BigData 2A.AN · S2 2025–2026</div>
          <h1 style={{
            fontSize: 32, fontWeight: 900, lineHeight: 1.1,
            background: `linear-gradient(135deg,${T.txt} 0%,${T.acc} 100%)`,
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>Study Mission Control</h1>
          <p style={{ color: T.sub, marginTop: 8, fontSize: 13 }}>
            Precision forecasting for your academic targets
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: T.card, border: `1px solid ${T.border}`,
          borderRadius: 16, padding: 32,
        }}>

          {/* Mode toggle */}
          <div style={{
            display: "flex", background: T.surf,
            border: `1px solid ${T.border}`, borderRadius: 10,
            padding: 4, marginBottom: 28, gap: 4,
          }}>
            {["login", "register"].map(m => (
              <button key={m} onClick={() => { setMode(m); setError(""); setSuccess(""); }}
                style={{
                  flex: 1, padding: "8px 0", borderRadius: 7,
                  border: "none", cursor: "pointer",
                  fontFamily: T.fnt, fontWeight: 700, fontSize: 13,
                  background: mode === m ? T.acc : "transparent",
                  color: mode === m ? "#05080f" : T.sub,
                  transition: "all 0.2s",
                }}>
                {m === "login" ? "🔑 Sign In" : "🚀 Register"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>

            {mode === "register" && (
              <div>
                <label style={labelStyle}>Your Name</label>
                <input
                  type="text" value={name} onChange={e => setName(e.target.value)}
                  placeholder="e.g. Ahmed Dridi" required style={inputStyle}
                />
              </div>
            )}

            <div>
              <label style={labelStyle}>Email Address</label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="admin@study.com" required style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Password</label>
              <input
                type="password" value={password} onChange={e => setPass(e.target.value)}
                placeholder="••••••••" required style={inputStyle}
              />
            </div>

            {mode === "register" && (
              <div>
                <label style={labelStyle}>Confirm Password</label>
                <input
                  type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
                  placeholder="••••••••" required style={inputStyle}
                />
              </div>
            )}

            {/* Error */}
            {error && (
              <div style={{
                padding: "10px 14px", background: T.redD,
                border: `1px solid ${T.red}44`, borderRadius: 8,
                color: T.red, fontSize: 13,
              }}>⚠️ {error}</div>
            )}

            {/* Success */}
            {success && (
              <div style={{
                padding: "10px 14px", background: "rgba(52,211,153,0.10)",
                border: `1px solid ${T.grn}44`, borderRadius: 8,
                color: T.grn, fontSize: 13,
              }}>✅ {success}</div>
            )}

            <button type="submit" disabled={loading} style={{
              padding: "12px 0", borderRadius: 9, border: "none",
              background: loading ? T.mut : `linear-gradient(135deg,${T.acc},${T.grn})`,
              color: "#05080f", fontFamily: T.fnt, fontWeight: 800,
              fontSize: 15, cursor: loading ? "not-allowed" : "pointer",
              letterSpacing: "0.04em", transition: "opacity 0.2s",
              opacity: loading ? 0.6 : 1,
            }}>
              {loading ? "⏳ Please wait..." : mode === "login" ? "🚀 Launch Mission Control" : "✨ Create Account"}
            </button>
          </form>

          {/* Default credentials hint */}
          {mode === "login" && (
            <div style={{
              marginTop: 20, padding: "10px 14px",
              background: T.accD, border: `1px solid ${T.acc}33`,
              borderRadius: 8, color: T.sub, fontSize: 12, textAlign: "center",
            }}>
              Default seeded user:<br />
              <span style={{ color: T.acc, fontFamily: T.mon, fontWeight: 700 }}>
                admin@study.com
              </span>
              {" / "}
              <span style={{ color: T.acc, fontFamily: T.mon, fontWeight: 700 }}>password</span>
            </div>
          )}
        </div>

        <p style={{ textAlign: "center", color: T.mut, fontSize: 11, marginTop: 20 }}>
          API: <span style={{ fontFamily: T.mon, color: T.sub }}>localhost:8000</span>
          {" · "}
          Frontend: <span style={{ fontFamily: T.mon, color: T.sub }}>localhost:5173</span>
        </p>
      </div>
    </div>
  );
}
