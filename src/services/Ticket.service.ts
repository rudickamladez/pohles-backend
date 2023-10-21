import { Inject, Injectable } from "@tsed/di";
import { BadRequest, Conflict, NotFound } from "@tsed/exceptions";
import { MongooseModel } from "@tsed/mongoose";
import moment from "moment";
import { QRCode, QRSvg } from 'sexy-qr';
import PDFDocument from 'pdfkit-table';
import SVGtoPDF from 'svg-to-pdfkit';
import * as fs from 'fs';
import { TicketEasySchema, TicketModel, TicketUpdateModel } from "src/models/Ticket.model";
import { YearModel } from "src/models/Year.model";
import { NodemailerService } from "./Nodemailer.service";
import { TimeService } from "./Time.service";
import { WebSocketService } from "./web-socket.service";
import { stringify } from 'csv-stringify/sync';
import { YearService } from "./Year.service";
const API_ENDPOINT = process.env["API_ENDPOINT"];

@Injectable()
export class TicketService {
    constructor(
        @Inject(TicketModel) private model: MongooseModel<TicketModel>,
        @Inject(YearModel) private yearModel: MongooseModel<YearModel>,
        @Inject(TimeService) private timeService: TimeService,
        @Inject(NodemailerService) private nodemailerService: NodemailerService,
        @Inject(WebSocketService) private wss: WebSocketService,
        @Inject(YearService) private yearService: YearService
    ) {

    }

    async save(obj: TicketModel) {
        obj.name.first = obj.name.first.trim()
        obj.name.last = obj.name.last.trim()
        obj.email = obj.email.trim()
        let doc = new this.model(obj);
        await doc.save();
        doc = await doc.populate(["year", "time"]);
        this.wss.broadcast("new-ticket", doc);
        return doc;
    }

    private svgGenerate(obj: TicketModel) {
        const qrCode = new QRCode({
            content: `${API_ENDPOINT}/ticket/${obj._id}/`,
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

    async saveEasy(obj: TicketEasySchema) {

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
            year = await year.populate(["times"])
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

        /**
         * Count tickets at time
         */
        //@ts-ignore
        let countOfTicketsInSelectedTime = await this.model.countDocuments({
            year: year._id,
            time: timeId,
            status: {
                $in: ['paid', 'unpaid']
            }
        });
        // @ts-ignore
        if (countOfTicketsInSelectedTime >= timeFromDB?.maxCountOfTickets) {
            console.error("[Ticket.service.ts::saveEasy] Cannot create new ticket! Time is full.");
            throw new BadRequest("Cannot create new ticket! Time is full.");
        }

        let doc = new this.model({
            name: {
                first: obj.name.first.trim(),
                last: obj.name.last.trim(),
            },
            email: obj.email.trim(),
            time: timeId,
            year: year.id,
        });
        await doc.save();
        doc = await doc.populate(["year", "time"])
        this.wss.broadcast("new-ticket", doc);
        const svgCode = this.svgGenerate(doc);
        this.pdf(doc);
        await this.nodemailerService.sendAndParse(
            doc.email,
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

    async sendNewReservationMailAgain(id: string) {
        const ticket = await this.findById(id);
        if (!ticket) {
            return null;
        }

        const svgCode = this.svgGenerate(ticket);
        this.pdf(ticket);
        const mailInfo = await this.nodemailerService.sendAndParse(
            ticket.email,
            "Rekapitulace rezervace",
            "recapitulation-reservation",
            {
                "reservation": ticket,
            },
            [
                {
                    filename: `pohles-reservation-qrcode-${ticket._id}.svg`,
                    cid: 'reservation-qrcode.svg',
                    content: svgCode
                },
                {
                    filename: `pohles-reservation-${ticket._id}.pdf`,
                    path: `/tmp/qr-${ticket._id}.pdf`,
                }
            ]
        );
        return mailInfo;
    }

    async getAll() {
        return await this.model
            .find()
            .sort("date")
            .populate("year")
            .populate("time")
            .exec();
    }

    async getFiltered(obj: TicketUpdateModel) {
        return await this.model
            .find(obj)
            .sort("date")
            .populate("year")
            .populate("time")
            .exec();
    }

    async findById(id: string) {
        return await this.model
            .findById(id)
            .populate("year")
            .populate("time")
            .exec();
    }

    async deleteById(id: string) {
        const doc = await this.model
            .findByIdAndDelete(id)
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
        // Find object in database
        let obj = await this.model.findById(id);
        if (!obj) {
            // if not found return null
            return null;
        }

        /**
         * Update document object
         */
        if (update.status) {
            obj.status = update.status;
        }

        if (update.name) {
            if (update.name.first) {
                obj.name.first = update.name.first;
            }

            if (update.name.last) {
                obj.name.last = update.name.last;
            }
        }

        if (update.email) {
            obj.email = update.email;
        }

        if (update.year) {
            obj.year = update.year;
        }

        if (update.time) {
            obj.time = update.time;
        }

        // Save document object to database
        await obj.save();

        // Get document object from database
        let res = await obj.populate(["year", "time"])

        // Send it thru websocket
        this.wss.broadcast("update-ticket", res);

        //return to http client
        return res;
    }

    async pay(
        id: string
    ) {
        let obj = await this.findById(id);
        if (!obj) {
            return null;
        }

        obj.status = 'paid';
        obj.statusChanges.push({
            date: new Date(),
            status: 'paid'
        });

        await obj.save();
        let res = await obj.populate(["year", "time"])
        this.wss.broadcast("update-ticket", res);
        this.wss.broadcast("paid-ticket", res);
        return res;
    }

    async getCSV() {
        // Get data from database
        const ticketsData = await this.getAll();

        // Prepare data for CSV
        let tickets = [];
        for (let i = 0; i < ticketsData.length; i++) {
            const t = ticketsData[i];
            tickets.push({
                year: t.year.toString(),
                time: t.time.toString(),
                firstname: t.name.first,
                lastname: t.name.last,
                status: t.status,
                email: t.email,
                date: moment(t.date).format(),
            });
        }

        // Add headers before CSV data
        tickets.unshift(Object.keys(tickets[0]).reduce((a, v) => ({ ...a, [v]: v }), {}));

        // Generate CSV
        const csvData = stringify(tickets);

        // Return CSV file
        return csvData;
    }

    async cancel(
        id: string,
        email: string
    ) {
        if (!id) {
            throw new BadRequest("Did not send id");
        }

        if (!email) {
            throw new BadRequest("Did not send email");
        }

        // Remove whitespaces
        email = email.trim();

        // Find ticket in database
        let obj = await this.findById(id);

        if (!obj) {
            throw new NotFound("Ticket not found in database");
        }

        // Check given email and ticket email
        if (obj.email.toLowerCase() != email.toLocaleLowerCase()) {
            throw new BadRequest("User send bad email.");

        }

        if (obj.status == 'cancelled') {
            throw new Conflict("Ticket already cancelled.");
        }

        // Cancel ticket
        obj.status = 'cancelled';
        obj.statusChanges.push({
            date: new Date(),
            status: 'cancelled'
        });

        // Save to database
        await obj.save();

        // Get saved ticket from database
        let res = await obj.populate(["year", "time"]);

        // Send ticket to clients
        this.wss.broadcast("update-ticket", res);
        this.wss.broadcast("cancelled-ticket", res);
        return res;
    }

    async groupByTimeinActiveYear() {
        // Get active year
        let year = await this.yearService.active();

        let result = await this.model.aggregate([
            {
                // select
                $match: {
                    year: year?._id
                }
            },
            {
                $lookup: {
                    from: 'times',
                    localField: 'time', // from ticket
                    foreignField: '_id', // from time
                    as: 'related_time'
                }
            },
            {
                $group: {
                    _id: '$time', // group by time from ticket
                    time: {
                        $first: '$related_time'
                    },
                    // create array of tickets
                    tickets: {
                        $push: '$$ROOT'
                    },
                }
            },
            {
                // sort
                $sort: {
                    'tickets.name.last': 1
                }
            },
        ])
        return result
    }

    async pdfByTimes() {
        let times = await this.groupByTimeinActiveYear();

        // Create a document
        const doc = new PDFDocument({ margin: 30, size: 'A4', font: 'Open Sans' });
        doc.info['Title'] = `Tickets groupped by times - ${moment().format()}`;
        // Embed a font, set the font size, and render some text
        doc.font('fonts/OpenSans-VariableFont_wdth,wght.ttf');

        async function fillDocumentWithPages() {
            async function addPageWithTable(time: any) {

                // Prepare data for the page
                let data = [];
                for (let ii = 0; ii < time.tickets.length; ii++) {
                    const ticket = time.tickets[ii];
                    data.push([ticket.name.last, ticket.name.first, ticket.email, ticket.status])
                }

                // Setup table
                const table = {
                    title: time.time[0].name,
                    headers: ['Last name', 'First name', 'E-mail', 'Status'],
                    rows: data,
                };

                // Draw table
                await doc.table(
                    table,
                    {
                        columnsSize: [150, 150, 150, 50]
                    }
                );
            }

            // One time is one page
            for (let i = 0; i < times.length; i++) {
                const time = times[i];
                addPageWithTable(time);

                // Add next page if there are some next times
                if (i < (times.length - 1)) {
                    await doc.addPage();
                }
            }
            doc.end();
        };

        return new Promise((resolve, reject) => {
            fillDocumentWithPages().then(() => {
                resolve(doc.read());
            })
        });
    }
}
