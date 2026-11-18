const USERS_DB_KEY = "pennynest_all_users_db";
const ACTIVE_EMAIL_KEY = "pennynest_active_user_email";
const COZY_NESTS_KEY = "pennynest_shared_cozy_nests";
const THEME_KEY = "pennynest_current_theme";
const PAGE_KEY = "pennynest_active_page";

// Authorized Admin email
const ADMIN_EMAIL = "hakhnish99@gmail.com";

const pandaMoods = [
  "🐼 Munching bamboo on a mindful student budget...",
  "🐼 Guarding your pennies inside the cozy nest! 🏡",
  "🐼 Proud of you for tracking your campus expenses! 🌿",
  "🐼 Taking a cozy nap after counting your savings! 🎋",
  "🐼 Ready for an iced coffee treat—if the budget says yes! 🧋"
];
let currentMoodIndex = 0;
let pendingNestMembers = [];
let activeCozyNestId = null;
let currentAdminSubTab = "overview";
let adminMsgTargetEmail = null;

// ==========================================
// 1. INITIALIZE APP ON LOAD
// ==========================================
window.addEventListener("DOMContentLoaded", () => {
  const todayStr = new Date().toISOString().split("T")[0];

  const txDateInput = document.getElementById("txDate");
  if (txDateInput) txDateInput.value = todayStr;

  const savedTheme = localStorage.getItem(THEME_KEY) || "matcha";
  setTheme(savedTheme, false);

  configureAuthUI();

  const activeEmail = sessionStorage.getItem(ACTIVE_EMAIL_KEY);
  const users = getAllUsers();
  const activeUser = users.find(u => u.email.toLowerCase() === (activeEmail || "").toLowerCase());

  if (activeUser) {
    launchApp(false);
  }
});

// ==========================================
// 2. CUSTOM CUTE MODAL SYSTEM (NO BROWSER ALERTS/CONFIRMS)
// ==========================================
function openCuteModal({
  icon = "🐼",
  title = "Are you sure?",
  message = "",
  confirmText = "Confirm",
  cancelText = "Cancel",
  showCancel = true,
  isDanger = false,
  onConfirm = null
}) {
  const modal = document.getElementById("customActionModal");
  document.getElementById("customModalIcon").textContent = icon;
  document.getElementById("customModalTitle").textContent = title;
  document.getElementById("customModalMessage").textContent = message;

  const cancelBtn = document.getElementById("customModalCancelBtn");
  const confirmBtn = document.getElementById("customModalConfirmBtn");

  cancelBtn.textContent = cancelText;
  cancelBtn.style.display = showCancel ? "inline-block" : "none";

  confirmBtn.textContent = confirmText;
  confirmBtn.className = isDanger ? "btn btn-danger" : "btn btn-primary";

  confirmBtn.onclick = () => {
    closeCustomModal();
    if (typeof onConfirm === "function") onConfirm();
  };

  modal.classList.remove("hidden");
}

function closeCustomModal() {
  document.getElementById("customActionModal").classList.add("hidden");
}

// ==========================================
// 3. MULTI-PROFILE, AVATAR & EXCLUSIVE ADMIN SYSTEM
// ==========================================
function getAllUsers() {
  try {
    const raw = localStorage.getItem(USERS_DB_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function saveAllUsers(usersList) {
  localStorage.setItem(USERS_DB_KEY, JSON.stringify(usersList));
}

function getCurrentUser() {
  const activeEmail = sessionStorage.getItem(ACTIVE_EMAIL_KEY);
  if (!activeEmail) return null;
  return getAllUsers().find(u => u.email.toLowerCase() === activeEmail.toLowerCase()) || null;
}

function isUserAdmin(user) {
  return Boolean(user && (user.role === "admin" || user.email.toLowerCase() === ADMIN_EMAIL));
}

function adminAlreadyExists() {
  return getAllUsers().some(u => u.role === "admin" || u.email.toLowerCase() === ADMIN_EMAIL);
}

function renderAvatarVisual(avatarVal, extraClass = "") {
  if (avatarVal && avatarVal.startsWith("data:image")) {
    return `<img src="${avatarVal}" alt="Profile" class="${extraClass}">`;
  }
  if (avatarVal === "🐷") return "🐼";
  return avatarVal || "🐼";
}

function configureAuthUI() {
  const hasAdmin = adminAlreadyExists();

  const loginRoleGroup = document.getElementById("loginRoleGroup");
  const regRoleGroup = document.getElementById("regRoleGroup");
  const loginRoleSelect = document.getElementById("loginRole");
  const regRoleSelect = document.getElementById("regRole");

  if (hasAdmin) {
    if (loginRoleGroup) loginRoleGroup.classList.add("hidden");
    if (regRoleGroup) regRoleGroup.classList.add("hidden");
    if (loginRoleSelect) loginRoleSelect.value = "user";
    if (regRoleSelect) regRoleSelect.value = "user";
  } else {
    if (loginRoleGroup) loginRoleGroup.classList.remove("hidden");
    if (regRoleGroup) regRoleGroup.classList.remove("hidden");
  }
}

function switchAuthMode(mode) {
  const loginForm = document.getElementById("loginForm");
  const registerForm = document.getElementById("registerForm");
  const tabLogin = document.getElementById("tabLoginMode");
  const tabReg = document.getElementById("tabRegisterMode");

  if (mode === "login") {
    loginForm.classList.remove("hidden");
    registerForm.classList.add("hidden");
    tabLogin.classList.add("active");
    tabReg.classList.remove("active");
  } else {
    loginForm.classList.add("hidden");
    registerForm.classList.remove("hidden");
    tabLogin.classList.remove("active");
    tabReg.classList.add("active");
  }
}

function handleRegisterUser(e) {
  e.preventDefault();
  const hasAdmin = adminAlreadyExists();
  const selectedRole = hasAdmin ? "user" : document.getElementById("regRole").value;
  const name = document.getElementById("regName").value.trim();
  const email = document.getElementById("regEmail").value.trim().toLowerCase();
  const pin = document.getElementById("regPin").value.trim();

  if (!name || !email || pin.length !== 4) return;

  const users = getAllUsers();

  if (selectedRole === "admin") {
    if (hasAdmin) {
      openCuteModal({
        icon: "👑",
        title: "Admin Already Exists",
        message: "An Admin profile is already registered. Please create a Student User profile instead!",
        confirmText: "Okay 🐼",
        showCancel: false
      });
      configureAuthUI();
      return;
    }
    if (email !== ADMIN_EMAIL) {
      openCuteModal({
        icon: "🛡️",
        title: "Unauthorized Admin ID",
        message: "The email entered does not match the authorized Admin ID.",
        confirmText: "Try Again",
        showCancel: false,
        isDanger: true
      });
      return;
    }
  }

  const finalRole = email === ADMIN_EMAIL && !hasAdmin ? "admin" : "user";

  if (users.some(u => u.email.toLowerCase() === email)) {
    openCuteModal({
      icon: "🐼",
      title: "Profile Already Exists",
      message: "An account with this email already exists! Please switch to Log In.",
      confirmText: "Go to Log In 🔑",
      showCancel: false,
      onConfirm: () => {
        switchAuthMode("login");
        document.getElementById("loginEmail").value = email;
      }
    });
    return;
  }

  const newUser = {
    name,
    email,
    pin,
    avatar: finalRole === "admin" ? "👑" : "🐼",
    role: finalRole,
    createdAt: new Date().toISOString()
  };

  users.push(newUser);
  saveAllUsers(users);
  sessionStorage.setItem(ACTIVE_EMAIL_KEY, newUser.email);

  document.getElementById("registerForm").reset();
  configureAuthUI();
  showToast(
    newUser.role === "admin"
      ? `👑 Admin Command Center unlocked for ${name}!`
      : `🏡 Welcome to PennyNest, ${name}!`
  );
  launchApp(true);
}

function handleLoginUser(e) {
  e.preventDefault();
  const hasAdmin = adminAlreadyExists();
  const selectedRole = hasAdmin ? "user" : document.getElementById("loginRole").value;
  const email = document.getElementById("loginEmail").value.trim().toLowerCase();
  const pin = document.getElementById("loginPin").value.trim();

  if (!hasAdmin && selectedRole === "admin" && email !== ADMIN_EMAIL) {
    openCuteModal({
      icon: "🛡️",
      title: "Unauthorized Admin ID",
      message: "This email is not authorized for Admin access.",
      confirmText: "Okay",
      showCancel: false,
      isDanger: true
    });
    return;
  }

  const users = getAllUsers();
  const matchedUser = users.find(u => u.email.toLowerCase() === email);

  if (!matchedUser) {
    openCuteModal({
      icon: "🔍",
      title: "Profile Not Found",
      message: "No profile found with that email address. Please create your profile first!",
      confirmText: "Create Profile 🐼",
      showCancel: true,
      onConfirm: () => {
        switchAuthMode("register");
        document.getElementById("regEmail").value = email;
      }
    });
    return;
  }

  if (matchedUser.pin !== pin) {
    openCuteModal({
      icon: "🔐",
      title: "Incorrect Passcode",
      message: "That 4-digit passcode doesn't match! Please try again.",
      confirmText: "Retry",
      showCancel: false,
      isDanger: true
    });
    document.getElementById("loginPin").value = "";
    return;
  }

  if (matchedUser.email.toLowerCase() === ADMIN_EMAIL && matchedUser.role !== "admin") {
    matchedUser.role = "admin";
    saveAllUsers(users);
  }

  sessionStorage.setItem(ACTIVE_EMAIL_KEY, matchedUser.email);
  document.getElementById("loginForm").reset();
  configureAuthUI();
  showToast(`🔓 Nest unlocked! Welcome back, ${matchedUser.name}!`);
  launchApp(true);
}

function launchApp(forceDefaultHome = false) {
  const user = getCurrentUser();
  if (!user) return;

  document.getElementById("welcomeScreen").style.display = "none";
  document.getElementById("mainNavbar").style.display = "block";

  syncProfileAvatarUI(user);

  const adminNavBtn = document.getElementById("nav-adminCommandPage");
  const backToAdminBtn = document.getElementById("backToAdminCenterBtn");
  const aiChatSec = document.getElementById("studentAiChatSection");

  if (isUserAdmin(user)) {
    if (adminNavBtn) adminNavBtn.classList.remove("hidden");
    if (backToAdminBtn) backToAdminBtn.classList.remove("hidden");
  } else {
    if (adminNavBtn) adminNavBtn.classList.add("hidden");
    if (backToAdminBtn) backToAdminBtn.classList.add("hidden");
  }

  if (aiChatSec) {
    aiChatSec.classList.remove("hidden");
  }

  pendingNestMembers = [user.email];

  const defaultHome = isUserAdmin(user) ? "adminCommandPage" : "dashboardPage";
  let savedPage = localStorage.getItem(PAGE_KEY) || defaultHome;
  if (!isUserAdmin(user) && savedPage === "adminCommandPage") {
    savedPage = "dashboardPage";
  }

  const targetPage = forceDefaultHome ? defaultHome : savedPage;

  initAiChatGreeting();
  checkAdminMessagesBanner();
  openPage(targetPage);
}

function handleLogoClick() {
  const user = getCurrentUser();
  if (isUserAdmin(user)) {
    openPage("adminCommandPage");
  } else {
    openPage("dashboardPage");
  }
}

function syncProfileAvatarUI(user) {
  document.getElementById("modalName").textContent = user.name;
  document.getElementById("modalEmail").textContent = user.email;
  document.getElementById("modalRoleBadge").textContent =
    isUserAdmin(user) ? "👑 Admin (Site Owner)" : "🐼 Student User";

  const avatarHTML = renderAvatarVisual(user.avatar);
  document.getElementById("pandaAvatar").innerHTML = avatarHTML;
  document.getElementById("topProfileBtn").innerHTML = avatarHTML;
}

function toggleAvatarOptionsMenu(event) {
  triggerPandaJoy(event);
  const pop = document.getElementById("avatarOptionsPopover");
  const grid = document.getElementById("presetAvatarGrid");
  if (pop.classList.contains("hidden")) {
    pop.classList.remove("hidden");
    grid.classList.add("hidden");
  } else {
    pop.classList.add("hidden");
    grid.classList.add("hidden");
  }
}

function showPresetAvatarGrid() {
  const grid = document.getElementById("presetAvatarGrid");
  grid.classList.toggle("hidden");
}

function updateUserAvatar(newAvatarStr) {
  const user = getCurrentUser();
  if (!user) return;

  const users = getAllUsers();
  const idx = users.findIndex(u => u.email.toLowerCase() === user.email.toLowerCase());
  if (idx === -1) return;

  users[idx].avatar = newAvatarStr;
  saveAllUsers(users);
  syncProfileAvatarUI(users[idx]);

  document.getElementById("avatarOptionsPopover").classList.add("hidden");
  document.getElementById("presetAvatarGrid").classList.add("hidden");
  showToast("🎨 Profile picture updated!");
  refreshAllViews();
}

function handlePersonalPhotoUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    updateUserAvatar(e.target.result);
  };
  reader.readAsDataURL(file);
}

// ==========================================
// 4. EXCLUSIVE ADMIN COMMAND CENTER (WITH COMPACT 💬 MSG, 📥 DOWNLOAD & 🗑️ DELETE)
// ==========================================
function switchAdminSubTab(tabName) {
  currentAdminSubTab = tabName;

  const tabs = ["overview", "directory", "nests", "analysis", "health"];
  tabs.forEach(t => {
    const viewEl = document.getElementById(`adminSubView-${t}`);
    const btnEl = document.getElementById(`admTabBtn-${t}`);
    if (viewEl) {
      if (t === tabName) viewEl.classList.remove("hidden");
      else viewEl.classList.add("hidden");
    }
    if (btnEl) {
      if (t === tabName) btnEl.classList.add("active");
      else btnEl.classList.remove("active");
    }
  });

  const titles = {
    overview: ["Admin Command Dashboard", "Pastel Matrix overview of community growth, activity trends, and privacy-safe user summaries."],
    directory: ["Registered User Directory", "Search registered profiles and manage accounts without exposing private balances or passcodes."],
    nests: ["Cozy Nests Monitor", "Overview of collaborative student groups and milestone completion across PennyNest."],
    analysis: ["Site Analysis & Category Activity", "Platform-wide transaction counts by category (private BDT amounts remain hidden)."],
    health: ["Platform Health & Privacy Shield", "Diagnostics for local storage modules and user privacy safeguards."]
  };

  const titlePair = titles[tabName] || titles.overview;
  document.getElementById("adminSubPageTitle").textContent = titlePair[0];
  document.getElementById("adminSubPageSubtitle").textContent = titlePair[1];

  renderAdminDashboard();
}

function renderAdminDashboard() {
  const user = getCurrentUser();
  if (!isUserAdmin(user)) return;

  const allUsers = getAllUsers();
  const allNests = getAllCozyNests();

  let totalTxCount = 0;
  let totalGoalsCount = 0;
  let completedGoalsCount = 0;
  let joinedThisMonth = 0;
  const currentMonthPrefix = new Date().toISOString().slice(0, 7);
  const categoryTxCounts = {
    Food: 0,
    Transport: 0,
    Education: 0,
    Utilities: 0,
    Entertainment: 0,
    Allowance: 0
  };

  allUsers.forEach(u => {
    if (u.createdAt && u.createdAt.startsWith(currentMonthPrefix)) {
      joinedThisMonth++;
    }
    const txs = getTransactionsForEmail(u.email);
    totalTxCount += txs.length;
    txs.forEach(t => {
      if (categoryTxCounts[t.category] !== undefined) {
        categoryTxCounts[t.category]++;
      }
    });

    const goals = getGoalsForEmail(u.email);
    totalGoalsCount += goals.length;
    goals.forEach(g => {
      if (Number(g.saved) >= Number(g.target) && Number(g.target) > 0) {
        completedGoalsCount++;
      }
    });
  });

  allNests.forEach(n => {
    if (Number(n.saved) >= Number(n.target) && Number(n.target) > 0) {
      completedGoalsCount++;
    }
  });

  const setTxt = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val.toLocaleString();
  };

  setTxt("admTileUsers", allUsers.length);
  setTxt("admTileNests", allNests.length);
  setTxt("admTileGoals", totalGoalsCount);
  setTxt("admTileCompletedGoals", completedGoalsCount);
  setTxt("admTileTxCount", totalTxCount);

  setTxt("admBoxTotalUsers", allUsers.length);
  setTxt("admBoxNewUsers", joinedThisMonth);
  setTxt("admBoxActiveNests", allNests.length);
  setTxt("admBoxTotalGoals", totalGoalsCount);
  setTxt("admBoxCompletedGoals", completedGoalsCount);
  setTxt("admBoxTotalLogs", totalTxCount);

  const searchQuery = ((document.getElementById("adminUserSearchInput") || {}).value || "")
    .trim()
    .toLowerCase();

  // Privacy-Safe User Summary Rows with Compact 💬 Msg, 📥 CSV, and 🗑️ Delete Buttons
  const buildUserRowsHTML = list => {
    if (list.length === 0) {
      return `<tr><td colspan="9" style="text-align:center; padding:20px; color:var(--text-muted);">No matching registered users found in this browser.</td></tr>`;
    }
    return list
      .map(u => {
        const txs = getTransactionsForEmail(u.email);
        const goals = getGoalsForEmail(u.email);
        const nestsJoined = allNests.filter(n =>
          n.members.some(m => m.toLowerCase() === u.email.toLowerCase())
        ).length;
        const joinedDateStr = u.createdAt
          ? formatReadableDate(u.createdAt.split("T")[0])
          : "Recently";

        return `
        <tr>
          <td><div class="table-avatar-mini">${renderAvatarVisual(u.avatar)}</div></td>
          <td><strong>${escapeHTML(u.name)}</strong></td>
          <td class="admin-email-cell">${escapeHTML(u.email)}</td>
          <td><span class="badge">${isUserAdmin(u) ? "👑 Admin" : "🐼 Student"}</span></td>
          <td>${joinedDateStr}</td>
          <td class="num-font">${txs.length}</td>
          <td class="num-font">${goals.length}</td>
          <td class="num-font">${nestsJoined}</td>
          <td>
            <div class="admin-action-btns">
              <button type="button" class="btn btn-outline btn-sm" onclick="openAdminMsgModal('${escapeHTML(u.email)}')" title="Send Admin Message">💬 Msg</button>
              <button type="button" class="btn btn-outline btn-sm" onclick="adminDownloadUserCSV('${escapeHTML(u.email)}')" title="Download User CSV">📥 CSV</button>
              <button type="button" class="btn btn-danger btn-sm" onclick="adminDeleteUserAccount('${escapeHTML(u.email)}')" title="Delete User">🗑️ Delete</button>
            </div>
          </td>
        </tr>
      `;
      })
      .join("");
  };

  const overviewBody = document.getElementById("adminOverviewUsersBody");
  if (overviewBody) {
    overviewBody.innerHTML = buildUserRowsHTML(allUsers);
  }

  const dirBody = document.getElementById("adminDirectoryUsersBody");
  if (dirBody) {
    const filteredUsers = allUsers.filter(
      u =>
        u.name.toLowerCase().includes(searchQuery) ||
        u.email.toLowerCase().includes(searchQuery)
    );
    dirBody.innerHTML = buildUserRowsHTML(filteredUsers);
  }

  // Render Global Cozy Nests Monitor
  const nestsMonitorEl = document.getElementById("adminCozyNestsMonitorList");
  if (nestsMonitorEl) {
    if (allNests.length === 0) {
      nestsMonitorEl.innerHTML = `<p style="color:var(--text-muted);">No Cozy Nests have been created on the platform yet.</p>`;
    } else {
      nestsMonitorEl.innerHTML = allNests
        .map(n => {
          const pct = Math.min(100, Math.round((n.saved / n.target) * 100));
          const isComp = pct >= 100;
          return `
          <div class="goal-card ${isComp ? "goal-completed-green" : ""}">
            <div class="budget-top">
              <strong>🪺 ${escapeHTML(n.title)} ${isComp ? "🏆🌟" : ""}</strong>
              <span class="badge ${isComp ? "badge-completed-green" : ""}">${pct}% Completed</span>
            </div>
            <div class="progress-track">
              <div class="progress-fill" style="width:${pct}%; background:${isComp ? "#10b981" : "linear-gradient(90deg, var(--primary), var(--accent-secondary))"};"></div>
            </div>
            <p class="treat-sub" style="margin-top:8px;">
              Members: <strong>${n.members.length} student(s)</strong> • Chat Messages: <strong>${(n.messages || []).length}</strong>
            </p>
          </div>
        `;
        })
        .join("");
    }
  }

  // Render Category Transaction Counts Breakdown
  const catBarsEl = document.getElementById("adminCategoryCountBars");
  if (catBarsEl) {
    const maxCount = Math.max(1, ...Object.values(categoryTxCounts));
    catBarsEl.innerHTML = Object.entries(categoryTxCounts)
      .map(([cat, count]) => {
        const pct = Math.round((count / maxCount) * 100);
        return `
        <div class="budget-item">
          <div class="budget-top">
            <strong>${cat}</strong>
            <span class="num-font">${count} transactions logged</span>
          </div>
          <div class="progress-track">
            <div class="progress-fill" style="width:${pct}%; background:linear-gradient(90deg, var(--primary), var(--accent-secondary));"></div>
          </div>
        </div>
      `;
      })
      .join("");
  }
}

// Admin Action 1: 💬 Msg
function openAdminMsgModal(targetEmail) {
  adminMsgTargetEmail = targetEmail;
  const u = getAllUsers().find(usr => usr.email.toLowerCase() === targetEmail.toLowerCase());
  document.getElementById("adminMsgTargetText").textContent =
    `Sending note to ${u ? u.name : targetEmail} (${targetEmail}):`;
  document.getElementById("adminMsgInput").value = "";
  document.getElementById("adminMsgModal").classList.remove("hidden");
}

function closeAdminMsgModal() {
  adminMsgTargetEmail = null;
  document.getElementById("adminMsgModal").classList.add("hidden");
}

function handleConfirmAdminMsg(e) {
  e.preventDefault();
  if (!adminMsgTargetEmail) return;
  const text = document.getElementById("adminMsgInput").value.trim();
  if (!text) return;

  const adminUser = getCurrentUser();
  const key = getUserScopedKey("admin_notes", adminMsgTargetEmail);
  let notes = [];
  try {
    notes = JSON.parse(localStorage.getItem(key) || "[]");
  } catch (err) {}

  notes.push({
    from: adminUser ? adminUser.name : "Admin",
    text,
    date: new Date().toISOString().split("T")[0]
  });
  localStorage.setItem(key, JSON.stringify(notes));

  closeAdminMsgModal();
  checkAdminMessagesBanner();
  showToast("💬 Admin note delivered!");
}

function checkAdminMessagesBanner() {
  const user = getCurrentUser();
  const banner = document.getElementById("adminInboxBanner");
  const textEl = document.getElementById("adminInboxText");
  if (!user || !banner || !textEl) return;

  const key = getUserScopedKey("admin_notes", user.email);
  let notes = [];
  try {
    notes = JSON.parse(localStorage.getItem(key) || "[]");
  } catch (err) {}

  if (notes.length > 0) {
    const latest = notes[notes.length - 1];
    textEl.textContent = `💬 Note from Admin (${latest.from}): "${latest.text}"`;
    banner.classList.remove("hidden");
  } else {
    banner.classList.add("hidden");
  }
}

function dismissAdminNotes() {
  const user = getCurrentUser();
  if (!user) return;
  localStorage.removeItem(getUserScopedKey("admin_notes", user.email));
  document.getElementById("adminInboxBanner").classList.add("hidden");
}

// Admin Action 2: 📥 Download Privacy-Safe User Summary CSV
function adminDownloadUserCSV(targetEmail) {
  const u = getAllUsers().find(usr => usr.email.toLowerCase() === targetEmail.toLowerCase());
  if (!u) return;

  const txs = getTransactionsForEmail(u.email);
  const goals = getGoalsForEmail(u.email);
  const completedGoals = goals.filter(g => Number(g.saved) >= Number(g.target) && Number(g.target) > 0).length;
  const nestsJoined = getAllCozyNests().filter(n =>
    n.members.some(m => m.toLowerCase() === u.email.toLowerCase())
  ).length;
  const joinedDateStr = u.createdAt ? formatReadableDate(u.createdAt.split("T")[0]) : "Recently";

  const csvRows = [
    ["Name", "Email / User ID", "Role", "Account Joined", "Transactions Logged", "Total Goals", "Completed Goals", "Cozy Nests Joined"],
    [
      `"${String(u.name).replace(/"/g, '""')}"`,
      `"${u.email}"`,
      isUserAdmin(u) ? "Admin" : "Student",
      joinedDateStr,
      txs.length,
      goals.length,
      completedGoals,
      nestsJoined
    ]
  ];

  const csvContent = csvRows.map(r => r.join(",")).join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", `PennyNest_UserSummary_${u.name.replace(/\s+/g, "_")}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  showToast(`📥 Downloaded summary CSV for ${u.name}!`);
}

function removeUserCompletelyByEmail(targetEmail) {
  const clean = targetEmail.toLowerCase();

  localStorage.removeItem(getUserScopedKey("tx", clean));
  localStorage.removeItem(getUserScopedKey("budgets", clean));
  localStorage.removeItem(getUserScopedKey("goals", clean));
  localStorage.removeItem(getUserScopedKey("sample_mode", clean));
  localStorage.removeItem(getUserScopedKey("admin_notes", clean));

  const updatedNests = getAllCozyNests()
    .map(n => {
      n.members = n.members.filter(m => m.toLowerCase() !== clean);
      return n;
    })
    .filter(n => n.members.length > 0);
  saveAllCozyNests(updatedNests);

  const updatedUsers = getAllUsers().filter(u => u.email.toLowerCase() !== clean);
  saveAllUsers(updatedUsers);
}

function deleteMyOwnProfile() {
  const user = getCurrentUser();
  if (!user) return;

  openCuteModal({
    icon: "🗑️🐼",
    title: "Delete Your Profile?",
    message: `Are you sure you want to permanently delete "${user.name}" (${user.email}) and all personal data?`,
    confirmText: "Yes, Delete Profile",
    cancelText: "Keep My Nest",
    isDanger: true,
    onConfirm: () => {
      removeUserCompletelyByEmail(user.email);
      showToast("🗑️ Your profile has been deleted.");
      lockApp();
    }
  });
}

function adminDeleteUserAccount(targetEmail) {
  const currentAdmin = getCurrentUser();
  if (!isUserAdmin(currentAdmin)) return;

  const targetUser = getAllUsers().find(u => u.email.toLowerCase() === targetEmail.toLowerCase());
  if (!targetUser) return;

  openCuteModal({
    icon: "👑🗑️",
    title: "Delete User Profile?",
    message: `Remove "${targetUser.name}" (${targetUser.email}) and all of their data from PennyNest?`,
    confirmText: "Delete User",
    cancelText: "Cancel",
    isDanger: true,
    onConfirm: () => {
      const deletingSelf = targetUser.email.toLowerCase() === currentAdmin.email.toLowerCase();
      removeUserCompletelyByEmail(targetUser.email);
      if (deletingSelf) {
        showToast("👑 Admin profile deleted.");
        lockApp();
      } else {
        showToast(`🗑️ Deleted profile for ${targetUser.name}.`);
        refreshAllViews();
      }
    }
  });
}

function lockApp() {
  sessionStorage.removeItem(ACTIVE_EMAIL_KEY);
  activeCozyNestId = null;
  configureAuthUI();

  document.getElementById("profileModal").style.display = "none";
  document.getElementById("adminInboxBanner").classList.add("hidden");
  document.querySelectorAll(".page-view").forEach(sec => (sec.style.display = "none"));
  document.getElementById("mainNavbar").style.display = "none";
  document.getElementById("welcomeScreen").style.display = "flex";
}

function resetCurrentUserData() {
  const user = getCurrentUser();
  if (!user) return;

  openCuteModal({
    icon: "🧹🐼",
    title: "Reset Personal Data?",
    message: `Clear all transactions, category budgets, and savings goals for ${user.name}? Your login profile will stay active.`,
    confirmText: "Yes, Reset Data",
    cancelText: "Cancel",
    isDanger: true,
    onConfirm: () => {
      localStorage.removeItem(getUserScopedKey("tx", user.email));
      localStorage.removeItem(getUserScopedKey("budgets", user.email));
      localStorage.removeItem(getUserScopedKey("goals", user.email));
      localStorage.removeItem(getUserScopedKey("sample_mode", user.email));
      showToast("🧹 Personal data reset!");
      refreshAllViews();
    }
  });
}

function toggleProfileModal() {
  const modal = document.getElementById("profileModal");
  const isOpening = modal.style.display !== "flex";
  modal.style.display = isOpening ? "flex" : "none";

  document.getElementById("avatarOptionsPopover").classList.add("hidden");
  document.getElementById("presetAvatarGrid").classList.add("hidden");

  if (isOpening) {
    rotatePandaMood();
  }
}

function rotatePandaMood() {
  const moodEl = document.getElementById("pandaMoodText");
  if (!moodEl) return;
  moodEl.textContent = pandaMoods[currentMoodIndex];
  currentMoodIndex = (currentMoodIndex + 1) % pandaMoods.length;
}

function triggerPandaJoy(event) {
  const avatar = document.getElementById("pandaAvatar");
  avatar.classList.remove("panda-bounce");
  void avatar.offsetWidth;
  avatar.classList.add("panda-bounce");

  rotatePandaMood();

  const emojis = ["🤎", "🎋", "🌿", "💚", "🐼"];
  const rect = avatar.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;

  for (let i = 0; i < 6; i++) {
    const span = document.createElement("span");
    span.className = "panda-float-emoji";
    span.textContent = emojis[Math.floor(Math.random() * emojis.length)];
    span.style.left = centerX + (Math.random() * 70 - 35) + "px";
    span.style.top = centerY + (Math.random() * 30 - 15) + "px";
    document.body.appendChild(span);
    setTimeout(() => span.remove(), 1400);
  }
}

// ==========================================
// 5. THEME & PAGE ROUTING
// ==========================================
function setTheme(themeName, save = true) {
  document.body.classList.remove("theme-sakura", "theme-sky");
  if (themeName === "sakura") document.body.classList.add("theme-sakura");
  if (themeName === "sky") document.body.classList.add("theme-sky");

  if (save) {
    localStorage.setItem(THEME_KEY, themeName);
    showToast(`🎨 Theme switched to ${themeName.toUpperCase()}!`);
  }
}

function openPage(pageId) {
  const user = getCurrentUser();
  if (pageId === "adminCommandPage" && !isUserAdmin(user)) {
    pageId = "dashboardPage";
  }

  document.querySelectorAll(".page-view").forEach(sec => {
    sec.style.display = "none";
  });
  document.querySelectorAll(".nav-links a").forEach(link => {
    link.classList.remove("active");
  });

  const target = document.getElementById(pageId);
  if (target) {
    target.style.display = "block";
    target.style.animation = "fadeIn 0.3s ease-out";
  }

  const navItem = document.getElementById("nav-" + pageId);
  if (navItem) navItem.classList.add("active");

  localStorage.setItem(PAGE_KEY, pageId);
  refreshAllViews();
}

// ==========================================
// 6. PER-USER & COZY NESTS STORAGE HELPERS
// ==========================================
function getUserScopedKey(prefix, email) {
  return `pennynest_${prefix}_${email.toLowerCase()}`;
}

function getTransactionsForEmail(email) {
  try {
    const raw = localStorage.getItem(getUserScopedKey("tx", email));
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function getTransactions() {
  const user = getCurrentUser();
  return user ? getTransactionsForEmail(user.email) : [];
}

function saveTransactions(list) {
  const user = getCurrentUser();
  if (!user) return;
  localStorage.setItem(getUserScopedKey("tx", user.email), JSON.stringify(list));
}

function getBudgets() {
  const user = getCurrentUser();
  if (!user) return {};
  const key = getUserScopedKey("budgets", user.email);
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  const defaults = {
    Food: 3000,
    Transport: 1500,
    Education: 2000,
    Utilities: 1000,
    Entertainment: 1200
  };
  localStorage.setItem(key, JSON.stringify(defaults));
  return defaults;
}

function getGoalsForEmail(email) {
  const key = getUserScopedKey("goals", email);
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  const defaults = [
    { id: 1, title: "Emergency Medical & Travel Fund", target: 5000, saved: 1500 },
    { id: 2, title: "New Coding Laptop SSD Upgrade", target: 4500, saved: 2200 }
  ];
  localStorage.setItem(key, JSON.stringify(defaults));
  return defaults;
}

function getGoals() {
  const user = getCurrentUser();
  return user ? getGoalsForEmail(user.email) : [];
}

function getAllCozyNests() {
  try {
    const raw = localStorage.getItem(COZY_NESTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function saveAllCozyNests(list) {
  localStorage.setItem(COZY_NESTS_KEY, JSON.stringify(list));
}

// ==========================================
// 7. DATE FORMATTER ("10 November") & DYNAMIC MONTH SAMPLE DATA
// ==========================================
function formatReadableDate(isoDateStr) {
  if (!isoDateStr) return "";
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const parts = isoDateStr.split("-");
  if (parts.length !== 3) return isoDateStr;
  const day = parseInt(parts[2], 10);
  const monthIdx = parseInt(parts[1], 10) - 1;
  if (isNaN(day) || monthIdx < 0 || monthIdx > 11) return isoDateStr;
  return `${day} ${months[monthIdx]}`;
}

function handleSaveTransaction(e) {
  e.preventDefault();
  const title = document.getElementById("txTitle").value.trim();
  const amount = parseFloat(document.getElementById("txAmount").value);
  const type = document.getElementById("txType").value;
  const category = document.getElementById("txCategory").value;
  const date = document.getElementById("txDate").value || new Date().toISOString().split("T")[0];

  if (!title || isNaN(amount) || amount <= 0) return;

  const list = getTransactions();
  list.unshift({ id: Date.now(), title, amount, type, category, date });
  saveTransactions(list);

  document.getElementById("quickAddForm").reset();
  document.getElementById("txDate").value = new Date().toISOString().split("T")[0];

  const msg = document.getElementById("saveFeedback");
  msg.style.display = "block";
  setTimeout(() => { msg.style.display = "none"; }, 2500);

  refreshAllViews();
}

function loadSampleData() {
  const user = getCurrentUser();
  if (!user) return;

  const today = new Date();
  const yyyyMm = today.toISOString().slice(0, 7);
  const dayStr = String(today.getDate()).padStart(2, "0");

  const sample = [
    { id: Date.now() + 1, title: "Monthly Allowance from Home", amount: 8000, type: "income", category: "Allowance", date: `${yyyyMm}-${dayStr}`, isSample: true, sampleDay: dayStr },
    { id: Date.now() + 2, title: "University Canteen Lunch", amount: 180, type: "expense", category: "Food", date: `${yyyyMm}-${dayStr}`, isSample: true, sampleDay: dayStr },
    { id: Date.now() + 3, title: "Rickshaw & Bus Commute", amount: 120, type: "expense", category: "Transport", date: `${yyyyMm}-${dayStr}`, isSample: true, sampleDay: dayStr },
    { id: Date.now() + 4, title: "Data Pack Recharge", amount: 350, type: "expense", category: "Utilities", date: `${yyyyMm}-${dayStr}`, isSample: true, sampleDay: dayStr },
    { id: Date.now() + 5, title: "Photocopy & Lab Sheets", amount: 220, type: "expense", category: "Education", date: `${yyyyMm}-${dayStr}`, isSample: true, sampleDay: dayStr }
  ];

  saveTransactions(sample);
  localStorage.setItem(getUserScopedKey("sample_mode", user.email), "true");
  showToast("📥 Sample student data loaded! Pick any month in the calendar to view it.");
  refreshAllViews();
}

function getLedgerTransactionsWithDynamicSampleMonth(monthFilter) {
  const rawList = getTransactions();
  if (!monthFilter) return rawList;

  const [yrStr, moStr] = monthFilter.split("-");
  const yr = parseInt(yrStr, 10);
  const mo = parseInt(moStr, 10);
  const maxDaysInMonth = (!isNaN(yr) && !isNaN(mo)) ? new Date(yr, mo, 0).getDate() : 28;

  return rawList.map(tx => {
    if (tx.isSample) {
      const origDay = parseInt(tx.sampleDay || (tx.date ? tx.date.split("-")[2] : "10"), 10) || 10;
      const safeDay = String(Math.min(origDay, maxDaysInMonth)).padStart(2, "0");
      return {
        ...tx,
        date: `${monthFilter}-${safeDay}`
      };
    }
    return tx;
  });
}

function downloadTransactionsByType() {
  const typeFilter = document.getElementById("filterType").value;
  const catFilter = document.getElementById("filterCategory").value;
  const monthFilter = document.getElementById("filterMonth").value;
  const query = (document.getElementById("searchInput").value || "").toLowerCase();

  const sourceList = getLedgerTransactionsWithDynamicSampleMonth(monthFilter);

  const filteredList = sourceList.filter(tx => {
    const matchesText = tx.title.toLowerCase().includes(query);
    const matchesCat = catFilter === "All" || tx.category === catFilter;
    const matchesMonth = !monthFilter || (tx.date && tx.date.startsWith(monthFilter));
    const matchesType = typeFilter === "All" || tx.type === typeFilter;
    return matchesText && matchesCat && matchesMonth && matchesType;
  });

  const typeLabel =
    typeFilter === "income"
      ? "Income"
      : typeFilter === "expense"
      ? "Expense"
      : "All_Types";

  if (filteredList.length === 0) {
    openCuteModal({
      icon: "📭",
      title: "No Records Found",
      message: `There are no ${typeLabel.replace("_", " ")} transactions matching your filter to download!`,
      confirmText: "Got It",
      showCancel: false
    });
    return;
  }

  let totalIncome = 0;
  let totalExpense = 0;

  const csvRows = [
    ["Date", "Description", "Category", "Type", "Amount (BDT)"]
  ];

  filteredList.forEach(tx => {
    const cleanTitle = `"${String(tx.title).replace(/"/g, '""')}"`;
    const signedAmount = tx.type === "income" ? `+${tx.amount}` : `${tx.amount}`;
    csvRows.push([
      formatReadableDate(tx.date),
      cleanTitle,
      tx.category,
      tx.type.toUpperCase(),
      signedAmount
    ]);

    if (tx.type === "income") totalIncome += Number(tx.amount);
    else totalExpense += Number(tx.amount);
  });

  csvRows.push([]);
  if (typeFilter === "All" || typeFilter === "income") {
    csvRows.push(["SUMMARY", "", "", "Total Income", `${totalIncome} BDT`]);
  }
  if (typeFilter === "All" || typeFilter === "expense") {
    csvRows.push(["SUMMARY", "", "", "Total Expense", `${totalExpense} BDT`]);
  }
  if (typeFilter === "All") {
    csvRows.push(["SUMMARY", "", "", "Net Balance", `${totalIncome - totalExpense} BDT`]);
  }

  const csvContent = csvRows.map(r => r.join(",")).join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", `PennyNest_${typeLabel}_Statement.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  showToast(`📥 Downloaded ${typeLabel.replace("_", " ")} statement!`);
}

// ==========================================
// 8. CUTE MODAL CONFIRMATIONS FOR ALL RESET/DELETE BUTTONS
// ==========================================
function deleteTransaction(id) {
  const tx = getTransactions().find(item => item.id === id);
  const label = tx ? `"${tx.title}" (${tx.amount} BDT)` : "this transaction";

  openCuteModal({
    icon: "🧾🗑️",
    title: "Delete Transaction?",
    message: `Are you sure you want to remove ${label} from your ledger?`,
    confirmText: "Delete",
    cancelText: "Keep",
    isDanger: true,
    onConfirm: () => {
      const updated = getTransactions().filter(item => item.id !== id);
      saveTransactions(updated);
      showToast("🗑️ Transaction deleted.");
      refreshAllViews();
    }
  });
}

function clearAllHistory() {
  openCuteModal({
    icon: "🧹📋",
    title: "Clear All Transaction History?",
    message: "This will remove all logged income and expense entries from your ledger. This action cannot be undone!",
    confirmText: "Yes, Clear All",
    cancelText: "Cancel",
    isDanger: true,
    onConfirm: () => {
      const user = getCurrentUser();
      saveTransactions([]);
      if (user) localStorage.removeItem(getUserScopedKey("sample_mode", user.email));
      showToast("🗑️ All transaction history cleared.");
      refreshAllViews();
    }
  });
}

function deleteBudgetCategory(categoryName) {
  const user = getCurrentUser();
  if (!user) return;

  openCuteModal({
    icon: "📊🗑️",
    title: "Remove Budget Limit?",
    message: `Remove the monthly spending cap for "${categoryName}"?`,
    confirmText: "Remove Cap",
    cancelText: "Cancel",
    isDanger: true,
    onConfirm: () => {
      const budgets = getBudgets();
      if (budgets[categoryName] !== undefined) {
        delete budgets[categoryName];
        localStorage.setItem(getUserScopedKey("budgets", user.email), JSON.stringify(budgets));
        showToast(`🗑️ Removed budget limit for "${categoryName}".`);
        refreshAllViews();
      }
    }
  });
}

function deleteGoal(id) {
  const user = getCurrentUser();
  if (!user) return;
  const goal = getGoals().find(g => g.id === id);
  const label = goal ? `"${goal.title}"` : "this savings goal";

  openCuteModal({
    icon: "🎯🗑️",
    title: "Delete Savings Goal?",
    message: `Are you sure you want to delete the goal ${label}?`,
    confirmText: "Delete Goal",
    cancelText: "Keep Goal",
    isDanger: true,
    onConfirm: () => {
      const updated = getGoals().filter(g => g.id !== id);
      localStorage.setItem(getUserScopedKey("goals", user.email), JSON.stringify(updated));
      showToast("🗑️ Savings goal deleted.");
      refreshAllViews();
    }
  });
}

function deleteActiveCozyNest() {
  if (!activeCozyNestId) return;
  const nest = getAllCozyNests().find(n => n.id === activeCozyNestId);
  if (!nest) return;

  openCuteModal({
    icon: "🪺🗑️",
    title: "Delete Cozy Nest?",
    message: `Are you sure you want to delete the shared Cozy Nest "${nest.title}" for all members?`,
    confirmText: "Delete Cozy Nest",
    cancelText: "Cancel",
    isDanger: true,
    onConfirm: () => {
      const updated = getAllCozyNests().filter(n => n.id !== activeCozyNestId);
      saveAllCozyNests(updated);
      activeCozyNestId = null;
      showToast("🗑️ Cozy Nest deleted.");
      refreshAllViews();
    }
  });
}

// ==========================================
// 9. BUDGETS, CUSTOM-AMOUNT GOALS & TREAT CHECKER
// ==========================================
function handleUpdateBudget(e) {
  e.preventDefault();
  const user = getCurrentUser();
  if (!user) return;
  const cat = document.getElementById("budgetCategory").value;
  const limit = parseFloat(document.getElementById("budgetLimit").value);
  if (isNaN(limit) || limit <= 0) return;

  const budgets = getBudgets();
  budgets[cat] = limit;
  localStorage.setItem(getUserScopedKey("budgets", user.email), JSON.stringify(budgets));
  document.getElementById("budgetForm").reset();
  showToast(`⚙️ Budget limit for "${cat}" updated!`);
  refreshAllViews();
}

function handleCreateGoal(e) {
  e.preventDefault();
  const user = getCurrentUser();
  if (!user) return;
  const title = document.getElementById("goalTitle").value.trim();
  const target = parseFloat(document.getElementById("goalTarget").value);
  const saved = parseFloat(document.getElementById("goalSaved").value) || 0;

  if (!title || isNaN(target) || target <= 0) return;

  const goals = getGoals();
  const isComp = saved >= target;
  goals.push({
    id: Date.now(),
    title,
    target,
    saved: Math.min(target, saved),
    completedAt: isComp ? formatReadableDate(new Date().toISOString().split("T")[0]) : null
  });
  localStorage.setItem(getUserScopedKey("goals", user.email), JSON.stringify(goals));
  document.getElementById("goalForm").reset();

  if (isComp) {
    triggerGoalCelebration(title);
  } else {
    showToast("🎯 New savings goal added to your Nest!");
  }
  refreshAllViews();
}

function handleCustomGoalDeposit(id, goalTitle) {
  const user = getCurrentUser();
  if (!user) return;
  const inputEl = document.getElementById(`goalDepositInput_${id}`);
  const amount = parseFloat(inputEl ? inputEl.value : 0);

  if (isNaN(amount) || amount <= 0) {
    openCuteModal({
      icon: "🐼💡",
      title: "Enter an Amount",
      message: "Please type a valid BDT amount in the box before clicking + Add!",
      confirmText: "Okay",
      showCancel: false
    });
    return;
  }

  let justCompleted = false;
  const goals = getGoals().map(g => {
    if (g.id === id) {
      const oldSaved = g.saved;
      g.saved = Math.min(g.target, g.saved + amount);
      if (oldSaved < g.target && g.saved >= g.target) {
        justCompleted = true;
        g.completedAt = formatReadableDate(new Date().toISOString().split("T")[0]);
      }
    }
    return g;
  });
  localStorage.setItem(getUserScopedKey("goals", user.email), JSON.stringify(goals));

  if (justCompleted) {
    triggerGoalCelebration(goalTitle);
  } else {
    showToast(`🏡 Added ${amount.toLocaleString()} BDT to "${goalTitle}"!`);
  }

  refreshAllViews();
}

function checkTreatAffordability() {
  const price = parseFloat(document.getElementById("treatPriceInput").value);
  const resultEl = document.getElementById("treatResultMsg");
  if (isNaN(price) || price <= 0) {
    resultEl.textContent = "Please type a valid price first!";
    resultEl.style.color = "var(--red)";
    return;
  }

  const list = getTransactions();
  let income = 0, expense = 0;
  list.forEach(tx => {
    if (tx.type === "income") income += Number(tx.amount);
    else expense += Number(tx.amount);
  });
  const balance = income - expense;
  const safeDaily = Math.max(0, Math.round(balance / 15));

  if (price <= safeDaily * 0.6) {
    resultEl.textContent = "🍵 Go for it! Totally safe for today's daily allowance.";
    resultEl.style.color = "var(--green)";
  } else if (price <= safeDaily) {
    resultEl.textContent = "⚠️ You can afford it, but it uses most of today's safe spend!";
    resultEl.style.color = "#d97706";
  } else {
    resultEl.textContent = `🚨 Hold on! That costs more than your safe daily limit (${safeDaily} BDT)!`;
    resultEl.style.color = "var(--red)";
  }
}

// ==========================================
// 10. PAGE 5: COZY NESTS (CLICK-TO-CLOSE TOGGLE & AVATAR-ONLY CHAT)
// ==========================================
function searchExistingUsersForNest() {
  const user = getCurrentUser();
  if (!user) return;
  const query = (document.getElementById("memberSearchInput").value || "").trim().toLowerCase();
  const resultsBox = document.getElementById("userSearchResults");

  if (!query) {
    resultsBox.innerHTML = "";
    return;
  }

  const matches = getAllUsers().filter(
    u =>
      u.email.toLowerCase().includes(query) ||
      u.name.toLowerCase().includes(query)
  );

  if (matches.length === 0) {
    resultsBox.innerHTML = `<div class="user-search-item"><span class="treat-sub">No registered user found matching "${escapeHTML(query)}"</span></div>`;
    return;
  }

  resultsBox.innerHTML = matches
    .map(u => {
      const alreadyAdded = pendingNestMembers.includes(u.email.toLowerCase());
      return `
      <div class="user-search-item">
        <div>
          <strong>${escapeHTML(u.name)}</strong>
          <span class="treat-sub">(${escapeHTML(u.email)})</span>
        </div>
        ${
          alreadyAdded
            ? `<span class="badge">Added ✓</span>`
            : `<button type="button" class="btn btn-outline btn-sm" onclick="addMemberToPendingNest('${escapeHTML(u.email)}')">+ Add</button>`
        }
      </div>
    `;
    })
    .join("");
}

function addMemberToPendingNest(email) {
  const cleanEmail = email.toLowerCase();
  if (!pendingNestMembers.includes(cleanEmail)) {
    pendingNestMembers.push(cleanEmail);
  }
  document.getElementById("memberSearchInput").value = "";
  document.getElementById("userSearchResults").innerHTML = "";
  renderPendingNestMembersChips();
}

function removeMemberFromPendingNest(email) {
  const user = getCurrentUser();
  if (user && email.toLowerCase() === user.email.toLowerCase()) return;
  pendingNestMembers = pendingNestMembers.filter(m => m !== email.toLowerCase());
  renderPendingNestMembersChips();
}

function renderPendingNestMembersChips() {
  const user = getCurrentUser();
  if (!user) return;
  if (!pendingNestMembers.includes(user.email.toLowerCase())) {
    pendingNestMembers.unshift(user.email.toLowerCase());
  }

  const allUsers = getAllUsers();
  const container = document.getElementById("selectedNestMembers");
  if (!container) return;

  container.innerHTML = pendingNestMembers
    .map(email => {
      const found = allUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
      const label = found ? `${found.name} (${found.email})` : email;
      const isCreator = email.toLowerCase() === user.email.toLowerCase();
      return `
      <span class="member-pill">
        <span>🐼 ${escapeHTML(label)}</span>
        ${
          isCreator
            ? `<small>(You)</small>`
            : `<button type="button" onclick="removeMemberFromPendingNest('${escapeHTML(email)}')">✕</button>`
        }
      </span>
    `;
    })
    .join("");
}

function handleCreateCozyNest(e) {
  e.preventDefault();
  const user = getCurrentUser();
  if (!user) return;

  const title = document.getElementById("nestTitleInput").value.trim();
  const target = parseFloat(document.getElementById("nestTargetInput").value);
  if (!title || isNaN(target) || target <= 0) return;

  if (!pendingNestMembers.includes(user.email.toLowerCase())) {
    pendingNestMembers.unshift(user.email.toLowerCase());
  }

  const allNests = getAllCozyNests();
  const newNest = {
    id: Date.now(),
    title,
    target,
    saved: 0,
    members: [...pendingNestMembers],
    messages: [
      {
        senderName: "Penny Panda 🐼",
        senderEmail: "system",
        senderAvatar: "🐼",
        text: `Welcome to "${title}"! Contribute any amount toward your ${target.toLocaleString()} BDT goal and chat with your nest mates! 🪺`
      }
    ]
  };

  allNests.unshift(newNest);
  saveAllCozyNests(allNests);

  document.getElementById("createNestForm").reset();
  pendingNestMembers = [user.email.toLowerCase()];
  activeCozyNestId = newNest.id;

  showToast(`🪺 Cozy Nest "${title}" created!`);
  refreshAllViews();
}

// CLICK-TO-CLOSE TOGGLE: Clicking the same active Cozy Nest a second time closes the chat panel without deleting the nest
function selectCozyNest(nestId) {
  if (activeCozyNestId === nestId) {
    activeCozyNestId = null;
  } else {
    activeCozyNestId = nestId;
  }
  renderCozyNestsPage();
}

function renderCozyNestsPage() {
  const user = getCurrentUser();
  if (!user) return;

  renderPendingNestMembersChips();

  const allUsers = getAllUsers();
  const myNests = getAllCozyNests().filter(n =>
    n.members.some(m => m.toLowerCase() === user.email.toLowerCase())
  );

  const listEl = document.getElementById("myCozyNestsList");
  if (!listEl) return;

  if (myNests.length === 0) {
    listEl.innerHTML = `<p style="color:var(--text-muted);">You aren't in any Cozy Nests yet. Create one above and search friends by Name or Email/ID!</p>`;
  } else {
    listEl.innerHTML = myNests
      .map(n => {
        const pct = Math.min(100, Math.round((n.saved / n.target) * 100));
        const isCompleted = pct >= 100;
        const isSelected = n.id === activeCozyNestId;
        return `
        <div class="goal-card ${isCompleted ? "goal-completed-green" : ""}" style="cursor:pointer; border-color:${isSelected ? "var(--primary)" : isCompleted ? "#10b981" : "var(--border)"};" onclick="selectCozyNest(${n.id})">
          <div class="budget-top">
            <strong>🪺 ${escapeHTML(n.title)} ${isCompleted ? "🏆🌟" : "🐼"}</strong>
            <span class="badge ${isCompleted ? "badge-completed-green" : ""}">${isCompleted ? "🏆 100% Completed" : pct + "%"}</span>
          </div>
          <div class="progress-track">
            <div class="progress-fill" style="width:${pct}%; background:${isCompleted ? "#10b981" : "linear-gradient(90deg, var(--primary), var(--accent-secondary))"};"></div>
          </div>
          <p class="treat-sub" style="margin-top:8px;">
            Saved: <strong>${n.saved.toLocaleString()} / ${n.target.toLocaleString()} BDT</strong> • ${n.members.length} Nest Mate(s)
          </p>
        </div>
      `;
      })
      .join("");
  }

  renderActiveCozyNestDetail(allUsers);
}

function renderActiveCozyNestDetail(allUsers) {
  const noView = document.getElementById("noNestSelectedView");
  const detailView = document.getElementById("activeNestDetailView");
  if (!noView || !detailView) return;

  const nest = getAllCozyNests().find(n => n.id === activeCozyNestId);
  if (!nest) {
    noView.classList.remove("hidden");
    detailView.classList.add("hidden");
    return;
  }

  noView.classList.add("hidden");
  detailView.classList.remove("hidden");

  const pct = Math.min(100, Math.round((nest.saved / nest.target) * 100));
  const isCompleted = pct >= 100;

  document.getElementById("activeNestName").textContent = `🪺 ${nest.title}`;
  const pctBadge = document.getElementById("activeNestPctBadge");
  pctBadge.textContent = isCompleted ? `🏆 100% Completed` : `${pct}%`;
  pctBadge.className = isCompleted ? "welcome-badge badge-completed-green" : "welcome-badge";

  document.getElementById("activeNestAmountText").textContent = `${nest.saved.toLocaleString()} / ${nest.target.toLocaleString()} BDT`;
  const progBar = document.getElementById("activeNestProgressBar");
  progBar.style.width = `${pct}%`;
  progBar.style.background = isCompleted ? "#10b981" : "linear-gradient(90deg, var(--primary), var(--accent-secondary))";

  const memberNames = nest.members
    .map(email => {
      const u = allUsers.find(usr => usr.email.toLowerCase() === email.toLowerCase());
      return u ? `${u.name} (${u.email})` : email;
    })
    .join(" • ");
  document.getElementById("activeNestMembersLine").textContent = `Nest Mates: ${memberNames}`;

  // PROFILE-AVATAR-ONLY CHAT RENDERING (NO TEXT NAME SHOWN IN CHAT BUBBLES)
  const user = getCurrentUser();
  const chatBox = document.getElementById("nestChatMessages");
  chatBox.innerHTML = (nest.messages || [])
    .map(m => {
      const isMe = user && m.senderEmail && m.senderEmail.toLowerCase() === user.email.toLowerCase();
      const matchedSender = allUsers.find(
        u => m.senderEmail && u.email.toLowerCase() === m.senderEmail.toLowerCase()
      );
      const avatarRaw = matchedSender
        ? matchedSender.avatar
        : m.senderAvatar || "🐼";
      const avatarHTML = renderAvatarVisual(avatarRaw);

      return `
      <div class="nest-chat-row ${isMe ? "me" : "other"}">
        <div class="nest-chat-avatar-only">${avatarHTML}</div>
        <div class="ai-msg ${isMe ? "user" : "bot"}">
          ${escapeHTML(m.text)}
        </div>
      </div>
    `;
    })
    .join("");
  chatBox.scrollTop = chatBox.scrollHeight;
}

function handleContributeToNest(e) {
  e.preventDefault();
  const user = getCurrentUser();
  if (!user || !activeCozyNestId) return;

  const input = document.getElementById("nestContributeInput");
  const amount = parseFloat(input.value);
  if (isNaN(amount) || amount <= 0) return;

  let justCompleted = false;
  let completedTitle = "";
  const nests = getAllCozyNests().map(n => {
    if (n.id === activeCozyNestId) {
      const oldSaved = n.saved;
      n.saved = Math.min(n.target, n.saved + amount);
      completedTitle = n.title;
      if (oldSaved < n.target && n.saved >= n.target) {
        justCompleted = true;
        n.completedAt = formatReadableDate(new Date().toISOString().split("T")[0]);
      }
      n.messages.push({
        senderEmail: user.email,
        senderAvatar: user.avatar || "🐼",
        text: `Contributed +${amount.toLocaleString()} BDT to our Cozy Nest! 💚`
      });
    }
    return n;
  });

  saveAllCozyNests(nests);
  input.value = "";

  if (justCompleted) {
    triggerGoalCelebration(completedTitle);
  } else {
    showToast(`🪺 Added ${amount.toLocaleString()} BDT to "${completedTitle}"!`);
  }
  refreshAllViews();
}

function handleInviteUserToActiveNest() {
  if (!activeCozyNestId) return;
  const query = (document.getElementById("inviteExistingUserInput").value || "").trim().toLowerCase();
  if (!query) return;

  const foundUser = getAllUsers().find(
    u => u.email.toLowerCase() === query || u.name.toLowerCase() === query
  );

  if (!foundUser) {
    openCuteModal({
      icon: "🔍🐼",
      title: "User Not Found",
      message: "No existing PennyNest user found with that Name or Email/ID!",
      confirmText: "Okay",
      showCancel: false
    });
    return;
  }

  const nests = getAllCozyNests();
  const idx = nests.findIndex(n => n.id === activeCozyNestId);
  if (idx === -1) return;

  if (nests[idx].members.includes(foundUser.email.toLowerCase())) {
    openCuteModal({
      icon: "🪺🐼",
      title: "Already a Nest Mate",
      message: `${foundUser.name} is already a member of this Cozy Nest!`,
      confirmText: "Got It",
      showCancel: false
    });
    return;
  }

  nests[idx].members.push(foundUser.email.toLowerCase());
  nests[idx].messages.push({
    senderEmail: foundUser.email,
    senderAvatar: foundUser.avatar || "🐼",
    text: `Joined the Cozy Nest! 🌷`
  });

  saveAllCozyNests(nests);
  document.getElementById("inviteExistingUserInput").value = "";
  showToast(`🐼 Added ${foundUser.name} to the Cozy Nest!`);
  renderCozyNestsPage();
}

function handleSendNestChatMessage(e) {
  e.preventDefault();
  const user = getCurrentUser();
  if (!user || !activeCozyNestId) return;

  const input = document.getElementById("nestChatInput");
  const text = input.value.trim();
  if (!text) return;

  const nests = getAllCozyNests();
  const idx = nests.findIndex(n => n.id === activeCozyNestId);
  if (idx === -1) return;

  nests[idx].messages.push({
    senderEmail: user.email,
    senderAvatar: user.avatar || "🐼",
    text
  });

  saveAllCozyNests(nests);
  input.value = "";
  renderCozyNestsPage();
}

// ==========================================
// 11. PENNY AI ASSISTANT
// ==========================================
function initAiChatGreeting() {
  const box = document.getElementById("aiChatMessages");
  const user = getCurrentUser();
  if (!box) return;
  box.innerHTML = `
    <div class="ai-msg bot">
      <strong>Penny AI 🐼:</strong> Hi ${user ? escapeHTML(user.name) : "friend"}! Type <strong>"guide me"</strong> for a full tour of PennyAI & PennyNest, say hi, or ask me about your allowance, daily spend, treats, hostel/mess budget, savings goals, or Cozy Nests! 🌿
    </div>
  `;
}

function sendPresetAiPrompt(text) {
  appendAiChatBubble(text, "user");
  const reply = generatePennyAiReply(text);
  setTimeout(() => appendAiChatBubble(reply, "bot"), 180);
}

function handleAiChatSubmit(e) {
  e.preventDefault();
  const input = document.getElementById("aiChatInput");
  const query = input.value.trim();
  if (!query) return;

  appendAiChatBubble(query, "user");
  input.value = "";
  const reply = generatePennyAiReply(query);
  setTimeout(() => appendAiChatBubble(reply, "bot"), 180);
}

function appendAiChatBubble(text, senderType) {
  const box = document.getElementById("aiChatMessages");
  if (!box) return;
  const div = document.createElement("div");
  div.className = `ai-msg ${senderType}`;
  div.innerHTML = senderType === "bot" ? `<strong>Penny AI 🐼:</strong> ${text}` : escapeHTML(text);
  box.appendChild(div);
  box.scrollTop = box.scrollHeight;
}

function generatePennyAiReply(rawInput) {
  const q = rawInput.toLowerCase().trim();
  const user = getCurrentUser();
  const firstName = user ? user.name.split(" ")[0] : "friend";

  const txs = getTransactions();
  const budgets = getBudgets();
  const goals = getGoals();
  const myNests = getAllCozyNests().filter(
    n => user && n.members.includes(user.email.toLowerCase())
  );

  let income = 0, expense = 0;
  const catTotals = {};
  txs.forEach(tx => {
    if (tx.type === "income") {
      income += Number(tx.amount);
    } else {
      expense += Number(tx.amount);
      catTotals[tx.category] = (catTotals[tx.category] || 0) + Number(tx.amount);
    }
  });

  const balance = income - expense;
  const safeDaily = Math.max(0, Math.round(balance / 15));
  const safeWeekly = safeDaily * 7;

  if (
    q.includes("guide") ||
    q.includes("pennyai") ||
    q.includes("penny ai") ||
    q.includes("pennynest") ||
    q.includes("penny nest") ||
    q.includes("how to use") ||
    q.includes("how do i use") ||
    q.includes("tutorial") ||
    q.includes("walkthrough") ||
    q.includes("what can you do") ||
    q.includes("what can i ask") ||
    q.includes("features") ||
    q.includes("help") ||
    q.includes("explain the app")
  ) {
    return `Here is your complete guide to <strong>Penny AI & PennyNest</strong> 🧭🐼:<br>
    • <strong>Dashboard:</strong> Log quick income/expenses, check your Safe Daily Spend (${safeDaily} BDT/day), test snacks in the Guilt-Free Treat Checker, or load sample student data!<br>
    • <strong>Transactions:</strong> Filter by any month in the calendar, category, or type, and download CSV statements with dates formatted like <em>10 November</em>.<br>
    • <strong>Budgets:</strong> Set monthly category caps and watch live Panda mood reactions.<br>
    • <strong>Savings Goals:</strong> Deposit any custom BDT amount to unlock the bouncing <strong>Happy Panda + Confetti</strong> at 100% and preserve it in your green Completed History Vault!<br>
    • <strong>Cozy Nests:</strong> Search friends by Name or Email/ID to save together & chat!<br>
    • <strong>Ask Me Anything On-Topic:</strong> Try asking about your balance, daily spend, category totals, hostel/mess tips, bKash/Nagad tracking, textbook savings, or the 50/30/20 rule!`;
  }

  if (/^(hi|hello|hey|hiya|yo|assalamu|salam|namaste|good morning|good afternoon|good evening|morning|evening|sup|hola)\b/.test(q)) {
    return `Hello ${escapeHTML(firstName)}! 🐼🌿 Welcome to your cozy financial nest! Your available balance is <strong>${balance.toLocaleString()} BDT</strong> and your safe daily allowance is <strong>${safeDaily.toLocaleString()} BDT/day</strong>. Ask me anything about PennyNest or your student budget!`;
  }
  if (q.includes("who are you") || q.includes("your name") || q.includes("what are you")) {
    return `I'm <strong>Penny AI 🐼</strong>, your mindful student finance assistant inside PennyNest! I help you track allowances, test impulse treats, monitor category budgets, and celebrate savings goals.`;
  }
  if (q.includes("how are you") || q.includes("how r u") || q.includes("how's it going") || q.includes("what's up")) {
    return `I'm munching fresh bamboo and guarding your pennies! 🎋 You currently have <strong>${balance.toLocaleString()} BDT</strong> in your nest. How are you feeling about your budget today?`;
  }
  if (q.includes("thank") || q.includes("thx") || q.includes("tysm") || q.includes("awesome") || q.includes("smart") || q.includes("cute") || q.includes("love you")) {
    return `Aww, thank you ${escapeHTML(firstName)}! 🤎🐼🌟 Penny Panda and I are always cheering for your financial goals!`;
  }
  if (q.includes("bye") || q.includes("goodbye") || q.includes("good night") || q.includes("see you") || q.includes("cya")) {
    return `Bye-bye ${escapeHTML(firstName)}! 🏡 Tap the round avatar icon on the top-right if you want to lock your nest before leaving! 💚`;
  }

  if (q.includes("avatar") || q.includes("profile picture") || q.includes("photo") || q.includes("dp") || q.includes("icon")) {
    return `Click the <strong>round profile icon at the top-right</strong>, then tap your <strong>profile circle</strong> inside the modal! Two options will pop up: <em>Choose Avatar</em> or <em>Personal Photo</em>! 📷🐼`;
  }
  if (q.includes("delete profile") || q.includes("remove account") || q.includes("delete account") || q.includes("reset")) {
    return `Open your profile modal from the top-right round icon and click <strong>"🧹 Reset My Personal Data"</strong> or <strong>"🗑️ Delete My Profile"</strong>—every reset or delete action uses a cozy confirmation modal!`;
  }
  if (q.includes("pin") || q.includes("passcode") || q.includes("password") || q.includes("lock") || q.includes("switch account") || q.includes("logout")) {
    return `Your nest is protected by a 4-digit passcode! 🔐 To lock your nest or switch accounts, click the round profile icon on the top-right and select <strong>"Switch Account / Lock Nest"</strong>.`;
  }
  if (q.includes("theme") || q.includes("color") || q.includes("matcha") || q.includes("sakura") || q.includes("sky") || q.includes("dots") || q.includes("vibe")) {
    return `Click any of the <strong>3 pastel dots</strong> in the top navbar (Matcha Mint 🍵, Sakura Pink 🌸, or Cotton Candy Sky ☁️) right beside your round profile icon!`;
  }

  if (q.includes("sample") || q.includes("demo") || q.includes("full year") || q.includes("12 month") || q.includes("each month")) {
    return `Click the <strong>"📥 Load Sample Data"</strong> button at the top of the Dashboard! Whenever you switch months in the Transaction Ledger calendar, those sample entries automatically appear for the selected month! 📅`;
  }
  if (q.includes("download") || q.includes("csv") || q.includes("export") || q.includes("statement") || q.includes("date")) {
    return `Go to the <strong>Transactions</strong> page and select <em>All Types</em>, <em>Income (+)</em>, or <em>Expense (-)</em> in the dropdown—then click the Download CSV button to export that exact type! Dates are displayed cleanly like <strong>10 November</strong>. 📥`;
  }

  const categoryMap = {
    Food: ["food", "snack", "lunch", "dinner", "breakfast", "canteen", "restaurant", "meal", "burger", "pizza", "biryani"],
    Transport: ["transport", "fare", "rickshaw", "bus", "uber", "cng", "commute", "travel", "ticket"],
    Education: ["education", "book", "study", "tuition", "stationery", "photocopy", "lab", "pen", "notebook", "course", "exam", "semester", "pdf"],
    Utilities: ["utilities", "utility", "mobile", "internet", "wifi", "data", "recharge", "phone", "bill", "electricity"],
    Entertainment: ["entertainment", "outing", "movie", "game", "fun", "hangout", "concert", "party", "netflix"]
  };

  for (const [catName, keywords] of Object.entries(categoryMap)) {
    if (keywords.some(kw => q.includes(kw)) && (q.includes("spend") || q.includes("spent") || q.includes("how much") || q.includes("budget") || q.includes("limit") || q.includes("cost") || q.includes("save"))) {
      const spent = catTotals[catName] || 0;
      const limit = budgets[catName];
      if (limit) {
        const left = Math.max(0, limit - spent);
        const pct = Math.round((spent / limit) * 100);
        return `In <strong>${catName}</strong>, you have spent <strong>${spent.toLocaleString()} BDT</strong> out of your ${limit.toLocaleString()} BDT monthly limit (${pct}%). You have <strong>${left.toLocaleString()} BDT</strong> remaining! 📊`;
      }
      return `You have spent <strong>${spent.toLocaleString()} BDT</strong> on <strong>${catName}</strong> so far. You can set a monthly cap for ${catName} on the Budgets page! ⚙️`;
    }
  }

  if (q.includes("hostel") || q.includes("mess") || q.includes("dorm") || q.includes("roommate") || q.includes("hall")) {
    return `🏡 <strong>Hostel & Mess Budget Tip:</strong> Pay your fixed mess/meal charge at the start of the month and log it under <em>Food</em>, or create a shared <strong>Cozy Nest</strong> with your roommates to track shared room utilities and groceries together!`;
  }
  if (q.includes("bkash") || q.includes("nagad") || q.includes("rocket") || q.includes("mobile banking") || q.includes("cashout") || q.includes("wallet")) {
    return `📱 <strong>Mobile Wallet Tip:</strong> Cash-out fees on bKash/Nagad add up fast over a semester! Try withdrawing once a week or paying campus merchants via direct QR scan, and log any transfer fee under <em>Utilities</em>.`;
  }
  if (q.includes("scholarship") || q.includes("stipend") || q.includes("tuition") || q.includes("part time") || q.includes("tutoring") || q.includes("freelanc")) {
    return `🎓 <strong>Student Income Tip:</strong> Whenever you receive tutoring pay, freelancing income, or a scholarship stipend, log it as <strong>Income (+)</strong> under <em>Allowance</em> and immediately move 20% into a <strong>Savings Goal</strong>!`;
  }
  if (q.includes("textbook") || q.includes("photocopy") || q.includes("library") || q.includes("print")) {
    return `📚 <strong>Study Savings Tip:</strong> Borrow core textbooks from seniors or the university library, share PDFs for reference chapters, and pool printing orders with classmates to lower per-page costs!`;
  }

  if (
    q.includes("treat") ||
    q.includes("coffee") ||
    q.includes("boba") ||
    q.includes("tea") ||
    q.includes("momo") ||
    q.includes("fuchka") ||
    q.includes("ice cream") ||
    q.includes("chocolate") ||
    q.includes("bangle") ||
    q.includes("kakon") ||
    q.includes("shopping") ||
    q.includes("dress") ||
    q.includes("afford") ||
    q.includes("can i buy") ||
    q.includes("can i spend") ||
    q.includes("should i buy") ||
    q.includes("worth it")
  ) {
    const numMatch = q.match(/\d+/);
    if (numMatch) {
      const price = Number(numMatch[0]);
      if (price <= safeDaily * 0.6) {
        return `Green light! 🍵 <strong>${price.toLocaleString()} BDT</strong> is well within your safe daily spend of ${safeDaily.toLocaleString()} BDT/day. Treat yourself guilt-free! 💚`;
      } else if (price <= safeDaily) {
        return `Mindful caution! ⚠️ <strong>${price.toLocaleString()} BDT</strong> fits inside today's ${safeDaily.toLocaleString()} BDT safe allowance, but it uses most of your daily cushion.`;
      } else if (price <= balance) {
        return `Hold on panda! 🚨 <strong>${price.toLocaleString()} BDT</strong> exceeds your safe daily limit (${safeDaily.toLocaleString()} BDT/day). If it's a big wish, add it to your <strong>Savings Goals</strong> tab instead!`;
      } else {
        return `Stop right there! 🛡️ <strong>${price.toLocaleString()} BDT</strong> is more than your entire available balance (${balance.toLocaleString()} BDT)!`;
      }
    }
    return `Your safe daily spend is <strong>${safeDaily.toLocaleString()} BDT/day</strong>, so any small treat under <strong>${Math.round(safeDaily * 0.6)} BDT</strong> is completely guilt-free! Ask me with a number like <em>"Can I spend 180 on coffee?"</em>! 🧋`;
  }

  if (q.includes("daily") || q.includes("today") || q.includes("per day") || q.includes("weekly") || q.includes("week") || q.includes("last") || q.includes("survive")) {
    return `With <strong>${balance.toLocaleString()} BDT</strong> available, your safe daily spend is <strong>${safeDaily.toLocaleString()} BDT/day</strong> (or <strong>${safeWeekly.toLocaleString()} BDT/week</strong>). Keeping under that keeps your nest thriving! 🎍`;
  }

  if (q.includes("balance") || q.includes("how much money") || q.includes("money left") || q.includes("net worth") || q.includes("summary") || q.includes("status") || q.includes("overview")) {
    const savingsRate = income > 0 ? Math.max(0, Math.round(((income - expense) / income) * 100)) : 0;
    return `Here is your live Financial Overview 🏡:<br>
    • <strong>Available Balance:</strong> ${balance.toLocaleString()} BDT<br>
    • <strong>Total Income:</strong> +${income.toLocaleString()} BDT<br>
    • <strong>Total Expenses:</strong> ${expense.toLocaleString()} BDT<br>
    • <strong>Net Savings Rate:</strong> ${savingsRate}% of your inflows saved! 🐼`;
  }
  if (q.includes("income") || q.includes("allowance") || q.includes("earned") || q.includes("inflow")) {
    return `You have logged <strong>+${income.toLocaleString()} BDT</strong> in total income and student allowances across ${txs.filter(t => t.type === "income").length} entries! 💵`;
  }
  if (q.includes("expense") || q.includes("total spent") || q.includes("outflow") || q.includes("how much did i spend")) {
    return `Your total expenses are <strong>${expense.toLocaleString()} BDT</strong> across ${txs.filter(t => t.type === "expense").length} logged expense transactions. 📋`;
  }
  if (q.includes("biggest") || q.includes("largest") || q.includes("most expensive") || q.includes("last transaction") || q.includes("recent")) {
    const expList = txs.filter(t => t.type === "expense");
    if (expList.length === 0) return `You haven't logged any expenses yet! Add one in Quick Add Transaction above. ➕`;
    const biggest = [...expList].sort((a, b) => Number(b.amount) - Number(a.amount))[0];
    const latest = txs[0];
    return `Your largest expense is <strong>"${escapeHTML(biggest.title)}" (${Number(biggest.amount).toLocaleString()} BDT)</strong> on ${formatReadableDate(biggest.date)}, and your most recent entry is <strong>"${escapeHTML(latest.title)}" (${Number(latest.amount).toLocaleString()} BDT)</strong>. 🕒`;
  }

  if (q.includes("most") || q.includes("highest") || q.includes("where am i spending") || q.includes("top category") || q.includes("breakdown")) {
    const entries = Object.entries(catTotals);
    if (entries.length === 0) {
      return `No expenses logged yet! Click "📥 Load Sample Data" or add an expense to see your category ranking. 📊`;
    }
    entries.sort((a, b) => b[1] - a[1]);
    const [topCat, topAmt] = entries[0];
    return `Your top spending category is <strong>${topCat}</strong> at <strong>${topAmt.toLocaleString()} BDT</strong> (${Math.round((topAmt / Math.max(1, expense)) * 100)}% of total expenses). 📊`;
  }
  if (q.includes("budget") || q.includes("over budget") || q.includes("limit") || q.includes("cap")) {
    const overCats = Object.keys(budgets).filter(cat => (catTotals[cat] || 0) > budgets[cat]);
    const nearCats = Object.keys(budgets).filter(cat => {
      const s = catTotals[cat] || 0;
      return s >= budgets[cat] * 0.8 && s <= budgets[cat];
    });
    if (overCats.length > 0) {
      return `Alert! 🚨 You are over your monthly budget cap in: <strong>${overCats.join(", ")}</strong>. Check the Budgets tab to review!`;
    }
    if (nearCats.length > 0) {
      return `Heads up! ⚠️ You have used over 80% of your budget in: <strong>${nearCats.join(", ")}</strong>. Pacing carefully will keep you safe!`;
    }
    return `Yay! 🐼💚 You are comfortably within your monthly budget caps across all ${Object.keys(budgets).length} categories!`;
  }

  if (q.includes("cozy nest") || q.includes("shared") || q.includes("friend") || q.includes("group") || q.includes("team") || q.includes("mate")) {
    return `You are currently part of <strong>${myNests.length} Cozy Nest(s)</strong>! 🪺 Open the <strong>Cozy Nests</strong> tab in the navbar to search existing users by Name or Email/ID, contribute to joint goals, and chat live!`;
  }
  if (q.includes("panda") || q.includes("confetti") || q.includes("celebrat") || q.includes("reward")) {
    return `Whenever any personal goal on <strong>Savings Goals</strong> or shared goal on <strong>Cozy Nests</strong> reaches 100%, a multi-wave confetti shower and the bouncing <strong>Happy Panda</strong> popup appear, and the goal is preserved in your green Completed History Vault! 🐼🏆🎉`;
  }
  if (q.includes("saving") || q.includes("goal") || q.includes("target") || q.includes("vault")) {
    if (goals.length === 0) {
      return `You don't have any personal savings goals yet. Head to <strong>Savings Goals</strong> to create one and deposit any custom amount! 🎯`;
    }
    const listStr = goals
      .map(g => {
        const pct = Math.min(100, Math.round((g.saved / g.target) * 100));
        const rem = Math.max(0, g.target - g.saved);
        return `<strong>${escapeHTML(g.title)}</strong> (${pct}% — need ${rem.toLocaleString()} BDT more)`;
      })
      .join("; ");
    return `Your savings goals: ${listStr}. You can add any custom BDT amount on the Savings Goals page! 🏆`;
  }

  if (q.includes("50/30/20") || q.includes("50 30 20") || q.includes("rule")) {
    const needs = Math.round(income * 0.5);
    const wants = Math.round(income * 0.3);
    const savePart = Math.round(income * 0.2);
    return `The <strong>50/30/20 Student Rule</strong> divides your ${income.toLocaleString()} BDT income into: <strong>50% Needs</strong> (${needs.toLocaleString()} BDT for Food/Transport/Study), <strong>30% Wants</strong> (${wants.toLocaleString()} BDT for Treats/Fun), and <strong>20% Savings</strong> (${savePart.toLocaleString()} BDT into your Savings Vault)! 📐`;
  }
  if (q.includes("emergency") || q.includes("medical") || q.includes("rainy day")) {
    return `Student Emergency Fund Tip 🛡️: Aim to keep at least <strong>3,000 to 5,000 BDT</strong> tucked in your Savings Goals for unexpected medical, travel, or academic needs!`;
  }
  if (q.includes("tip") || q.includes("advice") || q.includes("hack") || q.includes("save more") || q.includes("impulse") || q.includes("broke") || q.includes("stress") || q.includes("money") || q.includes("finance")) {
    const tips = [
      "Use the 24-Hour Rule: wait one full day before buying non-essential items over 300 BDT! ⏳",
      "Track small rickshaw fares and campus snacks daily—small leaks sink big allowances! 🚕",
      "Pay yourself first: move 10% of your allowance into Savings Goals the day you receive it! 🐼",
      "Share rides or group-buy stationery with friends using a joint goal in Cozy Nests! 🪺"
    ];
    return `💡 <strong>Penny AI Student Tip:</strong> ${tips[Math.floor(Math.random() * tips.length)]}`;
  }

  return `Aww, I'm just a cozy finance panda, so that topic is a little outside my nest! 🐼🌿 You can ask me anything about <strong>PennyNest</strong>, your <strong>balance, daily allowance, category budgets, savings goals, Cozy Nests</strong>, or <strong>student money tips</strong>—or type <strong>"guide me"</strong> to see how I can help!`;
}

// ==========================================
// 12. RENDERING VIEWS (DASHBOARD, LEDGER, BUDGETS & GREEN COMPLETED VAULT)
// ==========================================
function refreshAllViews() {
  renderAdminDashboard();
  renderDashboard();
  renderLedgerTable();
  renderBudgetBars();
  renderGoals();
  renderCozyNestsPage();
}

function renderDashboard() {
  const profile = getCurrentUser();
  const greetingEl = document.getElementById("greetingHeader");
  if (profile && profile.name) {
    greetingEl.textContent = `Welcome to your nest, ${profile.name}! 🏡`;
  } else {
    greetingEl.textContent = "Financial Overview";
  }

  const list = getTransactions();
  let income = 0, expense = 0;
  list.forEach(tx => {
    if (tx.type === "income") income += Number(tx.amount);
    else expense += Number(tx.amount);
  });

  const balance = income - expense;
  const safeDaily = Math.max(0, Math.round(balance / 15));

  document.getElementById("totalBalance").textContent = balance.toLocaleString() + " BDT";
  document.getElementById("totalIncome").textContent = "+" + income.toLocaleString() + " BDT";
  document.getElementById("totalExpense").textContent = expense.toLocaleString() + " BDT";
  document.getElementById("safeDailySpend").textContent = "Safe daily spend (next 15 days): " + safeDaily.toLocaleString() + " BDT/day";

  const piggyMsg = document.getElementById("piggyStatusMsg");
  if (balance > 5000) {
    piggyMsg.textContent = "Yay! Your nest is thriving and cozy. Keep up the mindful budgeting! 🏡";
  } else if (balance > 1000) {
    piggyMsg.textContent = "Doing steady! You have a healthy cushion for your daily campus essentials. 🌿";
  } else if (balance > 0) {
    piggyMsg.textContent = "Careful! Balance is running a bit low. Time to pause extra treats! 💡";
  } else {
    piggyMsg.textContent = "Oops! Your balance is at zero or negative. Time to budget closely! 🛡️";
  }

  const recentEl = document.getElementById("recentList");
  if (list.length === 0) {
    recentEl.innerHTML = '<li class="tx-item"><span class="tx-meta">No transactions yet. Add one on the left or click "📥 Load Sample Data"!</span></li>';
    return;
  }

  recentEl.innerHTML = list.slice(0, 5).map(tx => `
    <li class="tx-item">
      <div class="tx-info">
        <strong>${escapeHTML(tx.title)}</strong>
        <span class="tx-meta">${formatReadableDate(tx.date)} • ${tx.category}</span>
      </div>
      <span class="tx-amount ${tx.type === 'income' ? 'text-green' : 'text-red'}">
        ${tx.type === 'income' ? '+' : '-'}${Number(tx.amount).toLocaleString()} BDT
      </span>
    </li>
  `).join("");
}

function renderLedgerTable() {
  const tbody = document.getElementById("ledgerTableBody");
  if (!tbody) return;

  const query = (document.getElementById("searchInput").value || "").toLowerCase();
  const catFilter = document.getElementById("filterCategory").value;
  const monthFilter = document.getElementById("filterMonth").value;
  const typeFilter = document.getElementById("filterType").value;

  const dlBtn = document.getElementById("downloadByTypeBtn");
  if (dlBtn) {
    if (typeFilter === "income") dlBtn.textContent = "📥 Download Income Only (CSV)";
    else if (typeFilter === "expense") dlBtn.textContent = "📥 Download Expenses Only (CSV)";
    else dlBtn.textContent = "📥 Download All Types (CSV)";
  }

  const sourceTransactions = getLedgerTransactionsWithDynamicSampleMonth(monthFilter);

  const filtered = sourceTransactions.filter(tx => {
    const matchesText = tx.title.toLowerCase().includes(query);
    const matchesCat = catFilter === "All" || tx.category === catFilter;
    const matchesMonth = !monthFilter || (tx.date && tx.date.startsWith(monthFilter));
    const matchesType = typeFilter === "All" || tx.type === typeFilter;
    return matchesText && matchesCat && matchesMonth && matchesType;
  });

  const summaryEl = document.getElementById("monthlySummaryText");
  if (summaryEl) {
    const typeText = typeFilter === "All" ? "all types" : `${typeFilter} records`;
    summaryEl.textContent = `Showing ${filtered.length} ${typeText}`;
  }

  if (filtered.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:var(--text-muted); padding:24px;">No matching transactions found for this filter.</td></tr>';
    return;
  }

  tbody.innerHTML = filtered.map(tx => `
    <tr>
      <td>${formatReadableDate(tx.date)}</td>
      <td><strong>${escapeHTML(tx.title)}</strong></td>
      <td><span class="badge">${tx.category}</span></td>
      <td>${tx.type === "income" ? "Income" : "Expense"}</td>
      <td class="tx-amount ${tx.type === 'income' ? 'text-green' : 'text-red'}">
        ${tx.type === "income" ? "+" : "-"}${Number(tx.amount).toLocaleString()} BDT
      </td>
      <td>
        <button type="button" class="btn btn-danger btn-sm" onclick="deleteTransaction(${tx.id})">Delete</button>
      </td>
    </tr>
  `).join("");
}

function renderBudgetBars() {
  const container = document.getElementById("budgetBarsContainer");
  if (!container) return;

  const budgets = getBudgets();
  const transactions = getTransactions();
  const spentByCat = {};

  transactions.forEach(tx => {
    if (tx.type === "expense") {
      spentByCat[tx.category] = (spentByCat[tx.category] || 0) + Number(tx.amount);
    }
  });

  if (Object.keys(budgets).length === 0) {
    container.innerHTML = '<p style="color:var(--text-muted);">No category budgets set. Add one on the left!</p>';
    return;
  }

  container.innerHTML = Object.keys(budgets).map(cat => {
    const limit = budgets[cat];
    const spent = spentByCat[cat] || 0;
    const pct = Math.min(100, Math.round((spent / limit) * 100));

    let barColor = "var(--primary)";
    let funStatus = "🐼 Cozy & well under your cap!";
    if (pct >= 100) {
      barColor = "var(--red)";
      funStatus = "🚨 Cap reached! Panda says pause spending here!";
    } else if (pct >= 80) {
      barColor = "var(--red)";
      funStatus = "⚠️ Getting close—tread lightly like a mindful panda!";
    } else if (pct >= 50) {
      barColor = "#f59e0b";
      funStatus = "🌿 Halfway through your monthly limit—pacing nicely!";
    }

    return `
      <div class="budget-item">
        <div class="budget-top">
          <strong>${cat}</strong>
          <div style="display:flex; align-items:center; gap:10px;">
            <span class="num-font">${spent.toLocaleString()} / ${limit.toLocaleString()} BDT (${pct}%)</span>
            <button type="button" class="btn btn-danger btn-sm" style="padding:2px 7px; font-size:0.75rem;" onclick="deleteBudgetCategory('${cat}')" title="Remove category">✕</button>
          </div>
        </div>
        <div class="progress-track">
          <div class="progress-fill" style="width:${pct}%; background:${barColor};"></div>
        </div>
        <div class="budget-fun-note">${funStatus}</div>
      </div>
    `;
  }).join("");
}

function renderGoals() {
  const container = document.getElementById("goalsContainer");
  const historyContainer = document.getElementById("completedGoalsHistoryContainer");
  if (!container) return;

  const user = getCurrentUser();
  const goals = getGoals();
  const activeGoals = goals.filter(g => Number(g.saved) < Number(g.target));
  const completedPersonal = goals.filter(g => Number(g.saved) >= Number(g.target));

  const completedNests = user
    ? getAllCozyNests().filter(
        n =>
          n.members.some(m => m.toLowerCase() === user.email.toLowerCase()) &&
          Number(n.saved) >= Number(n.target)
      )
    : [];

  if (activeGoals.length === 0) {
    container.innerHTML = '<p style="color:var(--text-muted);">No active savings goals right now. Create one on the left!</p>';
  } else {
    container.innerHTML = activeGoals.map(g => {
      const pct = Math.min(100, Math.round((g.saved / g.target) * 100));
      return `
        <div class="goal-card">
          <div class="budget-top">
            <strong>🎯 ${escapeHTML(g.title)}</strong>
            <span class="num-font">${g.saved.toLocaleString()} / ${g.target.toLocaleString()} BDT (${pct}%)</span>
          </div>
          <div class="progress-track">
            <div class="progress-fill" style="width:${pct}%; background:linear-gradient(90deg, var(--primary), var(--accent-secondary));"></div>
          </div>
          <div class="goal-custom-deposit">
            <input type="number" id="goalDepositInput_${g.id}" min="1" step="any" placeholder="Enter any BDT amount...">
            <button type="button" class="btn btn-primary btn-sm" onclick="handleCustomGoalDeposit(${g.id}, '${escapeHTML(g.title)}')">+ Add</button>
            <button type="button" class="btn btn-danger btn-sm" onclick="deleteGoal(${g.id})">Delete</button>
          </div>
        </div>
      `;
    }).join("");
  }

  // Render Green Completed History Vault
  if (historyContainer) {
    const historyCards = [];

    completedPersonal.forEach(g => {
      historyCards.push(`
        <div class="goal-card goal-completed-green">
          <div class="budget-top">
            <strong style="color:#065f46;">🏆 ${escapeHTML(g.title)} 🐼🌟</strong>
            <span class="badge badge-completed-green">✓ 100% Completed</span>
          </div>
          <div class="progress-track">
            <div class="progress-fill" style="width:100%; background:#10b981;"></div>
          </div>
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px; margin-top:10px;">
            <span class="treat-sub" style="color:#047857; font-weight:700;">
              Target Achieved: ${Number(g.saved).toLocaleString()} / ${Number(g.target).toLocaleString()} BDT ${g.completedAt ? "• " + g.completedAt : ""}
            </span>
            <button type="button" class="btn btn-danger btn-sm" onclick="deleteGoal(${g.id})">Remove</button>
          </div>
        </div>
      `);
    });

    completedNests.forEach(n => {
      historyCards.push(`
        <div class="goal-card goal-completed-green">
          <div class="budget-top">
            <strong style="color:#065f46;">🪺 ${escapeHTML(n.title)} (Cozy Nest) 🏆</strong>
            <span class="badge badge-completed-green">✓ 100% Shared Nest</span>
          </div>
          <div class="progress-track">
            <div class="progress-fill" style="width:100%; background:#10b981;"></div>
          </div>
          <p class="treat-sub" style="margin-top:8px; color:#047857; font-weight:700;">
            Joint Target Reached: ${Number(n.saved).toLocaleString()} / ${Number(n.target).toLocaleString()} BDT • ${n.members.length} Nest Mate(s)
          </p>
        </div>
      `);
    });

    if (historyCards.length === 0) {
      historyContainer.innerHTML = '<p style="color:#065f46; font-weight:600;">No completed goals yet—reach 100% on any goal or Cozy Nest to preserve it here in green!</p>';
    } else {
      historyContainer.innerHTML = historyCards.join("");
    }
  }
}

// ==========================================
// 13. EXTRA-ENJOYABLE CONFETTI & HAPPY PANDA CELEBRATION
// ==========================================
function triggerGoalCelebration(goalTitle) {
  launchConfettiShower();
  const modal = document.getElementById("happyPiggyModal");
  document.getElementById("happyPiggyTitle").textContent = `100% Achieved: ${goalTitle}!`;
  document.getElementById("happyPiggyDesc").textContent =
    `Look at Happy Panda dance! You completed "${goalTitle}" and it is now preserved in green in your Completed History Vault! 🐼🏆🎉`;
  modal.classList.remove("hidden");
}

function closeHappyPiggyModal() {
  document.getElementById("happyPiggyModal").classList.add("hidden");
}

function launchConfettiShower() {
  const colors = ["#10b981", "#84cc16", "#f59e0b", "#ec4899", "#38bdf8", "#a855f7", "#fb7185"];
  const emojis = ["🎉", "🐼", "🏆", "🎋", "💚", "🌸", "🏡"];

  for (let i = 0; i < 85; i++) {
    const conf = document.createElement("div");
    conf.className = "confetti-piece";
    conf.style.left = Math.random() * 100 + "vw";

    if (i % 5 === 0) {
      conf.textContent = emojis[Math.floor(Math.random() * emojis.length)];
      conf.style.fontSize = Math.random() * 14 + 16 + "px";
    } else {
      conf.style.width = Math.random() * 8 + 7 + "px";
      conf.style.height = Math.random() * 12 + 10 + "px";
      conf.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      conf.style.borderRadius = Math.random() > 0.5 ? "50%" : "3px";
    }

    conf.style.animationDuration = Math.random() * 2 + 1.8 + "s";
    conf.style.animationDelay = Math.random() * 0.7 + "s";
    document.body.appendChild(conf);
    setTimeout(() => conf.remove(), 4200);
  }
}

function showToast(message) {
  const existing = document.getElementById("customToast");
  if (existing) existing.remove();

  const toast = document.createElement("div");
  toast.id = "customToast";
  toast.className = "celebration-toast";
  toast.innerHTML = `<span>${message}</span>`;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transition = "opacity 0.4s ease";
    setTimeout(() => toast.remove(), 400);
  }, 3000);
}

function escapeHTML(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}