import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { BaseRepository } from './base.repository';
import { Summary } from '../entities/summary.entity';

@Injectable()
export class SummaryRepository extends BaseRepository<Summary> {
  constructor(private readonly ds: DataSource) {
    super(ds, Summary);
  }

  async findByDocument(documentId: string): Promise<Summary | null> {
    return this.repository.findOne({
      where: { userDocuments: { document: { id: documentId } } },
      relations: ['userDocuments'],
    });
  }

  async findByDocumentAndUser(
    documentId: string,
    userId: string,
  ): Promise<Summary | null> {
    return this.repository.findOne({
      where: {
        userDocuments: { document: { id: documentId }, user: { id: userId } },
      },
      relations: ['userDocuments'],
    });
  }

  async findByDocumentAndCreatedBy(
    documentId: string,
    userId: string,
  ): Promise<Summary | null> {
    return this.repository.findOne({
      where: {
        createdBy: userId,
        userDocuments: { document: { id: documentId } },
      },
      relations: ['userDocuments'],
    });
  }
}
