(()=>{"use strict";
/*!
 *  電脳麻将: 自動対戦 v2.3.6
 *
 *  Copyright(C) 2017 Satoshi Kobayashi
 *  Released under the MIT license
 *  https://github.com/kobalab/Majiang/blob/master/LICENSE
 */
const{hide:a,show:e,fadeIn:o,scale:i,setSelector:t,clearSelector:n}=Majiang.UI.Util;let l;$((function(){let o;const t=Majiang.UI.pai($("#loaddata")),n=Majiang.UI.audio($("#loaddata")),d=Majiang.rule(JSON.parse(localStorage.getItem("Majiang.rule")||"{}"));let r=!1,c=!1;function s(){o&&(r=o._view.open_shoupai,c=o._view.open_he);let a=[];for(let e=0;e<4;e++)a[e]=new Majiang.AI;o=new Majiang.Game(a,s,d),o.view=new Majiang.UI.Board($("#board .board"),t,n,o.model),o.wait=5e3,o._model.title=o._model.title.replace(/^[^\n]*/,$("title").text()),o._view.open_shoupai=r,o._view.open_he=c,$("body").attr("class","board"),i($("#board"),$("#space")),$(window).off("keyup").on("keyup",(a=>(" "==a.key?(e.stoped?e.start():e.stop(),o.handler=()=>e.stop()):"s"==a.key?e.shoupai():"h"==a.key&&e.he(),!1))),$("#board .board").off("click").on("click",(()=>{e.stoped?e.start():e.stop(),o.handler=()=>e.stop()})),$("#board .board > .shoupai").off("click",".pai").on("click",".pai",(()=>e.shoupai())),$("#board .board > .he").off("click",".pai").on("click",".pai",(()=>e.he()));const e=new Majiang.UI.GameCtl($("#board"),"Majiang.pref",o,o._view);o.kaiju()}$(window).on("resize",(()=>i($("#board"),$("#space")))),$(window).on("load",(function(){a($("#title .loading")),$("#title .start").on("click",s),e($("#title .start"))})),l&&$(window).trigger("load")})),$(window).on("load",(()=>l=!0))})();