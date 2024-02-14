// `fp-ts` version of a program

import { reader, readerTaskEither, taskEither } from "fp-ts";
import type { TaskEither } from "fp-ts/lib/TaskEither";
import { pipe } from "fp-ts/lib/function";

type UserId = string;
interface User {
  id: UserId;
  name: string;
  bestFriendId: UserId;
}

interface UserRepository {
  getById: (id: string) => TaskEither<"UnexpectedError", User>;
}

const getUserById = (id: string) =>
  pipe(
    readerTaskEither.ask<{ userRepository: UserRepository }>(),
    readerTaskEither.flatMapTaskEither(({ userRepository }) =>
      userRepository.getById(id)
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

export const getCapitalizedUserName = ({ userId }: { userId: string }) =>
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
      getCapitalizedUserName({ userId: userIdOne })
    ),
    readerTaskEither.apS(
      "userTwoCapitalizedName",
      getCapitalizedUserName({ userId: userIdTwo })
    ),
    readerTaskEither.map(
      ({ userOneCapitalizedName, userTwoCapitalizedName }) =>
        userOneCapitalizedName + userTwoCapitalizedName
    )
  );

export const getConcatenationOfTheBestFriendNameAndUserName = ({
  userIdOne,
}: {
  userIdOne: string;
}) =>
  pipe(
    readerTaskEither.Do,
    readerTaskEither.apS("userOne", getUserById(userIdOne)),
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
    getById(id) {
      return taskEither.right({ id, name: "name", bestFriendId: "userId" });
    },
  };

  const result = await getConcatenationOfUserNameAndCurrentYear("1")({
    timeService,
    userRepository,
  })();
}
