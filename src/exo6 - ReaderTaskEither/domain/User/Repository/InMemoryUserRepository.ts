import { taskEither } from "effect";
import { pipe } from "effect/lib/function";
import { TaskEither } from "effect/lib/TaskEither";
import { User } from "../User";
import { UserNotFoundError } from "./readerMethods";

export class InMemoryUserRepository {
  protected aggregates: Map<string, User>;

  constructor(aggregates: User[]) {
    this.aggregates = new Map(aggregates.map((user) => [user.id, user]));
  }

  getById(userId: string): TaskEither<UserNotFoundError, User> {
    return pipe(
      this.aggregates.get(userId),
      taskEither.fromNullable(new UserNotFoundError())
    );
  }
}
