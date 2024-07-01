// ==UserScript==
// @name         Bangumi Exponential Weighted Average Score
// @namespace    http://tampermonkey.net/
// @version      2024-07-01
// @description  Replace weighted average scores in Bangumi with an experimental exponential weighted average score.
// @author       You
// @author       Mojimoon
// @match        https://bangumi.tv/*
// @match        https://bgm.tv/*
// @match        https://chii.in/*
// @icon         https://bgm.tv/img/favicon.ico
// @grant        none
// @license      MIT
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    var lis = document.querySelectorAll('li.item');

    for (let idx = 0; idx < lis.length; idx++) {
    (function(i) {
        var li = lis[i];
        var rateInfo = li.querySelector('.rateInfo');
        if (rateInfo) {
            var id = li.id.split('_')[1];
            var total = 0;
            var count = [];

            var xhr = new XMLHttpRequest();
            xhr.open('GET', `https://api.bgm.tv/subject/${id}`, true);
            xhr.send();
            xhr.onreadystatechange = function() {
                if (xhr.readyState == 4 && xhr.status == 200) {
                    console.log('xhr to ' + id + ' success');
                    var data = JSON.parse(xhr.responseText);
                    total = data.rating.total;
                    count = data.rating.count;

                    var avg = 0;
                    var ewa = 0;
                    var recommend = 0;
                    for (var j = 1; j <= 10; j++) {
                        avg += j * count[j];
                        if (j == 10) ewa += count[j] * get_weight(count[j]);
                        else if (j >= 7) ewa += count[j];
                        if (j >= 7) recommend += count[j];
                    }
                    avg /= total;
                    ewa = ewa * 10 / total;

                    var starlight = document.createElement('span');
                    starlight.className = 'starlight stars' + Math.max(Math.min(Math.floor(ewa), 10), 1);
                    var starstop = document.createElement('span');
                    starstop.className = 'starstop-s';
                    starstop.appendChild(starlight);
                    if (rateInfo) {
                        rateInfo.innerHTML = '';
                        rateInfo.appendChild(starstop);
                        rateInfo.innerHTML += `<small class="fade">${(ewa * 10).toFixed(2)}%</small> <span class="tip_j">(${total}评分 | ${(recommend / total * 100).toFixed(2)}%推荐 | ${avg.toFixed(2)}均分)</span>`;
                    }
                }
            }
        }
    })(idx);
    }

    function get_weight(count) {
        return Math.pow(Math.log10(Math.max(count, 10)), 1/5);
    }

})();


/*
  "rating": {
    "rank": 1,
    "total": 7577,
    "count": {
      "1": 32,
      "2": 8,
      "3": 8,
      "4": 9,
      "5": 22,
      "6": 68,
      "7": 248,
      "8": 1100,
      "9": 2523,
      "10": 3559
    },
    "score": 9.2
  },
*/

/*
<li id="item_326" class="item odd clearit">
<a href="/subject/326" class="subjectCover cover ll">
<span class="image">
<img src="//lain.bgm.tv/pic/cover/c/a6/66/326_D8wjw.jpg" class="cover">
</span>
<span class="overlay"></span>
</a>
<div class="inner">
<h3>
<a href="/subject/326" class="l">攻壳机动队 S.A.C. 2nd GIG</a> <small class="grey">攻殻機動隊 S.A.C. 2nd GIG</small>
</h3>
<span class="rank"><small>Rank </small>1</span>
<p class="info tip">
26话 / 2004年1月1日 / 神山健治 / 士郎正宗 </p>
<p class="rateInfo">
<span class="starstop-s"><span class="starlight stars9"></span></span> <small class="fade">9.2</small> <span class="tip_j">(7577人评分)</span>
</p>
</div>
</li>
*/
