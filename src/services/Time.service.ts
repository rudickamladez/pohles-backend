import { Inject, Injectable } from "@tsed/di";
import { MongooseModel } from "@tsed/mongoose";
import { TicketModel } from "src/models/Ticket.model";
import { TimeForFrontendModel, TimeModel, TimeUpdateModel } from "src/models/Time.model";
import { YearModel } from "src/models/Year.model";
import { WebSocketService } from "./web-socket.service";
import { YearService } from "./Year.service";

@Injectable()
export class TimeService {
    constructor(
        @Inject(TimeModel) private model: MongooseModel<TimeModel>,
        @Inject(YearModel) private yearModel: MongooseModel<YearModel>,
        @Inject(TicketModel) private ticketModel: MongooseModel<TicketModel>,
        @Inject(YearService) private yearService: YearService,
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

    async availableTicketsById(timeId: string) {
        const time = await this.model.findById(timeId).exec();
        if (!time) {
            return;
        }
        const countOfTickets = await this.ticketModel.countDocuments({
            time: time.id,
            status: { $in: ['confirmed', 'paid'] },
        });

        let res = new TimeForFrontendModel();
        res.id = time.id;
        res.name = time.name;
        res.maxCountOfTickets = time.maxCountOfTickets;
        res.freePositions = time.maxCountOfTickets - countOfTickets;
        return res;
    }

    async activeTimes() {
        const activeYear = await this.yearService.activeYear();
        const obj = await this.ticketModel.aggregate([
            {
                $match: {
                    year: activeYear?._id,
                    status: { $in: ['confirmed', 'paid'] },
                }
            }, {
                $group: {
                    _id: '$time',
                    occupiedPositions: { $sum: 1 },
                }
            }
        ]);
        console.log(obj);
        return obj;
    }

}
