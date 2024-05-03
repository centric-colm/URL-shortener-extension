var preferredShortURL;
var currentShorternURL = '';
var qrCode;
let sync = {}, local = {};
function copyTextToClipboard(text) {
    currentShorternURL = text;
    var copyFrom = document.createElement("textarea");
    $(copyFrom).css({
        position: "absolute",
        top: "0px",
        left: "0px"
    });
    copyFrom.textContent = text;
    var body = document.getElementsByTagName('body')[0];
    body.appendChild(copyFrom);
    copyFrom.select();
    document.execCommand('copy');
    body.removeChild(copyFrom);
}
function pasteToInputBox(shorternURL) {
    $("#outputText").val(shorternURL)
}
function loadingState() {
    $("#shortenBtn").append("<img id='loader' class='loader' src='./tail-spin.svg'/>");
    $("#btnText").text("Shortening...");
    $("#qrCodeGen").addClass("disabled").attr("disabled", true);
}
function removeLoader() {
    $("#shortenBtn").find("#loader").remove();
    $("#qrCodeGen").removeClass("disabled").removeAttr("disabled");
}
function copyInfo() {
    $("#btnText").text("Copied to Clipboard");
    setTimeout(function () {
        $("#btnText").text("Shorten URL and Copy to Clipboard");
    }, 3000)
}
function generateQRCode() {
    if (qrCode) {
        qrCode.clear();
        document.getElementById("qrcode").innerHTML = "";
    }
    qrCode = new QRCode(document.getElementById("qrcode"), {text:currentShorternURL,
        width: 180,
        height: 180,
    });

    // $(document.body).append(image);
}
function checkForAutomaticQRCodeGen() {
    chrome.storage.local.get({ "automaticQRCode": "" }, function (result) {
        console.log(result)
        if (result.automaticQRCode === 'true') {
            generateQRCode();
        }
    });
}

function handleActions(lurl, resp) {
    saveToStorage(lurl, resp);
    copyTextToClipboard(resp);
    pasteToInputBox(resp);
    removeLoader();
    copyInfo();
    checkForAutomaticQRCodeGen();

}
var urlShorteners = {
    tinyurl: function (url) {
        var req = new XMLHttpRequest();
        req.open("GET", "https://tinyurl.com/api-create.php?url=" + encodeURIComponent(url), true);
        req.addEventListener("load", function (e) {
            var resp = req.responseText.replace("http://", "https://");
            handleActions(url, resp);
        }, false);
        req.send();
    },
    isgd: function (url) {
        $.ajax({
            url: "https://is.gd/create.php?format=json&url=" + encodeURIComponent(url) + "&logstats=1",
            type: 'GET',
            success: function (response) {
                response = JSON.parse(response);
                removeLoader();
                if (response.errorcode === 4) {
                    var message = document.querySelector('#message');
                    message.innerText = 'Your network address is banned from shortening URLs, usually due to abuse of our service in the past.' + "So please change to tinyurl by clicking Setting icon";
                    return 0;
                }
                handleActions(url, response.shorturl);
            }, error: function () {
            }
        });

    },
    vgd: function (url) {
        $.ajax({
            url: "https://v.gd/create.php?format=json&url=" + encodeURIComponent(url) + "&logstats=1",
            type: 'GET',
            success: function (response) {
                response = JSON.parse(response);
                removeLoader();
                if (response.errorcode === 4) {
                    var message = document.querySelector('#message');
                    message.innerText = 'Your network address is banned from shortening URLs, usually due to abuse of our service in the past.' + "So please change to tinyurl by clicking Setting icon";
                    return 0;
                }
                handleActions(url, response.shorturl);
            }, error: function () {
            }
        });

    },
    priv: function (url) {
        var message = document.querySelector('.error');
        message.innerText = 'priv.sh is not supported anymore. please change to some other shorterns in setting/option page';
        $(".error").show();
        removeLoader();
    },
    tnyim: function (url) {
        var req = new XMLHttpRequest();
        req.open("GET", "https://tny.im/yourls-api.php?format=json&action=shorturl&url=" + encodeURIComponent(url), true);
        req.addEventListener("load", function (e) {
            var resp = JSON.parse(req.responseText).shorturl.replace("http://", "https://");
            handleActions(url, resp);
        }, false);
        req.send();
    },
    bitly: function (url) {
        chrome.storage.local.get({
            bitlyApiKey: false,
        }, function (res) {
            let apiKey = res.bitlyApiKey;
            if (apiKey) {
                fetch('https://api-ssl.bitly.com/v4/shorten', {
                    method: 'POST',
                    headers: {
                        'Authorization': apiKey,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ "long_url": url, "domain": "bit.ly" })
                }).then(function (res) {
                    return res.json();
                }).then(function (res) {
                    if (!res.link) {
                        var message = document.querySelector('.error');
                        message.innerText = res.message + '. Check the access token is correct for bitly in options page or generate a new token in bit.ly and apply';
                        $(".error").show();
                        removeLoader();
                        return 0;
                    }
                    var surl = res.link;
                    handleActions(url, surl);
                });
            } else {
                var message = document.querySelector('.error');
                message.innerText = 'Add a bit.ly api key in setting/option page';
                $(".error").show();
                removeLoader();
            }
        });


    },
    cuttly: function (url) {
        chrome.storage.local.get({
            cuttlyApiKey: false,
        }, async function (res) {
            // await fetch("https://cutt.ly");
            let apiKey = res.cuttlyApiKey;
            if (apiKey) {
                let longurl = encodeURIComponent(url);
                var req = new XMLHttpRequest();
                req.open("GET", "https://ifsc-code.in/urlShorten?longUrl=" + longurl + "&api=" + apiKey, true);
                req.addEventListener("load", function (e) {
                    //var resp = JSON.parse(req.responseText).shorturl.replace("http://", "https://");
                    if (JSON.parse(req.responseText).url.status === 4) {
                        var message = document.querySelector('.error');
                        message.innerText = 'Check the access token is correct for cuttly in options page';
                        $(".error").show();
                        removeLoader();
                        return 0;
                    }
                    var surl = (JSON.parse(req.responseText)).url.shortLink;

                    handleActions(url, surl);
                }, false);
                req.addEventListener("error", function (e) {
                    //var resp = JSON.parse(req.responseText).shorturl.replace("http://", "https://");
                    console.log("errro");
                }, false);
                req.send();
            } else {
                var message = document.querySelector('.error');
                message.innerText = 'Add a cutt.ly api key in setting/option page';
                $(".error").show();
                removeLoader();
            }
        });

    }
}
function onWindowLoad() {
    chrome.storage.sync.get({
        preferredURL: "isgd",
    }, function (res) {
        preferredShortURL = res.preferredURL;
        if (preferredShortURL === "bitly") {
            chrome.storage.local.get({ "bitlyApiKey": "" }, function (res) {
                if (!res.bitlyApiKey || res.bitlyApiKey < 7) {
                    $(".error").text("Please configure access key for bitly in settings page").removeClass("hide");
                }
            });
        } else if (preferredShortURL === "cuttly") {
            chrome.storage.local.get({ "cuttlyApiKey": "" }, function (res) {
                if (!res.cuttlyApiKey || res.cuttlyApiKey.length < 7) {
                    $(".error").text("Please configure access key for cuttly in settings page").removeClass("hide");
                }
            });
        }
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            var tablink = tabs[0].url;
            if (!checkForUrl(tablink)) {
                $(".error").text("It seems the above input is not a URL").removeClass("hide");
                return 0;
            }
            else {
                $(".error").addClass("hide");
            }
            chrome.storage.local.get({ "automaticCopy": "" }, function (result) {
                if (result.automaticCopy === "true") {
                    loadingState()
                    urlShorteners[preferredShortURL](tablink);
                }
            });

        });
    });
    document.getElementById("history").onclick = function () {
        chrome.tabs.create({ url: "history.html" }, function (tab) {
            targetId = tab.id;
            window.close();
        });
    };
    document.getElementById("options").onclick = function () {
        chrome.tabs.create({ url: "options.html" }, function (tab) {
            targetId = tab.id;
            window.close();
        });
    };

    $("#shortenBtn").on("click", function () {
        chrome.storage.sync.get({
            preferredURL: "isgd",
        }, function (res) {
            preferredShortURL = res.preferredURL;
            if (!checkForUrl($("#inputText").val())) {
                $(".error").text("It seems the above pasted text is not a URL").removeClass("hide");
                return 0;
            }
            else {
                $(".error").addClass("hide");
            }
            loadingState();
            urlShorteners[preferredShortURL]($("#inputText").val());
        });
    });

    $("#qrCodeGen").on("click", function () {
        generateQRCode();
    });
    $(".rating").on("click", function () {
        window.open("https://chrome.google.com/webstore/detail/url-shortener-googl/godoifjoiadanijplaghmhgfeffnblib/reviews");
    });
    function checkForUrl(url) {
        var regexp = /(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/;
        return regexp.test(url);
    }
}
function saveToStorage(lurl, surl) {
    chrome.storage.local.get({ "url": [] }, function (result) {
        if (typeof result.url === "undefined") {
            result.url = [];
        }
        result.url.push({ lurl: lurl, surl: surl });
        chrome.storage.local.set({ url: result.url });
    });
}

window.onload = onWindowLoad;
$(document).ready(function () {


    setTimeout(function () {
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            var tablink = tabs[0].url;
            console.log(tablink, tabs[0]);
            $("#inputText").val(tablink);
        });

        document.activeElement.blur();
        $("#copy").focus();
    }, 100);
    chrome.storage.local.get({ "hideInputURL": "" }, function (result) {
        result.hideInputURL = result.hideInputURL === "true" ? 'none' : 'block';
        $("#inputText").css("display", result.hideInputURL);
    });

    chrome.storage.local.get({ "nightMode": "" }, function (result) {
        if (result.nightMode === "true") {
            document.body.classList.add("nightMode");
        }
    });
});
