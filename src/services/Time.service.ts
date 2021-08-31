import { Inject, Injectable } from "@tsed/di";
import { MongooseModel } from "@tsed/mongoose";
import { TimeModel, TimeUpdateModel } from "src/models/Time.model";
import { WebSocketService } from "./web-socket.service";

@Injectable()
export class TimeService {
    constructor(
        @Inject(TimeModel) private model: MongooseModel<TimeModel>,
        @Inject(WebSocketService) private wss: WebSocketService
    ) {

    }

    async save(obj: TimeModel) {
        const doc = new this.model(obj);
        await doc.save();
        this.wss.broadcast("new-time", doc);
        return doc;
    }

    async getAll() {
        return await this.model.find().sort("name");
    }

    async findById(id: string) {
        return await this.model.findById(id);
    }

    async deleteById(id: string) {
        const doc = await this.model.findByIdAndDelete(id);
        this.wss.broadcast("delete-time", doc);
        return doc;
    }

    async update(
        id: string,
        update: TimeUpdateModel
    ) {
        let obj = await this.model
            .findById(id)
            .exec();

        if (obj) {
            if (update.name) {
                obj.name = update.name;
            }

            if (update.maxCountOfTickets) {
                obj.maxCountOfTickets = update.maxCountOfTickets
            }

            obj.save();
            let res = await obj;
            this.wss.broadcast("update-time", res);
            return res;
        }
        return null;
    }

}
