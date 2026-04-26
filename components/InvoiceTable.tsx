"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import ColumnCustomiser, { ColumnConfig } from "./ColumnCustomiser";

export interface ColumnDefinition<T> extends ColumnConfig {
  renderCell: (item: T) => React.ReactNode;
  headerClassName?: string;
  cellClassName?: string;
  sortable?: boolean;
}

interface InvoiceTableProps<T> {
  tableId: string;
  data: T[];
  columns: ColumnDefinition<T>[];
  isLoading?: boolean;
  emptyMessage?: string;
  onSort?: (key: keyof T | string) => void;
  sortKey?: string;
  sortOrder?: "asc" | "desc";
  keyExtractor: (item: T) => string;
}

export default function InvoiceTable<T>({
  tableId,
  data,
  columns,
  isLoading,
  emptyMessage = "No data found.",
  onSort,
  sortKey,
  sortOrder,
  keyExtractor,
}: InvoiceTableProps<T>) {
  const router = useRouter();
  const storageKey = `iln_table_config_${tableId}`;

  // State for order and visibility
  const [columnOrder, setColumnOrder] = useState<string[]>([]);
  const [visibleColumns, setVisibleColumns] = useState<string[]>([]);
  const [isInitialised, setIsInitialised] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    const defaultOrder = columns.map((c) => c.id);
    const defaultVisible = columns.filter((c) => c.isMandatory !== false).map((c) => c.id);

    if (saved) {
      try {
        const config = JSON.parse(saved);
        // Merge with current columns (in case columns changed in code)
        const validOrder = config.order.filter((id: string) => columns.some((c) => c.id === id));
        const missingFromOrder = defaultOrder.filter((id) => !validOrder.includes(id));
        
        setColumnOrder([...validOrder, ...missingFromOrder]);
        setVisibleColumns(config.visibility || defaultVisible);
      } catch (e) {
        console.error("Failed to load table config", e);
        setColumnOrder(defaultOrder);
        setVisibleColumns(defaultVisible);
      }
    } else {
      setColumnOrder(defaultOrder);
      setVisibleColumns(defaultVisible);
    }
    setIsInitialised(true);
  }, [tableId, columns]);

  // Save to localStorage when state changes
  useEffect(() => {
    if (!isInitialised) return;
    const config = {
      order: columnOrder,
      visibility: visibleColumns,
    };
    localStorage.setItem(storageKey, JSON.stringify(config));
  }, [columnOrder, visibleColumns, isInitialised, storageKey]);

  const handleVisibilityChange = (id: string, visible: boolean) => {
    if (visible) {
      setVisibleColumns((prev) => [...prev, id]);
    } else {
      setVisibleColumns((prev) => prev.filter((v) => v !== id));
    }
  };

  const handleReset = () => {
    const defaultOrder = columns.map((c) => c.id);
    const defaultVisible = columns.map((c) => c.id); // All visible by default
    setColumnOrder(defaultOrder);
    setVisibleColumns(defaultVisible);
  };

  const activeColumns = useMemo(() => {
    return columnOrder
      .map((id) => columns.find((c) => c.id === id))
      .filter((c): c is ColumnDefinition<T> => !!c && visibleColumns.includes(c.id));
  }, [columnOrder, visibleColumns, columns]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTableRowElement>, item: T, index: number) => {
    const rowElements = Array.from(e.currentTarget.parentElement?.querySelectorAll('tr[role="row"]') || []);

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        (rowElements[index + 1] as HTMLElement)?.focus();
        break;
      case "ArrowUp":
        e.preventDefault();
        (rowElements[index - 1] as HTMLElement)?.focus();
        break;
      case "Enter":
        e.preventDefault();
        // Assuming item has an id property that can be used for navigation
        const itemId = (item as any).id?.toString();
        if (itemId) {
          router.push(`/i/${itemId}`);
        }
        break;
    }
  };

  if (!isInitialised) return null; // Avoid layout shift

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end px-6">
        <ColumnCustomiser
          allColumns={columns}
          visibleColumns={visibleColumns}
          columnOrder={columnOrder}
          onVisibilityChange={handleVisibilityChange}
          onOrderChange={setColumnOrder}
          onReset={handleReset}
        />
      </div>

      <div className="overflow-x-auto rounded-xl">
        <table className="w-full text-left">
          <thead className="bg-surface-container-low">
            <tr>
              {activeColumns.map((col, idx) => (
                <th
                  key={col.id}
                  onClick={() => col.sortable && onSort?.(col.id)}
                  className={`px-6 py-4 text-[11px] font-bold uppercase text-on-surface-variant tracking-wider ${
                    col.sortable ? "cursor-pointer select-none group" : ""
                  } ${col.headerClassName || ""}`}
                >
                  <div className="flex items-center gap-1">
                    {col.label}
                    {idx === 0 && (
                      <div className="group/tooltip relative inline-block ml-1">
                        <span className="material-symbols-outlined text-[14px] text-on-surface-variant/40 cursor-help">keyboard</span>
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/tooltip:block bg-surface-container-highest text-on-surface text-[10px] p-2 rounded shadow-xl w-max z-20 normal-case font-normal border border-outline-variant/20">
                          <div className="font-bold mb-1 border-b border-outline-variant/20 pb-1">Shortcuts</div>
                          <div className="flex items-center gap-2 mb-1">
                            <kbd className="bg-surface-dim px-1.5 py-0.5 rounded border border-outline-variant/30 min-w-[20px] text-center">↑↓</kbd>
                            <span>Navigate rows</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <kbd className="bg-surface-dim px-1.5 py-0.5 rounded border border-outline-variant/30 min-w-[20px] text-center">↵</kbd>
                            <span>Open detail</span>
                          </div>
                        </div>
                      </div>
                    )}
                    {col.sortable && (
                      <span className="material-symbols-outlined text-[14px] opacity-0 group-hover:opacity-100 transition-opacity">
                        {sortKey === col.id ? (sortOrder === "asc" ? "arrow_upward" : "arrow_downward") : "unfold_more"}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-dim bg-surface-container-lowest/50">
            {isLoading ? (
              <tr>
                <td colSpan={activeColumns.length} className="px-6 py-12 text-center text-on-surface-variant italic">
                  <div className="flex flex-col items-center gap-3">
                    <span className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></span>
                    Loading assets...
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={activeColumns.length} className="px-6 py-12 text-center text-on-surface-variant italic">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((item, index) => (
                <tr
                  key={keyExtractor(item)}
                  tabIndex={0}
                  role="row"
                  onKeyDown={(e) => handleKeyDown(e, item, index)}
                  className="hover:bg-surface-variant/10 transition-colors group focus:outline-none focus:ring-2 focus:ring-primary focus:ring-inset focus:bg-primary/5"
                >
                  {activeColumns.map((col) => (
                    <td key={col.id} className={`px-6 py-5 ${col.cellClassName || ""}`}>
                      {col.renderCell(item)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

