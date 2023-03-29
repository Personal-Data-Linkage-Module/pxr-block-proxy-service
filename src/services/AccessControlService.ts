/** Copyright 2022 NEC Corporation
Released under the MIT license.
https://opensource.org/licenses/mit-license.php
*/
/* eslint-disable */
import { Request } from 'express';
import config = require('config');
import OperatorDomain from '../domains/OperatorDomain';
import request = require('request');
import AppError from '../common/AppError';
import { doPostRequest } from '../common/DoRequest';
import ProxyServiceDTO from './dto/ProxyServiceDTO';
import Config from '../common/Config';
const Message = Config.ReadConfig('./config/message.json');
/* eslint-enable */

/**
 * アクセス制御サービス
 */
export default class AccessControlService {
    /**
     * APIトークンを発行する
     * @param proxyServiceDto プロキシーサービスDTO
     */
    static async getToken (proxyServiceDto: ProxyServiceDTO, operator: OperatorDomain, code: any, req: Request): Promise<any[]> {
        const codeProperty = [];
        if (code && typeof code === 'object') {
            if (Array.isArray(code)) {
                codeProperty.push(...code);
            } else {
                codeProperty.push(code);
            }
        }
        const url = config.get('accessControl.token') + '';
        const data = JSON.stringify([{
            caller: {
                blockCode: proxyServiceDto.fromCatalog.code,
                apiUrl: proxyServiceDto.fromPath,
                apiMethod: proxyServiceDto.method,
                userId: operator.loginId,
                operator: {
                    type: operator.type,
                    loginId: operator.loginId,
                    role: operator.roles ? operator.roles : null
                },
                requestBody: req.body
            },
            target: {
                _code: codeProperty.length > 0 ? codeProperty : undefined,
                blockCode: proxyServiceDto.toCatalog.code,
                apiUrl: proxyServiceDto.toPath,
                apiMethod: proxyServiceDto.method
            }
        }]);
        const options: request.CoreOptions = {
            headers: {
                session: operator.encoded,
                accept: 'application/json',
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(data)
            },
            body: data
        };
        // アクセストークンが設定されている場合、ヘッダーにセットしてリクエストを発行
        if (req.headers['access-token']) {
            options.headers['access-token'] = req.headers['access-token'] as string;
        }
        try {
            const result = await doPostRequest(url, options);
            const { statusCode } = result.response;
            if (statusCode === 500 || statusCode === 503) {
                throw new AppError(Message.FAILED_ACCESS_CONTROL_SERVICE, 500);
            }
            if (statusCode !== 200) {
                throw new AppError(Message.NOT_PERMISSION_THIS_REQUEST, 401);
            }
            return result.body;
        } catch (err) {
            if (err instanceof AppError) {
                throw err;
            }
            throw new AppError(
                Message.FAILED_CONNECT_TO_ACCESS_CONTROL_SERVICE, 500, err);
        }
    }

    /**
     * APIトークンを認証する
     * @param token APIトークン
     */
    static async certifyToken (
        token: string,
        method: string,
        toPath: string,
        fromPath: string,
        operator: OperatorDomain
    ) {
        const body = JSON.stringify({
            caller: {
                apiUrl: fromPath
            },
            target: {
                apiUrl: toPath,
                apiMethod: method,
                apiToken: token
            }
        });
        const options: request.CoreOptions = {
            headers: {
                session: operator.encoded,
                'Content-Length': Buffer.byteLength(body),
                'Content-Type': 'application/json',
                accept: 'application/json'
            },
            body: body
        };
        try {
            const result = await doPostRequest(config.get('accessControl.collate'), options);
            const { statusCode } = result.response;
            if (statusCode !== 200) {
                // エラーオブジェクトを生成し、スローする
                throw new AppError(Message.FAILED_TO_COLLATE_TOKEN, 400);
            }
        } catch (err) {
            if (err.name === AppError.NAME) {
                throw err;
            }

            // 接続に失敗した旨を例外として上位にスロー
            throw new AppError(
                Message.FAILED_CONNECT_TO_ACCESS_CONTROL_SERVICE,
                500);
        }
    }
}
