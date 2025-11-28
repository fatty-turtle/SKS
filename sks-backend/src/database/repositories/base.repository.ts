import {
  Repository,
  DataSource,
  EntityTarget,
  FindOptionsWhere,
  FindManyOptions,
  FindOneOptions,
  DeepPartial,
  SelectQueryBuilder,
} from 'typeorm';
import { BaseEntity } from '../entities/base.entity';
import { Injectable } from '@nestjs/common';

export interface PaginationOptions {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  filters?: Record<string, any>;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface SearchFilter {
  field: string;
  value: any;
  operator?:
    | 'eq'
    | 'ne'
    | 'gt'
    | 'gte'
    | 'lt'
    | 'lte'
    | 'like'
    | 'ilike'
    | 'in'
    | 'notIn';
}

export interface SortOption {
  field: string;
  order: 'ASC' | 'DESC';
}

@Injectable()
export abstract class BaseRepository<T extends BaseEntity> {
  protected repository: Repository<T>;

  constructor(
    protected dataSource: DataSource,
    protected entity: EntityTarget<T>,
  ) {
    this.repository = this.dataSource.getRepository(this.entity);
  }

  async findById(id: string): Promise<T | null> {
    return this.repository.findOne({ where: { id } as FindOptionsWhere<T> });
  }

  async findAll(options?: FindManyOptions<T>): Promise<T[]> {
    return this.repository.find(options);
  }

  async findOne(options: FindOneOptions<T>): Promise<T | null> {
    return this.repository.findOne(options);
  }

  async findMany(options: FindManyOptions<T>): Promise<T[]> {
    return this.repository.find(options);
  }

  async create(data: DeepPartial<T>): Promise<T> {
    const entity = this.repository.create(data);
    return this.repository.save(entity);
  }

  async update(id: string, data: DeepPartial<T>): Promise<T | null> {
    await this.repository.update(id, data as any);
    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return (result.affected ?? 0) > 0;
  }

  async softDelete(id: string): Promise<boolean> {
    const result = await this.repository.softDelete(id);
    return (result.affected ?? 0) > 0;
  }

  async count(options?: FindManyOptions<T>): Promise<number> {
    return this.repository.count(options);
  }

  async exists(where: FindOptionsWhere<T>): Promise<boolean> {
    const count = await this.repository.count({ where });
    return count > 0;
  }

  /**
   * Get list with pagination, search, filter, and sort (all optional)
   */
  async getListPagination(
    options: {
      page?: number;
      limit?: number;
      search?: string;
      searchFields?: string[];
      sortBy?: string;
      sortOrder?: 'ASC' | 'DESC';
      filters?: Record<string, any>;
      relations?: string[];
      select?: (keyof T)[];
      additionalWhere?: FindOptionsWhere<T>;
    } = {},
  ): Promise<PaginatedResult<T>> {
    const {
      page = 1,
      limit = 10,
      search = '',
      searchFields = [],
      sortBy = 'createdAt',
      sortOrder = 'DESC',
      filters = {},
      relations = [],
      select = [],
      additionalWhere,
    } = options;

    // Build query
    const queryBuilder = this.repository.createQueryBuilder('entity');

    // Apply relations (optional)
    relations.forEach((relation) => {
      queryBuilder.leftJoinAndSelect(`entity.${relation}`, relation);
    });

    // Apply select fields (optional)
    if (select.length > 0) {
      const selectFields = select.map((field) => `entity.${field as string}`);
      queryBuilder.select(selectFields);
    }

    // Apply search (optional)
    if (search && searchFields.length > 0) {
      const searchConditions = searchFields.map(
        (field) => `entity.${field} ILIKE :search`,
      );
      queryBuilder.andWhere(`(${searchConditions.join(' OR ')})`, {
        search: `%${search}%`,
      });
    }

    // Apply filters (optional)
    if (filters && Object.keys(filters).length > 0) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            queryBuilder.andWhere(`entity.${key} IN (:...${key})`, {
              [key]: value,
            });
          } else {
            queryBuilder.andWhere(`entity.${key} = :${key}`, { [key]: value });
          }
        }
      });
    }

    // Apply additional where conditions (optional)
    if (additionalWhere) {
      Object.entries(additionalWhere).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryBuilder.andWhere(`entity.${key} = :${key}`, { [key]: value });
        }
      });
    }

    // Apply sorting (optional)
    queryBuilder.orderBy(`entity.${sortBy}`, sortOrder);

    // Apply pagination
    const offset = (page - 1) * limit;
    queryBuilder.skip(offset).take(limit);

    // Execute query
    const [data, total] = await queryBuilder.getManyAndCount();

    // Calculate pagination meta
    const totalPages = Math.ceil(total / limit);
    const meta = {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    };

    return { data, meta };
  }

  /**
   * Get list with multiple sort options
   */
  async getListWithMultiSort(
    options: PaginationOptions = {},
    sortOptions: SortOption[],
    config: {
      allowedFields?: string[];
      relations?: string[];
    } = {},
  ): Promise<PaginatedResult<T>> {
    const { allowedFields = [], relations = [] } = config;

    const { page = 1, limit = 10 } = options;

    const queryBuilder = this.repository.createQueryBuilder('entity');

    // Apply relations
    relations.forEach((relation) => {
      queryBuilder.leftJoinAndSelect(`entity.${relation}`, relation);
    });

    // Apply sorting
    sortOptions.forEach((sort, index) => {
      if (allowedFields.length > 0 && !allowedFields.includes(sort.field)) {
        throw new Error(
          `Invalid sort field: ${sort.field}. Allowed fields: ${allowedFields.join(', ')}`,
        );
      }

      if (index === 0) {
        queryBuilder.orderBy(`entity.${sort.field}`, sort.order);
      } else {
        queryBuilder.addOrderBy(`entity.${sort.field}`, sort.order);
      }
    });

    // Apply pagination
    const offset = (page - 1) * limit;
    queryBuilder.skip(offset).take(limit);

    // Execute query
    const [data, total] = await queryBuilder.getManyAndCount();

    // Calculate pagination meta
    const totalPages = Math.ceil(total / limit);
    const meta = {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    };

    return { data, meta };
  }

  /**
   * Get list with date range filter
   */
  async getListWithDateRange(
    dateField: string,
    startDate: Date,
    endDate: Date,
    options: PaginationOptions = {},
  ): Promise<PaginatedResult<T>> {
    const queryBuilder = this.repository.createQueryBuilder('entity');

    queryBuilder
      .andWhere(`entity.${dateField} >= :startDate`, { startDate })
      .andWhere(`entity.${dateField} <= :endDate`, { endDate });

    return this.executeQueryWithPagination(queryBuilder, options);
  }

  /**
   * Execute query with pagination
   */
  private async executeQueryWithPagination(
    queryBuilder: SelectQueryBuilder<T>,
    options: PaginationOptions = {},
  ): Promise<PaginatedResult<T>> {
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = options;
    const offset = (page - 1) * limit;

    queryBuilder
      .orderBy(`entity.${sortBy}`, sortOrder)
      .skip(offset)
      .take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    const totalPages = Math.ceil(total / limit);
    const meta = {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    };

    return { data, meta };
  }

  /**
   * Count entities with filters
   */
  async countWithFilters(filters: Record<string, any> = {}): Promise<number> {
    const queryBuilder = this.repository.createQueryBuilder('entity');

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          queryBuilder.andWhere(`entity.${key} IN (:...${key})`, {
            [key]: value,
          });
        } else {
          queryBuilder.andWhere(`entity.${key} = :${key}`, { [key]: value });
        }
      }
    });

    return queryBuilder.getCount();
  }

  /**
   * Check if entity exists with filters
   */
  async existsWithFilters(filters: Record<string, any> = {}): Promise<boolean> {
    const count = await this.countWithFilters(filters);
    return count > 0;
  }

  getRepository(): Repository<T> {
    return this.repository;
  }
}
