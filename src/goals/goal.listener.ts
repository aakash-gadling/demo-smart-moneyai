// goal.listener.ts (INSIDE GoalModule)
import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { GoalsService } from './goals.service';

@Injectable()
export class GoalListener {


    @OnEvent('user.updated')
    async handleUserUpdated(event: {
        userId: string;
        changedFields: string[];
    }) {
        console.log('Received and ignored events: ', event);
    }
}
