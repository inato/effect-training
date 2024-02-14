import { describe, expect, it } from "bun:test";
import { Effect, Either, Option } from "effect";
import * as exercise from "./exo1.exercise";
import * as solution from "./exo1.solution";
import { isTestingSolution } from "../testUtils";

const {
  divide,
  DivisionByZero,
  safeDivide,
  safeDivideWithError,
  asyncDivide,
  asyncSafeDivideWithError,
} = isTestingSolution() ? solution : exercise;

describe("exo1", () => {
  describe("divide", () => {
    it("should return the result of dividing two numbers", () => {
      expect(divide(25, 5)).toEqual(5);
    });

    it("should return Infinity or -Infinity if the denominator is zero", () => {
      expect(divide(25, 0)).toBe(Infinity);
      expect(divide(-25, 0)).toBe(-Infinity);
    });
  });

  describe("safeDivide", () => {
    it("should return the result of dividing two numbers", () => {
      expect(safeDivide(25, 5)).toStrictEqual(Option.some(5));
    });

    it("should return Option.none if the denominator is zero", () => {
      expect(safeDivide(25, 0)).toStrictEqual(Option.none());
      expect(safeDivide(-25, 0)).toStrictEqual(Option.none());
    });
  });

  describe("safeDivideWithError", () => {
    it("should return the result of dividing two numbers", () => {
      expect(safeDivideWithError(25, 5)).toStrictEqual(Either.right(5));
    });

    it("should return either.left(DivisionByZero) if the denominator is zero", () => {
      expect(safeDivideWithError(25, 0)).toStrictEqual(
        Either.left(DivisionByZero)
      );
      expect(safeDivideWithError(-25, 0)).toStrictEqual(
        Either.left(DivisionByZero)
      );
    });
  });

  describe("asyncDivide", () => {
    it("should eventually return the result of dividing two numbers", async () => {
      const result = await asyncDivide(25, 5);

      expect(result).toEqual(5);
    });

    it("should eventually return Infinity if the denominator is zero", async () => {
      await expect(asyncDivide(25, 0)).rejects.toThrow();
      await expect(asyncDivide(-25, 0)).rejects.toThrow();
    });
  });

  describe("asyncSafeDivideWithError", () => {
    it("should eventually return the result of dividing two numbers", async () =>
      Effect.gen(function* (_) {
        const result = yield* _(asyncSafeDivideWithError(25, 5));

        expect(result).toStrictEqual(5);
      }));

    it("should eventually return either.left(DivisionByZero) if the denominator is zero", async () =>
      Effect.gen(function* (_) {
        const resultA = yield* _(
          asyncSafeDivideWithError(25, 0).pipe(Effect.either)
        );
        const resultB = yield* _(
          asyncSafeDivideWithError(-25, 0).pipe(Effect.either)
        );

        expect(resultA).toStrictEqual(Either.left(DivisionByZero));
        expect(resultB).toStrictEqual(Either.left(DivisionByZero));
      }));
  });
});
