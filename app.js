const tg = window.Telegram.WebApp;
tg.expand();

let fishName = localStorage.getItem("fishName") || "";
let size = Number(localStorage.getItem("fishSize")) || 1;

const fish = document.getElementById("fish");
const info = document.getElementById("info");
const createBox = document.getElementById("createBox");
const editBtn = document.getElementById("editBtn");

let x = 100;
let y = 150;

render();
moveFish();
checkUI();

// создать рыбку
function createFish() {
    fishName = document.getElementById("name").value;
    if (!fishName) return;

    localStorage.setItem("fishName", fishName);
    localStorage.setItem("fishSize", size);

    checkUI();
    render();
}

// кормить
function feed() {
    if (!fishName) return;

    size += 1;
    localStorage.setItem("fishSize", size);

    render();
}

// редактировать / сброс
function editFish() {
    localStorage.removeItem("fishName");
    localStorage.removeItem("fishSize");

    fishName = "";
    size = 1;

    createBox.style.display = "block";
    editBtn.style.display = "none";

    render();
}

// UI логика
function checkUI() {
    if (fishName) {
        createBox.style.display = "none";
        editBtn.style.display = "block";
    } else {
        createBox.style.display = "block";
        editBtn.style.display = "none";
    }
}

// отображение
function render() {
    if (!fishName) {
        info.innerText = "Создай рыбку 🐟";
    } else {
        info.innerText = `${fishName} | размер: ${size}`;
    }
}

// движение (НЕ заходит в UI зоны)
function moveFish() {
    setInterval(() => {

        x += (Math.random() - 0.5) * 80;
        y += (Math.random() - 0.5) * 80;

        const topLimit = 120;
        const bottomLimit = window.innerHeight - 120;

        x = Math.max(0, Math.min(window.innerWidth - 80, x));
        y = Math.max(topLimit, Math.min(bottomLimit, y));

        fish.style.left = x + "px";
        fish.style.top = y + "px";

    }, 1000);
}