# Active Context — i18n RU

## Сейчас делаем
- Wave 1 done: каркас + оболочка (layout, login, setup) на EN/RU, все гейты зелёные, сборка EXIT 0.
- Далее: коммит Wave 1 → Волна 2 (сущности).

## Активные решения
- Библиотека: react-i18next + i18next + i18next-browser-languagedetector.
- Хранение: localStorage key cascadia-locale, дефолт — детект браузера, fallback en.
- Ключи namespaced: common, auth, dashboard, layout, setup.
- ESLint --fix ломает импорты — править блок импортов вручную скриптом с brace-check.

## Следующие шаги
1. Коммит Wave 1 на feature/i18n-ru.
2. Волна 2: инвентарь сущностей.
3. tour-steps.ts → getTourSteps(t), тосты/Zod по ключам, Intl.DateTimeFormat.
4. Docker smoke: /health 200 + EN/RU /login и /setup.
5. PR в main.

