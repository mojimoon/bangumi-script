// ==UserScript==
// @name         Bangumi User Hover Panel
// @name:zh-CN   Bangumi 用户悬浮面板
// @namespace    https://github.com/CryoVit/jioben/tree/master/bangumi/
// @version      0.5.0
// @description  fork of https://bgm.tv/dev/app/953. Display a hover panel when mouse hover on user link.
// @description:zh-CN  https://bgm.tv/dev/app/953 的修改版，鼠标悬浮在用户链接上方时出现悬浮框
// @author       cureDovahkiin + CryoVit
// @match        https://bangumi.tv/*
// @match        https://bgm.tv/*
// @match        https://chii.in/*
// @icon         https://bgm.tv/img/favicon.ico
// @grant        none
// @license      MIT
// ==/UserScript==

(function () {
    let locker = false
    $('[href*="/user/"],[href*="/user/"].l,[href*="/user/"].avatar,#pm_sidebar a[onclick^="AddMSG"]').each(function () {
        let timer = null
        $(this).hover(function () {
            timer = setTimeout(() => {
                if (locker) return false
                if (this.text == "查看好友列表" || $(this).find('.avatarSize75').length > 0) return false
                locker = true
                const layout = document.createElement('div')
                let timer = null
                $(layout).addClass('user-hover')
                if ($(this).hasClass('avatar')) {
                    $(layout).addClass('fix-avatar-hover')
                }
                layout.innerHTML = `<div class="lds-roller"><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div></div>`
                const userData = {}
                if (this.onclick) {
                    userData.id = this.onclick.toString().split("'")[1]
                } else {
                    let urlSplit = /.*\/user\/([^\/]*)\/?(.*)/.exec(this.href)
                    if (urlSplit[2]) return
                    userData.id = urlSplit[1]
                }
                userData.href = '/user/' + userData.id
                const req = {
                    req1: null,
                    req2: null
                }
                Promise.all([
                    new Promise((r, j) => {
                        req.req1 = $.ajax({
                            url: userData.href,
                            dataType: 'text',
                            success: e => {
                                userData.self = /<a class="avatar" href="([^"]*)">/.exec(e)[1].split('/').pop()
                                if (userData.self != userData.id) {
                                    userData.sinkuro = /mall class="hot">\/([^<]*)<\/small>/.exec(e)[1]
                                    userData.sinkuroritsu = /<span class="percent" style="width:([^"]*)">/.exec(e)[1]
                                    userData.addFriend = /<a href="([^"']*)" id="connectFrd" class="chiiBtn">/.exec(e)
                                    userData.addFriend = userData.addFriend ? userData.addFriend[1] : false
                                }
                                userData.joinDate = /Bangumi<\/span> <span class="tip">([^<]*)<\/span>/.exec(e)[1]
                                userData.lastEvent = /<small class="time">([^<]*)<\/small><\/li>/.exec(e)
                                userData.watch = Array.from(e.match(/<a href="\/anime\/list[^>=]*>([0-9]{1,4}[^<]*)/g) || [], el => />([0-9]{1,5}.*)/.exec(el)[1])
                                userData.watch = userData.watch.map(el => el.split('部'))
                                userData.stats = /<div class="gridStats">([\s\S]*)<\/div>/.exec(e)[1]
                                userData.stats = Array.from(userData.stats.match(/<div[^>]*>([\s\S]*?)<\/div>/g).slice(0, 6), el => /<div[^>]*>([\s\S]*?)<\/div>/.exec(el)[1])
                                userData.stats = userData.stats.map(el => Array.from(el.match(/<span[^>]*>([\s\S]*?)<\/span>/g), el => /<span[^>]*>([\s\S]*?)<\/span>/.exec(el)[1]))
                                // console.log(userData)
                                r()
                            },
                            error: () => {
                                j()
                            }
                        })
                    }),
                    new Promise((r, j) => {
                        req.req2 = $.ajax({
                            url: 'https://api.bgm.tv/user/' + userData.id,
                            dataType: 'json',
                            success: e => {
                                userData.name = e.nickname
                                userData.avatar = e.avatar.large.replace(/https?/, 'https')
                                userData.sign = e.sign
                                userData.url = e.url
                                userData.message = `https://bgm.tv/pm/compose/${e.id}.chii`
                                r()
                            },
                            error: () => {
                                j()
                            }
                        })
                    })
                ]).then(() => {
                    layout.innerHTML = `
                        <img class='avater' src="${userData.avatar}"/>
                        <div class='user-info'>
                            <p class='user-name'><a href="${userData.href}" target="_blank">${userData.name}</a></p>
                            <p class='user-joindate'>${userData.joinDate}</p><span class='user-id'>@${userData.id}</span>
                            <p class='user-sign'>${userData.sign}</p>
                        </div>
                        ${
                        userData.sinkuro ? `
                            <div class="shinkuro">
                            <div style="width:${userData.sinkuroritsu}" class="shinkuroritsu"></div>
                            <div class="shinkuro-text">
                                <span>${userData.sinkuro}</span> 
                                <span>同步率：${userData.sinkuroritsu}</span> 
                            </div>                                      
                            </div>
                            `: ''
                        }                
                        <div class='user-stats'>
                            ${(function () {
                                const watchStates = ['在看', '看过', '想看', '搁置', '抛弃'];
                                let idx = 0;
                                let html = '<div class="stats-odd">'
                                for (let i = 0; i < 5; i++) {
                                    if (idx >= userData.watch.length || userData.watch[idx][1] != watchStates[i]) {
                                        html += `<span>${watchStates[i]} <strong>0</strong></span>`
                                    } else {
                                        html += `<span>${watchStates[i]} <strong>${userData.watch[idx][0]}</strong></span>`
                                        idx++
                                    }
                                }
                                html += '</div><div class="stats-even">'
                                for (let i = 0; i < 6; i++) {
                                    if (i == 2) {
                                        continue
                                    }
                                    html += `<span>${userData.stats[i][1]} <strong>${userData.stats[i][0]}</strong></span>`
                                }
                                return html + '</div>'
                            })()}
                        </div>
                        <span class='user-lastevent'>Last @ ${userData.lastEvent ? userData.lastEvent[1] : ''}</span>
                        <a class = 'hover-panel-btn' href="${userData.message}" target="_blank">发送短信</a>
                        <span id="panel-friend">
                        ${ userData.addFriend ? `
                                <a class='hover-panel-btn' href="${userData.addFriend}" id='PanelconnectFrd' href="javascript:void(0)">添加好友</a>                    
                            `: `
                        ${ userData.id == userData.self ? '' : `<span class = 'my-friend' >我的好友</span>`}
                            `}
                        </span>
                        `

                    $(layout).addClass('dataready')
                    $('#PanelconnectFrd').click(function () {
                        $('#panel-friend').html(`<span class='my-friend'>正在添加...</span>`)
                        $("#robot").fadeIn(500)
                        $("#robot_balloon").html(AJAXtip['wait'] + AJAXtip['addingFrd'])
                        $.ajax({
                            type: "GET",
                            url: this + '&ajax=1',
                            success: function (html) {
                                $('#PanelconnectFrd').hide()
                                $('#panel-friend').html(`<span class = 'my-friend' >我的好友</span>`)
                                $("#robot_balloon").html(AJAXtip['addFrd'])
                                $("#robot").animate({
                                    opacity: 1
                                }, 1000).fadeOut(500)
                                localStorage.removeItem('bgmFriends')
                            },
                            error: function (html) {
                                $("#robot_balloon").html(AJAXtip['error'])
                                $("#robot").animate({
                                    opacity: 1
                                }, 1000).fadeOut(500)
                                $('#panel-friend').html(`<span class='my-friend-fail'>添加失败,稍后再试</span>`)
                            }
                        })
                        return false
                    })
                }).catch(() => {
                    layout.innerHTML = `
                        <p style='font-size:16px; margin:25px 30px'>
                        <img style="height:15px;width:16px" src='/img/smiles/tv/15.gif'/><br/>
                        请求失败，请稍后再试。<br/><br/>或者使用<a href='https://bgm.tv'>bgm.tv</a>域名，</p>`
                    $(layout).addClass('dataready')
                })
                function removeLayout () {
                    setTimeout(() => {
                        $(layout).remove()
                        locker = false
                        req.req1.abort()
                        req.req2.abort()
                    }, 200);
                }
                $(this).after(layout).mouseout(function () {
                    timer = setTimeout(() => {
                        removeLayout()
                    }, 300);
                })
                $(layout).hover(function () {
                    clearTimeout(timer)
                }, function () {
                    removeLayout()
                })
                return false
            }, 500)
        },
            function () {
                clearTimeout(timer)
            }
        )
    })

    const style = document.createElement("style");
    const heads = document.getElementsByTagName("head");
    style.setAttribute("type", "text/css");
    style.innerHTML = `
        :root {
            --bg-color: #fff;
            --text-color: #010101;
            --bg-pink: #fce9e9;
            --bg-sky: #c2e1fc;
            --box-shadow: #ddd;
            --text-gray: #666;
        }
        [data-theme='dark'] {
            --bg-color: #2d2e2f;
            --text-color: #f7f7f7;
            --bg-pink: #3c3c3c;
            --bg-sky: #3c3c3c;
            --box-shadow: #6e6e6e;
            --text-gray: #aaa;
        }
        .user-hover {
            position: absolute;
            width: 412px;
            min-height: 
            background: var(--bg-color);
            box-shadow: 0px 0px 4px 1px var(--box-shadow);
            transition: all .2s ease-in;
            transform: translate(0,6px);
            font-size: 12px;
            z-index:999;
            color: var(--text-color);
            line-height: 130%;
            border-radius: 5px;
            -webkit-border-radius: 5px;
            backdrop-filter: blur(10px) contrast(95%);
            -webkit-backdrop-filter: blur(10px) contrast(95%);
        }
        .fix-avatar-hover{
            transform: translate(45px,20px)
        }
        
        div.dataready {
            padding: 8px;
            font-weight: normal;
            text-align: left;
        }
        span.user-lastevent {
            margin-top: 3px;
            display: inline-block;
            vertical-align: top;
            color: var(--text-gray);
        }
        div.dataready img {
            height: 75px;
            width:75px;
            border-radius: 5px;
        }
        .user-info {
            display: inline-block;
            vertical-align: top;
            max-width: 250px;
            margin: 0 0 10px 10px;
        }
        .user-info .user-name {
            font-size: 20px;
            font-weight: bold;
        }
        .user-info .user-joindate {
            background-color: #f09199;
            display: inline-block;
            color: #f7f7f7;
            border-radius: 10px;
            padding: 0 10px;
            margin: 8px 4px 3px 0;
        }
        .user-info .user-id{
            font-size: 12px;
            font-weight:normal;
            color: var(--text-gray);
        }
        .user-info .user-sign {
            word-break: break-all;
            margin-top: 3px;
        }
        .user-stats {
            padding: 10px 0px 5px;
            margin-bottom: 10px;
        }
        .user-stats span {
            display: inline-block;
            padding: 4px;
            width: 19%;
            box-sizing: border-box;
            border-left: 4px solid #f09199;
            background-color: var(--bg-pink) !important;
            color: var(--text-color) !important;
            margin: 0 1% 1% 0;
        }
        .stats-even span {
            border-left: 4px solid #369cf8;
            background-color: var(--bg-sky) !important;
        }
        .shinkuro {
            width: 100%;
            height: 20px;
            background-color: var(--bg-sky) !important;
            line-height: 20px;
            border-radius: 10px;
        }
        .shinkuro-text {
            position: absolute;
            width: 100%;
            height: 20px;
            display: flex;
            align-items: center;
            justify-content: space-between;
        }
        .shinkuro-text span {
            color: var(--text-color) !important;
        }
        .shinkuroritsu {
            height: 20px;
            float: left;
            border-radius: 10px;
            background: linear-gradient(to right, #9acdfb 0%,#4aa5f8 100%);
        }
        .shinkuro-text span:nth-of-type(1) {
            margin-left: 10px;
        }
        .shinkuro-text span:nth-of-type(2) {
            margin-right: 26px;
        }
        a.hover-panel-btn, span.my-friend, span.my-friend-fail {
            display: inline-block;
            float: right;
            margin-bottom: 8px;
            color: white;
            padding: 1px 8px;
            border-radius: 10px;
            margin-left:10px;
            transition: all .2s ease-in;
        }
        a.hover-panel-btn {
            background: #f09199;
            transition: all .2s ease-in;
        }
        span.my-friend {
            background: #6eb76e;
        }
        span.my-friend-fail {
            background: red;
        }

        .lds-roller {
            display: inline-block;
            position: relative;
            width: 64px;
            height: 64px;
            margin:10px 20px
        }
        .lds-roller div {
            animation: lds-roller 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite;
            transform-origin: 32px 32px;
        }
        .lds-roller div:after {
            content: " ";
            display: block;
            position: absolute;
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background: #f09199;
            margin: -3px 0 0 -3px;
        }
        .lds-roller div:nth-child(1) {
            animation-delay: -0.036s;
        }
        .lds-roller div:nth-child(1):after {
            top: 50px;
            left: 50px;
        }
        .lds-roller div:nth-child(2) {
            animation-delay: -0.072s;
        }
        .lds-roller div:nth-child(2):after {
            top: 54px;
            left: 45px;
        }
        .lds-roller div:nth-child(3) {
            animation-delay: -0.108s;
        }
        .lds-roller div:nth-child(3):after {
            top: 57px;
            left: 39px;
        }
        .lds-roller div:nth-child(4) {
            animation-delay: -0.144s;
        }
        .lds-roller div:nth-child(4):after {
            top: 58px;
            left: 32px;
        }
        .lds-roller div:nth-child(5) {
            animation-delay: -0.18s;
        }
        .lds-roller div:nth-child(5):after {
            top: 57px;
            left: 25px;
        }
        .lds-roller div:nth-child(6) {
            animation-delay: -0.216s;
        }
        .lds-roller div:nth-child(6):after {
            top: 54px;
            left: 19px;
        }
        .lds-roller div:nth-child(7) {
            animation-delay: -0.252s;
        }
        .lds-roller div:nth-child(7):after {
            top: 50px;
            left: 14px;
        }
        .lds-roller div:nth-child(8) {
            animation-delay: -0.288s;
        }
        .lds-roller div:nth-child(8):after {
            top: 45px;
            left: 10px;
        }
        @keyframes lds-roller {
            0% {
                transform: rotate(0deg);
            }
            100% {
                transform: rotate(360deg);
            }
        }
        
        #comment_list div.sub_reply_collapse {
            opacity: 1;
        }
    `
    heads[0].append(style)
})();