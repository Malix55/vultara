import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'checkToday',
    pure: false
})

export class CheckTodayPipe implements PipeTransform {
    transform(date: any, ...args: any[]): any {
        date = typeof date === "string" ? new Date(date) : date;
        const today = new Date();
        return date.getDate() == today.getDate() &&
            date.getMonth() == today.getMonth() &&
            date.getFullYear() == today.getFullYear()
    }
}