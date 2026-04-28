"use client";

/**
 * HelpMenu — Issue #169
 *
 * "?" help icon rendered in the top-right of each major page.
 * Opens a dropdown with "Take a tour of this page" and documentation links.
 */

import React, { useState, useRef, useEffect, useCallback } from "react";
import { PageTour } from "./PageTour";
import type { TourId } from "./tourDefinitions";

interface DocLink {
  label: string;
  href: string;
}

interface HelpMenuProps {
  tourId: TourId;
  docLinks?: DocLink[];
}

const DEFAULT_DOC_LINKS: DocLink[] = [
  { label: "Protocol documentation", href: "https://docs.iln.finance" },
  { label: "FAQ", href: "https://docs.iln.finance/faq" },
];

export function HelpMenu({ tourId, docLinks = DEFAULT_DOC_LINKS }: HelpMenuProps) {
  const [open, setOpen] = useState(false);
  const [tourRunning, setTourRunning] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const startTour = useCallback(() => {
    setOpen(false);
    setTourRunning(true);
  }, []);

  const finishTour = useCallback(() => {
    setTourRunning(false);
  }, []);

  return (
    <>
      {/* Joyride is mounted only when running */}
      {tourRunning && (
        <PageTour tourId={tourId} run={tourRunning} onFinish={finishTour} />
      )}

      <div ref={menuRef} className="relative inline-block" data-testid="help-menu">
        <button
          onClick={() => setOpen((v) => !v)}
          aria-label="Help and page tour"
          data-testid="help-button"
          className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-300 bg-white text-sm font-bold text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors shadow-sm"
        >
          ?
        </button>

        {open && (
          <div
            data-testid="help-menu-dropdown"
            className="absolute right-0 mt-2 w-56 rounded-xl border border-gray-200 bg-white shadow-lg z-50 py-1"
          >
            <button
              onClick={startTour}
              data-testid="start-tour-btn"
              className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-left hover:bg-blue-50 hover:text-blue-700 transition-colors"
            >
              <span>🎯</span> Take a tour of this page
            </button>

            {docLinks.length > 0 && (
              <>
                <div className="my-1 border-t border-gray-100" />
                {docLinks.map(({ label, href }) => (
                  <a
                    key={href}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <span>📖</span> {label}
                  </a>
                ))}
              </>
            )}
          </div>
        )}
      </div>
    </>
  );
}
