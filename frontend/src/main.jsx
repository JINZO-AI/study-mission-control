import { StrictMode, useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import Login from "./Login.jsx";

function Root() {
  const [token, setToken] = useState(() => localStorage.getItem("smc_token") || null);
  const [user,  setUser]  = useState(() => {
    try { return JSON.parse(localStorage.getItem("smc_user")) || null; }
    catch { return null; }
  });

  function handleAuth(newToken, newUser) {
    localStorage.setItem("smc_token", newToken);
    localStorage.setItem("smc_user",  JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  }

  function handleLogout() {
    // Call API logout (fire-and-forget)
    const t = localStorage.getItem("smc_token");
    if (t) {
      fetch("http://localhost:8000/api/logout", {
        method: "POST",
        headers: { "Authorization": `Bearer ${t}`, "Accept": "application/json" },
      }).catch(() => {});
    }
    localStorage.removeItem("smc_token");
    localStorage.removeItem("smc_user");
    setToken(null);
    setUser(null);
  }

  if (!token) {
    return <Login onAuth={handleAuth} />;
  }

  return <App authToken={token} authUser={user} onLogout={handleLogout} />;
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Root />
  </StrictMode>
);
