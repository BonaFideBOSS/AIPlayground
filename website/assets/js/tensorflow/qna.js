/**
    * @license
    * Copyright 2023 Google LLC. All Rights Reserved.
    * Licensed under the Apache License, Version 2.0 (the "License");
    * you may not use this file except in compliance with the License.
    * You may obtain a copy of the License at
    *
    * http://www.apache.org/licenses/LICENSE-2.0
    *
    * Unless required by applicable law or agreed to in writing, software
    * distributed under the License is distributed on an "AS IS" BASIS,
    * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
    * See the License for the specific language governing permissions and
    * limitations under the License.
    * =============================================================================
    */
(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('@tensorflow/tfjs-converter'), require('@tensorflow/tfjs-core')) :
    typeof define === 'function' && define.amd ? define(['exports', '@tensorflow/tfjs-converter', '@tensorflow/tfjs-core'], factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.qna = {}, global.tf, global.tf));
}(this, (function (exports, tfconv, tf) { 'use strict';

    /*! *****************************************************************************
    Copyright (c) Microsoft Corporation.

    Permission to use, copy, modify, and/or distribute this software for any
    purpose with or without fee is hereby granted.

    THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
    REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
    AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
    INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
    LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
    OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
    PERFORMANCE OF THIS SOFTWARE.
    ***************************************************************************** */

    function __awaiter(thisArg, _arguments, P, generator) {
        function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
        return new (P || (P = Promise))(function (resolve, reject) {
            function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
            function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
            function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
            step((generator = generator.apply(thisArg, _arguments || [])).next());
        });
    }

    function __generator(thisArg, body) {
        var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
        return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
        function verb(n) { return function (v) { return step([n, v]); }; }
        function step(op) {
            if (f) throw new TypeError("Generator is already executing.");
            while (_) try {
                if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
                if (y = 0, t) op = [op[0] & 2, t.value];
                switch (op[0]) {
                    case 0: case 1: t = op; break;
                    case 4: _.label++; return { value: op[1], done: false };
                    case 5: _.label++; y = op[1]; op = [0]; continue;
                    case 7: op = _.ops.pop(); _.trys.pop(); continue;
                    default:
                        if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                        if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                        if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                        if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                        if (t[2]) _.ops.pop();
                        _.trys.pop(); continue;
                }
                op = body.call(thisArg, _);
            } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
            if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
        }
    }

    var SEPERATOR = '\u2581';
    var UNK_INDEX = 100;
    var CLS_INDEX = 101;
    var CLS_TOKEN = '[CLS]';
    var SEP_INDEX = 102;
    var SEP_TOKEN = '[SEP]';
    var NFKC_TOKEN = 'NFKC';
    var VOCAB_BASE = 'https://tfhub.dev/tensorflow/tfjs-model/mobilebert/1/';
    var VOCAB_URL = VOCAB_BASE + 'processed_vocab.json?tfjs-format=file';
    /**
     * Class for represent node for token parsing Trie data structure.
     */
    var TrieNode = /** @class */ (function () {
        function TrieNode(key) {
            this.key = key;
            this.children = {};
            this.end = false;
        }
        TrieNode.prototype.getWord = function () {
            var output = [];
            var node = this;
            while (node != null) {
                if (node.key != null) {
                    output.unshift(node.key);
                }
                node = node.parent;
            }
            return [output, this.score, this.index];
        };
        return TrieNode;
    }());
    var Trie = /** @class */ (function () {
        function Trie() {
            this.root = new TrieNode(null);
        }
        /**
         * Insert the bert vacabulary word into the trie.
         * @param word word to be inserted.
         * @param score word score.
         * @param index index of word in the bert vocabulary file.
         */
        Trie.prototype.insert = function (word, score, index) {
            var node = this.root;
            var symbols = [];
            for (var _i = 0, word_1 = word; _i < word_1.length; _i++) {
                var symbol = word_1[_i];
                symbols.push(symbol);
            }
            for (var i = 0; i < symbols.length; i++) {
                if (node.children[symbols[i]] == null) {
                    node.children[symbols[i]] = new TrieNode(symbols[i]);
                    node.children[symbols[i]].parent = node;
                }
                node = node.children[symbols[i]];
                if (i === symbols.length - 1) {
                    node.end = true;
                    node.score = score;
                    node.index = index;
                }
            }
        };
        /**
         * Find the Trie node for the given token, it will return the first node that
         * matches the subtoken from the beginning of the token.
         * @param token string, input string to be searched.
         */
        Trie.prototype.find = function (token) {
            var node = this.root;
            var iter = 0;
            while (iter < token.length && node != null) {
                node = node.children[token[iter]];
                iter++;
            }
            return node;
        };
        return Trie;
    }());
    function isWhitespace(ch) {
        return /\s/.test(ch);
    }
    function isInvalid(ch) {
        return (ch.charCodeAt(0) === 0 || ch.charCodeAt(0) === 0xfffd);
    }
    var punctuations = '[~`!@#$%^&*(){}[];:"\'<,.>?/\\|-_+=';
    /** To judge whether it's a punctuation. */
    function isPunctuation(ch) {
        return punctuations.indexOf(ch) !== -1;
    }
    /**
     * Tokenizer for Bert.
     */
    var BertTokenizer = /** @class */ (function () {
        function BertTokenizer() {
        }
        /**
         * Load the vacabulary file and initialize the Trie for lookup.
         */
        BertTokenizer.prototype.load = function () {
            return __awaiter(this, void 0, void 0, function () {
                var _a, vocabIndex, word;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            _a = this;
                            return [4 /*yield*/, this.loadVocab()];
                        case 1:
                            _a.vocab = _b.sent();
                            this.trie = new Trie();
                            // Actual tokens start at 999.
                            for (vocabIndex = 999; vocabIndex < this.vocab.length; vocabIndex++) {
                                word = this.vocab[vocabIndex];
                                this.trie.insert(word, 1, vocabIndex);
                            }
                            return [2 /*return*/];
                    }
                });
            });
        };
        BertTokenizer.prototype.loadVocab = function () {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, tf.util.fetch(VOCAB_URL).then(function (d) { return d.json(); })];
                });
            });
        };
        BertTokenizer.prototype.processInput = function (text) {
            var _this = this;
            var charOriginalIndex = [];
            var cleanedText = this.cleanText(text, charOriginalIndex);
            var origTokens = cleanedText.split(' ');
            var charCount = 0;
            var tokens = origTokens.map(function (token) {
                token = token.toLowerCase();
                var tokens = _this.runSplitOnPunc(token, charCount, charOriginalIndex);
                charCount += token.length + 1;
                return tokens;
            });
            var flattenTokens = [];
            for (var index = 0; index < tokens.length; index++) {
                flattenTokens = flattenTokens.concat(tokens[index]);
            }
            return flattenTokens;
        };
        /* Performs invalid character removal and whitespace cleanup on text. */
        BertTokenizer.prototype.cleanText = function (text, charOriginalIndex) {
            var stringBuilder = [];
            var originalCharIndex = 0, newCharIndex = 0;
            for (var _i = 0, text_1 = text; _i < text_1.length; _i++) {
                var ch = text_1[_i];
                // Skip the characters that cannot be used.
                if (isInvalid(ch)) {
                    originalCharIndex += ch.length;
                    continue;
                }
                if (isWhitespace(ch)) {
                    if (stringBuilder.length > 0 &&
                        stringBuilder[stringBuilder.length - 1] !== ' ') {
                        stringBuilder.push(' ');
                        charOriginalIndex[newCharIndex] = originalCharIndex;
                        originalCharIndex += ch.length;
                    }
                    else {
                        originalCharIndex += ch.length;
                        continue;
                    }
                }
                else {
                    stringBuilder.push(ch);
                    charOriginalIndex[newCharIndex] = originalCharIndex;
                    originalCharIndex += ch.length;
                }
                newCharIndex++;
            }
            return stringBuilder.join('');
        };
        /* Splits punctuation on a piece of text. */
        BertTokenizer.prototype.runSplitOnPunc = function (text, count, charOriginalIndex) {
            var tokens = [];
            var startNewWord = true;
            for (var _i = 0, text_2 = text; _i < text_2.length; _i++) {
                var ch = text_2[_i];
                if (isPunctuation(ch)) {
                    tokens.push({ text: ch, index: charOriginalIndex[count] });
                    count += ch.length;
                    startNewWord = true;
                }
                else {
                    if (startNewWord) {
                        tokens.push({ text: '', index: charOriginalIndex[count] });
                        startNewWord = false;
                    }
                    tokens[tokens.length - 1].text += ch;
                    count += ch.length;
                }
            }
            return tokens;
        };
        /**
         * Generate tokens for the given vocalbuary.
         * @param text text to be tokenized.
         */
        BertTokenizer.prototype.tokenize = function (text) {
            // Source:
            // https://github.com/google-research/bert/blob/88a817c37f788702a363ff935fd173b6dc6ac0d6/tokenization.py#L311
            var outputTokens = [];
            var words = this.processInput(text);
            words.forEach(function (word) {
                if (word.text !== CLS_TOKEN && word.text !== SEP_TOKEN) {
                    word.text = "".concat(SEPERATOR).concat(word.text.normalize(NFKC_TOKEN));
                }
            });
            for (var i = 0; i < words.length; i++) {
                var chars = [];
                for (var _i = 0, _a = words[i].text; _i < _a.length; _i++) {
                    var symbol = _a[_i];
                    chars.push(symbol);
                }
                var isUnknown = false;
                var start = 0;
                var subTokens = [];
                var charsLength = chars.length;
                while (start < charsLength) {
                    var end = charsLength;
                    var currIndex = void 0;
                    while (start < end) {
                        var substr = chars.slice(start, end).join('');
                        var match = this.trie.find(substr);
                        if (match != null && match.end != null) {
                            currIndex = match.getWord()[2];
                            break;
                        }
                        end = end - 1;
                    }
                    if (currIndex == null) {
                        isUnknown = true;
                        break;
                    }
                    subTokens.push(currIndex);
                    start = end;
                }
                if (isUnknown) {
                    outputTokens.push(UNK_INDEX);
                }
                else {
                    outputTokens = outputTokens.concat(subTokens);
                }
            }
            return outputTokens;
        };
        return BertTokenizer;
    }());
    function loadTokenizer() {
        return __awaiter(this, void 0, void 0, function () {
            var tokenizer;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        tokenizer = new BertTokenizer();
                        return [4 /*yield*/, tokenizer.load()];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, tokenizer];
                }
            });
        });
    }

    var MODEL_URL = 'https://tfhub.dev/tensorflow/tfjs-model/mobilebert/1';
    var INPUT_SIZE = 384;
    var MAX_ANSWER_LEN = 32;
    var MAX_QUERY_LEN = 64;
    var MAX_SEQ_LEN = 384;
    var PREDICT_ANSWER_NUM = 5;
    var OUTPUT_OFFSET = 1;
    // This is threshold value for determining if a question is irrelevant to the
    // context. This value comes from the QnA model, and is generated by the
    // training process based on the SQUaD 2.0 dataset.
    var NO_ANSWER_THRESHOLD = 4.3980759382247925;
    var QuestionAndAnswerImpl = /** @class */ (function () {
        function QuestionAndAnswerImpl(modelConfig) {
            this.modelConfig = modelConfig;
            if (this.modelConfig == null) {
                this.modelConfig = { modelUrl: MODEL_URL, fromTFHub: true };
            }
            if (this.modelConfig.fromTFHub == null) {
                this.modelConfig.fromTFHub = false;
            }
        }
        QuestionAndAnswerImpl.prototype.process = function (query, context, maxQueryLen, maxSeqLen, docStride) {
            if (docStride === void 0) { docStride = 128; }
            // always add the question mark to the end of the query.
            query = query.replace(/\?/g, '');
            query = query.trim();
            query = query + '?';
            var queryTokens = this.tokenizer.tokenize(query);
            if (queryTokens.length > maxQueryLen) {
                throw new Error("The length of question token exceeds the limit (".concat(maxQueryLen, ")."));
            }
            var origTokens = this.tokenizer.processInput(context.trim());
            var tokenToOrigIndex = [];
            var allDocTokens = [];
            for (var i = 0; i < origTokens.length; i++) {
                var token = origTokens[i].text;
                var subTokens = this.tokenizer.tokenize(token);
                for (var j = 0; j < subTokens.length; j++) {
                    var subToken = subTokens[j];
                    tokenToOrigIndex.push(i);
                    allDocTokens.push(subToken);
                }
            }
            // The -3 accounts for [CLS], [SEP] and [SEP]
            var maxContextLen = maxSeqLen - queryTokens.length - 3;
            // We can have documents that are longer than the maximum sequence
            // length. To deal with this we do a sliding window approach, where we
            // take chunks of the up to our max length with a stride of
            // `doc_stride`.
            var docSpans = [];
            var startOffset = 0;
            while (startOffset < allDocTokens.length) {
                var length_1 = allDocTokens.length - startOffset;
                if (length_1 > maxContextLen) {
                    length_1 = maxContextLen;
                }
                docSpans.push({ start: startOffset, length: length_1 });
                if (startOffset + length_1 === allDocTokens.length) {
                    break;
                }
                startOffset += Math.min(length_1, docStride);
            }
            var features = docSpans.map(function (docSpan) {
                var tokens = [];
                var segmentIds = [];
                var tokenToOrigMap = {};
                tokens.push(CLS_INDEX);
                segmentIds.push(0);
                for (var i = 0; i < queryTokens.length; i++) {
                    var queryToken = queryTokens[i];
                    tokens.push(queryToken);
                    segmentIds.push(0);
                }
                tokens.push(SEP_INDEX);
                segmentIds.push(0);
                for (var i = 0; i < docSpan.length; i++) {
                    var splitTokenIndex = i + docSpan.start;
                    var docToken = allDocTokens[splitTokenIndex];
                    tokens.push(docToken);
                    segmentIds.push(1);
                    tokenToOrigMap[tokens.length] = tokenToOrigIndex[splitTokenIndex];
                }
                tokens.push(SEP_INDEX);
                segmentIds.push(1);
                var inputIds = tokens;
                var inputMask = inputIds.map(function (id) { return 1; });
                while ((inputIds.length < maxSeqLen)) {
                    inputIds.push(0);
                    inputMask.push(0);
                    segmentIds.push(0);
                }
                return { inputIds: inputIds, inputMask: inputMask, segmentIds: segmentIds, origTokens: origTokens, tokenToOrigMap: tokenToOrigMap };
            });
            return features;
        };
        QuestionAndAnswerImpl.prototype.load = function () {
            return __awaiter(this, void 0, void 0, function () {
                var _a, batchSize, inputIds, segmentIds, inputMask, _b;
                return __generator(this, function (_c) {
                    switch (_c.label) {
                        case 0:
                            _a = this;
                            return [4 /*yield*/, tfconv.loadGraphModel(this.modelConfig.modelUrl, { fromTFHub: this.modelConfig.fromTFHub })];
                        case 1:
                            _a.model = _c.sent();
                            batchSize = 1;
                            inputIds = tf.ones([batchSize, INPUT_SIZE], 'int32');
                            segmentIds = tf.ones([1, INPUT_SIZE], 'int32');
                            inputMask = tf.ones([1, INPUT_SIZE], 'int32');
                            this.model.execute({
                                input_ids: inputIds,
                                segment_ids: segmentIds,
                                input_mask: inputMask,
                                global_step: tf.scalar(1, 'int32')
                            });
                            _b = this;
                            return [4 /*yield*/, loadTokenizer()];
                        case 2:
                            _b.tokenizer = _c.sent();
                            return [2 /*return*/];
                    }
                });
            });
        };
        /**
         * Given the question and context, find the best answers.
         * @param question the question to find answers for.
         * @param context context where the answers are looked up from.
         * @return array of answers
         */
        QuestionAndAnswerImpl.prototype.findAnswers = function (question, context) {
            return __awaiter(this, void 0, void 0, function () {
                var features, inputIdArray, segmentIdArray, inputMaskArray, globalStep, batchSize, result, logits, answers, i;
                var _this = this;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (question == null || context == null) {
                                throw new Error('The input to findAnswers call is null, ' +
                                    'please pass a string as input.');
                            }
                            features = this.process(question, context, MAX_QUERY_LEN, MAX_SEQ_LEN);
                            inputIdArray = features.map(function (f) { return f.inputIds; });
                            segmentIdArray = features.map(function (f) { return f.segmentIds; });
                            inputMaskArray = features.map(function (f) { return f.inputMask; });
                            globalStep = tf.scalar(1, 'int32');
                            batchSize = features.length;
                            result = tf.tidy(function () {
                                var inputIds = tf.tensor2d(inputIdArray, [batchSize, INPUT_SIZE], 'int32');
                                var segmentIds = tf.tensor2d(segmentIdArray, [batchSize, INPUT_SIZE], 'int32');
                                var inputMask = tf.tensor2d(inputMaskArray, [batchSize, INPUT_SIZE], 'int32');
                                return _this.model.execute({
                                    input_ids: inputIds,
                                    segment_ids: segmentIds,
                                    input_mask: inputMask,
                                    global_step: globalStep
                                }, ['start_logits', 'end_logits']);
                            });
                            return [4 /*yield*/, Promise.all([result[0].array(), result[1].array()])];
                        case 1:
                            logits = _a.sent();
                            // dispose all intermediate tensors
                            globalStep.dispose();
                            result[0].dispose();
                            result[1].dispose();
                            answers = [];
                            for (i = 0; i < batchSize; i++) {
                                answers.push(this.getBestAnswers(logits[0][i], logits[1][i], features[i].origTokens, features[i].tokenToOrigMap, context, i));
                            }
                            return [2 /*return*/, answers.reduce(function (flatten, array) { return flatten.concat(array); }, [])
                                    .sort(function (logitA, logitB) { return logitB.score - logitA.score; })
                                    .slice(0, PREDICT_ANSWER_NUM)];
                    }
                });
            });
        };
        /**
         * Find the Best N answers & logits from the logits array and input feature.
         * @param startLogits start index for the answers
         * @param endLogits end index for the answers
         * @param origTokens original tokens of the passage
         * @param tokenToOrigMap token to index mapping
         */
        QuestionAndAnswerImpl.prototype.getBestAnswers = function (startLogits, endLogits, origTokens, tokenToOrigMap, context, docIndex) {
            var _a;
            // Model uses the closed interval [start, end] for indices.
            var startIndexes = this.getBestIndex(startLogits);
            var endIndexes = this.getBestIndex(endLogits);
            var origResults = [];
            startIndexes.forEach(function (start) {
                endIndexes.forEach(function (end) {
                    if (tokenToOrigMap[start + OUTPUT_OFFSET] && tokenToOrigMap[end + OUTPUT_OFFSET] && end >= start) {
                        var length_2 = end - start + 1;
                        if (length_2 < MAX_ANSWER_LEN) {
                            origResults.push({ start: start, end: end, score: startLogits[start] + endLogits[end] });
                        }
                    }
                });
            });
            origResults.sort(function (a, b) { return b.score - a.score; });
            var answers = [];
            for (var i = 0; i < origResults.length; i++) {
                if (i >= PREDICT_ANSWER_NUM ||
                    origResults[i].score < NO_ANSWER_THRESHOLD) {
                    break;
                }
                var convertedText = '';
                var startIndex = 0;
                var endIndex = 0;
                if (origResults[i].start > 0) {
                    _a = this.convertBack(origTokens, tokenToOrigMap, origResults[i].start, origResults[i].end, context), convertedText = _a[0], startIndex = _a[1], endIndex = _a[2];
                }
                else {
                    convertedText = '';
                }
                answers.push({
                    text: convertedText,
                    score: origResults[i].score,
                    startIndex: startIndex,
                    endIndex: endIndex
                });
            }
            return answers;
        };
        /** Get the n-best logits from a list of all the logits. */
        QuestionAndAnswerImpl.prototype.getBestIndex = function (logits) {
            var tmpList = [];
            for (var i = 0; i < MAX_SEQ_LEN; i++) {
                tmpList.push([i, i, logits[i]]);
            }
            tmpList.sort(function (a, b) { return b[2] - a[2]; });
            var indexes = [];
            for (var i = 0; i < PREDICT_ANSWER_NUM; i++) {
                indexes.push(tmpList[i][0]);
            }
            return indexes;
        };
        /** Convert the answer back to original text form. */
        QuestionAndAnswerImpl.prototype.convertBack = function (origTokens, tokenToOrigMap, start, end, context) {
            // Shifted index is: index of logits + offset.
            var shiftedStart = start + OUTPUT_OFFSET;
            var shiftedEnd = end + OUTPUT_OFFSET;
            var startIndex = tokenToOrigMap[shiftedStart];
            var endIndex = tokenToOrigMap[shiftedEnd];
            var startCharIndex = origTokens[startIndex].index;
            var endCharIndex = endIndex < origTokens.length - 1 ?
                origTokens[endIndex + 1].index - 1 :
                origTokens[endIndex].index + origTokens[endIndex].text.length;
            return [
                context.slice(startCharIndex, endCharIndex + 1).trim(), startCharIndex,
                endCharIndex
            ];
        };
        return QuestionAndAnswerImpl;
    }());
    function load(modelConfig) {
        return __awaiter(this, void 0, void 0, function () {
            var mobileBert;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        mobileBert = new QuestionAndAnswerImpl(modelConfig);
                        return [4 /*yield*/, mobileBert.load()];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, mobileBert];
                }
            });
        });
    }

    /** @license See the LICENSE file. */
    // This code is auto-generated, do not modify this file!
    var version = '1.0.2';

    exports.load = load;
    exports.version = version;

    Object.defineProperty(exports, '__esModule', { value: true });

})));
