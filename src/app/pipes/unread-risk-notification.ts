import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'unreadRiskNotification',
    pure: false
})

export class UnreadRiskNotificationPipe implements PipeTransform {
    transform(notifications: any, ...args: any[]): any {
        return notifications.filter(obj => !obj.readStatus);
    }
}