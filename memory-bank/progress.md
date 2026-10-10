# Progress — i18n RU

## Работает
- [x] Форк выгружен в d:\Documents\000_PLM, main чист.
- [x] Разведка: i18n нет, строки захардкожены, точки встраивания найдены.
- [x] План утверждён, ветка feature/i18n-ru создана.
- [x] Каркас i18n: `config.ts`, `types.ts`, `locales/{en,ru}/{common,auth,dashboard,layout,setup}.json`, deps (i18next 26, react-i18next 17, detector 8).
- [x] Волна 1: Header + LanguageSwitcher, ProfileDropdown, Sidebar/SidebarNav, ThemeToggle, login, SetupWizard + все steps, SummaryStep, index route, `__root.tsx`.
- [x] Гейты: setup.json parity 100%, typecheck-all EXIT 0, eslint --max-warnings 0 EXIT 0, license-headers --check EXIT 0, `node scripts/build-app.mjs` EXIT 0 (client 4580 модулей, server 12.2mb, worker 4.6mb).
- [x] Wave 2 B1a (0661ffd): parts list/table/routes EN/RU — PartTable (filterPlaceholder/revision/variants/material/cost/usedIn/usage plural/configurable/typeLabels/menu), routes parts/index (title/totalLabel/cardTitle/cardCount/viewing/create + delete dialog/toasts), new ($id) тосты created/updated/deleted; entities.json 58 базовых ключей, parity 100%.
- [x] Wave 2 B1b: PartForm + shared EN/RU — форма, DesignSelector, BranchSelector, DesignPhaseIndicator, AttributesEditor, ItemNumberField + format.ts через i18n.t; entities.json 134 базовых ключа, parity 100%, typecheck-all EXIT 0, eslint touched EXIT 0, license/eol EXIT 0.
- [x] Wave 2 B2c-1 (840c3ea): change-orders add-dialogs EN/RU — AddToChangeOrderDialog + AddPartChoice + AddPartToStructureDialog + AddAffectedItemDialog; entities.change-orders.addDialogs 39 ключей, паритет 100%, гейты зелёные.
- [x] Wave 2 B2c-2a: change-orders panels set 1 EN/RU — ApprovalStatusPanel + ConflictsList + InstanceStatePropertiesPanel + InstanceTransitionPropertiesPanel + LifecycleInstanceEditor; entities.change-orders.panels 107 ключей, паритет 100%, typecheck-all EXIT 0, eslint touched EXIT 0, license/eol EXIT 0.
- [x] Wave 2 B2c-2b: change-orders тяжёлые панели EN/RU — AffectedItems + Impact(impact-i18n.ts) + DesignStructureTree + SummaryDashboard + HistoryGraph + TreeTable + GraphItemNode; entities.change-orders.panels actions+7 секций, паритет 100% (EN 917 / RU 959), typecheck-all EXIT 0, eslint touched EXIT 0, license/eol EXIT 0.
- [x] Wave 2 B3a: requirements table/routes EN/RU — RequirementTable (table/priorityLabels через priorityLabelKeys/menu/empty), routes index (list.title/subtitle/create/totalLabel/cardTitle/cardCount плюралы/viewing + delete dialogs/toasts), new ($id) тосты created/updated/deleted; entities.requirements 40 базовых ключей EN/RU, паритет 100%, typecheck-all EXIT 0, eslint touched EXIT 0, license/eol EXIT 0.
- [x] Wave 2 B3b-1: RequirementForm EN/RU — форма + DesignSelector/BranchSelector reuse; entities.requirements.form/typeLabels/verificationLabels, паритет 100%, гейты зелёные.
- [x] Wave 2 B3b-2a: RequirementDetail header/tabs EN/RU — header.* + tabs.*, гейты зелёные.
- [x] Wave 2 B3b-2b (f8880cf): RequirementDetail body EN/RU — опции внутрь компонента через *_VALUES + t(typeLabels/priorityLabels/verificationMethodLabels/verificationStatusLabels), тело через form.* reuse + detail.* 19 ключей (overview/classification/verification/metadata/relationshipsHint + плейсхолдеры REQ-001/Requirement name/Requirement source/Category/Select type/method); паритет 100% (19/19), хардкодов тела 0, typecheck-all EXIT 0, eslint touched EXIT 0, license/eol EXIT 0. Уроки: file-скрипты вместо node -e/editor на больших файлах; сверка с git show HEAD при сомнениях в заголовках; плейсхолдеры-коды (REQ-001) тоже в detail.* по пилоту parts.detail.
- [x] Wave 2 B3b-3 (3bdc5b2): RequirementLinkingPanel + RequirementVerificationPanel EN/RU — LinkingPanel через linking.* (confirm/title/subtitle/loading/add/empty/remove/dialog/search/selected/link плюралы one/few/many/other, columns itemNumber/name/priority/verificationStatus) + priority/verification бейджи через priorityLabelKeys/verificationLabelKeys reuse; VerificationPanel через verification.* (title/subtitle/summary total/passed/failed/blocked/notRun/linkAction/searchPlaceholder/cancel/empty) + execution-бейджи через statusLabels-карту (NotRun/Passed/Failed/Blocked); entities.requirements EN +63 / RU +67, паритет 100% (linking 32/36 с RU few/many, verification 17/17), хардкодов 0, typecheck-all EXIT 0, eslint touched EXIT 0, license/eol EXIT 0. Уроки: ?? после `as keyof` лишний (as убирает undefined — no-unnecessary-condition); .filter((t) даёт no-shadow с t() — переименовывать в test/tc; tmp-скрипты удалять до license:check; git-процессы не параллелить (index.lock).

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

