const tg = window.Telegram.WebApp;
tg.expand();

const FISH_COUNT = 5;
const FISH_MOVE_INTERVAL_MS = 1200;
const ALGAE_INTERVAL_MS = 5000;
const FISH_IMAGE_WIDTH = 50;
const FISH_BOUND_X = 60;
const FISH_BOUND_Y = 120;

function parseJSON(value, fallback) {
    if (!value) return fallback;
    try {
        return JSON.parse(value);
    } catch {
        return fallback;
    }
}

let fishList = parseJSON(localStorage.getItem("fishList"), []);
let algae = Number.parseInt(localStorage.getItem("algae"), 10) || 0;

const aquarium = document.getElementById("aquarium");
const panel = document.getElementById("panel");

// --------------------
// INIT
// --------------------
updateAlgaeUI();

if (fishList.length === 0) {
    for (let i = 0; i < FISH_COUNT; i++) {
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
    }, ALGAE_INTERVAL_MS);
}

// --------------------
// RENDER
// --------------------
function render() {
    aquarium.innerHTML = "";

    fishList.forEach(f => {
        const fish = document.createElement("div");
        fish.className = "fish";

        fish.style.left = f.x + "px";
        fish.style.top = f.y + "px";

        fish.innerHTML = `
            <div class="fish-name">${f.name}</div>
            <img src="https://i.imgur.com/4AiXzf8.png" width="${FISH_IMAGE_WIDTH}">
        `;

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
// ДВИЖЕНИЕ
// --------------------
function moveFish() {
    setInterval(() => {
        const fishElements = document.querySelectorAll(".fish");

        fishList.forEach((f, i) => {
            const el = fishElements[i];
            if (!el) return;

            const dx = (Math.random() - 0.5) * 70;
            const dy = (Math.random() - 0.5) * 70;

            f.x = Math.max(0, Math.min(window.innerWidth - FISH_BOUND_X, f.x + dx));
            f.y = Math.max(0, Math.min(window.innerHeight - FISH_BOUND_Y, f.y + dy));

            el.style.left = f.x + "px";
            el.style.top = f.y + "px";
        });

        save();
    }, FISH_MOVE_INTERVAL_MS);
}
