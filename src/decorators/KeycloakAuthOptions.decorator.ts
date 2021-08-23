import { Returns } from '@tsed/schema';
import { IAuthOptions, UseAuth } from '@tsed/common';
import { useDecorators } from '@tsed/core';
import { Security } from '@tsed/schema';
import { KeycloakMiddleware } from '../middlewares/Keycloak.middleware';

export interface KeycloakAuthOptions extends IAuthOptions {
  role?: string;
  anyRole?: string[];
  scopes?: string[];
}

export function KeycloakAuth(options: KeycloakAuthOptions = {}): Function {
  return useDecorators(
    UseAuth(KeycloakMiddleware, options),
    Security('oauth2', ...(options.scopes || [])),
    Returns(403)
  );
}