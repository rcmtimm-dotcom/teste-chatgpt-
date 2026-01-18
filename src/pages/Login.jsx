import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Login = () => {
  const navigate = useNavigate();
  const { signIn, signUp, session } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  if (session) {
    navigate("/gastos");
  }

  const handleLogin = async (event) => {
    event.preventDefault();
    setLoading(true);
    setStatus("");
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) {
      setStatus(error.message);
      return;
    }
    navigate("/gastos");
  };

  const handleSignup = async () => {
    setLoading(true);
    setStatus("");
    const { error } = await signUp(email, password);
    setLoading(false);
    if (error) {
      setStatus(error.message);
      return;
    }
    setStatus("Cadastro criado! Verifique o e-mail para confirmar.");
  };

  return (
    <div className="page">
      <div className="card">
        <h1>Controle de Gastos</h1>
        <p>Faça login para acessar seus gastos compartilhados.</p>
        <form onSubmit={handleLogin} className="form">
          <label>
            Email
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>
          <label>
            Senha
            <input
              type="password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>
          <button type="submit" disabled={loading}>
            Entrar
          </button>
        </form>
        <button className="secondary" onClick={handleSignup} disabled={loading}>
          Criar conta
        </button>
        {status && <p className="status">{status}</p>}
      </div>
    </div>
  );
};

export default Login;
