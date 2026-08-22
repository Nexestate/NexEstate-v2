import {
  BarChart3,
  Bell,
  Building2,
  CheckCircle,
  ClipboardList,
  Clock,
  FileSignature,
  Gavel,
  Headphones,
  Heart,
  Home,
  LayoutDashboard,
  Settings,
  Share2,
  Shield,
  Target,
  Upload,
  User,
  Users,
  XCircle,
} from 'lucide-react';
import type { NavSection } from '../types';

export const BROKER_NAV: NavSection[] = [
  {
    title: 'ראשי',
    items: [
      { to: '/broker', label: 'לוח בקרה', icon: LayoutDashboard, end: true },
      { to: '/broker/my-properties', label: 'נכסים שלי', icon: Home },
      { to: '/broker/auctions', label: 'מכירות פומביות', icon: Gavel },
      { to: '/broker/notifications', label: 'התראות', icon: Bell },
    ],
  },
  {
    title: 'ניהול CRM',
    items: [
      { to: '/broker/clients', label: 'לקוחות', icon: Users, addNew: 'client' },
      { to: '/broker/leads', label: 'לידים', icon: Target, addNew: 'lead' },
      { to: '/broker/tasks', label: 'משימות', icon: ClipboardList, addNew: 'task' },
      { to: '/broker/agreements', label: 'הסכמים', icon: FileSignature, addNew: 'agreement' },
    ],
  },
  {
    title: 'ניהול נכסים',
    items: [
      { to: '/broker/properties', label: 'נכסים מנוהלים', icon: Building2, addNew: 'property' },
      { to: '/broker/reports', label: 'דוחות', icon: BarChart3 },
    ],
  },
  {
    title: 'חשבון',
    items: [
      { to: '/broker/profile', label: 'הפרופיל שלי', icon: User },
      { to: '/admin', label: 'לוח בקרה אדמין', icon: Shield, adminOnly: true },
      { to: '/broker/settings', label: 'הגדרות', icon: Settings },
    ],
  },
];

export const BUYER_NAV: NavSection[] = [
  {
    title: '',
    items: [
      { to: '/buyer', label: 'לוח בקרה', icon: LayoutDashboard, end: true },
      { to: '/buyer/shared', label: 'נכסים ששותפו', icon: Home },
      { to: '/buyer/search', label: 'חיפוש נכסים', icon: Target },
      { to: '/buyer/favorites', label: 'מועדפים', icon: Heart },
      { to: '/buyer/notifications', label: 'התראות', icon: Bell },
      { to: '/buyer/settings', label: 'הגדרות', icon: Settings },
    ],
  },
];

export const ADMIN_NAV: NavSection[] = [
  {
    title: '',
    items: [
      { to: '/admin', label: 'לוח בקרה', icon: LayoutDashboard, end: true },
      { to: '/admin/properties', label: 'ניהול נכסים', icon: Building2 },
      { to: '/admin/users', label: 'ניהול משתמשים', icon: Users },
      { to: '/admin/shares', label: 'שיתופי נכסים', icon: Share2 },
      { to: '/admin/support', label: 'פניות תמיכה', icon: Headphones },
      { to: '/admin/import', label: 'ייבוא עסקאות', icon: Upload },
    ],
  },
  {
    title: 'סטטוס מהיר',
    items: [
      { to: '/admin/pending', label: 'ממתינים לאישור', icon: Clock },
      { to: '/admin/approved', label: 'מאושרים היום', icon: CheckCircle },
      { to: '/admin/rejected', label: 'דחויים היום', icon: XCircle },
    ],
  },
  {
    title: 'חשבון',
    items: [
      { to: '/broker', label: 'חזרה לדשבורד', icon: Home },
      { to: '/admin/settings', label: 'הגדרות', icon: Settings },
    ],
  },
];
