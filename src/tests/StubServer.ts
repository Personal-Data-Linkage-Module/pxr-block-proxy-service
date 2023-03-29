/** Copyright 2022 NEC Corporation
Released under the MIT license.
https://opensource.org/licenses/mit-license.php
*/
/* eslint-disable */
import fs = require('fs');
import express = require('express');
import request = require('request');
import { Server } from 'net';
/* eslint-enable */

/** テスト用サーバー（宛先サービス） */
export class StubService {
    app: express.Express;
    server: Server;

    constructor (port: number, path: string) {
        this.app = express();
        const handler = (req: express.Request, res: express.Response) => {
            res.status(200).json({});
        };
        this.app.get(path, handler);
        this.app.post(path, handler);
        this.app.post('/service-A/proposal/attach/1486/%E7%94%BB%E5%83%8F%E3%83%87%E3%83%BC%E3%82%BF%EF%BC%91.jpeg', handler);
        this.app.post('/service-A/proposal/attach/1486/image1.jpeg', handler);
        this.app.put(path, handler);
        this.app.delete(path, handler);
        this.server = this.app.listen(port);
    }
}
export class BinaryResponseService {
  app: express.Express;
  server: Server;

  constructor (port: number, path: string) {
      this.app = express();
      const handler = (req: express.Request, res: express.Response) => {
          res.status(200).send(fs.readFileSync('./src/tests/binary/res1.png'));
      };
      this.app.get(path, handler);
      this.app.post(path, handler);
      this.app.put(path, handler);
      this.app.delete(path, handler);
      this.server = this.app.listen(port);
  }
}

/** テスト用異常サーバー（宛先サービス） */
export class StubAbnormalService {
    app: express.Express;
    server: Server;

    constructor (port: number, path: string) {
        this.app = express();
        const handler = (req: express.Request, res: express.Response) => {
            res.status(503).json({});
        };
        this.app.get(path, handler);
        this.app.post(path, handler);
        this.app.put(path, handler);
        this.app.delete(path, handler);
        this.server = this.app.listen(port);
    }
}

/** アクセス制御サービス */
export class StubAccessControlService {
    app: express.Express;
    server: Server;

    constructor () {
        this.app = express();
        this.app.post('/access-control/token', (req: express.Request, res: express.Response) => {
            res.status(200).json([{
                apiToken: 'b4ee2feb1251b8e2998ce0c47ccf31542d4416f4967f157b3f35534a9352216c',
                blockCode: 5555556
            }]);
        });
        this.app.post('/access-control/collate', (req: express.Request, res: express.Response) => {
            res.status(200).json();
        });
        this.server = this.app.listen(3015);
    }
}

export class StubAccessControlMultiKeyService {
    app: express.Express;
    server: Server;

    constructor () {
        this.app = express();
        this.app.post('/access-control/token', (req: express.Request, res: express.Response) => {
            res.status(200).json([{
                apiToken: 'b4ee2feb1251b8e2998ce0c47ccf31542d4416f4967f157b3f35534a9352216c',
                blockCode: 5555555
            }, {
                apiToken: 'b4ee2feb1251b8e2998ce0c47ccf31542d4416f4967f157b3f35534a93522162',
                blockCode: 5555555
            }, {
                apiToken: 'b4ee2feb1251b8e2998ce0c47ccf31542d4416f4967f157b3f35534a9352216c',
                blockCode: 5555555
            }]);
        });
        this.app.post('/access-control/collate', (req: express.Request, res: express.Response) => {
            res.status(200).json();
        });
        this.server = this.app.listen(3015);
    }
}

/** アクセス制御サービス（異常系） */
export class StubAccessControlServiceWithRejection {
    app: express.Express;
    server: Server;

    constructor () {
        this.app = express();

        const handler = (req: express.Request, res: express.Response) => {
            res.status(503).end();
        };
        this.app.post('/access-control/collate', handler);
        this.server = this.app.listen(3015);
    }
}

/** オペレーターサービス */
export class StubOperatorService {
    app: express.Express;
    server: Server;

    constructor (sessionId?: string) {
        this.app = express();
        this.app.post('/operator/session', (req: express.Request, res: express.Response) => {
            if (sessionId === '8947a6a73a6c8f952fe73678d84c2684892921bbdbd3a10fe910a7a8d3bb5aa7') {
                res.status(200).json({
                    sessionId: '8947a6a73a6c8f952fe73678d84c2684892921bbdbd3a10fe910a7a8d3bb5aa7',
                    operatorId: 3,
                    type: 3,
                    loginId: 'member01',
                    lastLoginAt: '2020-02-18 18:04:01.051',
                    attributes: null,
                    roles: null,
                    block: {
                        _value: 1000111,
                        _ver: 1
                    },
                    actor: {
                        _value: 1000001,
                        _ver: 1
                    }
                });
            } else if (sessionId === '8947a6a73a6c8f952fe73678d84c2684892921bbdbd3a10fe910a7a8d3bb5aa6') {
                res.status(200).json({
                    sessionId: '8947a6a73a6c8f952fe73678d84c2684892921bbdbd3a10fe910a7a8d3bb5aa6',
                    operatorId: 3,
                    type: 3,
                    loginId: 'member01',
                    lastLoginAt: '2020-02-18 18:04:01.051',
                    attributes: null,
                    roles: [
                        {
                            _value: '1',
                            _ver: '1'
                        }
                    ],
                    block: {
                        _value: 1000111,
                        _ver: 1
                    },
                    actor: {
                        _value: 1000001,
                        _ver: 1
                    }
                });
            } else {
                res.status(200).json({
                    sessionId: '8947a6a73a6c8f952fe73678d84c2684892921bbdbd3a10fe910a7a8d3bb5aa5',
                    operatorId: 2,
                    type: 0,
                    loginId: 'personal_member01',
                    pxrId: 'personal_member01',
                    lastLoginAt: '2020-02-18 18:04:01.051',
                    attributes: {
                        initialPasswordExpire: '2020-04-01 00:00:00.000'
                    },
                    roles: [
                        {
                            _value: '1',
                            _ver: '1'
                        }
                    ],
                    block: {
                        _value: 1000111,
                        _ver: 1
                    },
                    actor: {
                        _value: 1000001,
                        _ver: 1
                    }
                });
            }
        });
        this.server = this.app.listen(3000);
    }
}

/** カタログサービス */
export class StubCatalogService {
    app: express.Express;
    server: Server;

    constructor () {
        this.app = express();
        this.app.get('/catalog/:code', (req: express.Request, res: express.Response) => {
            res.status(200);
            if (parseInt(req.params.code) === 3333333) {
                res.json({
                    catalogItem: {
                        ns: 'catalog/ext/test-org/block/pxr-root',
                        name: 'PXR-Root-Block',
                        _code: {
                            _value: req.params['code'],
                            _ver: 1
                        },
                        inherit: {
                            _value: 33,
                            _ver: null
                        },
                        description: '流通制御サービスプロバイダー用PXR-Blockの定義です。'
                    },
                    template: {
                        _code: {
                            _value: req.params['code'],
                            _ver: 1
                        },
                        'actor-type': 'pxr-root',
                        'assigned-organization': '流通制御組織',
                        'assignment-status': 'assigned',
                        'base-url': 'localhost',
                        'service-name': 'localhost',
                        id: 'PXR-Root-01'
                    },
                    prop: [
                        {
                            key: 'actor-type',
                            type: {
                                of: 'string',
                                format: null,
                                unit: null,
                                candidate: {
                                    value: [
                                        'pxr-root',
                                        'region-root',
                                        'app',
                                        'wf',
                                        'data-trader',
                                        'consumer'
                                    ]
                                }
                            },
                            description: 'このPXR-Blockを保有する組織の種別'
                        },
                        {
                            key: 'assigned-organization',
                            type: {
                                of: 'string',
                                format: null,
                                unit: null
                            },
                            description: '割当アクター名'
                        },
                        {
                            key: 'assignment-status',
                            type: {
                                of: 'string',
                                format: null,
                                unit: null,
                                candidate: {
                                    value: [
                                        'assigned',
                                        'unassigned'
                                    ]
                                }
                            },
                            description: '割当状態'
                        },
                        {
                            key: 'base-url',
                            type: {
                                of: 'string',
                                format: null,
                                unit: null
                            },
                            description: 'PXR-BlockのベースURL'
                        },
                        {
                            key: 'id',
                            type: {
                                of: 'string',
                                format: null,
                                unit: null
                            },
                            description: 'PXR-Block識別子'
                        }
                    ],
                    attribute: null
                });
            } else if (parseInt(req.params.code) === 123) {
                res.json({
                    catalogItem: {
                        ns: 'catalog/ext/test-org/a/pxr-root',
                        name: 'PXR-Root-Block',
                        _code: {
                            _value: req.params['code'],
                            _ver: 1
                        },
                        inherit: {
                            _value: 33,
                            _ver: null
                        },
                        description: '流通制御サービスプロバイダー用PXR-Blockの定義です。'
                    },
                    template: {
                        _code: {
                            _value: req.params['code'],
                            _ver: 1
                        },
                        'actor-type': 'pxr-root',
                        'assigned-organization': '流通制御組織',
                        'assignment-status': 'assigned',
                        'base-url': 'localhost',
                        'service-name': 'localhost',
                        id: 'PXR-Root-01'
                    },
                    prop: [
                        {
                            key: 'actor-type',
                            type: {
                                of: 'string',
                                format: null,
                                unit: null,
                                candidate: {
                                    value: [
                                        'pxr-root',
                                        'region-root',
                                        'app',
                                        'wf',
                                        'data-trader',
                                        'consumer'
                                    ]
                                }
                            },
                            description: 'このPXR-Blockを保有する組織の種別'
                        },
                        {
                            key: 'assigned-organization',
                            type: {
                                of: 'string',
                                format: null,
                                unit: null
                            },
                            description: '割当アクター名'
                        },
                        {
                            key: 'assignment-status',
                            type: {
                                of: 'string',
                                format: null,
                                unit: null,
                                candidate: {
                                    value: [
                                        'assigned',
                                        'unassigned'
                                    ]
                                }
                            },
                            description: '割当状態'
                        },
                        {
                            key: 'base-url',
                            type: {
                                of: 'string',
                                format: null,
                                unit: null
                            },
                            description: 'PXR-BlockのベースURL'
                        },
                        {
                            key: 'id',
                            type: {
                                of: 'string',
                                format: null,
                                unit: null
                            },
                            description: 'PXR-Block識別子'
                        }
                    ],
                    attribute: null
                });
            } else {
                res.json({
                    catalogItem: {
                        ns: 'catalog/ext/test-org/block/pxr-root',
                        name: 'PXR-Root-Block',
                        _code: {
                            _value: req.params['code'],
                            _ver: 1
                        },
                        inherit: {
                            _value: 33,
                            _ver: null
                        },
                        description: '流通制御サービスプロバイダー用PXR-Blockの定義です。'
                    },
                    template: {
                        _code: {
                            _value: req.params['code'],
                            _ver: 1
                        },
                        'actor-type': 'pxr-root',
                        'assigned-organization': '流通制御組織',
                        'assignment-status': 'assigned',
                        'base-url': 'localhost',
                        'service-name': 'localhost',
                        id: 'PXR-Root-01'
                    },
                    prop: [
                        {
                            key: 'actor-type',
                            type: {
                                of: 'string',
                                format: null,
                                unit: null,
                                candidate: {
                                    value: [
                                        'pxr-root',
                                        'region-root',
                                        'app',
                                        'wf',
                                        'data-trader',
                                        'consumer'
                                    ]
                                }
                            },
                            description: 'このPXR-Blockを保有する組織の種別'
                        },
                        {
                            key: 'assigned-organization',
                            type: {
                                of: 'string',
                                format: null,
                                unit: null
                            },
                            description: '割当アクター名'
                        },
                        {
                            key: 'assignment-status',
                            type: {
                                of: 'string',
                                format: null,
                                unit: null,
                                candidate: {
                                    value: [
                                        'assigned',
                                        'unassigned'
                                    ]
                                }
                            },
                            description: '割当状態'
                        },
                        {
                            key: 'base-url',
                            type: {
                                of: 'string',
                                format: null,
                                unit: null
                            },
                            description: 'PXR-BlockのベースURL'
                        },
                        {
                            key: 'id',
                            type: {
                                of: 'string',
                                format: null,
                                unit: null
                            },
                            description: 'PXR-Block識別子'
                        }
                    ],
                    attribute: null
                });
            }
            res.end();
        });
        this.server = this.app.listen(3001);
    }
}

export class StubCatalogServiceIsInferno {
    app: express.Express;
    server: Server;

    constructor () {
        this.app = express();
        this.app.get('/catalog/:code', (req: express.Request, res: express.Response) => {
            res.status(200);
            if (parseInt(req.params.code) === 3333333) {
                res.json({
                    catalogItem: {
                        ns: 'catalog/ext/test-org/block/pxr-root',
                        name: 'PXR-Root-Block',
                        _code: {
                            _value: req.params['code'],
                            _ver: 1
                        },
                        inherit: {
                            _value: 33,
                            _ver: null
                        },
                        description: '流通制御サービスプロバイダー用PXR-Blockの定義です。'
                    },
                    template: {
                        _code: {
                            _value: req.params['code'],
                            _ver: 1
                        },
                        'actor-type': 'pxr-root',
                        'assigned-organization': '流通制御組織',
                        'assignment-status': 'assigned',
                        'base-url': 'localhost',
                        'service-name': 'localhost-service',
                        id: 'PXR-Root-01'
                    },
                    prop: [
                        {
                            key: 'actor-type',
                            type: {
                                of: 'string',
                                format: null,
                                unit: null,
                                candidate: {
                                    value: [
                                        'pxr-root',
                                        'region-root',
                                        'app',
                                        'wf',
                                        'data-trader',
                                        'consumer'
                                    ]
                                }
                            },
                            description: 'このPXR-Blockを保有する組織の種別'
                        },
                        {
                            key: 'assigned-organization',
                            type: {
                                of: 'string',
                                format: null,
                                unit: null
                            },
                            description: '割当アクター名'
                        },
                        {
                            key: 'assignment-status',
                            type: {
                                of: 'string',
                                format: null,
                                unit: null,
                                candidate: {
                                    value: [
                                        'assigned',
                                        'unassigned'
                                    ]
                                }
                            },
                            description: '割当状態'
                        },
                        {
                            key: 'base-url',
                            type: {
                                of: 'string',
                                format: null,
                                unit: null
                            },
                            description: 'PXR-BlockのベースURL'
                        },
                        {
                            key: 'id',
                            type: {
                                of: 'string',
                                format: null,
                                unit: null
                            },
                            description: 'PXR-Block識別子'
                        }
                    ],
                    attribute: null
                });
            } else if (parseInt(req.params.code) === 123) {
                res.json({
                    catalogItem: {
                        ns: 'catalog/ext/test-org/a/pxr-root',
                        name: 'PXR-Root-Block',
                        _code: {
                            _value: req.params['code'],
                            _ver: 1
                        },
                        inherit: {
                            _value: 33,
                            _ver: null
                        },
                        description: '流通制御サービスプロバイダー用PXR-Blockの定義です。'
                    },
                    template: {
                        _code: {
                            _value: req.params['code'],
                            _ver: 1
                        },
                        'actor-type': 'pxr-root',
                        'assigned-organization': '流通制御組織',
                        'assignment-status': 'assigned',
                        'base-url': 'localhost',
                        'service-name': 'localhost-service',
                        id: 'PXR-Root-01'
                    },
                    prop: [
                        {
                            key: 'actor-type',
                            type: {
                                of: 'string',
                                format: null,
                                unit: null,
                                candidate: {
                                    value: [
                                        'pxr-root',
                                        'region-root',
                                        'app',
                                        'wf',
                                        'data-trader',
                                        'consumer'
                                    ]
                                }
                            },
                            description: 'このPXR-Blockを保有する組織の種別'
                        },
                        {
                            key: 'assigned-organization',
                            type: {
                                of: 'string',
                                format: null,
                                unit: null
                            },
                            description: '割当アクター名'
                        },
                        {
                            key: 'assignment-status',
                            type: {
                                of: 'string',
                                format: null,
                                unit: null,
                                candidate: {
                                    value: [
                                        'assigned',
                                        'unassigned'
                                    ]
                                }
                            },
                            description: '割当状態'
                        },
                        {
                            key: 'base-url',
                            type: {
                                of: 'string',
                                format: null,
                                unit: null
                            },
                            description: 'PXR-BlockのベースURL'
                        },
                        {
                            key: 'id',
                            type: {
                                of: 'string',
                                format: null,
                                unit: null
                            },
                            description: 'PXR-Block識別子'
                        }
                    ],
                    attribute: null
                });
            } else {
                res.json({
                    catalogItem: {
                        ns: 'catalog/ext/test-org/block/pxr-root',
                        name: 'PXR-Root-Block',
                        _code: {
                            _value: req.params['code'],
                            _ver: 1
                        },
                        inherit: {
                            _value: 33,
                            _ver: null
                        },
                        description: '流通制御サービスプロバイダー用PXR-Blockの定義です。'
                    },
                    template: {
                        _code: {
                            _value: req.params['code'],
                            _ver: 1
                        },
                        'actor-type': 'pxr-root',
                        'assigned-organization': '流通制御組織',
                        'assignment-status': 'assigned',
                        'base-url': 'localhost',
                        'service-name': 'localhost-service',
                        id: 'PXR-Root-01'
                    },
                    prop: [
                        {
                            key: 'actor-type',
                            type: {
                                of: 'string',
                                format: null,
                                unit: null,
                                candidate: {
                                    value: [
                                        'pxr-root',
                                        'region-root',
                                        'app',
                                        'wf',
                                        'data-trader',
                                        'consumer'
                                    ]
                                }
                            },
                            description: 'このPXR-Blockを保有する組織の種別'
                        },
                        {
                            key: 'assigned-organization',
                            type: {
                                of: 'string',
                                format: null,
                                unit: null
                            },
                            description: '割当アクター名'
                        },
                        {
                            key: 'assignment-status',
                            type: {
                                of: 'string',
                                format: null,
                                unit: null,
                                candidate: {
                                    value: [
                                        'assigned',
                                        'unassigned'
                                    ]
                                }
                            },
                            description: '割当状態'
                        },
                        {
                            key: 'base-url',
                            type: {
                                of: 'string',
                                format: null,
                                unit: null
                            },
                            description: 'PXR-BlockのベースURL'
                        },
                        {
                            key: 'id',
                            type: {
                                of: 'string',
                                format: null,
                                unit: null
                            },
                            description: 'PXR-Block識別子'
                        }
                    ],
                    attribute: null
                });
            }
            res.end();
        });
        this.server = this.app.listen(3001);
    }
}

/** カタログサービス（異常系） */
export class StubCatalogServiceWithRejection {
    app: express.Express;
    server: Server;

    constructor () {
        this.app = express();

        const handler = (req: express.Request, res: express.Response) => {
            res.status(503);
            res.end();
        };
        this.app.post('/access-control/token', handler);
        this.app.post('/access-control/collate', (req: express.Request, res: express.Response) => {
            res.status(200).json('').end();
        });
        this.server = this.app.listen(3001);
    }
}

/** リバースプロキシーAPI単体 */
export class StubReverseProxyAPI {
    app: express.Express;
    server: Server;

    constructor () {
        this.app = express();
        const handler = async (req: express.Request, res: express.Response) => {
            try {
                const path = decodeURIComponent(<string>req.query.path);
                if (path === '/service-F') {
                    res.status(400);
                    res.end();
                    return;
                }
                const port =
                    path === '/service-D'
                        ? 6666 : path === '/service-C'
                            ? 5555 : path === '/service-B'
                                ? 4444 : 3333;
                const options: request.CoreOptions = {
                    host: 'localhost',
                    port: port
                };
                const result = await (() => {
                    return new Promise<any>((resolve, reject) => {
                        request.get(
                            `http://localhost:${port}${path}`,
                            options,
                            (error: Error, response: request.Response, body: any) => {
                                if (error) {
                                    reject(error);
                                    return;
                                }
                                resolve({
                                    response: response,
                                    body: body
                                });
                            }
                        );
                    });
                })();
                res.status(parseInt(result.response.statusCode));
                res.json(result.body);
            } catch (err) {
                res.status(404);
                res.end();
            }
        };
        this.app.get('/pxr-block-proxy/reverse', handler);
        this.app.post('/pxr-block-proxy/reverse', handler);
        this.app.put('/pxr-block-proxy/reverse', handler);
        this.app.delete('/pxr-block-proxy/reverse', handler);
        this.server = this.app.listen(4003);
    }
}
