// `Effect` version of a program

import { pipe, Effect, Context } from "effect";

type UserId = string;
interface User {
  id: UserId;
  name: string;
  bestFriendId: UserId;
}

interface UserRepository {
  getById: (id: string) => Effect.Effect<User, "UnexpectedError">;
}

const UserRepository = Context.GenericTag<UserRepository>("UserRepository");

const getUserById = (
  id: string
): Effect.Effect<User, "UnexpectedError", UserRepository> =>
  Effect.flatMap(UserRepository, (repository) => repository.getById(id));

interface TimeService {
  thisYear: () => number;
}

const TimeService = Context.GenericTag<TimeService>("TimeService");

const getThisYear = (): Effect.Effect<number, never, TimeService> =>
  Effect.map(TimeService, (timeService) => timeService.thisYear());

const capitalize = (str: string) =>
  `${str.charAt(0).toUpperCase()}${str.slice(1)}`;

export const getCapitalizedUserName = ({ userId }: { userId: string }) =>
  pipe(
    getUserById(userId),
    Effect.map((user) => capitalize(user.name))
  );

export const getConcatenationOfTheTwoUserNames = ({
  userIdOne,
  userIdTwo,
}: {
  userIdOne: string;
  userIdTwo: string;
}) =>
  pipe(
    Effect.all({
      userOneCapitalizedName: getCapitalizedUserName({ userId: userIdOne }),
      userTwoCapitalizedName: getCapitalizedUserName({ userId: userIdTwo }),
    }),
    Effect.map(
      ({ userOneCapitalizedName, userTwoCapitalizedName }) =>
        userOneCapitalizedName + userTwoCapitalizedName
    )
  );

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

export const getConcatenationOfUserNameAndCurrentYear = (userId: UserId) =>
  pipe(
    Effect.all({
      user: getUserById(userId),
      year: getThisYear(),
    }),
    Effect.map(({ user, year }) => `${user.name}${year}`)
  );

// Running a program //

async function main() {
  const timeService: TimeService = {
    thisYear: () => 2021,
  };

  const userRepository: UserRepository = {
    getById(id) {
      return Effect.succeed({ id, name: "name", bestFriendId: "userId" });
    },
  };

  const result = await pipe(
    getConcatenationOfUserNameAndCurrentYear("1"),
    Effect.provideService(UserRepository, userRepository),
    Effect.provideService(TimeService, timeService),
    Effect.runPromise
  );
}
