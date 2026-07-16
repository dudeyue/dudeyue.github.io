const revenueInput = document.getElementById("revenue");
const fuelInput = document.getElementById("fuel");
const otherInput = document.getElementById("other");

const btn = document.getElementById("calculateBtn");

const showRevenue = document.getElementById("showRevenue");
const showExpense = document.getElementById("showExpense");
const showProfit = document.getElementById("showProfit");

function money(number) {
    return Number(number).toLocaleString("vi-VN") + " ₫";
}

function value(input) {
    return Number(input.value) || 0;
}

function calculate() {

    const revenue = value(revenueInput);
    const fuel = value(fuelInput);
    const other = value(otherInput);

    const expense = fuel + other;
    const profit = revenue - expense;

    showRevenue.textContent = money(revenue);
    showExpense.textContent = money(expense);
    showProfit.textContent = money(profit);

    if (profit >= 0) {
        showProfit.style.color = "#16a34a";
    } else {
        showProfit.style.color = "#ef4444";
    }
}

btn.addEventListener("click", calculate);

[revenueInput, fuelInput, otherInput].forEach(input => {
    input.addEventListener("input", calculate);
});

calculate();
