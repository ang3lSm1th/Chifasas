import { Global, Module } from '@nestjs/common';
import { OpenBaoService } from './openbao.service';

@Global()
@Module({
  providers: [OpenBaoService],
  exports: [OpenBaoService],
})
export class OpenBaoModule {}
