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
import CatalogService from './CatalogService';
import EntityOperation from '../repositories/EntityOperation';
import Config from '../common/Config';
const PortMap = Config.ReadConfig('./config/port.json');
const Message = Config.ReadConfig('./config/message.json');
/* eslint-enable */

export default class ReverseProxyService {
    static readonly FIRST_PATH_REGEX = /^\/([a-zA-Z_0-9.-]*).*/;

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
}
