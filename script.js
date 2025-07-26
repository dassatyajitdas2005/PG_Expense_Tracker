// script.js

// --- Constants and Initial Data ---
const WEEKS_IN_MONTH = 4; // Assuming 4 weeks per month for tracking purposes

// --- DOM Elements ---
const currentWeekSpan = document.getElementById('current-week');
const currentMonthSpan = document.getElementById('current-month');
const prevWeekBtn = document.getElementById('prev-week-btn');
const nextWeekBtn = document.getElementById('next-week-btn');

// In-Charge & Payments Section
const weeklyInChargeNameInput = document.getElementById('weekly-incharge-name');
const saveInChargeBtn = document.getElementById('save-incharge-btn');
const currentInChargeDisplay = document.getElementById('current-incharge-display');
const payerNameInput = document.getElementById('payer-name-input');
const paidAmountInput = document.getElementById('paid-amount-input');
const addEntryBtn = document.getElementById('add-entry-btn');
const weeklyEntriesList = document.getElementById('weekly-entries-list');
const weeklyTotalExpenseInput = document.getElementById('weekly-total-expense');
const saveWeeklyExpenseBtn = document.getElementById('save-weekly-expense-btn');
const finalizeWeekBtn = document.getElementById('finalize-week-btn');

// Bazaar items elements
const bazaarItemInput = document.getElementById('bazaar-item-input');
const addBazaarItemBtn = document.getElementById('add-bazaar-item-btn');
const bazaarItemsList = document.getElementById('bazaar-items-list');

// Summary elements
const weeklyTotalPaidSpan = document.getElementById('weekly-total-paid');
const weeklyExpenseDisplaySpan = document.getElementById('weekly-expense-display');
const monthlyTotalPaidSpan = document.getElementById('monthly-total-paid');
const monthlyExpenseDisplaySpan = document.getElementById('monthly-expense-display');

// Action buttons
const resetDataBtn = document.getElementById('reset-data-btn'); // Renamed from resetMonthBtn
const downloadReportBtn = document.getElementById('download-report-btn');

// --- Global State (Managed by LocalStorage) ---
let appData = {
    currentWeek: 1,
    currentMonth: 1,
    weeks: {} // Structure: { 'week1': { inCharge: '', weeklyPayments: [], weeklyExpense: 0, bazaarItems: [], finalized: false }, 'week2': ... }
};

// --- Helper Functions ---

/**
 * Saves the current appData to localStorage.
 */
function saveData() {
    localStorage.setItem('pgExpenseTrackerData', JSON.stringify(appData));
    showAlert('Data saved successfully!');
}

/**
 * Loads appData from localStorage or initializes if not found.
 */
function loadData() {
    const storedData = localStorage.getItem('pgExpenseTrackerData');
    if (storedData) {
        appData = JSON.parse(storedData);
        // Ensure the data structure for older weeks is compatible if new fields were added
        for (const weekKey in appData.weeks) {
            const week = appData.weeks[weekKey];
            if (!week.weeklyPayments) week.weeklyPayments = [];
            if (week.inCharge === undefined) week.inCharge = '';
            if (week.bazaarItems === undefined) week.bazaarItems = [];
            if (week.finalized === undefined) week.finalized = false;
        }
        // Ensure current week exists, and handle it gracefully
        initializeWeek(appData.currentWeek);
    } else {
        // If no data exists, initialize a brand new state
        initializeNewData();
    }
    updateUI();
}

/**
 * Initializes all data from scratch (used on first load or manual reset).
 */
function initializeNewData() {
    appData.currentWeek = 1;
    appData.currentMonth = 1;
    appData.weeks = {}; // Clear all previous week data
    initializeWeek(appData.currentWeek); // Initialize the first week
    saveData();
}

/**
 * Initializes a specific week's data if it doesn't exist.
 * @param {number} weekNum - The week number to initialize.
 */
function initializeWeek(weekNum) {
    const weekKey = `week${weekNum}`;
    if (!appData.weeks[weekKey]) {
        appData.weeks[weekKey] = {
            inCharge: '',
            weeklyPayments: [], // { name: "John Doe", amount: 250 }
            weeklyExpense: 0,
            bazaarItems: [],
            finalized: false
        };
    }
}

/**
 * Updates all UI elements based on the current appData.
 * This is the main function to call after any state change.
 */
function updateUI() {
    const currentWeekData = appData.weeks[`week${appData.currentWeek}`];

    currentWeekSpan.textContent = appData.currentWeek;
    currentMonthSpan.textContent = appData.currentMonth;

    // Update In-Charge display
    weeklyInChargeNameInput.value = currentWeekData.inCharge || '';
    currentInChargeDisplay.textContent = currentWeekData.inCharge || 'Not Set';

    // Update Weekly Expense Input
    weeklyTotalExpenseInput.value = currentWeekData.weeklyExpense || '';

    // Render Weekly Payment Entries
    renderWeeklyPaymentEntries(currentWeekData.weeklyPayments);

    // Render Bazaar Items
    renderBazaarItems(currentWeekData.bazaarItems);

    // Update Summary
    updateSummary();

    // Enable/disable navigation buttons
    prevWeekBtn.disabled = appData.currentWeek === 1;
    // Next week is always enabled as we can always add new weeks

    // Disable inputs/buttons if week is finalized
    const isFinalized = currentWeekData.finalized;
    weeklyInChargeNameInput.disabled = isFinalized;
    saveInChargeBtn.disabled = isFinalized;
    payerNameInput.disabled = isFinalized;
    paidAmountInput.disabled = isFinalized;
    addEntryBtn.disabled = isFinalized;
    weeklyTotalExpenseInput.disabled = isFinalized;
    saveWeeklyExpenseBtn.disabled = isFinalized;
    finalizeWeekBtn.disabled = isFinalized; // Disable finalize once clicked

    if (isFinalized) {
        finalizeWeekBtn.textContent = 'Week Finalized';
        finalizeWeekBtn.style.backgroundColor = '#6c757d'; // Grey out
    } else {
        finalizeWeekBtn.textContent = 'Finalize Week Entries';
        finalizeWeekBtn.style.backgroundColor = '#4CAF50'; // Green
    }
}

/**
 * Renders the list of weekly payment entries.
 * @param {Array<Object>} payments - Array of payment objects ({name, amount}).
 */
function renderWeeklyPaymentEntries(payments) {
    weeklyEntriesList.innerHTML = ''; // Clear existing entries
    if (payments && payments.length > 0) {
        payments.forEach((entry, index) => {
            const listItem = document.createElement('li');
            listItem.innerHTML = `
                <span>${entry.name}: ₹${entry.amount.toFixed(2)}</span>
                <button class="remove-entry-btn" data-index="${index}">&times;</button>
            `;
            weeklyEntriesList.appendChild(listItem);
        });
    } else {
        const noEntriesMessage = document.createElement('li');
        noEntriesMessage.textContent = "No payment entries for this week yet.";
        noEntriesMessage.style.fontStyle = 'italic';
        noEntriesMessage.style.color = '#777';
        weeklyEntriesList.appendChild(noEntriesMessage);
    }
}

/**
 * Renders the list of bazaar items for the current week.
 * @param {Array<string>} items - Array of bazaar item strings.
 */
function renderBazaarItems(items) {
    bazaarItemsList.innerHTML = ''; // Clear existing items
    if (items && items.length > 0) {
        items.forEach((item, index) => {
            const listItem = document.createElement('li');
            listItem.innerHTML = `
                <span>${item}</span>
                <button class="remove-item-btn" data-index="${index}">&times;</button>
            `;
            bazaarItemsList.appendChild(listItem);
        });
    } else {
        const noItemsMessage = document.createElement('li');
        noItemsMessage.textContent = "No items added for this week yet.";
        noItemsMessage.style.fontStyle = 'italic';
        noItemsMessage.style.color = '#777';
        bazaarItemsList.appendChild(noItemsMessage);
    }
}

/**
 * Updates the weekly and monthly summary displays.
 */
function updateSummary() {
    const currentWeekData = appData.weeks[`week${appData.currentWeek}`];

    // Weekly totals
    let weeklyTotalPaid = currentWeekData.weeklyPayments.reduce((sum, entry) => {
        return sum + entry.amount;
    }, 0);

    // Monthly totals
    let monthlyTotalPaid = 0;
    let monthlyExpense = 0;

    // Calculate monthly totals based on weeks within the current month (conceptual, 4 weeks = 1 month)
    const startWeekOfCurrentMonth = (appData.currentMonth - 1) * WEEKS_IN_MONTH + 1;
    const endWeekOfCurrentMonth = appData.currentMonth * WEEKS_IN_MONTH;

    for (let i = startWeekOfCurrentMonth; i <= endWeekOfCurrentMonth; i++) {
        const weekData = appData.weeks[`week${i}`];
        if (weekData) {
            monthlyExpense += weekData.weeklyExpense;
            monthlyTotalPaid += weekData.weeklyPayments.reduce((sum, entry) => {
                return sum + entry.amount;
            }, 0);
        }
    }

    weeklyTotalPaidSpan.textContent = weeklyTotalPaid.toFixed(2);
    weeklyExpenseDisplaySpan.textContent = currentWeekData.weeklyExpense.toFixed(2);
    monthlyTotalPaidSpan.textContent = monthlyTotalPaid.toFixed(2);
    monthlyExpenseDisplaySpan.textContent = monthlyExpense.toFixed(2);
}

/**
 * Displays a simple alert message.
 * @param {string} message - The message to display.
 */
function showAlert(message) {
    alert(message); // Can be replaced with a custom UI notification
}

// --- Event Handlers ---

/**
 * Handles saving the manually entered In-Charge name.
 */
function handleSaveInCharge() {
    const inChargeName = weeklyInChargeNameInput.value.trim();
    if (inChargeName) {
        appData.weeks[`week${appData.currentWeek}`].inCharge = inChargeName;
        saveData();
        updateUI();
    } else {
        showAlert("Please enter a name for the In-Charge.");
    }
}

/**
 * Handles adding a manual payment entry.
 */
function handleAddPaymentEntry() {
    const payerName = payerNameInput.value.trim();
    const amount = parseFloat(paidAmountInput.value);

    if (!payerName) {
        showAlert("Please enter the payer's name.");
        return;
    }
    if (isNaN(amount) || amount <= 0) {
        showAlert("Please enter a valid positive amount for the payment.");
        return;
    }

    const currentWeekData = appData.weeks[`week${appData.currentWeek}`];
    currentWeekData.weeklyPayments.push({ name: payerName, amount: amount });

    payerNameInput.value = ''; // Clear input fields
    paidAmountInput.value = '';
    saveData();
    updateUI();
}

/**
 * Handles removing a payment entry from the list.
 * @param {Event} event - The click event.
 */
function handleRemovePaymentEntry(event) {
    const button = event.target.closest('.remove-entry-btn');
    if (!button) return;

    const entryIndex = parseInt(button.dataset.index);
    const currentWeekData = appData.weeks[`week${appData.currentWeek}`];

    if (currentWeekData && currentWeekData.weeklyPayments && entryIndex >= 0 && entryIndex < currentWeekData.weeklyPayments.length) {
        const removedEntry = currentWeekData.weeklyPayments[entryIndex];
        if (confirm(`Are you sure you want to remove the payment entry for ${removedEntry.name} (₹${removedEntry.amount.toFixed(2)})?`)) {
            currentWeekData.weeklyPayments.splice(entryIndex, 1);
            saveData();
            updateUI();
        }
    }
}

/**
 * Handles saving the weekly total expense.
 */
function handleSaveWeeklyExpense() {
    const expense = parseFloat(weeklyTotalExpenseInput.value);
    if (!isNaN(expense) && expense >= 0) {
        appData.weeks[`week${appData.currentWeek}`].weeklyExpense = expense;
        saveData();
        updateUI();
    } else {
        showAlert("Please enter a valid positive number for weekly expense.");
    }
}

/**
 * Handles the "Finalize Week Entries" button click.
 * This marks the current week as finalized, preventing further edits.
 */
function handleFinalizeWeek() {
    if (confirm("Are you sure you want to FINALIZE entries for this week? No more changes can be made once finalized.")) {
        appData.weeks[`week${appData.currentWeek}`].finalized = true;
        saveData();
        updateUI();
        showAlert("Week entries finalized successfully!");
    }
}

/**
 * Handles the "Next Week" button click.
 */
function handleNextWeek() {
    appData.currentWeek++;
    // If we cross a month boundary (based on 4 weeks/month concept)
    if ((appData.currentWeek - 1) % WEEKS_IN_MONTH === 0 && appData.currentWeek > 1) {
        appData.currentMonth++;
    }
    // Ensure the next week's data structure exists
    initializeWeek(appData.currentWeek);
    saveData();
    updateUI();
}

/**
 * Handles the "Previous Week" button click.
 */
function handlePrevWeek() {
    if (appData.currentWeek > 1) {
        appData.currentWeek--;
        // If we go back past a month boundary
        // This logic correctly decrements month only when crossing a "full" month backwards
        if (appData.currentWeek % WEEKS_IN_MONTH === 0 || (appData.currentWeek === (appData.currentMonth - 1) * WEEKS_IN_MONTH)) {
             if (appData.currentMonth > 1) { // Ensure month doesn't go below 1
                appData.currentMonth--;
            }
        }
        // Ensure the previous week's data structure exists (if it was skipped or corrupted)
        initializeWeek(appData.currentWeek);
        saveData();
        updateUI();
    } else {
        showAlert("You are already at Week 1.");
    }
}

/**
 * Handles adding a bazaar item.
 */
function handleAddBazaarItem() {
    const item = bazaarItemInput.value.trim();
    if (item) {
        const currentWeekData = appData.weeks[`week${appData.currentWeek}`];
        if (!currentWeekData.bazaarItems) {
            currentWeekData.bazaarItems = []; // Ensure array exists
        }
        currentWeekData.bazaarItems.push(item);
        bazaarItemInput.value = ''; // Clear input
        saveData();
        updateUI(); // Re-render bazaar items list
    } else {
        showAlert("Please enter an item to add.");
    }
}

/**
 * Handles removing a bazaar item.
 * @param {Event} event - The click event.
 */
function handleRemoveBazaarItem(event) {
    const button = event.target.closest('.remove-item-btn');
    if (!button) return;

    const itemIndex = parseInt(button.dataset.index);
    const currentWeekData = appData.weeks[`week${appData.currentWeek}`];
    if (currentWeekData && currentWeekData.bazaarItems && itemIndex >= 0 && itemIndex < currentWeekData.bazaarItems.length) {
        if (confirm(`Are you sure you want to remove "${currentWeekData.bazaarItems[itemIndex]}"?`)) {
            currentWeekData.bazaarItems.splice(itemIndex, 1);
            saveData();
            updateUI(); // Re-render bazaar items list
        }
    }
}

/**
 * Handles resetting ALL data for the tracker.
 */
function handleResetAllData() {
    if (confirm("WARNING: Are you sure you want to reset ALL tracker data? This will clear all weeks' data and reset to Week 1, Month 1. This action cannot be undone.")) {
        localStorage.removeItem('pgExpenseTrackerData'); // Clear from localStorage
        initializeNewData(); // Reinitialize appData from scratch
        showAlert("All tracker data has been completely reset!");
    }
}

/**
 * Handles downloading the current week's data as a printable report.
 */
function handleDownloadReport() {
    const currentWeekData = appData.weeks[`week${appData.currentWeek}`];
    const currentWeekNum = appData.currentWeek;
    const currentMonthNum = appData.currentMonth;

    let reportContent = `
        <div class="report-header">
            <h1>PG Expense Report</h1>
            <p><strong>Week:</strong> ${currentWeekNum}, <strong>Month:</strong> ${currentMonthNum}</p>
            <p><strong>In-Charge:</strong> ${currentWeekData.inCharge || 'Not Set'}</p>
        </div>

        <div class="report-section">
            <h2>Weekly Payment Entries:</h2>
            <ul>
    `;

    if (currentWeekData.weeklyPayments && currentWeekData.weeklyPayments.length > 0) {
        currentWeekData.weeklyPayments.forEach(entry => {
            reportContent += `<li>${entry.name}: ₹${entry.amount.toFixed(2)}</li>`;
        });
    } else {
        reportContent += `<li>No payment entries recorded for this week.</li>`;
    }

    reportContent += `
            </ul>
        </div>

        <div class="report-section">
            <h2>Weekly Bazaar Items:</h2>
            <ul>
    `;

    if (currentWeekData.bazaarItems && currentWeekData.bazaarItems.length > 0) {
        currentWeekData.bazaarItems.forEach(item => {
            reportContent += `<li>${item}</li>`;
        });
    } else {
        reportContent += `<li>No items recorded for this week.</li>`;
    }

    reportContent += `
            </ul>
        </div>

        <div class="report-section summary-section-print">
            <h2>Summary:</h2>
            <p><strong>Weekly Total Paid:</strong> ${weeklyTotalPaidSpan.textContent}</p>
            <p><strong>Weekly Expense:</strong> ${weeklyExpenseDisplaySpan.textContent}</p>
            <p><strong>Monthly Total Paid:</strong> ${monthlyTotalPaidSpan.textContent}</p>
            <p><strong>Monthly Expense:</strong> ${monthlyExpenseDisplaySpan.textContent}</p>
            <p><strong>Status:</strong> ${currentWeekData.finalized ? 'Finalized' : 'In Progress'}</p>
        </div>
    `;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>PG Expense Report - Week ${currentWeekNum}</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
                .report-header { text-align: center; margin-bottom: 30px; }
                h1 { font-size: 24px; color: #2c3e50; margin-bottom: 10px; }
                h2 { font-size: 18px; color: #3498db; margin-top: 25px; margin-bottom: 10px; border-bottom: 1px solid #eee; padding-bottom: 5px;}
                p { margin-bottom: 5px; }
                ul { list-style-type: disc; padding-left: 25px; margin-bottom: 20px; }
                li { margin-bottom: 5px; }
                .summary-section-print p { font-weight: bold; }

                @media print {
                    body { -webkit-print-color-adjust: exact; } /* For backgrounds/colors to print */
                }
            </style>
        </head>
        <body>
            ${reportContent}
            <script>
                window.onload = function() {
                    window.print();
                };
            </script>
        </body>
        </html>
    `);
    printWindow.document.close();
}


// --- Event Listeners ---
document.addEventListener('DOMContentLoaded', loadData);
prevWeekBtn.addEventListener('click', handlePrevWeek);
nextWeekBtn.addEventListener('click', handleNextWeek);
saveInChargeBtn.addEventListener('click', handleSaveInCharge);
addEntryBtn.addEventListener('click', handleAddPaymentEntry);
weeklyEntriesList.addEventListener('click', handleRemovePaymentEntry); // Event delegation
saveWeeklyExpenseBtn.addEventListener('click', handleSaveWeeklyExpense);
finalizeWeekBtn.addEventListener('click', handleFinalizeWeek);
addBazaarItemBtn.addEventListener('click', handleAddBazaarItem);
bazaarItemsList.addEventListener('click', handleRemoveBazaarItem); // Event delegation
resetDataBtn.addEventListener('click', handleResetAllData);
downloadReportBtn.addEventListener('click', handleDownloadReport);