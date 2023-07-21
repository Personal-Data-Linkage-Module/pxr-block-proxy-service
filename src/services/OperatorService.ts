/** Copyright 2022 NEC Corporation
Released under the MIT license.
https://opensource.org/licenses/mit-license.php
*/
/* eslint-disable */
import config = require('config');
import request = require('request');
import AppError from '../common/AppError';
import OperatorDomain from '../domains/OperatorDomain';
import { application, Request } from 'express';
import { doPostRequest, doGetRequest } from '../common/DoRequest';
import Config from '../common/Config';
import { applicationLogger } from '../common/logging';
const Message = Config.ReadConfig('./config/message.json');
const Condig = Config.ReadConfig('./config/config.json')
/* eslint-enable */

/**
 * オペレーターサービスとの連携クラス
 */
export default class OperatorService {
    /**
     * オペレーターのセッション情報を取得する
     * @param req リクエストオブジェクト
     */
    static async authMe (req: Request): Promise<OperatorDomain> {
        const { cookies } = req;
        const sessionId = cookies[OperatorDomain.TYPE_PERSONAL_KEY]
            ? cookies[OperatorDomain.TYPE_PERSONAL_KEY]
            : cookies[OperatorDomain.TYPE_APPLICATION_KEY]
                ? cookies[OperatorDomain.TYPE_APPLICATION_KEY]
                : cookies[OperatorDomain.TYPE_MANAGER_KEY];
        // Cookieからセッションキーが取得できた場合、オペレーターサービスに問い合わせる
        if (typeof sessionId === 'string' && sessionId.length > 0) {
            const data = JSON.stringify({ sessionId: sessionId });
            const options: request.CoreOptions = {
                headers: {
                    accept: 'application/json',
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(data)
                },
                body: data
            };
            try {
                const result = await doPostRequest(
                    config.get('operatorService.session'),
                    options
                );
                // ステータスコードにより制御
                const { statusCode } = result.response;
                if (statusCode === 204 || statusCode === 400) {
                    throw new AppError(Message.NOT_AUTHORIZED, 401);
                } else if (statusCode === 401) {
                    throw new AppError(Message.IS_NOT_AUTHORIZATION_SESSION, 401);
                } else if (statusCode !== 200) {
                    throw new AppError(Message.FAILED_TAKE_SESSION, 500);
                }
                return new OperatorDomain(result.body);
            } catch (err) {
                if (err.statusCode === 401) {
                    // 401エラーは呼び出し元まで戻す
                    throw err;
                }
                throw new AppError(
                    Message.FAILED_CONNECT_TO_OPERATOR, 500, err);
            }

        // ヘッダーにセッション情報があれば、それを流用する
        } else if (req.headers.session) {
            const [isExternal, isBetweenBlocks, isWithinBlock] = await Promise.all([
                judgeExternal(req.headers),
                judgeBetweenBlocks(req.headers),
                judgeWithinBlock(req.headers)
            ]);
            applicationLogger.debug(JSON.stringify({ isExternal: isExternal, isBetweenBlocks: isBetweenBlocks, isWithinBlock: isWithinBlock }));
            if (isExternal && !(isBetweenBlocks || isWithinBlock)) {
                // 外部通信かつ、Block間あるいはBlock内の通信ではない場合、不正なアクセスのためエラー
                throw new AppError(Message.NOT_AUTHORIZED, 401);
            }

            applicationLogger.debug('headers: ' + JSON.stringify(req.headers));
            let data = decodeURIComponent(req.headers.session + '');
            while (typeof data === 'string') {
                data = JSON.parse(data);
            }
            return new OperatorDomain(data, req.headers.session + '');

        // セッション情報が存在しない場合、未ログインとしてエラーをスローする
        } else {
            throw new AppError(Message.NOT_AUTHORIZED, 401);
        }

        /**
         * headerを参照して、外部からのアクセスかどうか判定する
         * （以下同様functionは、保守性確保のため敢えて分ける。）
         * @param headers
         * @returns
         */
        function judgeExternal (headers: {}) {
            let isExternal = false;
            for (const keyValue of Condig['headersPattern']['external']) {
                if (headers[keyValue.key]) {
                    isExternal = new RegExp(keyValue.value).test(headers[keyValue.key]);
                }
                // キー名と一致するプロパティが存在しない、あるいはプロパティの値が正規表現にマッチしない場合は処理を抜けてfalse判定を返す
                if (!isExternal) {
                    break;
                }
            }
            return isExternal;
        }
        /**
         * headerを参照して、Block間通信かどうか判定する
         * @param headers
         * @returns
         */
        function judgeBetweenBlocks (headers: {}) {
            let isBetweenBlocks = false;
            for (const keyValue of Condig['headersPattern']['betweenBlocks']) {
                if (headers[keyValue.key]) {
                    isBetweenBlocks = new RegExp(keyValue.value).test(headers[keyValue.key]);
                }
                // キー名と一致するプロパティが存在しない、あるいはプロパティの値が正規表現にマッチしない場合は処理を抜けてfalse判定を返す
                if (!isBetweenBlocks) {
                    break;
                }
            }
            return isBetweenBlocks;
        }
        /**
         * headerを参照して、Block内通信かどうか判定する
         * @param headers
         * @returns
         */
        function judgeWithinBlock (headers: {}) {
            let isWithinBlock = false;
            for (const keyValue of Condig['headersPattern']['withinBlock']) {
                if (headers[keyValue.key]) {
                    isWithinBlock = new RegExp(keyValue.value).test(headers[keyValue.key]);
                }
                // キー名と一致するプロパティが存在しない、あるいはプロパティの値が正規表現にマッチしない場合は処理を抜けてfalse判定を返す
                if (!isWithinBlock) {
                    break;
                }
            }
            return isWithinBlock;
        }
    }

    /**
     * 利用者IDと種別からオペレーター情報を取得する
     * @param userId 利用者ID
     * @param type オペレーター種別
     */
    static async takeOperatorWithUserId (userId: string, type: number): Promise<OperatorDomain> {
        const url = `${config.get('operatorService.operator')}?loginId=${userId}&type=${type}`;
        const operator = await this.getOperator(url);
        return operator[0];
    }

    /**
     * オペレーターIDからオペレーター情報を取得する
     * @param operatorId オペレーターID
     */
    static async takeOperatorWithOperatorId (operatorId: number): Promise<OperatorDomain> {
        const url = `${config.get('operatorService.operator')}/${operatorId}`;
        const operator = await this.getOperator(url);
        return operator[0];
    }

    /**
     * オペレーター種別に該当する全オペレーターを取得する
     * @param type オペレーター種別
     */
    static async takeOperatorsWithType (type: number): Promise<OperatorDomain[]> {
        const url = `${config.get('operatorService.operator')}?type=${type}`;
        const operators = await this.getOperator(url);
        return operators;
    }

    /**
     * オペレーターサービスのオペレーターAPIを呼び出す
     * @param url
     */
    private static async getOperator (url: string): Promise<OperatorDomain[]> {
        try {
            const result = await doGetRequest(url, {
                headers: {
                    accept: 'application/json'
                }
            });
            const { statusCode } = result.response;
            if (statusCode === 204 || statusCode === 400) {
                throw new AppError(Message.NOT_EXISTS_OPERATOR, 400);
            } else if (statusCode !== 200) {
                throw new AppError(Message.FAILED_TAKE_OPERATOR, 500);
            }
            if (Array.isArray(result.body)) {
                const r: OperatorDomain[] = [];
                for (const resultBodyElement of result.body) {
                    r.push(new OperatorDomain(resultBodyElement));
                }
                return r;
            }
            return [new OperatorDomain(result.body)];
        } catch (err) {
            if (err instanceof AppError) {
                throw err;
            }
            throw new AppError(
                Message.FAILED_CONNECT_TO_OPERATOR, 500, err);
        }
    }
}
