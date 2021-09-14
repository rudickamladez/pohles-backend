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

        const res = new TimeForFrontendModel(
            time._id,
            time.name,
            time.maxCountOfTickets,
            countOfTickets
        );
        return res;
    }

    async activeTimes() {
        const activeYear = await this.yearService.active();
        let counter = new Map<string, TimeForFrontendModel>();
        activeYear?.times.forEach(
            (time) => {
                console.log(time._id);
                if (!counter.has(time._id)) {
                    counter.set(
                        String(time._id),
                        new TimeForFrontendModel(
                            time._id,
                            time.name,
                            time.maxCountOfTickets
                        ),
                    );
                }
            }
        );

        const res = await this.ticketModel.find({ year: activeYear?.id, status: { $in: ["confirmed", "paid"] } }).populate("time").exec();
        res.forEach(
            (ticket) => {
                //@ts-ignore
                if (counter.has(ticket.time.id)) {
                    // @ts-ignore
                    counter.get(ticket.time.id).occupyThePositions();
                } else {
                    //@ts-ignore
                    counter.set(String(ticket.time.id), new TimeForFrontendModel(ticket.time.id, ticket.time.name, ticket.time.maxCountOfTickets, 1));
                }
            }
        );

        let output: TimeForFrontendModel[] = [];
        counter.forEach(
            (key) => {
                output.push(key);
            }
        );
        return output;
    }

}
