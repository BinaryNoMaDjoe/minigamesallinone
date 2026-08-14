---
name: Inked Kinetic
colors:
  surface: '#fcf9f8'
  surface-dim: '#dcd9d9'
  surface-bright: '#fcf9f8'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f6f3f2'
  surface-container: '#f0edec'
  surface-container-high: '#ebe7e7'
  surface-container-highest: '#e5e2e1'
  on-surface: '#1c1b1b'
  on-surface-variant: '#5d3f3c'
  inverse-surface: '#313030'
  inverse-on-surface: '#f3f0ef'
  outline: '#926f6b'
  outline-variant: '#e7bdb8'
  surface-tint: '#c00016'
  primary: '#bf0016'
  on-primary: '#ffffff'
  primary-container: '#e62429'
  on-primary-container: '#ffffff'
  inverse-primary: '#ffb4ac'
  secondary: '#005ab4'
  on-secondary: '#ffffff'
  secondary-container: '#0072e1'
  on-secondary-container: '#fefcff'
  tertiary: '#705d00'
  on-tertiary: '#ffffff'
  tertiary-container: '#c9a900'
  on-tertiary-container: '#4c3f00'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdad6'
  primary-fixed-dim: '#ffb4ac'
  on-primary-fixed: '#410003'
  on-primary-fixed-variant: '#93000e'
  secondary-fixed: '#d6e3ff'
  secondary-fixed-dim: '#aac7ff'
  on-secondary-fixed: '#001b3e'
  on-secondary-fixed-variant: '#00458d'
  tertiary-fixed: '#ffe16d'
  tertiary-fixed-dim: '#e9c400'
  on-tertiary-fixed: '#221b00'
  on-tertiary-fixed-variant: '#544600'
  background: '#fcf9f8'
  on-background: '#1c1b1b'
  surface-variant: '#e5e2e1'
typography:
  display-lg:
    fontFamily: Anybody
    fontSize: 72px
    fontWeight: '900'
    lineHeight: 68px
    letterSpacing: -0.04em
  headline-lg:
    fontFamily: Anybody
    fontSize: 40px
    fontWeight: '800'
    lineHeight: 44px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Anybody
    fontSize: 32px
    fontWeight: '800'
    lineHeight: 36px
  headline-md:
    fontFamily: Anybody
    fontSize: 24px
    fontWeight: '800'
    lineHeight: 28px
  body-lg:
    fontFamily: Hanken Grotesk
    fontSize: 18px
    fontWeight: '500'
    lineHeight: 28px
  body-md:
    fontFamily: Hanken Grotesk
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-bold:
    fontFamily: Space Grotesk
    fontSize: 14px
    fontWeight: '700'
    lineHeight: 16px
  label-sm:
    fontFamily: Space Grotesk
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 14px
spacing:
  unit: 4px
  gutter: 20px
  margin-mobile: 16px
  margin-desktop: 40px
  stack-offset: 6px
---

## Brand & Style

The design system is a premium "Modern Comic" aesthetic that bridges the gap between classic graphic novel artistry and high-end digital UI. It is characterized by high-contrast visual storytelling, utilizing bold ink strokes, dynamic depth, and subtle halftone textures to evoke an energetic, heroic atmosphere.

The style is a refined take on **Modern Brutalism mixed with High-Contrast Editorial**. It avoids the "flat" look of generic illustrations by utilizing varied line weights and "pop-out" layers that break the container grid. The UI should feel like a living comic book page—kinetic, deliberate, and authoritative—targeting a gaming audience that appreciates both nostalgia and cutting-edge digital craftsmanship.

## Colors

The palette is built on "Action Primary" tones found in iconic superhero costumes, balanced against "Ink Plate Black."

- **Action Red (#E62429):** The primary interactive color, used for critical CTAs and "Hero" moments.
- **Power Blue (#0074E4):** Used for secondary actions, information states, and energy-themed UI elements.
- **Hero Yellow (#FFD700):** An accent color for highlights, achievements, and "special" currency or status.
- **Ink Plate Black (#0F0F0F):** Not a pure hex #000, but a deep, saturated black used for all outlines, heavy shadows, and primary text to mimic physical ink.
- **Paper White (#FFFFFF):** The base background, providing high-contrast clarity.
- **Halftone Gray (#E0E0E0):** Used specifically for Ben-Day dot patterns in secondary background areas.

## Typography

Typography functions as both information and illustration. 

- **Headlines:** Use **Anybody** with a condensed width and ultra-bold weight. For major titles, apply a 2-degree italic tilt to simulate forward motion.
- **Body:** **Hanken Grotesk** provides a clean, modern contrast to the aggressive headlines, ensuring long-form readability within game descriptions.
- **Technical/Labels:** **Space Grotesk** is used for UI metadata, button labels, and navigation items, reinforcing the "Advanced/Technical" comic feel.

**Styling Note:** Display text should often feature a 2px offset "Ink Black" drop shadow or a thick 3px outline to separate it from textured backgrounds.

## Layout & Spacing

The layout follows a **Rigid Grid with Breakout Elements**. While the underlying structure is a 12-column system, individual cards and containers are encouraged to use "Offset Stacking."

- **The "Gutters":** Use wide 20px gutters to mimic the spacing between comic book panels.
- **Offset Stacking:** Primary containers should have a duplicate background layer offset by `stack-offset` (6px) to the bottom-right, filled with an "Ink Black" or halftone pattern.
- **Asymmetry:** Occasionally tilt images or decorative elements by 1-1.5 degrees to break the digital perfection and add "hand-drawn" energy.

## Elevation & Depth

This design system eschews soft, blurry shadows in favor of **Hard-Edged Comic Shadows** and **Tonal Textures**.

1.  **Hard Shadows:** Use solid 100% opacity offsets in `primary_color` or `neutral_color`. The shadow should look like a second physical layer of paper underneath the top layer.
2.  **Halftone Depth:** Use a Ben-Day dot pattern (radial dots) for mid-level elevation. This is applied as a background-image mask on secondary surfaces.
3.  **Ink Strokes:** Every "elevated" element must have a visible `Ink Plate Black` border. The border weight increases as the element "moves closer" to the user (e.g., a modal has a 4px border, while a standard button has a 2px border).

## Shapes

The shape language is primarily **Sharp and Geometric**. 

- **Corners:** 0px radius for a "cut paper" feel. 
- **Speech Bubbles:** Tooltips and notifications use sharp-angled tails (pointing at the source) rather than rounded bubbles.
- **The "Impact" Shape:** Use "burst" shapes (multi-pointed stars) for badges, sales, or level-up notifications to emphasize energy.

## Components

### Buttons
- **Primary:** Solid Red background, 2px Black border, 4px Black hard shadow offset. On hover, the shadow disappears as the button "presses" down.
- **Secondary:** White background, 2px Black border, 4px Blue hard shadow offset.

### Pop-out Cards
- Cards feature a "Hero" image that breaks the top border of the card (z-index overflow).
- The bottom section of the card uses a halftone gray background to separate text from the image.

### Input Fields
- Heavy 2px borders.
- Labels are always uppercase **Space Grotesk** positioned in a small "tag" box that overlaps the top-left border of the input.

### Tooltips & Notifications
- Designed as classic comic book speech bubbles. 
- White background, 3px Black border, and a sharp triangular "tail." 

### Progress Bars
- High-contrast segments. Instead of a smooth fill, the bar fills with diagonal "hatching" lines or solid blocks of Action Red.