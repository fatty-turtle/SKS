import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { config } from 'dotenv';

config();
@Injectable()
export class DocumentValidationPipe implements PipeTransform {
  transform(file: Express.Multer.File) {
    if (!file) throw new BadRequestException('File is required');

    const MAX_FILE_SIZE_MB = process.env.MAX_FILE_SIZE_MB || 20;
    const fileSizeMB = file.size / (1024 * 1024);

    if (fileSizeMB > +MAX_FILE_SIZE_MB) {
      throw new BadRequestException(
        `File size exceeds ${MAX_FILE_SIZE_MB}MB (max ${MAX_FILE_SIZE_MB}MB).`,
      );
    }

    const allowedMime = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/vnd.ms-powerpoint',
    ];

    if (!allowedMime.includes(file.mimetype)) {
      throw new BadRequestException(
        `Unsupported file type: ${file.mimetype}. Allowed: pdf, docx, txt, pptx, ppt.`,
      );
    }

    return file;
  }
}
