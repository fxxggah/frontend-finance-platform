'use client';

import {
  // Despesas
  Utensils,
  Car,
  Home,
  HeartPulse,
  GraduationCap,
  Gamepad2,
  ShoppingCart,
  CircleEllipsis,
  // Receitas
  Wallet,
  Laptop,
  TrendingUp,
  Landmark,
  Smartphone,
  CreditCard,
  // Extras visuais
  Gift,
  Plane,
  Wifi,
  Coffee,
  Dumbbell,
  Shield,
  Tv,
  PiggyBank,
  Briefcase,
  Wrench,
  ShoppingBag,
  Film,
  Bus,
  BookOpen,
  Music,
  Camera,
  Stethoscope,
  Baby,
  Paw,
  Bike,
  Zap,
  Sparkles,
  CircleHelp,
  type LucideProps,
} from 'lucide-react';

/** Mapa estático de chave (kebab-case) → componente Lucide. */
const ICON_MAP = {
  // ── Despesas ──────────────────────────────────────────────────
  utensils: Utensils,
  car: Car,
  home: Home,
  'heart-pulse': HeartPulse,
  'graduation-cap': GraduationCap,
  'gamepad-2': Gamepad2,
  'shopping-cart': ShoppingCart,
  'circle-ellipsis': CircleEllipsis,
  // ── Receitas ──────────────────────────────────────────────────
  wallet: Wallet,
  laptop: Laptop,
  'trending-up': TrendingUp,
  landmark: Landmark,
  smartphone: Smartphone,
  'credit-card': CreditCard,
  // ── Extras visuais (grade de seleção ~36 ícones) ──────────────
  gift: Gift,
  plane: Plane,
  wifi: Wifi,
  coffee: Coffee,
  dumbbell: Dumbbell,
  shield: Shield,
  tv: Tv,
  'piggy-bank': PiggyBank,
  briefcase: Briefcase,
  wrench: Wrench,
  'shopping-bag': ShoppingBag,
  film: Film,
  bus: Bus,
  'book-open': BookOpen,
  music: Music,
  camera: Camera,
  stethoscope: Stethoscope,
  baby: Baby,
  paw: Paw,
  bike: Bike,
  zap: Zap,
  sparkles: Sparkles,
} as const;

export type IconKey = keyof typeof ICON_MAP;

export interface CategoryIconProps extends LucideProps {
  /** Chave em kebab-case retornada pela API (ex: "heart-pulse"). */
  name: string;
}

/**
 * Renderiza o ícone Lucide correspondente à chave `name`.
 * Usa `CircleHelp` como fallback para chaves desconhecidas.
 */
export function CategoryIcon({ name, ...props }: CategoryIconProps) {
  const Icon = (ICON_MAP as Record<string, React.ComponentType<LucideProps>>)[name] ?? CircleHelp;
  return <Icon aria-hidden="true" {...props} />;
}

