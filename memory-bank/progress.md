# Progress — i18n RU

## Работает
- [x] Форк выгружен в d:\Documents\000_PLM, main чист.
- [x] Разведка: i18n нет, строки захардкожены, точки встраивания найдены.
- [x] План утверждён, ветка feature/i18n-ru создана.
- [x] Каркас i18n: `config.ts`, `types.ts`, `locales/{en,ru}/{common,auth,dashboard,layout,setup}.json`, deps (i18next 26, react-i18next 17, detector 8).
- [x] Волна 1: Header + LanguageSwitcher, ProfileDropdown, Sidebar/SidebarNav, ThemeToggle, login, SetupWizard + все steps, SummaryStep, index route, `__root.tsx`.
- [x] Гейты: setup.json parity 100%, typecheck-all EXIT 0, eslint --max-warnings 0 EXIT 0, license-headers --check EXIT 0, `node scripts/build-app.mjs` EXIT 0 (client 4580 модулей, server 12.2mb, worker 4.6mb).

## Осталось
- [ ] Волна 2: сущности.
- [ ] Волна 3: остальное + tour/toasts/ошибки.
- [ ] Форматы дат/чисел (Intl).
- [ ] Vitest dom-тесты фронта (сейчас .test.tsx нет) + e2e smoke EN/RU.
- [ ] Доки.
- [ ] Docker smoke: build app + /health 200 + EN/RU на /login и /setup.
- [ ] PR feature/i18n-ru -> main.

## Известные проблемы
- 554 файла — большой diff, риск конфликтов с upstream.
- chromeless /login и /setup без Header — свитчер добавлен отдельно в Card.
- vitest global-setup требует TEST_DATABASE_URL — без БД сьюта не бежит.
- Правило import/order + consistent-type-specifier-style конфликтуют на однострочных type+value импортах одного модуля — разносить построчно (type выше value).

