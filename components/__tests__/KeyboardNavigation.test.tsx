import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import InvoiceTable, { ColumnDefinition } from "../InvoiceTable";
import React from "react";
import { useRouter } from "next/navigation";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
}));

interface MockData {
  id: string;
  name: string;
}

const mockColumns: ColumnDefinition<MockData>[] = [
  { id: "id", label: "ID", isMandatory: true, renderCell: (d) => d.id },
  { id: "name", label: "Name", renderCell: (d) => d.name },
];

const mockData: MockData[] = [
  { id: "1", name: "Alpha" },
  { id: "2", name: "Beta" },
  { id: "3", name: "Gamma" },
];

describe("Keyboard Navigation", () => {
  const tableId = "test_table";
  const pushMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as any).mockReturnValue({
      push: pushMock,
    });
  });

  it("navigates between rows with ArrowDown and ArrowUp", () => {
    render(
      <InvoiceTable
        tableId={tableId}
        data={mockData}
        columns={mockColumns}
        keyExtractor={(d) => d.id}
      />
    );

    const rows = screen.getAllByRole("row").slice(1); // skip header row
    expect(rows).toHaveLength(3);

    // Initial focus on first row
    rows[0].focus();
    expect(document.activeElement).toBe(rows[0]);

    // ArrowDown to second row
    fireEvent.keyDown(rows[0], { key: "ArrowDown" });
    expect(document.activeElement).toBe(rows[1]);

    // ArrowDown to third row
    fireEvent.keyDown(rows[1], { key: "ArrowDown" });
    expect(document.activeElement).toBe(rows[2]);

    // ArrowDown at last row should stay at last row
    fireEvent.keyDown(rows[2], { key: "ArrowDown" });
    expect(document.activeElement).toBe(rows[2]);

    // ArrowUp to second row
    fireEvent.keyDown(rows[2], { key: "ArrowUp" });
    expect(document.activeElement).toBe(rows[1]);

    // ArrowUp to first row
    fireEvent.keyDown(rows[1], { key: "ArrowUp" });
    expect(document.activeElement).toBe(rows[0]);
  });

  it("navigates to detail page on Enter", () => {
    render(
      <InvoiceTable
        tableId={tableId}
        data={mockData}
        columns={mockColumns}
        keyExtractor={(d) => d.id}
      />
    );

    const rows = screen.getAllByRole("row").slice(1);
    
    // Press Enter on second row
    fireEvent.keyDown(rows[1], { key: "Enter" });
    
    expect(pushMock).toHaveBeenCalledWith("/i/2");
  });

  it("shows keyboard shortcut tooltip on ID column header", () => {
    render(
      <InvoiceTable
        tableId={tableId}
        data={mockData}
        columns={mockColumns}
        keyExtractor={(d) => d.id}
      />
    );

    const keyboardIcon = screen.getByText("keyboard");
    expect(keyboardIcon).toBeInTheDocument();
    
    const tooltipText = screen.getByText("Shortcuts");
    expect(tooltipText).toBeInTheDocument();
    expect(screen.getByText("Navigate rows")).toBeInTheDocument();
    expect(screen.getByText("Open detail")).toBeInTheDocument();
  });
});
