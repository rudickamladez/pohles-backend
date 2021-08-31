import { Property, Required } from "@tsed/schema";

export class CustomerNameSchema {
  @Property()
  @Required()
  first: string;

  @Property()
  @Required()
  last: string;
}

export class CustomerNameUpdateSchema {
  @Property()
  first: string;

  @Property()
  last: string;
}