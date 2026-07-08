import { useState } from "react";
import { postJson } from "../lib/api";

export function SignupPage() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = await postJson("/auth/register", { firstName, lastName, email, password });
      setMessage(`Account created: ${data.user.email}`);
    } catch (err: any) {
      setMessage(err.message);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Sign up</h2>
      <input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="First name" />
      <input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Last name" />
      <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
      <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" type="password" />
      <button type="submit">Create account</button>
      <p>{message}</p>
    </form>
  );
}
