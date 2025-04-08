
export type User = {
    avatar_url: string,
    discriminator: string,
    id: string,
    mod: boolean,
    name: string,

}
/*
{
          "id": {
            "$numberLong": "1358514374624411748"
          },
          "filename": "localhost_5173_logs.png",
          "is_image": true,
          "size": 131326,
          "url": "https://cdn.discordapp.com/attachments/1358202394365923408/1358514374624411748/localhost_5173_logs.png?ex=67f41e9a&is=67f2cd1a&hm=f8364a5b15956e1483367fd3547dc388c2fb1516fe3d2d8ca4a34116e8d83384&",
          "content_type": "image/png"
        }
*/
interface Attachment  {
    id: number
    content_type?: string,
    filename: string,
    // This value is wrong on non openmodmail type attachments
    is_image: boolean,
    url: string,
    size?: number,
}
/*
{
                    "id": attachment.id,
                    "filename": attachment.filename,
                    "type": "openmodmail_s3",
                    "s3": {
                        "object": result.object_name,
                        "bucket": result.bucket_name,
                    },
                    "content_type": attachment.content_type,
                    "width": attachment.width,
                    "height": attachment.height,
                    "description": attachment.description,
                    "size": attachment.size,
                    "uploaded_at": datetime.datetime.now(datetime.timezone.utc),
                }
*/
interface OpenModmailAttachment extends Attachment {
    content_type: string,
    type: "openmodmail_s3",
    s3: {
        bucket: string,
        object: string
    },
    description: string | null,
    size: number,
    uploaded_at: date,
    width: number | null,
    height: number | null,
}

export type Message = {
    author: User,
    attachments: Attachment[] | OpenModmailAttachment[],
    content: string,
    edited?: boolean,
    message_id: string,
    timestamp: string,
    type: "thread_message" | "system" | "internal" | "anonymous",
    nfsw?: boolean,
    open: boolean,
    recipient: User,
    title?: string | null
}

export type ModmailThread = {
    _id: string,
    bot_id: string,
    channel_id: string,
    close_message?: string | null,
    closed_at?: string | null,
    created_at: string,
    closer?: User | null,
    creator: User,
    recipient: User,
    dm_channel_id?: string | null | undefined,
    guild_id: string,
    key: string,
    messages: Message[],
    open: boolean,
    nfsw: boolean,
    title: string | null
}