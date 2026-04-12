const tg = window.Telegram.WebApp;
tg.expand();

let fishList = JSON.parse(localStorage.getItem("fishList")) || [];

const aquarium = document.getElementById("aquarium");

// --------------------
// СОХРАНЕНИЕ ЛОКАЛЬНО (рыбы)
// --------------------
function saveFish() {
    localStorage.setItem("fishList", JSON.stringify(fishList));
}

// --------------------
// СОЗДАТЬ РЫБУ
// --------------------
function createFish(name) {
    fishList.push({
        name: name,
        age: 1,
        size: 1,
        x: Math.random() * 200,
        y: Math.random() * 300
    });

    saveFish();
    render();
}

// --------------------
// КЛИК ПО РЫБЕ = 1 COIN В БОТ
// --------------------
function clickFish(index) {

    // отправляем в бот
    tg.sendData(JSON.stringify({
        type: "add_coin",
        amount: 1
    }));

    tg.HapticFeedback?.impactOccurred("light");
}

// --------------------
// МЕНЮ
// --------------------
function openMenu() {
    const action = prompt(
        "1 - добавить рыбу\n2 - сброс"
    );

    if (action === "1") {
        const name = prompt("Имя рыбы:");
        if (name) createFish(name);
    }

    if (action === "2") {
        fishList = [];
        saveFish();
        render();
    }
}

// --------------------
// ДВИЖЕНИЕ
// --------------------
function moveFish() {
    setInterval(() => {
        fishList.forEach(f => {
            f.x += (Math.random() - 0.5) * 50;
            f.y += (Math.random() - 0.5) * 50;

            f.x = Math.max(0, Math.min(window.innerWidth - 80, f.x));
            f.y = Math.max(60, Math.min(window.innerHeight - 120, f.y));
        });

        saveFish();
        render();
    }, 1200);
}

// --------------------
// RENDER
// --------------------
function render() {
    aquarium.innerHTML = "";

    // TOP UI
    const top = document.createElement("div");
    top.id = "top";
    top.innerHTML = `
        🐟 Fish: ${fishList.length}
        <button onclick="openMenu()">✏️ меню</button>
    `;
    aquarium.appendChild(top);

    // FISH
    fishList.forEach((f, i) => {
        const el = document.createElement("div");

        el.style.position = "absolute";
        el.style.left = f.x + "px";
        el.style.top = f.y + "px";
        el.style.textAlign = "center";
        el.style.color = "white";

        el.innerHTML = `
            <div>${f.name} (${f.age})</div>
            <img src="https://i.imgur.com/4AiXzf8.png"
                 style="width:${40 + f.size * 10}px; cursor:pointer;">
        `;

        el.querySelector("img").onclick = () => clickFish(i);

        aquarium.appendChild(el);
    });

    // BOTTOM
    const bottom = document.createElement("div");
    bottom.id = "bottom";

    bottom.innerHTML = `
        <button onclick="openMenu()">✏️ Меню аквариума</button>
    `;

    aquarium.appendChild(bottom);
}

// --------------------
render();
moveFish();