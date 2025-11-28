import { ApiProperty } from '@nestjs/swagger';

export class ExtractJsonAttrsDto {
  @ApiProperty({
    description: 'JSON document bất kỳ để phân tích',
    example: {
      user: {
        id: 123,
        name: 'Alice',
        emails: ['a@x.com', 'b@y.com'],
        profile: { age: 20, active: true }
      }
    },
  })
  payload!: any;

  @ApiProperty({
    description: 'Tuỳ chọn trích xuất',
    required: false,
    example: {
      arrayStyle: 'wildcard',  // 'wildcard' | 'index'
      maxDepth: 20,
      includeTypes: true,
      includeSample: true,
    },
  })
  options?: {
    arrayStyle?: 'wildcard' | 'index'; // wildcard -> users[].email ; index -> users[0].email
    maxDepth?: number;
    includeTypes?: boolean;
    includeSample?: boolean;
  };
}
