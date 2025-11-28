import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('prompts')
export class Prompt {
  @PrimaryGeneratedColumn('uuid') id: string;

  @Column({ name: 'key', unique: true }) key: string;
  @Column({ name: 'name' }) name: string;
  @Column({ name: 'description', nullable: true }) description?: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'owner_id' })
  owner?: User;

  @Column({ name: 'is_archived', default: false }) is_archived: boolean;

  @CreateDateColumn({ name: 'created_at' }) created_at: Date;
  @UpdateDateColumn({ name: 'updated_at' }) updated_at: Date;

  @OneToMany(() => PromptVersion, (v) => v.prompt)
  versions: PromptVersion[];
}

@Entity('prompt_versions')
export class PromptVersion {
  @PrimaryGeneratedColumn('uuid') id: string;

  @ManyToOne(() => Prompt, (p) => p.versions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'prompt_id' })
  prompt: Prompt;

  @Column({ name: 'version' }) version: number;
  @Column({ name: 'is_active', default: false }) is_active: boolean;

  @Column({ name: 'model' }) model: string;
  @Column('numeric', { name: 'temperature', nullable: true }) temperature?: number;
  @Column('numeric', { name: 'top_p', nullable: true }) top_p?: number;
  @Column('int', { name: 'max_tokens', nullable: true }) max_tokens?: number;
  @Column('text', { name: 'stop_sequences', array: true, nullable: true }) stop_sequences?: string[];

  @Column('text', { name: 'system_template', nullable: true }) system_template?: string;
  @Column('text', { name: 'user_template', nullable: true }) user_template?: string;
  @Column('jsonb', { name: 'input_schema', nullable: true }) input_schema?: any;
  @Column('jsonb', { name: 'metadata', nullable: true }) metadata?: any;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'created_by' })
  created_by?: User;

  @CreateDateColumn({ name: 'created_at' }) created_at: Date;
}

@Entity('prompt_runs')
export class PromptRun {
  @PrimaryGeneratedColumn('uuid') id: string;

  @ManyToOne(() => Prompt, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'prompt_id' })
  prompt: Prompt;

  @ManyToOne(() => PromptVersion, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'prompt_version_id' })
  prompt_version: PromptVersion;

  @Column('jsonb', { name: 'input_vars' }) input_vars: any;
  @Column('text', { name: 'rendered_system', nullable: true }) rendered_system?: string;
  @Column('text', { name: 'rendered_user', nullable: true }) rendered_user?: string;

  @Column('text', { name: 'response_text', nullable: true }) response_text?: string;
  @Column('jsonb', { name: 'response_usage', nullable: true }) response_usage?: any;
  @Column('int', { name: 'latency_ms', nullable: true }) latency_ms?: number;

  // keep plain uuid column (you can add a Summary entity later)
  @Column('uuid', { name: 'summary_id', nullable: true })
  summary_id?: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'created_by' })
  created_by?: User;

  @CreateDateColumn({ name: 'created_at' }) created_at: Date;
}
