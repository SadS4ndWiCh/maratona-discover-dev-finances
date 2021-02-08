// Manipular o Modal
const Modal = {
  modalHtml: document.querySelector('.modal-overlay'),

  toggle() {
    // Abrir o modal caso esteja fechado
    // e fechar o modal caso esteja aberto
    Modal.modalHtml.classList.toggle('active');
  },

  open() {
    Modal.modalHtml.classList.add('active');
  },

  close() {
    Modal.modalHtml.classList.remove('active');
  }
}

// Manipular os Temas do site
const Theme = {
  changingTheme: false,
  themeSwitch: document.querySelector('.theme-switch'),

  // Tem o botão que troca entre Tema escuro e claro
  // Esse comando é só para trocar entre eles
  // Se fizer outros temas, só fazer um comando para
  // trocar de entre temas passando o nome do tema
  toggleLightDark() {
    Theme.themeSwitch.addEventListener('click', () => {
      if(Theme.changingTheme) return
      Theme.changingTheme = true;

      const htmlTag = document.querySelector('html');
      const theme = htmlTag.getAttribute('data-theme');

      if(theme === 'dark') {
        htmlTag.setAttribute('data-theme', 'light');
      } else if(theme === 'light') {
        htmlTag.setAttribute('data-theme', 'dark');
      }
      setTimeout(() => {
        Theme.changingTheme = false;
      }, 100);

      window.localStorage.setItem('theme', htmlTag.dataset.theme);
    });
  },

  // Aplica o tema inicial caso tenha um tema salvo no localStorage
  // caso não tenha nada salvo no localStorage, será o tema claro padão
  applyInitialTheme() {
    const theme = localStorage.getItem('theme');
    if(theme != null) {
      const htmlTag = document.querySelector('html');
      htmlTag.setAttribute('data-theme', theme);
    }
  }
}

// Salvar ou pegar os dados no site
const Storage = {
  get() {
    return JSON.parse(localStorage.getItem('dev.finances:transactions')) || [];
  },

  set(transactions) {
    localStorage.setItem('dev.finances:transactions', JSON.stringify(transactions));
  },
};

// Métodos para trabalhar com os dados das transações
const Transaction = {
  all: Storage.get(),

  // Adiciona uma nova transação
  add(transaction) {
    Transaction.all.push(transaction);

    // Depois de adicionar uma nova transação, recarregue
    App.reload();
  },

  // Remove uma transação
  remove(transactionIndex) {
    // Usando o index do Array, mas tem que usar o ID
    Transaction.all.splice(transactionIndex, 1);
    
    // Depois de remover uma transação, recarregue
    App.reload();
  },

  // Calcula o total da Entradas
  incomes() {
    // Somar as entradas
    return Transaction.all.reduce((totalIncome, currentTransaction) => {
      if(currentTransaction.type === 'income')
        totalIncome += currentTransaction.amount;
      
      return totalIncome
    }, 0); 
  },

  // Calcula o total da Saídas
  expenses() {
    // Somar as saídas
    return Transaction.all.reduce((totalExpense, currentTransaction) => {
      if(currentTransaction.type === 'expense')
        totalExpense += currentTransaction.amount;
      
      return totalExpense
    }, 0); 
  },

  // Calcula o total
  total() {
    // Entradas - Saídas
    return Transaction.incomes() + Transaction.expenses();
  },
};

// Métodos para manipular os dados visíveis
const DOM = {
  transactionsContainer: document.querySelector('#data-table tbody'),

  transactionsPageButtons: document.querySelector('#table-pages-buttons'),
  transactionsCurrentPage: 1,
  transactionsPerPage: 6,
  transactionsPageOffset: 5,

  balanceIncomeDisplay: document.querySelector('#income-display'),
  balanceExpenseDisplay: document.querySelector('#expense-display'),
  balanceTotalDisplay: document.querySelector('#total-display'),

  // Adiciona uma transação na tabela
  addTransaction(transaction, index) {
    const tr = document.createElement('tr');
    tr.innerHTML = DOM.innerHTMLTransaction(transaction, index);
    tr.dataset.index = index;

    DOM.transactionsContainer.appendChild(tr);
  },

  // Cria a row da transação
  innerHTMLTransaction({ description, amount, date, type }, index) {
    const html = `
      <td class="description">${description}</td>
      <td class="${type}">${Utils.formatCurrency(amount)}</td>
      <td class="date">${date}</td>
      <td>
        <img onclick="Transaction.remove(${index})" src="./assets/minus.svg" alt="Remove Transaction">
      </td>
    `;

    return html;
  },

  // Atualiza os cards
  updateBalance() {
    // Atualiza a Entrada
    DOM.balanceIncomeDisplay.innerHTML = Utils.formatCurrency(Transaction.incomes());
    
    // Atualiza a Saída
    DOM.balanceExpenseDisplay.innerHTML = Utils.formatCurrency(Transaction.expenses());
    
    // Atualiza o Total
    DOM.balanceTotalDisplay.innerHTML = Utils.formatCurrency(Transaction.total());
  },

  // Remove todas transações da tabela
  clearTransactions() {
    DOM.transactionsContainer.innerHTML = '';
  },

  // Adiciona todas as transações na tabela
  renderTransactions() {
    const { data, totalPage } = DOM.transactionsPaginate();
    DOM.clearTransactions();
    
    data.forEach(DOM.addTransaction);
    DOM.createPaginationButtons(totalPage);
  },

  // Pega as transações correspondente a página
  transactionsPaginate() {
    const currentPage = DOM.transactionsCurrentPage;
    const totalPage = Math.ceil(Transaction.all.length / DOM.transactionsPerPage);
    const firstIndex = (currentPage - 1) * DOM.transactionsPerPage;
    const lastIndex = firstIndex + DOM.transactionsPerPage;

    return {
      data: Transaction.all.slice(firstIndex, lastIndex),
      currentPage,
      totalPage,
    }
  },

  // Cria os botões das páginas
  createPaginationButtons(pages) {
    const {
      transactionsCurrentPage: currentPage,
      transactionsPageOffset: pageOffset,
      transactionsPageButtons: pageButtons,
    } = DOM;

    pageButtons.innerHTML = '';

    if(pages === 0) return

    let maxLeft = (currentPage - Math.floor(pageOffset / 2));
    let maxRight = (currentPage + Math.floor(pageOffset / 2));
    if(maxLeft < 1) {
      maxLeft = 1;
      maxRight = pageOffset;
    }

    if(maxRight > pages) {
      maxLeft = pages - (pageOffset - 1)
      maxRight = pages;
    
      if(maxLeft < 1) {
        maxLeft = 1;
      }
    }

    for (let page = maxLeft; page <= maxRight; page++) {
      pageButtons.innerHTML += `
        <button value="${page}" class="page ${page === currentPage ? 'current' : ''}" onclick="DOM.goToPage(this.value)">${page}</button>
      `
    }

    if(currentPage != 1) {
      pageButtons.innerHTML = `<button value="1" class="page" onclick="DOM.goToPage(this.value)">&#171; First</button>` + pageButtons.innerHTML;
    }

    if(currentPage != pages) {
      pageButtons.innerHTML += `<button value="${pages}" class="page" onclick="DOM.goToPage(this.value)">Last &#187;</button>`;
    }
  },

  // Move para outra página da tabela
  goToPage(page) {
    DOM.transactionsCurrentPage = Number(page);

    DOM.renderTransactions();
  }
};

// Ordenar a coluna
const OrderColumn = {
  currentOrderButton: undefined,

  orderDescriptionButton: document.querySelector('#order-description'),
  orderAmountButton: document.querySelector('#order-amount'),
  orderDateButton: document.querySelector('#order-date'),

  resetOthersButtonsOrder() {
    document.querySelectorAll('.order').forEach(btn => {
      const { order } = btn.dataset;

      btn.dataset.order = btn === OrderColumn.currentOrderButton ? order : 'desc';
    });
  },

  toggleOrder() {
    const { order } = OrderColumn.currentOrderButton.dataset;

    OrderColumn.currentOrderButton.dataset.order = order === 'desc' ? 'asc' : 'desc';
  },

  // Ordenar baseado na descrição
  byDescription() {
    OrderColumn.currentOrderButton = OrderColumn.orderDescriptionButton;
    OrderColumn.resetOthersButtonsOrder();

    if(OrderColumn.currentOrderButton.dataset.order === 'desc') {
      Transaction.all = Transaction.all.sort((a, b) => {
        return a.description.localeCompare(b.description, 'pt-br', { ignorePunctuation: true })
      });
    } else {
      Transaction.all = Transaction.all.sort((a, b) => {
        return b.description.localeCompare(a.description, 'pt-br', { ignorePunctuation: true })
      });
    }
    
    OrderColumn.toggleOrder();
    DOM.renderTransactions();

  },

  // Ordenar baseado no valor
  byAmount() {
    OrderColumn.currentOrderButton = OrderColumn.orderAmountButton;
    OrderColumn.resetOthersButtonsOrder();

    if(OrderColumn.currentOrderButton.dataset.order === 'desc') {
      Transaction.all = Transaction.all.sort((a, b) => {
        return a.amount > b.amount ? 1 : -1;
      });
    } else {
      Transaction.all = Transaction.all.sort((a, b) => {
        return a.amount > b.amount ? -1 : 1;
      });
    }
    
    OrderColumn.toggleOrder();
    DOM.renderTransactions();
  },

  // Ordenar baseado na data
  byDate() {
    OrderColumn.currentOrderButton = OrderColumn.orderDateButton;
    OrderColumn.resetOthersButtonsOrder();

    if(OrderColumn.currentOrderButton.dataset.order === 'desc') {
      // Para revisar outra hora
    }

    OrderColumn.toggleOrder();
  }
}

// Métodos utilitários
const Utils = {
  // Formata a quantia de dinheiro em R$
  formatCurrency(value) {
    const signal = Number(value) < 0 ? '-' : '';
    
    value = String(value).replace(/\D/g, '');
    value = Number(value) / 100;
    value = value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });

    return `${signal} ${value}`;
  },

  // Formata o valor recebido no formulário
  formatAmount(value) {
    return Math.round(Number(value) * 100);
  },

  // Formata a data recebida no formulário
  formatDate(date) {
    /* const [year, mounth, day] = date.split('-'); */
    date = new Date(date);

    return date.toLocaleDateString('pt-BR');

  },
}

// Métodos para manipular o Formulário
const Form = {
  descriptionField: document.querySelector('#description'),
  amountField: document.querySelector('#amount'),
  dateField: document.querySelector('#date'),

  // Pega os valores dos campos
  getValues() {
    return {
      description: Form.descriptionField.value,
      amount: Form.amountField.value,
      date: Form.dateField.value,
    }
  },

  // Formata os valores do formulário
  formatValues() {
    let { description, amount, date } = Form.getValues();

    amount = Utils.formatAmount(amount);
    date = Utils.formatDate(date);

    return {
      description,
      amount,
      date,
      type: amount > 0 ? 'income' : 'expense',
    }
  },

  // Valida se os campos estão preenchidos
  validateFields() {
    const { description, amount, date } = Form.getValues();

    if( description.trim() === '' ||
        amount.trim() === '' ||
        date.trim() === '' ) {
      throw new Error('Por favor, preencha todos os campos');
    }
  },

  clearFields() {
    Form.descriptionField.value = '';
    Form.amountField.value = '';
    Form.dateField.value = '';
  },

  submit(event) {
    event.preventDefault();
    
    try {
      Form.validateFields();
      
      const transaction = Form.formatValues();
      Transaction.add(transaction);

      Form.clearFields();
      Modal.close();

    } catch(error) {
      alert(error.message);
    }

  }
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