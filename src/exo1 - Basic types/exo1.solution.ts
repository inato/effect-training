// `Effect` training Exercise 1
// Basic types:
// - Option
// - Either
// - Effect

import { Effect, Either, Option } from "effect";
import { pipe } from "effect";

import { sleep } from "../utils";

export const divide = (a: number, b: number): number => {
  return a / b;
};

///////////////////////////////////////////////////////////////////////////////
//                                  OPTION                                   //
///////////////////////////////////////////////////////////////////////////////

// An Option represents a value which might be there, or not.
// If it's there then it is Option.Some(value) and if not it is Option.none
// You can think of an option as something that can be null or undefined.
//
// Write the safe version (meaning it handles the case where b is 0) of `divide` with signature:
// safeDivide : (a: number, b: number) => Option<number>
//
// HINT: Option has two basic constructors:
// - `Option.some(value)`
// - `Option.none`

export const safeDivide = (a: number, b: number) => {
  if (b === 0) {
    return Option.none();
  }

  return Option.some(a / b);
};

// You probably wrote `safeDivide` using `if` statements and it's perfectly valid!
// There are ways to not use `if` statements.
// Keep in mind that extracting small functions out of pipes and using `if` statements in them
// is perfectly fine and is sometimes more readable than not using `if`.
//
// BONUS: Try now to re-write `safeDivide` without any `if`
//
// HINT: Have a look at `liftPredicate` constructor of Option

export const safeDivideBonus = (a: number, b: number): Option.Option<number> =>
  pipe(
    b,
    Option.liftPredicate((n) => n !== 0),
    Option.map((b) => a / b)
  );

///////////////////////////////////////////////////////////////////////////////
//                                  EITHER                                   //
///////////////////////////////////////////////////////////////////////////////

// An Either represents a computation that can have two results, called branches or tracks (left and right).
// Most of the time, we use it to represent a computation that can fail. So the left branch represents the failure, and the right branch the success.
// So when we manipulate an Either, if we enter the left branch, we most of the time won't carry out further manipulations,
// and just return the Error context that is encapsulated in the left branch (it is still accessible tho, through different helpers).
// If we are in the right branch, we'll keep on manipulating the value and passing it through the right branch.
// An Either is typed Either<A, E> where A is the type of the right track (the success) and E is the type of the left track (the failure).
//
// Write the safe version of `divide` with signature:
// safeDivideWithError : (a: number, b: number) => Either<number, DivisionByZeroError>
//
// BONUS POINT: Implement `safeDivideWithError` in terms of `safeDivide`.
//
// HINT : Either has two basic constructors:
// - `Either.left(leftValue)`
// - `Either.right(rightValue)`
// as well as "smarter" constructors like `Either.fromOption` which you can use:
// like this: `Either.fromOption(() => leftValue)(option)`
// or like this: `Either.fromOption(option, () => leftValue)`
// because Effect supports dual APIs.

// Here is an simple error type to help you:
export type DivisionByZeroError = "Error: Division by zero";
export const DivisionByZero = "Error: Division by zero" as const;

export const safeDivideWithError = (
  a: number,
  b: number
): Either.Either<number, DivisionByZeroError> =>
  pipe(
    safeDivide(a, b),
    Either.fromOption(() => DivisionByZero)
  );

///////////////////////////////////////////////////////////////////////////////
//                                  Effect                                   //
///////////////////////////////////////////////////////////////////////////////

// Now let's say we have a (pretend) API call that will perform the division for us
// (throwing an error when the denominator is 0)
export const asyncDivide = async (a: number, b: number) => {
  await sleep(1000);

  if (b === 0) {
    throw new Error("BOOM!");
  }

  return a / b;
};

// Write the safe version of `asyncDivide` with signature:
// asyncSafeDivideWithError : (a: number, b: number) => Effect.Effect<number, DivisionByZeroError>

// HINT: Effect has a special constructor to transform a Promise<T> into
// an Effect<T, Error, never> (Success, Error, Requirements):
// - `Effect.tryPromise({try: () => promise, catch: reason => error})`

// Note: In Effect, Effect.Effect<A, E, R> where:
// - A is the success value type
// - E is the error type
// - R is the requirements type
// (When no requirements are needed, use 'never' or omit the last argument)

export const asyncSafeDivideWithError = (
  a: number,
  b: number
): Effect.Effect<number, DivisionByZeroError> =>
  Effect.tryPromise({
    try: () => asyncDivide(a, b),
    catch: () => DivisionByZero,
  });
