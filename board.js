import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import {
  getFirestore, collection, addDoc, getDocs, deleteDoc, doc, query, where
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

// Firebase Setup
const firebaseConfig = {
  apiKey:"AIzaSyAiZOs0weENkQVNSrq9DyT7BmFOLiPTMaQ",
  authDomain:"handballtrainer-b4daf.firebaseapp.com",
  projectId:"handballtrainer-b4daf",
  storageBucket:"handballtrainer-b4daf.appspot.com",
  messagingSenderId:"401098326689",
  appId:"1:401098326689:web:0933786351b3ee4e30e6e0"
};
const app = initializeApp(firebaseConfig);
const db  = getFirestore(app);
const team = localStorage.getItem("teamName");

// Elemente
const wrap=document.getElementById("boardWrap"),
      bgCanvas=document.getElementById("bgCanvas"),
      drawCanvas=document.getElementById("drawCanvas"),
      bgCtx=bgCanvas.getContext("2d"),
      drawCtx=drawCanvas.getContext("2d"),
      addRed=document.getElementById("addRed"),
      addBlue=document.getElementById("addBlue"),
      addGK=document.getElementById("addGK"),
      deleteMode=document.getElementById("deleteMode"),
      drawToggle=document.getElementById("drawToggle"),
      drawColor=document.getElementById("drawColor"),
      undoBtn=document.getElementById("undo"),
      clearBtn=document.getElementById("clearDraw"),
      savePng=document.getElementById("savePng"),
      tacticList=document.getElementById("tacticList");
      drawToggle.addEventListener("change", () => {
  if (drawToggle.checked) drawCanvas.classList.add("drawing");
  else drawCanvas.classList.remove("drawing");
});

// ===== Feldgröße + Markierungen =====
function fitCanvas(){
  const r=wrap.getBoundingClientRect();
  bgCanvas.width=r.width; bgCanvas.height=r.height;
  drawCanvas.width=r.width; drawCanvas.height=r.height;
  drawCourt();
}
window.addEventListener("resize",fitCanvas); fitCanvas();

function drawCourt(){
  const w=bgCanvas.width, h=bgCanvas.height;
  bgCtx.clearRect(0,0,w,h);
  bgCtx.strokeStyle="#fff"; bgCtx.lineWidth=4;

  // Außenlinie
  bgCtx.strokeRect(2,2,w-4,h-4);

  // Mittellinie
  bgCtx.beginPath(); bgCtx.moveTo(w/2,2); bgCtx.lineTo(w/2,h-2); bgCtx.stroke();

  // Tore
  const goalW=Math.max(6,w*0.015), goalH=h*0.2;
  bgCtx.strokeRect(2,h/2-goalH/2,goalW,goalH);
  bgCtx.strokeRect(w-goalW-2,h/2-goalH/2,goalW,goalH);

  // 6m/9m Halbkreise
  const six=w*0.12, nine=w*0.18;
  const L={x:2+goalW,y:h/2}, R={x:w-2-goalW,y:h/2};

  drawArc(L.x,L.y,six,Math.PI/2,-Math.PI/2,true);
  bgCtx.setLineDash([10,8]);
  drawArc(L.x,L.y,nine,Math.PI/2,-Math.PI/2,true);
  bgCtx.setLineDash([]);
  drawArc(R.x,R.y,six,-Math.PI/2,Math.PI/2,true);
  bgCtx.setLineDash([10,8]);
  drawArc(R.x,R.y,nine,-Math.PI/2,Math.PI/2,true);
  bgCtx.setLineDash([]);

  function drawArc(cx,cy,r,a1,a2,ccw){
    bgCtx.beginPath(); bgCtx.arc(cx,cy,r,a1,a2,ccw); bgCtx.stroke();
  }
}

// ===== Spielerchips =====
function addToken(team="red"){
  const d=document.createElement("div");
  d.className=`token ${team}`;
  d.textContent=team==="gk"?"TW":"";
  d.style.left="50%"; d.style.top="50%";
  wrap.appendChild(d);
  enableDrag(d);
  d.addEventListener("click",e=>{if(deleteMode.checked)d.remove();});
}
function enableDrag(el){
  let drag=false,sx,sy;
  el.addEventListener("mousedown",e=>{
    if(drawToggle.checked)return;
    drag=true; sx=e.clientX; sy=e.clientY;
  });
  window.addEventListener("mousemove",e=>{
    if(!drag)return;
    const r=wrap.getBoundingClientRect(),
          dx=(e.clientX-sx)/r.width*100,
          dy=(e.clientY-sy)/r.height*100;
    el.style.left=(parseFloat(el.style.left)+dx)+"%";
    el.style.top=(parseFloat(el.style.top)+dy)+"%";
    sx=e.clientX; sy=e.clientY;
  });
  window.addEventListener("mouseup",()=>drag=false);
}
addRed.onclick = ()=>addToken("red");
addBlue.onclick= ()=>addToken("blue");
addGK.onclick  = ()=>addToken("gk");

// === Zeichnen ===
let strokes = [];
let currentStroke = null;
let isDrawing = false;

drawCanvas.addEventListener("mousedown", (e) => {
  if (!drawToggle.checked) return;
  isDrawing = true;

  const rect = drawCanvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  currentStroke = {
    color: drawColor.value,
    points: [{ x, y }],
  };
});

drawCanvas.addEventListener("mousemove", (e) => {
  if (!isDrawing || !currentStroke) return;

  const rect = drawCanvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  const pts = currentStroke.points;
  const last = pts[pts.length - 1];

  // === Touch Events für Mobile ===
drawCanvas.addEventListener("touchstart", (e) => {
  if (!drawToggle.checked) return;
  isDrawing = true;
  const rect = drawCanvas.getBoundingClientRect();
  const touch = e.touches[0];
  const x = touch.clientX - rect.left;
  const y = touch.clientY - rect.top;
  currentStroke = { color: drawColor.value, points: [{ x, y }] };
});

drawCanvas.addEventListener("touchmove", (e) => {
  if (!isDrawing || !currentStroke) return;
  e.preventDefault();
  const rect = drawCanvas.getBoundingClientRect();
  const touch = e.touches[0];
  const x = touch.clientX - rect.left;
  const y = touch.clientY - rect.top;
  const pts = currentStroke.points;
  const last = pts[pts.length - 1];
  drawCtx.strokeStyle = currentStroke.color;
  drawCtx.lineWidth = 3;
  drawCtx.lineCap = "round";
  drawCtx.beginPath();
  drawCtx.moveTo(last.x, last.y);
  drawCtx.lineTo(x, y);
  drawCtx.stroke();
  pts.push({ x, y });
});

drawCanvas.addEventListener("touchend", () => {
  if (isDrawing && currentStroke) strokes.push(currentStroke);
  currentStroke = null;
  isDrawing = false;
});

  // zeichne nur die neue Linie (nicht alles)
  drawCtx.strokeStyle = currentStroke.color;
  drawCtx.lineWidth = 3;
  drawCtx.lineCap = "round";
  drawCtx.beginPath();
  drawCtx.moveTo(last.x, last.y);
  drawCtx.lineTo(x, y);
  drawCtx.stroke();

  pts.push({ x, y });
});

drawCanvas.addEventListener("mouseup", () => {
  if (isDrawing && currentStroke) {
    strokes.push(currentStroke);
    currentStroke = null;
  }
  isDrawing = false;
});

drawCanvas.addEventListener("mouseleave", () => {
  if (isDrawing && currentStroke) {
    strokes.push(currentStroke);
    currentStroke = null;
  }
  isDrawing = false;
});

function redraw() {
  drawCtx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
  strokes.forEach((s) => {
    drawCtx.strokeStyle = s.color;
    drawCtx.lineWidth = 3;
    drawCtx.lineCap = "round";
    drawCtx.beginPath();
    const pts = s.points;
    for (let i = 1; i < pts.length; i++) {
      drawCtx.moveTo(pts[i - 1].x, pts[i - 1].y);
      drawCtx.lineTo(pts[i].x, pts[i].y);
    }
    drawCtx.stroke();
  });
}

undoBtn.onclick = () => {
  strokes.pop();
  redraw();
};
clearBtn.onclick = () => {
  strokes = [];
  redraw();
};

// ===== Speichern / Laden =====
savePng.addEventListener("click",async()=>{
  const off=document.createElement("canvas");
  off.width=drawCanvas.width; off.height=drawCanvas.height;
  const ctx=off.getContext("2d");
  drawCourtToContext(ctx,off.width,off.height);
  ctx.drawImage(drawCanvas,0,0);
  wrap.querySelectorAll(".token").forEach(t=>{
    const x=parseFloat(t.style.left)/100*off.width;
    const y=parseFloat(t.style.top)/100*off.height;
    ctx.beginPath(); ctx.arc(x,y,22,0,Math.PI*2);
    ctx.fillStyle=getComputedStyle(t).backgroundColor; ctx.fill();
    ctx.fillStyle="#111"; ctx.font="bold 16px sans-serif";
    ctx.textAlign="center"; ctx.textBaseline="middle";
    ctx.fillText(t.textContent,x,y);
  });
  const url=off.toDataURL("image/png");
  const name=prompt("Name der Taktik:"); if(!name)return;
  await addDoc(collection(db,"tactics"),{team,name,image:url,createdAt:new Date().toISOString()});
  loadTactics();
  alert("✅ Taktik gespeichert!");
});
function drawCourtToContext(ctx,w,h){ // identisch zu drawCourt()
  ctx.strokeStyle="#fff"; ctx.lineWidth=4;
  ctx.strokeRect(2,2,w-4,h-4);
  ctx.beginPath();ctx.moveTo(w/2,2);ctx.lineTo(w/2,h-2);ctx.stroke();
  const goalW=Math.max(6,w*0.015),goalH=h*0.2;
  ctx.strokeRect(2,h/2-goalH/2,goalW,goalH);
  ctx.strokeRect(w-goalW-2,h/2-goalH/2,goalW,goalH);
  const six=w*0.12,nine=w*0.18;
  const L={x:2+goalW,y:h/2},R={x:w-2-goalW,y:h/2};
  drawArc(L.x,L.y,six,Math.PI/2,-Math.PI/2,true);
  ctx.setLineDash([10,8]);
  drawArc(L.x,L.y,nine,Math.PI/2,-Math.PI/2,true);
  ctx.setLineDash([]);
  drawArc(R.x,R.y,six,-Math.PI/2,Math.PI/2,true);
  ctx.setLineDash([10,8]);
  drawArc(R.x,R.y,nine,-Math.PI/2,Math.PI/2,true);
  ctx.setLineDash([]);
  function drawArc(cx,cy,r,a1,a2,ccw){ctx.beginPath();ctx.arc(cx,cy,r,a1,a2,ccw);ctx.stroke();}
}

// ===== Taktiken anzeigen =====
// ===== Taktiken anzeigen =====
async function loadTactics() {
  tacticList.innerHTML = "";
  const q = query(collection(db, "tactics"), where("team", "==", team));
  const s = await getDocs(q);

  s.forEach((d) => {
    const data = d.data();
    const card = document.createElement("div");
    card.className =
      "bg-gray-800 p-4 rounded-xl shadow hover:bg-gray-700 transition";

    card.innerHTML = `
      <img src="${data.image}" class="rounded mb-3 w-full">
      <h3 class="font-bold text-lg">${data.name}</h3>
      <div class="flex justify-between mt-3">
        <button class="bg-blue-500 px-3 py-1 rounded text-black font-bold text-sm">Ansehen</button>
        <button class="bg-green-500 px-3 py-1 rounded text-black font-bold text-sm">📥 Download</button>
        <button class="bg-red-600 px-3 py-1 rounded text-white font-bold text-sm">Löschen</button>
      </div>
    `;

    // === Aktionen ===
    const viewBtn = card.querySelector(".bg-blue-500");
    const downloadBtn = card.querySelector(".bg-green-500");
    const deleteBtn = card.querySelector(".bg-red-600");

    // 🔍 Vorschau anzeigen
    viewBtn.onclick = () => {
      const v = document.createElement("div");
      v.className =
        "fixed inset-0 bg-black/70 flex items-center justify-center z-50";
      v.innerHTML = `
        <div class="bg-gray-800 p-4 rounded-xl w-[90%] max-w-3xl">
          <img src="${data.image}" class="rounded w-full mb-3">
          <h3 class="text-xl font-bold mb-3">${data.name}</h3>
          <div class="flex justify-end gap-2">
            <a href="${data.image}" download="${data.name.replace(/\s+/g, "_")}.png"
              class="bg-green-500 hover:bg-green-400 text-black px-4 py-2 rounded font-bold">
              📥 Download
            </a>
            <button class="bg-gray-600 hover:bg-gray-500 px-4 py-2 rounded font-bold text-white">
              Schließen
            </button>
          </div>
        </div>`;
      document.body.appendChild(v);
      v.querySelector("button").onclick = () => v.remove();
    };

    // 📥 Direktdownload aus Card
    downloadBtn.onclick = () => {
      const a = document.createElement("a");
      a.href = data.image;
      a.download = `${data.name.replace(/\s+/g, "_")}.png`;
      a.click();
    };

    // ❌ Löschen
    deleteBtn.onclick = async () => {
      await deleteDoc(doc(db, "tactics", d.id));
      await loadTactics();
    };

    tacticList.appendChild(card);
  });
}

loadTactics();