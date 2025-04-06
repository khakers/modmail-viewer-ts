import type { Token, TokenizerExtension, TokenizerThis, TokensList } from 'marked';
import {
    ChannelMentionRegex,
    DiscordEmojiRegex,
    EmojiExistsRegex,
    EmojiRegex,
    EveryoneRegex,
    HereRegex,
    RoleMentionRegex,
    SpoilerRegex,
    StrikeThroughRegex,
    SubtextRegex,
    TimestampRegex,
    UnderlineRegex,
    UserMentionRegex
} from './regex';


export const EmojiExtension: TokenizerExtension = {
    name: 'emoji',
    level: 'inline',
    tokenizer: (src) => {
        const match = DiscordEmojiRegex.exec(src);
        if (match && match.groups) {
            const groups = match.groups;
            return {
                type: 'emoji',
                raw: match[0],
                text: match[0],
                animated: groups.animated ?? false,
                name: groups.name,
                id: groups.id
            };
        }
        return undefined;
    }
};

export type EmojiToken = ReturnType<typeof EmojiExtension.tokenizer>;

export const RoleMentionExtension: TokenizerExtension = {
    name: 'roleMention',
    level: 'inline',
    tokenizer: (src) => {
        const match = RoleMentionRegex.exec(src);
        if (match) {
            return {
                type: 'roleMention',
                raw: match[0],
                text: match[0],
                id: match[1]
            };
        }
        return undefined;
    }
};

export const ChannelMentionExtension: TokenizerExtension = {
    name: 'channelMention',
    level: 'inline',
    tokenizer: (src) => {
        const match = ChannelMentionRegex.exec(src);
        if (match) {
            return {
                type: 'channelMention',
                raw: match[0],
                text: match[0],
                id: match[1]
            };
        }
        return undefined;
    }
};

export const UserMentionExtension: TokenizerExtension = {
    name: 'userMention',
    level: 'inline',
    tokenizer: (src) => {
        const match = UserMentionRegex.exec(src);
        if (match) {
            return {
                type: 'userMention',
                raw: match[0],
                text: match[0],
                id: match[1]
            };
        }
        return undefined;
    }
};

export const EveryoneExtension: TokenizerExtension = {
    name: 'everyone',
    level: 'inline',
    tokenizer: (src) => {
        const match = EveryoneRegex.exec(src);
        if (match) {
            return {
                type: 'everyone',
                raw: match[0],
                text: match[0]
            };
        }
        return undefined;
    }
};

export const HereExtension: TokenizerExtension = {
    name: 'here',
    level: 'inline',
    tokenizer: (src) => {
        const match = HereRegex.exec(src);
        if (match) {
            return {
                type: 'here',
                raw: match[0],
                text: match[0]
            };
        }
        return undefined;
    }
};

export const SpoilerExtension: TokenizerExtension = {
    name: 'spoiler',
    level: 'inline',
    start: (src) => {
        for (let index = 0; index < src.length; index++) {
            const element = src[index];
            if (element === '|') {
                return index;
            }
        }
    },
    tokenizer(this: TokenizerThis, src: string, tokens: Token[] | TokensList) {
        const match = SpoilerRegex.exec(src);
        if (match) {
            return {
                type: 'spoiler',
                raw: match[0],
                text: match[1],
                tokens: this.lexer.inlineTokens(match[1])
            };
        }
        return undefined;
    }
};

export const StrikethroughExtension: TokenizerExtension = {
    name: 'strikethrough',
    level: 'inline',
    start: (src) => {
        for (let index = 0; index < src.length; index++) {
            if (src[index] === '~') {
                return index;
            }
        }
    },
    tokenizer(this: TokenizerThis, src: string, tokens: Token[] | TokensList) {
        const match = StrikeThroughRegex.exec(src);
        if (match) {
            return {
                type: 'strikethrough',
                raw: match[0],
                text: match[1],
                tokens: this.lexer.inlineTokens(match[1])
            };
        }
        return undefined;
    }
};

export const UnderlineExtension: TokenizerExtension = {
    name: 'underline',
    level: 'inline',
    tokenizer(this: TokenizerThis, src: string, tokens: Token[] | TokensList) {
        const match = UnderlineRegex.exec(src);
        if (match) {
            return {
                type: 'underline',
                raw: match[0],
                text: match[1],
                tokens: this.lexer.inlineTokens(match[1])
            };
        }
        return undefined;
    }
};

export const TwemojiExtension: TokenizerExtension = {
    name: 'twemoji',
    level: 'inline',
    start(this, src: string) {
        return src.match(EmojiExistsRegex)?.index;
    },
    tokenizer(this: TokenizerThis, src: string, tokens: Token[] | TokensList) {
        const match = EmojiRegex.exec(src);
        if (match) {
            return {
                type: 'twemoji',
                raw: match[0],
                text: match[0],
                name: match[0]
            };
        }
        return undefined;
    }
};

export const TimestampExtension: TokenizerExtension = {
    name: 'timestamp',
    level: 'inline',
    tokenizer: (src) => {
        const match = TimestampRegex.exec(src);
        if (match) {
            return {
                type: 'timestamp',
                raw: match[0],
                text: match[0],
                timestamp: match[1],
                format: match[2]
            };
        }
        return undefined;
    }
};

export const SubtextExtension: TokenizerExtension = {
    name: 'subtext',
    level: 'block',
    tokenizer(this: TokenizerThis, src: string, tokens: Token[] | TokensList) {
        const match = SubtextRegex.exec(src);
        if (match) {
            return {
                type: 'subtext',
                raw: match[0],
                text: match[1],
                tokens: this.lexer.inlineTokens(match[1])
            };
        }
        return undefined;
    }
};

export const extensions = [
    EmojiExtension,
    RoleMentionExtension,
    ChannelMentionExtension,
    UserMentionExtension,
    EveryoneExtension,
    HereExtension,
    SpoilerExtension,
    StrikethroughExtension,
    UnderlineExtension,
    TwemojiExtension,
    TimestampExtension,
    SubtextExtension
];
