import { Configuration, Inject } from "@tsed/di";
import { PlatformApplication } from "@tsed/common";
import "@tsed/platform-express"; // /!\ keep this import
import bodyParser from "body-parser";
import methodOverride from "method-override";
import cors from "cors";
import "@tsed/ajv";
import "@tsed/swagger";
import { config, rootDir } from "./config";
import { KeycloakService } from "./services/Keycloak.service";
import "@tsed/socketio";
import session from "express-session";
import cookieParser from "cookie-parser";
import compression from "compression";

@Configuration({
  ...config,
  acceptMimes: ["application/json"],
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
      specVersion: "3.0.1",
      spec: {
        components: {
          securitySchemes: {
            "oauth2": {
              type: "oauth2",
              flows: {
                authorizationCode: {
                  authorizationUrl: process.env.SWAGGER_KEYCLOAK_AUTH_URL || "https://auth.rudickamladez.cz/auth/realms/pohles/protocol/openid-connect/auth",
                  tokenUrl: process.env.SWAGGER_KEYCLOAK_TOKEN_URL || "https://auth.rudickamladez.cz/auth/realms/pohles/protocol/openid-connect/token",
                  refreshUrl: process.env.SWAGGER_KEYCLOAK_TOKEN_URL || "https://auth.rudickamladez.cz/auth/realms/pohles/protocol/openid-connect/token",
                  scopes: { openid: "openid", profile: "profile" }
                }
              }
            }
          }
        }
      }
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
    url: process.env.MONGO_URL || "mongodb://pohles:pohles@localhost:27017/pohles",
    //@ts-ignore
    connectionOptions: process.env.MONGO_OPTIONS || '',
  }],
  keycloak: {
    realm: process.env.KEYCLOAK_REALM || "pohles",
    bearerOnly: process.env.KEYCLOAK_BEARER_ONLY || true,
    authServerUrl: process.env.KEYCLOAK_URL || "https://auth.rudickamladez.cz/auth/",
    sslRequired: process.env.KEYCLOAK_SSL_REQUIRED || "external",
    resource: process.env.KEYCLOAK_CLIENT_ID || "backend",
    confidentialPort: process.env.KEYCLOAK_CONF_PORT || 0
  }
})
export class Server {
  @Inject()
  app: PlatformApplication;

  @Inject()
  keycloakService: KeycloakService;

  @Configuration()
  settings: Configuration;

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
      .use(session(
        {
          secret: "some-secret",
          resave: false,
          saveUninitialized: true,
          store: this.keycloakService.getMemoryStore()
        }
      ))
      .use(this.keycloakService.getKeycloakInstance().middleware());
  }
}


