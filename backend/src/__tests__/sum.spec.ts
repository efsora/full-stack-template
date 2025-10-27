import  { describe, expect, it } from "vitest";
import { sum } from "#utils/sum";

describe("sum function", () => {
    it("should add two positive numbers", () => {
        const sumFunction = sum as (a: number, b: number) => number;
        expect(sumFunction(1, 3)).toBe(4);
    });
});