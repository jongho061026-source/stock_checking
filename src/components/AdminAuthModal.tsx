import React, { useState, useEffect, useRef } from 'react';
import { Lock, ShieldAlert, KeyRound, Eye, EyeOff, X, ArrowRight } from 'lucide-react';
import { verifyAdminPassword } from '../utils/storage';

interface AdminAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AdminAuthModal: React.FC<AdminAuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isShaking, setIsShaking] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setPassword('');
      setErrorMsg(null);
      setShowPassword(false);
      // Autofocus input
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setErrorMsg('운영자 비밀번호를 입력해 주세요.');
      inputRef.current?.focus();
      return;
    }

    const isValid = verifyAdminPassword(password);
    if (isValid) {
      setErrorMsg(null);
      setPassword('');
      onSuccess();
    } else {
      setErrorMsg('비밀번호가 일치하지 않습니다. 관리자 권한을 확인해 주세요.');
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
      inputRef.current?.select();
    }
  };

  return (
    <div
      id="admin-auth-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1E2B1D]/65 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="admin-auth-modal-content"
        className={`relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-[#3E9628]/25 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 ${
          isShaking ? 'animate-bounce' : ''
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 모달 상단 헤더 */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#3E9628]/15 bg-[#EAF5E7]/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#1E2B1D] text-[#EAF5E7] flex items-center justify-center shadow-xs">
              <Lock className="w-4 h-4 text-[#74C962]" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#1E2B1D]">운영자 인증</h2>
              <span className="text-[11px] text-[#556853]">현장 관리자 전용 보안 접근</span>
            </div>
          </div>

          <button
            id="close-admin-auth-modal-btn"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#556853] hover:text-[#1E2B1D] hover:bg-[#EAF5E7] transition-colors cursor-pointer"
            aria-label="닫기"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 바디 컨텐츠 */}
        <div className="p-6 space-y-4">
          <div className="bg-[#EAF5E7]/60 border border-[#3E9628]/20 rounded-xl p-3.5 flex items-start gap-2.5 text-xs text-[#1E2B1D]">
            <ShieldAlert className="w-4 h-4 text-[#3E9628] shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-semibold text-[#1E2B1D]">
                운영자만 재고 수정 권한을 가질 수 있습니다.
              </p>
              <p className="text-[#556853] leading-relaxed">
                학생들의 무분별한 재고 수량 변경을 방지하기 위해, 기숙사 자치회 및 현장 부스 관리자 비밀번호 입력이 필요합니다.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="admin-password-input"
                className="block text-xs font-bold text-[#1E2B1D] mb-1.5"
              >
                관리자 비밀번호
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#556853]">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  ref={inputRef}
                  id="admin-password-input"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errorMsg) setErrorMsg(null);
                  }}
                  placeholder="운영자 비밀번호를 입력하세요"
                  className={`w-full pl-9 pr-10 py-2.5 bg-[#F4F8F3] border text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3E9628] transition-all text-[#1E2B1D] placeholder-[#556853]/60 font-medium ${
                    errorMsg
                      ? 'border-rose-300 ring-1 ring-rose-300 bg-rose-50/40'
                      : 'border-[#3E9628]/25'
                  }`}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#556853] hover:text-[#1E2B1D] cursor-pointer"
                  aria-label={showPassword ? '비밀번호 가리기' : '비밀번호 표시'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {errorMsg && (
                <p
                  id="admin-auth-error-msg"
                  className="mt-1.5 text-xs text-rose-600 font-medium flex items-center gap-1 animate-in fade-in"
                >
                  <span>•</span>
                  <span>{errorMsg}</span>
                </p>
              )}
            </div>

            {/* 보안 안내 문구 (비밀번호 노출 방지) */}
            <div className="p-2.5 rounded-lg bg-[#EAF5E7]/50 border border-[#3E9628]/20 text-[11px] text-[#556853] flex items-center justify-between">
              <span>🔒 기숙사 자치회 및 현장 관리자 전용 인증 구역입니다.</span>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 px-4 text-xs font-semibold text-[#556853] hover:text-[#1E2B1D] bg-[#EAF5E7]/50 hover:bg-[#EAF5E7] rounded-xl transition-colors cursor-pointer"
              >
                취소 (사용자 화면 유지)
              </button>
              <button
                id="submit-admin-auth-btn"
                type="submit"
                className="flex-1 py-2.5 px-4 text-xs font-bold text-white bg-[#3E9628] hover:bg-[#3E9628]/90 rounded-xl transition-all shadow-xs inline-flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
              >
                <span>운영자 모드 진입</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
