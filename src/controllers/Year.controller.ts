import { BodyParams, Controller, Delete, Get, Inject, Patch, PathParams, Post } from "@tsed/common";
import { ContentType, Description, Returns, Summary } from "@tsed/schema";
import { KeycloakAuth } from "src/decorators/KeycloakAuthOptions.decorator";
import { TimeModel } from "src/models/Time.model";
import { YearModel, YearUpdateModel } from "src/models/Year.model";
import { YearService } from "src/services/Year.service";

@Controller("/year")
export class YearController {
  @Inject()
  yearService: YearService;

  @ContentType("application/json")
  @Post("/")
  @Summary("Create new year")
  @Description("Returns an inserted year from databse.")
  @Returns(200, YearModel)
  @KeycloakAuth({ anyRole: ["realm:admin", "realm:year-editor"] })
  async createYear(@BodyParams() year: YearModel) {
    return await this.yearService.save(year);
  }

  @ContentType("application/json")
  @Get("/")
  @Summary("Get all years")
  @Description("Returns list of all years.")
  @Returns(200, Array).Of(YearModel)
  async getAll() {
    return await this.yearService.getAll();
  }

  @ContentType("application/json")
  @Get("/active")
  @Summary("Get active year")
  @Description("Returns a object of active year.")
  @Returns(200, YearModel)
  async getActiveYear() {
    return this.yearService.active();
  }

  @ContentType("application/json")
  @Get("/:id")
  @Summary("Get one year by ID")
  @Description("Returns an year with given ID from database.")
  @Returns(200, YearModel)
  @Returns(404).Description("Not found")
  async findById(@PathParams("id") id: string) {
    return await this.yearService.findById(id);
  }

  @ContentType("application/json")
  @Delete("/:id")
  @Summary("Delete year by ID")
  @Description("Returns deleted year from database.")
  @Returns(200, YearModel)
  @Returns(404).Description("Not found")
  @KeycloakAuth({ anyRole: ["realm:admin", "realm:year-editor"] })
  async deleteById(@PathParams("id") id: string) {
    return await this.yearService.deleteById(id);
  }

  @ContentType("application/json")
  @Patch("/:id")
  @Summary("Update one year by ID")
  @Description("Returns updated year from database.")
  @Returns(200, YearModel)
  @Returns(404).Description("Not found")
  @KeycloakAuth({ anyRole: ["realm:admin", "realm:year-editor"] })
  async patchById(
    @PathParams("id") id: string,
    @BodyParams() update: YearUpdateModel
  ) {
    return await this.yearService.update(id, update);
  }

}
