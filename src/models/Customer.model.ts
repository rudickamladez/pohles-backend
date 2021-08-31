import { Model, ObjectID, Unique } from "@tsed/mongoose";
import { Property, ReadOnly, Required } from "@tsed/schema";
import { CustomerNameSchema, CustomerNameUpdateSchema } from "./CustomerName.schema";

@Model({
  name: "customers"
})
export class CustomerModel {
  @ReadOnly()
  @ObjectID("id")
  _id: string;

  @Property()
  name: CustomerNameSchema;

  @Property()
  @Required()
  @Unique()
  email: string;
}

export class CustomerUpdateModel {
  name?: CustomerNameUpdateSchema;
  email?: string;
}