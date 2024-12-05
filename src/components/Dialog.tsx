import React, { useEffect, useRef } from 'react';
import { twMerge } from 'tailwind-merge';

type DialogProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: ((value: string) => Promise<boolean> | boolean) | (() => void);
  title: string;
  placeholder?: string;
  initialValue?: string;
  error?: string;
  type?: 'input' | 'confirm' | 'error';
  description?: string;
  confirmText?: string;
  confirmButtonClass?: string;
};

const Dialog = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  placeholder,
  initialValue = '',
  error,
  type = 'input',
  description,
  confirmText = '确定',
  confirmButtonClass,
}: DialogProps) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current && type === 'input') {
      inputRef.current.value = initialValue;
      inputRef.current.focus();
    }
  }, [isOpen, initialValue, type]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (type === 'input') {
      const value = inputRef.current?.value.trim();
      if (value) {
        const success = await (onConfirm as (value: string) => Promise<boolean> | boolean)(value);
        if (success) {
          onClose();
        }
      }
    } else {
      (onConfirm as () => void)();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
        <h3 className="text-lg font-semibold mb-4">{title}</h3>
        {description && (
          <p className="text-zinc-600 mb-4">{description}</p>
        )}
        <form onSubmit={handleSubmit}>
          {type === 'input' && (
            <>
              <input
                ref={inputRef}
                type="text"
                className={twMerge(
                  "w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2",
                  error ? "border-red-300 focus:ring-red-500" : "border-zinc-300 focus:ring-blue-500"
                )}
                placeholder={placeholder}
                defaultValue={initialValue}
              />
              {error && (
                <p className="mt-2 text-sm text-red-500">{error}</p>
              )}
            </>
          )}
          <div className="flex justify-end gap-3 mt-4">
            {type !== 'error' && (
                <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-sm text-zinc-600 hover:text-zinc-800"
                >
                  取消
                </button>
            )}

            <button
                type="submit"
                className={twMerge(
                    "px-4 py-2 text-sm text-white rounded-md",
                    confirmButtonClass || "bg-blue-500 hover:bg-blue-600"
              )}
            >
              {confirmText}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Dialog;
