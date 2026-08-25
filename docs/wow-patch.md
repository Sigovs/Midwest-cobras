# Midwest Cobras — правки под «вау» на скролле

Разбор по фактическому коду репозитория `Sigovs/Midwest-cobras`, `index3.html` +
`assets/js/scene/*`. Ниже — только то, что реально меняется.

---

## 0. Главное, что нужно понять про причину

Сцена не «недоделана». Она **намеренно** зажата правилом, записанным в шапке
`choreography.js`:

> One primary temporal idea: THE CAR TURNS TO FACE WHATEVER IS BEING SAID ABOUT IT.
> If a second idea starts competing — one of the two is wrong, and the rule says
> it is the newer one.

Всё, что ты просишь — влёты, крупные буквы, вспышки фар — по этому правилу
считается «вторым конкурирующим идеей» и отсекается. Пока правило не смягчено,
любые добавки будут ощущаться как чужеродные заплатки.

**Предлагаю переписать правило так** (одна строка, но она меняет всё):

> Машина поворачивается к тому, о чём идёт речь — **и реагирует светом на то,
> в каком она положении**. Свет и разворот — одно событие, не два.

Это даёт легальное место фарам и стопам, не открывая дверь случайным эффектам.

---

## 1. Фары и стопы: сейчас это технически невозможно

`hero-scene.js:464`

```js
function setLights(v) {
  const k = Math.max(0, Math.min(1, v || 0));
  for (const m of lamps) m.emissiveIntensity = k * (/glow/i.test(m.name) ? 1.6 : 2.4);
}
```

Один скаляр на все лампы, цвет один — `0xfff2d6`. Я вытащил материалы из GLB:

| материал | bbox по z | что это |
|---|---|---|
| `ac_cobra427_lights` | **-2.139 … +1.739** | фары **и** фонари, один меш |
| `ac_cobra427_lightsglass` | +1.738 … +1.759 | только передняя оптика |

То есть на SHOT 4 (`data-lights="0.3"`, корма) сзади загорается бледно-кремовое
пятно. Красных стопов не будет никогда — не из-за силы эффекта, а из-за того,
что это тот же материал, что и фары.

**Правка.** Положи `lamps.js` (второй файл) в `assets/js/scene/` и подмени в
`hero-scene.js`:

```js
// было: let lamps = []; + function setLights(v) { ... }
import { createLamps } from './lamps.js';

let lamps = null;
function setLights(v) {
  if (lamps) lamps.setLights(typeof v === 'number' ? { head: v, tail: 0 } : v);
  dirty = true;
}
```

Убери push в `lamps` из `prepareModel` (строки 97–102) — модуль сам находит
материалы. После `normalise(car, THREE, LENGTH_M)` (строка ~552) добавь:

```js
lamps = createLamps(car, THREE);
```

И в `setPose`:

```js
if (p.lights !== undefined) setLights(p.lights);
if (p.lightsHead !== undefined || p.lightsTail !== undefined) {
  setLights({ head: p.lightsHead || 0, tail: p.lightsTail || 0 });
}
```

---

## 2. Свет включается слишком медленно, чтобы его заметить

Сейчас `lights` — обычный канал в общем скраб-твине с `duration: 1` на весь
экран. Разгон 0.3 → 0.7 растянут на ~900 px скролла. Мозг читает это как
изменение экспозиции, а не как «кто-то щёлкнул тумблером».

`choreography.js`, в `notes.forEach` — вынеси свет из позного твина:

```js
notes.forEach((note) => {
  const to = readPose(note, isNarrow);
  note.__pose = to;

  const seg = tl.to(state, {
    rotY: to.rotY, fov: to.fov,
    cx: to.cam[0], cy: to.cam[1], cz: to.cam[2],
    tx: to.target[0], ty: to.target[1], tz: to.target[2],
    ease: segmentEase, duration: 1,
    onUpdate() { /* ...как было... */ },
  });

  /* Лампа не «выцветает» — она щёлкает. 4 ступени за 12% сегмента.
     Скрабится вместе со всем: отмотал назад — машина отвернулась и погасла. */
  const at = seg.startTime ? seg.startTime() : '<';
  const flick = (prop, val) => {
    if (state[prop] === val) return;
    tl.to(state, { [prop]: val * 0.15, duration: 0.02, onUpdate: push }, at + 0.02)
      .to(state, { [prop]: val * 0.55, duration: 0.02, onUpdate: push })
      .to(state, { [prop]: val * 0.25, duration: 0.02, onUpdate: push })
      .to(state, { [prop]: val,        duration: 0.06, ease: 'power2.out', onUpdate: push });
  };
  flick('lightsHead', to.lightsHead);
  flick('lightsTail', to.lightsTail);
});
```

И в `readPose` добавь два канала вместо одного:

```js
lightsHead: parseFloat(attr('lightsHead', 0)) || 0,
lightsTail: parseFloat(attr('lightsTail', 0)) || 0,
```

Плюс в `state` (строка ~150): `lightsHead: 0, lightsTail: 0,`.

---

## 3. Разметка: где что горит

`index3.html`, заменить `data-lights` на пару атрибутов:

| шот | было | стало |
|---|---|---|
| hero (mount) | — | `data-lights-head="0"` |
| 01 профиль | — | `data-lights-head="0"` |
| 02 выхлоп | — | `data-lights-head="0"` |
| **03 корма** | `data-lights="0.3"` | `data-lights-head="0" data-lights-tail="1"` |
| 04 арка | `data-lights="0.7"` | `data-lights-head="0.7" data-lights-tail="0.35"` |
| 05 релиз | `data-lights="1"` | `data-lights-head="1" data-lights-tail="0.3"` |

SHOT 03 — это тот самый момент. Камера сзади, всё чёрное, и **два красных
пятна щёлкают в кадре**. Больше там ничего делать не надо.

Плюс в конец `arrival`-твина (`choreography.js:208`) добавь щелчок фар — сейчас
машина приезжает с выключенным светом и так и стоит весь первый экран:

```js
onComplete() {
  gsap.timeline({ onUpdate: push })
    .to(state, { lightsHead: 0.15, duration: 0.04 })
    .to(state, { lightsHead: 0.9,  duration: 0.05 })
    .to(state, { lightsHead: 0.35, duration: 0.05 })
    .to(state, { lightsHead: 1,    duration: 0.6, ease: 'power2.out' });
}
```

---

## 4. Крупные буквы за машиной — бесплатно

`hero-scene.js:242` → `scene.background = null`, рендерер с альфой, «the CSS
ground shows through». Значит DOM-слой **под** канвасом виден насквозь. Никакой
перерисовки модели не нужно.

В `index3.html`, первым ребёнком `.scene-scope`, **до** `.scene-mount`:

```html
<div class="scene-word" aria-hidden="true">
  <span>4</span><span>2</span><span>7</span>
</div>
```

CSS:

```css
.scene-word {
  position: absolute; inset: 0; z-index: 0;
  display: flex; align-items: center; justify-content: center;
  pointer-events: none; user-select: none;
  font-weight: 700;
  font-size: clamp(12rem, 30vw, 30rem);
  line-height: 0.76; letter-spacing: -0.05em;
  color: transparent;
  -webkit-text-stroke: 1.5px rgba(255,255,255,0.14);
}
.scene-word span { display: inline-block; will-change: transform; }
.scene-mount { position: relative; z-index: 1; }  /* проверь, не перебито ли */
```

И параллакс в `mountChoreography` — буквы едут медленнее машины, разъезжаются
по одной:

```js
const word = scope.querySelector('.scene-word');
if (word) {
  gsap.to(word.children, {
    xPercent: (i) => -22 + i * 22,
    ease: 'none',
    scrollTrigger: { trigger: reveal, start: 'top top', end: 'bottom bottom', scrub: 0.6 },
  });
  gsap.fromTo(word, { yPercent: 6 }, {
    yPercent: -6, ease: 'none',
    scrollTrigger: { trigger: reveal, start: 'top top', end: 'bottom bottom', scrub: 0.6 },
  });
}
```

---

## 5. Подписи не «выезжают», а моргают

`choreography.js:326` → `gsap.set(note, { autoAlpha: 0, y: 12 })`.

12 пикселей — ниже порога восприятия. Это не slide-in, это fade с шумом.
Замени на построчный выезд из-под маски:

```css
.note__body h3, .note__body .note__index { overflow: hidden; }
.note__body h3 > span, .note__body .note__index > span { display: block; }
```

```js
gsap.set(note, { autoAlpha: 0 });
const lines = note.querySelectorAll('.note__index > span, h3 > span');
gsap.set(lines, { yPercent: 110 });

// в onEnter / onEnterBack:
gsap.to(note, { autoAlpha: 1, duration: 0.25, onUpdate: drawCallout });
gsap.to(lines, { yPercent: 0, duration: 0.7, ease: 'expo.out', stagger: 0.07 });
```

(Заголовки в разметке придётся обернуть в `<span>` — по строке на span.)

---

## 6. Что я НЕ стал добавлять и почему

- **Влёт машины сбоку.** `arrivalFrom()` уже даёт заезд с дальней высокой точки,
  и он честнее: машина останавливается в комнате, а не «прилетает». Заменять —
  значит ломать соответствие с `hero-still-placeholder.jpg`, на который завязан
  handover канваса.
- **Bloom-пасс.** Ради двух ламп тянуть post-processing не стоит: +60 KB и
  минус кадры на мобиле, где сцена и так отключается по `tooLittleMachine()`.
  Halo-спрайты в `lamps.js` дают тот же результат за ~1 KB.

---

## 7. Отдельный баг, не про анимацию

На записи (шот 03) заголовок «RT4B Black Edition» лежит прямо на кузове и не
читается. `data-place="right"` ставит текст туда, где при `rot=212` находится
корма. Либо сдвигай `data-target` влево, либо добавь скрим под `.note__body`:

```css
.note__body { position: relative; }
.note__body::before {
  content: ''; position: absolute; inset: -12% -18%; z-index: -1;
  background: radial-gradient(ellipse at 30% 50%, rgba(6,7,8,0.9), transparent 70%);
}
```
