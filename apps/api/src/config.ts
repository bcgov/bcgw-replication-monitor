import dotenv from "dotenv";

dotenv.config();

export const config = {
  port: Number(process.env.PORT) || 3000,
  useFakeRepo: process.env.USE_FAKE_REPO !== "false",

  /** Oracle connection — required when useFakeRepo is false */
  oracle: {
    user: process.env.ORACLE_USER || "",
    password: process.env.ORACLE_PASSWORD || "",
    connectString: process.env.ORACLE_CONNECT_STRING || "",
    view: process.env.ORACLE_VIEW || "ETL_JOB_RUNS_V",
    historyView: process.env.ORACLE_HISTORY_VIEW || "ETL_JOB_RUNS_HISTORY_V",
  },
};
