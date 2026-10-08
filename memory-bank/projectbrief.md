# Project Brief — PLM i18n RU

## Цели
- Добавить поддержку русского языка в Cascadia PLM (форк AshmuneinStork/PLM).
- Полный перевод UI на RU + возможность выбора EN/RU.

## Скоуп
- Фронт `cascadia-web` через react-i18next.
- Волны: оболочка → сущности → остальное → форматы.
- Бэкенд-сообщения API вне скоупа фазы 1.

## Что НЕ делаем
- Новые языки кроме RU/EN, RTL.
- Бэкенд-тексты, письма, воркеры.
- Автоперевод без ревью.

## Стек
- React 19, Vite, TanStack Router/Query, i18next + react-i18next + i18next-browser-languagedetector.
