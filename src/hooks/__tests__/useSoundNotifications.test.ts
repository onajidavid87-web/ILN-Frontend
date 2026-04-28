/**
 * Tests for useSoundNotifications — Issue #166
 */

// Minimal AudioContext stub
class MockOscillator {
  type = "sine";
  frequency = { setValueAtTime: jest.fn() };
  connect = jest.fn();
  start = jest.fn();
  stop = jest.fn();
}

class MockGainNode {
  gain = { setValueAtTime: jest.fn(), exponentialRampToValueAtTime: jest.fn() };
  connect = jest.fn();
}

class MockAudioContext {
  currentTime = 0;
  destination = {};
  createOscillator = () => new MockOscillator();
  createGain = () => new MockGainNode();
}

// @ts-expect-error — override for tests
global.AudioContext = MockAudioContext;

import { renderHook, act } from "@testing-library/react";
import { useSoundNotifications } from "../useSoundNotifications";

describe("useSoundNotifications (#166)", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test("is disabled by default", () => {
    const { result } = renderHook(() => useSoundNotifications());
    expect(result.current.enabled).toBe(false);
  });

  test("setEnabled toggles the enabled flag", () => {
    const { result } = renderHook(() => useSoundNotifications());
    act(() => result.current.setEnabled(true));
    expect(result.current.enabled).toBe(true);
  });

  test("persists enabled state to localStorage", () => {
    const { result } = renderHook(() => useSoundNotifications());
    act(() => result.current.setEnabled(true));
    const stored = JSON.parse(localStorage.getItem("iln-sound-prefs") ?? "{}");
    expect(stored.enabled).toBe(true);
  });

  test("default volume is 50", () => {
    const { result } = renderHook(() => useSoundNotifications());
    expect(result.current.volume).toBe(50);
  });

  test("setVolume clamps to 0–100", () => {
    const { result } = renderHook(() => useSoundNotifications());
    act(() => result.current.setVolume(150));
    expect(result.current.volume).toBe(100);
    act(() => result.current.setVolume(-10));
    expect(result.current.volume).toBe(0);
  });

  test("setMuted mutes without disabling", () => {
    const { result } = renderHook(() => useSoundNotifications());
    act(() => result.current.setEnabled(true));
    act(() => result.current.setMuted(true));
    expect(result.current.muted).toBe(true);
    expect(result.current.enabled).toBe(true);
  });

  test("playSound does nothing when disabled", () => {
    const { result } = renderHook(() => useSoundNotifications());
    // enabled = false by default — should not throw
    expect(() => act(() => result.current.playSound("success"))).not.toThrow();
  });

  test("playSound does nothing when muted", () => {
    const { result } = renderHook(() => useSoundNotifications());
    act(() => result.current.setEnabled(true));
    act(() => result.current.setMuted(true));
    expect(() => act(() => result.current.playSound("alert"))).not.toThrow();
  });

  test("persists muted state to localStorage", () => {
    const { result } = renderHook(() => useSoundNotifications());
    act(() => result.current.setMuted(true));
    const stored = JSON.parse(localStorage.getItem("iln-sound-prefs") ?? "{}");
    expect(stored.muted).toBe(true);
  });
});
