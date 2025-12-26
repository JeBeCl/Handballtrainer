import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc
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

// === HTML Elemente ===
const list = document.getElementById("exercise-list");
const addBtn = document.getElementById("add-exercise");

// Popups
const popup = document.getElementById("exercise-popup");
const closePopup = document.getElementById("close-popup");
const saveBtn = document.getElementById("save-exercise");

const detailPopup = document.getElementById("detail-popup");
const closeDetail = document.getElementById("close-detail");
const editFromDetail = document.getElementById("edit-from-detail");

const editPopup = document.getElementById("edit-popup");
const closeEdit = document.getElementById("close-edit");
const saveEdit = document.getElementById("save-edit");
const deleteBtn = document.getElementById("delete-exercise");

// Filter
const filterCategory = document.getElementById("filter-category");
const filterIntensity = document.getElementById("filter-intensity");

// === Globale Variablen ===
let allExercises = [];
let currentEditId = null;
let currentDetailExercise = null;

// === Übungen laden ===
async function loadExercises() {
  const snapshot = await getDocs(collection(db, "exercises"));
  allExercises = snapshot.docs.map(docSnap => ({
    id: docSnap.id,
    ...docSnap.data()
  }));
  applyFilters();
}

// === Übungen rendern ===
function renderExercises(exercises) {
  list.innerHTML = "";
  if (exercises.length === 0) {
    list.innerHTML = `<p class="text-gray-400 text-center col-span-full">Keine passenden Übungen gefunden.</p>`;
    return;
  }

  exercises.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  exercises.forEach(ex => {
    const card = document.createElement("div");
    card.className =
      "bg-gray-800 p-4 rounded-xl shadow-md hover:bg-gray-700 transition relative cursor-pointer";
    card.addEventListener("click", () => openDetailPopup(ex));

    const title = document.createElement("h3");
    title.className = "text-lg font-bold mb-1";
    title.textContent = ex.title;
    card.appendChild(title);

    const cat = document.createElement("p");
    cat.className = "text-sm text-gray-400 mb-2";
    cat.textContent = `${ex.category} • ${ex.intensity} • ${ex.duration} Min`;
    card.appendChild(cat);

    list.appendChild(card);
  });
}

// === Filter anwenden ===
function applyFilters() {
  const catFilter = filterCategory.value;
  const intFilter = filterIntensity.value;

  let filtered = [...allExercises];
  if (catFilter !== "alle") filtered = filtered.filter(ex => ex.category === catFilter);
  if (intFilter !== "alle") filtered = filtered.filter(ex => ex.intensity === intFilter);

  renderExercises(filtered);
}

filterCategory.addEventListener("change", applyFilters);
filterIntensity.addEventListener("change", applyFilters);

// === Neues Popup öffnen/schließen ===
addBtn.addEventListener("click", () => {
  popup.classList.remove("hidden");
  popup.classList.add("flex");
});

closePopup.addEventListener("click", () => {
  popup.classList.add("hidden");
  popup.classList.remove("flex");
});

// === Übung speichern ===
saveBtn.addEventListener("click", async () => {
  const title = document.getElementById("ex-title").value;
  const desc = document.getElementById("ex-desc").value;
  const category = document.getElementById("ex-category").value;
  const duration = document.getElementById("ex-duration").value;
  const material = document.getElementById("ex-material").value;
  const age = document.getElementById("ex-age").value;
  const intensity = document.getElementById("ex-intensity").value;
  const link = document.getElementById("ex-link").value;

  if (!title || !desc) {
    alert("Bitte Titel und Beschreibung ausfüllen!");
    return;
  }

  const data = {
    title,
    description: desc,
    category,
    duration,
    materials: material,
    age,
    intensity,
    link: link || null,
    createdAt: new Date().toISOString()
  };

  await addDoc(collection(db, "exercises"), data);

  popup.classList.add("hidden");
  popup.classList.remove("flex");
  document.getElementById("ex-title").value = "";
  document.getElementById("ex-desc").value = "";
  await loadExercises();
});

// === Detail anzeigen ===
function openDetailPopup(ex) {
  currentDetailExercise = ex;
  detailPopup.classList.remove("hidden");
  detailPopup.classList.add("flex");

  document.getElementById("detail-title").textContent = ex.title;
  document.getElementById("detail-category").textContent = ex.category;
  document.getElementById("detail-duration").textContent = ex.duration + " Min";
  document.getElementById("detail-intensity").textContent = ex.intensity;
  document.getElementById("detail-desc").textContent = ex.description;
  document.getElementById("detail-material").textContent = ex.materials;
  document.getElementById("detail-age").textContent = ex.age;

  const linkBtn = document.getElementById("detail-link");
  if (ex.link) {
    linkBtn.classList.remove("hidden");
    linkBtn.href = ex.link;
  } else {
    linkBtn.classList.add("hidden");
  }
}

closeDetail.addEventListener("click", () => {
  detailPopup.classList.add("hidden");
  detailPopup.classList.remove("flex");
});

// === Bearbeiten aus Detail ===
editFromDetail.addEventListener("click", () => {
  detailPopup.classList.add("hidden");
  detailPopup.classList.remove("flex");
  openEditPopup(currentDetailExercise);
});

// === Bearbeiten Popup öffnen ===
function openEditPopup(ex) {
  currentEditId = ex.id;
  editPopup.classList.remove("hidden");
  editPopup.classList.add("flex");

  document.getElementById("edit-title").value = ex.title;
  document.getElementById("edit-desc").value = ex.description;
  document.getElementById("edit-category").value = ex.category;
  document.getElementById("edit-duration").value = ex.duration;
  document.getElementById("edit-material").value = ex.materials;
  document.getElementById("edit-age").value = ex.age;
  document.getElementById("edit-intensity").value = ex.intensity;
  document.getElementById("edit-link").value = ex.link || "";
}

closeEdit.addEventListener("click", () => {
  editPopup.classList.add("hidden");
  editPopup.classList.remove("flex");
});

saveEdit.addEventListener("click", async () => {
  if (!currentEditId) return;
  const data = {
    title: document.getElementById("edit-title").value,
    description: document.getElementById("edit-desc").value,
    category: document.getElementById("edit-category").value,
    duration: document.getElementById("edit-duration").value,
    materials: document.getElementById("edit-material").value,
    age: document.getElementById("edit-age").value,
    intensity: document.getElementById("edit-intensity").value,
    link: document.getElementById("edit-link").value
  };

  await updateDoc(doc(db, "exercises", currentEditId), data);
  editPopup.classList.add("hidden");
  editPopup.classList.remove("flex");
  await loadExercises();
});

deleteBtn.addEventListener("click", async () => {
  if (!currentEditId) return;
  await deleteDoc(doc(db, "exercises", currentEditId));
  editPopup.classList.add("hidden");
  editPopup.classList.remove("flex");
  await loadExercises();
});

// === Start ===
loadExercises();