import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Body,
    Param,
} from '@nestjs/common';
import { GoalsService } from './goals.service';
import { CreateGoalDto, UpdateGoalDto, AddProgressDto } from './dto';

@Controller('goals')
export class GoalsController {
    constructor(private readonly goalsService: GoalsService) { }

    @Get('user/:userId')
    findAllByUser(@Param('userId') userId: string) {
        return this.goalsService.findAllByUser(userId);
    }

    @Get('stats/:userId')
    getStats(@Param('userId') userId: string) {
        return this.goalsService.getStats(userId);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.goalsService.findOne(id);
    }

    @Post()
    create(@Body() dto: CreateGoalDto) {
        return this.goalsService.create(dto);
    }

    @Put(':id')
    update(@Param('id') id: string, @Body() dto: UpdateGoalDto) {
        return this.goalsService.update(id, dto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.goalsService.remove(id);
    }

    @Post(':id/progress')
    addProgress(@Param('id') id: string, @Body() dto: AddProgressDto) {
        return this.goalsService.addProgress(id, dto);
    }
}
