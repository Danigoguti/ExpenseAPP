import {
  Utensils, Car, Film, ShoppingBag, Receipt, HeartPulse,
  ShoppingCart, Repeat, Plane, GraduationCap, TrendingUp,
  CircleDot, HelpCircle,
} from 'lucide-react';

const ICON_MAP: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  'utensils': Utensils,
  'car': Car,
  'film': Film,
  'shopping-bag': ShoppingBag,
  'receipt': Receipt,
  'heart-pulse': HeartPulse,
  'shopping-cart': ShoppingCart,
  'repeat': Repeat,
  'plane': Plane,
  'graduation-cap': GraduationCap,
  'trending-up': TrendingUp,
  'circle-dot': CircleDot,
};

interface CategoryIconProps {
  icon: string | undefined;
  color: string | undefined;
  size?: number;
}

export default function CategoryIcon({ icon, color, size = 20 }: CategoryIconProps) {
  const Icon = icon ? ICON_MAP[icon] ?? HelpCircle : HelpCircle;
  return <Icon size={size} className="shrink-0" style={{ color: color ?? '#475569' }} />;
}
