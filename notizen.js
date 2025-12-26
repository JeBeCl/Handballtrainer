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
const addBtn = document.getElementById("add-note");
const noteList = document.getElementById("note-list");
const popup = document.getElementById("note-popup");
const closePopup = document.getElementById("close-popup");
const saveNote = document.getElementById("save-note");

// === Globale Variablen ===
let allNotes = [];

// === Notizen laden ===
async function loadNotes() {
  const q = query(collection(db, "notes"), where("team", "==", team));
  const snapshot = await getDocs(q);
  allNotes = snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
  }));
  renderNotes();
}

// === Notizen rendern ===
function renderNotes() {
  noteList.innerHTML = "";

  if (allNotes.length === 0) {
    noteList.innerHTML = `<p class="text-gray-400 text-center col-span-full">Keine Notizen vorhanden.</p>`;
    return;
  }

  allNotes.forEach((note) => {
    const card = document.createElement("div");
    card.className =
      "bg-gray-800 p-4 rounded-xl shadow-md hover:bg-gray-700 transition relative cursor-pointer";
    card.addEventListener("click", () => openNoteDetail(note));

    const title = document.createElement("h3");
    title.className = "text-lg font-bold mb-2";
    title.textContent = note.title;
    card.appendChild(title);

    const type = document.createElement("p");
    type.className = "text-sm text-gray-400";
    type.textContent = note.type === "checklist" ? "Checkliste" : "Textnotiz";
    card.appendChild(type);

    noteList.appendChild(card);
  });
}

// === Neue Notiz Popup öffnen ===
addBtn.addEventListener("click", () => {
  popup.classList.remove("hidden");
  popup.classList.add("flex");
});

closePopup.addEventListener("click", () => {
  popup.classList.add("hidden");
  popup.classList.remove("flex");
});

// === Neue Notiz speichern ===
saveNote.addEventListener("click", async () => {
  const title = document.getElementById("note-title").value;
  const type = document.getElementById("note-type").value;

  if (!title) {
    alert("Bitte einen Titel eingeben!");
    return;
  }

  const data = {
    title,
    type,
    items: [],
    checked: [],
    text: "",
    team,
    createdAt: new Date().toISOString(),
  };

  // Neue Notiz in Firestore speichern
  const docRef = await addDoc(collection(db, "notes"), data);

  // Popup schließen und Feld leeren
  popup.classList.add("hidden");
  popup.classList.remove("flex");
  document.getElementById("note-title").value = "";

  // Liste neu laden, um sie direkt aktuell zu haben
  await loadNotes();

  // 💥 Direkt die neue Notiz öffnen
  const newNote = {
    id: docRef.id,
    ...data
  };
  openNoteDetail(newNote);
});


// === Detailansicht öffnen ===
function openNoteDetail(note) {
  const detailPopup = document.createElement("div");
  detailPopup.className =
    "fixed inset-0 bg-black/60 flex items-center justify-center z-50";

  detailPopup.innerHTML = `
    <div class="bg-gray-800 p-6 rounded-xl shadow-xl w-[500px] max-w-[90%] max-h-[90vh] overflow-y-auto">
      <h2 class="text-2xl font-bold mb-3">${note.title}</h2>
      <div id="note-content" class="mb-4"></div>
      <div class="flex justify-between items-center mt-4">
        <button id="delete-note" class="bg-red-600 px-3 py-2 rounded font-bold text-white hover:bg-red-700">Löschen</button>
        <button id="close-detail" class="bg-gray-600 px-4 py-2 rounded font-bold">Schließen</button>
      </div>
    </div>
  `;

  document.body.appendChild(detailPopup);
  const content = detailPopup.querySelector("#note-content");

  // === Checkliste ===
if (note.type === "checklist") {
  const renderChecklist = () => {
    content.innerHTML = ""; // Liste neu aufbauen

    note.items.forEach((item, i) => {
      const div = document.createElement("div");
      div.className = "flex items-center gap-2 mb-2";

      const chk = document.createElement("input");
      chk.type = "checkbox";
      chk.checked = note.checked[i] || false;
      chk.addEventListener("change", async () => {
        note.checked[i] = chk.checked;
        await updateDoc(doc(db, "notes", note.id), {
          checked: note.checked,
        });
      });

      const lbl = document.createElement("input");
      lbl.type = "text";
      lbl.value = item;
      lbl.placeholder = "Neuer Punkt hinzufügen...";
      lbl.className = "flex-1 text-black rounded p-1";
      lbl.addEventListener("input", async () => {
        note.items[i] = lbl.value;
        await updateDoc(doc(db, "notes", note.id), {
          items: note.items,
        });
      });

      // 🗑️ Lösch-Button
      const delBtn = document.createElement("button");
      delBtn.textContent = "🗑️";
      delBtn.className = "text-red-400 hover:text-red-600 font-bold";
      delBtn.addEventListener("click", async () => {
        note.items.splice(i, 1);
        note.checked.splice(i, 1);
        await updateDoc(doc(db, "notes", note.id), {
          items: note.items,
          checked: note.checked,
        });
        renderChecklist(); // nur den Inhalt neu aufbauen, Popup bleibt offen
      });

      // ENTER -> neuen Punkt hinzufügen
      lbl.addEventListener("keydown", async (e) => {
        if (e.key === "Enter") {
          note.items.push("");
          note.checked.push(false);
          await updateDoc(doc(db, "notes", note.id), {
            items: note.items,
            checked: note.checked,
          });
          renderChecklist();
          setTimeout(() => {
            const inputs = content.querySelectorAll("input[placeholder='Neuer Punkt hinzufügen...']");
            const lastInput = inputs[inputs.length - 1];
            if (lastInput) lastInput.focus();
          }, 200);
        }
      });

      div.appendChild(chk);
      div.appendChild(lbl);
      div.appendChild(delBtn);
      content.appendChild(div);
    });

    // ➕ Punkt hinzufügen
    const addBtn = document.createElement("button");
    addBtn.textContent = "+ Punkt hinzufügen";
    addBtn.className = "bg-green-500 text-black font-bold px-3 py-1 rounded mt-3";
    addBtn.addEventListener("click", async () => {
      note.items.push("");
      note.checked.push(false);
      await updateDoc(doc(db, "notes", note.id), {
        items: note.items,
        checked: note.checked,
      });
      renderChecklist();
      setTimeout(() => {
        const inputs = content.querySelectorAll("input[placeholder='Neuer Punkt hinzufügen...']");
        const lastInput = inputs[inputs.length - 1];
        if (lastInput) lastInput.focus();
      }, 200);
    });
    content.appendChild(addBtn);
  };

  renderChecklist();


  } else {
    // === Textnotiz ===
    const textArea = document.createElement("textarea");
    textArea.className = "w-full text-black p-3 rounded h-48 resize-none bg-gray-100";
    textArea.value = note.text || "";

    let saveTimeout;
    textArea.addEventListener("input", () => {
      clearTimeout(saveTimeout);
      saveTimeout = setTimeout(async () => {
        await updateDoc(doc(db, "notes", note.id), { text: textArea.value });
      }, 1000);
    });

    content.appendChild(textArea);
  }

  // Schließen
  detailPopup.querySelector("#close-detail").addEventListener("click", () => {
    detailPopup.remove();
  });

  // Löschen
  detailPopup.querySelector("#delete-note").addEventListener("click", async () => {
    await deleteDoc(doc(db, "notes", note.id));
    detailPopup.remove();
    await loadNotes();
  });
}

// === Start ===
loadNotes();