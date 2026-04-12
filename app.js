const tg = window.Telegram.WebApp;
tg.expand();

let fishList = JSON.parse(localStorage.getItem("fishList")) || [];

// максимум 100 рыб
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

const aquarium = document.getElementById("aquarium");
const panel = document.getElementById("panel");

save();
render();
moveFish();

function save() {
    localStorage.setItem("fishList", JSON.stringify(fishList));
}

// --------------------
// ПОКАЗ ЖИТЕЛЕЙ
// --------------------
function toggleResidents() {
    if (panel.style.display === "block") {
        panel.style.display = "none";
        return;
    }

    panel.style.display = "block";

    panel.innerHTML = "<b>🐟 Жители аквариума</b><br><br>";

    fishList.forEach(f => {
        panel.innerHTML += `${f.name} — ${f.age} лет<br>`;
    });
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
// ОТОБРАЖЕНИЕ
// --------------------
function render() {
    aquarium.innerHTML = "";

    // рисуем рыб
    fishList.forEach((f, i) => {
        const el = document.createElement("img");

        el.src = "https://i.imgur.com/4AiXzf8.png";

        el.style.position = "absolute";
        el.style.left = f.x + "px";
        el.style.top = f.y + "px";
        el.style.width = "50px";

        aquarium.appendChild(el);
    });

    // панель (перерисуем)
    aquarium.appendChild(panel);

    // кнопка
    const btn = document.createElement("div");
    btn.id = "btn";

    btn.innerHTML = `
        <button onclick="toggleResidents()">👥 Жители</button>
    `;

    aquarium.appendChild(btn);
}