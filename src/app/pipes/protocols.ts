import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'protocols',
    pure: false
})

export class ProtocolsPipe implements PipeTransform {
    transform(protocols: any[], ...args: any[]): any {
        const selected: any[] = args[0];
        const input: string = args[1].toLowerCase();
        return protocols.filter(protocol => {
            const index = selected.indexOf(protocol.name);
            if (index === -1) {
                if (input) {
                    const protocolName: string = protocol.name.toLowerCase();
                    return protocolName.startsWith(input);
                }
                return true;
            } else {
                return false;
            }
        })
    }
}