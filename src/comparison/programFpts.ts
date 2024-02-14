// `fp-ts` version of a program

import {
  either,
  option,
  reader,
  readerTaskEither,
  readonlyArray,
  taskEither,
} from "fp-ts";
import type { Option } from "fp-ts/lib/Option";
import type { TaskEither } from "fp-ts/lib/TaskEither";
import { pipe } from "fp-ts/lib/function";

type UserId = string;
interface User {
  id: UserId;
  name: string;
  bestFriendId: UserId;
}

interface UserRepository {
  findById: (id: string) => TaskEither<"UnexpectedError", Option<User>>;
}

const findUserById = (id: string) =>
  pipe(
    readerTaskEither.ask<{ userRepository: UserRepository }>(),
    readerTaskEither.flatMapTaskEither(({ userRepository }) =>
      userRepository.findById(id)
    )
  );

const getUserById = (id: string) =>
  pipe(
    findUserById(id),
    readerTaskEither.flatMapEither(
      either.fromOption(() => "User not found" as const)
    )
  );

interface TimeService {
  thisYear: () => number;
}

const getThisYear = () =>
  pipe(
    reader.ask<{ timeService: TimeService }>(),
    reader.map(({ timeService }) => timeService.thisYear())
  );

const capitalize = (str: string) =>
  `${str.charAt(0).toUpperCase()}${str.slice(1)}`;

export const getCapitalizedUserName = (userId: string) =>
  pipe(
    getUserById(userId),
    readerTaskEither.map((user) => capitalize(user.name))
  );

export const getConcatenationOfTheTwoUserNames = ({
  userIdOne,
  userIdTwo,
}: {
  userIdOne: string;
  userIdTwo: string;
}) =>
  pipe(
    readerTaskEither.Do,
    readerTaskEither.apS(
      "userOneCapitalizedName",
      getCapitalizedUserName(userIdOne)
    ),
    readerTaskEither.apS(
      "userTwoCapitalizedName",
      getCapitalizedUserName(userIdTwo)
    ),
    readerTaskEither.map(
      ({ userOneCapitalizedName, userTwoCapitalizedName }) =>
        userOneCapitalizedName + userTwoCapitalizedName
    )
  );

export const getConcatenationOfManyUserNames = (userIds: Array<string>) =>
  pipe(
    userIds,
    readerTaskEither.traverseArray(getCapitalizedUserName),
    readerTaskEither.map(readonlyArray.reduce("", (acc, name) => acc + name))
  );

export const getConcatenationOfTheBestFriendNameAndUserName = ({
  userIdOne,
}: {
  userIdOne: string;
}) =>
  pipe(
    readerTaskEither.Do,
    readerTaskEither.bind("userOne", () => getUserById(userIdOne)),
    readerTaskEither.bind("userTwo", ({ userOne }) =>
      getUserById(userOne.bestFriendId)
    ),
    readerTaskEither.map(
      ({ userOne, userTwo }) =>
        `${capitalize(userOne.name)}${capitalize(userTwo.name)}`
    )
  );

export const getConcatenationOfUserNameAndCurrentYear = (userId: UserId) =>
  pipe(
    readerTaskEither.Do,
    readerTaskEither.apS("user", getUserById(userId)),
    readerTaskEither.apSW("year", readerTaskEither.fromReader(getThisYear())),
    readerTaskEither.map(({ user, year }) => `${user.name}${year}`)
  );

// Running a program //

async function main() {
  const timeService: TimeService = {
    thisYear: () => 2021,
  };

  const userRepository: UserRepository = {
    findById(id) {
      return taskEither.right(
        option.some({ id, name: "name", bestFriendId: "userId" })
      );
    },
  };

  const result = await getConcatenationOfUserNameAndCurrentYear("1")({
    timeService,
    userRepository,
  })();
}
