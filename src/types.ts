export type ItemCategory = 'all' | 'living' | 'appliances' | 'furniture';

export interface MarketItem {
  id: string;
  name: string;
  category: 'living' | 'appliances' | 'furniture';
  price: number;
  originalPrice?: number;
  stock: number;
  imageUrl: string;
  condition: string; // 사용감/상태 (예: "상 - 눈에 띄는 흠집 없음", "중 - 미세 생활 스크래치")
  usedPeriod: string; // 사용 기간 (예: "1학기 (약 4개월)", "2학기")
  size: string; // 크기 및 규격
  components: string; // 구성품 포함 여부 (예: "본체 + 전원 케이블 + 거치대")
  description: string; // 상세 설명
  locationTag: string; // 수령 부스 내 진열 구역 (예: "A-02 구역", "B 진열대")
  updatedAt: string;
}
