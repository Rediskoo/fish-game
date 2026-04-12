const tg = window.Telegram.WebApp;
tg.expand();

let size = 1;

render();

function createFish() {
  const name = document.getElementById("name").value;

  localStorage.setItem("fishName", name);
  localStorage.setItem("fishSize", size);

  render();
}

function feed() {
  size = Number(localStorage.getItem("fishSize")) || 1;
  size += 1;

  localStorage.setItem("fishSize", size);

  render();
}

function render() {
  const name = localStorage.getItem("fishName");
  const size = localStorage.getItem("fishSize");

  const el = document.getElementById("fish");

  if (!name) {
    el.innerText = "Создай свою рыбку 🐟";
    return;
  }

  el.innerText = `${name} (размер: ${size || 1})`;
}