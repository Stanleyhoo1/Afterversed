# Loading Page Component

A serene, calming loading animation designed to provide peace and reassurance during transitions.

## Features

- **Breathing Animation**: A gentle orb that slowly expands and contracts like a soft breath (3 seconds inhale, 3 seconds exhale)
- **Ethereal Background**: Soft gradient of serene blues and greens reminiscent of a twilight sky
- **Calming Message**: Gentle fade-in/fade-out text saying "Just a quiet moment..."
- **Smooth Transitions**: No harsh contrasts or sudden movements
- **Responsive**: Adapts to different screen sizes
- **Accessible**: Respects reduced motion preferences

## Usage

### As a Component

```tsx
import LoadingPage from "@/components/LoadingPage";

function MyComponent() {
  return <LoadingPage />;
}
```

### View Demo

Visit `/loading` route to see the animation in action:
```
http://localhost:8081/loading
```

### Integration Examples

#### 1. During Route Transitions

```tsx
import { useState, useEffect } from "react";
import LoadingPage from "@/components/LoadingPage";

function App() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading
    setTimeout(() => setIsLoading(false), 2000);
  }, []);

  if (isLoading) return <LoadingPage />;
  
  return <YourContent />;
}
```

#### 2. During Data Fetching

```tsx
import { useQuery } from "@tanstack/react-query";
import LoadingPage from "@/components/LoadingPage";

function DataComponent() {
  const { data, isLoading } = useQuery({
    queryKey: ["data"],
    queryFn: fetchData,
  });

  if (isLoading) return <LoadingPage />;
  
  return <div>{data}</div>;
}
```

#### 3. Between Survey Steps

```tsx
import { useState } from "react";
import LoadingPage from "@/components/LoadingPage";

function Survey() {
  const [isTransitioning, setIsTransitioning] = useState(false);

  const handleNext = async () => {
    setIsTransitioning(true);
    await saveAnswers();
    // Show calming moment before next question
    setTimeout(() => {
      setIsTransitioning(false);
      goToNextQuestion();
    }, 2000);
  };

  if (isTransitioning) return <LoadingPage />;
  
  return <SurveyQuestion />;
}
```

## Design Philosophy

This loading animation is specifically designed for grief support and sensitive contexts where:

- **Peace over urgency**: Creates calm rather than indicating "hurry up and wait"
- **Breathing metaphor**: Encourages users to take a moment to breathe
- **Soft aesthetics**: Avoids stress-inducing spinners or progress bars
- **Gentle reassurance**: Text message provides comfort without pressure

## Customization

### Change the Message

Edit `LoadingPage.tsx`:

```tsx
<p className="loading-message">Your custom message...</p>
```

### Adjust Breathing Speed

Edit `LoadingPage.css`:

```css
/* Change from 6s to your preferred duration */
@keyframes breathe {
  animation: breathe 8s ease-in-out infinite;
}
```

### Modify Colors

Edit the gradient in `LoadingPage.css`:

```css
.loading-background {
  background: linear-gradient(
    135deg,
    /* Your custom colors */
  );
}
```

## Animation Details

- **Breathing Cycle**: 6 seconds total (3s expand, 3s contract)
- **Text Fade**: Fades in at 15%, stays visible until 85%, fades out
- **Background Shift**: Subtle 20-second cycle for ethereal effect
- **Orb Size**: 120px base, scales to 150px at peak
- **Glow Effect**: Dual-layer with blur for soft edges

## Accessibility

- Respects `prefers-reduced-motion` setting
- High contrast text for readability
- Smooth, non-jarring animations
- Semantic HTML structure

## Browser Support

Works in all modern browsers:
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

## Performance

- Uses `will-change` for optimized animations
- Minimal DOM elements (3 main elements)
- GPU-accelerated transforms
- No JavaScript animations (pure CSS)

## Files

- `LoadingPage.tsx` - React component
- `LoadingPage.css` - Animation styles
- `LoadingDemo.tsx` - Demo page

---

**Philosophy**: "Just a quiet moment..." - This isn't about waiting, it's about pausing, breathing, and taking one step at a time.
