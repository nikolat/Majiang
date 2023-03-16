(()=>{"use strict";
/*!
 *  電脳麻将: 牌譜ビューア v2.0.5
 *
 *  Copyright(C) 2017 Satoshi Kobayashi
 *  Released under the MIT license
 *  https://github.com/kobalab/Majiang/blob/master/LICENSE
 */
const{hide:a,show:e,fadeIn:i,scale:n}=Majiang.UI.Util;$((function(){const a=Majiang.UI.pai($("#loaddata")),e=Majiang.UI.audio($("#loaddata")),o=e=>($("body").addClass("analyzer"),new Majiang.UI.Analyzer($("#board > .analyzer"),e,a,(()=>$("body").removeClass("analyzer")))),t=t=>($("body").attr("class","board"),n($("#board"),$("#space")),new Majiang.UI.Paipu($("#board"),t,a,e,"Majiang.pref",(()=>i($("body").attr("class","file"))),o)),l=a=>(i($("body").attr("class","stat")),new Majiang.UI.PaipuStat($("#stat"),a,(()=>i($("body").attr("class","file")))));location.search?new Majiang.UI.PaipuFile($("#file"),"Majiang.paipu",t,l,"https://kobalab.net/majiang/tenhou-log/",location.search.replace(/^\?/,""),location.hash.replace(/^#/,"")).redraw():new Majiang.UI.PaipuFile($("#file"),"Majiang.paipu",t,l,"https://kobalab.net/majiang/tenhou-log/").redraw(),$(window).on("resize",(()=>n($("#board"),$("#space"))))}))})();