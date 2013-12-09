
if(!this.JSON){JSON=function(){function f(n){return n<10?'0'+n:n;}
Date.prototype.toJSON=function(){return this.getUTCFullYear()+'-'+
f(this.getUTCMonth()+1)+'-'+
f(this.getUTCDate())+'T'+
f(this.getUTCHours())+':'+
f(this.getUTCMinutes())+':'+
f(this.getUTCSeconds())+'Z';};var escapeable=/["\\\x00-\x1f\x7f-\x9f]/g,gap,indent,meta={'\b':'\\b','\t':'\\t','\n':'\\n','\f':'\\f','\r':'\\r','"':'\\"','\\':'\\\\'},rep;function quote(string){return escapeable.test(string)?'"'+string.replace(escapeable,function(a){var c=meta[a];if(typeof c==='string'){return c;}
c=a.charCodeAt();return'\\u00'+Math.floor(c/16).toString(16)+
(c%16).toString(16);})+'"':'"'+string+'"';}
function str(key,holder){var i,k,v,length,mind=gap,partial,value=holder[key];if(value&&typeof value==='object'&&typeof value.toJSON==='function'){value=value.toJSON(key);}
if(typeof rep==='function'){value=rep.call(holder,key,value);}
switch(typeof value){case'string':return quote(value);case'number':return isFinite(value)?String(value):'null';case'boolean':case'null':return String(value);case'object':if(!value){return'null';}
gap+=indent;partial=[];if(typeof value.length==='number'&&!(value.propertyIsEnumerable('length'))){length=value.length;for(i=0;i<length;i+=1){partial[i]=str(i,value)||'null';}
v=partial.length===0?'[]':gap?'[\n'+gap+partial.join(',\n'+gap)+'\n'+mind+']':'['+partial.join(',')+']';gap=mind;return v;}
if(typeof rep==='object'){length=rep.length;for(i=0;i<length;i+=1){k=rep[i];if(typeof k==='string'){v=str(k,value,rep);if(v){partial.push(quote(k)+(gap?': ':':')+v);}}}}else{for(k in value){v=str(k,value,rep);if(v){partial.push(quote(k)+(gap?': ':':')+v);}}}
v=partial.length===0?'{}':gap?'{\n'+gap+partial.join(',\n'+gap)+'\n'+mind+'}':'{'+partial.join(',')+'}';gap=mind;return v;}}
return{stringify:function(value,replacer,space){var i;gap='';indent='';if(space){if(typeof space==='number'){for(i=0;i<space;i+=1){indent+=' ';}}else if(typeof space==='string'){indent=space;}}
if(!replacer){rep=function(key,value){if(!Object.hasOwnProperty.call(this,key)){return undefined;}
return value;};}else if(typeof replacer==='function'||(typeof replacer==='object'&&typeof replacer.length==='number')){rep=replacer;}else{throw new Error('JSON.stringify');}
return str('',{'':value});},parse:function(text,reviver){var j;function walk(holder,key){var k,v,value=holder[key];if(value&&typeof value==='object'){for(k in value){if(Object.hasOwnProperty.call(value,k)){v=walk(value,k);if(v!==undefined){value[k]=v;}else{delete value[k];}}}}
return reviver.call(holder,key,value);}
if(/^[\],:{}\s]*$/.test(text.replace(/\\["\\\/bfnrtu]/g,'@').replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g,']').replace(/(?:^|:|,)(?:\s*\[)+/g,''))){j=eval('('+text+')');return typeof reviver==='function'?walk({'':j},''):j;}
throw new SyntaxError('JSON.parse');},quote:quote};}();}
(function(){if(window.google&&google.gears)
return;var F=null;if(typeof GearsFactory!='undefined'){F=new GearsFactory();}else{try{F=new ActiveXObject('Gears.Factory');if(F.getBuildInfo().indexOf('ie_mobile')!=-1)
F.privateSetGlobalObject(this);}catch(e){if((typeof navigator.mimeTypes!='undefined')&&navigator.mimeTypes["application/x-googlegears"]){F=document.createElement("object");F.style.display="none";F.width=0;F.height=0;F.type="application/x-googlegears";document.documentElement.appendChild(F);}}}
if(!F)
return;if(!window.google)
google={};if(!google.gears)
google.gears={factory:F};})();Persist=(function(){var VERSION='0.2.0',P,B,esc,init,empty,ec;ec=(function(){var EPOCH='Thu, 01-Jan-1970 00:00:01 GMT',RATIO=1000*60*60*24,KEYS=['expires','path','domain'],esc=escape,un=unescape,doc=document,me;var get_now=function(){var r=new Date();r.setTime(r.getTime());return r;}
var cookify=function(c_key,c_val){var i,key,val,r=[],opt=(arguments.length>2)?arguments[2]:{};r.push(esc(c_key)+'='+esc(c_val));for(i=0;i<KEYS.length;i++){key=KEYS[i];if(val=opt[key])
r.push(key+'='+val);}
if(opt.secure)
r.push('secure');return r.join('; ');}
var alive=function(){var k='__EC_TEST__',v=new Date();v=v.toGMTString();this.set(k,v);this.enabled=(this.remove(k)==v);return this.enabled;}
me={set:function(key,val){var opt=(arguments.length>2)?arguments[2]:{},now=get_now(),expire_at,cfg={};if(opt.expires){opt.expires*=RATIO;cfg.expires=new Date(now.getTime()+opt.expires);cfg.expires=cfg.expires.toGMTString();}
var keys=['path','domain','secure'];for(i=0;i<keys.length;i++)
if(opt[keys[i]])
cfg[keys[i]]=opt[keys[i]];var r=cookify(key,val,cfg);doc.cookie=r;return val;},has:function(key){key=esc(key);var c=doc.cookie,ofs=c.indexOf(key+'='),len=ofs+key.length+1,sub=c.substring(0,key.length);return((!ofs&&key!=sub)||ofs<0)?false:true;},get:function(key){key=esc(key);var c=doc.cookie,ofs=c.indexOf(key+'='),len=ofs+key.length+1,sub=c.substring(0,key.length),end;if((!ofs&&key!=sub)||ofs<0)
return null;end=c.indexOf(';',len);if(end<0)
end=c.length;return un(c.substring(len,end));},remove:function(k){var r=me.get(k),opt={expires:EPOCH};doc.cookie=cookify(k,'',opt);return r;},keys:function(){var c=doc.cookie,ps=c.split('; '),i,p,r=[];for(i=0;i<ps.length;i++){p=ps[i].split('=');r.push(un(p[0]));}
return r;},all:function(){var c=doc.cookie,ps=c.split('; '),i,p,r=[];for(i=0;i<ps.length;i++){p=ps[i].split('=');r.push([un(p[0]),un(p[1])]);}
return r;},version:'0.2.1',enabled:false};me.enabled=alive.call(me);return me;}());var index_of=(function(){if(Array.prototype.indexOf)
return function(ary,val){return Array.prototype.indexOf.call(ary,val);};else
return function(ary,val){var i,l;for(i=0,l=ary.length;i<l;i++)
if(ary[i]==val)
return i;return-1;};})();empty=function(){};esc=function(str){return'PS'+str.replace(/_/g,'__').replace(/ /g,'_s');};C={search_order:['localstorage','whatwg_db','globalstorage','gears','ie','flash','cookie'],name_re:/^[a-z][a-z0-9_ -]+$/i,methods:['init','get','set','remove','load','save'],sql:{version:'1',create:"CREATE TABLE IF NOT EXISTS persist_data (k TEXT UNIQUE NOT NULL PRIMARY KEY, v TEXT NOT NULL)",get:"SELECT v FROM persist_data WHERE k = ?",set:"INSERT INTO persist_data(k, v) VALUES (?, ?)",remove:"DELETE FROM persist_data WHERE k = ?"},flash:{div_id:'_persist_flash_wrap',id:'_persist_flash',path:'persist.swf',size:{w:1,h:1},args:{autostart:true}}};B={gears:{size:-1,test:function(){return(window.google&&window.google.gears)?true:false;},methods:{transaction:function(fn){var db=this.db;db.execute('BEGIN').close();fn.call(this,db);db.execute('COMMIT').close();},init:function(){var db;db=this.db=google.gears.factory.create('beta.database');db.open(esc(this.name));db.execute(C.sql.create).close();},get:function(key,fn,scope){var r,sql=C.sql.get;if(!fn)
return;this.transaction(function(t){var is_valid,val;r=t.execute(sql,[key]);is_valid=r.isValidRow();val=is_valid?r.field(0):null;r.close();fn.call(scope||this,is_valid,val);});},set:function(key,val,fn,scope){var rm_sql=C.sql.remove,sql=C.sql.set,r;this.transaction(function(t){t.execute(rm_sql,[key]).close();t.execute(sql,[key,val]).close();if(fn)
fn.call(scope||this,true,val);});},remove:function(key,fn,scope){var get_sql=C.sql.get;sql=C.sql.remove,r,val=null,is_valid=false;this.transaction(function(t){if(fn){r=t.execute(get_sql,[key]);is_valid=r.isValidRow();val=is_valid?r.field(0):null;r.close();}
if(!fn||is_valid){t.execute(sql,[key]).close();}
if(fn)
fn.call(scope||this,is_valid,val);});}}},whatwg_db:{size:200*1024,test:function(){var name='PersistJS Test',desc='Persistent database test.';if(!window.openDatabase)
return false;if(!window.openDatabase(name,C.sql.version,desc,B.whatwg_db.size))
return false;return true;},methods:{transaction:function(fn){if(!this.db_created){this.db.transaction(function(t){t.executeSql(C.sql.create,[],function(){this.db_created=true;});},empty);}
this.db.transaction(fn);},init:function(){this.db=openDatabase(this.name,C.sql.version,this.o.about||("Persistent storage for "+this.name),this.o.size||B.whatwg_db.size);},get:function(key,fn,scope){var sql=C.sql.get;if(!fn)
return;scope=scope||this;this.transaction(function(t){t.executeSql(sql,[key],function(t,r){if(r.rows.length>0)
fn.call(scope,true,r.rows.item(0)['v']);else
fn.call(scope,false,null);});});},set:function(key,val,fn,scope){var rm_sql=C.sql.remove,sql=C.sql.set;this.transaction(function(t){t.executeSql(rm_sql,[key],function(){t.executeSql(sql,[key,val],function(t,r){if(fn)
fn.call(scope||this,true,val);});});});return val;},remove:function(key,fn,scope){var get_sql=C.sql.get;sql=C.sql.remove;this.transaction(function(t){if(fn){t.executeSql(get_sql,[key],function(t,r){if(r.rows.length>0){var val=r.rows.item(0)['v'];t.executeSql(sql,[key],function(t,r){fn.call(scope||this,true,val);});}else{fn.call(scope||this,false,null);}});}else{t.executeSql(sql,[key]);}});}}},globalstorage:{size:5*1024*1024,test:function(){return window.globalStorage?true:false;},methods:{key:function(key){return esc(this.name)+esc(key);},init:function(){alert('domain = '+this.o.domain);this.store=globalStorage[this.o.domain];},get:function(key,fn,scope){key=this.key(key);if(fn)
fn.call(scope||this,true,this.store.getItem(key));},set:function(key,val,fn,scope){key=this.key(key);this.store.setItem(key,val);if(fn)
fn.call(scope||this,true,val);},remove:function(key,fn,scope){var val;key=this.key(key);val=this.store[key];this.store.removeItem(key);if(fn)
fn.call(scope||this,(val!==null),val);}}},localstorage:{size:-1,test:function(){return window.localStorage?true:false;},methods:{key:function(key){return esc(this.name)+esc(key);},init:function(){this.store=localStorage;},get:function(key,fn,scope){key=this.key(key);if(fn)
fn.call(scope||this,true,this.store.getItem(key));},set:function(key,val,fn,scope){key=this.key(key);this.store.setItem(key,val);if(fn)
fn.call(scope||this,true,val);},remove:function(key,fn,scope){var val;key=this.key(key);val=this.store.getItem(key);this.store.removeItem(key);if(fn)
fn.call(scope||this,(val!==null),val);}}},ie:{prefix:'_persist_data-',size:64*1024,test:function(){return window.ActiveXObject?true:false;},make_userdata:function(id){var el=document.createElement('div');el.id=id;el.style.display='none';el.addBehavior('#default#userdata');document.body.appendChild(el);return el;},methods:{init:function(){var id=B.ie.prefix+esc(this.name);this.el=B.ie.make_userdata(id);if(this.o.defer)
this.load();},get:function(key,fn,scope){var val;key=esc(key);if(!this.o.defer)
this.load();val=this.el.getAttribute(key);if(fn)
fn.call(scope||this,val?true:false,val);},set:function(key,val,fn,scope){key=esc(key);this.el.setAttribute(key,val);if(!this.o.defer)
this.save();if(fn)
fn.call(scope||this,true,val);},remove:function(key,fn,scope){var val;key=esc(key);if(!this.o.defer)
this.load();val=this.el.getAttribute(key);this.el.removeAttribute(key);if(!this.o.defer)
this.save();if(fn)
fn.call(scope||this,val?true:false,val);},load:function(){this.el.load(esc(this.name));},save:function(){this.el.save(esc(this.name));}}},cookie:{delim:':',size:4000,test:function(){return P.Cookie.enabled?true:false;},methods:{key:function(key){return this.name+B.cookie.delim+key;},get:function(key,fn,scope){var val;key=this.key(key);val=ec.get(key);if(fn)
fn.call(scope||this,val!=null,val);},set:function(key,val,fn,scope){key=this.key(key);ec.set(key,val,this.o);if(fn)
fn.call(scope||this,true,val);},remove:function(key,val,fn,scope){var val;key=this.key(key);val=ec.remove(key)
if(fn)
fn.call(scope||this,val!=null,val);}}},flash:{test:function(){if(!deconcept||!deconcept.SWFObjectUtil)
return false;var major=deconcept.SWFObjectUtil.getPlayerVersion().major;return(major>=8)?true:false;},methods:{init:function(){if(!B.flash.el){var o,key,el,cfg=C.flash;el=document.createElement('div');el.id=cfg.div_id;document.body.appendChild(el);o=new deconcept.SWFObject(this.o.swf_path||cfg.path,cfg.id,cfg.size.w,cfg.size.h,'8');for(key in cfg.args)
o.addVariable(key,cfg.args[key]);o.write(el);B.flash.el=document.getElementById(cfg.id);}
this.el=B.flash.el;},get:function(key,fn,scope){var val;key=esc(key);val=this.el.get(this.name,key);if(fn)
fn.call(scope||this,val!==null,val);},set:function(key,val,fn,scope){var old_val;key=esc(key);old_val=this.el.set(this.name,key,val);if(fn)
fn.call(scope||this,true,val);},remove:function(key,fn,scope){var val;key=esc(key);val=this.el.remove(this.name,key);if(fn)
fn.call(scope||this,true,val);}}}};var init=function(){var i,l,b,key,fns=C.methods,keys=C.search_order;for(i=0,l=fns.length;i<l;i++)
P.Store.prototype[fns[i]]=empty;P.type=null;P.size=-1;for(i=0,l=keys.length;!P.type&&i<l;i++){b=B[keys[i]];if(b.test()){P.type=keys[i];P.size=b.size;for(key in b.methods)
P.Store.prototype[key]=b.methods[key];}}
P._init=true;};P={VERSION:VERSION,type:null,size:0,add:function(o){B[o.id]=o;C.search_order=[o.id].concat(C.search_order);init();},remove:function(id){var ofs=index_of(C.search_order,id);if(ofs<0)
return;C.search_order.splice(ofs,1);delete B[id];init();},Cookie:ec,Store:function(name,o){if(!C.name_re.exec(name))
throw new Error("Invalid name");if(!P.type)
throw new Error("No suitable storage found");o=o||{};this.name=name;o.domain=o.domain||location.host||'localhost';o.domain=o.domain.replace(/:\d+$/,'')
this.o=o;o.expires=o.expires||365*2;o.path=o.path||'/';this.init();}};init();return P;})();if(typeof deconcept=="undefined")var deconcept=new Object();if(typeof deconcept.util=="undefined")deconcept.util=new Object();if(typeof deconcept.SWFObjectUtil=="undefined")deconcept.SWFObjectUtil=new Object();deconcept.SWFObject=function(swf,id,w,h,ver,c,quality,xiRedirectUrl,redirectUrl,detectKey){if(!document.getElementById){return;}
this.DETECT_KEY=detectKey?detectKey:'detectflash';this.skipDetect=deconcept.util.getRequestParameter(this.DETECT_KEY);this.params=new Object();this.variables=new Object();this.attributes=new Array();if(swf){this.setAttribute('swf',swf);}
if(id){this.setAttribute('id',id);}
if(w){this.setAttribute('width',w);}
if(h){this.setAttribute('height',h);}
if(ver){this.setAttribute('version',new deconcept.PlayerVersion(ver.toString().split(".")));}
this.installedVer=deconcept.SWFObjectUtil.getPlayerVersion();if(!window.opera&&document.all&&this.installedVer.major>7){deconcept.SWFObject.doPrepUnload=true;}
if(c){this.addParam('bgcolor',c);}
var q=quality?quality:'high';this.addParam('quality',q);this.setAttribute('useExpressInstall',false);this.setAttribute('doExpressInstall',false);var xir=(xiRedirectUrl)?xiRedirectUrl:window.location;this.setAttribute('xiRedirectUrl',xir);this.setAttribute('redirectUrl','');if(redirectUrl){this.setAttribute('redirectUrl',redirectUrl);}}
deconcept.SWFObject.prototype={useExpressInstall:function(path){this.xiSWFPath=!path?"expressinstall.swf":path;this.setAttribute('useExpressInstall',true);},setAttribute:function(name,value){this.attributes[name]=value;},getAttribute:function(name){return this.attributes[name];},addParam:function(name,value){this.params[name]=value;},getParams:function(){return this.params;},addVariable:function(name,value){this.variables[name]=value;},getVariable:function(name){return this.variables[name];},getVariables:function(){return this.variables;},getVariablePairs:function(){var variablePairs=new Array();var key;var variables=this.getVariables();for(key in variables){variablePairs.push(key+"="+variables[key]);}
return variablePairs;},getSWFHTML:function(){var swfNode="";if(navigator.plugins&&navigator.mimeTypes&&navigator.mimeTypes.length){if(this.getAttribute("doExpressInstall")){this.addVariable("MMplayerType","PlugIn");this.setAttribute('swf',this.xiSWFPath);}
swfNode='<embed type="application/x-shockwave-flash" src="'+this.getAttribute('swf')+'" width="'+this.getAttribute('width')+'" height="'+this.getAttribute('height')+'"';swfNode+=' id="'+this.getAttribute('id')+'" name="'+this.getAttribute('id')+'" ';var params=this.getParams();for(var key in params){swfNode+=[key]+'="'+params[key]+'" ';}
var pairs=this.getVariablePairs().join("&");if(pairs.length>0){swfNode+='flashvars="'+pairs+'"';}
swfNode+='/>';}else{if(this.getAttribute("doExpressInstall")){this.addVariable("MMplayerType","ActiveX");this.setAttribute('swf',this.xiSWFPath);}
swfNode='<object id="'+this.getAttribute('id')+'" classid="clsid:D27CDB6E-AE6D-11cf-96B8-444553540000" width="'+this.getAttribute('width')+'" height="'+this.getAttribute('height')+'">';swfNode+='<param name="movie" value="'+this.getAttribute('swf')+'" />';var params=this.getParams();for(var key in params){swfNode+='<param name="'+key+'" value="'+params[key]+'" />';}
var pairs=this.getVariablePairs().join("&");if(pairs.length>0){swfNode+='<param name="flashvars" value="'+pairs+'" />';}
swfNode+="</object>";}
return swfNode;},write:function(elementId){if(this.getAttribute('useExpressInstall')){var expressInstallReqVer=new deconcept.PlayerVersion([6,0,65]);if(this.installedVer.versionIsValid(expressInstallReqVer)&&!this.installedVer.versionIsValid(this.getAttribute('version'))){this.setAttribute('doExpressInstall',true);this.addVariable("MMredirectURL",escape(this.getAttribute('xiRedirectUrl')));document.title=document.title.slice(0,47)+" - Flash Player Installation";this.addVariable("MMdoctitle",document.title);}}
if(this.skipDetect||this.getAttribute('doExpressInstall')||this.installedVer.versionIsValid(this.getAttribute('version'))){var n=(typeof elementId=='string')?document.getElementById(elementId):elementId;n.innerHTML=this.getSWFHTML();return true;}else{if(this.getAttribute('redirectUrl')!=""){document.location.replace(this.getAttribute('redirectUrl'));}}
return false;}}
deconcept.SWFObjectUtil.getPlayerVersion=function(){var PlayerVersion=new deconcept.PlayerVersion([0,0,0]);if(navigator.plugins&&navigator.mimeTypes.length){var x=navigator.plugins["Shockwave Flash"];if(x&&x.description){PlayerVersion=new deconcept.PlayerVersion(x.description.replace(/([a-zA-Z]|\s)+/,"").replace(/(\s+r|\s+b[0-9]+)/,".").split("."));}}else{try{var axo=new ActiveXObject("ShockwaveFlash.ShockwaveFlash.7");}catch(e){try{var axo=new ActiveXObject("ShockwaveFlash.ShockwaveFlash.6");PlayerVersion=new deconcept.PlayerVersion([6,0,21]);axo.AllowScriptAccess="always";}catch(e){if(PlayerVersion.major==6){return PlayerVersion;}}
try{axo=new ActiveXObject("ShockwaveFlash.ShockwaveFlash");}catch(e){}}
if(axo!=null){PlayerVersion=new deconcept.PlayerVersion(axo.GetVariable("$version").split(" ")[1].split(","));}}
return PlayerVersion;}
deconcept.PlayerVersion=function(arrVersion){this.major=arrVersion[0]!=null?parseInt(arrVersion[0]):0;this.minor=arrVersion[1]!=null?parseInt(arrVersion[1]):0;this.rev=arrVersion[2]!=null?parseInt(arrVersion[2]):0;}
deconcept.PlayerVersion.prototype.versionIsValid=function(fv){if(this.major<fv.major)return false;if(this.major>fv.major)return true;if(this.minor<fv.minor)return false;if(this.minor>fv.minor)return true;if(this.rev<fv.rev)return false;return true;}
deconcept.util={getRequestParameter:function(param){var q=document.location.search||document.location.hash;if(q){var pairs=q.substring(1).split("&");for(var i=0;i<pairs.length;i++){if(pairs[i].substring(0,pairs[i].indexOf("="))==param){return pairs[i].substring((pairs[i].indexOf("=")+1));}}}
return"";}}
deconcept.SWFObjectUtil.cleanupSWFs=function(){var objects=document.getElementsByTagName("OBJECT");for(var i=0;i<objects.length;i++){objects[i].style.display='none';for(var x in objects[i]){if(typeof objects[i][x]=='function'){objects[i][x]=function(){};}}}}
if(deconcept.SWFObject.doPrepUnload){deconcept.SWFObjectUtil.prepUnload=function(){__flash_unloadHandler=function(){};__flash_savedUnloadHandler=function(){};window.attachEvent("onunload",deconcept.SWFObjectUtil.cleanupSWFs);}
window.attachEvent("onbeforeunload",deconcept.SWFObjectUtil.prepUnload);}
if(Array.prototype.push==null){Array.prototype.push=function(item){this[this.length]=item;return this.length;}}
var getQueryParamValue=deconcept.util.getRequestParameter;var FlashObject=deconcept.SWFObject;var SWFObject=deconcept.SWFObject;var biRadixBase=2;var biRadixBits=16;var bitsPerDigit=biRadixBits;var biRadix=1<<16;var biHalfRadix=biRadix>>>1;var biRadixSquared=biRadix*biRadix;var maxDigitVal=biRadix-1;var maxInteger=9999999999999998;var maxDigits;var ZERO_ARRAY;var bigZero,bigOne;function setMaxDigits(value){maxDigits=value;ZERO_ARRAY=new Array(maxDigits);for(var iza=0;iza<ZERO_ARRAY.length;iza++)ZERO_ARRAY[iza]=0;bigZero=new BigInt();bigOne=new BigInt();bigOne.digits[0]=1;}
setMaxDigits(20);var dpl10=15;var lr10=biFromNumber(1000000000000000);function BigInt(flag){if(typeof flag=="boolean"&&flag==true){this.digits=null;}else{this.digits=ZERO_ARRAY.slice(0);}
this.isNeg=false;}
function biFromDecimal(s){var isNeg=s.charAt(0)=='-';var i=isNeg?1:0;var result;while(i<s.length&&s.charAt(i)=='0')++i;if(i==s.length){result=new BigInt();}else{var digitCount=s.length-i;var fgl=digitCount%dpl10;if(fgl==0)fgl=dpl10;result=biFromNumber(Number(s.substr(i,fgl)));i+=fgl;while(i<s.length){result=biAdd(biMultiply(result,lr10),biFromNumber(Number(s.substr(i,dpl10))));i+=dpl10;}
result.isNeg=isNeg;}
return result;}
function biCopy(bi){var result=new BigInt(true);result.digits=bi.digits.slice(0);result.isNeg=bi.isNeg;return result;}
function biFromNumber(i){var result=new BigInt();result.isNeg=i<0;i=Math.abs(i);var j=0;while(i>0){result.digits[j++]=i&maxDigitVal;i>>=biRadixBits;}
return result;}
function reverseStr(s){var result="";for(var i=s.length-1;i>-1;--i){result+=s.charAt(i);}
return result;}
var hexatrigesimalToChar=new Array('0','1','2','3','4','5','6','7','8','9','a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','w','x','y','z');function biToString(x,radix)
{var b=new BigInt();b.digits[0]=radix;var qr=biDivideModulo(x,b);var result=hexatrigesimalToChar[qr[1].digits[0]];while(biCompare(qr[0],bigZero)==1){qr=biDivideModulo(qr[0],b);digit=qr[1].digits[0];result+=hexatrigesimalToChar[qr[1].digits[0]];}
return(x.isNeg?"-":"")+reverseStr(result);}
function biToDecimal(x){var b=new BigInt();b.digits[0]=10;var qr=biDivideModulo(x,b);var result=String(qr[1].digits[0]);while(biCompare(qr[0],bigZero)==1){qr=biDivideModulo(qr[0],b);result+=String(qr[1].digits[0]);}
return(x.isNeg?"-":"")+reverseStr(result);}
var hexToChar=new Array('0','1','2','3','4','5','6','7','8','9','a','b','c','d','e','f');function digitToHex(n){var mask=0xf;var result="";for(i=0;i<4;++i){result+=hexToChar[n&mask];n>>>=4;}
return reverseStr(result);}
function biToHex(x){var result="";var n=biHighIndex(x);for(var i=biHighIndex(x);i>-1;--i){result+=digitToHex(x.digits[i]);}
return result;}
function charToHex(c){var ZERO=48;var NINE=ZERO+9;var littleA=97;var littleZ=littleA+25;var bigA=65;var bigZ=65+25;var result;if(c>=ZERO&&c<=NINE){result=c-ZERO;}else if(c>=bigA&&c<=bigZ){result=10+c-bigA;}else if(c>=littleA&&c<=littleZ){result=10+c-littleA;}else{result=0;}
return result;}
function hexToDigit(s){var result=0;var sl=Math.min(s.length,4);for(var i=0;i<sl;++i){result<<=4;result|=charToHex(s.charCodeAt(i))}
return result;}
function biFromHex(s){var result=new BigInt();var sl=s.length;for(var i=sl,j=0;i>0;i-=4,++j){result.digits[j]=hexToDigit(s.substr(Math.max(i-4,0),Math.min(i,4)));}
return result;}
function biFromString(s,radix){var isNeg=s.charAt(0)=='-';var istop=isNeg?1:0;var result=new BigInt();var place=new BigInt();place.digits[0]=1;for(var i=s.length-1;i>=istop;i--){var c=s.charCodeAt(i);var digit=charToHex(c);var biDigit=biMultiplyDigit(place,digit);result=biAdd(result,biDigit);place=biMultiplyDigit(place,radix);}
result.isNeg=isNeg;return result;}
function biDump(b){return(b.isNeg?"-":"")+b.digits.join(" ");}
function biAdd(x,y){var result;if(x.isNeg!=y.isNeg){y.isNeg=!y.isNeg;result=biSubtract(x,y);y.isNeg=!y.isNeg;}else{result=new BigInt();var c=0;var n;for(var i=0;i<x.digits.length;++i){n=x.digits[i]+y.digits[i]+c;result.digits[i]=n&0xffff;c=Number(n>=biRadix);}
result.isNeg=x.isNeg;}
return result;}
function biSubtract(x,y){var result;if(x.isNeg!=y.isNeg){y.isNeg=!y.isNeg;result=biAdd(x,y);y.isNeg=!y.isNeg;}else{result=new BigInt();var n,c;c=0;for(var i=0;i<x.digits.length;++i){n=x.digits[i]-y.digits[i]+c;result.digits[i]=n&0xffff;if(result.digits[i]<0)result.digits[i]+=biRadix;c=0-Number(n<0);}
if(c==-1){c=0;for(var i=0;i<x.digits.length;++i){n=0-result.digits[i]+c;result.digits[i]=n&0xffff;if(result.digits[i]<0)result.digits[i]+=biRadix;c=0-Number(n<0);}
result.isNeg=!x.isNeg;}else{result.isNeg=x.isNeg;}}
return result;}
function biHighIndex(x){var result=x.digits.length-1;while(result>0&&x.digits[result]==0)--result;return result;}
function biNumBits(x){var n=biHighIndex(x);var d=x.digits[n];var m=(n+1)*bitsPerDigit;var result;for(result=m;result>m-bitsPerDigit;--result){if((d&0x8000)!=0)break;d<<=1;}
return result;}
function biMultiply(x,y){var result=new BigInt();var c;var n=biHighIndex(x);var t=biHighIndex(y);var u,uv,k;for(var i=0;i<=t;++i){c=0;k=i;for(j=0;j<=n;++j,++k){uv=result.digits[k]+x.digits[j]*y.digits[i]+c;result.digits[k]=uv&maxDigitVal;c=uv>>>biRadixBits;}
result.digits[i+n+1]=c;}
result.isNeg=x.isNeg!=y.isNeg;return result;}
function biMultiplyDigit(x,y){var n,c,uv;result=new BigInt();n=biHighIndex(x);c=0;for(var j=0;j<=n;++j){uv=result.digits[j]+x.digits[j]*y+c;result.digits[j]=uv&maxDigitVal;c=uv>>>biRadixBits;}
result.digits[1+n]=c;return result;}
function arrayCopy(src,srcStart,dest,destStart,n){var m=Math.min(srcStart+n,src.length);for(var i=srcStart,j=destStart;i<m;++i,++j){dest[j]=src[i];}}
var highBitMasks=new Array(0x0000,0x8000,0xC000,0xE000,0xF000,0xF800,0xFC00,0xFE00,0xFF00,0xFF80,0xFFC0,0xFFE0,0xFFF0,0xFFF8,0xFFFC,0xFFFE,0xFFFF);function biShiftLeft(x,n){var digitCount=Math.floor(n/bitsPerDigit);var result=new BigInt();arrayCopy(x.digits,0,result.digits,digitCount,result.digits.length-digitCount);var bits=n%bitsPerDigit;var rightBits=bitsPerDigit-bits;for(var i=result.digits.length-1,i1=i-1;i>0;--i,--i1){result.digits[i]=((result.digits[i]<<bits)&maxDigitVal)|((result.digits[i1]&highBitMasks[bits])>>>(rightBits));}
result.digits[0]=((result.digits[i]<<bits)&maxDigitVal);result.isNeg=x.isNeg;return result;}
var lowBitMasks=new Array(0x0000,0x0001,0x0003,0x0007,0x000F,0x001F,0x003F,0x007F,0x00FF,0x01FF,0x03FF,0x07FF,0x0FFF,0x1FFF,0x3FFF,0x7FFF,0xFFFF);function biShiftRight(x,n){var digitCount=Math.floor(n/bitsPerDigit);var result=new BigInt();arrayCopy(x.digits,digitCount,result.digits,0,x.digits.length-digitCount);var bits=n%bitsPerDigit;var leftBits=bitsPerDigit-bits;for(var i=0,i1=i+1;i<result.digits.length-1;++i,++i1){result.digits[i]=(result.digits[i]>>>bits)|((result.digits[i1]&lowBitMasks[bits])<<leftBits);}
result.digits[result.digits.length-1]>>>=bits;result.isNeg=x.isNeg;return result;}
function biMultiplyByRadixPower(x,n){var result=new BigInt();arrayCopy(x.digits,0,result.digits,n,result.digits.length-n);return result;}
function biDivideByRadixPower(x,n){var result=new BigInt();arrayCopy(x.digits,n,result.digits,0,result.digits.length-n);return result;}
function biModuloByRadixPower(x,n){var result=new BigInt();arrayCopy(x.digits,0,result.digits,0,n);return result;}
function biCompare(x,y){if(x.isNeg!=y.isNeg){return 1-2*Number(x.isNeg);}
for(var i=x.digits.length-1;i>=0;--i){if(x.digits[i]!=y.digits[i]){if(x.isNeg){return 1-2*Number(x.digits[i]>y.digits[i]);}else{return 1-2*Number(x.digits[i]<y.digits[i]);}}}
return 0;}
function biDivideModulo(x,y){var nb=biNumBits(x);var tb=biNumBits(y);var origYIsNeg=y.isNeg;var q,r;if(nb<tb){if(x.isNeg){q=biCopy(bigOne);q.isNeg=!y.isNeg;x.isNeg=false;y.isNeg=false;r=biSubtract(y,x);x.isNeg=true;y.isNeg=origYIsNeg;}else{q=new BigInt();r=biCopy(x);}
return new Array(q,r);}
q=new BigInt();r=x;var t=Math.ceil(tb/bitsPerDigit)-1;var lambda=0;while(y.digits[t]<biHalfRadix){y=biShiftLeft(y,1);++lambda;++tb;t=Math.ceil(tb/bitsPerDigit)-1;}
r=biShiftLeft(r,lambda);nb+=lambda;var n=Math.ceil(nb/bitsPerDigit)-1;var b=biMultiplyByRadixPower(y,n-t);while(biCompare(r,b)!=-1){++q.digits[n-t];r=biSubtract(r,b);}
for(var i=n;i>t;--i){var ri=(i>=r.digits.length)?0:r.digits[i];var ri1=(i-1>=r.digits.length)?0:r.digits[i-1];var ri2=(i-2>=r.digits.length)?0:r.digits[i-2];var yt=(t>=y.digits.length)?0:y.digits[t];var yt1=(t-1>=y.digits.length)?0:y.digits[t-1];if(ri==yt){q.digits[i-t-1]=maxDigitVal;}else{q.digits[i-t-1]=Math.floor((ri*biRadix+ri1)/yt);}
var c1=q.digits[i-t-1]*((yt*biRadix)+yt1);var c2=(ri*biRadixSquared)+((ri1*biRadix)+ri2);while(c1>c2){--q.digits[i-t-1];c1=q.digits[i-t-1]*((yt*biRadix)|yt1);c2=(ri*biRadix*biRadix)+((ri1*biRadix)+ri2);}
b=biMultiplyByRadixPower(y,i-t-1);r=biSubtract(r,biMultiplyDigit(b,q.digits[i-t-1]));if(r.isNeg){r=biAdd(r,b);--q.digits[i-t-1];}}
r=biShiftRight(r,lambda);q.isNeg=x.isNeg!=origYIsNeg;if(x.isNeg){if(origYIsNeg){q=biAdd(q,bigOne);}else{q=biSubtract(q,bigOne);}
y=biShiftRight(y,lambda);r=biSubtract(y,r);}
if(r.digits[0]==0&&biHighIndex(r)==0)r.isNeg=false;return new Array(q,r);}
function biDivide(x,y){return biDivideModulo(x,y)[0];}
function biModulo(x,y){return biDivideModulo(x,y)[1];}
function biMultiplyMod(x,y,m){return biModulo(biMultiply(x,y),m);}
function biPow(x,y){var result=bigOne;var a=x;while(true){if((y&1)!=0)result=biMultiply(result,a);y>>=1;if(y==0)break;a=biMultiply(a,a);}
return result;}
function biPowMod(x,y,m){var result=bigOne;var a=x;var k=y;while(true){if((k.digits[0]&1)!=0)result=biMultiplyMod(result,a,m);k=biShiftRight(k,1);if(k.digits[0]==0&&biHighIndex(k)==0)break;a=biMultiplyMod(a,a,m);}
return result;}
function BarrettMu(m){this.modulus=biCopy(m);this.k=biHighIndex(this.modulus)+1;var b2k=new BigInt();b2k.digits[2*this.k]=1;this.mu=biDivide(b2k,this.modulus);this.bkplus1=new BigInt();this.bkplus1.digits[this.k+1]=1;this.modulo=BarrettMu_modulo;this.multiplyMod=BarrettMu_multiplyMod;this.powMod=BarrettMu_powMod;}
function BarrettMu_modulo(x){var q1=biDivideByRadixPower(x,this.k-1);var q2=biMultiply(q1,this.mu);var q3=biDivideByRadixPower(q2,this.k+1);var r1=biModuloByRadixPower(x,this.k+1);var r2term=biMultiply(q3,this.modulus);var r2=biModuloByRadixPower(r2term,this.k+1);var r=biSubtract(r1,r2);if(r.isNeg){r=biAdd(r,this.bkplus1);}
var rgtem=biCompare(r,this.modulus)>=0;while(rgtem){r=biSubtract(r,this.modulus);rgtem=biCompare(r,this.modulus)>=0;}
return r;}
function BarrettMu_multiplyMod(x,y){var xy=biMultiply(x,y);return this.modulo(xy);}
function BarrettMu_powMod(x,y){var result=new BigInt();result.digits[0]=1;var a=x;var k=y;while(true){if((k.digits[0]&1)!=0)result=this.multiplyMod(result,a);k=biShiftRight(k,1);if(k.digits[0]==0&&biHighIndex(k)==0)break;a=this.multiplyMod(a,a);}
return result;}
function RSAKeyPair(encryptionExponent,decryptionExponent,modulus){this.e=biFromHex(encryptionExponent);this.d=biFromHex(decryptionExponent);this.m=biFromHex(modulus);this.chunkSize=2*biHighIndex(this.m);this.radix=16;this.barrett=new BarrettMu(this.m);}
function twoDigit(n){return(n<10?"0":"")+String(n);}
function encryptedString(key,s)
{var a=new Array();var sl=s.length;var i=0;while(i<sl){a[i]=s.charCodeAt(i);i++;}
while(a.length%key.chunkSize!=0){a[i++]=0;}
var al=a.length;var result="";var j,k,block;for(i=0;i<al;i+=key.chunkSize){block=new BigInt();j=0;for(k=i;k<i+key.chunkSize;++j){block.digits[j]=a[k++];block.digits[j]+=a[k++]<<8;}
var crypt=key.barrett.powMod(block,key.e);var text=key.radix==16?biToHex(crypt):biToString(crypt,key.radix);result+=text+" ";}
return result.substring(0,result.length-1);}
function decryptedString(key,s){var blocks=s.split(" ");var result="";var i,j,block;for(i=0;i<blocks.length;++i){var bi;if(key.radix==16){bi=biFromHex(blocks[i]);}else{bi=biFromString(blocks[i],key.radix);}
block=key.barrett.powMod(bi,key.d);for(j=0;j<=biHighIndex(block);++j){result+=String.fromCharCode(block.digits[j]&255,block.digits[j]>>8);}}
if(result.charCodeAt(result.length-1)==0){result=result.substring(0,result.length-1);}
return result;}
var __Crypto=__Crypto||{};function initPackages(__scope){var __package=function(packageRoot,pathString){var paths=pathString.split(".");var currentPackage=packageRoot;for(var i=0;i<paths.length;i++){var id=paths[i];if(currentPackage[id]==null){currentPackage[id]={};}
currentPackage=currentPackage[id];}
return currentPackage;};var __export=function(packageRoot,pathString,object){var paths=pathString.split(".");var currentPackage=packageRoot;for(var i=0;i<paths.length;i++){var id=paths[i];if(i<paths.length-1){if(currentPackage[id]==null){currentPackage[id]={};}}else{if(currentPackage[id]==null){currentPackage[id]=object;}else{throw"The specified package path is already defined. "+pathString;}}
currentPackage=currentPackage[id];}
return currentPackage;};var __import=function(packageRoot,pathString,object){var paths=pathString.split(".");var currentPackage=packageRoot;var currentPath="[package root]";for(var i=0;i<paths.length;i++){var id=paths[i];currentPath+="."+id;if(currentPackage[id]==null){throw pathString+" is not found. "+currentPath+" is null in "+__CURRENT_UNIT.unit_name+".";}
currentPackage=currentPackage[id];}
return currentPackage;};var __DEFINED_UNITS={};var __CURRENT_UNIT="";var __unit=function(unit_name){__DEFINED_UNITS[unit_name]=true;__CURRENT_UNIT={unit_name:unit_name,requring_units:{}};}
var __uses=function(unit_name){if(__DEFINED_UNITS[unit_name]){__CURRENT_UNIT.requring_units[unit_name]=true;return true;}else{throw"Unit Not Found Error : "+__CURRENT_UNIT.unit_name+" requires "+unit_name;}};__scope.__package=__package;__scope.__import=__import;__scope.__export=__export;__scope.__unit=__unit;__scope.__uses=__uses;__scope.__DEFINED_UNITS=__DEFINED_UNITS;__scope.__PACKAGE_ENABLED=true;__unit("packages.js");}
initPackages(__Crypto);function initBinary(packageRoot){if(packageRoot.__PACKAGE_ENABLED){__Crypto.__unit("binary.js");}
var i2a=['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z','a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','w','x','y','z','0','1','2','3','4','5','6','7','8','9','+','/'];function base64_encode(s){var length=s.length;var groupCount=Math.floor(length/3);var remaining=length-3*groupCount;var result="";var idx=0;for(var i=0;i<groupCount;i++){var b0=s[idx++]&0xff;var b1=s[idx++]&0xff;var b2=s[idx++]&0xff;result+=(i2a[b0>>2]);result+=(i2a[(b0<<4)&0x3f|(b1>>4)]);result+=(i2a[(b1<<2)&0x3f|(b2>>6)]);result+=(i2a[b2&0x3f]);}
if(remaining==0){}else if(remaining==1){var b0=s[idx++]&0xff;result+=(i2a[b0>>2]);result+=(i2a[(b0<<4)&0x3f]);result+=("==");}else if(remaining==2){var b0=s[idx++]&0xff;var b1=s[idx++]&0xff;result+=(i2a[b0>>2]);result+=(i2a[(b0<<4)&0x3f|(b1>>4)]);result+=(i2a[(b1<<2)&0x3f]);result+=('=');}else{throw"never happen";}
return result;}
var a2i=[-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,62,-1,-1,-1,63,52,53,54,55,56,57,58,59,60,61,-1,-1,-1,-1,-1,-1,-1,0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,-1,-1,-1,-1,-1,-1,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51];function get_a2i(c){var result=(0<=c)&&(c<a2i.length)?a2i[c]:-1;if(result<0)throw"Illegal character "+c;return result;}
function base64_decode(s){var length=s.length;var groupCount=Math.floor(length/4);if(4*groupCount!=length)throw"String length must be a multiple of four.";var missing=0;if(length!=0){if(s.charAt(length-1)=='='){missing++;groupCount--;}
if(s.charAt(length-2)=='=')missing++;}
var len=(3*groupCount-missing);if(len<0){len=0;}
var result=new Array(len);var idx_in=0;var idx_out=0;for(var i=0;i<groupCount;i++){var c0=get_a2i(s.charCodeAt(idx_in++));var c1=get_a2i(s.charCodeAt(idx_in++));var c2=get_a2i(s.charCodeAt(idx_in++));var c3=get_a2i(s.charCodeAt(idx_in++));result[idx_out++]=0xFF&((c0<<2)|(c1>>4));result[idx_out++]=0xFF&((c1<<4)|(c2>>2));result[idx_out++]=0xFF&((c2<<6)|c3);}
if(missing==0){}else if(missing==1){var c0=get_a2i(s.charCodeAt(idx_in++));var c1=get_a2i(s.charCodeAt(idx_in++));var c2=get_a2i(s.charCodeAt(idx_in++));result[idx_out++]=0xFF&((c0<<2)|(c1>>4));result[idx_out++]=0xFF&((c1<<4)|(c2>>2));}else if(missing==2){var c0=get_a2i(s.charCodeAt(idx_in++));var c1=get_a2i(s.charCodeAt(idx_in++));result[idx_out++]=0xFF&((c0<<2)|(c1>>4));}else{throw"never happen";}
return result;}
function base64x_encode(s){return base64x_pre_encode(base64_encode(s));}
function base64x_decode(s){return base64_decode(base64x_pre_decode(s));}
var base64x_pre_encode_map={};base64x_pre_encode_map["x"]="xx";base64x_pre_encode_map["+"]="xa";base64x_pre_encode_map["/"]="xb";base64x_pre_encode_map["="]="";function base64x_pre_encode(s){var ss="";for(var i=0;i<s.length;i++){var c=s.charAt(i);var cc=base64x_pre_encode_map[c];if(cc!=null){ss=ss+cc;}else{ss=ss+c;}}
return ss;}
var base64x_pre_decode_map={};base64x_pre_decode_map['x']='x';base64x_pre_decode_map['a']='+';base64x_pre_decode_map['b']='/';function base64x_pre_decode(s){var ss="";for(var i=0;i<s.length;i++){var c=s.charAt(i);if(c=='x'){c=s.charAt(++i);var cc=base64x_pre_decode_map[c];if(cc!=null){ss=ss+cc;}else{}}else{ss=ss+c;}}
while(ss.length%4!=0){ss+="=";}
return ss;}
function equals(a,b){if(a.length!=b.length)return false;var size=a.length;for(var i=0;i<size;i++){if(a[i]!=b[i])return false;}
return true;}
function hex(i){if(i==null)return"??";i&=0xff;var result=i.toString(16);return(result.length<2)?"0"+result:result;}
function base16(data,columns,delim){return base16_encode(data,columns,delim);}
function base16_encode(data,columns,delim){if(delim==null){delim="";}
if(columns==null){columns=256;}
var result="";for(var i=0;i<data.length;i++){result+=hex(data[i])+delim;}
return result.toUpperCase();}
var amap={};amap['0']=0;amap['1']=1;amap['2']=2;amap['3']=3;amap['4']=4;amap['5']=5;amap['6']=6;amap['7']=7;amap['8']=8;amap['9']=9;amap['A']=10;amap['B']=11;amap['C']=12;amap['D']=13;amap['E']=14;amap['F']=15;amap['a']=10;amap['b']=11;amap['c']=12;amap['d']=13;amap['e']=14;amap['f']=15;function get_amap(c){var cc=amap[c];if(cc==null)throw"found an invalid character.";return cc;}
function base16_decode(data){var ca=[];for(var i=0,j=0;i<data.length;i++){var c=data.charAt(i);if(c=="\s"){continue;}else{ca[j++]=c;}}
if(ca.length%2!=0){throw"data must be a multiple of two.";}
var result=new Array(ca.length>>1);for(var i=0;i<ca.length;i+=2){var v=0xff&((get_amap(ca[i])<<4)|(get_amap(ca[i+1])));result[i>>1]=v;}
return result;}
var B10000000=0x80;var B11000000=0xC0;var B11100000=0xE0;var B11110000=0xF0;var B11111000=0xF8;var B11111100=0xFC;var B11111110=0xFE;var B01111111=0x7F;var B00111111=0x3F;var B00011111=0x1F;var B00001111=0x0F;var B00000111=0x07;var B00000011=0x03;var B00000001=0x01;function str2utf8(str){var result=[];var length=str.length;var idx=0;for(var i=0;i<length;i++){var c=str.charCodeAt(i);if(c<=0x7f){result[idx++]=c;}else if(c<=0x7ff){result[idx++]=B11000000|(B00011111&(c>>>6));result[idx++]=B10000000|(B00111111&(c>>>0));}else if(c<=0xffff){result[idx++]=B11100000|(B00001111&(c>>>12));result[idx++]=B10000000|(B00111111&(c>>>6));result[idx++]=B10000000|(B00111111&(c>>>0));}else if(c<=0x10ffff){result[idx++]=B11110000|(B00000111&(c>>>18));result[idx++]=B10000000|(B00111111&(c>>>12));result[idx++]=B10000000|(B00111111&(c>>>6));result[idx++]=B10000000|(B00111111&(c>>>0));}else{throw"error";}}
return result;}
function utf82str(data){var result="";var length=data.length;for(var i=0;i<length;){var c=data[i++];if(c<0x80){result+=String.fromCharCode(c);}else if((c<B11100000)){result+=String.fromCharCode(((B00011111&c)<<6)|((B00111111&data[i++])<<0));}else if((c<B11110000)){result+=String.fromCharCode(((B00001111&c)<<12)|((B00111111&data[i++])<<6)|((B00111111&data[i++])<<0));}else if((c<B11111000)){result+=String.fromCharCode(((B00000111&c)<<18)|((B00111111&data[i++])<<12)|((B00111111&data[i++])<<6)|((B00111111&data[i++])<<0));}else if((c<B11111100)){result+=String.fromCharCode(((B00000011&c)<<24)|((B00111111&data[i++])<<18)|((B00111111&data[i++])<<12)|((B00111111&data[i++])<<6)|((B00111111&data[i++])<<0));}else if((c<B11111110)){result+=String.fromCharCode(((B00000001&c)<<30)|((B00111111&data[i++])<<24)|((B00111111&data[i++])<<18)|((B00111111&data[i++])<<12)|((B00111111&data[i++])<<6)|((B00111111&data[i++])<<0));}}
return result;}
function char2str(ca){var result="";for(var i=0;i<ca.length;i++){result+=String.fromCharCode(ca[i]);}
return result;}
function str2char(str){var result=new Array(str.length);for(var i=0;i<str.length;i++){result[i]=str.charCodeAt(i);}
return result;}
function i2ba_be(i){return[0xff&(i>>24),0xff&(i>>16),0xff&(i>>8),0xff&(i>>0)];}
function ba2i_be(bs){return((bs[0]<<24)|(bs[1]<<16)|(bs[2]<<8)|(bs[3]<<0));}
function s2ba_be(i){return[0xff&(i>>8),0xff&(i>>0)];}
function ba2s_be(bs){return(0|(bs[0]<<8)|(bs[1]<<0));}
function i2ba_le(i){return[0xff&(i>>0),0xff&(i>>8),0xff&(i>>16),0xff&(i>>24)];}
function ba2i_le(bs){return(0|(bs[3]<<0)|(bs[2]<<8)|(bs[1]<<16)|(bs[0]<<24));}
function s2ba_le(i){return[0xff&(i>>0),0xff&(i>>8)];}
function ba2s_le(bs){return(0|(bs[1]<<0)|(bs[0]<<8));}
function ia2ba_be(ia){var length=ia.length<<2;var ba=new Array(length);for(var ii=0,bi=0;ii<ia.length&&bi<ba.length;){ba[bi++]=0xff&(ia[ii]>>24);ba[bi++]=0xff&(ia[ii]>>16);ba[bi++]=0xff&(ia[ii]>>8);ba[bi++]=0xff&(ia[ii]>>0);ii++;}
return ba;}
function ba2ia_be(ba){var length=(ba.length+3)>>2;var ia=new Array(length);;for(var ii=0,bi=0;ii<ia.length&&bi<ba.length;){ia[ii++]=(bi<ba.length?(ba[bi++]<<24):0)|(bi<ba.length?(ba[bi++]<<16):0)|(bi<ba.length?(ba[bi++]<<8):0)|(bi<ba.length?(ba[bi++]):0);}
return ia;}
function ia2ba_le(ia){var length=ia.length<<2;var ba=new Array(length);for(var ii=0,bi=0;ii<ia.length&&bi<ba.length;){ba[bi++]=0xff&(ia[ii]>>0);ba[bi++]=0xff&(ia[ii]>>8);ba[bi++]=0xff&(ia[ii]>>16);ba[bi++]=0xff&(ia[ii]>>24);ii++;}
return ba;}
function ba2ia_le(ba){var length=(ba.length+3)>>2;var ia=new Array(length);;for(var ii=0,bi=0;ii<ia.length&&bi<ba.length;){ia[ii++]=(bi<ba.length?(ba[bi++]):0)|(bi<ba.length?(ba[bi++]<<8):0)|(bi<ba.length?(ba[bi++]<<16):0)|(bi<ba.length?(ba[bi++]<<24):0);}
return ia;}
function trim(s){var result="";for(var idx=0;idx<s.length;idx++){var c=s.charAt(idx);if(c=="\s"||c=="\t"||c=="\r"||c=="\n"){}else{result+=c;}}
return result;}
function mktst(encode,decode){return function(trial,from,to){var flg=true;for(var i=0;i<trial;i++){for(var j=from;j<to;j++){var arr=new Array(j);for(var k=0;k<j;k++)
arr[k]=Math.floor(Math.random()*256);var s=encode(arr);var b=decode(s);trace("in :"+arr.length+":"+base16_encode(arr));trace("b64:"+s.length+":"+s);trace("out:"+b.length+":"+base16_encode(arr));if(equals(arr,b)){trace("OK! ( "+i+","+j+")");}else{trace("ERR ( "+i+","+j+")");flg=false;}
trace("-----------");}}
if(flg){trace("ALL OK! ");}else{trace("FOUND ERROR!");}};}
packageRoot.base64_encode=base64_encode;packageRoot.base64_decode=base64_decode;packageRoot.base64_test=mktst(base64_encode,base64_decode);packageRoot.base64x_encode=base64x_encode;packageRoot.base64x_decode=base64x_decode;packageRoot.base64x_test=mktst(base64x_encode,base64x_decode);packageRoot.base64x_pre_encode=base64x_pre_encode;packageRoot.base64x_pre_decode=base64x_pre_decode;packageRoot.base16_encode=base16_encode;packageRoot.base16_decode=base16_decode;packageRoot.base16=base16;packageRoot.hex=base16;packageRoot.utf82str=utf82str;packageRoot.str2utf8=str2utf8;packageRoot.str2char=str2char;packageRoot.char2str=char2str;packageRoot.i2ba=i2ba_be;packageRoot.ba2i=ba2i_be;packageRoot.i2ba_be=i2ba_be;packageRoot.ba2i_be=ba2i_be;packageRoot.i2ba_le=i2ba_le;packageRoot.ba2i_le=ba2i_le;packageRoot.s2ba=s2ba_be;packageRoot.ba2s=ba2s_be;packageRoot.s2ba_be=s2ba_be;packageRoot.ba2s_be=ba2s_be;packageRoot.s2ba_le=s2ba_le;packageRoot.ba2s_le=ba2s_le;packageRoot.ba2ia=ba2ia_be;packageRoot.ia2ba=ia2ba_be;packageRoot.ia2ba_be=ia2ba_be;packageRoot.ba2ia_be=ba2ia_be;packageRoot.ia2ba_le=ia2ba_le;packageRoot.ba2ia_le=ba2ia_le;packageRoot.cmparr=equals;}
initBinary(__Crypto);function initBlockCipher(packageRoot){__Crypto.__unit("Cipher.js");__Crypto.__uses("packages.js");var MAXINT=0xFFFFFFFF;function rotb(b,n){return(b<<n|b>>>(8-n))&0xFF;}
function rotw(w,n){return(w<<n|w>>>(32-n))&MAXINT;}
function getW(a,i){return a[i]|a[i+1]<<8|a[i+2]<<16|a[i+3]<<24;}
function setW(a,i,w){a.splice(i,4,w&0xFF,(w>>>8)&0xFF,(w>>>16)&0xFF,(w>>>24)&0xFF);}
function setWInv(a,i,w){a.splice(i,4,(w>>>24)&0xFF,(w>>>16)&0xFF,(w>>>8)&0xFF,w&0xFF);}
function getB(x,n){return(x>>>(n*8))&0xFF;}
function getNrBits(i){var n=0;while(i>0){n++;i>>>=1;}
return n;}
function getMask(n){return(1<<n)-1;}
function randByte(){return Math.floor(Math.random()*256);}
var ALGORITHMS={};function createRijndael(){var keyBytes=null;var dataBytes=null;var dataOffset=-1;var algorithmName=null;algorithmName="rijndael"
var aesNk;var aesNr;var aesPows;var aesLogs;var aesSBox;var aesSBoxInv;var aesRco;var aesFtable;var aesRtable;var aesFi;var aesRi;var aesFkey;var aesRkey;function aesMult(x,y){return(x&&y)?aesPows[(aesLogs[x]+aesLogs[y])%255]:0;}
function aesPackBlock(){return[getW(dataBytes,dataOffset),getW(dataBytes,dataOffset+4),getW(dataBytes,dataOffset+8),getW(dataBytes,dataOffset+12)];}
function aesUnpackBlock(packed){for(var j=0;j<4;j++,dataOffset+=4)setW(dataBytes,dataOffset,packed[j]);}
function aesXTime(p){p<<=1;return p&0x100?p^0x11B:p;}
function aesSubByte(w){return aesSBox[getB(w,0)]|aesSBox[getB(w,1)]<<8|aesSBox[getB(w,2)]<<16|aesSBox[getB(w,3)]<<24;}
function aesProduct(w1,w2){return aesMult(getB(w1,0),getB(w2,0))^aesMult(getB(w1,1),getB(w2,1))^aesMult(getB(w1,2),getB(w2,2))^aesMult(getB(w1,3),getB(w2,3));}
function aesInvMixCol(x){return aesProduct(0x090d0b0e,x)|aesProduct(0x0d0b0e09,x)<<8|aesProduct(0x0b0e090d,x)<<16|aesProduct(0x0e090d0b,x)<<24;}
function aesByteSub(x){var y=aesPows[255-aesLogs[x]];x=y;x=rotb(x,1);y^=x;x=rotb(x,1);y^=x;x=rotb(x,1);y^=x;x=rotb(x,1);return x^y^0x63;}
function aesGenTables(){var i,y;aesPows=[1,3];aesLogs=[0,0,null,1];aesSBox=new Array(256);aesSBoxInv=new Array(256);aesFtable=new Array(256);aesRtable=new Array(256);aesRco=new Array(30);for(i=2;i<256;i++){aesPows[i]=aesPows[i-1]^aesXTime(aesPows[i-1]);aesLogs[aesPows[i]]=i;}
aesSBox[0]=0x63;aesSBoxInv[0x63]=0;for(i=1;i<256;i++){y=aesByteSub(i);aesSBox[i]=y;aesSBoxInv[y]=i;}
for(i=0,y=1;i<30;i++){aesRco[i]=y;y=aesXTime(y);}
for(i=0;i<256;i++){y=aesSBox[i];aesFtable[i]=aesXTime(y)|y<<8|y<<16|(y^aesXTime(y))<<24;y=aesSBoxInv[i];aesRtable[i]=aesMult(14,y)|aesMult(9,y)<<8|aesMult(13,y)<<16|aesMult(11,y)<<24;}}
function aesInit(key){keyBytes=key;keyBytes=keyBytes.slice(0,32);var i,k,m;var j=0;var l=keyBytes.length;while(l!=16&&l!=24&&l!=32)keyBytes[l++]=keyBytes[j++];aesGenTables();aesNk=keyBytes.length>>>2;aesNr=6+aesNk;var N=4*(aesNr+1);aesFi=new Array(12);aesRi=new Array(12);aesFkey=new Array(N);aesRkey=new Array(N);for(m=j=0;j<4;j++,m+=3){aesFi[m]=(j+1)%4;aesFi[m+1]=(j+2)%4;aesFi[m+2]=(j+3)%4;aesRi[m]=(4+j-1)%4;aesRi[m+1]=(4+j-2)%4;aesRi[m+2]=(4+j-3)%4;}
for(i=j=0;i<aesNk;i++,j+=4)aesFkey[i]=getW(keyBytes,j);for(k=0,j=aesNk;j<N;j+=aesNk,k++){aesFkey[j]=aesFkey[j-aesNk]^aesSubByte(rotw(aesFkey[j-1],24))^aesRco[k];if(aesNk<=6)for(i=1;i<aesNk&&(i+j)<N;i++)aesFkey[i+j]=aesFkey[i+j-aesNk]^aesFkey[i+j-1];else{for(i=1;i<4&&(i+j)<N;i++)aesFkey[i+j]=aesFkey[i+j-aesNk]^aesFkey[i+j-1];if((j+4)<N)aesFkey[j+4]=aesFkey[j+4-aesNk]^aesSubByte(aesFkey[j+3]);for(i=5;i<aesNk&&(i+j)<N;i++)aesFkey[i+j]=aesFkey[i+j-aesNk]^aesFkey[i+j-1];}}
for(j=0;j<4;j++)aesRkey[j+N-4]=aesFkey[j];for(i=4;i<N-4;i+=4){k=N-4-i;for(j=0;j<4;j++)aesRkey[k+j]=aesInvMixCol(aesFkey[i+j]);}
for(j=N-4;j<N;j++)aesRkey[j-N+4]=aesFkey[j];}
function aesClose(){aesPows=aesLogs=aesSBox=aesSBoxInv=aesRco=null;aesFtable=aesRtable=aesFi=aesRi=aesFkey=aesRkey=null;}
function aesRounds(block,key,table,inc,box){var tmp=new Array(4);var i,j,m,r;for(r=0;r<4;r++)block[r]^=key[r];for(i=1;i<aesNr;i++){for(j=m=0;j<4;j++,m+=3){tmp[j]=key[r++]^table[block[j]&0xFF]^rotw(table[(block[inc[m]]>>>8)&0xFF],8)^rotw(table[(block[inc[m+1]]>>>16)&0xFF],16)^rotw(table[(block[inc[m+2]]>>>24)&0xFF],24);}
var t=block;block=tmp;tmp=t;}
for(j=m=0;j<4;j++,m+=3)
tmp[j]=key[r++]^box[block[j]&0xFF]^rotw(box[(block[inc[m]]>>>8)&0xFF],8)^rotw(box[(block[inc[m+1]]>>>16)&0xFF],16)^rotw(box[(block[inc[m+2]]>>>24)&0xFF],24);return tmp;}
function aesEncrypt(data,offset){dataBytes=data;dataOffset=offset;aesUnpackBlock(aesRounds(aesPackBlock(),aesFkey,aesFtable,aesFi,aesSBox));}
function aesDecrypt(data,offset){dataBytes=data;dataOffset=offset;aesUnpackBlock(aesRounds(aesPackBlock(),aesRkey,aesRtable,aesRi,aesSBoxInv));}
return{name:"rijndael",blocksize:128/8,open:aesInit,close:aesClose,encrypt:aesEncrypt,decrypt:aesDecrypt};}
ALGORITHMS.RIJNDAEL={create:createRijndael};function createSerpent(){var keyBytes=null;var dataBytes=null;var dataOffset=-1;var algorithmName=null;algorithmName="serpent";var srpKey=[];function srpK(r,a,b,c,d,i){r[a]^=srpKey[4*i];r[b]^=srpKey[4*i+1];r[c]^=srpKey[4*i+2];r[d]^=srpKey[4*i+3];}
function srpLK(r,a,b,c,d,e,i){r[a]=rotw(r[a],13);r[c]=rotw(r[c],3);r[b]^=r[a];r[e]=(r[a]<<3)&MAXINT;r[d]^=r[c];r[b]^=r[c];r[b]=rotw(r[b],1);r[d]^=r[e];r[d]=rotw(r[d],7);r[e]=r[b];r[a]^=r[b];r[e]=(r[e]<<7)&MAXINT;r[c]^=r[d];r[a]^=r[d];r[c]^=r[e];r[d]^=srpKey[4*i+3];r[b]^=srpKey[4*i+1];r[a]=rotw(r[a],5);r[c]=rotw(r[c],22);r[a]^=srpKey[4*i+0];r[c]^=srpKey[4*i+2];}
function srpKL(r,a,b,c,d,e,i){r[a]^=srpKey[4*i+0];r[b]^=srpKey[4*i+1];r[c]^=srpKey[4*i+2];r[d]^=srpKey[4*i+3];r[a]=rotw(r[a],27);r[c]=rotw(r[c],10);r[e]=r[b];r[c]^=r[d];r[a]^=r[d];r[e]=(r[e]<<7)&MAXINT;r[a]^=r[b];r[b]=rotw(r[b],31);r[c]^=r[e];r[d]=rotw(r[d],25);r[e]=(r[a]<<3)&MAXINT;r[b]^=r[a];r[d]^=r[e];r[a]=rotw(r[a],19);r[b]^=r[c];r[d]^=r[c];r[c]=rotw(r[c],29);}
var srpS=[function(r,x0,x1,x2,x3,x4){r[x4]=r[x3];r[x3]|=r[x0];r[x0]^=r[x4];r[x4]^=r[x2];r[x4]=~r[x4];r[x3]^=r[x1];r[x1]&=r[x0];r[x1]^=r[x4];r[x2]^=r[x0];r[x0]^=r[x3];r[x4]|=r[x0];r[x0]^=r[x2];r[x2]&=r[x1];r[x3]^=r[x2];r[x1]=~r[x1];r[x2]^=r[x4];r[x1]^=r[x2];},function(r,x0,x1,x2,x3,x4){r[x4]=r[x1];r[x1]^=r[x0];r[x0]^=r[x3];r[x3]=~r[x3];r[x4]&=r[x1];r[x0]|=r[x1];r[x3]^=r[x2];r[x0]^=r[x3];r[x1]^=r[x3];r[x3]^=r[x4];r[x1]|=r[x4];r[x4]^=r[x2];r[x2]&=r[x0];r[x2]^=r[x1];r[x1]|=r[x0];r[x0]=~r[x0];r[x0]^=r[x2];r[x4]^=r[x1];},function(r,x0,x1,x2,x3,x4){r[x3]=~r[x3];r[x1]^=r[x0];r[x4]=r[x0];r[x0]&=r[x2];r[x0]^=r[x3];r[x3]|=r[x4];r[x2]^=r[x1];r[x3]^=r[x1];r[x1]&=r[x0];r[x0]^=r[x2];r[x2]&=r[x3];r[x3]|=r[x1];r[x0]=~r[x0];r[x3]^=r[x0];r[x4]^=r[x0];r[x0]^=r[x2];r[x1]|=r[x2];},function(r,x0,x1,x2,x3,x4){r[x4]=r[x1];r[x1]^=r[x3];r[x3]|=r[x0];r[x4]&=r[x0];r[x0]^=r[x2];r[x2]^=r[x1];r[x1]&=r[x3];r[x2]^=r[x3];r[x0]|=r[x4];r[x4]^=r[x3];r[x1]^=r[x0];r[x0]&=r[x3];r[x3]&=r[x4];r[x3]^=r[x2];r[x4]|=r[x1];r[x2]&=r[x1];r[x4]^=r[x3];r[x0]^=r[x3];r[x3]^=r[x2];},function(r,x0,x1,x2,x3,x4){r[x4]=r[x3];r[x3]&=r[x0];r[x0]^=r[x4];r[x3]^=r[x2];r[x2]|=r[x4];r[x0]^=r[x1];r[x4]^=r[x3];r[x2]|=r[x0];r[x2]^=r[x1];r[x1]&=r[x0];r[x1]^=r[x4];r[x4]&=r[x2];r[x2]^=r[x3];r[x4]^=r[x0];r[x3]|=r[x1];r[x1]=~r[x1];r[x3]^=r[x0];},function(r,x0,x1,x2,x3,x4){r[x4]=r[x1];r[x1]|=r[x0];r[x2]^=r[x1];r[x3]=~r[x3];r[x4]^=r[x0];r[x0]^=r[x2];r[x1]&=r[x4];r[x4]|=r[x3];r[x4]^=r[x0];r[x0]&=r[x3];r[x1]^=r[x3];r[x3]^=r[x2];r[x0]^=r[x1];r[x2]&=r[x4];r[x1]^=r[x2];r[x2]&=r[x0];r[x3]^=r[x2];},function(r,x0,x1,x2,x3,x4){r[x4]=r[x1];r[x3]^=r[x0];r[x1]^=r[x2];r[x2]^=r[x0];r[x0]&=r[x3];r[x1]|=r[x3];r[x4]=~r[x4];r[x0]^=r[x1];r[x1]^=r[x2];r[x3]^=r[x4];r[x4]^=r[x0];r[x2]&=r[x0];r[x4]^=r[x1];r[x2]^=r[x3];r[x3]&=r[x1];r[x3]^=r[x0];r[x1]^=r[x2];},function(r,x0,x1,x2,x3,x4){r[x1]=~r[x1];r[x4]=r[x1];r[x0]=~r[x0];r[x1]&=r[x2];r[x1]^=r[x3];r[x3]|=r[x4];r[x4]^=r[x2];r[x2]^=r[x3];r[x3]^=r[x0];r[x0]|=r[x1];r[x2]&=r[x0];r[x0]^=r[x4];r[x4]^=r[x3];r[x3]&=r[x0];r[x4]^=r[x1];r[x2]^=r[x4];r[x3]^=r[x1];r[x4]|=r[x0];r[x4]^=r[x1];}];var srpSI=[function(r,x0,x1,x2,x3,x4){r[x4]=r[x3];r[x1]^=r[x0];r[x3]|=r[x1];r[x4]^=r[x1];r[x0]=~r[x0];r[x2]^=r[x3];r[x3]^=r[x0];r[x0]&=r[x1];r[x0]^=r[x2];r[x2]&=r[x3];r[x3]^=r[x4];r[x2]^=r[x3];r[x1]^=r[x3];r[x3]&=r[x0];r[x1]^=r[x0];r[x0]^=r[x2];r[x4]^=r[x3];},function(r,x0,x1,x2,x3,x4){r[x1]^=r[x3];r[x4]=r[x0];r[x0]^=r[x2];r[x2]=~r[x2];r[x4]|=r[x1];r[x4]^=r[x3];r[x3]&=r[x1];r[x1]^=r[x2];r[x2]&=r[x4];r[x4]^=r[x1];r[x1]|=r[x3];r[x3]^=r[x0];r[x2]^=r[x0];r[x0]|=r[x4];r[x2]^=r[x4];r[x1]^=r[x0];r[x4]^=r[x1];},function(r,x0,x1,x2,x3,x4){r[x2]^=r[x1];r[x4]=r[x3];r[x3]=~r[x3];r[x3]|=r[x2];r[x2]^=r[x4];r[x4]^=r[x0];r[x3]^=r[x1];r[x1]|=r[x2];r[x2]^=r[x0];r[x1]^=r[x4];r[x4]|=r[x3];r[x2]^=r[x3];r[x4]^=r[x2];r[x2]&=r[x1];r[x2]^=r[x3];r[x3]^=r[x4];r[x4]^=r[x0];},function(r,x0,x1,x2,x3,x4){r[x2]^=r[x1];r[x4]=r[x1];r[x1]&=r[x2];r[x1]^=r[x0];r[x0]|=r[x4];r[x4]^=r[x3];r[x0]^=r[x3];r[x3]|=r[x1];r[x1]^=r[x2];r[x1]^=r[x3];r[x0]^=r[x2];r[x2]^=r[x3];r[x3]&=r[x1];r[x1]^=r[x0];r[x0]&=r[x2];r[x4]^=r[x3];r[x3]^=r[x0];r[x0]^=r[x1];},function(r,x0,x1,x2,x3,x4){r[x2]^=r[x3];r[x4]=r[x0];r[x0]&=r[x1];r[x0]^=r[x2];r[x2]|=r[x3];r[x4]=~r[x4];r[x1]^=r[x0];r[x0]^=r[x2];r[x2]&=r[x4];r[x2]^=r[x0];r[x0]|=r[x4];r[x0]^=r[x3];r[x3]&=r[x2];r[x4]^=r[x3];r[x3]^=r[x1];r[x1]&=r[x0];r[x4]^=r[x1];r[x0]^=r[x3];},function(r,x0,x1,x2,x3,x4){r[x4]=r[x1];r[x1]|=r[x2];r[x2]^=r[x4];r[x1]^=r[x3];r[x3]&=r[x4];r[x2]^=r[x3];r[x3]|=r[x0];r[x0]=~r[x0];r[x3]^=r[x2];r[x2]|=r[x0];r[x4]^=r[x1];r[x2]^=r[x4];r[x4]&=r[x0];r[x0]^=r[x1];r[x1]^=r[x3];r[x0]&=r[x2];r[x2]^=r[x3];r[x0]^=r[x2];r[x2]^=r[x4];r[x4]^=r[x3];},function(r,x0,x1,x2,x3,x4){r[x0]^=r[x2];r[x4]=r[x0];r[x0]&=r[x3];r[x2]^=r[x3];r[x0]^=r[x2];r[x3]^=r[x1];r[x2]|=r[x4];r[x2]^=r[x3];r[x3]&=r[x0];r[x0]=~r[x0];r[x3]^=r[x1];r[x1]&=r[x2];r[x4]^=r[x0];r[x3]^=r[x4];r[x4]^=r[x2];r[x0]^=r[x1];r[x2]^=r[x0];},function(r,x0,x1,x2,x3,x4){r[x4]=r[x3];r[x3]&=r[x0];r[x0]^=r[x2];r[x2]|=r[x4];r[x4]^=r[x1];r[x0]=~r[x0];r[x1]|=r[x3];r[x4]^=r[x0];r[x0]&=r[x2];r[x0]^=r[x1];r[x1]&=r[x2];r[x3]^=r[x2];r[x4]^=r[x3];r[x2]&=r[x3];r[x3]|=r[x0];r[x1]^=r[x4];r[x3]^=r[x4];r[x4]&=r[x0];r[x4]^=r[x2];}];var srpKc=[7788,63716,84032,7891,78949,25146,28835,67288,84032,40055,7361,1940,77639,27525,24193,75702,7361,35413,83150,82383,58619,48468,18242,66861,83150,69667,7788,31552,40054,23222,52496,57565,7788,63716];var srpEc=[44255,61867,45034,52496,73087,56255,43827,41448,18242,1939,18581,56255,64584,31097,26469,77728,77639,4216,64585,31097,66861,78949,58006,59943,49676,78950,5512,78949,27525,52496,18670,76143];var srpDc=[44255,60896,28835,1837,1057,4216,18242,77301,47399,53992,1939,1940,66420,39172,78950,45917,82383,7450,67288,26469,83149,57565,66419,47400,58006,44254,18581,18228,33048,45034,66508,7449];function srpInit(key){keyBytes=key;var i,j,m,n;function keyIt(a,b,c,d,i){srpKey[i]=r[b]=rotw(srpKey[a]^r[b]^r[c]^r[d]^0x9e3779b9^i,11);}
function keyLoad(a,b,c,d,i){r[a]=srpKey[i];r[b]=srpKey[i+1];r[c]=srpKey[i+2];r[d]=srpKey[i+3];}
function keyStore(a,b,c,d,i){srpKey[i]=r[a];srpKey[i+1]=r[b];srpKey[i+2]=r[c];srpKey[i+3]=r[d];}
keyBytes.reverse();keyBytes[keyBytes.length]=1;while(keyBytes.length<32)keyBytes[keyBytes.length]=0;for(i=0;i<8;i++){srpKey[i]=(keyBytes[4*i+0]&0xff)|(keyBytes[4*i+1]&0xff)<<8|(keyBytes[4*i+2]&0xff)<<16|(keyBytes[4*i+3]&0xff)<<24;}
var r=[srpKey[3],srpKey[4],srpKey[5],srpKey[6],srpKey[7]];i=0;j=0;while(keyIt(j++,0,4,2,i++),keyIt(j++,1,0,3,i++),i<132){keyIt(j++,2,1,4,i++);if(i==8){j=0;}
keyIt(j++,3,2,0,i++);keyIt(j++,4,3,1,i++);}
i=128;j=3;n=0;while(m=srpKc[n++],srpS[j++%8](r,m%5,m%7,m%11,m%13,m%17),m=srpKc[n],keyStore(m%5,m%7,m%11,m%13,i),i>0){i-=4;keyLoad(m%5,m%7,m%11,m%13,i);}}
function srpClose(){srpKey=[];}
function srpEncrypt(data,offset){dataBytes=data;dataOffset=offset;var blk=dataBytes.slice(dataOffset,dataOffset+16);blk.reverse();var r=[getW(blk,0),getW(blk,4),getW(blk,8),getW(blk,12)];srpK(r,0,1,2,3,0);var n=0,m=srpEc[n];while(srpS[n%8](r,m%5,m%7,m%11,m%13,m%17),n<31){m=srpEc[++n];srpLK(r,m%5,m%7,m%11,m%13,m%17,n);}
srpK(r,0,1,2,3,32);for(var j=3;j>=0;j--,dataOffset+=4)setWInv(dataBytes,dataOffset,r[j]);}
function srpDecrypt(data,offset){dataBytes=data;dataOffset=offset;var blk=dataBytes.slice(dataOffset,dataOffset+16);blk.reverse();var r=[getW(blk,0),getW(blk,4),getW(blk,8),getW(blk,12)];srpK(r,0,1,2,3,32);var n=0,m=srpDc[n];while(srpSI[7-n%8](r,m%5,m%7,m%11,m%13,m%17),n<31){m=srpDc[++n];srpKL(r,m%5,m%7,m%11,m%13,m%17,32-n);}
srpK(r,2,3,1,4,0);setWInv(dataBytes,dataOffset,r[4]);setWInv(dataBytes,dataOffset+4,r[1]);setWInv(dataBytes,dataOffset+8,r[3]);setWInv(dataBytes,dataOffset+12,r[2]);dataOffset+=16;}
return{name:"serpent",blocksize:128/8,open:srpInit,close:srpClose,encrypt:srpEncrypt,decrypt:srpDecrypt};}
ALGORITHMS.SERPENT={create:createSerpent};function createTwofish(){var keyBytes=null;var dataBytes=null;var dataOffset=-1;var algorithmName=null;algorithmName="twofish";var tfsKey=[];var tfsM=[[],[],[],[]];function tfsInit(key){keyBytes=key;var i,a,b,c,d,meKey=[],moKey=[],inKey=[];var kLen;var sKey=[];var f01,f5b,fef;var q0=[[8,1,7,13,6,15,3,2,0,11,5,9,14,12,10,4],[2,8,11,13,15,7,6,14,3,1,9,4,0,10,12,5]];var q1=[[14,12,11,8,1,2,3,5,15,4,10,6,7,0,9,13],[1,14,2,11,4,12,3,7,6,13,10,5,15,9,0,8]];var q2=[[11,10,5,14,6,13,9,0,12,8,15,3,2,4,7,1],[4,12,7,5,1,6,9,10,0,14,13,8,2,11,3,15]];var q3=[[13,7,15,4,1,2,6,14,9,11,3,0,8,5,12,10],[11,9,5,1,12,3,13,14,6,4,7,15,2,0,8,10]];var ror4=[0,8,1,9,2,10,3,11,4,12,5,13,6,14,7,15];var ashx=[0,9,2,11,4,13,6,15,8,1,10,3,12,5,14,7];var q=[[],[]];var m=[[],[],[],[]];function ffm5b(x){return x^(x>>2)^[0,90,180,238][x&3];}
function ffmEf(x){return x^(x>>1)^(x>>2)^[0,238,180,90][x&3];}
function mdsRem(p,q){var i,t,u;for(i=0;i<8;i++){t=q>>>24;q=((q<<8)&MAXINT)|p>>>24;p=(p<<8)&MAXINT;u=t<<1;if(t&128){u^=333;}
q^=t^(u<<16);u^=t>>>1;if(t&1){u^=166;}
q^=u<<24|u<<8;}
return q;}
function qp(n,x){var a,b,c,d;a=x>>4;b=x&15;c=q0[n][a^b];d=q1[n][ror4[b]^ashx[a]];return q3[n][ror4[d]^ashx[c]]<<4|q2[n][c^d];}
function hFun(x,key){var a=getB(x,0),b=getB(x,1),c=getB(x,2),d=getB(x,3);switch(kLen){case 4:a=q[1][a]^getB(key[3],0);b=q[0][b]^getB(key[3],1);c=q[0][c]^getB(key[3],2);d=q[1][d]^getB(key[3],3);case 3:a=q[1][a]^getB(key[2],0);b=q[1][b]^getB(key[2],1);c=q[0][c]^getB(key[2],2);d=q[0][d]^getB(key[2],3);case 2:a=q[0][q[0][a]^getB(key[1],0)]^getB(key[0],0);b=q[0][q[1][b]^getB(key[1],1)]^getB(key[0],1);c=q[1][q[0][c]^getB(key[1],2)]^getB(key[0],2);d=q[1][q[1][d]^getB(key[1],3)]^getB(key[0],3);}
return m[0][a]^m[1][b]^m[2][c]^m[3][d];}
keyBytes=keyBytes.slice(0,32);i=keyBytes.length;while(i!=16&&i!=24&&i!=32)keyBytes[i++]=0;for(i=0;i<keyBytes.length;i+=4){inKey[i>>2]=getW(keyBytes,i);}
for(i=0;i<256;i++){q[0][i]=qp(0,i);q[1][i]=qp(1,i);}
for(i=0;i<256;i++){f01=q[1][i];f5b=ffm5b(f01);fef=ffmEf(f01);m[0][i]=f01+(f5b<<8)+(fef<<16)+(fef<<24);m[2][i]=f5b+(fef<<8)+(f01<<16)+(fef<<24);f01=q[0][i];f5b=ffm5b(f01);fef=ffmEf(f01);m[1][i]=fef+(fef<<8)+(f5b<<16)+(f01<<24);m[3][i]=f5b+(f01<<8)+(fef<<16)+(f5b<<24);}
kLen=inKey.length/2;for(i=0;i<kLen;i++){a=inKey[i+i];meKey[i]=a;b=inKey[i+i+1];moKey[i]=b;sKey[kLen-i-1]=mdsRem(a,b);}
for(i=0;i<40;i+=2){a=0x1010101*i;b=a+0x1010101;a=hFun(a,meKey);b=rotw(hFun(b,moKey),8);tfsKey[i]=(a+b)&MAXINT;tfsKey[i+1]=rotw(a+2*b,9);}
for(i=0;i<256;i++){a=b=c=d=i;switch(kLen){case 4:a=q[1][a]^getB(sKey[3],0);b=q[0][b]^getB(sKey[3],1);c=q[0][c]^getB(sKey[3],2);d=q[1][d]^getB(sKey[3],3);case 3:a=q[1][a]^getB(sKey[2],0);b=q[1][b]^getB(sKey[2],1);c=q[0][c]^getB(sKey[2],2);d=q[0][d]^getB(sKey[2],3);case 2:tfsM[0][i]=m[0][q[0][q[0][a]^getB(sKey[1],0)]^getB(sKey[0],0)];tfsM[1][i]=m[1][q[0][q[1][b]^getB(sKey[1],1)]^getB(sKey[0],1)];tfsM[2][i]=m[2][q[1][q[0][c]^getB(sKey[1],2)]^getB(sKey[0],2)];tfsM[3][i]=m[3][q[1][q[1][d]^getB(sKey[1],3)]^getB(sKey[0],3)];}}}
function tfsG0(x){return tfsM[0][getB(x,0)]^tfsM[1][getB(x,1)]^tfsM[2][getB(x,2)]^tfsM[3][getB(x,3)];}
function tfsG1(x){return tfsM[0][getB(x,3)]^tfsM[1][getB(x,0)]^tfsM[2][getB(x,1)]^tfsM[3][getB(x,2)];}
function tfsFrnd(r,blk){var a=tfsG0(blk[0]);var b=tfsG1(blk[1]);blk[2]=rotw(blk[2]^(a+b+tfsKey[4*r+8])&MAXINT,31);blk[3]=rotw(blk[3],1)^(a+2*b+tfsKey[4*r+9])&MAXINT;a=tfsG0(blk[2]);b=tfsG1(blk[3]);blk[0]=rotw(blk[0]^(a+b+tfsKey[4*r+10])&MAXINT,31);blk[1]=rotw(blk[1],1)^(a+2*b+tfsKey[4*r+11])&MAXINT;}
function tfsIrnd(i,blk){var a=tfsG0(blk[0]);var b=tfsG1(blk[1]);blk[2]=rotw(blk[2],1)^(a+b+tfsKey[4*i+10])&MAXINT;blk[3]=rotw(blk[3]^(a+2*b+tfsKey[4*i+11])&MAXINT,31);a=tfsG0(blk[2]);b=tfsG1(blk[3]);blk[0]=rotw(blk[0],1)^(a+b+tfsKey[4*i+8])&MAXINT;blk[1]=rotw(blk[1]^(a+2*b+tfsKey[4*i+9])&MAXINT,31);}
function tfsClose(){tfsKey=[];tfsM=[[],[],[],[]];}
function tfsEncrypt(data,offset){dataBytes=data;dataOffset=offset;var blk=[getW(dataBytes,dataOffset)^tfsKey[0],getW(dataBytes,dataOffset+4)^tfsKey[1],getW(dataBytes,dataOffset+8)^tfsKey[2],getW(dataBytes,dataOffset+12)^tfsKey[3]];for(var j=0;j<8;j++){tfsFrnd(j,blk);}
setW(dataBytes,dataOffset,blk[2]^tfsKey[4]);setW(dataBytes,dataOffset+4,blk[3]^tfsKey[5]);setW(dataBytes,dataOffset+8,blk[0]^tfsKey[6]);setW(dataBytes,dataOffset+12,blk[1]^tfsKey[7]);dataOffset+=16;}
function tfsDecrypt(data,offset){dataBytes=data;dataOffset=offset;var blk=[getW(dataBytes,dataOffset)^tfsKey[4],getW(dataBytes,dataOffset+4)^tfsKey[5],getW(dataBytes,dataOffset+8)^tfsKey[6],getW(dataBytes,dataOffset+12)^tfsKey[7]];for(var j=7;j>=0;j--){tfsIrnd(j,blk);}
setW(dataBytes,dataOffset,blk[2]^tfsKey[0]);setW(dataBytes,dataOffset+4,blk[3]^tfsKey[1]);setW(dataBytes,dataOffset+8,blk[0]^tfsKey[2]);setW(dataBytes,dataOffset+12,blk[1]^tfsKey[3]);dataOffset+=16;}
return{name:"twofish",blocksize:128/8,open:tfsInit,close:tfsClose,encrypt:tfsEncrypt,decrypt:tfsDecrypt};}
ALGORITHMS.TWOFISH={create:createTwofish};var MODES={};function createECB(){function encryptOpenECB(){this.algorithm.open(this.keyBytes);this.dataLength=this.dataBytes.length;this.dataOffset=0;return;}
function encryptCloseECB(){this.algorithm.close();}
function encryptProcECB(){this.algorithm.encrypt(this.dataBytes,this.dataOffset);this.dataOffset+=this.algorithm.blocksize;if(this.dataLength<=this.dataOffset){return 0;}else{return this.dataLength-this.dataOffset;}}
function decryptOpenECB(){this.algorithm.open(this.keyBytes);this.dataLength=this.dataBytes.length;this.dataOffset=0;return;}
function decryptProcECB(){this.algorithm.decrypt(this.dataBytes,this.dataOffset);this.dataOffset+=this.algorithm.blocksize;if(this.dataLength<=this.dataOffset){return 0;}else{return this.dataLength-this.dataOffset;}}
function decryptCloseECB(){this.algorithm.close();while(this.dataBytes[this.dataBytes.length-1]==0)
this.dataBytes.pop();}
return{encrypt:{open:encryptOpenECB,exec:encryptProcECB,close:encryptCloseECB},decrypt:{open:decryptOpenECB,exec:decryptProcECB,close:decryptCloseECB}};}
MODES.ECB=createECB();function createCBC(){function encryptOpenCBC(){this.algorithm.open(this.keyBytes);this.dataBytes.unshift(randByte(),randByte(),randByte(),randByte(),randByte(),randByte(),randByte(),randByte(),randByte(),randByte(),randByte(),randByte(),randByte(),randByte(),randByte(),randByte());this.dataLength=this.dataBytes.length;this.dataOffset=16;return;}
function encryptProcCBC(){for(var idx2=this.dataOffset;idx2<this.dataOffset+16;idx2++)
this.dataBytes[idx2]^=this.dataBytes[idx2-16];this.algorithm.encrypt(this.dataBytes,this.dataOffset);this.dataOffset+=this.algorithm.blocksize;if(this.dataLength<=this.dataOffset){return 0;}else{return this.dataLength-this.dataOffset;}}
function encryptCloseCBC(){this.algorithm.close();}
function decryptOpenCBC(){this.algorithm.open(this.keyBytes);this.dataLength=this.dataBytes.length;this.dataOffset=16;this.iv=this.dataBytes.slice(0,16);return;}
function decryptProcCBC(){var iv2=this.dataBytes.slice(this.dataOffset,this.dataOffset+16);this.algorithm.decrypt(this.dataBytes,this.dataOffset);for(var ii=0;ii<16;ii++)
this.dataBytes[this.dataOffset+ii]^=this.iv[ii];this.dataOffset+=this.algorithm.blocksize;this.iv=iv2;if(this.dataLength<=this.dataOffset){return 0;}else{return this.dataLength-this.dataOffset;}}
function decryptCloseCBC(){this.algorithm.close();this.dataBytes.splice(0,16);while(this.dataBytes[this.dataBytes.length-1]==0)
this.dataBytes.pop();}
return{encrypt:{open:encryptOpenCBC,exec:encryptProcCBC,close:encryptCloseCBC},decrypt:{open:decryptOpenCBC,exec:decryptProcCBC,close:decryptCloseCBC}};}
MODES.CBC=createCBC();function createCFB(){function encryptOpenCFB(){throw"not implemented!";}
function encryptProcCFB(){throw"not implemented!";}
function encryptCloseCFB(){throw"not implemented!";}
function decryptOpenCFB(){throw"not implemented!";}
function decryptProcCFB(){throw"not implemented!";}
function decryptCloseCFB(){throw"not implemented!";}
return{encrypt:{open:encryptOpenCFB,exec:encryptProcCFB,close:encryptCloseCFB},decrypt:{open:decryptOpenCFB,exec:decryptProcCFB,close:decryptCloseCFB}};}
MODES.CFB=createCFB();function createOFB(){function encryptOpenOFB(){throw"not implemented!";}
function encryptProcOFB(){throw"not implemented!";}
function encryptCloseOFB(){throw"not implemented!";}
function decryptOpenOFB(){throw"not implemented!";}
function decryptProcOFB(){throw"not implemented!";}
function decryptCloseOFB(){throw"not implemented!";}
return{encrypt:{open:encryptOpenOFB,exec:encryptProcOFB,close:encryptCloseOFB},decrypt:{open:decryptOpenOFB,exec:decryptProcOFB,close:decryptCloseOFB}};}
MODES.OFB=createOFB();function createCTR(){function encryptOpenCTR(){throw"not implemented!";}
function encryptProcCTR(){throw"not implemented!";}
function encryptCloseCTR(){throw"not implemented!";}
function decryptOpenCTR(){throw"not implemented!";}
function decryptProcCTR(){throw"not implemented!";}
function decryptCloseCTR(){throw"not implemented!";}
return{encrypt:{open:encryptOpenCTR,exec:encryptProcCTR,close:encryptCloseCTR},decrypt:{open:decryptOpenCTR,exec:decryptProcCTR,close:decryptCloseCTR}};}
MODES.CTR=createCTR();var PADDINGS={};function createRFC1321(){function appendPaddingRFC1321(data){var len=16-(data.length%16);data.push(0x80);for(var i=1;i<len;i++){data.push(0x00);}
return data;}
function removePaddingRFC1321(data){for(var i=data.length-1;0<=i;i--){var val=data[i];if(val==0x80){data.splice(i);break;}else if(val!=0x00){break;}}
return data;}
return{append:appendPaddingRFC1321,remove:removePaddingRFC1321};};PADDINGS.RFC1321=createRFC1321();function createANSIX923(){function appendPaddingANSIX923(data){var len=16-(data.length%16);for(var i=0;i<len-1;i++){data.push(0x00);}
data.push(len);return data;}
function removePaddingANSIX923(data){var len=data.pop();if(16<len)len=16;for(var i=1;i<len;i++){data.pop();}
return data;}
return{append:appendPaddingANSIX923,remove:removePaddingANSIX923};}
PADDINGS.ANSIX923=createANSIX923();function createISO10126(){function appendPaddingISO10126(data){var len=16-(data.length%16);for(var i=0;i<len-1;i++){data.push(randByte());}
data.push(len);return data;}
function removePaddingISO10126(data){var len=data.pop();if(16<len)len=16;for(var i=1;i<len;i++){data.pop();}
return data;}
return{append:appendPaddingISO10126,remove:removePaddingISO10126};}
PADDINGS.ISO10126=createISO10126();function createPKCS7(){function appendPaddingPKCS7(data){var len=16-(data.length%16);for(var i=0;i<len;i++){data.push(len);}
return data;}
function removePaddingPKCS7(data){var len=data.pop();if(16<len)len=0;for(var i=1;i<len;i++){data.pop();}
return data;}
return{append:appendPaddingPKCS7,remove:removePaddingPKCS7};}
PADDINGS.PKCS7=createPKCS7();function createNoPadding(){function appendPaddingNone(data){return data;}
function removePaddingNone(data){return data;}
return{append:appendPaddingNone,remove:removePaddingNone};}
PADDINGS.NO_PADDING=createNoPadding();var DIRECTIONS={ENCRYPT:"encrypt",DECRYPT:"decrypt"};function Cipher(algorithm,direction,mode,padding){this.algorithm=algorithm;this.direction=direction;this.mode=mode;this.padding=padding;this.modeOpen=mode[direction].open;this.modeExec=mode[direction].exec;this.modeClose=mode[direction].close;this.keyBytes=null;this.dataBytes=null;this.dataOffset=-1;this.dataLength=-1;}
Cipher.prototype=new Object();Cipher.prototype.inherit=Cipher;function open(keyBytes,dataBytes){if(keyBytes==null)throw"keyBytes is null";if(dataBytes==null)throw"dataBytes is null";this.keyBytes=keyBytes.concat();this.dataBytes=dataBytes;this.dataOffset=0;this.dataLength=dataBytes.length;if(this.direction==DIRECTIONS.ENCRYPT){this.padding.append(this.dataBytes);}
this.modeOpen();}
function operate(){return this.modeExec();}
function close(){this.modeClose();if(this.direction==DIRECTIONS.DECRYPT){this.padding.remove(this.dataBytes);}
return this.dataBytes;}
function execute(keyBytes,dataBytes){this.open(keyBytes,dataBytes);for(;;){var size=this.operate();if(0<size){continue;}else{break;}}
return this.close();}
Cipher.prototype.open=open;Cipher.prototype.close=close;Cipher.prototype.operate=operate;Cipher.prototype.execute=execute;Cipher.ENCRYPT="ENCRYPT";Cipher.DECRYPT="DECRYPT";Cipher.RIJNDAEL="RIJNDAEL";Cipher.SERPENT="SERPENT";Cipher.TWOFISH="TWOFISH";Cipher.ECB="ECB";Cipher.CBC="CBC";Cipher.CFB="CFB";Cipher.OFB="OFB";Cipher.CTR="CTR";Cipher.RFC1321="RFC1321";Cipher.ANSIX923="ANSIX923";Cipher.ISO10126="ISO10126";Cipher.PKCS7="PKCS7";Cipher.NO_PADDING="NO_PADDING";Cipher.create=function(algorithmName,directionName,modeName,paddingName){if(algorithmName==null)algorithmName=Cipher.RIJNDAEL;if(directionName==null)directionName=Cipher.ENCRYPT;if(modeName==null)modeName=Cipher.CBC;if(paddingName==null)paddingName=Cipher.PKCS7;var algorithm=ALGORITHMS[algorithmName];var direction=DIRECTIONS[directionName];var mode=MODES[modeName];var padding=PADDINGS[paddingName];if(algorithm==null)throw"Invalid algorithm name '"+algorithmName+"'.";if(direction==null)throw"Invalid direction name '"+directionName+"'.";if(mode==null)throw"Invalid mode name '"+modeName+"'.";if(padding==null)throw"Invalid padding name '"+paddingName+"'.";return new Cipher(algorithm.create(),direction,mode,padding);};Cipher.algorithm=function(algorithmName){if(algorithmName==null)throw"Null Pointer Exception ( algorithmName )";var algorithm=ALGORITHMS[algorithmName];if(algorithm==null)throw"Invalid algorithm name '"+algorithmName+"'.";return algorithm.create();}
__Crypto.__export(packageRoot,"titaniumcore.crypto.Cipher",Cipher);}
initBlockCipher(__Crypto);function initRNG(packages){__Crypto.__unit("SecureRandom.js");__Crypto.__uses("packages.js");var Arcfour=function(){this.i=0;this.j=0;this.S=new Array();};Arcfour.prototype.init=function(key){var i,j,t;for(i=0;i<256;++i)
this.S[i]=i;j=0;for(i=0;i<256;++i){j=(j+this.S[i]+key[i%key.length])&255;t=this.S[i];this.S[i]=this.S[j];this.S[j]=t;}
this.i=0;this.j=0;};Arcfour.prototype.next=function(){var t;this.i=(this.i+1)&255;this.j=(this.j+this.S[this.i])&255;t=this.S[this.i];this.S[this.i]=this.S[this.j];this.S[this.j]=t;return this.S[(t+this.S[this.i])&255];};Arcfour.create=function(){return new Arcfour();};Arcfour.rng_psize=256;var rng_state=null;var rng_pool=[];var rng_pptr=0;rng_seed_int=function(x){rng_pool[rng_pptr]^=x&255;rng_pptr++;rng_pool[rng_pptr]^=(x>>8)&255;rng_pptr++;rng_pool[rng_pptr]^=(x>>16)&255;rng_pptr++;rng_pool[rng_pptr]^=(x>>24)&255;rng_pptr++;if(rng_pptr>=Arcfour.rng_psize)rng_pptr-=Arcfour.rng_psize;};rng_seed_time=function(){rng_seed_int(new Date().getTime());};pool_init=function(){var t;while(rng_pptr<Arcfour.rng_psize){t=Math.floor(65536*Math.random());rng_pool[rng_pptr++]=t>>>8;rng_pool[rng_pptr++]=t&255;}
rng_pptr=0;rng_seed_time();};var rng_get_byte=function(){if(rng_state==null){rng_seed_time();rng_state=Arcfour.create();rng_state.init(rng_pool);for(rng_pptr=0;rng_pptr<rng_pool.length;++rng_pptr)
rng_pool[rng_pptr]=0;rng_pptr=0;}
return rng_state.next();};var SecureRandom=function(){};SecureRandom.prototype.nextBytes=function(ba){for(var i=0;i<ba.length;++i)
ba[i]=rng_get_byte();};pool_init();__Crypto.__export(packages,"titaniumcore.crypto.SecureRandom",SecureRandom);};initRNG(__Crypto);var hexcase=0;var b64pad="";function hex_md5(s){return rstr2hex(rstr_md5(str2rstr_utf8(s)));}
function b64_md5(s){return rstr2b64(rstr_md5(str2rstr_utf8(s)));}
function any_md5(s,e){return rstr2any(rstr_md5(str2rstr_utf8(s)),e);}
function hex_hmac_md5(k,d)
{return rstr2hex(rstr_hmac_md5(str2rstr_utf8(k),str2rstr_utf8(d)));}
function b64_hmac_md5(k,d)
{return rstr2b64(rstr_hmac_md5(str2rstr_utf8(k),str2rstr_utf8(d)));}
function any_hmac_md5(k,d,e)
{return rstr2any(rstr_hmac_md5(str2rstr_utf8(k),str2rstr_utf8(d)),e);}
function md5_vm_test()
{return hex_md5("abc").toLowerCase()=="900150983cd24fb0d6963f7d28e17f72";}
function rstr_md5(s)
{return binl2rstr(binl_md5(rstr2binl(s),s.length*8));}
function rstr_hmac_md5(key,data)
{var bkey=rstr2binl(key);if(bkey.length>16)bkey=binl_md5(bkey,key.length*8);var ipad=Array(16),opad=Array(16);for(var i=0;i<16;i++)
{ipad[i]=bkey[i]^0x36363636;opad[i]=bkey[i]^0x5C5C5C5C;}
var hash=binl_md5(ipad.concat(rstr2binl(data)),512+data.length*8);return binl2rstr(binl_md5(opad.concat(hash),512+128));}
function rstr2hex(input)
{try{hexcase}catch(e){hexcase=0;}
var hex_tab=hexcase?"0123456789ABCDEF":"0123456789abcdef";var output="";var x;for(var i=0;i<input.length;i++)
{x=input.charCodeAt(i);output+=hex_tab.charAt((x>>>4)&0x0F)
+hex_tab.charAt(x&0x0F);}
return output;}
function rstr2b64(input)
{try{b64pad}catch(e){b64pad='';}
var tab="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";var output="";var len=input.length;for(var i=0;i<len;i+=3)
{var triplet=(input.charCodeAt(i)<<16)|(i+1<len?input.charCodeAt(i+1)<<8:0)|(i+2<len?input.charCodeAt(i+2):0);for(var j=0;j<4;j++)
{if(i*8+j*6>input.length*8)output+=b64pad;else output+=tab.charAt((triplet>>>6*(3-j))&0x3F);}}
return output;}
function rstr2any(input,encoding)
{var divisor=encoding.length;var i,j,q,x,quotient;var dividend=Array(Math.ceil(input.length/2));for(i=0;i<dividend.length;i++)
{dividend[i]=(input.charCodeAt(i*2)<<8)|input.charCodeAt(i*2+1);}
var full_length=Math.ceil(input.length*8/(Math.log(encoding.length)/Math.log(2)));var remainders=Array(full_length);for(j=0;j<full_length;j++)
{quotient=Array();x=0;for(i=0;i<dividend.length;i++)
{x=(x<<16)+dividend[i];q=Math.floor(x/divisor);x-=q*divisor;if(quotient.length>0||q>0)
quotient[quotient.length]=q;}
remainders[j]=x;dividend=quotient;}
var output="";for(i=remainders.length-1;i>=0;i--)
output+=encoding.charAt(remainders[i]);return output;}
function str2rstr_utf8(input)
{var output="";var i=-1;var x,y;while(++i<input.length)
{x=input.charCodeAt(i);y=i+1<input.length?input.charCodeAt(i+1):0;if(0xD800<=x&&x<=0xDBFF&&0xDC00<=y&&y<=0xDFFF)
{x=0x10000+((x&0x03FF)<<10)+(y&0x03FF);i++;}
if(x<=0x7F)
output+=String.fromCharCode(x);else if(x<=0x7FF)
output+=String.fromCharCode(0xC0|((x>>>6)&0x1F),0x80|(x&0x3F));else if(x<=0xFFFF)
output+=String.fromCharCode(0xE0|((x>>>12)&0x0F),0x80|((x>>>6)&0x3F),0x80|(x&0x3F));else if(x<=0x1FFFFF)
output+=String.fromCharCode(0xF0|((x>>>18)&0x07),0x80|((x>>>12)&0x3F),0x80|((x>>>6)&0x3F),0x80|(x&0x3F));}
return output;}
function str2rstr_utf16le(input)
{var output="";for(var i=0;i<input.length;i++)
output+=String.fromCharCode(input.charCodeAt(i)&0xFF,(input.charCodeAt(i)>>>8)&0xFF);return output;}
function str2rstr_utf16be(input)
{var output="";for(var i=0;i<input.length;i++)
output+=String.fromCharCode((input.charCodeAt(i)>>>8)&0xFF,input.charCodeAt(i)&0xFF);return output;}
function rstr2binl(input)
{var output=Array(input.length>>2);for(var i=0;i<output.length;i++)
output[i]=0;for(var i=0;i<input.length*8;i+=8)
output[i>>5]|=(input.charCodeAt(i/8)&0xFF)<<(i%32);return output;}
function binl2rstr(input)
{var output="";for(var i=0;i<input.length*32;i+=8)
output+=String.fromCharCode((input[i>>5]>>>(i%32))&0xFF);return output;}
function binl_md5(x,len)
{x[len>>5]|=0x80<<((len)%32);x[(((len+64)>>>9)<<4)+14]=len;var a=1732584193;var b=-271733879;var c=-1732584194;var d=271733878;for(var i=0;i<x.length;i+=16)
{var olda=a;var oldb=b;var oldc=c;var oldd=d;a=md5_ff(a,b,c,d,x[i+0],7,-680876936);d=md5_ff(d,a,b,c,x[i+1],12,-389564586);c=md5_ff(c,d,a,b,x[i+2],17,606105819);b=md5_ff(b,c,d,a,x[i+3],22,-1044525330);a=md5_ff(a,b,c,d,x[i+4],7,-176418897);d=md5_ff(d,a,b,c,x[i+5],12,1200080426);c=md5_ff(c,d,a,b,x[i+6],17,-1473231341);b=md5_ff(b,c,d,a,x[i+7],22,-45705983);a=md5_ff(a,b,c,d,x[i+8],7,1770035416);d=md5_ff(d,a,b,c,x[i+9],12,-1958414417);c=md5_ff(c,d,a,b,x[i+10],17,-42063);b=md5_ff(b,c,d,a,x[i+11],22,-1990404162);a=md5_ff(a,b,c,d,x[i+12],7,1804603682);d=md5_ff(d,a,b,c,x[i+13],12,-40341101);c=md5_ff(c,d,a,b,x[i+14],17,-1502002290);b=md5_ff(b,c,d,a,x[i+15],22,1236535329);a=md5_gg(a,b,c,d,x[i+1],5,-165796510);d=md5_gg(d,a,b,c,x[i+6],9,-1069501632);c=md5_gg(c,d,a,b,x[i+11],14,643717713);b=md5_gg(b,c,d,a,x[i+0],20,-373897302);a=md5_gg(a,b,c,d,x[i+5],5,-701558691);d=md5_gg(d,a,b,c,x[i+10],9,38016083);c=md5_gg(c,d,a,b,x[i+15],14,-660478335);b=md5_gg(b,c,d,a,x[i+4],20,-405537848);a=md5_gg(a,b,c,d,x[i+9],5,568446438);d=md5_gg(d,a,b,c,x[i+14],9,-1019803690);c=md5_gg(c,d,a,b,x[i+3],14,-187363961);b=md5_gg(b,c,d,a,x[i+8],20,1163531501);a=md5_gg(a,b,c,d,x[i+13],5,-1444681467);d=md5_gg(d,a,b,c,x[i+2],9,-51403784);c=md5_gg(c,d,a,b,x[i+7],14,1735328473);b=md5_gg(b,c,d,a,x[i+12],20,-1926607734);a=md5_hh(a,b,c,d,x[i+5],4,-378558);d=md5_hh(d,a,b,c,x[i+8],11,-2022574463);c=md5_hh(c,d,a,b,x[i+11],16,1839030562);b=md5_hh(b,c,d,a,x[i+14],23,-35309556);a=md5_hh(a,b,c,d,x[i+1],4,-1530992060);d=md5_hh(d,a,b,c,x[i+4],11,1272893353);c=md5_hh(c,d,a,b,x[i+7],16,-155497632);b=md5_hh(b,c,d,a,x[i+10],23,-1094730640);a=md5_hh(a,b,c,d,x[i+13],4,681279174);d=md5_hh(d,a,b,c,x[i+0],11,-358537222);c=md5_hh(c,d,a,b,x[i+3],16,-722521979);b=md5_hh(b,c,d,a,x[i+6],23,76029189);a=md5_hh(a,b,c,d,x[i+9],4,-640364487);d=md5_hh(d,a,b,c,x[i+12],11,-421815835);c=md5_hh(c,d,a,b,x[i+15],16,530742520);b=md5_hh(b,c,d,a,x[i+2],23,-995338651);a=md5_ii(a,b,c,d,x[i+0],6,-198630844);d=md5_ii(d,a,b,c,x[i+7],10,1126891415);c=md5_ii(c,d,a,b,x[i+14],15,-1416354905);b=md5_ii(b,c,d,a,x[i+5],21,-57434055);a=md5_ii(a,b,c,d,x[i+12],6,1700485571);d=md5_ii(d,a,b,c,x[i+3],10,-1894986606);c=md5_ii(c,d,a,b,x[i+10],15,-1051523);b=md5_ii(b,c,d,a,x[i+1],21,-2054922799);a=md5_ii(a,b,c,d,x[i+8],6,1873313359);d=md5_ii(d,a,b,c,x[i+15],10,-30611744);c=md5_ii(c,d,a,b,x[i+6],15,-1560198380);b=md5_ii(b,c,d,a,x[i+13],21,1309151649);a=md5_ii(a,b,c,d,x[i+4],6,-145523070);d=md5_ii(d,a,b,c,x[i+11],10,-1120210379);c=md5_ii(c,d,a,b,x[i+2],15,718787259);b=md5_ii(b,c,d,a,x[i+9],21,-343485551);a=safe_add(a,olda);b=safe_add(b,oldb);c=safe_add(c,oldc);d=safe_add(d,oldd);}
return Array(a,b,c,d);}
function md5_cmn(q,a,b,x,s,t)
{return safe_add(bit_rol(safe_add(safe_add(a,q),safe_add(x,t)),s),b);}
function md5_ff(a,b,c,d,x,s,t)
{return md5_cmn((b&c)|((~b)&d),a,b,x,s,t);}
function md5_gg(a,b,c,d,x,s,t)
{return md5_cmn((b&d)|(c&(~d)),a,b,x,s,t);}
function md5_hh(a,b,c,d,x,s,t)
{return md5_cmn(b^c^d,a,b,x,s,t);}
function md5_ii(a,b,c,d,x,s,t)
{return md5_cmn(c^(b|(~d)),a,b,x,s,t);}
function safe_add(x,y)
{var lsw=(x&0xFFFF)+(y&0xFFFF);var msw=(x>>16)+(y>>16)+(lsw>>16);return(msw<<16)|(lsw&0xFFFF);}
function bit_rol(num,cnt)
{return(num<<cnt)|(num>>>(32-cnt));}
var JSON;if(!JSON){JSON={};}
(function(){'use strict';function f(n){return n<10?'0'+n:n;}
if(typeof Date.prototype.toJSON!=='function'){Date.prototype.toJSON=function(key){return isFinite(this.valueOf())?this.getUTCFullYear()+'-'+
f(this.getUTCMonth()+1)+'-'+
f(this.getUTCDate())+'T'+
f(this.getUTCHours())+':'+
f(this.getUTCMinutes())+':'+
f(this.getUTCSeconds())+'Z':null;};String.prototype.toJSON=Number.prototype.toJSON=Boolean.prototype.toJSON=function(key){return this.valueOf();};}
var cx=/[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,escapable=/[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,gap,indent,meta={'\b':'\\b','\t':'\\t','\n':'\\n','\f':'\\f','\r':'\\r','"':'\\"','\\':'\\\\'},rep;function quote(string){escapable.lastIndex=0;return escapable.test(string)?'"'+string.replace(escapable,function(a){var c=meta[a];return typeof c==='string'?c:'\\u'+('0000'+a.charCodeAt(0).toString(16)).slice(-4);})+'"':'"'+string+'"';}
function str(key,holder){var i,k,v,length,mind=gap,partial,value=holder[key];if(value&&typeof value==='object'&&typeof value.toJSON==='function'){value=value.toJSON(key);}
if(typeof rep==='function'){value=rep.call(holder,key,value);}
switch(typeof value){case'string':return quote(value);case'number':return isFinite(value)?String(value):'null';case'boolean':case'null':return String(value);case'object':if(!value){return'null';}
gap+=indent;partial=[];if(Object.prototype.toString.apply(value)==='[object Array]'){length=value.length;for(i=0;i<length;i+=1){partial[i]=str(i,value)||'null';}
v=partial.length===0?'[]':gap?'[\n'+gap+partial.join(',\n'+gap)+'\n'+mind+']':'['+partial.join(',')+']';gap=mind;return v;}
if(rep&&typeof rep==='object'){length=rep.length;for(i=0;i<length;i+=1){if(typeof rep[i]==='string'){k=rep[i];v=str(k,value);if(v){partial.push(quote(k)+(gap?': ':':')+v);}}}}else{for(k in value){if(Object.prototype.hasOwnProperty.call(value,k)){v=str(k,value);if(v){partial.push(quote(k)+(gap?': ':':')+v);}}}}
v=partial.length===0?'{}':gap?'{\n'+gap+partial.join(',\n'+gap)+'\n'+mind+'}':'{'+partial.join(',')+'}';gap=mind;return v;}}
if(typeof JSON.stringify!=='function'){JSON.stringify=function(value,replacer,space){var i;gap='';indent='';if(typeof space==='number'){for(i=0;i<space;i+=1){indent+=' ';}}else if(typeof space==='string'){indent=space;}
rep=replacer;if(replacer&&typeof replacer!=='function'&&(typeof replacer!=='object'||typeof replacer.length!=='number')){throw new Error('JSON.stringify');}
return str('',{'':value});};}
if(typeof JSON.parse!=='function'){JSON.parse=function(text,reviver){var j;function walk(holder,key){var k,v,value=holder[key];if(value&&typeof value==='object'){for(k in value){if(Object.prototype.hasOwnProperty.call(value,k)){v=walk(value,k);if(v!==undefined){value[k]=v;}else{delete value[k];}}}}
return reviver.call(holder,key,value);}
text=String(text);cx.lastIndex=0;if(cx.test(text)){text=text.replace(cx,function(a){return'\\u'+
('0000'+a.charCodeAt(0).toString(16)).slice(-4);});}
if(/^[\],:{}\s]*$/.test(text.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g,'@').replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g,']').replace(/(?:^|:|,)(?:\s*\[)+/g,''))){j=eval('('+text+')');return typeof reviver==='function'?walk({'':j},''):j;}
throw new SyntaxError('JSON.parse');};}}());var CryptoJS=CryptoJS||(function(Math,undefined){var C={};var C_lib=C.lib={};var Base=C_lib.Base=(function(){function F(){}
return{extend:function(overrides){F.prototype=this;var subtype=new F();if(overrides){subtype.mixIn(overrides);}
if(!subtype.hasOwnProperty('init')){subtype.init=function(){subtype.$super.init.apply(this,arguments);};}
subtype.init.prototype=subtype;subtype.$super=this;return subtype;},create:function(){var instance=this.extend();instance.init.apply(instance,arguments);return instance;},init:function(){},mixIn:function(properties){for(var propertyName in properties){if(properties.hasOwnProperty(propertyName)){this[propertyName]=properties[propertyName];}}
if(properties.hasOwnProperty('toString')){this.toString=properties.toString;}},clone:function(){return this.init.prototype.extend(this);}};}());var WordArray=C_lib.WordArray=Base.extend({init:function(words,sigBytes){words=this.words=words||[];if(sigBytes!=undefined){this.sigBytes=sigBytes;}else{this.sigBytes=words.length*4;}},toString:function(encoder){return(encoder||Hex).stringify(this);},concat:function(wordArray){var thisWords=this.words;var thatWords=wordArray.words;var thisSigBytes=this.sigBytes;var thatSigBytes=wordArray.sigBytes;this.clamp();if(thisSigBytes%4){for(var i=0;i<thatSigBytes;i++){var thatByte=(thatWords[i>>>2]>>>(24-(i%4)*8))&0xff;thisWords[(thisSigBytes+i)>>>2]|=thatByte<<(24-((thisSigBytes+i)%4)*8);}}else if(thatWords.length>0xffff){for(var i=0;i<thatSigBytes;i+=4){thisWords[(thisSigBytes+i)>>>2]=thatWords[i>>>2];}}else{thisWords.push.apply(thisWords,thatWords);}
this.sigBytes+=thatSigBytes;return this;},clamp:function(){var words=this.words;var sigBytes=this.sigBytes;words[sigBytes>>>2]&=0xffffffff<<(32-(sigBytes%4)*8);words.length=Math.ceil(sigBytes/4);},clone:function(){var clone=Base.clone.call(this);clone.words=this.words.slice(0);return clone;},random:function(nBytes){var words=[];for(var i=0;i<nBytes;i+=4){words.push((Math.random()*0x100000000)|0);}
return new WordArray.init(words,nBytes);}});var C_enc=C.enc={};var Hex=C_enc.Hex={stringify:function(wordArray){var words=wordArray.words;var sigBytes=wordArray.sigBytes;var hexChars=[];for(var i=0;i<sigBytes;i++){var bite=(words[i>>>2]>>>(24-(i%4)*8))&0xff;hexChars.push((bite>>>4).toString(16));hexChars.push((bite&0x0f).toString(16));}
return hexChars.join('');},parse:function(hexStr){var hexStrLength=hexStr.length;var words=[];for(var i=0;i<hexStrLength;i+=2){words[i>>>3]|=parseInt(hexStr.substr(i,2),16)<<(24-(i%8)*4);}
return new WordArray.init(words,hexStrLength/2);}};var Latin1=C_enc.Latin1={stringify:function(wordArray){var words=wordArray.words;var sigBytes=wordArray.sigBytes;var latin1Chars=[];for(var i=0;i<sigBytes;i++){var bite=(words[i>>>2]>>>(24-(i%4)*8))&0xff;latin1Chars.push(String.fromCharCode(bite));}
return latin1Chars.join('');},parse:function(latin1Str){var latin1StrLength=latin1Str.length;var words=[];for(var i=0;i<latin1StrLength;i++){words[i>>>2]|=(latin1Str.charCodeAt(i)&0xff)<<(24-(i%4)*8);}
return new WordArray.init(words,latin1StrLength);}};var Utf8=C_enc.Utf8={stringify:function(wordArray){try{return decodeURIComponent(escape(Latin1.stringify(wordArray)));}catch(e){throw new Error('Malformed UTF-8 data');}},parse:function(utf8Str){return Latin1.parse(unescape(encodeURIComponent(utf8Str)));}};var BufferedBlockAlgorithm=C_lib.BufferedBlockAlgorithm=Base.extend({reset:function(){this._data=new WordArray.init();this._nDataBytes=0;},_append:function(data){if(typeof data=='string'){data=Utf8.parse(data);}
this._data.concat(data);this._nDataBytes+=data.sigBytes;},_process:function(doFlush){var data=this._data;var dataWords=data.words;var dataSigBytes=data.sigBytes;var blockSize=this.blockSize;var blockSizeBytes=blockSize*4;var nBlocksReady=dataSigBytes/blockSizeBytes;if(doFlush){nBlocksReady=Math.ceil(nBlocksReady);}else{nBlocksReady=Math.max((nBlocksReady|0)-this._minBufferSize,0);}
var nWordsReady=nBlocksReady*blockSize;var nBytesReady=Math.min(nWordsReady*4,dataSigBytes);if(nWordsReady){for(var offset=0;offset<nWordsReady;offset+=blockSize){this._doProcessBlock(dataWords,offset);}
var processedWords=dataWords.splice(0,nWordsReady);data.sigBytes-=nBytesReady;}
return new WordArray.init(processedWords,nBytesReady);},clone:function(){var clone=Base.clone.call(this);clone._data=this._data.clone();return clone;},_minBufferSize:0});var Hasher=C_lib.Hasher=BufferedBlockAlgorithm.extend({cfg:Base.extend(),init:function(cfg){this.cfg=this.cfg.extend(cfg);this.reset();},reset:function(){BufferedBlockAlgorithm.reset.call(this);this._doReset();},update:function(messageUpdate){this._append(messageUpdate);this._process();return this;},finalize:function(messageUpdate){if(messageUpdate){this._append(messageUpdate);}
var hash=this._doFinalize();return hash;},blockSize:512/32,_createHelper:function(hasher){return function(message,cfg){return new hasher.init(cfg).finalize(message);};},_createHmacHelper:function(hasher){return function(message,key){return new C_algo.HMAC.init(hasher,key).finalize(message);};}});var C_algo=C.algo={};return C;}(Math));(function(){var C=CryptoJS;var C_lib=C.lib;var WordArray=C_lib.WordArray;var C_enc=C.enc;var Base64=C_enc.Base64={stringify:function(wordArray){var words=wordArray.words;var sigBytes=wordArray.sigBytes;var map=this._map;wordArray.clamp();var base64Chars=[];for(var i=0;i<sigBytes;i+=3){var byte1=(words[i>>>2]>>>(24-(i%4)*8))&0xff;var byte2=(words[(i+1)>>>2]>>>(24-((i+1)%4)*8))&0xff;var byte3=(words[(i+2)>>>2]>>>(24-((i+2)%4)*8))&0xff;var triplet=(byte1<<16)|(byte2<<8)|byte3;for(var j=0;(j<4)&&(i+j*0.75<sigBytes);j++){base64Chars.push(map.charAt((triplet>>>(6*(3-j)))&0x3f));}}
var paddingChar=map.charAt(64);if(paddingChar){while(base64Chars.length%4){base64Chars.push(paddingChar);}}
return base64Chars.join('');},parse:function(base64Str){var base64StrLength=base64Str.length;var map=this._map;var paddingChar=map.charAt(64);if(paddingChar){var paddingIndex=base64Str.indexOf(paddingChar);if(paddingIndex!=-1){base64StrLength=paddingIndex;}}
var words=[];var nBytes=0;for(var i=0;i<base64StrLength;i++){if(i%4){var bits1=map.indexOf(base64Str.charAt(i-1))<<((i%4)*2);var bits2=map.indexOf(base64Str.charAt(i))>>>(6-(i%4)*2);words[nBytes>>>2]|=(bits1|bits2)<<(24-(nBytes%4)*8);nBytes++;}}
return WordArray.create(words,nBytes);},_map:'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/='};}());CryptoJS.lib.Cipher||(function(undefined){var C=CryptoJS;var C_lib=C.lib;var Base=C_lib.Base;var WordArray=C_lib.WordArray;var BufferedBlockAlgorithm=C_lib.BufferedBlockAlgorithm;var C_enc=C.enc;var Utf8=C_enc.Utf8;var Base64=C_enc.Base64;var C_algo=C.algo;var EvpKDF=C_algo.EvpKDF;var Cipher=C_lib.Cipher=BufferedBlockAlgorithm.extend({cfg:Base.extend(),createEncryptor:function(key,cfg){return this.create(this._ENC_XFORM_MODE,key,cfg);},createDecryptor:function(key,cfg){return this.create(this._DEC_XFORM_MODE,key,cfg);},init:function(xformMode,key,cfg){this.cfg=this.cfg.extend(cfg);this._xformMode=xformMode;this._key=key;this.reset();},reset:function(){BufferedBlockAlgorithm.reset.call(this);this._doReset();},process:function(dataUpdate){this._append(dataUpdate);return this._process();},finalize:function(dataUpdate){if(dataUpdate){this._append(dataUpdate);}
var finalProcessedData=this._doFinalize();return finalProcessedData;},keySize:128/32,ivSize:128/32,_ENC_XFORM_MODE:1,_DEC_XFORM_MODE:2,_createHelper:(function(){function selectCipherStrategy(key){if(typeof key=='string'){return PasswordBasedCipher;}else{return SerializableCipher;}}
return function(cipher){return{encrypt:function(message,key,cfg){return selectCipherStrategy(key).encrypt(cipher,message,key,cfg);},decrypt:function(ciphertext,key,cfg){return selectCipherStrategy(key).decrypt(cipher,ciphertext,key,cfg);}};};}())});var StreamCipher=C_lib.StreamCipher=Cipher.extend({_doFinalize:function(){var finalProcessedBlocks=this._process(!!'flush');return finalProcessedBlocks;},blockSize:1});var C_mode=C.mode={};var BlockCipherMode=C_lib.BlockCipherMode=Base.extend({createEncryptor:function(cipher,iv){return this.Encryptor.create(cipher,iv);},createDecryptor:function(cipher,iv){return this.Decryptor.create(cipher,iv);},init:function(cipher,iv){this._cipher=cipher;this._iv=iv;}});var CBC=C_mode.CBC=(function(){var CBC=BlockCipherMode.extend();CBC.Encryptor=CBC.extend({processBlock:function(words,offset){var cipher=this._cipher;var blockSize=cipher.blockSize;xorBlock.call(this,words,offset,blockSize);cipher.encryptBlock(words,offset);this._prevBlock=words.slice(offset,offset+blockSize);}});CBC.Decryptor=CBC.extend({processBlock:function(words,offset){var cipher=this._cipher;var blockSize=cipher.blockSize;var thisBlock=words.slice(offset,offset+blockSize);cipher.decryptBlock(words,offset);xorBlock.call(this,words,offset,blockSize);this._prevBlock=thisBlock;}});function xorBlock(words,offset,blockSize){var iv=this._iv;if(iv){var block=iv;this._iv=undefined;}else{var block=this._prevBlock;}
for(var i=0;i<blockSize;i++){words[offset+i]^=block[i];}}
return CBC;}());var C_pad=C.pad={};var Pkcs7=C_pad.Pkcs7={pad:function(data,blockSize){var blockSizeBytes=blockSize*4;var nPaddingBytes=blockSizeBytes-data.sigBytes%blockSizeBytes;var paddingWord=(nPaddingBytes<<24)|(nPaddingBytes<<16)|(nPaddingBytes<<8)|nPaddingBytes;var paddingWords=[];for(var i=0;i<nPaddingBytes;i+=4){paddingWords.push(paddingWord);}
var padding=WordArray.create(paddingWords,nPaddingBytes);data.concat(padding);},unpad:function(data){var nPaddingBytes=data.words[(data.sigBytes-1)>>>2]&0xff;data.sigBytes-=nPaddingBytes;}};var BlockCipher=C_lib.BlockCipher=Cipher.extend({cfg:Cipher.cfg.extend({mode:CBC,padding:Pkcs7}),reset:function(){Cipher.reset.call(this);var cfg=this.cfg;var iv=cfg.iv;var mode=cfg.mode;if(this._xformMode==this._ENC_XFORM_MODE){var modeCreator=mode.createEncryptor;}else{var modeCreator=mode.createDecryptor;this._minBufferSize=1;}
this._mode=modeCreator.call(mode,this,iv&&iv.words);},_doProcessBlock:function(words,offset){this._mode.processBlock(words,offset);},_doFinalize:function(){var padding=this.cfg.padding;if(this._xformMode==this._ENC_XFORM_MODE){padding.pad(this._data,this.blockSize);var finalProcessedBlocks=this._process(!!'flush');}else{var finalProcessedBlocks=this._process(!!'flush');padding.unpad(finalProcessedBlocks);}
return finalProcessedBlocks;},blockSize:128/32});var CipherParams=C_lib.CipherParams=Base.extend({init:function(cipherParams){this.mixIn(cipherParams);},toString:function(formatter){return(formatter||this.formatter).stringify(this);}});var C_format=C.format={};var OpenSSLFormatter=C_format.OpenSSL={stringify:function(cipherParams){var ciphertext=cipherParams.ciphertext;var salt=cipherParams.salt;if(salt){var wordArray=WordArray.create([0x53616c74,0x65645f5f]).concat(salt).concat(ciphertext);}else{var wordArray=ciphertext;}
return wordArray.toString(Base64);},parse:function(openSSLStr){var ciphertext=Base64.parse(openSSLStr);var ciphertextWords=ciphertext.words;if(ciphertextWords[0]==0x53616c74&&ciphertextWords[1]==0x65645f5f){var salt=WordArray.create(ciphertextWords.slice(2,4));ciphertextWords.splice(0,4);ciphertext.sigBytes-=16;}
return CipherParams.create({ciphertext:ciphertext,salt:salt});}};var SerializableCipher=C_lib.SerializableCipher=Base.extend({cfg:Base.extend({format:OpenSSLFormatter}),encrypt:function(cipher,message,key,cfg){cfg=this.cfg.extend(cfg);var encryptor=cipher.createEncryptor(key,cfg);var ciphertext=encryptor.finalize(message);var cipherCfg=encryptor.cfg;return CipherParams.create({ciphertext:ciphertext,key:key,iv:cipherCfg.iv,algorithm:cipher,mode:cipherCfg.mode,padding:cipherCfg.padding,blockSize:cipher.blockSize,formatter:cfg.format});},decrypt:function(cipher,ciphertext,key,cfg){cfg=this.cfg.extend(cfg);ciphertext=this._parse(ciphertext,cfg.format);var plaintext=cipher.createDecryptor(key,cfg).finalize(ciphertext.ciphertext);return plaintext;},_parse:function(ciphertext,format){if(typeof ciphertext=='string'){return format.parse(ciphertext,this);}else{return ciphertext;}}});var C_kdf=C.kdf={};var OpenSSLKdf=C_kdf.OpenSSL={execute:function(password,keySize,ivSize,salt){if(!salt){salt=WordArray.random(64/8);}
var key=EvpKDF.create({keySize:keySize+ivSize}).compute(password,salt);var iv=WordArray.create(key.words.slice(keySize),ivSize*4);key.sigBytes=keySize*4;return CipherParams.create({key:key,iv:iv,salt:salt});}};var PasswordBasedCipher=C_lib.PasswordBasedCipher=SerializableCipher.extend({cfg:SerializableCipher.cfg.extend({kdf:OpenSSLKdf}),encrypt:function(cipher,message,password,cfg){cfg=this.cfg.extend(cfg);var derivedParams=cfg.kdf.execute(password,cipher.keySize,cipher.ivSize);cfg.iv=derivedParams.iv;var ciphertext=SerializableCipher.encrypt.call(this,cipher,message,derivedParams.key,cfg);ciphertext.mixIn(derivedParams);return ciphertext;},decrypt:function(cipher,ciphertext,password,cfg){cfg=this.cfg.extend(cfg);ciphertext=this._parse(ciphertext,cfg.format);var derivedParams=cfg.kdf.execute(password,cipher.keySize,cipher.ivSize,ciphertext.salt);cfg.iv=derivedParams.iv;var plaintext=SerializableCipher.decrypt.call(this,cipher,ciphertext,derivedParams.key,cfg);return plaintext;}});}());(function(){var C=CryptoJS;var C_lib=C.lib;var BlockCipher=C_lib.BlockCipher;var C_algo=C.algo;var SBOX=[];var INV_SBOX=[];var SUB_MIX_0=[];var SUB_MIX_1=[];var SUB_MIX_2=[];var SUB_MIX_3=[];var INV_SUB_MIX_0=[];var INV_SUB_MIX_1=[];var INV_SUB_MIX_2=[];var INV_SUB_MIX_3=[];(function(){var d=[];for(var i=0;i<256;i++){if(i<128){d[i]=i<<1;}else{d[i]=(i<<1)^0x11b;}}
var x=0;var xi=0;for(var i=0;i<256;i++){var sx=xi^(xi<<1)^(xi<<2)^(xi<<3)^(xi<<4);sx=(sx>>>8)^(sx&0xff)^0x63;SBOX[x]=sx;INV_SBOX[sx]=x;var x2=d[x];var x4=d[x2];var x8=d[x4];var t=(d[sx]*0x101)^(sx*0x1010100);SUB_MIX_0[x]=(t<<24)|(t>>>8);SUB_MIX_1[x]=(t<<16)|(t>>>16);SUB_MIX_2[x]=(t<<8)|(t>>>24);SUB_MIX_3[x]=t;var t=(x8*0x1010101)^(x4*0x10001)^(x2*0x101)^(x*0x1010100);INV_SUB_MIX_0[sx]=(t<<24)|(t>>>8);INV_SUB_MIX_1[sx]=(t<<16)|(t>>>16);INV_SUB_MIX_2[sx]=(t<<8)|(t>>>24);INV_SUB_MIX_3[sx]=t;if(!x){x=xi=1;}else{x=x2^d[d[d[x8^x2]]];xi^=d[d[xi]];}}}());var RCON=[0x00,0x01,0x02,0x04,0x08,0x10,0x20,0x40,0x80,0x1b,0x36];var AES=C_algo.AES=BlockCipher.extend({_doReset:function(){var key=this._key;var keyWords=key.words;var keySize=key.sigBytes/4;var nRounds=this._nRounds=keySize+6
var ksRows=(nRounds+1)*4;var keySchedule=this._keySchedule=[];for(var ksRow=0;ksRow<ksRows;ksRow++){if(ksRow<keySize){keySchedule[ksRow]=keyWords[ksRow];}else{var t=keySchedule[ksRow-1];if(!(ksRow%keySize)){t=(t<<8)|(t>>>24);t=(SBOX[t>>>24]<<24)|(SBOX[(t>>>16)&0xff]<<16)|(SBOX[(t>>>8)&0xff]<<8)|SBOX[t&0xff];t^=RCON[(ksRow/keySize)|0]<<24;}else if(keySize>6&&ksRow%keySize==4){t=(SBOX[t>>>24]<<24)|(SBOX[(t>>>16)&0xff]<<16)|(SBOX[(t>>>8)&0xff]<<8)|SBOX[t&0xff];}
keySchedule[ksRow]=keySchedule[ksRow-keySize]^t;}}
var invKeySchedule=this._invKeySchedule=[];for(var invKsRow=0;invKsRow<ksRows;invKsRow++){var ksRow=ksRows-invKsRow;if(invKsRow%4){var t=keySchedule[ksRow];}else{var t=keySchedule[ksRow-4];}
if(invKsRow<4||ksRow<=4){invKeySchedule[invKsRow]=t;}else{invKeySchedule[invKsRow]=INV_SUB_MIX_0[SBOX[t>>>24]]^INV_SUB_MIX_1[SBOX[(t>>>16)&0xff]]^INV_SUB_MIX_2[SBOX[(t>>>8)&0xff]]^INV_SUB_MIX_3[SBOX[t&0xff]];}}},encryptBlock:function(M,offset){this._doCryptBlock(M,offset,this._keySchedule,SUB_MIX_0,SUB_MIX_1,SUB_MIX_2,SUB_MIX_3,SBOX);},decryptBlock:function(M,offset){var t=M[offset+1];M[offset+1]=M[offset+3];M[offset+3]=t;this._doCryptBlock(M,offset,this._invKeySchedule,INV_SUB_MIX_0,INV_SUB_MIX_1,INV_SUB_MIX_2,INV_SUB_MIX_3,INV_SBOX);var t=M[offset+1];M[offset+1]=M[offset+3];M[offset+3]=t;},_doCryptBlock:function(M,offset,keySchedule,SUB_MIX_0,SUB_MIX_1,SUB_MIX_2,SUB_MIX_3,SBOX){var nRounds=this._nRounds;var s0=M[offset]^keySchedule[0];var s1=M[offset+1]^keySchedule[1];var s2=M[offset+2]^keySchedule[2];var s3=M[offset+3]^keySchedule[3];var ksRow=4;for(var round=1;round<nRounds;round++){var t0=SUB_MIX_0[s0>>>24]^SUB_MIX_1[(s1>>>16)&0xff]^SUB_MIX_2[(s2>>>8)&0xff]^SUB_MIX_3[s3&0xff]^keySchedule[ksRow++];var t1=SUB_MIX_0[s1>>>24]^SUB_MIX_1[(s2>>>16)&0xff]^SUB_MIX_2[(s3>>>8)&0xff]^SUB_MIX_3[s0&0xff]^keySchedule[ksRow++];var t2=SUB_MIX_0[s2>>>24]^SUB_MIX_1[(s3>>>16)&0xff]^SUB_MIX_2[(s0>>>8)&0xff]^SUB_MIX_3[s1&0xff]^keySchedule[ksRow++];var t3=SUB_MIX_0[s3>>>24]^SUB_MIX_1[(s0>>>16)&0xff]^SUB_MIX_2[(s1>>>8)&0xff]^SUB_MIX_3[s2&0xff]^keySchedule[ksRow++];s0=t0;s1=t1;s2=t2;s3=t3;}
var t0=((SBOX[s0>>>24]<<24)|(SBOX[(s1>>>16)&0xff]<<16)|(SBOX[(s2>>>8)&0xff]<<8)|SBOX[s3&0xff])^keySchedule[ksRow++];var t1=((SBOX[s1>>>24]<<24)|(SBOX[(s2>>>16)&0xff]<<16)|(SBOX[(s3>>>8)&0xff]<<8)|SBOX[s0&0xff])^keySchedule[ksRow++];var t2=((SBOX[s2>>>24]<<24)|(SBOX[(s3>>>16)&0xff]<<16)|(SBOX[(s0>>>8)&0xff]<<8)|SBOX[s1&0xff])^keySchedule[ksRow++];var t3=((SBOX[s3>>>24]<<24)|(SBOX[(s0>>>16)&0xff]<<16)|(SBOX[(s1>>>8)&0xff]<<8)|SBOX[s2&0xff])^keySchedule[ksRow++];M[offset]=t0;M[offset+1]=t1;M[offset+2]=t2;M[offset+3]=t3;},keySize:256/32});C.AES=BlockCipher._createHelper(AES);}());(function(Math){var C=CryptoJS;var C_lib=C.lib;var WordArray=C_lib.WordArray;var Hasher=C_lib.Hasher;var C_algo=C.algo;var T=[];(function(){for(var i=0;i<64;i++){T[i]=(Math.abs(Math.sin(i+1))*0x100000000)|0;}}());var MD5=C_algo.MD5=Hasher.extend({_doReset:function(){this._hash=new WordArray.init([0x67452301,0xefcdab89,0x98badcfe,0x10325476]);},_doProcessBlock:function(M,offset){for(var i=0;i<16;i++){var offset_i=offset+i;var M_offset_i=M[offset_i];M[offset_i]=((((M_offset_i<<8)|(M_offset_i>>>24))&0x00ff00ff)|(((M_offset_i<<24)|(M_offset_i>>>8))&0xff00ff00));}
var H=this._hash.words;var M_offset_0=M[offset+0];var M_offset_1=M[offset+1];var M_offset_2=M[offset+2];var M_offset_3=M[offset+3];var M_offset_4=M[offset+4];var M_offset_5=M[offset+5];var M_offset_6=M[offset+6];var M_offset_7=M[offset+7];var M_offset_8=M[offset+8];var M_offset_9=M[offset+9];var M_offset_10=M[offset+10];var M_offset_11=M[offset+11];var M_offset_12=M[offset+12];var M_offset_13=M[offset+13];var M_offset_14=M[offset+14];var M_offset_15=M[offset+15];var a=H[0];var b=H[1];var c=H[2];var d=H[3];a=FF(a,b,c,d,M_offset_0,7,T[0]);d=FF(d,a,b,c,M_offset_1,12,T[1]);c=FF(c,d,a,b,M_offset_2,17,T[2]);b=FF(b,c,d,a,M_offset_3,22,T[3]);a=FF(a,b,c,d,M_offset_4,7,T[4]);d=FF(d,a,b,c,M_offset_5,12,T[5]);c=FF(c,d,a,b,M_offset_6,17,T[6]);b=FF(b,c,d,a,M_offset_7,22,T[7]);a=FF(a,b,c,d,M_offset_8,7,T[8]);d=FF(d,a,b,c,M_offset_9,12,T[9]);c=FF(c,d,a,b,M_offset_10,17,T[10]);b=FF(b,c,d,a,M_offset_11,22,T[11]);a=FF(a,b,c,d,M_offset_12,7,T[12]);d=FF(d,a,b,c,M_offset_13,12,T[13]);c=FF(c,d,a,b,M_offset_14,17,T[14]);b=FF(b,c,d,a,M_offset_15,22,T[15]);a=GG(a,b,c,d,M_offset_1,5,T[16]);d=GG(d,a,b,c,M_offset_6,9,T[17]);c=GG(c,d,a,b,M_offset_11,14,T[18]);b=GG(b,c,d,a,M_offset_0,20,T[19]);a=GG(a,b,c,d,M_offset_5,5,T[20]);d=GG(d,a,b,c,M_offset_10,9,T[21]);c=GG(c,d,a,b,M_offset_15,14,T[22]);b=GG(b,c,d,a,M_offset_4,20,T[23]);a=GG(a,b,c,d,M_offset_9,5,T[24]);d=GG(d,a,b,c,M_offset_14,9,T[25]);c=GG(c,d,a,b,M_offset_3,14,T[26]);b=GG(b,c,d,a,M_offset_8,20,T[27]);a=GG(a,b,c,d,M_offset_13,5,T[28]);d=GG(d,a,b,c,M_offset_2,9,T[29]);c=GG(c,d,a,b,M_offset_7,14,T[30]);b=GG(b,c,d,a,M_offset_12,20,T[31]);a=HH(a,b,c,d,M_offset_5,4,T[32]);d=HH(d,a,b,c,M_offset_8,11,T[33]);c=HH(c,d,a,b,M_offset_11,16,T[34]);b=HH(b,c,d,a,M_offset_14,23,T[35]);a=HH(a,b,c,d,M_offset_1,4,T[36]);d=HH(d,a,b,c,M_offset_4,11,T[37]);c=HH(c,d,a,b,M_offset_7,16,T[38]);b=HH(b,c,d,a,M_offset_10,23,T[39]);a=HH(a,b,c,d,M_offset_13,4,T[40]);d=HH(d,a,b,c,M_offset_0,11,T[41]);c=HH(c,d,a,b,M_offset_3,16,T[42]);b=HH(b,c,d,a,M_offset_6,23,T[43]);a=HH(a,b,c,d,M_offset_9,4,T[44]);d=HH(d,a,b,c,M_offset_12,11,T[45]);c=HH(c,d,a,b,M_offset_15,16,T[46]);b=HH(b,c,d,a,M_offset_2,23,T[47]);a=II(a,b,c,d,M_offset_0,6,T[48]);d=II(d,a,b,c,M_offset_7,10,T[49]);c=II(c,d,a,b,M_offset_14,15,T[50]);b=II(b,c,d,a,M_offset_5,21,T[51]);a=II(a,b,c,d,M_offset_12,6,T[52]);d=II(d,a,b,c,M_offset_3,10,T[53]);c=II(c,d,a,b,M_offset_10,15,T[54]);b=II(b,c,d,a,M_offset_1,21,T[55]);a=II(a,b,c,d,M_offset_8,6,T[56]);d=II(d,a,b,c,M_offset_15,10,T[57]);c=II(c,d,a,b,M_offset_6,15,T[58]);b=II(b,c,d,a,M_offset_13,21,T[59]);a=II(a,b,c,d,M_offset_4,6,T[60]);d=II(d,a,b,c,M_offset_11,10,T[61]);c=II(c,d,a,b,M_offset_2,15,T[62]);b=II(b,c,d,a,M_offset_9,21,T[63]);H[0]=(H[0]+a)|0;H[1]=(H[1]+b)|0;H[2]=(H[2]+c)|0;H[3]=(H[3]+d)|0;},_doFinalize:function(){var data=this._data;var dataWords=data.words;var nBitsTotal=this._nDataBytes*8;var nBitsLeft=data.sigBytes*8;dataWords[nBitsLeft>>>5]|=0x80<<(24-nBitsLeft%32);var nBitsTotalH=Math.floor(nBitsTotal/0x100000000);var nBitsTotalL=nBitsTotal;dataWords[(((nBitsLeft+64)>>>9)<<4)+15]=((((nBitsTotalH<<8)|(nBitsTotalH>>>24))&0x00ff00ff)|(((nBitsTotalH<<24)|(nBitsTotalH>>>8))&0xff00ff00));dataWords[(((nBitsLeft+64)>>>9)<<4)+14]=((((nBitsTotalL<<8)|(nBitsTotalL>>>24))&0x00ff00ff)|(((nBitsTotalL<<24)|(nBitsTotalL>>>8))&0xff00ff00));data.sigBytes=(dataWords.length+1)*4;this._process();var hash=this._hash;var H=hash.words;for(var i=0;i<4;i++){var H_i=H[i];H[i]=(((H_i<<8)|(H_i>>>24))&0x00ff00ff)|(((H_i<<24)|(H_i>>>8))&0xff00ff00);}
return hash;},clone:function(){var clone=Hasher.clone.call(this);clone._hash=this._hash.clone();return clone;}});function FF(a,b,c,d,x,s,t){var n=a+((b&c)|(~b&d))+x+t;return((n<<s)|(n>>>(32-s)))+b;}
function GG(a,b,c,d,x,s,t){var n=a+((b&d)|(c&~d))+x+t;return((n<<s)|(n>>>(32-s)))+b;}
function HH(a,b,c,d,x,s,t){var n=a+(b^c^d)+x+t;return((n<<s)|(n>>>(32-s)))+b;}
function II(a,b,c,d,x,s,t){var n=a+(c^(b|~d))+x+t;return((n<<s)|(n>>>(32-s)))+b;}
C.MD5=Hasher._createHelper(MD5);C.HmacMD5=Hasher._createHmacHelper(MD5);}(Math));(function(){var C=CryptoJS;var C_lib=C.lib;var WordArray=C_lib.WordArray;var Hasher=C_lib.Hasher;var C_algo=C.algo;var W=[];var SHA1=C_algo.SHA1=Hasher.extend({_doReset:function(){this._hash=new WordArray.init([0x67452301,0xefcdab89,0x98badcfe,0x10325476,0xc3d2e1f0]);},_doProcessBlock:function(M,offset){var H=this._hash.words;var a=H[0];var b=H[1];var c=H[2];var d=H[3];var e=H[4];for(var i=0;i<80;i++){if(i<16){W[i]=M[offset+i]|0;}else{var n=W[i-3]^W[i-8]^W[i-14]^W[i-16];W[i]=(n<<1)|(n>>>31);}
var t=((a<<5)|(a>>>27))+e+W[i];if(i<20){t+=((b&c)|(~b&d))+0x5a827999;}else if(i<40){t+=(b^c^d)+0x6ed9eba1;}else if(i<60){t+=((b&c)|(b&d)|(c&d))-0x70e44324;}else{t+=(b^c^d)-0x359d3e2a;}
e=d;d=c;c=(b<<30)|(b>>>2);b=a;a=t;}
H[0]=(H[0]+a)|0;H[1]=(H[1]+b)|0;H[2]=(H[2]+c)|0;H[3]=(H[3]+d)|0;H[4]=(H[4]+e)|0;},_doFinalize:function(){var data=this._data;var dataWords=data.words;var nBitsTotal=this._nDataBytes*8;var nBitsLeft=data.sigBytes*8;dataWords[nBitsLeft>>>5]|=0x80<<(24-nBitsLeft%32);dataWords[(((nBitsLeft+64)>>>9)<<4)+14]=Math.floor(nBitsTotal/0x100000000);dataWords[(((nBitsLeft+64)>>>9)<<4)+15]=nBitsTotal;data.sigBytes=dataWords.length*4;this._process();return this._hash;},clone:function(){var clone=Hasher.clone.call(this);clone._hash=this._hash.clone();return clone;}});C.SHA1=Hasher._createHelper(SHA1);C.HmacSHA1=Hasher._createHmacHelper(SHA1);}());(function(undefined){var C=CryptoJS;var C_lib=C.lib;var Base=C_lib.Base;var X32WordArray=C_lib.WordArray;var C_x64=C.x64={};var X64Word=C_x64.Word=Base.extend({init:function(high,low){this.high=high;this.low=low;}});var X64WordArray=C_x64.WordArray=Base.extend({init:function(words,sigBytes){words=this.words=words||[];if(sigBytes!=undefined){this.sigBytes=sigBytes;}else{this.sigBytes=words.length*8;}},toX32:function(){var x64Words=this.words;var x64WordsLength=x64Words.length;var x32Words=[];for(var i=0;i<x64WordsLength;i++){var x64Word=x64Words[i];x32Words.push(x64Word.high);x32Words.push(x64Word.low);}
return X32WordArray.create(x32Words,this.sigBytes);},clone:function(){var clone=Base.clone.call(this);var words=clone.words=this.words.slice(0);var wordsLength=words.length;for(var i=0;i<wordsLength;i++){words[i]=words[i].clone();}
return clone;}});}());(function(Math){var C=CryptoJS;var C_lib=C.lib;var WordArray=C_lib.WordArray;var Hasher=C_lib.Hasher;var C_algo=C.algo;var H=[];var K=[];(function(){function isPrime(n){var sqrtN=Math.sqrt(n);for(var factor=2;factor<=sqrtN;factor++){if(!(n%factor)){return false;}}
return true;}
function getFractionalBits(n){return((n-(n|0))*0x100000000)|0;}
var n=2;var nPrime=0;while(nPrime<64){if(isPrime(n)){if(nPrime<8){H[nPrime]=getFractionalBits(Math.pow(n,1/2));}
K[nPrime]=getFractionalBits(Math.pow(n,1/3));nPrime++;}
n++;}}());var W=[];var SHA256=C_algo.SHA256=Hasher.extend({_doReset:function(){this._hash=new WordArray.init(H.slice(0));},_doProcessBlock:function(M,offset){var H=this._hash.words;var a=H[0];var b=H[1];var c=H[2];var d=H[3];var e=H[4];var f=H[5];var g=H[6];var h=H[7];for(var i=0;i<64;i++){if(i<16){W[i]=M[offset+i]|0;}else{var gamma0x=W[i-15];var gamma0=((gamma0x<<25)|(gamma0x>>>7))^((gamma0x<<14)|(gamma0x>>>18))^(gamma0x>>>3);var gamma1x=W[i-2];var gamma1=((gamma1x<<15)|(gamma1x>>>17))^((gamma1x<<13)|(gamma1x>>>19))^(gamma1x>>>10);W[i]=gamma0+W[i-7]+gamma1+W[i-16];}
var ch=(e&f)^(~e&g);var maj=(a&b)^(a&c)^(b&c);var sigma0=((a<<30)|(a>>>2))^((a<<19)|(a>>>13))^((a<<10)|(a>>>22));var sigma1=((e<<26)|(e>>>6))^((e<<21)|(e>>>11))^((e<<7)|(e>>>25));var t1=h+sigma1+ch+K[i]+W[i];var t2=sigma0+maj;h=g;g=f;f=e;e=(d+t1)|0;d=c;c=b;b=a;a=(t1+t2)|0;}
H[0]=(H[0]+a)|0;H[1]=(H[1]+b)|0;H[2]=(H[2]+c)|0;H[3]=(H[3]+d)|0;H[4]=(H[4]+e)|0;H[5]=(H[5]+f)|0;H[6]=(H[6]+g)|0;H[7]=(H[7]+h)|0;},_doFinalize:function(){var data=this._data;var dataWords=data.words;var nBitsTotal=this._nDataBytes*8;var nBitsLeft=data.sigBytes*8;dataWords[nBitsLeft>>>5]|=0x80<<(24-nBitsLeft%32);dataWords[(((nBitsLeft+64)>>>9)<<4)+14]=Math.floor(nBitsTotal/0x100000000);dataWords[(((nBitsLeft+64)>>>9)<<4)+15]=nBitsTotal;data.sigBytes=dataWords.length*4;this._process();return this._hash;},clone:function(){var clone=Hasher.clone.call(this);clone._hash=this._hash.clone();return clone;}});C.SHA256=Hasher._createHelper(SHA256);C.HmacSHA256=Hasher._createHmacHelper(SHA256);}(Math));(function(){var C=CryptoJS;var C_lib=C.lib;var Hasher=C_lib.Hasher;var C_x64=C.x64;var X64Word=C_x64.Word;var X64WordArray=C_x64.WordArray;var C_algo=C.algo;function X64Word_create(){return X64Word.create.apply(X64Word,arguments);}
var K=[X64Word_create(0x428a2f98,0xd728ae22),X64Word_create(0x71374491,0x23ef65cd),X64Word_create(0xb5c0fbcf,0xec4d3b2f),X64Word_create(0xe9b5dba5,0x8189dbbc),X64Word_create(0x3956c25b,0xf348b538),X64Word_create(0x59f111f1,0xb605d019),X64Word_create(0x923f82a4,0xaf194f9b),X64Word_create(0xab1c5ed5,0xda6d8118),X64Word_create(0xd807aa98,0xa3030242),X64Word_create(0x12835b01,0x45706fbe),X64Word_create(0x243185be,0x4ee4b28c),X64Word_create(0x550c7dc3,0xd5ffb4e2),X64Word_create(0x72be5d74,0xf27b896f),X64Word_create(0x80deb1fe,0x3b1696b1),X64Word_create(0x9bdc06a7,0x25c71235),X64Word_create(0xc19bf174,0xcf692694),X64Word_create(0xe49b69c1,0x9ef14ad2),X64Word_create(0xefbe4786,0x384f25e3),X64Word_create(0x0fc19dc6,0x8b8cd5b5),X64Word_create(0x240ca1cc,0x77ac9c65),X64Word_create(0x2de92c6f,0x592b0275),X64Word_create(0x4a7484aa,0x6ea6e483),X64Word_create(0x5cb0a9dc,0xbd41fbd4),X64Word_create(0x76f988da,0x831153b5),X64Word_create(0x983e5152,0xee66dfab),X64Word_create(0xa831c66d,0x2db43210),X64Word_create(0xb00327c8,0x98fb213f),X64Word_create(0xbf597fc7,0xbeef0ee4),X64Word_create(0xc6e00bf3,0x3da88fc2),X64Word_create(0xd5a79147,0x930aa725),X64Word_create(0x06ca6351,0xe003826f),X64Word_create(0x14292967,0x0a0e6e70),X64Word_create(0x27b70a85,0x46d22ffc),X64Word_create(0x2e1b2138,0x5c26c926),X64Word_create(0x4d2c6dfc,0x5ac42aed),X64Word_create(0x53380d13,0x9d95b3df),X64Word_create(0x650a7354,0x8baf63de),X64Word_create(0x766a0abb,0x3c77b2a8),X64Word_create(0x81c2c92e,0x47edaee6),X64Word_create(0x92722c85,0x1482353b),X64Word_create(0xa2bfe8a1,0x4cf10364),X64Word_create(0xa81a664b,0xbc423001),X64Word_create(0xc24b8b70,0xd0f89791),X64Word_create(0xc76c51a3,0x0654be30),X64Word_create(0xd192e819,0xd6ef5218),X64Word_create(0xd6990624,0x5565a910),X64Word_create(0xf40e3585,0x5771202a),X64Word_create(0x106aa070,0x32bbd1b8),X64Word_create(0x19a4c116,0xb8d2d0c8),X64Word_create(0x1e376c08,0x5141ab53),X64Word_create(0x2748774c,0xdf8eeb99),X64Word_create(0x34b0bcb5,0xe19b48a8),X64Word_create(0x391c0cb3,0xc5c95a63),X64Word_create(0x4ed8aa4a,0xe3418acb),X64Word_create(0x5b9cca4f,0x7763e373),X64Word_create(0x682e6ff3,0xd6b2b8a3),X64Word_create(0x748f82ee,0x5defb2fc),X64Word_create(0x78a5636f,0x43172f60),X64Word_create(0x84c87814,0xa1f0ab72),X64Word_create(0x8cc70208,0x1a6439ec),X64Word_create(0x90befffa,0x23631e28),X64Word_create(0xa4506ceb,0xde82bde9),X64Word_create(0xbef9a3f7,0xb2c67915),X64Word_create(0xc67178f2,0xe372532b),X64Word_create(0xca273ece,0xea26619c),X64Word_create(0xd186b8c7,0x21c0c207),X64Word_create(0xeada7dd6,0xcde0eb1e),X64Word_create(0xf57d4f7f,0xee6ed178),X64Word_create(0x06f067aa,0x72176fba),X64Word_create(0x0a637dc5,0xa2c898a6),X64Word_create(0x113f9804,0xbef90dae),X64Word_create(0x1b710b35,0x131c471b),X64Word_create(0x28db77f5,0x23047d84),X64Word_create(0x32caab7b,0x40c72493),X64Word_create(0x3c9ebe0a,0x15c9bebc),X64Word_create(0x431d67c4,0x9c100d4c),X64Word_create(0x4cc5d4be,0xcb3e42b6),X64Word_create(0x597f299c,0xfc657e2a),X64Word_create(0x5fcb6fab,0x3ad6faec),X64Word_create(0x6c44198c,0x4a475817)];var W=[];(function(){for(var i=0;i<80;i++){W[i]=X64Word_create();}}());var SHA512=C_algo.SHA512=Hasher.extend({_doReset:function(){this._hash=new X64WordArray.init([new X64Word.init(0x6a09e667,0xf3bcc908),new X64Word.init(0xbb67ae85,0x84caa73b),new X64Word.init(0x3c6ef372,0xfe94f82b),new X64Word.init(0xa54ff53a,0x5f1d36f1),new X64Word.init(0x510e527f,0xade682d1),new X64Word.init(0x9b05688c,0x2b3e6c1f),new X64Word.init(0x1f83d9ab,0xfb41bd6b),new X64Word.init(0x5be0cd19,0x137e2179)]);},_doProcessBlock:function(M,offset){var H=this._hash.words;var H0=H[0];var H1=H[1];var H2=H[2];var H3=H[3];var H4=H[4];var H5=H[5];var H6=H[6];var H7=H[7];var H0h=H0.high;var H0l=H0.low;var H1h=H1.high;var H1l=H1.low;var H2h=H2.high;var H2l=H2.low;var H3h=H3.high;var H3l=H3.low;var H4h=H4.high;var H4l=H4.low;var H5h=H5.high;var H5l=H5.low;var H6h=H6.high;var H6l=H6.low;var H7h=H7.high;var H7l=H7.low;var ah=H0h;var al=H0l;var bh=H1h;var bl=H1l;var ch=H2h;var cl=H2l;var dh=H3h;var dl=H3l;var eh=H4h;var el=H4l;var fh=H5h;var fl=H5l;var gh=H6h;var gl=H6l;var hh=H7h;var hl=H7l;for(var i=0;i<80;i++){var Wi=W[i];if(i<16){var Wih=Wi.high=M[offset+i*2]|0;var Wil=Wi.low=M[offset+i*2+1]|0;}else{var gamma0x=W[i-15];var gamma0xh=gamma0x.high;var gamma0xl=gamma0x.low;var gamma0h=((gamma0xh>>>1)|(gamma0xl<<31))^((gamma0xh>>>8)|(gamma0xl<<24))^(gamma0xh>>>7);var gamma0l=((gamma0xl>>>1)|(gamma0xh<<31))^((gamma0xl>>>8)|(gamma0xh<<24))^((gamma0xl>>>7)|(gamma0xh<<25));var gamma1x=W[i-2];var gamma1xh=gamma1x.high;var gamma1xl=gamma1x.low;var gamma1h=((gamma1xh>>>19)|(gamma1xl<<13))^((gamma1xh<<3)|(gamma1xl>>>29))^(gamma1xh>>>6);var gamma1l=((gamma1xl>>>19)|(gamma1xh<<13))^((gamma1xl<<3)|(gamma1xh>>>29))^((gamma1xl>>>6)|(gamma1xh<<26));var Wi7=W[i-7];var Wi7h=Wi7.high;var Wi7l=Wi7.low;var Wi16=W[i-16];var Wi16h=Wi16.high;var Wi16l=Wi16.low;var Wil=gamma0l+Wi7l;var Wih=gamma0h+Wi7h+((Wil>>>0)<(gamma0l>>>0)?1:0);var Wil=Wil+gamma1l;var Wih=Wih+gamma1h+((Wil>>>0)<(gamma1l>>>0)?1:0);var Wil=Wil+Wi16l;var Wih=Wih+Wi16h+((Wil>>>0)<(Wi16l>>>0)?1:0);Wi.high=Wih;Wi.low=Wil;}
var chh=(eh&fh)^(~eh&gh);var chl=(el&fl)^(~el&gl);var majh=(ah&bh)^(ah&ch)^(bh&ch);var majl=(al&bl)^(al&cl)^(bl&cl);var sigma0h=((ah>>>28)|(al<<4))^((ah<<30)|(al>>>2))^((ah<<25)|(al>>>7));var sigma0l=((al>>>28)|(ah<<4))^((al<<30)|(ah>>>2))^((al<<25)|(ah>>>7));var sigma1h=((eh>>>14)|(el<<18))^((eh>>>18)|(el<<14))^((eh<<23)|(el>>>9));var sigma1l=((el>>>14)|(eh<<18))^((el>>>18)|(eh<<14))^((el<<23)|(eh>>>9));var Ki=K[i];var Kih=Ki.high;var Kil=Ki.low;var t1l=hl+sigma1l;var t1h=hh+sigma1h+((t1l>>>0)<(hl>>>0)?1:0);var t1l=t1l+chl;var t1h=t1h+chh+((t1l>>>0)<(chl>>>0)?1:0);var t1l=t1l+Kil;var t1h=t1h+Kih+((t1l>>>0)<(Kil>>>0)?1:0);var t1l=t1l+Wil;var t1h=t1h+Wih+((t1l>>>0)<(Wil>>>0)?1:0);var t2l=sigma0l+majl;var t2h=sigma0h+majh+((t2l>>>0)<(sigma0l>>>0)?1:0);hh=gh;hl=gl;gh=fh;gl=fl;fh=eh;fl=el;el=(dl+t1l)|0;eh=(dh+t1h+((el>>>0)<(dl>>>0)?1:0))|0;dh=ch;dl=cl;ch=bh;cl=bl;bh=ah;bl=al;al=(t1l+t2l)|0;ah=(t1h+t2h+((al>>>0)<(t1l>>>0)?1:0))|0;}
H0l=H0.low=(H0l+al);H0.high=(H0h+ah+((H0l>>>0)<(al>>>0)?1:0));H1l=H1.low=(H1l+bl);H1.high=(H1h+bh+((H1l>>>0)<(bl>>>0)?1:0));H2l=H2.low=(H2l+cl);H2.high=(H2h+ch+((H2l>>>0)<(cl>>>0)?1:0));H3l=H3.low=(H3l+dl);H3.high=(H3h+dh+((H3l>>>0)<(dl>>>0)?1:0));H4l=H4.low=(H4l+el);H4.high=(H4h+eh+((H4l>>>0)<(el>>>0)?1:0));H5l=H5.low=(H5l+fl);H5.high=(H5h+fh+((H5l>>>0)<(fl>>>0)?1:0));H6l=H6.low=(H6l+gl);H6.high=(H6h+gh+((H6l>>>0)<(gl>>>0)?1:0));H7l=H7.low=(H7l+hl);H7.high=(H7h+hh+((H7l>>>0)<(hl>>>0)?1:0));},_doFinalize:function(){var data=this._data;var dataWords=data.words;var nBitsTotal=this._nDataBytes*8;var nBitsLeft=data.sigBytes*8;dataWords[nBitsLeft>>>5]|=0x80<<(24-nBitsLeft%32);dataWords[(((nBitsLeft+128)>>>10)<<5)+30]=Math.floor(nBitsTotal/0x100000000);dataWords[(((nBitsLeft+128)>>>10)<<5)+31]=nBitsTotal;data.sigBytes=dataWords.length*4;this._process();var hash=this._hash.toX32();return hash;},clone:function(){var clone=Hasher.clone.call(this);clone._hash=this._hash.clone();return clone;},blockSize:1024/32});C.SHA512=Hasher._createHelper(SHA512);C.HmacSHA512=Hasher._createHmacHelper(SHA512);}());(function(Math){var C=CryptoJS;var C_lib=C.lib;var WordArray=C_lib.WordArray;var Hasher=C_lib.Hasher;var C_x64=C.x64;var X64Word=C_x64.Word;var C_algo=C.algo;var RHO_OFFSETS=[];var PI_INDEXES=[];var ROUND_CONSTANTS=[];(function(){var x=1,y=0;for(var t=0;t<24;t++){RHO_OFFSETS[x+5*y]=((t+1)*(t+2)/2)%64;var newX=y%5;var newY=(2*x+3*y)%5;x=newX;y=newY;}
for(var x=0;x<5;x++){for(var y=0;y<5;y++){PI_INDEXES[x+5*y]=y+((2*x+3*y)%5)*5;}}
var LFSR=0x01;for(var i=0;i<24;i++){var roundConstantMsw=0;var roundConstantLsw=0;for(var j=0;j<7;j++){if(LFSR&0x01){var bitPosition=(1<<j)-1;if(bitPosition<32){roundConstantLsw^=1<<bitPosition;}else{roundConstantMsw^=1<<(bitPosition-32);}}
if(LFSR&0x80){LFSR=(LFSR<<1)^0x71;}else{LFSR<<=1;}}
ROUND_CONSTANTS[i]=X64Word.create(roundConstantMsw,roundConstantLsw);}}());var T=[];(function(){for(var i=0;i<25;i++){T[i]=X64Word.create();}}());var SHA3=C_algo.SHA3=Hasher.extend({cfg:Hasher.cfg.extend({outputLength:512}),_doReset:function(){var state=this._state=[]
for(var i=0;i<25;i++){state[i]=new X64Word.init();}
this.blockSize=(1600-2*this.cfg.outputLength)/32;},_doProcessBlock:function(M,offset){var state=this._state;var nBlockSizeLanes=this.blockSize/2;for(var i=0;i<nBlockSizeLanes;i++){var M2i=M[offset+2*i];var M2i1=M[offset+2*i+1];M2i=((((M2i<<8)|(M2i>>>24))&0x00ff00ff)|(((M2i<<24)|(M2i>>>8))&0xff00ff00));M2i1=((((M2i1<<8)|(M2i1>>>24))&0x00ff00ff)|(((M2i1<<24)|(M2i1>>>8))&0xff00ff00));var lane=state[i];lane.high^=M2i1;lane.low^=M2i;}
for(var round=0;round<24;round++){for(var x=0;x<5;x++){var tMsw=0,tLsw=0;for(var y=0;y<5;y++){var lane=state[x+5*y];tMsw^=lane.high;tLsw^=lane.low;}
var Tx=T[x];Tx.high=tMsw;Tx.low=tLsw;}
for(var x=0;x<5;x++){var Tx4=T[(x+4)%5];var Tx1=T[(x+1)%5];var Tx1Msw=Tx1.high;var Tx1Lsw=Tx1.low;var tMsw=Tx4.high^((Tx1Msw<<1)|(Tx1Lsw>>>31));var tLsw=Tx4.low^((Tx1Lsw<<1)|(Tx1Msw>>>31));for(var y=0;y<5;y++){var lane=state[x+5*y];lane.high^=tMsw;lane.low^=tLsw;}}
for(var laneIndex=1;laneIndex<25;laneIndex++){var lane=state[laneIndex];var laneMsw=lane.high;var laneLsw=lane.low;var rhoOffset=RHO_OFFSETS[laneIndex];if(rhoOffset<32){var tMsw=(laneMsw<<rhoOffset)|(laneLsw>>>(32-rhoOffset));var tLsw=(laneLsw<<rhoOffset)|(laneMsw>>>(32-rhoOffset));}else{var tMsw=(laneLsw<<(rhoOffset-32))|(laneMsw>>>(64-rhoOffset));var tLsw=(laneMsw<<(rhoOffset-32))|(laneLsw>>>(64-rhoOffset));}
var TPiLane=T[PI_INDEXES[laneIndex]];TPiLane.high=tMsw;TPiLane.low=tLsw;}
var T0=T[0];var state0=state[0];T0.high=state0.high;T0.low=state0.low;for(var x=0;x<5;x++){for(var y=0;y<5;y++){var laneIndex=x+5*y;var lane=state[laneIndex];var TLane=T[laneIndex];var Tx1Lane=T[((x+1)%5)+5*y];var Tx2Lane=T[((x+2)%5)+5*y];lane.high=TLane.high^(~Tx1Lane.high&Tx2Lane.high);lane.low=TLane.low^(~Tx1Lane.low&Tx2Lane.low);}}
var lane=state[0];var roundConstant=ROUND_CONSTANTS[round];lane.high^=roundConstant.high;lane.low^=roundConstant.low;;}},_doFinalize:function(){var data=this._data;var dataWords=data.words;var nBitsTotal=this._nDataBytes*8;var nBitsLeft=data.sigBytes*8;var blockSizeBits=this.blockSize*32;dataWords[nBitsLeft>>>5]|=0x1<<(24-nBitsLeft%32);dataWords[((Math.ceil((nBitsLeft+1)/blockSizeBits)*blockSizeBits)>>>5)-1]|=0x80;data.sigBytes=dataWords.length*4;this._process();var state=this._state;var outputLengthBytes=this.cfg.outputLength/8;var outputLengthLanes=outputLengthBytes/8;var hashWords=[];for(var i=0;i<outputLengthLanes;i++){var lane=state[i];var laneMsw=lane.high;var laneLsw=lane.low;laneMsw=((((laneMsw<<8)|(laneMsw>>>24))&0x00ff00ff)|(((laneMsw<<24)|(laneMsw>>>8))&0xff00ff00));laneLsw=((((laneLsw<<8)|(laneLsw>>>24))&0x00ff00ff)|(((laneLsw<<24)|(laneLsw>>>8))&0xff00ff00));hashWords.push(laneLsw);hashWords.push(laneMsw);}
return new WordArray.init(hashWords,outputLengthBytes);},clone:function(){var clone=Hasher.clone.call(this);var state=clone._state=this._state.slice(0);for(var i=0;i<25;i++){state[i]=state[i].clone();}
return clone;}});C.SHA3=Hasher._createHelper(SHA3);C.HmacSHA3=Hasher._createHmacHelper(SHA3);}(Math));var dbits;var canary=0xdeadbeefcafe;var j_lm=((canary&0xffffff)==0xefcafe);function BigInteger(a,b,c){if(a!=null)
if("number"==typeof a)this.fromNumber(a,b,c);else if(b==null&&"string"!=typeof a)this.fromString(a,256);else this.fromString(a,b);}
function nbi(){return new BigInteger(null);}
function am1(i,x,w,j,c,n){while(--n>=0){var v=x*this[i++]+w[j]+c;c=Math.floor(v/0x4000000);w[j++]=v&0x3ffffff;}
return c;}
function am2(i,x,w,j,c,n){var xl=x&0x7fff,xh=x>>15;while(--n>=0){var l=this[i]&0x7fff;var h=this[i++]>>15;var m=xh*l+h*xl;l=xl*l+((m&0x7fff)<<15)+w[j]+(c&0x3fffffff);c=(l>>>30)+(m>>>15)+xh*h+(c>>>30);w[j++]=l&0x3fffffff;}
return c;}
function am3(i,x,w,j,c,n){var xl=x&0x3fff,xh=x>>14;while(--n>=0){var l=this[i]&0x3fff;var h=this[i++]>>14;var m=xh*l+h*xl;l=xl*l+((m&0x3fff)<<14)+w[j]+c;c=(l>>28)+(m>>14)+xh*h;w[j++]=l&0xfffffff;}
return c;}
if(j_lm&&(navigator.appName=="Microsoft Internet Explorer")){BigInteger.prototype.am=am2;dbits=30;}
else if(j_lm&&(navigator.appName!="Netscape")){BigInteger.prototype.am=am1;dbits=26;}
else{BigInteger.prototype.am=am3;dbits=28;}
BigInteger.prototype.DB=dbits;BigInteger.prototype.DM=((1<<dbits)-1);BigInteger.prototype.DV=(1<<dbits);var BI_FP=52;BigInteger.prototype.FV=Math.pow(2,BI_FP);BigInteger.prototype.F1=BI_FP-dbits;BigInteger.prototype.F2=2*dbits-BI_FP;var BI_RM="0123456789abcdefghijklmnopqrstuvwxyz";var BI_RC=new Array();var rr,vv;rr="0".charCodeAt(0);for(vv=0;vv<=9;++vv)BI_RC[rr++]=vv;rr="a".charCodeAt(0);for(vv=10;vv<36;++vv)BI_RC[rr++]=vv;rr="A".charCodeAt(0);for(vv=10;vv<36;++vv)BI_RC[rr++]=vv;function int2char(n){return BI_RM.charAt(n);}
function intAt(s,i){var c=BI_RC[s.charCodeAt(i)];return(c==null)?-1:c;}
function bnpCopyTo(r){for(var i=this.t-1;i>=0;--i)r[i]=this[i];r.t=this.t;r.s=this.s;}
function bnpFromInt(x){this.t=1;this.s=(x<0)?-1:0;if(x>0)this[0]=x;else if(x<-1)this[0]=x+DV;else this.t=0;}
function nbv(i){var r=nbi();r.fromInt(i);return r;}
function bnpFromString(s,b){var k;if(b==16)k=4;else if(b==8)k=3;else if(b==256)k=8;else if(b==2)k=1;else if(b==32)k=5;else if(b==4)k=2;else{this.fromRadix(s,b);return;}
this.t=0;this.s=0;var i=s.length,mi=false,sh=0;while(--i>=0){var x=(k==8)?s[i]&0xff:intAt(s,i);if(x<0){if(s.charAt(i)=="-")mi=true;continue;}
mi=false;if(sh==0)
this[this.t++]=x;else if(sh+k>this.DB){this[this.t-1]|=(x&((1<<(this.DB-sh))-1))<<sh;this[this.t++]=(x>>(this.DB-sh));}
else
this[this.t-1]|=x<<sh;sh+=k;if(sh>=this.DB)sh-=this.DB;}
if(k==8&&(s[0]&0x80)!=0){this.s=-1;if(sh>0)this[this.t-1]|=((1<<(this.DB-sh))-1)<<sh;}
this.clamp();if(mi)BigInteger.ZERO.subTo(this,this);}
function bnpClamp(){var c=this.s&this.DM;while(this.t>0&&this[this.t-1]==c)--this.t;}
function bnToString(b){if(this.s<0)return"-"+this.negate().toString(b);var k;if(b==16)k=4;else if(b==8)k=3;else if(b==2)k=1;else if(b==32)k=5;else if(b==4)k=2;else return this.toRadix(b);var km=(1<<k)-1,d,m=false,r="",i=this.t;var p=this.DB-(i*this.DB)%k;if(i-->0){if(p<this.DB&&(d=this[i]>>p)>0){m=true;r=int2char(d);}
while(i>=0){if(p<k){d=(this[i]&((1<<p)-1))<<(k-p);d|=this[--i]>>(p+=this.DB-k);}
else{d=(this[i]>>(p-=k))&km;if(p<=0){p+=this.DB;--i;}}
if(d>0)m=true;if(m)r+=int2char(d);}}
return m?r:"0";}
function bnNegate(){var r=nbi();BigInteger.ZERO.subTo(this,r);return r;}
function bnAbs(){return(this.s<0)?this.negate():this;}
function bnCompareTo(a){var r=this.s-a.s;if(r!=0)return r;var i=this.t;r=i-a.t;if(r!=0)return(this.s<0)?-r:r;while(--i>=0)if((r=this[i]-a[i])!=0)return r;return 0;}
function nbits(x){var r=1,t;if((t=x>>>16)!=0){x=t;r+=16;}
if((t=x>>8)!=0){x=t;r+=8;}
if((t=x>>4)!=0){x=t;r+=4;}
if((t=x>>2)!=0){x=t;r+=2;}
if((t=x>>1)!=0){x=t;r+=1;}
return r;}
function bnBitLength(){if(this.t<=0)return 0;return this.DB*(this.t-1)+nbits(this[this.t-1]^(this.s&this.DM));}
function bnpDLShiftTo(n,r){var i;for(i=this.t-1;i>=0;--i)r[i+n]=this[i];for(i=n-1;i>=0;--i)r[i]=0;r.t=this.t+n;r.s=this.s;}
function bnpDRShiftTo(n,r){for(var i=n;i<this.t;++i)r[i-n]=this[i];r.t=Math.max(this.t-n,0);r.s=this.s;}
function bnpLShiftTo(n,r){var bs=n%this.DB;var cbs=this.DB-bs;var bm=(1<<cbs)-1;var ds=Math.floor(n/this.DB),c=(this.s<<bs)&this.DM,i;for(i=this.t-1;i>=0;--i){r[i+ds+1]=(this[i]>>cbs)|c;c=(this[i]&bm)<<bs;}
for(i=ds-1;i>=0;--i)r[i]=0;r[ds]=c;r.t=this.t+ds+1;r.s=this.s;r.clamp();}
function bnpRShiftTo(n,r){r.s=this.s;var ds=Math.floor(n/this.DB);if(ds>=this.t){r.t=0;return;}
var bs=n%this.DB;var cbs=this.DB-bs;var bm=(1<<bs)-1;r[0]=this[ds]>>bs;for(var i=ds+1;i<this.t;++i){r[i-ds-1]|=(this[i]&bm)<<cbs;r[i-ds]=this[i]>>bs;}
if(bs>0)r[this.t-ds-1]|=(this.s&bm)<<cbs;r.t=this.t-ds;r.clamp();}
function bnpSubTo(a,r){var i=0,c=0,m=Math.min(a.t,this.t);while(i<m){c+=this[i]-a[i];r[i++]=c&this.DM;c>>=this.DB;}
if(a.t<this.t){c-=a.s;while(i<this.t){c+=this[i];r[i++]=c&this.DM;c>>=this.DB;}
c+=this.s;}
else{c+=this.s;while(i<a.t){c-=a[i];r[i++]=c&this.DM;c>>=this.DB;}
c-=a.s;}
r.s=(c<0)?-1:0;if(c<-1)r[i++]=this.DV+c;else if(c>0)r[i++]=c;r.t=i;r.clamp();}
function bnpMultiplyTo(a,r){var x=this.abs(),y=a.abs();var i=x.t;r.t=i+y.t;while(--i>=0)r[i]=0;for(i=0;i<y.t;++i)r[i+x.t]=x.am(0,y[i],r,i,0,x.t);r.s=0;r.clamp();if(this.s!=a.s)BigInteger.ZERO.subTo(r,r);}
function bnpSquareTo(r){var x=this.abs();var i=r.t=2*x.t;while(--i>=0)r[i]=0;for(i=0;i<x.t-1;++i){var c=x.am(i,x[i],r,2*i,0,1);if((r[i+x.t]+=x.am(i+1,2*x[i],r,2*i+1,c,x.t-i-1))>=x.DV){r[i+x.t]-=x.DV;r[i+x.t+1]=1;}}
if(r.t>0)r[r.t-1]+=x.am(i,x[i],r,2*i,0,1);r.s=0;r.clamp();}
function bnpDivRemTo(m,q,r){var pm=m.abs();if(pm.t<=0)return;var pt=this.abs();if(pt.t<pm.t){if(q!=null)q.fromInt(0);if(r!=null)this.copyTo(r);return;}
if(r==null)r=nbi();var y=nbi(),ts=this.s,ms=m.s;var nsh=this.DB-nbits(pm[pm.t-1]);if(nsh>0){pm.lShiftTo(nsh,y);pt.lShiftTo(nsh,r);}
else{pm.copyTo(y);pt.copyTo(r);}
var ys=y.t;var y0=y[ys-1];if(y0==0)return;var yt=y0*(1<<this.F1)+((ys>1)?y[ys-2]>>this.F2:0);var d1=this.FV/yt,d2=(1<<this.F1)/yt,e=1<<this.F2;var i=r.t,j=i-ys,t=(q==null)?nbi():q;y.dlShiftTo(j,t);if(r.compareTo(t)>=0){r[r.t++]=1;r.subTo(t,r);}
BigInteger.ONE.dlShiftTo(ys,t);t.subTo(y,y);while(y.t<ys)y[y.t++]=0;while(--j>=0){var qd=(r[--i]==y0)?this.DM:Math.floor(r[i]*d1+(r[i-1]+e)*d2);if((r[i]+=y.am(0,qd,r,j,0,ys))<qd){y.dlShiftTo(j,t);r.subTo(t,r);while(r[i]<--qd)r.subTo(t,r);}}
if(q!=null){r.drShiftTo(ys,q);if(ts!=ms)BigInteger.ZERO.subTo(q,q);}
r.t=ys;r.clamp();if(nsh>0)r.rShiftTo(nsh,r);if(ts<0)BigInteger.ZERO.subTo(r,r);}
function bnMod(a){var r=nbi();this.abs().divRemTo(a,null,r);if(this.s<0&&r.compareTo(BigInteger.ZERO)>0)a.subTo(r,r);return r;}
function Classic(m){this.m=m;}
function cConvert(x){if(x.s<0||x.compareTo(this.m)>=0)return x.mod(this.m);else return x;}
function cRevert(x){return x;}
function cReduce(x){x.divRemTo(this.m,null,x);}
function cMulTo(x,y,r){x.multiplyTo(y,r);this.reduce(r);}
function cSqrTo(x,r){x.squareTo(r);this.reduce(r);}
Classic.prototype.convert=cConvert;Classic.prototype.revert=cRevert;Classic.prototype.reduce=cReduce;Classic.prototype.mulTo=cMulTo;Classic.prototype.sqrTo=cSqrTo;function bnpInvDigit(){if(this.t<1)return 0;var x=this[0];if((x&1)==0)return 0;var y=x&3;y=(y*(2-(x&0xf)*y))&0xf;y=(y*(2-(x&0xff)*y))&0xff;y=(y*(2-(((x&0xffff)*y)&0xffff)))&0xffff;y=(y*(2-x*y%this.DV))%this.DV;return(y>0)?this.DV-y:-y;}
function Montgomery(m){this.m=m;this.mp=m.invDigit();this.mpl=this.mp&0x7fff;this.mph=this.mp>>15;this.um=(1<<(m.DB-15))-1;this.mt2=2*m.t;}
function montConvert(x){var r=nbi();x.abs().dlShiftTo(this.m.t,r);r.divRemTo(this.m,null,r);if(x.s<0&&r.compareTo(BigInteger.ZERO)>0)this.m.subTo(r,r);return r;}
function montRevert(x){var r=nbi();x.copyTo(r);this.reduce(r);return r;}
function montReduce(x){while(x.t<=this.mt2)
x[x.t++]=0;for(var i=0;i<this.m.t;++i){var j=x[i]&0x7fff;var u0=(j*this.mpl+(((j*this.mph+(x[i]>>15)*this.mpl)&this.um)<<15))&x.DM;j=i+this.m.t;x[j]+=this.m.am(0,u0,x,i,0,this.m.t);while(x[j]>=x.DV){x[j]-=x.DV;x[++j]++;}}
x.clamp();x.drShiftTo(this.m.t,x);if(x.compareTo(this.m)>=0)x.subTo(this.m,x);}
function montSqrTo(x,r){x.squareTo(r);this.reduce(r);}
function montMulTo(x,y,r){x.multiplyTo(y,r);this.reduce(r);}
Montgomery.prototype.convert=montConvert;Montgomery.prototype.revert=montRevert;Montgomery.prototype.reduce=montReduce;Montgomery.prototype.mulTo=montMulTo;Montgomery.prototype.sqrTo=montSqrTo;function bnpIsEven(){return((this.t>0)?(this[0]&1):this.s)==0;}
function bnpExp(e,z){if(e>0xffffffff||e<1)return BigInteger.ONE;var r=nbi(),r2=nbi(),g=z.convert(this),i=nbits(e)-1;g.copyTo(r);while(--i>=0){z.sqrTo(r,r2);if((e&(1<<i))>0)z.mulTo(r2,g,r);else{var t=r;r=r2;r2=t;}}
return z.revert(r);}
function bnModPowInt(e,m){var z;if(e<256||m.isEven())z=new Classic(m);else z=new Montgomery(m);return this.exp(e,z);}
BigInteger.prototype.copyTo=bnpCopyTo;BigInteger.prototype.fromInt=bnpFromInt;BigInteger.prototype.fromString=bnpFromString;BigInteger.prototype.clamp=bnpClamp;BigInteger.prototype.dlShiftTo=bnpDLShiftTo;BigInteger.prototype.drShiftTo=bnpDRShiftTo;BigInteger.prototype.lShiftTo=bnpLShiftTo;BigInteger.prototype.rShiftTo=bnpRShiftTo;BigInteger.prototype.subTo=bnpSubTo;BigInteger.prototype.multiplyTo=bnpMultiplyTo;BigInteger.prototype.squareTo=bnpSquareTo;BigInteger.prototype.divRemTo=bnpDivRemTo;BigInteger.prototype.invDigit=bnpInvDigit;BigInteger.prototype.isEven=bnpIsEven;BigInteger.prototype.exp=bnpExp;BigInteger.prototype.toString=bnToString;BigInteger.prototype.negate=bnNegate;BigInteger.prototype.abs=bnAbs;BigInteger.prototype.compareTo=bnCompareTo;BigInteger.prototype.bitLength=bnBitLength;BigInteger.prototype.mod=bnMod;BigInteger.prototype.modPowInt=bnModPowInt;BigInteger.ZERO=nbv(0);BigInteger.ONE=nbv(1);function Arcfour(){this.i=0;this.j=0;this.S=new Array();}
function ARC4init(key){var i,j,t;for(i=0;i<256;++i)
this.S[i]=i;j=0;for(i=0;i<256;++i){j=(j+this.S[i]+key[i%key.length])&255;t=this.S[i];this.S[i]=this.S[j];this.S[j]=t;}
this.i=0;this.j=0;}
function ARC4next(){var t;this.i=(this.i+1)&255;this.j=(this.j+this.S[this.i])&255;t=this.S[this.i];this.S[this.i]=this.S[this.j];this.S[this.j]=t;return this.S[(t+this.S[this.i])&255];}
Arcfour.prototype.init=ARC4init;Arcfour.prototype.next=ARC4next;function prng_newstate(){return new Arcfour();}
var rng_psize=256;var rng_state;var rng_pool;var rng_pptr;function rng_seed_int(x){rng_pool[rng_pptr++]^=x&255;rng_pool[rng_pptr++]^=(x>>8)&255;rng_pool[rng_pptr++]^=(x>>16)&255;rng_pool[rng_pptr++]^=(x>>24)&255;if(rng_pptr>=rng_psize)rng_pptr-=rng_psize;}
function rng_seed_time(){rng_seed_int(new Date().getTime());}
if(rng_pool==null){rng_pool=new Array();rng_pptr=0;var t;if(navigator.appName=="Netscape"&&navigator.appVersion<"5"&&window.crypto){var z=window.crypto.random(32);for(t=0;t<z.length;++t)
rng_pool[rng_pptr++]=z.charCodeAt(t)&255;}
while(rng_pptr<rng_psize){t=Math.floor(65536*Math.random());rng_pool[rng_pptr++]=t>>>8;rng_pool[rng_pptr++]=t&255;}
rng_pptr=0;rng_seed_time();}
function rng_get_byte(){if(rng_state==null){rng_seed_time();rng_state=prng_newstate();rng_state.init(rng_pool);for(rng_pptr=0;rng_pptr<rng_pool.length;++rng_pptr)
rng_pool[rng_pptr]=0;rng_pptr=0;}
return rng_state.next();}
function rng_get_bytes(ba){var i;for(i=0;i<ba.length;++i)ba[i]=rng_get_byte();}
function SecureRandom(){}
SecureRandom.prototype.nextBytes=rng_get_bytes;function parseBigInt(str,r){return new BigInteger(str,r);}
function linebrk(s,n){var ret="";var i=0;while(i+n<s.length){ret+=s.substring(i,i+n)+"\n";i+=n;}
return ret+s.substring(i,s.length);}
function byte2Hex(b){if(b<0x10)
return"0"+b.toString(16);else
return b.toString(16);}
function pkcs1pad2(s,n){if(n<s.length+11){alert("Message too long for RSA");return null;}
var ba=new Array();var i=s.length-1;while(i>=0&&n>0){var c=s.charCodeAt(i--);if(c<128){ba[--n]=c;}
else if((c>127)&&(c<2048)){ba[--n]=(c&63)|128;ba[--n]=(c>>6)|192;}
else{ba[--n]=(c&63)|128;ba[--n]=((c>>6)&63)|128;ba[--n]=(c>>12)|224;}}
ba[--n]=0;var rng=new SecureRandom();var x=new Array();while(n>2){x[0]=0;while(x[0]==0)rng.nextBytes(x);ba[--n]=x[0];}
ba[--n]=2;ba[--n]=0;return new BigInteger(ba);}
function RSAKey(){this.n=null;this.e=0;this.d=null;this.p=null;this.q=null;this.dmp1=null;this.dmq1=null;this.coeff=null;}
function RSASetPublic(N,E){if(N!=null&&E!=null&&N.length>0&&E.length>0){this.n=parseBigInt(N,16);this.e=parseInt(E,16);}
else
alert("Invalid RSA public key");}
function RSADoPublic(x){return x.modPowInt(this.e,this.n);}
function RSAEncrypt(text){var m=pkcs1pad2(text,(this.n.bitLength()+7)>>3);if(m==null)return null;var c=this.doPublic(m);if(c==null)return null;var h=c.toString(16);if((h.length&1)==0)return h;else return"0"+h;}
RSAKey.prototype.doPublic=RSADoPublic;RSAKey.prototype.setPublic=RSASetPublic;RSAKey.prototype.encrypt=RSAEncrypt;var Lawnchair=function(options,callback){if(!(this instanceof Lawnchair))return new Lawnchair(options,callback);if(!JSON)throw'JSON unavailable! Include http://www.json.org/json2.js to fix.'
if(arguments.length<=2&&arguments.length>0){callback=(typeof arguments[0]==='function')?arguments[0]:arguments[1];options=(typeof arguments[0]==='function')?{}:arguments[0];}else{throw'Incorrect # of ctor args!'}
if(typeof callback!=='function')throw'No callback was provided';this.record=options.record||'record'
this.name=options.name||'records'
var adapter
if(options.adapter){if(typeof(options.adapter)==='string'){options.adapter=[options.adapter];}
for(var j=0,k=options.adapter.length;j<k;j++){for(var i=Lawnchair.adapters.length-1;i>=0;i--){if(Lawnchair.adapters[i].adapter===options.adapter[j]){adapter=Lawnchair.adapters[i].valid()?Lawnchair.adapters[i]:undefined;if(adapter)break}}
if(adapter)break}}
else{for(var i=0,l=Lawnchair.adapters.length;i<l;i++){adapter=Lawnchair.adapters[i].valid()?Lawnchair.adapters[i]:undefined
if(adapter)break}}
if(!adapter)throw'No valid adapter.'
for(var j in adapter)
this[j]=adapter[j]
for(var i=0,l=Lawnchair.plugins.length;i<l;i++)
Lawnchair.plugins[i].call(this)
this.init(options,callback)}
Lawnchair.adapters=[]
Lawnchair.adapter=function(id,obj){obj['adapter']=id
var implementing='adapter valid init keys save batch get exists all remove nuke'.split(' '),indexOf=this.prototype.indexOf
for(var i in obj){if(indexOf(implementing,i)===-1)throw'Invalid adapter! Nonstandard method: '+i}
Lawnchair.adapters.splice(0,0,obj)}
Lawnchair.plugins=[]
Lawnchair.plugin=function(obj){for(var i in obj)
i==='init'?Lawnchair.plugins.push(obj[i]):this.prototype[i]=obj[i]}
Lawnchair.prototype={isArray:Array.isArray||function(o){return Object.prototype.toString.call(o)==='[object Array]'},indexOf:function(ary,item,i,l){if(ary.indexOf)return ary.indexOf(item)
for(i=0,l=ary.length;i<l;i++)if(ary[i]===item)return i
return-1},lambda:function(callback){return this.fn(this.record,callback)},fn:function(name,callback){return typeof callback=='string'?new Function(name,callback):callback},uuid:function(){var S4=function(){return(((1+Math.random())*0x10000)|0).toString(16).substring(1);}
return(S4()+S4()+"-"+S4()+"-"+S4()+"-"+S4()+"-"+S4()+S4()+S4());},each:function(callback){var cb=this.lambda(callback)
if(this.__results){for(var i=0,l=this.__results.length;i<l;i++)cb.call(this,this.__results[i],i)}
else{this.all(function(r){for(var i=0,l=r.length;i<l;i++)cb.call(this,r[i],i)})}
return this}};Lawnchair.adapter('window-name',(function(){if(typeof window==='undefined'){window={top:{}};}
var data={}
try{data=JSON.parse(window.top.name)}catch(e){}
return{valid:function(){return typeof window.top.name!='undefined'},init:function(options,callback){data[this.name]=data[this.name]||{index:[],store:{}}
this.index=data[this.name].index
this.store=data[this.name].store
this.fn(this.name,callback).call(this,this)
return this},keys:function(callback){this.fn('keys',callback).call(this,this.index)
return this},save:function(obj,cb){var key=obj.key||this.uuid()
this.exists(key,function(exists){if(!exists){if(obj.key)delete obj.key
this.index.push(key)}
this.store[key]=obj
try{window.top.name=JSON.stringify(data)}catch(e){if(!exists){this.index.pop();delete this.store[key];}
throw e;}
if(cb){obj.key=key
this.lambda(cb).call(this,obj)}})
return this},batch:function(objs,cb){var r=[]
for(var i=0,l=objs.length;i<l;i++){this.save(objs[i],function(record){r.push(record)})}
if(cb)this.lambda(cb).call(this,r)
return this},get:function(keyOrArray,cb){var r;if(this.isArray(keyOrArray)){r=[]
for(var i=0,l=keyOrArray.length;i<l;i++){r.push(this.store[keyOrArray[i]])}}else{r=this.store[keyOrArray]
if(r)r.key=keyOrArray}
if(cb)this.lambda(cb).call(this,r)
return this},exists:function(key,cb){this.lambda(cb).call(this,!!(this.store[key]))
return this},all:function(cb){var r=[]
for(var i=0,l=this.index.length;i<l;i++){var obj=this.store[this.index[i]]
obj.key=this.index[i]
r.push(obj)}
this.fn(this.name,cb).call(this,r)
return this},remove:function(keyOrArray,cb){var del=this.isArray(keyOrArray)?keyOrArray:[keyOrArray]
for(var i=0,l=del.length;i<l;i++){var key=del[i].key?del[i].key:del[i]
var where=this.indexOf(this.index,key)
if(where<0)continue
delete this.store[key]
this.index.splice(where,1)}
window.top.name=JSON.stringify(data)
if(cb)this.lambda(cb).call(this)
return this},nuke:function(cb){this.store=data[this.name].store={}
this.index=data[this.name].index=[]
window.top.name=JSON.stringify(data)
if(cb)this.lambda(cb).call(this)
return this}}})())
Lawnchair.adapter('dom',(function(){var storage=window.localStorage
var indexer=function(name){return{key:name+'._index_',all:function(){var a=storage.getItem(this.key)
if(a){a=JSON.parse(a)}
if(a===null)storage.setItem(this.key,JSON.stringify([]))
return JSON.parse(storage.getItem(this.key))},add:function(key){var a=this.all()
a.push(key)
storage.setItem(this.key,JSON.stringify(a))},del:function(key){var a=this.all(),r=[]
for(var i=0,l=a.length;i<l;i++){if(a[i]!=key)r.push(a[i])}
storage.setItem(this.key,JSON.stringify(r))},find:function(key){var a=this.all()
for(var i=0,l=a.length;i<l;i++){if(key===a[i])return i}
return false}}}
return{valid:function(){return!!storage&&function(){var success=true
var value=Math.random()
try{storage.setItem(value,value)}catch(e){success=false}
storage.removeItem(value)
return success}()},init:function(options,callback){this.indexer=indexer(this.name)
if(callback)this.fn(this.name,callback).call(this,this)},save:function(obj,callback){var key=obj.key?this.name+'.'+obj.key:this.name+'.'+this.uuid()
delete obj.key;storage.setItem(key,JSON.stringify(obj))
if(this.indexer.find(key)===false)this.indexer.add(key)
obj.key=key.slice(this.name.length+1)
if(callback){this.lambda(callback).call(this,obj)}
return this},batch:function(ary,callback){var saved=[]
for(var i=0,l=ary.length;i<l;i++){this.save(ary[i],function(r){saved.push(r)})}
if(callback)this.lambda(callback).call(this,saved)
return this},keys:function(callback){if(callback){var name=this.name
var indices=this.indexer.all();var keys=[];if(Array.prototype.map){keys=indices.map(function(r){return r.replace(name+'.','')})}else{for(var key in indices){keys.push(key.replace(name+'.',''));}}
this.fn('keys',callback).call(this,keys)}
return this},get:function(key,callback){if(this.isArray(key)){var r=[]
for(var i=0,l=key.length;i<l;i++){var k=this.name+'.'+key[i]
var obj=storage.getItem(k)
if(obj){obj=JSON.parse(obj)
obj.key=key[i]}
r.push(obj)}
if(callback)this.lambda(callback).call(this,r)}else{var k=this.name+'.'+key
var obj=storage.getItem(k)
if(obj){obj=JSON.parse(obj)
obj.key=key}
if(callback)this.lambda(callback).call(this,obj)}
return this},exists:function(key,cb){var exists=this.indexer.find(this.name+'.'+key)===false?false:true;this.lambda(cb).call(this,exists);return this;},all:function(callback){var idx=this.indexer.all(),r=[],o,k
for(var i=0,l=idx.length;i<l;i++){k=idx[i]
o=JSON.parse(storage.getItem(k))
o.key=k.replace(this.name+'.','')
r.push(o)}
if(callback)this.fn(this.name,callback).call(this,r)
return this},remove:function(keyOrArray,callback){var self=this;if(this.isArray(keyOrArray)){var i,done=keyOrArray.length;var removeOne=function(i){self.remove(keyOrArray[i],function(){if((--done)>0){return;}
if(callback){self.lambda(callback).call(self);}});};for(i=0;i<keyOrArray.length;i++)
removeOne(i);return this;}
var key=this.name+'.'+
((keyOrArray.key)?keyOrArray.key:keyOrArray)
this.indexer.del(key)
storage.removeItem(key)
if(callback)this.lambda(callback).call(this)
return this},nuke:function(callback){this.all(function(r){for(var i=0,l=r.length;i<l;i++){this.remove(r[i]);}
if(callback)this.lambda(callback).call(this)})
return this}}})());Lawnchair.adapter('localFileStorage',(function(){function doLog(mess){if(console){console.log(mess);}}
var fail=function(e,i){if(console)console.log('error in file system adapter !',e,i);else throw e;};function filenameForKey(key,cb){key=$fh.app_props.appid+key;$fh.hash({algorithm:"MD5",text:key},function(result){var filename=result.hashvalue+'.txt';if(typeof navigator.externalstorage!=="undefined"){navigator.externalstorage.enable(function handleSuccess(res){var path=filename;if(res.path){path=res.path;if(!path.match(/\/$/)){path+='/';}
path+=filename;}
filename=path;return cb(filename);},function handleError(err){return cb(filename);})}else{doLog('filenameForKey key='+key+' , Filename: '+filename);return cb(filename);}});}
return{valid:function(){return!!(window.requestFileSystem)},init:function(options,callback){if(options&&'function'===typeof options.fail)fail=options.fail;if(callback)this.fn(this.name,callback).call(this,this);},keys:function(callback){throw"Currently not supported";},save:function(obj,callback){var key=obj.key;var value=obj.val||obj.value;filenameForKey(key,function(hash){window.requestFileSystem(LocalFileSystem.PERSISTENT,0,function gotFS(fileSystem){fileSystem.root.getFile(hash,{create:true},function gotFileEntry(fileEntry){fileEntry.createWriter(function gotFileWriter(writer){writer.onwrite=function(){return callback({key:key,val:value});};writer.write(value);},function(){fail('[save] Failed to create file writer');});},function(){fail('[save] Failed to getFile');});},function(){fail('[save] Failed to requestFileSystem');});});},batch:function(records,callback){throw"Currently not supported";},get:function(key,callback){filenameForKey(key,function(hash){window.requestFileSystem(LocalFileSystem.PERSISTENT,0,function gotFS(fileSystem){fileSystem.root.getFile(hash,{},function gotFileEntry(fileEntry){fileEntry.file(function gotFile(file){var reader=new FileReader();reader.onloadend=function(evt){var text=evt.target.result;try{text=decodeURIComponent(text);}catch(e){}
return callback({key:key,val:text});};reader.readAsText(file);},function(){fail('[load] Failed to getFile');});},function(){callback({key:key,val:null});});},function(){fail('[load] Failed to get fileSystem');});});},exists:function(key,callback){filenameForKey(key,function(hash){window.requestFileSystem(LocalFileSystem.PERSISTENT,0,function gotFS(fileSystem){fileSystem.root.getFile(hash,{},function gotFileEntry(fileEntry){return callback(true);},function(err){return callback(false);});});});},all:function(callback){throw"Currently not supported";},remove:function(key,callback){filenameForKey(key,function(hash){window.requestFileSystem(LocalFileSystem.PERSISTENT,0,function gotFS(fileSystem){fileSystem.root.getFile(hash,{},function gotFileEntry(fileEntry){fileEntry.remove(function(){return callback({key:key,val:null});},function(){fail('[remove] Failed to remove file');});},function(){fail('[remove] Failed to getFile');});},function(){fail('[remove] Failed to get fileSystem');});});},nuke:function(callback){throw"Currently not supported";}};}()));Lawnchair.adapter('webkit-sqlite',(function(){var fail=function(e,i){if(console){console.log('error in sqlite adaptor!',e,i)}},now=function(){return new Date()}
if(!Function.prototype.bind){Function.prototype.bind=function(obj){var slice=[].slice,args=slice.call(arguments,1),self=this,nop=function(){},bound=function(){return self.apply(this instanceof nop?this:(obj||{}),args.concat(slice.call(arguments)))}
nop.prototype=self.prototype
bound.prototype=new nop()
return bound}}
return{valid:function(){return!!(window.openDatabase)},init:function(options,callback){var that=this,cb=that.fn(that.name,callback),create="CREATE TABLE IF NOT EXISTS "+this.record+" (id NVARCHAR(32) UNIQUE PRIMARY KEY, value TEXT, timestamp REAL)",win=function(){return cb.call(that,that);}
if(options&&'function'===typeof options.fail)fail=options.fail
this.db=openDatabase(this.name,'1.0.0',this.name,65536)
this.db.transaction(function(t){t.executeSql(create,[],win,fail)})},keys:function(callback){var cb=this.lambda(callback),that=this,keys="SELECT id FROM "+this.record+" ORDER BY timestamp DESC"
this.db.readTransaction(function(t){var win=function(xxx,results){if(results.rows.length==0){cb.call(that,[])}else{var r=[];for(var i=0,l=results.rows.length;i<l;i++){r.push(results.rows.item(i).id);}
cb.call(that,r)}}
t.executeSql(keys,[],win,fail)})
return this},save:function(obj,callback,error){var that=this
objs=(this.isArray(obj)?obj:[obj]).map(function(o){if(!o.key){o.key=that.uuid()}
return o}),ins="INSERT OR REPLACE INTO "+this.record+" (value, timestamp, id) VALUES (?,?,?)",win=function(){if(callback){that.lambda(callback).call(that,that.isArray(obj)?objs:objs[0])}},error=error||function(){},insvals=[],ts=now()
try{for(var i=0,l=objs.length;i<l;i++){insvals[i]=[JSON.stringify(objs[i]),ts,objs[i].key];}}catch(e){fail(e)
throw e;}
that.db.transaction(function(t){for(var i=0,l=objs.length;i<l;i++)
t.executeSql(ins,insvals[i])},function(e,i){fail(e,i)},win)
return this},batch:function(objs,callback){return this.save(objs,callback)},get:function(keyOrArray,cb){var that=this,sql='',args=this.isArray(keyOrArray)?keyOrArray:[keyOrArray];sql='SELECT id, value FROM '+this.record+" WHERE id IN ("+
args.map(function(){return'?'}).join(",")+")"
var win=function(xxx,results){var o,r,lookup={}
for(var i=0,l=results.rows.length;i<l;i++){o=JSON.parse(results.rows.item(i).value)
o.key=results.rows.item(i).id
lookup[o.key]=o;}
r=args.map(function(key){return lookup[key];});if(!that.isArray(keyOrArray))r=r.length?r[0]:null
if(cb)that.lambda(cb).call(that,r)}
this.db.readTransaction(function(t){t.executeSql(sql,args,win,fail)})
return this},exists:function(key,cb){var is="SELECT * FROM "+this.record+" WHERE id = ?",that=this,win=function(xxx,results){if(cb)that.fn('exists',cb).call(that,(results.rows.length>0))}
this.db.readTransaction(function(t){t.executeSql(is,[key],win,fail)})
return this},all:function(callback){var that=this,all="SELECT * FROM "+this.record,r=[],cb=this.fn(this.name,callback)||undefined,win=function(xxx,results){if(results.rows.length!=0){for(var i=0,l=results.rows.length;i<l;i++){var obj=JSON.parse(results.rows.item(i).value)
obj.key=results.rows.item(i).id
r.push(obj)}}
if(cb)cb.call(that,r)}
this.db.readTransaction(function(t){t.executeSql(all,[],win,fail)})
return this},remove:function(keyOrArray,cb){var that=this,args,sql="DELETE FROM "+this.record+" WHERE id ",win=function(){if(cb)that.lambda(cb).call(that)}
if(!this.isArray(keyOrArray)){sql+='= ?';args=[keyOrArray];}else{args=keyOrArray;sql+="IN ("+
args.map(function(){return'?'}).join(',')+")";}
args=args.map(function(obj){return obj.key?obj.key:obj;});this.db.transaction(function(t){t.executeSql(sql,args,win,fail);});return this;},nuke:function(cb){var nuke="DELETE FROM "+this.record,that=this,win=cb?function(){that.lambda(cb).call(that)}:function(){}
this.db.transaction(function(t){t.executeSql(nuke,[],win,fail)})
return this}}})());(function(root){root.$fh=root.$fh||{};var $fh=root.$fh;$fh.fh_timeout=20000;$fh.boxprefix='/box/srv/1.1/';$fh.sdk_version='1.1.2';var _is_initializing=false;var _init_failed=false;var _cloud_ready_listeners=[];var _cloudReady=function(success){try{while(_cloud_ready_listeners[0]){var act_fun=_cloud_ready_listeners.shift();if(act_fun.type==="init"){if(success){act_fun.success($fh.cloud_props);}else{if(act_fun.fail){act_fun.fail("fh_init_failed",{});}}}
if(act_fun.type==="act"){if(success){$fh.act(act_fun.opts,act_fun.success,act_fun.fail);}else{if(act_fun.fail){act_fun.fail("fh_init_failed",{});}}}}}finally{}};var _mock_uuid_cookie_name="mock_uuid";var __readCookieValue=function(cookie_name){var name_str=cookie_name+"=";var cookies=document.cookie.split(";");for(var i=0;i<cookies.length;i++){var c=cookies[i];while(c.charAt(0)===' '){c=c.substring(1,c.length);}
if(c.indexOf(name_str)===0){return c.substring(name_str.length,c.length);}}
return null;};var __createUUID=function(){var s=[];var hexDigitals="0123456789ABCDEF";for(var i=0;i<32;i++){s[i]=hexDigitals.substr(Math.floor(Math.random()*0x10),1);}
s[12]="4";s[16]=hexDigitals.substr((s[16]&0x3)|0x8,1);var uuid=s.join("");return uuid;};var __createCookie=function(cookie_name,cookie_value){var date=new Date();date.setTime(date.getTime()+36500*24*60*60*1000);var expires="; expires="+date.toGMTString();document.cookie=cookie_name+"="+cookie_value+expires+"; path = /";};var getDeviceId=function(){if(typeof window.device!=="undefined"&&typeof window.device.uuid!=="undefined"){return window.device.uuid;}else if(typeof navigator.device!=="undefined"&&typeof navigator.device.uuid!=="undefined"){return navigator.device.uuid;}else{var uuid=__readCookieValue(_mock_uuid_cookie_name);if(null==uuid){uuid=__createUUID();__createCookie(_mock_uuid_cookie_name,uuid);}
return uuid;}};var getCuidMap=function(){if(typeof window.device!=="undefined"&&typeof window.device.cuidMap!=="undefined"){return window.device.cuidMap;}else if(typeof navigator.device!=="undefined"&&typeof navigator.device.cuidMap!=="undefined"){return navigator.device.cuidMap;}
return null;};$fh._getDeviceId=getDeviceId;$fh._getCuidMap=getCuidMap;var __isSmartMobile=/Android|webOS|iPhone|iPad|iPad|Blackberry|Windows Phone/i.test(navigator.userAgent);var __isLocalFile=window.location.protocol.indexOf("file")>-1;function isSameOrigin(url){var loc=window.location;var uriParts=new RegExp("^(?:([^:/?#.]+):)?(?://)?(([^:/?#]*)(?::(\\d*))?)((/(?:[^?#](?![^?#/]*\\.[^?#/.]+(?:[\\?#]|$)))*/?)?([^?#/]*))?(?:\\?([^#]*))?(?:#(.*))?");var locParts=uriParts.exec(loc);var urlParts=uriParts.exec(url);return((urlParts[1]==null||urlParts[1]==='')&&(urlParts[3]==null||urlParts[3]==='')&&(urlParts[4]==null||urlParts[4]===''))||(locParts[1]===urlParts[1]&&locParts[3]===urlParts[3]&&locParts[4]===urlParts[4]);}
function XDomainRequestWrapper(xdr){this.xdr=xdr;this.isWrapper=true;this.readyState=0;this.onreadystatechange=null;this.status=0;this.statusText="";this.responseText="";var self=this;this.xdr.onload=function(){self.readyState=4;self.status=200;self.statusText="";self.responseText=self.xdr.responseText;if(self.onreadystatechange){self.onreadystatechange();}};this.xdr.onerror=function(){if(self.onerror){self.onerror();}
self.readyState=4;self.status=0;self.statusText="";if(self.onreadystatechange){self.onreadystatechange();}};this.xdr.ontimeout=function(){self.readyState=4;self.status=408;self.statusText="timeout";if(self.onreadystatechange){self.onreadystatechange();}};}
XDomainRequestWrapper.prototype.open=function(method,url,asyn){this.xdr.open(method,url);};XDomainRequestWrapper.prototype.send=function(data){this.xdr.send(data);};XDomainRequestWrapper.prototype.abort=function(){this.xdr.abort();};XDomainRequestWrapper.prototype.setRequestHeader=function(n,v){};XDomainRequestWrapper.prototype.getResponseHeader=function(n){};var __cors_supported=false;if(window.XMLHttpRequest){var rq=new XMLHttpRequest();if('withCredentials'in rq){__cors_supported=true;}
if(!__cors_supported){if(typeof XDomainRequest!=="undefined"){__cors_supported=true;}}}
var __xhr=function(){var xhr=null;if(window.XMLHttpRequest){xhr=new XMLHttpRequest();}else if(window.ActiveXObject){xhr=new window.ActiveXObject("Microsoft.XMLHTTP");}
return xhr;};var __cor=function(){var cor=null;if(window.XMLHttpRequest){var rq=new XMLHttpRequest();if('withCredentials'in rq){cor=rq;}}
if(null==cor){if(typeof XDomainRequest!=="undefined"){cor=new XDomainRequestWrapper(new XDomainRequest());}}
return cor;};var __cb_counts=0;var __load_script=function(url,callback){var script;var head=document.head||document.getElementsByTagName("head")[0]||document.documentElement;script=document.createElement("script");script.async="async";script.src=url;script.type="text/javascript";script.onload=script.onreadystatechange=function(){if(!script.readyState||/loaded|complete/.test(script.readyState)){script.onload=script.onreadystatechange=null;if(head&&script.parentNode){head.removeChild(script);}
script=undefined;if(callback&&typeof callback==="function"){callback();}}};head.insertBefore(script,head.firstChild);};$fh.__load_script=__load_script;var defaultFail=function(err){if(console){console.log(err);}};$fh.__ajax=function(options){var o=options?options:{};var sameOrigin=isSameOrigin(options.url);if(!sameOrigin){if(typeof window.Phonegap!=="undefined"||typeof window.cordova!=="undefined"){sameOrigin=true;}}
if(!sameOrigin){if(__isSmartMobile&&__isLocalFile){sameOrigin=true;}}
if(sameOrigin||((!sameOrigin)&&__cors_supported)){o.dataType='json';}else{o.dataType="jsonp";}
var req;var url=o.url;var method=o.type||'GET';var data=o.data||null;var timeoutTimer;var rurl=/\?/;var datatype=o.dataType==="jsonp"?"jsonp":"json";var done=function(status,statusText,responseText){var issuccess=false;var error;var res;if(status>=200&&status<=300||status===304){if(status===304){statusText="notmodified";issuccess=true;}else{if(o.dataType&&o.dataType.indexOf('json')!==-1){try{if(typeof responseText==="string"){res=JSON.parse(responseText);}else{res=responseText;}
issuccess=true;}catch(e){issuccess=false;statusText="parseerror";error=e;}}else{res=responseText;issuccess=true;}}}else{error=statusText;if(!statusText||status){statusText="error";if(status<0){status=0;}}}
if(issuccess){req=undefined;if(o.success&&typeof o.success==='function'){o.success(res);}}else{if(o.error&&typeof o.error==='function'){o.error(req,statusText,error);}}};var types={'json':function(){if(sameOrigin){req=__xhr();}else{req=__cor();}
if(req.isWrapper){req.open("GET",url+"?params="+encodeURIComponent(data),true);}else{req.open(method,url,true);}
if(o.contentType){req.setRequestHeader('Content-Type',o.contentType);}
req.setRequestHeader('X-Request-With','XMLHttpRequest');var handler=function(){if(req.readyState===4){if(req.status===0&&!sameOrigin&&!req.isAborted){return types['jsonp']();}
else{if(timeoutTimer){clearTimeout(timeoutTimer);}}
var statusText;try{statusText=req.statusText;}catch(e){statusText="";}
if(!req.isAborted){done(req.status,req.statusText,req.responseText);}}};req.onreadystatechange=handler;req.send(data);},'jsonp':function(){var callbackId='fhcb'+__cb_counts++;window[callbackId]=function(response){if(timeoutTimer){clearTimeout(timeoutTimer);}
done(200,"",response);window[callbackId]=undefined;try{delete window[callbackId];}catch(e){}};url+=(rurl.test(url)?"&":"?")+"_callback="+callbackId;if(o.data){var d=o.data;if(typeof d==="string"){url+="&_jsonpdata="+encodeURIComponent(o.data);}else{url+="&_jsonpdata="+encodeURIComponent(JSON.stringify(o.data));}}
__load_script(url);}};if(o.timeout>0){timeoutTimer=setTimeout(function(){if(req){req.isAborted=true;req.abort();}
done(0,'timeout');},o.timeout);}
types[datatype]();};_handleError=function(fail,req,resStatus){var errraw;if(req){try{var res=JSON.parse(req.responseText);errraw=res.error;}catch(e){errraw=req.responseText;}}
if(fail){fail('error_ajaxfail',{status:req.status,message:resStatus,error:errraw});}};_getQueryMap=function(url){var qmap;var i=url.split("?");if(i.length===2){var queryString=i[1];var pairs=queryString.split("&");qmap={};for(var p=0;p<pairs.length;p++){var q=pairs[p];var qp=q.split("=");qmap[qp[0]]=qp[1];}}
return qmap;};_checkAuthResponse=function(url){if(/\_fhAuthCallback/.test(url)){var qmap=_getQueryMap(url);if(qmap){var fhCallback=qmap["_fhAuthCallback"];if(fhCallback){if(qmap['result']&&qmap['result']==='success'){var sucRes={'sessionToken':qmap['fh_auth_session'],'authResponse':JSON.parse(decodeURIComponent(decodeURIComponent(qmap['authResponse'])))};window[fhCallback](null,sucRes);}else{window[fhCallback]({'message':qmap['message']});}}}}};_getFhParams=function(){var fhParams={};fhParams.cuid=getDeviceId();fhParams.cuidMap=getCuidMap();fhParams.appid=$fh.app_props.appid;fhParams.appkey=$fh.app_props.appkey;fhParams.analyticsTag=$fh.app_props.analyticsTag;fhParams.init=$fh.app_props.init;if(typeof fh_destination_code!=='undefined'){fhParams.destination=fh_destination_code;}else{fhParams.destination="web";}
if(typeof fh_app_version!=='undefined'){fhParams.app_version=fh_app_version;}
fhParams.sdk_version=_getSdkVersion();return fhParams;};_addFhParams=function(params){params=params||{};params.__fh=_getFhParams();return params;};_getSdkVersion=function(){var type="FH_JS_SDK";if(typeof fh_destination_code!=='undefined'){type="FH_HYBRID_SDK";}else if(window.PhoneGap||window.cordova){type="FH_PHONEGAP_SDK";}
return type+"/"+$fh.sdk_version;};if(window.addEventListener){window.addEventListener('load',function(){_checkAuthResponse(window.location.href);},false);}else{window.attachEvent('onload',function(){_checkAuthResponse(window.location.href);});}
$fh._handleAuthResponse=function(endurl,res,success,fail){if(res.status&&res.status==="ok"){if(res.url){if(window.PhoneGap||window.cordova){if(window.plugins&&window.plugins.childBrowser){if(typeof window.plugins.childBrowser.showWebPage==="function"){window.plugins.childBrowser.onLocationChange=function(new_url){if(new_url.indexOf(endurl)>-1){window.plugins.childBrowser.close();var qmap=_getQueryMap(new_url);if(qmap){if(qmap['result']&&qmap['result']==='success'){var sucRes={'sessionToken':qmap['fh_auth_session'],'authResponse':JSON.parse(decodeURIComponent(decodeURIComponent(qmap['authResponse'])))};success(sucRes);}else{if(fail){fail("auth_failed",{'message':qmap['message']});}}}else{if(fail){fail("auth_failed",{'message':qmap['message']});}}}};window.plugins.childBrowser.showWebPage(res.url);}}else{console.log("ChildBrowser plugin is not intalled.");success(res);}}else{document.location.href=res.url;}}else{success(res);}}else{if(fail){fail("auth_failed",res);}}};$fh.init=function(opts,success,fail){if($fh.cloud_props){return success($fh.cloud_props);}
if(!_is_initializing){_is_initializing=true;if(!fail){fail=defaultFail;}
if(!opts.host){return fail('init_no_host',{});}
if(!opts.appid){return fail('init_no_appid',{});}
if(!opts.appkey){return fail('init_no_appkey',{});}
$fh.app_props=opts;var lcConf={name:"fh_init_storage",adapter:"dom",fail:function(msg,err){var error_message='read/save from/to local storage failed  msg:'+msg+' err:'+err;return fail(error_message,{});}};var storage=null;try{storage=new Lawnchair(lcConf,function(){});}catch(e){lcConf.adapter=undefined;storage=new Lawnchair(lcConf,function(){});}
storage.get('fh_init',function(storage_res){if(storage_res&&storage_res.value!==null){$fh.app_props.init=storage_res.value;}
var path=opts.host+$fh.boxprefix+"app/init";var data=_getFhParams();$fh.__ajax({"url":path,"type":"POST","contentType":"application/json","data":JSON.stringify(data),"timeout":opts.timeout||$fh.app_props.timeout||$fh.fh_timeout,"success":function(data){$fh.cloud_props=data;storage.save({key:"fh_init",value:data.init},function(){if(success){success(data);}
_cloudReady(true);});},"error":function(req,statusText,error){_init_failed=true;_is_initializing=false;_handleError(fail,req,statusText);_cloudReady(false);}});});}else{_cloud_ready_listeners.push({type:'init',success:success,fail:fail});}};$fh.act=function(opts,success,fail){if(!fail){fail=defaultFail;}
if(!opts.act){return fail('act_no_action',{});}
if(_init_failed){$fh.init($fh.app_props,function(suc){_init_failed=false;doActCall();},function(err){_handleError(fail,{"status":0,"responseText":"Init Failed"},"failed to call init. Check network status");});}
else if(null==$fh.cloud_props&&_is_initializing){_cloud_ready_listeners.push({"type":"act","opts":opts,"success":success,"fail":fail});return;}
else{doActCall();}
function doActCall(){var cloud_host=$fh.cloud_props.hosts.releaseCloudUrl;var app_type=$fh.cloud_props.hosts.releaseCloudType;if($fh.app_props.mode&&$fh.app_props.mode.indexOf("dev")>-1){cloud_host=$fh.cloud_props.hosts.debugCloudUrl;app_type=$fh.cloud_props.hosts.debugCloudType;}
var url=cloud_host+"/cloud/"+opts.act;if(app_type==="fh"){url=cloud_host+$fh.boxprefix+"act/"+$fh.cloud_props.domain+"/"+$fh.app_props.appid+"/"+opts.act+"/"+$fh.app_props.appid;}
var params=opts.req||{};params=_addFhParams(params);return $fh.__ajax({"url":url,"type":"POST","data":JSON.stringify(params),"contentType":"application/json","timeout":opts.timeout||$fh.app_props.timeout||$fh.fh_timeout,success:function(res){if(success){return success(res);}},error:function(req,statusText,error){_handleError(fail,req,statusText);}});}};$fh.auth=function(opts,success,fail){if(!fail){fail=defaultFail;}
if(null==$fh.cloud_props){return fail('fh_not_ready',{});}
var req={};if(!opts.policyId){return fail('auth_no_policyId',{});}
if(!opts.clientToken){return fail('auth_no_clientToken',{});}
req.policyId=opts.policyId;req.clientToken=opts.clientToken;if(opts.endRedirectUrl){req.endRedirectUrl=opts.endRedirectUrl;if(opts.authCallback){req.endRedirectUrl+=(/\?/.test(req.endRedirectUrl)?"&":"?")+"_fhAuthCallback="+opts.authCallback;}}
req.params={};if(opts.params){req.params=opts.params;}
var endurl=opts.endRedirectUrl||"status=complete";req.device=getDeviceId();var path=$fh.app_props.host+$fh.boxprefix+"admin/authpolicy/auth";req=_addFhParams(req);$fh.__ajax({"url":path,"type":"POST","data":JSON.stringify(req),"contentType":"application/json","timeout":opts.timeout||$fh.app_props.timeout||$fh.fh_timeout,success:function(res){$fh._handleAuthResponse(endurl,res,success,fail);},error:function(req,statusText,error){_handleError(fail,req,statusText);}});};})(this);$fh=$fh||{};$fh.sync=(function(){var self={defaults:{"sync_frequency":10,"auto_sync_local_updates":true,"notify_client_storage_failed":true,"notify_sync_started":true,"notify_sync_complete":true,"notify_offline_update":true,"notify_collision_detected":true,"notify_remote_update_failed":true,"notify_local_update_applied":true,"notify_remote_update_applied":true,"notify_delta_received":true,"notify_sync_failed":true,"do_console_log":false,"crashed_count_wait":10,"resend_crashed_updates":true},notifications:{"CLIENT_STORAGE_FAILED":"client_storage_failed","SYNC_STARTED":"sync_started","SYNC_COMPLETE":"sync_complete","OFFLINE_UPDATE":"offline_update","COLLISION_DETECTED":"collision_detected","REMOTE_UPDATE_FAILED":"remote_update_failed","REMOTE_UPDATE_APPLIED":"remote_update_applied","LOCAL_UPDATE_APPLIED":"local_update_applied","DELTA_RECEIVED":"delta_received","SYNC_FAILED":"sync_failed"},datasets:{},config:undefined,notify_callback:undefined,init:function(options){self.consoleLog('sync - init called');self.config=JSON.parse(JSON.stringify(self.defaults));for(var i in options){self.config[i]=options[i];}
self.datasetMonitor();},notify:function(callback){self.notify_callback=callback;},manage:function(dataset_id,options,query_params){var doManage=function(dataset){self.consoleLog('doManage dataset :: initialised = '+dataset.initialised+" :: "+dataset_id+' :: '+JSON.stringify(options));if(!self.config){self.config=JSON.parse(JSON.stringify(self.defaults));}
var datasetConfig=JSON.parse(JSON.stringify(self.config));for(var k in options){datasetConfig[k]=options[k];}
dataset.query_params=query_params||{};dataset.config=datasetConfig;dataset.syncRunning=false;dataset.syncPending=true;dataset.initialised=true;dataset.meta={};self.saveDataSet(dataset_id);};self.getDataSet(dataset_id,function(dataset){doManage(dataset);},function(err){self.loadDataSet(dataset_id,function(dataset){self.doNotify(dataset_id,null,self.notifications.LOCAL_UPDATE_APPLIED,"load");doManage(dataset);},function(err){self.consoleLog('Creating new dataset for id '+dataset_id);var dataset={};dataset.pending={};self.datasets[dataset_id]=dataset;doManage(dataset);});});},list:function(dataset_id,success,failure){self.getDataSet(dataset_id,function(dataset){if(dataset){var res=JSON.parse(JSON.stringify(dataset.data));success(res);}},function(code,msg){failure(code,msg);});},create:function(dataset_id,data,success,failure){self.addPendingObj(dataset_id,null,data,"create",success,failure);},read:function(dataset_id,uid,success,failure){self.getDataSet(dataset_id,function(dataset){var rec=dataset.data[uid];if(!rec){failure("unknown_uid");}else{var res=JSON.parse(JSON.stringify(rec));success(res);}},function(code,msg){failure(code,msg);});},update:function(dataset_id,uid,data,success,failure){self.addPendingObj(dataset_id,uid,data,"update",success,failure);},'delete':function(dataset_id,uid,success,failure){self.addPendingObj(dataset_id,uid,null,"delete",success,failure);},getPending:function(dataset_id,cb){self.getDataSet(dataset_id,function(dataset){var res;if(dataset){res=dataset.pending;}
cb(res);},function(err,datatset_id){self.ConsoleLog(err);});},clearPending:function(dataset_id,cb){self.getDataSet(dataset_id,function(dataset){dataset.pending={};self.saveDataSet(dataset_id,cb);});},listCollisions:function(dataset_id,success,failure){$fh.act({"act":dataset_id,"req":{"fn":"listCollisions"}},success,failure);},removeCollision:function(dataset_id,colissionHash,success,failure){$fh.act({"act":dataset_id,"req":{"fn":"removeCollision","hash":colissionHash}},success,failure);},isOnline:function(callback){var online=true;if(typeof navigator.onLine!=="undefined"){online=navigator.onLine;}
if(online){if(typeof navigator.network!=="undefined"&&typeof navigator.network.connection!=="undefined"){var networkType=navigator.network.connection.type;if(networkType==="none"||networkType===null){online=false;}}}
return callback(online);},doNotify:function(dataset_id,uid,code,message){if(self.notify_callback){if(self.config['notify_'+code]){var notification={"dataset_id":dataset_id,"uid":uid,"code":code,"message":message};setTimeout(function(){self.notify_callback(notification);},0);}}},getDataSet:function(dataset_id,success,failure){var dataset=self.datasets[dataset_id];if(dataset){success(dataset);}else{failure('unknown_dataset'+dataset_id,dataset_id);}},sortObject:function(object){if(typeof object!=="object"||object===null){return object;}
var result=[];Object.keys(object).sort().forEach(function(key){result.push({key:key,value:self.sortObject(object[key])});});return result;},sortedStringify:function(obj){var str='';try{str=JSON.stringify(self.sortObject(obj));}catch(e){console.error('Error stringifying sorted object:'+e);}
return str;},generateHash:function(object){var hash=CryptoJS.SHA1(self.sortedStringify(object));return hash.toString();},addPendingObj:function(dataset_id,uid,data,action,success,failure){self.isOnline(function(online){if(!online){self.doNotify(dataset_id,uid,self.notifications.OFFLINE_UPDATE,action);}});function storePendingObject(obj){obj.hash=self.generateHash(obj);self.getDataSet(dataset_id,function(dataset){dataset.pending[obj.hash]=obj;self.updateDatasetFromLocal(dataset,obj);if(self.config.auto_sync_local_updates){dataset.syncPending=true;}
self.saveDataSet(dataset_id);self.doNotify(dataset_id,uid,self.notifications.LOCAL_UPDATE_APPLIED,action);success(obj);},function(code,msg){failure(code,msg);});}
var pendingObj={};pendingObj.inFlight=false;pendingObj.action=action;pendingObj.post=data;pendingObj.postHash=self.generateHash(pendingObj.post);pendingObj.timestamp=new Date().getTime();if("create"===action){pendingObj.uid=pendingObj.postHash;storePendingObject(pendingObj);}else{self.read(dataset_id,uid,function(rec){pendingObj.uid=uid;pendingObj.pre=rec.data;pendingObj.preHash=self.generateHash(rec.data);storePendingObject(pendingObj);},function(code,msg){failure(code,msg);});}},syncLoop:function(dataset_id){self.getDataSet(dataset_id,function(dataSet){dataSet.syncPending=false;dataSet.syncRunning=true;dataSet.syncLoopStart=new Date().getTime();self.doNotify(dataset_id,null,self.notifications.SYNC_STARTED,null);self.isOnline(function(online){if(!online){self.syncComplete(dataset_id,"offline");}else{var syncLoopParams={};syncLoopParams.fn='sync';syncLoopParams.dataset_id=dataset_id;syncLoopParams.query_params=dataSet.query_params;syncLoopParams.dataset_hash=dataSet.hash;syncLoopParams.acknowledgements=dataSet.acknowledgements||[];var pending=dataSet.pending;var pendingArray=[];for(var i in pending){if(!pending[i].inFlight&&!pending[i].crashed){pending[i].inFlight=true;pending[i].inFlightDate=new Date().getTime();pendingArray.push(pending[i]);}}
syncLoopParams.pending=pendingArray;if(pendingArray.length>0){self.consoleLog('Starting sync loop - global hash = '+dataSet.hash+' :: params = '+JSON.stringify(syncLoopParams,null,2));}
try{$fh.act({'act':dataset_id,'req':syncLoopParams},function(res){var rec;function processUpdates(updates,notification,acknowledgements){if(updates){for(var up in updates){rec=updates[up];acknowledgements.push(rec);if(dataSet.pending[up]&&dataSet.pending[up].inFlight&&!dataSet.pending[up].crashed){delete dataSet.pending[up];self.doNotify(dataset_id,rec.uid,notification,rec);}}}}
self.updatePendingFromNewData(dataset_id,dataSet,res);self.updateCrashedInFlightFromNewData(dataset_id,dataSet,res);self.updateNewDataFromInFlight(dataset_id,dataSet,res);self.updateNewDataFromPending(dataset_id,dataSet,res);if(res.records){dataSet.data=res.records;dataSet.hash=res.hash;self.doNotify(dataset_id,res.hash,self.notifications.DELTA_RECEIVED,'full dataset');}
if(res.updates){var acknowledgements=[];processUpdates(res.updates.applied,self.notifications.REMOTE_UPDATE_APPLIED,acknowledgements);processUpdates(res.updates.failed,self.notifications.REMOTE_UPDATE_FAILED,acknowledgements);processUpdates(res.updates.collisions,self.notifications.COLLISION_DETECTED,acknowledgements);dataSet.acknowledgements=acknowledgements;}
else if(res.hash&&res.hash!==dataSet.hash){self.consoleLog("Local dataset stale - syncing records :: local hash= "+dataSet.hash+" - remoteHash="+res.hash);self.syncRecords(dataset_id);}else{self.consoleLog("Local dataset up to date");}
self.syncComplete(dataset_id,"online");},function(msg,err){self.markInFlightAsCrashed(dataSet);self.consoleLog("syncLoop failed : msg="+msg+" :: err = "+err);self.doNotify(dataset_id,null,self.notifications.SYNC_FAILED,msg);self.syncComplete(dataset_id,msg);});}
catch(e){self.consoleLog('Error performing sync - '+e);self.syncComplete(dataset_id,e);}}});});},syncRecords:function(dataset_id){self.getDataSet(dataset_id,function(dataSet){var localDataSet=dataSet.data||{};var clientRecs={};for(var i in localDataSet){var uid=i;var hash=localDataSet[i].hash;clientRecs[uid]=hash;}
var syncRecParams={};syncRecParams.fn='syncRecords';syncRecParams.dataset_id=dataset_id;syncRecParams.query_params=dataSet.query_params;syncRecParams.clientRecs=clientRecs;self.consoleLog("syncRecParams :: "+JSON.stringify(syncRecParams));$fh.act({'act':dataset_id,'req':syncRecParams},function(res){var i;if(res.create){for(i in res.create){localDataSet[i]={"hash":res.create[i].hash,"data":res.create[i].data};self.doNotify(dataset_id,i,self.notifications.DELTA_RECEIVED,"create");}}
if(res.update){for(i in res.update){localDataSet[i].hash=res.update[i].hash;localDataSet[i].data=res.update[i].data;self.doNotify(dataset_id,i,self.notifications.DELTA_RECEIVED,"update");}}
if(res['delete']){for(i in res['delete']){delete localDataSet[i];self.doNotify(dataset_id,i,self.notifications.DELTA_RECEIVED,"delete");}}
dataSet.data=localDataSet;if(res.hash){dataSet.hash=res.hash;}
self.syncComplete(dataset_id,"online");},function(msg,err){self.consoleLog("syncRecords failed : msg="+msg+" :: err="+err);self.syncComplete(dataset_id,msg);});});},syncComplete:function(dataset_id,status){self.getDataSet(dataset_id,function(dataset){dataset.syncRunning=false;dataset.syncLoopEnd=new Date().getTime();self.saveDataSet(dataset_id);self.doNotify(dataset_id,dataset.hash,self.notifications.SYNC_COMPLETE,status);});},checkDatasets:function(){for(var dataset_id in self.datasets){if(self.datasets.hasOwnProperty(dataset_id)){var dataset=self.datasets[dataset_id];if(!dataset.syncRunning){var lastSyncStart=dataset.syncLoopStart;var lastSyncCmp=dataset.syncLoopEnd;if(lastSyncStart==null){self.consoleLog(dataset_id+' - Performing initial sync');dataset.syncPending=true;}else if(lastSyncCmp!=null){var timeSinceLastSync=new Date().getTime()-lastSyncCmp;var syncFrequency=dataset.config.sync_frequency*1000;if(timeSinceLastSync>syncFrequency){dataset.syncPending=true;}}
if(dataset.syncPending){self.syncLoop(dataset_id);}}}}},datasetMonitor:function(){self.checkDatasets();setTimeout(function(){self.datasetMonitor();},500);},saveDataSet:function(dataset_id,cb){var onFail=function(msg,err){var errMsg='save to local storage failed  msg:'+msg+' err:'+err;self.doNotify(dataset_id,null,self.notifications.CLIENT_STORAGE_FAILED,errMsg);self.consoleLog(errMsg);};self.getDataSet(dataset_id,function(dataset){Lawnchair({fail:onFail},function(){this.save({key:"dataset_"+dataset_id,val:JSON.stringify(dataset)},function(){if(cb){cb();}});});});},loadDataSet:function(dataset_id,success,failure){var onFail=function(msg,err){var errMsg='load from local storage failed  msg:'+msg;self.doNotify(dataset_id,null,self.notifications.CLIENT_STORAGE_FAILED,errMsg);self.consoleLog(errMsg);};Lawnchair({fail:onFail},function(){this.get("dataset_"+dataset_id,function(data){if(data&&data.val!==null){var dataset=JSON.parse(data.val);dataset.initialised=false;self.datasets[dataset_id]=dataset;self.consoleLog('load from local storage success for dataset_id :'+dataset_id);return success(dataset);}else{return failure();}});});},updateDatasetFromLocal:function(dataset,pendingRec){var pending=dataset.pending;var previousPendingUid;var previousPending;var uid=pendingRec.uid;self.consoleLog('updating local dataset for uid '+uid+' - action = '+pendingRec.action);dataset.meta[uid]=dataset.meta[uid]||{};if(pendingRec.action==="create"){if(dataset.data[uid]){self.consoleLog('dataset already exists for uid in create :: '+JSON.stringify(dataset.data[uid]));if(dataset.meta[uid].fromPending){previousPendingUid=dataset.meta[uid].pendingUid;delete pending[previousPendingUid];}}
dataset.data[uid]={};}
if(pendingRec.action==="update"){if(dataset.data[uid]){if(dataset.meta[uid].fromPending){self.consoleLog('updating an existing pending record for dataset :: '+JSON.stringify(dataset.data[uid]));previousPendingUid=dataset.meta[uid].pendingUid;dataset.meta[uid].previousPendingUid=previousPendingUid;previousPending=pending[previousPendingUid];if(previousPending&&!previousPending.inFlight){self.consoleLog('existing pre-flight pending record = '+JSON.stringify(previousPending));previousPending.post=pendingRec.post;previousPending.postHash=pendingRec.postHash;delete pending[pendingRec.hash];}}}}
if(pendingRec.action==="delete"){if(dataset.data[uid]){if(dataset.meta[uid].fromPending){self.consoleLog('Deleting an existing pending record for dataset :: '+JSON.stringify(dataset.data[uid]));previousPendingUid=dataset.meta[uid].pendingUid;dataset.meta[uid].previousPendingUid=previousPendingUid;previousPending=pending[previousPendingUid];if(previousPending&&!previousPending.inFlight){self.consoleLog('existing pending record = '+JSON.stringify(previousPending));if(previousPending.action==="create"){delete pending[pendingRec.hash];delete pending[previousPendingUid];}
if(previousPending.action==="update"){pendingRec.pre=previousPending.pre;pendingRec.preHash=previousPending.preHash;pendingRec.inFlight=false;delete pending[previousPendingUid];}}}
delete dataset.data[uid];}}
if(dataset.data[uid]){dataset.data[uid].data=pendingRec.post;dataset.data[uid].hash=pendingRec.postHash;dataset.meta[uid].fromPending=true;dataset.meta[uid].pendingUid=pendingRec.hash;}},updatePendingFromNewData:function(dataset_id,dataset,newData){var pending=dataset.pending;var newRec;if(pending&&newData.records){for(var pendingHash in pending){if(pending.hasOwnProperty(pendingHash)){var pendingRec=pending[pendingHash];dataset.meta[pendingRec.uid]=dataset.meta[pendingRec.uid]||{};if(pendingRec.inFlight===false){self.consoleLog('updatePendingFromNewData - Found Non inFlight record -> action='+pendingRec.action+' :: uid='+pendingRec.uid+' :: hash='+pendingRec.hash);if(pendingRec.action==="update"||pendingRec.action==="delete"){newRec=newData.records[pendingRec.uid];if(newRec){self.consoleLog('updatePendingFromNewData - Updating pre values for existing pending record '+pendingRec.uid);pendingRec.pre=newRec.data;pendingRec.preHash=newRec.hash;}
else{var previousPendingUid=dataset.meta[pendingRec.uid].previousPendingUid;var previousPending=pending[previousPendingUid];if(previousPending){if(newData&&newData.updates&&newData.updates.applied&&newData.updates.applied[previousPending.hash]){var newUid=newData.updates.applied[previousPending.hash].uid;newRec=newData.records[newUid];if(newRec){self.consoleLog('updatePendingFromNewData - Updating pre values for existing pending record which was previously a create '+pendingRec.uid+' ==> '+newUid);pendingRec.pre=newRec.data;pendingRec.preHash=newRec.hash;pendingRec.uid=newUid;}}}}}
if(pendingRec.action==="create"){if(newData&&newData.updates&&newData.updates.applied&&newData.updates.applied[pendingHash]){self.consoleLog('updatePendingFromNewData - Found an update for a pending create '+JSON.stringify(newData.updates.applied[pendingHash]));newRec=newData.records[newData.updates.applied[pendingHash].uid];if(newRec){self.consoleLog('updatePendingFromNewData - Changing pending create to an update based on new record  '+JSON.stringify(newRec));pendingRec.action="update";pendingRec.pre=newRec.data;pendingRec.preHash=newRec.hash;pendingRec.uid=newData.updates.applied[pendingHash].uid;}}}}}}}},updateNewDataFromInFlight:function(dataset_id,dataset,newData){var pending=dataset.pending;if(pending&&newData.records){for(var pendingHash in pending){if(pending.hasOwnProperty(pendingHash)){var pendingRec=pending[pendingHash];if(pendingRec.inFlight){var updateReceivedForPending=(newData&&newData.updates&&newData.updates.hashes&&newData.updates.hashes[pendingHash])?true:false;self.consoleLog('updateNewDataFromInFlight - Found inflight pending Record - action = '+pendingRec.action+' :: hash = '+pendingHash+' :: updateReceivedForPending='+updateReceivedForPending);if(!updateReceivedForPending){var newRec=newData.records[pendingRec.uid];if(pendingRec.action==="update"&&newRec){newRec.data=pendingRec.post;newRec.hash=pendingRec.postHash;}
else if(pendingRec.action==="delete"&&newRec){delete newData.records[pendingRec.uid];}
else if(pendingRec.action==="create"){self.consoleLog('updateNewDataFromInFlight - re adding pending create to incomming dataset');var newPendingCreate={data:pendingRec.post,hash:pendingRec.postHash};newData.records[pendingRec.uid]=newPendingCreate;}}}}}}},updateNewDataFromPending:function(dataset_id,dataset,newData){var pending=dataset.pending;if(pending&&newData.records){for(var pendingHash in pending){if(pending.hasOwnProperty(pendingHash)){var pendingRec=pending[pendingHash];if(pendingRec.inFlight===false){self.consoleLog('updateNewDataFromPending - Found Non inFlight record -> action='+pendingRec.action+' :: uid='+pendingRec.uid+' :: hash='+pendingRec.hash);var newRec=newData.records[pendingRec.uid];if(pendingRec.action==="update"&&newRec){newRec.data=pendingRec.post;newRec.hash=pendingRec.postHash;}
else if(pendingRec.action==="delete"&&newRec){delete newData.records[pendingRec.uid];}
else if(pendingRec.action==="create"){self.consoleLog('updateNewDataFromPending - re adding pending create to incomming dataset');var newPendingCreate={data:pendingRec.post,hash:pendingRec.postHash};newData.records[pendingRec.uid]=newPendingCreate;}}}}}},updateCrashedInFlightFromNewData:function(dataset_id,dataset,newData){var updateNotifications={applied:self.notifications.REMOTE_UPDATE_APPLIED,failed:self.notifications.REMOTE_UPDATE_FAILED,collisions:self.notifications.COLLISION_DETECTED};var pending=dataset.pending;var resolvedCrashes={};var pendingHash;var pendingRec;if(pending){for(pendingHash in pending){if(pending.hasOwnProperty(pendingHash)){pendingRec=pending[pendingHash];if(pendingRec.inFlight&&pendingRec.crashed){self.consoleLog('updateCrashedInFlightFromNewData - Found crashed inFlight pending record uid='+pendingRec.uid+' :: hash='+pendingRec.hash);if(newData&&newData.updates&&newData.updates.hashes){var crashedUpdate=newData.updates.hashes[pendingHash];if(crashedUpdate){resolvedCrashes[crashedUpdate.uid]=crashedUpdate;self.consoleLog('updateCrashedInFlightFromNewData - Resolving status for crashed inflight pending record '+JSON.stringify(crashedUpdate));if(crashedUpdate.type==='failed'){if(crashedUpdate.action==='create'){self.consoleLog('updateCrashedInFlightFromNewData - Deleting failed create from dataset');delete dataset.data[crashedUpdate.uid];}
else if(crashedUpdate.action==='update'||crashedUpdate.action==='delete'){self.consoleLog('updateCrashedInFlightFromNewData - Reverting failed '+crashedUpdate.action+' in dataset');dataset.data[crashedUpdate.uid]={data:pendingRec.pre,hash:pendingRec.preHash};}}
delete pending[pendingHash];self.doNotify(dataset_id,crashedUpdate.uid,updateNotifications[crashedUpdate.type],crashedUpdate);}
else{if(pendingRec.crashedCount){pendingRec.crashedCount++;}
else{pendingRec.crashedCount=1;}}}
else{if(pendingRec.crashedCount){pendingRec.crashedCount++;}
else{pendingRec.crashedCount=1;}}}}}
for(pendingHash in pending){if(pending.hasOwnProperty(pendingHash)){pendingRec=pending[pendingHash];if(pendingRec.inFlight&&pendingRec.crashed){if(pendingRec.crashedCount>dataset.config.crashed_count_wait){self.consoleLog('updateCrashedInFlightFromNewData - Crashed inflight pending record has reached crashed_count_wait limit : '+JSON.stringify(pendingRec));if(dataset.config.resend_crashed_updates){self.consoleLog('updateCrashedInFlightFromNewData - Retryig crashed inflight pending record');pendingRec.crashed=false;pendingRec.inFlight=false;}
else{self.consoleLog('updateCrashedInFlightFromNewData - Deleting crashed inflight pending record');delete pending[pendingHash];}}}
else if(!pendingRec.inFlight&&pendingRec.crashed){self.consoleLog('updateCrashedInFlightFromNewData - Trying to resolve issues with crashed non in flight record - uid = '+pendingRec.uid);var crashedRef=resolvedCrashes[pendingRec.uid];if(crashedRef){self.consoleLog('updateCrashedInFlightFromNewData - Found a stalled pending record backed up behind a resolved crash uid='+pendingRec.uid+' :: hash='+pendingRec.hash);pendingRec.crashed=false;}}}}}},markInFlightAsCrashed:function(dataset){var pending=dataset.pending;var pendingHash;var pendingRec;if(pending){var crashedRecords={};for(pendingHash in pending){if(pending.hasOwnProperty(pendingHash)){pendingRec=pending[pendingHash];if(pendingRec.inFlight){self.consoleLog('Marking in flight pending record as crashed : '+pendingHash);pendingRec.crashed=true;crashedRecords[pendingRec.uid]=pendingRec;}}}
for(pendingHash in pending){if(pending.hasOwnProperty(pendingHash)){pendingRec=pending[pendingHash];if(!pendingRec.inFlight){var crashedRef=crashedRecords[pendingRec.uid];if(crashedRef){pendingRec.crashed=true;}}}}}},consoleLog:function(msg){if(self.config.do_console_log){console.log(msg);}}};(function(){self.config=self.defaults;})();return{init:self.init,manage:self.manage,notify:self.notify,doList:self.list,doCreate:self.create,doRead:self.read,doUpdate:self.update,doDelete:self['delete'],listCollisions:self.listCollisions,removeCollision:self.removeCollision,getPending:self.getPending,clearPending:self.clearPending,getDataset:self.getDataSet};})();(function(root){root.$fh=root.$fh||{};var $fh=root.$fh;$fh.sec=function(p,s,f){if(!p.act){f('bad_act',{},p);return;}
if(!p.params){f('no_params',{},p);return;}
if(!p.params.algorithm){f('no_params_algorithm',{},p);return;}
var isNodeApp=function(){if($fh&&$fh.cloud_props&&$fh.cloud_props.hosts&&$fh.app_props){var appType=$fh.cloud_props.hosts.releaseCloudType;if($fh.app_props.mode&&$fh.app_props.mode.indexOf("dev")>-1){appType=$fh.cloud_props.hosts.debugCloudType;}
if(appType==="fh"){return false;}}
return true;};var load_security_module=function(cb){if(typeof __Crypto!=="undefined"){return cb();}else{$fh.__load_script('fhext/js/security.js',cb);}};var acts={'keygen':function(){if(!p.params.keysize){f('no_params_keysize',{},p);return;}
if(p.params.algorithm.toLowerCase()!=="aes"){f('keygen_bad_algorithm',{},p);return;}
var keysize=parseInt(p.params.keysize,10);if(keysize>100){keysize=keysize/8;}
if(typeof SecureRandom==="undefined"){return f("security library is not loaded.");}
var generateRandomKey=function(keysize){var r=new SecureRandom();var key=new Array(keysize);r.nextBytes(key);var result="";for(var i=0;i<key.length;i++){result+=byte2Hex(key[i]);}
return result;};if(isNodeApp()){return s({'algorithm':'AES','secretkey':generateRandomKey(keysize),'iv':generateRandomKey(keysize)});}else{return s({'algorithm':'AES','secretkey':generateRandomKey(keysize)});}},'encrypt':function(){var found_err=false;var fields={'aes':['key','plaintext'],'rsa':['modulu','plaintext']};if(!isNodeApp()){fields.rsa.push('keysize');fields.rsa.push('key');}else{fields.aes.push('iv');}
var required=fields[p.params.algorithm.toLowerCase()];if(!required){f('encrypt_bad_algorithm',{},p);return;}
for(var i=0;i<required;i++){var field=required[i];if(!p.params[field]){found_err=true;f('no_params_'+field,{},p);break;}}
if(found_err){return;}
var rsa_encrypt,aes_encrypt;if(isNodeApp()){rsa_encrypt=function(p,s,f){if(typeof RSAKey==="undefined"){return f("security library is missing.Error: can not find RSAKey.");}
var key=new RSAKey();key.setPublic(p.params.modulu,"10001");var ori_text=p.params.plaintext;cipher_text=key.encrypt(ori_text);s({ciphertext:cipher_text});};aes_encrypt=function(p,s,f){if(typeof CryptoJS==="undefined"){return f("security library is missing.Error: can not find CryptoJS.");}
var encrypted=CryptoJS.AES.encrypt(p.params.plaintext,CryptoJS.enc.Hex.parse(p.params.key),{iv:CryptoJS.enc.Hex.parse(p.params.iv)});cipher_text=CryptoJS.enc.Hex.stringify(encrypted.ciphertext);s({ciphertext:cipher_text});};}else{rsa_encrypt=function(p,s,f){load_security_module(function(){if(typeof RSAKeyPair==="undefined"){return f('legacy security library is missing. Error: can not find RSAKeyPair.');}
var key_size=parseInt(p.params.keysize,10);var max=parseInt(key_size*2/16+2,10);setMaxDigits(max);var key=new RSAKeyPair(p.params.key,p.params.key,p.params.modulu);var ori_text=p.params.plaintext;var input='';for(var i=ori_text.length-1;i>=0;i--){input+=ori_text.charAt(i);}
cipher_text=encryptedString(key,input);s({ciphertext:cipher_text});});};aes_encrypt=function(p,s,f){load_security_module(function(){if(typeof __Crypto==="undefined"){return f("legacy security library is missing. Error: can not find __Crypto.");}
if(typeof $fh.Cipher==="undefined"){$fh.Cipher=__Crypto.__import(__Crypto,"titaniumcore.crypto.Cipher");}
var data=__Crypto.str2utf8(p.params.plaintext);var key=__Crypto.base16_decode(p.params.key);var cipher=$fh.Cipher.create($fh.Cipher.RIJNDAEL,$fh.Cipher.ENCRYPT,$fh.Cipher.ECB,$fh.Cipher.ISO10126);cipher_text=__Crypto.base16_encode(cipher.execute(key,data));s({ciphertext:cipher_text});});};}
if(p.params.algorithm.toLowerCase()==="rsa"){return rsa_encrypt(p,s,f);}else if(p.params.algorithm.toLowerCase()==="aes"){return aes_encrypt(p,s,f);}else{f('encrypt_bad_algorithm',{},p);return;}},'decrypt':function(){var found_err=false;var fields={'aes':['key','ciphertext']};if(isNodeApp()){fields.aes.push('iv');}
var required=fields[p.params.algorithm.toLowerCase()];if(!required){f('decrypt_bad_algorithm',{},p);return;}
for(var i=0;i<required;i++){var field=required[i];if(!p.params[field]){found_err=true;f('no_params_'+field,{},p);break;}}
if(found_err){return;}
var aes_decrypt;if(isNodeApp()){aes_decrypt=function(p,s,f){if(typeof CryptoJS==="undefined"){return f("security library is missing.Error: can not find CryptoJS.");}
var data=CryptoJS.enc.Hex.parse(p.params.ciphertext);var encodeData=CryptoJS.enc.Base64.stringify(data);var decrypted=CryptoJS.AES.decrypt(encodeData,CryptoJS.enc.Hex.parse(p.params.key),{iv:CryptoJS.enc.Hex.parse(p.params.iv)});plain_text=decrypted.toString(CryptoJS.enc.Utf8);s({plaintext:plain_text});};}else{aes_decrypt=function(p,s,f){load_security_module(function(){if(typeof __Crypto==="undefined"){return f("legacy security library is missing. Error: can not find __Crypto.");}
if(typeof $fh.Cipher==="undefined"){$fh.Cipher=__Crypto.__import(__Crypto,"titaniumcore.crypto.Cipher");}
var data=__Crypto.base16_decode(p.params.ciphertext);var key=__Crypto.base16_decode(p.params.key);var cipher=$fh.Cipher.create($fh.Cipher.RIJNDAEL,$fh.Cipher.DECRYPT,$fh.Cipher.ECB,$fh.Cipher.ISO10126);plain_text=__Crypto.utf82str(cipher.execute(key,data));s({plaintext:plain_text});});};}
if(p.params.algorithm.toLowerCase()==="aes"){aes_decrypt(p,s,f);}else{f('decrypt_bad_algorithm',{},p);return;}},'hash':function(){if(!p.params.text){f('hash_no_text',{},p);return;}
if(typeof CryptoJS==="undefined"){return f("security library is missing.Error: can not find CryptoJS.");}
var hashValue;if(p.params.algorithm.toLowerCase()==="md5"){hashValue=CryptoJS.MD5(p.params.text).toString(CryptoJS.enc.Hex);}else if(p.params.algorithm.toLowerCase()==="sha1"){hashValue=CryptoJS.SHA1(p.params.text).toString(CryptoJS.enc.Hex);}else if(p.params.algorithm.toLowerCase()==="sha256"){hashValue=CryptoJS.SHA256(p.params.text).toString(CryptoJS.enc.Hex);}else if(p.params.algorithm.toLowerCase()==="sha512"){hashValue=CryptoJS.SHA512(p.params.text).toString(CryptoJS.enc.Hex);}else{return f("hash_unsupported_algorithm: "+p.params.algorithm);}
s({"hashvalue":hashValue});}};if(acts[p.act]){acts[p.act]();}else{f('data_badact',p);}};$fh.hash=function(p,s,f){var params={};if(typeof p.algorithm==="undefined"){p.algorithm="MD5";}
params.act="hash";params.params=p;$fh.sec(params,s,f);};})(this);;var $fhclient=$fh;(function(){var defaultargs={success:function(){},failure:function(){},params:{}};var handleargs=function(inargs,defaultparams,applyto){var outargs=[null,null,null];var origargs=[null,null,null];var numargs=inargs.length;if(2<numargs){origargs[0]=inargs[numargs-3];origargs[1]=inargs[numargs-2];origargs[2]=inargs[numargs-1];}else if(2==numargs){origargs[1]=inargs[0];origargs[2]=inargs[1];}else if(1==numargs){origargs[2]=inargs[0];}
var i=0,j=0;for(;i<3;i++){var a=origargs[i];var ta=typeof a;if(a&&0==j&&('object'==ta||'boolean'==ta)){outargs[j++]=a;}else if(a&&'function'==ta){j=0==j?1:j;outargs[j++]=a;}}
if(null==outargs[0]){outargs[0]=defaultparams?defaultparams:defaultargs.params;}else{var paramsarg=outargs[0];paramsarg._defaults=[];for(var n in defaultparams){if(defaultparams.hasOwnProperty(n)){if(typeof paramsarg[n]==="undefined"){paramsarg[n]=defaultparams[n];paramsarg._defaults.push(n);}}}}
outargs[1]=null==outargs[1]?defaultargs.success:outargs[1];outargs[2]=null==outargs[2]?defaultargs.failure:outargs[2];applyto(outargs[0],outargs[1],outargs[2]);}
var eventSupported=function(event){var element=document.createElement('i');return event in element||element.setAttribute&&element.setAttribute(event,"return;")||false;}
$fh.__is_ready=false;$fh.__ready_list=[];var __ready_bound=false;var __security_loaded=false;var __module_paths={'security':'fhext/js/security.js'};$fh._getHostPrefix=function(){return $fh.app_props.host+$fh.boxprefix;}
var __ready=function(){if(!$fh.__is_ready){$fh.__is_ready=true;if($fh.__ready_list){try{while($fh.__ready_list[0]){$fh.__ready_list.shift().apply(document,[]);}}finally{}
$fh.__ready_list=null;}}};$fh.__bind_ready=function(){if(__ready_bound)return;__ready_bound=true;if(document.addEventListener){document.addEventListener("DOMContentLoaded",function(){document.removeEventListener("DOMContentLoaded",arguments.callee,false);__ready();},false);window.addEventListener("load",__ready,false);}else if(document.attachEvent){document.attachEvent("onreadystatechange",function(){if(document.readyState==="complete"){document.detachEvent("onreadystatechange",arguments.callee);__ready();}});window.attachEvent("onload",__ready);if(document.documentElement.doScroll&&window==window.top)(function(){if($fh.__is_ready)return;try{document.documentElement.doScroll("left");}catch(error){setTimeout(arguments.callee,0);return;}
__ready();})();}};$fh.__bind_ready();var __load_script=function(url,callback){var script;var head=document.head||document.getElementsByTagName("head")[0]||document.documentElement;script=document.createElement("script");script.async="async";script.src=url;script.type="text/javascript";script.onload=script.onreadystatechange=function(){if(!script.readyState||/loaded|complete/.test(script.readyState)){script.onload=script.onreadystatechange=null;if(head&&script.parentNode){head.removeChild(script);}
script=undefined;if(callback&&typeof callback==="function"){callback();}}}
head.insertBefore(script,head.firstChild);}
$fh.__load_module=function(module,callback){if($fh['__'+module+'_loaded']){callback();return;}else{if(__module_paths[module]){__load_script(__module_paths[module],callback);}}};$fh._mapScriptLoaded=(typeof google!="undefined")&&(typeof google.maps!="undefined")&&(typeof google.maps.Map!="undefined");$fh._loadMapScript=function(){var script=document.createElement("script");script.type="text/javascript";var protocol=document.location.protocol;protocol=(protocol==="http:"||protocol==="https:")?protocol:"https:";script.src=protocol+"//maps.google.com/maps/api/js?sensor=true&callback=$fh._mapLoaded";document.body.appendChild(script);};$fh.audio_obj=null;$fh.audio_is_playing=false;$fh._current_auth_user=null;$fh.__dest__={send:function(p,s,f){f('send_nosupport');},notify:function(p,s,f){f('notify_nosupport');},contacts:function(p,s,f){f('contacts_nosupport');},acc:function(p,s,f){f('acc_nosupport');},geo:function(p,s,f){f('geo_nosupport');},cam:function(p,s,f){f('cam_nosupport');},device:function(p,s,f){f('device_nosupport');},listen:function(p,s,f){f('listen_nosupport');},handlers:function(p,s,f){f('handlers_no_support');},file:function(p,s,f){f('file_nosupport');},push:function(p,s,f){f('push_nosupport');},env:function(p,s,f){s({height:window.innerHeight,width:window.innerWidth,uuid:function(){var uuid=$fh._getDeviceId();return uuid;}()});},data:function(p,s,f){if(!$fh._persist){$fh._persist=new Persist.Store('FH'+$fh.app_props.appid,{swf_path:'/static/c/start/swf/persist.swf'});}
if(!p.key){f('data_nokey');return;}
var acts={load:function(){$fh._persist.get(p.key,function(ok,val){ok?s({key:p.key,val:val}):s({key:p.key,val:null});});},save:function(){if(!p.val){f('data_noval');return;}
try{$fh._persist.set(p.key,p.val);}catch(e){f('data_error',{},p);return;}
s();},remove:function(){$fh._persist.remove(p.key,function(ok,val){ok?s({key:p.key,val:val}):s({key:p.key,val:null});});}};acts[p.act]?acts[p.act]():f('data_badact',p);},log:function(p,s,f){typeof console==="undefined"?f('log_nosupport'):console.log(p.message);},ori:function(p,s,f){if(typeof p.act=="undefined"||p.act=="listen"){if(eventSupported('onorientationchange')){window.addEventListener('orientationchange',s,false);}else{f('ori_nosupport',{},p);}}else if(p.act=="set"){if(!p.value){f('ori_no_value',{},p);return;}
if(p.value=="portrait"){document.getElementsByTagName("body")[0].style['-moz-transform']="";document.getElementsByTagName("body")[0].style['-webkit-transform']="";s({orientation:'portrait'});}else{document.getElementsByTagName("body")[0].style['-moz-transform']='rotate(90deg)';document.getElementsByTagName("body")[0].style['-webkit-transform']='rotate(90deg)';s({orientation:'landscape'});}}else{f('ori_badact',{},p);}},map:function(p,s,f){if(!p.target){f('map_notarget',{},p);return;}
if(!p.lat){f('map_nolatitude',{},p);return;}
if(!p.lon){f('map_nologitude',{},p);return;}
var target=p.target;if(typeof target==="string"){var target_dom=null;if(typeof jQuery!="undefined"){try{var jq_obj=jQuery(target);if(jq_obj.length>0){target_dom=jq_obj[0];}}catch(e){target_dom=null;}}
if(null==target_dom){target_dom=document.getElementById(target);}
target=target_dom;}
else if(typeof target==="object"){if(target.nodeType===1&&typeof target.nodeName==="string"){}else{target=target[0];}}
else{target=null;}
if(!target){f('map_nocontainer',{},p);return;}
if(!$fh._mapScriptLoaded){$fh._mapLoaded=function(){$fh._mapScriptLoaded=true;var mapOptions={};mapOptions.zoom=p.zoom?p.zoom:8;mapOptions.center=new google.maps.LatLng(p.lat,p.lon);mapOptions.mapTypeId=google.maps.MapTypeId.ROADMAP;var map=new google.maps.Map(target,mapOptions);s({map:map});};$fh._loadMapScript();setTimeout(function(){if(!$fh._mapScriptLoaded){f('map_timeout',{},p);}},20000);}else{var mapOptions={};mapOptions.zoom=p.zoom?p.zoom:8;mapOptions.center=new google.maps.LatLng(p.lat,p.lon);mapOptions.mapTypeId=google.maps.MapTypeId.ROADMAP;var map=new google.maps.Map(target,mapOptions);s({map:map});}},audio:function(p,s,f){if(!$fh.audio_obj==null&&p.act=="play"&&(!p.path||p.path=="")){f('no_audio_path');return;}
var acts={'play':function(){if(null==$fh.audio_obj){$fh.audio_obj=document.createElement("audio");if(!(($fh.audio_obj.play)?true:false)){f('audio_not_support');return;}
if(p.type){var canplay=$fh.audio_obj.canPlayType(p.type);if(canplay=="no"||canplay==""){f("audio_type_not_supported");return;}}
$fh.audio_obj.src=p.path;if(p.controls){$fh.audio_obj.controls="controls";}
if(p.autoplay){$fh.audio_obj.autoplay="autoplay";}
if(p.loop){$fh.audio_obj.loop="loop";}
document.body.appendChild($fh.audio_obj);$fh.audio_obj.play();$fh.audio_is_playing=true;s();}else{if(p.path&&(p.path!=$fh.audio_obj.src)){if($fh.audio_is_playing){acts['stop'](true);}
acts['play']();}else{if(!$fh.audio_is_playing){$fh.audio_obj.play();$fh.audio_is_playing=true;s();}}}},'pause':function(){if(null!=$fh.audio_obj&&$fh.audio_is_playing){if(typeof $fh.audio_obj.pause=="function"){$fh.audio_obj.pause();}else if(typeof $fh.audio_obj.stop=="function"){$fh.audio_obj.stop();}
$fh.audio_is_playing=false;s();}else{f('no_audio_playing');}},'stop':function(nocallback){if(null!=$fh.audio_obj){if(typeof $fh.audio_obj.stop=="function"){$fh.audio_obj.stop();}else if(typeof $fh.audio_obj.pause=="function"){$fh.audio_obj.pause();}
document.body.removeChild($fh.audio_obj);$fh.audio_obj=null;$fh.audio_is_playing=false;if(!nocallback){s();}}else{f('no_audio');}}}
acts[p.act]?acts[p.act]():f('data_badact',p);},webview:function(p,s,f){f('webview_nosupport');},ready:function(p,s,f){$fh.__bind_ready();if($fh.__is_ready){s.apply(document,[]);}else{$fh.__ready_list.push(s);}}}
$fh.send=function(){handleargs(arguments,{type:'email'},$fh.__dest__.send);}
$fh.notify=function(){handleargs(arguments,{type:'vibrate'},$fh.__dest__.notify);}
$fh.contacts=function(){handleargs(arguments,{act:'list'},$fh.__dest__.contacts);}
$fh.acc=function(){handleargs(arguments,{act:'register',interval:0},$fh.__dest__.acc);}
$fh.geo=function(){handleargs(arguments,{act:'register',interval:0},$fh.__dest__.geo);}
$fh.cam=function(){handleargs(arguments,{act:'picture'},$fh.__dest__.cam);}
$fh.data=function(){handleargs(arguments,{act:'load'},$fh.__dest__.data);}
$fh.log=function(){handleargs(arguments,{message:'none'},$fh.__dest__.log);}
$fh.device=function(){handleargs(arguments,{},$fh.__dest__.device);}
$fh.listen=function(){handleargs(arguments,{act:'add'},$fh.__dest__.listen);}
$fh.ori=function(){handleargs(arguments,{},$fh.__dest__.ori);}
$fh.map=function(){handleargs(arguments,{},$fh.__dest__.map);}
$fh.audio=function(){handleargs(arguments,{},$fh.__dest__.audio);}
$fh.webview=function(){handleargs(arguments,{},$fh.__dest__.webview);}
$fh.ready=function(){handleargs(arguments,{},$fh.__dest__.ready);};$fh.handlers=function(){handleargs(arguments,{type:'back'},$fh.__dest__.handlers);};$fh.file=function(){handleargs(arguments,{act:'upload'},$fh.__dest__.file);};$fh.push=function(){handleargs(arguments,{},$fh.__dest__.push);};$fh.env=function(){handleargs(arguments,{},function(p,s,f){$fh.__dest__.env({},function(destEnv){destEnv.application=$fh.app_props.appid;destEnv.agent=navigator.userAgent||'unknown';s(destEnv);});});}
$fh.device=function(){handleargs(arguments,{},function(p,s,f){});}
$fh.geoip=function(){handleargs(arguments,{act:'get'},function(p,s,f){if('get'==p.act){var data={instance:$fh.app_props.appid,domain:$fh.cloud_props.domain}
$fh.__ajax({"url":$fh._getHostPrefix()+"act/wid/geoip/resolve","type":"POST","data":JSON.stringify(data),"success":function(res){for(var n in res.geoip){res[n]=res['geoip'][n];}
s(res);}});}else{f('geoip_badact',p);}});};$fh.web=function(p,s,f){handleargs(arguments,{method:'GET'},function(p,s,f){if(!p.url){f('bad_url');}
if(p.is_local){$fh.__ajax({url:p.url,type:"GET",dataType:"html",success:function(data){var res={};res.status=200;res.body=data;s(res);},error:function(){f();}})}else{$fh.__ajax({"url":$fh._getHostPrefix()+"act/wid/web","type":"POST","data":JSON.stringify(p),"success":function(res){s(res);}});}});};$fh.prefs=function(){handleargs(arguments,{act:'load'},function(p,s,f){f("prefs_deprecated");});};})();;(function(){$fh.legacy=$fh.legacy||{};$fh.legacy.destinationName=fh_destination_code;$fh.__XMLHttpRequest__=window.ActiveXObject?ActiveXObject:XMLHttpRequest;$fh.__useActiveXObject=window.ActiveXObject?true:false;$fh.xhr=function(){if($fh.__useActiveXObject){return new $fh.__XMLHttpRequest__("Microsoft.XMLHTTP");}else{return new $fh.__XMLHttpRequest__();}}
$fh.ent=function(path,req,success){var args=[path,req,success];if(path&&'string'==typeof(path)){args=[{path:path,req:req},success];}
handleargs(args,{act:'list'},function(p,s,f){if(console){console.log("$fh.ent has been deprecated");}
f("ent_deprecated");});};$fh.legacy.ent=$fh.ent;$fh.legacy.getAssetFiles=function(src){if(console){console.log("$fh.legacy.getAssetFiles has been deprecated");}
return null;};$fh.legacy.makeStaticUrl=function(path){return'/static/a/'+fh_config.appid+'/'+fh_destination_code+'/'+fh_app_version+'/'+path;};$fh.makeStaticUrl=$fh.legacy.makeStaticUrl;$fh.legacy.debug=function(val){if(console){console.log("$fh.legacy.debug has been deprecated");}};$fh.legacy.parseDate=function(date){if(console){console.log("$fh.legacy.parseDate has been deprecated");}};$fh.legacy.showHeader=function(show){if(console){console.log("$fh.legacy.showHeader has been deprecated");}};$fh.legacy.showFooter=function(show){if(console){console.log("$fh.legacy.showFooter has been deprecated");}};$fh.legacy.loadPrefs=function(callback){if(console){console.log("$fh.legacy.loadPrefs has been deprecated");}
callback({});};$fh.legacy.getPrefs=function(){if(console){console.log("$fh.legacy.getPrefs has been deprecated");}
return{};};$fh.legacy.getFullPrefs=function(callback){if(console){console.log("$fh.legacy.getFullPrefs has been deprecated");}
callback({});};$fh.legacy.savePrefs=function(prefs,callback){if(console){console.log("$fh.legacy.savePrefs has been deprecated");}
callback({});};})();;(function(){$fh.__webview_win=undefined;$fh.__dest__.webview=function(p,s,f){if(!('act'in p)||p.act==='open'){if(!p.url){f('no_url');return;}
var old_url=p.url;$fh.__webview_win=window.open(p.url,'_blank');s("opened");}else{if(p.act==='close'){if(typeof $fh.__webview_win!='undefined'){$fh.__webview_win.close();$fh.__webview_win=undefined;}
s("closed");}}};$fh.__dest__.geo=function(p,s,f){if(typeof navigator.geolocation!='undefined'){if(!p.act||p.act=="register"){if($fh.__dest__._geoWatcher){f('geo_inuse',{},p);return;}
if(p.interval==0){navigator.geolocation.getCurrentPosition(function(position){var coords=position.coords;var resdata={lon:coords.longitude,lat:coords.latitude,alt:coords.altitude,acc:coords.accuracy,head:coords.heading,speed:coords.speed,when:position.timestamp};s(resdata);},function(){f('error_geo',{},p);})};if(p.interval>0){var internalWatcher=navigator.geolocation.watchPosition(function(position){var coords=position.coords;var resdata={lon:coords.longitude,lat:coords.latitude,alt:coords.altitude,acc:coords.accuracy,head:coords.heading,speed:coords.speed,when:position.timestamp};s(resdata);},function(){f('error_geo',{},p);},{frequency:p.interval});$fh.__dest__._geoWatcher=internalWatcher;};}else if(p.act=="unregister"){if($fh.__dest__._geoWatcher){navigator.geolocation.clearWatch($fh.__dest__._geoWatcher);$fh.__dest__._geoWatcher=undefined;};s();}else{f('geo_badact',{},p);}}else{f('geo_nosupport',{},p);}};$fh.__dest__.acc=function(p,s,f){s({x:(Math.random()*4)-2,y:(Math.random()*4)-2,z:(Math.random()*4)-2,when:new Date().getTime()});}
$fh.__setPathPrefix=function(data){$fh.legacy.pathprefix=$fh.legacy.boxprefix;}})();