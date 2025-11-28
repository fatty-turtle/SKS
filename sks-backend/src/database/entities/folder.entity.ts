import {
  Entity,
  Column,
  OneToMany,
  ManyToOne,
  JoinColumn,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { BaseEntity } from './base.entity';
import { Document } from './document.entity';
import { User } from './user.entity';
import { UserDocument } from './user-document.entity';

@Entity('folder')
export class Folder extends BaseEntity {
  @Column({ type: 'uuid', name: 'owner_id', nullable: false })
  ownerId: string;

  @Column({ type: 'text' })
  name: string;

  @Column({ type: 'uuid', name: 'parent_id', nullable: true })
  parentId: string;

  /** Relations */
  @ManyToOne(() => Folder, (folder) => folder.children, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'parent_id' })
  parent: Folder;

  @OneToMany(() => Folder, (folder) => folder.parent)
  children: Folder[];

  @OneToMany(() => UserDocument, (userDocument) => userDocument.folder)
  userDocuments: UserDocument[];

  @ManyToMany(() => User, (user) => user.folders, {
    cascade: true,
  })
  @JoinTable({
    name: 'user_folders',
    joinColumn: {
      name: 'folder_id',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'user_id',
      referencedColumnName: 'id',
    },
  })
  users: User[];
}
