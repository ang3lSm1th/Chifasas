import { Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';

export interface TenantContext {
  tenantId: string;
  userId?: string;
  role?: string;
}

@Injectable()
export class TenantContextService {
  private static readonly asyncLocalStorage = new AsyncLocalStorage<TenantContext>();

  runWithContext<T>(context: TenantContext, fn: () => T): T {
    return TenantContextService.asyncLocalStorage.run(context, fn);
  }

  getTenantId(): string | undefined {
    return TenantContextService.asyncLocalStorage.getStore()?.tenantId;
  }

  getContext(): TenantContext | undefined {
    return TenantContextService.asyncLocalStorage.getStore();
  }
}
