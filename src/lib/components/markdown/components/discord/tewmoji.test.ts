import { describe, it, expect } from 'vitest';
import { codepointStringFromEmoji } from './tewmoji';

describe('codepointStringFromEmoji', () => {
    it('should return the correct codepoint string for a single emoji', () => {
        const emoji = '💩'; // Pile of Poo emoji
        const result = codepointStringFromEmoji(emoji);
        expect(result).toBe('1f4a9');
    });

    it('should return the correct codepoint string for an emoji with multiple codepoints', () => {
        const emoji = '👨‍👩‍👧‍👦'; // Family emoji
        const result = codepointStringFromEmoji(emoji);
        expect(result).toBe('1f468-200d-1f469-200d-1f467-200d-1f466');
    });

    it('should return the correct codepoint string for an emoji with multiple codepoints', () => {
        const emoji = '👩‍💼'; //Woman Office Worker 
        const result = codepointStringFromEmoji(emoji);
        expect(result).toBe('1f469-200d-1f4bc');
    });

    it('should return an empty string for an empty input', () => {
        const emoji = '';
        const result = codepointStringFromEmoji(emoji);
        expect(result).toBe('');
    });

    // it('should handle invalid input gracefully', () => {
    //     const emoji = 'abc'; // Non-emoji string
    //     const result = codepointStringFromEmoji(emoji);
    //     expect(result).toBe('');
    // });
});