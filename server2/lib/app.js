"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
//import http, { IncomingMessage, Server, ServerResponse } from "http";
const axios_1 = __importDefault(require("axios"));
const cheerio = __importStar(require("cheerio"));
const http = __importStar(require("http"));
/*
implement your server code here
*/
async function webScrapper(url) {
    const webData = await axios_1.default.get(url);
    const $ = cheerio.load(webData.data);
    const webpageTitle = $("head title").text();
    const webpageDescription = $('head meta[name="description"]').attr("content");
    const webpageImages = [];
    //check the website body tag for all occurences of the image tag and loop through all of them to get their src
    $("body img").each((index, element) => {
        const imageUrl = $(element).attr("src");
        webpageImages.push(imageUrl);
    });
    const output = {
        Title: webpageTitle,
        Description: webpageDescription,
        Images: webpageImages,
    };
    return output;
}
const server = http.createServer((req, res) => {
    if (req.method === "GET") {
        const urlParam = new URL(req.url || "", `http://${req.headers.host}`);
        const url = urlParam.searchParams.get("url");
        //check if a url is passed in as a query
        if (!url) {
            res.writeHead(400, { "Content-Type": "text/json" });
            res.end("error: Bad request - missing url parameter");
        }
        else {
            webScrapper(url)
                .then((data) => {
                res.writeHead(200, { "Content-Type": "text/json" });
                res.end(JSON.stringify(data, null, 2));
            })
                .catch((error) => {
                res.writeHead(404, { "Content-Type": "text/plain" });
                res.end(`${error} Not found: The server cannot find the requested resource`);
            });
        }
    }
});
const port = process.env.PORT || 3009;
server.listen(port, () => {
    console.log(`server is now running at http://localhost:${port}`);
});
