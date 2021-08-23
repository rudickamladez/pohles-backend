import { Context, IMiddleware, Inject, Middleware } from '@tsed/common';
import { Request, Response } from 'express';
import { Token } from 'keycloak-connect';
import { EvalAwarePartialHost } from 'ts-node/dist/repl';
import { KeycloakAuthOptions } from '../decorators/KeycloakAuthOptions.decorator';
import { KeycloakService } from '../services/Keycloak.service';

@Middleware()
export class KeycloakMiddleware implements IMiddleware {

  @Inject()
  keycloakService: KeycloakService;

  public use(@Context() ctx: Context) {
    const options: KeycloakAuthOptions = ctx.endpoint.store.get(KeycloakMiddleware);
    const keycloak = this.keycloakService.getKeycloakInstance();
    if (ctx.getRequest().kauth.grant) {
      this.keycloakService.setToken(ctx.getRequest().kauth.grant.access_token);
    }
    if (options.role)
      return keycloak.protect(options.role);
    else if (options.anyRole)
      return keycloak.protect((accessToken: Token, req: Request, res: Response) => {
        //@ts-ignore
        for (let role of options.anyRole) {
          if (accessToken.hasRole(role))
            return true;
        }
        return false;
      });
  }
}