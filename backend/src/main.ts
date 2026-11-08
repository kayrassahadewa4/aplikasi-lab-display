// Force Indonesian Western Time (WIB / UTC+7) globally in Node.js runtime
process.env.TZ = 'Asia/Jakarta';

import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module.js';
import { API_PREFIX } from './common/constants/app.constants.js';
import { HttpExceptionFilter } from './common/filters/http-exception.filter.js';
import { ResponseInterceptor } from './common/interceptors/response.interceptor.js';
import { join } from 'path';
import * as fs from 'fs';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Ensure public uploads directories exist and serve static files
  const uploadsDir = join(process.cwd(), 'public', 'uploads');
  const avatarsDir = join(uploadsDir, 'avatars');
  if (!fs.existsSync(avatarsDir)) {
    fs.mkdirSync(avatarsDir, { recursive: true });
  }
  app.useStaticAssets(uploadsDir, {
    prefix: '/uploads/',
  });

  // Enable graceful shutdown hooks
  app.enableShutdownHooks();

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3000);

  // Global API prefix (/api)
  app.setGlobalPrefix(API_PREFIX);

  // Robust Dynamic CORS Configuration
  const configuredCors = configService.get<string>('CORS_ORIGIN');
  app.enableCors({
    origin: (requestOrigin, callback) => {
      // Allow requests with no origin (curl, mobile, server-to-server)
      if (!requestOrigin) {
        return callback(null, true);
      }

      // If no CORS_ORIGIN or set to wildcard '*', dynamically allow the requesting origin
      if (!configuredCors || configuredCors === '*' || configuredCors.trim() === '') {
        return callback(null, true);
      }

      const allowedOrigins = configuredCors
        .split(',')
        .map((o) => o.trim().replace(/^["']|["']$/g, '').replace(/\/$/, ''))
        .filter(Boolean);

      // Check explicit match, wildcard, vercel.app preview/prod, or localhost
      const normalizedReqOrigin = requestOrigin.replace(/\/$/, '');
      if (
        allowedOrigins.includes('*') ||
        allowedOrigins.includes(normalizedReqOrigin) ||
        normalizedReqOrigin.endsWith('.vercel.app') ||
        normalizedReqOrigin.startsWith('http://localhost')
      ) {
        return callback(null, true);
      }

      callback(null, false);
    },
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Global exception filter
  app.useGlobalFilters(new HttpExceptionFilter());

  // Global response interceptor
  app.useGlobalInterceptors(new ResponseInterceptor());

  // Swagger API documentation (/docs)
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Lab Display API')
    .setDescription('Laboratory Room Schedule Display System — REST API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document);

  await app.listen(port);
}
bootstrap();

