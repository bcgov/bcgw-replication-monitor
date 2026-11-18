import oracledb from "oracledb";

export interface OracleConfig {
  user: string;
  password: string;
  connectString: string;
}

export async function createPool(config: OracleConfig): Promise<oracledb.Pool> {
  return oracledb.createPool({
    user: config.user,
    password: config.password,
    connectString: config.connectString,
    poolMin: 1,
    poolMax: 2,
  });
}
