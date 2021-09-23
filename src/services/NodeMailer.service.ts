import {Constant, Injectable} from "@tsed/di";
import { NodeMailerConfig } from "./NodeMailer.config";

@Injectable()
export class NodeMailerService {
    @Constant("nodeMailer")
    nodeMailer: NodeMailerConfig;

    public getSmtp(): string{
        return this.nodeMailer.smtp;
    }
}
