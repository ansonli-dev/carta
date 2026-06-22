import { Inject, Module, type OnModuleDestroy } from "@nestjs/common";
import type { Kysely } from "kysely";
import { readEnv } from "../config/env.js";
import { createKysely, type CartaDatabase } from "./database.js";

export const DATABASE = Symbol("DATABASE");

@Module({
  providers: [
    {
      provide: DATABASE,
      useFactory: () => createKysely(readEnv().databaseUrl),
    },
  ],
  exports: [DATABASE],
})
export class DatabaseModule implements OnModuleDestroy {
  constructor(@Inject(DATABASE) private readonly db: Kysely<CartaDatabase>) {}

  async onModuleDestroy() {
    await this.db.destroy();
  }
}
