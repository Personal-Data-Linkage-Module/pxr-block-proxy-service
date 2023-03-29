/** Copyright 2022 NEC Corporation
Released under the MIT license.
https://opensource.org/licenses/mit-license.php
*/
/**
 *
 *
 *
 * $Date$
 * $Revision$
 * $Author$
 *
 * TEMPLATE VERSION :  76463
 */
import { systemLogger } from './logging';

export default function Log () {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        const originalMethod = descriptor.value;
        descriptor.value = async function (...args: any[]) {
            let result;
            try {
                console.log(`ENTER: ${target.constructor.name}.${propertyKey}`);
                result = await originalMethod.apply(this, args);
            } catch (e) {
                console.log('@Log()');
                systemLogger.error(e);
                throw e;
            } finally {
                console.log(`LEAVE: ${target.constructor.name}.${propertyKey}`);
            }
            return result;
        };
        return descriptor;
    };
}
