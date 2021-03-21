chrome.webRequest.onBeforeSendHeaders.addListener(
    function (details) {
        details.requestHeaders.push({
            name: "Origin",
            value: "https://www.facebook.com",
        });
        details.requestHeaders.push({ name: "Viewport-Width", value: "1366" });
        details.requestHeaders.push({
            name: "Sec-Fetch-Site",
            value: "same-origin",
        });
        details.requestHeaders.push({
            name: "Sec-Fetch-Site",
            value: "same-origin",
        });
        details.requestHeaders.push({ name: "Sec-Fetch-Mode", value: "cors" });

        return { requestHeaders: details.requestHeaders };
    },
    { urls: ["*://www.facebook.com/*"] },
    ["blocking", "requestHeaders", "extraHeaders"]
);

let dataFB = {};

let getData = () => {
    return new Promise((resolve, reject) => {
        axios
            .get(
                "https://m.facebook.com/composer/ocelot/async_loader/?publisher=feed"
            )
            .then((data) => {
                let code = data.data;
                let fb_dtsg = code.match(/fb_dtsg(.*?)autocomplete/)
                    ? code.match(/fb_dtsg(.*?)autocomplete/)[1].split('"')[2]
                    : null;
                let token = code.match(/accessToken(.*?)useLocalFilePreview/)
                    ? code
                          .match(/accessToken(.*?)useLocalFilePreview/)[1]
                          .split('"')[2]
                    : "";
                let id = code.match(/ACCOUNT_ID(.*?)NAME/)
                    ? code.match(/ACCOUNT_ID(.*?)NAME/)[1].split('"')[2]
                    : null;

                if (fb_dtsg != null && token != "" && id != 0) {
                    dataFB.token = token.substring(0, token.length - 1);
                    dataFB.fb_dtsg = fb_dtsg.substring(0, fb_dtsg.length - 1);
                    dataFB.id = id.substring(0, id.length - 1);
                }
            })
            .catch((err) => {
                reject(err);
            });
    });
};

getData();

function loadStories(number) {
    let data = dataFB;
    let dataForm = new FormData();
    dataForm.append("fb_dtsg", data.fb_dtsg);
    dataForm.append(
        "fb_api_req_friendly_name",
        "StoriesSuspenseNavigationPaneRootWithEntryPointQuery"
    );
    dataForm.append("fb_api_caller_class", "RelayModern");
    dataForm.append(
        "variables",
        `{"bucketsCount":${number},"initialCount":${number},"pinnedIDs":[""],"profilePicSize":80,"scale":1,"useStreamConnection":false}`
    );
    dataForm.append("doc_id", "3699197380173068");
    dataForm.append("__user", data.id);
    return axios({
        method: "POST",
        url: "https://www.facebook.com/api/graphql",
        data: dataForm,
    });
}

function getInfoStory(ids) {
    let strIds = "";
    ids.map(function (data) {
        strIds += `"${data}",`;
    });
    strIds = strIds.substring(0, strIds.length - 1);

    let data = new FormData();
    data.append("fb_dtsg", dataFB.fb_dtsg);
    data.append(
        "fb_api_req_friendly_name",
        "StoriesViewerBucketPrefetcherMultiBucketsQuery"
    );
    data.append("fb_api_caller_class", "RelayModern");
    data.append(
        "variables",
        `{"bucketIDs":[${strIds}],"scale":1,"blur":10,"prefetchPhotoUri":true,"showContextualReplies":true}`
    );
    data.append("doc_id", "3734823739931200");
    data.append("__user", dataFB.id);
    return axios({
        method: "POST",
        url: "https://www.facebook.com/api/graphql",
        data: data,
    });
}

function reactStory(id, action) {
    let data = new FormData();
    data.append("fb_dtsg", dataFB.fb_dtsg);
    data.append(
        "fb_api_req_friendly_name",
        "useStoriesSendReplyMutation"
    );
    data.append("fb_api_caller_class", "RelayModern");
    data.append(
        "variables",
        `{"input":{"lightweight_reaction_actions":{"offsets":[0],"reaction":"${action}"},"message":"${action}","story_id":"${id}","story_reply_type":"LIGHT_WEIGHT","actor_id":"${dataFB.id}","client_mutation_id":"6"}}`
    );
    data.append("doc_id", "2551662911531159");
    data.append("__user", dataFB.id);
    axios({
        method: "POST",
        url: "https://www.facebook.com/api/graphql",
        data: data,
    })
}

let timeRunning = 180000;

const running = async () => {
    const setting = JSON.parse(localStorage.getItem('data')) || { time: 30, number: 10, icon: "👍"};
    timeRunning = setting.time * 60 * 1000;
    let dataStory = await loadStories(setting.number);
    let arrayStory = dataStory.data.data.me.unified_stories_buckets.edges;
    let arrayIdStory = arrayStory.map((data) => {
        return data.node.id;
    });

    let arrayInfoStory = await getInfoStory(arrayIdStory);
    arrayInfoStory.data.data.nodes.map((node, index) => {
        if (index != 0) {
            node.unified_stories.edges.map(async (edge) => {
                let id = edge.node.id
                await reactStory(id, setting.icon)
                console.log(id)
            });
        }
    })
};

setTimeout(running, 1000);

setInterval(running, timeRunning);
