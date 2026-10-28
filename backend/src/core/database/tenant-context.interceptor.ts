import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { TenantContextService } from './tenant-context.service';

@Injectable()
export class TenantContextInterceptor implements NestInterceptor {
  constructor(private readonly tenantContextService: TenantContextService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const contextType = context.getType();

    if (contextType === 'ws') {
      const wsContext = context.switchToWs();
      const client = wsContext.getClient();
      const data = wsContext.getData();
      const tenantId =
        data?.tenantId ||
        client?.handshake?.headers?.['x-tenant-id'] ||
        client?.handshake?.auth?.tenantId ||
        'default-chifa';

      return new Observable((subscriber) => {
        this.tenantContextService.runWithContext(
          {
            tenantId: String(tenantId),
            userId: client?.user?.id,
            role: client?.user?.role,
          },
          () => {
            next.handle().subscribe(subscriber);
          },
        );
      });
    }

    const request = context.switchToHttp().getRequest();
    // Extraer tenantId de la cabecera x-tenant-id o de la sesión verificada
    const tenantId =
      request?.headers?.['x-tenant-id'] ||
      request?.user?.tenantId ||
      request?.session?.tenantId ||
      'default-chifa';

    if (request) {
      request.tenantId = tenantId;
    }

    return new Observable((subscriber) => {
      this.tenantContextService.runWithContext(
        {
          tenantId,
          userId: request?.user?.id || request?.user?.sub,
          role: request?.user?.role,
        },
        () => {
          next.handle().subscribe(subscriber);
        },
      );
    });
  }
}
