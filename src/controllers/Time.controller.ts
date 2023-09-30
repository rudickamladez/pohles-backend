import { BodyParams, Controller, Delete, Get, Inject, Patch, PathParams, Post } from "@tsed/common";
import { Any, ContentType, Description, Returns, Summary } from "@tsed/schema";
import { TimeForFrontendModel, TimeModel, TimeSumModel, TimeUpdateModel } from "src/models/Time.model";
import { TimeService } from "src/services/Time.service";

@Controller("/time")
export class TimeController {
  @Inject()
  timeService: TimeService;

  @ContentType("application/json")
  @Post("/")
  @Summary("Create new time")
  @Description("Returns an inserted time from databse.")
  @Returns(200, TimeModel)
  async createtime(@BodyParams() time: TimeModel) {
    return await this.timeService.save(time);
  }

  @ContentType("application/json")
  @Get("/")
  @Summary("Get all times")
  @Description("Returns list of times.")
  @Returns(200, Array).Of(TimeModel)
  async getAll() {
    return await this.timeService.getAll();
  }

  @ContentType("application/json")
  @Get("/active")
  @Summary("Get active times")
  @Description("Returns list of times from active year.")
  @Returns(200, Array).Of(TimeForFrontendModel)
  async getActiveTimes() {
    return await this.timeService.activeTimes();
  }

  @ContentType("application/json")
  @Get("/active/sum")
  @Summary("Get active times sum")
  @Description("Returns object with sum of paid, free, reserved and total positions in times.")
  @Returns(200, TimeSumModel)
  async getActiveTimesSum() {
    return await this.timeService.activeTimesSum();
  }

  @ContentType("application/json")
  @Get("/:id")
  @Summary("Get one time by ID")
  @Description("Returns an time with given ID from database.")
  @Returns(200, TimeModel)
  @Returns(404).Description("Not found")
  async findById(@PathParams("id") id: string) {
    return await this.timeService.findById(id);
  }

  @ContentType("application/json")
  @Delete("/:id")
  @Summary("Delete time by ID")
  @Description("Returns deleted time from database.")
  @Returns(200, TimeModel)
  @Returns(404).Description("Not found")
  async deleteById(@PathParams("id") id: string) {
    return await this.timeService.deleteById(id);
  }

  @ContentType("application/json")
  @Patch("/:id")
  @Summary("Update one time by ID")
  @Description("Returns updated time from database.")
  @Returns(200, TimeModel)
  @Returns(404).Description("Not found")
  async patchById(
    @PathParams("id") id: string,
    @BodyParams() update: TimeUpdateModel
  ) {
    return await this.timeService.update(id, update);
  }

  @ContentType("application/json")
  @Get("/available/:id")
  @Summary("Get count of tickets available")
  @Description("Returns time object with parameters.")
  @Returns(200, TimeForFrontendModel)
  async getAvailable(@PathParams("id") id: string) {
    return await this.timeService.availableTicketsById(id);
  }

}
