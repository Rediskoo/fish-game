const tg = window.Telegram.WebApp;
tg.expand();

let fishList = JSON.parse(localStorage.getItem("fishList")) || [];
let algae = parseInt(localStorage.getItem("algae")) || 0;

const aquarium = document.getElementById("aquarium");
const panel = document.getElementById("panel");

// --------------------
// INIT
// --------------------
updateAlgaeUI();

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
// UI
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
// ВОДОРОСЛИ
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
// RENDER
// --------------------
function render() {
    aquarium.innerHTML = "";

    fishList.forEach((f, i) => {
        const fish = document.createElement("div");
        fish.className = "fish";

        fish.style.left = f.x + "px";
        fish.style.top = f.y + "px";

        fish.innerHTML = `
            <div class="fish-name">${f.name}</div>
            <img src="https://i.imgur.com/4AiXzf8.png" width="50">
        `;

        // 🐟 клик по рыбе
        fish.onclick = () => pushFish(i);

        aquarium.appendChild(fish);
    });

    aquarium.appendChild(panel);

    const bottom = document.createElement("div");
    bottom.id = "bottom";

    bottom.innerHTML = `
        <button class="btn" onclick="toggleResidents()">👥 Жители</button>
        <button class="btn" onclick="collectAlgae()">
            🌿 Водоросли (<span id="algaeCount">0</span>)
        </button>
    `;

    aquarium.appendChild(bottom);

    updateAlgaeUI();
}

// --------------------
// ДВИЖЕНИЕ РЫБ
// --------------------
function moveFish() {
    setInterval(() => {
        const fishElements = document.querySelectorAll(".fish");

        fishList.forEach((f, i) => {
            const el = fishElements[i];
            if (!el) return;

            const dx = (Math.random() - 0.5) * 70;
            const dy = (Math.random() - 0.5) * 70;

            f.x = Math.max(0, Math.min(window.innerWidth - 60, f.x + dx));
            f.y = Math.max(0, Math.min(window.innerHeight - 120, f.y + dy));

            el.style.left = f.x + "px";
            el.style.top = f.y + "px";
        });

        save();
    }, 1200);
}

// --------------------
// ПИН РЫБЫ (ОТЛЁТ)
// --------------------
function pushFish(i) {
    const f = fishList[i];
    if (!f) return;

    f.x += (Math.random() - 0.5) * 150;
    f.y += (Math.random() - 0.5) * 150;

    f.x = Math.max(0, Math.min(window.innerWidth - 60, f.x));
    f.y = Math.max(0, Math.min(window.innerHeight - 120, f.y));

    const el = document.querySelectorAll(".fish")[i];
    if (el) {
        el.style.transition = "left 0.2s ease, top 0.2s ease";
        el.style.left = f.x + "px";
        el.style.top = f.y + "px";

        setTimeout(() => {
            el.style.transition = "left 1.2s linear, top 1.2s linear";
        }, 200);
    }
}