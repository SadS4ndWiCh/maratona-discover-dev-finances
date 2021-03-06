// Manipular o Modal
const Modal = {
  openAddTransaction() {
    document.querySelector("#add-transaction").classList.add("active");
  },

  openEditTransaction(transactionIndex) {
    const transaction = Transaction.all[transactionIndex];
    Form.insertData(transactionIndex, transaction);
    document.querySelector("#edit-transaction").classList.add("active");
  },

  openFilterTransaction() {
    document.querySelector("#filter-transaction").classList.add("active");
  },

  close() {
    document.querySelector(".modal-overlay.active").classList.remove("active");
  },
};

// Manipular os Temas do site
const Theme = {
  changingTheme: false,
  themeSwitch: document.querySelector(".theme-switch"),

  // Tem o botão que troca entre Tema escuro e claro
  // Esse comando é só para trocar entre eles
  // Se fizer outros temas, só fazer um comando para
  // trocar de entre temas passando o nome do tema
  toggleLightDark() {
    Theme.themeSwitch.addEventListener("click", () => {
      if (Theme.changingTheme) return;
      Theme.changingTheme = true;

      const htmlTag = document.querySelector("html");
      const theme = htmlTag.getAttribute("data-theme");

      if (theme === "dark") {
        htmlTag.setAttribute("data-theme", "light");
      } else if (theme === "light") {
        htmlTag.setAttribute("data-theme", "dark");
      }
      setTimeout(() => {
        Theme.changingTheme = false;
      }, 100);

      window.localStorage.setItem("dev.finances:theme", htmlTag.dataset.theme);
    });
  },

  // Aplica o tema inicial caso tenha um tema salvo no localStorage
  // caso não tenha nada salvo no localStorage, será o tema claro padão
  applyInitialTheme() {
    const theme = localStorage.getItem("dev.finances:theme");
    if (theme != null) {
      const htmlTag = document.querySelector("html");
      htmlTag.setAttribute("data-theme", theme);
    }
  },
};

// Salvar ou pegar os dados no site
const Storage = {
  get() {
    return JSON.parse(localStorage.getItem("dev.finances:transactions")) || [];
  },

  set(transactions) {
    localStorage.setItem(
      "dev.finances:transactions",
      JSON.stringify(transactions)
    );
  },
};

// Métodos para trabalhar com os dados das transações
const Transaction = {
  all: Storage.get(),

  // Adiciona uma nova transação
  add(newTransaction) {
    Transaction.all.push({ ...newTransaction, id: Transaction.all.length });
    DOM.transactions = [...Transaction.all];

    // Depois de adicionar uma nova transação, recarregue
    App.reload();
  },

  // Remove uma transação
  remove(transactionIndex) {
    // Usando o index do Array, mas tem que usar o ID
    Transaction.all.splice(transactionIndex, 1);
    Transaction.updateDOMTransactions();

    // Depois de remover uma transação, recarregue
    App.reload();
  },

  // Edita uma transação
  edit(editedTransacion) {
    const transactionIndex = editedTransacion.id;
    Transaction.all.splice(transactionIndex, 1, editedTransacion);
    Transaction.updateDOMTransactions();

    App.reload();
  },

  // Filtra as transações
  filter(initialDate, finalDate, transactionType) {
    let filteredTransactions = [...Transaction.all];

    filteredTransactions = filteredTransactions.filter((transaction) => {
      const transactionDate = new Date(transaction.date);

      // Tem a Data Inicial e Data Final
      if (initialDate && finalDate) {
        return (
          transactionDate.getTime() >= initialDate &&
          transactionDate.getDate() <= finalDate
        );

        // Não tem a Data Inicial e tem a Data Final
      } else if (!initialDate && finalDate) {
        return transactionDate.getTime() <= finalDate;

        // Tem a Data Inicial e não tem a Data Final
      } else if (initialDate && !finalDate) {
        return transactionDate.getTime() >= initialDate;
      }

      // Não tem ambas
      return true;
    });

    // Se o tipo da transação for diferente de 'any', filtre elas
    if (transactionType !== "any") {
      filteredTransactions = filteredTransactions.filter(
        (transaction) => transaction.type === transactionType
      );
    }

    DOM.transactions = filteredTransactions;

    App.reload();
  },

  updateDOMTransactions() {
    DOM.transactions = [...Transaction.all];
  },

  // Calcula o total da Entradas
  incomes() {
    // Somar as entradas
    return Transaction.all.reduce((totalIncome, currentTransaction) => {
      if (currentTransaction.type === "income")
        totalIncome += currentTransaction.amount;

      return totalIncome;
    }, 0);
  },

  // Calcula o total da Saídas
  expenses() {
    // Somar as saídas
    return Transaction.all.reduce((totalExpense, currentTransaction) => {
      if (currentTransaction.type === "expense")
        totalExpense += currentTransaction.amount;

      return totalExpense;
    }, 0);
  },

  // Calcula o total
  total() {
    // Entradas - Saídas
    return Transaction.incomes() + Transaction.expenses();
  },

  // Exporta os dados para csv
  export() {
    // Converte as transações em string de estilo csv 
    const csvTransactions = Utils.transactionsToCSV(Transaction.all);
    // Transforma a string em URI
    const encodedUri = encodeURI(csvTransactions);
    
    // Cria o elemento de Âncora e adiciona atributos e classes necessárias
    const link = document.createElement('a');
    link.classList.add('sr-only');
    link.setAttribute('href', encodedUri);
    link.download = 'transactions.csv'; // Para dar um nome específico ao arquivo

    // Adiciona ele no body
    document.body.appendChild(link);
    // Faz com que clique automaticamente para baixar
    link.click();
    // Remove elemento do body
    document.body.removeChild(link);
  },
};

// Métodos para manipular os dados visíveis
const DOM = {
  transactions: Storage.get(),

  transactionsContainer: document.querySelector("#data-table tbody"),

  balanceIncomeDisplay: document.querySelector("#income-display"),
  balanceExpenseDisplay: document.querySelector("#expense-display"),
  balanceTotalDisplay: document.querySelector("#total-display"),

  // Adiciona uma transação na tabela
  addTransaction(transaction, index) {
    const tr = document.createElement("tr");
    tr.innerHTML = DOM.innerHTMLTransaction(transaction, index);
    tr.dataset.index = index;

    DOM.transactionsContainer.appendChild(tr);
  },

  // Cria a row da transação
  innerHTMLTransaction({ description, amount, date, type }, index) {
    date = Utils.formatDateToLocale(date);
    const currency = Utils.formatCurrency(amount);

    const html = `
      <td class="description">${description}</td>
      <td class="${type} amount num-display">${currency}</td>
      <td class="date">${date}</td>
      <td>
        <div class="transaction-options">
          <div class="btn-icon" onclick="Modal.openEditTransaction(${index})"><img src="./assets/edit.svg" alt="Edit Transaction"></div>
          <div class="btn-icon" onclick="Transaction.remove(${index})"><img src="./assets/minus.svg" alt="Remove Transaction"></div>
        </div>
      </td>
    `;

    return html;
  },

  // Atualiza os cards
  updateBalance() {
    // Atualiza a Entrada
    DOM.balanceIncomeDisplay.innerHTML = Utils.formatCurrency(
      Transaction.incomes()
    );

    // Atualiza a Saída
    DOM.balanceExpenseDisplay.innerHTML = Utils.formatCurrency(
      Transaction.expenses()
    );

    // Atualiza o Total
    DOM.balanceTotalDisplay.innerHTML = Utils.formatCurrency(
      Transaction.total()
    );
  },

  // Remove todas transações da tabela
  clearTransactions() {
    DOM.transactionsContainer.innerHTML = "";
  },

  // Adiciona todas as transações na tabela
  renderTransactions() {
    const { data, totalPage } = Paginate.transactionsPaginate();
    DOM.clearTransactions();

    data.forEach(DOM.addTransaction);
    Paginate.createPaginationButtons(totalPage);
  },
};

// Métodos para manipular a paginação
const Paginate = {
  transactionsPageButtons: document.querySelector("#table-pages-buttons"),
  transactionsCurrentPage: 1,
  transactionsPerPage: 6,
  transactionsPageOffset: 5,

  // Pega as transações correspondente a página
  transactionsPaginate() {
    const currentPage = Paginate.transactionsCurrentPage;
    const totalPage = Math.ceil(
      Transaction.all.length / Paginate.transactionsPerPage
    );
    const firstIndex = (currentPage - 1) * Paginate.transactionsPerPage;
    const lastIndex = firstIndex + Paginate.transactionsPerPage;

    return {
      data: DOM.transactions.slice(firstIndex, lastIndex),
      currentPage,
      totalPage,
    };
  },

  // Cria os botões das páginas
  createPaginationButtons(pages) {
    const {
      transactionsCurrentPage: currentPage,
      transactionsPageOffset: pageOffset,
      transactionsPageButtons: pageButtons,
    } = Paginate;

    pageButtons.innerHTML = "";

    if (pages <= 1) return;

    let maxLeft = currentPage - Math.floor(pageOffset / 2);
    let maxRight = currentPage + Math.floor(pageOffset / 2);
    if (maxLeft < 1) {
      maxLeft = 1;
      maxRight = pageOffset;
    }

    if (maxRight > pages) {
      maxLeft = pages - (pageOffset - 1);
      maxRight = pages;

      if (maxLeft < 1) {
        maxLeft = 1;
      }
    }

    for (let page = maxLeft; page <= maxRight; page++) {
      pageButtons.innerHTML += `
        <button value="${page}" class="page ${
        page === currentPage ? "current" : ""
      }" onclick="Paginate.goToPage(this.value)">${page}</button>
      `;
    }

    if (currentPage != 1) {
      pageButtons.innerHTML =
        `<button value="1" class="page" onclick="Paginate.goToPage(this.value)">&#171; First</button>` +
        pageButtons.innerHTML;
    }

    if (currentPage != pages) {
      pageButtons.innerHTML += `<button value="${pages}" class="page" onclick="Paginate.goToPage(this.value)">Last &#187;</button>`;
    }
  },

  // Move para outra página da tabela
  goToPage(page) {
    Paginate.transactionsCurrentPage = Number(page);

    DOM.renderTransactions();
  },

  updatePerPage(event) {
    const { target } = event;
    const perPage = Math.min(25, Math.max(4, Number(target.value)));

    Paginate.transactionsPerPage = perPage;
    target.value = perPage;

    DOM.renderTransactions();
  },
};

// Ordenar a coluna
const OrderColumn = {
  currentOrderButton: undefined,

  orderDescriptionButton: document.querySelector("#order-description"),
  orderAmountButton: document.querySelector("#order-amount"),
  orderDateButton: document.querySelector("#order-date"),

  resetOthersButtonsOrder() {
    document.querySelectorAll(".order").forEach((btn) => {
      const { order } = btn.dataset;

      btn.dataset.order =
        btn === OrderColumn.currentOrderButton ? order : "desc";
    });
  },

  toggleOrder() {
    const { order } = OrderColumn.currentOrderButton.dataset;

    OrderColumn.currentOrderButton.dataset.order =
      order === "desc" ? "asc" : "desc";
  },

  // Ordenar baseado na descrição
  byDescription() {
    OrderColumn.currentOrderButton = OrderColumn.orderDescriptionButton;
    OrderColumn.resetOthersButtonsOrder();

    if (OrderColumn.currentOrderButton.dataset.order === "desc") {
      DOM.transactions = DOM.transactions.sort((a, b) => {
        return a.description.localeCompare(b.description, "pt-br", {
          ignorePunctuation: true,
        });
      });
    } else {
      DOM.transactions = DOM.transactions.sort((a, b) => {
        return b.description.localeCompare(a.description, "pt-br", {
          ignorePunctuation: true,
        });
      });
    }

    OrderColumn.toggleOrder();
    DOM.renderTransactions();
  },

  // Ordenar baseado no valor
  byAmount() {
    OrderColumn.currentOrderButton = OrderColumn.orderAmountButton;
    OrderColumn.resetOthersButtonsOrder();

    if (OrderColumn.currentOrderButton.dataset.order === "desc") {
      DOM.transactions = DOM.transactions.sort((a, b) => {
        return Math.abs(a.amount) > Math.abs(b.amount) ? 1 : -1;
      });
    } else {
      DOM.transactions = DOM.transactions.sort((a, b) => {
        return Math.abs(a.amount) > Math.abs(b.amount) ? -1 : 1;
      });
    }

    OrderColumn.toggleOrder();
    DOM.renderTransactions();
  },

  // Ordenar baseado na data
  byDate() {
    OrderColumn.currentOrderButton = OrderColumn.orderDateButton;
    OrderColumn.resetOthersButtonsOrder();

    if (OrderColumn.currentOrderButton.dataset.order === "desc") {
      DOM.transactions = DOM.transactions.sort((a, b) => {
        const aDate = new Date(a.date);
        const bDate = new Date(b.date);

        return aDate.getTime() > bDate.getTime() ? 1 : -1;
      });
    } else {
      DOM.transactions = DOM.transactions.sort((a, b) => {
        const aDate = new Date(a.date);
        const bDate = new Date(b.date);

        return aDate.getTime() > bDate.getTime() ? -1 : 1;
      });
    }

    OrderColumn.toggleOrder();
    DOM.renderTransactions();
  },
};

// Métodos utilitários
const Utils = {
  // Formata a quantia de dinheiro em R$
  formatCurrency(value) {
    const signal = Number(value) < 0 ? "-" : "";

    value = String(value).replace(/\D/g, "");
    value = Number(value) / 100;

    // Criando o objeto de como o número será formatado
    const o = Intl.NumberFormat("pt-BR", {
      style: "currency", // O estilo é de moeda
      currency: "BRL", // Moeda Real Brasileira
      maximumFractionDigits: 2, // Máximo de números após a vírgula
      notation: "compact", // Usando uma notação compacta para compactar números grandes
    });
    
    // Enfim formatando
    value = o.format(value); 

    return `${signal} ${value}`;
  },

  // Formata o valor recebido no formulário
  formatAmount(value) {
    return Math.round(Number(value) * 100);
  },

  // Formata a data recebida no formulário
  formatDate(date) {
    const [year, mounth, day] = date.split("-");
    date = new Date(year, mounth - 1, day);

    return date.toDateString();
  },

  formatFormDateToObject(date) {
    if (!date) return undefined;

    const dateString = Utils.formatDate(date);

    return new Date(dateString);
  },

  formatDateToLocale(date, locale) {
    const convertedDate = new Date(date);
    return convertedDate.toLocaleDateString(locale);
  },

  transactionsToCSV(transactions) {
    let csvContent = 'data:text/csv;charset=utf-8,description;amount;date;type\r\n';

    transactions.forEach(({ description, amount, date, type }) => {
      date = Utils.formatDateToLocale(date, 'pt-BR');
      
      csvContent += `${description};${amount/100};${date};${type}\r\n`;
    });

    return csvContent;
  },
};

// Métodos para manipular o Formulário
const Form = {
  descriptionField: document.querySelector("#description"),
  amountField: document.querySelector("#amount"),
  dateField: document.querySelector("#date"),

  descriptionEditField: document.querySelector("#editDescription"),
  amountEditField: document.querySelector("#editAmount"),
  dateEditField: document.querySelector("#editDate"),
  indexEditField: document.querySelector("#editIndex"),

  initialDateFilter: document.querySelector("#initialDate"),
  finalDateFilter: document.querySelector("#finalDate"),
  transactionTypeFilter: document.querySelector("#transactionType"),

  // Pega os valores dos campos
  getValuesOf(modalType) {
    const options = {
      add: {
        description: Form.descriptionField.value,
        amount: Form.amountField.value,
        date: Form.dateField.value,
      },
      edit: {
        id: Form.indexEditField.value,
        description: Form.descriptionEditField.value,
        amount: Form.amountEditField.value,
        date: Form.dateEditField.value,
      },
      filter: {
        initialDate: Form.initialDateFilter.value,
        finalDate: Form.finalDateFilter.value,
        transactionTypeFilter: Form.transactionTypeFilter.value,
      },
    };

    return options[modalType];
  },

  insertData(index, transaction) {
    let { description, amount, date } = transaction;

    Form.indexEditField.value = index;
    Form.descriptionEditField.value = description;
    Form.amountEditField.value = amount / 100;

    date = new Date(date).toLocaleDateString("pt-BR");
    Form.dateEditField.value = date.split("/").reverse().join("-");
  },

  // Formata os valores do formulário
  formatValuesOf(modalType) {
    if (modalType === "add") {
      let { description, amount, date } = Form.getValuesOf(modalType);

      amount = Utils.formatAmount(amount);
      date = Utils.formatDate(date);

      return {
        description,
        amount,
        date,
        type: amount > 0 ? "income" : "expense",
      };
    } else if (modalType === "edit") {
      let { id, description, amount, date } = Form.getValuesOf(modalType);

      id = parseInt(id);
      amount = Utils.formatAmount(amount);
      date = Utils.formatDate(date);

      return {
        id,
        description,
        amount,
        date,
        type: amount > 0 ? "income" : "expense",
      };
    }

    id = parseInt(id);
  },

  clearFields() {
    Form.descriptionField.value = "";
    Form.amountField.value = "";
    Form.dateField.value = "";

    Form.descriptionEditField.value = "";
    Form.amountEditField.value = "";
    Form.dateEditField.value = "";
    Form.indexEditField.value = "";
  },

  submit(event, submitType) {
    event.preventDefault();

    try {
      if (submitType === "add") {
        const newTransaction = Form.formatValuesOf("add");
        Transaction.add(newTransaction);
      } else if (submitType === "edit") {
        const editedTransaction = Form.formatValuesOf("edit");

        Transaction.edit(editedTransaction);
      } else if (submitType === "filter") {
        let {
          initialDate,
          finalDate,
          transactionTypeFilter,
        } = Form.getValuesOf("filter");

        initialDate = Utils.formatFormDateToObject(initialDate);
        finalDate = Utils.formatFormDateToObject(finalDate);

        Transaction.filter(initialDate, finalDate, transactionTypeFilter);
      }

      Form.clearFields();
      Modal.close();
    } catch (error) {
      alert(error.message);
    }
  },
};

// Métodos para manipular as funcionalidades do app em si
const App = {
  init() {
    DOM.renderTransactions();
    DOM.updateBalance();

    Storage.set(Transaction.all);
  },

  reload() {
    DOM.clearTransactions();
    App.init();
  },
};

Theme.applyInitialTheme();
App.init();
