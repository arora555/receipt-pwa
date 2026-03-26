const API = "https://receipt-pwa.onrender.com";
const API_KEY = "mysecret123";

const list = document.getElementById("list");

async function loadTransactions() {
  const res = await fetch(`${API}/transactions`, { headers: { "x-api-key": API_KEY } });
  const data = await res.json();

  let accumulative = 0;
  list.innerHTML = "";

  data.forEach(t => {
    accumulative += parseFloat(t.amount);
    const li = document.createElement("li");
    li.innerHTML = `
      ${t.date} - $${t.amount.toFixed(2)} (Accum: $${accumulative.toFixed(2)})
      <button onclick="editTransaction(${t.id}, ${t.amount})">Edit</button>
      <button onclick="deleteTransaction(${t.id})">Delete</button>
    `;
    list.appendChild(li);
  });
}

async function deleteTransaction(id) {
  await fetch(`${API}/transactions/${id}`, { method: "DELETE", headers: { "x-api-key": API_KEY } });
  loadTransactions();
}

async function editTransaction(id, amount) {
  const newAmount = prompt("New amount", amount);
  if (!newAmount) return;

  await fetch(`${API}/transactions/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", "x-api-key": API_KEY },
    body: JSON.stringify({ amount: parseFloat(newAmount) })
  });

  loadTransactions();
}

loadTransactions();