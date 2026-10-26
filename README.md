# Фотоблог — лендинг со статистикой посещений

Минималистичный одностраничный сайт: лендинг с галереей фото, в фоне собирает
анонимную статистику посещений (IP, гео, устройство, браузер) и показывает её
в админ-панели.

## Быстрый старт

```bash
npm install
npm start
```

- Сайт: http://localhost:3000
- Админ-панель: http://localhost:3000/admin
- JSON со всеми визитами: http://localhost:3000/api/visits

Каждый визит логируется в консоль сервера.

## Структура

```
├── server.js          # бэкенд (Express): статика, /api/visit, /api/visits, /admin
├── package.json
└── public/
    ├── index.html     # лендинг
    ├── admin.html     # таблица визитов
    └── img/           # фото для галереи
```

## Что собирается о визите

- IP (с учётом `x-forwarded-for`), гео по IP: страна, город, провайдер (ipwho.is, без ключа)
- User-Agent → ОС, браузер, тип устройства (mobile/desktop)
- Accept-Language, время визита
- С клиента: разрешение экрана, часовой пояс, язык браузера

Хранилище — in-memory (массив), данные сбрасываются при перезапуске сервера.

## Деплой на Render

Код менять не нужно — порт берётся из `process.env.PORT`.

1. Залей репозиторий на GitHub.
2. [Render](https://render.com) → **New → Web Service** → выбери репозиторий.
3. Build Command: `npm install`, Start Command: `npm start`, план Free.
4. Готово: `https://<проект>.onrender.com`, админка — `https://<проект>.onrender.com/admin`.

## Настройка

| Что | Где |
|---|---|
| Заголовок и тексты | `public/index.html` |
| Фото | `public/img/` (photo1.jpg, photo2.jpg, photo3.jpg) |
| Дисклеймер | `<footer>` в `public/index.html` |
