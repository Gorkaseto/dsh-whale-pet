/**
 * Whale pet — Client half of the dsh-whale-pet bundle.
 *
 * A small pixel-art blue-and-white whale, drawn after the DeepSeek logo,
 * that sits on top of the composer card while a Session is still blank (the
 * New Session hero). It bobs on the spot, flaps its tail, blinks, and every few seconds blows a water spout;
 * clicking it makes it hop and spout at once. Every so often it lets its tail
 * droop down and then lifts it again. Now and then it dives below a
 * pixel waterline, peeks its head out for a moment and surfaces again.
 *
 * The plugin occupies one entry in `conversation.input.dock` (full-width
 * entries rendered right above the composer card) and renders nothing once
 * the Session leaves the blank phase, so an active chat is never crowded.
 *
 * The sprite is drawn as an inline SVG of 1×1 rects with crisp edges; the
 * animations are CSS step keyframes so it moves like a sprite sheet, and
 * they stop under `prefers-reduced-motion`. Styles use only this plugin's
 * `wp-` prefix.
 */
window.__ModuleLoader__.load({
  id: 'dsh-whale-pet',
  factory(require) {
    const React = require('react')
    const h = React.createElement
    const { useEffect, useMemo, useState } = React

    const SLOT = 'conversation.input.dock'
    const NS = 'dsh-whale-pet'

    const en = { 'pet.aria': 'Pixel whale pet — click to make it spout' }
    const zh = { 'pet.aria': '像素鲸鱼宠物——点击让它喷水' }
    const es = { 'pet.aria': 'Ballena pixel art — haz clic para que eche agua' }

    /** Pixel palette, after the DeepSeek whale: B blue, W white, S spout. */
    const PALETTE = {
      B: '#5068b2',
      W: '#ffffff',
      S: '#a9c8ff',
      L: '#7fa6e8',
    }

    /** Round body with the white belly swoosh, eye left out. Each row is 26 pixels wide. */
    const BODY = [
      '..........................',
      '........BBBBB.............',
      '.....BBBBBBBBBB...........',
      '...BBBBBBBBBBBBB..........',
      '..BBBBBBBBBBBBBBB.........',
      '.BBBBBBBBBBBBBBBB.........',
      '.BBBBBBBBBBBBBBBBB........',
      'BBWWWWWBBBBBBBBBBB.BBB....',
      'BBWWWWWWWBBBBBBBBBBBBB....',
      'BBBWWWWWWWBBBBBBBBBBBB....',
      'BBBWWWWWWWWBBBBBBBBBBB....',
      '.BBBWWWWWWWWBBBBBBBBBB....',
      '.BBBBWWWWWWWWBBBBBBBB.....',
      '..BBBWWBWWWWWWBBBBBB......',
      '...BBBWBBWWWWWWBBBB.......',
      '....BBBBBBBWWWWWWBBBB.....',
      '.....BBBBBBBBBBBBWBBBB....',
      '.......BBBBBBBBBBB........',
    ]

    /** Raised flukes, drawn from column TAIL_X. */
    const TAIL_UP = [
      '.BB......',
      'BBB......',
      'BBB....BB',
      'BBBB..BBB',
      '.BBBBBBBB',
      '..BBBBBB.',
      '..BBBB...',
    ]

    /** Flukes mid-flap: the left lobe dips while the right one lifts. */
    const TAIL_DOWN = [
      '.......BB',
      '......BBB',
      '.BB..BBBB',
      'BBBBBBBBB',
      'BBBBBBBB.',
      '..BBBBB..',
      '..BBBB...',
    ]

    /** Lowered flukes, resting down and back along the waterline. */
    const TAIL_LOW = [
      '.........',
      '.........',
      '.........',
      '.........',
      '.BB......',
      'BBBB.....',
      'BBBBBB...',
      '.BBBBBBBB',
      '...BBBBBB',
      '.....BBB.',
    ]

    /** Open eye (white blob, blue pupil on its left), drawn from EYE_X, EYE_Y. */
    const EYE_OPEN = [
      'WWW..',
      'BWWW.',
      'WWWWW',
      '.WWW.',
    ]

    /** Closed eye: a single white lash line. */
    const EYE_SHUT = [
      '.....',
      '.....',
      'WWWWW',
      '.....',
    ]

    /** Water spout drawn above the blowhole. */
    const SPOUT = [
      'S...S',
      '.S.S.',
      'S.S.S',
      '..S..',
      '..S..',
    ]

    /** Waterline shown while diving, two wave frames; row 0 sits over the whale's last row. */
    const WAVE_A = [
      '..SS......SS......SS......',
      'LLLLLLLLLLLLLLLLLLLLLLLLLL',
    ]
    const WAVE_B = [
      '.......SS......SS......SS.',
      'LLLLLLLLLLLLLLLLLLLLLLLLLL',
    ]

    /** Droplets thrown up when the whale breaks the surface. */
    const SPLASH = [
      '.S....S...S..S..',
      'S..S.S..S....S.S',
    ]

    const WIDTH = 26
    const SPOUT_ROWS = SPOUT.length
    const HEIGHT = BODY.length + SPOUT_ROWS
    /** On-screen size of one sprite pixel. */
    const SCALE = 2.55
    /** Column of the spout's left edge, so its stem lands on the blowhole. */
    const SPOUT_X = 8
    const TAIL_X = 17
    const EYE_X = 13
    const EYE_Y = 8
    /** Seconds between dives (random in this range). */
    const DIVE_MIN = 14
    const DIVE_MAX = 32
    /** Seconds between tail droops (random in this range). */
    const LOWER_MIN = 7
    const LOWER_MAX = 16

    /**
     * Dive path as [percent, sprite pixels below rest]; held frame to frame
     * with steps(1). Sinks tail-last, peeks the head with the eye, sinks
     * again, then surfaces.
     */
    const DIVE = [
      [0, 0], [3, 2], [6, 5], [9, 9], [12, 13], [15, 17], [18, 21], [21, 24],
      [42, 20], [45, 15], [48, 11], [51, 8], [58, 9], [64, 8], [70, 9], [76, 8],
      [80, 12], [83, 17], [86, 24],
      [90, 18], [92, 12], [94, 7], [96, 3], [98, 0], [100, 0],
    ]
    /** Flukes vanish once under and stay hidden through the peek. */
    const DIVE_TAIL = [[0, 1], [22, 0], [88, 1], [100, 1]]
    const DIVE_WATER = [[0, 0], [3, 1], [98, 0], [100, 0]]
    const DIVE_SPLASH = [[0, 0], [6, 1], [15, 0], [44, 1], [50, 0], [88, 1], [96, 0], [100, 0]]

    /**
     * Build a stepped keyframes block.
     * @param name - animation name.
     * @param list - [percent, value] pairs.
     * @param decl - turns a value into the CSS declarations for that frame.
     * @returns the @keyframes rule.
     */
    function frames(name, list, decl) {
      return `@keyframes ${name} { ${list.map(([p, v]) => `${p}% { ${decl(v)} }`).join(' ')} }`
    }

    /**
     * Turn pixel rows into SVG rects (horizontal runs merged per colour).
     * @param rows - pixel rows, one character per pixel, `.` transparent.
     * @param dy - vertical offset in sprite pixels.
     * @param dx - horizontal offset in sprite pixels.
     * @returns rect elements.
     */
    function pixels(rows, dy, dx = 0) {
      const out = []
      rows.forEach((row, y) => {
        let x = 0
        while (x < row.length) {
          const key = row[x]
          let end = x + 1
          while (end < row.length && row[end] === key) end += 1
          if (key !== '.') {
            out.push(h('rect', {
              key: `${y}:${x}`, x: x + dx, y: y + dy, width: end - x, height: 1, fill: PALETTE[key],
            }))
          }
          x = end
        }
      })
      return out
    }

    const CSS = `
/* Zero-height entry: the stack gap it adds is cancelled, so the workspace row
   stays next to the card and the pet shares that row on the right. */
.wp-dock {
  height: 0; margin-top: -8px;
  position: relative; z-index: 2; pointer-events: none;
}
.wp-pet {
  position: absolute; right: 28px; bottom: -10px;
  pointer-events: auto; cursor: pointer; border: none; background: transparent; padding: 0;
  line-height: 0; outline: none;
  animation: wp-bob 1.6s steps(2, jump-none) infinite;
}
.wp-pet:focus-visible { filter: drop-shadow(0 0 2px var(--dsw-alias-border-l3, #4d6bfe)); }
.wp-pet svg { display: block; image-rendering: pixelated; shape-rendering: crispEdges; overflow: visible; }
.wp-hop { animation: wp-hop 0.6s steps(6) 1; }
.wp-up { animation: wp-tail 0.8s steps(1) infinite; }
.wp-down { animation: wp-tail-alt 0.8s steps(1) infinite; }
.wp-eye { animation: wp-blink 3.8s steps(1) infinite; }
.wp-shut { opacity: 0; animation: wp-blink-alt 3.8s steps(1) infinite; }
.wp-spout { opacity: 0; animation: wp-spout 5s steps(1) infinite; }
.wp-hop .wp-spout { animation: wp-spout-now 0.6s steps(1) 1; }
.wp-low { opacity: 0; }
/* Tail droop: raised, mid-flap, lowered for a while, mid-flap, raised again. */
.wp-lowering .wp-up { animation: wp-lower-up 3s steps(1) 1; }
.wp-lowering .wp-down { animation: wp-lower-mid 3s steps(1) 1; }
.wp-lowering .wp-low { animation: wp-lower-low 3s steps(1) 1; }
@keyframes wp-lower-up { 0% { opacity: 1; } 8% { opacity: 0; } 92% { opacity: 1; } }
@keyframes wp-lower-mid { 0% { opacity: 0; } 8% { opacity: 1; } 16% { opacity: 0; } 84% { opacity: 1; } 92% { opacity: 0; } }
@keyframes wp-lower-low { 0% { opacity: 0; } 16% { opacity: 1; } 84% { opacity: 0; } 100% { opacity: 0; } }
.wp-water, .wp-splash { opacity: 0; }
.wp-diving { animation: none; }
.wp-diving .wp-swim { animation: wp-dive 6s steps(1) 1 forwards; }
.wp-diving .wp-tails { animation: wp-dive-tail 6s steps(1) 1; }
.wp-diving .wp-water { animation: wp-dive-water 6s steps(1) 1; }
.wp-diving .wp-splash { animation: wp-dive-splash 6s steps(1) 1; }
.wp-diving .wp-spout { animation: none; opacity: 0; }
.wp-diving .wp-shadow { visibility: hidden; }
.wp-wave-a { animation: wp-tail 0.9s steps(1) infinite; }
.wp-wave-b { animation: wp-tail-alt 0.9s steps(1) infinite; }
${frames('wp-dive', DIVE, (dy) => `transform: translateY(${dy}px);`)}
${frames('wp-dive-tail', DIVE_TAIL, (o) => `opacity: ${o};`)}
${frames('wp-dive-water', DIVE_WATER, (o) => `opacity: ${o};`)}
${frames('wp-dive-splash', DIVE_SPLASH, (o) => `opacity: ${o};`)}
.wp-shadow { animation: wp-shadow 1.6s steps(2, jump-none) infinite; transform-origin: center; transform-box: fill-box; }
@keyframes wp-bob { 0% { transform: translateY(0); } 100% { transform: translateY(-${SCALE}px); } }
@keyframes wp-shadow { 0% { transform: scaleX(1); } 100% { transform: scaleX(0.85); } }
@keyframes wp-hop {
  0% { transform: translateY(0); } 20% { transform: translateY(-${SCALE * 3}px); }
  40% { transform: translateY(-${SCALE * 5}px); } 60% { transform: translateY(-${SCALE * 4}px); }
  80% { transform: translateY(-${SCALE * 2}px); } 100% { transform: translateY(0); }
}
@keyframes wp-tail { 0% { opacity: 1; } 50% { opacity: 0; } }
@keyframes wp-tail-alt { 0% { opacity: 0; } 50% { opacity: 1; } }
@keyframes wp-blink { 0% { opacity: 1; } 94% { opacity: 0; } 97% { opacity: 1; } }
@keyframes wp-blink-alt { 0% { opacity: 0; } 94% { opacity: 1; } 97% { opacity: 0; } }
@keyframes wp-spout {
  0% { opacity: 0; transform: translateY(0); }
  70% { opacity: 1; transform: translateY(0); }
  76% { opacity: 1; transform: translateY(-1px); }
  82% { opacity: 1; transform: translateY(-2px); }
  88% { opacity: 0; }
}
@keyframes wp-spout-now {
  0% { opacity: 1; transform: translateY(0); } 33% { opacity: 1; transform: translateY(-1px); }
  66% { opacity: 1; transform: translateY(-2px); } 100% { opacity: 0; }
}
@media (prefers-reduced-motion: reduce) {
  .wp-pet, .wp-hop, .wp-up, .wp-down, .wp-eye, .wp-shut, .wp-shadow, .wp-hop .wp-spout { animation: none; }
  .wp-down, .wp-shut, .wp-low { opacity: 0; animation: none; }
  .wp-spout { animation: none; opacity: 0; }
  .wp-swim, .wp-tails, .wp-water, .wp-splash, .wp-wave-a, .wp-wave-b { animation: none; }
}
`

    /** The sprite itself: body, two tail frames, a blinking eye, the spout and the dive waterline. */
    function WhaleSprite() {
      const art = useMemo(() => ({
        body: pixels(BODY, SPOUT_ROWS),
        up: pixels(TAIL_UP, SPOUT_ROWS, TAIL_X),
        down: pixels(TAIL_DOWN, SPOUT_ROWS, TAIL_X),
        low: pixels(TAIL_LOW, SPOUT_ROWS, TAIL_X),
        open: pixels(EYE_OPEN, SPOUT_ROWS + EYE_Y, EYE_X),
        shut: pixels(EYE_SHUT, SPOUT_ROWS + EYE_Y, EYE_X),
        spout: pixels(SPOUT, 0, SPOUT_X),
        waveA: pixels(WAVE_A, HEIGHT - 1),
        waveB: pixels(WAVE_B, HEIGHT - 1),
        splash: pixels(SPLASH, HEIGHT - 3, 4),
      }), [])
      return h('svg', {
        viewBox: `0 0 ${WIDTH} ${HEIGHT + 1}`,
        width: Math.round(WIDTH * SCALE),
        height: Math.round((HEIGHT + 1) * SCALE),
        'aria-hidden': true,
      },
        h('rect', {
          className: 'wp-shadow', x: 4, y: HEIGHT, width: 16, height: 1,
          fill: 'currentColor', opacity: 0.12,
        }),
        h('defs', null,
          // Everything below the resting belly line is underwater.
          h('clipPath', { id: 'wp-sea' }, h('rect', { x: -8, y: -8, width: WIDTH + 16, height: HEIGHT + 8 }))),
        h('g', { clipPath: 'url(#wp-sea)' },
          h('g', { className: 'wp-swim' },
            h('g', { className: 'wp-spout' }, art.spout),
            h('g', null, art.body),
            h('g', { className: 'wp-tails' },
              h('g', { className: 'wp-up' }, art.up),
              h('g', { className: 'wp-down' }, art.down),
              h('g', { className: 'wp-low' }, art.low)),
            h('g', { className: 'wp-eye' }, art.open),
            h('g', { className: 'wp-shut' }, art.shut))),
        h('g', { className: 'wp-water' },
          h('g', { className: 'wp-wave-a' }, art.waveA),
          h('g', { className: 'wp-wave-b' }, art.waveB)),
        h('g', { className: 'wp-splash' }, art.splash))
    }

    /**
     * Dock entry: visible only while the Session is still a blank New Session.
     * @param props - standard Session props (`useSession`) and the locale seat `t`.
     * @returns the pet above the composer card, or null.
     */
    function WhalePet({ useSession, t }) {
      const blank = useSession((s) => s.blank === true && s.running !== true && s.promptAttempted !== true)
      const [hops, setHops] = useState(0)
      const [hopping, setHopping] = useState(false)
      const [diving, setDiving] = useState(false)
      const [lowering, setLowering] = useState(false)
      // Schedule the next dive whenever the whale is back at rest.
      useEffect(() => {
        if (!blank || diving) return undefined
        if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return undefined
        const wait = (DIVE_MIN + Math.random() * (DIVE_MAX - DIVE_MIN)) * 1000
        const timer = setTimeout(() => { setHopping(false); setLowering(false); setDiving(true) }, wait)
        return () => clearTimeout(timer)
      }, [blank, diving])
      // Now and then let the tail droop and lift it again.
      useEffect(() => {
        if (!blank || diving || lowering) return undefined
        if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return undefined
        const wait = (LOWER_MIN + Math.random() * (LOWER_MAX - LOWER_MIN)) * 1000
        const timer = setTimeout(() => setLowering(true), wait)
        return () => clearTimeout(timer)
      }, [blank, diving, lowering])
      if (!blank) return null
      return h('div', { className: 'wp-dock' },
        h('style', null, CSS),
        h('button', {
          // Re-keying restarts the one-shot hop animation on every click.
          key: hops,
          type: 'button',
          className: `wp-pet${diving ? ' wp-diving' : hopping ? ' wp-hop' : ''}${lowering && !diving ? ' wp-lowering' : ''}`,
          title: t('pet.aria'),
          'aria-label': t('pet.aria'),
          onMouseDown: (event) => { event.preventDefault() },
          onClick: () => { if (!diving) { setHops((n) => n + 1); setHopping(true) } },
          onAnimationEnd: (event) => {
            if (event.animationName === 'wp-hop') setHopping(false)
            if (event.animationName === 'wp-dive') setDiving(false)
            if (event.animationName === 'wp-lower-low') setLowering(false)
          },
        }, h(WhaleSprite)))
    }

    return {
      inject: ['locale', 'slots'],
      apply(ctx) {
        ctx.effect(() => ctx.locale.register(NS, { en, zh }), 'dsh-whale-pet: locale dictionaries')
        // Spanish is an external locale; skip it quietly when this build has no `es` definition.
        ctx.effect(() => {
          try { return ctx.locale.register(NS, 'es', es) } catch { return () => {} }
        }, 'dsh-whale-pet: es dictionary')
        ctx.slots.inject(SLOT, () => ctx.slots.register({
          name: SLOT,
          id: 'dsh-whale-pet',
          order: 90,
          locale: NS,
        }, WhalePet))
      },
    }
  },
})
