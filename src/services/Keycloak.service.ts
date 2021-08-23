import { OnInit, Service, Value } from '@tsed/di';
import { MemoryStore } from 'express-session';
import { $log } from "@tsed/common";
import { Token } from "keycloak-connect";
import KeycloakConnect = require('keycloak-connect');

@Service()
export class KeycloakService implements OnInit {
    private keycloak: KeycloakConnect.Keycloak;
    private memoryStore: MemoryStore;
    private token: Token;

    @Value("keycloak.realm")
    private realm: string;
    @Value("keycloak.bearerOnly")
    private bearerOnly: boolean;
    @Value("keycloak.authServerUrl")
    private authServerUrl: string;
    @Value("keycloak.sslRequired")
    private sslRequired: string;
    @Value("keycloak.resource")
    private resource: string;
    @Value("keycloak.confidentialPort")
    private confidentialPort: string;

    constructor() {
    }
    $onInit(): void | Promise<any> {
        this.initKeycloak();
    }

    public initKeycloak(): KeycloakConnect.Keycloak {
        if (this.keycloak) {
            $log.warn('Trying to init Keycloak again!');
            return this.keycloak;
        } else {
            $log.info('Initializing Keycloak...');
            this.memoryStore = new MemoryStore();
            this.keycloak = new KeycloakConnect(
                { store: this.memoryStore },
                {
                    "realm": this.realm,
                    "bearer-only": this.bearerOnly,
                    "auth-server-url": this.authServerUrl,
                    "ssl-required": this.sslRequired,
                    "resource": this.resource,
                    "confidential-port": this.confidentialPort
                }
            );
            return this.keycloak;
        }
    }

    public getKeycloakInstance(): KeycloakConnect.Keycloak {
        return this.keycloak;
    }

    public getMemoryStore(): MemoryStore {
        return this.memoryStore;
    }

    public getToken(): Token {
        return this.token;
    }

    public setToken(token: Token): void {
        this.token = token;
    }
}