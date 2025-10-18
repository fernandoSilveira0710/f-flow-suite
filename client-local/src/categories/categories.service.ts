import { Injectable, NotFoundException, Logger, ConflictException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CategoryResponseDto } from './dto/category-response.dto';

@Injectable()
export class CategoriesService {
  private readonly logger = new Logger(CategoriesService.name);

  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async create(createCategoryDto: CreateCategoryDto): Promise<CategoryResponseDto> {
    // Check if category name already exists
    const existingCategory = await this.prisma.category.findUnique({
      where: { name: createCategoryDto.name },
    });

    if (existingCategory) {
      throw new ConflictException(`Category with name '${createCategoryDto.name}' already exists`);
    }

    const category = await this.prisma.category.create({
      data: {
        name: createCategoryDto.name,
        description: createCategoryDto.description,
        active: createCategoryDto.active ?? true,
      },
    });

    this.logger.log(`Category created: ${category.id}`);
    return this.mapToResponseDto(category);
  }

  async findAll(active?: string): Promise<CategoryResponseDto[]> {
    const where = (active === 'true' || active === 'false')
      ? { active: active === 'true' }
      : undefined;

    const categories = await this.prisma.category.findMany({
      where,
      orderBy: { name: 'asc' },
    });

    return categories.map(category => this.mapToResponseDto(category));
  }

  async findOne(id: string): Promise<CategoryResponseDto> {
    const category = await this.prisma.category.findUnique({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    return this.mapToResponseDto(category);
  }

  async update(id: string, updateCategoryDto: UpdateCategoryDto): Promise<CategoryResponseDto> {
    const existingCategory = await this.prisma.category.findUnique({
      where: { id },
    });

    if (!existingCategory) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    // Check if name is being updated and if it conflicts with another category
    if (updateCategoryDto.name && updateCategoryDto.name !== existingCategory.name) {
      const nameConflict = await this.prisma.category.findUnique({
        where: { name: updateCategoryDto.name },
      });

      if (nameConflict) {
        throw new ConflictException(`Category with name '${updateCategoryDto.name}' already exists`);
      }
    }

    const updatedCategory = await this.prisma.category.update({
      where: { id },
      data: {
        name: updateCategoryDto.name,
        description: updateCategoryDto.description,
        active: updateCategoryDto.active,
      },
    });

    this.logger.log(`Category updated: ${id}`);
    return this.mapToResponseDto(updatedCategory);
  }

  async remove(id: string): Promise<void> {
    const existingCategory = await this.prisma.category.findUnique({
      where: { id },
    });

    if (!existingCategory) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    // Check if category is being used by any services
    const servicesUsingCategory = await this.prisma.service.count({
      where: { categoryId: id, active: true },
    });

    if (servicesUsingCategory > 0) {
      throw new ConflictException(`Cannot delete category. It is being used by ${servicesUsingCategory} service(s)`);
    }

    // Soft delete
    await this.prisma.category.update({
      where: { id },
      data: { active: false },
    });

    this.logger.log(`Category soft deleted: ${id}`);
  }

  private mapToResponseDto(category: any): CategoryResponseDto {
    return {
      id: category.id,
      name: category.name,
      description: category.description,
      active: category.active,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
    };
  }
}