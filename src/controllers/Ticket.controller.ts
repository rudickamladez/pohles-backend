import { BodyParams, Controller, Delete, Get, Inject, Patch, PathParams, Post } from "@tsed/common";
import { ContentType, Description, Returns, Summary } from "@tsed/schema";
import { KeycloakAuth } from "src/decorators/KeycloakAuthOptions.decorator";
import { TicketEasyModel, TicketModel, TicketUpdateModel } from "src/models/Ticket.model";
import { TicketService } from "src/services/Ticket.service";

@Controller("/ticket")
export class TicketController {
  @Inject()
  ticketService: TicketService

  @ContentType("application/json")
  @Post("/")
  @Summary("Create new ticket")
  @Description("Returns an new ticket from database.")
  @Returns(200, TicketModel)
  @KeycloakAuth({ anyRole: ["realm:admin", "realm:ticket-editor"] })
  async createTicket(@BodyParams() ticket: TicketModel) {
    return await this.ticketService.save(ticket);
  }

  @ContentType("application/json")
  @Post("/easy")
  @Summary("Create new ticket easily")
  @Description("Returns an new ticket from database.")
  @Returns(200, TicketModel)
  @KeycloakAuth({ anyRole: ["realm:admin", "realm:ticket-editor"] })
  async createTicketEasily(@BodyParams() ticket: TicketEasyModel) {
    return await this.ticketService.saveEasy(ticket);
  }

  @ContentType("appliaction/json")
  @Get("/")
  @Summary("Get all tickets")
  @Description("Returns list of all tickets from database.")
  @Returns(200, Array).Of(TicketModel)
  async getAll() {
    return await this.ticketService.getAll();
  }

  @ContentType("application/json")
  @Get("/:id")
  @Summary("Get one ticket by ID")
  @Description("Returns an ticket with given ID from database.")
  @Returns(200, TicketModel)
  async findById(@PathParams("id") id: string) {
    return await this.ticketService.findById(id);
  }

  @ContentType("application/json")
  @Delete("/:id")
  @Summary("Delete one ticket by ID")
  @Description("Returns deleted ticket from database.")
  @Returns(200, TicketModel)
  @KeycloakAuth({ anyRole: ["realm:admin", "realm:ticket-editor"] })
  async deleteById(@PathParams("id") id: string) {
    return await this.ticketService.deleteById(id);
  }

  @ContentType("application/json")
  @Patch("/:id")
  @Summary("Update one ticket by ID")
  @Description("Returns updated ticket from databse.")
  @Returns(200, TicketModel)
  @KeycloakAuth({ anyRole: ["realm:admin", "realm:ticket-editor"] })
  async patchById(
    @PathParams("id") id: string,
    @BodyParams() update: TicketUpdateModel
  ) {
    return await this.ticketService.update(id, update);
  }
}
