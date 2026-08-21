export interface MarketListing {
  id: string;
  title: string;
  city: string;
  address: string;
  category: string;
  type: 'sale' | 'rent';
  price: number;
  rooms?: number;
  area_sqm: number;
  featured?: boolean;
}

export interface MarketDeal {
  id: string;
  type: string;
  city: string;
  address: string;
  price: number;
  date: string;
  lat: number;
  lng: number;
}

export interface MarketPlayer {
  id: string;
  name: string;
  role: string;
  city: string;
  listings: number;
  deals: number;
  rating: number;
}

export interface MarketOpportunity {
  id: string;
  title: string;
  city: string;
  roi: number;
  price: number;
  type: string;
  risk: 'low' | 'medium' | 'high';
}

export interface PriceTrend {
  city: string;
  avgPrice: number;
  change: number;
  perSqm: number;
}

export const MARKET_LISTINGS: MarketListing[] = [
  { id: 'm1', title: 'דירת 4 חדרים — נווה צedeק', city: 'תל אביב', address: 'שדה יehudah 12', category: 'דירות', type: 'sale', price: 3_200_000, rooms: 4, area_sqm: 95, featured: true },
  { id: 'm2', title: 'משרדים — Azrieli', city: 'תל אביב', address: 'מגדלי Azrieli', category: 'משרדים', type: 'rent', price: 18_000, area_sqm: 120, featured: true },
  { id: 'm3', title: 'מגרש בנייה — ראשון לציון', city: 'ראשון לציון', address: 'אזור התעשייה', category: 'מגרשים', type: 'sale', price: 1_800_000, area_sqm: 500 },
  { id: 'm4', title: 'בית פרטי — הרצליה פיתוח', city: 'הרצליה', address: 'סמדר 8', category: 'בתים', type: 'sale', price: 5_400_000, rooms: 5, area_sqm: 180, featured: true },
  { id: 'm5', title: 'חנות — שוק הכarmel', city: 'תל אביב', address: 'שוק הכarmel 8', category: 'מסחרי', type: 'rent', price: 12_500, area_sqm: 45 },
  { id: 'm6', title: 'מחסן לוגיסטי — מודיעין', city: 'מודיעין', address: 'אזור תעשייה', category: 'תעשייה', type: 'rent', price: 22_000, area_sqm: 800 },
  { id: 'm7', title: 'דירת 3 חדרים — רamat gan', city: 'רמת גan', address: 'בialik 22', category: 'דירות', type: 'sale', price: 2_450_000, rooms: 3, area_sqm: 72 },
  { id: 'm8', title: 'משרדים — חולון', city: 'חולון', address: 'מתכת 34', category: 'משרדים', type: 'sale', price: 2_900_000, area_sqm: 280 },
];

export const MARKET_DEALS: MarketDeal[] = [
  { id: 'd1', type: 'דירה', city: 'תל אביב', address: 'Rothschild 12', price: 2_710_000, date: '2026-08-18', lat: 32.06, lng: 34.77 },
  { id: 'd2', type: 'משרד', city: 'רמת גan', address: 'Bialik 45', price: 1_850_000, date: '2026-08-17', lat: 32.08, lng: 34.81 },
  { id: 'd3', type: 'בית', city: 'הרצליה', address: 'Herzl 8', price: 4_200_000, date: '2026-08-16', lat: 32.16, lng: 34.84 },
  { id: 'd4', type: 'דירה', city: 'חיפה', address: 'Hanasi 22', price: 980_000, date: '2026-08-15', lat: 32.79, lng: 34.99 },
  { id: 'd5', type: 'מסחרי', city: 'ירושלים', address: 'Jaffa 100', price: 3_500_000, date: '2026-08-14', lat: 31.78, lng: 35.22 },
  { id: 'd6', type: 'מגרש', city: 'ראשון לציון', address: 'Industrial Zone', price: 1_200_000, date: '2026-08-13', lat: 31.97, lng: 34.79 },
];

export const MARKET_PLAYERS: MarketPlayer[] = [
  { id: 'p1', name: 'מיכאל וינר', role: 'סוכן נדל"ן', city: 'תל אביב', listings: 24, deals: 18, rating: 4.9 },
  { id: 'p2', name: 'יוסי כהן', role: 'יזם / קבלן', city: 'רמת גan', listings: 8, deals: 12, rating: 4.7 },
  { id: 'p3', name: 'שרה לevy', role: 'חברת ניהול', city: 'חיפה', listings: 45, deals: 32, rating: 4.8 },
  { id: 'p4', name: 'דוד אברהם', role: 'משקיע', city: 'הרצליה', listings: 6, deals: 9, rating: 4.6 },
  { id: 'p5', name: 'עו"ד רונית שapira', role: 'כונס / עו"ד', city: 'תל אביב', listings: 3, deals: 15, rating: 5.0 },
  { id: 'p6', name: 'נכסים בע"מ', role: 'בעל נכס', city: 'ראשון לציון', listings: 12, deals: 7, rating: 4.5 },
];

export const MARKET_OPPORTUNITIES: MarketOpportunity[] = [
  { id: 'o1', title: 'בניין משרדים — תפוסה 92%', city: 'תל אביב', roi: 7.2, price: 12_000_000, type: 'משרדים', risk: 'low' },
  { id: 'o2', title: 'פרויקט מגורים — שלב א', city: 'ראשון לציון', roi: 9.5, price: 2_800_000, type: 'דירות', risk: 'medium' },
  { id: 'o3', title: 'מגרש בנייה — אישור תב"ע', city: 'מודיעין', roi: 11.0, price: 3_500_000, type: 'מגרש', risk: 'medium' },
  { id: 'o4', title: 'חנות פינתית — מרכז עיר', city: 'חיפה', roi: 6.8, price: 1_900_000, type: 'מסחרי', risk: 'low' },
];

export const PRICE_TRENDS: PriceTrend[] = [
  { city: 'תל אביב', avgPrice: 3_450_000, change: 2.4, perSqm: 42_000 },
  { city: 'רamat gan', avgPrice: 2_680_000, change: 1.8, perSqm: 32_500 },
  { city: 'הרצליה', avgPrice: 4_100_000, change: 3.1, perSqm: 38_000 },
  { city: 'חיפה', avgPrice: 1_420_000, change: -0.5, perSqm: 18_200 },
  { city: 'ראשון לציון', avgPrice: 2_150_000, change: 1.2, perSqm: 24_800 },
  { city: 'חולון', avgPrice: 1_980_000, change: 0.9, perSqm: 22_100 },
];

export const PUBLIC_AUCTIONS = [
  { id: 'a1', title: 'דירת 4 חדרים — נווה צedek', city: 'תל אביב', startPrice: 2_800_000, currentBid: 3_100_000, endsAt: Date.now() + 3 * 86400000 + 5 * 3600000, status: 'active' as const },
  { id: 'a2', title: 'משרדים — Azrieli', city: 'תל אביב', startPrice: 5_500_000, currentBid: 5_500_000, endsAt: Date.now() + 7 * 86400000, status: 'scheduled' as const },
  { id: 'a3', title: 'מגרש בנייה', city: 'ראשון לציון', startPrice: 1_200_000, currentBid: 1_450_000, endsAt: Date.now() + 1 * 86400000 + 12 * 3600000, status: 'active' as const },
  { id: 'a4', title: 'דירת גan — רamat gan', city: 'רamat gan', startPrice: 1_900_000, currentBid: 2_050_000, endsAt: Date.now() + 5 * 86400000, status: 'active' as const },
];

export const MARKET_CATEGORIES = ['הכל', 'דירות', 'בתים', 'משרדים', 'מסחרי', 'מגרשים', 'תעשייה'];
