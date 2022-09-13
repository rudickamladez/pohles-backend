import { Model, ObjectID, Unique } from "@tsed/mongoose";
import { Property, Required } from "@tsed/schema";
import { CustomerNameSchema, CustomerNameUpdateSchema } from "./CustomerName.schema";

@Model({
  name: "customers"
})
export class CustomerModel {
  @ObjectID("id")
  _id: string;

  @Property()
  names: CustomerNameSchema[];

  @Property()
  @Required()
  @Unique()
  email: string;
}

export class CustomerUpdateModel {
  names?: CustomerNameUpdateSchema[];
  email?: string;
}

export class CustomerEasyTicketModel {
  
  @Property()
  name: CustomerNameSchema;

  @Property()
  @Required()
  @Unique()
  email: string;
}