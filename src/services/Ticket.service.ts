import { Inject, Injectable } from "@tsed/di";
import { BadRequest } from "@tsed/exceptions";
import { MongooseModel } from "@tsed/mongoose";
import moment from "moment";
import { QRCode, QRSvg } from 'sexy-qr';
import PDFDocument from 'pdfkit';
import SVGtoPDF from 'svg-to-pdfkit';
import * as fs from 'fs';
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
            .populate(["owner", "year", "time"])
        this.wss.broadcast("new-ticket", doc);

        // this.nodemailerService.sendTestMail();
        return doc;
    }

    private svgGenerate (obj: TicketModel) {
        const qrCode = new QRCode({
            content: `https://api.pohles.rudickamladez.cz/ticket/${obj._id}/`,
            ecl: 'M', // 'L' | 'M' | 'Q' | 'H'
          });
        
          const qrSvg = new QRSvg(qrCode, {
            fill: '#182026',
            cornerBlocksAsCircles: false,
            size: 300, // px
            radiusFactor: 0.75, // 0-1
            cornerBlockRadiusFactor: 2, // 0-3
            roundInnerCorners: true,
            roundOuterCorners: true,
            preContent: '<!-- QR Code -->',
          });
        
          return qrSvg.svg;
    }

    pdf(obj: TicketModel) {

        // Create a document
        const doc = new PDFDocument();
        doc.pipe(fs.createWriteStream(`/tmp/qr-${obj._id}.pdf`));
        const svg = this.svgGenerate(obj);
        SVGtoPDF(doc, svg, 50, 50, {});

        // Embed a font, set the font size, and render some text
        doc
            // .font('fonts/PalatinoBold.ttf')
            .fontSize(25)
            .text(obj._id, 50, 300);

        doc.end();
        return;
    }

    async saveEasy(obj: TicketEasyModel) {
        /**
         * Find buyer in database, if not found -> create document
         */
        let customer = await this.customerModel.findOne({ email: obj.buyer.email.trim() });
        let owner;
        if (customer) {
            const foundName = customer.names.some(name => {
                return (name.first == obj.buyer.name.first) && (name.last == obj.buyer.name.last);
            })
            if (!foundName) {
                customer.names.push(obj.buyer.name);
                owner = await this.customerService.update(customer.id, customer);
            } else {
                owner = customer;
            }
        } else {
            let buyer = new CustomerModel();
            buyer.names = [obj.buyer.name];
            buyer.email = obj.buyer.email;
            owner = await this.customerService.save(buyer);
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
                .populate(["times"])
                //@ts-ignore
                // .execPopulate();
        }

        /**
         * Check if it's not endOfReservations
         */
        //@ts-ignore
        if (moment().diff(moment(year.endOfReservations)) > 0) {
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

        //@ts-ignore
        let countOfTicketsInSelectedTime = await this.model.countDocuments({ year: year._id, time: timeId });
        // @ts-ignore
        if (countOfTicketsInSelectedTime >= timeFromDB?.maxCountOfTickets) {
            console.error("[Ticket.service.ts::saveEasy] Cannot create new ticket! Time is full.");
            throw new BadRequest("Cannot create new ticket! Time is full.");
        }

        let doc = new this.model({
            owner: owner,
            time: timeId,
            //@ts-ignore
            year: year.id,
        });
        await doc.save();
        doc = await doc
            .populate(["owner", "year", "time"])
        this.wss.broadcast("new-ticket", doc);
        const svgCode = this.svgGenerate(doc);
        this.pdf(doc);
        await this.nodemailerService.sendAndParse(
            // @ts-ignore
            doc.owner.email,
            "Nová rezervace",
            "new-reservation",
            {
                "reservation": doc,
            },
            [
                {
                    filename: `pohles-reservation-qrcode-${doc._id}.svg`,
                    cid: 'reservation-qrcode.svg',
                    content: svgCode
                },
                {
                    filename: `pohles-reservation-${doc._id}.pdf`,
                    path: `/tmp/qr-${doc._id}.pdf`,
                }
            ]
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
                .populate(["owner", "year", "time"])
            this.wss.broadcast("update-ticket", res);
            return res;
        }
        return null;
    }

}
