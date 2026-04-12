const tg = window.Telegram.WebApp;
tg.expand();

let fishList = JSON.parse(localStorage.getItem("fishList")) || [];
let algae = parseInt(localStorage.getItem("algae")) || 0;

const aquarium = document.getElementById("aquarium");
const panel = document.getElementById("panel");

// --------------------
// INIT
// --------------------
if (fishList.length === 0) {
    for (let i = 0; i < 5; i++) {
        fishList.push({
            name: "Fish" + (i + 1),
            age: Math.floor(Math.random() * 5) + 1,
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
            vx: (Math.random() - 0.5) * 1.5,
            vy: (Math.random() - 0.5) * 1.5
        });
    }
}

save();
render();
animateFish();
algaeGenerator();

// --------------------
// SAVE
// --------------------
function save() {
    localStorage.setItem("fishList", JSON.stringify(fishList));
    localStorage.setItem("algae", algae);
}

// --------------------
// UI UPDATE (ВАЖНО)
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
        updateAlgaeUI(); // 🔥 обновление кнопки
    }, 5000);
}

// --------------------
// RENDER (ОДИН РАЗ)
// --------------------
function render() {
    aquarium.innerHTML = "";

    fishList.forEach((f, i) => {
        const fish = document.createElement("div");
        fish.className = "fish";

        fish.dataset.index = i;

        fish.style.left = f.x + "px";
        fish.style.top = f.y + "px";

        fish.innerHTML = `
            <div class="fish-name">${f.name}</div>
            <img src="https://i.imgur.com/4AiXzf8.png" width="50">
        `;

        aquarium.appendChild(fish);
    });

    aquarium.appendChild(panel);

    // кнопки создаём ОДИН РАЗ
    const bottom = document.createElement("div");
    bottom.id = "bottom";

    bottom.innerHTML = `
        <button class="btn" onclick="toggleResidents()">👥 Жители</button>
        <button class="btn" onclick="collectAlgae()">
            🌿 Водоросли (<span id="algaeCount">${algae}</span>)
        </button>
    `;

    aquarium.appendChild(bottom);
}

// --------------------
// ПЛАВНОЕ ДВИЖЕНИЕ (60 FPS)
// --------------------
function animateFish() {
    const loop = () => {
        const fishElements = document.querySelectorAll(".fish");

        fishList.forEach((f, i) => {
            const el = fishElements[i];
            if (!el) return;

            // инерция движения
            f.x += f.vx;
            f.y += f.vy;

            // отскок от стен
            if (f.x < 0 || f.x > window.innerWidth - 60) f.vx *= -1;
            if (f.y < 0 || f.y > window.innerHeight - 120) f.vy *= -1;

            f.x = Math.max(0, Math.min(window.innerWidth - 60, f.x));
            f.y = Math.max(0, Math.min(window.innerHeight - 120, f.y));

            el.style.left = f.x + "px";
            el.style.top = f.y + "px";
        });

        requestAnimationFrame(loop);
    };

    loop();
}