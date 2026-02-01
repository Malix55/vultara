import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'feasibilityEnumerate'
})

export class FeasibilityEnumeratePipe implements PipeTransform {
    transform(value: any, ...args: any[]): any {
        const timeKeys = Object.keys(value);
        const timeValues = Object.values(value);
        const timeValueIndex = timeValues.findIndex(val => val == args[0]);
        if (timeValueIndex > -1) {
            return timeKeys[timeValueIndex];
        }

        return '';
    }
}