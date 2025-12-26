import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

// === Firebase Setup ===
const firebaseConfig = {
  apiKey: "AIzaSyAiZOs0weENkQVNSrq9DyT7BmFOLiPTMaQ",
  authDomain: "handballtrainer-b4daf.firebaseapp.com",
  projectId: "handballtrainer-b4daf",
  storageBucket: "handballtrainer-b4daf.firebasestorage.app",
  messagingSenderId: "401098326689",
  appId: "1:401098326689:web:0933786351b3ee4e30e6e0"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const team = localStorage.getItem("teamName");

// === HTML Elemente ===
const cal = document.getElementById("calendar");
const monthTitle = document.getElementById("monthTitle");
const prevBtn = document.getElementById("prevMonth");
const nextBtn = document.getElementById("nextMonth");
const popup = document.getElementById("popup");
const popupDate = document.getElementById("popup-date");
const closePopup = document.getElementById("close-popup");
const saveEvent = document.getElementById("save-event");

// === Detail-Popup ===
const detailPopup = document.getElementById("detail-popup");
const detailDate = document.getElementById("detail-date");
const trainerListDiv = document.getElementById("trainer-list");
const closeDetail = document.getElementById("close-detail");
const saveDetail = document.getElementById("save-detail");

// === Bearbeiten-Popup ===
const editPopup = document.getElementById("edit-popup");
const editLocation = document.getElementById("edit-location");
const editTime = document.getElementById("edit-time");
const editTeamField = document.getElementById("edit-team-field");
const editTeam = document.getElementById("edit-team");
const closeEdit = document.getElementById("close-edit");
const saveEdit = document.getElementById("save-edit");
const deleteEventBtn = document.getElementById("delete-event");

// === Datum & Anzeige ===
let current = new Date();
let selectedDate = null;
let currentEventId = null;
let currentEditId = null;
let selectedColor = "#22c55e"; // Standardfarbe
let editSelectedColor = "#22c55e"; // Farbe beim Bearbeiten

const months = [
  "Januar", "Februar", "März", "April", "Mai", "Juni",
  "Juli", "August", "September", "Oktober", "November", "Dezember"
];

// === Trainerliste laden ===
let trainerList = [];

async function loadTrainerList() {
  const q = query(collection(db, "teams"));
  const snapshot = await getDocs(q);
  snapshot.forEach((docSnap) => {
    const data = docSnap.data();
    if (data.name.toLowerCase() === team.toLowerCase()) {
      if (Array.isArray(data.trainers)) trainerList = data.trainers;
    }
  });
  if (trainerList.length === 0) trainerList = ["Trainer A", "Trainer B"];
}

// === Kalender zeichnen ===
async function renderCalendar() {
  cal.innerHTML = "";

  const year = current.getFullYear();
  const month = current.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const offset = firstDay === 0 ? 6 : firstDay - 1;

  monthTitle.textContent = `${months[month]} ${year}`;

  for (let i = 0; i < offset; i++) cal.appendChild(document.createElement("div"));

  const today = new Date();
  for (let day = 1; day <= daysInMonth; day++) {
    const cell = document.createElement("div");
    cell.className = "cursor-pointer relative flex flex-col items-center text-center";
    cell.textContent = day;

    if (day === today.getDate() && month === today.getMonth() && year === today.getFullYear())
      cell.classList.add("ring-4", "ring-green-400");

    cell.addEventListener("click", async () => {
      const clickedDate = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

      // Prüfen, ob bereits Event existiert
      const q = query(collection(db, "events"), where("team", "==", team), where("date", "==", clickedDate));
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        const docSnap = snapshot.docs[0];
        openEditPopup(docSnap.id, docSnap.data());
      } else {
        openPopup(day, month, year);
      }
    });

    cal.appendChild(cell);
  }

  await loadEvents(year, month, offset);
}

// === Popup öffnen ===
function openPopup(day, month, year) {
  selectedDate = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  popupDate.textContent = `Neuer Termin am ${selectedDate}`;
  popup.classList.remove("hidden");
  popup.classList.add("flex");
}

// === Popup schließen ===
closePopup.addEventListener("click", () => popup.classList.add("hidden"));

// === Event speichern ===
saveEvent.addEventListener("click", async () => {
  const type = document.getElementById("event-type").value;
  const location = document.getElementById("event-location").value;
  const time = document.getElementById("event-time").value;
  const teamName = document.getElementById("event-team").value;

  if (!type || !location || !time) {
    alert("Bitte alle Felder ausfüllen!");
    return;
  }

  const q = query(collection(db, "events"), where("team", "==", team), where("date", "==", selectedDate));
  const snapshot = await getDocs(q);
  if (!snapshot.empty) {
    alert("Für dieses Datum existiert bereits ein Termin.");
    return;
  }

  await addDoc(collection(db, "events"), {
    team,
    date: selectedDate,
    type,
    location,
    time,
    teamName: type === "Spiel" ? teamName : "",
    color: selectedColor,
    trainers: trainerList,
    absent: []
  });

  popup.classList.add("hidden");
  renderCalendar();
});

// === Events laden ===
async function loadEvents(year, month, offset) {
  const q = query(collection(db, "events"), where("team", "==", team));
  const snapshot = await getDocs(q);

  snapshot.forEach((docSnap) => {
    const data = docSnap.data();
    const d = new Date(data.date);
    if (d.getMonth() !== month || d.getFullYear() !== year) return;

    const i = offset + d.getDate() - 1;
    const cell = cal.children[i];
    if (!cell) return;

    const wrapper = document.createElement("div");
    wrapper.className = "mt-2 flex flex-col items-center gap-1 relative";

    const label = document.createElement("span");
    label.textContent = data.type;
    label.className = "px-2 py-0.5 text-xs font-semibold rounded-md text-black cursor-pointer";
    label.style.backgroundColor = data.color || "#22c55e";
    label.addEventListener("click", (e) => {
      e.stopPropagation();
      openEditPopup(docSnap.id, data);
    });
    wrapper.appendChild(label);

    if (data.type === "Spiel" && data.teamName) {
      const teamLabel = document.createElement("span");
      teamLabel.textContent = data.teamName;
      teamLabel.className = "text-[10px] text-gray-300 font-medium mt-[2px]";
      wrapper.appendChild(teamLabel);
    }

    const dot = document.createElement("div");
    dot.style.width = "10px";
    dot.style.height = "10px";
    dot.style.borderRadius = "50%";
    dot.style.marginTop = "2px";
    dot.style.cursor = "pointer";
    dot.style.backgroundColor = "#22c55e";

    if (Array.isArray(data.trainers) && Array.isArray(data.absent)) {
      const total = data.trainers.length;
      const missing = data.absent.length;
      const rate = missing / total;
      if (missing === 0) dot.style.backgroundColor = "#22c55e";
      else if (rate < 0.5) dot.style.backgroundColor = "#facc15";
      else dot.style.backgroundColor = "#ef4444";
    }

    dot.addEventListener("click", (e) => {
      e.stopPropagation();
      openDetailPopup(docSnap.id);
    });

    wrapper.appendChild(dot);
    cell.appendChild(wrapper);
  });
}

// === Detail-Popup ===
async function openDetailPopup(eventId) {
  currentEventId = eventId;
  const snap = await getDoc(doc(db, "events", eventId));
  if (!snap.exists()) return alert("Event nicht gefunden.");
  const data = snap.data();

  const formattedDate = new Date(data.date).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });

  detailDate.textContent = `${data.type} am ${formattedDate}`;
  trainerListDiv.innerHTML = "";

  const absent = data.absent || [];
  trainerList.forEach((name, i) => {
    const div = document.createElement("div");
    div.className = "flex items-center gap-2";
    const chk = document.createElement("input");
    chk.type = "checkbox";
    chk.id = `t-${i}`;
    chk.checked = !absent.includes(name);
    const lbl = document.createElement("label");
    lbl.htmlFor = chk.id;
    lbl.textContent = name;
    div.appendChild(chk);
    div.appendChild(lbl);
    trainerListDiv.appendChild(div);
  });

  detailPopup.classList.remove("hidden");
  detailPopup.classList.add("flex");
}

closeDetail.addEventListener("click", () => {
  detailPopup.classList.add("hidden");
  currentEventId = null;
});

saveDetail.addEventListener("click", async () => {
  if (!currentEventId) return;
  const absent = [];
  trainerListDiv.querySelectorAll("input").forEach((chk, i) => {
    if (!chk.checked) absent.push(trainerList[i]);
  });
  await updateDoc(doc(db, "events", currentEventId), { absent });
  detailPopup.classList.add("hidden");
  currentEventId = null;
  renderCalendar();
});

// === Bearbeiten-Popup ===
function openEditPopup(eventId, data) {
  currentEditId = eventId;
  editLocation.value = data.location || "";
  editTime.value = data.time || "";
  editSelectedColor = data.color || "#22c55e";

  if (data.type === "Spiel") {
    editTeamField.classList.remove("hidden");
    editTeam.value = data.teamName || "";
  } else editTeamField.classList.add("hidden");

  // Farbauswahl aktualisieren
  document.querySelectorAll(".edit-color-choice").forEach((el) => {
    el.classList.remove("ring-2", "ring-white");
    if (el.dataset.color === editSelectedColor) el.classList.add("ring-2", "ring-white");
  });

  editPopup.classList.remove("hidden");
  editPopup.classList.add("flex");
}

closeEdit.addEventListener("click", () => {
  editPopup.classList.add("hidden");
  currentEditId = null;
});

saveEdit.addEventListener("click", async () => {
  if (!currentEditId) return;
  await updateDoc(doc(db, "events", currentEditId), {
    location: editLocation.value,
    time: editTime.value,
    teamName: editTeam.value,
    color: editSelectedColor
  });
  editPopup.classList.add("hidden");
  currentEditId = null;
  renderCalendar();
});

deleteEventBtn.addEventListener("click", async () => {
  if (!currentEditId) return;
  await deleteDoc(doc(db, "events", currentEditId));
  editPopup.classList.add("hidden");
  currentEditId = null;
  renderCalendar();
});

// === Farbauswahl: Erstellen & Bearbeiten ===
document.querySelectorAll(".color-choice").forEach((el) => {
  el.addEventListener("click", () => {
    document.querySelectorAll(".color-choice").forEach((c) => c.classList.remove("ring-2", "ring-white"));
    el.classList.add("ring-2", "ring-white");
    selectedColor = el.dataset.color;
  });
});

document.querySelectorAll(".edit-color-choice").forEach((el) => {
  el.addEventListener("click", () => {
    document.querySelectorAll(".edit-color-choice").forEach((c) => c.classList.remove("ring-2", "ring-white"));
    el.classList.add("ring-2", "ring-white");
    editSelectedColor = el.dataset.color;
  });
});

// === Monatswechsel ===
prevBtn.addEventListener("click", () => {
  current.setMonth(current.getMonth() - 1);
  renderCalendar();
});
nextBtn.addEventListener("click", () => {
  current.setMonth(current.getMonth() + 1);
  renderCalendar();
});

// === Start ===
(async () => {
  await loadTrainerList();
  renderCalendar();
})();
