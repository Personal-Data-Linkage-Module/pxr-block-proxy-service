/** Copyright 2022 NEC Corporation
Released under the MIT license.
https://opensource.org/licenses/mit-license.php
*/
/* eslint-disable */
import express = require('express');
import {
    ExpressMiddlewareInterface,
    Middleware
} from 'routing-controllers';
import { transformAndValidate } from 'class-transformer-validator';
import ProxyReqDto from '../dto/ProxyReqDto';
import AppError from '../../common/AppError';
import Config from '../../common/Config';
const PortMap = Config.ReadConfig('./config/port.json');
const Message = Config.ReadConfig('./config/message.json');
/* eslint-enable */

@Middleware({ type: 'before' })
export default class ProxyValidator implements ExpressMiddlewareInterface {
    /** PATHの正規表現 */
    readonly PATH_REGEX = /^(?!(https?:\/\/))\/{0,1}([\w!?+-_~=;.,*&@#$%()'[\]]{1,}\/{0,})*$/;

    async use (
        request: express.Request, response: express.Response, next: express.NextFunction
    ) {
        const dto = await transformAndValidate(ProxyReqDto, request.query) as ProxyReqDto;

        // 最初のパスを取得
        const firstPath = dto.toPath.match(/^\/*([- 0-9a-zA-Z]{1,}).*$/);

        // パス表現でない場合はエラー
        if ((dto.fromPath && !this.PATH_REGEX.test(encodeURIComponent(dto.fromPath))) ||
            !this.PATH_REGEX.test(encodeURIComponent(dto.toPath)) ||
            !Array.isArray(firstPath) || firstPath.length < 2) {
            throw new AppError(Message.IS_NOT_URL_PATH, 400);
        // ポート番号が取得可能な、登録されているサービスであるか
        } else if (isNaN(PortMap[firstPath[1]])) {
            throw new AppError(Message.NOT_RECOGNIZE_SERVICE, 400);
        }

        next();
    }
}
