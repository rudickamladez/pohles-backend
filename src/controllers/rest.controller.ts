import { Inject, Constant, Controller, Get } from "@tsed/common";
import { ContentType, Description, Summary } from "@tsed/schema";
import { SwaggerSettings } from "@tsed/swagger";
import moment from "moment";
import { KeycloakAuth } from "src/decorators/KeycloakAuthOptions.decorator";

@Controller("/")
export class RestController {
  @Constant("swagger")
  swagger: SwaggerSettings[];

  @ContentType('application/json')
  @Get("/")
  @Summary("Root route of the API")
  @Description("Return a message and time.")
  @KeycloakAuth({ role: "realm:user" })
  get() {
    return {
      message: "hello world!",
      time: moment()
    };
  }

  @Get("/protected")
  @KeycloakAuth({ role: "realm:user" })
  protected() {
    return { "test": "ahoj" };
  }
}
