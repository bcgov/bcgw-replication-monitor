import oracledb from "oracledb";
import { config } from "../config";

/**
 * Creates an Oracle connection pool.
 *
 * Pool is shared across requests for efficient connection reuse.
 * Must be called once at startup.
 */
export async function createPool(): Promise<oracledb.Pool> {
  return oracledb.createPool({
    user: config.oracle.user,
    password: config.oracle.password,
    connectString: config.oracle.connectString,
    poolMin: 1,
    poolMax: 5,
  });
}
