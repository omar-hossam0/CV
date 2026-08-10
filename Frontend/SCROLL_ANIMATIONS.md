# Premium Scroll Reveal Animations

Modern, smooth scroll-reveal animations inspired by Apple, Stripe, and Notion.

## Features

✨ **Premium Feel**
- Smooth fade-in + upward motion
- Soft, minimal, luxury aesthetic
- GPU-accelerated for 60fps performance
- One-time trigger (no repeated animations)

🎯 **Smart Timing**
- Staggered reveals for sequential elements
- Customizable delays (0.1s–0.5s)
- Multiple speed variants (fast/default/slow)

🔧 **Easy to Use**
- Reusable CSS classes
- React hook for automatic setup
- Component wrapper for quick implementation

---

## Quick Start

### 1. CSS Classes (Already Included)

Add one of these classes to any element:

```jsx
{/* Default reveal (0.7s) */}
<div className="reveal">Content here</div>

{/* Fast reveal (0.5s) - for small elements */}
<button className="reveal-fast">Click me</button>

{/* Slow reveal (0.9s) - for hero sections */}
<section className="reveal-slow">Hero content</section>

{/* Scale + fade - for cards/images */}
<div className="reveal-scale">
  <img src="..." alt="..." />
</div>
```

### 2. Staggered Delays

Add `data-delay` attribute for sequential reveals:

```jsx
<div className="reveal" data-delay="1">First</div>
<div className="reveal" data-delay="2">Second</div>
<div className="reveal" data-delay="3">Third</div>
```

Delays: 1 = 0.1s, 2 = 0.2s, 3 = 0.3s, etc.

---

## React Hook Usage

### Import the hook

```jsx
import { useScrollReveal } from '../hooks/useScrollReveal'
```

### Use in your component

```jsx
function MyPage() {
  // Enable scroll reveals with default settings
  useScrollReveal()

  return (
    <div>
      <h1 className="reveal">This will fade in</h1>
      <p className="reveal" data-delay="1">This appears after</p>
    </div>
  )
}
```

### Custom options

```jsx
function MyPage() {
  useScrollReveal({
    threshold: 0.2,              // Trigger when 20% visible
    rootMargin: '0px 0px -100px', // Trigger 100px before entering
    triggerOnce: true            // Animation happens only once
  })

  return <div>...</div>
}
```

---

## Component Wrapper Usage

### Import the component

```jsx
import { ScrollReveal } from '../hooks/useScrollReveal'
```

### Wrap your content

```jsx
{/* Basic usage */}
<ScrollReveal>
  <h2>This heading will fade in</h2>
</ScrollReveal>

{/* With delay */}
<ScrollReveal delay={2}>
  <p>This appears 0.2s after the heading</p>
</ScrollReveal>

{/* Fast animation */}
<ScrollReveal type="fast">
  <button>Quick button reveal</button>
</ScrollReveal>

{/* Slow animation for hero */}
<ScrollReveal type="slow">
  <div className="hero-section">
    <h1>Welcome</h1>
  </div>
</ScrollReveal>

{/* Scale animation for cards */}
<ScrollReveal type="scale" delay={1}>
  <div className="card">Card content</div>
</ScrollReveal>
```

---

## Real-World Examples

### Hero Section

```jsx
<section className="hero">
  <h1 className="reveal-slow">
    The Ultimate CV Analysis Tool
  </h1>
  <p className="reveal-slow" data-delay="1">
    Upload your CV and let AI analyze your skills
  </p>
  <div className="reveal-slow" data-delay="2">
    <button>Get Started</button>
  </div>
</section>
```

### Feature Cards Grid

```jsx
<div className="grid grid-cols-3 gap-8">
  <div className="card reveal-scale" data-delay="1">
    <h3>Upload & Analyze</h3>
    <p>Smart CV parsing...</p>
  </div>
  
  <div className="card reveal-scale" data-delay="2">
    <h3>Match Jobs</h3>
    <p>AI-powered matching...</p>
  </div>
  
  <div className="card reveal-scale" data-delay="3">
    <h3>Learn & Grow</h3>
    <p>Personalized learning...</p>
  </div>
</div>
```

### Job Listings

```jsx
{jobs.map((job, index) => (
  <div 
    key={job.id} 
    className="job-card reveal" 
    data-delay={Math.min(index + 1, 5)}
  >
    <h3>{job.title}</h3>
    <p>{job.company}</p>
  </div>
))}
```

### Text Sections

```jsx
<section>
  <h2 className="reveal">How It Works</h2>
  <p className="reveal" data-delay="1">
    Our platform helps you bridge the gap...
  </p>
  
  <div className="features">
    <div className="reveal-fast" data-delay="2">Feature 1</div>
    <div className="reveal-fast" data-delay="3">Feature 2</div>
    <div className="reveal-fast" data-delay="4">Feature 3</div>
  </div>
</section>
```

---

## Animation Types

| Class | Duration | Distance | Best For |
|-------|----------|----------|----------|
| `reveal` | 0.7s | 30px | General content, paragraphs, headings |
| `reveal-fast` | 0.5s | 20px | Buttons, icons, small elements |
| `reveal-slow` | 0.9s | 35px | Hero sections, large content blocks |
| `reveal-scale` | 0.7s | 30px + scale | Cards, images, featured content |

---

## Customization

### Change animation distance

Edit `src/index.css`:

```css
.reveal {
  transform: translateY(50px); /* Increase for more dramatic effect */
}
```

### Change timing

```css
.reveal {
  transition: opacity 1s cubic-bezier(0.23, 1, 0.32, 1),
              transform 1s cubic-bezier(0.23, 1, 0.32, 1);
}
```

### Add more delay options

```css
.reveal[data-delay='6'] { transition-delay: 0.6s; }
.reveal[data-delay='7'] { transition-delay: 0.7s; }
```

---

## Performance Tips

✅ **GPU Acceleration**
- Uses `will-change: opacity, transform`
- Smooth 60fps animations

✅ **Intersection Observer**
- Modern, efficient viewport detection
- No scroll event listeners needed

✅ **One-time Triggers**
- Elements animate once, then stop
- No repeated calculations

---

## Browser Support

- ✅ Chrome/Edge (all versions)
- ✅ Firefox (all versions)
- ✅ Safari (iOS 12.2+)
- ✅ All modern mobile browsers

---

## Troubleshooting

**Animations not working?**
1. Make sure `useScrollReveal()` is called in your component
2. Check that elements have the correct class (`reveal`, etc.)
3. Ensure CSS is imported (`src/index.css`)

**Animations too fast/slow?**
- Change duration in CSS (`.reveal` transition property)
- Adjust delays using `data-delay` attribute

**Want animations to repeat?**
```jsx
useScrollReveal({ triggerOnce: false })
```

---

## Credits

Inspired by:
- Apple.com scroll animations
- Stripe.com reveal effects
- Notion.so smooth transitions
