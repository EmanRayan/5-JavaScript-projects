const display = document.getElementById("display");
const buttons = document.querySelectorAll(".btn");

// Object with operations
const calculator = {
  currentInput: "",
  operator: null,
  previousInput: "",

  // Functions for operations
  operations: {
    "+": (a, b) => a + b,
    "-": (a, b) => a - b,
    "*": (a, b) => a * b,
    "/": (a, b) => b === 0 ? "Error" : a / b
  },

  clear() {
    this.currentInput = "";
    this.previousInput = "";
    this.operator = null;
    display.textContent = "0";
  },

  appendNumber(num) {
    if (num === "." && this.currentInput.includes(".")) return;
    this.currentInput += num;
    display.textContent = this.currentInput;
  },

  chooseOperator(op) {
    if (this.currentInput === "") return;
    if (this.previousInput !== "") {
      this.calculate();
    }
    this.operator = op;
    this.previousInput = this.currentInput;
    this.currentInput = "";
  },

  calculate() {
    const prev = parseFloat(this.previousInput);
    const curr = parseFloat(this.currentInput);
    if (isNaN(prev) || isNaN(curr)) return;

    const operation = this.operations[this.operator];
    const result = operation(prev, curr);

    this.currentInput = result.toString();
    this.operator = null;
    this.previousInput = "";
    display.textContent = result;
  }
};

// Event listeners
buttons.forEach((btn) => {
  if (btn.dataset.num) {
    btn.addEventListener("click", () => {
      calculator.appendNumber(btn.dataset.num);
    });
  }

  if (btn.dataset.op) {
    btn.addEventListener("click", () => {
      calculator.chooseOperator(btn.dataset.op);
    });
  }

  if (btn.classList.contains("equal")) {
    btn.addEventListener("click", () => {
      calculator.calculate();
    });
  }

  if (btn.classList.contains("clear")) {
    btn.addEventListener("click", () => {
      calculator.clear();
    });
  }
});
