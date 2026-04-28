"use client";

/**
 * PageTour — Issue #169
 *
 * Renders a React Joyride tour for the given tourId.
 * Tours are NEVER auto-triggered — always initiated by the user
 * via the HelpMenu component.
 */

import React, { useCallback, useState } from "react";
import Joyride, { type CallBackProps, STATUS, type Step } from "react-joyride";
import { TOURS, type TourId } from "./tourDefinitions";

interface PageTourProps {
  tourId: TourId;
  run: boolean;
  onFinish: () => void;
}

export function PageTour({ tourId, run, onFinish }: PageTourProps) {
  const tour = TOURS[tourId];

  const steps: Step[] = tour.steps.map((s) => ({
    target: s.target,
    title: s.title,
    content: s.content,
    disableBeacon: s.disableBeacon ?? false,
  }));

  const handleCallback = useCallback(
    (data: CallBackProps) => {
      const { status } = data;
      if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
        onFinish();
      }
    },
    [onFinish]
  );

  return (
    <Joyride
      steps={steps}
      run={run}
      continuous
      showSkipButton
      showProgress
      scrollToFirstStep
      disableOverlayClose={false}
      callback={handleCallback}
      styles={{
        options: {
          primaryColor: "#2563eb",
          zIndex: 10000,
        },
      }}
      locale={{
        skip: "Skip tour",
        last: "Finish",
        next: "Next →",
        back: "← Back",
        close: "Close",
      }}
    />
  );
}
