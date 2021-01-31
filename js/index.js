// Manipular o Modal
const Modal = {
  toggle() {
    // Abrir o modal caso esteja fechado
    // e fechar o modal caso esteja aberto
    document.querySelector('.modal-overlay').classList.toggle('active');
  },
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
  
  balanceIncomeDisplay: document.querySelector('#income-display'),
  balanceExpenseDisplay: document.querySelector('#expense-display'),
  balanceTotalDisplay: document.querySelector('#total-display'),

  addTransaction(transaction, index) {
    const tr = document.createElement('tr');
    tr.innerHTML = DOM.innerHTMLTransaction(transaction, index);
    tr.dataset.index = index;

    DOM.transactionsContainer.appendChild(tr);
  },

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

  updateBalance() {
    // Atualiza a Entrada
    DOM.balanceIncomeDisplay.innerHTML = Utils.formatCurrency(Transaction.incomes());
    
    // Atualiza a Saída
    DOM.balanceExpenseDisplay.innerHTML = Utils.formatCurrency(Transaction.expenses());
    
    // Atualiza o Total
    DOM.balanceTotalDisplay.innerHTML = Utils.formatCurrency(Transaction.total());
  },

  clearTransactions() {
    DOM.transactionsContainer.innerHTML = '';
  }
};

// Métodos utilitários
const Utils = {
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

  formatAmount(value) {
    return Number(value) * 100;
  },

  formatDate(date) {
    const [year, mounth, day] = date.split('-');

    return `${day}/${mounth}/${year}`;

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

    } catch(error) {
      alert(error.message);
    }

  }
};

// Métodos para manipular as funcionalidades do app em si
const App = {
  init() {
    Transaction.all.forEach(DOM.addTransaction);
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