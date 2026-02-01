import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'databaseSubtypeStatus',
    pure: false
})

export class DatabaseSubTypeStatusPipe implements PipeTransform {
    transform(assetType: string, ...args: any[]): any {
        const isDisabled: boolean = assetType === "dataAtRest" || assetType === "dataInTransit";
        return isDisabled ? false : true;
    }
}