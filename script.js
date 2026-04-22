if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js')
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
  const currentTime = now.getHours().toString().padStart(2, '0') + ":" + 
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
    if ("vibrate" in navigator) navigator.vibrate([500, 200, 500]);
    window.location.href = "vibration.html"; 
  }
}, 30000);

// ================= UI & POINTS =================
function updatePointsDisplay() {
  const display = document.getElementById("pointDisplay");
  if (display) {
    display.innerText = `🌟 ${rewardPoints}`;
    localStorage.setItem("rewards", rewardPoints);
  }
}

// ================= VIBRATION CONTROLS =================
function startVibration() {
  if ("vibrate" in navigator) {
    clearInterval(vInterval);
    vInterval = setInterval(() => {
      navigator.vibrate([1000, 500, 1000, 500, 2000]);
    }, 5000);
    navigator.vibrate([1000, 500, 1000, 500, 2000]);
  }
}

function stopVibration() {
  clearInterval(vInterval);
  if ("vibrate" in navigator) navigator.vibrate(0);
}

// ================= LANGUAGE & TRANSLATIONS =================
const translations = {
  en: { 
    title: "💙 MEDIMATE", 
    noHistory: "No history available",
    login: "Login",
    register: "Register",
    addMed: "Add Medicine",
    sos: "SOS",
    settings: "Settings",
    history: "History",
    points: "Points",
    logout: "Logout",
    save: "Save Contact",
    back: "Back"
  },
  hi: { 
    title: "💙 मेडिमेट", 
    noHistory: "कोई इतिहास उपलब्ध नहीं",
    login: "लॉगिन",
    register: "रजिस्टर",
    addMed: "दवा जोड़ें",
    sos: "आपातकालीन",
    settings: "सेटिंग्स",
    history: "इतिहास",
    points: "अंक",
    logout: "लॉगआउट",
    save: "संपर्क सहेजें",
    back: "पीछे"
  },
  bn: { 
    title: "💙 মেডিমেট", 
    noHistory: "কোনো ইতিহাস নেই",
    login: "লগইন",
    register: "নিবন্ধন",
    addMed: "ওষুধ যোগ করুন",
    sos: "জরুরী",
    settings: "সেটিংস",
    history: "ইতিহাস",
    points: "পয়েন্ট",
    logout: "লগআউট",
    save: "কন্টাক্ট সেভ করুন",
    back: "ফিরে যান"
  }
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

// ================= LOGIN & REGISTRATION =================
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
    alert("Login successful ✅");
    window.location.href = "dashboard.html"; 
  } else {
    alert("Wrong password ❌");
  }
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
  window.location.href = "dashboard.html";
}

function displayMedicines() {
  const container = document.getElementById("medicineListDisplay");
  if (!container) return;
  const meds = JSON.parse(localStorage.getItem("medicines")) || [];
  container.innerHTML = meds.map((m) => `
    <div class="glass-item" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;padding:15px;background:rgba(255,255,255,0.1);border-radius:12px;opacity:${m.isHandled ? '0.5':'1'}">
      <div>
        <strong style="color:white;">${m.name}</strong> (${m.dose})<br>
        <small style="color:#ff9f43;">⏰ ${m.time}</small>
      </div>
      <input type="checkbox" ${m.isHandled ? 'checked disabled':''} onchange="handleMedAction(this,'${m.name}')" style="width:25px;height:25px;">
    </div>
  `).join("") || "<p style='color:white;text-align:center;'>No medicines added.</p>";
}

function handleMedAction(checkbox, medName) {
  if (checkbox.checked) {
    rewardPoints += 10;
    updatePointsDisplay();
    stopVibration();
    addHistory(`Taken: ${medName}`);
    let meds = JSON.parse(localStorage.getItem("medicines")) || [];
    const updatedMeds = meds.map(m => m.name === medName ? { ...m, isHandled: true } : m);
    localStorage.setItem("medicines", JSON.stringify(updatedMeds));
    checkbox.parentElement.style.opacity = "0.5";
    checkbox.disabled = true;
  }
}

// ================= CONTACT & SOS =================
function saveContact() {
  const name = document.getElementById("contactNameInput")?.value;
  const phone = document.getElementById("contactPhoneInput")?.value;
  if(!name || !phone) return alert("Fill all fields");
  localStorage.setItem("contactName", name);
  localStorage.setItem("contactPhone", phone);
  alert("Contact Saved! ✅");
  loadSavedContact();
}

function loadSavedContact() {
  let name = localStorage.getItem("contactName");
  let phone = localStorage.getItem("contactPhone");
  let display = document.getElementById("savedContact");
  if (name && phone && display) {
    display.innerText = `Saved: ${name} (${phone})`;
  }
}

function openSOS() {
  let phone = localStorage.getItem("contactPhone");
  window.location.href = "vibration.html"; 
  if (phone) {
    let cleanPhone = phone.replace(/\D/g, "");
    if (cleanPhone.length === 10) cleanPhone = "91" + cleanPhone;
    const message = "🚨 Emergency! Please check on me (MediMate)";
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`, '_blank');
  }
}

// ================= NAVIGATION =================
function goBack() { history.back(); }
function openAdd() { window.location.href = "add.html"; }
function openHistory() { window.location.href = "history.html"; }
function openContacts() { window.location.href = "contacts.html"; }
function logout() {
  localStorage.removeItem("loggedIn");
  window.location.href = "login.html";
}

// ================= INITIALIZATION =================
document.addEventListener("DOMContentLoaded", () => {
  applyLanguage();
  loadSavedContact();
  displayMedicines();
  updatePointsDisplay();
  
  // Load History if on history page
  let historyList = document.getElementById("historyList");
  if (historyList) {
    let history = JSON.parse(localStorage.getItem("history")) || [];
    historyList.innerHTML = history.map(h => `
      <div class="glass" style="margin-bottom:10px;padding:10px;">
        <b>${h.title}</b><br><small>🕒 ${h.time}</small>
      </div>`).join("") || "No history found";
  }
});

function addHistory(title) {
  let history = JSON.parse(localStorage.getItem("history")) || [];
  history.unshift({ title, time: new Date().toLocaleString() });
  localStorage.setItem("history", JSON.stringify(history.slice(0,20)));
}