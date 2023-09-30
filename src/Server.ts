import { Configuration, Constant, Inject, OnInit } from "@tsed/di";
import { PlatformApplication } from "@tsed/common";
import "@tsed/platform-express"; // /!\ keep this import
import bodyParser from "body-parser";
import methodOverride from "method-override";
import cors from "cors";
import "@tsed/ajv";
import "@tsed/swagger";
import { config, rootDir } from "./config";
import "@tsed/socketio";
import session from "express-session";
import cookieParser from "cookie-parser";
import compression from "compression";
import { NodemailerConfig } from "./services/Nodemailer.config";

@Configuration({
  ...config,
  acceptMimes: [
    "application/json",
    "application/csv"
  ],
  httpPort: process.env.PORT || 8083,
  httpsPort: false, // CHANGE
  mount: {
    "/": [
      `${rootDir}/controllers/**/*.ts`,
      `${rootDir}/controllers/**/*.js`
    ],
  },
  componentsScan: [
    `${rootDir}/services/**/*.ts`,
    `${rootDir}/services/**/*.js`
  ],
  swagger: [
    {
      path: "/v3/docs",
      specVersion: "3.0.1"
    }
  ],
  views: {
    root: `${rootDir}/../views`,
    viewEngine: "ejs"
  },
  exclude: [
    "**/*.spec.ts"
  ],
  socketIO: {
    cors: {
      origin: "*"
    }
  },
  mongoose: [{
    id: 'default',
    //@ts-ignore
    url: process.env.MONGO_URL || "mongodb://pohlesuser:examplepass@mongo:27017/pohles",
    //@ts-ignore
    connectionOptions: process.env.MONGO_OPTIONS || '',
  }],
  nodemailer: {
    transport: JSON.parse(process.env.NODEMAILER_TRANSPORT || "{}"),
    defaults: process.env.NODEMAILER_DEFAULTS,
    sender: process.env.NODEMAILER_SENDER,
  }
})
export class Server {
  @Inject()
  app: PlatformApplication;
  
  @Configuration()
  settings: Configuration;
  
  @Constant("nodemailer")
  nodeMailerConfig: NodemailerConfig;
  
  $beforeRoutesInit(): void {
    this.app
    .use(cors())
    .use(cookieParser())
    .use(compression({}))
    .use(methodOverride())
    .use(bodyParser.json())
    .use(bodyParser.urlencoded({
      extended: true
    }))
    }
  }
