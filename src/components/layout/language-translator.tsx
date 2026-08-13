"use client";

import { useEffect } from "react";
import { useLanguageStore } from "@/stores/language-store";
import { funnyTranslation } from "./funny-language";

const translations: Record<string, string> = {
  "Главная": "Home", "Питомник": "Nursery", "Склад": "Inventory", "Магазин": "Shop", "Подарки": "Rewards", "Профиль": "Profile", "Настройки": "Settings",
  "Мой склад": "My inventory", "Личный инвентарь, фоны, декор и рыбки.": "Food, backgrounds, decorations and fish.", "Корм и уход": "Food & care", "Декор": "Decor", "Фоны": "Backgrounds", "Рыбки": "Fish",
  "Покормить всех рыб": "Feed all fish", "Обычный корм": "Basic food", "Большой корм": "Large food", "Суперкорм": "Super food", "Для выбранной рыбы": "For one fish", "Кормит весь аквариум": "Feeds the whole aquarium", "Очистить −15": "Clean −15", "Суперочистка": "Super clean",
  "Скрещивание": "Breeding", "Питомник гибридных рыб": "Hybrid fish nursery", "Ускорение развития": "Growth boost", "Инкубатор икры": "Egg incubator", "Корм для малышей": "Fry food", "Кондиционер питомника": "Nursery conditioner", "Родословная": "Genealogy", "Забрать рыбу": "Claim fish",
  "Ежедневный бонус": "Daily reward", "Забрать": "Claim", "Получено": "Claimed", "Прогресс достижений": "Achievement progress", "Достижения": "Achievements",
  "Звуки": "Sounds", "Локально сохраняются на устройстве": "Saved locally on this device", "Все звуки": "All sounds", "Главный выключатель": "Master switch", "Кнопки": "Buttons", "Клики и подтверждения": "Clicks and confirmations", "Кейсы": "Cases", "Открытие кейса и награда": "Case opening and reward", "Тапы и реакции рыб": "Fish taps and reactions", "Повторить обучение": "Restart tutorial", "Язык": "Language", "Русский": "Russian", "Английский": "English", "Тема": "Theme", "По умолчанию": "Default", "О приложении": "About", "Поддержка": "Support",
  "Назад": "Back", "Избранное": "Favorite", "Инфо": "Info", "Готова": "Ready", "Занята": "Busy", "Не взрослая": "Not adult", "Нет визуала": "No visual", "Загрузка аквариума...": "Loading aquarium...", "Повторить": "Retry"
  ,"Нерестовое гнездо": "Spawning nest", "Медальон родословной": "Genealogy medallion", "Большой очиститель": "Super cleaner", "Рыбный кейс": "Fish case", "Улучшенный корм": "Premium food", "Очиститель воды": "Water conditioner",
  "Малое растение": "Small plant", "Высокое растение": "Tall plant", "Красный коралл": "Red coral", "Фиолетовый коралл": "Purple coral", "Каменный мост": "Stone bridge", "Фонарь": "Lantern", "Зелёные водоросли": "Green seaweed", "Светящиеся водоросли": "Glowing seaweed", "Пушка пузырьков": "Bubble cannon", "Двойная пушка": "Double bubble cannon", "Амфора": "Amphora",
  "Глубокая лагуна": "Deep lagoon", "Коралловый сад": "Coral garden", "Лунный риф": "Moon reef", "Затонувший храм": "Sunken temple", "Тропическая река": "Tropical river", "Ночной грот": "Night cove",
  "Магазин аквариума": "Aquarium shop", "Выберите категорию": "Choose a category", "Разведение и рост": "Breeding and growth", "Еда и очистка": "Food and cleaning", "Водоросли и пузыри": "Seaweed and bubbles", "Вид аквариума": "Aquarium look", "Кейсы и редкость": "Cases and rarity", "В наличии": "Available", "Купить": "Buy",
  "Мой аквариум": "My aquarium", "Режим наблюдения": "Observation mode", "Ежедневные награды, задания и достижения.": "Daily rewards, quests and achievements.", "Океан": "Ocean", "Ночная": "Night", "Включены": "Enabled", "Выключены": "Disabled"
  ,"Изменить профиль": "Edit profile", "Ник": "Nickname", "Аватарка": "Avatar", "Сохранить профиль": "Save profile", "Тема оформления": "App theme", "Хэллоуин": "Halloween", "Чёрная": "Midnight", "Снежная": "Snow", "Закат": "Sunset", "Неоновая": "Neon", "Изумруд": "Emerald"
};

const originals = new WeakMap<Text, { original: string; rendered: string }>();
const originalAttributes = new WeakMap<Element, Map<string, string>>();

function translateAttribute(element: Element, name: string, language: "ru" | "en" | "funny") {
  const current = element.getAttribute(name);
  if (!current) return;
  let stored = originalAttributes.get(element);
  if (!stored) { stored = new Map(); originalAttributes.set(element, stored); }
  const original = stored.get(name) ?? current;
  stored.set(name, original);
  const translated = language === "ru" ? original : language === "funny" ? funnyTranslation(original) : translations[original] ?? original;
  if (current !== translated) element.setAttribute(name, translated);
}

function translateElement(element: Element, language: "ru" | "en" | "funny") {
  ["placeholder", "title", "aria-label", "alt"].forEach((name) => translateAttribute(element, name, language));
}

function translateTextNode(node: Text, language: "ru" | "en" | "funny") {
  const previous = originals.get(node);
  const original = previous && (node.data === previous.original || node.data === previous.rendered) ? previous.original : node.data;
  if (language === "ru") { originals.set(node, { original, rendered: original }); if (node.data !== original) node.data = original; return; }
  const trimmed = original.trim();
  const translated = language === "funny" ? funnyTranslation(trimmed) : translations[trimmed];
  const rendered = translated ? original.replace(trimmed, translated) : original;
  originals.set(node, { original, rendered });
  if (node.data !== rendered) node.data = rendered;
}

function translateTree(root: Node, language: "ru" | "en" | "funny") {
  if (root instanceof Text) return translateTextNode(root, language);
  if (root instanceof Element) translateElement(root, language);
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let node: Node | null;
  while ((node = walker.nextNode())) translateTextNode(node as Text, language);
  if (root instanceof Element) root.querySelectorAll("[placeholder],[title],[aria-label],[alt]").forEach((element) => translateElement(element, language));
}

export function LanguageTranslator({ enabled = true }: { enabled?: boolean }) {
  const language = useLanguageStore((state) => state.language);
  useEffect(() => {
    document.documentElement.lang = language;
    if (!enabled) return;
    translateTree(document.body, language);
    const observer = new MutationObserver((records) => records.forEach((record) => {
      record.addedNodes.forEach((node) => translateTree(node, language));
      if (record.type === "characterData") translateTree(record.target, language);
    }));
    observer.observe(document.body, { childList: true, characterData: true, subtree: true });
    return () => observer.disconnect();
  }, [enabled, language]);
  return null;
}
