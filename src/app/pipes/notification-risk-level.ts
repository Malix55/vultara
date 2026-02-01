import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'notificationRiskLevel'
})

export class NotificationRiskLevelPipe implements PipeTransform {
    transform(notification: any, ...args: any[]): any {
        return notification.treatment !== "no treatment" ? notification.riskLevelBefore : notification.riskLevelUpdated;
    }
}