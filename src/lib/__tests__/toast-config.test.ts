import { describe, expect, it } from "vitest";
import { TOAST_AUTO_DISMISS_MS, TOAST_MAX_VISIBLE, TOAST_POSITION } from "@/lib/toast-config";

describe("toast-config", () => {
  it("limits visible toasts and positions them bottom-right", () => {
    expect(TOAST_MAX_VISIBLE).toBe(3);
    expect(TOAST_POSITION).toBe("bottom-right");
    expect(TOAST_AUTO_DISMISS_MS).toBe(5000);
  });
});
