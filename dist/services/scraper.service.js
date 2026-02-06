var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import axios from 'axios';
import * as cheerio from 'cheerio';
export class ScraperService {
    fetchHtml(url) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { data } = yield axios.get(url, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                    },
                });
                return data;
            }
            catch (error) {
                console.error(`Error fetching URL ${url}:`, error);
                throw new Error('Failed to fetch URL');
            }
        });
    }
    extractTextContent(html) {
        return __awaiter(this, void 0, void 0, function* () {
            const $ = cheerio.load(html);
            // Remove scripts, styles, and other non-content elements
            $('script').remove();
            $('style').remove();
            $('nav').remove();
            $('footer').remove();
            $('header').remove();
            $('iframe').remove();
            $('noscript').remove();
            // Attempt to target recipe-specific containers if possible, but fallback to body text
            // Common schema.org or microdata structures could be targeted here, 
            // but for fetching raw text for LLM, body text is often sufficient if cleaned.
            // Simplistic cleaning: get all text, collapse whitespace
            const text = $('body').text().replace(/\s+/g, ' ').trim();
            // Limit text length to avoid token limits (rudimentary truncation)
            return text.slice(0, 15000); // 15k chars is usually enough for a recipe page
        });
    }
}
