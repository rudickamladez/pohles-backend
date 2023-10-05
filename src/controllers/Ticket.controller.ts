import { BodyParams, Controller, Delete, Get, Inject, Patch, PathParams, Post } from "@tsed/common";
import { ContentType, Description, Header, Returns, Summary } from "@tsed/schema";
import { KeycloakAuth } from "src/decorators/KeycloakAuthOptions.decorator";
import { TicketEasySchema, TicketModel, TicketUpdateModel } from "src/models/Ticket.model";
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
  async createTicketEasily(@BodyParams() ticket: TicketEasySchema) {
    return await this.ticketService.saveEasy(ticket);
  }

  @ContentType("appliaction/json")
  @Get("/")
  @Summary("Get all tickets")
  @Description("Returns list of all tickets from database.")
  @Returns(200, Array).Of(TicketModel)
  @KeycloakAuth({ anyRole: ["realm:admin", "realm:ticket-editor"] })
  async getAll() {
    return await this.ticketService.getAll();
  }

  @ContentType("application/csv")
  @Get("/export/csv")
  @Header("content-disposition", "attachment; filename=tickets.csv")
  @Summary("Get all tickets in CSV file.")
  @Description("Returns file with list of all tickets from database.")
  @Returns(200, String)
  @KeycloakAuth({ anyRole: ["realm:admin", "realm:ticket-editor"] })
  async getCSV() {
    return await this.ticketService.getCSV();
  }

  @ContentType("application/json")
  @Post("/mail/:id")
  @Summary("Send e-mail with ticket to user again.")
  @Description("Returns response from nodemailer.")
  @Returns(200, Object)
  @KeycloakAuth({ anyRole: ["realm:admin", "realm:ticket-editor"] })
  async mail(
    @PathParams("id") id: string
  ) {
    return await this.ticketService.sendNewReservationMailAgain(id);
  }

  @ContentType("application/json")
  @Post("/pay/:id")
  @Summary("Pay the ticket")
  @Description("Returns paid ticket from database.")
  @Returns(200, TicketModel)
  @KeycloakAuth({ anyRole: ["realm:admin", "realm:ticket-editor"] })
  async payTicket(
    @PathParams("id") id: string
  ) {
    return await this.ticketService.pay(id);
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

  @ContentType("application/json")
  @Post("/cancel")
  @Summary("Cancel ticket")
  @Description("Returns updated ticket from databse or null.")
  @Returns(200, TicketModel)
  @Returns(400).Description("Did not send id")
  @Returns(400).Description("Did not send email")
  @Returns(404).Description("Ticket not found in database")
  @Returns(400).Description("User send bad email.")
  @Returns(409).Description("Ticket already cancelled.")
  async cancelById(
    @BodyParams("id") id: string,
    @BodyParams("email") email: string
  ) {
    return await this.ticketService.cancel(id, email);
  }
}
