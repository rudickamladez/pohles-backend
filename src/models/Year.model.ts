import { Model, ObjectID, Ref } from "@tsed/mongoose";
import { Default, Enum, Property, Required } from "@tsed/schema";
import { TimeModel } from "./Time.model";

@Model({
  name: "years"
})
export class YearModel {
  @ObjectID("id")
  _id: string;

  @Property()
  @Required()
  name: string;

  @Property()
  @Enum("archived", "active", "prepared")
  @Default("prepared")
  status: string;

  @Property()
  @Required()
  @Ref(TimeModel)
  times: TimeModel[];

  @Property()
  @Required()
  endOfReservations: Date;

  toString() {
    return this.name;
  }
}

export class YearUpdateModel {
  @Property()
  name: string;

  @Property()
  @Enum("archived", "active", "prepared")
  status: string;

  @Property()
  @Ref(TimeModel)
  times: TimeModel[];

  @Property()
  endOfReservations: Date;
}
