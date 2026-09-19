import React from 'react';
import { ItemCategory } from '../types';
import { LayoutGrid, Home, Zap, Archive } from 'lucide-react';

interface CategoryFilterProps {
  selectedCategory: ItemCategory;
  onSelectCategory: (category: ItemCategory) => void;
  categoryCounts: Record<ItemCategory, { total: number; available: number }>;
}

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  selectedCategory,
  onSelectCategory,
  categoryCounts,
}) => {
  const categories: { id: ItemCategory; label: string; icon: React.ReactNode }[] = [
    {
      id: 'all',
      label: '전체',
      icon: <LayoutGrid className="w-3.5 h-3.5" />,
    },
    {
      id: 'living',
      label: '생활용품',
      icon: <Home className="w-3.5 h-3.5" />,
    },
    {
      id: 'appliances',
      label: '가전',
      icon: <Zap className="w-3.5 h-3.5" />,
    },
    {
      id: 'furniture',
      label: '가구/수납',
      icon: <Archive className="w-3.5 h-3.5" />,
    },
  ];

  return (
    <nav id="category-selection-area" aria-label="물품 카테고리 선택" className="mb-5">
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          const count = categoryCounts[cat.id] || { total: 0, available: 0 };

          return (
            <button
              key={cat.id}
              id={`category-btn-${cat.id}`}
              onClick={() => onSelectCategory(cat.id)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer shrink-0 ${
                isSelected
                  ? 'bg-[#1E2B1D] text-white shadow-xs border border-[#1E2B1D]'
                  : 'bg-white text-[#1E2B1D] border border-[#3E9628]/20 hover:bg-[#EAF5E7]'
              }`}
            >
              <span className={isSelected ? 'text-[#74C962]' : 'text-[#556853]'}>{cat.icon}</span>
              <span>{cat.label}</span>
              <span
                className={`text-[11px] px-1.5 py-0.5 rounded-full font-bold ${
                  isSelected
                    ? 'bg-white/20 text-[#74C962]'
                    : 'bg-[#EAF5E7] text-[#2D801E]'
                }`}
              >
                {count.available}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
