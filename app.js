const tg = window.Telegram.WebApp;
tg.expand();

let fishList = JSON.parse(localStorage.getItem("fishList")) || [];
let algae = parseInt(localStorage.getItem("algae")) || 0;

const aquarium = document.getElementById("aquarium");
const panel = document.getElementById("panel");

updateAlgaeUI();

// --------------------
// СТАРТОВЫЕ РЫБЫ
// --------------------
if (fishList.length === 0) {
    for (let i = 0; i < 5; i++) {
        fishList.push({
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
// UI ВОДОРОСЛЕЙ
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
// ДВИЖЕНИЕ РЫБ
// --------------------
function moveFish() {
    setInterval(() => {
        fishList.forEach(f => {
            f.x += (Math.random() - 0.5) * 60;
            f.y += (Math.random() - 0.5) * 60;

            f.x = Math.max(0, Math.min(window.innerWidth - 60, f.x));
            f.y = Math.max(0, Math.min(window.innerHeight - 120, f.y));
        });

        save();
        render();

    }, 1200);
}

// --------------------
// RENDER
// --------------------
function render() {
    aquarium.innerHTML = "";

    fishList.forEach(f => {
        const wrap = document.createElement("div");
        wrap.className = "fish";
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
        <button class="btn" onclick="collectAlgae()">🌿 Водоросли (${algae})</button>
    `;

    aquarium.appendChild(bottom);
}