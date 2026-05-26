import dotenv from "dotenv";

dotenv.config();

export const config = {
  port: Number(process.env.PORT) || 3000,

  /** When true, use in-memory fake data instead of Oracle. */
  useFakeRepo: process.env.USE_FAKE_REPO !== "false",
};
