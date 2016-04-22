/*!
 * JavaScript Cookie v2.1.1
 * https://github.com/js-cookie/js-cookie
 *
 * Copyright 2006, 2015 Klaus Hartl & Fagner Brack
 * Released under the MIT license
 */
;(function (factory) {
	// js 파일 호출 시 이 익명 함수가 실행됨
	// factory argument에는 아래에 정의되어 있는 또 다른 익명 함수가 할당됨
	// 아래 주석 코드 참조
	/******************* 
		(function(a,b,c) {
		 	alert(a); // 1호출
		 	alert(b); // 2호출
		 	alert(c); // 3호출
		}(1,2,3)); 
	 *******************/
	
	//AMD(RequireJS) 사용 시
	if (typeof define === 'function' && define.amd) {
		define(factory);
	 //CommonJS 사용 시
	} else if (typeof exports === 'object') {
		module.exports = factory();
	} else {
		//모듈화 로직을 사용하지 않는 경우 Window scope에 Cookie 프로퍼티를 등록하여 사용하도록 한다.
		var OldCookies = window.Cookies;
		var api = window.Cookies = factory();
		//noConflict function을 등록 하여 namespace 충돌에 대비한다.
		//noConflict 호출 시 window.Cookies 프로퍼티 값을 기존에 등록되어 있던 값으로 되돌려 주고
		//api를 리턴해 주어 다른 변수에 할당해여 사용 가능하도록 한다.
		api.noConflict = function () {
			//OldCookies 변수는 클로저 방식으로 저장됨
			window.Cookies = OldCookies; 
			return api;
		};
	}
	//이 익명함수가 factory arument에 할당됨
}(function () {
	//전달받은 모든 arguments를 key: value 값으로 변환하여 하나의 object로 모음
	function extend () {
		var i = 0;
		var result = {};
		for (; i < arguments.length; i++) {
			var attributes = arguments[ i ];
			for (var key in attributes) {
				result[key] = attributes[key];
			}
		}
		return result;
	}

	//초기화 함수
	//api.withConvert 로도 호출가능함
	function init (converter) {
		//get, set  모두 api 함수 사용
		function api (key, value, attributes) {
			var result;
			if (typeof document === 'undefined') {
				return;
			}

			// Write

			if (arguments.length > 1) {
				attributes = extend({
					path: '/'
				}, api.defaults, attributes);

				//만료일 설정
				//숫자값일 경우 날짜로 계산하여 처리
				if (typeof attributes.expires === 'number') {
					var expires = new Date();
					expires.setMilliseconds(expires.getMilliseconds() + attributes.expires * 864e+5);
					//846e+5 = 84600000 = 24 * 60 * 60 * 1000
					attributes.expires = expires;
				}

				try {
					result = JSON.stringify(value);
					// value 값이 json 형식인지 확인함
					if (/^[\{\[]/.test(result)) { 
						value = result;
					}
				} catch (e) {}

				//value값 처리
				if (!converter.write) {
					//converter 가 등록되지 않은 경우
					//몇몇 특수문자들을 제외한 모든 문자열을 url encoding 처리함
					//제외 #$&+:<>=/?@[]^`{}|
					value = encodeURIComponent(String(value))
						.replace(/%(23|24|26|2B|3A|3C|3E|3D|2F|3F|40|5B|5D|5E|60|7B|7D|7C)/g, decodeURIComponent);
				} else {
					//converter 가 등록되어 있으면 converter의 write 사용
					value = converter.write(value, key);
				}

				//key 값 처리
				//기본적으로 uri encoding 처리
				key = encodeURIComponent(String(key)); 
				//uri encoding 제외 #$&+^`|
				key = key.replace(/%(23|24|26|2B|5E|60|7C)/g, decodeURIComponent);
				 // 괄호 문자열은 유니코드 형식으로 변환
				key = key.replace(/[\(\)]/g, escape);

				//cookie 저장
				return (document.cookie = [
					key, '=', value,
					attributes.expires && '; expires=' + attributes.expires.toUTCString(), // use expires attribute, max-age is not supported by IE
					attributes.path    && '; path=' + attributes.path,
					attributes.domain  && '; domain=' + attributes.domain,
					attributes.secure ? '; secure' : ''
				].join(''));
				//여러개의 문자열을 하나로 합치는 방법. + 로 여러 문자열과 변수값을 합치는 것이 아니라, 배열로 선언 후 join 처리함 
			}

			// Read

			if (!key) {
				result = {};
			}

			// To prevent the for loop in the first place assign an empty array
			// in case there are no cookies at all. Also prevents odd result when
			// calling "get()"
			
			//document 에 저장된 cookie 정보를 가져옴
			var cookies = document.cookie ? document.cookie.split('; ') : []; 
			var rdecode = /(%[0-9A-Z]{2})+/g;
			var i = 0;

			for (; i < cookies.length; i++) {
				var parts = cookies[i].split('=');
				//name uri decoding (디코딩이 필요한 문자열만 처리)
				var name = parts[0].replace(rdecode, decodeURIComponent); 
				
				//value 값에 "=" 기호가 포함되어 본의아니게 쪼개진 경우 다시 합침
				var cookie = parts.slice(1).join('='); 
				
				//알수 없는 로직
				if (cookie.charAt(0) === '"') { 
					cookie = cookie.slice(1, -1);
				}

				try {
					//converter.read가 존재하는 경우
					//converter.read 호출하고
					//converter.read가 없는 경우 converter도 호출해보고
					//converter도 없는 경우 그냥 decoding 처리
					cookie = converter.read ? 
						converter.read(cookie, name)  
						: converter(cookie, name) ||  
						cookie.replace(rdecode, decodeURIComponent); 

					//getJSON 으로 호출 시 json string으로 변환해줌
					if (this.json) { 
						try {
							cookie = JSON.parse(cookie);
						} catch (e) {}
					}

					if (key === name) {
						result = cookie;
						break;
					}

					//key 값에 매칭되는게 없을 경우 전체 쿠키를 object 형식으로 저장해서 돌려줌
					if (!key) { 
						result[name] = cookie;
					}
				} catch (e) {}
			}

			return result;
		}

		//get, set 모두 api function에서 처리
		api.set = api;
		api.get = function (key) {
           return api(key);
        };  
		//getJSON 호출 시 {json: true} 값을 this 에 넣어서 api 호출함
		api.getJSON = function () {
			return api.apply({
				json: true
			}, [].slice.call(arguments));
			/***
			[].slice.call(arguments)
			-> 빈 배열의 slice function을 빌려와 arguments에 사용하여 배열 형식으로 변환함
			
			arguments는 object이고,
			[].slice.call(arguments)는 Array 임

			arguments instanceof Array
			-> false
			[].slice.call(arguments) instanceof Array
			-> true 
			 ***/
		};
		
		//공용 attributes값을 지정
		//개별 set 실행 시 지정된 attributes값으로 override 됨
		api.defaults = {}; 

		api.remove = function (key, attributes) {
			api(key, '', extend(attributes, {
				expires: -1
			}));
			//expires를 -1로 재설정
		};

		api.withConverter = init;

		return api;
	}

	return init(function () {});
}));
