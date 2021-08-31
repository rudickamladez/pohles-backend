import { BodyParams, Controller, Delete, Get, Inject, Patch, PathParams, Post } from "@tsed/common";
import { ContentType, Description, Returns, Summary } from "@tsed/schema";
import { CustomerModel, CustomerUpdateModel } from "src/models/Customer.model";
import { CustomerService } from "src/services/Customer.service";

@Controller("/customer")
export class CustomerController {
  @Inject()
  customerService: CustomerService;

  @ContentType("application/json")
  @Post("/")
  @Summary("Create new customer")
  @Description("Returns an insterted customer from database.")
  @Returns(200, CustomerModel)
  // @KeycloakAuth({ anyRole: ["realm:admin", "realm:customer-editor"] })
  async createCustomer(@BodyParams() customer: CustomerModel) {
    return await this.customerService.save(customer);
  }

  @ContentType("application/json")
  @Get("/")
  @Summary("Get all customers")
  @Description("Returns list of all customers.")
  @Returns(200, Array).Of(CustomerModel)
  async getAll() {
    return await this.customerService.getAll();
  }

  @ContentType("application/json")
  @Get("/:id")
  @Summary("Get one customer by ID")
  @Description("Returns an customer with given ID from database.")
  @Returns(200, CustomerModel)
  @Returns(404).Description("Not found")
  async findById(@PathParams("id") id: string) {
    return await this.customerService.findById(id);
  }

  @ContentType("application/json")
  @Delete("/:id")
  @Summary("Delete customer by ID")
  @Description("Returns deleted customer from database.")
  @Returns(200, CustomerModel)
  @Returns(404).Description("Not found")
  // @KeycloakAuth({ anyRole: ["realm:admin", "realm:customer-editor"] })
  async deleteById(@PathParams("id") id: string) {
    return await this.customerService.deleteById(id);
  }

  @ContentType("application/json")
  @Patch("/:id")
  @Summary("Update one customer by ID")
  @Description("Returns updated customer from database.")
  @Returns(200, CustomerModel)
  @Returns(404).Description("Not found")
  // @KeycloakAuth({ anyRole: ["realm:admin", "realm:customer-editor"] })
  async pathById(
    @PathParams("id") id: string,
    @BodyParams() update: CustomerUpdateModel
  ) {
    return await this.customerService.update(id, update);
  }
}
