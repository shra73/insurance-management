import { useEffect, useRef } from "react";
import Button from "./ui/Button";

export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmLabel = "Confirm",
  isLoading,
  onConfirm,
  onCancel
}) {
  const dialogRef = useRef(null);

  // Basic accessibility: focus the dialog on open, close on Escape.
  useEffect(() => {
    if (isOpen) {
      dialogRef.current?.focus();
      const handleKey = (e) => e.key === "Escape" && onCancel();
      window.addEventListener("keydown", handleKey);
      return () => window.removeEventListener("keydown", handleKey);
    }
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4"
      onClick={onCancel}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="card shadow-modal w-full max-w-sm p-6 focus:outline-none"
      >
        <h3 id="confirm-modal-title" className="text-base font-semibold text-slate-900 mb-2">
          {title}
        </h3>
        <p className="text-sm text-slate-500 mb-6">{message}</p>
        <div className="flex justify-end gap-3">
          <Button variant="ghost" size="sm" onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
          <Button variant="danger" size="sm" onClick={onConfirm} isLoading={isLoading}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}