export type MarketCategory =
  | 'books'
  | 'bathroom'
  | 'living'
  | 'kitchen'
  | 'stationery'
  | 'food'
  | 'etc';

export type ItemCategory =
  | 'all'
  | MarketCategory
  | 'appliances'
  | 'furniture';

export const CATEGORY_LABELS: Record<string, string> = {
  books: '책 또는 교재',
  bathroom: '욕실용품',
  living: '생활용품',
  kitchen: '주방용품',
  stationery: '문구류',
  food: '음식',
  etc: '기타',
  appliances: '가전',
  furniture: '가구/수납',
};

export const ORDERED_CATEGORIES: { id: MarketCategory; label: string }[] = [
  { id: 'books', label: '책 또는 교재' },
  { id: 'bathroom', label: '욕실용품' },
  { id: 'living', label: '생활용품' },
  { id: 'kitchen', label: '주방용품' },
  { id: 'stationery', label: '문구류' },
  { id: 'food', label: '음식' },
  { id: 'etc', label: '기타' },
];

export interface MarketItem {
  id: string;
  name: string;
  category: MarketCategory | string;
  price: number;
  originalPrice?: number;
  stock: number;
  imageUrl: string;
  condition: string; // 사용감/상태 (예: "상 - 눈에 띄는 흠집 없음", "중 - 미세 생활 스크래치")
  usedPeriod: string; // 사용 기간 (예: "1학기 (약 4개월)", "2학기")
  size: string; // 크기 및 규격
  components?: string; // 구성품 (선택적)
  description: string; // 상세 설명
  locationTag?: string; // 진열 위치 태그 (선택적)
  updatedAt: string;
}
