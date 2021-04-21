// const HtmlWebpackPlugin = require("html-webpack-plugin");
const { execSync } = require("child_process");
const SymlinkWebpackPlugin = require("symlink-webpack-plugin");

const UUID = process.env.UUID || execSync("git rev-parse --short HEAD").toString().trim();

console.log(`COMPILING Holodex UI Revision ${UUID}`);

module.exports = {
    chainWebpack: (config) => {
        if (process.env.NODE_ENV === "production") {
            config.plugin("html-index").tap((opts) => {
                opts[0].filename = `index.${UUID}.html`;
                return opts;
            });
        }

        return config;
    },
    configureWebpack: {
        plugins: [new SymlinkWebpackPlugin({ origin: `index.${UUID}.html`, symlink: "index.html" })],
    },
    css: {
        extract: process.env.NODE_ENV !== "production" ? undefined : { ignoreOrder: true },
    },
    pages: {
        index: {
            entry: "src/main.ts",
            title: "Holodex",
        },
    },
    pwa: {
        name: "Holodex",
        themeColor: "#42a5f5",
        msTileColor: "#42a5f5",
        appleMobileWebAppCapable: "yes",
        manifestOptions: {
            display: "standalone",
            backgroundColor: "#215183",
        },
        appleMobileWebAppStatusBarStyle: "black-translucent",
        scope: "/",
        start_url: "/?utm_source=homescreen",
        workboxOptions: {
            directoryIndex: `index.${UUID}.html`,
            runtimeCaching: [
                {
                    urlPattern: new RegExp("https://fonts.(?:googleapis|gstatic).com/(.*)"),
                    handler: "CacheFirst",
                    options: {
                        cacheName: "google-fonts",
                        expiration: {
                            maxEntries: 30,
                        },
                        cacheableResponse: {
                            statuses: [0, 200],
                        },
                    },
                },
                {
                    urlPattern: new RegExp("https://yt3.ggpht.com/(a/|ytc/)(.*)=s40-c-k-c0x00ffffff-no-rj-mo(.*)"),
                    handler: "CacheFirst",
                    options: {
                        cacheName: "channel-photo",
                        expiration: {
                            maxAgeSeconds: 86400,
                            purgeOnQuotaError: true,
                        },
                        cacheableResponse: {
                            statuses: [0, 200],
                        },
                    },
                },
                {
                    urlPattern: new RegExp("https://www.youtube.com/player_api"),
                    handler: "cacheFirst",
                    options: {
                        cacheName: "youtube-player",
                        expiration: {
                            maxAgeSeconds: 10800,
                            maxEntries: 1,
                        },
                        cacheableResponse: {
                            statuses: [0, 200],
                        },
                    },
                },
            ],
        },
    },
};
