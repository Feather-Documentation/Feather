import type { ThemeConfig } from './types';

const BASE_PALETTES = [
  { name: 'Slate Corporate', category: 'corporate', primaryColor: '#2563eb', backgroundColor: '#f8fafc', textColor: '#0f172a', sidebarColor: '#f1f5f9', borderColor: '#cbd5e1' },
  { name: 'Emerald Trust', category: 'corporate', primaryColor: '#059669', backgroundColor: '#f4fbf7', textColor: '#064e3b', sidebarColor: '#e6f4ea', borderColor: '#a7f3d0' },
  { name: 'Steel Tech', category: 'corporate', primaryColor: '#4f46e5', backgroundColor: '#fafafa', textColor: '#171717', sidebarColor: '#f5f5f5', borderColor: '#e5e5e5' },
  { name: 'Royal Indigo', category: 'corporate', primaryColor: '#6366f1', backgroundColor: '#faf5ff', textColor: '#1e1b4b', sidebarColor: '#f3e8ff', borderColor: '#e9d5ff' },
  { name: 'Sage Executive', category: 'corporate', primaryColor: '#15803d', backgroundColor: '#fcfdfa', textColor: '#14532d', sidebarColor: '#f1f7ec', borderColor: '#d7e6c9' },
  
  { name: 'Pixel Pink', category: 'gamedev', primaryColor: '#ff8da1', backgroundColor: '#ffd1dc', textColor: '#2c1a1d', sidebarColor: '#ffedf1', borderColor: '#2c1a1d' },
  { name: 'Cyberpunk Neon', category: 'gamedev', primaryColor: '#00ffcc', backgroundColor: '#0f0c1b', textColor: '#f1f1f7', sidebarColor: '#16122c', borderColor: '#00ffcc' },
  { name: 'Matrix Code', category: 'gamedev', primaryColor: '#00ff00', backgroundColor: '#000000', textColor: '#33ff33', sidebarColor: '#050a05', borderColor: '#00aa00' },
  { name: 'Vaporwave Sunset', category: 'gamedev', primaryColor: '#ff007f', backgroundColor: '#2d0b5a', textColor: '#00ffff', sidebarColor: '#1d003b', borderColor: '#ff007f' },
  { name: 'Lava Flow', category: 'gamedev', primaryColor: '#ff4500', backgroundColor: '#110500', textColor: '#ffcc00', sidebarColor: '#220a00', borderColor: '#ff4500' },
  
  { name: 'Sakura Petal', category: 'personal', primaryColor: '#fda4af', backgroundColor: '#fff1f2', textColor: '#4c0519', sidebarColor: '#ffe4e6', borderColor: '#fecdd3' },
  { name: 'Matcha Latte', category: 'personal', primaryColor: '#86efac', backgroundColor: '#f0fdf4', textColor: '#14532d', sidebarColor: '#dcfce7', borderColor: '#bbf7d0' },
  { name: 'Cozy Coffee', category: 'personal', primaryColor: '#b45309', backgroundColor: '#fffbeb', textColor: '#451a03', sidebarColor: '#fef3c7', borderColor: '#fde68a' },
  { name: 'Lavender Dream', category: 'personal', primaryColor: '#c084fc', backgroundColor: '#faf5ff', textColor: '#3b0764', sidebarColor: '#f3e8ff', borderColor: '#e9d5ff' },
  { name: 'Peach Cream', category: 'personal', primaryColor: '#fb923c', backgroundColor: '#fff7ed', textColor: '#7c2d12', sidebarColor: '#ffedd5', borderColor: '#fed7aa' },
  
  { name: 'Terminal Green', category: 'retro', primaryColor: '#4af626', backgroundColor: '#0d0d0d', textColor: '#4af626', sidebarColor: '#151515', borderColor: '#4af626' },
  { name: 'Terminal Amber', category: 'retro', primaryColor: '#ffb000', backgroundColor: '#110c00', textColor: '#ffb000', sidebarColor: '#1a1300', borderColor: '#ffb000' },
  { name: 'C64 Blue', category: 'retro', primaryColor: '#3c3cfb', backgroundColor: '#0000aa', textColor: '#ffffff', sidebarColor: '#3c3cfb', borderColor: '#ffffff' },
  { name: 'Vintage Paper', category: 'retro', primaryColor: '#8b5a2b', backgroundColor: '#fcf8f2', textColor: '#2b1d0c', sidebarColor: '#f4ede1', borderColor: '#d7c49e' },
  { name: 'Macintosh 84', category: 'retro', primaryColor: '#666666', backgroundColor: '#dddddd', textColor: '#000000', sidebarColor: '#cccccc', borderColor: '#000000' }
];

const STRUCTURAL_VARIATIONS: {
  suffix: string;
  fontFamily: 'vt323' | 'inter' | 'courier';
  borderWidth: string;
  borderRadius: string;
  iconStyle: 'pixel' | 'solid' | 'regular';
}[] = [
  { suffix: 'Pixel', fontFamily: 'vt323', borderWidth: '4px', borderRadius: '0px', iconStyle: 'pixel' },
  { suffix: 'Modern', fontFamily: 'inter', borderWidth: '1px', borderRadius: '12px', iconStyle: 'regular' },
  { suffix: 'Terminal', fontFamily: 'courier', borderWidth: '1px', borderRadius: '0px', iconStyle: 'solid' },
  { suffix: 'Bold', fontFamily: 'inter', borderWidth: '4px', borderRadius: '8px', iconStyle: 'solid' },
  { suffix: 'Outline', fontFamily: 'courier', borderWidth: '2px', borderRadius: '4px', iconStyle: 'regular' }
];

export const THEME_PRESETS: Record<string, ThemeConfig> = {};

BASE_PALETTES.forEach((base) => {
  STRUCTURAL_VARIATIONS.forEach((variant) => {
    const id = `${base.name.toLowerCase().replace(/\s+/g, '-')}-${variant.suffix.toLowerCase()}`;
    THEME_PRESETS[id] = {
      name: `${base.name} ${variant.suffix}`,
      primaryColor: base.primaryColor,
      backgroundColor: base.backgroundColor,
      textColor: base.textColor,
      sidebarColor: base.sidebarColor,
      borderColor: base.borderColor,
      borderWidth: variant.borderWidth,
      borderRadius: variant.borderRadius,
      fontFamily: variant.fontFamily,
      iconStyle: variant.iconStyle
    };
  });
});
