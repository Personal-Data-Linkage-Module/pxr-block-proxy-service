/** Copyright 2022 NEC Corporation
Released under the MIT license.
https://opensource.org/licenses/mit-license.php
*/
/* eslint-disable */
import { Request } from 'express';
import ProxyReqDto from '../resources/dto/ProxyReqDto';
import OperatorDomain from '../domains/OperatorDomain';
import request = require('request');
import AppError from '../common/AppError';
import { doGetRequest, doPostRequest, doPutRequest, doDeleteRequest } from '../common/DoRequest';
import ProxyLog from '../repositories/postgres/ProxyLog';
import EntityOperation from '../repositories/EntityOperation';
import Config from '../common/Config';
const PortMap = Config.ReadConfig('./config/port.json');
const Message = Config.ReadConfig('./config/message.json');
/* eslint-enable */

export default class ReverseProxyService {
    static readonly FIRST_PATH_REGEX = /^\/([a-zA-Z_0-9.-]*).*/;
    static readonly THING_BULK = 'thing-bulk';
    static readonly SOURCEID_STORE = 'sourceid-store';

    /**
     * 対象のサービスへのリクエスト明細を発行
     * @param req リクエスト情報
     * @param dto リクエスト情報
     * @param operator オペレーター情報
     */
    static async issueDetail (req: Request, dto: ProxyReqDto): Promise<{
        url: string,
        options: request.CoreOptions
    }> {
        const data = req.body instanceof Buffer ? req.body : JSON.stringify(req.body);
        const port = PortMap[dto.toPath.match(this.FIRST_PATH_REGEX)[1]];
        const options: request.CoreOptions = {
            headers: req.headers,
            body: data,
            port: port,
            host: 'localhost'
        };
        options.headers.token = undefined;
        options.headers['content-length'] = Buffer.byteLength(data);

        let toPath = dto.toPath;
        const path = dto.toPath.match(/^(\/.+\?)(.+)$/);
        if (path && path.length > 1) {
            toPath = path[1];
            let query = path[2];
            while (true) {
                const queryKey = query.match(/^(&?.+?=)(.+)$/);
                toPath = toPath + queryKey[1];
                const queryValue = queryKey[2].match(/^(.+?(?=&))(.+)$/);
                if (!Array.isArray(queryValue)) {
                    toPath = toPath + encodeURIComponent(queryKey[2]);
                    break;
                }
                toPath = toPath + encodeURIComponent(queryValue[1]);
                query = queryValue[2];
            }
        }
        // バイナリDL用の設定
        if (dto.toPath.match(/^\/binary-manage\/download\/.+\/\d+\/?$|^\/info-account-manage\/proposal\/attach\/\d+\/?$/)) {
            options.headers.accept = 'application/octet-stream';
            options.encoding = null;
        }

        const detail = {
            url: `http://localhost:${port}${toPath}`,
            options: options
        };
        return detail;
    }

    /**
     * 対象のAPIを呼び出す
     * @param detail 明細
     * @param method リクエストメソッド
     */
    static async call (
        detail: { url: string, options: request.CoreOptions }, method: 'GET' | 'POST' | 'PUT' | 'DELETE'
    ): Promise<{
        response: request.Response;
        body: any;
    }> {
        try {
            let result;
            if (method === 'GET') {
                result = await doGetRequest(detail.url, detail.options);
            } else if (method === 'POST') {
                // 宛先がデータ提供契約申込添付ファイル登録 (パラメータに日本語を含む可能性あり) の場合はURIエンコード
                if ((detail.url.indexOf('/proposal/attach/') > 0)) {
                    result = await doPostRequest(encodeURI(detail.url), detail.options);
                } else {
                    result = await doPostRequest(detail.url, detail.options);
                }
            } else if (method === 'PUT') {
                result = await doPutRequest(detail.url, detail.options);
            } else {
                result = await doDeleteRequest(detail.url, detail.options);
            }
            return result;
        } catch (err) {
            throw new AppError(Message.FAILED_CONNECT_TO_CALL_TARGET, 500);
        }
    }

    /**
     * ログとしてリクエスト情報を保存する
     * @param dto リクエスト情報
     * @param operator オペレーター情報
     * @param method GET | POST | PUT | DELETE
     */
    static async saveLog (dto: ProxyReqDto, operator: OperatorDomain, method: string) {
        const entity = new ProxyLog();
        entity.type = 1;
        entity.apiMethod = method;
        entity.callerBlockCatalogCode = dto.fromBlock;
        entity.callerBlockCatalogVersion = 1;
        entity.callerApiUrl = dto.fromPath;
        entity.destinationBlockCatalogCode = dto.toBlock;
        entity.destinationBlockCatalogVersion = 1;
        entity.destinationApiUrl = dto.toPath;
        entity.createdBy = operator.loginId;
        entity.updatedBy = operator.loginId;
        await EntityOperation.saveEntity(entity);
    }

    /**
     * 共有のレスポンスのフィルタ処理を行う
     * @param responseBody
     * @param parameter
     */
    static filterShareResponse (responseBody: any, parameter: string) {
        const body = responseBody;
        if (parameter) {
            let filterInfo = null;
            try {
                filterInfo = JSON.parse(parameter);
            } catch (err) {
                // 無効なパラメータの場合はフィルタ処理を行わない
                return body;
            }

            if (body.document && body.document.length > 0) {
                if (filterInfo && filterInfo.document && filterInfo.document.length > 0) {
                    const filteredDocument = [];
                    for (const doc of body.document) {
                        if (filterInfo.document.some((elem: { _value: number; _ver: number; }) => elem._value === Number(doc.code.value._value) && elem._ver === Number(doc.code.value._ver))) {
                            filteredDocument.push(doc);
                        }
                    }
                    body.document = filteredDocument;
                } else {
                    body.document = [];
                }
            }

            if (body.event && body.event.length > 0) {
                if (filterInfo && filterInfo.event && filterInfo.event.length > 0) {
                    const filteredEvent = [];
                    for (const eve of body.event) {
                        if (filterInfo.event.some((elem: { _value: number; _ver: number; }) => elem._value === Number(eve.code.value._value) && elem._ver === Number(eve.code.value._ver))) {
                            if (eve.thing && eve.thing.length > 0) {
                                const filteredEveThing = [];
                                if (filterInfo && filterInfo.thing && filterInfo.thing.length > 0) {
                                    for (const thi of eve.thing) {
                                        if (filterInfo.thing.some((elem: { _value: number; _ver: number; }) => elem._value === Number(thi.code.value._value) && elem._ver === Number(thi.code.value._ver))) {
                                            filteredEveThing.push(thi);
                                        }
                                    }
                                }
                                eve.thing = filteredEveThing.length > 0 ? filteredEveThing : null;
                            }
                            filteredEvent.push(eve);
                        }
                    }
                    body.event = filteredEvent;
                } else {
                    body.event = [];
                }
            }

            if (body.thing && body.thing.length > 0) {
                if (filterInfo && filterInfo.thing && filterInfo.thing.length > 0) {
                    const filteredThing = [];
                    for (const thi of body.thing) {
                        if (filterInfo.thing.some((elem: { _value: number; _ver: number; }) => elem._value === Number(thi.code.value._value) && elem._ver === Number(thi.code.value._ver))) {
                            filteredThing.push(thi);
                        }
                    }
                    body.thing = filteredThing;
                } else {
                    body.thing = [];
                }
            }
        }
        return body;
    }

    /**
     * 蓄積リクエストのフィルタ処理を行う
     * @param requestBody リクエストボディ
     * @param parameter 蓄積可能なデータ種
     * @param filterType モノ一括/ソースID蓄積
     */
    static filterStoreRequest (requestBody: any, parameter: string, filterType: 'thing-bulk' | 'sourceid-store') {
        let filterInfo = null;
        if (parameter) {
            try {
                filterInfo = JSON.parse(parameter);
            } catch (err) {
                // 無効なパラメータの場合はフィルタ処理を行わない
                return requestBody;
            }
        }

        // thing/bulk
        if (filterType === this.THING_BULK) {
            const reqBody = [];
            for (const thing of requestBody) {
                if ((filterInfo.some((elem: { _value: number; _ver: number; }) => elem._value === Number(thing.code.value._value) && elem._ver === Number(thing.code.value._ver)))) {
                    reqBody.push(thing);
                }
            }
            // フィルタしたリクエストを返却
            return reqBody;
        }

        // sourceid-store
        if (filterType === this.SOURCEID_STORE) {
            const reqBody = [];
            for (const req of requestBody) {
                const body = req;
                if (req.document &&
                    (filterInfo.some((elem: { _value: number; _ver: number; }) =>
                        elem._value === Number(req.document.code.value._value) &&
                        elem._ver === Number(req.document.code.value._ver)))) {
                    body['document'] = req.document;
                }

                const filteredEvent = [];
                for (const eve of req.event) {
                    if (filterInfo.some((elem: { _value: number; _ver: number; }) => elem._value === Number(eve.code.value._value) && elem._ver === Number(eve.code.value._ver))) {
                        if (eve.thing && eve.thing.length > 0) {
                            const filteredEveThing = [];
                            for (const thi of eve.thing) {
                                if (filterInfo.some((elem: { _value: number; _ver: number; }) => elem._value === Number(thi.code.value._value) && elem._ver === Number(thi.code.value._ver))) {
                                    filteredEveThing.push(thi);
                                }
                            }
                            eve.thing = filteredEveThing.length > 0 ? filteredEveThing : null;
                        }
                        if (eve.thing) {
                            filteredEvent.push(eve);
                        }
                    }
                }
                body['event'] = filteredEvent;
                reqBody.push(body);
            }
            // フィルタしたリクエストを返却
            return reqBody;
        }
    }
}
