/** Copyright 2022 NEC Corporation
Released under the MIT license.
https://opensource.org/licenses/mit-license.php
*/
/* eslint-disable */
// スタブ構成用モジュールのインポート
import * as fs from 'fs';
// ポート管理するファイルを変更する
const beforeFileLines = fs.readFileSync('./config/port.json', { encoding: 'utf-8' });
const changeLines = fs.readFileSync('./src/tests/mocks.port.json', { encoding: 'utf-8' });
fs.writeFileSync('./config/port.json', changeLines);
// スタブ構成用モジュールのインポート
import * as express from 'express';
import { Server } from 'net';
// テスト用モジュールのインポート
import * as supertest from 'supertest';
import Application from '../index';
import { StubOperatorService } from './StubServer';

/* eslint-enable */

// テスト対象のインスタンス化と起動
const expressApp = Application.express.app;

// Unit対象のURL（ベース）
const baseURI = '/pxr-block-proxy/ind';

// テスト用カタログサービス（内部エラー）
class _StubCatalogServiceRejection {
    _app: express.Express;
    _server: Server;

    constructor (port: number) {
        this._app = express();

        const handler = (req: express.Request, res: express.Response) => {
            res.status(500);
            res.end();
        };
        this._app.get('/catalog/:code', handler);
        this._server = this._app.listen(port);
    }
}

// テスト用カタログサービス（ノーデータエラー）
class _StubCatalogServiceNodata {
    _app: express.Express;
    _server: Server;

    constructor (port: number) {
        this._app = express();

        const handler = (req: express.Request, res: express.Response) => {
            res.status(204);
            res.end();
        };
        this._app.get('/catalog/:code', handler);
        this._server = this._app.listen(port);
    }
}

// テスト用のアクセス制御サービス
class _StubAccessControl {
    _app: express.Express;
    _server: Server;

    constructor (port: number) {
        this._app = express();

        const handler = (req: express.Request, res: express.Response) => {
            res.status(200);
            res.setHeader('Content-Type', 'application/json');
            res.json([
                {
                    apiToken: 'b4ee2feb1251b8e2998ce0c47ccf31542d4416f4967f157b3f35534a9352216c'
                }
            ]);
            res.end();
        };
        this._app.post('/access-control/token', handler);
        this._app.post('/access-control/collate', (req: express.Request, res: express.Response) => {
            res.status(200).json('').end();
        });
        this._server = this._app.listen(port);
    }
}
// アクセス制御サービス起動
const _stubAccessControl = new _StubAccessControl(3015);
const operatorServer = new StubOperatorService();

// PXR-Block Proxy Service APIのAbnormal End ユニットテスト（カタログ取得処理）
describe('PXR-Block-Proxy Service Abnormal API', () => {
    // テスト開始する前に実行する事前処理
    beforeAll(async () => {
        await Application.start();
    });
    // テストがすべて終了したら実行する事後処理
    afterAll(async () => {
        // アプリケーション停止
        Application.stop();

        // スタブサーバーの停止
        _stubAccessControl._server.close();
        operatorServer.server.close();
        // 元のファイル状態に変更する
        fs.writeFileSync('./config/port.json', beforeFileLines);
    });

    // Proxy APIのテスト（カタログサービス 内部エラー）
    describe('プロキシーAPI (GET|POST|PUT|DELETE): ' + baseURI, () => {
        let _stubCatalogService: _StubCatalogServiceRejection;
        // 本テスト項目の実施前に実行する事前処理
        beforeAll(async () => {
            _stubCatalogService = new _StubCatalogServiceRejection(3001);
        });
        // 本テスト項目の実施後に実行する事後処理
        afterAll(async () => {
            _stubCatalogService._server.close();
        });

        // 異常系（カタログサービスにて内部エラー）
        test('異常系: GET（カタログサービスにて内部エラー）', async () => {
            const response = await supertest(expressApp)
                .get(baseURI)
                .set('Cookie', ['operator_type0_session=a'])
                .query({
                    block: 5555555,
                    from_block: 3333333,
                    path: encodeURIComponent('/service-A'),
                    from_path: encodeURIComponent('/service-B')
                })
                .set({
                    'Content-Type': 'application/json',
                    accept: 'application/json'
                });

            // Expect status Internal error code.
            expect(JSON.stringify(response.body))
                .toBe(JSON.stringify({
                    status: 500, message: 'カタログサービスの内部エラーが発生しました'
                }));
            expect(response.status).toBe(500);
        });

        // 異常系（カタログサービスにて内部エラー）
        test('異常系: POST（カタログサービスにて内部エラー）', async () => {
            const response = await supertest(expressApp)
                .post(baseURI)
                .set('Cookie', ['operator_type0_session=a'])
                .query({
                    block: 5555555,
                    from_block: 3333333,
                    path: encodeURIComponent('/service-A'),
                    from_path: encodeURIComponent('/service-B')
                })
                .set({
                    'Content-Type': 'application/json',
                    accept: 'application/json'
                });

            // Expect status Internal error code.
            expect(JSON.stringify(response.body))
                .toBe(JSON.stringify({
                    status: 500, message: 'カタログサービスの内部エラーが発生しました'
                }));
            expect(response.status).toBe(500);
        });

        // 異常系（カタログサービスにて内部エラー）
        test('異常系: PUT（カタログサービスにて内部エラー）', async () => {
            const response = await supertest(expressApp)
                .put(baseURI)
                .set('Cookie', ['operator_type0_session=a'])
                .query({
                    block: 5555555,
                    from_block: 3333333,
                    path: encodeURIComponent('/service-A'),
                    from_path: encodeURIComponent('/service-B')
                })
                .set({
                    'Content-Type': 'application/json',
                    accept: 'application/json'
                });

            // Expect status Internal error code.
            expect(JSON.stringify(response.body))
                .toBe(JSON.stringify({
                    status: 500, message: 'カタログサービスの内部エラーが発生しました'
                }));
            expect(response.status).toBe(500);
        });

        // 異常系（カタログサービスにて内部エラー）
        test('異常系: DELETE（カタログサービスにて内部エラー）', async () => {
            const response = await supertest(expressApp)
                .delete(baseURI)
                .set('Cookie', ['operator_type0_session=a'])
                .query({
                    block: 5555555,
                    from_block: 3333333,
                    path: encodeURIComponent('/service-A'),
                    from_path: encodeURIComponent('/service-B')
                })
                .set({
                    'Content-Type': 'application/json',
                    accept: 'application/json'
                });

            // Expect status Internal error code.
            expect(JSON.stringify(response.body))
                .toBe(JSON.stringify({
                    status: 500, message: 'カタログサービスの内部エラーが発生しました'
                }));
            expect(response.status).toBe(500);
        });
    });

    // Proxy APIのテスト（カタログサービス ノーデータエラー）
    describe('プロキシーAPI (GET|POST|PUT|DELETE): ' + baseURI, () => {
        let _stubCatalogService: _StubCatalogServiceNodata;
        // 本テスト項目の実施前に実行する事前処理
        beforeAll(async () => {
            _stubCatalogService = new _StubCatalogServiceNodata(3001);
        });
        // 本テスト項目の実施後に実行する事後処理
        afterAll(async () => {
            _stubCatalogService._server.close();
        });

        // 異常系（カタログが存在しない）
        test('異常系: GET（カタログが存在しない）', async () => {
            const response = await supertest(expressApp)
                .get(baseURI)
                .set('Cookie', ['operator_type0_session=a'])
                .query({
                    block: 5555555,
                    from_block: 3333333,
                    path: encodeURIComponent('/service-A'),
                    from_path: encodeURIComponent('/service-B')
                })
                .set({
                    'Content-Type': 'application/json',
                    accept: 'application/json'
                });

            // Expect status Bad request.
            expect(JSON.stringify(response.body))
                .toBe(JSON.stringify({
                    status: 400, message: 'リクエストされたカタログは存在しません（コード: 3333333）'
                }));
            expect(response.status).toBe(400);
        });

        // 異常系（カタログが存在しない）
        test('異常系: POST（カタログが存在しない）', async () => {
            const response = await supertest(expressApp)
                .post(baseURI)
                .set('Cookie', ['operator_type0_session=a'])
                .query({
                    block: 5555555,
                    from_block: 3333333,
                    path: encodeURIComponent('/service-A'),
                    from_path: encodeURIComponent('/service-B')
                })
                .set({
                    'Content-Type': 'application/json',
                    accept: 'application/json'
                });

            // Expect status Bad request.
            expect(JSON.stringify(response.body))
                .toBe(JSON.stringify({
                    status: 400, message: 'リクエストされたカタログは存在しません（コード: 3333333）'
                }));
            expect(response.status).toBe(400);
        });

        // 異常系（カタログが存在しない）
        test('異常系: PUT（カタログが存在しない）', async () => {
            const response = await supertest(expressApp)
                .put(baseURI)
                .set('Cookie', ['operator_type0_session=a'])
                .query({
                    block: 5555555,
                    from_block: 3333333,
                    path: encodeURIComponent('/service-A'),
                    from_path: encodeURIComponent('/service-B')
                })
                .set({
                    'Content-Type': 'application/json',
                    accept: 'application/json'
                });

            // Expect status Bad request.
            expect(JSON.stringify(response.body))
                .toBe(JSON.stringify({
                    status: 400, message: 'リクエストされたカタログは存在しません（コード: 3333333）'
                }));
            expect(response.status).toBe(400);
        });

        // 異常系（カタログが存在しない）
        test('異常系: DELETE（カタログが存在しない）', async () => {
            const response = await supertest(expressApp)
                .delete(baseURI)
                .set('Cookie', ['operator_type0_session=a'])
                .query({
                    block: 5555555,
                    from_block: 3333333,
                    path: encodeURIComponent('/service-A'),
                    from_path: encodeURIComponent('/service-B')
                })
                .set({
                    'Content-Type': 'application/json',
                    accept: 'application/json'
                });

            // Expect status Bad request.
            expect(JSON.stringify(response.body))
                .toBe(JSON.stringify({
                    status: 400, message: 'リクエストされたカタログは存在しません（コード: 3333333）'
                }));
            expect(response.status).toBe(400);
        });
    });

    // Proxy APIのテスト（カタログサービス 起動していない）
    describe('プロキシーAPI (GET|POST|PUT|DELETE): ' + baseURI, () => {
        // 異常系（カタログサービスが起動していない）
        test('異常系: GET（カタログサービスが起動していない）', async () => {
            const response = await supertest(expressApp)
                .get(baseURI)
                .set('Cookie', ['operator_type0_session=a'])
                .query({
                    block: 5555555,
                    from_block: 3333333,
                    path: encodeURIComponent('/service-A'),
                    from_path: encodeURIComponent('/service-B')
                })
                .set({
                    'Content-Type': 'application/json',
                    accept: 'application/json'
                });

            // Expect status Internal error code.
            expect(JSON.stringify(response.body))
                .toBe(JSON.stringify({
                    status: 500, message: 'カタログサービスとの接続に失敗しました'
                }));
            expect(response.status).toBe(500);
        });

        // 異常系（カタログサービスが起動していない）
        test('異常系: POST（カタログサービスが起動していない）', async () => {
            const response = await supertest(expressApp)
                .post(baseURI)
                .set('Cookie', ['operator_type0_session=a'])
                .query({
                    block: 5555555,
                    from_block: 3333333,
                    path: encodeURIComponent('/service-A'),
                    from_path: encodeURIComponent('/service-B')
                })
                .set({
                    'Content-Type': 'application/json',
                    accept: 'application/json'
                });

            // Expect status Internal error code.
            expect(JSON.stringify(response.body))
                .toBe(JSON.stringify({
                    status: 500, message: 'カタログサービスとの接続に失敗しました'
                }));
            expect(response.status).toBe(500);
        });

        // 異常系（カタログサービスが起動していない）
        test('異常系: PUT（カタログサービスが起動していない）', async () => {
            const response = await supertest(expressApp)
                .put(baseURI)
                .set('Cookie', ['operator_type0_session=a'])
                .query({
                    block: 5555555,
                    from_block: 3333333,
                    path: encodeURIComponent('/service-A'),
                    from_path: encodeURIComponent('/service-B')
                })
                .set({
                    'Content-Type': 'application/json',
                    accept: 'application/json'
                });

            // Expect status Internal error code.
            expect(JSON.stringify(response.body))
                .toBe(JSON.stringify({
                    status: 500, message: 'カタログサービスとの接続に失敗しました'
                }));
            expect(response.status).toBe(500);
        });

        // 異常系（カタログサービスが起動していない）
        test('異常系: DELETE（カタログサービスが起動していない）', async () => {
            const response = await supertest(expressApp)
                .delete(baseURI)
                .set('Cookie', ['operator_type0_session=a'])
                .query({
                    block: 5555555,
                    from_block: 3333333,
                    path: encodeURIComponent('/service-A'),
                    from_path: encodeURIComponent('/service-B')
                })
                .set({
                    'Content-Type': 'application/json',
                    accept: 'application/json'
                });

            // Expect status Internal error code.
            expect(JSON.stringify(response.body))
                .toBe(JSON.stringify({
                    status: 500, message: 'カタログサービスとの接続に失敗しました'
                }));
            expect(response.status).toBe(500);
        });
    });
});
