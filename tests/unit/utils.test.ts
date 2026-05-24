import { describe, it, expect } from "vitest";
import { formatFileSize, truncate, formatRelativeDate, getInitials } from "@/utils/cn";

describe("formatFileSize", () => {
  it("formats bytes", () => {
    expect(formatFileSize(0)).toBe("0 B");
    expect(formatFileSize(1024)).toBe("1 KB");
    expect(formatFileSize(1024 * 1024)).toBe("1 MB");
    expect(formatFileSize(1024 * 1024 * 1024)).toBe("1 GB");
  });

  it("handles fractional MB", () => {
    expect(formatFileSize(1.5 * 1024 * 1024)).toBe("1.5 MB");
  });
});

describe("truncate", () => {
  it("returns string as-is if under maxLength", () => {
    expect(truncate("hello", 10)).toBe("hello");
  });

  it("truncates and adds ellipsis", () => {
    expect(truncate("hello world", 5)).toBe("hello...");
  });
});

describe("getInitials", () => {
  it("gets initials from name", () => {
    expect(getInitials("John Doe")).toBe("JD");
    expect(getInitials("Alice")).toBe("AL");
    expect(getInitials("John Michael Doe")).toBe("JM");
  });
});

describe("formatRelativeDate", () => {
  it("returns 'just now' for recent dates", () => {
    const now = new Date();
    expect(formatRelativeDate(now)).toBe("just now");
  });

  it("returns minutes for recent dates", () => {
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);
    expect(formatRelativeDate(fiveMinAgo)).toBe("5m ago");
  });
});
