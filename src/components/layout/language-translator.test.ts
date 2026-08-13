import { describe, expect, it } from "vitest";
import { funnyTranslation } from "./funny-language";

describe("funny language", () => {
  it("uses authored jokes for important actions", () => {
    expect(funnyTranslation("Пригласить друга")).toBe("Назначить второго родителя");
    expect(funnyTranslation("Общие аквариумы")).toBe("Коммуналка с жабрами");
  });

  it("transforms dynamic Russian text instead of leaving it untouched", () => {
    expect(funnyTranslation("В аквариуме живут 3 рыбки")).not.toBe("В аквариуме живут 3 рыбки");
  });

  it("does not corrupt identifiers or numbers", () => {
    expect(funnyTranslation("user_123")).toBe("user_123");
  });
});
