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
- [B3a done] requirements table/routes (40 ключей EN/RU: table/priorityLabels/list/toasts/dialogs): RequirementTable через priorityLabelKeys, routes index/new/$id.
- [B3b-1 done] RequirementForm (431 строка) EN/RU.
- [B3b-2 done] RequirementDetail: B3b-2a header/tabs (88e6815), B3b-2b body (f8880cf) — detail.* 19 ключей, паритет 100%, гейты зелёные.
- [B3b-3 done] (3bdc5b2) RequirementLinkingPanel + RequirementVerificationPanel EN/RU — linking.* 32/36 (RU few/many плюралы selectedCount/linkCount) + verification.* 17/17 (statusLabels NotRun/Passed/Failed/Blocked) + reuse priorityLabels/verificationStatusLabels через labelKeys-карты; паритет 100% (с учётом RU-плюралов), хардкодов 0 (только enum/API-литералы), typecheck-all EXIT 0, eslint touched EXIT 0, license/eol EXIT 0. Фиксы: лишний ?? после as keyof (as убирает undefined), no-shadow t→test в .filter, лишний as keyof при ?? 'NotRun'.
- [B4-2b done] (decab3f) software dictionaries header/tabs/form/detail/external EN/RU: header 20 + tabs 3 + form 22 + detail 16 + external 6, table targetHardware/sourceMode EN + RU-строки; EN-дубль sourceModeLabels/detail/external/header/tabs удалён, порядок секций выровнен под RU, паритет 100% (list RU few/many extra), интерполяции {{count}}/{{name}}/{{itemNumber}} сохранены, typecheck-all EXIT 0, license/eol EXIT 0, tmp-*.py удалены. Остаток B4-2c: проводка компонентов (SoftwareTable targetHardware/sourceMode колонки + SoftwareDetail/BuildArtifactCard/SourceViewer на t()).
- [B4-2c1 done] SoftwareDetail + BuildArtifactCard на t(), SourceViewer оставлен EN-островом: useTranslation в 3 компонентах SoftwareDetail + BuildArtifactCard, SOFTWARE_TYPE_VALUES/SOURCE_MODE_VALUES + t() options, External panels, cannotEditTitle, delete confirm через dialogs.*, getEditDisabledReason/getSourceReadOnlyReason через header.*, Details-tab form remainder (Overview/Information/Description/Source-card/Metadata/Custom Attributes), software.artifact.* 14/14 EN/RU (title/attachedFallback/empty/download/detach/uploading/replace/upload/attachedTitle/detachedTitle/detachedBody/uploadFailedTitle/uploadFailedBody/detachFailedTitle). Гейты: typecheck-all EXIT 0, eslint touched EXIT 0, license/eol EXIT 0, паритет software.* 100%, хардкодов UI 0 (itemType/Rev/v технические токены оставлены). Уроки: Select-String в PowerShell — кавычки шаблона одинарные наружу; git diff | Select-Object -Last падает с кодом 1 но вывод отдаёт (проверять текст, а не код); git log/status параллелить нельзя (виснет).
- [B4-1 done] (fdafd8b) tools EN/RU: ToolTable (table/typeLabels через typeFilterOptions + StateBadge/lifecycle multiSelect, menu/empty) + routes index/new/$id (list/dialogs/toasts) + ToolForm (form.* + TOOL_TYPE_VALUES + subtype Other) + ToolDetail (header/tabs/detail.* + form.* reuse + typeOptions) + CapabilitiesEditor (capabilities.*: 11 section titles + freeform hint/savedAs плюралы + selectSubtype/noRecorded; инженерные метки мм/RPM и коды подтипов оставлены); entities.tools 10 секций, паритет 100%, typecheck-all EXIT 0, eslint touched EXIT 0, license/eol EXIT 0. Уроки: построчные file-скрипты вместо match-замен на CRLF-файлах; $id.tsx в eslint только через копию без $; вставка хука splice затирает соседние строки — проверять diff сразу.

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

