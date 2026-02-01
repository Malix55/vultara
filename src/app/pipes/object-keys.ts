import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'objectKeys',
    pure: false
})

export class ObjectKeysPipe implements PipeTransform {
    transform(object: any, ...args: any[]): any {
        return Object.keys(object);
    }
}