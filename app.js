const tg = window.Telegram.WebApp;
tg.expand();

let fishList = JSON.parse(localStorage.getItem("fishList")) || [];
let algae = parseInt(localStorage.getItem("algae")) || 0;

const aquarium = document.getElementById("aquarium");
const panel = document.getElementById("panel");

// --------------------
// INIT UI
// --------------------
updateAlgaeUI();

// стартовые рыбы
if (fishList.length === 0) {
    for (let i = 0; i < 5; i++) {
        fishList.push({
            id: "fish_" + i,
            name: "Fish" + (i + 1),
            age: Math.floor(Math.random() * 5) + 1,
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight
        });
    }
}

save();
render();
moveFish();
algaeGenerator();

// --------------------
// SAVE
// --------------------
function save() {
    localStorage.setItem("fishList", JSON.stringify(fishList));
    localStorage.setItem("algae", algae);
}

// --------------------
// UI UPDATE
// --------------------
function updateAlgaeUI() {
    const el = document.getElementById("algaeCount");
    if (el) el.textContent = algae;
}

// --------------------
// ЖИТЕЛИ
// --------------------
function toggleResidents() {
    if (panel.style.display === "block") {
        panel.style.display = "none";
        return;
    }

    panel.style.display = "block";
    panel.innerHTML = `<b>🐟 Жители (${fishList.length})</b><br><br>`;

    fishList.forEach(f => {
        panel.innerHTML += `${f.name} — ${f.age} лет<br>`;
    });
}

// --------------------
// СБОР ВОДОРОСЛЕЙ
// --------------------
function collectAlgae() {
    if (algae <= 0) {
        tg.showAlert("Нет водорослей 🌿");
        return;
    }

    tg.sendData(JSON.stringify({
        action: "collect_algae",
        amount: algae
    }));

    algae = 0;
    save();
    updateAlgaeUI();

    tg.HapticFeedback?.impactOccurred("light");
}

// --------------------
// ГЕНЕРАЦИЯ ВОДОРОСЛЕЙ
// --------------------
function algaeGenerator() {
    setInterval(() => {
        algae += fishList.length;
        save();
        updateAlgaeUI();
    }, 5000);
}

// --------------------
// СОЗДАНИЕ РЫБ DOM (ОДИН РАЗ)
// --------------------
function render() {
    aquarium.innerHTML = "";

    fishList.forEach(f => {
        const wrap = document.createElement("div");
        wrap.className = "fish";
        wrap.id = f.id;

        wrap.style.left = f.x + "px";
        wrap.style.top = f.y + "px";

        wrap.innerHTML = `
            <div class="fish-name">${f.name}</div>
            <img src="https://i.imgur.com/4AiXzf8.png" width="50">
        `;

        aquarium.appendChild(wrap);
    });

    aquarium.appendChild(panel);

    const bottom = document.createElement("div");
    bottom.id = "bottom";

    bottom.innerHTML = `
        <button class="btn" onclick="toggleResidents()">👥 Жители</button>
        <button class="btn" onclick="collectAlgae()">🌿 Водоросли (<span id="algaeCount">${algae}</span>)</button>
    `;

    aquarium.appendChild(bottom);
}

// --------------------
// ПЛАВНОЕ ДВИЖЕНИЕ РЫБ (БЕЗ RERENDER)
// --------------------
function moveFish() {
    setInterval(() => {
        fishList.forEach(f => {
            const dx = (Math.random() - 0.5) * 80;
            const dy = (Math.random() - 0.5) * 80;

            f.x = Math.max(0, Math.min(window.innerWidth - 60, f.x + dx));
            f.y = Math.max(0, Math.min(window.innerHeight - 120, f.y + dy));

            const el = document.getElementById(f.id);

            if (el) {
                el.style.left = f.x + "px";
                el.style.top = f.y + "px";
            }
        });

        save();
    }, 1200);
}