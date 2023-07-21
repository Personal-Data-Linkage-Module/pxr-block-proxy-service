/** Copyright 2022 NEC Corporation
Released under the MIT license.
https://opensource.org/licenses/mit-license.php
*/
/**
 * セッション情報
 */
export namespace Session {
    /**
    * 正常(流通制御)
    */
    export const PXR_ROOT = JSON.stringify({
        sessionId: '494a44bb97aa0ef964f6a666b9019b2d20bf05aa811919833f3e0c0ae2b09b38',
        operatorId: 1,
        type: 3,
        loginId: 'test-user',
        name: 'test-user',
        mobilePhone: '0311112222',
        auth: {
            member: {
                add: true,
                update: true,
                delete: true
            }
        },
        lastLoginAt: '2020-01-01T00:00:00.000+0900',
        attributes: {},
        roles: [
            {
                _value: 1,
                _ver: 1
            }
        ],
        block: {
            _value: 1000110,
            _ver: 1
        },
        actor: {
            _value: 1000001,
            _ver: 1
        }
    });
}
