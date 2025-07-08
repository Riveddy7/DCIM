import type { ThemeType } from './FloorPlanThemes';

/**
 * Gets the CSS filter classes based on the current theme
 */
export function getImageFilter(theme: ThemeType): string {
  switch (theme) {
    case 'grayscale':
      return 'grayscale opacity-50';
    case 'negative':
      return 'invert opacity-50';
    case 'default':
    case 'capacity':
    case 'power':
    case 'network':
    case 'temperature':
    case 'status':
    default:
      return 'grayscale opacity-50';
  }
}

/**
 * Gets additional CSS classes for the image container based on theme
 */
export function getImageContainerClasses(theme: ThemeType): string {
  switch (theme) {
    case 'negative':
      return 'bg-black'; // Ensures black background for negative effect
    case 'grayscale':
      return 'bg-gray-100'; // Light background for grayscale
    default:
      return '';
  }
}

/**
 * Gets the transition classes for smooth filter changes
 */
export function getImageTransitionClasses(): string {
  return 'transition-all duration-500 ease-in-out';
}