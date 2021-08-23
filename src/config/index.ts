import {join} from "path";
import {loggerConfig} from "./logger";
import mongooseConfig from "./mongoose";

const {version} = require("../../package.json");
export const rootDir = join(__dirname, "..");

export const config: Partial<TsED.Configuration> = {
  version,
  rootDir,
  logger: loggerConfig,
  mongoose: mongooseConfig,
  // additional shared configuration
};
