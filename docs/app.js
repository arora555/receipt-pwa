const API = "http://192.168.1.48:3000"; // replace with your local backend IP
const API_KEY = "mysecret123";

const captureBtn = document.getElementById("captureBtn");
const viewBtn = document.getElementById("viewBtn");
const mainMenu = document.getElementById("mainMenu");
const cameraSection = document.getElementById("cameraSection");
const video = document.getElementById("video");
const transactionsSection = document.getElementById("transactionsSection");
const backToMenuBtn = document.getElementById("backToMenuBtn");
const list = document.getElementById("list");

let accumulative = 0;
let stream = null;

// --- Capture Receipt ---
captureBtn.addEventListener("click", async () => {
  mainMenu.classList.add("hidden");
  cameraSection.classList.remove("hidden");

  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: "environment" } },
      audio: false
    });
    video.srcObject = stream;
    video.setAttribute("playsinline", true);
    await video.play();

    // Take snapshot automatically after 1 sec for simplicity (or you can add a tap listener)
    setTimeout(takeSnapshot, 1000);

  } catch (err) {
    console.error(err);
    alert("Cannot access camera. Make sure you allowed permissions.");
    mainMenu.classList.remove("hidden");
    cameraSection.classList.add("hidden");
  }
});

// --- Take Snapshot & OCR ---
async function takeSnapshot() {
  const canvas = document.createElement("canvas");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  const blob = await new Promise(res => canvas.toBlob(res));

  const { data: { text } } = await Tesseract.recognize(blob, 'eng');

  let dateMatch = text.match(/\d{4}-\d{2}-\d{2}/);
  let totalMatch = text.match(/Total\s*\$?(\d+(\.\d{1,2})?)/i);

  if (!dateMatch || !totalMatch) {
    alert("Could not detect date or total. Retake the receipt properly.");
    stopCamera();
    mainMenu.classList.remove("hidden");
    cameraSection.classList.add("hidden");
    return;
  }

  const date = dateMatch[0];
  const total = parseFloat(totalMatch[1]);
  accumulative += total;

  // Save to backend
  await fetch(`${API}/transactions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": API_KEY },
    body: JSON.stringify({ amount: total, category: "Receipt", date, accumulative })
  });

  alert(`Transaction saved!\nDate: ${date}\nTotal: $${total.toFixed(2)}`);

  stopCamera();
  mainMenu.classList.remove("hidden");
  cameraSection.classList.add("hidden");
}

function stopCamera() {
  if (stream) {
    stream.getTracks().forEach(track => track.stop());
    stream = null;
  }
}

// --- View Transactions ---
viewBtn.addEventListener("click", async () => {
  mainMenu.classList.add("hidden");
  transactionsSection.classList.remove("hidden");
  loadTransactions();
});

// --- Back to Main Menu ---
backToMenuBtn.addEventListener("click", () => {
  transactionsSection.classList.add("hidden");
  mainMenu.classList.remove("hidden");
});

// --- Load Transactions ---
async function loadTransactions() {
  const res = await fetch(`${API}/transactions`, { headers: { "x-api-key": API_KEY } });
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
}

// --- Edit/Delete ---
window.deleteTransaction = async function(id) {
  await fetch(`${API}/transactions/${id}`, { method: "DELETE", headers: { "x-api-key": API_KEY } });
  loadTransactions();
}

window.editTransaction = async function(id, amount) {
  const newAmount = prompt("New amount", amount);
  if (!newAmount) return;
  await fetch(`${API}/transactions/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", "x-api-key": API_KEY },
    body: JSON.stringify({ amount: parseFloat(newAmount) })
  });
  loadTransactions();
}