export interface CartaEnv {
  port: number;
  databaseUrl: string;
}

export function readEnv(): CartaEnv {
  return {
    port: Number(process.env.PORT ?? 4000),
    databaseUrl:
      process.env.DATABASE_URL ?? "postgres://carta:carta@localhost:5432/carta",
  };
}
