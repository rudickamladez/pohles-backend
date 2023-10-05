import { Model, ObjectID, Ref } from "@tsed/mongoose";
import { Default, Enum, Format, Property, Required } from "@tsed/schema";
import { TimeModel } from "./Time.model";
import { YearModel } from "./Year.model";

class TicketNameSchema {
  @Property()
  @Required()
  first: string;

  @Property()
  @Required()
  last: string;
}

class TicketNameUpdateSchema {
  @Property()
  first?: string;

  @Property()
  last?: string;
}

class TicketStatusChangeSchema {
  @Property()
  @Format("date-time")
  @Default(Date.now)
  date: Date;

  @Property()
  @Enum("paid", "unpaid", "cancelled")
  @Required()
  status: string;
}

@Model({
  name: "tickets"
})
export class TicketModel {
  @ObjectID("id")
  _id: string;

  @Property()
  @Enum("paid", "unpaid", "cancelled")
  @Default("unpaid")
  status: string;

  @Property()
  statusChanges: TicketStatusChangeSchema[];

  @Property()
  @Required()
  name: TicketNameSchema;

  @Property()
  @Required()
  email: string;

  @Property()
  @Required()
  @Ref(YearModel)
  year: Ref<YearModel>;

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
  @ObjectID("id")
  _id?: string;

  @Property()
  @Enum("paid", "unpaid", "cancelled")
  status?: string;

  @Property()
  name?: TicketNameUpdateSchema;

  @Property()
  email?: string;

  @Property()
  @Ref(YearModel)
  year?: Ref<YearModel>;

  @Property()
  @Ref(TimeModel)
  time?: Ref<TimeModel>;

  @Property()
  @Format("date-time")
  date?: Date;
}

export class TicketEasySchema {
  @Property()
  @Required()
  name: TicketNameSchema;

  @Property()
  @Required()
  email: string;

  @Property()
  @Required()
  @Ref(TimeModel)
  time: Ref<TimeModel>;
}