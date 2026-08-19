# Sonya — UX/UI Designer (лендинг)

Статическая страница. Без сборки: открывается как есть — `open index.html`
(или `python3 -m http.server` в корне, если нужен http).

## Структура

```
index.html          разметка (275 строк, отформатирована)
assets/
  css/              стили, подключаются по порядку — каскад имеет значение
    00-reset.css      Tailwind v4 reset + @layer theme (генерируется, руками не править)
    01-base.css       :root переменные, html/body/a/::selection, @keyframes
    02-header.css     .site-header, .brand, .desktop-nav, .header-cta
    03-portfolio.css  .portfolio-canvas, .portfolio-chunk (полотно скриншотов)
    04-about.css      .about-backdrop, .about-card-{skills,experience,education}
    05-cases.css      .detail-layer / .detail-* (устройства с кейсами)
    06-contacts.css   .contact-link-*, .page-anchor / .anchor-*
    07-buttons.css    .hero-work-link, .contact-hotspot, .back-to-cases
    08-responsive.css @media (width<=820px) + prefers-reduced-motion
  img/              все картинки
.prettierrc.json    форматирование: npx prettier --write .
```

## Что убрано из исходного сохранения страницы

Страница была сохранена из React/RSC-приложения. Удалён мёртвый код,
который локально ничего не делал:

- inline RSC-payload (`__VINEXT_RSC_CHUNKS__` и т.п.) — дублировал весь DOM в JSON;
- `<link rel="modulepreload">` на `/assets/*.js` — этих файлов в сохранении нет;
- Cloudflare bot-detection скрипт и его скрытый iframe (`saved_resource.html`).

Известное следствие: кнопка `.back-to-cases` (стрелка «наверх») показывается
только с классом `is-visible`, который раньше ставил React-компонент. Сейчас
JS нет вообще, поэтому кнопка не появляется — как и до чистки. Оживляется
несколькими строками ванильного JS, если понадобится.
