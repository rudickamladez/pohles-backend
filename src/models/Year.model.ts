import { Model, ObjectID, Ref } from "@tsed/mongoose";
import { Property, ReadOnly, Required } from "@tsed/schema";
import { TimeModel } from "./Time.model";

@Model({
  name: "years"
})
export class YearModel {
  @ReadOnly()
  @ObjectID("id")
  _id: string;

  @Property()
  @Required()
  name: string;

  @Property()
  @Required()
  @Ref(TimeModel)
  times: TimeModel[];
}

export class YearUpdateModel {
  @Property()
  name: string;

  @Property()
  @Ref(TimeModel)
  times: TimeModel[];
}
