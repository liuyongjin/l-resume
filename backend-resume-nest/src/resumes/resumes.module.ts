import { Module } from '@nestjs/common';
import { ResumesService } from './resumes.service';
import { ResumesController } from './resumes.controller';
import { ResumeUploadService } from './resume-upload.service';

@Module({
  controllers: [ResumesController],
  providers: [ResumesService, ResumeUploadService],
  exports: [ResumesService, ResumeUploadService],
})
export class ResumesModule {}