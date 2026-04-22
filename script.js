// ================= SERVICE WORKER =================
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js') // safer for GitHub
      .then(reg => console.log('✅ HealthGuardian SW Registered!'))
      .catch(err => console.error('❌ SW Registration Failed:', err));
  });
}

// ================= GLOBAL VARIABLES =================
let rewardPoints = parseInt(localStorage.getItem("rewards")) || 0;
let vInterval = null;

// ================= AUTOMATIC VIBRATION CHECKER =================
setInterval(() => {
  const meds = JSON.parse(localStorage.getItem("medicines")) || [];
  const now = new Date();

  const currentTime =
    now.getHours().toString().padStart(2, '0') + ":" +
    now.getMinutes().toString().padStart(2, '0');

  let triggered = false;

  const updatedMeds = meds.map(m => {
    if (m.time === currentTime && !m.isHandled) {
      triggered = true;
      return { ...m, isHandled: true };
    }
    return m;
  });

  if (triggered) {
    localStorage.setItem("medicines", JSON.stringify(updatedMeds));

    if ("vibrate" in navigator) {
      navigator.vibrate([500, 200, 500, 200, 1000]);
    }

    window.location.href = "vibration.html";
  }
}, 10000); // faster + reliable

// ================= UI =================
function updatePointsDisplay() {
  const display = document.getElementById("pointDisplay");
  if (display) {
    display.innerText = `🌟 ${rewardPoints}`;
    localStorage.setItem("rewards", rewardPoints);
  }
}

// ================= VIBRATION =================
function startVibration() {
  if ("vibrate" in navigator) {
    clearInterval(vInterval);
    vInterval = setInterval(() => {
      navigator.vibrate([1000, 500, 1000, 500, 2000]);
    }, 5000);
    navigator.vibrate([1000, 500, 1000]);
  }
}

function stopVibration() {
  clearInterval(vInterval);
  if ("vibrate" in navigator) navigator.vibrate(0);
}

function markMissed() {
  rewardPoints = Math.max(0, rewardPoints - 15);
  updatePointsDisplay();

  addHistory("🚨 Missed");

  if (Notification.permission === "granted") {
    new Notification("🚨 Medicine Missed!");
  }

  if ("vibrate" in navigator) navigator.vibrate([500, 200, 500]);

  setTimeout(() => {
    window.location.href = "vibration.html";
  }, 1000);
}

// ================= MED ACTION =================
function handleMedAction(checkbox, medName) {
  if (checkbox.checked) {
    rewardPoints += 10;
    updatePointsDisplay();

    stopVibration();
    addHistory(`Taken: ${medName}`);

    let meds = JSON.parse(localStorage.getItem("medicines")) || [];
    const updatedMeds = meds.map(m =>
      m.name === medName ? { ...m, isHandled: true } : m
    );

    localStorage.setItem("medicines", JSON.stringify(updatedMeds));

    checkbox.parentElement.style.opacity = "0.5";
    checkbox.disabled = true;

  } else {
    rewardPoints = Math.max(0, rewardPoints - 15);
    updatePointsDisplay();
    startVibration();
    addHistory(`🚨 MISSED: ${medName} (-15 Points)`);
  }
}

// ================= SAFE INIT =================
document.addEventListener("DOMContentLoaded", () => {
  try {
    if (typeof loadTheme === "function") loadTheme();
    if (typeof applyLanguage === "function") applyLanguage();
  } catch(e){}

  loadHistory();
  loadSavedContact();
  displayMedicines();
  updatePointsDisplay();

  console.log("App Loaded ✅");
});

// ================= NOTIFICATION =================
if ("Notification" in window) {
  Notification.requestPermission();
}

// ================= LOGIN =================
function register() {
  let u = document.getElementById("username")?.value.trim();
  let p = document.getElementById("password")?.value.trim();

  if (!u || !p) return alert("Fill all fields");
  if (localStorage.getItem("user_" + u)) return alert("User already exists!");

  localStorage.setItem("user_" + u, p);
  alert("Registered successfully ✅");
}

function login() {
  let u = document.getElementById("username")?.value.trim();
  let p = document.getElementById("password")?.value.trim();
  let stored = localStorage.getItem("user_" + u);

  if (!stored) return alert("User not found ❌");

  if (stored === p) {
    localStorage.setItem("loggedIn", "true");
    localStorage.setItem("currentUser", u);
    window.location.href = "dashboard.html"; // FIXED
  } else {
    alert("Wrong password ❌");
  }
}

// ================= NAVIGATION =================
function goBack() { history.back(); }
function openAdd() { window.location.href = "add.html"; }
function openHistory() { window.location.href = "history.html"; }
function openDoctor() { window.location.href = "doctor.html"; }
function openContacts() { window.location.href = "contacts.html"; }
function openSettings() { window.location.href = "settings.html"; }
function openVibration() { window.location.href = "vibration.html"; }

function logout() {
  localStorage.removeItem("loggedIn");
  localStorage.removeItem("currentUser");
  window.location.href = "index.html"; // FIXED
}

// ================= DARK MODE =================
function toggleDark() {
  let isDark = localStorage.getItem("darkMode") === "true";
  document.body.classList.toggle("dark");
  localStorage.setItem("darkMode", !isDark);
}

// ================= LANGUAGE =================
const translations = {
  en: { title: "💙 MEDIMATE", noHistory: "No history available" },
  hi: { title: "💙 मेडिमेट", noHistory: "कोई इतिहास उपलब्ध नहीं" },
  bn: { title: "💙 মেডিমেট", noHistory: "কোনো ইতিহাস নেই" }
};

function applyLanguage() {
  let lang = localStorage.getItem("lang") || "en";
  let t = translations[lang];
  document.querySelectorAll("[data-lang]").forEach(el => {
    let key = el.getAttribute("data-lang");
    if (t[key]) el.innerText = t[key];
  });
}

function changeLanguage() {
  let select = document.getElementById("languageSelect");
  if (!select) return;
  localStorage.setItem("lang", select.value);
  applyLanguage();
}

// ================= MEDICINES =================
function addMedicine() {
  const name = document.getElementById("medName").value;
  const dose = document.getElementById("medDose").value;
  const time = document.getElementById("medTime").value;

  if (!name || !dose || !time) return alert("Fill all fields");

  let meds = JSON.parse(localStorage.getItem("medicines")) || [];
  meds.push({ name, dose, time, isHandled: false });

  localStorage.setItem("medicines", JSON.stringify(meds));
  addHistory("Added: " + name);

  window.location.href = "dashboard.html"; // FIXED
}

function displayMedicines() {
  const container = document.getElementById("medicineListDisplay");
  if (!container) return;

  const meds = JSON.parse(localStorage.getItem("medicines")) || [];
  const validMeds = meds.filter(m => m.name && m.name.trim() !== "");

  if (validMeds.length === 0) {
    container.innerHTML = "<p style='color:white;text-align:center;'>No medicines added today.</p>";
    return;
  }

  container.innerHTML = validMeds.map((m) => `
    <div class="glass-item" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;padding:15px;background:rgba(255,255,255,0.1);border-radius:12px;opacity:${m.isHandled ? '0.5':'1'}">
      <div>
        <strong style="color:white;">${m.name}</strong> (${m.dose})<br>
        <small style="color:#ff9f43;">⏰ ${m.time}</small>
      </div>
      <input type="checkbox"
        ${m.isHandled ? 'checked disabled':''}
        onchange='handleMedAction(this, "${m.name}")'
        style="width:25px;height:25px;">
    </div>
  `).join("");
}

// ================= HISTORY =================
function addHistory(title) {
  let history = JSON.parse(localStorage.getItem("history")) || [];
  history.unshift({ title: title || "Record", time: new Date().toLocaleString() });
  localStorage.setItem("history", JSON.stringify(history.slice(0,20)));
}

function loadHistory() {
  let history = JSON.parse(localStorage.getItem("history")) || [];
  let list = document.getElementById("historyList");
  if (!list) return;

  list.innerHTML = history.map(h => `
    <div class="glass" style="margin-bottom:10px;text-align:left;padding:10px;">
      <b>${h.title}</b><br><small>🕒 ${h.time}</small>
    </div>
  `).join("") || "No history found";
}

// ================= CONTACT =================
function loadSavedContact() {
  let name = localStorage.getItem("contactName");
  let phone = localStorage.getItem("contactPhone");
  let display = document.getElementById("savedContact");

  if (name && phone && display) {
    display.innerText = `Saved: ${name} (${phone})`;
  }
}

// ================= SOS =================
function openSOS() {
  let phone = localStorage.getItem("contactPhone");
  if (!phone) return alert("⚠️ No emergency contact found!");

  let cleanPhone = phone.replace(/\D/g, "");
  if (cleanPhone.length === 10) cleanPhone = "91" + cleanPhone;

  const message = "🚨 Emergency! Please check on me (MediMate)";
  window.location.href = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}