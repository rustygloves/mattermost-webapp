// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {AppCallResponseTypes} from 'mattermost-redux/constants/apps';
import {AppCall, AppCallRequest, AppCallValues, AppContext, AppExpand, AppSelectOption} from 'mattermost-redux/types/apps';

export const appsPluginID = 'com.mattermost.apps';

export function createCallContext(
    appID: string,
    location?: string,
    channelID?: string,
    teamID?: string,
    postID?: string,
    rootID?: string,
): AppContext {
    return {
        app_id: appID,
        location,
        channel_id: channelID,
        team_id: teamID,
        post_id: postID,
        root_id: rootID,
    };
}

export function createCallRequest(
    call: AppCall,
    context: AppContext,
    defaultExpand: AppExpand = {},
    values?: AppCallValues,
    rawCommand?: string,
    query?: string,
    selectedField?: string,
): AppCallRequest {
    return {
        ...call,
        context,
        values,
        expand: {
            ...defaultExpand,
            ...call.expand,
        },
        raw_command: rawCommand,
        query,
        selected_field: selectedField,
    };
}

export const makeCallErrorResponse = (errMessage: string) => {
    return {
        type: AppCallResponseTypes.ERROR,
        error: errMessage,
    };
};

export const filterEmptyOptions = (option: AppSelectOption) => option.value && !option.value.match(/^[ \t]+$/);
