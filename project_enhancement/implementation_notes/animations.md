# Animation Enhancement Notes
**Date:** September 27, 2025  
**Time:** 20:30 MST

## Animation Strategy

### Performance-First Approach
- Use `transform` and `opacity` for GPU acceleration
- Avoid animating `width`, `height`, `top`, `left`
- Use `will-change` sparingly and remove after animation

### Animation Categories

#### 1. Page Load Animations
```css
@keyframes fadeInUp {
    from {
        opacity: 0;
        transform: translateY(30px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.page-enter {
    animation: fadeInUp 0.6s ease-out;
}
```

#### 2. Message Animations
```css
@keyframes slideInRight {
    from {
        opacity: 0;
        transform: translateX(30px);
    }
    to {
        opacity: 1;
        transform: translateX(0);
    }
}

.message.user {
    animation: slideInRight 0.4s ease-out;
}

.message.assistant {
    animation: slideInLeft 0.4s ease-out;
}
```

#### 3. Hover Animations
```css
.interactive-element {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.interactive-element:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
}
```

#### 4. Loading Animations
```css
@keyframes pulse {
    0%, 100% {
        opacity: 1;
    }
    50% {
        opacity: 0.5;
    }
}

.loading-skeleton {
    animation: pulse 1.5s ease-in-out infinite;
}

@keyframes spin {
    from {
        transform: rotate(0deg);
    }
    to {
        transform: rotate(360deg);
    }
}

.spinner {
    animation: spin 1s linear infinite;
}
```

## Micro-Interactions

### Button Interactions
```css
.button {
    transition: all 0.2s ease;
    position: relative;
    overflow: hidden;
}

.button::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
    transition: left 0.5s;
}

.button:hover::before {
    left: 100%;
}
```

### Input Focus
```css
.input-field {
    transition: all 0.3s ease;
    position: relative;
}

.input-field:focus {
    transform: scale(1.02);
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.2);
}

.input-field:focus + .input-label {
    transform: translateY(-20px) scale(0.9);
    color: var(--primary);
}
```

### Card Hover Effects
```css
.card {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    transform-origin: center;
}

.card:hover {
    transform: translateY(-4px) scale(1.02);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.2);
}
```

## Advanced Animations

### Staggered Animations
```css
.stagger-container .item {
    animation: fadeInUp 0.6s ease-out;
    animation-fill-mode: both;
}

.stagger-container .item:nth-child(1) { animation-delay: 0.1s; }
.stagger-container .item:nth-child(2) { animation-delay: 0.2s; }
.stagger-container .item:nth-child(3) { animation-delay: 0.3s; }
.stagger-container .item:nth-child(4) { animation-delay: 0.4s; }
```

### Scroll-Triggered Animations
```css
.scroll-reveal {
    opacity: 0;
    transform: translateY(50px);
    transition: all 0.6s ease;
}

.scroll-reveal.revealed {
    opacity: 1;
    transform: translateY(0);
}
```

### Loading States
```css
.skeleton {
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    animation: loading 1.5s infinite;
}

@keyframes loading {
    0% {
        background-position: 200% 0;
    }
    100% {
        background-position: -200% 0;
    }
}
```

## Performance Optimization

### Animation Performance Tips
1. **Use transform and opacity** - These properties are GPU-accelerated
2. **Avoid layout-triggering properties** - Don't animate width, height, top, left
3. **Use will-change sparingly** - Only when necessary and remove after animation
4. **Prefer CSS animations over JavaScript** - CSS animations are more performant
5. **Use requestAnimationFrame** - For complex JavaScript animations

### Reduced Motion Support
```css
@media (prefers-reduced-motion: reduce) {
    * {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
    }
}
```

## Animation Timing

### Easing Functions
```css
/* Standard easing curves */
.ease-in { transition-timing-function: cubic-bezier(0.4, 0, 1, 1); }
.ease-out { transition-timing-function: cubic-bezier(0, 0, 0.2, 1); }
.ease-in-out { transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1); }

/* Custom easing for specific effects */
.bounce { transition-timing-function: cubic-bezier(0.68, -0.55, 0.265, 1.55); }
.elastic { transition-timing-function: cubic-bezier(0.175, 0.885, 0.32, 1.275); }
```

### Duration Guidelines
- **Micro-interactions:** 0.1s - 0.3s
- **Page transitions:** 0.3s - 0.6s
- **Complex animations:** 0.6s - 1.2s
- **Loading animations:** 1s - 3s (looping)
