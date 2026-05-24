import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
  );
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  const config = new DocumentBuilder()
    .setTitle('IssueFlow API')
    .setDescription(
      'Ticket management backend for software teams.\n\n' +
        '**Authentication:** All endpoints except `POST /auth/login` and `POST /users` require a Bearer JWT token.\n' +
        'Obtain a token via `POST /auth/login`, then click **Authorize** and paste it in.\n\n' +
        '**Roles:** Endpoints marked `ADMIN only` require the authenticated user to have the `ADMIN` role.',
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Paste the accessToken returned by POST /auth/login',
      },
      'access-token',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(3000);
  console.log('IssueFlow running on http://localhost:3000');
  console.log('Swagger UI:       http://localhost:3000/api/docs');
}
void bootstrap();
