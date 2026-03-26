// =======================
// Frontend JS for Receipt Tracker PWA
// =======================

// Backend API hosted on Render
const API = "https://receipt-pwa.onrender.com";  // Replace with your Render backend URL
const API_KEY = "mysecret123";                  // Matches the key set in Render env

// DOM Elements
const captureBtn = document.getElementById("captureBtn");
const cameraInput = document.getElementById("cameraInput");
const viewBtn = document.getElementById("viewBtn");
const mainMenu = document.getElementById("mainMenu");
const transactionsSection = document.getElementById("transactionsSection");
const backToMenuBtn = document.getElementById("backToMenuBtn");
const list = document.getElementById("list");

let accumulative = 0;

// -----------------------
// 1. Capture Receipt
// -----------------------
captureBtn.addEventListener("click", () => {
  // Open native camera directly on iPhone
  cameraInput.click();
});

cameraInput.addEventListener("change", async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  try {
    // OCR with Tesseract.js
    const { data: { text } } = await Tesseract.recognize(file, 'eng');

    // Extract date and total
    const dateMatch = text.match(/\d{4}-\d{2}-\d{2}/);
    const totalMatch = text.match(/Total\s*\$?(\d+(\.\d{1,2})?)/i);

    if (!dateMatch || !totalMatch) {
      alert("Could not detect date or total. Please retake the picture properly.");
      cameraInput.value = "";
      return;
    }

    const date = dateMatch[0];
    const total = parseFloat(totalMatch[1]);
    accumulative += total;

    // Save to backend
    await fetch(`${API}/transactions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": API_KEY
      },
      body: JSON.stringify({
        amount: total,
        category: "Receipt",
        date,
        accumulative
      })
    });

    // Download the image to Photos
    const url = URL.createObjectURL(file);
    const a = document.createElement("a");
    a.href = url;
    a.download = `receipt_${date}.png`;
    a.click();
    URL.revokeObjectURL(url);

    alert(`Transaction saved!\nDate: ${date}\nTotal: $${total.toFixed(2)}`);
  } catch (err) {
    console.error(err);
    alert("Error processing the receipt. Please try again.");
  } finally {
    cameraInput.value = ""; // reset input for next capture
  }
});

// -----------------------
// 2. View Transactions
// -----------------------
viewBtn.addEventListener("click", async () => {
  mainMenu.classList.add("hidden");
  transactionsSection.classList.remove("hidden");
  loadTransactions();
});

// Back button to main menu
backToMenuBtn.addEventListener("click", () => {
  transactionsSection.classList.add("hidden");
  mainMenu.classList.remove("hidden");
});

// -----------------------
// 3. Load Transactions
// -----------------------
async function loadTransactions() {
  try {
    const res = await fetch(`${API}/transactions`, {
      headers: { "x-api-key": API_KEY }
    });
    const data = await res.json();

    let accum = 0;
    list.innerHTML = "";
    data.forEach(t => {
      accum += parseFloat(t.amount);
      const li = document.createElement("li");
      li.innerHTML = `
        ${t.date} - $${t.amount.toFixed(2)} (Accum: $${accum.toFixed(2)})
        <button onclick="editTransaction(${t.id}, ${t.amount})">Edit</button>
        <button onclick="deleteTransaction(${t.id})">Delete</button>
      `;
      list.appendChild(li);
    });
  } catch (err) {
    console.error(err);
    alert("Could not load transactions.");
  }
}

// -----------------------
// 4. Edit / Delete Transactions
// -----------------------
window.deleteTransaction = async function(id) {
  try {
    await fetch(`${API}/transactions/${id}`, {
      method: "DELETE",
      headers: { "x-api-key": API_KEY }
    });
    loadTransactions();
  } catch (err) {
    console.error(err);
    alert("Failed to delete transaction.");
  }
}

window.editTransaction = async function(id, amount) {
  const newAmount = prompt("New amount", amount);
  if (!newAmount) return;

  try {
    await fetch(`${API}/transactions/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", "x-api-key": API_KEY },
      body: JSON.stringify({ amount: parseFloat(newAmount) })
    });
    loadTransactions();
  } catch (err) {
    console.error(err);
    alert("Failed to update transaction.");
  }
}