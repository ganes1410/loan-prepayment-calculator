import "@testing-library/jest-dom";
import { vi } from "vitest";

// Mock crypto.randomUUID
if (!global.crypto) {
  global.crypto = {
    randomUUID: () => Math.random().toString(36).substring(2),
  } as Crypto;
}

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));
