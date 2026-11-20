import { describe, expect, it } from "bun:test";
import { Either, Option } from "effect";
import * as exercise from "./exo2.exercise";
import * as solution from "./exo2.solution";
import { isTestingSolution } from "../testUtils";

const {
  Warrior,
  Wizard,
  Archer,
  Damage,
  Exo2FailureType,
  checkAttackerAndSmash,
  checkAttackerAndBurn,
  checkAttackerAndShoot,
  smashOption,
  burnOption,
  shootOption,
  attack,
} = isTestingSolution() ? solution : exercise;

// Only the failure type matters, not the reason message
const expectFailure = (
  result: Either.Either<unknown, { type: string }>,
  type: string
) => {
  expect(Either.isLeft(result)).toBe(true);
  if (Either.isLeft(result)) {
    expect(result.left.type).toBe(type);
  }
};

describe("exo2", () => {
  describe("checkAttackerAndSmash", () => {
    it("should return a NoAttacker error if no attacker is selected", () => {
      const result = checkAttackerAndSmash(Option.none());
      expectFailure(result, Exo2FailureType.NoAttacker);
    });

    it("should return an InvalidAttacker error if the wrong attacker is selected", () => {
      const archer = new Archer();
      const resultArcher = checkAttackerAndSmash(Option.some(archer));

      const wizard = new Wizard();
      const resultWizard = checkAttackerAndSmash(Option.some(wizard));

      expectFailure(resultArcher, Exo2FailureType.InvalidAttacker);

      expectFailure(resultWizard, Exo2FailureType.InvalidAttacker);
    });

    it("should return the proper type of damage", () => {
      const warrior = new Warrior();
      const result = checkAttackerAndSmash(Option.some(warrior));
      const expected = Either.right(Damage.Physical);

      expect(result).toStrictEqual(expected);
    });
  });

  describe("checkAttackerAndBurn", () => {
    it("should return a NoAttacker error if no attacker is selected", () => {
      const result = checkAttackerAndBurn(Option.none());
      expectFailure(result, Exo2FailureType.NoAttacker);
    });

    it("should return an InvalidAttacker error if the wrong attacker is selected", () => {
      const warrior = new Warrior();
      const resultWarrior = checkAttackerAndBurn(Option.some(warrior));

      const archer = new Archer();
      const resultArcher = checkAttackerAndBurn(Option.some(archer));

      expectFailure(resultWarrior, Exo2FailureType.InvalidAttacker);

      expectFailure(resultArcher, Exo2FailureType.InvalidAttacker);
    });

    it("should return the proper type of damage", () => {
      const wizard = new Wizard();
      const result = checkAttackerAndBurn(Option.some(wizard));
      const expected = Either.right(Damage.Magical);

      expect(result).toStrictEqual(expected);
    });
  });

  describe("checkAttackerAndShoot", () => {
    it("should return a NoAttacker error if no attacker is selected", () => {
      const result = checkAttackerAndShoot(Option.none());
      expectFailure(result, Exo2FailureType.NoAttacker);
    });

    it("should return an InvalidAttacker error if the wrong attacker is selected", () => {
      const warrior = new Warrior();
      const resultWarrior = checkAttackerAndShoot(Option.some(warrior));

      const wizard = new Wizard();
      const resultWizard = checkAttackerAndShoot(Option.some(wizard));

      expectFailure(resultWarrior, Exo2FailureType.InvalidAttacker);

      expectFailure(resultWizard, Exo2FailureType.InvalidAttacker);
    });

    it("should return the proper type of damage", () => {
      const archer = new Archer();
      const result = checkAttackerAndShoot(Option.some(archer));
      const expected = Either.right(Damage.Ranged);

      expect(result).toStrictEqual(expected);
    });
  });

  describe("smashOption", () => {
    it("should return Option.none if the character is of the wrong type", () => {
      const wizard = new Wizard();
      const archer = new Archer();

      const resultWizard = smashOption(wizard);
      const resultArcher = smashOption(archer);

      const expected = Option.none();

      expect(resultWizard).toStrictEqual(expected);
      expect(resultArcher).toStrictEqual(expected);
    });

    it("should return Option.some(Damage.Physical) if the character is a warrior", () => {
      const warrior = new Warrior();

      const result = smashOption(warrior);
      const expected = Option.some(Damage.Physical);

      expect(result).toStrictEqual(expected);
    });
  });

  describe("burnOption", () => {
    it("should return Option.none if the character is of the wrong type", () => {
      const warrior = new Warrior();
      const archer = new Archer();

      const resultWarrior = burnOption(warrior);
      const resultArcher = burnOption(archer);

      const expected = Option.none();

      expect(resultWarrior).toStrictEqual(expected);
      expect(resultArcher).toStrictEqual(expected);
    });

    it("should return Option.some(Damage.Magical) if the character is a wizard", () => {
      const wizard = new Wizard();

      const result = burnOption(wizard);
      const expected = Option.some(Damage.Magical);

      expect(result).toStrictEqual(expected);
    });
  });

  describe("shootOption", () => {
    it("should return Option.none if the character is of the wrong type", () => {
      const warrior = new Warrior();
      const wizard = new Wizard();

      const resultWizard = shootOption(wizard);
      const resultWarrior = shootOption(warrior);

      const expected = Option.none();

      expect(resultWarrior).toStrictEqual(expected);
      expect(resultWizard).toStrictEqual(expected);
    });

    it("should return Option.some(Damage.Ranged) if the character is an archer", () => {
      const archer = new Archer();

      const result = shootOption(archer);
      const expected = Option.some(Damage.Ranged);

      expect(result).toStrictEqual(expected);
    });
  });

  describe("attack", () => {
    it("should return the correct number of each type of attacks", () => {
      const warrior = new Warrior();
      const wizard = new Wizard();
      const archer = new Archer();

      const army = [
        warrior,
        wizard,
        archer,
        wizard,
        wizard,
        archer,
        warrior,
        wizard,
        archer,
      ];

      const result = attack(army);
      const expected = {
        "Physical damage": 2,
        "Magical damage": 4,
        "Ranged damage": 3,
      };

      expect(result).toStrictEqual(expected);
    });
  });
});
