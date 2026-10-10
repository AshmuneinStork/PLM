# Active Context — i18n RU

## Сейчас делаем
- Wave 1 done: каркас + оболочка (layout, login, setup) на EN/RU, все гейты зелёные, сборка EXIT 0.
- Wave 2 B1a done (0661ffd): parts list/table/routes EN/RU (PartTable, index/new/$id.tsx, entities.json 58 базовых ключей).
- Wave 2 B1b done: PartForm + shared (DesignSelector, BranchSelector, DesignPhaseIndicator, AttributesEditor, ItemNumberField/format.ts) EN/RU, entities.json 134 базовых ключа, гейты зелёные.
- Далее: коммит B1b → B1c (PartDetail 1031 строка + Sidebar).
- [B1c done] B1c1 (f709eab) header, B1c2 (2fc3620) body tabs/sections + ManufacturingCard, B1c3 (44fb27a) Sidebar (attributes.title reuse + sidebar.files/metadata/created/lastModified/masterId/partId) — паритет 100%, все гейты зелёные.
- [B2a done] documents (6a458e3): DocumentTable + DocumentForm + DocumentDetail + 3 routes, entities.documents 102 ключа EN/RU (table/form/list/toasts/dialogs/header/detail), все гейты зелёные. Остаток-аудит: только itemType/itemNumber литералы (как пилот).
- [B2b done] change-orders core (b8f2cd1): ChangeOrderTable + ChangeOrderForm + ChangeOrderDetail + 3 routes, entities.change-orders 130 ключей EN/RU (table/form/dialogs/header/tabs/detail/list/toasts), хардкодов 0, все гейты зелёные. Диагностика: поисковый индекс устаревал vs диск — истина через node fs.readFileSync.
- [B2c-1 done] change-orders add-dialogs (840c3ea): AddToChangeOrderDialog + AddPartChoice + AddPartToStructureDialog + AddAffectedItemDialog, entities.change-orders.addDialogs 39 ключей EN/RU, паритет 100%, все гейты зелёные.
- [B2c-2a done] change-orders panels set 1 (5 файлов): ApprovalStatusPanel + ConflictsList + InstanceStatePropertiesPanel + InstanceTransitionPropertiesPanel + LifecycleInstanceEditor, entities.change-orders.panels 107 ключей EN/RU (approval 20 / conflicts 42 / stateProps 29 / transitionProps 13 / lifecycleEditor 3, включая finalKindPlaceholder), паритет 100%, typecheck-all EXIT 0, eslint touched EXIT 0, license/eol EXIT 0. Фиксы: бейдж existingVote через approved/rejected, SelectValue плейсхолдер через ключ, RU-опечатки (двойные О, пропуски П/Е/О).
- [B2c-2b done] change-orders тяжёлые панели (7 файлов): AffectedItems/Impact(i18n-helper)/DesignStructureTree/SummaryDashboard/HistoryGraph/TreeTable/GraphItemNode, entities.change-orders.panels actions+7 секций (~130 ключей EN/RU, плюралы one/few/many/other + listJoin), паритет 100% (EN 917 / RU 959), typecheck-all EXIT 0, eslint touched EXIT 0, license/eol EXIT 0. Фиксы: lowerFirst вместо toLowerCase (акроним BOM), listJoin вместо хардкода and, no-shadow (t→itemType), import/order для ./impact-i18n, license-stamp нового файла.
- Next: B2c-2b = change-orders тяжёлые панели (7 файлов: AffectedItems/Impact/DesignStructureTree/SummaryDashboard/HistoryGraph/TreeTable/GraphItemNode), B3-B5 = requirements/software/tests/tools, Wave 3 = tour/toasts, затем vitest/build/Docker/PR.

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

