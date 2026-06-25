# Framer Motion Animation Components

This directory contains reusable animation components built with Framer Motion for the Insure Pal application.

## Components

### AnimatedPage

Wrapper for Inertia.js pages with smooth page transitions.

```tsx
import { AnimatedPage } from '@/components/animated-page';

export default function MyPage() {
    return (
        <AnimatedPage>
            <h1>My Page Content</h1>
        </AnimatedPage>
    );
}
```

### AnimatedContainer

Flexible container with multiple animation options.

```tsx
import { AnimatedContainer } from '@/components/animations';

<AnimatedContainer animation="slideUp" delay={0.2} duration={0.4}>
    <p>Content that slides up</p>
</AnimatedContainer>;
```

**Animation options:**

- `fade` - Simple fade in
- `slideUp` - Slide up with fade
- `slideDown` - Slide down with fade
- `slideLeft` - Slide from left
- `slideRight` - Slide from right
- `scale` - Scale in with fade
- `stagger` - Stagger children

### AnimatedCard

Card component with hover and tap animations.

```tsx
import { AnimatedCard } from '@/components/animations';

<AnimatedCard onClick={() => console.log('clicked')}>
    <h3>Card Title</h3>
    <p>Card content</p>
</AnimatedCard>;
```

**Props:**

- `enableHover` - Enable/disable hover effect (default: true)
- `onClick` - Click handler
- `className` - Additional CSS classes

### AnimatedButton

Button with tap animation and hover scale.

```tsx
import { AnimatedButton } from '@/components/animations';

<AnimatedButton variant="default" size="lg">
    Click me
</AnimatedButton>;
```

**Variants:** `default`, `destructive`, `outline`, `secondary`, `ghost`, `link`
**Sizes:** `default`, `sm`, `lg`, `icon`

### AnimatedList & AnimatedListItem

List container with stagger effect for sequential animations.

```tsx
import { AnimatedList, AnimatedListItem } from '@/components/animations';

<AnimatedList staggerDelay={0.1}>
    {items.map((item) => (
        <AnimatedListItem key={item.id}>
            <div>{item.name}</div>
        </AnimatedListItem>
    ))}
</AnimatedList>;
```

### AnimatedModal

Modal with backdrop and content animations.

```tsx
import { AnimatedModal } from '@/components/animations';

<AnimatedModal isOpen={isOpen} onClose={() => setIsOpen(false)}>
    <h2>Modal Title</h2>
    <p>Modal content</p>
</AnimatedModal>;
```

**Props:**

- `isOpen` - Control modal visibility
- `onClose` - Close handler
- `showBackdrop` - Show/hide backdrop (default: true)
- `className` - Additional CSS classes

### AnimatedDropdown

Dropdown menu with fade and scale animation.

```tsx
import { AnimatedDropdown } from '@/components/animations';

<AnimatedDropdown isOpen={isOpen} align="right">
    <div>Dropdown content</div>
</AnimatedDropdown>;
```

**Alignment:** `left`, `right`, `center`

### AnimatedNotification

Toast/notification component that slides in from the side.

```tsx
import { AnimatedNotification } from '@/components/animations';

<AnimatedNotification isVisible={isVisible} position="top-right">
    <p>Notification message</p>
</AnimatedNotification>;
```

**Positions:** `top-right`, `top-left`, `bottom-right`, `bottom-left`

### AnimatedSpinner

Loading spinner with continuous rotation.

```tsx
import { AnimatedSpinner } from '@/components/animations';

<AnimatedSpinner size="md" />;
```

**Sizes:** `sm`, `md`, `lg`

## Animation Library

All animation variants are defined in `@/lib/animations.ts` and can be used directly with Framer Motion:

```tsx
import { motion } from 'framer-motion';
import { fadeIn, slideUp, cardHover } from '@/lib/animations';

<motion.div initial="initial" animate="animate" variants={fadeIn}>
    Content
</motion.div>;
```

### Available Variants

- `pageTransition` - For page transitions
- `fadeIn` - Simple fade
- `slideUp/Down/Left/Right` - Directional slides
- `scaleIn` - Scale animation
- `staggerContainer` - Container for stagger
- `staggerItem` - Individual stagger item
- `cardHover` - Card hover effect
- `buttonTap` - Button tap effect
- `modalBackdrop` - Modal backdrop
- `modalContent` - Modal content
- `dropdownMenu` - Dropdown animation
- `sidebar` - Sidebar slide
- `toast` - Toast notification
- `spinner` - Loading spinner rotation
- `pulse` - Pulsing animation
- `bounce` - Bouncing animation
- `shake` - Shake animation

## Best Practices

1. **Performance**: Use `AnimatedPage` sparingly on page-level components only
2. **Stagger delays**: Keep between 0.05-0.15s for smooth sequential animations
3. **Duration**: Most animations should be 0.2-0.4s for snappy feel
4. **Accessibility**: Animations respect `prefers-reduced-motion` automatically
5. **Layout shifts**: Avoid animating properties that cause layout recalculation

## Examples

### Dashboard with Animated Cards

```tsx
<AnimatedList className="grid gap-4 md:grid-cols-3">
    {stats.map((stat) => (
        <AnimatedListItem key={stat.id}>
            <AnimatedCard>
                <h3>{stat.title}</h3>
                <p>{stat.value}</p>
            </AnimatedCard>
        </AnimatedListItem>
    ))}
</AnimatedList>
```

### Form with Animated Submit Button

```tsx
<form onSubmit={handleSubmit}>
    <input type="text" />
    <AnimatedButton type="submit" variant="default">
        Submit
    </AnimatedButton>
</form>
```

### Page with Slide-in Content

```tsx
<AnimatedPage>
    <AnimatedContainer animation="slideUp">
        <h1>Welcome</h1>
        <p>This content slides up on page load</p>
    </AnimatedContainer>
</AnimatedPage>
```
