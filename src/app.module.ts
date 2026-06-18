import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { TasksModule } from './modules/tasks/tasks.module';
import { UesrsModule } from './modules/uesrs/uesrs.module';
import { UesrsModule } from './modules/uesrs/uesrs.module';
import { TasksModule } from './modules/tasks/tasks.module';
import { AuthModule } from './modules/auth/auth.module';

@Module({
  imports: [AuthModule, UesrsModule, TasksModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
