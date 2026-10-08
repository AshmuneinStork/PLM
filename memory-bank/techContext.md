# Tech Context — i18n RU

## Стек
- Node >=22, React 19, Vite 7, TanStack Router/Query.
- i18n: i18next + react-i18next + i18next-browser-languagedetector.

## Команды
- `npm run typecheck:strict` — типы всех пакетов.
- `npm run lint` (eslint --max-warnings 0).
- `npm run test` (vitest run) — unit/integration.
- `npm run test:e2e` — playwright.

## Ограничения
- Зависимости общие в корневом package.json (workspaces cascadia-*).
- ESLint project:true — новые файлы должны входить в tsconfig include.
- E2E-селекторы по тексту ломаются переводом → data-testid.
