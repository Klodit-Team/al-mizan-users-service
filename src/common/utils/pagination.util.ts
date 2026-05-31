import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export function buildPagination(dto: PaginationQueryDto): { skip: number; take: number } {
  const page = dto.page ?? 1;
  const limit = dto.limit ?? 20;
  return {
    skip: (page - 1) * limit,
    take: limit,
  };
}
