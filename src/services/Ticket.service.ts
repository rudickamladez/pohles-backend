import { Inject, Injectable } from "@tsed/di";
import { MongooseModel } from "@tsed/mongoose";
import { CustomerModel } from "src/models/Customer.model";
import { TicketEasyModel, TicketModel, TicketUpdateModel } from "src/models/Ticket.model";
import { YearModel } from "src/models/Year.model";
import { CustomerService } from "./Customer.service";
import { WebSocketService } from "./web-socket.service";

@Injectable()
export class TicketService {
    constructor(
        @Inject(TicketModel) private model: MongooseModel<TicketModel>,
        @Inject(CustomerModel) private customerModel: MongooseModel<CustomerModel>,
        @Inject(CustomerService) private customerService: CustomerService,
        @Inject(YearModel) private yearModel: MongooseModel<YearModel>,
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

    async saveEasy(obj: TicketEasyModel) {
        /**
         * Find buyer in database, if not found -> create document
         */
        let customer = await this.customerModel.findOne({ email: obj.buyer.email });
        let owner;
        if (customer) {
            owner = customer;
        } else {
            owner = await this.customerService.save(obj.buyer);
        }


        // Get active year
        let year = await this.yearModel.findOne({ status: 'active' });
        if (!year) {
            year = new this.yearModel({
                name: "Automatic Active Year",
                status: 'active',
                times: [obj.time],
            })
            await year.save();
        }

        /**
         * Check time, if is from active year.
         */
        let time = obj.time;
        /* if (!(year.times.includes(obj.time))) {
            return null;
        } */

        let doc = new this.model({
            owner: owner,
            time: time,
            year: year.id,
        });
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
