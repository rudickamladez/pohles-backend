import { Inject, Injectable } from "@tsed/di";
import { MongooseModel } from "@tsed/mongoose";
import { CustomerModel, CustomerUpdateModel } from "src/models/Customer.model";
import { WebSocketService } from "./web-socket.service";

@Injectable()
export class CustomerService {
    constructor(
        @Inject(CustomerModel) private model: MongooseModel<CustomerModel>,
        @Inject(WebSocketService) private wss: WebSocketService
    ) {

    }

    async save(obj: CustomerModel) {
        const doc = new this.model(obj);
        await doc.save();
        this.wss.broadcast("new-customer", doc);
        return doc;
    }

    async getAll() {
        return await this.model.find();
    }

    async findById(id: string) {
        return await this.model.findById(id);
    }

    async deleteById(id: string) {
        const doc = await this.model.findByIdAndDelete(id);
        this.wss.broadcast("delete-customer", doc);
        return doc;
    }

    async update(
        id: string,
        update: CustomerUpdateModel
    ) {
        let obj = await this.model
            .findById(id)
            .exec();

        if (obj) {
            if (update.names) {
                obj.names = update.names;
            }

            if (update.email) {
                obj.email = update.email;
            }

            obj.save();
            let res = await obj;
            this.wss.broadcast("update-customer", res);
            return res;
        }
        return null;
    }

}
