import { renderHook, act } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { toast as sonnerToast } from "sonner";
import { ToastProvider, useToast } from "@/context/ToastContext";
import { TOAST_AUTO_DISMISS_MS, TOAST_MAX_VISIBLE } from "@/lib/toast-config";

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
    loading: vi.fn(),
    dismiss: vi.fn(),
  },
  Toaster: () => null,
}));

vi.mock("@/components/AppToaster", () => ({
  default: () => null,
}));

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <ToastProvider>{children}</ToastProvider>
);

describe("useToast", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("exposes configured toast limits", () => {
    expect(TOAST_MAX_VISIBLE).toBe(3);
    expect(TOAST_AUTO_DISMISS_MS).toBe(5000);
  });

  it("shows success toasts with auto-dismiss duration", () => {
    const { result } = renderHook(() => useToast(), { wrapper });

    act(() => {
      result.current.addToast({ type: "success", title: "Saved" });
    });

    expect(sonnerToast.success).toHaveBeenCalledWith(
      "Saved",
      expect.objectContaining({ duration: TOAST_AUTO_DISMISS_MS }),
    );
  });

  it("keeps error toasts visible until dismissed", () => {
    const { result } = renderHook(() => useToast(), { wrapper });

    act(() => {
      result.current.addToast({ type: "error", title: "Failed" });
    });

    expect(sonnerToast.error).toHaveBeenCalledWith(
      "Failed",
      expect.objectContaining({ duration: Infinity }),
    );
  });

  it("updates an existing toast by id", () => {
    const { result } = renderHook(() => useToast(), { wrapper });
    let id = "";

    act(() => {
      id = result.current.addToast({ type: "pending", title: "Working" });
      result.current.updateToast(id, { type: "success", title: "Done" });
    });

    expect(sonnerToast.loading).toHaveBeenCalled();
    expect(sonnerToast.success).toHaveBeenCalledWith(
      "Done",
      expect.objectContaining({ id }),
    );
  });

  it("dismisses toasts via removeToast", () => {
    const { result } = renderHook(() => useToast(), { wrapper });

    act(() => {
      const id = result.current.addToast({ type: "info", title: "Heads up" });
      result.current.removeToast(id);
    });

    expect(sonnerToast.dismiss).toHaveBeenCalled();
  });
});
