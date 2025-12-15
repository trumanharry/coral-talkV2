# Step-by-Step Plan: Enable All Notifications and Remove Mutual Exclusivity

## Overview
This plan will modify Coral to enable both in-page and email notifications simultaneously for all users, removing the current mutual exclusivity constraint.

## Step 1: Remove Email Notification Blocking Logic

Modify email notification category processors to remove early returns when in-page notifications are enabled:

**Files to modify:**
- `server/src/core/server/services/notifications/email/categories/reply.ts` [1](#3-0) 
- `server/src/core/server/services/notifications/email/categories/featured.ts` [2](#3-1) 
- `server/src/core/server/services/notifications/email/categories/moderation.ts` [3](#3-2) 

**Action:** Remove or comment out these checks:
```typescript
// Remove this block from each file
if (ctx.tenant?.inPageNotifications?.enabled) {
  return null;
}
```

## Step 2: Update Settings Resolver

Modify the `inPageNotifications` resolver in `Settings.ts` to always return active without checking external notifications [4](#3-3) :

```typescript
inPageNotifications: (
  {
    inPageNotifications = {
      enabled: true,
      floatingBellIndicator: true,
      active: true,
    },
  },
  args,
  ctx
) => {
  // Always return active, removing mutual exclusivity
  return { ...inPageNotifications, active: true };
},
```

## Step 3: Update Default User Settings

Modify `findOrCreateUserInput` in `user.ts` to enable all notifications by default [5](#3-4) :

```typescript
notifications: {
  onReply: true,           // Changed from false
  onFeatured: true,        // Changed from false
  onModeration: true,      // Changed from false
  onStaffReplies: true,    // Changed from false
  digestFrequency: GQLDIGEST_FREQUENCY.NONE,
},
```

## Step 4: Remove UI Mutual Exclusivity

### Update Preferences Container
Modify `PreferencesContainer.tsx` to show both notification settings [6](#3-5) :

```typescript
const PreferencesContainer: FunctionComponent<Props> = (props) => {
  return (
    <HorizontalGutter spacing={4}>
      <BioContainer viewer={props.viewer} settings={props.settings} />
      <InPageNotificationSettingsContainer viewer={props.viewer} />
      <EmailNotificationSettingsContainer viewer={props.viewer} />
      <MediaSettingsContainer viewer={props.viewer} settings={props.settings} />
      <IgnoreUserSettingsContainer viewer={props.viewer} />
    </HorizontalGutter>
  );
};
```

### Update Admin Configuration Text
Remove the misleading text in `InPageNotificationsConfig.tsx` that states enabling in-page notifications removes email notifications [7](#3-6) .

## Step 5: Create Migration Script

Create a one-time migration to update existing users:

```typescript
// Add to server/src/core/server/migrations/enableAllNotifications.ts
export async function enableAllNotifications(
  mongo: MongoContext,
  tenantID: string
): Promise<void> {
  await mongo.users().updateMany(
    { tenantID },
    { 
      $set: {
        "notifications.onReply": true,
        "notifications.onFeatured": true,
        "notifications.onStaffReplies": true,
        "notifications.onModeration": true,
        "inPageNotifications.enabled": true,
        "inPageNotifications.onReply.enabled": true,
        "inPageNotifications.onFeatured": true,
        "inPageNotifications.onModeration": true
      }
    }
  );
}
```

## Step 6: Remove or Disable Preference Mutations (Optional)

If you want to completely remove user control over notifications:

**Option A: Remove mutations entirely**
- Remove `updateEmailNotificationSettings` and `updateInPageNotificationSettings` from `Users.ts` [8](#3-7) 
- Remove corresponding mutations from GraphQL schema

**Option B: Keep mutations but hardcode values**
Modify the mutation implementations to always return the enabled settings regardless of input.

## Step 7: Update Test Fixtures

Update test fixtures to reflect the new defaults [9](#3-8) :

```typescript
notifications: {
  onReply: true,           // Changed from false
  onFeatured: true,        // Changed from false
  onModeration: true,      // Changed from false
  onStaffReplies: true,    // Changed from false
  digestFrequency: GQLDIGEST_FREQUENCY.NONE,
},
```

## Step 8: Testing

1. **Unit Tests**: Update existing notification tests to expect both types to be active
2. **Integration Tests**: Verify email notifications are sent even when in-page notifications are enabled
3. **UI Tests**: Ensure both notification settings sections are visible and functional

## Implementation Order

1. Backend changes (Steps 1-3, 5-6)
2. Database migration (Step 5)
3. Frontend changes (Step 4)
4. Test updates (Step 7)
5. End-to-end testing (Step 8)

## Notes

- No database schema changes are required as the data model already supports both notification types [10](#3-9) 
- The GraphQL schema already supports both notification types independently [11](#3-10) 
- After these changes, users will receive both in-page and email notifications for all comment activity by default

Wiki pages you might want to explore:
- [System Architecture (coralproject/talk)](/wiki/coralproject/talk#1.1)
- [User Management (coralproject/talk)](/wiki/coralproject/talk#2.3)

### Citations

**File:** server/src/core/server/services/notifications/email/categories/reply.ts (L22-25)
```typescript
    // Don't send email notification if in-page notifications enabled
    if (ctx.tenant?.inPageNotifications?.enabled) {
      return null;
    }
```

**File:** server/src/core/server/services/notifications/email/categories/featured.ts (L14-17)
```typescript
      // Don't send email notification if in-page notifications enabld
      if (ctx.tenant?.inPageNotifications?.enabled) {
        return null;
      }
```

**File:** server/src/core/server/services/notifications/email/categories/moderation.ts (L16-19)
```typescript
      // Don't send email notification if in-page notifications enabld
      if (ctx.tenant?.inPageNotifications?.enabled) {
        return null;
      }
```

**File:** server/src/core/server/graph/resolvers/Settings.ts (L89-110)
```typescript
  inPageNotifications: (
    {
      inPageNotifications = {
        enabled: true,
        floatingBellIndicator: true,
        active: true,
      },
    },
    args,
    ctx
  ) => {
    // if we have the env var set to enable in-page (internal)
    // notifications, we are active
    //
    // otherwise, the default behaviour is to disable in-page
    // if we have external notifications enabled
    const active =
      !!ctx.config.get("internal_notifications") ||
      !ctx.externalNotifications.active();

    return { ...inPageNotifications, active };
  },
```

**File:** server/src/core/server/models/user/user.ts (L612-619)
```typescript
   * notifications stores the email notification settings for the given User.
   */
  notifications: GQLUserEmailNotificationSettings;

  /**
   * inPageNotifications stores the in-page notification settings for the given User.
   */
  inPageNotifications: GQLUserInPageNotificationSettings;
```

**File:** server/src/core/server/models/user/user.ts (L747-762)
```typescript
    notifications: {
      onReply: false,
      onFeatured: false,
      onModeration: false,
      onStaffReplies: false,
      digestFrequency: GQLDIGEST_FREQUENCY.NONE,
    },
    inPageNotifications: {
      onReply: {
        enabled: true,
        showReplies: GQLInPageNotificationReplyType.ALL,
      },
      onFeatured: true,
      onModeration: true,
      enabled: true,
    },
```

**File:** client/src/core/client/stream/tabs/Profile/Preferences/PreferencesContainer.tsx (L22-31)
```typescript
  const showInPageNotificationSettings =
    !!props.settings.inPageNotifications?.enabled;
  return (
    <HorizontalGutter spacing={4}>
      <BioContainer viewer={props.viewer} settings={props.settings} />
      {showInPageNotificationSettings ? (
        <InPageNotificationSettingsContainer viewer={props.viewer} />
      ) : (
        <EmailNotificationSettingsContainer viewer={props.viewer} />
      )}
```

**File:** client/src/core/client/admin/routes/Configure/sections/General/InPageNotificationsConfig.tsx (L43-48)
```typescript
        Add notifications to Coral. When enabled, commenters can receive
        notifications when they receive all replies, replies only from members
        of your team, when a Pending comment is published. Commenters can
        disable visual notification indicators in their Profile preferences.
        This will remove e-mail notifications.
      </FormFieldDescription>
```

**File:** server/src/core/server/graph/mutators/Users.ts (L275-294)
```typescript
  updateEmailNotificationSettings: async (
    input: WithoutMutationID<GQLUpdateEmailNotificationSettingsInput>
  ) =>
    updateEmailNotificationSettings(
      ctx.mongo,
      ctx.cache,
      ctx.tenant,
      ctx.user!,
      input
    ),
  updateInPageNotificationSettings: async (
    input: WithoutMutationID<GQLUpdateInPageNotificationSettingsInput>
  ) =>
    updateInPageNotificationSettings(
      ctx.mongo,
      ctx.cache,
      ctx.tenant,
      ctx.user!,
      input
    ),
```

**File:** server/src/core/server/test/fixtures.ts (L243-258)
```typescript
    notifications: {
      onReply: false,
      onFeatured: false,
      onModeration: false,
      onStaffReplies: false,
      digestFrequency: GQLDIGEST_FREQUENCY.NONE,
    },
    inPageNotifications: {
      onReply: {
        enabled: true,
        showReplies: GQLInPageNotificationReplyType.ALL,
      },
      onFeatured: true,
      onModeration: true,
      enabled: true,
    },
```

**File:** server/src/core/server/graph/schema/schema.graphql (L3048-3135)
```text
type UserEmailNotificationSettings {
  """
  onReply, when true, will enable email notifications to be sent to users that have
  replies to their comments.
  """
  onReply: Boolean!

  """
  onFeatured, when true, will enable email notifications to be sent to users that have
  their comment's featured.
  """
  onFeatured: Boolean!

  """
  onStaffReplies when true, will enable email notifications to be sent to users that
  have a staff member reply to their comments. These notifications will
  supercede notifications that would have been sent for a basic reply
  notification.
  """
  onStaffReplies: Boolean!

  """
  onModeration when true, will enable email notifications to be sent to users when a
  comment that they wrote that was previously unpublished, becomes published due
  to a moderator action.
  """
  onModeration: Boolean!

  """
  digestFrequency is the frequency to send email notifications.
  """
  digestFrequency: DIGEST_FREQUENCY!
}

enum InPageNotificationReplyType {
  """
  The user wishes to receive in-page notifications from everyone
  """
  ALL

  """
  The user wishes to receive in-page notifications from staff members only
  """
  STAFF
}

type OnReplySettings {
  """
  In-page notifications for replies is enabled
  """
  enabled: Boolean!

  """
  This keeps track of what type of reply the user would like to be notified on when
  in-page reply notifications is enabled
  """
  showReplies: InPageNotificationReplyType!
}

"""
UserInPageNotificationSettings stores the in-page notification settings for a given User.
"""
type UserInPageNotificationSettings {
  """
  enabled, when true, means the in-page notifications updates with notification count;
  when disabled, it still appears and can be clicked but shows no indication of updates
  """
  enabled: Boolean!

  """
  onReply, when true, will enable in-page notifications to be sent to users that have
  replies to their comments.
  """
  onReply: OnReplySettings!

  """
  onFeatured, when true, will enable in-page notifications to be sent to users that have
  their comment's featured.
  """
  onFeatured: Boolean!

  """
  onModeration when true, will enable in-page notifications to be sent to users when a
  comment that they wrote that was previously unpublished, becomes published due
  to a moderator action.
  """
  onModeration: Boolean!
}
```
