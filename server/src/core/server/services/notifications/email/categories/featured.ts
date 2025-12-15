import {
  CommentFeaturedCoralEventPayload,
  CoralEventType,
} from "coral-server/events";
import { hasPublishedStatus } from "coral-server/models/comment";

import { getStoryTitle, getURLWithCommentID } from "coral-server/models/story";
import { NotificationCategory } from "./category";

export const featured: NotificationCategory<CommentFeaturedCoralEventPayload> =
  {
    name: "featured",
    process: async (ctx, input) => {
      // Previously: block email when tenant in-page notifications were enabled.
      // We now allow both in-page and email notifications to be sent concurrently.

      // Get the comment that was featured.
      const comment = await ctx.comments.load(input.data.commentID);
      if (!comment || !hasPublishedStatus(comment) || !comment.authorID) {
        return null;
      }

      // Get the comment's author.
      const author = await ctx.users.load(comment.authorID);
      if (!author) {
        return null;
      }

      // Check to see if the user has this notification type enabled.
      if (!author.notifications.onFeatured) {
        return null;
      }

      // Get the story that this was written on.
      const story = await ctx.stories.load(comment.storyID);
      if (!story) {
        return null;
      }

      // Generate the unsubscribe URL.
      const unsubscribeURL = await ctx.generateUnsubscribeURL(author);

      return {
        userID: author.id,
        template: {
          name: "notification/on-featured",
          context: {
            commentPermalink: getURLWithCommentID(story.url, comment.id),
            storyTitle: getStoryTitle(story),
            storyURL: story.url,
            organizationName: ctx.tenant.organization.name,
            organizationURL: ctx.tenant.organization.url,
            unsubscribeURL,
          },
        },
      };
    },
    events: [CoralEventType.COMMENT_FEATURED],
    digestOrder: 30,
  };
