// ==UserScript==
// @name         Bangumi User Statstics on Topic Pages
// @namespace    http://tampermonkey.net/
// @version      0.2
// @description  Display user statstics on topic pages. Data are fetched from user pages. High frequency of requests may cause 503 error, reload the page several times if that happens.
// @author       CryoVit
// @match        https://bgm.tv/group/topic/*
// @match        https://bangumi.tv/group/topic/*
// @match        https://chii.in/group/topic/*
// @icon         https://bgm.tv/img/favicon.ico
// @grant        none
// @license      MIT
// ==/UserScript==

(function() {
    'use strict';
    const baseURL = 'https://bgm.tv/user/';
    let inners = document.getElementsByClassName('inner');
    for (let i = 1; i < inners.length - 2; i++) {
        let inner = inners[i];
        let user = inner.getElementsByTagName('strong')[0];
        let uid = user.firstChild.href.split('/').pop(); // keep the last part
        if (sessionStorage.getItem(uid)) {
            let newspan = document.createElement('span');
            newspan.innerText = sessionStorage.getItem(uid);
            user.parentNode.insertBefore(newspan, user.nextSibling);
            newspan.style.color = "#999999";
            continue;
        }
        setTimeout(getRating, 1000, user, uid);
    }
    function getRating(user, uid) {
        let reqURL = baseURL + uid;
        let xhr = new XMLHttpRequest();
        xhr.open('GET', reqURL, true);
        xhr.send();
        xhr.onreadystatechange = function() {
            if (xhr.readyState === 4) {
                let doc = new DOMParser().parseFromString(xhr.responseText, 'text/html');
                let gridstats = doc.getElementsByClassName('gridStats')[0];
                let ent = gridstats.children[0].children[0].innerText;
                let vot = gridstats.children[1].children[0].innerText;
                let avg = gridstats.children[3].children[0].innerText;
                let std = gridstats.children[4].children[0].innerText;
                let rating = ' ' + vot + '/' + ent + ' ' + avg + '±' + std;
                let newspan = document.createElement('span');
                newspan.innerText = rating;
                user.parentNode.insertBefore(newspan, user.nextSibling);
                newspan.style.color = "#999999";
                sessionStorage.setItem(uid, rating);
            }
        };
    }
})();