import { Model, ObjectID } from "@tsed/mongoose";
import { Property, ReadOnly, Required } from "@tsed/schema";

@Model({
  name: "times"
})
export class TimeModel {
  @ReadOnly()
  @ObjectID("id")
  _id: string;

  @Property()
  @Required()
  name: string;

  @Property()
  @Required()
  maxCountOfTickets: number;
}

export class TimeUpdateModel {
  @Property()
  name: string;

  @Property()
  maxCountOfTickets: number;
}

export class TimeForFrontendModel {
  @Property()
  _id: string;

  @Property()
  id: string;

  @Property()
  name: string;

  @Property()
  maxCountOfTickets: number;

  @Property()
  occupiedPositions: number;

  @Property()
  freePositions: number;
}