import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  getDoc,
  query,
  where,
  doc,
  updateDoc,
  deleteDoc
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
const planList = document.getElementById("plan-list");
const addBtn = document.getElementById("add-plan");
const popup = document.getElementById("plan-popup");
const closePopup = document.getElementById("close-popup");
let saveBtn = document.getElementById("save-plan");

// === Globale Variablen ===
let allExercises = [];
let allPlans = [];

// === Übungen laden (global für alle Teams) ===
async function loadExercises() {
  const snapshot = await getDocs(collection(db, "exercises"));
  allExercises = snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
  }));
}

// === Pläne laden (pro Team) ===
async function loadPlans() {
  const q = query(collection(db, "plans"), where("team", "==", team));
  const snapshot = await getDocs(q);
  allPlans = snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
  }));
  renderPlans();
}

// === Rendern der Pläne ===
function renderPlans() {
  planList.innerHTML = "";
  if (allPlans.length === 0) {
    planList.innerHTML = `<p class="text-gray-400 text-center col-span-full">Noch keine Trainingseinheiten geplant.</p>`;
    return;
  }

  allPlans.sort((a, b) => new Date(b.date) - new Date(a.date));

  allPlans.forEach((plan) => {
    const card = document.createElement("div");
    card.className =
      "bg-gray-800 p-4 rounded-xl shadow-md hover:bg-gray-700 transition relative";

    const title = document.createElement("h3");
    title.className = "text-lg font-bold mb-1";
    title.textContent = plan.title;
    card.appendChild(title);

    const info = document.createElement("p");
    info.className = "text-sm text-gray-400 mb-3";
    info.textContent = `${new Date(plan.date).toLocaleDateString("de-DE")} • ${plan.duration} Min`;
    card.appendChild(info);

    const btnContainer = document.createElement("div");
    btnContainer.className = "flex gap-2";

    const openBtn = document.createElement("button");
    openBtn.textContent = "Details";
    openBtn.className =
      "bg-blue-500 hover:bg-blue-400 text-black font-semibold px-3 py-1 rounded text-sm";
    openBtn.addEventListener("click", () => openPlanDetail(plan));

    const editBtn = document.createElement("button");
    editBtn.textContent = "Bearbeiten";
    editBtn.className =
      "bg-yellow-500 hover:bg-yellow-400 text-black font-semibold px-3 py-1 rounded text-sm";
    editBtn.addEventListener("click", () => openEditPlan(plan));

    const delBtn = document.createElement("button");
    delBtn.textContent = "Löschen";
    delBtn.className =
      "bg-red-600 hover:bg-red-500 text-white font-semibold px-3 py-1 rounded text-sm";
    delBtn.addEventListener("click", async () => deletePlan(plan.id));

    btnContainer.appendChild(openBtn);
    btnContainer.appendChild(editBtn);
    btnContainer.appendChild(delBtn);
    card.appendChild(btnContainer);

    planList.appendChild(card);
  });
}

// === Popup öffnen/schließen ===
addBtn.addEventListener("click", () => openNewPlan());
closePopup.addEventListener("click", () => closePlanPopup());

function closePlanPopup() {
  popup.classList.add("hidden");
  popup.classList.remove("flex");
}

// === Plan erstellen ===
async function openNewPlan() {
  popup.classList.remove("hidden");
  popup.classList.add("flex");

  document.getElementById("plan-title").value = "";
  document.getElementById("plan-date").value = "";
  document.getElementById("plan-duration").value = "";
  document.getElementById("plan-notes").value = "";

  const container = document.getElementById("exercise-select");
  container.innerHTML = "";
  await loadExercises();

  allExercises.forEach((ex) => {
    const div = document.createElement("div");
    div.className = "flex items-center gap-2 mb-2";

    const chk = document.createElement("input");
    chk.type = "checkbox";
    chk.value = ex.id;

    const lbl = document.createElement("label");
    lbl.textContent = ex.title;

    div.appendChild(chk);
    div.appendChild(lbl);
    container.appendChild(div);
  });

  const newSaveBtn = saveBtn.cloneNode(true);
  saveBtn.parentNode.replaceChild(newSaveBtn, saveBtn);
  saveBtn = newSaveBtn;

  saveBtn.addEventListener("click", async () => {
    const title = document.getElementById("plan-title").value;
    const date = document.getElementById("plan-date").value;
    const duration = document.getElementById("plan-duration").value;
    const notes = document.getElementById("plan-notes").value;

    const exercises = Array.from(
      document.querySelectorAll("#exercise-select input:checked")
    ).map((e) => ({ id: e.value }));

    if (!title || !date) return alert("Bitte Titel und Datum eingeben!");

    await addDoc(collection(db, "plans"), {
      title,
      date,
      duration,
      notes,
      exercises,
      team,
      createdAt: new Date().toISOString(),
    });

    

    closePlanPopup();
    await loadPlans();
  });
}

// === Plan bearbeiten ===
async function openEditPlan(plan) {
  popup.classList.remove("hidden");
  popup.classList.add("flex");

  document.getElementById("plan-title").value = plan.title;
  document.getElementById("plan-date").value = plan.date;
  document.getElementById("plan-duration").value = plan.duration || "";
  document.getElementById("plan-notes").value = plan.notes || "";

  const container = document.getElementById("exercise-select");
  container.innerHTML = "";
  await loadExercises();

  allExercises.forEach((ex) => {
    const div = document.createElement("div");
    div.className = "flex items-center gap-2 mb-2";

    const chk = document.createElement("input");
    chk.type = "checkbox";
    chk.value = ex.id;
    chk.checked = plan.exercises.some((e) => e.id === ex.id);

    const lbl = document.createElement("label");
    lbl.textContent = ex.title;

    div.appendChild(chk);
    div.appendChild(lbl);
    container.appendChild(div);
  });

  const newSaveBtn = saveBtn.cloneNode(true);
  saveBtn.parentNode.replaceChild(newSaveBtn, saveBtn);
  saveBtn = newSaveBtn;

  saveBtn.addEventListener("click", async () => {
    const title = document.getElementById("plan-title").value;
    const date = document.getElementById("plan-date").value;
    const duration = document.getElementById("plan-duration").value;
    const notes = document.getElementById("plan-notes").value;

    const exercises = Array.from(
      document.querySelectorAll("#exercise-select input:checked")
    ).map((e) => ({ id: e.value }));

    await updateDoc(doc(db, "plans", plan.id), {
      title,
      date,
      duration,
      notes,
      exercises,
    });

    closePlanPopup();
    await loadPlans();
  });
}

// === Plan löschen ===
async function deletePlan(planId) {
  if (!confirm("Willst du diesen Trainingsplan wirklich löschen?")) return;
  await deleteDoc(doc(db, "plans", planId));
  await loadPlans();
}

// === Plan Details ===
function openPlanDetail(plan) {
  const detailPopup = document.createElement("div");
  detailPopup.className =
    "fixed inset-0 bg-black/60 flex items-center justify-center z-50";
  detailPopup.innerHTML = `
    <div class="bg-gray-800 p-6 rounded-xl shadow-xl w-[500px] max-w-[90%] max-h-[90vh] overflow-y-auto">
      <h2 class="text-2xl font-bold mb-2">${plan.title}</h2>
      <p class="text-gray-400 mb-2">${new Date(plan.date).toLocaleDateString("de-DE")} • ${
    plan.duration
  } Min</p>
      <p class="text-sm text-gray-300 mb-4">${plan.notes || "Keine Notizen"}</p>
      <h3 class="text-lg font-semibold mb-2">Übungen:</h3>
      <div id="detail-exercises" class="space-y-3 mb-4"></div>
      <div class="flex justify-between mt-5">
        <button id="pdf-btn" class="bg-blue-500 px-4 py-2 rounded font-bold text-black">📄 PDF Exportieren</button>
        <button id="close-detail" class="bg-gray-600 px-4 py-2 rounded font-bold">Schließen</button>
      </div>
    </div>
  `;
  document.body.appendChild(detailPopup);

  const container = detailPopup.querySelector("#detail-exercises");
  plan.exercises.forEach(async (e) => {
    const snap = await getDoc(doc(db, "exercises", e.id));
    if (snap.exists()) {
      const ex = snap.data();
      const exDiv = document.createElement("div");
      exDiv.className = "bg-gray-700 p-3 rounded cursor-pointer hover:bg-gray-600";
      exDiv.innerHTML = `
        <h4 class="font-bold">${ex.title}</h4>
        <p class="text-sm text-gray-300">${ex.category} • ${ex.intensity} • ${ex.duration} Min</p>`;
      exDiv.addEventListener("click", () => openExerciseDetail(ex));
      container.appendChild(exDiv);
    }
  });

  detailPopup.querySelector("#close-detail").addEventListener("click", () => detailPopup.remove());
  detailPopup.querySelector("#pdf-btn").addEventListener("click", async () => exportPlanToPDF(plan));
}

// === Übungsdetail im Plan öffnen ===
function openExerciseDetail(ex) {
  const exPopup = document.createElement("div");
  exPopup.className = "fixed inset-0 bg-black/70 flex items-center justify-center z-50";
  exPopup.innerHTML = `
    <div class="bg-gray-800 p-6 rounded-xl shadow-xl w-[500px] max-w-[90%] max-h-[90vh] overflow-y-auto">
      <h2 class="text-2xl font-bold mb-2">${ex.title}</h2>
      <p class="text-gray-400 mb-2">${ex.category} • ${ex.intensity} • ${ex.duration} Min</p>
      <p class="text-gray-300 mb-3 whitespace-pre-line">${ex.description}</p>
      <p class="text-sm text-gray-300 mb-1"><b>Material:</b> ${ex.materials || "-"}</p>
      <p class="text-sm text-gray-300 mb-3"><b>Alter:</b> ${ex.age || "-"}</p>
      ${
        ex.link
          ? `<a href="${ex.link}" target="_blank" class="text-blue-400 underline">Zur Quelle</a>`
          : ""
      }
      <div class="flex justify-end mt-4">
        <button class="bg-gray-600 px-4 py-2 rounded font-bold" id="close-ex">Schließen</button>
      </div>
    </div>`;
  document.body.appendChild(exPopup);
  exPopup.querySelector("#close-ex").addEventListener("click", () => exPopup.remove());
}

// === PDF Export ===
async function exportPlanToPDF(plan) {
  try {
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF();

    let y = 20;
    pdf.setFontSize(18);
    pdf.text(plan.title, 20, y);
    y += 10;

    pdf.setFontSize(12);
    pdf.text(`Datum: ${new Date(plan.date).toLocaleDateString("de-DE")}`, 20, y);
    y += 7;
    pdf.text(`Dauer: ${plan.duration || "-"} Minuten`, 20, y);
    y += 7;

    const notesWrapped = pdf.splitTextToSize(`Notizen: ${plan.notes || "Keine"}`, 170);
    pdf.text(notesWrapped, 20, y);
    y += notesWrapped.length * 6 + 4;

    pdf.setFontSize(14);
    pdf.text("Übungen:", 20, y);
    y += 8;

    for (const e of plan.exercises) {
      const snap = await getDoc(doc(db, "exercises", e.id));
      if (!snap.exists()) continue;
      const ex = snap.data();

      // Titel
      pdf.setFontSize(12);
      pdf.text(`• ${ex.title}`, 25, y);
      y += 6;

      // Basisdaten
      pdf.setFontSize(10);
      const lines = [
        `Kategorie: ${ex.category}`,
        `Dauer: ${ex.duration} Min  |  Intensität: ${ex.intensity}`,
        `Materialien: ${ex.materials || "-"}`,
        `Alter: ${ex.age || "-"}`
      ];
      lines.forEach(line => {
        const wrapped = pdf.splitTextToSize(line, 160);
        pdf.text(wrapped, 30, y);
        y += wrapped.length * 5;
      });

      // 🔥 Beschreibung der Übung
      if (ex.description) {
        y += 4;
        pdf.setFontSize(10);
        pdf.setTextColor(80, 80, 80);
        const descLines = pdf.splitTextToSize(`Beschreibung: ${ex.description}`, 160);
        pdf.text(descLines, 30, y);
        pdf.setTextColor(0, 0, 0);
        y += descLines.length * 5 + 2;
      }

      // Link (falls vorhanden)
      if (ex.link) {
        pdf.setTextColor(0, 102, 204);
        pdf.textWithLink("👉 Zur Quelle", 30, y, { url: ex.link });
        pdf.setTextColor(0, 0, 0);
        y += 8;
      }

      // Seitenumbruch
      if (y > 270) {
        pdf.addPage();
        y = 20;
      }
    }

    pdf.save(`${plan.title.replace(/\s+/g, "_")}.pdf`);
  } catch (err) {
    console.error("❌ PDF-Export fehlgeschlagen:", err);
    alert("PDF konnte nicht erstellt werden. (Details in der Konsole)");
  }
}

// === Start ===
(async () => {
  await loadExercises();
  await loadPlans();
})();