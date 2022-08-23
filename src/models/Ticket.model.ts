import { Model, ObjectID, Ref } from "@tsed/mongoose";
import { Default, Enum, Format, Property, Required } from "@tsed/schema";
import { CustomerModel } from "./Customer.model";
import { TimeModel } from "./Time.model";
import { YearModel } from "./Year.model";

@Model({
  name: "tickets"
})
export class TicketModel {
  @ObjectID("id")
  _id: string;

  @Property()
  @Enum("paid", "unpaid", "cancelled", "confirmed")
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

  // Team from YearModel.times
  @Property()
  @Required()
  @Ref(TimeModel)
  time: Ref<TimeModel>;

  @Property()
  @Format("date-time")
  @Default(Date.now)
  date: Date;
}

export class TicketUpdateModel {
  @Property()
  @Enum("paid", "unpaid", "cancelled")
  status: string;

  @Property()
  @Ref(CustomerModel)
  owner: Ref<CustomerModel>;

  @Property()
  @Ref(YearModel)
  year: Ref<YearModel>;

  // Team from YearModel.times
  @Property()
  @Ref(TimeModel)
  time: Ref<TimeModel>;
}

export class TicketEasyModel {
  @Property()
  buyer: CustomerModel;

  // Team from YearModel.times
  @Property()
  @Ref(TimeModel)
  time: Ref<TimeModel>;
}
