const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const initialTransactions = [
  {
    id: 1,
    description: "Mercado",
    category: "Alimentação",
    amount: 95,
    type: "shared",
    date: "2026-01-15",
  },
  {
    id: 2,
    description: "Transporte",
    category: "Transporte",
    amount: 40,
    type: "individual",
    date: "2026-01-14",
  },
  {
    id: 3,
    description: "Internet",
    category: "Casa",
    amount: 120,
    type: "shared",
    date: "2026-01-10",
  },
];

const goalData = [
  { title: "Limite Alimentação", value: "R$ 800,00", status: "65% usado" },
  { title: "Meta Reserva", value: "R$ 1.200,00", status: "45% atingido" },
  { title: "Alerta Transporte", value: "R$ 400,00", status: "20% usado" },
];

const state = {
  transactions:
    JSON.parse(localStorage.getItem("transactions")) || initialTransactions,
  filters: {
    search: "",
    category: "",
    sort: "desc",
  },
};

const elements = {
  transactionList: document.getElementById("transactionList"),
  incomeValue: document.getElementById("incomeValue"),
  expenseValue: document.getElementById("expenseValue"),
  balanceValue: document.getElementById("balanceValue"),
  expenseTrend: document.getElementById("expenseTrend"),
  sharedValue: document.getElementById("sharedValue"),
  individualValue: document.getElementById("individualValue"),
  sharedBar: document.getElementById("sharedBar"),
  individualBar: document.getElementById("individualBar"),
  searchInput: document.getElementById("searchInput"),
  categoryFilter: document.getElementById("categoryFilter"),
  sortFilter: document.getElementById("sortFilter"),
  expenseModal: document.getElementById("expenseModal"),
  expenseForm: document.getElementById("expenseForm"),
  toast: document.getElementById("toast"),
  goalList: document.getElementById("goalList"),
};

const saveTransactions = () => {
  localStorage.setItem("transactions", JSON.stringify(state.transactions));
};

const renderGoals = () => {
  elements.goalList.innerHTML = "";
  goalData.forEach((goal) => {
    const card = document.createElement("div");
    card.className = "goal";
    card.innerHTML = `<strong>${goal.title}</strong><span>${goal.value}</span><small class="muted">${goal.status}</small>`;
    elements.goalList.appendChild(card);
  });
};

const getFilteredTransactions = () => {
  const { search, category, sort } = state.filters;
  return state.transactions
    .filter((item) =>
      item.description.toLowerCase().includes(search.toLowerCase())
    )
    .filter((item) => (category ? item.category === category : true))
    .sort((a, b) =>
      sort === "asc"
        ? new Date(a.date) - new Date(b.date)
        : new Date(b.date) - new Date(a.date)
    );
};

const renderTransactions = () => {
  const data = getFilteredTransactions();
  elements.transactionList.innerHTML = "";
  if (!data.length) {
    elements.transactionList.innerHTML =
      "<p class='muted'>Nenhum gasto encontrado.</p>";
    return;
  }

  data.forEach((item) => {
    const div = document.createElement("div");
    div.className = "transaction";
    div.innerHTML = `
      <div>
        <strong>${item.description}</strong>
        <div class="tags">
          <span class="tag category">${item.category}</span>
          <span class="tag shared">${item.type === "shared" ? "Compartilhado" : "Individual"}</span>
        </div>
      </div>
      <div>
        <div class="amount">- ${currency.format(item.amount)}</div>
        <small class="muted">${new Date(item.date).toLocaleDateString("pt-BR")}</small>
      </div>
    `;
    elements.transactionList.appendChild(div);
  });
};

const renderSummary = () => {
  const expenses = state.transactions.reduce((acc, item) => acc + item.amount, 0);
  const income = 0;
  const balance = income - expenses;
  elements.incomeValue.textContent = currency.format(income);
  elements.expenseValue.textContent = currency.format(expenses);
  elements.balanceValue.textContent = currency.format(balance);
  elements.expenseTrend.textContent = income
    ? `${Math.round((expenses / income) * 100)}% da receita`
    : "0% da receita";

  const shared = state.transactions
    .filter((item) => item.type === "shared")
    .reduce((acc, item) => acc + item.amount, 0);
  const individual = expenses - shared;

  elements.sharedValue.textContent = currency.format(shared);
  elements.individualValue.textContent = currency.format(individual);

  const total = expenses || 1;
  elements.sharedBar.style.width = `${(shared / total) * 100}%`;
  elements.individualBar.style.width = `${(individual / total) * 100}%`;
};

const openModal = () => {
  elements.expenseModal.classList.add("open");
};

const closeModal = () => {
  elements.expenseModal.classList.remove("open");
};

const showToast = (message) => {
  elements.toast.textContent = message;
  elements.toast.classList.add("show");
  setTimeout(() => elements.toast.classList.remove("show"), 2500);
};

const exportCsv = () => {
  const headers = ["Descrição", "Categoria", "Tipo", "Valor", "Data"];
  const rows = state.transactions.map((item) => [
    item.description,
    item.category,
    item.type === "shared" ? "Compartilhado" : "Individual",
    item.amount,
    item.date,
  ]);

  const csvContent = [headers, ...rows]
    .map((row) => row.join(","))
    .join("\n");

  const blob = new Blob([csvContent], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "gastos.csv";
  link.click();
  URL.revokeObjectURL(url);
  showToast("CSV exportado com sucesso!");
};

const initTabs = () => {
  document.querySelectorAll(".tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".tab").forEach((el) => {
        el.classList.remove("active");
      });
      tab.classList.add("active");
      showToast(`Aba ${tab.textContent} ativa`);
    });
  });
};

const initThemeToggle = () => {
  const toggleButton = document.getElementById("toggleTheme");
  const stored = localStorage.getItem("theme");
  if (stored === "dark") {
    document.body.classList.add("dark");
  }
  toggleButton.addEventListener("click", () => {
    document.body.classList.toggle("dark");
    const theme = document.body.classList.contains("dark") ? "dark" : "light";
    localStorage.setItem("theme", theme);
  });
};

const init = () => {
  renderGoals();
  renderTransactions();
  renderSummary();
  initTabs();
  initThemeToggle();

  document.getElementById("openModal").addEventListener("click", openModal);
  document.getElementById("closeModal").addEventListener("click", closeModal);
  document.getElementById("clearForm").addEventListener("click", () =>
    elements.expenseForm.reset()
  );
  document
    .getElementById("exportCsv")
    .addEventListener("click", exportCsv);
  document
    .getElementById("openReports")
    .addEventListener("click", () => showToast("Relatórios avançados"));
  document
    .getElementById("openBot")
    .addEventListener("click", () => showToast("Configurar bot"));
  document
    .getElementById("toggleFilters")
    .addEventListener("click", () => showToast("Filtros aplicados"));
  document
    .getElementById("addGoal")
    .addEventListener("click", () => showToast("Nova meta criada"));

  elements.searchInput.addEventListener("input", (event) => {
    state.filters.search = event.target.value;
    renderTransactions();
  });

  elements.categoryFilter.addEventListener("change", (event) => {
    state.filters.category = event.target.value;
    renderTransactions();
  });

  elements.sortFilter.addEventListener("change", (event) => {
    state.filters.sort = event.target.value;
    renderTransactions();
  });

  elements.expenseForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    const newItem = {
      id: Date.now(),
      description: formData.get("description"),
      category: formData.get("category"),
      amount: Number(formData.get("amount")),
      type: formData.get("type"),
      date: formData.get("date"),
    };
    state.transactions.unshift(newItem);
    saveTransactions();
    renderTransactions();
    renderSummary();
    showToast("Gasto registrado!");
    event.target.reset();
    closeModal();
  });

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeModal();
    }
  });
};

init();
