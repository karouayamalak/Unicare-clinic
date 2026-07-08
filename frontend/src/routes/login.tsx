import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { postJson } from "../lib/api";
import { authStore } from "../lib/authStore";

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = await postJson("/auth/login", { email, password });
      authStore.login(data.user ?? { email, role: "Patient" });
      setMessage("Login successful");
    } catch (err: any) {
      setMessage(err.message);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Login</h2>
      <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
      <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" type="password" />
      <button type="submit">Login</button>
      <p><Link to="/signup">Create account</Link></p>
      <p>{message}</p>
    </form>
  );
}
