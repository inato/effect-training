// `Effect` training Exercise 2
// Let's have fun with combinators!

import { Failure } from "../Failure";

import { Array, Either, Option, flow, pipe } from "effect";

///////////////////////////////////////////////////////////////////////////////
//                                   SETUP                                   //
///////////////////////////////////////////////////////////////////////////////

// We are developing a small game, and the player can control Either one of
// three types of characters, mainly differentiated by the type of damage they
// can put out.

// Our main `Character` type is a simple union of all the concrete character
// types.
export type Character = Warrior | Wizard | Archer;

// We have three types of `Damage`, each corresponding to a character type.
export enum Damage {
  Physical = "Physical damage",
  Magical = "Magical damage",
  Ranged = "Ranged damage",
}

// A `Warrior` only can output physical damage.
export class Warrior {
  smash() {
    return Damage.Physical;
  }

  toString() {
    return "Warrior";
  }
}

// A `Wizard` only can output magical damage.
export class Wizard {
  burn() {
    return Damage.Magical;
  }

  toString() {
    return "Wizard";
  }
}

// An `Archer` only can output ranged damage.
export class Archer {
  shoot() {
    return Damage.Ranged;
  }

  toString() {
    return "Archer";
  }
}

// We also have convenient type guards to help us differentiate between
// character types when given a `Character`.

export const isWarrior = (character: Character): character is Warrior => {
  return (character as Warrior).smash !== undefined;
};

export const isWizard = (character: Character): character is Wizard => {
  return (character as Wizard).burn !== undefined;
};

export const isArcher = (character: Character): character is Archer => {
  return (character as Archer).shoot !== undefined;
};

// Finally, we have convenient and expressive error types, defining what can
// go wrong in our game:
// - the player can try to perform an action without first choosing a character as the attacker
// - the player can try to perform the wrong action for a character class

export enum Exo2FailureType {
  NoAttacker = "Exo2FailureType_NoAttacker",
  InvalidAttacker = "Exo2FailureType_InvalidAttacker",
}

export type NoAttackerFailure = Failure<Exo2FailureType.NoAttacker>;
export const noAttackerFailure = Failure.builder(Exo2FailureType.NoAttacker);

export type InvalidAttackerFailure = Failure<Exo2FailureType.InvalidAttacker>;
export const invalidAttackerFailure = Failure.builder(
  Exo2FailureType.InvalidAttacker
);

///////////////////////////////////////////////////////////////////////////////
//                                  EITHER                                   //
///////////////////////////////////////////////////////////////////////////////

// The next three functions take the character currently selected by the player as the attacker
// and return the expected damage type if appropriate.
//
// If no attacker is selected, it should return
// `Either.left(noAttackerFailure('No attacker currently selected'))`
//
// If an attacker of the wrong type is selected, it should return
// `Either.left(invalidAttackerFailure('<attacker_type> cannot perform <action>'))`
//
// Otherwise, it should return `Either.right(<expected_damage_type>)`
//
// HINT: These functions represent the public API. But it is heavily
// recommended to break those down into smaller private functions that can be
// reused instead of doing one big `pipe` for each.
//
// HINT: `Either` has a special constructor `fromPredicate` that can accept
// a type guard such as `isWarrior` to help with type inference.
//
// HINT: Sequentially check for various possible errors is one of the most
// common operations done with the `Either` type and it is available through
// the `flatMap` operator.

const checkSelected = Either.fromOption(() =>
  noAttackerFailure("No attacker currently selected")
);

const checkWarrior = Either.liftPredicate(isWarrior, (character) =>
  invalidAttackerFailure(`${character.toString()} cannot perform smash`)
);

const checkWizard = Either.liftPredicate(isWizard, (character) =>
  invalidAttackerFailure(`${character.toString()} cannot perform burn`)
);

const checkArcher = Either.liftPredicate(isArcher, (character) =>
  invalidAttackerFailure(`${character.toString()} cannot perform shoot`)
);

const smash = flow(
  checkWarrior,
  Either.map((warrior: Warrior) => warrior.smash())
);

const burn = flow(
  checkWizard,
  Either.map((wizard: Wizard) => wizard.burn())
);

const shoot = flow(
  checkArcher,
  Either.map((archer: Archer) => archer.shoot())
);

export const checkAttackerAndSmash = (attacker: Option.Option<Character>) =>
  pipe(attacker, checkSelected, Either.flatMap(smash));

export const checkAttackerAndBurn = (attacker: Option.Option<Character>) =>
  pipe(attacker, checkSelected, Either.flatMap(burn));

export const checkAttackerAndShoot = (attacker: Option.Option<Character>) =>
  pipe(attacker, checkSelected, Either.flatMap(shoot));

///////////////////////////////////////////////////////////////////////////////
//                                  OPTION                                   //
///////////////////////////////////////////////////////////////////////////////

// The next three functions take a `Character` and optionally return the
// expected damage type if the attacker matches the expected character type.
//
// HINT: These functions represent the public API. But it is heavily
// recommended to break those down into smaller private functions that can be
// reused instead of doing one big `pipe` for each.
//
// HINT: `Option` has a special constructor `getRight` that discards the
// error type.
//
// BONUS POINTS: If you properly defined small private helpers in the previous
// section, they should be easily reused for those use-cases.

export const smashOption = flow(smash, Option.getRight);

export const burnOption = flow(burn, Option.getRight);

export const shootOption = flow(shoot, Option.getRight);

///////////////////////////////////////////////////////////////////////////////
//                                   ARRAY                                   //
///////////////////////////////////////////////////////////////////////////////

// We now want to aggregate all the attacks of a selection of arbitrarily many
// attackers and know how many are Physical, Magical or Ranged.
//
// HINT: You should be able to reuse the attackOption variants defined earlier
//
// HINT: `Array` from `Effect` has a neat `filterMap` function that
// perform mapping and filtering at the same time by applying a function
// of type `A => Option<B>` over the collection.

export interface TotalDamage {
  [Damage.Physical]: number;
  [Damage.Magical]: number;
  [Damage.Ranged]: number;
}

export const attack = (army: Array<Character>) => ({
  [Damage.Physical]: pipe(army, Array.filterMap(smashOption), Array.length),
  [Damage.Magical]: pipe(army, Array.filterMap(burnOption), Array.length),
  [Damage.Ranged]: pipe(army, Array.filterMap(shootOption), Array.length),
});
