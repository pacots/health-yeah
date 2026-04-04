"use client";

import { X } from "lucide-react";

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDangerous?: boolean;
  isLoading?: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  isDangerous = false,
  isLoading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  const handleConfirm = async () => {
    await onConfirm();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-3 sm:p-4 z-50">
      <div className="bg-white rounded-lg shadow-2xl max-w-sm w-full animate-in fade-in">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-200">
          <h2 className={`text-lg sm:text-xl font-bold ${isDangerous ? "text-red-900" : "text-slate-900"}`}>
            {title}
          </h2>
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="p-1 hover:bg-slate-100 rounded-lg transition flex-shrink-0 disabled:opacity-50"
          >
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        {/* Message */}
        <div className="px-4 sm:px-5 py-4 sm:py-5">
          <p className="text-sm text-slate-700 leading-relaxed">{message}</p>
        </div>

        {/* Actions */}
        <div className="border-t border-slate-200 p-4 sm:p-5 flex gap-2.5 flex-col-reverse sm:flex-row">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="btn-secondary flex-1 text-sm disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            onClick={handleConfirm}
            disabled={isLoading}
            className={`flex-1 text-sm font-semibold py-2.5 px-4 rounded-lg transition ${
              isDangerous
                ? "bg-red-600 text-white hover:bg-red-700 disabled:bg-red-400"
                : "bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-400"
            }`}
          >
            {isLoading ? "Processing..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
