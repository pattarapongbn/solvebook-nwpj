import {
  TrendingUp, Banknote, Briefcase, Megaphone, Laptop,
  Heart, Brain, Users, Star, Cpu, BookOpen,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export function getCategoryIcon(slug: string): LucideIcon {
  const map: Record<string, LucideIcon> = {
    'finance':         TrendingUp,
    'income':          Banknote,
    'business':        Briefcase,
    'sales-marketing': Megaphone,
    'work':            Laptop,
    'health':          Heart,
    'mental-health':   Brain,
    'relationship':    Users,
    'self-dev':        Star,
    'technology':      Cpu,
  }
  return map[slug] ?? BookOpen
}
