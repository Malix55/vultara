import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'databaseSubtypeValue'
})

export class DatabaseSubTypeValuePipe implements PipeTransform {
    transform(value: any, ...args: any[]): any {
        if (value === "General Data") {
            return "generalData";
        } else if (value === "Configuration Data") {
            return "configData";
        } else if (value === "Security Data") {
            return "securityData";
        } else if (value === "Code") {
            return "code"
        } else if (value === "Log") {
            return "log";
        }

        return value;
    }
}