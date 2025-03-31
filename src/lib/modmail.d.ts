
export type User = {
    avatar_url: string,
    discriminator: string,
    id: string,
    mod: boolean,
    name: string,

}

type Attachment = {
    content_type?: string,
    description?: string | null,
    filename: string,
    height: number,
    id: number
    // This value is wrong
    is_image?: boolean,
    uploaded_at?: date,
    url?: string,
    width: number | null
}

export type Message = {
    author: User,
    attachments: Attachment[],
    content: string,
    edited?: string,
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