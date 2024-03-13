(()=>{"use strict";
/*!
 *  電脳麻将: 牌譜ビューア v2.3.6
 *
 *  Copyright(C) 2017 Satoshi Kobayashi
 *  Released under the MIT license
 *  https://github.com/kobalab/Majiang/blob/master/LICENSE
 */
const{hide:a,show:e,fadeIn:i,scale:n}=Majiang.UI.Util;$((function(){const a="https://kobalab.net/majiang/tenhou-log/",e=Majiang.UI.pai($("#loaddata")),o=Majiang.UI.audio($("#loaddata")),l=a=>($("body").addClass("analyzer"),new Majiang.UI.Analyzer($("#board > .analyzer"),a,e,(()=>$("body").removeClass("analyzer")))),t=a=>($("#board .controller").addClass("paipu"),$("body").attr("class","board"),n($("#board"),$("#space")),new Majiang.UI.Paipu($("#board"),a,e,o,"Majiang.pref",(()=>i($("body").attr("class","file"))),l)),s=a=>(i($("body").attr("class","stat")),new Majiang.UI.PaipuStat($("#stat"),a,(()=>i($("body").attr("class","file")))));location.search?new Majiang.UI.PaipuFile($("#file"),"Majiang.paipu",t,s,a,location.search.replace(/^\?/,""),location.hash.replace(/^#/,"")).redraw():new Majiang.UI.PaipuFile($("#file"),"Majiang.paipu",t,s,a).redraw(),$(window).on("resize",(()=>n($("#board"),$("#space"))))}))})();