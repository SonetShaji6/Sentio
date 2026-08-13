describe("Module 18: Analytics Formulas Unit Tests", () => {
  it("should calculate participation rate accurately", () => {
    const calculateParticipationRate = (active: number, total: number) =>
      total > 0 ? Math.round((active / total) * 100) : 0;

    expect(calculateParticipationRate(15, 20)).toBe(75);
    expect(calculateParticipationRate(0, 50)).toBe(0);
    expect(calculateParticipationRate(10, 0)).toBe(0);
    expect(calculateParticipationRate(3, 3)).toBe(100);
  });

  it("should calculate engagement score weightings correctly", () => {
    // Formula: (ResponseRate * 0.4) + (QnARate * 0.3) + (ReactionRate * 0.3)
    const calculateEngagement = (
      responseRate: number,
      qnaRate: number,
      reactionRate: number,
    ) => {
      const score = responseRate * 0.4 + qnaRate * 0.3 + reactionRate * 0.3;
      return Math.min(100, Math.round(score));
    };

    expect(calculateEngagement(100, 100, 100)).toBe(100);
    expect(calculateEngagement(50, 50, 50)).toBe(50);
    expect(calculateEngagement(80, 60, 40)).toBe(62);
    expect(calculateEngagement(0, 0, 0)).toBe(0);
  });

  it("should calculate quiz accuracy percentage correctly", () => {
    const calculateAccuracy = (correctAnswers: number, totalAnswers: number) =>
      totalAnswers > 0 ? Math.round((correctAnswers / totalAnswers) * 100) : 0;

    expect(calculateAccuracy(8, 10)).toBe(80);
    expect(calculateAccuracy(0, 10)).toBe(0);
    expect(calculateAccuracy(5, 5)).toBe(100);
  });
});
