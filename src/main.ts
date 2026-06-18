import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { allowedNodeEnvironmentFlags } from 'process';
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes( new ValidationPipe({
    whitelist:true ,
    forbidNonWhitelisted:true,
    transform:true 
  })),

 app.use(helmet())
app.use(cookieParser());

  app.enableCors({
  origin:
    process.env.NODE_ENV === 'production'
      ? [process.env.FRONT_END]
      : ['http://localhost:5173'],

 credentials: true ,

  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],

  allowedHeaders: ['Content-Type', 'Authorization'],
});
   
  
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
