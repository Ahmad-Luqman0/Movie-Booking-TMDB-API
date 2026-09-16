import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
  });

  const port = process.env.PORT || 5003;
  await app.listen(port);
  logger.log(`====================================================`);
  logger.log(`🚀 v3 NestJS Movie Proxy (Prisma ORM) running on port ${port}`);
  logger.log(`📡 Featured:   http://localhost:${port}/api/v3/movies/featured`);
  logger.log(`🏷️  Genres:     http://localhost:${port}/api/v3/movies/genres`);
  logger.log(`🔍 Search:     http://localhost:${port}/api/v3/movies/search?q=batman`);
  logger.log(`🎬 Details:    http://localhost:${port}/api/v3/movies/476669`);
  logger.log(`====================================================`);
}

bootstrap();
