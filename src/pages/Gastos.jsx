import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";

const getApiUrl = () => import.meta.env.VITE_API_URL;

const defaultUsers = ["Eu", "Namorada"];

const loadUsers = () => {
  try {
    const stored = JSON.parse(localStorage.getItem("users") || "null");
    if (Array.isArray(stored) && stored.length === 2) {
      return stored;
    }
  } catch {
    return defaultUsers;
  }
  return defaultUsers;
};

const Gastos = () => {
  const { session, signOut } = useAuth();
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState(loadUsers);
  const [form, setForm] = useState({
    description: "",
    amount: "",
    category: "Manual",
    type: "shared",
    owner: defaultUsers[0],
  });

  const authHeader = useMemo(
    () => ({
      Authorization: `Bearer ${session?.access_token || ""}`,
      "Content-Type": "application/json",
    }),
    [session]
  );

  const fetchExpenses = async () => {
    setLoading(true);
    setStatus("");
    try {
      const apiUrl = getApiUrl();
      if (!apiUrl) {
        setStatus("VITE_API_URL não configurada.");
        return;
      }
      const response = await fetch(`${apiUrl}/api/expenses`, {
        headers: authHeader,
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || "Falha ao carregar gastos.");
      }
      const data = await response.json();
      setItems(data.expenses || []);
    } catch (error) {
      setStatus(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus("");
    try {
      const apiUrl = getApiUrl();
      if (!apiUrl) {
        setStatus("VITE_API_URL não configurada.");
        return;
      }
      const response = await fetch(`${apiUrl}/api/expenses`, {
        method: "POST",
        headers: authHeader,
        body: JSON.stringify({
          ...form,
          amount: Number(form.amount),
        }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || "Falha ao registrar gasto.");
      }
      setForm({
        description: "",
        amount: "",
        category: "Manual",
        type: "shared",
        owner: users[0],
      });
      await fetchExpenses();
    } catch (error) {
      setStatus(error.message);
    }
  };

  const handleUserChange = (index, value) => {
    const next = [...users];
    next[index] = value;
    setUsers(next);
    localStorage.setItem("users", JSON.stringify(next));
    setForm((prev) => ({
      ...prev,
      owner: prev.owner === users[index] ? value : prev.owner,
    }));
  };

  const splitValue = Number(form.amount || 0) / 2;

  return (
    <div className="page">
      <div className="header">
        <div>
          <h1>Gastos compartilhados</h1>
          <p>Você e sua namorada veem os mesmos lançamentos.</p>
        </div>
        <div className="actions">
          <button onClick={fetchExpenses} disabled={loading}>
            Atualizar
          </button>
          <button className="secondary" onClick={signOut}>
            Sair
          </button>
        </div>
      </div>

      <div className="grid">
        <div className="card">
          <h2>Novo gasto</h2>
          <form onSubmit={handleSubmit} className="form">
            <label>
              Descrição
              <input
                required
                value={form.description}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, description: event.target.value }))
                }
              />
            </label>
            <label>
              Valor (R$)
              <input
                required
                type="number"
                step="0.01"
                value={form.amount}
                onChange={(event) => setForm((prev) => ({ ...prev, amount: event.target.value }))}
              />
            </label>
            <label>
              Categoria
              <input
                value={form.category}
                onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))}
              />
            </label>
            <label>
              Tipo
              <select
                value={form.type}
                onChange={(event) => setForm((prev) => ({ ...prev, type: event.target.value }))}
              >
                <option value="shared">Compartilhado</option>
                <option value="individual">Individual</option>
              </select>
            </label>
            {form.type === "individual" && (
              <>
                <label>
                  Responsável
                  <select
                    value={form.owner}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, owner: event.target.value }))
                    }
                  >
                    {users.map((user) => (
                      <option key={user} value={user}>
                        {user}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="split">
                  <div>
                    <strong>{users[0]}</strong>
                    <span>R$ {splitValue.toFixed(2)}</span>
                  </div>
                  <div>
                    <strong>{users[1]}</strong>
                    <span>R$ {splitValue.toFixed(2)}</span>
                  </div>
                </div>
              </>
            )}
            <button type="submit">Registrar gasto</button>
          </form>
        </div>

        <div className="card">
          <h2>Lista de gastos</h2>
          {loading && <p>Carregando...</p>}
          {status && <p className="status">{status}</p>}
          {!loading && items.length === 0 && <p>Nenhum gasto encontrado.</p>}
          <ul className="list">
            {items.map((item) => (
              <li key={item.id}>
                <div>
                  <strong>{item.description}</strong>
                  <span className="muted">
                    {item.category} • {item.type === "shared" ? "Compartilhado" : "Individual"}
                    {item.owner ? ` • ${item.owner}` : ""}
                  </span>
                </div>
                <span>R$ {Number(item.amount).toFixed(2)}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="card">
          <h2>Usuários</h2>
          <p>Edite os nomes usados na divisão do gasto individual.</p>
          <div className="form">
            <label>
              Pessoa 1
              <input
                value={users[0]}
                onChange={(event) => handleUserChange(0, event.target.value)}
              />
            </label>
            <label>
              Pessoa 2
              <input
                value={users[1]}
                onChange={(event) => handleUserChange(1, event.target.value)}
              />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Gastos;
