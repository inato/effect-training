// `Effect` version of a program

import {
  pipe,
  Effect,
  Context,
  Option,
  ReadonlyArray,
  Layer,
  Runtime,
  Scope,
  Exit,
} from "effect";
import { cons } from "effect/List";

// Repository and services

type UserId = string;
interface User {
  id: UserId;
  name: string;
  bestFriendId: UserId;
}

interface UserRepository {
  findById: (
    id: string
  ) => Effect.Effect<Option.Option<User>, "UnexpectedError">;
}

const UserRepository = Context.GenericTag<UserRepository>("UserRepository");

const findUserById = (id: string) =>
  Effect.flatMap(UserRepository, (repository) => repository.findById(id));

const getUserById = (id: string) =>
  pipe(
    findUserById(id),
    Effect.flatten,
    Effect.catchTag("NoSuchElementException", () =>
      Effect.fail("User not found" as const)
    )
  );

interface TimeService {
  thisYear: () => number;
}

const TimeService = Context.GenericTag<TimeService>("TimeService");

const getThisYear = (): Effect.Effect<number, never, TimeService> =>
  Effect.map(TimeService, (timeService) => timeService.thisYear());

/**
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 */

// Mapping Effects

const capitalize = (str: string) =>
  `${str.charAt(0).toUpperCase()}${str.slice(1)}`;

export const getCapitalizedUserName = (userId: string) =>
  pipe(
    getUserById(userId),
    Effect.map((user) => capitalize(user.name))
  );

export const getCapitalizedUserName2 = (userId: string) =>
  pipe(
    getUserById(userId),
    Effect.andThen((user) => capitalize(user.name))
  );

export const getCapitalizedUserName3 = (userId: string) =>
  pipe(
    getUserById(userId),
    Effect.andThen((user) => Effect.succeed(capitalize(user.name)))
  );

export const getCapitalizedUserName4 = (userId: string) =>
  pipe(getUserById(userId), Effect.andThen("blob" as const));

/**
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 */

// Concurrency using Effect.all

export const getConcatenationOfTheTwoUserNames = ({
  userIdOne,
  userIdTwo,
}: {
  userIdOne: string;
  userIdTwo: string;
}) =>
  pipe(
    Effect.all({
      userOneCapitalizedName: getCapitalizedUserName(userIdOne),
      userTwoCapitalizedName: getCapitalizedUserName(userIdTwo),
    }),
    Effect.map(
      ({ userOneCapitalizedName, userTwoCapitalizedName }) =>
        userOneCapitalizedName + userTwoCapitalizedName
    )
  );

export const getConcatenationOfManyUserNames = (userIds: Array<string>) =>
  pipe(
    userIds.map(getCapitalizedUserName),
    (tasks) => Effect.all(tasks, { concurrency: "unbounded" }),
    Effect.map(ReadonlyArray.join(""))
  );

/**
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 */

// Sequential tasks

export const getConcatenationOfTheBestFriendNameAndUserName = (
  userId: UserId
) =>
  pipe(
    Effect.Do,
    Effect.bind("userOne", () => getUserById(userId)),
    Effect.bind("userTwo", ({ userOne }) => getUserById(userOne.bestFriendId)),
    Effect.map(
      ({ userOne, userTwo }) =>
        `${capitalize(userOne.name)}${capitalize(userTwo.name)}`
    )
  );

export const getConcatenationOfTheBestFriendNameAndUserNameGen = (
  userId: UserId
) =>
  Effect.gen(function* (_) {
    const userOne = yield* _(getUserById(userId));
    const userTwo = yield* _(getUserById(userOne.bestFriendId));
    return `${capitalize(userOne.name)}${capitalize(userTwo.name)}`;
  });

/**
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 */

// Running a program //

const timeService: TimeService = {
  thisYear: () => 2024,
};

const userRepository: UserRepository = {
  findById(id) {
    return Effect.succeed(
      Option.some({ id, name: "name", bestFriendId: "userId" })
    );
  },
};

export const getConcatenationOfUserNameAndCurrentYear = (userId: UserId) =>
  pipe(
    Effect.all({
      user: getUserById(userId),
      year: getThisYear(),
    }),
    Effect.map(({ user, year }) => `${user.name}${year}`),
    Effect.withConcurrency("unbounded")
  );

const runnable = pipe(
  getConcatenationOfUserNameAndCurrentYear("1"),
  Effect.provideService(UserRepository, userRepository),
  Effect.provideService(TimeService, timeService),
  Effect.either
);

Effect.runPromise(runnable).then(console.log).catch(console.error);

/**
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 */

// Running a program with a runtime

const appLayer = Layer.mergeAll(
  Layer.succeed(TimeService, timeService),
  Layer.succeed(UserRepository, userRepository)
);

const scope = Effect.runSync(Scope.make());

// Transform the configuration layer into a runtime
const runtime = await Effect.runPromise(
  Layer.toRuntime(appLayer).pipe(Scope.extend(scope))
);

const runPromise = Runtime.runPromise(runtime);

const program = pipe(
  getConcatenationOfUserNameAndCurrentYear("1"),
  Effect.either
);

runPromise(program).then(console.log).catch(console.error);

// Cleaning up any resources used by the configuration layer
Effect.runFork(Scope.close(scope, Exit.unit));
