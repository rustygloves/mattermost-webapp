// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

// ***************************************************************
// - [#] indicates a test step (e.g. # Go to a page)
// - [*] indicates an assertion (e.g. * Check the title)
// - Use element ID when selecting an element. Create one if none.
// ***************************************************************

// Stage: @prod
// Group: @accessibility @smoke

import {getAdminAccount} from '../../support/env';
import * as TIMEOUTS from '../../fixtures/timeouts';

describe('Verify Accessibility Support in Channel Sidebar Navigation', () => {
    const sysadmin = getAdminAccount();
    let testUser;
    let testTeam;
    let testChannel;
    let offTopicUrl;

    before(() => {
        let otherUser;
        let otherChannel;

        cy.apiInitSetup().then(({team, channel, user, offTopicUrl: url}) => {
            testUser = user;
            testTeam = team;
            testChannel = channel;
            offTopicUrl = url;
            cy.externalRequest({user: sysadmin, method: 'put', path: `users/${user.id}/roles`, data: {roles: 'system_user system_admin'}});
            return cy.apiCreateChannel(testTeam.id, 'test', 'Test');
        }).then(({channel}) => {
            otherChannel = channel;
            return cy.apiAddUserToChannel(otherChannel.id, testUser.id);
        }).then(() => {
            return cy.apiCreateUser({prefix: 'other'});
        }).then(({user}) => {
            otherUser = user;
            return cy.apiAddUserToTeam(testTeam.id, otherUser.id);
        }).then(() => {
            return cy.apiAddUserToChannel(testChannel.id, otherUser.id);
        }).then(() => {
            return cy.apiAddUserToChannel(otherChannel.id, otherUser.id);
        }).then(() => {
            // # Post messages to have unread messages to test user
            for (let index = 0; index < 5; index++) {
                cy.postMessageAs({sender: otherUser, message: 'This is an old message', channelId: otherChannel.id});
            }
        });
    });

    beforeEach(() => {
        // # Login as test user and visit the off-topic channel
        cy.apiLogin(testUser);
        cy.apiSaveSidebarSettingPreference();
        cy.visit(offTopicUrl);
        cy.get('#postListContent').should('be.visible');
    });

    it('MM-T1470 Verify Tab Support in Channels section', () => {
        // # Create some Public Channels
        Cypress._.times(2, () => {
            cy.apiCreateChannel(testTeam.id, 'public', 'public');
        });

        // # Wait for few seconds
        cy.wait(TIMEOUTS.ONE_SEC);

        // # Press tab to the Add Public Channel button
        cy.uiGetLHSAddChannelButton().focus().tab().tab({shift: true});

        // * Verify if the Plus button has focus
        cy.findByRole('button', {name: 'Add Channel Dropdown'}).should('be.focused');
        cy.focused().tab();

        // * Verify if the Plus button has focus
        cy.findByRole('button', {name: 'Channel Switcher'}).should('be.focused');
        cy.focused().tab();

        // * Verify if focus changes to different channels in Unread section
        cy.get('.SidebarChannel.unread').each((el) => {
            cy.wrap(el).find('.unread-title').should('be.focused');
            cy.focused().tab().tab();
        });

        cy.focused().parent().next().find('.SidebarChannel').each((el, i) => {
            if (i === 0) {
                cy.focused().findByText('CHANNELS');
                cy.focused().tab().tab().tab();
            }

            // * Verify if focus changes to different channels in Channels section
            cy.wrap(el).find('.SidebarLink').should('be.focused');
            cy.focused().tab().tab();
        });
    });

    it('MM-T1472 Verify Tab Support in Direct Messages section', () => {
        const usersPrefixes = ['a', 'c', 'd'];
        usersPrefixes.forEach((prefix) => {
            //# Create users with prefixes in alphabetical order
            cy.apiCreateUser({prefix}).then(({user: newUser}) => {
                cy.apiCreateDirectChannel([testUser.id, newUser.id]).then(({channel}) => {
                    // # Post message in The DM channel
                    cy.postMessageAs({sender: newUser, message: 'test', channelId: channel.id});
                });
            });
        });

        // # Trigger DM with a user
        cy.uiAddDirectMessage().click();
        cy.get('.more-modal__row.clickable').first().click();
        cy.get('#saveItems').click();

        // # Trigger DM with couple of users
        cy.uiAddDirectMessage().click();
        cy.get('.more-modal__row.clickable').first().click();
        cy.get('.more-modal__row.clickable').eq(1).click();
        cy.get('#saveItems').click();

        cy.wait(TIMEOUTS.TWO_SEC);

        // # Press tab to the Create DM button and verify if the Plus button has focus
        cy.uiAddDirectMessage().
            focus().
            tab({shift: true}).tab().
            should('be.focused').and('have.css', 'border-radius', '4px').
            tab({shift: true}).tab({shift: true});

        cy.focused().parent().next().find('.SidebarChannel').each((el, i) => {
            if (i === 0) {
                cy.focused().findByText('DIRECT MESSAGES');
                cy.focused().tab().tab().tab().tab();
            }

            // * Verify if focus changes to different channels in Direct Messages section
            cy.wrap(el).find('.SidebarLink').should('be.focused');
            cy.focused().tab().tab();
        });
    });

    it('MM-T1473 Verify Tab Support in Unreads section', () => {
        // # Press tab from the Main Menu button
        cy.uiGetLHSAddChannelButton().focus().tab().tab();

        // * Verify if focus changes to different channels in Unread section
        cy.get('.SidebarChannel.unread').each((el) => {
            cy.wrap(el).find('.unread-title').should('be.focused');
            cy.focused().tab().tab();
        });
    });

    it('MM-T1474 Verify Tab Support in Favorites section', () => {
        // # Mark few channels as Favorites
        markAsFavorite('off-topic');
        markAsFavorite(testChannel.name);

        // # Press tab from the add channel button down to all unread channels
        cy.uiGetLHSAddChannelButton().focus().tab().tab();
        cy.get('.SidebarChannel.unread').each(() => {
            cy.focused().tab().tab();
        });

        // * Verify if focus changes to different channels in Favorite Channels section
        cy.focused().tab().tab().parent().next().find('.SidebarChannel').each((el, i) => {
            if (i === 0) {
                cy.focused().findByText('FAVORITES');
                cy.focused().tab().tab().tab();
            }

            cy.wrap(el).find('.SidebarLink').should('be.focused');
            cy.focused().tab().tab();
        });
    });

    it('MM-T1475 Verify Up & Down Arrow support in Channel Sidebar', () => {
        cy.apiCreateChannel(testTeam.id, 'public', 'Public', 'O');
        cy.apiCreateChannel(testTeam.id, 'private', 'Private', 'P');

        // # Mark few channels as Favorites
        markAsFavorite('off-topic');
        markAsFavorite(testChannel.name);

        // # Press tab from the Main Menu button
        cy.uiGetLHSAddChannelButton().focus().tab().tab();

        // # Press Down Arrow and then Up Arrow
        cy.get('body').type('{downarrow}{uparrow}');

        // * Verify if Unread Channels section has focus
        cy.uiGetLhsSection('UNREADS').should('be.focused');

        // # Press Down Arrow and check the focus
        cy.get('body').type('{downarrow}');

        // * Verify if Favorite Channels section has focus
        cy.uiGetLhsSection('FAVORITES').should('be.focused');

        // # Press Down Arrow and check the focus
        cy.get('body').type('{downarrow}');

        // * Verify if Public Channels section has focus
        cy.uiGetLhsSection('CHANNELS').should('be.focused');

        // # Press Down Arrow and check the focus
        cy.get('body').type('{downarrow}');

        // * Verify if Direct Messages section has focus
        cy.uiGetLhsSection('DIRECT MESSAGES').should('be.focused');
    });
});

function markAsFavorite(channelName) {
    // # Visit the channel
    cy.get(`#sidebarItem_${channelName}`).click();
    cy.get('#postListContent').should('be.visible');

    // # Remove from Favorites if already set
    cy.get('#channelHeaderInfo').then((el) => {
        if (el.find('#toggleFavorite.active').length) {
            cy.get('#toggleFavorite').click();
        }
    });

    // # mark it as Favorite
    cy.get('#toggleFavorite').click();
}
