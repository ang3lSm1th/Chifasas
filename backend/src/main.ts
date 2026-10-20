import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // 1. Cabeceras de Seguridad Estricta con Helmet
  app.use(
    helmet({
      contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false,
      crossOriginEmbedderPolicy: false,
    }),
  );

  // 2. Cookie Parser para tokens de sesión HttpOnly
  app.use(cookieParser());

  // 3. Habilitar CORS para clientes web (POS, KDS y celulares de meseras)
  app.enableCors({
    origin: true, // Permite localhost y dominios de tenants autorizados
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-tenant-id'],
  });

  // 4. Prefijo Global de API
  app.setGlobalPrefix('api/v1');

  // 5. Pipes de Validación Global
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  const port = process.env.PORT || 4000;
  await app.listen(port);
  logger.log(`=======================================================`);
  logger.log(` Chifa Mariana SaaS Backend operativo en puerto ${port}`);
  logger.log(` Prefijo API: /api/v1`);
  logger.log(`=======================================================`);
}
bootstrap();
