/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
      ConfigModule.forRoot({
      isGlobal: true, // makes ConfigModule available everywhere without re-import
    }),
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
