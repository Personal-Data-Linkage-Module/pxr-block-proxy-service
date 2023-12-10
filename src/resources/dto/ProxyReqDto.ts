/** Copyright 2022 NEC Corporation
Released under the MIT license.
https://opensource.org/licenses/mit-license.php
*/
/* eslint-disable */
import {
    IsString,
    IsNumber,
    IsOptional,
    IsDefined
} from 'class-validator';
import { Expose, Transform } from 'class-transformer';
import {
    transformToNumber,
    transformToNumberOnlyToBlock,
    transformToStringFromURIEncodedStr
} from '../../common/Transform';
/* eslint-enable */

/**
 * プロキシーAPI リクエストDTO
 */
export default class ProxyReqDto {
    /** 宛先ブロック */
    @Transform(({ value }) => { return transformToStringFromURIEncodedStr(value); })
    @IsString()
    @IsDefined()
    @Expose({ name: 'path' })
        toPath: string;

    /** 宛先API PATH */
    @Transform(({ value }) => { return transformToNumberOnlyToBlock(value); })
    @IsNumber()
    @IsOptional()
    @Expose({ name: 'block' })
        toBlock: number;

    /** 呼出元API PATH */
    @Transform(({ value }) => { return transformToStringFromURIEncodedStr(value); })
    @IsString()
    @IsOptional()
    @Expose({ name: 'from_path' })
        fromPath: string;

    /** 呼出元ブロック */
    @Transform(({ value }) => { return transformToNumber(value); })
    @IsNumber()
    @IsOptional()
    @Expose({ name: 'from_block' })
        fromBlock: number;
}
