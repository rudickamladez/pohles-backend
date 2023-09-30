import { BodyParams, Controller, Delete, Get, Inject, Patch, PathParams, Post } from "@tsed/common";
import { ContentType, Description, Header, Returns, Summary } from "@tsed/schema";
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
  async getAll() {
    return await this.ticketService.getAll();
  }

  @ContentType("application/csv")
  @Get("/export/csv")
  @Header("content-disposition", "attachment; filename=tickets.csv")
  @Summary("Get all tickets in CSV file.")
  @Description("Returns file with list of all tickets from database.")
  @Returns(200, String)
  async getCSV() {
    return await this.ticketService.getCSV();
  }

  @ContentType("application/json")
  @Post("/mail/:id")
  @Summary("Send e-mail with ticket to user again.")
  @Description("Returns response from nodemailer.")
  @Returns(200, Object)
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
  async deleteById(@PathParams("id") id: string) {
    return await this.ticketService.deleteById(id);
  }

  @ContentType("application/json")
  @Patch("/:id")
  @Summary("Update one ticket by ID")
  @Description("Returns updated ticket from databse.")
  @Returns(200, TicketModel)
  async patchById(
    @PathParams("id") id: string,
    @BodyParams() update: TicketUpdateModel
  ) {
    return await this.ticketService.update(id, update);
  }
}
