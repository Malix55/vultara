import { Pipe, PipeTransform } from '@angular/core';
import { DesignSettingsService } from '../services/design-settings.service';

@Pipe({
    name: 'databaseSubType',
    pure: false
})
export class DatabaseSubTypePipe implements PipeTransform {
    constructor(private _editDesignShared: DesignSettingsService) { }
    assetSubTypes = this._editDesignShared.assetSubTypes;
    assetSubTypesTransit = this._editDesignShared.assetSubTypesTransit;
    transform(assetType: any, ...args: any[]): any {
        const subType: any = args[0];
        if (assetType === "dataInTransit") {
            return this.assetSubTypesTransit;
        } else if (assetType === "dataAtRest") {
            return this.assetSubTypes;
        }

        return [subType];
    }
}