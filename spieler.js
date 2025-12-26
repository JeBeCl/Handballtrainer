import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  where,
  query
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

// === Firebase Setup ===
const firebaseConfig = {
  apiKey: "AIzaSyAiZOs0weENkQVNSrq9DyT7BmFOLiPTMaQ",
  authDomain: "handballtrainer-b4daf.firebaseapp.com",
  projectId: "handballtrainer-b4daf",
  storageBucket: "handballtrainer-b4daf.appspot.com",
  messagingSenderId: "401098326689",
  appId: "1:401098326689:web:0933786351b3ee4e30e6e0"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const team = localStorage.getItem("teamName");

// === HTML Elemente ===
const addBtn = document.getElementById("add-player");
const list = document.getElementById("player-list");
const popup = document.getElementById("player-popup");
const closePopup = document.getElementById("close-popup");
const saveBtn = document.getElementById("save-player");
const popupTitle = document.getElementById("popup-title");

let editId = null;
let allPlayers = [];

// === Spieler laden ===
async function loadPlayers() {
  const q = query(collection(db, "players"), where("team", "==", team));
  const snapshot = await getDocs(q);
  allPlayers = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
  renderPlayers();
}

// === Spieler rendern ===
function renderPlayers() {
  list.innerHTML = "";
  if (allPlayers.length === 0) {
    list.innerHTML = `<p class="text-gray-400 text-center col-span-full">Keine Spieler vorhanden.</p>`;
    return;
  }

  allPlayers.sort((a, b) => (a.number || 0) - (b.number || 0));

  allPlayers.forEach((pl) => {
    const card = document.createElement("div");
    card.className = "bg-gray-800 p-4 rounded-xl shadow-md hover:bg-gray-700 transition relative cursor-pointer";

    const title = document.createElement("h3");
    title.className = "text-lg font-bold mb-1";
    title.textContent = `${pl.number ? pl.number + " – " : ""}${pl.name}`;
    card.appendChild(title);

    const pos = document.createElement("p");
    pos.className = "text-sm text-gray-400 mb-2";
    pos.textContent = pl.position || "-";
    card.appendChild(pos);

    const info = document.createElement("p");
    info.className = "text-xs text-gray-400";
    const birthText = pl.birth ? formatDateGerman(pl.birth) : "kein Geburtsdatum";
    info.textContent = `${birthText}`;
    card.appendChild(info);

    // === Klick öffnet Detail-Ansicht ===
    card.addEventListener("click", (e) => {
      // verhindert dass Klicks auf Buttons das Popup auch öffnen
      if (e.target.tagName === "BUTTON") return;
      openDetailPopup(pl);
    });

    // === Buttons ===
    const btns = document.createElement("div");
    btns.className = "flex gap-2 mt-3";

    const edit = document.createElement("button");
    edit.textContent = "Bearbeiten";
    edit.className = "bg-yellow-500 hover:bg-yellow-400 text-black font-semibold px-3 py-1 rounded text-sm";
    edit.addEventListener("click", () => openEditPopup(pl));

    const del = document.createElement("button");
    del.textContent = "Löschen";
    del.className = "bg-red-600 hover:bg-red-500 text-white font-semibold px-3 py-1 rounded text-sm";
    del.addEventListener("click", () => deletePlayer(pl.id));

    btns.appendChild(edit);
    btns.appendChild(del);
    card.appendChild(btns);

    list.appendChild(card);
  });
}

// === Popup öffnen ===
addBtn.addEventListener("click", () => openNewPopup());
closePopup.addEventListener("click", () => closePopupFunc());

function openNewPopup() {
  popupTitle.textContent = "Neuer Spieler";
  editId = null;
  popup.classList.remove("hidden");
  popup.classList.add("flex");
  clearInputs();
}

function openEditPopup(pl) {
  popupTitle.textContent = "Spieler bearbeiten";
  editId = pl.id;
  popup.classList.remove("hidden");
  popup.classList.add("flex");

  document.getElementById("pl-name").value = pl.name || "";
  document.getElementById("pl-number").value = pl.number || "";
  document.getElementById("pl-position").value = pl.position || "";
  document.getElementById("pl-birth").value = pl.birth ? formatDateGerman(pl.birth) : "";
  document.getElementById("pl-pass").value = pl.passNumber || "";
  document.getElementById("pl-phone").value = pl.phone || "";
  document.getElementById("pl-notes").value = pl.notes || "";
}

function closePopupFunc() {
  popup.classList.add("hidden");
  popup.classList.remove("flex");
}

// === Spieler speichern ===
saveBtn.addEventListener("click", async () => {
  const name = document.getElementById("pl-name").value.trim();
  const number = parseInt(document.getElementById("pl-number").value) || null;
  const position = document.getElementById("pl-position").value.trim();
  const birth = parseDateGerman(document.getElementById("pl-birth").value.trim());
  const passNumber = document.getElementById("pl-pass").value.trim();
  const phone = document.getElementById("pl-phone").value.trim();
  const notes = document.getElementById("pl-notes").value.trim();

  if (!name) return alert("Bitte Name eingeben!");

  const data = { name, number, position, birth, passNumber, phone, notes, team, createdAt: new Date().toISOString() };

  if (editId) {
    await updateDoc(doc(db, "players", editId), data);
  } else {
    await addDoc(collection(db, "players"), data);
  }

  closePopupFunc();
  await loadPlayers();
});

// === Spieler löschen ===
async function deletePlayer(id) {
  await deleteDoc(doc(db, "players", id));
  await loadPlayers();
}

// === Detail-Popup ===
function openDetailPopup(pl) {
  const popup = document.createElement("div");
  popup.className = "fixed inset-0 bg-black/70 flex items-center justify-center z-50";

  popup.innerHTML = `
    <div class="bg-gray-800 p-6 rounded-xl shadow-xl w-[400px] max-w-[90%] max-h-[90vh] overflow-y-auto">
      <h2 class="text-2xl font-bold mb-3">${pl.number ? pl.number + " – " : ""}${pl.name}</h2>
      <p class="text-gray-300 mb-1"><b>Position:</b> ${pl.position || "-"}</p>
      <p class="text-gray-300 mb-1"><b>Geburtsdatum:</b> ${pl.birth ? formatDateGerman(pl.birth) : "-"}</p>
      <p class="text-gray-300 mb-1"><b>Passnummer:</b> ${pl.passNumber || "-"}</p>
      <p class="text-gray-300 mb-1"><b>Telefon:</b> ${pl.phone || "-"}</p>
      <p class="text-gray-300 mb-4"><b>Notizen:</b> ${pl.notes || "Keine Notizen"}</p>

      <div class="flex justify-end mt-4">
        <button id="close-detail" class="bg-gray-600 px-4 py-2 rounded font-bold">Schließen</button>
      </div>
    </div>
  `;

  document.body.appendChild(popup);
  popup.querySelector("#close-detail").addEventListener("click", () => popup.remove());
}

// === Helper-Funktionen ===
function clearInputs() {
  ["pl-name", "pl-number", "pl-position", "pl-birth", "pl-pass", "pl-phone", "pl-notes"].forEach(
    (id) => (document.getElementById(id).value = "")
  );
}

function formatDateGerman(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}`;
}

function parseDateGerman(str) {
  if (!str.match(/^\d{2}\.\d{2}\.\d{4}$/)) return "";
  const [day, month, year] = str.split(".");
  return `${year}-${month}-${day}`;
}

// === Start ===
loadPlayers();