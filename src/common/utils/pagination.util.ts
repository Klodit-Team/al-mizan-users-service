import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export function buildPagination(dto: PaginationQueryDto): { skip: number; take: number } {
  return {
    skip: (dto.page - 1) * dto.limit,
    take: dto.limit,
  };
}
