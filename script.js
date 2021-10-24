const housePriceEl = document.getElementById("housePrice");
const downPaymentEl = document.getElementById("downPayment");
const downPaymentPercentEl = document.getElementById("downPmtPercent");
const loanAmountEl = document.getElementById("loanAmount");
const mortgageTermEl = document.querySelectorAll("input[name=mortgageTerm]");
const interestRateEl = document.getElementById("interestRate");
const mortgageStartDateEl = document.getElementById("mortgageStartDate");

const monthlyPmtTableEl = document.getElementById("monthly-pmt");

const Mortgage = class {
  constructor(
    housePrice,
    downPayment,
    mortgageTerm,
    interestRate,
    mortgageStartDate
  ) {
    this.housePrice = parseInt(housePrice.replaceAll(",", ""));
    this.downPayment = +downPayment.replaceAll(",", "");
    this.mortgageTerm = +mortgageTerm;
    this.interestRate = +interestRate.replaceAll(",", "");
    this.mortgageStartDate = new Date(mortgageStartDate + "-01, 00:00:00"); //Set to first of the month
  }
  displayFixedCells() {
    if (this.housePrice > 0 && this.downPayment > 0) {
      downPaymentPercentEl.placeholder =
        ((this.downPayment / this.housePrice) * 100).toFixed(2) + "%";
      loanAmountEl.placeholder = formatNumber(
        (this.housePrice - this.downPayment).toString()
      );
    }
  }

  mortgageTermsInMonth() {
    return this.mortgageTerm * 12;
  }
  monthlyInterestRate() {
    return this.interestRate / 100 / 12;
  }
  loanBalance() {
    return this.housePrice - this.downPayment;
  }

  getMonthlyMortgagePaymentAmount() {
    return (
      this.loanBalance() /
      ((1 -
        Math.pow(
          1 + this.monthlyInterestRate(),
          -this.mortgageTermsInMonth()
        )) /
        this.monthlyInterestRate())
    );
  }
};

// call back for clicking Submit button
const calculateMortgage = function () {
  const mortgage = new Mortgage(
    housePriceEl.value,
    downPaymentEl.value,
    (() => {
      for (mortgageTerm of mortgageTermEl) {
        if (mortgageTerm.checked === true) return mortgageTerm.value;
        else return undefined;
      }
    })(), // Loop through the radio input option to get the value
    interestRateEl.value,
    mortgageStartDateEl.value
  );

  if (
    !mortgage.housePrice ||
    !mortgage.downPayment ||
    !mortgage.interestRate ||
    !mortgage.mortgageTerm ||
    !mortgage.mortgageStartDate
  )
    return;

  if (+mortgage.interestRate >= 20 || +mortgage.interestRate <= 0) {
    alert("Are you sure your interest rate is correct?");
    return;
  }

  if (+mortgage.housePrice < +mortgage.downPayment) {
    alert("Are you sure your house price and down payment amount are correct?");
    return;
  }

  mortgage.displayFixedCells();

  // Check if there is already data, if there is, clear first
  if (!document.querySelector("#monthly-pmt")) {
    calculateMonthlyData(mortgage);
  } else {
    clearMortgageTableData();
    calculateMonthlyData(mortgage);
  }
};

// Listen to the Calculate button
document
  .querySelector(".submit-btn")
  .addEventListener("click", calculateMortgage);

// Listen to the price input box and format the number to currency
housePriceEl.addEventListener("keyup", function () {
  this.value = formatNumber(this.value);
});
downPaymentEl.addEventListener("keyup", function () {
  this.value = formatNumber(this.value);
});

// format number 1000000 to 1,234,567
function formatNumber(n) {
  return n.replace(/\D/g, "").replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

const renderMonthlyTable = function (data) {
  for (let i = 0; i < data.length; i++) {
    let HTML = `
    <tr class="payment-table-row">
            <td>${data[i].nextPaymentDate}</td>
            <td>${data[i].monthlyMortgagePayment}</td>
            <td>${data[i].monthlyPrincipalAmount}</td>
            <td>${data[i].monthlyInterestPayment}</td>
            <td>${data[i].totalInterestPaidSoFar}</td>
            <td>${data[i].totalRemainingBalance}</td>
    </tr>
    `;
    monthlyPmtTableEl.insertAdjacentHTML("beforeend", HTML);
  }
};

const MortgageTableData = class {
  constructor(
    monthlyInterestPayment,
    monthlyPrincipalAmount,
    totalRemainingBalance,
    totalInterestPaidSoFar,
    nextPaymentDate,
    monthlyMortgagePayment
  ) {
    (this.monthlyInterestPayment = monthlyInterestPayment),
      (this.monthlyPrincipalAmount = monthlyPrincipalAmount),
      (this.totalRemainingBalance = totalRemainingBalance),
      (this.totalInterestPaidSoFar = totalInterestPaidSoFar),
      (this.nextPaymentDate = nextPaymentDate);
    this.monthlyMortgagePayment = monthlyMortgagePayment;
  }
};

const clearMortgageTableData = function () {
  document.querySelector("#monthly-pmt").innerHTML = "";
};

const calculateMonthlyData = function (mortgage) {
  const mortgageTermsInMonth = mortgage.mortgageTermsInMonth();
  const monthlyInterestRate = mortgage.monthlyInterestRate();
  const loanBalance = mortgage.loanBalance();
  const monthlyMortgagePayment = mortgage.getMonthlyMortgagePaymentAmount();

  let monthlyInterestPayment = loanBalance * monthlyInterestRate;
  let monthlyPrincipalAmount = monthlyMortgagePayment - monthlyInterestPayment;
  let totalRemainingBalance = loanBalance - monthlyPrincipalAmount;
  let totalInterestPaidSoFar = monthlyInterestPayment; // Set the value to the first interst pmt, it will add later
  let nextMonth = mortgage.mortgageStartDate;

  const mortgagePaymentTable = [];

  for (let i = 0; i < mortgageTermsInMonth; i++) {
    mortgagePaymentTable[i] = new MortgageTableData(
      formatNumber(monthlyInterestPayment.toFixed(0)),
      formatNumber(monthlyPrincipalAmount.toFixed(0)),
      formatNumber(totalRemainingBalance.toFixed(0)),
      formatNumber(totalInterestPaidSoFar.toFixed(0)),
      `${nextMonth.getMonth() + 1}/${nextMonth.getDate()}/${
        nextMonth.getYear() + 1900
      }`,
      formatNumber(monthlyMortgagePayment.toFixed(0))
    );
    monthlyInterestPayment = totalRemainingBalance * monthlyInterestRate;
    monthlyPrincipalAmount = monthlyMortgagePayment - monthlyInterestPayment;
    totalRemainingBalance = totalRemainingBalance - monthlyPrincipalAmount;
    totalInterestPaidSoFar += monthlyInterestPayment;
    nextMonth.setMonth(nextMonth.getMonth() + 1);
  }

  renderMonthlyTable(mortgagePaymentTable);
};
