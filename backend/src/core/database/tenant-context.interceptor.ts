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
    const request = context.switchToHttp().getRequest();
    // Extraer tenantId de la cabecera x-tenant-id o de la sesión verificada
    const tenantId =
      request.headers['x-tenant-id'] ||
      request.user?.tenantId ||
      request.session?.tenantId ||
      'default-chifa';

    request.tenantId = tenantId;

    return new Observable((subscriber) => {
      this.tenantContextService.runWithContext(
        {
          tenantId,
          userId: request.user?.id,
          role: request.user?.role,
        },
        () => {
          next.handle().subscribe(subscriber);
        },
      );
    });
  }
}
