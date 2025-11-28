// summary.entity.ts
import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Document } from './document.entity';
import { UserDocument } from './user-document.entity';

@Entity('summary')
export class Summary extends BaseEntity {
  @Column({ name: 'summary_text', type: 'text' })
  summaryText: string;

  @Column({ name: 'summary_model', type: 'text', nullable: true })
  summaryModel: string;

  @Column({ name: 'diagram', type: 'jsonb', nullable: true })
  diagram: string[];

  @Column({ name: 'created_by', type: 'uuid' })
  createdBy: string;

  /** Relations */
  @OneToMany(() => UserDocument, (userDocument) => userDocument.summary)
  userDocuments: UserDocument[];
}
