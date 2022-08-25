import { Inject, Constant, Controller, Get } from "@tsed/common";
import { ContentType, Description, Returns, Summary } from "@tsed/schema";
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
  @Returns(200, Object)
  get() {
    return {
      message: "hello world!",
      time: moment()
    };
  }

  @Get("/protected")
  @Summary("Protected route of the API")
  @Description("Return a greeting when user is authenticated.")
  @Returns(200, Object)
  @KeycloakAuth({ role: "realm:user" })
  protected() {
    return { "test": "ahoj" };
  }
}
