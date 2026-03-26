const API = "httpshttps://receipt-pwa.onrender.com://your-backend.onrender.com";
const API_KEY = "mysecret123";

async function loadTransactions() {
  const res = await fetch(`${API}/transactions`, {
    headers: { "x-api-key": API_KEY }
  });

  const data = await res.json();
  const list = document.getElementById("list");
  list.innerHTML = "";

  data.forEach(t => {
    const li = document.createElement("li");

    li.innerHTML = `
      $${t.amount} - ${t.category}
      <button onclick="editTransaction(${t.id}, ${t.amount}, '${t.category}')">Edit</button>
      <button onclick="deleteTransaction(${t.id})">Delete</button>
    `;

    list.appendChild(li);
  });
}

async function addTransaction() {
  const amount = document.getElementById("amount").value;
  const category = document.getElementById("category").value;

  await fetch(`${API}/transactions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": API_KEY
    },
    body: JSON.stringify({
      amount,
      category,
      date: new Date().toISOString()
    })
  });

  loadTransactions();
}

async function deleteTransaction(id) {
  await fetch(`${API}/transactions/${id}`, {
    method: "DELETE",
    headers: { "x-api-key": API_KEY }
  });

  loadTransactions();
}

async function editTransaction(id, amount, category) {
  const newAmount = prompt("New amount", amount);
  const newCategory = prompt("New category", category);

  await fetch(`${API}/transactions/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": API_KEY
    },
    body: JSON.stringify({
      amount: newAmount,
      category: newCategory,
      date: new Date().toISOString()
    })
  });

  loadTransactions();
}

loadTransactions();