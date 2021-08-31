import { Model, ObjectID, Ref } from "@tsed/mongoose";
import { Default, Enum, Format, Property, ReadOnly, Required } from "@tsed/schema";
import { CustomerModel } from "./Customer.model";
import { TimeModel } from "./Time.model";
import { YearModel } from "./Year.model";

@Model({
  name: "tickets"
})
export class TicketModel {
  @ReadOnly()
  @ObjectID("id")
  _id: string;

  @Property()
  @Required()
  @Enum(["paid", "unpaid", "cancelled"])
  @Default("unpaid")
  status: string;

  @Property()
  @Required()
  @Ref(CustomerModel)
  owner: Ref<CustomerModel>;

  @Property()
  @Required()
  @Ref(YearModel)
  year: Ref<YearModel>;

  // neco z year.times - YearTimeModel
  @Property()
  @Required()
  @Ref(TimeModel)
  time: Ref<TimeModel>;

  @Property()
  @Format("date-time")
  @Default(Date.now)
  date: Date;
}
