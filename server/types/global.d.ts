import type { H3Event as NuxtH3Event } from 'h3';

declare global {
  type H3Event = NuxtH3Event;

  // Ajouter les types pour les fonctions Nuxt
  function defineEventHandler<T = any>(
    handler: (event: H3Event) => T | Promise<T>,
  ): any;
  function getQuery(event: H3Event): Record<string, any>;
  function readBody<T = any>(event: H3Event): Promise<T>;
  function getRouterParam(event: H3Event, name: string): string | undefined;
  function getHeader(event: H3Event, name: string): string | undefined;
  function assertMethod(event: H3Event, expected: string | string[]): void;
  function createError(options: {
    statusCode: number;
    statusMessage: string;
    data?: any;
  }): Error;
}

export {};
