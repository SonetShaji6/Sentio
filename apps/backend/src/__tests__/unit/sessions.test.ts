describe("Session Join Code & Normalization Unit Tests", () => {
  it("should normalize and format join codes to uppercase and strip whitespace", () => {
    const normalizeCode = (raw: string) =>
      (raw || "")
        .trim()
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, "");

    expect(normalizeCode("abc123")).toBe("ABC123");
    expect(normalizeCode("  ab-cd-ef  ")).toBe("ABCDEF");
    expect(normalizeCode("123456")).toBe("123456");
  });

  it("should extract join codes correctly from various URL patterns", () => {
    const extractCodeFromUrl = (urlStr: string): string | null => {
      try {
        const url = new URL(urlStr);
        const playMatch = url.pathname.match(/\/play\/([A-Za-z0-9]+)/i);
        if (playMatch && playMatch[1]) {
          return playMatch[1].toUpperCase();
        }
        const queryCode = url.searchParams.get("code");
        if (queryCode) {
          return queryCode.toUpperCase();
        }
      } catch {
        // raw string fallback
        const match = urlStr.match(/[A-Za-z0-9]{4,8}/);
        return match ? match[0].toUpperCase() : null;
      }
      return null;
    };

    expect(extractCodeFromUrl("https://sentio.app/play/ABC123")).toBe("ABC123");
    expect(extractCodeFromUrl("http://localhost:3000/join?code=XYZ789")).toBe(
      "XYZ789",
    );
    expect(extractCodeFromUrl("https://sentio.app/play/DEMO99?name=Alex")).toBe(
      "DEMO99",
    );
    expect(extractCodeFromUrl("ABC123")).toBe("ABC123");
  });
});
