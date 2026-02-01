import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'objectsArray',
    pure: false
})

export class ObjectsArrayPipe implements PipeTransform {
    transform(data: any, ...args: any[]): any {
        return Object.entries(data).map(([key, value]) => ({key,value}));
    }
}