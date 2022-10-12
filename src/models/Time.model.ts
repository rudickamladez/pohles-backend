import { Model, ObjectID } from "@tsed/mongoose";
import { Property, Required } from "@tsed/schema";

@Model({
  name: "times"
})
export class TimeModel {
  @ObjectID("id")
  _id: string;

  @Property()
  @Required()
  name: string;

  @Property()
  @Required()
  maxCountOfTickets: number;

  toString() {
    return this.name;
  }
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

  public constructor(id: string, name: string, maxCountOfTickets: number, occupiedPositions: number = 0) {
    this._id = id;
    this.name = name;
    this.maxCountOfTickets = maxCountOfTickets;
    this.occupiedPositions = occupiedPositions;
    this.freePositions = this.maxCountOfTickets - this.occupiedPositions;
  }

  public occupyThePositions(count: number = 1) {
    this.occupiedPositions += count;
    this.freePositions -= count;
    return null;
  }
}

export class TimeSumModel {
  @Property()
  paid: number;

  @Property()
  free: number;

  @Property()
  reserved: number;

  @Property()
  total: number
}