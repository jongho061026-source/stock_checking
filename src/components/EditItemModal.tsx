import React, { useState, useEffect, useRef } from 'react';
import { MarketItem, MarketCategory, ORDERED_CATEGORIES } from '../types';
import { updateMarketItem } from '../firebase';
import { X, Edit3, Image as ImageIcon, Check, Upload, Camera, AlertCircle } from 'lucide-react';

interface EditItemModalProps {
  isOpen: boolean;
  item: MarketItem | null;
  onClose: () => void;
  onItemUpdated?: (item: MarketItem) => void;
}

// 참고용 샘플 사진 목록
const SAMPLE_PHOTOS = [
  {
    label: '책/교재',
    url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80',
    category: 'books' as const,
  },
  {
    label: '욕실용품',
    url: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=800&q=80',
    category: 'bathroom' as const,
  },
  {
    label: '생활용품',
    url: 'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?auto=format&fit=crop&w=800&q=80',
    category: 'living' as const,
  },
  {
    label: '주방용품',
    url: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=800&q=80',
    category: 'kitchen' as const,
  },
  {
    label: '문구류',
    url: 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?auto=format&fit=crop&w=800&q=80',
    category: 'stationery' as const,
  },
  {
    label: '음식/간식',
    url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80',
    category: 'food' as const,
  },
  {
    label: '기타 물품',
    url: 'https://images.unsplash.com/photo-1584992236310-6edddc08acff?auto=format&fit=crop&w=800&q=80',
    category: 'etc' as const,
  },
];

// 클라이언트 사이드 이미지 압축
const compressImageFile = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_DIM = 720;
        let { width, height } = img;
        if (width > height) {
          if (width > MAX_DIM) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          }
        } else {
          if (height > MAX_DIM) {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.75));
      };
      img.onerror = reject;
      img.src = event.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const EditItemModal: React.FC<EditItemModalProps> = ({
  isOpen,
  item,
  onClose,
  onItemUpdated,
}) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<string>('living');
  const [price, setPrice] = useState<string>('0');
  const [originalPrice, setOriginalPrice] = useState<string>('');
  const [stock, setStock] = useState<string>('1');
  const [imageUrl, setImageUrl] = useState('');
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [condition, setCondition] = useState('상 (외관 깨끗함, 정상 작동)');
  const [usedPeriod, setUsedPeriod] = useState('1개 학기');
  const [size, setSize] = useState('일반 규격');
  const [description, setDescription] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // item이 바뀔 때 기존 값들로 폼 채우기
  useEffect(() => {
    if (item) {
      setName(item.name || '');
      setCategory(item.category || 'living');
      setPrice(String(item.price ?? 0));
      setOriginalPrice(item.originalPrice ? String(item.originalPrice) : '');
      setStock(String(item.stock ?? 1));
      setImageUrl(item.imageUrl || '');
      setCondition(item.condition || '상 (외관 깨끗함, 정상 작동)');
      setUsedPeriod(item.usedPeriod || '1개 학기');
      setSize(item.size || '일반 규격');
      setDescription(item.description || '');
      setErrorMsg(null);
      setSuccessMsg(null);
    }
  }, [item]);

  if (!isOpen || !item) return null;

  // 사진 파일 업로드
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setErrorMsg('이미지 파일(JPG, PNG 등)만 선택할 수 있습니다.');
      return;
    }

    try {
      setIsUploadingPhoto(true);
      setErrorMsg(null);
      const compressedDataUrl = await compressImageFile(file);
      setImageUrl(compressedDataUrl);
      setIsUploadingPhoto(false);
    } catch (err) {
      console.error('Failed to compress image:', err);
      setErrorMsg('사진을 불러오는 중 오류가 발생했습니다.');
      setIsUploadingPhoto(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('물품명을 입력해 주세요.');
      return;
    }
    const numPrice = Number(price);
    if (isNaN(numPrice) || numPrice < 0) {
      setErrorMsg('올바른 판매 가격을 입력해 주세요.');
      return;
    }
    const numStock = Number(stock);
    if (isNaN(numStock) || numStock < 0) {
      setErrorMsg('재고 수량을 올바르게 입력해 주세요.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg(null);

      const numOriginalPrice = originalPrice ? Number(originalPrice) : undefined;

      const updatedFields: Partial<MarketItem> = {
        name: name.trim(),
        category: category as MarketCategory,
        price: numPrice,
        originalPrice: numOriginalPrice && !isNaN(numOriginalPrice) ? numOriginalPrice : undefined,
        stock: numStock,
        imageUrl: imageUrl.trim() || 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=800&q=80',
        condition: condition.trim(),
        usedPeriod: usedPeriod.trim() || '미기재',
        size: size.trim() || '일반 규격',
        description: description.trim(),
      };

      await updateMarketItem(item.id, updatedFields);

      const completeUpdatedItem: MarketItem = {
        ...item,
        ...updatedFields,
      };

      setSuccessMsg('물품 정보가 성공적으로 수정되었습니다.');
      setIsSubmitting(false);

      if (onItemUpdated) {
        onItemUpdated(completeUpdatedItem);
      }

      setTimeout(() => {
        onClose();
      }, 700);
    } catch (err) {
      console.error('Error updating item:', err);
      setErrorMsg('물품 수정 중 오류가 발생했습니다.');
      setIsSubmitting(false);
    }
  };

  return (
    <div
      id="edit-item-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1E2B1D]/60 backdrop-blur-xs overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose();
      }}
    >
      <div
        id="edit-item-modal-content"
        className="bg-white rounded-2xl max-w-xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-[#3E9628]/20 my-auto overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        {/* 모달 상단 헤더 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#3E9628]/15 bg-[#EAF5E7]/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#3E9628]/15 text-[#2D801E] flex items-center justify-center">
              <Edit3 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-[#1E2B1D]">
                물품 정보 수정
              </h3>
              <p className="text-xs text-[#556853]">
                카테고리, 물품명, 가격, 사진 등 잘못 입력된 내용을 바로 변경합니다.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 rounded-lg text-[#556853] hover:text-[#1E2B1D] hover:bg-black/5 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 폼 본문 */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-5 flex-1">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs font-semibold text-rose-700">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs font-semibold text-emerald-800">
              <Check className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* 1. 어떤 물건인지 물품명 직접 입력 */}
          <div className="p-3.5 bg-[#EAF5E7]/60 rounded-xl border border-[#3E9628]/25 space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-[#1E2B1D]">
                  어떤 물건인가요? (물품명) <span className="text-rose-500">*</span>
                </label>
                <span className="text-[11px] font-semibold text-[#2D801E] bg-white px-2 py-0.5 rounded-md border border-[#3E9628]/20">
                  물품명 수정
                </span>
              </div>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="예: 샴푸&바디워시 세트, 전공서적, 미니 밥솥 등"
                className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-[#3E9628]/35 bg-white text-[#1E2B1D] font-medium focus:outline-none focus:ring-2 focus:ring-[#3E9628] focus:border-transparent placeholder-[#556853]/50"
              />
            </div>

            {/* 2. 물품 카테고리 7가지 선택 */}
            <div>
              <label className="block text-xs font-bold text-[#1E2B1D] mb-1.5">
                물품 카테고리 <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {ORDERED_CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center ${
                      category === cat.id
                        ? 'bg-[#3E9628] text-white border-[#3E9628] shadow-xs'
                        : 'bg-white text-[#556853] border-[#3E9628]/25 hover:bg-[#EAF5E7]'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 3. 가격 및 수량 */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#1E2B1D] mb-1">
                판매 가격(원) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                required
                min={0}
                step={500}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full text-sm px-3 py-2 rounded-xl border border-[#3E9628]/30 bg-white text-[#1E2B1D] font-bold focus:outline-none focus:ring-2 focus:ring-[#3E9628]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#556853] mb-1">
                정가/구입가(선택)
              </label>
              <input
                type="number"
                min={0}
                placeholder="미입력 가능"
                value={originalPrice}
                onChange={(e) => setOriginalPrice(e.target.value)}
                className="w-full text-sm px-3 py-2 rounded-xl border border-gray-200 bg-white text-[#1E2B1D] focus:outline-none focus:ring-2 focus:ring-[#3E9628]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#1E2B1D] mb-1">
                잔여 재고(개) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                required
                min={0}
                max={999}
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                className="w-full text-sm px-3 py-2 rounded-xl border border-[#3E9628]/30 bg-white text-[#1E2B1D] font-bold focus:outline-none focus:ring-2 focus:ring-[#3E9628]"
              />
            </div>
          </div>

          {/* 4. 대표 사진 수정 */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-[#1E2B1D]">
                대표 사진 <span className="text-rose-500">*</span>
              </label>
              <span className="text-[11px] text-[#556853]">사진 촬영/업로드 또는 URL 입력</span>
            </div>

            <div className="flex gap-3 items-center">
              {/* 현재 사진 미리보기 */}
              <div className="w-16 h-16 rounded-xl border border-[#3E9628]/25 overflow-hidden bg-gray-100 shrink-0 flex items-center justify-center">
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt="미리보기"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=400&q=80';
                    }}
                  />
                ) : (
                  <ImageIcon className="w-6 h-6 text-gray-400" />
                )}
              </div>

              {/* URL 직접 입력창 */}
              <div className="flex-1">
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="이미지 URL 직접 입력"
                  className="w-full text-xs px-3 py-2 rounded-xl border border-[#3E9628]/25 bg-white text-[#1E2B1D] focus:outline-none focus:ring-2 focus:ring-[#3E9628]"
                />
              </div>

              {/* 사진 업로드 버튼 */}
              <div>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingPhoto}
                  className="px-3 py-2 rounded-xl text-xs font-bold bg-[#EAF5E7] text-[#2D801E] border border-[#3E9628]/30 hover:bg-[#3E9628]/20 transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{isUploadingPhoto ? '압축 중...' : '사진 업로드'}</span>
                </button>
              </div>
            </div>

            {/* 참고용 샘플 사진 선택 */}
            <div className="mt-2.5">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-semibold text-[#556853]">참고용 샘플 사진:</span>
                <span className="text-[10px] text-[#2D801E]">※ 선택 시 사진만 변경되며, 물품명은 유지됩니다</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {SAMPLE_PHOTOS.map((sample, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setImageUrl(sample.url)}
                    className={`px-2 py-1 rounded-lg text-[11px] border transition-all cursor-pointer ${
                      imageUrl === sample.url
                        ? 'bg-[#3E9628] text-white border-[#3E9628] font-bold'
                        : 'bg-white text-[#556853] border-gray-200 hover:border-[#3E9628]/40'
                    }`}
                  >
                    {sample.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 5. 상태, 사용 기간, 규격 */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#1E2B1D] mb-1">
                물품 상태 <span className="text-rose-500">*</span>
              </label>
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-xl border border-[#3E9628]/30 bg-white text-[#1E2B1D] focus:outline-none focus:ring-2 focus:ring-[#3E9628]"
              >
                <option value="최상 (미사용 새상품 또는 포장 유지)">최상 (새상품급)</option>
                <option value="상 (외관 깨끗함, 정상 작동)">상 (깨끗함/정상작동)</option>
                <option value="중 (생활 흔적/스크래치 있음)">중 (생활 사용감)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#556853] mb-1">
                사용 기간
              </label>
              <input
                type="text"
                value={usedPeriod}
                onChange={(e) => setUsedPeriod(e.target.value)}
                placeholder="예: 1학기, 6개월 미만"
                className="w-full text-xs px-3 py-2 rounded-xl border border-gray-200 bg-white text-[#1E2B1D] focus:outline-none focus:ring-2 focus:ring-[#3E9628]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#556853] mb-1">
                크기 및 규격
              </label>
              <input
                type="text"
                value={size}
                onChange={(e) => setSize(e.target.value)}
                placeholder="예: 가로 40 x 세로 30cm"
                className="w-full text-xs px-3 py-2 rounded-xl border border-gray-200 bg-white text-[#1E2B1D] focus:outline-none focus:ring-2 focus:ring-[#3E9628]"
              />
            </div>
          </div>

          {/* 6. 상세 설명 */}
          <div>
            <label className="block text-xs font-semibold text-[#556853] mb-1">
              상세 설명 및 안내사항 (선택)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="직거래 안내, 특이사항, 부속품 상태 등을 자유롭게 적어주세요."
              className="w-full text-xs p-3 rounded-xl border border-[#3E9628]/25 bg-white text-[#1E2B1D] focus:outline-none focus:ring-2 focus:ring-[#3E9628]"
            />
          </div>

          {/* 하단 버튼 바 */}
          <div className="pt-2 border-t border-[#3E9628]/15 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-[#556853] hover:bg-black/5 transition-colors cursor-pointer"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#3E9628] text-white hover:bg-[#2D801E] active:scale-98 transition-all shadow-md shadow-[#3E9628]/20 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>{isSubmitting ? '수정 사항 저장 중...' : '수정 완료 및 저장'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
