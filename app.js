const tg = window.Telegram.WebApp;
tg.expand();

let fishName = localStorage.getItem("fishName") || "";
let size = Number(localStorage.getItem("fishSize")) || 1;

const fish = document.getElementById("fish");
const info = document.getElementById("info");

// стартовая позиция
let x = 100;
let y = 100;

render();
moveFish();

// создать рыбку
function createFish() {
    fishName = document.getElementById("name").value;

    localStorage.setItem("fishName", fishName);
    localStorage.setItem("fishSize", size);

    render();
}

// кормить
function feed() {
    size += 1;
    localStorage.setItem("fishSize", size);

    render();
}

// показать инфо
function render() {
    if (!fishName) {
        info.innerText = "Создай рыбку 🐟";
    } else {
        info.innerText = `${fishName} | размер: ${size}`;
    }
}

// движение рыбки
function moveFish() {
    setInterval(() => {
        x += (Math.random() - 0.5) * 100;
        y += (Math.random() - 0.5) * 100;

        // границы экрана
        x = Math.max(0, Math.min(window.innerWidth - 80, x));
        y = Math.max(0, Math.min(window.innerHeight - 80, y));

        fish.style.left = x + "px";
        fish.style.top = y + "px";

    }, 1000);
}