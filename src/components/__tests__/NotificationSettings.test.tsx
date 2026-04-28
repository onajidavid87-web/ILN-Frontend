import { render, screen, fireEvent } from "@testing-library/react";
import NotificationSettings from "../../pages/settings/NotificationSettings";

// Mock ToastContext
jest.mock("../../context/ToastContext", () => ({
  useToast: () => ({ addToast: jest.fn(), updateToast: jest.fn() }),
}));

describe("NotificationSettings (#70)", () => {
  beforeEach(() => {
    localStorage.clear();
    render(<NotificationSettings />);
  });

  test("renders email and webhook sections", () => {
    expect(screen.getByTestId("email-input")).toBeInTheDocument();
    expect(screen.getByTestId("webhook-url-input")).toBeInTheDocument();
  });

  test("shows all event type toggles for email", () => {
    expect(screen.getByTestId("email-toggle-funded")).toBeInTheDocument();
    expect(screen.getByTestId("email-toggle-settled")).toBeInTheDocument();
    expect(screen.getByTestId("email-toggle-defaulted")).toBeInTheDocument();
    expect(screen.getByTestId("email-toggle-due_date_warning")).toBeInTheDocument();
  });

  test("saves email subscription to localStorage", () => {
    fireEvent.change(screen.getByTestId("email-input"), {
      target: { value: "test@example.com" },
    });
    fireEvent.click(screen.getByTestId("save-email-btn"));
    const stored = JSON.parse(localStorage.getItem("iln-notification-subscriptions") ?? "[]");
    expect(stored.length).toBe(1);
    expect(stored[0].type).toBe("email");
    expect(stored[0].target).toBe("test@example.com");
  });

  test("saves webhook subscription to localStorage", () => {
    fireEvent.change(screen.getByTestId("webhook-url-input"), {
      target: { value: "https://example.com/hook" },
    });
    fireEvent.click(screen.getByTestId("save-webhook-btn"));
    const stored = JSON.parse(localStorage.getItem("iln-notification-subscriptions") ?? "[]");
    expect(stored.length).toBe(1);
    expect(stored[0].type).toBe("webhook");
  });

  test("renders active subscriptions list", () => {
    const subs = [
      {
        id: "email-1",
        type: "email",
        target: "a@b.com",
        events: ["funded"],
        createdAt: new Date().toISOString(),
      },
    ];
    localStorage.setItem("iln-notification-subscriptions", JSON.stringify(subs));
    render(<NotificationSettings />);
    expect(screen.getAllByTestId("subscription-list")[0]).toBeInTheDocument();
  });
});
