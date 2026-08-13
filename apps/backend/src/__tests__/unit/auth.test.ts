import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

describe("Module 18: Auth & Password Unit Tests", () => {
  const JWT_SECRET = "test-sentio-secret";

  it("should correctly hash and verify user passwords", async () => {
    const password = "StrongPassword@123";
    const hash = await bcrypt.hash(password, 12);

    expect(hash).not.toEqual(password);
    const match = await bcrypt.compare(password, hash);
    expect(match).toBe(true);

    const wrongMatch = await bcrypt.compare("WrongPassword", hash);
    expect(wrongMatch).toBe(false);
  });

  it("should sign and verify valid JWT access tokens", () => {
    const payload = { sub: "user-12345", role: "presenter" };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "15m" });

    expect(typeof token).toBe("string");

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    expect(decoded.sub).toBe("user-12345");
    expect(decoded.role).toBe("presenter");
  });

  it("should reject expired or tampered JWT tokens", () => {
    const payload = { sub: "user-12345", role: "presenter" };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "0s" });

    expect(() => {
      jwt.verify(token, JWT_SECRET);
    }).toThrow();

    const tamperedToken = token + "corrupted";
    expect(() => {
      jwt.verify(tamperedToken, JWT_SECRET);
    }).toThrow();
  });
});
