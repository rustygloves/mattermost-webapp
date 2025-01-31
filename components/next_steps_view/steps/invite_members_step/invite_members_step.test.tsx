// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';
import {shallow, ShallowWrapper, ReactWrapper} from 'enzyme';

import {TestHelper} from 'utils/test_helper';
import {shallowWithIntl, mountWithIntl} from 'tests/helpers/intl-test-helper';

import InviteMembersStep from './invite_members_step';

describe('components/next_steps_view/steps/invite_members_step', () => {
    const baseProps = {
        id: 'invite_members_step',
        team: TestHelper.getTeamMock(),
        onSkip: jest.fn(),
        onFinish: jest.fn(),
        currentUser: TestHelper.getUserMock(),
        expanded: true,
        isAdmin: true,
        isCloud: false,
        isEmailInvitesEnabled: true,
        cloudUserLimit: 10,
        subscriptionStats: {
            remaining_seats: 10,
            is_paid_tier: 'false',
        },
        downloadAppsAsNextStep: false,
        actions: {
            sendEmailInvitesToTeamGracefully: jest.fn(),
            regenerateTeamInviteId: jest.fn(),
            getSubscriptionStats: jest.fn(),
        },
    };

    test('should match snapshot', () => {
        const wrapper = shallow(
            <InviteMembersStep {...baseProps}/>,
        );

        expect(wrapper).toMatchSnapshot();
    });

    test('should set emails based on specified delimiters', () => {
        const wrapper: ShallowWrapper<any, any, any> = shallowWithIntl(
            <InviteMembersStep {...baseProps}/>,
        );

        const emails = ['bob@joe.com', 'guy@dude.com', 'person@email.com'];

        wrapper.instance().onInputChange(emails.join(' '), {} as any);
        expect(wrapper.state('emails').map((email: any) => email.value)).toStrictEqual(emails);
        wrapper.setState({emails: []});

        wrapper.instance().onInputChange(emails.join(','), {} as any);
        expect(wrapper.state('emails').map((email: any) => email.value)).toStrictEqual(emails);
        wrapper.setState({emails: []});

        wrapper.instance().onInputChange(emails.join(':'), {} as any);
        expect(wrapper.state('emails').map((email: any) => email.value)).toStrictEqual([]);
        wrapper.setState({emails: []});
    });

    test('should not allow more than 10 emails', () => {
        const wrapper: ShallowWrapper<any, any, any> = shallowWithIntl(
            <InviteMembersStep {...baseProps}/>,
        );

        const emails = Array(11).fill('a').map((a) => `email_${a}@email.com`);

        wrapper.instance().onInputChange(emails.join(' '), {} as any);
        expect(wrapper.state('emails').map((email: any) => email.value)).toStrictEqual(emails);
        expect(wrapper.state('emailError')).not.toBe(undefined);
        wrapper.setState({emails: [], emailError: undefined});

        wrapper.instance().onInputChange(emails.slice(0, 10).join(' '), {} as any);
        expect(wrapper.state('emails').map((email: any) => email.value)).toStrictEqual(emails.slice(0, 10));
        expect(wrapper.state('emailError')).toBe(undefined);
        wrapper.setState({emails: [], emailError: undefined});
    });

    test('should have limit errors when remaining_seats are 0 and free tier', () => {
        const props = {
            ...baseProps,
            subscriptionStats: {
                remaining_seats: 0,
                is_paid_tier: 'false',
            },
        };
        const wrapper: ShallowWrapper<any, any, any> = shallowWithIntl(
            <InviteMembersStep {...props}/>,
        );

        const emails = Array(11).fill('a').map((a) => `email_${a}@email.com`);

        wrapper.instance().onInputChange(emails.join(' '), {} as any);
        expect(wrapper.state('emails').map((email: any) => email.value)).toStrictEqual(emails);
        expect(wrapper.state('emailError')).toBe('The free tier is limited to 10 members.');
    });

    test('should have NO limit errors when remaining_seats are 0 but paid tier', () => {
        const props = {
            ...baseProps,
            subscriptionStats: {
                remaining_seats: 0,
                is_paid_tier: 'true',
            },
        };
        const wrapper: ShallowWrapper<any, any, any> = shallowWithIntl(
            <InviteMembersStep {...props}/>,
        );

        const emails = Array(11).fill('a').map((a) => `email_${a}@email.com`);

        wrapper.instance().onInputChange(emails.join(' '), {} as any);
        expect(wrapper.state('emails').map((email: any) => email.value)).toStrictEqual(emails);
        expect(wrapper.state('emailError')).toBe(undefined);
    });

    test('do not fire onChange unless it is a removal or a pop', () => {
        const wrapper: ShallowWrapper<any, any, any> = shallowWithIntl(
            <InviteMembersStep {...baseProps}/>,
        );

        const emails = Array(11).fill('a').map((a) => `email_${a}@email.com`);

        wrapper.instance().onChange(emails.map((e) => ({label: e, value: e, error: false})), {action: 'remove-value'});
        expect(wrapper.state('emails')).toStrictEqual(emails.map((e) => ({label: e, value: e, error: false})));

        wrapper.setState({emails: []});
        wrapper.instance().onChange(emails.map((e) => ({label: e, value: e, error: false})), {action: 'set-value'});
        expect(wrapper.state('emails')).toStrictEqual([]);
    });

    test('show correct subtitles depending on subscription being paid or not', () => {
        const paidTierProps = {
            ...baseProps,
            subscriptionStats: {
                remaining_seats: 0, // this value doesn't matter if is_paid_tier is true because no limitations are applied to paid tiers
                is_paid_tier: 'true',
            },
        };

        const freeTierProps = {
            ...baseProps,
            subscriptionStats: {
                remaining_seats: 5,
                is_paid_tier: 'false',
            },
        };
        const paidTierwrapper: ReactWrapper<any, any, any> = mountWithIntl(
            <InviteMembersStep {...paidTierProps}/>,
        );

        const freeTierWrapper: ReactWrapper<any, any, any> = mountWithIntl(
            <InviteMembersStep {...freeTierProps}/>,
        );

        expect(paidTierwrapper.find('.InviteMembersStep__emailInvitations').find('span').at(1).text()).toEqual('You can invite team members using a space or comma between addresses');
        expect(freeTierWrapper.find('.InviteMembersStep__emailInvitations').find('span').at(1).text()).toEqual('You can invite up to 5 team members using a space or comma between addresses');
    });
});
