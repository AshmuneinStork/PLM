# Active Context — i18n RU

## Сейчас делаем
- Wave 1 done: каркас + оболочка (layout, login, setup) на EN/RU, все гейты зелёные, сборка EXIT 0.
- Wave 2 B1a done (0661ffd): parts list/table/routes EN/RU (PartTable, index/new/$id.tsx, entities.json 58 базовых ключей).
- Wave 2 B1b done: PartForm + shared (DesignSelector, BranchSelector, DesignPhaseIndicator, AttributesEditor, ItemNumberField/format.ts) EN/RU, entities.json 134 базовых ключа, гейты зелёные.
- Далее: коммит B1b → B1c (PartDetail 1031 строка + Sidebar).

## Активные решения
- Библиотека: react-i18next + i18next + i18next-browser-languagedetector.
- Хранение: localStorage key cascadia-locale, дефолт — детект браузера, fallback en.
- Ключи namespaced: common, auth, dashboard, layout, setup + entities (parts.*: columns/typeLabels/filters/usage/menu/table/list/toasts/dialogs/form/numbering/attributes + common.*).
- Глоссарий: Design=Проект, Part=Изделие (создано/обновлено/удалено), Change Order=ECO/Изменения, workspace без перевода (технический термин).
- ESLint --fix ломает импорты — править блок импортов вручную скриптом с brace-check.
- Editor match-замены падают на больших файлах (CRLF-кэш?) — точечные правки через node-скрипты replace, проверка через Select-String/Get-Content.
- format.ts: getItemNumberPlaceholder()/getItemNumberHelpText() через i18n.t, ITEM_NUMBER_PLACEHOLDER deprecated как fallback.
- B1b: currency/unit коды (USD/kg) не переводятся; числовые плейсхолдеры (0.000/0.00/30) остаются; timeAgo через pluralize (EN one/other, RU one/few/many/other).

## Следующие шаги
1. Коммит B1b на feature/i18n-ru.
2. B1c: PartDetail.tsx (1031 строка, разбить) + PartDetailSidebar.
3. B2-B5: остальные сущности по пилоту.
4. Волна 3: tour-steps.ts → getTourSteps(t), тосты/Zod по ключам, Intl.DateTimeFormat.
5. Vitest fix (globalSetup в node-проект) + LanguageSwitcher.test.tsx + build + Docker smoke.
6. PR в main.

