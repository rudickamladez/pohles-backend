import { Inject, Injectable } from "@tsed/di";
import { BadRequest } from "@tsed/exceptions";
import { MongooseModel } from "@tsed/mongoose";
import moment from "moment";
import { CustomerModel } from "src/models/Customer.model";
import { TicketEasyModel, TicketModel, TicketUpdateModel } from "src/models/Ticket.model";
import { YearModel } from "src/models/Year.model";
import { CustomerService } from "./Customer.service";
import { NodemailerService } from "./Nodemailer.service";
import { TimeService } from "./Time.service";
import { WebSocketService } from "./web-socket.service";

@Injectable()
export class TicketService {
    constructor(
        @Inject(TicketModel) private model: MongooseModel<TicketModel>,
        @Inject(CustomerModel) private customerModel: MongooseModel<CustomerModel>,
        @Inject(CustomerService) private customerService: CustomerService,
        @Inject(YearModel) private yearModel: MongooseModel<YearModel>,
        @Inject(TimeService) private timeService: TimeService,
        @Inject(NodemailerService) private nodemailerService: NodemailerService,
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
        // this.nodemailerService.sendTestMail();
        return doc;
    }

    async saveEasy(obj: TicketEasyModel) {
        /**
         * Find buyer in database, if not found -> create document
         */
        let customer = await this.customerModel.findOne({ email: obj.buyer.email.trim() });
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
                endOfReservations: moment().add(14, 'days').calendar(),
            })
            year = await year.save();
            year = await year
                .populate("times")
                .execPopulate();
        }

        /**
         * Check if it's not endOfReservations
         */
        if (moment().diff(moment(year.endOfReservations)) < 0) {
            throw new BadRequest("End of reservations.");
        }

        /**
         * Check time, if is from active year.
         */
        let timeId = obj.time;
        // @ts-ignore
        if (!(year.times.includes(timeId))) {
            throw new BadRequest("Bad time.");
        }

        // @ts-ignore
        let timeFromDB = await this.timeService.findById(timeId);
        if (!timeFromDB) {
            console.error("[Ticket.service.ts::saveEasy] Not found time for new ticket.");
            throw new BadRequest("Not found time for new ticket.");
        }

        let countOfTicketsInSelectedTime = await this.model.countDocuments({ year: year._id, time: timeId });
        // @ts-ignore
        if (countOfTicketsInSelectedTime >= timeFromDB?.maxCountOfTickets) {
            console.error("[Ticket.service.ts::saveEasy] Cannot create new ticket! Time is full.");
            throw new BadRequest("Cannot create new ticket! Time is full.");
        }

        let doc = new this.model({
            owner: owner,
            time: timeId,
            year: year.id,
        });
        await doc.save();
        doc = await doc
            .populate("owner")
            .populate("year")
            .populate("time")
            .execPopulate();
        this.wss.broadcast("new-ticket", doc);
        await this.nodemailerService.sendAndParse(
            // @ts-ignore
            doc.owner.email,
            "Nová rezervace",
            "new-reservation",
            {
                "reservation": doc,
            }
        );
        console.log(doc);
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
