import { BodyParams, Controller, Delete, Get, Inject, Patch, PathParams, Post, QueryParams } from "@tsed/common";
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
  @Summary("Get tickets matching the filter")
  @Description("Returns list of tickets matching the filter from database.")
  @Returns(200, Array).Of(TicketModel)
  @KeycloakAuth({ anyRole: ["realm:admin", "realm:ticket-editor"] })
  async getFiltred(
    @QueryParams("id") id?: string,
    @QueryParams("status") status?: string,
    @QueryParams("first_name") firstName?: string,
    @QueryParams("last_name") lastName?: string,
    @QueryParams("email") email?: string,
    @QueryParams("year_id") year?: string,
    @QueryParams("time_id") time?: string,
    @QueryParams("date") date?: Date
  ) {
    let filter: TicketUpdateModel = {};
    if (id) {
      filter._id = id;
    }

    if (status) {
      filter.status = status;
    }

    if (firstName) {
      filter.name = {
        first: firstName
      };
    }

    if (lastName) {
      if (!filter.name) {
        filter.name = {};
      }
      filter.name.last = lastName;
    }

    if (email) {
      filter.email = email;
    }

    if (year) {
      filter.year = year;
    }

    if (time) {
      filter.time = time;
    }

    if (date) {
      filter.date = date;
    }
    return await this.ticketService.getFiltered(filter);
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
}
