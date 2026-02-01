import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'feasibilityText'
})

export class FeasibilityTextPipe implements PipeTransform {
    transform(value: any, ...args: any[]): any {
        const result = value.replace(/([A-Z])/g, " $1").replace(/([0-9])/g, " $1");
        return result.charAt(0).toUpperCase() + result.slice(1);
    }
}