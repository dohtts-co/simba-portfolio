# Site Template — Reusable Context

A theme-agnostic template extracted from this portfolio. Use it as the structural / animation / accessibility starting point for the next site, then bolt a new visual theme on top.

---

## 1. Tech Stack

| Concern | Choice | Why |
| --- | --- | --- |
| Bundler / dev server | **Create React App** (`react-scripts`) | Zero-config, fine for a small marketing/portfolio site. Swap for **Vite** on greenfield. |
| Routing | **react-router-dom v6** (`BrowserRouter`) | `useLocation` powers per-route page transitions. |
| Styling | **Tailwind CSS** + PostCSS + Autoprefixer | Utility-first; theme tokens live in `tailwind.config.js`. |
| Animation | **framer-motion** | `motion.*`, `AnimatePresence`, `useScroll`, `useTransform`, `useSpring`, `useInView`, `useReducedMotion`. |
| Typed hero effect | **typed.js** | Cycling tagline in the H1. |
| Smooth scroll | **lenis** | RAF-driven inertial scroll, exposed via a React context so modals can pause it. |
| UI primitives (optional) | `@nextui-org/react` | Not heavily relied on — only pull in what's used. |
| Backend hooks (optional) | `@supabase/supabase-js` | Stubbed client; site itself is static. |
| Form transport | **HeroTofu** (HTTPS POST, no backend) | Drop-in form endpoint. Replace with Formspree / your own API as needed. |
| RSS feed proxy | `api.rss2json.com` | Avoids CORS for pulling Substack/blog feeds on the client. |
| Fonts | Google Fonts: **Inter** (body), **Space Grotesk** (display), **JetBrains Mono** (mono) | Preconnect + single stylesheet link. |

---

## 2. Project Structure

```
public/
  index.html                 # Font preconnects, theme-color meta, #root
  favicon.svg
  icons/skills/*.svg|png     # Tech stack logos
  images/projects/*.jpg      # Project hero images

src/
  index.js                   # ReactDOM root + StrictMode + ./tailwind.css
  tailwind.css               # @tailwind directives, base resets, keyframes, prefers-reduced-motion
  App.js                     # Router + LenisProvider + ScrollProgress + AnimatedRoutes
  animations.js              # Central module: easings, spring presets, AnimatedArrow, NudgeOnHover
  reportWebVitals.js

  context/
    LenisContext.js          # Smooth-scroll provider + useLenis() hook

  components/
    Navbar.js                # Floating glass pill nav, layoutId active underline + hover underline
    MouseGlow.js             # Listens to mousemove, writes --mx/--my CSS vars
    Home.js                  # Landing page: hero, about, skills, featured, writing
    <GenericTag>.js          # E.g. TechTag — categorised pill component
    <BrandMark>.js           # E.g. JollyRoger — small reusable SVG/img logo

    Portfolio/
      PortfolioList.js       # Grid of cards + featured row (no layoutId — see §7.3)
      ProjectDetailModal.js  # Portal-rendered modal, scale+opacity in

    Contact/
      ContactForm.js         # Honeypot + idle/submitting/success/error states + spinner

  data/
    projects.js              # Array of { id, title, description, technologies, image, github_link, live_link, featured }
```

**Conventions**

- Page-level components live in `src/components/<PageName>.js` or `src/components/<Domain>/<PageName>.js`.
- Static content (project list, skill list, nav links) lives in plain JS arrays — either in `src/data/` or as a module-level `const` at the top of the file that consumes it.
- No state library — `useState` is enough.
- Reusable motion tokens (easings, springs) live in **one file** (`src/animations.js`), never inlined as magic numbers across components.

---

## 3. Routing & Page Transitions

`App.js` wraps everything in `<LenisProvider>` → `<Router>` and renders:

1. A skip-to-content link (`<a href="#main" className="sr-only focus:not-sr-only ...">`).
2. `<ScrollProgress />` — a top-of-page progress bar driven by `useScroll().scrollYProgress`, **passed through `useSpring`** before being applied as `scaleX`. The spring smooths fast scroll jumps so the bar feels physical, not glued to raw scroll value.
3. `<AnimatedRoutes />` — `AnimatePresence mode="wait"` around `<Routes location={location} key={location.pathname}>`, where each `<Route element>` is wrapped in `<PageTransition>`.

```jsx
// Smoothed scroll progress bar
const { scrollYProgress } = useScroll();
const scaleX = useSpring(scrollYProgress, {
  stiffness: 140, damping: 22, mass: 0.4, restDelta: 0.0005,
});
return (
  <motion.div
    className="fixed top-0 left-0 right-0 h-0.5 bg-accent z-50 origin-left pointer-events-none"
    style={{ scaleX }}
    aria-hidden="true"
  />
);
```

```jsx
// Page transition — Emil Kowalski-style settle: opacity + tiny y + tiny scale + blur clear
function PageTransition({ children }) {
  const reduce = useReducedMotion();
  if (reduce) return <>{children}</>;
  return (
    <motion.div
      initial={{ opacity: 0, y: 16,  scale: 0.985, filter: 'blur(6px)' }}
      animate={{ opacity: 1, y: 0,   scale: 1,     filter: 'blur(0px)' }}
      exit={{    opacity: 0, y: -8,  scale: 0.99,  filter: 'blur(6px)' }}
      transition={{ duration: 0.45, ease: EASE_OUT_EXPO }}
    >
      {children}
    </motion.div>
  );
}
```

- Uses `EASE_OUT_EXPO = [0.16, 1, 0.3, 1]` from `animations.js`.
- The small blur on enter/exit is what gives the page change a soft "settle" feel.
- A custom `<NotFound>` route mounted on `path="*"` keeps the same transition wrapper.

---

## 4. Central Animation Module (`src/animations.js`)

A single file exports every easing, spring, and shared motion helper. **Use this everywhere** instead of inlining bezier arrays or spring configs.

```js
// Easings
export const EASE_OUT_QUART = [0.22, 1, 0.36, 1];
export const EASE_OUT_EXPO  = [0.16, 1, 0.3, 1];
export const EASE_IN_OUT    = [0.32, 0.72, 0, 1];

// Spring presets — physical, low-energy
export const SPRING_SOFT   = { type: 'spring', stiffness: 180, damping: 24, mass: 0.6 };
export const SPRING_SNAPPY = { type: 'spring', stiffness: 320, damping: 26, mass: 0.5 };
export const SPRING_GENTLE = { type: 'spring', stiffness: 140, damping: 22, mass: 0.7 };

// Reveal-on-mount variant (used with stagger parents)
export const revealUp = {
  hidden:  { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE_OUT_EXPO } },
};
```

Plus two **shared components** used by every CTA / outbound link:

```jsx
// Arrow that nudges right on hover/focus of its parent (which uses `rest` / `nudge` variants)
export function AnimatedArrow({ char = '→', className = '', distance = 4 }) {
  const reduce = useReducedMotion();
  if (reduce) return <span className={className} aria-hidden="true">{char}</span>;
  return (
    <motion.span
      aria-hidden="true"
      className={`inline-block ${className}`}
      variants={{ rest: { x: 0 }, nudge: { x: distance } }}
      transition={SPRING_SNAPPY}
    >
      {char}
    </motion.span>
  );
}

// Wrapper that drives the arrow's "nudge" state from hover/focus
export function NudgeOnHover({ as: As = motion.span, children, className = '', ...rest }) {
  const reduce = useReducedMotion();
  if (reduce) return <span className={className}>{children}</span>;
  return (
    <As
      className={className}
      initial="rest"
      animate="rest"
      whileHover="nudge"
      whileFocus="nudge"
      {...rest}
    >
      {children}
    </As>
  );
}

// Usage:
<NudgeOnHover as={motion.a} href={url} className="...">
  Live Demo <AnimatedArrow char="↗" distance={3} />
</NudgeOnHover>

// Or wrap a Router Link:
<NudgeOnHover as={motion(Link)} to="/" className="...">
  Back home <AnimatedArrow />
</NudgeOnHover>
```

Why this pattern: parent dictates variants (`initial="rest" whileHover="nudge"`), child arrow consumes them through `variants={{ rest, nudge }}`. Both move in lockstep with a single spring, and the whole thing is reduced-motion safe at the helper boundary.

---

## 5. Smooth Scroll (Lenis) + Modal Hand-off

`LenisContext.js` creates a single Lenis instance in `useEffect`, drives it with a manual `requestAnimationFrame` loop, and exposes the ref via `useLenis()`. Modals call `lenis.stop()` on open and `lenis.start()` on close, so the page underneath can't drift while a dialog is up.

```js
const lenis = new Lenis({
  duration: 1.2,
  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  smoothWheel: true,
});
```

**Important:** any DOM element that should bypass Lenis (e.g. an overlay that handles its own scroll) needs `data-lenis-prevent` on it. The modal sets this on the outer overlay so wheel events inside the dialog don't get hijacked.

---

## 6. Design System (theme-agnostic)

### Color tokens (replace values, keep the names)

In `tailwind.config.js`:

```js
theme: {
  extend: {
    colors: {
      base:    '#020617',  // page bg — near-black
      surface: '#080e1a',  // slightly elevated bg
      accent: {            // single accent for CTAs, links, focus rings
        DEFAULT: '#f59e0b',
        400:     '#fbbf24',
        500:     '#f59e0b',
      },
    },
    boxShadow: {
      'accent-glow': '0 0 0 1px rgba(245,158,11,0.35), 0 8px 32px -4px rgba(245,158,11,0.25)',
    },
  },
}
```

The rest of the palette is **Tailwind's built-in `slate` scale**: `slate-900` for elevated cards, `slate-800` for surfaces, `slate-700` for borders, `slate-400` for body copy, `slate-500/600` for muted text. Only one accent — keep it loud.

### Typography

Three families, mapped to Tailwind via `fontFamily`:

| Token | Use | Font |
| --- | --- | --- |
| `font-sans` (default) | Body copy | Inter |
| `font-display` | Headings, brand mark | Space Grotesk |
| `font-mono` | Eyebrow labels, dates, small tags | JetBrains Mono |

**Eyebrow label pattern** — used above every section heading:

```html
<p className="text-xs font-mono text-accent tracking-[0.3em] uppercase mb-3">Section Name</p>
<h2 className="font-display text-3xl lg:text-4xl font-bold text-white mb-6">Heading</h2>
```

### Spacing rhythm

- Page max width: `max-w-5xl` (content) / `max-w-6xl` (project grid) / `max-w-2xl` (modals) / `max-w-lg` (forms).
- Horizontal padding: `px-6 sm:px-8`.
- Section vertical padding: `py-20`, separated by `border-t border-slate-800`.
- Card padding: `p-5` (small) / `p-7`–`p-8` (large).
- Card radius: `rounded-xl` (cards), `rounded-2xl` (hero/featured/modal/nav).

### Focus, selection, motion (in `src/tailwind.css`)

```css
@layer base {
  ::selection { background-color: rgba(245,158,11,0.35); color: #fff; }
  :where(a, button, [role="button"], input, select, textarea):focus-visible {
    outline: 2px solid #fbbf24;
    outline-offset: 2px;
    border-radius: 6px;
  }
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.001ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.001ms !important;
    scroll-behavior: auto !important;
  }
}
```

---

## 7. Animation Patterns (the meat)

All motion respects `useReducedMotion()` — at the top of every animated component:

```js
const reduce = useReducedMotion();
// then guard: animate={reduce ? undefined : {...}}
// or short-circuit: if (reduce) return <>{children}</>;
```

### 7.1 Reusable variants

Per-page variants pull `ease` / `transition` from `animations.js`:

```js
import { EASE_OUT_EXPO, SPRING_SOFT, SPRING_SNAPPY } from '../animations';

const fadeUp = {
  hidden:  { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE_OUT_EXPO } },
};

const stagger = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};
```

Apply as `variants={stagger} initial="hidden" animate="visible"` on a parent, then `variants={fadeUp}` on each child.

For scroll-in: swap `animate` for `whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-60px' }}`. The negative margin makes elements reveal *just before* they enter the viewport, which feels much better than waiting until the edge hits.

### 7.2 Top scroll-progress bar

Smoothed with `useSpring` — see §3.

### 7.3 Shared-element transitions: when to use them and when not

**Use `layoutId` for sibling-to-sibling transitions inside the same `AnimatePresence`** — e.g. the active-nav underline (§7.10) that slides between nav items.

**Do NOT use `layoutId` for grid-card → modal transitions** in this stack. Reasons we hit on this project:

- The modal is rendered through `createPortal` to `document.body` (necessary so stacking contexts / overflow clipping / Lenis can't trap it).
- The card images sit inside a translated parent (page transition, parallax, etc.). Framer's FLIP measures absolute positions; with translated parents, the morph snaps or jumps mid-flight.
- Mismatched layout (small thumbnail → tall hero image with different `object-fit`) creates a "rubber band" stretch even when the math works.

**The working pattern** (current code):

- Modal renders via portal to body.
- Modal animates with simple opacity + a tiny scale (`0.97 → 1` on enter, `1 → 0.98` on exit), spring-eased.
- Backdrop fades independently.
- No `layoutId` between card and modal — accept the trade.

```jsx
return createPortal(
  <AnimatePresence>
    {isOpen && (
      <motion.div
        data-lenis-prevent
        className="fixed inset-0 z-50 grid place-items-center p-4"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        transition={{ duration: 0.25, ease: EASE_OUT_EXPO }}
      >
        <motion.div /* backdrop */
          className="absolute inset-0 bg-black/70"
          style={{ backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }}
          onClick={onClose}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        />
        <motion.div /* dialog shell */
          ref={dialogRef}
          role="dialog" aria-modal="true" aria-labelledby={titleId}
          className="relative w-full max-w-2xl m-auto bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden shadow-2xl"
          initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.97 }}
          animate={reduce ? { opacity: 1 } : { opacity: 1, scale: 1 }}
          exit={   reduce ? { opacity: 0 } : { opacity: 0, scale: 0.98 }}
          transition={reduce
            ? { duration: 0.2 }
            : { ...SPRING_SOFT, opacity: { duration: 0.2, ease: EASE_OUT_EXPO } }}
        >
          {/* ... */}
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>,
  document.body
);
```

Notes on this snippet:

- `grid place-items-center` on the outer overlay does the centering — simpler and more robust than flex + transforms when nested motion is in play.
- `m-auto` on the dialog is belt-and-braces in case the grid breaks at some viewport.
- The backdrop uses **inline `backdropFilter`** (with the `WebkitBackdropFilter` fallback) instead of Tailwind's `backdrop-blur-sm`, because Tailwind's variant generates a class that some older Safari builds + transformed parents fight with. Inline style sidesteps the lottery.
- `data-lenis-prevent` on the overlay tells Lenis to ignore wheel events here.
- Opacity has its own (faster, eased) sub-transition so the dialog fades quickly while the spring handles scale at its own pace — feels natural.

### 7.4 Hero parallax (scroll-linked)

```js
const { scrollY } = useScroll();
const heroY       = useTransform(scrollY, [0, 500], [0, -70]);
const heroOpacity = useTransform(scrollY, [0, 320], [1, 0]);

<motion.div style={reduce ? undefined : { y: heroY, opacity: heroOpacity }}>...</motion.div>
```

### 7.5 Magnetic button (cursor attraction) + arrow-nudge variants

```js
function MagneticButton({ href, children, className, ...props }) {
  const ref = useRef(null);
  const reduce = useReducedMotion();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const xS = useSpring(x, { stiffness: 220, damping: 18 });
  const yS = useSpring(y, { stiffness: 220, damping: 18 });

  const onMove = (e) => {
    if (reduce) return;
    const r = ref.current.getBoundingClientRect();
    x.set((e.clientX - (r.left + r.width / 2))  * 0.35);
    y.set((e.clientY - (r.top  + r.height / 2)) * 0.35);
  };
  const onLeave = () => { x.set(0); y.set(0); };

  return (
    <motion.a
      ref={ref}
      href={href}
      style={reduce ? undefined : { x: xS, y: yS }}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className={className}
      initial="rest" animate="rest" whileHover="nudge" whileFocus="nudge"
      {...props}
    >
      {children /* expects <AnimatedArrow/> as part of its children */}
    </motion.a>
  );
}

// Usage:
<MagneticButton href="/projects" className="...">
  Set Sail <AnimatedArrow distance={5} />
</MagneticButton>
```

The magnetic translate (`x`, `y`) and the arrow nudge (via the `rest`/`nudge` variants) run independently — one tracks mouse, the other reacts to hover/focus state. They compose cleanly because variants don't fight `style`.

### 7.6 Mouse-tracking ambient glow

A single radial gradient on the page background, anchored by two CSS variables that `MouseGlow.js` writes to `<html>` on `mousemove`:

```jsx
// component
useEffect(() => {
  const root = document.documentElement;
  root.style.setProperty('--mx', '-1000px');
  root.style.setProperty('--my', '-1000px');
  const onMove = (e) => {
    root.style.setProperty('--mx', `${e.clientX}px`);
    root.style.setProperty('--my', `${e.clientY}px`);
  };
  window.addEventListener('mousemove', onMove);
  return () => window.removeEventListener('mousemove', onMove);
}, []);

// page wrapper
<div style={{
  backgroundImage:
    'radial-gradient(350px at var(--mx, -1000px) var(--my, -1000px), rgba(245,158,11,0.13), transparent 70%)',
}}>
```

### 7.7 Drifting ambient blobs

Two large blurred circles, slowly mirrored back and forth. Mounted **only while the hero is in view** (via `useInView(heroRef, { amount: 0.1 })`) and **only when reduced-motion is off** — that's the perf trick.

```jsx
{heroInView && !reduce && (
  <motion.div
    className="absolute top-1/3 left-1/4 w-[520px] h-[520px] bg-accent/5 rounded-full blur-3xl"
    animate={{ x: [0, 28, -18, 0], y: [0, -18, 28, 0] }}
    transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut', repeatType: 'mirror' }}
  />
)}
```

### 7.8 CSS keyframe library (in `tailwind.css`)

Use these for cheap looping motion that doesn't need framer's overhead. **The exact names are theme-flavored — rename for your project (`float-up` → `particle-rise`, `wave-*` → keep if you want a wave divider, `bob` → `hover-bob`, etc.).**

```css
@keyframes float-up {
  0%   { transform: translateY(0) scale(1);    opacity: 0;   }
  8%   { opacity: 1; }
  88%  { opacity: 0.5; }
  100% { transform: translateY(-85vh) scale(0.6); opacity: 0; }
}

@keyframes bob {
  0%, 100% { transform: translateY(0); }
  50%       { transform: translateY(-8px); }
}

/* Three layered wave dividers, each at a different speed for parallax */
@keyframes wave-front { 0%,100% { transform: translateX(0); }     50% { transform: translateX(-25%); } }
@keyframes wave-mid   { 0%,100% { transform: translateX(-20%); }  50% { transform: translateX(-45%); } }
@keyframes wave-back  { 0%,100% { transform: translateX(-8%); }   50% { transform: translateX(-33%); } }
```

### 7.9 Deterministic particle layer

Hardcode an array of particle positions (left%, delay, duration, size) instead of `Math.random()` so SSR/StrictMode renders are stable:

```js
const PARTICLES = [
  { x: 8,  delay: 0,   dur: 9,  size: 2   },
  { x: 18, delay: 3.2, dur: 12, size: 2.5 },
  // ...
];

{PARTICLES.map((p, i) => (
  <div key={i} className="absolute bottom-0 rounded-full bg-accent"
       style={{ left: `${p.x}%`, width: p.size, height: p.size, opacity: 0.08,
                animation: `float-up ${p.dur}s ${p.delay}s infinite ease-in` }} />
))}
```

### 7.10 Active-nav underline (layout animation) + hover-underline

A single `layoutId="nav-active-indicator"` spring underline that slides between active nav items, **plus** a non-active hover underline that scales from the left:

```jsx
<a className="group ..." aria-current={isActive ? 'page' : undefined}>
  {label}
  {isActive ? (
    <motion.span
      layoutId="nav-active-indicator"
      className="absolute -bottom-0.5 left-0 right-0 h-0.5 bg-accent rounded-full"
      transition={{ type: 'spring', stiffness: 500, damping: 35 }}
    />
  ) : (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute -bottom-0.5 left-0 right-0 h-0.5
                 bg-white/60 rounded-full origin-left scale-x-0
                 group-hover:scale-x-100 group-focus-visible:scale-x-100
                 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]
                 motion-reduce:transition-none"
    />
  )}
</a>
```

This is one of the few `layoutId`s that's safe to keep — the indicators are siblings inside the same `AnimatePresence`-less parent, no portal, no translate.

### 7.11 Card hover lift (spring-driven)

```jsx
<motion.div
  whileHover={reduce ? undefined : { y: -6, transition: SPRING_SOFT }}
  // reveal-on-scroll
  initial={{ opacity: 0, y: 22 }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true, margin: '-60px' }}
  transition={{ duration: 0.55, ease: EASE_OUT_EXPO, delay: i * 0.06 }}
  className="... transition-[border-color,box-shadow] duration-300"
>
```

Two things to note:

- Hover lift uses a **spring** transition explicitly (`SPRING_SOFT`), not a duration — feels more like a physical card.
- The Tailwind class is `transition-[border-color,box-shadow]` (not `transition-all`). Restricting which properties transition keeps the framer-motion `y` value from being interpolated through CSS as well.

Pair with `group` + `group-hover:scale-105 group-hover:opacity-100` on the inner `<img>` for a Ken-Burns-style image zoom.

### 7.12 Form field stagger-slide

```js
const formStagger = { hidden: {}, visible: { transition: { staggerChildren: 0.06, delayChildren: 0.1 } } };
const fieldSlide  = {
  hidden:  { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE_OUT_EXPO } },
};
```

(Earlier versions slid in from the left. Sliding *up* is calmer and matches the rest of the site's reveal direction — preferred.)

### 7.13 Inline button spinner

For the form's `'submitting'` state — a tiny rotating ring next to the label, no layout shift:

```jsx
<motion.span
  aria-hidden="true"
  className="inline-block w-3.5 h-3.5 border-2 border-slate-900/40 border-t-slate-900 rounded-full"
  animate={reduce ? undefined : { rotate: 360 }}
  transition={reduce ? undefined : { repeat: Infinity, ease: 'linear', duration: 0.8 }}
/>
Sending…
```

---

## 8. Component Patterns

### 8.1 Floating glass navbar

- `fixed top-4 left-1/2 -translate-x-1/2` — pinned, horizontally centred.
- `w-[calc(100%-2rem)] max-w-3xl` — pill that doesn't touch viewport edges.
- `bg-slate-900/70 backdrop-blur-xl border border-slate-700/60 rounded-2xl` — glass effect.
- Logo + small icon on the left, link list on the right.
- Links: external links open in a new tab (`target="_blank" rel="noopener noreferrer"`) — set by a flag in a `LINKS` array, not per-link JSX.
- Active link gets `aria-current="page"` and the shared `layoutId` underline; non-active links get a hover underline that scales from the left (§7.10).
- The optional small icon next to the logo is a hook for site personality (a slowly spinning compass / logo / etc.) — wrap it with `useReducedMotion` and `aria-hidden`.

### 8.2 Hero section (anatomy)

Layered, back to front:

1. Big sky/ambient gradient (`radial-gradient ellipse 130% 55% at 50% 0%`).
2. Two drifting blurred blobs (mounted only when in view + motion allowed).
3. Particle layer (`PARTICLES.map`).
4. Centered watermark logo (low opacity, bob animation).
5. **Content layer** — eyebrow label → animated typed headline → subhead → CTA row (`MagneticButton` + `AnimatedArrow`).
6. Optional decorative wave divider at the bottom (three SVG layers, each animating at a different speed).

Headline uses typed.js bound to a `<span ref={typedEl} />`. Reserve vertical space (`style={{ minHeight: '1.2em' }}`) so the typing doesn't reflow.

### 8.3 Modal (accessible, portal-rendered)

`ProjectDetailModal.js` is the reference. Checklist:

- [x] **Render via `createPortal(..., document.body)`** — escapes parent stacking contexts, overflow, and Lenis interception.
- [x] `data-lenis-prevent` on the overlay so wheel events don't get hijacked.
- [x] `role="dialog" aria-modal="true" aria-labelledby="..."` on the dialog shell.
- [x] Backdrop click → close. `Esc` → close.
- [x] **Focus trap**: cycle `Tab`/`Shift+Tab` between first/last focusable elements inside the dialog.
- [x] Move focus to the close button on open; restore focus to the trigger on close.
- [x] `document.body.style.overflow = 'hidden'` + `lenis.stop()` while open; restore on close.
- [x] Top + bottom gradient fades on the scrollable content (`from-slate-800 to-transparent`) as a scroll affordance.
- [x] Inner content area: `max-h-[60vh] overflow-y-auto`.
- [x] Animate with opacity + tiny scale (`0.97 → 1`) spring-eased. **Do not** use `layoutId` to morph from a card — see §7.3 for why.
- [x] Inline `backdropFilter: 'blur(6px)'` (+ `-webkit-` fallback) on the backdrop rather than Tailwind's `backdrop-blur-sm`.

### 8.4 Form (HeroTofu / static-friendly)

- Fields named in PascalCase (`Name`, `Email`, `Subject`, `Message`) — that's what HeroTofu emails to you.
- Use `FormData(form)` and `fetch(endpoint, { method: 'POST', headers: { Accept: 'application/json' }, body })`.
- Honeypot: a visually-hidden `<input name="_gotcha">`; bail if it's non-empty.
- State machine: `'idle' | 'submitting' | 'success' | 'error'`.
- **Submitting**: inline spinner (§7.13) replaces the arrow, button disabled.
- **Success**: replaces the form with a check-mark card (springs in with opacity + scale + y). Provide a "send another" button to return to `'idle'`.
- **Error**: `role="alert"` inline message above the submit button.
- Submit button uses the same `NudgeOnHover`/`AnimatedArrow` pattern via variants (`whileHover="nudge"`, `whileTap={{ scale: 0.97 }}`).
- `aria-busy="true"` is implicit by disabling the submit button while submitting.

### 8.5 RSS / external feed preview (client-side, no backend)

```js
fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(FEED_URL)}`)
  .then(r => r.json())
  .then(data => { if (data.status === 'ok') setArticles(data.items.slice(0, 3)); })
  .catch(() => {})
  .finally(() => setLoading(false));
```

Render a skeleton (`bg-slate-800 rounded-xl h-52 animate-pulse`) with `aria-busy="true" aria-live="polite"` while loading; a fallback "read on Substack" card if the feed is empty.

### 8.6 Categorised tag component

`TechTag.js` pattern: keep all tags muted by mapping each tag name to a *family* (`language` / `framework` / `infra`), and each family to a Tailwind class string. Stops the page from looking like a candy aisle.

```js
const TAG_FAMILY = {
  language:  'bg-slate-800 text-slate-200 border-slate-600',
  framework: 'bg-slate-800/70 text-slate-300 border-slate-700',
  infra:     'bg-slate-900 text-slate-400 border-slate-700',
};
const TAG_TO_FAMILY = { React: 'framework', PostgreSQL: 'infra', /* ... */ };
```

### 8.7 Image with letter fallback

Every project / featured image follows this pattern — if `onError` fires, render a big first-letter glyph instead of a broken-image icon:

```jsx
{!imgError ? (
  <img src={p.image} alt={p.title} loading="lazy" decoding="async" onError={() => setImgError(true)} />
) : (
  <span className="text-slate-600 text-6xl font-black" aria-hidden="true">{p.title.charAt(0)}</span>
)}
```

### 8.8 Brand-mark image with CSS filters

Single black-on-white source PNG, recoloured by CSS filters per variant:

```js
const variants = {
  watermark: { filter: 'invert(1)', mixBlendMode: 'screen' },          // white on dark
  footer:    { filter: 'invert(1) sepia(1) saturate(4) hue-rotate(4deg) brightness(0.75)' }, // accent tint
};
```

Cheap, no extra assets.

---

## 9. Accessibility Checklist

- [x] **Skip link** at the top of `App.js`, target `#main` (every page sets `id="main"` on its first content section).
- [x] **`prefers-reduced-motion`** honoured globally in CSS *and* per-component via `useReducedMotion()`. Never *only* the CSS — framer-motion animates JS values that CSS can't disable.
- [x] `AnimatedArrow` / `NudgeOnHover` collapse to plain `<span>` when reduced-motion is on — no variant logic runs.
- [x] Decorative elements are `aria-hidden="true"` (waves, blobs, particles, watermarks, decorative SVGs, the nudging arrows).
- [x] Every section has a heading and is `aria-labelledby` linked to it.
- [x] Cards used as buttons get `role="button" tabIndex={0}` and Enter/Space keyboard handlers.
- [x] Nested anchors inside clickable cards: `onClick={e => e.stopPropagation()}` *and* `onKeyDown={e => e.stopPropagation()}` so they don't trigger the card.
- [x] Visible `focus-visible` ring on every interactive element (set in `@layer base`).
- [x] `NudgeOnHover` triggers on `whileFocus` as well as `whileHover` — keyboard users get the same affordance.
- [x] All external links: `target="_blank" rel="noopener noreferrer"`.
- [x] Images: descriptive `alt`, or `alt=""` + `aria-hidden` for decorative.
- [x] `lang="en"` on `<html>`; `theme-color` meta; a `<noscript>` fallback line.

---

## 10. Performance Notes

- Animations that loop forever (blobs, particles, waves) are **conditionally mounted** based on `useInView(heroRef)` so they pause when the hero scrolls off-screen.
- `loading="lazy" decoding="async"` on every non-hero image.
- Fonts: `preconnect` to `fonts.googleapis.com` and `fonts.gstatic.com` (latter with `crossorigin`), single stylesheet `<link>` with `display=swap`.
- Particle positions are deterministic (no `Math.random` at render).
- StrictMode is on (`src/index.js`) — Lenis is created and torn down cleanly in `useEffect` for that reason.
- One Lenis instance per app, shared by context — never spin up per route.
- On cards, use **narrow `transition-[border-color,box-shadow]`** instead of `transition-all` so framer's transforms aren't double-driven by CSS.
- Modal lives in a portal — saves the rest of the page tree from re-flowing while it animates.
- `useSpring(scrollYProgress)` is cheap; the smoothing fixes jank on fast scroll without measurable overhead.

---

## 11. Page Recipe (drop-in section blocks)

When stamping out a new page, every section follows the same shape:

```jsx
<section className="max-w-5xl mx-auto px-6 sm:px-8 py-20 border-t border-slate-800"
         aria-labelledby="section-id-heading">
  <motion.div
    initial={{ opacity: 0, y: 28 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: '-60px' }}
    transition={{ duration: 0.6, ease: EASE_OUT_EXPO }}
  >
    <p className="text-xs font-mono text-accent tracking-[0.3em] uppercase mb-3">Eyebrow</p>
    <h2 id="section-id-heading" className="font-display text-3xl lg:text-4xl font-bold text-white mb-6">
      Section title
    </h2>
    {/* body */}
  </motion.div>
</section>
```

Footer is a thin `border-t border-slate-800 py-10 text-center` with a small brand mark and the current year.

---

## 12. Personality Hooks (keep, but rename per theme)

The current site is One-Piece-themed. The *slots* where flavor lives — replace the contents, keep the structure:

| Slot | Where | Generic version |
| --- | --- | --- |
| Background watermark logo | Hero, behind content, low opacity, slow bob | Any brand mark / monogram |
| Slowly rotating icon | Next to the logo in the navbar | Compass, gear, sigil, planet |
| Wave divider at the bottom of the hero | Three SVG layers, parallax animation | Mountains, dunes, circuit traces, bezier ribbon |
| Watermark text on card hover | `opacity-0 group-hover:opacity-[0.16]` corner text | Project status, year, type |
| CTA microcopy | "Set Sail →" | "Explore →", "Get started →", etc. |
| Accent colour | Amber (`#f59e0b`) | One bold colour, used sparingly |
| Footer brand mark | Tinted version of the watermark | Same image, different filter chain |

---

## 13. Bootstrap Checklist for a New Site

1. `npx create-react-app frontend` (or `npm create vite@latest`). Install: `react-router-dom framer-motion lenis typed.js tailwindcss postcss autoprefixer`.
2. Copy `tailwind.config.js`, `postcss.config.js`, `src/tailwind.css` from this repo; rename `treasure` → `accent` and change hex values.
3. Copy `src/animations.js` as-is — rename one of the easings if you want a different default feel, but keep the export shape (`EASE_*`, `SPRING_*`, `AnimatedArrow`, `NudgeOnHover`).
4. Copy `src/context/LenisContext.js`, `src/components/MouseGlow.js` as-is.
5. Copy `src/App.js` shape: `LenisProvider` → `Router` → skip link + smoothed `ScrollProgress` + `AnimatedRoutes` with `PageTransition` wrappers (opacity + tiny y + tiny scale + blur).
6. Build a `Navbar` from the floating-pill template; pass a `LINKS` array. Include both the active-`layoutId` indicator and the non-active hover-scale-x underline.
7. Stamp out pages using the **Page Recipe** in §11; reuse `fadeUp` / `stagger` variants and pull easings/springs from `animations.js`.
8. Build the modal as a **portal to `document.body`** with `data-lenis-prevent`, opacity + small scale. **Do not** wire up `layoutId` between cards and modal — see §7.3.
9. Wire forms to your chosen endpoint (HeroTofu / Formspree / your API) using the §8.4 state machine, including the inline spinner.
10. Audit against the **Accessibility Checklist** in §9 before shipping.
11. Replace the **Personality Hooks** in §12 with your theme.

---

## 14. Modal Pitfalls — Lessons Learned

A short list of things that *will* break if you re-add them. Kept as a warning for future-you:

- **`layoutId` from grid card → portal-rendered modal.** Looks great in framer's demos when the cards aren't in a translated/transformed parent. In a real page (page transition wrapper, parallax, etc.) the FLIP math gets the wrong starting rect and the morph snaps, jumps, or stretches. Diagnosis was "modal appears in the wrong place / wrong size for a frame." Cure: don't share `layoutId` across the portal boundary.
- **Tailwind `backdrop-blur-sm` on the backdrop, inside a transformed ancestor.** Some Safari versions silently drop the blur, or the blur is rendered behind the modal because of stacking-context promotion. Cure: inline `style={{ backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }}` on the backdrop element directly.
- **Forgetting `data-lenis-prevent`.** Modal scroll feels sluggish or doesn't scroll because Lenis is still consuming the wheel. Cure: put the attribute on the outermost portal element (the fixed inset-0 overlay).
- **Centering the dialog with `flex` + `transform` while also animating its `scale`.** The translate and scale fight each other and you get a 1-pixel jitter on enter. Cure: use `grid place-items-center` on the overlay (no transform-based centering) and animate only `scale` + `opacity` on the dialog.
- **Forgetting to restore body overflow and Lenis on unmount.** If the route changes while the modal is open, the unmount-cleanup path needs to call `document.body.style.overflow = ''` and `lenis.start()`. Otherwise the next page is frozen and there's no obvious cause.
