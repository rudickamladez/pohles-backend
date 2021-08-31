import { Inject, Injectable } from "@tsed/di";
import { MongooseModel } from "@tsed/mongoose";
import { TicketModel, TicketUpdateModel } from "src/models/Ticket.model";
import { WebSocketService } from "./web-socket.service";

@Injectable()
export class TicketService {
    constructor(
        @Inject(TicketModel) private model: MongooseModel<TicketModel>,
        @Inject(WebSocketService) private wss: WebSocketService
    ) {

    }

    async save(obj: TicketModel) {
        let doc = new this.model(obj);
        await doc.save();
        doc = await doc
            .populate("owner")
            .populate("year")
            .populate("time")
            .execPopulate();
        this.wss.broadcast("new-ticket", doc);
        return doc;
    }

    async getAll() {
        return await this.model
            .find()
            .sort("date")
            .populate("owner")
            .populate("year")
            .populate("time")
            .exec();
    }

    async findById(id: string) {
        return await this.model
            .findById(id)
            .populate("owner")
            .populate("year")
            .populate("time")
            .exec();
    }

    async deleteById(id: string) {
        const doc = await this.model
            .findByIdAndDelete(id)
            .populate("owner")
            .populate("year")
            .populate("time")
            .exec();
        this.wss.broadcast("delete-ticket", doc);
        return doc;
    }

    async update(
        id: string,
        update: TicketUpdateModel
    ) {
        let obj = await this.model
            .findById(id);

        if (obj) {
            if (update.status) {
                obj.status = update.status;
            }

            if (update.owner) {
                obj.owner = update.owner;
            }

            if (update.year) {
                obj.year = update.year;
            }

            if (update.time) {
                obj.time = update.time;
            }

            obj.save();
            let res = await obj
                .populate("owner")
                .populate("year")
                .populate("time")
                .execPopulate();
            this.wss.broadcast("update-ticket", res);
            return res;
        }
        return null;
    }

}
