# Assignment 6 — jQuery (Selectors, Effects, Animations)

Birthday party in a house: find the thief with jQuery selectors (Task 1) and bring the page to life with effects (Task 2).

## Structure
```
task1/   Selector Detective   (index.html, style.css, data.js, cases.js, app.js)
task2/   The party in motion  (copy of task1 + effects in app.js)
tools/   test and screenshot scripts (Playwright), not part of the pages
screens/ screenshots used in the report
```

## Run
Open `task1/index.html` or `task2/index.html` in a browser (internet is needed for jQuery from the CDN and the avatars from DiceBear).

## Rules followed
- only jQuery; no `onclick` attributes (events are attached with `.on()`);
- no CSS `transition` / `animation`: all movement is `animate()`, `fadeTo()`, `fadeIn()`, `fadeOut()`;
- the cases search the page (DOM), not the array.

## Task 2 in short
| Effect | Main tools |
|---|---|
| Spotlight / Clear | `fadeTo()`, `stop()` |
| Guest card | `offset()`, `animate()` with callback, state variable `profile.wanted` |
| Move | `clone()`, `animate()` with `step`, `offset()`, change of the `PARTY` array |
| Sort by time | `offset()`, `css()`, `animate()` with its own queue `slide`, `stop('slide', true)` |
