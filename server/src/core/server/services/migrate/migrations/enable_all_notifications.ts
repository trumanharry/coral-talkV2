import { MongoContext } from "coral-server/data/context";
import Migration from "coral-server/services/migrate/migration";

export default class extends Migration {
  public async up(mongo: MongoContext, tenantID: string) {
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
          "inPageNotifications.onModeration": true,
        },
      }
    );
  }
}
