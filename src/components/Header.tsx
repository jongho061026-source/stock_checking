import React from 'react';
import { RefreshCw, ShieldCheck, Radio, Lock, LogOut } from 'lucide-react';
import { MascotIcon } from './MascotIcon';

interface HeaderProps {
  onRefresh: () => void;
  isRefreshing: boolean;
  lastUpdatedTime: string;
  isAdminView: boolean;
  isAdminAuthenticated: boolean;
  onToggleAdminView: () => void;
  onLogoutAdmin: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onRefresh,
  isRefreshing,
  lastUpdatedTime,
  isAdminView,
  isAdminAuthenticated,
  onToggleAdminView,
  onLogoutAdmin,
}) => {
  return (
    <header id="dorm-market-header" className="bg-white/95 backdrop-blur-md border-b border-[#3E9628]/15 sticky top-0 z-30 shadow-xs">
      <div className="max-w-4xl mx-auto px-4 py-2.5 sm:px-6 flex items-center justify-between gap-3">
        {/* 서비스 이름과 마스코트 캐릭터 로고 */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="w-11 h-11 rounded-2xl bg-[#EAF5E7] border border-[#3E9628]/25 flex items-center justify-center shadow-xs p-1 overflow-hidden shrink-0 hover:scale-105 transition-transform">
            <MascotIcon className="w-full h-full" title="기숙사 플리마켓 마스코트" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-bold text-[#1E2B1D] tracking-tight">
                기숙사 플리마켓 재고 현황
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-[#EAF5E7] text-[#2D801E] border border-[#3E9628]/30">
                <Radio className="w-3 h-3 text-[#3E9628] animate-pulse" />
                실시간 연동
              </span>
            </div>
            <p className="text-xs text-[#556853]">
              기숙사 생활·가전·가구 실시간 잔여 수량 안내
            </p>
          </div>
        </div>

        {/* 액션 버튼 영역 */}
        <div className="flex items-center gap-2">
          {/* 새로고침 버튼 (화면 1 상단 요구사항) */}
          {!isAdminView && (
            <button
              id="refresh-stock-button"
              onClick={onRefresh}
              disabled={isRefreshing}
              title="최신 재고 다시 불러오기"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-medium text-[#1E2B1D] bg-white hover:bg-[#EAF5E7] active:scale-95 transition-all rounded-xl border border-[#3E9628]/20 cursor-pointer disabled:opacity-60 shadow-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[#3E9628] ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline font-semibold">새로고침</span>
              <span className="text-[11px] text-[#556853] font-normal">
                {lastUpdatedTime ? `(${lastUpdatedTime})` : ''}
              </span>
            </button>
          )}

          {/* 운영자 전용 화면 전환 버튼 */}
          {isAdminAuthenticated ? (
            <div className="flex items-center gap-1.5">
              <button
                id="toggle-admin-button"
                onClick={onToggleAdminView}
                className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer shadow-xs ${
                  isAdminView
                    ? 'bg-[#1E2B1D] text-[#EAF5E7] border border-[#3E9628]/30 hover:bg-[#1E2B1D]/90'
                    : 'bg-[#EAF5E7] text-[#2D801E] border border-[#3E9628]/30 hover:bg-[#3E9628]/20'
                }`}
                title={isAdminView ? '사용자 화면으로 전환' : '운영자 재고 관리로 이동'}
              >
                <ShieldCheck className="w-4 h-4 text-[#3E9628]" />
                <span>{isAdminView ? '사용자 화면' : '재고 관리 모드'}</span>
              </button>

              <button
                id="header-logout-button"
                onClick={onLogoutAdmin}
                className="inline-flex items-center p-2 rounded-xl text-[#556853] hover:text-rose-600 hover:bg-rose-50 border border-[#3E9628]/20 transition-colors cursor-pointer"
                title="운영자 로그아웃"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              id="toggle-admin-button"
              onClick={onToggleAdminView}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer shadow-xs bg-white text-[#1E2B1D] border border-[#3E9628]/20 hover:bg-[#EAF5E7]"
              title="운영자 전용 인증 후 접근"
            >
              <Lock className="w-3.5 h-3.5 text-[#556853]" />
              <span>운영자 관리</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
