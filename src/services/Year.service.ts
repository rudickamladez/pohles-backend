import { Inject, Injectable } from "@tsed/di";
import { MongooseModel } from "@tsed/mongoose";
import { YearModel, YearUpdateModel } from "src/models/Year.model";
import { WebSocketService } from "./web-socket.service";

@Injectable()
export class YearService {
    constructor(
        @Inject(YearModel) private model: MongooseModel<YearModel>,
        @Inject(WebSocketService) private wss: WebSocketService
    ) {

    }

    async save(obj: YearModel) {
        obj.name = obj.name.trim();
        let doc = new this.model(obj);
        await doc.save()
        doc = await doc
            .populate("times")
        this.wss.broadcast("new-year", doc);
        return doc;
    }

    async getAll() {
        return await this.model
            .find()
            .sort("name")
            .populate("times")
            .exec();
    }

    async findById(id: string) {
        return await this.model
            .findById(id)
            .populate("times")
            .exec();
    }

    async deleteById(id: string) {
        const doc = await this.model
            .findByIdAndDelete(id)
            .populate("times")
            .exec();
        this.wss.broadcast("delete-year", doc);
        return doc;
    }

    async update(
        id: string,
        update: YearUpdateModel
    ) {
        let obj = await this.model.findById(id);

        if (obj) {
            if (update.name) {
                obj.name = update.name.trim();
            }

            if (update.status) {
                obj.status = update.status;
            }

            if (update.times) {
                obj.times = update.times;
            }

            if (update.endOfReservations) {
                obj.endOfReservations = update.endOfReservations;
            }

            obj.save();
            let res = await obj
                .populate("times")
            this.wss.broadcast("update-year", res);
            return res;
        }
        return null;
    }

    async active() {
        const doc = await this.model
            .findOne({ status: 'active' })
            .populate('times')
            .exec();
        return doc;
    }

}
