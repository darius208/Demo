import NodePushNotifications from 'node-pushnotifications'

const APP_BUNDLE_ID = 'com.app.quiz_english';

class PushNotifications extends NodePushNotifications {
    static instance;
    constructor() {
        super({
            gcm: {
                id: process.env.FIREBASE_SERVER_KEY
            }
        });
    }

    static getInstance() {
        if (PushNotifications.instance) {
            PushNotifications.instance = new PushNotifications();
        }
        return PushNotifications.instance;
    }
}

const getMessage = ({
    title,
    body,
    priority='high',
    badge,
    android_channel_id,
    silent=false,
    pushType='alert',
    threadId,
    custom}) => ({
    title,
    topic: APP_BUNDLE_ID,
    body,
    custom,
    icon: '',
    priority,
    contentAvailable: true,
    delayWhileIdle: true,
    restrictedPackageName: APP_BUNDLE_ID,
    dryRun: false,
    retries: 1,
    badge,
    sound: 'default',
    android_channel_id,
    alert: {
        title,
        body
    },
    silent,
    truncateAtWordEnd: true,
    mutableContent: 0,
    threadId,
    pushType
});

export const sendNotification =  async (tokens, type, messageTitle, messageBody, custom) => {
    try {
        const defaultText = {
            title: 'New article is out!',
            body: 'Open to get more details'
        }

        const data = getMessage({
            title: messageTitle ?? defaultText.title,
            body: messageBody ?? defaultText.body,
            android_channel_id: type,
            threadId: type,
            custom: {
                category: type,
                ...custom,
            },
        });

        const result = await PushNotifications.getInstance().send(tokens, data)
        console.log('result \n', result)
    }catch (error) {
        console.log('error \n', error)
    }
}
