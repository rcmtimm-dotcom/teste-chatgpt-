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

const categoryData = [
  { name: "Alimentação", budget: 800, spent: 90 },
  { name: "Transporte", budget: 400, spent: 40 },
  { name: "Casa", budget: 600, spent: 120 },
  { name: "Lazer", budget: 300, spent: 0 },
  { name: "Saúde", budget: 200, spent: 0 },
];

const calendarEvents = [
  { day: 15, label: "mercado", value: "R$ 90,00" },
  { day: 15, label: "receita", value: "R$ 0,00" },
  { day: 22, label: "farmácia", value: "R$ 40,00" },
];

const state = {
  transactions:
    JSON.parse(localStorage.getItem("transactions")) || initialTransactions,
  botSyncedIds: JSON.parse(localStorage.getItem("botSyncedIds")) || [],
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
  comparisonChart: document.getElementById("comparisonChart"),
  budgetChart: document.getElementById("budgetChart"),
  budgetStandalone: document.getElementById("budgetStandalone"),
  budgetProgress: document.getElementById("budgetProgress"),
  goalProgress: document.getElementById("goalProgress"),
  categoryList: document.getElementById("categoryList"),
  calendarGrid: document.getElementById("calendarGrid"),
  calendarStandalone: document.getElementById("calendarStandalone"),
};

const saveTransactions = () => {
  localStorage.setItem("transactions", JSON.stringify(state.transactions));
};

const saveBotSyncedIds = () => {
  localStorage.setItem("botSyncedIds", JSON.stringify(state.botSyncedIds));
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

const renderCategoryList = () => {
  if (!elements.categoryList) return;
  elements.categoryList.innerHTML = "";
  categoryData.forEach((category) => {
    const item = document.createElement("div");
    item.className = "category-item";
    item.innerHTML = `
      <div>
        <strong>${category.name}</strong>
        <p class="muted">Orçamento: ${currency.format(category.budget)}</p>
      </div>
      <span class="pill active">Ativa</span>
    `;
    elements.categoryList.appendChild(item);
  });
};

const renderComparisonChart = () => {
  if (!elements.comparisonChart) return;
  elements.comparisonChart.innerHTML = "";
  const months = [
    { label: "ago/25", income: 0, expense: 0 },
    { label: "set/25", income: 0, expense: 0 },
    { label: "out/25", income: 0, expense: 0 },
    { label: "nov/25", income: 0, expense: 0 },
    { label: "dez/25", income: 0, expense: 90 },
    { label: "jan/26", income: 0, expense: 0 },
  ];
  const maxValue = Math.max(...months.map((m) => Math.max(m.income, m.expense, 1)));
  months.forEach((month) => {
    const wrapper = document.createElement("div");
    wrapper.className = "bar";
    wrapper.innerHTML = `
      <span class="muted">${month.label}</span>
      <div class="bar-row">
        <div class="bar-track">
          <div class="bar-fill" style="width: ${(month.income / maxValue) * 100}%"></div>
        </div>
        <div class="bar-track">
          <div class="bar-fill expense" style="width: ${(month.expense / maxValue) * 100}%"></div>
        </div>
      </div>
    `;
    elements.comparisonChart.appendChild(wrapper);
  });
};

const renderBudget = (target) => {
  if (!target) return;
  target.innerHTML = "";
  categoryData.forEach((category) => {
    const percent = Math.min((category.spent / category.budget) * 100, 100);
    const item = document.createElement("div");
    item.className = "bar";
    item.innerHTML = `
      <strong>${category.name}</strong>
      <div class="bar-row">
        <div class="bar-track">
          <div class="bar-fill expense" style="width: ${percent}%"></div>
        </div>
        <span>${currency.format(category.spent)} / ${currency.format(category.budget)}</span>
      </div>
    `;
    target.appendChild(item);
  });
};

const renderGoalProgress = (target) => {
  if (!target) return;
  target.innerHTML = "";
  categoryData.forEach((category) => {
    const percent = Math.min((category.spent / category.budget) * 100, 100).toFixed(0);
    const item = document.createElement("div");
    item.className = "progress-item";
    item.innerHTML = `
      <strong>${category.name}</strong>
      <p class="muted">${percent}% do orçamento usado</p>
      <div class="progress-bar">
        <div class="progress-fill" style="width: ${percent}%"></div>
      </div>
    `;
    target.appendChild(item);
  });
};

const renderCalendar = (target) => {
  if (!target) return;
  const days = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  target.innerHTML = "";
  days.forEach((day) => {
    const header = document.createElement("div");
    header.className = "calendar-day header";
    header.textContent = day;
    target.appendChild(header);
  });
  for (let day = 1; day <= 31; day += 1) {
    const cell = document.createElement("div");
    cell.className = "calendar-day";
    cell.innerHTML = `<strong>${day}</strong>`;
    calendarEvents
      .filter((event) => event.day === day)
      .forEach((event) => {
        const eventEl = document.createElement("div");
        eventEl.className = "event";
        eventEl.textContent = `${event.label} ${event.value}`;
        cell.appendChild(eventEl);
      });
    target.appendChild(cell);
  }
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
      const group = tab.closest(".tabs");
      group.querySelectorAll(".tab").forEach((el) => el.classList.remove("active"));
      tab.classList.add("active");
      if (tab.dataset.report) {
        document
          .querySelectorAll(".report-panel")
          .forEach((panel) => panel.classList.remove("active"));
        const panel = document.querySelector(
          `[data-report-panel=\"${tab.dataset.report}\"]`
        );
        if (panel) panel.classList.add("active");
      }
      if (tab.dataset.setting) {
        document
          .querySelectorAll(".settings-panel")
          .forEach((panel) => panel.classList.remove("active"));
        const panel = document.querySelector(
          `[data-setting-panel=\"${tab.dataset.setting}\"]`
        );
        if (panel) panel.classList.add("active");
      }
    });
  });
};

const initViewNavigation = () => {
  const navLinks = document.querySelectorAll(".nav-link");
  const views = document.querySelectorAll(".view");
  const setActiveView = (viewName) => {
    navLinks.forEach((link) =>
      link.classList.toggle("active", link.dataset.view === viewName)
    );
    views.forEach((view) =>
      view.classList.toggle("active", view.dataset.view === viewName)
    );
  };
  navLinks.forEach((link) => {
    link.addEventListener("click", () => {
      setActiveView(link.dataset.view);
    });
  });
  document.querySelectorAll("[data-view-target]").forEach((button) => {
    button.addEventListener("click", () => {
      setActiveView(button.dataset.viewTarget);
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

const initBotActions = () => {
  const apiUrlInput = document.getElementById("botApiUrl");
  const tokenInput = document.getElementById("botToken");
  const chatInput = document.getElementById("botChatId");
  const webhookInput = document.getElementById("botWebhookUrl");

  const getConfig = () => ({
    apiUrl: apiUrlInput?.value?.trim() || "http://localhost:3000",
    token: tokenInput?.value?.trim() || "",
    chatId: chatInput?.value?.trim() || "",
    webhookUrl: webhookInput?.value?.trim() || "",
  });

  const request = async (path, options = {}) => {
    const { apiUrl } = getConfig();
    const response = await fetch(`${apiUrl}${path}`, {
      headers: { "Content-Type": "application/json", ...(options.headers || {}) },
      ...options,
    });
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.message || "Erro na chamada do servidor.");
    }
    return payload;
  };

  const mergeBotExpenses = (items = []) => {
    if (!Array.isArray(items)) return;
    const existingIds = new Set(state.botSyncedIds);
    let added = 0;
    items.forEach((item) => {
      if (!item || existingIds.has(item.id)) return;
      existingIds.add(item.id);
      state.transactions.unshift(item);
      added += 1;
    });
    if (added > 0) {
      state.botSyncedIds = Array.from(existingIds);
      saveBotSyncedIds();
      saveTransactions();
      renderTransactions();
      renderSummary();
    }
    return added;
  };

  const syncExpenses = async (showFeedback = false) => {
    const result = await request("/api/expenses");
    const added = mergeBotExpenses(result.expenses || []);
    if (showFeedback) {
      showToast(
        added ? `${added} gasto(s) sincronizado(s).` : "Nenhum gasto novo."
      );
    }
  };

  const actionMap = {
    "test-connection": async () => request("/api/telegram/health"),
    webhook: async () => {
      const { token, webhookUrl } = getConfig();
      return request("/api/telegram/webhook", {
        method: "POST",
        body: JSON.stringify({ token, webhookUrl }),
      });
    },
    diagnose: async () => {
      const { token } = getConfig();
      return request(`/api/telegram/diagnose?token=${encodeURIComponent(token)}`);
    },
    test: async () => {
      const { token, chatId } = getConfig();
      return request("/api/telegram/test-message", {
        method: "POST",
        body: JSON.stringify({ token, chatId, message: "Teste do Controle de Gastos" }),
      });
    },
    "sync-expenses": async () => {
      await syncExpenses(true);
      return { skipToast: true };
    },
  };

  document.querySelectorAll("[data-bot-action]").forEach((button) => {
    button.addEventListener("click", async () => {
      try {
        const action = button.dataset.botAction;
        if (!actionMap[action]) {
          showToast("Ação inválida.");
          return;
        }
        showToast("Processando...");
        const result = await actionMap[action]();
        if (!result?.skipToast) {
          showToast(result?.message || "Ação concluída.");
        }
      } catch (error) {
        showToast(error.message || "Falha ao executar a ação.");
      }
    });
  });

  if (apiUrlInput) {
    const silentSync = () => syncExpenses(false).catch(() => {});
    apiUrlInput.addEventListener("change", silentSync);
    silentSync();
  }
};

const initUserActions = () => {
  const userList = document.getElementById("userList");
  if (!userList) return;
  userList.addEventListener("click", (event) => {
    const button = event.target.closest("[data-user-action]");
    if (!button) return;
    const userItem = button.closest(".user-item");
    if (!userItem) return;
    userItem.remove();
    showToast("Usuário removido.");
  });
};

const initUserInvite = () => {
  const emailInput = document.getElementById("inviteEmail");
  const inviteButton = document.getElementById("inviteUser");
  const userList = document.getElementById("userList");
  if (!emailInput || !inviteButton || !userList) return;

  const createUserItem = (email) => {
    const item = document.createElement("div");
    item.className = "user-item";
    item.innerHTML = `
      <div>
        <strong>${email.split("@")[0]}</strong>
        <p class="muted">${email}</p>
      </div>
      <div class="user-actions">
        <span class="pill">Usuário</span>
        <button class="text-button danger" data-user-action="remove">Excluir</button>
      </div>
    `;
    return item;
  };

  inviteButton.addEventListener("click", () => {
    const email = emailInput.value.trim();
    if (!email) {
      showToast("Informe um e-mail válido.");
      return;
    }
    userList.appendChild(createUserItem(email));
    emailInput.value = "";
    showToast("Convite enviado (simulado).");
  });
};

const init = () => {
  renderGoals();
  renderTransactions();
  renderSummary();
  initTabs();
  initViewNavigation();
  initThemeToggle();
  initBotActions();
  initUserActions();
  initUserInvite();
  renderComparisonChart();
  renderBudget(elements.budgetChart);
  renderBudget(elements.budgetStandalone);
  renderGoalProgress(elements.goalProgress);
  renderGoalProgress(elements.budgetProgress);
  renderCategoryList();
  renderCalendar(elements.calendarGrid);
  renderCalendar(elements.calendarStandalone);

  document.getElementById("openModal").addEventListener("click", openModal);
  document.getElementById("closeModal").addEventListener("click", closeModal);
  document.getElementById("clearForm").addEventListener("click", () =>
    elements.expenseForm.reset()
  );
  document
    .getElementById("exportCsv")
    .addEventListener("click", exportCsv);
  const optionalHandlers = [
    { id: "toggleFilters", handler: () => showToast("Filtros aplicados") },
    { id: "addGoal", handler: () => showToast("Nova meta criada") },
  ];
  optionalHandlers.forEach(({ id, handler }) => {
    const element = document.getElementById(id);
    if (element) {
      element.addEventListener("click", handler);
    }
  });

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
