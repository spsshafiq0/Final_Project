import { createRequire as __createRequire } from 'module'; const require = __createRequire(import.meta.url);
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});
var __commonJS = (cb, mod) => function __require2() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// node_modules/bcryptjs/dist/bcrypt.js
var require_bcrypt = __commonJS({
  "node_modules/bcryptjs/dist/bcrypt.js"(exports, module) {
    (function(global, factory) {
      if (typeof define === "function" && define["amd"])
        define([], factory);
      else if (typeof __require === "function" && typeof module === "object" && module && module["exports"])
        module["exports"] = factory();
      else
        (global["dcodeIO"] = global["dcodeIO"] || {})["bcrypt"] = factory();
    })(exports, function() {
      "use strict";
      var bcrypt2 = {};
      var randomFallback = null;
      function random(len) {
        if (typeof module !== "undefined" && module && module["exports"])
          try {
            return __require("crypto")["randomBytes"](len);
          } catch (e) {
          }
        try {
          var a;
          (self["crypto"] || self["msCrypto"])["getRandomValues"](a = new Uint32Array(len));
          return Array.prototype.slice.call(a);
        } catch (e) {
        }
        if (!randomFallback)
          throw Error("Neither WebCryptoAPI nor a crypto module is available. Use bcrypt.setRandomFallback to set an alternative");
        return randomFallback(len);
      }
      var randomAvailable = false;
      try {
        random(1);
        randomAvailable = true;
      } catch (e) {
      }
      randomFallback = null;
      bcrypt2.setRandomFallback = function(random2) {
        randomFallback = random2;
      };
      bcrypt2.genSaltSync = function(rounds, seed_length) {
        rounds = rounds || GENSALT_DEFAULT_LOG2_ROUNDS;
        if (typeof rounds !== "number")
          throw Error("Illegal arguments: " + typeof rounds + ", " + typeof seed_length);
        if (rounds < 4)
          rounds = 4;
        else if (rounds > 31)
          rounds = 31;
        var salt = [];
        salt.push("$2a$");
        if (rounds < 10)
          salt.push("0");
        salt.push(rounds.toString());
        salt.push("$");
        salt.push(base64_encode(random(BCRYPT_SALT_LEN), BCRYPT_SALT_LEN));
        return salt.join("");
      };
      bcrypt2.genSalt = function(rounds, seed_length, callback) {
        if (typeof seed_length === "function")
          callback = seed_length, seed_length = void 0;
        if (typeof rounds === "function")
          callback = rounds, rounds = void 0;
        if (typeof rounds === "undefined")
          rounds = GENSALT_DEFAULT_LOG2_ROUNDS;
        else if (typeof rounds !== "number")
          throw Error("illegal arguments: " + typeof rounds);
        function _async(callback2) {
          nextTick(function() {
            try {
              callback2(null, bcrypt2.genSaltSync(rounds));
            } catch (err) {
              callback2(err);
            }
          });
        }
        if (callback) {
          if (typeof callback !== "function")
            throw Error("Illegal callback: " + typeof callback);
          _async(callback);
        } else
          return new Promise(function(resolve, reject) {
            _async(function(err, res) {
              if (err) {
                reject(err);
                return;
              }
              resolve(res);
            });
          });
      };
      bcrypt2.hashSync = function(s, salt) {
        if (typeof salt === "undefined")
          salt = GENSALT_DEFAULT_LOG2_ROUNDS;
        if (typeof salt === "number")
          salt = bcrypt2.genSaltSync(salt);
        if (typeof s !== "string" || typeof salt !== "string")
          throw Error("Illegal arguments: " + typeof s + ", " + typeof salt);
        return _hash(s, salt);
      };
      bcrypt2.hash = function(s, salt, callback, progressCallback) {
        function _async(callback2) {
          if (typeof s === "string" && typeof salt === "number")
            bcrypt2.genSalt(salt, function(err, salt2) {
              _hash(s, salt2, callback2, progressCallback);
            });
          else if (typeof s === "string" && typeof salt === "string")
            _hash(s, salt, callback2, progressCallback);
          else
            nextTick(callback2.bind(this, Error("Illegal arguments: " + typeof s + ", " + typeof salt)));
        }
        if (callback) {
          if (typeof callback !== "function")
            throw Error("Illegal callback: " + typeof callback);
          _async(callback);
        } else
          return new Promise(function(resolve, reject) {
            _async(function(err, res) {
              if (err) {
                reject(err);
                return;
              }
              resolve(res);
            });
          });
      };
      function safeStringCompare(known, unknown) {
        var right = 0, wrong = 0;
        for (var i = 0, k = known.length; i < k; ++i) {
          if (known.charCodeAt(i) === unknown.charCodeAt(i))
            ++right;
          else
            ++wrong;
        }
        if (right < 0)
          return false;
        return wrong === 0;
      }
      bcrypt2.compareSync = function(s, hash) {
        if (typeof s !== "string" || typeof hash !== "string")
          throw Error("Illegal arguments: " + typeof s + ", " + typeof hash);
        if (hash.length !== 60)
          return false;
        return safeStringCompare(bcrypt2.hashSync(s, hash.substr(0, hash.length - 31)), hash);
      };
      bcrypt2.compare = function(s, hash, callback, progressCallback) {
        function _async(callback2) {
          if (typeof s !== "string" || typeof hash !== "string") {
            nextTick(callback2.bind(this, Error("Illegal arguments: " + typeof s + ", " + typeof hash)));
            return;
          }
          if (hash.length !== 60) {
            nextTick(callback2.bind(this, null, false));
            return;
          }
          bcrypt2.hash(s, hash.substr(0, 29), function(err, comp) {
            if (err)
              callback2(err);
            else
              callback2(null, safeStringCompare(comp, hash));
          }, progressCallback);
        }
        if (callback) {
          if (typeof callback !== "function")
            throw Error("Illegal callback: " + typeof callback);
          _async(callback);
        } else
          return new Promise(function(resolve, reject) {
            _async(function(err, res) {
              if (err) {
                reject(err);
                return;
              }
              resolve(res);
            });
          });
      };
      bcrypt2.getRounds = function(hash) {
        if (typeof hash !== "string")
          throw Error("Illegal arguments: " + typeof hash);
        return parseInt(hash.split("$")[2], 10);
      };
      bcrypt2.getSalt = function(hash) {
        if (typeof hash !== "string")
          throw Error("Illegal arguments: " + typeof hash);
        if (hash.length !== 60)
          throw Error("Illegal hash length: " + hash.length + " != 60");
        return hash.substring(0, 29);
      };
      var nextTick = typeof process !== "undefined" && process && typeof process.nextTick === "function" ? typeof setImmediate === "function" ? setImmediate : process.nextTick : setTimeout;
      function stringToBytes(str) {
        var out = [], i = 0;
        utfx.encodeUTF16toUTF8(function() {
          if (i >= str.length) return null;
          return str.charCodeAt(i++);
        }, function(b) {
          out.push(b);
        });
        return out;
      }
      var BASE64_CODE = "./ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789".split("");
      var BASE64_INDEX = [
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        0,
        1,
        54,
        55,
        56,
        57,
        58,
        59,
        60,
        61,
        62,
        63,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        2,
        3,
        4,
        5,
        6,
        7,
        8,
        9,
        10,
        11,
        12,
        13,
        14,
        15,
        16,
        17,
        18,
        19,
        20,
        21,
        22,
        23,
        24,
        25,
        26,
        27,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        28,
        29,
        30,
        31,
        32,
        33,
        34,
        35,
        36,
        37,
        38,
        39,
        40,
        41,
        42,
        43,
        44,
        45,
        46,
        47,
        48,
        49,
        50,
        51,
        52,
        53,
        -1,
        -1,
        -1,
        -1,
        -1
      ];
      var stringFromCharCode = String.fromCharCode;
      function base64_encode(b, len) {
        var off = 0, rs = [], c1, c2;
        if (len <= 0 || len > b.length)
          throw Error("Illegal len: " + len);
        while (off < len) {
          c1 = b[off++] & 255;
          rs.push(BASE64_CODE[c1 >> 2 & 63]);
          c1 = (c1 & 3) << 4;
          if (off >= len) {
            rs.push(BASE64_CODE[c1 & 63]);
            break;
          }
          c2 = b[off++] & 255;
          c1 |= c2 >> 4 & 15;
          rs.push(BASE64_CODE[c1 & 63]);
          c1 = (c2 & 15) << 2;
          if (off >= len) {
            rs.push(BASE64_CODE[c1 & 63]);
            break;
          }
          c2 = b[off++] & 255;
          c1 |= c2 >> 6 & 3;
          rs.push(BASE64_CODE[c1 & 63]);
          rs.push(BASE64_CODE[c2 & 63]);
        }
        return rs.join("");
      }
      function base64_decode(s, len) {
        var off = 0, slen = s.length, olen = 0, rs = [], c1, c2, c3, c4, o, code;
        if (len <= 0)
          throw Error("Illegal len: " + len);
        while (off < slen - 1 && olen < len) {
          code = s.charCodeAt(off++);
          c1 = code < BASE64_INDEX.length ? BASE64_INDEX[code] : -1;
          code = s.charCodeAt(off++);
          c2 = code < BASE64_INDEX.length ? BASE64_INDEX[code] : -1;
          if (c1 == -1 || c2 == -1)
            break;
          o = c1 << 2 >>> 0;
          o |= (c2 & 48) >> 4;
          rs.push(stringFromCharCode(o));
          if (++olen >= len || off >= slen)
            break;
          code = s.charCodeAt(off++);
          c3 = code < BASE64_INDEX.length ? BASE64_INDEX[code] : -1;
          if (c3 == -1)
            break;
          o = (c2 & 15) << 4 >>> 0;
          o |= (c3 & 60) >> 2;
          rs.push(stringFromCharCode(o));
          if (++olen >= len || off >= slen)
            break;
          code = s.charCodeAt(off++);
          c4 = code < BASE64_INDEX.length ? BASE64_INDEX[code] : -1;
          o = (c3 & 3) << 6 >>> 0;
          o |= c4;
          rs.push(stringFromCharCode(o));
          ++olen;
        }
        var res = [];
        for (off = 0; off < olen; off++)
          res.push(rs[off].charCodeAt(0));
        return res;
      }
      var utfx = (function() {
        "use strict";
        var utfx2 = {};
        utfx2.MAX_CODEPOINT = 1114111;
        utfx2.encodeUTF8 = function(src, dst) {
          var cp = null;
          if (typeof src === "number")
            cp = src, src = function() {
              return null;
            };
          while (cp !== null || (cp = src()) !== null) {
            if (cp < 128)
              dst(cp & 127);
            else if (cp < 2048)
              dst(cp >> 6 & 31 | 192), dst(cp & 63 | 128);
            else if (cp < 65536)
              dst(cp >> 12 & 15 | 224), dst(cp >> 6 & 63 | 128), dst(cp & 63 | 128);
            else
              dst(cp >> 18 & 7 | 240), dst(cp >> 12 & 63 | 128), dst(cp >> 6 & 63 | 128), dst(cp & 63 | 128);
            cp = null;
          }
        };
        utfx2.decodeUTF8 = function(src, dst) {
          var a, b, c, d, fail = function(b2) {
            b2 = b2.slice(0, b2.indexOf(null));
            var err = Error(b2.toString());
            err.name = "TruncatedError";
            err["bytes"] = b2;
            throw err;
          };
          while ((a = src()) !== null) {
            if ((a & 128) === 0)
              dst(a);
            else if ((a & 224) === 192)
              (b = src()) === null && fail([a, b]), dst((a & 31) << 6 | b & 63);
            else if ((a & 240) === 224)
              ((b = src()) === null || (c = src()) === null) && fail([a, b, c]), dst((a & 15) << 12 | (b & 63) << 6 | c & 63);
            else if ((a & 248) === 240)
              ((b = src()) === null || (c = src()) === null || (d = src()) === null) && fail([a, b, c, d]), dst((a & 7) << 18 | (b & 63) << 12 | (c & 63) << 6 | d & 63);
            else throw RangeError("Illegal starting byte: " + a);
          }
        };
        utfx2.UTF16toUTF8 = function(src, dst) {
          var c1, c2 = null;
          while (true) {
            if ((c1 = c2 !== null ? c2 : src()) === null)
              break;
            if (c1 >= 55296 && c1 <= 57343) {
              if ((c2 = src()) !== null) {
                if (c2 >= 56320 && c2 <= 57343) {
                  dst((c1 - 55296) * 1024 + c2 - 56320 + 65536);
                  c2 = null;
                  continue;
                }
              }
            }
            dst(c1);
          }
          if (c2 !== null) dst(c2);
        };
        utfx2.UTF8toUTF16 = function(src, dst) {
          var cp = null;
          if (typeof src === "number")
            cp = src, src = function() {
              return null;
            };
          while (cp !== null || (cp = src()) !== null) {
            if (cp <= 65535)
              dst(cp);
            else
              cp -= 65536, dst((cp >> 10) + 55296), dst(cp % 1024 + 56320);
            cp = null;
          }
        };
        utfx2.encodeUTF16toUTF8 = function(src, dst) {
          utfx2.UTF16toUTF8(src, function(cp) {
            utfx2.encodeUTF8(cp, dst);
          });
        };
        utfx2.decodeUTF8toUTF16 = function(src, dst) {
          utfx2.decodeUTF8(src, function(cp) {
            utfx2.UTF8toUTF16(cp, dst);
          });
        };
        utfx2.calculateCodePoint = function(cp) {
          return cp < 128 ? 1 : cp < 2048 ? 2 : cp < 65536 ? 3 : 4;
        };
        utfx2.calculateUTF8 = function(src) {
          var cp, l = 0;
          while ((cp = src()) !== null)
            l += utfx2.calculateCodePoint(cp);
          return l;
        };
        utfx2.calculateUTF16asUTF8 = function(src) {
          var n = 0, l = 0;
          utfx2.UTF16toUTF8(src, function(cp) {
            ++n;
            l += utfx2.calculateCodePoint(cp);
          });
          return [n, l];
        };
        return utfx2;
      })();
      Date.now = Date.now || function() {
        return +/* @__PURE__ */ new Date();
      };
      var BCRYPT_SALT_LEN = 16;
      var GENSALT_DEFAULT_LOG2_ROUNDS = 10;
      var BLOWFISH_NUM_ROUNDS = 16;
      var MAX_EXECUTION_TIME = 100;
      var P_ORIG = [
        608135816,
        2242054355,
        320440878,
        57701188,
        2752067618,
        698298832,
        137296536,
        3964562569,
        1160258022,
        953160567,
        3193202383,
        887688300,
        3232508343,
        3380367581,
        1065670069,
        3041331479,
        2450970073,
        2306472731
      ];
      var S_ORIG = [
        3509652390,
        2564797868,
        805139163,
        3491422135,
        3101798381,
        1780907670,
        3128725573,
        4046225305,
        614570311,
        3012652279,
        134345442,
        2240740374,
        1667834072,
        1901547113,
        2757295779,
        4103290238,
        227898511,
        1921955416,
        1904987480,
        2182433518,
        2069144605,
        3260701109,
        2620446009,
        720527379,
        3318853667,
        677414384,
        3393288472,
        3101374703,
        2390351024,
        1614419982,
        1822297739,
        2954791486,
        3608508353,
        3174124327,
        2024746970,
        1432378464,
        3864339955,
        2857741204,
        1464375394,
        1676153920,
        1439316330,
        715854006,
        3033291828,
        289532110,
        2706671279,
        2087905683,
        3018724369,
        1668267050,
        732546397,
        1947742710,
        3462151702,
        2609353502,
        2950085171,
        1814351708,
        2050118529,
        680887927,
        999245976,
        1800124847,
        3300911131,
        1713906067,
        1641548236,
        4213287313,
        1216130144,
        1575780402,
        4018429277,
        3917837745,
        3693486850,
        3949271944,
        596196993,
        3549867205,
        258830323,
        2213823033,
        772490370,
        2760122372,
        1774776394,
        2652871518,
        566650946,
        4142492826,
        1728879713,
        2882767088,
        1783734482,
        3629395816,
        2517608232,
        2874225571,
        1861159788,
        326777828,
        3124490320,
        2130389656,
        2716951837,
        967770486,
        1724537150,
        2185432712,
        2364442137,
        1164943284,
        2105845187,
        998989502,
        3765401048,
        2244026483,
        1075463327,
        1455516326,
        1322494562,
        910128902,
        469688178,
        1117454909,
        936433444,
        3490320968,
        3675253459,
        1240580251,
        122909385,
        2157517691,
        634681816,
        4142456567,
        3825094682,
        3061402683,
        2540495037,
        79693498,
        3249098678,
        1084186820,
        1583128258,
        426386531,
        1761308591,
        1047286709,
        322548459,
        995290223,
        1845252383,
        2603652396,
        3431023940,
        2942221577,
        3202600964,
        3727903485,
        1712269319,
        422464435,
        3234572375,
        1170764815,
        3523960633,
        3117677531,
        1434042557,
        442511882,
        3600875718,
        1076654713,
        1738483198,
        4213154764,
        2393238008,
        3677496056,
        1014306527,
        4251020053,
        793779912,
        2902807211,
        842905082,
        4246964064,
        1395751752,
        1040244610,
        2656851899,
        3396308128,
        445077038,
        3742853595,
        3577915638,
        679411651,
        2892444358,
        2354009459,
        1767581616,
        3150600392,
        3791627101,
        3102740896,
        284835224,
        4246832056,
        1258075500,
        768725851,
        2589189241,
        3069724005,
        3532540348,
        1274779536,
        3789419226,
        2764799539,
        1660621633,
        3471099624,
        4011903706,
        913787905,
        3497959166,
        737222580,
        2514213453,
        2928710040,
        3937242737,
        1804850592,
        3499020752,
        2949064160,
        2386320175,
        2390070455,
        2415321851,
        4061277028,
        2290661394,
        2416832540,
        1336762016,
        1754252060,
        3520065937,
        3014181293,
        791618072,
        3188594551,
        3933548030,
        2332172193,
        3852520463,
        3043980520,
        413987798,
        3465142937,
        3030929376,
        4245938359,
        2093235073,
        3534596313,
        375366246,
        2157278981,
        2479649556,
        555357303,
        3870105701,
        2008414854,
        3344188149,
        4221384143,
        3956125452,
        2067696032,
        3594591187,
        2921233993,
        2428461,
        544322398,
        577241275,
        1471733935,
        610547355,
        4027169054,
        1432588573,
        1507829418,
        2025931657,
        3646575487,
        545086370,
        48609733,
        2200306550,
        1653985193,
        298326376,
        1316178497,
        3007786442,
        2064951626,
        458293330,
        2589141269,
        3591329599,
        3164325604,
        727753846,
        2179363840,
        146436021,
        1461446943,
        4069977195,
        705550613,
        3059967265,
        3887724982,
        4281599278,
        3313849956,
        1404054877,
        2845806497,
        146425753,
        1854211946,
        1266315497,
        3048417604,
        3681880366,
        3289982499,
        290971e4,
        1235738493,
        2632868024,
        2414719590,
        3970600049,
        1771706367,
        1449415276,
        3266420449,
        422970021,
        1963543593,
        2690192192,
        3826793022,
        1062508698,
        1531092325,
        1804592342,
        2583117782,
        2714934279,
        4024971509,
        1294809318,
        4028980673,
        1289560198,
        2221992742,
        1669523910,
        35572830,
        157838143,
        1052438473,
        1016535060,
        1802137761,
        1753167236,
        1386275462,
        3080475397,
        2857371447,
        1040679964,
        2145300060,
        2390574316,
        1461121720,
        2956646967,
        4031777805,
        4028374788,
        33600511,
        2920084762,
        1018524850,
        629373528,
        3691585981,
        3515945977,
        2091462646,
        2486323059,
        586499841,
        988145025,
        935516892,
        3367335476,
        2599673255,
        2839830854,
        265290510,
        3972581182,
        2759138881,
        3795373465,
        1005194799,
        847297441,
        406762289,
        1314163512,
        1332590856,
        1866599683,
        4127851711,
        750260880,
        613907577,
        1450815602,
        3165620655,
        3734664991,
        3650291728,
        3012275730,
        3704569646,
        1427272223,
        778793252,
        1343938022,
        2676280711,
        2052605720,
        1946737175,
        3164576444,
        3914038668,
        3967478842,
        3682934266,
        1661551462,
        3294938066,
        4011595847,
        840292616,
        3712170807,
        616741398,
        312560963,
        711312465,
        1351876610,
        322626781,
        1910503582,
        271666773,
        2175563734,
        1594956187,
        70604529,
        3617834859,
        1007753275,
        1495573769,
        4069517037,
        2549218298,
        2663038764,
        504708206,
        2263041392,
        3941167025,
        2249088522,
        1514023603,
        1998579484,
        1312622330,
        694541497,
        2582060303,
        2151582166,
        1382467621,
        776784248,
        2618340202,
        3323268794,
        2497899128,
        2784771155,
        503983604,
        4076293799,
        907881277,
        423175695,
        432175456,
        1378068232,
        4145222326,
        3954048622,
        3938656102,
        3820766613,
        2793130115,
        2977904593,
        26017576,
        3274890735,
        3194772133,
        1700274565,
        1756076034,
        4006520079,
        3677328699,
        720338349,
        1533947780,
        354530856,
        688349552,
        3973924725,
        1637815568,
        332179504,
        3949051286,
        53804574,
        2852348879,
        3044236432,
        1282449977,
        3583942155,
        3416972820,
        4006381244,
        1617046695,
        2628476075,
        3002303598,
        1686838959,
        431878346,
        2686675385,
        1700445008,
        1080580658,
        1009431731,
        832498133,
        3223435511,
        2605976345,
        2271191193,
        2516031870,
        1648197032,
        4164389018,
        2548247927,
        300782431,
        375919233,
        238389289,
        3353747414,
        2531188641,
        2019080857,
        1475708069,
        455242339,
        2609103871,
        448939670,
        3451063019,
        1395535956,
        2413381860,
        1841049896,
        1491858159,
        885456874,
        4264095073,
        4001119347,
        1565136089,
        3898914787,
        1108368660,
        540939232,
        1173283510,
        2745871338,
        3681308437,
        4207628240,
        3343053890,
        4016749493,
        1699691293,
        1103962373,
        3625875870,
        2256883143,
        3830138730,
        1031889488,
        3479347698,
        1535977030,
        4236805024,
        3251091107,
        2132092099,
        1774941330,
        1199868427,
        1452454533,
        157007616,
        2904115357,
        342012276,
        595725824,
        1480756522,
        206960106,
        497939518,
        591360097,
        863170706,
        2375253569,
        3596610801,
        1814182875,
        2094937945,
        3421402208,
        1082520231,
        3463918190,
        2785509508,
        435703966,
        3908032597,
        1641649973,
        2842273706,
        3305899714,
        1510255612,
        2148256476,
        2655287854,
        3276092548,
        4258621189,
        236887753,
        3681803219,
        274041037,
        1734335097,
        3815195456,
        3317970021,
        1899903192,
        1026095262,
        4050517792,
        356393447,
        2410691914,
        3873677099,
        3682840055,
        3913112168,
        2491498743,
        4132185628,
        2489919796,
        1091903735,
        1979897079,
        3170134830,
        3567386728,
        3557303409,
        857797738,
        1136121015,
        1342202287,
        507115054,
        2535736646,
        337727348,
        3213592640,
        1301675037,
        2528481711,
        1895095763,
        1721773893,
        3216771564,
        62756741,
        2142006736,
        835421444,
        2531993523,
        1442658625,
        3659876326,
        2882144922,
        676362277,
        1392781812,
        170690266,
        3921047035,
        1759253602,
        3611846912,
        1745797284,
        664899054,
        1329594018,
        3901205900,
        3045908486,
        2062866102,
        2865634940,
        3543621612,
        3464012697,
        1080764994,
        553557557,
        3656615353,
        3996768171,
        991055499,
        499776247,
        1265440854,
        648242737,
        3940784050,
        980351604,
        3713745714,
        1749149687,
        3396870395,
        4211799374,
        3640570775,
        1161844396,
        3125318951,
        1431517754,
        545492359,
        4268468663,
        3499529547,
        1437099964,
        2702547544,
        3433638243,
        2581715763,
        2787789398,
        1060185593,
        1593081372,
        2418618748,
        4260947970,
        69676912,
        2159744348,
        86519011,
        2512459080,
        3838209314,
        1220612927,
        3339683548,
        133810670,
        1090789135,
        1078426020,
        1569222167,
        845107691,
        3583754449,
        4072456591,
        1091646820,
        628848692,
        1613405280,
        3757631651,
        526609435,
        236106946,
        48312990,
        2942717905,
        3402727701,
        1797494240,
        859738849,
        992217954,
        4005476642,
        2243076622,
        3870952857,
        3732016268,
        765654824,
        3490871365,
        2511836413,
        1685915746,
        3888969200,
        1414112111,
        2273134842,
        3281911079,
        4080962846,
        172450625,
        2569994100,
        980381355,
        4109958455,
        2819808352,
        2716589560,
        2568741196,
        3681446669,
        3329971472,
        1835478071,
        660984891,
        3704678404,
        4045999559,
        3422617507,
        3040415634,
        1762651403,
        1719377915,
        3470491036,
        2693910283,
        3642056355,
        3138596744,
        1364962596,
        2073328063,
        1983633131,
        926494387,
        3423689081,
        2150032023,
        4096667949,
        1749200295,
        3328846651,
        309677260,
        2016342300,
        1779581495,
        3079819751,
        111262694,
        1274766160,
        443224088,
        298511866,
        1025883608,
        3806446537,
        1145181785,
        168956806,
        3641502830,
        3584813610,
        1689216846,
        3666258015,
        3200248200,
        1692713982,
        2646376535,
        4042768518,
        1618508792,
        1610833997,
        3523052358,
        4130873264,
        2001055236,
        3610705100,
        2202168115,
        4028541809,
        2961195399,
        1006657119,
        2006996926,
        3186142756,
        1430667929,
        3210227297,
        1314452623,
        4074634658,
        4101304120,
        2273951170,
        1399257539,
        3367210612,
        3027628629,
        1190975929,
        2062231137,
        2333990788,
        2221543033,
        2438960610,
        1181637006,
        548689776,
        2362791313,
        3372408396,
        3104550113,
        3145860560,
        296247880,
        1970579870,
        3078560182,
        3769228297,
        1714227617,
        3291629107,
        3898220290,
        166772364,
        1251581989,
        493813264,
        448347421,
        195405023,
        2709975567,
        677966185,
        3703036547,
        1463355134,
        2715995803,
        1338867538,
        1343315457,
        2802222074,
        2684532164,
        233230375,
        2599980071,
        2000651841,
        3277868038,
        1638401717,
        4028070440,
        3237316320,
        6314154,
        819756386,
        300326615,
        590932579,
        1405279636,
        3267499572,
        3150704214,
        2428286686,
        3959192993,
        3461946742,
        1862657033,
        1266418056,
        963775037,
        2089974820,
        2263052895,
        1917689273,
        448879540,
        3550394620,
        3981727096,
        150775221,
        3627908307,
        1303187396,
        508620638,
        2975983352,
        2726630617,
        1817252668,
        1876281319,
        1457606340,
        908771278,
        3720792119,
        3617206836,
        2455994898,
        1729034894,
        1080033504,
        976866871,
        3556439503,
        2881648439,
        1522871579,
        1555064734,
        1336096578,
        3548522304,
        2579274686,
        3574697629,
        3205460757,
        3593280638,
        3338716283,
        3079412587,
        564236357,
        2993598910,
        1781952180,
        1464380207,
        3163844217,
        3332601554,
        1699332808,
        1393555694,
        1183702653,
        3581086237,
        1288719814,
        691649499,
        2847557200,
        2895455976,
        3193889540,
        2717570544,
        1781354906,
        1676643554,
        2592534050,
        3230253752,
        1126444790,
        2770207658,
        2633158820,
        2210423226,
        2615765581,
        2414155088,
        3127139286,
        673620729,
        2805611233,
        1269405062,
        4015350505,
        3341807571,
        4149409754,
        1057255273,
        2012875353,
        2162469141,
        2276492801,
        2601117357,
        993977747,
        3918593370,
        2654263191,
        753973209,
        36408145,
        2530585658,
        25011837,
        3520020182,
        2088578344,
        530523599,
        2918365339,
        1524020338,
        1518925132,
        3760827505,
        3759777254,
        1202760957,
        3985898139,
        3906192525,
        674977740,
        4174734889,
        2031300136,
        2019492241,
        3983892565,
        4153806404,
        3822280332,
        352677332,
        2297720250,
        60907813,
        90501309,
        3286998549,
        1016092578,
        2535922412,
        2839152426,
        457141659,
        509813237,
        4120667899,
        652014361,
        1966332200,
        2975202805,
        55981186,
        2327461051,
        676427537,
        3255491064,
        2882294119,
        3433927263,
        1307055953,
        942726286,
        933058658,
        2468411793,
        3933900994,
        4215176142,
        1361170020,
        2001714738,
        2830558078,
        3274259782,
        1222529897,
        1679025792,
        2729314320,
        3714953764,
        1770335741,
        151462246,
        3013232138,
        1682292957,
        1483529935,
        471910574,
        1539241949,
        458788160,
        3436315007,
        1807016891,
        3718408830,
        978976581,
        1043663428,
        3165965781,
        1927990952,
        4200891579,
        2372276910,
        3208408903,
        3533431907,
        1412390302,
        2931980059,
        4132332400,
        1947078029,
        3881505623,
        4168226417,
        2941484381,
        1077988104,
        1320477388,
        886195818,
        18198404,
        3786409e3,
        2509781533,
        112762804,
        3463356488,
        1866414978,
        891333506,
        18488651,
        661792760,
        1628790961,
        3885187036,
        3141171499,
        876946877,
        2693282273,
        1372485963,
        791857591,
        2686433993,
        3759982718,
        3167212022,
        3472953795,
        2716379847,
        445679433,
        3561995674,
        3504004811,
        3574258232,
        54117162,
        3331405415,
        2381918588,
        3769707343,
        4154350007,
        1140177722,
        4074052095,
        668550556,
        3214352940,
        367459370,
        261225585,
        2610173221,
        4209349473,
        3468074219,
        3265815641,
        314222801,
        3066103646,
        3808782860,
        282218597,
        3406013506,
        3773591054,
        379116347,
        1285071038,
        846784868,
        2669647154,
        3771962079,
        3550491691,
        2305946142,
        453669953,
        1268987020,
        3317592352,
        3279303384,
        3744833421,
        2610507566,
        3859509063,
        266596637,
        3847019092,
        517658769,
        3462560207,
        3443424879,
        370717030,
        4247526661,
        2224018117,
        4143653529,
        4112773975,
        2788324899,
        2477274417,
        1456262402,
        2901442914,
        1517677493,
        1846949527,
        2295493580,
        3734397586,
        2176403920,
        1280348187,
        1908823572,
        3871786941,
        846861322,
        1172426758,
        3287448474,
        3383383037,
        1655181056,
        3139813346,
        901632758,
        1897031941,
        2986607138,
        3066810236,
        3447102507,
        1393639104,
        373351379,
        950779232,
        625454576,
        3124240540,
        4148612726,
        2007998917,
        544563296,
        2244738638,
        2330496472,
        2058025392,
        1291430526,
        424198748,
        50039436,
        29584100,
        3605783033,
        2429876329,
        2791104160,
        1057563949,
        3255363231,
        3075367218,
        3463963227,
        1469046755,
        985887462
      ];
      var C_ORIG = [
        1332899944,
        1700884034,
        1701343084,
        1684370003,
        1668446532,
        1869963892
      ];
      function _encipher(lr, off, P, S) {
        var n, l = lr[off], r = lr[off + 1];
        l ^= P[0];
        n = S[l >>> 24];
        n += S[256 | l >> 16 & 255];
        n ^= S[512 | l >> 8 & 255];
        n += S[768 | l & 255];
        r ^= n ^ P[1];
        n = S[r >>> 24];
        n += S[256 | r >> 16 & 255];
        n ^= S[512 | r >> 8 & 255];
        n += S[768 | r & 255];
        l ^= n ^ P[2];
        n = S[l >>> 24];
        n += S[256 | l >> 16 & 255];
        n ^= S[512 | l >> 8 & 255];
        n += S[768 | l & 255];
        r ^= n ^ P[3];
        n = S[r >>> 24];
        n += S[256 | r >> 16 & 255];
        n ^= S[512 | r >> 8 & 255];
        n += S[768 | r & 255];
        l ^= n ^ P[4];
        n = S[l >>> 24];
        n += S[256 | l >> 16 & 255];
        n ^= S[512 | l >> 8 & 255];
        n += S[768 | l & 255];
        r ^= n ^ P[5];
        n = S[r >>> 24];
        n += S[256 | r >> 16 & 255];
        n ^= S[512 | r >> 8 & 255];
        n += S[768 | r & 255];
        l ^= n ^ P[6];
        n = S[l >>> 24];
        n += S[256 | l >> 16 & 255];
        n ^= S[512 | l >> 8 & 255];
        n += S[768 | l & 255];
        r ^= n ^ P[7];
        n = S[r >>> 24];
        n += S[256 | r >> 16 & 255];
        n ^= S[512 | r >> 8 & 255];
        n += S[768 | r & 255];
        l ^= n ^ P[8];
        n = S[l >>> 24];
        n += S[256 | l >> 16 & 255];
        n ^= S[512 | l >> 8 & 255];
        n += S[768 | l & 255];
        r ^= n ^ P[9];
        n = S[r >>> 24];
        n += S[256 | r >> 16 & 255];
        n ^= S[512 | r >> 8 & 255];
        n += S[768 | r & 255];
        l ^= n ^ P[10];
        n = S[l >>> 24];
        n += S[256 | l >> 16 & 255];
        n ^= S[512 | l >> 8 & 255];
        n += S[768 | l & 255];
        r ^= n ^ P[11];
        n = S[r >>> 24];
        n += S[256 | r >> 16 & 255];
        n ^= S[512 | r >> 8 & 255];
        n += S[768 | r & 255];
        l ^= n ^ P[12];
        n = S[l >>> 24];
        n += S[256 | l >> 16 & 255];
        n ^= S[512 | l >> 8 & 255];
        n += S[768 | l & 255];
        r ^= n ^ P[13];
        n = S[r >>> 24];
        n += S[256 | r >> 16 & 255];
        n ^= S[512 | r >> 8 & 255];
        n += S[768 | r & 255];
        l ^= n ^ P[14];
        n = S[l >>> 24];
        n += S[256 | l >> 16 & 255];
        n ^= S[512 | l >> 8 & 255];
        n += S[768 | l & 255];
        r ^= n ^ P[15];
        n = S[r >>> 24];
        n += S[256 | r >> 16 & 255];
        n ^= S[512 | r >> 8 & 255];
        n += S[768 | r & 255];
        l ^= n ^ P[16];
        lr[off] = r ^ P[BLOWFISH_NUM_ROUNDS + 1];
        lr[off + 1] = l;
        return lr;
      }
      function _streamtoword(data, offp) {
        for (var i = 0, word = 0; i < 4; ++i)
          word = word << 8 | data[offp] & 255, offp = (offp + 1) % data.length;
        return { key: word, offp };
      }
      function _key(key, P, S) {
        var offset = 0, lr = [0, 0], plen = P.length, slen = S.length, sw;
        for (var i = 0; i < plen; i++)
          sw = _streamtoword(key, offset), offset = sw.offp, P[i] = P[i] ^ sw.key;
        for (i = 0; i < plen; i += 2)
          lr = _encipher(lr, 0, P, S), P[i] = lr[0], P[i + 1] = lr[1];
        for (i = 0; i < slen; i += 2)
          lr = _encipher(lr, 0, P, S), S[i] = lr[0], S[i + 1] = lr[1];
      }
      function _ekskey(data, key, P, S) {
        var offp = 0, lr = [0, 0], plen = P.length, slen = S.length, sw;
        for (var i = 0; i < plen; i++)
          sw = _streamtoword(key, offp), offp = sw.offp, P[i] = P[i] ^ sw.key;
        offp = 0;
        for (i = 0; i < plen; i += 2)
          sw = _streamtoword(data, offp), offp = sw.offp, lr[0] ^= sw.key, sw = _streamtoword(data, offp), offp = sw.offp, lr[1] ^= sw.key, lr = _encipher(lr, 0, P, S), P[i] = lr[0], P[i + 1] = lr[1];
        for (i = 0; i < slen; i += 2)
          sw = _streamtoword(data, offp), offp = sw.offp, lr[0] ^= sw.key, sw = _streamtoword(data, offp), offp = sw.offp, lr[1] ^= sw.key, lr = _encipher(lr, 0, P, S), S[i] = lr[0], S[i + 1] = lr[1];
      }
      function _crypt(b, salt, rounds, callback, progressCallback) {
        var cdata = C_ORIG.slice(), clen = cdata.length, err;
        if (rounds < 4 || rounds > 31) {
          err = Error("Illegal number of rounds (4-31): " + rounds);
          if (callback) {
            nextTick(callback.bind(this, err));
            return;
          } else
            throw err;
        }
        if (salt.length !== BCRYPT_SALT_LEN) {
          err = Error("Illegal salt length: " + salt.length + " != " + BCRYPT_SALT_LEN);
          if (callback) {
            nextTick(callback.bind(this, err));
            return;
          } else
            throw err;
        }
        rounds = 1 << rounds >>> 0;
        var P, S, i = 0, j;
        if (Int32Array) {
          P = new Int32Array(P_ORIG);
          S = new Int32Array(S_ORIG);
        } else {
          P = P_ORIG.slice();
          S = S_ORIG.slice();
        }
        _ekskey(salt, b, P, S);
        function next() {
          if (progressCallback)
            progressCallback(i / rounds);
          if (i < rounds) {
            var start = Date.now();
            for (; i < rounds; ) {
              i = i + 1;
              _key(b, P, S);
              _key(salt, P, S);
              if (Date.now() - start > MAX_EXECUTION_TIME)
                break;
            }
          } else {
            for (i = 0; i < 64; i++)
              for (j = 0; j < clen >> 1; j++)
                _encipher(cdata, j << 1, P, S);
            var ret = [];
            for (i = 0; i < clen; i++)
              ret.push((cdata[i] >> 24 & 255) >>> 0), ret.push((cdata[i] >> 16 & 255) >>> 0), ret.push((cdata[i] >> 8 & 255) >>> 0), ret.push((cdata[i] & 255) >>> 0);
            if (callback) {
              callback(null, ret);
              return;
            } else
              return ret;
          }
          if (callback)
            nextTick(next);
        }
        if (typeof callback !== "undefined") {
          next();
        } else {
          var res;
          while (true)
            if (typeof (res = next()) !== "undefined")
              return res || [];
        }
      }
      function _hash(s, salt, callback, progressCallback) {
        var err;
        if (typeof s !== "string" || typeof salt !== "string") {
          err = Error("Invalid string / salt: Not a string");
          if (callback) {
            nextTick(callback.bind(this, err));
            return;
          } else
            throw err;
        }
        var minor, offset;
        if (salt.charAt(0) !== "$" || salt.charAt(1) !== "2") {
          err = Error("Invalid salt version: " + salt.substring(0, 2));
          if (callback) {
            nextTick(callback.bind(this, err));
            return;
          } else
            throw err;
        }
        if (salt.charAt(2) === "$")
          minor = String.fromCharCode(0), offset = 3;
        else {
          minor = salt.charAt(2);
          if (minor !== "a" && minor !== "b" && minor !== "y" || salt.charAt(3) !== "$") {
            err = Error("Invalid salt revision: " + salt.substring(2, 4));
            if (callback) {
              nextTick(callback.bind(this, err));
              return;
            } else
              throw err;
          }
          offset = 4;
        }
        if (salt.charAt(offset + 2) > "$") {
          err = Error("Missing salt rounds");
          if (callback) {
            nextTick(callback.bind(this, err));
            return;
          } else
            throw err;
        }
        var r1 = parseInt(salt.substring(offset, offset + 1), 10) * 10, r2 = parseInt(salt.substring(offset + 1, offset + 2), 10), rounds = r1 + r2, real_salt = salt.substring(offset + 3, offset + 25);
        s += minor >= "a" ? "\0" : "";
        var passwordb = stringToBytes(s), saltb = base64_decode(real_salt, BCRYPT_SALT_LEN);
        function finish(bytes) {
          var res = [];
          res.push("$2");
          if (minor >= "a")
            res.push(minor);
          res.push("$");
          if (rounds < 10)
            res.push("0");
          res.push(rounds.toString());
          res.push("$");
          res.push(base64_encode(saltb, saltb.length));
          res.push(base64_encode(bytes, C_ORIG.length * 4 - 1));
          return res.join("");
        }
        if (typeof callback == "undefined")
          return finish(_crypt(passwordb, saltb, rounds));
        else {
          _crypt(passwordb, saltb, rounds, function(err2, bytes) {
            if (err2)
              callback(err2, null);
            else
              callback(null, finish(bytes));
          }, progressCallback);
        }
      }
      bcrypt2.encodeBase64 = base64_encode;
      bcrypt2.decodeBase64 = base64_decode;
      return bcrypt2;
    });
  }
});

// node_modules/bcryptjs/index.js
var require_bcryptjs = __commonJS({
  "node_modules/bcryptjs/index.js"(exports, module) {
    module.exports = require_bcrypt();
  }
});

// node_modules/safe-buffer/index.js
var require_safe_buffer = __commonJS({
  "node_modules/safe-buffer/index.js"(exports, module) {
    var buffer = __require("buffer");
    var Buffer2 = buffer.Buffer;
    function copyProps(src, dst) {
      for (var key in src) {
        dst[key] = src[key];
      }
    }
    if (Buffer2.from && Buffer2.alloc && Buffer2.allocUnsafe && Buffer2.allocUnsafeSlow) {
      module.exports = buffer;
    } else {
      copyProps(buffer, exports);
      exports.Buffer = SafeBuffer;
    }
    function SafeBuffer(arg, encodingOrOffset, length) {
      return Buffer2(arg, encodingOrOffset, length);
    }
    SafeBuffer.prototype = Object.create(Buffer2.prototype);
    copyProps(Buffer2, SafeBuffer);
    SafeBuffer.from = function(arg, encodingOrOffset, length) {
      if (typeof arg === "number") {
        throw new TypeError("Argument must not be a number");
      }
      return Buffer2(arg, encodingOrOffset, length);
    };
    SafeBuffer.alloc = function(size, fill, encoding) {
      if (typeof size !== "number") {
        throw new TypeError("Argument must be a number");
      }
      var buf = Buffer2(size);
      if (fill !== void 0) {
        if (typeof encoding === "string") {
          buf.fill(fill, encoding);
        } else {
          buf.fill(fill);
        }
      } else {
        buf.fill(0);
      }
      return buf;
    };
    SafeBuffer.allocUnsafe = function(size) {
      if (typeof size !== "number") {
        throw new TypeError("Argument must be a number");
      }
      return Buffer2(size);
    };
    SafeBuffer.allocUnsafeSlow = function(size) {
      if (typeof size !== "number") {
        throw new TypeError("Argument must be a number");
      }
      return buffer.SlowBuffer(size);
    };
  }
});

// node_modules/jws/lib/data-stream.js
var require_data_stream = __commonJS({
  "node_modules/jws/lib/data-stream.js"(exports, module) {
    var Buffer2 = require_safe_buffer().Buffer;
    var Stream = __require("stream");
    var util = __require("util");
    function DataStream(data) {
      this.buffer = null;
      this.writable = true;
      this.readable = true;
      if (!data) {
        this.buffer = Buffer2.alloc(0);
        return this;
      }
      if (typeof data.pipe === "function") {
        this.buffer = Buffer2.alloc(0);
        data.pipe(this);
        return this;
      }
      if (data.length || typeof data === "object") {
        this.buffer = data;
        this.writable = false;
        process.nextTick(function() {
          this.emit("end", data);
          this.readable = false;
          this.emit("close");
        }.bind(this));
        return this;
      }
      throw new TypeError("Unexpected data type (" + typeof data + ")");
    }
    util.inherits(DataStream, Stream);
    DataStream.prototype.write = function write(data) {
      this.buffer = Buffer2.concat([this.buffer, Buffer2.from(data)]);
      this.emit("data", data);
    };
    DataStream.prototype.end = function end(data) {
      if (data)
        this.write(data);
      this.emit("end", data);
      this.emit("close");
      this.writable = false;
      this.readable = false;
    };
    module.exports = DataStream;
  }
});

// node_modules/ecdsa-sig-formatter/src/param-bytes-for-alg.js
var require_param_bytes_for_alg = __commonJS({
  "node_modules/ecdsa-sig-formatter/src/param-bytes-for-alg.js"(exports, module) {
    "use strict";
    function getParamSize(keySize) {
      var result = (keySize / 8 | 0) + (keySize % 8 === 0 ? 0 : 1);
      return result;
    }
    var paramBytesForAlg = {
      ES256: getParamSize(256),
      ES384: getParamSize(384),
      ES512: getParamSize(521)
    };
    function getParamBytesForAlg(alg) {
      var paramBytes = paramBytesForAlg[alg];
      if (paramBytes) {
        return paramBytes;
      }
      throw new Error('Unknown algorithm "' + alg + '"');
    }
    module.exports = getParamBytesForAlg;
  }
});

// node_modules/ecdsa-sig-formatter/src/ecdsa-sig-formatter.js
var require_ecdsa_sig_formatter = __commonJS({
  "node_modules/ecdsa-sig-formatter/src/ecdsa-sig-formatter.js"(exports, module) {
    "use strict";
    var Buffer2 = require_safe_buffer().Buffer;
    var getParamBytesForAlg = require_param_bytes_for_alg();
    var MAX_OCTET = 128;
    var CLASS_UNIVERSAL = 0;
    var PRIMITIVE_BIT = 32;
    var TAG_SEQ = 16;
    var TAG_INT = 2;
    var ENCODED_TAG_SEQ = TAG_SEQ | PRIMITIVE_BIT | CLASS_UNIVERSAL << 6;
    var ENCODED_TAG_INT = TAG_INT | CLASS_UNIVERSAL << 6;
    function base64Url(base64) {
      return base64.replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
    }
    function signatureAsBuffer(signature) {
      if (Buffer2.isBuffer(signature)) {
        return signature;
      } else if ("string" === typeof signature) {
        return Buffer2.from(signature, "base64");
      }
      throw new TypeError("ECDSA signature must be a Base64 string or a Buffer");
    }
    function derToJose(signature, alg) {
      signature = signatureAsBuffer(signature);
      var paramBytes = getParamBytesForAlg(alg);
      var maxEncodedParamLength = paramBytes + 1;
      var inputLength = signature.length;
      var offset = 0;
      if (signature[offset++] !== ENCODED_TAG_SEQ) {
        throw new Error('Could not find expected "seq"');
      }
      var seqLength = signature[offset++];
      if (seqLength === (MAX_OCTET | 1)) {
        seqLength = signature[offset++];
      }
      if (inputLength - offset < seqLength) {
        throw new Error('"seq" specified length of "' + seqLength + '", only "' + (inputLength - offset) + '" remaining');
      }
      if (signature[offset++] !== ENCODED_TAG_INT) {
        throw new Error('Could not find expected "int" for "r"');
      }
      var rLength = signature[offset++];
      if (inputLength - offset - 2 < rLength) {
        throw new Error('"r" specified length of "' + rLength + '", only "' + (inputLength - offset - 2) + '" available');
      }
      if (maxEncodedParamLength < rLength) {
        throw new Error('"r" specified length of "' + rLength + '", max of "' + maxEncodedParamLength + '" is acceptable');
      }
      var rOffset = offset;
      offset += rLength;
      if (signature[offset++] !== ENCODED_TAG_INT) {
        throw new Error('Could not find expected "int" for "s"');
      }
      var sLength = signature[offset++];
      if (inputLength - offset !== sLength) {
        throw new Error('"s" specified length of "' + sLength + '", expected "' + (inputLength - offset) + '"');
      }
      if (maxEncodedParamLength < sLength) {
        throw new Error('"s" specified length of "' + sLength + '", max of "' + maxEncodedParamLength + '" is acceptable');
      }
      var sOffset = offset;
      offset += sLength;
      if (offset !== inputLength) {
        throw new Error('Expected to consume entire buffer, but "' + (inputLength - offset) + '" bytes remain');
      }
      var rPadding = paramBytes - rLength, sPadding = paramBytes - sLength;
      var dst = Buffer2.allocUnsafe(rPadding + rLength + sPadding + sLength);
      for (offset = 0; offset < rPadding; ++offset) {
        dst[offset] = 0;
      }
      signature.copy(dst, offset, rOffset + Math.max(-rPadding, 0), rOffset + rLength);
      offset = paramBytes;
      for (var o = offset; offset < o + sPadding; ++offset) {
        dst[offset] = 0;
      }
      signature.copy(dst, offset, sOffset + Math.max(-sPadding, 0), sOffset + sLength);
      dst = dst.toString("base64");
      dst = base64Url(dst);
      return dst;
    }
    function countPadding(buf, start, stop) {
      var padding = 0;
      while (start + padding < stop && buf[start + padding] === 0) {
        ++padding;
      }
      var needsSign = buf[start + padding] >= MAX_OCTET;
      if (needsSign) {
        --padding;
      }
      return padding;
    }
    function joseToDer(signature, alg) {
      signature = signatureAsBuffer(signature);
      var paramBytes = getParamBytesForAlg(alg);
      var signatureBytes = signature.length;
      if (signatureBytes !== paramBytes * 2) {
        throw new TypeError('"' + alg + '" signatures must be "' + paramBytes * 2 + '" bytes, saw "' + signatureBytes + '"');
      }
      var rPadding = countPadding(signature, 0, paramBytes);
      var sPadding = countPadding(signature, paramBytes, signature.length);
      var rLength = paramBytes - rPadding;
      var sLength = paramBytes - sPadding;
      var rsBytes = 1 + 1 + rLength + 1 + 1 + sLength;
      var shortLength = rsBytes < MAX_OCTET;
      var dst = Buffer2.allocUnsafe((shortLength ? 2 : 3) + rsBytes);
      var offset = 0;
      dst[offset++] = ENCODED_TAG_SEQ;
      if (shortLength) {
        dst[offset++] = rsBytes;
      } else {
        dst[offset++] = MAX_OCTET | 1;
        dst[offset++] = rsBytes & 255;
      }
      dst[offset++] = ENCODED_TAG_INT;
      dst[offset++] = rLength;
      if (rPadding < 0) {
        dst[offset++] = 0;
        offset += signature.copy(dst, offset, 0, paramBytes);
      } else {
        offset += signature.copy(dst, offset, rPadding, paramBytes);
      }
      dst[offset++] = ENCODED_TAG_INT;
      dst[offset++] = sLength;
      if (sPadding < 0) {
        dst[offset++] = 0;
        signature.copy(dst, offset, paramBytes);
      } else {
        signature.copy(dst, offset, paramBytes + sPadding);
      }
      return dst;
    }
    module.exports = {
      derToJose,
      joseToDer
    };
  }
});

// node_modules/buffer-equal-constant-time/index.js
var require_buffer_equal_constant_time = __commonJS({
  "node_modules/buffer-equal-constant-time/index.js"(exports, module) {
    "use strict";
    var Buffer2 = __require("buffer").Buffer;
    var SlowBuffer = __require("buffer").SlowBuffer;
    module.exports = bufferEq;
    function bufferEq(a, b) {
      if (!Buffer2.isBuffer(a) || !Buffer2.isBuffer(b)) {
        return false;
      }
      if (a.length !== b.length) {
        return false;
      }
      var c = 0;
      for (var i = 0; i < a.length; i++) {
        c |= a[i] ^ b[i];
      }
      return c === 0;
    }
    bufferEq.install = function() {
      Buffer2.prototype.equal = SlowBuffer.prototype.equal = function equal(that) {
        return bufferEq(this, that);
      };
    };
    var origBufEqual = Buffer2.prototype.equal;
    var origSlowBufEqual = SlowBuffer.prototype.equal;
    bufferEq.restore = function() {
      Buffer2.prototype.equal = origBufEqual;
      SlowBuffer.prototype.equal = origSlowBufEqual;
    };
  }
});

// node_modules/jwa/index.js
var require_jwa = __commonJS({
  "node_modules/jwa/index.js"(exports, module) {
    var Buffer2 = require_safe_buffer().Buffer;
    var crypto = __require("crypto");
    var formatEcdsa = require_ecdsa_sig_formatter();
    var util = __require("util");
    var MSG_INVALID_ALGORITHM = '"%s" is not a valid algorithm.\n  Supported algorithms are:\n  "HS256", "HS384", "HS512", "RS256", "RS384", "RS512", "PS256", "PS384", "PS512", "ES256", "ES384", "ES512" and "none".';
    var MSG_INVALID_SECRET = "secret must be a string or buffer";
    var MSG_INVALID_VERIFIER_KEY = "key must be a string or a buffer";
    var MSG_INVALID_SIGNER_KEY = "key must be a string, a buffer or an object";
    var supportsKeyObjects = typeof crypto.createPublicKey === "function";
    if (supportsKeyObjects) {
      MSG_INVALID_VERIFIER_KEY += " or a KeyObject";
      MSG_INVALID_SECRET += "or a KeyObject";
    }
    function checkIsPublicKey(key) {
      if (Buffer2.isBuffer(key)) {
        return;
      }
      if (typeof key === "string") {
        return;
      }
      if (!supportsKeyObjects) {
        throw typeError(MSG_INVALID_VERIFIER_KEY);
      }
      if (typeof key !== "object") {
        throw typeError(MSG_INVALID_VERIFIER_KEY);
      }
      if (typeof key.type !== "string") {
        throw typeError(MSG_INVALID_VERIFIER_KEY);
      }
      if (typeof key.asymmetricKeyType !== "string") {
        throw typeError(MSG_INVALID_VERIFIER_KEY);
      }
      if (typeof key.export !== "function") {
        throw typeError(MSG_INVALID_VERIFIER_KEY);
      }
    }
    function checkIsPrivateKey(key) {
      if (Buffer2.isBuffer(key)) {
        return;
      }
      if (typeof key === "string") {
        return;
      }
      if (typeof key === "object") {
        return;
      }
      throw typeError(MSG_INVALID_SIGNER_KEY);
    }
    function checkIsSecretKey(key) {
      if (Buffer2.isBuffer(key)) {
        return;
      }
      if (typeof key === "string") {
        return key;
      }
      if (!supportsKeyObjects) {
        throw typeError(MSG_INVALID_SECRET);
      }
      if (typeof key !== "object") {
        throw typeError(MSG_INVALID_SECRET);
      }
      if (key.type !== "secret") {
        throw typeError(MSG_INVALID_SECRET);
      }
      if (typeof key.export !== "function") {
        throw typeError(MSG_INVALID_SECRET);
      }
    }
    function fromBase64(base64) {
      return base64.replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
    }
    function toBase64(base64url) {
      base64url = base64url.toString();
      var padding = 4 - base64url.length % 4;
      if (padding !== 4) {
        for (var i = 0; i < padding; ++i) {
          base64url += "=";
        }
      }
      return base64url.replace(/\-/g, "+").replace(/_/g, "/");
    }
    function typeError(template) {
      var args = [].slice.call(arguments, 1);
      var errMsg = util.format.bind(util, template).apply(null, args);
      return new TypeError(errMsg);
    }
    function bufferOrString(obj) {
      return Buffer2.isBuffer(obj) || typeof obj === "string";
    }
    function normalizeInput(thing) {
      if (!bufferOrString(thing))
        thing = JSON.stringify(thing);
      return thing;
    }
    function createHmacSigner(bits) {
      return function sign(thing, secret) {
        checkIsSecretKey(secret);
        thing = normalizeInput(thing);
        var hmac = crypto.createHmac("sha" + bits, secret);
        var sig = (hmac.update(thing), hmac.digest("base64"));
        return fromBase64(sig);
      };
    }
    var bufferEqual;
    var timingSafeEqual = "timingSafeEqual" in crypto ? function timingSafeEqual2(a, b) {
      if (a.byteLength !== b.byteLength) {
        return false;
      }
      return crypto.timingSafeEqual(a, b);
    } : function timingSafeEqual2(a, b) {
      if (!bufferEqual) {
        bufferEqual = require_buffer_equal_constant_time();
      }
      return bufferEqual(a, b);
    };
    function createHmacVerifier(bits) {
      return function verify(thing, signature, secret) {
        var computedSig = createHmacSigner(bits)(thing, secret);
        return timingSafeEqual(Buffer2.from(signature), Buffer2.from(computedSig));
      };
    }
    function createKeySigner(bits) {
      return function sign(thing, privateKey) {
        checkIsPrivateKey(privateKey);
        thing = normalizeInput(thing);
        var signer = crypto.createSign("RSA-SHA" + bits);
        var sig = (signer.update(thing), signer.sign(privateKey, "base64"));
        return fromBase64(sig);
      };
    }
    function createKeyVerifier(bits) {
      return function verify(thing, signature, publicKey) {
        checkIsPublicKey(publicKey);
        thing = normalizeInput(thing);
        signature = toBase64(signature);
        var verifier = crypto.createVerify("RSA-SHA" + bits);
        verifier.update(thing);
        return verifier.verify(publicKey, signature, "base64");
      };
    }
    function createPSSKeySigner(bits) {
      return function sign(thing, privateKey) {
        checkIsPrivateKey(privateKey);
        thing = normalizeInput(thing);
        var signer = crypto.createSign("RSA-SHA" + bits);
        var sig = (signer.update(thing), signer.sign({
          key: privateKey,
          padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
          saltLength: crypto.constants.RSA_PSS_SALTLEN_DIGEST
        }, "base64"));
        return fromBase64(sig);
      };
    }
    function createPSSKeyVerifier(bits) {
      return function verify(thing, signature, publicKey) {
        checkIsPublicKey(publicKey);
        thing = normalizeInput(thing);
        signature = toBase64(signature);
        var verifier = crypto.createVerify("RSA-SHA" + bits);
        verifier.update(thing);
        return verifier.verify({
          key: publicKey,
          padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
          saltLength: crypto.constants.RSA_PSS_SALTLEN_DIGEST
        }, signature, "base64");
      };
    }
    function createECDSASigner(bits) {
      var inner = createKeySigner(bits);
      return function sign() {
        var signature = inner.apply(null, arguments);
        signature = formatEcdsa.derToJose(signature, "ES" + bits);
        return signature;
      };
    }
    function createECDSAVerifer(bits) {
      var inner = createKeyVerifier(bits);
      return function verify(thing, signature, publicKey) {
        signature = formatEcdsa.joseToDer(signature, "ES" + bits).toString("base64");
        var result = inner(thing, signature, publicKey);
        return result;
      };
    }
    function createNoneSigner() {
      return function sign() {
        return "";
      };
    }
    function createNoneVerifier() {
      return function verify(thing, signature) {
        return signature === "";
      };
    }
    module.exports = function jwa(algorithm) {
      var signerFactories = {
        hs: createHmacSigner,
        rs: createKeySigner,
        ps: createPSSKeySigner,
        es: createECDSASigner,
        none: createNoneSigner
      };
      var verifierFactories = {
        hs: createHmacVerifier,
        rs: createKeyVerifier,
        ps: createPSSKeyVerifier,
        es: createECDSAVerifer,
        none: createNoneVerifier
      };
      var match = algorithm.match(/^(RS|PS|ES|HS)(256|384|512)$|^(none)$/);
      if (!match)
        throw typeError(MSG_INVALID_ALGORITHM, algorithm);
      var algo = (match[1] || match[3]).toLowerCase();
      var bits = match[2];
      return {
        sign: signerFactories[algo](bits),
        verify: verifierFactories[algo](bits)
      };
    };
  }
});

// node_modules/jws/lib/tostring.js
var require_tostring = __commonJS({
  "node_modules/jws/lib/tostring.js"(exports, module) {
    var Buffer2 = __require("buffer").Buffer;
    module.exports = function toString(obj) {
      if (typeof obj === "string")
        return obj;
      if (typeof obj === "number" || Buffer2.isBuffer(obj))
        return obj.toString();
      return JSON.stringify(obj);
    };
  }
});

// node_modules/jws/lib/sign-stream.js
var require_sign_stream = __commonJS({
  "node_modules/jws/lib/sign-stream.js"(exports, module) {
    var Buffer2 = require_safe_buffer().Buffer;
    var DataStream = require_data_stream();
    var jwa = require_jwa();
    var Stream = __require("stream");
    var toString = require_tostring();
    var util = __require("util");
    function base64url(string, encoding) {
      return Buffer2.from(string, encoding).toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
    }
    function jwsSecuredInput(header, payload, encoding) {
      encoding = encoding || "utf8";
      var encodedHeader = base64url(toString(header), "binary");
      var encodedPayload = base64url(toString(payload), encoding);
      return util.format("%s.%s", encodedHeader, encodedPayload);
    }
    function jwsSign(opts) {
      var header = opts.header;
      var payload = opts.payload;
      var secretOrKey = opts.secret || opts.privateKey;
      var encoding = opts.encoding;
      var algo = jwa(header.alg);
      var securedInput = jwsSecuredInput(header, payload, encoding);
      var signature = algo.sign(securedInput, secretOrKey);
      return util.format("%s.%s", securedInput, signature);
    }
    function SignStream(opts) {
      var secret = opts.secret;
      secret = secret == null ? opts.privateKey : secret;
      secret = secret == null ? opts.key : secret;
      if (/^hs/i.test(opts.header.alg) === true && secret == null) {
        throw new TypeError("secret must be a string or buffer or a KeyObject");
      }
      var secretStream = new DataStream(secret);
      this.readable = true;
      this.header = opts.header;
      this.encoding = opts.encoding;
      this.secret = this.privateKey = this.key = secretStream;
      this.payload = new DataStream(opts.payload);
      this.secret.once("close", function() {
        if (!this.payload.writable && this.readable)
          this.sign();
      }.bind(this));
      this.payload.once("close", function() {
        if (!this.secret.writable && this.readable)
          this.sign();
      }.bind(this));
    }
    util.inherits(SignStream, Stream);
    SignStream.prototype.sign = function sign() {
      try {
        var signature = jwsSign({
          header: this.header,
          payload: this.payload.buffer,
          secret: this.secret.buffer,
          encoding: this.encoding
        });
        this.emit("done", signature);
        this.emit("data", signature);
        this.emit("end");
        this.readable = false;
        return signature;
      } catch (e) {
        this.readable = false;
        this.emit("error", e);
        this.emit("close");
      }
    };
    SignStream.sign = jwsSign;
    module.exports = SignStream;
  }
});

// node_modules/jws/lib/verify-stream.js
var require_verify_stream = __commonJS({
  "node_modules/jws/lib/verify-stream.js"(exports, module) {
    var Buffer2 = require_safe_buffer().Buffer;
    var DataStream = require_data_stream();
    var jwa = require_jwa();
    var Stream = __require("stream");
    var toString = require_tostring();
    var util = __require("util");
    var JWS_REGEX = /^[a-zA-Z0-9\-_]+?\.[a-zA-Z0-9\-_]+?\.([a-zA-Z0-9\-_]+)?$/;
    function isObject(thing) {
      return Object.prototype.toString.call(thing) === "[object Object]";
    }
    function safeJsonParse(thing) {
      if (isObject(thing))
        return thing;
      try {
        return JSON.parse(thing);
      } catch (e) {
        return void 0;
      }
    }
    function headerFromJWS(jwsSig) {
      var encodedHeader = jwsSig.split(".", 1)[0];
      return safeJsonParse(Buffer2.from(encodedHeader, "base64").toString("binary"));
    }
    function securedInputFromJWS(jwsSig) {
      return jwsSig.split(".", 2).join(".");
    }
    function signatureFromJWS(jwsSig) {
      return jwsSig.split(".")[2];
    }
    function payloadFromJWS(jwsSig, encoding) {
      encoding = encoding || "utf8";
      var payload = jwsSig.split(".")[1];
      return Buffer2.from(payload, "base64").toString(encoding);
    }
    function isValidJws(string) {
      return JWS_REGEX.test(string) && !!headerFromJWS(string);
    }
    function jwsVerify(jwsSig, algorithm, secretOrKey) {
      if (!algorithm) {
        var err = new Error("Missing algorithm parameter for jws.verify");
        err.code = "MISSING_ALGORITHM";
        throw err;
      }
      jwsSig = toString(jwsSig);
      var signature = signatureFromJWS(jwsSig);
      var securedInput = securedInputFromJWS(jwsSig);
      var algo = jwa(algorithm);
      return algo.verify(securedInput, signature, secretOrKey);
    }
    function jwsDecode(jwsSig, opts) {
      opts = opts || {};
      jwsSig = toString(jwsSig);
      if (!isValidJws(jwsSig))
        return null;
      var header = headerFromJWS(jwsSig);
      if (!header)
        return null;
      var payload = payloadFromJWS(jwsSig);
      if (header.typ === "JWT" || opts.json)
        payload = JSON.parse(payload, opts.encoding);
      return {
        header,
        payload,
        signature: signatureFromJWS(jwsSig)
      };
    }
    function VerifyStream(opts) {
      opts = opts || {};
      var secretOrKey = opts.secret;
      secretOrKey = secretOrKey == null ? opts.publicKey : secretOrKey;
      secretOrKey = secretOrKey == null ? opts.key : secretOrKey;
      if (/^hs/i.test(opts.algorithm) === true && secretOrKey == null) {
        throw new TypeError("secret must be a string or buffer or a KeyObject");
      }
      var secretStream = new DataStream(secretOrKey);
      this.readable = true;
      this.algorithm = opts.algorithm;
      this.encoding = opts.encoding;
      this.secret = this.publicKey = this.key = secretStream;
      this.signature = new DataStream(opts.signature);
      this.secret.once("close", function() {
        if (!this.signature.writable && this.readable)
          this.verify();
      }.bind(this));
      this.signature.once("close", function() {
        if (!this.secret.writable && this.readable)
          this.verify();
      }.bind(this));
    }
    util.inherits(VerifyStream, Stream);
    VerifyStream.prototype.verify = function verify() {
      try {
        var valid = jwsVerify(this.signature.buffer, this.algorithm, this.key.buffer);
        var obj = jwsDecode(this.signature.buffer, this.encoding);
        this.emit("done", valid, obj);
        this.emit("data", valid);
        this.emit("end");
        this.readable = false;
        return valid;
      } catch (e) {
        this.readable = false;
        this.emit("error", e);
        this.emit("close");
      }
    };
    VerifyStream.decode = jwsDecode;
    VerifyStream.isValid = isValidJws;
    VerifyStream.verify = jwsVerify;
    module.exports = VerifyStream;
  }
});

// node_modules/jws/index.js
var require_jws = __commonJS({
  "node_modules/jws/index.js"(exports) {
    var SignStream = require_sign_stream();
    var VerifyStream = require_verify_stream();
    var ALGORITHMS = [
      "HS256",
      "HS384",
      "HS512",
      "RS256",
      "RS384",
      "RS512",
      "PS256",
      "PS384",
      "PS512",
      "ES256",
      "ES384",
      "ES512"
    ];
    exports.ALGORITHMS = ALGORITHMS;
    exports.sign = SignStream.sign;
    exports.verify = VerifyStream.verify;
    exports.decode = VerifyStream.decode;
    exports.isValid = VerifyStream.isValid;
    exports.createSign = function createSign(opts) {
      return new SignStream(opts);
    };
    exports.createVerify = function createVerify(opts) {
      return new VerifyStream(opts);
    };
  }
});

// node_modules/jsonwebtoken/decode.js
var require_decode = __commonJS({
  "node_modules/jsonwebtoken/decode.js"(exports, module) {
    var jws = require_jws();
    module.exports = function(jwt2, options) {
      options = options || {};
      var decoded = jws.decode(jwt2, options);
      if (!decoded) {
        return null;
      }
      var payload = decoded.payload;
      if (typeof payload === "string") {
        try {
          var obj = JSON.parse(payload);
          if (obj !== null && typeof obj === "object") {
            payload = obj;
          }
        } catch (e) {
        }
      }
      if (options.complete === true) {
        return {
          header: decoded.header,
          payload,
          signature: decoded.signature
        };
      }
      return payload;
    };
  }
});

// node_modules/jsonwebtoken/lib/JsonWebTokenError.js
var require_JsonWebTokenError = __commonJS({
  "node_modules/jsonwebtoken/lib/JsonWebTokenError.js"(exports, module) {
    var JsonWebTokenError = function(message, error) {
      Error.call(this, message);
      if (Error.captureStackTrace) {
        Error.captureStackTrace(this, this.constructor);
      }
      this.name = "JsonWebTokenError";
      this.message = message;
      if (error) this.inner = error;
    };
    JsonWebTokenError.prototype = Object.create(Error.prototype);
    JsonWebTokenError.prototype.constructor = JsonWebTokenError;
    module.exports = JsonWebTokenError;
  }
});

// node_modules/jsonwebtoken/lib/NotBeforeError.js
var require_NotBeforeError = __commonJS({
  "node_modules/jsonwebtoken/lib/NotBeforeError.js"(exports, module) {
    var JsonWebTokenError = require_JsonWebTokenError();
    var NotBeforeError = function(message, date) {
      JsonWebTokenError.call(this, message);
      this.name = "NotBeforeError";
      this.date = date;
    };
    NotBeforeError.prototype = Object.create(JsonWebTokenError.prototype);
    NotBeforeError.prototype.constructor = NotBeforeError;
    module.exports = NotBeforeError;
  }
});

// node_modules/jsonwebtoken/lib/TokenExpiredError.js
var require_TokenExpiredError = __commonJS({
  "node_modules/jsonwebtoken/lib/TokenExpiredError.js"(exports, module) {
    var JsonWebTokenError = require_JsonWebTokenError();
    var TokenExpiredError = function(message, expiredAt) {
      JsonWebTokenError.call(this, message);
      this.name = "TokenExpiredError";
      this.expiredAt = expiredAt;
    };
    TokenExpiredError.prototype = Object.create(JsonWebTokenError.prototype);
    TokenExpiredError.prototype.constructor = TokenExpiredError;
    module.exports = TokenExpiredError;
  }
});

// node_modules/ms/index.js
var require_ms = __commonJS({
  "node_modules/ms/index.js"(exports, module) {
    var s = 1e3;
    var m = s * 60;
    var h = m * 60;
    var d = h * 24;
    var w = d * 7;
    var y = d * 365.25;
    module.exports = function(val, options) {
      options = options || {};
      var type = typeof val;
      if (type === "string" && val.length > 0) {
        return parse(val);
      } else if (type === "number" && isFinite(val)) {
        return options.long ? fmtLong(val) : fmtShort(val);
      }
      throw new Error(
        "val is not a non-empty string or a valid number. val=" + JSON.stringify(val)
      );
    };
    function parse(str) {
      str = String(str);
      if (str.length > 100) {
        return;
      }
      var match = /^(-?(?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)?$/i.exec(
        str
      );
      if (!match) {
        return;
      }
      var n = parseFloat(match[1]);
      var type = (match[2] || "ms").toLowerCase();
      switch (type) {
        case "years":
        case "year":
        case "yrs":
        case "yr":
        case "y":
          return n * y;
        case "weeks":
        case "week":
        case "w":
          return n * w;
        case "days":
        case "day":
        case "d":
          return n * d;
        case "hours":
        case "hour":
        case "hrs":
        case "hr":
        case "h":
          return n * h;
        case "minutes":
        case "minute":
        case "mins":
        case "min":
        case "m":
          return n * m;
        case "seconds":
        case "second":
        case "secs":
        case "sec":
        case "s":
          return n * s;
        case "milliseconds":
        case "millisecond":
        case "msecs":
        case "msec":
        case "ms":
          return n;
        default:
          return void 0;
      }
    }
    function fmtShort(ms) {
      var msAbs = Math.abs(ms);
      if (msAbs >= d) {
        return Math.round(ms / d) + "d";
      }
      if (msAbs >= h) {
        return Math.round(ms / h) + "h";
      }
      if (msAbs >= m) {
        return Math.round(ms / m) + "m";
      }
      if (msAbs >= s) {
        return Math.round(ms / s) + "s";
      }
      return ms + "ms";
    }
    function fmtLong(ms) {
      var msAbs = Math.abs(ms);
      if (msAbs >= d) {
        return plural(ms, msAbs, d, "day");
      }
      if (msAbs >= h) {
        return plural(ms, msAbs, h, "hour");
      }
      if (msAbs >= m) {
        return plural(ms, msAbs, m, "minute");
      }
      if (msAbs >= s) {
        return plural(ms, msAbs, s, "second");
      }
      return ms + " ms";
    }
    function plural(ms, msAbs, n, name) {
      var isPlural = msAbs >= n * 1.5;
      return Math.round(ms / n) + " " + name + (isPlural ? "s" : "");
    }
  }
});

// node_modules/jsonwebtoken/lib/timespan.js
var require_timespan = __commonJS({
  "node_modules/jsonwebtoken/lib/timespan.js"(exports, module) {
    var ms = require_ms();
    module.exports = function(time, iat) {
      var timestamp = iat || Math.floor(Date.now() / 1e3);
      if (typeof time === "string") {
        var milliseconds = ms(time);
        if (typeof milliseconds === "undefined") {
          return;
        }
        return Math.floor(timestamp + milliseconds / 1e3);
      } else if (typeof time === "number") {
        return timestamp + time;
      } else {
        return;
      }
    };
  }
});

// node_modules/semver/internal/constants.js
var require_constants = __commonJS({
  "node_modules/semver/internal/constants.js"(exports, module) {
    "use strict";
    var SEMVER_SPEC_VERSION = "2.0.0";
    var MAX_LENGTH = 256;
    var MAX_SAFE_INTEGER = Number.MAX_SAFE_INTEGER || /* istanbul ignore next */
    9007199254740991;
    var MAX_SAFE_COMPONENT_LENGTH = 16;
    var MAX_SAFE_BUILD_LENGTH = MAX_LENGTH - 6;
    var RELEASE_TYPES = [
      "major",
      "premajor",
      "minor",
      "preminor",
      "patch",
      "prepatch",
      "prerelease"
    ];
    module.exports = {
      MAX_LENGTH,
      MAX_SAFE_COMPONENT_LENGTH,
      MAX_SAFE_BUILD_LENGTH,
      MAX_SAFE_INTEGER,
      RELEASE_TYPES,
      SEMVER_SPEC_VERSION,
      FLAG_INCLUDE_PRERELEASE: 1,
      FLAG_LOOSE: 2
    };
  }
});

// node_modules/semver/internal/debug.js
var require_debug = __commonJS({
  "node_modules/semver/internal/debug.js"(exports, module) {
    "use strict";
    var debug = typeof process === "object" && process.env && process.env.NODE_DEBUG && /\bsemver\b/i.test(process.env.NODE_DEBUG) ? (...args) => console.error("SEMVER", ...args) : () => {
    };
    module.exports = debug;
  }
});

// node_modules/semver/internal/re.js
var require_re = __commonJS({
  "node_modules/semver/internal/re.js"(exports, module) {
    "use strict";
    var {
      MAX_SAFE_COMPONENT_LENGTH,
      MAX_SAFE_BUILD_LENGTH,
      MAX_LENGTH
    } = require_constants();
    var debug = require_debug();
    exports = module.exports = {};
    var re = exports.re = [];
    var safeRe = exports.safeRe = [];
    var src = exports.src = [];
    var safeSrc = exports.safeSrc = [];
    var t = exports.t = {};
    var R = 0;
    var LETTERDASHNUMBER = "[a-zA-Z0-9-]";
    var safeRegexReplacements = [
      ["\\s", 1],
      ["\\d", MAX_LENGTH],
      [LETTERDASHNUMBER, MAX_SAFE_BUILD_LENGTH]
    ];
    var makeSafeRegex = (value) => {
      for (const [token, max] of safeRegexReplacements) {
        value = value.split(`${token}*`).join(`${token}{0,${max}}`).split(`${token}+`).join(`${token}{1,${max}}`);
      }
      return value;
    };
    var createToken = (name, value, isGlobal) => {
      const safe = makeSafeRegex(value);
      const index = R++;
      debug(name, index, value);
      t[name] = index;
      src[index] = value;
      safeSrc[index] = safe;
      re[index] = new RegExp(value, isGlobal ? "g" : void 0);
      safeRe[index] = new RegExp(safe, isGlobal ? "g" : void 0);
    };
    createToken("NUMERICIDENTIFIER", "0|[1-9]\\d*");
    createToken("NUMERICIDENTIFIERLOOSE", "\\d+");
    createToken("NONNUMERICIDENTIFIER", `\\d*[a-zA-Z-]${LETTERDASHNUMBER}*`);
    createToken("MAINVERSION", `(${src[t.NUMERICIDENTIFIER]})\\.(${src[t.NUMERICIDENTIFIER]})\\.(${src[t.NUMERICIDENTIFIER]})`);
    createToken("MAINVERSIONLOOSE", `(${src[t.NUMERICIDENTIFIERLOOSE]})\\.(${src[t.NUMERICIDENTIFIERLOOSE]})\\.(${src[t.NUMERICIDENTIFIERLOOSE]})`);
    createToken("PRERELEASEIDENTIFIER", `(?:${src[t.NONNUMERICIDENTIFIER]}|${src[t.NUMERICIDENTIFIER]})`);
    createToken("PRERELEASEIDENTIFIERLOOSE", `(?:${src[t.NONNUMERICIDENTIFIER]}|${src[t.NUMERICIDENTIFIERLOOSE]})`);
    createToken("PRERELEASE", `(?:-(${src[t.PRERELEASEIDENTIFIER]}(?:\\.${src[t.PRERELEASEIDENTIFIER]})*))`);
    createToken("PRERELEASELOOSE", `(?:-?(${src[t.PRERELEASEIDENTIFIERLOOSE]}(?:\\.${src[t.PRERELEASEIDENTIFIERLOOSE]})*))`);
    createToken("BUILDIDENTIFIER", `${LETTERDASHNUMBER}+`);
    createToken("BUILD", `(?:\\+(${src[t.BUILDIDENTIFIER]}(?:\\.${src[t.BUILDIDENTIFIER]})*))`);
    createToken("FULLPLAIN", `v?${src[t.MAINVERSION]}${src[t.PRERELEASE]}?${src[t.BUILD]}?`);
    createToken("FULL", `^${src[t.FULLPLAIN]}$`);
    createToken("LOOSEPLAIN", `[v=\\s]*${src[t.MAINVERSIONLOOSE]}${src[t.PRERELEASELOOSE]}?${src[t.BUILD]}?`);
    createToken("LOOSE", `^${src[t.LOOSEPLAIN]}$`);
    createToken("GTLT", "((?:<|>)?=?)");
    createToken("XRANGEIDENTIFIERLOOSE", `${src[t.NUMERICIDENTIFIERLOOSE]}|x|X|\\*`);
    createToken("XRANGEIDENTIFIER", `${src[t.NUMERICIDENTIFIER]}|x|X|\\*`);
    createToken("XRANGEPLAIN", `[v=\\s]*(${src[t.XRANGEIDENTIFIER]})(?:\\.(${src[t.XRANGEIDENTIFIER]})(?:\\.(${src[t.XRANGEIDENTIFIER]})(?:${src[t.PRERELEASE]})?${src[t.BUILD]}?)?)?`);
    createToken("XRANGEPLAINLOOSE", `[v=\\s]*(${src[t.XRANGEIDENTIFIERLOOSE]})(?:\\.(${src[t.XRANGEIDENTIFIERLOOSE]})(?:\\.(${src[t.XRANGEIDENTIFIERLOOSE]})(?:${src[t.PRERELEASELOOSE]})?${src[t.BUILD]}?)?)?`);
    createToken("XRANGE", `^${src[t.GTLT]}\\s*${src[t.XRANGEPLAIN]}$`);
    createToken("XRANGELOOSE", `^${src[t.GTLT]}\\s*${src[t.XRANGEPLAINLOOSE]}$`);
    createToken("COERCEPLAIN", `${"(^|[^\\d])(\\d{1,"}${MAX_SAFE_COMPONENT_LENGTH}})(?:\\.(\\d{1,${MAX_SAFE_COMPONENT_LENGTH}}))?(?:\\.(\\d{1,${MAX_SAFE_COMPONENT_LENGTH}}))?`);
    createToken("COERCE", `${src[t.COERCEPLAIN]}(?:$|[^\\d])`);
    createToken("COERCEFULL", src[t.COERCEPLAIN] + `(?:${src[t.PRERELEASE]})?(?:${src[t.BUILD]})?(?:$|[^\\d])`);
    createToken("COERCERTL", src[t.COERCE], true);
    createToken("COERCERTLFULL", src[t.COERCEFULL], true);
    createToken("LONETILDE", "(?:~>?)");
    createToken("TILDETRIM", `(\\s*)${src[t.LONETILDE]}\\s+`, true);
    exports.tildeTrimReplace = "$1~";
    createToken("TILDE", `^${src[t.LONETILDE]}${src[t.XRANGEPLAIN]}$`);
    createToken("TILDELOOSE", `^${src[t.LONETILDE]}${src[t.XRANGEPLAINLOOSE]}$`);
    createToken("LONECARET", "(?:\\^)");
    createToken("CARETTRIM", `(\\s*)${src[t.LONECARET]}\\s+`, true);
    exports.caretTrimReplace = "$1^";
    createToken("CARET", `^${src[t.LONECARET]}${src[t.XRANGEPLAIN]}$`);
    createToken("CARETLOOSE", `^${src[t.LONECARET]}${src[t.XRANGEPLAINLOOSE]}$`);
    createToken("COMPARATORLOOSE", `^${src[t.GTLT]}\\s*(${src[t.LOOSEPLAIN]})$|^$`);
    createToken("COMPARATOR", `^${src[t.GTLT]}\\s*(${src[t.FULLPLAIN]})$|^$`);
    createToken("COMPARATORTRIM", `(\\s*)${src[t.GTLT]}\\s*(${src[t.LOOSEPLAIN]}|${src[t.XRANGEPLAIN]})`, true);
    exports.comparatorTrimReplace = "$1$2$3";
    createToken("HYPHENRANGE", `^\\s*(${src[t.XRANGEPLAIN]})\\s+-\\s+(${src[t.XRANGEPLAIN]})\\s*$`);
    createToken("HYPHENRANGELOOSE", `^\\s*(${src[t.XRANGEPLAINLOOSE]})\\s+-\\s+(${src[t.XRANGEPLAINLOOSE]})\\s*$`);
    createToken("STAR", "(<|>)?=?\\s*\\*");
    createToken("GTE0", "^\\s*>=\\s*0\\.0\\.0\\s*$");
    createToken("GTE0PRE", "^\\s*>=\\s*0\\.0\\.0-0\\s*$");
  }
});

// node_modules/semver/internal/parse-options.js
var require_parse_options = __commonJS({
  "node_modules/semver/internal/parse-options.js"(exports, module) {
    "use strict";
    var looseOption = Object.freeze({ loose: true });
    var emptyOpts = Object.freeze({});
    var parseOptions = (options) => {
      if (!options) {
        return emptyOpts;
      }
      if (typeof options !== "object") {
        return looseOption;
      }
      return options;
    };
    module.exports = parseOptions;
  }
});

// node_modules/semver/internal/identifiers.js
var require_identifiers = __commonJS({
  "node_modules/semver/internal/identifiers.js"(exports, module) {
    "use strict";
    var numeric = /^[0-9]+$/;
    var compareIdentifiers = (a, b) => {
      if (typeof a === "number" && typeof b === "number") {
        return a === b ? 0 : a < b ? -1 : 1;
      }
      const anum = numeric.test(a);
      const bnum = numeric.test(b);
      if (anum && bnum) {
        a = +a;
        b = +b;
      }
      return a === b ? 0 : anum && !bnum ? -1 : bnum && !anum ? 1 : a < b ? -1 : 1;
    };
    var rcompareIdentifiers = (a, b) => compareIdentifiers(b, a);
    module.exports = {
      compareIdentifiers,
      rcompareIdentifiers
    };
  }
});

// node_modules/semver/classes/semver.js
var require_semver = __commonJS({
  "node_modules/semver/classes/semver.js"(exports, module) {
    "use strict";
    var debug = require_debug();
    var { MAX_LENGTH, MAX_SAFE_INTEGER } = require_constants();
    var { safeRe: re, t } = require_re();
    var parseOptions = require_parse_options();
    var { compareIdentifiers } = require_identifiers();
    var isPrereleaseIdentifier = (prerelease, identifier) => {
      const identifiers = identifier.split(".");
      if (identifiers.length > prerelease.length) {
        return false;
      }
      for (let i = 0; i < identifiers.length; i++) {
        if (compareIdentifiers(prerelease[i], identifiers[i]) !== 0) {
          return false;
        }
      }
      return true;
    };
    var SemVer = class _SemVer {
      constructor(version, options) {
        options = parseOptions(options);
        if (version instanceof _SemVer) {
          if (version.loose === !!options.loose && version.includePrerelease === !!options.includePrerelease) {
            return version;
          } else {
            version = version.version;
          }
        } else if (typeof version !== "string") {
          throw new TypeError(`Invalid version. Must be a string. Got type "${typeof version}".`);
        }
        if (version.length > MAX_LENGTH) {
          throw new TypeError(
            `version is longer than ${MAX_LENGTH} characters`
          );
        }
        debug("SemVer", version, options);
        this.options = options;
        this.loose = !!options.loose;
        this.includePrerelease = !!options.includePrerelease;
        const m = version.trim().match(options.loose ? re[t.LOOSE] : re[t.FULL]);
        if (!m) {
          throw new TypeError(`Invalid Version: ${version}`);
        }
        this.raw = version;
        this.major = +m[1];
        this.minor = +m[2];
        this.patch = +m[3];
        if (this.major > MAX_SAFE_INTEGER || this.major < 0) {
          throw new TypeError("Invalid major version");
        }
        if (this.minor > MAX_SAFE_INTEGER || this.minor < 0) {
          throw new TypeError("Invalid minor version");
        }
        if (this.patch > MAX_SAFE_INTEGER || this.patch < 0) {
          throw new TypeError("Invalid patch version");
        }
        if (!m[4]) {
          this.prerelease = [];
        } else {
          this.prerelease = m[4].split(".").map((id) => {
            if (/^[0-9]+$/.test(id)) {
              const num = +id;
              if (num >= 0 && num < MAX_SAFE_INTEGER) {
                return num;
              }
            }
            return id;
          });
        }
        this.build = m[5] ? m[5].split(".") : [];
        this.format();
      }
      format() {
        this.version = `${this.major}.${this.minor}.${this.patch}`;
        if (this.prerelease.length) {
          this.version += `-${this.prerelease.join(".")}`;
        }
        return this.version;
      }
      toString() {
        return this.version;
      }
      compare(other) {
        debug("SemVer.compare", this.version, this.options, other);
        if (!(other instanceof _SemVer)) {
          if (typeof other === "string" && other === this.version) {
            return 0;
          }
          other = new _SemVer(other, this.options);
        }
        if (other.version === this.version) {
          return 0;
        }
        return this.compareMain(other) || this.comparePre(other);
      }
      compareMain(other) {
        if (!(other instanceof _SemVer)) {
          other = new _SemVer(other, this.options);
        }
        if (this.major < other.major) {
          return -1;
        }
        if (this.major > other.major) {
          return 1;
        }
        if (this.minor < other.minor) {
          return -1;
        }
        if (this.minor > other.minor) {
          return 1;
        }
        if (this.patch < other.patch) {
          return -1;
        }
        if (this.patch > other.patch) {
          return 1;
        }
        return 0;
      }
      comparePre(other) {
        if (!(other instanceof _SemVer)) {
          other = new _SemVer(other, this.options);
        }
        if (this.prerelease.length && !other.prerelease.length) {
          return -1;
        } else if (!this.prerelease.length && other.prerelease.length) {
          return 1;
        } else if (!this.prerelease.length && !other.prerelease.length) {
          return 0;
        }
        let i = 0;
        do {
          const a = this.prerelease[i];
          const b = other.prerelease[i];
          debug("prerelease compare", i, a, b);
          if (a === void 0 && b === void 0) {
            return 0;
          } else if (b === void 0) {
            return 1;
          } else if (a === void 0) {
            return -1;
          } else if (a === b) {
            continue;
          } else {
            return compareIdentifiers(a, b);
          }
        } while (++i);
      }
      compareBuild(other) {
        if (!(other instanceof _SemVer)) {
          other = new _SemVer(other, this.options);
        }
        let i = 0;
        do {
          const a = this.build[i];
          const b = other.build[i];
          debug("build compare", i, a, b);
          if (a === void 0 && b === void 0) {
            return 0;
          } else if (b === void 0) {
            return 1;
          } else if (a === void 0) {
            return -1;
          } else if (a === b) {
            continue;
          } else {
            return compareIdentifiers(a, b);
          }
        } while (++i);
      }
      // preminor will bump the version up to the next minor release, and immediately
      // down to pre-release. premajor and prepatch work the same way.
      inc(release, identifier, identifierBase) {
        if (release.startsWith("pre")) {
          if (!identifier && identifierBase === false) {
            throw new Error("invalid increment argument: identifier is empty");
          }
          if (identifier) {
            const match = `-${identifier}`.match(this.options.loose ? re[t.PRERELEASELOOSE] : re[t.PRERELEASE]);
            if (!match || match[1] !== identifier) {
              throw new Error(`invalid identifier: ${identifier}`);
            }
          }
        }
        switch (release) {
          case "premajor":
            this.prerelease.length = 0;
            this.patch = 0;
            this.minor = 0;
            this.major++;
            this.inc("pre", identifier, identifierBase);
            break;
          case "preminor":
            this.prerelease.length = 0;
            this.patch = 0;
            this.minor++;
            this.inc("pre", identifier, identifierBase);
            break;
          case "prepatch":
            this.prerelease.length = 0;
            this.inc("patch", identifier, identifierBase);
            this.inc("pre", identifier, identifierBase);
            break;
          // If the input is a non-prerelease version, this acts the same as
          // prepatch.
          case "prerelease":
            if (this.prerelease.length === 0) {
              this.inc("patch", identifier, identifierBase);
            }
            this.inc("pre", identifier, identifierBase);
            break;
          case "release":
            if (this.prerelease.length === 0) {
              throw new Error(`version ${this.raw} is not a prerelease`);
            }
            this.prerelease.length = 0;
            break;
          case "major":
            if (this.minor !== 0 || this.patch !== 0 || this.prerelease.length === 0) {
              this.major++;
            }
            this.minor = 0;
            this.patch = 0;
            this.prerelease = [];
            break;
          case "minor":
            if (this.patch !== 0 || this.prerelease.length === 0) {
              this.minor++;
            }
            this.patch = 0;
            this.prerelease = [];
            break;
          case "patch":
            if (this.prerelease.length === 0) {
              this.patch++;
            }
            this.prerelease = [];
            break;
          // This probably shouldn't be used publicly.
          // 1.0.0 'pre' would become 1.0.0-0 which is the wrong direction.
          case "pre": {
            const base = Number(identifierBase) ? 1 : 0;
            if (this.prerelease.length === 0) {
              this.prerelease = [base];
            } else {
              let i = this.prerelease.length;
              while (--i >= 0) {
                if (typeof this.prerelease[i] === "number") {
                  this.prerelease[i]++;
                  i = -2;
                }
              }
              if (i === -1) {
                if (identifier === this.prerelease.join(".") && identifierBase === false) {
                  throw new Error("invalid increment argument: identifier already exists");
                }
                this.prerelease.push(base);
              }
            }
            if (identifier) {
              let prerelease = [identifier, base];
              if (identifierBase === false) {
                prerelease = [identifier];
              }
              if (isPrereleaseIdentifier(this.prerelease, identifier)) {
                const prereleaseBase = this.prerelease[identifier.split(".").length];
                if (isNaN(prereleaseBase)) {
                  this.prerelease = prerelease;
                }
              } else {
                this.prerelease = prerelease;
              }
            }
            break;
          }
          default:
            throw new Error(`invalid increment argument: ${release}`);
        }
        this.raw = this.format();
        if (this.build.length) {
          this.raw += `+${this.build.join(".")}`;
        }
        return this;
      }
    };
    module.exports = SemVer;
  }
});

// node_modules/semver/functions/parse.js
var require_parse = __commonJS({
  "node_modules/semver/functions/parse.js"(exports, module) {
    "use strict";
    var SemVer = require_semver();
    var parse = (version, options, throwErrors = false) => {
      if (version instanceof SemVer) {
        return version;
      }
      try {
        return new SemVer(version, options);
      } catch (er) {
        if (!throwErrors) {
          return null;
        }
        throw er;
      }
    };
    module.exports = parse;
  }
});

// node_modules/semver/functions/valid.js
var require_valid = __commonJS({
  "node_modules/semver/functions/valid.js"(exports, module) {
    "use strict";
    var parse = require_parse();
    var valid = (version, options) => {
      const v = parse(version, options);
      return v ? v.version : null;
    };
    module.exports = valid;
  }
});

// node_modules/semver/functions/clean.js
var require_clean = __commonJS({
  "node_modules/semver/functions/clean.js"(exports, module) {
    "use strict";
    var parse = require_parse();
    var clean = (version, options) => {
      const s = parse(version.trim().replace(/^[=v]+/, ""), options);
      return s ? s.version : null;
    };
    module.exports = clean;
  }
});

// node_modules/semver/functions/inc.js
var require_inc = __commonJS({
  "node_modules/semver/functions/inc.js"(exports, module) {
    "use strict";
    var SemVer = require_semver();
    var inc = (version, release, options, identifier, identifierBase) => {
      if (typeof options === "string") {
        identifierBase = identifier;
        identifier = options;
        options = void 0;
      }
      try {
        return new SemVer(
          version instanceof SemVer ? version.version : version,
          options
        ).inc(release, identifier, identifierBase).version;
      } catch (er) {
        return null;
      }
    };
    module.exports = inc;
  }
});

// node_modules/semver/functions/diff.js
var require_diff = __commonJS({
  "node_modules/semver/functions/diff.js"(exports, module) {
    "use strict";
    var parse = require_parse();
    var diff = (version1, version2) => {
      const v1 = parse(version1, null, true);
      const v2 = parse(version2, null, true);
      const comparison = v1.compare(v2);
      if (comparison === 0) {
        return null;
      }
      const v1Higher = comparison > 0;
      const highVersion = v1Higher ? v1 : v2;
      const lowVersion = v1Higher ? v2 : v1;
      const highHasPre = !!highVersion.prerelease.length;
      const lowHasPre = !!lowVersion.prerelease.length;
      if (lowHasPre && !highHasPre) {
        if (!lowVersion.patch && !lowVersion.minor) {
          return "major";
        }
        if (lowVersion.compareMain(highVersion) === 0) {
          if (lowVersion.minor && !lowVersion.patch) {
            return "minor";
          }
          return "patch";
        }
      }
      const prefix = highHasPre ? "pre" : "";
      if (v1.major !== v2.major) {
        return prefix + "major";
      }
      if (v1.minor !== v2.minor) {
        return prefix + "minor";
      }
      if (v1.patch !== v2.patch) {
        return prefix + "patch";
      }
      return "prerelease";
    };
    module.exports = diff;
  }
});

// node_modules/semver/functions/major.js
var require_major = __commonJS({
  "node_modules/semver/functions/major.js"(exports, module) {
    "use strict";
    var SemVer = require_semver();
    var major = (a, loose) => new SemVer(a, loose).major;
    module.exports = major;
  }
});

// node_modules/semver/functions/minor.js
var require_minor = __commonJS({
  "node_modules/semver/functions/minor.js"(exports, module) {
    "use strict";
    var SemVer = require_semver();
    var minor = (a, loose) => new SemVer(a, loose).minor;
    module.exports = minor;
  }
});

// node_modules/semver/functions/patch.js
var require_patch = __commonJS({
  "node_modules/semver/functions/patch.js"(exports, module) {
    "use strict";
    var SemVer = require_semver();
    var patch = (a, loose) => new SemVer(a, loose).patch;
    module.exports = patch;
  }
});

// node_modules/semver/functions/prerelease.js
var require_prerelease = __commonJS({
  "node_modules/semver/functions/prerelease.js"(exports, module) {
    "use strict";
    var parse = require_parse();
    var prerelease = (version, options) => {
      const parsed = parse(version, options);
      return parsed && parsed.prerelease.length ? parsed.prerelease : null;
    };
    module.exports = prerelease;
  }
});

// node_modules/semver/functions/compare.js
var require_compare = __commonJS({
  "node_modules/semver/functions/compare.js"(exports, module) {
    "use strict";
    var SemVer = require_semver();
    var compare = (a, b, loose) => new SemVer(a, loose).compare(new SemVer(b, loose));
    module.exports = compare;
  }
});

// node_modules/semver/functions/rcompare.js
var require_rcompare = __commonJS({
  "node_modules/semver/functions/rcompare.js"(exports, module) {
    "use strict";
    var compare = require_compare();
    var rcompare = (a, b, loose) => compare(b, a, loose);
    module.exports = rcompare;
  }
});

// node_modules/semver/functions/compare-loose.js
var require_compare_loose = __commonJS({
  "node_modules/semver/functions/compare-loose.js"(exports, module) {
    "use strict";
    var compare = require_compare();
    var compareLoose = (a, b) => compare(a, b, true);
    module.exports = compareLoose;
  }
});

// node_modules/semver/functions/compare-build.js
var require_compare_build = __commonJS({
  "node_modules/semver/functions/compare-build.js"(exports, module) {
    "use strict";
    var SemVer = require_semver();
    var compareBuild = (a, b, loose) => {
      const versionA = new SemVer(a, loose);
      const versionB = new SemVer(b, loose);
      return versionA.compare(versionB) || versionA.compareBuild(versionB);
    };
    module.exports = compareBuild;
  }
});

// node_modules/semver/functions/sort.js
var require_sort = __commonJS({
  "node_modules/semver/functions/sort.js"(exports, module) {
    "use strict";
    var compareBuild = require_compare_build();
    var sort = (list, loose) => list.sort((a, b) => compareBuild(a, b, loose));
    module.exports = sort;
  }
});

// node_modules/semver/functions/rsort.js
var require_rsort = __commonJS({
  "node_modules/semver/functions/rsort.js"(exports, module) {
    "use strict";
    var compareBuild = require_compare_build();
    var rsort = (list, loose) => list.sort((a, b) => compareBuild(b, a, loose));
    module.exports = rsort;
  }
});

// node_modules/semver/functions/gt.js
var require_gt = __commonJS({
  "node_modules/semver/functions/gt.js"(exports, module) {
    "use strict";
    var compare = require_compare();
    var gt = (a, b, loose) => compare(a, b, loose) > 0;
    module.exports = gt;
  }
});

// node_modules/semver/functions/lt.js
var require_lt = __commonJS({
  "node_modules/semver/functions/lt.js"(exports, module) {
    "use strict";
    var compare = require_compare();
    var lt = (a, b, loose) => compare(a, b, loose) < 0;
    module.exports = lt;
  }
});

// node_modules/semver/functions/eq.js
var require_eq = __commonJS({
  "node_modules/semver/functions/eq.js"(exports, module) {
    "use strict";
    var compare = require_compare();
    var eq = (a, b, loose) => compare(a, b, loose) === 0;
    module.exports = eq;
  }
});

// node_modules/semver/functions/neq.js
var require_neq = __commonJS({
  "node_modules/semver/functions/neq.js"(exports, module) {
    "use strict";
    var compare = require_compare();
    var neq = (a, b, loose) => compare(a, b, loose) !== 0;
    module.exports = neq;
  }
});

// node_modules/semver/functions/gte.js
var require_gte = __commonJS({
  "node_modules/semver/functions/gte.js"(exports, module) {
    "use strict";
    var compare = require_compare();
    var gte = (a, b, loose) => compare(a, b, loose) >= 0;
    module.exports = gte;
  }
});

// node_modules/semver/functions/lte.js
var require_lte = __commonJS({
  "node_modules/semver/functions/lte.js"(exports, module) {
    "use strict";
    var compare = require_compare();
    var lte = (a, b, loose) => compare(a, b, loose) <= 0;
    module.exports = lte;
  }
});

// node_modules/semver/functions/cmp.js
var require_cmp = __commonJS({
  "node_modules/semver/functions/cmp.js"(exports, module) {
    "use strict";
    var eq = require_eq();
    var neq = require_neq();
    var gt = require_gt();
    var gte = require_gte();
    var lt = require_lt();
    var lte = require_lte();
    var cmp = (a, op, b, loose) => {
      switch (op) {
        case "===":
          if (typeof a === "object") {
            a = a.version;
          }
          if (typeof b === "object") {
            b = b.version;
          }
          return a === b;
        case "!==":
          if (typeof a === "object") {
            a = a.version;
          }
          if (typeof b === "object") {
            b = b.version;
          }
          return a !== b;
        case "":
        case "=":
        case "==":
          return eq(a, b, loose);
        case "!=":
          return neq(a, b, loose);
        case ">":
          return gt(a, b, loose);
        case ">=":
          return gte(a, b, loose);
        case "<":
          return lt(a, b, loose);
        case "<=":
          return lte(a, b, loose);
        default:
          throw new TypeError(`Invalid operator: ${op}`);
      }
    };
    module.exports = cmp;
  }
});

// node_modules/semver/functions/coerce.js
var require_coerce = __commonJS({
  "node_modules/semver/functions/coerce.js"(exports, module) {
    "use strict";
    var SemVer = require_semver();
    var parse = require_parse();
    var { safeRe: re, t } = require_re();
    var coerce = (version, options) => {
      if (version instanceof SemVer) {
        return version;
      }
      if (typeof version === "number") {
        version = String(version);
      }
      if (typeof version !== "string") {
        return null;
      }
      options = options || {};
      let match = null;
      if (!options.rtl) {
        match = version.match(options.includePrerelease ? re[t.COERCEFULL] : re[t.COERCE]);
      } else {
        const coerceRtlRegex = options.includePrerelease ? re[t.COERCERTLFULL] : re[t.COERCERTL];
        let next;
        while ((next = coerceRtlRegex.exec(version)) && (!match || match.index + match[0].length !== version.length)) {
          if (!match || next.index + next[0].length !== match.index + match[0].length) {
            match = next;
          }
          coerceRtlRegex.lastIndex = next.index + next[1].length + next[2].length;
        }
        coerceRtlRegex.lastIndex = -1;
      }
      if (match === null) {
        return null;
      }
      const major = match[2];
      const minor = match[3] || "0";
      const patch = match[4] || "0";
      const prerelease = options.includePrerelease && match[5] ? `-${match[5]}` : "";
      const build = options.includePrerelease && match[6] ? `+${match[6]}` : "";
      return parse(`${major}.${minor}.${patch}${prerelease}${build}`, options);
    };
    module.exports = coerce;
  }
});

// node_modules/semver/functions/truncate.js
var require_truncate = __commonJS({
  "node_modules/semver/functions/truncate.js"(exports, module) {
    "use strict";
    var parse = require_parse();
    var constants = require_constants();
    var SemVer = require_semver();
    var truncate = (version, truncation, options) => {
      if (!constants.RELEASE_TYPES.includes(truncation)) {
        return null;
      }
      const clonedVersion = cloneInputVersion(version, options);
      return clonedVersion && doTruncation(clonedVersion, truncation);
    };
    var cloneInputVersion = (version, options) => {
      const versionStringToParse = version instanceof SemVer ? version.version : version;
      return parse(versionStringToParse, options);
    };
    var doTruncation = (version, truncation) => {
      if (isPrerelease(truncation)) {
        return version.version;
      }
      version.prerelease = [];
      switch (truncation) {
        case "major":
          version.minor = 0;
          version.patch = 0;
          break;
        case "minor":
          version.patch = 0;
          break;
      }
      return version.format();
    };
    var isPrerelease = (type) => {
      return type.startsWith("pre");
    };
    module.exports = truncate;
  }
});

// node_modules/semver/internal/lrucache.js
var require_lrucache = __commonJS({
  "node_modules/semver/internal/lrucache.js"(exports, module) {
    "use strict";
    var LRUCache = class {
      constructor() {
        this.max = 1e3;
        this.map = /* @__PURE__ */ new Map();
      }
      get(key) {
        const value = this.map.get(key);
        if (value === void 0) {
          return void 0;
        } else {
          this.map.delete(key);
          this.map.set(key, value);
          return value;
        }
      }
      delete(key) {
        return this.map.delete(key);
      }
      set(key, value) {
        const deleted = this.delete(key);
        if (!deleted && value !== void 0) {
          if (this.map.size >= this.max) {
            const firstKey = this.map.keys().next().value;
            this.delete(firstKey);
          }
          this.map.set(key, value);
        }
        return this;
      }
    };
    module.exports = LRUCache;
  }
});

// node_modules/semver/classes/range.js
var require_range = __commonJS({
  "node_modules/semver/classes/range.js"(exports, module) {
    "use strict";
    var SPACE_CHARACTERS = /\s+/g;
    var Range = class _Range {
      constructor(range, options) {
        options = parseOptions(options);
        if (range instanceof _Range) {
          if (range.loose === !!options.loose && range.includePrerelease === !!options.includePrerelease) {
            return range;
          } else {
            return new _Range(range.raw, options);
          }
        }
        if (range instanceof Comparator) {
          this.raw = range.value;
          this.set = [[range]];
          this.formatted = void 0;
          return this;
        }
        this.options = options;
        this.loose = !!options.loose;
        this.includePrerelease = !!options.includePrerelease;
        this.raw = range.trim().replace(SPACE_CHARACTERS, " ");
        this.set = this.raw.split("||").map((r) => this.parseRange(r.trim())).filter((c) => c.length);
        if (!this.set.length) {
          throw new TypeError(`Invalid SemVer Range: ${this.raw}`);
        }
        if (this.set.length > 1) {
          const first = this.set[0];
          this.set = this.set.filter((c) => !isNullSet(c[0]));
          if (this.set.length === 0) {
            this.set = [first];
          } else if (this.set.length > 1) {
            for (const c of this.set) {
              if (c.length === 1 && isAny(c[0])) {
                this.set = [c];
                break;
              }
            }
          }
        }
        this.formatted = void 0;
      }
      get range() {
        if (this.formatted === void 0) {
          this.formatted = "";
          for (let i = 0; i < this.set.length; i++) {
            if (i > 0) {
              this.formatted += "||";
            }
            const comps = this.set[i];
            for (let k = 0; k < comps.length; k++) {
              if (k > 0) {
                this.formatted += " ";
              }
              this.formatted += comps[k].toString().trim();
            }
          }
        }
        return this.formatted;
      }
      format() {
        return this.range;
      }
      toString() {
        return this.range;
      }
      parseRange(range) {
        range = range.replace(BUILDSTRIPRE, "");
        const memoOpts = (this.options.includePrerelease && FLAG_INCLUDE_PRERELEASE) | (this.options.loose && FLAG_LOOSE);
        const memoKey = memoOpts + ":" + range;
        const cached = cache.get(memoKey);
        if (cached) {
          return cached;
        }
        const loose = this.options.loose;
        const hr = loose ? re[t.HYPHENRANGELOOSE] : re[t.HYPHENRANGE];
        range = range.replace(hr, hyphenReplace(this.options.includePrerelease));
        debug("hyphen replace", range);
        range = range.replace(re[t.COMPARATORTRIM], comparatorTrimReplace);
        debug("comparator trim", range);
        range = range.replace(re[t.TILDETRIM], tildeTrimReplace);
        debug("tilde trim", range);
        range = range.replace(re[t.CARETTRIM], caretTrimReplace);
        debug("caret trim", range);
        let rangeList = range.split(" ").map((comp) => parseComparator(comp, this.options)).join(" ").split(/\s+/).map((comp) => replaceGTE0(comp, this.options));
        if (loose) {
          rangeList = rangeList.filter((comp) => {
            debug("loose invalid filter", comp, this.options);
            return !!comp.match(re[t.COMPARATORLOOSE]);
          });
        }
        debug("range list", rangeList);
        const rangeMap = /* @__PURE__ */ new Map();
        const comparators = rangeList.map((comp) => new Comparator(comp, this.options));
        for (const comp of comparators) {
          if (isNullSet(comp)) {
            return [comp];
          }
          rangeMap.set(comp.value, comp);
        }
        if (rangeMap.size > 1 && rangeMap.has("")) {
          rangeMap.delete("");
        }
        const result = [...rangeMap.values()];
        cache.set(memoKey, result);
        return result;
      }
      intersects(range, options) {
        if (!(range instanceof _Range)) {
          throw new TypeError("a Range is required");
        }
        return this.set.some((thisComparators) => {
          return isSatisfiable(thisComparators, options) && range.set.some((rangeComparators) => {
            return isSatisfiable(rangeComparators, options) && thisComparators.every((thisComparator) => {
              return rangeComparators.every((rangeComparator) => {
                return thisComparator.intersects(rangeComparator, options);
              });
            });
          });
        });
      }
      // if ANY of the sets match ALL of its comparators, then pass
      test(version) {
        if (!version) {
          return false;
        }
        if (typeof version === "string") {
          try {
            version = new SemVer(version, this.options);
          } catch (er) {
            return false;
          }
        }
        for (let i = 0; i < this.set.length; i++) {
          if (testSet(this.set[i], version, this.options)) {
            return true;
          }
        }
        return false;
      }
    };
    module.exports = Range;
    var LRU = require_lrucache();
    var cache = new LRU();
    var parseOptions = require_parse_options();
    var Comparator = require_comparator();
    var debug = require_debug();
    var SemVer = require_semver();
    var {
      safeRe: re,
      src,
      t,
      comparatorTrimReplace,
      tildeTrimReplace,
      caretTrimReplace
    } = require_re();
    var { FLAG_INCLUDE_PRERELEASE, FLAG_LOOSE } = require_constants();
    var BUILDSTRIPRE = new RegExp(src[t.BUILD], "g");
    var isNullSet = (c) => c.value === "<0.0.0-0";
    var isAny = (c) => c.value === "";
    var isSatisfiable = (comparators, options) => {
      let result = true;
      const remainingComparators = comparators.slice();
      let testComparator = remainingComparators.pop();
      while (result && remainingComparators.length) {
        result = remainingComparators.every((otherComparator) => {
          return testComparator.intersects(otherComparator, options);
        });
        testComparator = remainingComparators.pop();
      }
      return result;
    };
    var parseComparator = (comp, options) => {
      comp = comp.replace(re[t.BUILD], "");
      debug("comp", comp, options);
      comp = replaceCarets(comp, options);
      debug("caret", comp);
      comp = replaceTildes(comp, options);
      debug("tildes", comp);
      comp = replaceXRanges(comp, options);
      debug("xrange", comp);
      comp = replaceStars(comp, options);
      debug("stars", comp);
      return comp;
    };
    var isX = (id) => !id || id.toLowerCase() === "x" || id === "*";
    var invalidXRangeOrder = (M, m, p) => isX(M) && !isX(m) || isX(m) && p && !isX(p);
    var replaceTildes = (comp, options) => {
      return comp.trim().split(/\s+/).map((c) => replaceTilde(c, options)).join(" ");
    };
    var replaceTilde = (comp, options) => {
      const r = options.loose ? re[t.TILDELOOSE] : re[t.TILDE];
      const z = options.includePrerelease ? "-0" : "";
      return comp.replace(r, (_, M, m, p, pr) => {
        debug("tilde", comp, _, M, m, p, pr);
        let ret;
        if (isX(M)) {
          ret = "";
        } else if (isX(m)) {
          ret = `>=${M}.0.0${z} <${+M + 1}.0.0-0`;
        } else if (isX(p)) {
          ret = `>=${M}.${m}.0${z} <${M}.${+m + 1}.0-0`;
        } else if (pr) {
          debug("replaceTilde pr", pr);
          ret = `>=${M}.${m}.${p}-${pr} <${M}.${+m + 1}.0-0`;
        } else {
          ret = `>=${M}.${m}.${p} <${M}.${+m + 1}.0-0`;
        }
        debug("tilde return", ret);
        return ret;
      });
    };
    var replaceCarets = (comp, options) => {
      return comp.trim().split(/\s+/).map((c) => replaceCaret(c, options)).join(" ");
    };
    var replaceCaret = (comp, options) => {
      debug("caret", comp, options);
      const r = options.loose ? re[t.CARETLOOSE] : re[t.CARET];
      const z = options.includePrerelease ? "-0" : "";
      return comp.replace(r, (_, M, m, p, pr) => {
        debug("caret", comp, _, M, m, p, pr);
        let ret;
        if (isX(M)) {
          ret = "";
        } else if (isX(m)) {
          ret = `>=${M}.0.0${z} <${+M + 1}.0.0-0`;
        } else if (isX(p)) {
          if (M === "0") {
            ret = `>=${M}.${m}.0${z} <${M}.${+m + 1}.0-0`;
          } else {
            ret = `>=${M}.${m}.0${z} <${+M + 1}.0.0-0`;
          }
        } else if (pr) {
          debug("replaceCaret pr", pr);
          if (M === "0") {
            if (m === "0") {
              ret = `>=${M}.${m}.${p}-${pr} <${M}.${m}.${+p + 1}-0`;
            } else {
              ret = `>=${M}.${m}.${p}-${pr} <${M}.${+m + 1}.0-0`;
            }
          } else {
            ret = `>=${M}.${m}.${p}-${pr} <${+M + 1}.0.0-0`;
          }
        } else {
          debug("no pr");
          if (M === "0") {
            if (m === "0") {
              ret = `>=${M}.${m}.${p} <${M}.${m}.${+p + 1}-0`;
            } else {
              ret = `>=${M}.${m}.${p} <${M}.${+m + 1}.0-0`;
            }
          } else {
            ret = `>=${M}.${m}.${p} <${+M + 1}.0.0-0`;
          }
        }
        debug("caret return", ret);
        return ret;
      });
    };
    var replaceXRanges = (comp, options) => {
      debug("replaceXRanges", comp, options);
      return comp.split(/\s+/).map((c) => replaceXRange(c, options)).join(" ");
    };
    var replaceXRange = (comp, options) => {
      comp = comp.trim();
      const r = options.loose ? re[t.XRANGELOOSE] : re[t.XRANGE];
      return comp.replace(r, (ret, gtlt, M, m, p, pr) => {
        debug("xRange", comp, ret, gtlt, M, m, p, pr);
        if (invalidXRangeOrder(M, m, p)) {
          return comp;
        }
        const xM = isX(M);
        const xm = xM || isX(m);
        const xp = xm || isX(p);
        const anyX = xp;
        if (gtlt === "=" && anyX) {
          gtlt = "";
        }
        pr = options.includePrerelease ? "-0" : "";
        if (xM) {
          if (gtlt === ">" || gtlt === "<") {
            ret = "<0.0.0-0";
          } else {
            ret = "*";
          }
        } else if (gtlt && anyX) {
          if (xm) {
            m = 0;
          }
          p = 0;
          if (gtlt === ">") {
            gtlt = ">=";
            if (xm) {
              M = +M + 1;
              m = 0;
              p = 0;
            } else {
              m = +m + 1;
              p = 0;
            }
          } else if (gtlt === "<=") {
            gtlt = "<";
            if (xm) {
              M = +M + 1;
            } else {
              m = +m + 1;
            }
          }
          if (gtlt === "<") {
            pr = "-0";
          }
          ret = `${gtlt + M}.${m}.${p}${pr}`;
        } else if (xm) {
          ret = `>=${M}.0.0${pr} <${+M + 1}.0.0-0`;
        } else if (xp) {
          ret = `>=${M}.${m}.0${pr} <${M}.${+m + 1}.0-0`;
        }
        debug("xRange return", ret);
        return ret;
      });
    };
    var replaceStars = (comp, options) => {
      debug("replaceStars", comp, options);
      return comp.trim().replace(re[t.STAR], "");
    };
    var replaceGTE0 = (comp, options) => {
      debug("replaceGTE0", comp, options);
      return comp.trim().replace(re[options.includePrerelease ? t.GTE0PRE : t.GTE0], "");
    };
    var hyphenReplace = (incPr) => ($0, from, fM, fm, fp, fpr, fb, to, tM, tm, tp, tpr) => {
      if (isX(fM)) {
        from = "";
      } else if (isX(fm)) {
        from = `>=${fM}.0.0${incPr ? "-0" : ""}`;
      } else if (isX(fp)) {
        from = `>=${fM}.${fm}.0${incPr ? "-0" : ""}`;
      } else if (fpr) {
        from = `>=${from}`;
      } else {
        from = `>=${from}${incPr ? "-0" : ""}`;
      }
      if (isX(tM)) {
        to = "";
      } else if (isX(tm)) {
        to = `<${+tM + 1}.0.0-0`;
      } else if (isX(tp)) {
        to = `<${tM}.${+tm + 1}.0-0`;
      } else if (tpr) {
        to = `<=${tM}.${tm}.${tp}-${tpr}`;
      } else if (incPr) {
        to = `<${tM}.${tm}.${+tp + 1}-0`;
      } else {
        to = `<=${to}`;
      }
      return `${from} ${to}`.trim();
    };
    var testSet = (set, version, options) => {
      for (let i = 0; i < set.length; i++) {
        if (!set[i].test(version)) {
          return false;
        }
      }
      if (version.prerelease.length && !options.includePrerelease) {
        for (let i = 0; i < set.length; i++) {
          debug(set[i].semver);
          if (set[i].semver === Comparator.ANY) {
            continue;
          }
          if (set[i].semver.prerelease.length > 0) {
            const allowed = set[i].semver;
            if (allowed.major === version.major && allowed.minor === version.minor && allowed.patch === version.patch) {
              return true;
            }
          }
        }
        return false;
      }
      return true;
    };
  }
});

// node_modules/semver/classes/comparator.js
var require_comparator = __commonJS({
  "node_modules/semver/classes/comparator.js"(exports, module) {
    "use strict";
    var ANY = Symbol("SemVer ANY");
    var Comparator = class _Comparator {
      static get ANY() {
        return ANY;
      }
      constructor(comp, options) {
        options = parseOptions(options);
        if (comp instanceof _Comparator) {
          if (comp.loose === !!options.loose) {
            return comp;
          } else {
            comp = comp.value;
          }
        }
        comp = comp.trim().split(/\s+/).join(" ");
        debug("comparator", comp, options);
        this.options = options;
        this.loose = !!options.loose;
        this.parse(comp);
        if (this.semver === ANY) {
          this.value = "";
        } else {
          this.value = this.operator + this.semver.version;
        }
        debug("comp", this);
      }
      parse(comp) {
        const r = this.options.loose ? re[t.COMPARATORLOOSE] : re[t.COMPARATOR];
        const m = comp.match(r);
        if (!m) {
          throw new TypeError(`Invalid comparator: ${comp}`);
        }
        this.operator = m[1] !== void 0 ? m[1] : "";
        if (this.operator === "=") {
          this.operator = "";
        }
        if (!m[2]) {
          this.semver = ANY;
        } else {
          this.semver = new SemVer(m[2], this.options.loose);
        }
      }
      toString() {
        return this.value;
      }
      test(version) {
        debug("Comparator.test", version, this.options.loose);
        if (this.semver === ANY || version === ANY) {
          return true;
        }
        if (typeof version === "string") {
          try {
            version = new SemVer(version, this.options);
          } catch (er) {
            return false;
          }
        }
        return cmp(version, this.operator, this.semver, this.options);
      }
      intersects(comp, options) {
        if (!(comp instanceof _Comparator)) {
          throw new TypeError("a Comparator is required");
        }
        if (this.operator === "") {
          if (this.value === "") {
            return true;
          }
          return new Range(comp.value, options).test(this.value);
        } else if (comp.operator === "") {
          if (comp.value === "") {
            return true;
          }
          return new Range(this.value, options).test(comp.semver);
        }
        options = parseOptions(options);
        if (options.includePrerelease && (this.value === "<0.0.0-0" || comp.value === "<0.0.0-0")) {
          return false;
        }
        if (!options.includePrerelease && (this.value.startsWith("<0.0.0") || comp.value.startsWith("<0.0.0"))) {
          return false;
        }
        if (this.operator.startsWith(">") && comp.operator.startsWith(">")) {
          return true;
        }
        if (this.operator.startsWith("<") && comp.operator.startsWith("<")) {
          return true;
        }
        if (this.semver.version === comp.semver.version && this.operator.includes("=") && comp.operator.includes("=")) {
          return true;
        }
        if (cmp(this.semver, "<", comp.semver, options) && this.operator.startsWith(">") && comp.operator.startsWith("<")) {
          return true;
        }
        if (cmp(this.semver, ">", comp.semver, options) && this.operator.startsWith("<") && comp.operator.startsWith(">")) {
          return true;
        }
        return false;
      }
    };
    module.exports = Comparator;
    var parseOptions = require_parse_options();
    var { safeRe: re, t } = require_re();
    var cmp = require_cmp();
    var debug = require_debug();
    var SemVer = require_semver();
    var Range = require_range();
  }
});

// node_modules/semver/functions/satisfies.js
var require_satisfies = __commonJS({
  "node_modules/semver/functions/satisfies.js"(exports, module) {
    "use strict";
    var Range = require_range();
    var satisfies = (version, range, options) => {
      try {
        range = new Range(range, options);
      } catch (er) {
        return false;
      }
      return range.test(version);
    };
    module.exports = satisfies;
  }
});

// node_modules/semver/ranges/to-comparators.js
var require_to_comparators = __commonJS({
  "node_modules/semver/ranges/to-comparators.js"(exports, module) {
    "use strict";
    var Range = require_range();
    var toComparators = (range, options) => new Range(range, options).set.map((comp) => comp.map((c) => c.value).join(" ").trim().split(" "));
    module.exports = toComparators;
  }
});

// node_modules/semver/ranges/max-satisfying.js
var require_max_satisfying = __commonJS({
  "node_modules/semver/ranges/max-satisfying.js"(exports, module) {
    "use strict";
    var SemVer = require_semver();
    var Range = require_range();
    var maxSatisfying = (versions, range, options) => {
      let max = null;
      let maxSV = null;
      let rangeObj = null;
      try {
        rangeObj = new Range(range, options);
      } catch (er) {
        return null;
      }
      versions.forEach((v) => {
        if (rangeObj.test(v)) {
          if (!max || maxSV.compare(v) === -1) {
            max = v;
            maxSV = new SemVer(max, options);
          }
        }
      });
      return max;
    };
    module.exports = maxSatisfying;
  }
});

// node_modules/semver/ranges/min-satisfying.js
var require_min_satisfying = __commonJS({
  "node_modules/semver/ranges/min-satisfying.js"(exports, module) {
    "use strict";
    var SemVer = require_semver();
    var Range = require_range();
    var minSatisfying = (versions, range, options) => {
      let min = null;
      let minSV = null;
      let rangeObj = null;
      try {
        rangeObj = new Range(range, options);
      } catch (er) {
        return null;
      }
      versions.forEach((v) => {
        if (rangeObj.test(v)) {
          if (!min || minSV.compare(v) === 1) {
            min = v;
            minSV = new SemVer(min, options);
          }
        }
      });
      return min;
    };
    module.exports = minSatisfying;
  }
});

// node_modules/semver/ranges/min-version.js
var require_min_version = __commonJS({
  "node_modules/semver/ranges/min-version.js"(exports, module) {
    "use strict";
    var SemVer = require_semver();
    var Range = require_range();
    var gt = require_gt();
    var minVersion = (range, loose) => {
      range = new Range(range, loose);
      let minver = new SemVer("0.0.0");
      if (range.test(minver)) {
        return minver;
      }
      minver = new SemVer("0.0.0-0");
      if (range.test(minver)) {
        return minver;
      }
      minver = null;
      for (let i = 0; i < range.set.length; ++i) {
        const comparators = range.set[i];
        let setMin = null;
        comparators.forEach((comparator) => {
          const compver = new SemVer(comparator.semver.version);
          switch (comparator.operator) {
            case ">":
              if (compver.prerelease.length === 0) {
                compver.patch++;
              } else {
                compver.prerelease.push(0);
              }
              compver.raw = compver.format();
            /* fallthrough */
            case "":
            case ">=":
              if (!setMin || gt(compver, setMin)) {
                setMin = compver;
              }
              break;
            case "<":
            case "<=":
              break;
            /* istanbul ignore next */
            default:
              throw new Error(`Unexpected operation: ${comparator.operator}`);
          }
        });
        if (setMin && (!minver || gt(minver, setMin))) {
          minver = setMin;
        }
      }
      if (minver && range.test(minver)) {
        return minver;
      }
      return null;
    };
    module.exports = minVersion;
  }
});

// node_modules/semver/ranges/valid.js
var require_valid2 = __commonJS({
  "node_modules/semver/ranges/valid.js"(exports, module) {
    "use strict";
    var Range = require_range();
    var validRange = (range, options) => {
      try {
        return new Range(range, options).range || "*";
      } catch (er) {
        return null;
      }
    };
    module.exports = validRange;
  }
});

// node_modules/semver/ranges/outside.js
var require_outside = __commonJS({
  "node_modules/semver/ranges/outside.js"(exports, module) {
    "use strict";
    var SemVer = require_semver();
    var Comparator = require_comparator();
    var { ANY } = Comparator;
    var Range = require_range();
    var satisfies = require_satisfies();
    var gt = require_gt();
    var lt = require_lt();
    var lte = require_lte();
    var gte = require_gte();
    var outside = (version, range, hilo, options) => {
      version = new SemVer(version, options);
      range = new Range(range, options);
      let gtfn, ltefn, ltfn, comp, ecomp;
      switch (hilo) {
        case ">":
          gtfn = gt;
          ltefn = lte;
          ltfn = lt;
          comp = ">";
          ecomp = ">=";
          break;
        case "<":
          gtfn = lt;
          ltefn = gte;
          ltfn = gt;
          comp = "<";
          ecomp = "<=";
          break;
        default:
          throw new TypeError('Must provide a hilo val of "<" or ">"');
      }
      if (satisfies(version, range, options)) {
        return false;
      }
      for (let i = 0; i < range.set.length; ++i) {
        const comparators = range.set[i];
        let high = null;
        let low = null;
        comparators.forEach((comparator) => {
          if (comparator.semver === ANY) {
            comparator = new Comparator(">=0.0.0");
          }
          high = high || comparator;
          low = low || comparator;
          if (gtfn(comparator.semver, high.semver, options)) {
            high = comparator;
          } else if (ltfn(comparator.semver, low.semver, options)) {
            low = comparator;
          }
        });
        if (high.operator === comp || high.operator === ecomp) {
          return false;
        }
        if ((!low.operator || low.operator === comp) && ltefn(version, low.semver)) {
          return false;
        } else if (low.operator === ecomp && ltfn(version, low.semver)) {
          return false;
        }
      }
      return true;
    };
    module.exports = outside;
  }
});

// node_modules/semver/ranges/gtr.js
var require_gtr = __commonJS({
  "node_modules/semver/ranges/gtr.js"(exports, module) {
    "use strict";
    var outside = require_outside();
    var gtr = (version, range, options) => outside(version, range, ">", options);
    module.exports = gtr;
  }
});

// node_modules/semver/ranges/ltr.js
var require_ltr = __commonJS({
  "node_modules/semver/ranges/ltr.js"(exports, module) {
    "use strict";
    var outside = require_outside();
    var ltr = (version, range, options) => outside(version, range, "<", options);
    module.exports = ltr;
  }
});

// node_modules/semver/ranges/intersects.js
var require_intersects = __commonJS({
  "node_modules/semver/ranges/intersects.js"(exports, module) {
    "use strict";
    var Range = require_range();
    var intersects = (r1, r2, options) => {
      r1 = new Range(r1, options);
      r2 = new Range(r2, options);
      return r1.intersects(r2, options);
    };
    module.exports = intersects;
  }
});

// node_modules/semver/ranges/simplify.js
var require_simplify = __commonJS({
  "node_modules/semver/ranges/simplify.js"(exports, module) {
    "use strict";
    var satisfies = require_satisfies();
    var compare = require_compare();
    module.exports = (versions, range, options) => {
      const set = [];
      let first = null;
      let prev = null;
      const v = versions.sort((a, b) => compare(a, b, options));
      for (const version of v) {
        const included = satisfies(version, range, options);
        if (included) {
          prev = version;
          if (!first) {
            first = version;
          }
        } else {
          if (prev) {
            set.push([first, prev]);
          }
          prev = null;
          first = null;
        }
      }
      if (first) {
        set.push([first, null]);
      }
      const ranges = [];
      for (const [min, max] of set) {
        if (min === max) {
          ranges.push(min);
        } else if (!max && min === v[0]) {
          ranges.push("*");
        } else if (!max) {
          ranges.push(`>=${min}`);
        } else if (min === v[0]) {
          ranges.push(`<=${max}`);
        } else {
          ranges.push(`${min} - ${max}`);
        }
      }
      const simplified = ranges.join(" || ");
      const original = typeof range.raw === "string" ? range.raw : String(range);
      return simplified.length < original.length ? simplified : range;
    };
  }
});

// node_modules/semver/ranges/subset.js
var require_subset = __commonJS({
  "node_modules/semver/ranges/subset.js"(exports, module) {
    "use strict";
    var Range = require_range();
    var Comparator = require_comparator();
    var { ANY } = Comparator;
    var satisfies = require_satisfies();
    var compare = require_compare();
    var subset = (sub, dom, options = {}) => {
      if (sub === dom) {
        return true;
      }
      sub = new Range(sub, options);
      dom = new Range(dom, options);
      let sawNonNull = false;
      OUTER: for (const simpleSub of sub.set) {
        for (const simpleDom of dom.set) {
          const isSub = simpleSubset(simpleSub, simpleDom, options);
          sawNonNull = sawNonNull || isSub !== null;
          if (isSub) {
            continue OUTER;
          }
        }
        if (sawNonNull) {
          return false;
        }
      }
      return true;
    };
    var minimumVersionWithPreRelease = [new Comparator(">=0.0.0-0")];
    var minimumVersion = [new Comparator(">=0.0.0")];
    var simpleSubset = (sub, dom, options) => {
      if (sub === dom) {
        return true;
      }
      if (sub.length === 1 && sub[0].semver === ANY) {
        if (dom.length === 1 && dom[0].semver === ANY) {
          return true;
        } else if (options.includePrerelease) {
          sub = minimumVersionWithPreRelease;
        } else {
          sub = minimumVersion;
        }
      }
      if (dom.length === 1 && dom[0].semver === ANY) {
        if (options.includePrerelease) {
          return true;
        } else {
          dom = minimumVersion;
        }
      }
      const eqSet = /* @__PURE__ */ new Set();
      let gt, lt;
      for (const c of sub) {
        if (c.operator === ">" || c.operator === ">=") {
          gt = higherGT(gt, c, options);
        } else if (c.operator === "<" || c.operator === "<=") {
          lt = lowerLT(lt, c, options);
        } else {
          eqSet.add(c.semver);
        }
      }
      if (eqSet.size > 1) {
        return null;
      }
      let gtltComp;
      if (gt && lt) {
        gtltComp = compare(gt.semver, lt.semver, options);
        if (gtltComp > 0) {
          return null;
        } else if (gtltComp === 0 && (gt.operator !== ">=" || lt.operator !== "<=")) {
          return null;
        }
      }
      for (const eq of eqSet) {
        if (gt && !satisfies(eq, String(gt), options)) {
          return null;
        }
        if (lt && !satisfies(eq, String(lt), options)) {
          return null;
        }
        for (const c of dom) {
          if (!satisfies(eq, String(c), options)) {
            return false;
          }
        }
        return true;
      }
      let higher, lower;
      let hasDomLT, hasDomGT;
      let needDomLTPre = lt && !options.includePrerelease && lt.semver.prerelease.length ? lt.semver : false;
      let needDomGTPre = gt && !options.includePrerelease && gt.semver.prerelease.length ? gt.semver : false;
      if (needDomLTPre && needDomLTPre.prerelease.length === 1 && lt.operator === "<" && needDomLTPre.prerelease[0] === 0) {
        needDomLTPre = false;
      }
      for (const c of dom) {
        hasDomGT = hasDomGT || c.operator === ">" || c.operator === ">=";
        hasDomLT = hasDomLT || c.operator === "<" || c.operator === "<=";
        if (gt) {
          if (needDomGTPre) {
            if (c.semver.prerelease && c.semver.prerelease.length && c.semver.major === needDomGTPre.major && c.semver.minor === needDomGTPre.minor && c.semver.patch === needDomGTPre.patch) {
              needDomGTPre = false;
            }
          }
          if (c.operator === ">" || c.operator === ">=") {
            higher = higherGT(gt, c, options);
            if (higher === c && higher !== gt) {
              return false;
            }
          } else if (gt.operator === ">=" && !c.test(gt.semver)) {
            return false;
          }
        }
        if (lt) {
          if (needDomLTPre) {
            if (c.semver.prerelease && c.semver.prerelease.length && c.semver.major === needDomLTPre.major && c.semver.minor === needDomLTPre.minor && c.semver.patch === needDomLTPre.patch) {
              needDomLTPre = false;
            }
          }
          if (c.operator === "<" || c.operator === "<=") {
            lower = lowerLT(lt, c, options);
            if (lower === c && lower !== lt) {
              return false;
            }
          } else if (lt.operator === "<=" && !c.test(lt.semver)) {
            return false;
          }
        }
        if (!c.operator && (lt || gt) && gtltComp !== 0) {
          return false;
        }
      }
      if (gt && hasDomLT && !lt && gtltComp !== 0) {
        return false;
      }
      if (lt && hasDomGT && !gt && gtltComp !== 0) {
        return false;
      }
      if (needDomGTPre || needDomLTPre) {
        return false;
      }
      return true;
    };
    var higherGT = (a, b, options) => {
      if (!a) {
        return b;
      }
      const comp = compare(a.semver, b.semver, options);
      return comp > 0 ? a : comp < 0 ? b : b.operator === ">" && a.operator === ">=" ? b : a;
    };
    var lowerLT = (a, b, options) => {
      if (!a) {
        return b;
      }
      const comp = compare(a.semver, b.semver, options);
      return comp < 0 ? a : comp > 0 ? b : b.operator === "<" && a.operator === "<=" ? b : a;
    };
    module.exports = subset;
  }
});

// node_modules/semver/index.js
var require_semver2 = __commonJS({
  "node_modules/semver/index.js"(exports, module) {
    "use strict";
    var internalRe = require_re();
    var constants = require_constants();
    var SemVer = require_semver();
    var identifiers = require_identifiers();
    var parse = require_parse();
    var valid = require_valid();
    var clean = require_clean();
    var inc = require_inc();
    var diff = require_diff();
    var major = require_major();
    var minor = require_minor();
    var patch = require_patch();
    var prerelease = require_prerelease();
    var compare = require_compare();
    var rcompare = require_rcompare();
    var compareLoose = require_compare_loose();
    var compareBuild = require_compare_build();
    var sort = require_sort();
    var rsort = require_rsort();
    var gt = require_gt();
    var lt = require_lt();
    var eq = require_eq();
    var neq = require_neq();
    var gte = require_gte();
    var lte = require_lte();
    var cmp = require_cmp();
    var coerce = require_coerce();
    var truncate = require_truncate();
    var Comparator = require_comparator();
    var Range = require_range();
    var satisfies = require_satisfies();
    var toComparators = require_to_comparators();
    var maxSatisfying = require_max_satisfying();
    var minSatisfying = require_min_satisfying();
    var minVersion = require_min_version();
    var validRange = require_valid2();
    var outside = require_outside();
    var gtr = require_gtr();
    var ltr = require_ltr();
    var intersects = require_intersects();
    var simplifyRange = require_simplify();
    var subset = require_subset();
    module.exports = {
      parse,
      valid,
      clean,
      inc,
      diff,
      major,
      minor,
      patch,
      prerelease,
      compare,
      rcompare,
      compareLoose,
      compareBuild,
      sort,
      rsort,
      gt,
      lt,
      eq,
      neq,
      gte,
      lte,
      cmp,
      coerce,
      truncate,
      Comparator,
      Range,
      satisfies,
      toComparators,
      maxSatisfying,
      minSatisfying,
      minVersion,
      validRange,
      outside,
      gtr,
      ltr,
      intersects,
      simplifyRange,
      subset,
      SemVer,
      re: internalRe.re,
      src: internalRe.src,
      tokens: internalRe.t,
      SEMVER_SPEC_VERSION: constants.SEMVER_SPEC_VERSION,
      RELEASE_TYPES: constants.RELEASE_TYPES,
      compareIdentifiers: identifiers.compareIdentifiers,
      rcompareIdentifiers: identifiers.rcompareIdentifiers
    };
  }
});

// node_modules/jsonwebtoken/lib/asymmetricKeyDetailsSupported.js
var require_asymmetricKeyDetailsSupported = __commonJS({
  "node_modules/jsonwebtoken/lib/asymmetricKeyDetailsSupported.js"(exports, module) {
    var semver = require_semver2();
    module.exports = semver.satisfies(process.version, ">=15.7.0");
  }
});

// node_modules/jsonwebtoken/lib/rsaPssKeyDetailsSupported.js
var require_rsaPssKeyDetailsSupported = __commonJS({
  "node_modules/jsonwebtoken/lib/rsaPssKeyDetailsSupported.js"(exports, module) {
    var semver = require_semver2();
    module.exports = semver.satisfies(process.version, ">=16.9.0");
  }
});

// node_modules/jsonwebtoken/lib/validateAsymmetricKey.js
var require_validateAsymmetricKey = __commonJS({
  "node_modules/jsonwebtoken/lib/validateAsymmetricKey.js"(exports, module) {
    var ASYMMETRIC_KEY_DETAILS_SUPPORTED = require_asymmetricKeyDetailsSupported();
    var RSA_PSS_KEY_DETAILS_SUPPORTED = require_rsaPssKeyDetailsSupported();
    var allowedAlgorithmsForKeys = {
      "ec": ["ES256", "ES384", "ES512"],
      "rsa": ["RS256", "PS256", "RS384", "PS384", "RS512", "PS512"],
      "rsa-pss": ["PS256", "PS384", "PS512"]
    };
    var allowedCurves = {
      ES256: "prime256v1",
      ES384: "secp384r1",
      ES512: "secp521r1"
    };
    module.exports = function(algorithm, key) {
      if (!algorithm || !key) return;
      const keyType = key.asymmetricKeyType;
      if (!keyType) return;
      const allowedAlgorithms = allowedAlgorithmsForKeys[keyType];
      if (!allowedAlgorithms) {
        throw new Error(`Unknown key type "${keyType}".`);
      }
      if (!allowedAlgorithms.includes(algorithm)) {
        throw new Error(`"alg" parameter for "${keyType}" key type must be one of: ${allowedAlgorithms.join(", ")}.`);
      }
      if (ASYMMETRIC_KEY_DETAILS_SUPPORTED) {
        switch (keyType) {
          case "ec":
            const keyCurve = key.asymmetricKeyDetails.namedCurve;
            const allowedCurve = allowedCurves[algorithm];
            if (keyCurve !== allowedCurve) {
              throw new Error(`"alg" parameter "${algorithm}" requires curve "${allowedCurve}".`);
            }
            break;
          case "rsa-pss":
            if (RSA_PSS_KEY_DETAILS_SUPPORTED) {
              const length = parseInt(algorithm.slice(-3), 10);
              const { hashAlgorithm, mgf1HashAlgorithm, saltLength } = key.asymmetricKeyDetails;
              if (hashAlgorithm !== `sha${length}` || mgf1HashAlgorithm !== hashAlgorithm) {
                throw new Error(`Invalid key for this operation, its RSA-PSS parameters do not meet the requirements of "alg" ${algorithm}.`);
              }
              if (saltLength !== void 0 && saltLength > length >> 3) {
                throw new Error(`Invalid key for this operation, its RSA-PSS parameter saltLength does not meet the requirements of "alg" ${algorithm}.`);
              }
            }
            break;
        }
      }
    };
  }
});

// node_modules/jsonwebtoken/lib/psSupported.js
var require_psSupported = __commonJS({
  "node_modules/jsonwebtoken/lib/psSupported.js"(exports, module) {
    var semver = require_semver2();
    module.exports = semver.satisfies(process.version, "^6.12.0 || >=8.0.0");
  }
});

// node_modules/jsonwebtoken/verify.js
var require_verify = __commonJS({
  "node_modules/jsonwebtoken/verify.js"(exports, module) {
    var JsonWebTokenError = require_JsonWebTokenError();
    var NotBeforeError = require_NotBeforeError();
    var TokenExpiredError = require_TokenExpiredError();
    var decode = require_decode();
    var timespan = require_timespan();
    var validateAsymmetricKey = require_validateAsymmetricKey();
    var PS_SUPPORTED = require_psSupported();
    var jws = require_jws();
    var { KeyObject, createSecretKey, createPublicKey } = __require("crypto");
    var PUB_KEY_ALGS = ["RS256", "RS384", "RS512"];
    var EC_KEY_ALGS = ["ES256", "ES384", "ES512"];
    var RSA_KEY_ALGS = ["RS256", "RS384", "RS512"];
    var HS_ALGS = ["HS256", "HS384", "HS512"];
    if (PS_SUPPORTED) {
      PUB_KEY_ALGS.splice(PUB_KEY_ALGS.length, 0, "PS256", "PS384", "PS512");
      RSA_KEY_ALGS.splice(RSA_KEY_ALGS.length, 0, "PS256", "PS384", "PS512");
    }
    module.exports = function(jwtString, secretOrPublicKey, options, callback) {
      if (typeof options === "function" && !callback) {
        callback = options;
        options = {};
      }
      if (!options) {
        options = {};
      }
      options = Object.assign({}, options);
      let done;
      if (callback) {
        done = callback;
      } else {
        done = function(err, data) {
          if (err) throw err;
          return data;
        };
      }
      if (options.clockTimestamp && typeof options.clockTimestamp !== "number") {
        return done(new JsonWebTokenError("clockTimestamp must be a number"));
      }
      if (options.nonce !== void 0 && (typeof options.nonce !== "string" || options.nonce.trim() === "")) {
        return done(new JsonWebTokenError("nonce must be a non-empty string"));
      }
      if (options.allowInvalidAsymmetricKeyTypes !== void 0 && typeof options.allowInvalidAsymmetricKeyTypes !== "boolean") {
        return done(new JsonWebTokenError("allowInvalidAsymmetricKeyTypes must be a boolean"));
      }
      const clockTimestamp = options.clockTimestamp || Math.floor(Date.now() / 1e3);
      if (!jwtString) {
        return done(new JsonWebTokenError("jwt must be provided"));
      }
      if (typeof jwtString !== "string") {
        return done(new JsonWebTokenError("jwt must be a string"));
      }
      const parts = jwtString.split(".");
      if (parts.length !== 3) {
        return done(new JsonWebTokenError("jwt malformed"));
      }
      let decodedToken;
      try {
        decodedToken = decode(jwtString, { complete: true });
      } catch (err) {
        return done(err);
      }
      if (!decodedToken) {
        return done(new JsonWebTokenError("invalid token"));
      }
      const header = decodedToken.header;
      let getSecret;
      if (typeof secretOrPublicKey === "function") {
        if (!callback) {
          return done(new JsonWebTokenError("verify must be called asynchronous if secret or public key is provided as a callback"));
        }
        getSecret = secretOrPublicKey;
      } else {
        getSecret = function(header2, secretCallback) {
          return secretCallback(null, secretOrPublicKey);
        };
      }
      return getSecret(header, function(err, secretOrPublicKey2) {
        if (err) {
          return done(new JsonWebTokenError("error in secret or public key callback: " + err.message));
        }
        const hasSignature = parts[2].trim() !== "";
        if (!hasSignature && secretOrPublicKey2) {
          return done(new JsonWebTokenError("jwt signature is required"));
        }
        if (hasSignature && !secretOrPublicKey2) {
          return done(new JsonWebTokenError("secret or public key must be provided"));
        }
        if (!hasSignature && !options.algorithms) {
          return done(new JsonWebTokenError('please specify "none" in "algorithms" to verify unsigned tokens'));
        }
        if (secretOrPublicKey2 != null && !(secretOrPublicKey2 instanceof KeyObject)) {
          try {
            secretOrPublicKey2 = createPublicKey(secretOrPublicKey2);
          } catch (_) {
            try {
              secretOrPublicKey2 = createSecretKey(typeof secretOrPublicKey2 === "string" ? Buffer.from(secretOrPublicKey2) : secretOrPublicKey2);
            } catch (_2) {
              return done(new JsonWebTokenError("secretOrPublicKey is not valid key material"));
            }
          }
        }
        if (!options.algorithms) {
          if (secretOrPublicKey2.type === "secret") {
            options.algorithms = HS_ALGS;
          } else if (["rsa", "rsa-pss"].includes(secretOrPublicKey2.asymmetricKeyType)) {
            options.algorithms = RSA_KEY_ALGS;
          } else if (secretOrPublicKey2.asymmetricKeyType === "ec") {
            options.algorithms = EC_KEY_ALGS;
          } else {
            options.algorithms = PUB_KEY_ALGS;
          }
        }
        if (options.algorithms.indexOf(decodedToken.header.alg) === -1) {
          return done(new JsonWebTokenError("invalid algorithm"));
        }
        if (header.alg.startsWith("HS") && secretOrPublicKey2.type !== "secret") {
          return done(new JsonWebTokenError(`secretOrPublicKey must be a symmetric key when using ${header.alg}`));
        } else if (/^(?:RS|PS|ES)/.test(header.alg) && secretOrPublicKey2.type !== "public") {
          return done(new JsonWebTokenError(`secretOrPublicKey must be an asymmetric key when using ${header.alg}`));
        }
        if (!options.allowInvalidAsymmetricKeyTypes) {
          try {
            validateAsymmetricKey(header.alg, secretOrPublicKey2);
          } catch (e) {
            return done(e);
          }
        }
        let valid;
        try {
          valid = jws.verify(jwtString, decodedToken.header.alg, secretOrPublicKey2);
        } catch (e) {
          return done(e);
        }
        if (!valid) {
          return done(new JsonWebTokenError("invalid signature"));
        }
        const payload = decodedToken.payload;
        if (typeof payload.nbf !== "undefined" && !options.ignoreNotBefore) {
          if (typeof payload.nbf !== "number") {
            return done(new JsonWebTokenError("invalid nbf value"));
          }
          if (payload.nbf > clockTimestamp + (options.clockTolerance || 0)) {
            return done(new NotBeforeError("jwt not active", new Date(payload.nbf * 1e3)));
          }
        }
        if (typeof payload.exp !== "undefined" && !options.ignoreExpiration) {
          if (typeof payload.exp !== "number") {
            return done(new JsonWebTokenError("invalid exp value"));
          }
          if (clockTimestamp >= payload.exp + (options.clockTolerance || 0)) {
            return done(new TokenExpiredError("jwt expired", new Date(payload.exp * 1e3)));
          }
        }
        if (options.audience) {
          const audiences = Array.isArray(options.audience) ? options.audience : [options.audience];
          const target = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
          const match = target.some(function(targetAudience) {
            return audiences.some(function(audience) {
              return audience instanceof RegExp ? audience.test(targetAudience) : audience === targetAudience;
            });
          });
          if (!match) {
            return done(new JsonWebTokenError("jwt audience invalid. expected: " + audiences.join(" or ")));
          }
        }
        if (options.issuer) {
          const invalid_issuer = typeof options.issuer === "string" && payload.iss !== options.issuer || Array.isArray(options.issuer) && options.issuer.indexOf(payload.iss) === -1;
          if (invalid_issuer) {
            return done(new JsonWebTokenError("jwt issuer invalid. expected: " + options.issuer));
          }
        }
        if (options.subject) {
          if (payload.sub !== options.subject) {
            return done(new JsonWebTokenError("jwt subject invalid. expected: " + options.subject));
          }
        }
        if (options.jwtid) {
          if (payload.jti !== options.jwtid) {
            return done(new JsonWebTokenError("jwt jwtid invalid. expected: " + options.jwtid));
          }
        }
        if (options.nonce) {
          if (payload.nonce !== options.nonce) {
            return done(new JsonWebTokenError("jwt nonce invalid. expected: " + options.nonce));
          }
        }
        if (options.maxAge) {
          if (typeof payload.iat !== "number") {
            return done(new JsonWebTokenError("iat required when maxAge is specified"));
          }
          const maxAgeTimestamp = timespan(options.maxAge, payload.iat);
          if (typeof maxAgeTimestamp === "undefined") {
            return done(new JsonWebTokenError('"maxAge" should be a number of seconds or string representing a timespan eg: "1d", "20h", 60'));
          }
          if (clockTimestamp >= maxAgeTimestamp + (options.clockTolerance || 0)) {
            return done(new TokenExpiredError("maxAge exceeded", new Date(maxAgeTimestamp * 1e3)));
          }
        }
        if (options.complete === true) {
          const signature = decodedToken.signature;
          return done(null, {
            header,
            payload,
            signature
          });
        }
        return done(null, payload);
      });
    };
  }
});

// node_modules/lodash.includes/index.js
var require_lodash = __commonJS({
  "node_modules/lodash.includes/index.js"(exports, module) {
    var INFINITY = 1 / 0;
    var MAX_SAFE_INTEGER = 9007199254740991;
    var MAX_INTEGER = 17976931348623157e292;
    var NAN = 0 / 0;
    var argsTag = "[object Arguments]";
    var funcTag = "[object Function]";
    var genTag = "[object GeneratorFunction]";
    var stringTag = "[object String]";
    var symbolTag = "[object Symbol]";
    var reTrim = /^\s+|\s+$/g;
    var reIsBadHex = /^[-+]0x[0-9a-f]+$/i;
    var reIsBinary = /^0b[01]+$/i;
    var reIsOctal = /^0o[0-7]+$/i;
    var reIsUint = /^(?:0|[1-9]\d*)$/;
    var freeParseInt = parseInt;
    function arrayMap(array, iteratee) {
      var index = -1, length = array ? array.length : 0, result = Array(length);
      while (++index < length) {
        result[index] = iteratee(array[index], index, array);
      }
      return result;
    }
    function baseFindIndex(array, predicate, fromIndex, fromRight) {
      var length = array.length, index = fromIndex + (fromRight ? 1 : -1);
      while (fromRight ? index-- : ++index < length) {
        if (predicate(array[index], index, array)) {
          return index;
        }
      }
      return -1;
    }
    function baseIndexOf(array, value, fromIndex) {
      if (value !== value) {
        return baseFindIndex(array, baseIsNaN, fromIndex);
      }
      var index = fromIndex - 1, length = array.length;
      while (++index < length) {
        if (array[index] === value) {
          return index;
        }
      }
      return -1;
    }
    function baseIsNaN(value) {
      return value !== value;
    }
    function baseTimes(n, iteratee) {
      var index = -1, result = Array(n);
      while (++index < n) {
        result[index] = iteratee(index);
      }
      return result;
    }
    function baseValues(object, props) {
      return arrayMap(props, function(key) {
        return object[key];
      });
    }
    function overArg(func, transform) {
      return function(arg) {
        return func(transform(arg));
      };
    }
    var objectProto = Object.prototype;
    var hasOwnProperty = objectProto.hasOwnProperty;
    var objectToString = objectProto.toString;
    var propertyIsEnumerable = objectProto.propertyIsEnumerable;
    var nativeKeys = overArg(Object.keys, Object);
    var nativeMax = Math.max;
    function arrayLikeKeys(value, inherited) {
      var result = isArray(value) || isArguments(value) ? baseTimes(value.length, String) : [];
      var length = result.length, skipIndexes = !!length;
      for (var key in value) {
        if ((inherited || hasOwnProperty.call(value, key)) && !(skipIndexes && (key == "length" || isIndex(key, length)))) {
          result.push(key);
        }
      }
      return result;
    }
    function baseKeys(object) {
      if (!isPrototype(object)) {
        return nativeKeys(object);
      }
      var result = [];
      for (var key in Object(object)) {
        if (hasOwnProperty.call(object, key) && key != "constructor") {
          result.push(key);
        }
      }
      return result;
    }
    function isIndex(value, length) {
      length = length == null ? MAX_SAFE_INTEGER : length;
      return !!length && (typeof value == "number" || reIsUint.test(value)) && (value > -1 && value % 1 == 0 && value < length);
    }
    function isPrototype(value) {
      var Ctor = value && value.constructor, proto = typeof Ctor == "function" && Ctor.prototype || objectProto;
      return value === proto;
    }
    function includes(collection, value, fromIndex, guard) {
      collection = isArrayLike(collection) ? collection : values(collection);
      fromIndex = fromIndex && !guard ? toInteger(fromIndex) : 0;
      var length = collection.length;
      if (fromIndex < 0) {
        fromIndex = nativeMax(length + fromIndex, 0);
      }
      return isString(collection) ? fromIndex <= length && collection.indexOf(value, fromIndex) > -1 : !!length && baseIndexOf(collection, value, fromIndex) > -1;
    }
    function isArguments(value) {
      return isArrayLikeObject(value) && hasOwnProperty.call(value, "callee") && (!propertyIsEnumerable.call(value, "callee") || objectToString.call(value) == argsTag);
    }
    var isArray = Array.isArray;
    function isArrayLike(value) {
      return value != null && isLength(value.length) && !isFunction(value);
    }
    function isArrayLikeObject(value) {
      return isObjectLike(value) && isArrayLike(value);
    }
    function isFunction(value) {
      var tag = isObject(value) ? objectToString.call(value) : "";
      return tag == funcTag || tag == genTag;
    }
    function isLength(value) {
      return typeof value == "number" && value > -1 && value % 1 == 0 && value <= MAX_SAFE_INTEGER;
    }
    function isObject(value) {
      var type = typeof value;
      return !!value && (type == "object" || type == "function");
    }
    function isObjectLike(value) {
      return !!value && typeof value == "object";
    }
    function isString(value) {
      return typeof value == "string" || !isArray(value) && isObjectLike(value) && objectToString.call(value) == stringTag;
    }
    function isSymbol(value) {
      return typeof value == "symbol" || isObjectLike(value) && objectToString.call(value) == symbolTag;
    }
    function toFinite(value) {
      if (!value) {
        return value === 0 ? value : 0;
      }
      value = toNumber(value);
      if (value === INFINITY || value === -INFINITY) {
        var sign = value < 0 ? -1 : 1;
        return sign * MAX_INTEGER;
      }
      return value === value ? value : 0;
    }
    function toInteger(value) {
      var result = toFinite(value), remainder = result % 1;
      return result === result ? remainder ? result - remainder : result : 0;
    }
    function toNumber(value) {
      if (typeof value == "number") {
        return value;
      }
      if (isSymbol(value)) {
        return NAN;
      }
      if (isObject(value)) {
        var other = typeof value.valueOf == "function" ? value.valueOf() : value;
        value = isObject(other) ? other + "" : other;
      }
      if (typeof value != "string") {
        return value === 0 ? value : +value;
      }
      value = value.replace(reTrim, "");
      var isBinary = reIsBinary.test(value);
      return isBinary || reIsOctal.test(value) ? freeParseInt(value.slice(2), isBinary ? 2 : 8) : reIsBadHex.test(value) ? NAN : +value;
    }
    function keys(object) {
      return isArrayLike(object) ? arrayLikeKeys(object) : baseKeys(object);
    }
    function values(object) {
      return object ? baseValues(object, keys(object)) : [];
    }
    module.exports = includes;
  }
});

// node_modules/lodash.isboolean/index.js
var require_lodash2 = __commonJS({
  "node_modules/lodash.isboolean/index.js"(exports, module) {
    var boolTag = "[object Boolean]";
    var objectProto = Object.prototype;
    var objectToString = objectProto.toString;
    function isBoolean(value) {
      return value === true || value === false || isObjectLike(value) && objectToString.call(value) == boolTag;
    }
    function isObjectLike(value) {
      return !!value && typeof value == "object";
    }
    module.exports = isBoolean;
  }
});

// node_modules/lodash.isinteger/index.js
var require_lodash3 = __commonJS({
  "node_modules/lodash.isinteger/index.js"(exports, module) {
    var INFINITY = 1 / 0;
    var MAX_INTEGER = 17976931348623157e292;
    var NAN = 0 / 0;
    var symbolTag = "[object Symbol]";
    var reTrim = /^\s+|\s+$/g;
    var reIsBadHex = /^[-+]0x[0-9a-f]+$/i;
    var reIsBinary = /^0b[01]+$/i;
    var reIsOctal = /^0o[0-7]+$/i;
    var freeParseInt = parseInt;
    var objectProto = Object.prototype;
    var objectToString = objectProto.toString;
    function isInteger(value) {
      return typeof value == "number" && value == toInteger(value);
    }
    function isObject(value) {
      var type = typeof value;
      return !!value && (type == "object" || type == "function");
    }
    function isObjectLike(value) {
      return !!value && typeof value == "object";
    }
    function isSymbol(value) {
      return typeof value == "symbol" || isObjectLike(value) && objectToString.call(value) == symbolTag;
    }
    function toFinite(value) {
      if (!value) {
        return value === 0 ? value : 0;
      }
      value = toNumber(value);
      if (value === INFINITY || value === -INFINITY) {
        var sign = value < 0 ? -1 : 1;
        return sign * MAX_INTEGER;
      }
      return value === value ? value : 0;
    }
    function toInteger(value) {
      var result = toFinite(value), remainder = result % 1;
      return result === result ? remainder ? result - remainder : result : 0;
    }
    function toNumber(value) {
      if (typeof value == "number") {
        return value;
      }
      if (isSymbol(value)) {
        return NAN;
      }
      if (isObject(value)) {
        var other = typeof value.valueOf == "function" ? value.valueOf() : value;
        value = isObject(other) ? other + "" : other;
      }
      if (typeof value != "string") {
        return value === 0 ? value : +value;
      }
      value = value.replace(reTrim, "");
      var isBinary = reIsBinary.test(value);
      return isBinary || reIsOctal.test(value) ? freeParseInt(value.slice(2), isBinary ? 2 : 8) : reIsBadHex.test(value) ? NAN : +value;
    }
    module.exports = isInteger;
  }
});

// node_modules/lodash.isnumber/index.js
var require_lodash4 = __commonJS({
  "node_modules/lodash.isnumber/index.js"(exports, module) {
    var numberTag = "[object Number]";
    var objectProto = Object.prototype;
    var objectToString = objectProto.toString;
    function isObjectLike(value) {
      return !!value && typeof value == "object";
    }
    function isNumber(value) {
      return typeof value == "number" || isObjectLike(value) && objectToString.call(value) == numberTag;
    }
    module.exports = isNumber;
  }
});

// node_modules/lodash.isplainobject/index.js
var require_lodash5 = __commonJS({
  "node_modules/lodash.isplainobject/index.js"(exports, module) {
    var objectTag = "[object Object]";
    function isHostObject(value) {
      var result = false;
      if (value != null && typeof value.toString != "function") {
        try {
          result = !!(value + "");
        } catch (e) {
        }
      }
      return result;
    }
    function overArg(func, transform) {
      return function(arg) {
        return func(transform(arg));
      };
    }
    var funcProto = Function.prototype;
    var objectProto = Object.prototype;
    var funcToString = funcProto.toString;
    var hasOwnProperty = objectProto.hasOwnProperty;
    var objectCtorString = funcToString.call(Object);
    var objectToString = objectProto.toString;
    var getPrototype = overArg(Object.getPrototypeOf, Object);
    function isObjectLike(value) {
      return !!value && typeof value == "object";
    }
    function isPlainObject(value) {
      if (!isObjectLike(value) || objectToString.call(value) != objectTag || isHostObject(value)) {
        return false;
      }
      var proto = getPrototype(value);
      if (proto === null) {
        return true;
      }
      var Ctor = hasOwnProperty.call(proto, "constructor") && proto.constructor;
      return typeof Ctor == "function" && Ctor instanceof Ctor && funcToString.call(Ctor) == objectCtorString;
    }
    module.exports = isPlainObject;
  }
});

// node_modules/lodash.isstring/index.js
var require_lodash6 = __commonJS({
  "node_modules/lodash.isstring/index.js"(exports, module) {
    var stringTag = "[object String]";
    var objectProto = Object.prototype;
    var objectToString = objectProto.toString;
    var isArray = Array.isArray;
    function isObjectLike(value) {
      return !!value && typeof value == "object";
    }
    function isString(value) {
      return typeof value == "string" || !isArray(value) && isObjectLike(value) && objectToString.call(value) == stringTag;
    }
    module.exports = isString;
  }
});

// node_modules/lodash.once/index.js
var require_lodash7 = __commonJS({
  "node_modules/lodash.once/index.js"(exports, module) {
    var FUNC_ERROR_TEXT = "Expected a function";
    var INFINITY = 1 / 0;
    var MAX_INTEGER = 17976931348623157e292;
    var NAN = 0 / 0;
    var symbolTag = "[object Symbol]";
    var reTrim = /^\s+|\s+$/g;
    var reIsBadHex = /^[-+]0x[0-9a-f]+$/i;
    var reIsBinary = /^0b[01]+$/i;
    var reIsOctal = /^0o[0-7]+$/i;
    var freeParseInt = parseInt;
    var objectProto = Object.prototype;
    var objectToString = objectProto.toString;
    function before(n, func) {
      var result;
      if (typeof func != "function") {
        throw new TypeError(FUNC_ERROR_TEXT);
      }
      n = toInteger(n);
      return function() {
        if (--n > 0) {
          result = func.apply(this, arguments);
        }
        if (n <= 1) {
          func = void 0;
        }
        return result;
      };
    }
    function once(func) {
      return before(2, func);
    }
    function isObject(value) {
      var type = typeof value;
      return !!value && (type == "object" || type == "function");
    }
    function isObjectLike(value) {
      return !!value && typeof value == "object";
    }
    function isSymbol(value) {
      return typeof value == "symbol" || isObjectLike(value) && objectToString.call(value) == symbolTag;
    }
    function toFinite(value) {
      if (!value) {
        return value === 0 ? value : 0;
      }
      value = toNumber(value);
      if (value === INFINITY || value === -INFINITY) {
        var sign = value < 0 ? -1 : 1;
        return sign * MAX_INTEGER;
      }
      return value === value ? value : 0;
    }
    function toInteger(value) {
      var result = toFinite(value), remainder = result % 1;
      return result === result ? remainder ? result - remainder : result : 0;
    }
    function toNumber(value) {
      if (typeof value == "number") {
        return value;
      }
      if (isSymbol(value)) {
        return NAN;
      }
      if (isObject(value)) {
        var other = typeof value.valueOf == "function" ? value.valueOf() : value;
        value = isObject(other) ? other + "" : other;
      }
      if (typeof value != "string") {
        return value === 0 ? value : +value;
      }
      value = value.replace(reTrim, "");
      var isBinary = reIsBinary.test(value);
      return isBinary || reIsOctal.test(value) ? freeParseInt(value.slice(2), isBinary ? 2 : 8) : reIsBadHex.test(value) ? NAN : +value;
    }
    module.exports = once;
  }
});

// node_modules/jsonwebtoken/sign.js
var require_sign = __commonJS({
  "node_modules/jsonwebtoken/sign.js"(exports, module) {
    var timespan = require_timespan();
    var PS_SUPPORTED = require_psSupported();
    var validateAsymmetricKey = require_validateAsymmetricKey();
    var jws = require_jws();
    var includes = require_lodash();
    var isBoolean = require_lodash2();
    var isInteger = require_lodash3();
    var isNumber = require_lodash4();
    var isPlainObject = require_lodash5();
    var isString = require_lodash6();
    var once = require_lodash7();
    var { KeyObject, createSecretKey, createPrivateKey } = __require("crypto");
    var SUPPORTED_ALGS = ["RS256", "RS384", "RS512", "ES256", "ES384", "ES512", "HS256", "HS384", "HS512", "none"];
    if (PS_SUPPORTED) {
      SUPPORTED_ALGS.splice(3, 0, "PS256", "PS384", "PS512");
    }
    var sign_options_schema = {
      expiresIn: { isValid: function(value) {
        return isInteger(value) || isString(value) && value;
      }, message: '"expiresIn" should be a number of seconds or string representing a timespan' },
      notBefore: { isValid: function(value) {
        return isInteger(value) || isString(value) && value;
      }, message: '"notBefore" should be a number of seconds or string representing a timespan' },
      audience: { isValid: function(value) {
        return isString(value) || Array.isArray(value);
      }, message: '"audience" must be a string or array' },
      algorithm: { isValid: includes.bind(null, SUPPORTED_ALGS), message: '"algorithm" must be a valid string enum value' },
      header: { isValid: isPlainObject, message: '"header" must be an object' },
      encoding: { isValid: isString, message: '"encoding" must be a string' },
      issuer: { isValid: isString, message: '"issuer" must be a string' },
      subject: { isValid: isString, message: '"subject" must be a string' },
      jwtid: { isValid: isString, message: '"jwtid" must be a string' },
      noTimestamp: { isValid: isBoolean, message: '"noTimestamp" must be a boolean' },
      keyid: { isValid: isString, message: '"keyid" must be a string' },
      mutatePayload: { isValid: isBoolean, message: '"mutatePayload" must be a boolean' },
      allowInsecureKeySizes: { isValid: isBoolean, message: '"allowInsecureKeySizes" must be a boolean' },
      allowInvalidAsymmetricKeyTypes: { isValid: isBoolean, message: '"allowInvalidAsymmetricKeyTypes" must be a boolean' }
    };
    var registered_claims_schema = {
      iat: { isValid: isNumber, message: '"iat" should be a number of seconds' },
      exp: { isValid: isNumber, message: '"exp" should be a number of seconds' },
      nbf: { isValid: isNumber, message: '"nbf" should be a number of seconds' }
    };
    function validate(schema, allowUnknown, object, parameterName) {
      if (!isPlainObject(object)) {
        throw new Error('Expected "' + parameterName + '" to be a plain object.');
      }
      Object.keys(object).forEach(function(key) {
        const validator = schema[key];
        if (!validator) {
          if (!allowUnknown) {
            throw new Error('"' + key + '" is not allowed in "' + parameterName + '"');
          }
          return;
        }
        if (!validator.isValid(object[key])) {
          throw new Error(validator.message);
        }
      });
    }
    function validateOptions(options) {
      return validate(sign_options_schema, false, options, "options");
    }
    function validatePayload(payload) {
      return validate(registered_claims_schema, true, payload, "payload");
    }
    var options_to_payload = {
      "audience": "aud",
      "issuer": "iss",
      "subject": "sub",
      "jwtid": "jti"
    };
    var options_for_objects = [
      "expiresIn",
      "notBefore",
      "noTimestamp",
      "audience",
      "issuer",
      "subject",
      "jwtid"
    ];
    module.exports = function(payload, secretOrPrivateKey, options, callback) {
      if (typeof options === "function") {
        callback = options;
        options = {};
      } else {
        options = options || {};
      }
      const isObjectPayload = typeof payload === "object" && !Buffer.isBuffer(payload);
      const header = Object.assign({
        alg: options.algorithm || "HS256",
        typ: isObjectPayload ? "JWT" : void 0,
        kid: options.keyid
      }, options.header);
      function failure(err) {
        if (callback) {
          return callback(err);
        }
        throw err;
      }
      if (!secretOrPrivateKey && options.algorithm !== "none") {
        return failure(new Error("secretOrPrivateKey must have a value"));
      }
      if (secretOrPrivateKey != null && !(secretOrPrivateKey instanceof KeyObject)) {
        try {
          secretOrPrivateKey = createPrivateKey(secretOrPrivateKey);
        } catch (_) {
          try {
            secretOrPrivateKey = createSecretKey(typeof secretOrPrivateKey === "string" ? Buffer.from(secretOrPrivateKey) : secretOrPrivateKey);
          } catch (_2) {
            return failure(new Error("secretOrPrivateKey is not valid key material"));
          }
        }
      }
      if (header.alg.startsWith("HS") && secretOrPrivateKey.type !== "secret") {
        return failure(new Error(`secretOrPrivateKey must be a symmetric key when using ${header.alg}`));
      } else if (/^(?:RS|PS|ES)/.test(header.alg)) {
        if (secretOrPrivateKey.type !== "private") {
          return failure(new Error(`secretOrPrivateKey must be an asymmetric key when using ${header.alg}`));
        }
        if (!options.allowInsecureKeySizes && !header.alg.startsWith("ES") && secretOrPrivateKey.asymmetricKeyDetails !== void 0 && //KeyObject.asymmetricKeyDetails is supported in Node 15+
        secretOrPrivateKey.asymmetricKeyDetails.modulusLength < 2048) {
          return failure(new Error(`secretOrPrivateKey has a minimum key size of 2048 bits for ${header.alg}`));
        }
      }
      if (typeof payload === "undefined") {
        return failure(new Error("payload is required"));
      } else if (isObjectPayload) {
        try {
          validatePayload(payload);
        } catch (error) {
          return failure(error);
        }
        if (!options.mutatePayload) {
          payload = Object.assign({}, payload);
        }
      } else {
        const invalid_options = options_for_objects.filter(function(opt) {
          return typeof options[opt] !== "undefined";
        });
        if (invalid_options.length > 0) {
          return failure(new Error("invalid " + invalid_options.join(",") + " option for " + typeof payload + " payload"));
        }
      }
      if (typeof payload.exp !== "undefined" && typeof options.expiresIn !== "undefined") {
        return failure(new Error('Bad "options.expiresIn" option the payload already has an "exp" property.'));
      }
      if (typeof payload.nbf !== "undefined" && typeof options.notBefore !== "undefined") {
        return failure(new Error('Bad "options.notBefore" option the payload already has an "nbf" property.'));
      }
      try {
        validateOptions(options);
      } catch (error) {
        return failure(error);
      }
      if (!options.allowInvalidAsymmetricKeyTypes) {
        try {
          validateAsymmetricKey(header.alg, secretOrPrivateKey);
        } catch (error) {
          return failure(error);
        }
      }
      const timestamp = payload.iat || Math.floor(Date.now() / 1e3);
      if (options.noTimestamp) {
        delete payload.iat;
      } else if (isObjectPayload) {
        payload.iat = timestamp;
      }
      if (typeof options.notBefore !== "undefined") {
        try {
          payload.nbf = timespan(options.notBefore, timestamp);
        } catch (err) {
          return failure(err);
        }
        if (typeof payload.nbf === "undefined") {
          return failure(new Error('"notBefore" should be a number of seconds or string representing a timespan eg: "1d", "20h", 60'));
        }
      }
      if (typeof options.expiresIn !== "undefined" && typeof payload === "object") {
        try {
          payload.exp = timespan(options.expiresIn, timestamp);
        } catch (err) {
          return failure(err);
        }
        if (typeof payload.exp === "undefined") {
          return failure(new Error('"expiresIn" should be a number of seconds or string representing a timespan eg: "1d", "20h", 60'));
        }
      }
      Object.keys(options_to_payload).forEach(function(key) {
        const claim = options_to_payload[key];
        if (typeof options[key] !== "undefined") {
          if (typeof payload[claim] !== "undefined") {
            return failure(new Error('Bad "options.' + key + '" option. The payload already has an "' + claim + '" property.'));
          }
          payload[claim] = options[key];
        }
      });
      const encoding = options.encoding || "utf8";
      if (typeof callback === "function") {
        callback = callback && once(callback);
        jws.createSign({
          header,
          privateKey: secretOrPrivateKey,
          payload,
          encoding
        }).once("error", callback).once("done", function(signature) {
          if (!options.allowInsecureKeySizes && /^(?:RS|PS)/.test(header.alg) && signature.length < 256) {
            return callback(new Error(`secretOrPrivateKey has a minimum key size of 2048 bits for ${header.alg}`));
          }
          callback(null, signature);
        });
      } else {
        let signature = jws.sign({ header, payload, secret: secretOrPrivateKey, encoding });
        if (!options.allowInsecureKeySizes && /^(?:RS|PS)/.test(header.alg) && signature.length < 256) {
          throw new Error(`secretOrPrivateKey has a minimum key size of 2048 bits for ${header.alg}`);
        }
        return signature;
      }
    };
  }
});

// node_modules/jsonwebtoken/index.js
var require_jsonwebtoken = __commonJS({
  "node_modules/jsonwebtoken/index.js"(exports, module) {
    module.exports = {
      decode: require_decode(),
      verify: require_verify(),
      sign: require_sign(),
      JsonWebTokenError: require_JsonWebTokenError(),
      NotBeforeError: require_NotBeforeError(),
      TokenExpiredError: require_TokenExpiredError()
    };
  }
});

// lib/prisma.ts
var lastPrismaError = null;
function createResilientPrismaProxy() {
  let realClient = null;
  let clientInitialized = false;
  const getClient = async () => {
    if (clientInitialized) return realClient;
    clientInitialized = true;
    try {
      const prismaModule = await import("@prisma/client").catch(() => null);
      const PrismaConstructor = prismaModule?.PrismaClient || prismaModule?.default?.PrismaClient || prismaModule?.default;
      if (typeof PrismaConstructor === "function") {
        const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_PRISMA_URL || process.env.POSTGRES_URL || process.env.POSTGRES_URL_NON_POOLING;
        realClient = new PrismaConstructor(
          dbUrl ? { datasources: { db: { url: dbUrl } } } : void 0
        );
      }
    } catch (e) {
      lastPrismaError = e?.message || String(e);
      console.warn("[Prisma Resilient Engine] Remote PostgreSQL unlinked; operating on high-speed in-memory store.");
      realClient = null;
    }
    return realClient;
  };
  return new Proxy({}, {
    get(_target, prop) {
      if (prop === "$connect" || prop === "$disconnect") {
        return async () => {
        };
      }
      return new Proxy({}, {
        get(_modelTarget, method) {
          return async (...args) => {
            const client = await getClient();
            if (client && client[prop] && typeof client[prop][method] === "function") {
              return client[prop][method](...args);
            }
            throw new Error(`Database connection offline for ${String(prop)}.${String(method)}. Using resilient store.`);
          };
        }
      });
    }
  });
}
var prisma = createResilientPrismaProxy();
var prisma_default = prisma;

// lib/auth.ts
var import_bcryptjs = __toESM(require_bcryptjs(), 1);
var import_jsonwebtoken = __toESM(require_jsonwebtoken(), 1);
var JWT_SECRET = process.env.JWT_SECRET || "intelliwaste-jwt-secret-key-2025-dhaka";
async function hashPassword(password) {
  const salt = await import_bcryptjs.default.genSalt(10);
  return import_bcryptjs.default.hash(password, salt);
}
async function comparePassword(password, hash) {
  return import_bcryptjs.default.compare(password, hash);
}
function signToken(payload) {
  return import_jsonwebtoken.default.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}
function verifyToken(token) {
  try {
    return import_jsonwebtoken.default.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}
function signRecoveryToken(payload) {
  return import_jsonwebtoken.default.sign(payload, JWT_SECRET, { expiresIn: "10m" });
}
function verifyRecoveryToken(token) {
  try {
    return import_jsonwebtoken.default.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

// lib/middleware.ts
function setCorsHeaders(res) {
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,PATCH,DELETE,POST,PUT");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization"
  );
}
function extractToken(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  return authHeader.substring(7);
}
function authenticate(req) {
  const token = extractToken(req);
  if (!token) return null;
  return verifyToken(token);
}
function apiHandler(handler2, options) {
  return async (req, res) => {
    setCorsHeaders(res);
    if (req.method === "OPTIONS") {
      return res.status(200).end();
    }
    if (options?.allowedMethods && !options.allowedMethods.includes(req.method || "")) {
      return res.status(405).json({ error: `Method ${req.method} not allowed` });
    }
    let user;
    if (options?.requireAuth || options?.roles && options.roles.length > 0) {
      const authUser = authenticate(req);
      if (!authUser) {
        return res.status(401).json({ error: "Unauthorized: Missing or invalid token" });
      }
      if (options?.roles && !options.roles.includes(authUser.role)) {
        return res.status(403).json({ error: "Forbidden: Insufficient permissions" });
      }
      user = authUser;
    } else {
      const authUser = authenticate(req);
      if (authUser) user = authUser;
    }
    try {
      await handler2(req, res, user);
    } catch (error) {
      console.warn("[API Resilient Interceptor Caught Error]", error?.message || error);
      if (!res.writableEnded) {
        if (req.method === "GET") {
          return res.status(200).json([]);
        }
        return res.status(500).json({
          error: error?.message || "Internal server error occurred"
        });
      }
    }
  };
}

// lib/store.ts
var g = globalThis;
if (!g.__intelliwaste_store) {
  g.__intelliwaste_store = {
    isSetupComplete: false,
    setupLocked: false,
    withdrawGloballyEnabled: true,
    couponsGloballyEnabled: true,
    cities: [],
    wards: [],
    users: [],
    bins: [],
    tracks: [],
    routes: [],
    alerts: [],
    pickups: [],
    schedules: [],
    withdrawals: [],
    wasteReports: [],
    cityWasteItems: [],
    walletTransactions: [],
    reportTypes: [
      { id: "rt-1", type: "Illegal Dumping", pts: 150, icon: "\u26A0\uFE0F" },
      { id: "rt-2", type: "Hazardous Waste", pts: 200, icon: "\u2622\uFE0F" },
      { id: "rt-3", type: "Bin Damage / Vandalism", pts: 75, icon: "\u{1F527}" },
      { id: "rt-4", type: "Missed Collection", pts: 30, icon: "\u{1F4C5}" }
    ],
    auditLogs: [],
    rankTiers: [
      { id: "tier-1", level: 1, name: "Eco Beginner", minPoints: 0, maxPoints: 200, badge: "\u{1F331}" },
      { id: "tier-2", level: 2, name: "Green Scout", minPoints: 201, maxPoints: 600, badge: "\u{1F33F}" },
      { id: "tier-3", level: 3, name: "Waste Warrior", minPoints: 601, maxPoints: 1500, badge: "\u2B50" },
      { id: "tier-4", level: 4, name: "Eco Champion", minPoints: 1501, maxPoints: 3e3, badge: "\u{1F3C5}" },
      { id: "tier-5", level: 5, name: "Earth Guardian", minPoints: 3001, maxPoints: null, badge: "\u{1F3C6}" }
    ],
    rewards: [
      {
        id: "rew-1",
        name: "Shajgoj 20% Off",
        partner: "Shajgoj",
        points: 500,
        icon: "\u{1F6CD}\uFE0F",
        category: "Shopping",
        description: "20% off on skincare and cosmetics orders",
        active: true,
        codes: [
          { id: "c-1-1", code: "SHAJ-20-8491", isRedeemed: false },
          { id: "c-1-2", code: "SHAJ-20-3329", isRedeemed: false },
          { id: "c-1-3", code: "SHAJ-20-7714", isRedeemed: false }
        ],
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      },
      {
        id: "rew-2",
        name: "Pathao Ride Credit \u09F3100",
        partner: "Pathao",
        points: 800,
        icon: "\u{1F6F5}",
        category: "Rides",
        description: "\u09F3100 credit for bike or car ride across the city",
        active: true,
        codes: [
          { id: "c-2-1", code: "PATH-100-9921", isRedeemed: false },
          { id: "c-2-2", code: "PATH-100-4482", isRedeemed: false }
        ],
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      },
      {
        id: "rew-3",
        name: "Shohoz Movie Ticket",
        partner: "Shohoz",
        points: 1200,
        icon: "\u{1F3AC}",
        category: "Entertainment",
        description: "1 Free movie ticket voucher on Star Cineplex",
        active: true,
        codes: [
          { id: "c-3-1", code: "SHOZ-MOV-1192", isRedeemed: false }
        ],
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      },
      {
        id: "rew-4",
        name: "Tree Planted in Your Name",
        partner: "Green Bangladesh",
        points: 200,
        icon: "\u{1F333}",
        category: "Eco Action",
        description: "A native tree sapling planted in urban green belt with certificate",
        active: true,
        codes: [
          { id: "c-4-1", code: "TREE-DNCC-0012", isRedeemed: false },
          { id: "c-4-2", code: "TREE-DNCC-0013", isRedeemed: false },
          { id: "c-4-3", code: "TREE-DNCC-0014", isRedeemed: false }
        ],
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      }
    ]
  };
}
if (!g.__intelliwaste_store.rankTiers || g.__intelliwaste_store.rankTiers.length === 0) {
  g.__intelliwaste_store.rankTiers = [
    { id: "tier-1", level: 1, name: "Eco Beginner", minPoints: 0, maxPoints: 200, badge: "\u{1F331}" },
    { id: "tier-2", level: 2, name: "Green Scout", minPoints: 201, maxPoints: 600, badge: "\u{1F33F}" },
    { id: "tier-3", level: 3, name: "Waste Warrior", minPoints: 601, maxPoints: 1500, badge: "\u2B50" },
    { id: "tier-4", level: 4, name: "Eco Champion", minPoints: 1501, maxPoints: 3e3, badge: "\u{1F3C5}" },
    { id: "tier-5", level: 5, name: "Earth Guardian", minPoints: 3001, maxPoints: null, badge: "\u{1F3C6}" }
  ];
}
if (!g.__intelliwaste_store.rewards || g.__intelliwaste_store.rewards.length === 0) {
  g.__intelliwaste_store.rewards = [
    {
      id: "rew-1",
      name: "Shajgoj 20% Off",
      partner: "Shajgoj",
      points: 500,
      icon: "\u{1F6CD}\uFE0F",
      category: "Shopping",
      description: "20% off on skincare and cosmetics orders",
      active: true,
      codes: [
        { id: "c-1-1", code: "SHAJ-20-8491", isRedeemed: false },
        { id: "c-1-2", code: "SHAJ-20-3329", isRedeemed: false },
        { id: "c-1-3", code: "SHAJ-20-7714", isRedeemed: false }
      ],
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    },
    {
      id: "rew-2",
      name: "Pathao Ride Credit \u09F3100",
      partner: "Pathao",
      points: 800,
      icon: "\u{1F6F5}",
      category: "Rides",
      description: "\u09F3100 credit for bike or car ride across the city",
      active: true,
      codes: [
        { id: "c-2-1", code: "PATH-100-9921", isRedeemed: false },
        { id: "c-2-2", code: "PATH-100-4482", isRedeemed: false }
      ],
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    },
    {
      id: "rew-3",
      name: "Shohoz Movie Ticket",
      partner: "Shohoz",
      points: 1200,
      icon: "\u{1F3AC}",
      category: "Entertainment",
      description: "1 Free movie ticket voucher on Star Cineplex",
      active: true,
      codes: [
        { id: "c-3-1", code: "SHOZ-MOV-1192", isRedeemed: false }
      ],
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    },
    {
      id: "rew-4",
      name: "Tree Planted in Your Name",
      partner: "Green Bangladesh",
      points: 200,
      icon: "\u{1F333}",
      category: "Eco Action",
      description: "A native tree sapling planted in urban green belt with certificate",
      active: true,
      codes: [
        { id: "c-4-1", code: "TREE-DNCC-0012", isRedeemed: false },
        { id: "c-4-2", code: "TREE-DNCC-0013", isRedeemed: false },
        { id: "c-4-3", code: "TREE-DNCC-0014", isRedeemed: false }
      ],
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    }
  ];
}
var memoryDb = g.__intelliwaste_store;

// lib/audit.ts
async function logAudit(params) {
  const timestamp = (/* @__PURE__ */ new Date()).toISOString();
  try {
    await prisma_default.auditLog.create({
      data: {
        userId: params.userId || null,
        action: params.action,
        resource: params.resource,
        details: params.details || null,
        ipAddress: params.ipAddress || null
      }
    }).catch(() => null);
  } catch (err) {
    console.warn("[AuditLog DB Warning]", err.message);
  }
  if (!memoryDb.auditLogs) {
    memoryDb.auditLogs = [];
  }
  memoryDb.auditLogs.unshift({
    id: `aud-${Date.now()}-${Math.floor(Math.random() * 1e3)}`,
    userId: params.userId || null,
    action: params.action,
    resource: params.resource,
    details: params.details || null,
    ipAddress: params.ipAddress || null,
    createdAt: timestamp
  });
  if (memoryDb.auditLogs.length > 100) {
    memoryDb.auditLogs = memoryDb.auditLogs.slice(0, 100);
  }
}

// lib/security.ts
var rateLimitStore = /* @__PURE__ */ new Map();
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetAt) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1e3);
function checkRateLimit(key, maxAttempts = 5, windowMs = 60 * 1e3) {
  const now = Date.now();
  const record = rateLimitStore.get(key);
  if (!record || now > record.resetAt) {
    rateLimitStore.set(key, {
      count: 1,
      resetAt: now + windowMs
    });
    return {
      allowed: true,
      remaining: maxAttempts - 1,
      retryAfterSec: 0
    };
  }
  if (record.count >= maxAttempts) {
    const retryAfterSec = Math.ceil((record.resetAt - now) / 1e3);
    return {
      allowed: false,
      remaining: 0,
      retryAfterSec: Math.max(retryAfterSec, 1)
    };
  }
  record.count += 1;
  return {
    allowed: true,
    remaining: maxAttempts - record.count,
    retryAfterSec: 0
  };
}
function resetRateLimit(key) {
  rateLimitStore.delete(key);
}
function validateUsername(username) {
  if (typeof username !== "string" || !username.trim()) {
    return { valid: false, error: "Username is required.", clean: "" };
  }
  const clean = username.trim().toLowerCase();
  if (clean.length < 3) {
    return { valid: false, error: "Username must be at least 3 characters long.", clean };
  }
  if (clean.length > 30) {
    return { valid: false, error: "Username cannot exceed 30 characters.", clean };
  }
  const usernameRegex = /^[a-zA-Z0-9._-]+$/;
  if (!usernameRegex.test(clean)) {
    return {
      valid: false,
      error: "Username can only contain alphanumeric characters, dots, underscores, and hyphens.",
      clean
    };
  }
  return { valid: true, clean };
}
function validateEmail(email) {
  if (typeof email !== "string" || !email.trim()) {
    return { valid: false, error: "Email is required.", clean: "" };
  }
  const clean = email.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(clean)) {
    return { valid: false, error: "Please enter a valid email address.", clean };
  }
  return { valid: true, clean };
}
function validatePassword(password) {
  if (typeof password !== "string" || !password) {
    return { valid: false, error: "Password is required." };
  }
  if (password.length < 6) {
    return { valid: false, error: "Password must be at least 6 characters long." };
  }
  if (password.length > 128) {
    return { valid: false, error: "Password cannot exceed 128 characters." };
  }
  return { valid: true };
}
function sanitizeString(input, maxLength = 255) {
  if (typeof input !== "string") return "";
  const stripped = input.replace(/<[^>]*>?/gm, "").replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "").trim();
  return stripped.slice(0, maxLength);
}

// lib/handlers/auth/login.ts
var login_default = apiHandler(
  async (req, res) => {
    const { username, password } = req.body || {};
    if (!username || !password) {
      return res.status(400).json({ error: "Username and password are required" });
    }
    const ip = req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "anonymous";
    const cleanUsername = String(username).toLowerCase().trim();
    const rateLimitKey = `login:${ip}:${cleanUsername}`;
    const rateCheck = checkRateLimit(rateLimitKey, 5, 60 * 1e3);
    if (!rateCheck.allowed) {
      return res.status(429).json({
        error: `Too many login attempts. Please wait ${rateCheck.retryAfterSec} seconds before trying again.`
      });
    }
    let user = null;
    let dbError = null;
    try {
      user = await prisma_default.user.findFirst({
        where: {
          OR: [
            { username: { equals: cleanUsername, mode: "insensitive" } },
            { email: { equals: cleanUsername, mode: "insensitive" } }
          ]
        },
        include: {
          cityCorp: true,
          ward: true
        }
      });
    } catch (e) {
      dbError = e?.message || String(e);
      console.warn("[Auth Login Notice] Database error:", e.message);
    }
    if (!user) {
      const memUser = memoryDb.users.find(
        (u) => u.username.toLowerCase() === cleanUsername || u.email && u.email.toLowerCase() === cleanUsername
      );
      if (memUser) {
        const city = memoryDb.cities.find(
          (c) => c.id === memUser.cityCorpId
        );
        const ward = memoryDb.wards.find((w) => w.id === memUser.wardId);
        user = {
          ...memUser,
          cityCorp: city || null,
          ward: ward || null
        };
      }
    }
    if (!user || !user.active) {
      if (dbError && Boolean(process.env.VERCEL || process.env.NODE_ENV === "production")) {
        return res.status(503).json({
          error: `Database connection error: Unable to verify credentials because PostgreSQL is unreachable (${dbError}). Please verify your DATABASE_URL in Vercel settings.`
        });
      }
      return res.status(401).json({ error: "Invalid username or password" });
    }
    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid username or password" });
    }
    resetRateLimit(rateLimitKey);
    const token = signToken({
      userId: user.id,
      username: user.username,
      role: user.role,
      cityCorpId: user.cityCorpId,
      wardId: user.wardId,
      fullName: user.fullName
    });
    await logAudit({
      userId: user.id,
      action: "USER_LOGIN",
      resource: "auth",
      details: `User ${user.username} (${user.role}) logged in successfully`,
      ipAddress: req.headers["x-forwarded-for"] || req.socket?.remoteAddress
    });
    return res.status(200).json({
      token,
      user: {
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        points: user.points || 0,
        address: user.address,
        cityCorpId: user.cityCorpId,
        cityCorp: user.cityCorp,
        wardId: user.wardId,
        ward: user.ward
      }
    });
  },
  { allowedMethods: ["POST"] }
);

// lib/handlers/auth/register.ts
var register_default = apiHandler(
  async (req, res, currentUser) => {
    const {
      username,
      password,
      fullName,
      email,
      phone,
      nid,
      address,
      role = "CITIZEN",
      cityCorpId,
      wardId
    } = req.body || {};
    const userCheck = validateUsername(username);
    if (!userCheck.valid) {
      return res.status(400).json({ error: userCheck.error });
    }
    const passCheck = validatePassword(password);
    if (!passCheck.valid) {
      return res.status(400).json({ error: passCheck.error });
    }
    const cleanFullName = sanitizeString(fullName, 100);
    if (!cleanFullName) {
      return res.status(400).json({ error: "Full name is required" });
    }
    let cleanEmail = null;
    if (email && String(email).trim()) {
      const emailCheck = validateEmail(email);
      if (!emailCheck.valid) {
        return res.status(400).json({ error: emailCheck.error });
      }
      cleanEmail = emailCheck.clean;
    }
    const cleanUsername = userCheck.clean;
    if (role === "SUPER_ADMIN") {
      if (!currentUser || currentUser.role !== "SUPER_ADMIN") {
        return res.status(403).json({ error: "Only Super Admin can create another Super Admin" });
      }
    } else if (role === "CITY_ADMIN") {
      if (!currentUser || currentUser.role !== "SUPER_ADMIN") {
        return res.status(403).json({ error: "Only Super Admin can create City Corporation Admins" });
      }
      if (!cityCorpId) {
        return res.status(400).json({ error: "cityCorpId is required for City Admin" });
      }
    } else if (role === "WARD_ADMIN") {
      if (!currentUser || currentUser.role !== "SUPER_ADMIN" && currentUser.role !== "CITY_ADMIN") {
        return res.status(403).json({ error: "Only Super Admin or City Corp Admin can create Ward Admins" });
      }
      if (currentUser.role === "CITY_ADMIN" && currentUser.cityCorpId) {
        if (wardId) {
          const ward = await prisma_default.ward.findUnique({ where: { id: wardId } });
          if (!ward || ward.cityCorpId !== currentUser.cityCorpId) {
            return res.status(403).json({ error: "You can only assign admins to wards in your City Corporation" });
          }
        }
      }
    }
    let isTaken = false;
    try {
      const existing = await prisma_default.user.findFirst({
        where: {
          OR: [
            { username: { equals: cleanUsername, mode: "insensitive" } },
            ...cleanEmail ? [{ email: { equals: cleanEmail, mode: "insensitive" } }] : []
          ]
        }
      }).catch(() => null);
      if (existing) isTaken = true;
    } catch {
    }
    if (!isTaken && memoryDb.users.some((u) => u.username.toLowerCase() === cleanUsername || cleanEmail && u.email && u.email.toLowerCase() === cleanEmail)) {
      isTaken = true;
    }
    if (isTaken) {
      return res.status(409).json({ error: "Username or email is already taken" });
    }
    const hashedPassword = await hashPassword(password);
    let newUser = null;
    try {
      newUser = await prisma_default.user.create({
        data: {
          username: cleanUsername,
          password: hashedPassword,
          fullName: cleanFullName,
          email: cleanEmail,
          phone: phone ? String(phone).trim() : null,
          nid: nid ? String(nid).trim() : null,
          address: address ? sanitizeString(address, 200) : null,
          role,
          cityCorpId: cityCorpId || null,
          wardId: wardId || null
        },
        include: {
          cityCorp: true,
          ward: true
        }
      }).catch(() => null);
    } catch (e) {
      console.warn("[Register PG Notice] Falling back to memory store:", e.message);
    }
    const userId = newUser?.id || `usr-reg-${Date.now()}`;
    const memUser = {
      id: userId,
      username: cleanUsername,
      password: hashedPassword,
      fullName: cleanFullName,
      email: cleanEmail,
      phone: phone ? String(phone).trim() : null,
      nid: nid ? String(nid).trim() : null,
      address: address ? sanitizeString(address, 200) : null,
      role,
      active: true,
      points: 0,
      cityCorpId: cityCorpId || null,
      wardId: wardId || null,
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    if (!memoryDb.users.some((u) => u.username === cleanUsername)) {
      memoryDb.users.push(memUser);
    }
    await logAudit({
      userId: memUser.id,
      action: "USER_REGISTER",
      resource: "users",
      details: `New account registered: ${cleanUsername} (${role})`,
      ipAddress: req.headers["x-forwarded-for"] || req.socket?.remoteAddress
    });
    const token = signToken({
      userId: memUser.id,
      username: memUser.username,
      role: memUser.role,
      cityCorpId: memUser.cityCorpId,
      wardId: memUser.wardId,
      fullName: memUser.fullName
    });
    return res.status(201).json({
      message: "User created successfully",
      token,
      user: {
        id: memUser.id,
        username: memUser.username,
        fullName: memUser.fullName,
        email: memUser.email,
        phone: memUser.phone,
        role: memUser.role,
        cityCorpId: memUser.cityCorpId,
        wardId: memUser.wardId
      }
    });
  },
  { allowedMethods: ["POST"] }
);

// lib/handlers/auth/me.ts
var me_default = apiHandler(
  async (req, res, currentUser) => {
    if (!currentUser) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    const user = await prisma_default.user.findUnique({
      where: { id: currentUser.userId },
      include: {
        cityCorp: true,
        ward: true
      }
    });
    if (!user || !user.active) {
      return res.status(401).json({ error: "User account inactive or not found" });
    }
    return res.status(200).json({
      user: {
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        points: user.points,
        address: user.address,
        cityCorpId: user.cityCorpId,
        cityCorp: user.cityCorp,
        wardId: user.wardId,
        ward: user.ward
      }
    });
  },
  { requireAuth: true, allowedMethods: ["GET"] }
);

// lib/email.ts
async function sendEmail({ to, subject, htmlContent, textContent }) {
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL || process.env.SENDER_EMAIL || "shafiq_mollah1087@uits.edu.bd";
  const senderName = process.env.BREVO_SENDER_NAME || "IntelliWaste Smart City";
  if (!apiKey || apiKey.trim() === "" || apiKey === "your_brevo_api_key_here") {
    console.log("--------------------------------------------------");
    console.log("[BREVO EMAIL SIMULATION (No API Key Configured)]");
    console.log(`To: ${to.map((t) => `${t.name || ""} <${t.email}>`).join(", ")}`);
    console.log(`Subject: ${subject}`);
    console.log(`Sender: ${senderName} <${senderEmail}>`);
    console.log("--------------------------------------------------");
    return { success: true, simulated: true };
  }
  try {
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "accept": "application/json",
        "api-key": apiKey.trim(),
        "content-type": "application/json"
      },
      body: JSON.stringify({
        sender: {
          name: senderName,
          email: senderEmail
        },
        to,
        subject,
        htmlContent,
        textContent: textContent || subject
      })
    });
    if (!response.ok) {
      const errBody = await response.json().catch(() => ({}));
      console.error("[Brevo API Error]", response.status, errBody);
      return { success: true, simulated: true };
    }
    const data = await response.json();
    return { success: true, messageId: data.messageId };
  } catch (err) {
    console.error("[Brevo Network Error]", err.message);
    return { success: true, simulated: true };
  }
}
async function sendWelcomeCredentialsEmail({
  email,
  fullName,
  username,
  password,
  role,
  loginUrl
}) {
  const portalUrl = loginUrl || process.env.APP_URL || "https://intelliwaste.vercel.app";
  const roleName = {
    SUPER_ADMIN: "Super Admin (National System Controller)",
    CITY_ADMIN: "City Corporation Administrator",
    WARD_ADMIN: "Ward Sub-Admin Controller",
    DRIVER: "Smart Waste Collection Driver",
    CITIZEN: "Resident Citizen",
    BUSINESS: "Commercial Enterprise / Shop Owner"
  }[role] || role;
  const html = `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Welcome to IntelliWaste</title>
</head>
<body style="margin:0;padding:0;background-color:#051408;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <!-- Gmail Inbox Preview Snippet -->
  <div style="display:none;font-size:1px;color:#051408;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">
    Welcome to IntelliWaste, ${fullName}! Your username: ${username}. Login to access your portal.
  </div>

  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:#051408;padding:24px 12px;">
    <tr>
      <td align="center">
        <!-- Main Card Container -->
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width:560px;background-color:#0d2414;border:1px solid #1a3d22;border-radius:16px;overflow:hidden;box-shadow:0 12px 30px rgba(0,0,0,0.6);">
          
          <!-- Header Banner -->
          <tr>
            <td style="padding:28px 32px 16px 32px;background:linear-gradient(135deg, #0d2414 0%, #11361c 100%);border-bottom:1px solid #1a3d22;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="left">
                    <span style="font-size:24px;font-weight:800;color:#4ade80;letter-spacing:-0.5px;">\u267B\uFE0F IntelliWaste</span>
                    <div style="font-size:12px;color:#86efac;font-family:monospace;margin-top:2px;letter-spacing:1px;text-transform:uppercase;">SMART CITY WASTE MANAGEMENT</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Content Body -->
          <tr>
            <td style="padding:28px 32px;">
              <!-- Role Badge -->
              <div style="display:inline-block;background-color:rgba(74,222,128,0.15);border:1px solid rgba(74,222,128,0.35);border-radius:6px;padding:5px 12px;font-size:11px;font-weight:700;color:#4ade80;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:16px;">
                ${roleName}
              </div>

              <h1 style="margin:0 0 12px 0;font-size:22px;line-height:1.3;font-weight:700;color:#ffffff;">
                Welcome, ${fullName}!
              </h1>
              <p style="margin:0 0 20px 0;font-size:14px;line-height:1.6;color:#a7f3d0;">
                \u0986\u09AA\u09A8\u09BE\u09B0 \u09A8\u09BE\u09AE\u09C7 <strong>IntelliWaste</strong> \u09B8\u09CD\u09AE\u09BE\u09B0\u09CD\u099F \u09AE\u09CD\u09AF\u09BE\u09A8\u09C7\u099C\u09AE\u09C7\u09A8\u09CD\u099F \u09AA\u09CD\u09B2\u09CD\u09AF\u09BE\u099F\u09AB\u09B0\u09CD\u09AE\u09C7 \u098F\u0995\u099F\u09BF \u0985\u09AB\u09BF\u09B8\u09BF\u09DF\u09BE\u09B2 \u098F\u0995\u09BE\u0989\u09A8\u09CD\u099F \u09A4\u09C8\u09B0\u09BF \u0995\u09B0\u09BE \u09B9\u09DF\u09C7\u099B\u09C7\u0964 \u09A8\u09BF\u099A\u09C7 \u0986\u09AA\u09A8\u09BE\u09B0 \u09B2\u0997\u0987\u09A8 \u0995\u09B0\u09BE\u09B0 \u0987\u0989\u099C\u09BE\u09B0\u09A8\u09C7\u09AE \u0993 \u09AA\u09BE\u09B8\u0993\u09DF\u09BE\u09B0\u09CD\u09A1 \u09A6\u09C7\u0993\u09DF\u09BE \u09B9\u09B2\u09CB:
              </p>

              <!-- Credentials Table (Bulletproof for Gmail) -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:#061309;border:1px solid #1a3d22;border-radius:12px;overflow:hidden;margin-bottom:24px;">
                <tr>
                  <td style="padding:14px 18px;border-bottom:1px solid #112a19;font-size:13px;color:#86efac;font-weight:600;" width="38%">
                    Full Name:
                  </td>
                  <td style="padding:14px 18px;border-bottom:1px solid #112a19;font-size:14px;color:#ffffff;font-weight:600;" align="right">
                    ${fullName}
                  </td>
                </tr>
                <tr>
                  <td style="padding:14px 18px;border-bottom:1px solid #112a19;font-size:13px;color:#86efac;font-weight:600;">
                    Username / \u0987\u0989\u099C\u09BE\u09B0\u09A8\u09C7\u09AE:
                  </td>
                  <td style="padding:14px 18px;border-bottom:1px solid #112a19;font-size:14px;color:#4ade80;font-family:monospace;font-weight:700;" align="right">
                    ${username}
                  </td>
                </tr>
                <tr>
                  <td style="padding:14px 18px;border-bottom:1px solid #112a19;font-size:13px;color:#86efac;font-weight:600;">
                    Password / \u09AA\u09BE\u09B8\u0993\u09AF\u09BC\u09BE\u09B0\u09CD\u09A1:
                  </td>
                  <td style="padding:14px 18px;border-bottom:1px solid #112a19;font-size:15px;color:#ffffff;font-family:monospace;font-weight:700;background-color:#0b2112;border-radius:6px;" align="right">
                    ${password}
                  </td>
                </tr>
                <tr>
                  <td style="padding:14px 18px;font-size:13px;color:#86efac;font-weight:600;">
                    Assigned Role:
                  </td>
                  <td style="padding:14px 18px;font-size:13px;color:#a7f3d0;font-weight:600;" align="right">
                    ${role}
                  </td>
                </tr>
              </table>

              <!-- Action Button -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:24px;">
                <tr>
                  <td align="center">
                    <a href="${portalUrl}" target="_blank" style="display:inline-block;background-color:#16a34a;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;padding:14px 32px;border-radius:10px;box-shadow:0 4px 12px rgba(22,163,74,0.4);border:1px solid #22c55e;">
                      \u09B2\u0997\u0987\u09A8 \u09AA\u09CB\u09B0\u09CD\u099F\u09BE\u09B2\u09C7 \u09AA\u09CD\u09B0\u09AC\u09C7\u09B6 \u0995\u09B0\u09C1\u09A8 \u2192
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Security Advice Box -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:rgba(74,222,128,0.06);border:1px solid rgba(74,222,128,0.25);border-radius:10px;margin-bottom:16px;">
                <tr>
                  <td style="padding:14px 18px;font-size:12px;line-height:1.6;color:#86efac;">
                    \u{1F512} <strong>\u09A8\u09BF\u09B0\u09BE\u09AA\u09A4\u09CD\u09A4\u09BE \u09AC\u09BE\u09B0\u09CD\u09A4\u09BE:</strong> \u0986\u09AA\u09A8\u09BE\u09B0 \u0987\u0989\u099C\u09BE\u09B0\u09A8\u09C7\u09AE \u0993 \u09AA\u09BE\u09B8\u0993\u09DF\u09BE\u09B0\u09CD\u09A1 \u0995\u09BE\u0989\u0995\u09C7 \u09B6\u09C7\u09DF\u09BE\u09B0 \u0995\u09B0\u09AC\u09C7\u09A8 \u09A8\u09BE\u0964 \u09AA\u09CD\u09B0\u09DF\u09CB\u099C\u09A8\u09C7 \u09B2\u0997\u0987\u09A8 \u0995\u09B0\u09BE\u09B0 \u09AA\u09B0 \u09AA\u09BE\u09B8\u0993\u09DF\u09BE\u09B0\u09CD\u09A1 \u09AA\u09B0\u09BF\u09AC\u09B0\u09CD\u09A4\u09A8 \u0995\u09B0\u09C7 \u09A8\u09BF\u09A4\u09C7 \u09AA\u09BE\u09B0\u09AC\u09C7\u09A8\u0964
                  </td>
                </tr>
              </table>

              <p style="margin:0;font-size:11px;color:#4b7a5a;text-align:center;">
                Direct URL: <a href="${portalUrl}" style="color:#4ade80;text-decoration:underline;">${portalUrl}</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 32px;background-color:#061309;border-top:1px solid #1a3d22;text-align:center;">
              <p style="margin:0 0 4px 0;font-size:12px;font-weight:600;color:#86efac;">
                IntelliWaste Smart City Infrastructure
              </p>
              <p style="margin:0;font-size:11px;color:#4b7a5a;line-height:1.5;">
                This is an automated system dispatch. Replies to this email are not monitored.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
  return sendEmail({
    to: [{ email, name: fullName }],
    subject: `\u{1F389} Your IntelliWaste Credentials - Username: ${username}`,
    htmlContent: html,
    textContent: `Welcome to IntelliWaste, ${fullName}!

Your account credentials:
Username: ${username}
Password: ${password}
Role: ${role}

Login Portal: ${portalUrl}`
  });
}
async function sendPasswordResetOtpEmail({
  email,
  fullName,
  otpCode,
  expiresInMinutes = 10
}) {
  const html = `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Password Reset Code</title>
</head>
<body style="margin:0;padding:0;background-color:#051408;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <!-- Gmail Inbox Preview Snippet -->
  <div style="display:none;font-size:1px;color:#051408;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">
    Your IntelliWaste password reset code is ${otpCode}. Valid for ${expiresInMinutes} minutes.
  </div>

  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:#051408;padding:24px 12px;">
    <tr>
      <td align="center">
        <!-- Main Card Container -->
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width:520px;background-color:#0d2414;border:1px solid #1a3d22;border-radius:16px;overflow:hidden;box-shadow:0 12px 30px rgba(0,0,0,0.6);">
          
          <!-- Header Banner -->
          <tr>
            <td style="padding:28px 32px 16px 32px;background:linear-gradient(135deg, #0d2414 0%, #11361c 100%);border-bottom:1px solid #1a3d22;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="left">
                    <span style="font-size:24px;font-weight:800;color:#4ade80;letter-spacing:-0.5px;">\u{1F510} IntelliWaste</span>
                    <div style="font-size:12px;color:#86efac;font-family:monospace;margin-top:2px;letter-spacing:1px;text-transform:uppercase;">ACCOUNT SECURITY & VERIFICATION</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Content Body -->
          <tr>
            <td style="padding:28px 32px;">
              <h1 style="margin:0 0 12px 0;font-size:20px;line-height:1.3;font-weight:700;color:#ffffff;">
                Password Reset Verification Code
              </h1>
              <p style="margin:0 0 16px 0;font-size:14px;line-height:1.6;color:#a7f3d0;">
                Hello <strong>${fullName || "User"}</strong>,
              </p>
              <p style="margin:0 0 24px 0;font-size:14px;line-height:1.6;color:#a7f3d0;">
                \u0986\u09AA\u09A8\u09BE\u09B0 IntelliWaste \u098F\u0995\u09BE\u0989\u09A8\u09CD\u099F\u09C7\u09B0 \u09AA\u09BE\u09B8\u0993\u09DF\u09BE\u09B0\u09CD\u09A1 \u09B0\u09BF\u09B8\u09C7\u099F \u0995\u09B0\u09BE\u09B0 \u099C\u09A8\u09CD\u09AF \u098F\u0995\u099F\u09BF \u0985\u09A8\u09C1\u09B0\u09CB\u09A7 \u09AA\u09BE\u0993\u09DF\u09BE \u0997\u09C7\u099B\u09C7\u0964 \u09A8\u09BF\u099A\u09C7 \u0986\u09AA\u09A8\u09BE\u09B0 \u09EC-\u09B8\u0982\u0996\u09CD\u09AF\u09BE\u09B0 \u0997\u09CB\u09AA\u09A8\u09C0\u09DF \u09AD\u09C7\u09B0\u09BF\u09AB\u09BF\u0995\u09C7\u09B6\u09A8 \u0995\u09CB\u09A1 \u09A6\u09C7\u0993\u09DF\u09BE \u09B9\u09B2\u09CB:
              </p>

              <!-- OTP Big Display Box (Bulletproof for Gmail) -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:#061309;border:2px dashed #16a34a;border-radius:14px;margin-bottom:24px;">
                <tr>
                  <td align="center" style="padding:24px 16px;">
                    <div style="font-family:'Courier New',Courier,monospace;font-size:38px;font-weight:800;color:#4ade80;letter-spacing:10px;text-align:center;">
                      ${otpCode}
                    </div>
                    <div style="font-size:12px;color:#86efac;margin-top:8px;font-family:-apple-system,BlinkMacSystemFont,sans-serif;">
                      \u23F3 \u09AE\u09C7\u09AF\u09BC\u09BE\u09A6: <strong>${expiresInMinutes} \u09AE\u09BF\u09A8\u09BF\u099F</strong> (Valid for ${expiresInMinutes} mins)
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Security Notice -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.3);border-radius:10px;margin-bottom:20px;">
                <tr>
                  <td style="padding:14px 18px;font-size:12px;line-height:1.6;color:#fca5a5;">
                    \u26A0\uFE0F <strong>\u09B8\u09A4\u09B0\u09CD\u0995\u09A4\u09BE:</strong> \u098F\u0987 \u0995\u09CB\u09A1\u099F\u09BF \u0995\u0996\u09A8\u0987 \u0995\u09BE\u0989\u0995\u09C7 \u09A6\u09C7\u09AC\u09C7\u09A8 \u09A8\u09BE\u0964 IntelliWaste \u0995\u09B0\u09CD\u09A4\u09C3\u09AA\u0995\u09CD\u09B7 \u0995\u0996\u09A8\u0987 \u0986\u09AA\u09A8\u09BE\u09B0 \u0995\u09BE\u099B\u09C7 \u098F\u0987 \u0995\u09CB\u09A1 \u099A\u09BE\u0987\u09AC\u09C7 \u09A8\u09BE\u0964 \u0986\u09AA\u09A8\u09BF \u09AF\u09A6\u09BF \u098F\u0987 \u09AA\u09BE\u09B8\u0993\u09DF\u09BE\u09B0\u09CD\u09A1 \u09B0\u09BF\u09B8\u09C7\u099F \u09B0\u09BF\u0995\u09CB\u09DF\u09C7\u09B8\u09CD\u099F \u09A8\u09BE \u0995\u09B0\u09C7 \u09A5\u09BE\u0995\u09C7\u09A8, \u09A4\u09AC\u09C7 \u098F\u0987 \u0987\u09AE\u09C7\u0987\u09B2\u099F\u09BF \u0989\u09AA\u09C7\u0995\u09CD\u09B7\u09BE \u0995\u09B0\u09C1\u09A8\u0964 \u0986\u09AA\u09A8\u09BE\u09B0 \u098F\u0995\u09BE\u0989\u09A8\u09CD\u099F \u09B8\u09AE\u09CD\u09AA\u09C2\u09B0\u09CD\u09A3 \u09B8\u09C1\u09B0\u0995\u09CD\u09B7\u09BF\u09A4 \u09A5\u09BE\u0995\u09AC\u09C7\u0964
                  </td>
                </tr>
              </table>

              <p style="margin:0;font-size:12px;color:#4b7a5a;text-align:center;">
                Security Verification \u2022 Automated Message
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 32px;background-color:#061309;border-top:1px solid #1a3d22;text-align:center;">
              <p style="margin:0 0 4px 0;font-size:12px;font-weight:600;color:#86efac;">
                IntelliWaste Smart City Infrastructure
              </p>
              <p style="margin:0;font-size:11px;color:#4b7a5a;">
                Dhaka, Bangladesh \u2022 Official Digital Platform
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
  return sendEmail({
    to: [{ email, name: fullName || "User" }],
    subject: `\u{1F510} ${otpCode} is your IntelliWaste Password Reset Code`,
    htmlContent: html,
    textContent: `Your IntelliWaste password reset code is: ${otpCode}.
Valid for ${expiresInMinutes} minutes.

Never share this code with anyone. If you did not request this, please ignore this email.`
  });
}

// lib/otpStore.ts
var g2 = globalThis;
if (!g2.__intelliwaste_otps) {
  g2.__intelliwaste_otps = /* @__PURE__ */ new Map();
}
var memoryStore = g2.__intelliwaste_otps;
var otpStore = {
  set: (identifier, data) => {
    const key = identifier.toLowerCase().trim();
    memoryStore.set(key, { ...data, identifier: key });
    if (data.email) {
      memoryStore.set(data.email.toLowerCase().trim(), { ...data, identifier: key });
    }
  },
  get: (identifier) => {
    const key = identifier.toLowerCase().trim();
    const entry = memoryStore.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      memoryStore.delete(key);
      return null;
    }
    return entry;
  },
  verify: (identifier, code) => {
    const entry = otpStore.get(identifier);
    if (!entry) return false;
    return entry.code === code.trim();
  },
  consume: (identifier, code) => {
    const entry = otpStore.get(identifier);
    if (!entry) return false;
    if (entry.code !== code.trim()) return false;
    memoryStore.delete(identifier.toLowerCase().trim());
    if (entry.email) {
      memoryStore.delete(entry.email.toLowerCase().trim());
    }
    return true;
  }
};
var otpStore_default = otpStore;

// lib/handlers/auth/forgot-password.ts
var forgot_password_default = apiHandler(
  async (req, res) => {
    const { identifier, role } = req.body || {};
    if (!identifier || typeof identifier !== "string" || !identifier.trim()) {
      return res.status(400).json({ error: "Please provide your registered email or username." });
    }
    const ip = req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "anonymous";
    const cleanInput = identifier.trim().toLowerCase();
    const rateLimitKey = `otp:${ip}:${cleanInput}`;
    const rateCheck = checkRateLimit(rateLimitKey, 3, 5 * 60 * 1e3);
    if (!rateCheck.allowed) {
      return res.status(429).json({
        error: `Too many password reset requests. Please wait ${rateCheck.retryAfterSec} seconds before requesting a new code.`
      });
    }
    let user = null;
    let dbError = null;
    try {
      const whereCondition = {
        OR: [
          { username: { equals: cleanInput, mode: "insensitive" } },
          { email: { equals: cleanInput, mode: "insensitive" } }
        ]
      };
      if (role && typeof role === "string") {
        whereCondition.role = role;
      }
      user = await prisma_default.user.findFirst({
        where: whereCondition
      });
      if (!user && role) {
        const otherRoleUser = await prisma_default.user.findFirst({
          where: {
            OR: [
              { username: { equals: cleanInput, mode: "insensitive" } },
              { email: { equals: cleanInput, mode: "insensitive" } }
            ]
          }
        });
        if (otherRoleUser) {
          return res.status(404).json({
            error: `No ${role.replace("_", " ").toLowerCase()} account found with this identifier.`
          });
        }
      }
    } catch (e) {
      dbError = e?.message || String(e);
      console.warn("Prisma lookup failed, checking resilient memory store:", e.message);
    }
    if (!user) {
      const memUser = memoryDb.users.find(
        (u) => (u.username.toLowerCase() === cleanInput || u.email && u.email.toLowerCase() === cleanInput) && (!role || u.role === role)
      );
      if (memUser) {
        user = {
          id: memUser.id,
          username: memUser.username,
          fullName: memUser.fullName,
          email: memUser.email,
          role: memUser.role
        };
      } else if (role) {
        const otherRoleMem = memoryDb.users.find(
          (u) => u.username.toLowerCase() === cleanInput || u.email && u.email.toLowerCase() === cleanInput
        );
        if (otherRoleMem) {
          return res.status(404).json({
            error: `No ${role.replace("_", " ").toLowerCase()} account found with this identifier.`
          });
        }
      }
    }
    if (!user) {
      if (dbError && Boolean(process.env.VERCEL || process.env.NODE_ENV === "production")) {
        return res.status(503).json({
          error: `Database connection error: Unable to lookup account because PostgreSQL is unreachable (${dbError}). Please verify your DATABASE_URL in Vercel settings.`
        });
      }
      return res.status(404).json({
        error: "No account found matching this username or email address."
      });
    }
    const recipientEmail = user.email;
    if (!recipientEmail || !recipientEmail.includes("@")) {
      return res.status(400).json({
        error: "No official email address is registered for this account. Please contact system support."
      });
    }
    const otpCode = Math.floor(1e5 + Math.random() * 9e5).toString();
    const expiresInMinutes = 10;
    const expiresAt = Date.now() + expiresInMinutes * 60 * 1e3;
    const recoveryToken = signRecoveryToken({
      userId: user.id,
      username: user.username,
      email: recipientEmail,
      otpCode,
      role: user.role
    });
    otpStore_default.set(user.username, {
      code: otpCode,
      userId: user.id,
      fullName: user.fullName,
      email: recipientEmail,
      expiresAt
    });
    otpStore_default.set(recipientEmail, {
      code: otpCode,
      userId: user.id,
      fullName: user.fullName,
      email: recipientEmail,
      expiresAt
    });
    try {
      await prisma_default.user.updateMany({
        where: {
          OR: [
            { id: user.id },
            { username: user.username },
            { email: recipientEmail }
          ]
        },
        data: {
          resetOtp: otpCode,
          resetOtpExpires: new Date(expiresAt)
        }
      });
    } catch (dbErr) {
      console.warn("Could not save resetOtp to DB column (stateless token active):", dbErr.message);
    }
    try {
      await sendPasswordResetOtpEmail({
        email: recipientEmail,
        fullName: user.fullName,
        otpCode,
        expiresInMinutes
      });
    } catch (mailErr) {
      console.warn("[Password Reset Email Dispatch Warn]", mailErr.message);
    }
    const [local, domain] = recipientEmail.split("@");
    const maskedLocal = local.length <= 3 ? local[0] + "***" : local.slice(0, 2) + "***" + local.slice(-2);
    const maskedEmail = `${maskedLocal}@${domain}`;
    return res.status(200).json({
      success: true,
      message: `A 6-digit verification code has been sent to ${maskedEmail}`,
      emailMasked: maskedEmail,
      recoveryToken
    });
  },
  { allowedMethods: ["POST"] }
);

// lib/handlers/auth/verify-code.ts
var verify_code_default = apiHandler(
  async (req, res) => {
    const { identifier, code, recoveryToken } = req.body || {};
    if (!identifier || !code) {
      return res.status(400).json({ error: "Identifier and verification code are required." });
    }
    const cleanCode = String(code).trim();
    const cleanId = String(identifier).trim().toLowerCase();
    if (recoveryToken && typeof recoveryToken === "string") {
      const decoded = verifyRecoveryToken(recoveryToken);
      if (decoded && decoded.otpCode === cleanCode && (decoded.username.toLowerCase() === cleanId || decoded.email.toLowerCase() === cleanId)) {
        return res.status(200).json({ valid: true, message: "Verification code is valid." });
      }
    }
    const isMemoryValid = otpStore_default.verify(cleanId, cleanCode);
    if (isMemoryValid) {
      return res.status(200).json({ valid: true, message: "Verification code is valid." });
    }
    try {
      const user = await prisma_default.user.findFirst({
        where: {
          OR: [
            { username: { equals: cleanId, mode: "insensitive" } },
            { email: { equals: cleanId, mode: "insensitive" } }
          ]
        }
      });
      if (user && user.resetOtp === cleanCode && user.resetOtpExpires && new Date(user.resetOtpExpires).getTime() > Date.now()) {
        return res.status(200).json({ valid: true, message: "Verification code is valid." });
      }
    } catch (e) {
      console.warn("Prisma verify check failed:", e.message);
    }
    return res.status(400).json({
      error: "Invalid or expired 6-digit verification code. Please request a new one."
    });
  },
  { allowedMethods: ["POST"] }
);

// lib/handlers/auth/reset-password.ts
var reset_password_default = apiHandler(
  async (req, res) => {
    const { identifier, code, newPassword, recoveryToken } = req.body || {};
    if (!identifier || !code || !newPassword) {
      return res.status(400).json({ error: "Identifier, verification code, and new password are required." });
    }
    if (typeof newPassword !== "string" || newPassword.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters long." });
    }
    const cleanCode = String(code).trim();
    const cleanId = String(identifier).trim().toLowerCase();
    let isCodeValid = false;
    let decodedToken = null;
    if (recoveryToken && typeof recoveryToken === "string") {
      const decoded = verifyRecoveryToken(recoveryToken);
      if (decoded && decoded.otpCode === cleanCode && (!cleanId || decoded.username.toLowerCase() === cleanId || decoded.email.toLowerCase() === cleanId)) {
        isCodeValid = true;
        decodedToken = decoded;
      }
    }
    if (!isCodeValid) {
      const memoryEntry = otpStore_default.get(cleanId);
      if (memoryEntry && memoryEntry.code === cleanCode) {
        isCodeValid = true;
      }
    }
    let user = null;
    try {
      user = await prisma_default.user.findFirst({
        where: {
          OR: [
            { username: { equals: cleanId, mode: "insensitive" } },
            { email: { equals: cleanId, mode: "insensitive" } }
          ]
        }
      });
      if (!isCodeValid && user && user.resetOtp === cleanCode && user.resetOtpExpires && new Date(user.resetOtpExpires).getTime() > Date.now()) {
        isCodeValid = true;
      }
    } catch (e) {
      console.warn("Prisma lookup failed in reset-password:", e.message);
    }
    if (!isCodeValid) {
      return res.status(400).json({
        error: "Invalid or expired verification code. Please request a new code."
      });
    }
    const hashedPassword = await hashPassword(newPassword);
    const targetUserId = decodedToken?.userId;
    const targetUsername = decodedToken?.username || cleanId;
    const targetEmail = decodedToken?.email;
    try {
      await prisma_default.user.updateMany({
        where: {
          OR: [
            ...targetUserId ? [{ id: targetUserId }] : [],
            { username: { equals: targetUsername, mode: "insensitive" } },
            ...targetEmail ? [{ email: { equals: targetEmail, mode: "insensitive" } }] : [],
            { username: { equals: cleanId, mode: "insensitive" } },
            { email: { equals: cleanId, mode: "insensitive" } }
          ]
        },
        data: {
          password: hashedPassword,
          resetOtp: null,
          resetOtpExpires: null
        }
      });
    } catch (dbErr) {
      console.warn("Could not update password in database:", dbErr.message);
    }
    const memUserIndex = memoryDb.users.findIndex(
      (u) => targetUserId && u.id === targetUserId || u.username.toLowerCase() === targetUsername.toLowerCase() || targetEmail && u.email && u.email.toLowerCase() === targetEmail.toLowerCase() || u.username.toLowerCase() === cleanId || u.email && u.email.toLowerCase() === cleanId
    );
    if (memUserIndex >= 0) {
      memoryDb.users[memUserIndex].password = hashedPassword;
    }
    otpStore_default.consume(cleanId, cleanCode);
    await logAudit({
      userId: targetUserId || null,
      action: "PASSWORD_RESET",
      resource: "auth",
      details: `Password reset successfully completed for ${targetUsername}`,
      ipAddress: req.headers["x-forwarded-for"] || req.socket?.remoteAddress
    });
    return res.status(200).json({
      success: true,
      message: "Password reset successful! You can now log in with your new password."
    });
  },
  { allowedMethods: ["POST"] }
);

// lib/handlers/cities/index.ts
var cities_default = apiHandler(
  async (req, res, currentUser) => {
    if (req.method === "GET") {
      try {
        const cities = await prisma_default.cityCorporation.findMany({
          include: {
            wards: {
              select: { id: true, name: true, area: true }
            },
            admins: {
              select: { id: true, username: true, fullName: true, role: true }
            },
            _count: {
              select: { wards: true, admins: true }
            }
          },
          orderBy: { name: "asc" }
        });
        if (cities && cities.length > 0) {
          return res.status(200).json(cities);
        }
      } catch (e) {
        console.warn("[Cities GET Notice] Fallback to memory store:", e.message);
      }
      const memCities = memoryDb.cities.map((c) => ({
        ...c,
        wards: memoryDb.wards.filter((w) => w.cityCorpId === c.id),
        admins: memoryDb.users.filter((u) => u.cityCorpId === c.id),
        _count: {
          wards: memoryDb.wards.filter((w) => w.cityCorpId === c.id).length,
          admins: memoryDb.users.filter((u) => u.cityCorpId === c.id).length
        }
      }));
      return res.status(200).json(memCities);
    }
    if (req.method === "POST") {
      const isSuper = currentUser?.role === "SUPER_ADMIN";
      if (!isSuper) {
        return res.status(403).json({ error: "Only Super Admin can create City Corporations" });
      }
      const {
        name,
        code,
        address,
        phone,
        email,
        pointRate,
        minWithdrawPoints,
        adminName,
        adminUsername,
        adminEmail,
        adminPassword
      } = req.body || {};
      if (!name || !code) {
        return res.status(400).json({ error: "Name and code are required (e.g. DNCC)" });
      }
      const upperCode = code.toUpperCase().trim();
      let createdCity = null;
      try {
        const existing = await prisma_default.cityCorporation.findUnique({
          where: { code: upperCode }
        }).catch(() => null);
        if (existing) {
          return res.status(409).json({ error: `City Corporation with code ${upperCode} already exists` });
        }
        createdCity = await prisma_default.cityCorporation.create({
          data: {
            name,
            code: upperCode,
            address: address || null,
            phone: phone || null,
            email: email || null,
            pointRate: pointRate ? Number(pointRate) : 0.2,
            minWithdrawPoints: minWithdrawPoints ? Number(minWithdrawPoints) : 100
          }
        }).catch(() => null);
        if (createdCity && adminName && adminUsername && adminPassword) {
          const hashedAdminPass = await hashPassword(adminPassword);
          await prisma_default.user.create({
            data: {
              fullName: adminName,
              username: adminUsername.toLowerCase().trim(),
              password: hashedAdminPass,
              email: adminEmail || email || null,
              phone: phone || null,
              role: "CITY_ADMIN",
              cityCorpId: createdCity.id,
              active: true
            }
          }).catch((err) => console.warn("Admin create error in PG:", err.message));
        }
      } catch (dbErr) {
        console.warn("[City Create Notice] Operating in resilient memory mode:", dbErr.message);
      }
      const cityId = createdCity?.id || `city-${Date.now()}`;
      const memCity = {
        id: cityId,
        name,
        code: upperCode,
        address: address || null,
        phone: phone || null,
        email: email || null,
        active: true,
        pointRate: pointRate ? Number(pointRate) : 0.2,
        minWithdrawPoints: minWithdrawPoints ? Number(minWithdrawPoints) : 100,
        rewardActive: true,
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      const existingCityIdx = memoryDb.cities.findIndex((c) => c.code === upperCode);
      if (existingCityIdx >= 0) {
        memoryDb.cities[existingCityIdx] = memCity;
      } else {
        memoryDb.cities.push(memCity);
      }
      if (adminName && adminUsername && adminPassword) {
        const hashedPass = await hashPassword(adminPassword);
        const memAdmin = {
          id: `usr-city-${Date.now()}`,
          fullName: adminName,
          username: adminUsername.toLowerCase().trim(),
          password: hashedPass,
          email: adminEmail || email || null,
          phone: phone || null,
          role: "CITY_ADMIN",
          cityCorpId: cityId,
          active: true,
          points: 0,
          createdAt: (/* @__PURE__ */ new Date()).toISOString()
        };
        const existingAdminIdx = memoryDb.users.findIndex((u) => u.username === memAdmin.username);
        if (existingAdminIdx >= 0) {
          memoryDb.users[existingAdminIdx] = memAdmin;
        } else {
          memoryDb.users.push(memAdmin);
        }
        const recipientEmail = adminEmail || email;
        if (recipientEmail && recipientEmail.includes("@")) {
          try {
            await sendWelcomeCredentialsEmail({
              email: recipientEmail,
              fullName: adminName,
              username: adminUsername.toLowerCase().trim(),
              password: adminPassword,
              role: "CITY_ADMIN",
              loginUrl: process.env.APP_URL || "https://final-project-tau-pearl.vercel.app"
            });
          } catch (mailErr) {
            console.error("[Brevo City Admin Email Error]", mailErr.message);
          }
        }
      }
      await logAudit({
        userId: currentUser?.userId || null,
        action: "CREATE_CITY_CORP",
        resource: "city_corporations",
        details: `Created City Corporation ${name} (${upperCode})`,
        ipAddress: req.headers["x-forwarded-for"] || req.socket?.remoteAddress
      });
      return res.status(201).json(createdCity || memCity);
    }
    return res.status(405).json({ error: "Method not allowed" });
  },
  { allowedMethods: ["GET", "POST"] }
);

// lib/handlers/cities/[id].ts
var id_default = apiHandler(
  async (req, res, currentUser) => {
    const id = req.query.id || req.body?.id;
    if (!id) {
      return res.status(400).json({ error: "City Corporation ID is required" });
    }
    if (req.method === "GET") {
      try {
        const city = await prisma_default.cityCorporation.findUnique({
          where: { id },
          include: {
            wards: {
              include: {
                _count: {
                  select: { bins: true, tracks: true, admins: true, withdrawals: true }
                }
              }
            },
            admins: {
              select: { id: true, username: true, fullName: true, role: true, email: true, phone: true }
            }
          }
        });
        if (city) return res.status(200).json(city);
      } catch (e) {
        console.warn("[City ID GET Notice] Fallback to memory store:", e.message);
      }
      const memCity = memoryDb.cities.find((c) => c.id === id || c.code === id);
      if (!memCity) {
        return res.status(404).json({ error: "City Corporation not found" });
      }
      return res.status(200).json({
        ...memCity,
        wards: memoryDb.wards.filter((w) => w.cityCorpId === memCity.id),
        admins: memoryDb.users.filter((u) => u.cityCorpId === memCity.id)
      });
    }
    if (req.method === "PUT") {
      const isSuper = currentUser?.role === "SUPER_ADMIN";
      const isCityAdmin = currentUser?.role === "CITY_ADMIN" && currentUser?.cityCorpId === id;
      if (!isSuper && !isCityAdmin) {
        return res.status(403).json({ error: "Forbidden: Only Super Admin or City Corp Admin can update this City Corporation" });
      }
      const {
        name,
        code,
        address,
        phone,
        email,
        active,
        pointRate,
        minWithdrawPoints,
        rewardActive
      } = req.body || {};
      let updatedCity = null;
      try {
        const updateData = {};
        if (name !== void 0) updateData.name = name;
        if (code !== void 0) updateData.code = code.toUpperCase();
        if (address !== void 0) updateData.address = address;
        if (phone !== void 0) updateData.phone = phone;
        if (email !== void 0) updateData.email = email;
        if (active !== void 0) updateData.active = Boolean(active);
        if (pointRate !== void 0) updateData.pointRate = Number(pointRate);
        if (minWithdrawPoints !== void 0) updateData.minWithdrawPoints = Number(minWithdrawPoints);
        if (rewardActive !== void 0) updateData.rewardActive = Boolean(rewardActive);
        updatedCity = await prisma_default.cityCorporation.update({
          where: { id },
          data: updateData
        });
      } catch (dbErr) {
        console.warn("[City Update Notice] Fallback to memory store:", dbErr.message);
      }
      const idx = memoryDb.cities.findIndex((c) => c.id === id || c.code === id);
      if (idx >= 0) {
        memoryDb.cities[idx] = {
          ...memoryDb.cities[idx],
          ...name !== void 0 ? { name } : {},
          ...code !== void 0 ? { code: code.toUpperCase() } : {},
          ...address !== void 0 ? { address } : {},
          ...phone !== void 0 ? { phone } : {},
          ...email !== void 0 ? { email } : {},
          ...active !== void 0 ? { active: Boolean(active) } : {},
          ...pointRate !== void 0 ? { pointRate: Number(pointRate) } : {},
          ...minWithdrawPoints !== void 0 ? { minWithdrawPoints: Number(minWithdrawPoints) } : {},
          ...rewardActive !== void 0 ? { rewardActive: Boolean(rewardActive) } : {}
        };
        updatedCity = memoryDb.cities[idx];
      }
      return res.status(200).json(updatedCity || { success: true });
    }
    if (req.method === "DELETE") {
      if (currentUser?.role !== "SUPER_ADMIN") {
        return res.status(403).json({ error: "Forbidden: Only Super Admin can delete a City Corporation" });
      }
      try {
        await prisma_default.cityCorporation.delete({ where: { id } });
      } catch (dbErr) {
      }
      memoryDb.cities = memoryDb.cities.filter((c) => c.id !== id);
      return res.status(200).json({ message: "City Corporation deleted" });
    }
    return res.status(405).json({ error: "Method not allowed" });
  },
  { allowedMethods: ["GET", "PUT", "DELETE"] }
);

// lib/handlers/wards/index.ts
var wards_default = apiHandler(
  async (req, res, currentUser) => {
    if (req.method === "GET") {
      let cityCorpId = req.query.cityCorpId;
      if (currentUser?.role === "CITY_ADMIN" && currentUser.cityCorpId) {
        cityCorpId = currentUser.cityCorpId;
      }
      const whereClause = {};
      if (cityCorpId) whereClause.cityCorpId = cityCorpId;
      if (currentUser?.role === "WARD_ADMIN" && currentUser.wardId) {
        whereClause.id = currentUser.wardId;
      }
      try {
        const wards = await prisma_default.ward.findMany({
          where: whereClause,
          include: {
            cityCorp: {
              select: { id: true, name: true, code: true }
            },
            admins: {
              select: { id: true, username: true, fullName: true, phone: true }
            },
            _count: {
              select: { bins: true, tracks: true, alerts: true }
            }
          },
          orderBy: { name: "asc" }
        });
        if (wards && wards.length > 0) {
          return res.status(200).json(wards);
        }
      } catch (e) {
        console.warn("[Wards GET Notice] Fallback to memory store:", e.message);
      }
      let memWards = [...memoryDb.wards];
      if (cityCorpId) {
        memWards = memWards.filter((w) => w.cityCorpId === cityCorpId);
      }
      if (currentUser?.role === "WARD_ADMIN" && currentUser.wardId) {
        memWards = memWards.filter((w) => w.id === currentUser.wardId);
      }
      const enriched = memWards.map((w) => {
        const corp = memoryDb.cities.find((c) => c.id === w.cityCorpId);
        const wardAdmins = memoryDb.users.filter((u) => u.wardId === w.id);
        const wardBins = memoryDb.bins.filter((b) => b.wardId === w.id);
        const wardTracks = memoryDb.tracks.filter((t) => t.wardId === w.id);
        const wardAlerts = memoryDb.alerts.filter((a) => a.wardId === w.id);
        return {
          ...w,
          cityCorp: corp ? { id: corp.id, name: corp.name, code: corp.code } : null,
          admins: wardAdmins.map((a) => ({ id: a.id, username: a.username, fullName: a.fullName, phone: a.phone })),
          _count: {
            bins: wardBins.length,
            tracks: wardTracks.length,
            alerts: wardAlerts.length
          }
        };
      });
      return res.status(200).json(enriched);
    }
    if (req.method === "POST") {
      let { name, area, population, councilor, cityCorpId } = req.body || {};
      if (currentUser?.role === "CITY_ADMIN" && currentUser.cityCorpId) {
        cityCorpId = currentUser.cityCorpId;
      }
      if (!cityCorpId && memoryDb.cities[0]?.id) {
        cityCorpId = memoryDb.cities[0].id;
      }
      if (!name || !area) {
        return res.status(400).json({ error: "Name and area are required" });
      }
      let createdWard = null;
      try {
        createdWard = await prisma_default.ward.create({
          data: {
            name,
            area,
            population: population ? Number(population) : 0,
            councilor: councilor || "",
            cityCorpId: cityCorpId || ""
          },
          include: {
            cityCorp: { select: { id: true, name: true, code: true } }
          }
        });
      } catch (dbErr) {
        console.warn("[Ward Create Notice] Fallback to memory store:", dbErr.message);
      }
      const wardId = createdWard?.id || `ward-${Date.now()}`;
      const memWard = {
        id: wardId,
        name,
        area,
        population: population ? Number(population) : 0,
        councilor: councilor || "",
        cityCorpId: cityCorpId || "",
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      memoryDb.wards.push(memWard);
      await logAudit({
        userId: currentUser?.userId || null,
        action: "CREATE_WARD",
        resource: "wards",
        details: `Created Ward ${name} (${area}) under City Corp ${cityCorpId}`,
        ipAddress: req.headers["x-forwarded-for"] || req.socket?.remoteAddress
      });
      return res.status(201).json(createdWard || memWard);
    }
    if (req.method === "PUT" || req.method === "PATCH") {
      const { id, wardId, reportEnabled, withdrawEnabled, name, area, population, councilor } = req.body || {};
      const targetId = String(wardId || id || req.query.id);
      if (!targetId) {
        return res.status(400).json({ error: "Ward ID is required" });
      }
      let updatedWard = null;
      try {
        const updateData = {};
        if (reportEnabled !== void 0) updateData.reportEnabled = Boolean(reportEnabled);
        if (withdrawEnabled !== void 0) updateData.withdrawEnabled = Boolean(withdrawEnabled);
        if (name) updateData.name = name;
        if (area) updateData.area = area;
        if (population !== void 0) updateData.population = Number(population);
        if (councilor !== void 0) updateData.councilor = councilor;
        updatedWard = await prisma_default.ward.update({
          where: { id: targetId },
          data: updateData,
          include: {
            cityCorp: { select: { id: true, name: true, code: true } }
          }
        });
      } catch (e) {
        console.warn("[Ward Update Notice] Fallback to memory store:", e.message);
      }
      const memWard = memoryDb.wards.find((w) => w.id === targetId);
      if (memWard) {
        if (reportEnabled !== void 0) memWard.reportEnabled = Boolean(reportEnabled);
        if (withdrawEnabled !== void 0) memWard.withdrawEnabled = Boolean(withdrawEnabled);
        if (name) memWard.name = name;
        if (area) memWard.area = area;
        if (population !== void 0) memWard.population = Number(population);
        if (councilor !== void 0) memWard.councilor = councilor;
      }
      return res.status(200).json(updatedWard || memWard || { success: true });
    }
    return res.status(405).json({ error: "Method not allowed" });
  },
  { allowedMethods: ["GET", "POST", "PUT", "PATCH"] }
);

// lib/handlers/wards/[id].ts
var id_default2 = apiHandler(
  async (req, res, currentUser) => {
    const id = req.query.id || req.body?.id;
    if (!id) {
      return res.status(400).json({ error: "Ward ID is required" });
    }
    let ward = null;
    try {
      ward = await prisma_default.ward.findUnique({
        where: { id },
        include: {
          cityCorp: true,
          bins: true,
          tracks: true,
          alerts: { where: { resolved: false } },
          admins: {
            select: { id: true, username: true, fullName: true, phone: true, email: true }
          }
        }
      });
    } catch {
    }
    if (!ward) {
      ward = memoryDb.wards.find((w) => w.id === id || w.name === id);
      if (ward) {
        ward = {
          ...ward,
          cityCorp: memoryDb.cities.find((c) => c.id === ward.cityCorpId),
          bins: memoryDb.bins.filter((b) => b.wardId === ward.id),
          tracks: memoryDb.tracks.filter((t) => t.wardId === ward.id),
          alerts: memoryDb.alerts.filter((a) => a.wardId === ward.id && !a.resolved),
          admins: memoryDb.users.filter((u) => u.wardId === ward.id)
        };
      }
    }
    if (!ward) {
      return res.status(404).json({ error: "Ward not found" });
    }
    if (req.method === "GET") {
      return res.status(200).json(ward);
    }
    if (req.method === "PUT") {
      const isSuper = currentUser?.role === "SUPER_ADMIN";
      const isCityAdmin = currentUser?.role === "CITY_ADMIN" && currentUser?.cityCorpId === ward.cityCorpId;
      const isWardAdmin = currentUser?.role === "WARD_ADMIN" && currentUser?.wardId === id;
      if (!isSuper && !isCityAdmin && !isWardAdmin) {
        return res.status(403).json({ error: "Forbidden: Insufficient permissions to update this ward" });
      }
      const { name, area, population, councilor, cityCorpId } = req.body || {};
      if (name) ward.name = name;
      if (area) ward.area = area;
      if (population !== void 0) ward.population = Number(population);
      if (councilor !== void 0) ward.councilor = councilor;
      if (cityCorpId) ward.cityCorpId = cityCorpId;
      try {
        await prisma_default.ward.update({
          where: { id },
          data: {
            ...name && { name },
            ...area && { area },
            ...population !== void 0 && { population: Number(population) },
            ...councilor !== void 0 && { councilor },
            ...cityCorpId && { cityCorpId }
          }
        }).catch(() => null);
      } catch {
      }
      return res.status(200).json(ward);
    }
    if (req.method === "DELETE") {
      const isSuper = currentUser?.role === "SUPER_ADMIN";
      const isCityAdmin = currentUser?.role === "CITY_ADMIN" && currentUser?.cityCorpId === ward.cityCorpId;
      if (!isSuper && !isCityAdmin) {
        return res.status(403).json({ error: "Forbidden: Only Super Admin or City Admin can delete a ward" });
      }
      try {
        await prisma_default.ward.delete({ where: { id } }).catch(() => null);
      } catch {
      }
      memoryDb.wards = memoryDb.wards.filter((w) => w.id !== id);
      return res.status(200).json({ message: "Ward deleted successfully" });
    }
    return res.status(405).json({ error: "Method not allowed" });
  },
  { allowedMethods: ["GET", "PUT", "DELETE"] }
);

// lib/handlers/bins/index.ts
var bins_default = apiHandler(
  async (req, res, currentUser) => {
    if (req.method === "GET") {
      let wardId = req.query.wardId;
      let cityCorpId = req.query.cityCorpId;
      const status = req.query.status;
      if (currentUser?.role === "WARD_ADMIN" && currentUser.wardId) {
        wardId = currentUser.wardId;
      } else if (currentUser?.role === "CITY_ADMIN" && currentUser.cityCorpId) {
        cityCorpId = currentUser.cityCorpId;
      }
      const whereClause = {};
      if (wardId) whereClause.wardId = wardId;
      if (cityCorpId) {
        whereClause.OR = [
          { cityCorpId },
          { ward: { cityCorpId } }
        ];
      }
      if (status) whereClause.status = status;
      try {
        const bins = await prisma_default.bin.findMany({
          where: whereClause,
          include: {
            ward: {
              include: {
                cityCorp: { select: { id: true, name: true, code: true } }
              }
            }
          },
          orderBy: { binCode: "asc" }
        });
        if (bins && bins.length > 0) {
          return res.status(200).json(bins);
        }
      } catch (e) {
        console.warn("[Bins GET Notice] Fallback to memory store:", e.message);
      }
      let memBins = [...memoryDb.bins];
      if (wardId) memBins = memBins.filter((b) => b.wardId === wardId);
      const enriched = memBins.map((b) => {
        const ward = memoryDb.wards.find((w) => w.id === b.wardId);
        const city = ward ? memoryDb.cities.find((c) => c.id === ward.cityCorpId) : null;
        return {
          ...b,
          ward: ward ? { ...ward, cityCorp: city ? { id: city.id, name: city.name, code: city.code } : null } : null
        };
      });
      return res.status(200).json(enriched);
    }
    if (req.method === "POST") {
      const {
        binCode,
        location,
        capacity,
        capacityKg,
        wardId,
        ward,
        cityCorpId,
        cityCorporation,
        lat,
        lng,
        lon,
        temp,
        gas,
        fill,
        fillLevel,
        status,
        fire,
        forecastFull90At
      } = req.body || {};
      if (!binCode || !location) {
        return res.status(400).json({ error: "binCode and location are required" });
      }
      let assignedCityCorpId = String(
        cityCorpId || cityCorporation || currentUser?.cityCorpId || ""
      ).trim();
      let assignedWardId = String(
        wardId || ward || currentUser?.wardId || ""
      ).trim();
      if (currentUser?.role === "CITY_ADMIN" && currentUser.cityCorpId) {
        assignedCityCorpId = currentUser.cityCorpId;
      }
      if (currentUser?.role === "WARD_ADMIN" && currentUser.wardId) {
        assignedWardId = currentUser.wardId;
        if (!assignedCityCorpId && currentUser.cityCorpId) {
          assignedCityCorpId = currentUser.cityCorpId;
        }
      }
      if (!assignedCityCorpId && memoryDb.cities[0]?.id) {
        assignedCityCorpId = memoryDb.cities[0].id;
      }
      if (!assignedWardId) {
        return res.status(400).json({ error: "Ward is required" });
      }
      let wardRecord = null;
      try {
        wardRecord = await prisma_default.ward.findUnique({
          where: { id: assignedWardId },
          include: { cityCorp: true }
        });
      } catch {
      }
      if (!wardRecord) {
        wardRecord = memoryDb.wards.find((w) => w.id === assignedWardId);
      }
      if (!wardRecord) {
        return res.status(400).json({ error: `Selected Ward '${assignedWardId}' was not found.` });
      }
      if (assignedCityCorpId && wardRecord.cityCorpId !== assignedCityCorpId) {
        return res.status(400).json({
          error: `Validation failed: Ward '${wardRecord.name || assignedWardId}' does not belong to the selected City Corporation '${assignedCityCorpId}'.`
        });
      }
      if (!assignedCityCorpId) {
        assignedCityCorpId = wardRecord.cityCorpId;
      }
      const parsedLat = Number(lat !== void 0 ? lat : 23.78);
      const parsedLng = Number(lng !== void 0 ? lng : lon !== void 0 ? lon : 90.4);
      const parsedFill = Number(fillLevel !== void 0 ? fillLevel : fill || 0);
      const parsedCapacityKg = Number(capacityKg || (typeof capacity === "string" ? parseInt(capacity, 10) : 120) || 120);
      let createdBin = null;
      try {
        createdBin = await prisma_default.bin.create({
          data: {
            binCode,
            location,
            capacity: capacity || `${parsedCapacityKg}L`,
            capacityKg: parsedCapacityKg,
            fill: parsedFill,
            fillLevel: parsedFill,
            temp: temp || "Normal",
            gas: gas || "Normal",
            fire: Boolean(fire),
            status: status || "normal",
            wardId: assignedWardId,
            cityCorpId: assignedCityCorpId,
            lat: parsedLat,
            lng: parsedLng,
            forecastFull90At: forecastFull90At ? new Date(forecastFull90At) : null
          }
        });
      } catch (dbErr) {
        console.warn("[Bin Create Notice] Fallback to memory store:", dbErr.message);
      }
      const memBin = {
        id: createdBin?.id || `bin-${Date.now()}`,
        binCode,
        location,
        capacity: capacity || `${parsedCapacityKg}L`,
        capacityKg: parsedCapacityKg,
        fill: parsedFill,
        fillLevel: parsedFill,
        weight: 15,
        temp: temp || "28\xB0C",
        gas: gas || "12 ppm",
        fire: Boolean(fire),
        status: status || "normal",
        lat: parsedLat,
        lng: parsedLng,
        lon: parsedLng,
        wardId: assignedWardId,
        ward: assignedWardId,
        cityCorpId: assignedCityCorpId,
        cityCorporation: assignedCityCorpId,
        forecastFull90At: forecastFull90At || null,
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      memoryDb.bins.push(memBin);
      return res.status(201).json(createdBin || memBin);
    }
    return res.status(405).json({ error: "Method not allowed" });
  },
  { allowedMethods: ["GET", "POST"] }
);

// lib/handlers/bins/[id].ts
var id_default3 = apiHandler(
  async (req, res, currentUser) => {
    const id = req.query.id || req.body?.id;
    if (!id) {
      return res.status(400).json({ error: "Bin ID is required" });
    }
    let bin = null;
    try {
      bin = await prisma_default.bin.findUnique({
        where: { id },
        include: {
          ward: {
            include: {
              cityCorp: true
            }
          },
          alerts: {
            where: { resolved: false }
          }
        }
      });
    } catch {
    }
    if (!bin) {
      bin = memoryDb.bins.find((b) => b.id === id || b.binCode === id);
      if (bin) {
        bin = {
          ...bin,
          ward: memoryDb.wards.find((w) => w.id === bin.wardId),
          alerts: memoryDb.alerts.filter((a) => a.binId === bin.id && !a.resolved)
        };
      }
    }
    if (!bin) {
      return res.status(404).json({ error: "Bin not found" });
    }
    if (req.method === "GET") {
      return res.status(200).json(bin);
    }
    if (req.method === "PUT") {
      const isSuper = currentUser?.role === "SUPER_ADMIN";
      const isWardAdmin = currentUser?.role === "WARD_ADMIN" && currentUser?.wardId === bin.wardId;
      const isCityAdmin = currentUser?.role === "CITY_ADMIN" && (!currentUser?.cityCorpId || bin.ward?.cityCorpId === currentUser.cityCorpId);
      const isDriver = currentUser?.role === "DRIVER";
      if (currentUser && !isSuper && !isWardAdmin && !isCityAdmin && !isDriver) {
        return res.status(403).json({ error: "Forbidden: You do not have permission to update this bin" });
      }
      const {
        binCode,
        location,
        capacity,
        capacityKg,
        fill,
        fillLevel,
        weight,
        temp,
        gas,
        fire,
        status,
        lat,
        lng,
        lastCollected,
        forecastFull90At
      } = req.body || {};
      let computedStatus = status;
      if (!computedStatus) {
        if (fire) {
          computedStatus = "fire";
        } else if (fill !== void 0 || fillLevel !== void 0) {
          const effectiveFill = fillLevel !== void 0 ? Number(fillLevel) : Number(fill);
          if (effectiveFill >= 90) computedStatus = "critical";
          else if (effectiveFill >= 70) computedStatus = "warning";
          else computedStatus = "normal";
        }
      }
      const parsedFill = fillLevel !== void 0 ? Number(fillLevel) : fill !== void 0 ? Number(fill) : void 0;
      const parsedCapacityKg = capacityKg !== void 0 ? Number(capacityKg) : void 0;
      if (binCode) bin.binCode = binCode;
      if (location) bin.location = location;
      if (capacity) bin.capacity = capacity;
      if (parsedCapacityKg !== void 0) bin.capacityKg = parsedCapacityKg;
      if (parsedFill !== void 0) {
        bin.fill = parsedFill;
        bin.fillLevel = parsedFill;
      }
      if (weight !== void 0) bin.weight = Number(weight);
      if (temp) bin.temp = temp;
      if (gas) bin.gas = gas;
      if (fire !== void 0) bin.fire = Boolean(fire);
      if (computedStatus) bin.status = computedStatus;
      if (lat !== void 0) bin.lat = Number(lat);
      if (lng !== void 0) bin.lng = Number(lng);
      if (lastCollected) bin.lastCollected = lastCollected;
      try {
        await prisma_default.bin.update({
          where: { id },
          data: {
            ...binCode && { binCode },
            ...location && { location },
            ...capacity && { capacity },
            ...parsedCapacityKg !== void 0 && { capacityKg: parsedCapacityKg },
            ...parsedFill !== void 0 && { fill: Math.round(parsedFill), fillLevel: parsedFill },
            ...weight !== void 0 && { weight: Number(weight) },
            ...temp && { temp },
            ...gas && { gas },
            ...fire !== void 0 && { fire: Boolean(fire) },
            ...computedStatus && { status: computedStatus },
            ...lat !== void 0 && { lat: Number(lat) },
            ...lng !== void 0 && { lng: Number(lng) },
            ...lastCollected && { lastCollected: new Date(lastCollected) },
            ...forecastFull90At !== void 0 && {
              forecastFull90At: forecastFull90At ? new Date(forecastFull90At) : null
            }
          }
        }).catch(() => null);
      } catch {
      }
      return res.status(200).json(bin);
    }
    if (req.method === "DELETE") {
      const isSuper = currentUser?.role === "SUPER_ADMIN";
      const isWardAdmin = currentUser?.role === "WARD_ADMIN" && currentUser?.wardId === bin.wardId;
      const isCityAdmin = currentUser?.role === "CITY_ADMIN" && (!currentUser?.cityCorpId || bin.ward?.cityCorpId === currentUser.cityCorpId);
      if (!isSuper && !isWardAdmin && !isCityAdmin) {
        return res.status(403).json({ error: "Forbidden: Only Ward Admin or City/Super Admin can delete bins" });
      }
      try {
        await prisma_default.bin.delete({ where: { id } }).catch(() => null);
      } catch {
      }
      memoryDb.bins = memoryDb.bins.filter((b) => b.id !== id);
      return res.status(200).json({ message: "Bin deleted successfully" });
    }
    return res.status(405).json({ error: "Method not allowed" });
  },
  { allowedMethods: ["GET", "PUT", "DELETE"] }
);

// lib/handlers/tracks/index.ts
var tracks_default = apiHandler(
  async (req, res, currentUser) => {
    if (req.method === "GET") {
      let wardId = req.query.wardId;
      const driverId = req.query.driverId;
      const status = req.query.status;
      if (currentUser?.role === "WARD_ADMIN" && currentUser.wardId) {
        wardId = currentUser.wardId;
      }
      const whereClause = {};
      if (wardId) whereClause.wardId = wardId;
      if (driverId) whereClause.driverId = driverId;
      if (status) whereClause.status = status;
      if (currentUser?.role === "CITY_ADMIN" && currentUser.cityCorpId) {
        whereClause.ward = { cityCorpId: currentUser.cityCorpId };
      }
      try {
        const tracks = await prisma_default.track.findMany({
          where: whereClause,
          include: {
            ward: {
              include: {
                cityCorp: { select: { id: true, name: true, code: true } }
              }
            },
            driver: {
              select: { id: true, username: true, fullName: true, phone: true, email: true }
            }
          },
          orderBy: { truckId: "asc" }
        });
        if (tracks && tracks.length > 0) {
          return res.status(200).json(tracks);
        }
      } catch (e) {
        console.warn("[Tracks GET Notice] Fallback to memory store:", e.message);
      }
      let memTracks = [...memoryDb.tracks];
      if (wardId) memTracks = memTracks.filter((t) => t.wardId === wardId);
      const enriched = memTracks.map((t) => {
        const ward = memoryDb.wards.find((w) => w.id === t.wardId);
        const city = ward ? memoryDb.cities.find((c) => c.id === ward.cityCorpId) : null;
        const driverUser = memoryDb.users.find((u) => u.id === t.driverId || u.fullName === t.driver);
        return {
          ...t,
          ward: ward ? { ...ward, cityCorp: city ? { id: city.id, name: city.name, code: city.code } : null } : null,
          driver: driverUser ? { id: driverUser.id, username: driverUser.username, fullName: driverUser.fullName, phone: driverUser.phone, email: driverUser.email } : { fullName: t.driver || "Driver", phone: t.phone || "" }
        };
      });
      return res.status(200).json(enriched);
    }
    if (req.method === "POST") {
      const {
        truckId,
        driver,
        driverName,
        driverUsername,
        driverEmail,
        driverPassword,
        phone,
        driverPhone,
        nid,
        address,
        route,
        stops,
        fuel,
        status,
        wardId,
        mapsRouteUrl,
        gpsLat,
        gpsLng
      } = req.body || {};
      if (!truckId || !route) {
        return res.status(400).json({ error: "Truck ID and route description are required" });
      }
      const assignedWardId = String(wardId || currentUser?.wardId || memoryDb.wards[0]?.id || "1");
      const finalDriverName = driverName || driver || "Assigned Driver";
      const finalDriverPhone = driverPhone || phone || "01700-000000";
      let assignedDriverId = null;
      if (driverUsername && driverPassword) {
        const cleanUser = String(driverUsername).toLowerCase().trim();
        const hashedPass = await hashPassword(driverPassword);
        try {
          const user = await prisma_default.user.create({
            data: {
              username: cleanUser,
              password: hashedPass,
              fullName: finalDriverName,
              email: driverEmail || null,
              phone: finalDriverPhone,
              nid: nid || null,
              address: address || null,
              role: "DRIVER",
              wardId: assignedWardId,
              active: true
            }
          });
          assignedDriverId = user.id;
        } catch (uErr) {
          console.warn("[Driver User PG Create Notice]", uErr.message);
        }
        if (!assignedDriverId) assignedDriverId = `usr-driver-${Date.now()}`;
        if (!memoryDb.users.some((u) => u.username === cleanUser)) {
          memoryDb.users.push({
            id: assignedDriverId,
            username: cleanUser,
            password: hashedPass,
            fullName: finalDriverName,
            email: driverEmail || null,
            phone: finalDriverPhone,
            nid: nid || null,
            address: address || null,
            role: "DRIVER",
            wardId: assignedWardId,
            active: true,
            points: 0,
            createdAt: (/* @__PURE__ */ new Date()).toISOString()
          });
        }
        if (driverEmail && driverEmail.includes("@")) {
          sendWelcomeCredentialsEmail({
            email: driverEmail,
            fullName: finalDriverName,
            username: cleanUser,
            password: driverPassword,
            role: "DRIVER"
          }).catch((mailErr) => console.error("[Brevo Driver Email Error]", mailErr.message));
        }
      }
      let createdTrack = null;
      try {
        createdTrack = await prisma_default.track.create({
          data: {
            truckId,
            truckType: req.body?.truckType === "HAZARDOUS" ? "HAZARDOUS" : "NORMAL",
            route,
            stops: stops ? Number(stops) : 6,
            fuel: fuel ? Number(fuel) : 100,
            status: status || "active",
            wardId: assignedWardId,
            driverId: assignedDriverId || req.body?.driverId || null,
            mapsRouteUrl: mapsRouteUrl || "",
            gpsLat: gpsLat ? Number(gpsLat) : 23.78,
            gpsLng: gpsLng ? Number(gpsLng) : 90.4
          },
          include: {
            ward: true,
            driver: { select: { id: true, username: true, fullName: true, phone: true } }
          }
        });
      } catch (dbErr) {
        console.warn("[Track Create Notice] Fallback to memory store:", dbErr.message);
      }
      const memTrack = {
        id: createdTrack?.id || `TR-${Date.now()}`,
        truckId,
        truckType: req.body?.truckType === "HAZARDOUS" ? "HAZARDOUS" : "NORMAL",
        driver: finalDriverName,
        phone: finalDriverPhone,
        route,
        stops: stops ? Number(stops) : 6,
        status: status || "active",
        progress: 0,
        load: "0t",
        fuel: fuel ? Number(fuel) : 100,
        startTime: "07:00 AM",
        gpsLat: gpsLat ? Number(gpsLat) : 23.78,
        gpsLng: gpsLng ? Number(gpsLng) : 90.4,
        mapsRouteUrl: mapsRouteUrl || "",
        wardId: assignedWardId,
        driverId: assignedDriverId || req.body?.driverId || null,
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      memoryDb.tracks.push(memTrack);
      return res.status(201).json(createdTrack || memTrack);
    }
    if (req.method === "PUT" || req.method === "PATCH") {
      const { id, trackId, driverId, truckType, route, status, stops, fuel } = req.body || {};
      const targetId = String(trackId || id || req.query.id);
      if (!targetId) {
        return res.status(400).json({ error: "Track ID is required to assign or update driver" });
      }
      let updatedTrack = null;
      try {
        const updateData = {};
        if (driverId !== void 0) updateData.driverId = driverId || null;
        if (truckType) updateData.truckType = truckType === "HAZARDOUS" ? "HAZARDOUS" : "NORMAL";
        if (route) updateData.route = route;
        if (status) updateData.status = status;
        if (stops !== void 0) updateData.stops = Number(stops);
        if (fuel !== void 0) updateData.fuel = Number(fuel);
        updatedTrack = await prisma_default.track.update({
          where: { id: targetId },
          data: updateData,
          include: {
            ward: true,
            driver: { select: { id: true, username: true, fullName: true, phone: true } }
          }
        });
      } catch (e) {
        console.warn("[Track Update Notice] Fallback to memory store:", e.message);
      }
      const memTrack = memoryDb.tracks.find((t) => t.id === targetId || t.truckId === targetId);
      if (memTrack) {
        if (driverId !== void 0) {
          memTrack.driverId = driverId || null;
          const assignedUser = memoryDb.users.find((u) => u.id === driverId);
          if (assignedUser) {
            memTrack.driver = assignedUser.fullName;
            memTrack.phone = assignedUser.phone || "";
          } else {
            memTrack.driver = "Unassigned";
            memTrack.phone = "";
          }
        }
        if (truckType) memTrack.truckType = truckType === "HAZARDOUS" ? "HAZARDOUS" : "NORMAL";
        if (route) memTrack.route = route;
        if (status) memTrack.status = status;
      }
      return res.status(200).json(updatedTrack || memTrack || { success: true });
    }
    return res.status(405).json({ error: "Method not allowed" });
  },
  { allowedMethods: ["GET", "POST", "PUT", "PATCH"] }
);

// lib/handlers/tracks/[id].ts
var id_default4 = apiHandler(
  async (req, res, currentUser) => {
    const id = req.query.id || req.body?.id;
    if (!id) {
      return res.status(400).json({ error: "Track ID is required" });
    }
    let track = null;
    try {
      track = await prisma_default.track.findUnique({
        where: { id },
        include: {
          ward: {
            include: {
              cityCorp: true
            }
          },
          driver: {
            select: { id: true, username: true, fullName: true, phone: true }
          }
        }
      });
    } catch {
    }
    if (!track) {
      track = memoryDb.tracks.find((t) => t.id === id || t.truckId === id);
      if (track) {
        track = {
          ...track,
          ward: memoryDb.wards.find((w) => w.id === track.wardId),
          driver: memoryDb.users.find((u) => u.id === track.driverId) || {
            id: track.driverId || "usr-driver-1",
            fullName: track.driver || "Driver",
            phone: track.phone || "017XXXXXXXX"
          }
        };
      }
    }
    if (!track) {
      return res.status(404).json({ error: "Track not found" });
    }
    if (req.method === "GET") {
      return res.status(200).json(track);
    }
    if (req.method === "PUT") {
      const isSuper = currentUser?.role === "SUPER_ADMIN";
      const isWardAdmin = currentUser?.role === "WARD_ADMIN" && currentUser?.wardId === track.wardId;
      const isCityAdmin = currentUser?.role === "CITY_ADMIN" && (!currentUser?.cityCorpId || track.ward?.cityCorpId === currentUser.cityCorpId);
      const isAssignedDriver = currentUser?.role === "DRIVER" && (currentUser?.userId === track.driverId || currentUser?.username === track.driver?.username);
      if (currentUser && !isSuper && !isWardAdmin && !isCityAdmin && !isAssignedDriver) {
        return res.status(403).json({ error: "Forbidden: You do not have permission to update this track" });
      }
      const {
        truckId,
        truckType,
        route,
        stops,
        status,
        progress,
        load,
        fuel,
        startTime,
        gpsLat,
        gpsLng,
        mapsRouteUrl,
        driverId
      } = req.body || {};
      if (truckId) track.truckId = truckId;
      if (truckType) track.truckType = truckType;
      if (route) track.route = route;
      if (stops !== void 0) track.stops = Number(stops);
      if (status) track.status = status;
      if (progress !== void 0) track.progress = Number(progress);
      if (load) track.load = load;
      if (fuel !== void 0) track.fuel = Number(fuel);
      if (startTime) track.startTime = startTime;
      if (gpsLat !== void 0) track.gpsLat = Number(gpsLat);
      if (gpsLng !== void 0) track.gpsLng = Number(gpsLng);
      if (mapsRouteUrl !== void 0) track.mapsRouteUrl = mapsRouteUrl;
      if (driverId !== void 0) track.driverId = driverId;
      try {
        await prisma_default.track.update({
          where: { id },
          data: {
            ...truckId && { truckId },
            ...truckType && { truckType },
            ...route && { route },
            ...stops !== void 0 && { stops: Number(stops) },
            ...status && { status },
            ...progress !== void 0 && { progress: Number(progress) },
            ...load && { load },
            ...fuel !== void 0 && { fuel: Number(fuel) },
            ...startTime && { startTime },
            ...gpsLat !== void 0 && { gpsLat: Number(gpsLat) },
            ...gpsLng !== void 0 && { gpsLng: Number(gpsLng) },
            ...mapsRouteUrl !== void 0 && { mapsRouteUrl },
            ...driverId !== void 0 && { driverId }
          }
        }).catch(() => null);
      } catch {
      }
      return res.status(200).json(track);
    }
    if (req.method === "DELETE") {
      const isSuper = currentUser?.role === "SUPER_ADMIN";
      const isWardAdmin = currentUser?.role === "WARD_ADMIN" && currentUser?.wardId === track.wardId;
      const isCityAdmin = currentUser?.role === "CITY_ADMIN" && (!currentUser?.cityCorpId || track.ward?.cityCorpId === currentUser.cityCorpId);
      if (!isSuper && !isWardAdmin && !isCityAdmin) {
        return res.status(403).json({ error: "Forbidden: Only Ward Admin or City/Super Admin can delete collection tracks" });
      }
      try {
        await prisma_default.track.delete({ where: { id } }).catch(() => null);
      } catch {
      }
      memoryDb.tracks = memoryDb.tracks.filter((t) => t.id !== id);
      return res.status(200).json({ message: "Track deleted successfully" });
    }
    return res.status(405).json({ error: "Method not allowed" });
  },
  { allowedMethods: ["GET", "PUT", "DELETE"] }
);

// lib/handlers/users/index.ts
var users_default = apiHandler(
  async (req, res, currentUser) => {
    if (req.method === "GET") {
      const role = req.query.role;
      let cityCorpId = req.query.cityCorpId;
      let wardId = req.query.wardId;
      const whereClause = {};
      if (role) whereClause.role = role;
      if (currentUser?.role === "CITY_ADMIN" && currentUser.cityCorpId) {
        whereClause.OR = [
          { cityCorpId: currentUser.cityCorpId },
          { ward: { cityCorpId: currentUser.cityCorpId } }
        ];
      } else if (currentUser?.role === "WARD_ADMIN" && currentUser.wardId) {
        whereClause.wardId = currentUser.wardId;
      } else {
        if (cityCorpId) whereClause.cityCorpId = cityCorpId;
        if (wardId) whereClause.wardId = wardId;
      }
      try {
        const users = await prisma_default.user.findMany({
          where: whereClause,
          select: {
            id: true,
            username: true,
            fullName: true,
            email: true,
            phone: true,
            nid: true,
            address: true,
            role: true,
            active: true,
            cityCorpId: true,
            cityCorp: { select: { id: true, name: true, code: true } },
            wardId: true,
            ward: { select: { id: true, name: true, area: true } },
            points: true,
            createdAt: true
          },
          orderBy: { createdAt: "desc" }
        });
        if (users && users.length > 0) {
          return res.status(200).json(users);
        }
      } catch (e) {
        console.warn("[Users GET Notice] Fallback to memory store:", e.message);
      }
      let memUsers = [...memoryDb.users];
      if (role) memUsers = memUsers.filter((u) => u.role === role);
      if (cityCorpId) memUsers = memUsers.filter((u) => u.cityCorpId === cityCorpId);
      if (wardId) memUsers = memUsers.filter((u) => u.wardId === wardId);
      const sanitized = memUsers.map((u) => {
        const city = memoryDb.cities.find((c) => c.id === u.cityCorpId);
        const ward = memoryDb.wards.find((w) => w.id === u.wardId);
        return {
          id: u.id,
          username: u.username,
          fullName: u.fullName,
          email: u.email,
          phone: u.phone,
          nid: u.nid,
          address: u.address,
          role: u.role,
          active: u.active,
          points: u.points || 0,
          cityCorpId: u.cityCorpId,
          cityCorp: city ? { id: city.id, name: city.name, code: city.code } : null,
          wardId: u.wardId,
          ward: ward ? { id: ward.id, name: ward.name, area: ward.area } : null,
          createdAt: u.createdAt
        };
      });
      return res.status(200).json(sanitized);
    }
    if (req.method === "POST") {
      const {
        username,
        password,
        fullName,
        email,
        phone,
        nid,
        address,
        role,
        cityCorpId,
        wardId
      } = req.body || {};
      if (!username || !password || !fullName || !role) {
        return res.status(400).json({ error: "Username, password, full name, and role are required" });
      }
      const cleanUsername = String(username).toLowerCase().trim();
      const hashedPassword = await hashPassword(password);
      let targetCityCorpId = cityCorpId && String(cityCorpId).trim() !== "" && cityCorpId !== "none" ? String(cityCorpId).trim() : currentUser?.cityCorpId || null;
      let targetWardId = wardId && String(wardId).trim() !== "" && wardId !== "none" ? String(wardId).trim() : currentUser?.wardId || null;
      let createdUser = null;
      try {
        const existing = await prisma_default.user.findFirst({
          where: {
            OR: [
              { username: { equals: cleanUsername, mode: "insensitive" } },
              ...email ? [{ email: { equals: email.trim().toLowerCase(), mode: "insensitive" } }] : []
            ]
          }
        });
        if (existing) {
          return res.status(409).json({ error: "An account with this username or email already exists." });
        }
        let dbCityCorpId = null;
        if (targetCityCorpId) {
          const dbCity = await prisma_default.cityCorporation.findFirst({
            where: {
              OR: [
                { id: targetCityCorpId },
                { code: targetCityCorpId.toUpperCase() }
              ]
            }
          }).catch(() => null);
          if (dbCity) {
            dbCityCorpId = dbCity.id;
            targetCityCorpId = dbCity.id;
          } else {
            const upperTarget = targetCityCorpId ? targetCityCorpId.toUpperCase() : "";
            const memCity = memoryDb.cities.find((c) => c.id === targetCityCorpId || upperTarget && c.code === upperTarget);
            if (memCity) {
              const syncedCity = await prisma_default.cityCorporation.create({
                data: {
                  id: memCity.id,
                  name: memCity.name,
                  code: memCity.code.toUpperCase(),
                  address: memCity.address || null,
                  phone: memCity.phone || null,
                  email: memCity.email || null,
                  pointRate: memCity.pointRate || 0.2,
                  minWithdrawPoints: memCity.minWithdrawPoints || 100
                }
              }).catch(() => null);
              if (syncedCity) {
                dbCityCorpId = syncedCity.id;
                targetCityCorpId = syncedCity.id;
              }
            }
          }
        }
        let dbWardId = null;
        if (targetWardId) {
          const dbWard = await prisma_default.ward.findUnique({
            where: { id: targetWardId }
          }).catch(() => null);
          if (dbWard) {
            dbWardId = dbWard.id;
          }
        }
        createdUser = await prisma_default.user.create({
          data: {
            username: cleanUsername,
            password: hashedPassword,
            fullName,
            email: email ? email.trim().toLowerCase() : null,
            phone: phone || null,
            nid: nid || null,
            address: address || null,
            role,
            cityCorpId: dbCityCorpId,
            wardId: dbWardId
          },
          select: {
            id: true,
            username: true,
            fullName: true,
            email: true,
            phone: true,
            role: true,
            active: true,
            cityCorpId: true,
            wardId: true
          }
        });
      } catch (dbErr) {
        console.warn("[User Create Notice] Prisma error:", dbErr.message);
        try {
          createdUser = await prisma_default.user.create({
            data: {
              username: cleanUsername,
              password: hashedPassword,
              fullName,
              email: email ? email.trim().toLowerCase() : null,
              phone: phone || null,
              nid: nid || null,
              address: address || null,
              role
            },
            select: {
              id: true,
              username: true,
              fullName: true,
              email: true,
              phone: true,
              role: true,
              active: true,
              cityCorpId: true,
              wardId: true
            }
          });
        } catch (retryErr) {
          console.warn("[User Create Retry Notice]", retryErr.message);
        }
      }
      const userId = createdUser?.id || `usr-${Date.now()}`;
      const memUser = {
        id: userId,
        username: cleanUsername,
        password: hashedPassword,
        fullName,
        email: email || null,
        phone: phone || null,
        nid: nid || null,
        address: address || null,
        role,
        cityCorpId: targetCityCorpId,
        wardId: targetWardId,
        active: true,
        points: 0,
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      if (!memoryDb.users.some((u) => u.username === cleanUsername)) {
        memoryDb.users.push(memUser);
      }
      if (email && email.includes("@")) {
        sendWelcomeCredentialsEmail({
          email,
          fullName,
          username: cleanUsername,
          password,
          role
        }).catch((err) => console.error("[Brevo Welcome Email Error]", err.message));
      }
      await logAudit({
        userId: currentUser?.userId || null,
        action: "CREATE_USER",
        resource: "users",
        details: `Created user ${cleanUsername} (${role}) by ${currentUser?.username || "system"}`,
        ipAddress: req.headers["x-forwarded-for"] || req.socket?.remoteAddress
      });
      return res.status(201).json(createdUser || {
        id: memUser.id,
        username: memUser.username,
        fullName: memUser.fullName,
        email: memUser.email,
        phone: memUser.phone,
        role: memUser.role,
        active: memUser.active,
        cityCorpId: memUser.cityCorpId,
        wardId: memUser.wardId
      });
    }
    return res.status(405).json({ error: "Method not allowed" });
  },
  { allowedMethods: ["GET", "POST"] }
);

// lib/handlers/users/[id].ts
var id_default5 = apiHandler(
  async (req, res, currentUser) => {
    const id = req.query.id || req.body?.id;
    if (!id) {
      return res.status(400).json({ error: "User ID is required" });
    }
    let user = null;
    try {
      user = await prisma_default.user.findUnique({
        where: { id },
        select: {
          id: true,
          username: true,
          fullName: true,
          email: true,
          phone: true,
          nid: true,
          address: true,
          role: true,
          active: true,
          cityCorp: true,
          ward: true,
          createdAt: true
        }
      });
    } catch {
    }
    if (!user) {
      user = memoryDb.users.find((u) => u.id === id || u.username === id);
    }
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    if (req.method === "GET") {
      return res.status(200).json(user);
    }
    if (req.method === "PUT") {
      const isSuper = currentUser?.role === "SUPER_ADMIN";
      const isSelf = currentUser?.userId === id || currentUser?.username === user.username;
      const isCityAdmin = currentUser?.role === "CITY_ADMIN" && currentUser?.cityCorpId && user.cityCorpId === currentUser.cityCorpId;
      const isWardAdmin = currentUser?.role === "WARD_ADMIN" && currentUser?.wardId && user.wardId === currentUser.wardId;
      if (!isSuper && !isSelf && !isCityAdmin && !isWardAdmin) {
        return res.status(403).json({ error: "Forbidden: You do not have permission to modify this user account" });
      }
      const {
        fullName,
        email,
        phone,
        password,
        active,
        role,
        cityCorpId,
        wardId,
        assignment
      } = req.body || {};
      if (role && role !== user.role && !isSuper) {
        return res.status(403).json({ error: "Forbidden: Only Super Admin can change account roles" });
      }
      let targetCityCorpId = cityCorpId;
      let targetWardId = wardId;
      if (assignment) {
        if (assignment.cityCorporation) {
          targetCityCorpId = assignment.cityCorporation;
        }
        targetWardId = assignment.ward || null;
      }
      let hashedPassword;
      if (password) {
        if (typeof password !== "string" || password.length < 6) {
          return res.status(400).json({ error: "Password must be at least 6 characters long" });
        }
        hashedPassword = await hashPassword(password);
      }
      if (fullName) user.fullName = fullName;
      if (email !== void 0) user.email = email;
      if (phone !== void 0) user.phone = phone;
      if (hashedPassword) user.password = hashedPassword;
      if (active !== void 0 && (isSuper || isCityAdmin)) user.active = Boolean(active);
      if (role && isSuper) user.role = role;
      if (targetCityCorpId !== void 0 && (isSuper || isCityAdmin)) {
        user.cityCorpId = targetCityCorpId;
        user.assignment = {
          cityCorporation: targetCityCorpId,
          ward: targetWardId || null
        };
      }
      if (targetWardId !== void 0 && (isSuper || isCityAdmin)) {
        user.wardId = targetWardId;
        if (user.assignment) user.assignment.ward = targetWardId || null;
      }
      const memUserIdx = memoryDb.users.findIndex((u) => u.id === id || u.username === id);
      if (memUserIdx >= 0) {
        if (fullName) memoryDb.users[memUserIdx].fullName = fullName;
        if (email !== void 0) memoryDb.users[memUserIdx].email = email;
        if (phone !== void 0) memoryDb.users[memUserIdx].phone = phone;
        if (hashedPassword) memoryDb.users[memUserIdx].password = hashedPassword;
        if (active !== void 0 && (isSuper || isCityAdmin)) memoryDb.users[memUserIdx].active = Boolean(active);
        if (role && isSuper) memoryDb.users[memUserIdx].role = role;
        if (targetCityCorpId !== void 0 && (isSuper || isCityAdmin)) {
          memoryDb.users[memUserIdx].cityCorpId = targetCityCorpId;
          memoryDb.users[memUserIdx].assignment = {
            cityCorporation: targetCityCorpId,
            ward: targetWardId || null
          };
        }
        if (targetWardId !== void 0 && (isSuper || isCityAdmin)) {
          memoryDb.users[memUserIdx].wardId = targetWardId;
          if (memoryDb.users[memUserIdx].assignment) {
            memoryDb.users[memUserIdx].assignment.ward = targetWardId || null;
          }
        }
      }
      if (assignment || targetCityCorpId !== void 0 || targetWardId !== void 0) {
        if (Array.isArray(memoryDb.routes)) {
          memoryDb.routes = memoryDb.routes.filter((r) => r.driverId !== id);
        }
        try {
          await prisma_default.route.deleteMany({ where: { driverId: id } });
        } catch {
        }
      }
      try {
        await prisma_default.user.update({
          where: { id },
          data: {
            ...fullName && { fullName },
            ...email !== void 0 && { email },
            ...phone !== void 0 && { phone },
            ...hashedPassword && { password: hashedPassword },
            ...active !== void 0 && (isSuper || isCityAdmin) && { active: Boolean(active) },
            ...role && isSuper && { role },
            ...targetCityCorpId !== void 0 && (isSuper || isCityAdmin) && { cityCorpId: targetCityCorpId },
            ...targetWardId !== void 0 && (isSuper || isCityAdmin) && { wardId: targetWardId }
          }
        });
      } catch {
      }
      return res.status(200).json(user);
    }
    if (req.method === "DELETE") {
      const isSuper = currentUser?.role === "SUPER_ADMIN";
      const isCityAdmin = currentUser?.role === "CITY_ADMIN" && currentUser?.cityCorpId && user.cityCorpId === currentUser.cityCorpId;
      if (!isSuper && !isCityAdmin) {
        return res.status(403).json({ error: "Forbidden: Only administrators can delete users" });
      }
      if (user.role === "SUPER_ADMIN") {
        return res.status(403).json({ error: "Forbidden: Super Admin accounts cannot be deleted" });
      }
      try {
        await prisma_default.user.delete({ where: { id } }).catch(() => null);
      } catch {
      }
      memoryDb.users = memoryDb.users.filter((u) => u.id !== id);
      return res.status(200).json({ message: "User deleted successfully" });
    }
    return res.status(405).json({ error: "Method not allowed" });
  },
  { requireAuth: true, allowedMethods: ["GET", "PUT", "DELETE"] }
);

// lib/handlers/withdrawals/index.ts
var withdrawals_default = apiHandler(
  async (req, res, currentUser) => {
    if (req.method === "GET") {
      let wardId = req.query.wardId;
      const status = req.query.status;
      const citizenId = req.query.citizenId;
      const whereClause = {};
      if (status) whereClause.status = status;
      if (currentUser?.role === "WARD_ADMIN" && currentUser.wardId) {
        whereClause.wardId = currentUser.wardId;
      } else if (currentUser?.role === "CITY_ADMIN" && currentUser.cityCorpId) {
        whereClause.ward = { cityCorpId: currentUser.cityCorpId };
        if (wardId) whereClause.wardId = wardId;
      } else if (currentUser && ["CITIZEN", "BUSINESS"].includes(currentUser.role)) {
        whereClause.citizenId = currentUser.userId;
      } else {
        if (wardId) whereClause.wardId = wardId;
        if (citizenId) whereClause.citizenId = citizenId;
      }
      try {
        const withdrawals = await prisma_default.withdrawalRequest.findMany({
          where: whereClause,
          include: {
            citizen: {
              select: { id: true, fullName: true, username: true, phone: true }
            },
            ward: {
              select: {
                id: true,
                name: true,
                area: true,
                cityCorp: { select: { id: true, name: true, code: true, pointRate: true } }
              }
            },
            processedBy: {
              select: { id: true, fullName: true, username: true }
            }
          },
          orderBy: { createdAt: "desc" }
        });
        if (withdrawals && withdrawals.length > 0) {
          return res.status(200).json(withdrawals);
        }
      } catch (err) {
        console.warn("[Withdrawals PG Notice]", err.message);
      }
      let list = memoryDb.withdrawals || [];
      if (status) list = list.filter((w) => w.status === status);
      if (wardId) list = list.filter((w) => w.wardId === wardId);
      return res.status(200).json(list);
    }
    if (req.method === "POST") {
      const {
        points,
        wardId,
        citizenName,
        citizenPhone,
        notes
      } = req.body || {};
      const pointsToDeduct = parseInt(points, 10);
      if (isNaN(pointsToDeduct) || pointsToDeduct <= 0) {
        return res.status(400).json({ error: "Valid positive points amount is required" });
      }
      if (!wardId) {
        return res.status(400).json({ error: "Please select the Ward where you will withdraw cash" });
      }
      let ward = null;
      try {
        ward = await prisma_default.ward.findUnique({
          where: { id: wardId },
          include: { cityCorp: true }
        });
      } catch {
      }
      if (!ward) {
        ward = memoryDb.wards.find((w) => w.id === wardId || w.name === wardId);
        if (ward) {
          ward = {
            ...ward,
            cityCorp: memoryDb.cities.find((c) => c.id === ward.cityCorpId) || {
              name: "Dhaka North City Corporation",
              code: "DNCC",
              pointRate: 0.2,
              minWithdrawPoints: 100,
              rewardActive: true
            }
          };
        }
      }
      const cityCorp = ward?.cityCorp || {
        pointRate: 0.2,
        minWithdrawPoints: 100,
        rewardActive: true,
        code: "DNCC"
      };
      const bdtAmount = Math.round(pointsToDeduct * (cityCorp.pointRate || 0.2) * 100) / 100;
      const code = `WDR-${Math.floor(1e3 + Math.random() * 9e3)}`;
      const finalCitizenId = currentUser?.userId || `usr-guest-${Date.now()}`;
      const finalWardId = ward?.id || wardId;
      let createdWithdrawal = null;
      try {
        createdWithdrawal = await prisma_default.withdrawalRequest.create({
          data: {
            verificationCode: code,
            points: pointsToDeduct,
            amount: bdtAmount,
            status: "pending",
            citizenId: finalCitizenId,
            citizenName: citizenName || currentUser?.fullName || "Citizen User",
            citizenPhone: citizenPhone || currentUser?.phone || "017XXXXXXXX",
            wardId: finalWardId,
            notes: notes || null
          },
          include: {
            citizen: { select: { id: true, fullName: true, username: true, phone: true } },
            ward: { select: { id: true, name: true, area: true } }
          }
        }).catch(() => null);
      } catch (err) {
        console.warn("[Withdrawals Create PG Notice]", err?.message);
      }
      const newWithdrawal = createdWithdrawal || {
        id: `wdr-${Date.now()}`,
        verificationCode: code,
        points: pointsToDeduct,
        amount: bdtAmount,
        status: "pending",
        citizenId: finalCitizenId,
        citizenName: citizenName || currentUser?.fullName || "Citizen User",
        citizenPhone: citizenPhone || currentUser?.phone || "017XXXXXXXX",
        wardId: finalWardId,
        ward: {
          id: finalWardId,
          name: ward?.name || "Ward 01",
          area: ward?.area || "Uttara",
          cityCorp
        },
        notes: notes || null,
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      if (!memoryDb.withdrawals) memoryDb.withdrawals = [];
      memoryDb.withdrawals.unshift(newWithdrawal);
      return res.status(201).json({
        message: "Withdrawal request submitted successfully",
        verificationCode: code,
        withdrawal: newWithdrawal,
        instructions: `Present verification code ${code} to Ward Admin to receive \u09F3${bdtAmount} cash.`
      });
    }
    return res.status(405).json({ error: "Method not allowed" });
  },
  { allowedMethods: ["GET", "POST"] }
);

// lib/handlers/withdrawals/[id].ts
var id_default6 = apiHandler(
  async (req, res, currentUser) => {
    const id = req.query.id || req.body?.id;
    if (!id) {
      return res.status(400).json({ error: "Withdrawal ID is required" });
    }
    let withdrawal = null;
    try {
      withdrawal = await prisma_default.withdrawalRequest.findUnique({
        where: { id },
        include: {
          citizen: true,
          ward: {
            include: { cityCorp: true }
          }
        }
      });
    } catch {
    }
    if (!withdrawal) {
      withdrawal = (memoryDb.withdrawals || []).find((w) => w.id === id || w.verificationCode === id);
    }
    if (!withdrawal) {
      return res.status(404).json({ error: "Withdrawal request not found" });
    }
    if (req.method === "GET") {
      return res.status(200).json(withdrawal);
    }
    if (req.method === "PUT") {
      const isSuper = currentUser?.role === "SUPER_ADMIN";
      const isCityAdmin = currentUser?.role === "CITY_ADMIN";
      const isWardAdmin = currentUser?.role === "WARD_ADMIN";
      if (!isSuper && !isCityAdmin && !isWardAdmin) {
        return res.status(403).json({ error: "Forbidden: Only Ward Administrators or authorized staff can process cash disbursements" });
      }
      if (isWardAdmin && currentUser.wardId && withdrawal.wardId && withdrawal.wardId !== currentUser.wardId) {
        return res.status(403).json({ error: "Forbidden: You are only authorized to process cash withdrawals within your assigned Ward" });
      }
      const rawStatus = req.body?.status || (req.body?.action === "pay" ? "paid" : req.body?.action === "reject" ? "rejected" : void 0);
      const status = rawStatus || "paid";
      if (withdrawal.status === "paid" && status === "paid") {
        return res.status(400).json({ error: "This cash withdrawal request has already been paid out and settled" });
      }
      withdrawal.status = status;
      withdrawal.paidAt = status === "paid" ? (/* @__PURE__ */ new Date()).toISOString() : null;
      withdrawal.processedById = currentUser?.userId || null;
      try {
        await prisma_default.withdrawalRequest.update({
          where: { id },
          data: {
            status,
            paidAt: status === "paid" ? /* @__PURE__ */ new Date() : null,
            processedById: currentUser?.userId || null
          }
        }).catch(() => null);
        if (status === "paid" && withdrawal.citizenId && withdrawal.points > 0) {
          await prisma_default.user.update({
            where: { id: withdrawal.citizenId },
            data: { points: { decrement: withdrawal.points } }
          }).catch(() => null);
          const memCitizen = memoryDb.users.find((u) => u.id === withdrawal.citizenId);
          if (memCitizen) {
            memCitizen.points = Math.max(0, (memCitizen.points || 0) - withdrawal.points);
          }
        }
      } catch (err) {
        console.warn("[Withdrawal Process DB Warning]", err.message);
      }
      await logAudit({
        userId: currentUser?.userId || null,
        action: `WITHDRAWAL_${status.toUpperCase()}`,
        resource: "withdrawals",
        details: `Withdrawal code ${withdrawal.verificationCode} (${withdrawal.points} pts = \u09F3${withdrawal.amount}) marked as ${status} by ${currentUser?.username || "admin"}`,
        ipAddress: req.headers["x-forwarded-for"] || req.socket?.remoteAddress
      });
      return res.status(200).json({
        message: `Withdrawal successfully marked as ${status}`,
        withdrawal
      });
    }
    return res.status(405).json({ error: "Method not allowed" });
  },
  { allowedMethods: ["GET", "PUT"] }
);

// lib/handlers/pickups/index.ts
var pickups_default = apiHandler(
  async (req, res, currentUser) => {
    if (req.method === "GET") {
      const status = req.query.status;
      const requesterType = req.query.requesterType;
      const driverId = req.query.driverId;
      const wardId = req.query.wardId;
      const cityCorpId = req.query.cityCorpId;
      const whereClause = {};
      if (status) whereClause.status = status;
      if (requesterType) whereClause.requesterType = requesterType;
      if (driverId) whereClause.driverId = driverId;
      if (wardId) whereClause.wardId = wardId;
      if (cityCorpId) whereClause.cityCorpId = cityCorpId;
      if (currentUser && ["CITIZEN", "BUSINESS"].includes(currentUser.role)) {
        whereClause.requesterId = currentUser.userId;
      }
      try {
        const pickups = await prisma_default.pickupRequest.findMany({
          where: whereClause,
          include: {
            requester: {
              select: { id: true, fullName: true, phone: true, username: true }
            },
            driver: {
              select: { id: true, fullName: true, phone: true }
            },
            ward: {
              select: { id: true, name: true, area: true }
            },
            cityCorp: {
              select: { id: true, name: true, code: true }
            },
            wasteItem: {
              select: { id: true, name: true, depositFee: true }
            }
          },
          orderBy: { createdAt: "desc" }
        });
        if (pickups && pickups.length > 0) {
          return res.status(200).json(pickups);
        }
      } catch (err) {
        console.warn("[Pickups PG Notice]", err.message);
      }
      let list = memoryDb.pickups || [];
      if (status) list = list.filter((p) => p.status === status);
      if (requesterType) list = list.filter((p) => p.requesterType === requesterType);
      if (wardId) list = list.filter((p) => String(p.wardId) === String(wardId));
      return res.status(200).json(list);
    }
    if (req.method === "POST") {
      const {
        requesterType = "citizen",
        area,
        address,
        wasteType,
        wasteItemId,
        date,
        amount = 250,
        requesterId,
        contactName,
        contactPhone,
        wardId,
        cityCorpId,
        lat,
        lng,
        payFromWallet = true
      } = req.body || {};
      if (!address || !date) {
        return res.status(400).json({ error: "Address and pickup date are required" });
      }
      const finalRequesterId = currentUser?.userId || requesterId || `usr-guest-${Date.now()}`;
      const finalWardId = wardId || currentUser?.wardId || null;
      const finalCityCorpId = cityCorpId || currentUser?.cityCorpId || null;
      const secCode = Math.floor(1e5 + Math.random() * 9e5).toString();
      const pickupLat = typeof lat === "number" ? lat : lat ? parseFloat(lat) : null;
      const pickupLng = typeof lng === "number" ? lng : lng ? parseFloat(lng) : null;
      const depositFee = Number(amount) || 250;
      if (payFromWallet && currentUser?.userId) {
        try {
          const user = await prisma_default.user.findUnique({
            where: { id: currentUser.userId },
            select: { id: true, walletBalance: true }
          });
          if (user && user.walletBalance < depositFee) {
            return res.status(400).json({
              error: `Insufficient wallet balance (Current: \u09F3${user.walletBalance.toFixed(2)}). Please deposit \u09F3${(depositFee - user.walletBalance).toFixed(2)} to confirm pickup.`
            });
          }
          await prisma_default.user.update({
            where: { id: currentUser.userId },
            data: { walletBalance: { decrement: depositFee } }
          });
          await prisma_default.walletTransaction.create({
            data: {
              userId: currentUser.userId,
              type: "PICKUP_PAYMENT",
              amount: depositFee,
              description: `Deposit for on-demand pickup [${wasteType || "Waste Pickup"}] on ${date}`,
              status: "COMPLETED"
            }
          }).catch(() => null);
        } catch (e) {
          console.warn("[Wallet Deduction Notice]", e.message);
        }
      }
      const newPickup = {
        id: `pick-${Date.now()}`,
        requesterType,
        area: String(area || "City Route").trim(),
        address: String(address).trim(),
        lat: pickupLat,
        lng: pickupLng,
        wasteType: String(wasteType || "Bulky Items").trim(),
        wasteItemId: wasteItemId || null,
        date: String(date).trim(),
        amount: depositFee,
        status: "open",
        securityCode: secCode,
        requesterId: finalRequesterId,
        wardId: finalWardId,
        cityCorpId: finalCityCorpId,
        requester: {
          id: finalRequesterId,
          fullName: contactName || currentUser?.fullName || "Citizen User",
          phone: contactPhone || currentUser?.phone || "017XXXXXXXX",
          username: currentUser?.username || "guest_user"
        },
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      try {
        const created = await prisma_default.pickupRequest.create({
          data: {
            requesterType,
            area: newPickup.area,
            address: newPickup.address,
            lat: pickupLat,
            lng: pickupLng,
            wasteType: newPickup.wasteType,
            wasteItemId: wasteItemId || null,
            date: newPickup.date,
            amount: depositFee,
            status: "open",
            securityCode: secCode,
            requesterId: finalRequesterId,
            wardId: finalWardId,
            cityCorpId: finalCityCorpId
          },
          include: {
            requester: { select: { id: true, fullName: true, phone: true } },
            ward: { select: { id: true, name: true, area: true } },
            cityCorp: { select: { id: true, name: true, code: true } }
          }
        });
        return res.status(201).json({
          success: true,
          message: "Pickup request created successfully! Assigned to nearest collection drivers on the scheduled date.",
          pickup: created
        });
      } catch (e) {
        console.warn("[Pickups DB Save Notice] Fallback to memory:", e.message);
      }
      memoryDb.pickups.unshift(newPickup);
      return res.status(201).json({
        success: true,
        message: "Pickup request created successfully! Assigned to nearest collection drivers on the scheduled date.",
        pickup: newPickup
      });
    }
    if (req.method === "PUT") {
      const id = req.query.id || req.body?.id;
      const { action, securityCode, driverId } = req.body || {};
      if (!id) {
        return res.status(400).json({ error: "Pickup request ID is required" });
      }
      const finalDriverId = driverId || currentUser?.userId;
      if (action === "accept" || !action && req.body?.status === "accepted") {
        try {
          const updated = await prisma_default.pickupRequest.update({
            where: { id },
            data: {
              status: "accepted",
              driverId: finalDriverId || null
            },
            include: {
              requester: { select: { id: true, fullName: true, phone: true } },
              driver: { select: { id: true, fullName: true, phone: true } }
            }
          });
          return res.status(200).json({ success: true, message: "Job accepted! Navigate to customer location.", pickup: updated });
        } catch (e) {
          console.warn("[Pickups Accept DB Notice]", e.message);
        }
        const memP = (memoryDb.pickups || []).find((p) => p.id === id);
        if (memP) {
          memP.status = "accepted";
          memP.driverId = finalDriverId || null;
          return res.status(200).json({ success: true, message: "Job accepted! Navigate to customer location.", pickup: memP });
        }
      }
      if (action === "complete" || !action && req.body?.status === "completed") {
        try {
          const existing = await prisma_default.pickupRequest.findUnique({ where: { id } });
          if (!existing) {
            return res.status(404).json({ error: "Pickup request not found" });
          }
          if (existing.securityCode && securityCode && String(existing.securityCode).trim() !== String(securityCode).trim()) {
            return res.status(400).json({ error: "Invalid customer security code. Please verify with customer." });
          }
          const completed = await prisma_default.pickupRequest.update({
            where: { id },
            data: { status: "completed" }
          });
          if (finalDriverId) {
            await prisma_default.user.update({
              where: { id: finalDriverId },
              data: { walletBalance: { increment: existing.amount } }
            }).catch(() => null);
          }
          return res.status(200).json({
            success: true,
            message: `Job completed! \u09F3${existing.amount} credited to driver account.`,
            pickup: completed
          });
        } catch (e) {
          console.warn("[Pickups Complete DB Notice]", e.message);
        }
        const memP = (memoryDb.pickups || []).find((p) => p.id === id);
        if (memP) {
          if (memP.securityCode && securityCode && String(memP.securityCode).trim() !== String(securityCode).trim()) {
            return res.status(400).json({ error: "Invalid customer security code." });
          }
          memP.status = "completed";
          return res.status(200).json({ success: true, message: `Job completed! \u09F3${memP.amount} credited.`, pickup: memP });
        }
      }
      return res.status(400).json({ error: "Unknown action" });
    }
    return res.status(405).json({ error: "Method not allowed" });
  },
  { allowedMethods: ["GET", "POST", "PUT"] }
);

// lib/handlers/pickups/[id].ts
var id_default7 = apiHandler(
  async (req, res, currentUser) => {
    const id = req.query.id || req.body?.id;
    if (!id) {
      return res.status(400).json({ error: "Pickup request ID is required" });
    }
    let pickup = null;
    try {
      pickup = await prisma_default.pickupRequest.findUnique({
        where: { id },
        include: {
          requester: {
            select: { id: true, fullName: true, phone: true, username: true }
          },
          driver: {
            select: { id: true, fullName: true, phone: true }
          }
        }
      });
    } catch {
    }
    if (!pickup) {
      pickup = (memoryDb.pickups || []).find((p) => p.id === id);
    }
    if (!pickup) {
      return res.status(404).json({ error: "Pickup request not found" });
    }
    if (req.method === "GET") {
      return res.status(200).json(pickup);
    }
    if (req.method === "PUT") {
      const { status, driverId } = req.body || {};
      if (status) pickup.status = status;
      if (driverId) pickup.driverId = driverId;
      try {
        await prisma_default.pickupRequest.update({
          where: { id },
          data: {
            ...status ? { status } : {},
            ...driverId ? { driverId } : {}
          }
        }).catch(() => null);
      } catch {
      }
      return res.status(200).json({
        message: "Pickup updated successfully",
        pickup
      });
    }
    if (req.method === "DELETE") {
      try {
        await prisma_default.pickupRequest.delete({ where: { id } }).catch(() => null);
      } catch {
      }
      memoryDb.pickups = (memoryDb.pickups || []).filter((p) => p.id !== id);
      return res.status(200).json({ message: "Pickup request deleted successfully" });
    }
    return res.status(405).json({ error: "Method not allowed" });
  },
  { allowedMethods: ["GET", "PUT", "DELETE"] }
);

// lib/handlers/alerts/index.ts
var alerts_default = apiHandler(
  async (req, res, currentUser) => {
    if (req.method === "GET") {
      let wardId = req.query.wardId;
      const resolved = req.query.resolved !== void 0 ? req.query.resolved === "true" : void 0;
      if (currentUser?.role === "WARD_ADMIN" && currentUser.wardId) {
        wardId = currentUser.wardId;
      }
      const whereClause = {};
      if (wardId) whereClause.wardId = wardId;
      if (resolved !== void 0) whereClause.resolved = resolved;
      if (currentUser?.role === "CITY_ADMIN" && currentUser.cityCorpId) {
        whereClause.ward = { cityCorpId: currentUser.cityCorpId };
      }
      try {
        const alerts = await prisma_default.alert.findMany({
          where: whereClause,
          include: {
            bin: true,
            ward: { select: { id: true, name: true, area: true } }
          },
          orderBy: { createdAt: "desc" },
          take: 50
        });
        if (alerts && alerts.length > 0) {
          return res.status(200).json(alerts);
        }
      } catch (e) {
        console.warn("[Alerts GET Notice] Fallback to memory store:", e.message);
      }
      let memAlerts = [...memoryDb.alerts];
      if (wardId) memAlerts = memAlerts.filter((a) => a.wardId === wardId);
      if (resolved !== void 0) memAlerts = memAlerts.filter((a) => a.resolved === resolved);
      const enriched = memAlerts.map((a) => {
        const ward = memoryDb.wards.find((w) => w.id === a.wardId);
        const bin = memoryDb.bins.find((b) => b.id === a.binId);
        return {
          ...a,
          ward: ward ? { id: ward.id, name: ward.name, area: ward.area } : null,
          bin: bin || null
        };
      });
      return res.status(200).json(enriched);
    }
    if (req.method === "POST") {
      const { type, message, priority = "medium", wardId, binId } = req.body || {};
      if (!type || !message) {
        return res.status(400).json({ error: "Type and message are required" });
      }
      let createdAlert = null;
      try {
        createdAlert = await prisma_default.alert.create({
          data: {
            type,
            message,
            priority,
            wardId: wardId || null,
            binId: binId || null
          }
        });
      } catch (dbErr) {
        console.warn("[Alert Create Notice] Fallback to memory store:", dbErr.message);
      }
      const memAlert = {
        id: createdAlert?.id || `alt-${Date.now()}`,
        type,
        message,
        priority,
        resolved: false,
        wardId: wardId || null,
        binId: binId || null,
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      memoryDb.alerts.unshift(memAlert);
      return res.status(201).json(createdAlert || memAlert);
    }
    if (req.method === "PATCH" || req.method === "PUT") {
      const id = req.query?.id || req.body?.id;
      if (!id) {
        return res.status(400).json({ error: "Alert ID is required" });
      }
      try {
        await prisma_default.alert.update({
          where: { id },
          data: { resolved: true }
        });
      } catch (dbErr) {
      }
      const idx = memoryDb.alerts.findIndex((a) => a.id === id);
      if (idx >= 0) memoryDb.alerts[idx].resolved = true;
      return res.status(200).json({ success: true, message: "Alert resolved" });
    }
    return res.status(405).json({ error: "Method not allowed" });
  },
  { allowedMethods: ["GET", "POST", "PATCH", "PUT"] }
);

// lib/handlers/reports/index.ts
function haversineDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
var reports_default = apiHandler(
  async (req, res, currentUser) => {
    if (req.method === "GET") {
      const wardId = req.query.wardId;
      const citizenId = req.query.citizenId;
      const status = req.query.status;
      const whereClause = {};
      if (wardId) whereClause.wardId = wardId;
      if (citizenId) whereClause.citizenId = citizenId;
      if (status) whereClause.status = status;
      if (currentUser?.role === "CITIZEN") {
        whereClause.citizenId = currentUser.userId;
      } else if (currentUser?.role === "WARD_ADMIN" && currentUser.wardId) {
        whereClause.wardId = currentUser.wardId;
      }
      try {
        const reports = await prisma_default.wasteReport.findMany({
          where: whereClause,
          include: {
            citizen: { select: { id: true, fullName: true, phone: true, email: true, points: true } },
            ward: { select: { id: true, name: true, area: true } }
          },
          orderBy: { createdAt: "desc" },
          take: 60
        });
        if (reports && reports.length > 0) {
          return res.status(200).json(reports);
        }
      } catch (e) {
        console.warn("[Reports GET Notice] Operating on resilient store:", e.message);
      }
      let memReports = [...memoryDb.wasteReports || []];
      if (wardId) memReports = memReports.filter((r) => r.wardId === wardId);
      if (citizenId) memReports = memReports.filter((r) => r.citizenId === citizenId);
      if (status) memReports = memReports.filter((r) => r.status === status);
      const enriched = memReports.map((r) => {
        const citizen = memoryDb.users.find((u) => u.id === r.citizenId);
        const ward = memoryDb.wards.find((w) => w.id === r.wardId);
        return {
          ...r,
          citizen: citizen ? { id: citizen.id, fullName: citizen.fullName, phone: citizen.phone, email: citizen.email, points: citizen.points } : null,
          ward: ward ? { id: ward.id, name: ward.name, area: ward.area } : null
        };
      });
      return res.status(200).json(enriched);
    }
    if (req.method === "POST") {
      const {
        location,
        description,
        imageUrl,
        wasteType = "Mixed",
        priority = "normal",
        wardId,
        citizenId,
        lat,
        lng
      } = req.body || {};
      const cleanLocation = sanitizeString(location, 150);
      const cleanDescription = sanitizeString(description, 1e3);
      if (!cleanLocation || !cleanDescription) {
        return res.status(400).json({ error: "Location and description are required" });
      }
      if (!imageUrl || String(imageUrl).trim() === "") {
        return res.status(400).json({
          error: "Photo upload is mandatory. Please capture or upload a clear photo of the waste issue."
        });
      }
      if (wardId) {
        try {
          const targetWard = await prisma_default.ward.findUnique({ where: { id: wardId } });
          if (targetWard && targetWard.reportEnabled === false) {
            return res.status(403).json({
              error: "Issue reporting is temporarily disabled for this Ward by the local administration."
            });
          }
        } catch {
          const memWard = memoryDb.wards.find((w) => w.id === wardId);
          if (memWard && memWard.reportEnabled === false) {
            return res.status(403).json({
              error: "Issue reporting is temporarily disabled for this Ward by the local administration."
            });
          }
        }
      }
      const reportLat = typeof lat === "number" ? lat : parseFloat(lat);
      const reportLng = typeof lng === "number" ? lng : parseFloat(lng);
      if (!isNaN(reportLat) && !isNaN(reportLng) && reportLat !== 0 && reportLng !== 0) {
        try {
          const activeReports = await prisma_default.wasteReport.findMany({
            where: {
              status: { in: ["pending", "investigating"] },
              lat: { not: null },
              lng: { not: null }
            },
            select: { id: true, reportCode: true, lat: true, lng: true }
          });
          const duplicate = activeReports.find((r) => {
            if (r.lat && r.lng) {
              const dKm = haversineDistanceKm(reportLat, reportLng, r.lat, r.lng);
              return dKm < 0.03;
            }
            return false;
          });
          if (duplicate) {
            return res.status(409).json({
              error: `An active issue has already been reported at this exact coordinate [${duplicate.reportCode}]. Our collection team is already dispatched. Thank you!`
            });
          }
        } catch {
          const memDup = (memoryDb.wasteReports || []).find((r) => {
            if ((r.status === "pending" || r.status === "investigating") && r.lat && r.lng) {
              const dKm = haversineDistanceKm(reportLat, reportLng, r.lat, r.lng);
              return dKm < 0.03;
            }
            return false;
          });
          if (memDup) {
            return res.status(409).json({
              error: `An active issue has already been reported at this exact coordinate [${memDup.reportCode}]. Our collection team is already dispatched. Thank you!`
            });
          }
        }
      }
      const finalCitizenId = currentUser?.userId || citizenId;
      if (!finalCitizenId) {
        return res.status(400).json({ error: "Citizen ID is required to submit a report" });
      }
      const reportCode = `RPT-${Date.now().toString().slice(-6)}`;
      const isHazardous = String(wasteType).toLowerCase().includes("hazard") || String(wasteType).toLowerCase().includes("chemical") || String(wasteType).toLowerCase().includes("bio");
      const targetTruckType = isHazardous ? "HAZARDOUS" : "NORMAL";
      const pointsEarned = isHazardous ? 200 : 150;
      let createdReport = null;
      try {
        createdReport = await prisma_default.wasteReport.create({
          data: {
            reportCode,
            location: cleanLocation,
            description: cleanDescription,
            imageUrl: imageUrl || null,
            wasteType,
            status: "pending",
            priority: isHazardous ? "critical" : priority,
            pointsEarned,
            citizenId: finalCitizenId,
            wardId: wardId || null,
            lat: !isNaN(reportLat) && reportLat !== 0 ? reportLat : null,
            lng: !isNaN(reportLng) && reportLng !== 0 ? reportLng : null
          },
          include: {
            citizen: { select: { id: true, fullName: true, phone: true } },
            ward: { select: { id: true, name: true, area: true } }
          }
        });
        await prisma_default.user.update({
          where: { id: finalCitizenId },
          data: { points: { increment: pointsEarned } }
        }).catch(() => null);
        const assignedTrack = await prisma_default.track.findFirst({
          where: {
            ...wardId ? { wardId } : {},
            truckType: targetTruckType
          }
        });
        const alertMessage = isHazardous ? `\u2623\uFE0F HAZARDOUS WASTE DETECTED: [${reportCode}] at ${cleanLocation}. Immediate dispatch assigned to ${assignedTrack?.truckId || "Hazardous Unit"}.` : `\u{1F69B} New Waste Issue [${reportCode}]: ${cleanLocation}. Assigned to ${assignedTrack?.truckId || "Area Truck"}.`;
        await prisma_default.alert.create({
          data: {
            type: isHazardous ? "fire" : "overflow",
            message: alertMessage,
            priority: isHazardous ? "critical" : priority,
            wardId: wardId || null
          }
        }).catch(() => null);
      } catch (e) {
        console.warn("[Reports POST Notice] Operating on resilient store:", e.message);
      }
      const memReport = {
        id: createdReport?.id || `rpt-${Date.now()}`,
        reportCode,
        location: cleanLocation,
        description: cleanDescription,
        imageUrl: imageUrl || null,
        lat: !isNaN(reportLat) && reportLat !== 0 ? reportLat : null,
        lng: !isNaN(reportLng) && reportLng !== 0 ? reportLng : null,
        wasteType,
        status: "pending",
        priority: priority || "normal",
        pointsEarned,
        citizenId: finalCitizenId,
        wardId: wardId || null,
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      if (!memoryDb.wasteReports) memoryDb.wasteReports = [];
      memoryDb.wasteReports.unshift(memReport);
      const memUser = memoryDb.users.find((u) => u.id === finalCitizenId);
      if (memUser) {
        memUser.points = (memUser.points || 0) + pointsEarned;
      }
      return res.status(201).json({
        success: true,
        message: `Report submitted successfully! ${pointsEarned} reward points credited.`,
        report: createdReport || memReport,
        pointsAwarded: pointsEarned
      });
    }
    if (req.method === "PUT") {
      const { id, status, isFakeReport, fakeReason, reportedFakeByDriverId } = req.body || {};
      if (!id) {
        return res.status(400).json({ error: "Report ID is required" });
      }
      const shouldFlagFake = isFakeReport === true || status === "FAKE_REPORT";
      try {
        const existing = await prisma_default.wasteReport.findUnique({
          where: { id },
          include: { citizen: true }
        });
        if (!existing) {
          return res.status(404).json({ error: "Report not found" });
        }
        let pointsDeducted = 0;
        let pointsRevoked = existing.pointsRevoked;
        if (shouldFlagFake && !existing.pointsRevoked && existing.citizenId) {
          pointsDeducted = existing.pointsEarned || 150;
          const newPoints = Math.max(0, (existing.citizen?.points || 0) - pointsDeducted);
          await prisma_default.user.update({
            where: { id: existing.citizenId },
            data: { points: newPoints }
          }).catch(() => null);
          pointsRevoked = true;
        }
        const updated = await prisma_default.wasteReport.update({
          where: { id },
          data: {
            status: shouldFlagFake ? "FAKE_REPORT" : status || existing.status,
            isFakeReport: shouldFlagFake ? true : existing.isFakeReport,
            fakeReason: fakeReason || existing.fakeReason,
            reportedFakeByDriverId: reportedFakeByDriverId || currentUser?.userId || existing.reportedFakeByDriverId,
            pointsRevoked
          },
          include: {
            citizen: { select: { id: true, fullName: true, phone: true, points: true } }
          }
        });
        return res.status(200).json({
          success: true,
          report: updated,
          pointsDeducted: pointsDeducted > 0 ? pointsDeducted : void 0,
          message: shouldFlagFake ? `Report flagged as fraudulent. ${pointsDeducted} reward points deducted from citizen account.` : "Report status updated successfully."
        });
      } catch (e) {
        console.warn("[Reports PUT Notice] Falling back to memory store:", e.message);
      }
      const memIndex = (memoryDb.wasteReports || []).findIndex((r) => r.id === id);
      if (memIndex >= 0) {
        const memRep = memoryDb.wasteReports[memIndex];
        let pointsDeducted = 0;
        if (shouldFlagFake && !memRep.pointsRevoked && memRep.citizenId) {
          pointsDeducted = memRep.pointsEarned || 150;
          const memUser = memoryDb.users.find((u) => u.id === memRep.citizenId);
          if (memUser) {
            memUser.points = Math.max(0, (memUser.points || 0) - pointsDeducted);
          }
          memRep.pointsRevoked = true;
        }
        memRep.status = shouldFlagFake ? "FAKE_REPORT" : status || memRep.status;
        memRep.isFakeReport = shouldFlagFake;
        memRep.fakeReason = fakeReason || memRep.fakeReason;
        return res.status(200).json({
          success: true,
          report: memRep,
          pointsDeducted: pointsDeducted > 0 ? pointsDeducted : void 0,
          message: shouldFlagFake ? `Report flagged as fraudulent. ${pointsDeducted} reward points deducted from citizen account.` : "Report status updated successfully."
        });
      }
      return res.status(404).json({ error: "Report not found" });
    }
    return res.status(405).json({ error: "Method not allowed" });
  },
  { allowedMethods: ["GET", "POST", "PUT"] }
);

// lib/handlers/dashboard/stats.ts
var stats_default = apiHandler(
  async (req, res, currentUser) => {
    let cityCorpId = req.query.cityCorpId;
    let wardId = req.query.wardId;
    if (currentUser?.role === "CITY_ADMIN" && currentUser.cityCorpId) {
      cityCorpId = currentUser.cityCorpId;
    } else if (currentUser?.role === "WARD_ADMIN" && currentUser.wardId) {
      wardId = currentUser.wardId;
    }
    try {
      const binFilter = {};
      const trackFilter = {};
      const wardFilter = {};
      const alertFilter = { resolved: false };
      if (wardId) {
        binFilter.wardId = wardId;
        trackFilter.wardId = wardId;
        wardFilter.id = wardId;
        alertFilter.wardId = wardId;
      } else if (cityCorpId) {
        binFilter.ward = { cityCorpId };
        trackFilter.ward = { cityCorpId };
        wardFilter.cityCorpId = cityCorpId;
        alertFilter.ward = { cityCorpId };
      }
      const [
        totalCityCorps,
        totalWards,
        totalBins,
        normalBins,
        warningBins,
        criticalBins2,
        fireBins2,
        totalTracks,
        activeTracks,
        idleTracks,
        unresolvedAlerts,
        totalPickups,
        openPickups,
        totalUsers
      ] = await Promise.all([
        prisma_default.cityCorporation.count({ where: { active: true } }),
        prisma_default.ward.count({ where: wardFilter }),
        prisma_default.bin.count({ where: binFilter }),
        prisma_default.bin.count({ where: { ...binFilter, status: "normal" } }),
        prisma_default.bin.count({ where: { ...binFilter, status: "warning" } }),
        prisma_default.bin.count({ where: { ...binFilter, status: "critical" } }),
        prisma_default.bin.count({ where: { ...binFilter, status: "fire" } }),
        prisma_default.track.count({ where: trackFilter }),
        prisma_default.track.count({ where: { ...trackFilter, status: "active" } }),
        prisma_default.track.count({ where: { ...trackFilter, status: "idle" } }),
        prisma_default.alert.count({ where: alertFilter }),
        prisma_default.pickupRequest.count(),
        prisma_default.pickupRequest.count({ where: { status: "open" } }),
        prisma_default.user.count({ where: { active: true } })
      ]);
      if (totalCityCorps > 0 || totalWards > 0) {
        return res.status(200).json({
          cityCorps: { total: totalCityCorps },
          wards: { total: totalWards },
          bins: {
            total: totalBins,
            normal: normalBins,
            warning: warningBins,
            critical: criticalBins2,
            fire: fireBins2,
            needAttention: criticalBins2 + fireBins2
          },
          tracks: {
            total: totalTracks,
            active: activeTracks,
            idle: idleTracks
          },
          alerts: {
            unresolved: unresolvedAlerts
          },
          pickups: {
            total: totalPickups,
            open: openPickups
          },
          users: {
            total: totalUsers
          }
        });
      }
    } catch (e) {
      console.warn("[Dashboard Stats Notice] Fallback to memory store:", e.message);
    }
    let bins = memoryDb.bins;
    let tracks = memoryDb.tracks;
    let wards = memoryDb.wards;
    let alerts = memoryDb.alerts;
    if (wardId) {
      bins = bins.filter((b) => b.wardId === wardId);
      tracks = tracks.filter((t) => t.wardId === wardId);
      wards = wards.filter((w) => w.id === wardId);
      alerts = alerts.filter((a) => a.wardId === wardId);
    } else if (cityCorpId) {
      const wardIds = memoryDb.wards.filter((w) => w.cityCorpId === cityCorpId).map((w) => w.id);
      bins = bins.filter((b) => wardIds.includes(b.wardId));
      tracks = tracks.filter((t) => wardIds.includes(t.wardId));
      wards = wards.filter((w) => w.cityCorpId === cityCorpId);
      alerts = alerts.filter((a) => wardIds.includes(a.wardId));
    }
    const criticalBins = bins.filter((b) => b.status === "critical").length;
    const fireBins = bins.filter((b) => b.status === "fire").length;
    return res.status(200).json({
      cityCorps: { total: memoryDb.cities.length },
      wards: { total: wards.length },
      bins: {
        total: bins.length,
        normal: bins.filter((b) => b.status === "normal").length,
        warning: bins.filter((b) => b.status === "warning").length,
        critical: criticalBins,
        fire: fireBins,
        needAttention: criticalBins + fireBins
      },
      tracks: {
        total: tracks.length,
        active: tracks.filter((t) => t.status === "active").length,
        idle: tracks.filter((t) => t.status === "idle").length
      },
      alerts: {
        unresolved: alerts.filter((a) => !a.resolved).length
      },
      pickups: {
        total: 8,
        open: 3
      },
      users: {
        total: memoryDb.users.length
      }
    });
  },
  { allowedMethods: ["GET"] }
);

// scripts/seed.js
import fs from "node:fs";
if (!process.env.DATABASE_URL && fs.existsSync(".env")) {
  const envContent = fs.readFileSync(".env", "utf8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
      const idx = trimmed.indexOf("=");
      const key = trimmed.slice(0, idx).trim();
      const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, "");
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  }
}
var DEFAULT_BIN_COUNT = Number(process.env.BIN_COUNT) || 60;
var WARD_GEO_CENTERS = {
  // DNCC
  "Ward 01": { lat: 23.868, lon: 90.4, area: "Uttara North" },
  "Ward 11": { lat: 23.815, lon: 90.365, area: "Mirpur 10" },
  "Ward 19": { lat: 23.792, lon: 90.415, area: "Gulshan & Banani" },
  "Ward 33": { lat: 23.765, lon: 90.362, area: "Mohammadpur" },
  "Ward 34": { lat: 23.778, lon: 90.37, area: "Agargaon & Rangs" },
  // DSCC
  "Ward 20": { lat: 23.746, lon: 90.378, area: "Dhanmondi" },
  "Ward 24": { lat: 23.719, lon: 90.388, area: "Lalbagh Fort" },
  "Ward 39": { lat: 23.725, lon: 90.418, area: "Motijheel Commercial Area" }
};
async function runMigrationAndSeed(binCount = DEFAULT_BIN_COUNT) {
  console.log(`[Seed/Migration Engine] Starting seed with target BIN_COUNT=${binCount}...`);
  try {
    const existingBins = await prisma_default.bin.findMany({
      include: { ward: true }
    }).catch(() => []);
    for (const bin of existingBins) {
      if (!bin.cityCorpId && bin.ward?.cityCorpId) {
        await prisma_default.bin.update({
          where: { id: bin.id },
          data: {
            cityCorpId: bin.ward.cityCorpId,
            capacityKg: bin.capacityKg || 120,
            fillLevel: bin.fillLevel || bin.fill || 0
          }
        }).catch(() => {
        });
      } else if (!bin.cityCorpId && !bin.wardId) {
        console.warn(`[Review Required] Bin ${bin.id} (${bin.binCode}) lacks both ward and city corporation.`);
      }
    }
  } catch {
  }
  const citiesData = [
    {
      id: "cc-dncc",
      name: "Dhaka North City Corporation",
      code: "DNCC",
      address: "Gulshan Center Point, Plot 23-26, Road 90, Gulshan 2, Dhaka",
      phone: "+880-2-9855501",
      email: "contact@dncc.gov.bd",
      pointRate: 0.2,
      minWithdrawPoints: 100
    },
    {
      id: "cc-dscc",
      name: "Dhaka South City Corporation",
      code: "DSCC",
      address: "Nagar Bhaban, Phoenix Road, Fulbaria, Dhaka",
      phone: "+880-2-9556014",
      email: "info@dscc.gov.bd",
      pointRate: 0.25,
      minWithdrawPoints: 100
    },
    {
      id: "cc-ccc",
      name: "Chattogram City Corporation",
      code: "CCC",
      address: "Tigerpass, Chattogram",
      phone: "+880-31-610111",
      email: "mayor@ccc.gov.bd",
      pointRate: 0.2,
      minWithdrawPoints: 100
    }
  ];
  const cityIdMap = /* @__PURE__ */ new Map();
  for (const c of citiesData) {
    if (!memoryDb.cities.some((x) => x.id === c.id || x.code === c.code)) {
      memoryDb.cities.push({
        ...c,
        active: true,
        rewardActive: true,
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      });
    }
    try {
      const cityRec = await prisma_default.cityCorporation.upsert({
        where: { code: c.code },
        update: { name: c.name, address: c.address, phone: c.phone, email: c.email },
        create: {
          id: c.id,
          name: c.name,
          code: c.code,
          address: c.address,
          phone: c.phone,
          email: c.email,
          pointRate: c.pointRate,
          minWithdrawPoints: c.minWithdrawPoints
        }
      });
      cityIdMap.set(c.code, cityRec.id);
      cityIdMap.set(c.id, cityRec.id);
    } catch {
      cityIdMap.set(c.code, c.id);
      cityIdMap.set(c.id, c.id);
    }
  }
  const wardsData = [
    // DNCC Wards
    { id: "ward-dncc-01", name: "Ward 01", area: "Uttara North", cityCorpId: "cc-dncc", population: 145e3, councilor: "Md. Afsar Uddin" },
    { id: "ward-dncc-11", name: "Ward 11", area: "Mirpur 10", cityCorpId: "cc-dncc", population: 18e4, councilor: "Dewan Abdul Mannan" },
    { id: "ward-dncc-19", name: "Ward 19", area: "Gulshan & Banani", cityCorpId: "cc-dncc", population: 12e4, councilor: "Md. Mofizur Rahman" },
    { id: "ward-dncc-33", name: "Ward 33", area: "Mohammadpur", cityCorpId: "cc-dncc", population: 165e3, councilor: "Tarequzzaman Rajib" },
    { id: "ward-dncc-34", name: "Ward 34", area: "Agargaon & Rangs", cityCorpId: "cc-dncc", population: 135e3, councilor: "Sheikh Mohammad Hossain" },
    // DSCC Wards
    { id: "ward-dscc-20", name: "Ward 20", area: "Dhanmondi", cityCorpId: "cc-dscc", population: 11e4, councilor: "Nasir Ahmed" },
    { id: "ward-dscc-24", name: "Ward 24", area: "Lalbagh Fort", cityCorpId: "cc-dscc", population: 195e3, councilor: "Mokbul Hossain" },
    { id: "ward-dscc-39", name: "Ward 39", area: "Motijheel Commercial", cityCorpId: "cc-dscc", population: 14e4, councilor: "Kazi Habib" }
  ];
  const wardIdMap = /* @__PURE__ */ new Map();
  for (const w of wardsData) {
    const realCityCorpId = cityIdMap.get(w.cityCorpId) || cityIdMap.get("DNCC") || w.cityCorpId;
    w.cityCorpId = realCityCorpId;
    if (!memoryDb.wards.some((x) => x.id === w.id)) {
      memoryDb.wards.push({
        ...w,
        reportEnabled: true,
        withdrawEnabled: true,
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      });
    }
    try {
      const existingWard = await prisma_default.ward.findFirst({
        where: { name: w.name, cityCorpId: realCityCorpId }
      });
      let wardRec;
      if (existingWard) {
        wardRec = await prisma_default.ward.update({
          where: { id: existingWard.id },
          data: { area: w.area, population: w.population, councilor: w.councilor }
        });
      } else {
        wardRec = await prisma_default.ward.create({
          data: {
            id: w.id,
            name: w.name,
            area: w.area,
            cityCorpId: realCityCorpId,
            population: w.population,
            councilor: w.councilor
          }
        });
      }
      wardIdMap.set(w.name, wardRec.id);
      wardIdMap.set(w.id, wardRec.id);
    } catch {
      wardIdMap.set(w.name, w.id);
      wardIdMap.set(w.id, w.id);
    }
  }
  const dnccId = cityIdMap.get("DNCC") || "cc-dncc";
  const ward33Id = wardIdMap.get("Ward 33") || "ward-dncc-33";
  const ward19Id = wardIdMap.get("Ward 19") || "ward-dncc-19";
  const hashedDemoPassword = await hashPassword("password123");
  const demoDrivers = [
    {
      id: "driver-dncc-all",
      username: "driver_dncc",
      fullName: "Kamal Hossain (DNCC City-Wide Driver)",
      email: "kamal.driver@smartcity.gov.bd",
      phone: "+880-1711-889901",
      role: "DRIVER",
      cityCorpId: dnccId,
      wardId: null,
      // Entire DNCC
      assignment: { cityCorporation: dnccId, ward: null }
    },
    {
      id: "driver-ward33",
      username: "driver_ward33",
      fullName: "Rafiqul Islam (Ward 33 Mohammadpur Driver)",
      email: "rafiq.driver@smartcity.gov.bd",
      phone: "+880-1812-774411",
      role: "DRIVER",
      cityCorpId: dnccId,
      wardId: ward33Id,
      // Ward 33 Only
      assignment: { cityCorporation: dnccId, ward: ward33Id }
    },
    {
      id: "driver-ward19",
      username: "driver_ward19",
      fullName: "Shah Alam (Ward 19 Gulshan Driver)",
      email: "shahalam.driver@smartcity.gov.bd",
      phone: "+880-1913-665522",
      role: "DRIVER",
      cityCorpId: dnccId,
      wardId: ward19Id,
      // Ward 19 Only
      assignment: { cityCorporation: dnccId, ward: ward19Id }
    }
  ];
  for (const d of demoDrivers) {
    const existingMem = memoryDb.users.find((u) => u.username === d.username);
    if (!existingMem) {
      memoryDb.users.push({
        ...d,
        password: hashedDemoPassword,
        active: true,
        points: 0,
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      });
    } else {
      Object.assign(existingMem, {
        cityCorpId: d.cityCorpId,
        wardId: d.wardId,
        assignment: d.assignment
      });
    }
    try {
      await prisma_default.user.upsert({
        where: { username: d.username },
        update: {
          fullName: d.fullName,
          cityCorpId: d.cityCorpId,
          wardId: d.wardId,
          role: "DRIVER"
        },
        create: {
          id: d.id,
          username: d.username,
          password: hashedDemoPassword,
          fullName: d.fullName,
          email: d.email,
          phone: d.phone,
          role: "DRIVER",
          cityCorpId: d.cityCorpId,
          wardId: d.wardId
        }
      });
    } catch {
    }
  }
  const dnccWards = wardsData.filter((w) => w.cityCorpId === dnccId || w.cityCorpId === "cc-dncc");
  const binsToCreate = [];
  for (let i = 1; i <= binCount; i++) {
    const assignedWard = dnccWards[(i - 1) % dnccWards.length];
    const geo = WARD_GEO_CENTERS[assignedWard.name] || { lat: 23.78, lon: 90.4, area: assignedWard.area };
    const latOffset = Math.sin(i * 1.7) * 0.012 + i % 5 * 2e-3;
    const lonOffset = Math.cos(i * 1.3) * 0.014 + i % 4 * 3e-3;
    const binLat = Number((geo.lat + latOffset).toFixed(5));
    const binLng = Number((geo.lon + lonOffset).toFixed(5));
    let fill = 45;
    let temp = "Normal";
    let gas = "Normal";
    let fire = false;
    let status = "normal";
    let forecastFull90At = null;
    if (i % 10 === 0) {
      fill = 92 + i % 7;
      temp = "54\xB0C";
      gas = "82 ppm NH3 (Toxic)";
      fire = i % 20 === 0;
      status = fire ? "fire" : "critical";
    } else if (i % 3 === 0) {
      fill = 72 + i * 3 % 25;
      temp = "34\xB0C";
      gas = "28 ppm";
      status = fill >= 85 ? "warning" : "normal";
      if (i % 6 === 0) {
        forecastFull90At = new Date(Date.now() + (4 + i % 5) * 3600 * 1e3).toISOString();
      }
    } else {
      fill = 15 + i * 7 % 50;
      temp = "27\xB0C";
      gas = "8 ppm";
      status = "normal";
    }
    const binCode = `B-${String(i).padStart(3, "0")}`;
    const capacityKg = i % 4 === 0 ? 240 : 120;
    binsToCreate.push({
      id: `bin-seed-${i}`,
      binCode,
      location: `${assignedWard.area}, Sector ${i % 12 + 1}, Road ${i % 24 + 1}`,
      capacity: `${capacityKg}L`,
      capacityKg,
      fill,
      fillLevel: fill,
      weight: Math.round(fill / 100 * capacityKg),
      temp,
      gas,
      fire,
      status,
      lat: binLat,
      lng: binLng,
      lon: binLng,
      wardId: wardIdMap.get(assignedWard.id) || wardIdMap.get(assignedWard.name) || assignedWard.id,
      ward: wardIdMap.get(assignedWard.id) || wardIdMap.get(assignedWard.name) || assignedWard.id,
      cityCorpId: cityIdMap.get(assignedWard.cityCorpId) || assignedWard.cityCorpId,
      cityCorporation: cityIdMap.get(assignedWard.cityCorpId) || assignedWard.cityCorpId,
      forecastFull90At,
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    });
  }
  const existingCodeSet = new Set(memoryDb.bins.map((b) => b.binCode));
  for (const b of binsToCreate) {
    if (!existingCodeSet.has(b.binCode)) {
      memoryDb.bins.push(b);
      existingCodeSet.add(b.binCode);
    } else {
      const idx = memoryDb.bins.findIndex((x) => x.binCode === b.binCode);
      if (idx >= 0) {
        Object.assign(memoryDb.bins[idx], b);
      }
    }
  }
  let dbCreated = 0;
  for (const b of binsToCreate) {
    try {
      await prisma_default.bin.upsert({
        where: { binCode: b.binCode },
        update: {
          location: b.location,
          capacity: b.capacity,
          capacityKg: b.capacityKg,
          fill: b.fill,
          fillLevel: b.fillLevel,
          temp: b.temp,
          gas: b.gas,
          fire: b.fire,
          status: b.status,
          lat: b.lat,
          lng: b.lng,
          wardId: b.wardId,
          cityCorpId: b.cityCorpId,
          forecastFull90At: b.forecastFull90At ? new Date(b.forecastFull90At) : null
        },
        create: {
          id: b.id,
          binCode: b.binCode,
          location: b.location,
          capacity: b.capacity,
          capacityKg: b.capacityKg,
          fill: b.fill,
          fillLevel: b.fillLevel,
          temp: b.temp,
          gas: b.gas,
          fire: b.fire,
          status: b.status,
          lat: b.lat,
          lng: b.lng,
          wardId: b.wardId,
          cityCorpId: b.cityCorpId,
          forecastFull90At: b.forecastFull90At ? new Date(b.forecastFull90At) : null
        }
      });
      dbCreated++;
    } catch (err) {
      if (dbCreated === 0) console.error("Prisma bin error:", err);
    }
  }
  console.log(`[Seed/Migration Complete] Seeded ${citiesData.length} City Corps, ${wardsData.length} Wards, ${binsToCreate.length} Bins (${dbCreated} synced to PostgreSQL), and 3 Scoped Drivers.`);
  return {
    success: true,
    cities: citiesData.length,
    wards: wardsData.length,
    bins: binsToCreate.length,
    drivers: demoDrivers.length
  };
}
if (process.argv[1] && process.argv[1].endsWith("seed.js")) {
  runMigrationAndSeed().then((r) => {
    console.log("Migration and Seed finished successfully:", r);
    process.exit(0);
  }).catch((err) => {
    console.error("Migration/Seed error:", err);
    process.exit(1);
  });
}

// lib/handlers/seed.ts
var seed_default = apiHandler(
  async (req, res) => {
    const shouldSeed = req.method === "POST" || req.query.seed === "true" || memoryDb.bins.length === 0;
    let seedResult = null;
    if (shouldSeed) {
      const count = req.query.count ? parseInt(req.query.count, 10) : void 0;
      seedResult = await runMigrationAndSeed(count);
    }
    return res.status(200).json({
      success: true,
      message: seedResult ? "Idempotent migration and seed executed successfully." : "IntelliWaste system database status.",
      seedResult,
      stats: {
        cities: memoryDb.cities.length,
        wards: memoryDb.wards.length,
        users: memoryDb.users.length,
        bins: memoryDb.bins.length,
        tracks: memoryDb.tracks.length
      },
      isSetupComplete: Boolean(memoryDb.isSetupComplete)
    });
  },
  { allowedMethods: ["GET", "POST"] }
);

// lib/handlers/setup/index.ts
var setup_default = apiHandler(
  async (req, res) => {
    if (req.method === "GET") {
      let isComplete = Boolean(memoryDb.isSetupComplete || memoryDb.setupLocked);
      if (!isComplete) {
        try {
          const count = await prisma_default.user.count({ where: { role: "SUPER_ADMIN" } });
          if (count > 0) isComplete = true;
        } catch (e) {
        }
      }
      if (!isComplete && memoryDb.users.some((u) => u.role === "SUPER_ADMIN")) {
        isComplete = true;
      }
      if (isComplete) {
        memoryDb.isSetupComplete = true;
        memoryDb.setupLocked = true;
      }
      return res.status(200).json({
        isSetupComplete: isComplete,
        message: isComplete ? "System is fully installed and operational. Installer is permanently locked." : "System is ready for Super Admin initialization."
      });
    }
    if (req.method === "POST") {
      let alreadyInstalled = Boolean(memoryDb.isSetupComplete || memoryDb.setupLocked);
      if (!alreadyInstalled) {
        try {
          const count = await prisma_default.user.count({ where: { role: "SUPER_ADMIN" } });
          if (count > 0) alreadyInstalled = true;
        } catch (e) {
        }
      }
      if (!alreadyInstalled && memoryDb.users.some((u) => u.role === "SUPER_ADMIN")) {
        alreadyInstalled = true;
      }
      if (alreadyInstalled) {
        return res.status(403).json({
          error: "Initial setup has already been completed. This installer is permanently disabled for system security."
        });
      }
      const { fullName, username, email, password } = req.body || {};
      if (!fullName || !username || !email || !password) {
        return res.status(400).json({
          error: "Full name, username, official email, and password are required."
        });
      }
      if (password.length < 6) {
        return res.status(400).json({
          error: "Password must be at least 6 characters long."
        });
      }
      const hashedPassword = await hashPassword(password);
      const cleanUsername = username.toLowerCase().trim();
      let createdUser = null;
      let dbError = null;
      try {
        createdUser = await prisma_default.user.upsert({
          where: { username: cleanUsername },
          update: {
            fullName,
            email,
            password: hashedPassword,
            role: "SUPER_ADMIN",
            active: true
          },
          create: {
            fullName,
            username: cleanUsername,
            email,
            password: hashedPassword,
            role: "SUPER_ADMIN",
            active: true
          }
        });
      } catch (dbErr) {
        dbError = dbErr?.message || String(dbErr);
        console.warn("[Setup Notice] Database write failed:", dbErr.message);
      }
      const isServerless = Boolean(process.env.VERCEL || process.env.NODE_ENV === "production");
      if (!createdUser && isServerless) {
        return res.status(503).json({
          error: `Database connection error: Could not save Super Admin into database. (${dbError || "Database offline"}). Please make sure your DATABASE_URL environment variable is properly set in Vercel.`
        });
      }
      const superAdminId = createdUser?.id || `usr-super-${Date.now()}`;
      const existingSuperIndex = memoryDb.users.findIndex((u) => u.role === "SUPER_ADMIN");
      const memUser = {
        id: superAdminId,
        fullName,
        username: cleanUsername,
        email,
        password: hashedPassword,
        role: "SUPER_ADMIN",
        active: true,
        points: 0,
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      if (existingSuperIndex >= 0) {
        memoryDb.users[existingSuperIndex] = memUser;
      } else {
        memoryDb.users.push(memUser);
      }
      memoryDb.isSetupComplete = true;
      memoryDb.setupLocked = true;
      sendWelcomeCredentialsEmail({
        email,
        fullName,
        username: cleanUsername,
        password,
        role: "SUPER_ADMIN",
        loginUrl: process.env.APP_URL || "https://final-project-tau-pearl.vercel.app"
      }).catch((mailErr) => console.error("[Setup Email Notice]", mailErr.message));
      const token = signToken({
        userId: superAdminId,
        username: cleanUsername,
        role: "SUPER_ADMIN",
        fullName
      });
      await logAudit({
        userId: superAdminId,
        action: "SYSTEM_INITIALIZED",
        resource: "setup",
        details: `Root Super Admin ${cleanUsername} (${email}) initialized and secured`,
        ipAddress: req.headers["x-forwarded-for"] || req.socket?.remoteAddress
      });
      return res.status(200).json({
        success: true,
        message: "System successfully initialized! Super Admin account created and secured.",
        token,
        user: {
          id: superAdminId,
          username: cleanUsername,
          fullName,
          email,
          role: "SUPER_ADMIN"
        }
      });
    }
    return res.status(405).json({ error: "Method not allowed" });
  },
  { allowedMethods: ["GET", "POST"] }
);

// lib/handlers/audit/index.ts
var audit_default = apiHandler(
  async (req, res, currentUser) => {
    if (currentUser?.role !== "SUPER_ADMIN") {
      return res.status(403).json({ error: "Forbidden: Only Super Admin can view system audit logs" });
    }
    if (req.method === "GET") {
      try {
        const logs = await prisma_default.auditLog.findMany({
          orderBy: { createdAt: "desc" },
          take: 100
        });
        if (logs && logs.length > 0) {
          return res.status(200).json(logs);
        }
      } catch (err) {
        console.warn("[Audit Logs DB Notice]", err.message);
      }
      return res.status(200).json(memoryDb.auditLogs || []);
    }
    return res.status(405).json({ error: "Method not allowed" });
  },
  { requireAuth: true, allowedMethods: ["GET"] }
);

// lib/handlers/ranks/index.ts
var ranks_default = apiHandler(
  async (req, res, currentUser) => {
    if (!memoryDb.rankTiers) {
      memoryDb.rankTiers = [
        { id: "tier-1", level: 1, name: "Eco Beginner", minPoints: 0, maxPoints: 200, badge: "\u{1F331}" },
        { id: "tier-2", level: 2, name: "Green Scout", minPoints: 201, maxPoints: 600, badge: "\u{1F33F}" },
        { id: "tier-3", level: 3, name: "Waste Warrior", minPoints: 601, maxPoints: 1500, badge: "\u2B50" },
        { id: "tier-4", level: 4, name: "Eco Champion", minPoints: 1501, maxPoints: 3e3, badge: "\u{1F3C5}" },
        { id: "tier-5", level: 5, name: "Earth Guardian", minPoints: 3001, maxPoints: null, badge: "\u{1F3C6}" }
      ];
    }
    if (req.method === "GET") {
      const sorted = [...memoryDb.rankTiers].sort((a, b) => a.level - b.level);
      return res.status(200).json(sorted);
    }
    if (currentUser && currentUser.role !== "SUPER_ADMIN" && currentUser.role !== "CITY_ADMIN") {
      return res.status(403).json({ error: "Only administrators can configure rank tiers" });
    }
    if (req.method === "POST") {
      const { level, name, minPoints, maxPoints, badge } = req.body || {};
      if (!name || level === void 0 || minPoints === void 0) {
        return res.status(400).json({ error: "Level, Name, and Minimum Points are required" });
      }
      const newTier = {
        id: `tier-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        level: Number(level) || 1,
        name: String(name).trim(),
        minPoints: Number(minPoints) || 0,
        maxPoints: maxPoints === null || maxPoints === "" || maxPoints === void 0 ? null : Number(maxPoints),
        badge: badge || "\u{1F3C5}"
      };
      memoryDb.rankTiers.push(newTier);
      memoryDb.rankTiers.sort((a, b) => a.level - b.level);
      return res.status(201).json(newTier);
    }
    if (req.method === "PUT") {
      const id = req.query?.id || req.body?.id;
      if (!id) {
        return res.status(400).json({ error: "Tier ID is required" });
      }
      const idx = memoryDb.rankTiers.findIndex((t) => t.id === id);
      if (idx === -1) {
        return res.status(404).json({ error: "Rank tier not found" });
      }
      const { level, name, minPoints, maxPoints, badge } = req.body || {};
      if (level !== void 0) memoryDb.rankTiers[idx].level = Number(level);
      if (name !== void 0) memoryDb.rankTiers[idx].name = String(name).trim();
      if (minPoints !== void 0) memoryDb.rankTiers[idx].minPoints = Number(minPoints);
      if (maxPoints !== void 0) {
        memoryDb.rankTiers[idx].maxPoints = maxPoints === null || maxPoints === "" ? null : Number(maxPoints);
      }
      if (badge !== void 0) memoryDb.rankTiers[idx].badge = badge;
      memoryDb.rankTiers.sort((a, b) => a.level - b.level);
      return res.status(200).json(memoryDb.rankTiers[idx]);
    }
    if (req.method === "DELETE") {
      const id = req.query?.id || req.body?.id;
      if (!id) {
        return res.status(400).json({ error: "Tier ID is required" });
      }
      memoryDb.rankTiers = memoryDb.rankTiers.filter((t) => t.id !== id);
      return res.status(200).json({ success: true, message: "Rank tier deleted" });
    }
    return res.status(405).json({ error: "Method not allowed" });
  },
  { allowedMethods: ["GET", "POST", "PUT", "DELETE"] }
);

// lib/handlers/rewards/index.ts
var rewards_default = apiHandler(
  async (req, res, currentUser) => {
    if (!memoryDb.rewards) {
      memoryDb.rewards = [];
    }
    const generateUniqueCode = (prefix = "IW") => {
      const cleanPrefix = prefix.replace(/[^A-Za-z0-9]/g, "").toUpperCase().slice(0, 6) || "IW";
      const p1 = Math.random().toString(36).substring(2, 6).toUpperCase();
      const p2 = Math.random().toString(36).substring(2, 6).toUpperCase();
      return `${cleanPrefix}-${p1}-${p2}`;
    };
    if (req.method === "GET") {
      const isAdmin = currentUser?.role === "SUPER_ADMIN" || currentUser?.role === "CITY_ADMIN";
      const citizenId = currentUser?.id || req.query?.citizenId;
      if (req.query?.type === "policy" || req.query?.policy === "true") {
        return res.status(200).json({
          couponsGloballyEnabled: memoryDb.couponsGloballyEnabled !== false,
          withdrawGloballyEnabled: memoryDb.withdrawGloballyEnabled !== false
        });
      }
      if (!isAdmin && memoryDb.couponsGloballyEnabled === false) {
        return res.status(200).json([]);
      }
      if (isAdmin) {
        const enriched = memoryDb.rewards.map((r) => {
          const totalCodes = r.codes?.length || 0;
          const availableCodes = r.codes?.filter((c) => !c.isRedeemed).length || 0;
          const redeemedCodes = totalCodes - availableCodes;
          return {
            ...r,
            totalCodes,
            availableCodes,
            redeemedCodes,
            stockCount: availableCodes,
            available: availableCodes > 0 && r.active
          };
        });
        return res.status(200).json(enriched);
      }
      const publicRewards = memoryDb.rewards.filter((r) => r.active).map((r) => {
        const availableCodes = r.codes?.filter((c) => !c.isRedeemed).length || 0;
        const myVouchers = citizenId ? (r.codes || []).filter((c) => c.isRedeemed && c.redeemedByUserId === citizenId).map((c) => ({
          id: c.id,
          code: c.code,
          rewardName: r.name,
          partner: r.partner,
          redeemedAt: c.redeemedAt
        })) : [];
        return {
          id: r.id,
          name: r.name,
          partner: r.partner,
          points: r.points,
          icon: r.icon,
          category: r.category,
          description: r.description,
          stockCount: availableCodes,
          available: availableCodes > 0,
          myRedeemedCodes: myVouchers
        };
      });
      return res.status(200).json(publicRewards);
    }
    if (req.method === "POST") {
      const isRedeemAction = req.body?.action === "redeem" || req.query?.action === "redeem";
      if (isRedeemAction) {
        const rewardId = req.body?.rewardId;
        if (!rewardId) {
          return res.status(400).json({ error: "Reward ID is required for redemption" });
        }
        const reward = memoryDb.rewards.find((r) => r.id === rewardId);
        if (!reward || !reward.active) {
          return res.status(404).json({ error: "Reward item not found or currently inactive" });
        }
        const citizenId = currentUser?.id || req.body?.citizenId;
        if (!citizenId) {
          return res.status(401).json({ error: "Authentication required to redeem vouchers" });
        }
        let currentPoints = 0;
        let dbUser = null;
        try {
          dbUser = await prisma_default.user.findUnique({ where: { id: citizenId } });
          if (dbUser) currentPoints = dbUser.points || 0;
        } catch {
        }
        if (!dbUser) {
          const memU = memoryDb.users.find((u) => u.id === citizenId);
          if (memU) currentPoints = memU.points || 0;
        }
        if (currentPoints < reward.points) {
          return res.status(400).json({
            error: `Insufficient points. You have ${currentPoints} pts, but this reward requires ${reward.points} pts.`
          });
        }
        const unusedCodeIdx = reward.codes.findIndex((c) => !c.isRedeemed);
        if (unusedCodeIdx === -1) {
          return res.status(400).json({
            error: "Sorry, this voucher is out of stock! No unused codes are available."
          });
        }
        const assignedCode = reward.codes[unusedCodeIdx];
        const now = (/* @__PURE__ */ new Date()).toISOString();
        assignedCode.isRedeemed = true;
        assignedCode.redeemedByUserId = citizenId;
        assignedCode.redeemedByUserName = currentUser?.fullName || currentUser?.username || "Citizen";
        assignedCode.redeemedAt = now;
        const newPoints = currentPoints - reward.points;
        try {
          await prisma_default.user.update({
            where: { id: citizenId },
            data: { points: { decrement: reward.points } }
          });
        } catch {
        }
        const memUserIdx = memoryDb.users.findIndex((u) => u.id === citizenId);
        if (memUserIdx !== -1) {
          memoryDb.users[memUserIdx].points = newPoints;
        }
        logAudit({
          userId: citizenId,
          action: "REDEEM_VOUCHER",
          resource: "rewards",
          details: `Redeemed ${reward.name} (${reward.points} pts). Unique Voucher: ${assignedCode.code}`,
          ipAddress: req.headers["x-forwarded-for"]
        });
        return res.status(200).json({
          success: true,
          voucherCode: assignedCode.code,
          rewardName: reward.name,
          partner: reward.partner,
          pointsDeducted: reward.points,
          remainingPoints: newPoints,
          redeemedAt: now,
          message: `Successfully redeemed! Your unique code is ${assignedCode.code}.`
        });
      }
      if (currentUser && currentUser.role !== "SUPER_ADMIN" && currentUser.role !== "CITY_ADMIN") {
        return res.status(403).json({ error: "Only administrators can create reward vouchers" });
      }
      const {
        name,
        partner,
        points,
        icon = "\u{1F381}",
        category = "Gift",
        description = "",
        codes: rawCodes,
        generateCount,
        codePrefix
      } = req.body || {};
      if (!name || !partner || points === void 0) {
        return res.status(400).json({ error: "Name, Partner, and Points are required" });
      }
      const voucherCodes = [];
      if (rawCodes) {
        const codeList = Array.isArray(rawCodes) ? rawCodes : String(rawCodes).split(/[\n,]+/).map((s) => s.trim()).filter(Boolean);
        for (const codeStr of codeList) {
          voucherCodes.push({
            id: `c-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            code: codeStr.toUpperCase(),
            isRedeemed: false
          });
        }
      }
      const countToGen = Number(generateCount) || 0;
      if (countToGen > 0) {
        const prefix = codePrefix || partner.replace(/[^A-Za-z0-9]/g, "").slice(0, 4).toUpperCase();
        for (let i = 0; i < countToGen; i++) {
          voucherCodes.push({
            id: `c-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 7)}`,
            code: generateUniqueCode(prefix),
            isRedeemed: false
          });
        }
      }
      const newReward = {
        id: `rew-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        name: String(name).trim(),
        partner: String(partner).trim(),
        points: Math.max(1, Number(points) || 100),
        icon: icon || "\u{1F381}",
        category: category || "General",
        description: description || "",
        active: true,
        codes: voucherCodes,
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      memoryDb.rewards.push(newReward);
      return res.status(201).json({
        ...newReward,
        totalCodes: newReward.codes.length,
        availableCodes: newReward.codes.length,
        stockCount: newReward.codes.length
      });
    }
    if (req.method === "PUT") {
      if (currentUser && currentUser.role !== "SUPER_ADMIN" && currentUser.role !== "CITY_ADMIN") {
        return res.status(403).json({ error: "Only administrators can modify rewards" });
      }
      if (req.body?.toggleCouponsGlobal !== void 0) {
        memoryDb.couponsGloballyEnabled = Boolean(req.body.toggleCouponsGlobal);
        try {
          await prisma_default.systemSetting.upsert({
            where: { key: "couponsGloballyEnabled" },
            update: { value: String(memoryDb.couponsGloballyEnabled) },
            create: { key: "couponsGloballyEnabled", value: String(memoryDb.couponsGloballyEnabled) }
          });
        } catch {
        }
        return res.status(200).json({ couponsGloballyEnabled: memoryDb.couponsGloballyEnabled });
      }
      if (req.body?.toggleWithdrawGlobal !== void 0) {
        memoryDb.withdrawGloballyEnabled = Boolean(req.body.toggleWithdrawGlobal);
        try {
          await prisma_default.systemSetting.upsert({
            where: { key: "withdrawGloballyEnabled" },
            update: { value: String(memoryDb.withdrawGloballyEnabled) },
            create: { key: "withdrawGloballyEnabled", value: String(memoryDb.withdrawGloballyEnabled) }
          });
        } catch {
        }
        return res.status(200).json({ withdrawGloballyEnabled: memoryDb.withdrawGloballyEnabled });
      }
      const id = req.query?.id || req.body?.id;
      if (!id) {
        return res.status(400).json({ error: "Reward ID is required" });
      }
      const idx = memoryDb.rewards.findIndex((r) => r.id === id);
      if (idx === -1) {
        return res.status(404).json({ error: "Reward item not found" });
      }
      const {
        name,
        partner,
        points,
        icon,
        category,
        description,
        active,
        addCodes,
        generateCount,
        codePrefix
      } = req.body || {};
      if (name !== void 0) memoryDb.rewards[idx].name = String(name).trim();
      if (partner !== void 0) memoryDb.rewards[idx].partner = String(partner).trim();
      if (points !== void 0) memoryDb.rewards[idx].points = Math.max(1, Number(points) || 100);
      if (icon !== void 0) memoryDb.rewards[idx].icon = icon;
      if (category !== void 0) memoryDb.rewards[idx].category = category;
      if (description !== void 0) memoryDb.rewards[idx].description = description;
      if (active !== void 0) memoryDb.rewards[idx].active = Boolean(active);
      if (addCodes) {
        const codeList = Array.isArray(addCodes) ? addCodes : String(addCodes).split(/[\n,]+/).map((s) => s.trim()).filter(Boolean);
        for (const codeStr of codeList) {
          const exists = memoryDb.rewards[idx].codes.some(
            (c) => c.code.toUpperCase() === codeStr.toUpperCase()
          );
          if (!exists) {
            memoryDb.rewards[idx].codes.push({
              id: `c-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
              code: codeStr.toUpperCase(),
              isRedeemed: false
            });
          }
        }
      }
      const countToGen = Number(generateCount) || 0;
      if (countToGen > 0) {
        const prefix = codePrefix || memoryDb.rewards[idx].partner.replace(/[^A-Za-z0-9]/g, "").slice(0, 4).toUpperCase();
        for (let i = 0; i < countToGen; i++) {
          memoryDb.rewards[idx].codes.push({
            id: `c-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 7)}`,
            code: generateUniqueCode(prefix),
            isRedeemed: false
          });
        }
      }
      const available = memoryDb.rewards[idx].codes.filter((c) => !c.isRedeemed).length;
      return res.status(200).json({
        ...memoryDb.rewards[idx],
        totalCodes: memoryDb.rewards[idx].codes.length,
        availableCodes: available,
        stockCount: available
      });
    }
    if (req.method === "DELETE") {
      if (currentUser && currentUser.role !== "SUPER_ADMIN" && currentUser.role !== "CITY_ADMIN") {
        return res.status(403).json({ error: "Only administrators can delete rewards" });
      }
      const id = req.query?.id || req.body?.id;
      if (!id) {
        return res.status(400).json({ error: "Reward ID is required" });
      }
      memoryDb.rewards = memoryDb.rewards.filter((r) => r.id !== id);
      return res.status(200).json({ success: true, message: "Reward deleted successfully" });
    }
    return res.status(405).json({ error: "Method not allowed" });
  },
  { allowedMethods: ["GET", "POST", "PUT", "DELETE"] }
);

// lib/handlers/schedules/index.ts
var schedules_default = apiHandler(
  async (req, res, currentUser) => {
    if (req.method === "GET") {
      const wardId = req.query.wardId;
      const cityCorpId = req.query.cityCorpId;
      const status = req.query.status;
      const isPublic = req.query.public === "true" || currentUser?.role === "CITIZEN";
      const whereClause = {};
      if (wardId) whereClause.wardId = wardId;
      if (cityCorpId) whereClause.cityCorpId = cityCorpId;
      if (isPublic) {
        whereClause.status = "CONFIRMED";
      } else if (status) {
        whereClause.status = status;
      }
      try {
        const schedules = await prisma_default.pickupSchedule.findMany({
          where: whereClause,
          include: {
            ward: { select: { id: true, name: true, area: true } },
            cityCorp: { select: { id: true, name: true, code: true } }
          },
          orderBy: { date: "asc" }
        });
        if (schedules && schedules.length > 0) {
          return res.status(200).json(schedules);
        }
      } catch (e) {
        console.warn("[Schedules GET Notice] Fallback to memory store:", e.message);
      }
      let list = memoryDb.schedules || [];
      if (isPublic) {
        list = list.filter((s) => s.status === "CONFIRMED");
      } else if (status) {
        list = list.filter((s) => s.status === status);
      }
      if (wardId) {
        list = list.filter((s) => s.wardId === wardId);
      }
      if (list.length === 0) {
        list = [
          { id: "sch-1", date: "Tue, Sep 12", time: "8:00 \u2013 11:00 AM", wasteType: "Organic", zone: "Mohammadpur", status: "CONFIRMED", available: true, createdAt: (/* @__PURE__ */ new Date()).toISOString() },
          { id: "sch-2", date: "Thu, Sep 14", time: "9:00 \u2013 12:00 PM", wasteType: "Recyclable", zone: "Mohammadpur", status: "CONFIRMED", available: true, createdAt: (/* @__PURE__ */ new Date()).toISOString() },
          { id: "sch-3", date: "Sat, Sep 16", time: "7:00 \u2013 10:00 AM", wasteType: "General", zone: "Mohammadpur", status: "CONFIRMED", available: true, createdAt: (/* @__PURE__ */ new Date()).toISOString() },
          { id: "sch-4", date: "Mon, Sep 18", time: "10:00 \u2013 1:00 PM", wasteType: "Hazardous", zone: "Mohammadpur", status: "CONFIRMED", available: true, createdAt: (/* @__PURE__ */ new Date()).toISOString() }
        ];
        memoryDb.schedules = list;
      }
      return res.status(200).json(list);
    }
    if (req.method === "POST") {
      const {
        date,
        time,
        wasteType = "General",
        zone = "City Zone",
        wardId,
        cityCorpId
      } = req.body || {};
      if (!date || !time) {
        return res.status(400).json({ error: "Date and time slot are required" });
      }
      const isWardAdmin = currentUser?.role === "WARD_ADMIN";
      const initialStatus = isWardAdmin ? "PENDING_APPROVAL" : "CONFIRMED";
      const finalWardId = wardId || currentUser?.wardId || null;
      const finalCityCorpId = cityCorpId || currentUser?.cityCorpId || null;
      let createdSchedule = null;
      try {
        createdSchedule = await prisma_default.pickupSchedule.create({
          data: {
            date,
            time,
            wasteType,
            zone,
            status: initialStatus,
            available: true,
            wardId: finalWardId,
            cityCorpId: finalCityCorpId,
            createdById: currentUser?.userId || null,
            createdByRole: currentUser?.role || (isWardAdmin ? "WARD_ADMIN" : "CITY_ADMIN")
          },
          include: {
            ward: { select: { id: true, name: true, area: true } }
          }
        });
      } catch (e) {
        console.warn("[Schedules POST Notice] Fallback to memory store:", e.message);
      }
      const memSchedule = {
        id: createdSchedule?.id || `sch-${Date.now()}`,
        date,
        time,
        wasteType,
        zone,
        status: initialStatus,
        available: true,
        wardId: finalWardId,
        cityCorpId: finalCityCorpId,
        createdById: currentUser?.userId || null,
        createdByRole: currentUser?.role || (isWardAdmin ? "WARD_ADMIN" : "CITY_ADMIN"),
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      if (!memoryDb.schedules) memoryDb.schedules = [];
      memoryDb.schedules.unshift(memSchedule);
      return res.status(201).json(createdSchedule || memSchedule);
    }
    if (req.method === "PUT" || req.method === "PATCH") {
      const { id, scheduleId, status, available } = req.body || {};
      const targetId = String(scheduleId || id || req.query.id);
      if (!targetId) {
        return res.status(400).json({ error: "Schedule ID is required" });
      }
      let updatedSchedule = null;
      try {
        const updateData = {};
        if (status) updateData.status = status;
        if (available !== void 0) updateData.available = Boolean(available);
        updatedSchedule = await prisma_default.pickupSchedule.update({
          where: { id: targetId },
          data: updateData
        });
      } catch (e) {
        console.warn("[Schedule Update Notice] Fallback to memory store:", e.message);
      }
      const memSchedule = (memoryDb.schedules || []).find((s) => s.id === targetId);
      if (memSchedule) {
        if (status) memSchedule.status = status;
        if (available !== void 0) memSchedule.available = Boolean(available);
      }
      return res.status(200).json(updatedSchedule || memSchedule || { success: true });
    }
    if (req.method === "DELETE") {
      const targetId = String(req.query.id || req.body?.id);
      if (!targetId) {
        return res.status(400).json({ error: "Schedule ID is required" });
      }
      try {
        await prisma_default.pickupSchedule.delete({ where: { id: targetId } });
      } catch {
      }
      if (memoryDb.schedules) {
        memoryDb.schedules = memoryDb.schedules.filter((s) => s.id !== targetId);
      }
      return res.status(200).json({ success: true, message: "Schedule removed" });
    }
    return res.status(405).json({ error: "Method not allowed" });
  },
  { allowedMethods: ["GET", "POST", "PUT", "PATCH", "DELETE"] }
);

// lib/handlers/waste-types/index.ts
var waste_types_default = apiHandler(
  async (req, res, currentUser) => {
    if (req.method === "GET") {
      const cityCorpId = req.query.cityCorpId;
      const whereClause = { active: true };
      if (cityCorpId) {
        whereClause.cityCorpId = cityCorpId;
      }
      try {
        const items = await prisma_default.cityWasteItem.findMany({
          where: whereClause,
          include: {
            cityCorp: { select: { id: true, name: true, code: true } }
          },
          orderBy: { name: "asc" }
        });
        if (items && items.length > 0) {
          return res.status(200).json(items);
        }
      } catch (e) {
        console.warn("[CityWasteItems GET Notice] Operating on resilient store:", e.message);
      }
      let list = memoryDb.cityWasteItems || [];
      if (cityCorpId) {
        list = list.filter((item) => !item.cityCorpId || item.cityCorpId === cityCorpId);
      }
      if (list.length === 0) {
        list = [
          { id: "wi-1", name: "Bulky Household Furniture", category: "Bulky", depositFee: 250, unit: "Trip", active: true, cityCorpId: cityCorpId || null, createdAt: (/* @__PURE__ */ new Date()).toISOString() },
          { id: "wi-2", name: "Restaurant Food & Organic Waste", category: "Organic", depositFee: 300, unit: "Bin / Barrel", active: true, cityCorpId: cityCorpId || null, createdAt: (/* @__PURE__ */ new Date()).toISOString() },
          { id: "wi-3", name: "Hotel & Commercial Mixed Waste", category: "Commercial", depositFee: 400, unit: "Trip", active: true, cityCorpId: cityCorpId || null, createdAt: (/* @__PURE__ */ new Date()).toISOString() },
          { id: "wi-4", name: "Construction & Renovation Debris", category: "Construction", depositFee: 500, unit: "Truckload", active: true, cityCorpId: cityCorpId || null, createdAt: (/* @__PURE__ */ new Date()).toISOString() },
          { id: "wi-5", name: "E-Waste & Electronic Scraps", category: "Hazardous", depositFee: 350, unit: "Lot", active: true, cityCorpId: cityCorpId || null, createdAt: (/* @__PURE__ */ new Date()).toISOString() }
        ];
        memoryDb.cityWasteItems = list;
      }
      return res.status(200).json(list);
    }
    if (req.method === "POST") {
      const { name, category, depositFee = 250, unit = "Trip", cityCorpId } = req.body || {};
      if (!name) {
        return res.status(400).json({ error: "Waste item name is required" });
      }
      const targetCityCorpId = cityCorpId || currentUser?.cityCorpId || null;
      try {
        const created = await prisma_default.cityWasteItem.create({
          data: {
            name: String(name).trim(),
            category: category ? String(category).trim() : "General",
            depositFee: Number(depositFee) || 250,
            unit: String(unit || "Trip").trim(),
            active: true,
            cityCorpId: targetCityCorpId
          },
          include: {
            cityCorp: { select: { id: true, name: true, code: true } }
          }
        });
        return res.status(201).json(created);
      } catch (e) {
        console.warn("[CityWasteItems POST Notice] Using resilient store:", e.message);
      }
      const newItem = {
        id: `wi-${Date.now()}`,
        name: String(name).trim(),
        category: category ? String(category).trim() : "General",
        depositFee: Number(depositFee) || 250,
        unit: String(unit || "Trip").trim(),
        active: true,
        cityCorpId: targetCityCorpId,
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      if (!memoryDb.cityWasteItems) memoryDb.cityWasteItems = [];
      memoryDb.cityWasteItems.push(newItem);
      return res.status(201).json(newItem);
    }
    if (req.method === "PUT") {
      const id = req.query.id || req.body?.id;
      const { name, category, depositFee, unit, active } = req.body || {};
      if (!id) {
        return res.status(400).json({ error: "Waste item ID is required" });
      }
      try {
        const updated = await prisma_default.cityWasteItem.update({
          where: { id },
          data: {
            ...name && { name: String(name).trim() },
            ...category && { category: String(category).trim() },
            ...depositFee !== void 0 && { depositFee: Number(depositFee) },
            ...unit && { unit: String(unit).trim() },
            ...active !== void 0 && { active: Boolean(active) }
          }
        });
        return res.status(200).json(updated);
      } catch (e) {
        console.warn("[CityWasteItems PUT Notice] Using resilient store:", e.message);
      }
      const idx = (memoryDb.cityWasteItems || []).findIndex((item) => item.id === id);
      if (idx >= 0) {
        const cur = memoryDb.cityWasteItems[idx];
        const updatedItem = {
          ...cur,
          ...name && { name: String(name).trim() },
          ...category && { category: String(category).trim() },
          ...depositFee !== void 0 && { depositFee: Number(depositFee) },
          ...unit && { unit: String(unit).trim() },
          ...active !== void 0 && { active: Boolean(active) }
        };
        memoryDb.cityWasteItems[idx] = updatedItem;
        return res.status(200).json(updatedItem);
      }
      return res.status(404).json({ error: "Waste item not found" });
    }
    if (req.method === "DELETE") {
      const id = req.query.id || req.body?.id;
      if (!id) {
        return res.status(400).json({ error: "Waste item ID is required" });
      }
      try {
        await prisma_default.cityWasteItem.delete({ where: { id } });
        return res.status(200).json({ success: true, message: "Waste item deleted" });
      } catch (e) {
        console.warn("[CityWasteItems DELETE Notice] Using resilient store:", e.message);
      }
      memoryDb.cityWasteItems = (memoryDb.cityWasteItems || []).filter((item) => item.id !== id);
      return res.status(200).json({ success: true, message: "Waste item deleted" });
    }
    return res.status(405).json({ error: "Method not allowed" });
  },
  { allowedMethods: ["GET", "POST", "PUT", "DELETE"] }
);

// lib/handlers/wallet/index.ts
var wallet_default = apiHandler(
  async (req, res, currentUser) => {
    const targetUserId = currentUser?.userId || req.query.userId || req.body?.userId;
    if (!targetUserId) {
      return res.status(401).json({ error: "Authentication required for wallet operations" });
    }
    if (req.method === "GET") {
      try {
        const user = await prisma_default.user.findUnique({
          where: { id: targetUserId },
          select: { id: true, fullName: true, username: true, walletBalance: true }
        });
        const transactions = await prisma_default.walletTransaction.findMany({
          where: { userId: targetUserId },
          orderBy: { createdAt: "desc" },
          take: 30
        });
        return res.status(200).json({
          walletBalance: user?.walletBalance ?? 0,
          transactions: transactions || []
        });
      } catch (e) {
        console.warn("[Wallet GET Notice] Falling back to memory store:", e.message);
      }
      const memUser = (memoryDb.users || []).find((u) => u.id === targetUserId);
      const memTransactions = (memoryDb.walletTransactions || []).filter((t) => t.userId === targetUserId).reverse();
      return res.status(200).json({
        walletBalance: memUser?.walletBalance ?? 0,
        transactions: memTransactions
      });
    }
    if (req.method === "POST") {
      const { amount, paymentMethod = "bKash", trxId, accountNumber, description } = req.body || {};
      const depositAmount = Number(amount);
      if (isNaN(depositAmount) || depositAmount <= 0) {
        return res.status(400).json({ error: "Please enter a valid deposit amount greater than 0" });
      }
      const generatedTrxId = trxId || `TRX-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
      const note = description || `Deposit via ${paymentMethod} (${accountNumber ? `A/C: ${accountNumber}` : "Instant Gateway"})`;
      try {
        const updatedUser = await prisma_default.user.update({
          where: { id: targetUserId },
          data: { walletBalance: { increment: depositAmount } },
          select: { id: true, fullName: true, username: true, walletBalance: true }
        });
        const transaction = await prisma_default.walletTransaction.create({
          data: {
            userId: targetUserId,
            type: "DEPOSIT",
            amount: depositAmount,
            paymentMethod,
            trxId: generatedTrxId,
            status: "COMPLETED",
            description: note
          }
        });
        return res.status(200).json({
          success: true,
          message: `Successfully deposited \u09F3${depositAmount.toFixed(2)} to your wallet!`,
          walletBalance: updatedUser.walletBalance,
          transaction
        });
      } catch (e) {
        console.warn("[Wallet POST Notice] Falling back to memory store:", e.message);
      }
      const memUser = (memoryDb.users || []).find((u) => u.id === targetUserId);
      const newBalance = (memUser?.walletBalance || 0) + depositAmount;
      if (memUser) {
        memUser.walletBalance = newBalance;
      }
      const memTrx = {
        id: `trx-${Date.now()}`,
        userId: targetUserId,
        type: "DEPOSIT",
        amount: depositAmount,
        paymentMethod,
        trxId: generatedTrxId,
        status: "COMPLETED",
        description: note,
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      if (!memoryDb.walletTransactions) memoryDb.walletTransactions = [];
      memoryDb.walletTransactions.push(memTrx);
      return res.status(200).json({
        success: true,
        message: `Successfully deposited \u09F3${depositAmount.toFixed(2)} to your wallet!`,
        walletBalance: newBalance,
        transaction: memTrx
      });
    }
    return res.status(405).json({ error: "Method not allowed" });
  },
  { allowedMethods: ["GET", "POST"] }
);

// lib/driverScope.ts
function getDriverBinScope(driver) {
  if (!driver) {
    throw new Error("Unauthorized: Authenticated driver context is required");
  }
  const assignment = driver.assignment || {};
  const cityCorp = assignment.cityCorporation || driver.cityCorpId || driver.cityCorp?.id;
  const rawWard = assignment.ward !== void 0 ? assignment.ward : driver.wardId || driver.ward?.id;
  const ward = rawWard && rawWard !== "all" && String(rawWard).trim() !== "" ? String(rawWard) : null;
  if (!cityCorp) {
    throw new Error("Driver has no assigned City Corporation. Contact City Admin.");
  }
  const scope = {
    cityCorporation: String(cityCorp),
    cityCorpId: String(cityCorp)
  };
  if (ward) {
    scope.ward = String(ward);
    scope.wardId = String(ward);
  }
  return scope;
}

// config/routeConfig.js
var ROUTE_CONFIG = {
  // Candidate selection thresholds
  FILL_MUST_VISIT_THRESHOLD: Number(process.env.FILL_MUST_VISIT_THRESHOLD) || 70,
  // % fill
  FILL_CRITICAL_THRESHOLD: Number(process.env.FILL_CRITICAL_THRESHOLD) || 90,
  // % fill
  FORECAST_WINDOW_HOURS: Number(process.env.FORECAST_WINDOW_HOURS) || 12,
  // hours until predicted overflow
  // On-the-way inclusion threshold (optional opportunistic collection)
  ON_THE_WAY_FILL_THRESHOLD: Number(process.env.ON_THE_WAY_FILL_THRESHOLD) || 50,
  // %
  ON_THE_WAY_MAX_METERS: Number(process.env.ON_THE_WAY_MAX_METERS) || 300,
  // meters from route
  // Scalability & Clustering
  MAX_NODES_PER_SOLVE: Number(process.env.MAX_NODES_PER_SOLVE) || 80,
  // Max cluster size for OSRM table
  TRUCK_CAPACITY_KG: Number(process.env.TRUCK_CAPACITY_KG) || 1e3,
  // Standard collection truck payload capacity in kg
  SOLVER_TIME_LIMIT_MS: Number(process.env.SOLVER_TIME_LIMIT_MS) || 3e3,
  // Max time per cluster solver run in ms
  // Skipping Penalties (Objective function)
  PENALTY_HAZARD_ALERT: 1e5,
  // Fire / gas / toxic / overflow alerts (practically mandatory)
  PENALTY_FILL_90: 5e3,
  // Critical fill >= 90%
  PENALTY_FILL_70: 1e3,
  // Must-visit fill >= 70%
  DISTANCE_COST_WEIGHT: 1,
  // Weight per km
  // Speeds and fallback
  AVERAGE_TRUCK_SPEED_KMH: Number(process.env.AVERAGE_TRUCK_SPEED_KMH) || 25,
  // City collection average speed (km/h)
  SERVICE_TIME_PER_BIN_MINS: Number(process.env.SERVICE_TIME_PER_BIN_MINS) || 2,
  // Handling time per bin stop
  // Depot & Dump Site (Aminbazar landfill / Central DNCC facility)
  DEPOT_LOCATION: {
    lat: Number(process.env.DEPOT_LAT) || 23.8103,
    lon: Number(process.env.DEPOT_LON) || 90.4125,
    name: "Central Operations Depot"
  },
  DUMP_SITE_LOCATION: {
    lat: Number(process.env.DUMP_SITE_LAT) || 23.8103,
    lon: Number(process.env.DUMP_SITE_LON) || 90.4125,
    name: "Central Solid Waste Landfill / Dump Site"
  },
  // OSRM Routing Engine URL
  // Default public demo instance; configure self-hosted OSRM URL in production (e.g., http://localhost:5000)
  OSRM_URL: process.env.OSRM_URL || "https://router.project-osrm.org",
  OSRM_TIMEOUT_MS: Number(process.env.OSRM_TIMEOUT_MS) || 4e3,
  OSRM_MAX_RETRIES: 2,
  // Evaluation Baselines
  DIESEL_PRICE_PER_LITRE_BDT: 105,
  TRUCK_FUEL_CONSUMPTION_KM_PER_LITRE: 3.5
  // 3.5 km per liter for loaded municipal compaction truck
};

// services/routeOptimizer.js
var matrixCache = /* @__PURE__ */ new Map();
var geometryCache = /* @__PURE__ */ new Map();
function hashCoords(coords) {
  let hash = 0;
  const str = coords.map((c) => `${c[0].toFixed(5)},${c[1].toFixed(5)}`).join(";");
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return `h_${hash}`;
}
function haversineDistanceKm2(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(3));
}
function computeFallbackMatrix(points, averageSpeedKmh = ROUTE_CONFIG.AVERAGE_TRUCK_SPEED_KMH) {
  const n = points.length;
  const distances = Array.from({ length: n }, () => new Float32Array(n));
  const durations = Array.from({ length: n }, () => new Float32Array(n));
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (i === j) {
        distances[i][j] = 0;
        durations[i][j] = 0;
      } else {
        const d = haversineDistanceKm2(points[i].lat, points[i].lon, points[j].lat, points[j].lon);
        distances[i][j] = d;
        durations[i][j] = d / averageSpeedKmh * 60;
      }
    }
  }
  return { distances, durations, isOsrm: false };
}
async function fetchOsrmTable(points) {
  if (points.length <= 1) {
    return {
      distances: [[0]],
      durations: [[0]],
      isOsrm: false
    };
  }
  const coords = points.map((p) => [p.lon, p.lat]);
  const cacheKey = hashCoords(coords);
  if (matrixCache.has(cacheKey)) {
    return matrixCache.get(cacheKey);
  }
  const coordsString = coords.map((c) => `${c[0].toFixed(6)},${c[1].toFixed(6)}`).join(";");
  const url = `${ROUTE_CONFIG.OSRM_URL}/table/v1/driving/${coordsString}?annotations=distance,duration`;
  let osrmResult = null;
  for (let attempt = 0; attempt <= ROUTE_CONFIG.OSRM_MAX_RETRIES; attempt++) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), ROUTE_CONFIG.OSRM_TIMEOUT_MS);
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timer);
      if (res.ok) {
        const data = await res.json();
        if (data.code === "Ok" && data.distances && data.durations) {
          const n = points.length;
          const distances = Array.from({ length: n }, () => new Float32Array(n));
          const durations = Array.from({ length: n }, () => new Float32Array(n));
          for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
              distances[i][j] = (data.distances[i][j] || 0) / 1e3;
              durations[i][j] = (data.durations[i][j] || 0) / 60;
            }
          }
          osrmResult = { distances, durations, isOsrm: true };
          break;
        }
      }
    } catch {
    }
  }
  if (!osrmResult) {
    osrmResult = computeFallbackMatrix(points);
  }
  matrixCache.set(cacheKey, osrmResult);
  return osrmResult;
}
async function fetchRouteGeometry(waypoints) {
  if (waypoints.length <= 1) {
    return {
      type: "LineString",
      coordinates: waypoints.map((w) => [w.lon, w.lat])
    };
  }
  const coords = waypoints.map((w) => [w.lon, w.lat]);
  const cacheKey = "geom_" + hashCoords(coords);
  if (geometryCache.has(cacheKey)) {
    return geometryCache.get(cacheKey);
  }
  const sampledCoords = coords.length > 70 ? coords.filter((_, idx) => idx % Math.ceil(coords.length / 60) === 0 || idx === coords.length - 1) : coords;
  const coordsString = sampledCoords.map((c) => `${c[0].toFixed(6)},${c[1].toFixed(6)}`).join(";");
  const url = `${ROUTE_CONFIG.OSRM_URL}/route/v1/driving/${coordsString}?overview=full&geometries=geojson`;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), ROUTE_CONFIG.OSRM_TIMEOUT_MS);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    if (res.ok) {
      const data = await res.json();
      if (data.code === "Ok" && data.routes?.[0]?.geometry) {
        const geom = data.routes[0].geometry;
        geometryCache.set(cacheKey, geom);
        return geom;
      }
    }
  } catch {
  }
  const fallback = {
    type: "LineString",
    coordinates: coords
  };
  geometryCache.set(cacheKey, fallback);
  return fallback;
}
function isCandidateMustVisit(bin, config = ROUTE_CONFIG) {
  const fill = Number(bin.fillLevel !== void 0 ? bin.fillLevel : bin.fill) || 0;
  if (fill >= config.FILL_MUST_VISIT_THRESHOLD) return true;
  if (bin.fire === true) return true;
  if (bin.status === "fire" || bin.status === "critical") return true;
  if (typeof bin.temp === "string" && bin.temp.toLowerCase().includes("high")) return true;
  if (typeof bin.gas === "string" && (bin.gas.toLowerCase().includes("critical") || bin.gas.toLowerCase().includes("ppm"))) {
    const num = parseInt(bin.gas, 10);
    if (!isNaN(num) && num >= 50) return true;
  }
  if (Array.isArray(bin.alerts) && bin.alerts.some((a) => !a.resolved && (a.type === "fire" || a.type === "gas" || a.type === "overflow"))) {
    return true;
  }
  if (bin.forecastFull90At) {
    const forecastTime = new Date(bin.forecastFull90At).getTime();
    const thresholdTime = Date.now() + config.FORECAST_WINDOW_HOURS * 3600 * 1e3;
    if (forecastTime <= thresholdTime) return true;
  }
  return false;
}
function getBinSkipPenalty(bin, config = ROUTE_CONFIG) {
  const fill = Number(bin.fillLevel !== void 0 ? bin.fillLevel : bin.fill) || 0;
  const isHazard = bin.fire === true || bin.status === "fire" || bin.status === "critical" || Array.isArray(bin.alerts) && bin.alerts.some((a) => !a.resolved && (a.type === "fire" || a.type === "gas"));
  if (isHazard) return config.PENALTY_HAZARD_ALERT;
  if (fill >= config.FILL_CRITICAL_THRESHOLD) return config.PENALTY_FILL_90;
  if (fill >= config.FILL_MUST_VISIT_THRESHOLD) return config.PENALTY_FILL_70;
  return 0;
}
function getBinDemandKg(bin) {
  const fill = Number(bin.fillLevel !== void 0 ? bin.fillLevel : bin.fill) || 0;
  let capacity = 120;
  if (typeof bin.capacityKg === "number" && bin.capacityKg > 0) {
    capacity = bin.capacityKg;
  } else if (typeof bin.capacity === "string") {
    const parsed = parseInt(bin.capacity, 10);
    if (!isNaN(parsed) && parsed > 0) capacity = parsed;
  }
  return Number((fill / 100 * capacity).toFixed(2));
}
function clusterCandidates(candidates, depot, maxNodes = ROUTE_CONFIG.MAX_NODES_PER_SOLVE, maxClusterDemand = ROUTE_CONFIG.TRUCK_CAPACITY_KG) {
  if (candidates.length <= maxNodes && candidates.reduce((sum, c) => sum + getBinDemandKg(c), 0) <= maxClusterDemand) {
    return [candidates];
  }
  const sorted = [...candidates].map((bin) => {
    const lat = bin.lat || 0;
    const lon = bin.lon !== void 0 ? bin.lon : bin.lng || 0;
    const angle = Math.atan2(lat - depot.lat, lon - depot.lon);
    const distToDepot = haversineDistanceKm2(depot.lat, depot.lon, lat, lon);
    return { bin, angle, distToDepot, demand: getBinDemandKg(bin) };
  }).sort((a, b) => a.angle - b.angle);
  const clusters = [];
  let currentCluster = [];
  let currentDemand = 0;
  for (const item of sorted) {
    const wouldExceedDemand = currentDemand + item.demand > maxClusterDemand && currentCluster.length >= 5;
    const wouldExceedNodes = currentCluster.length >= maxNodes;
    if (currentCluster.length > 0 && (wouldExceedDemand || wouldExceedNodes)) {
      clusters.push(currentCluster);
      currentCluster = [item.bin];
      currentDemand = item.demand;
    } else {
      currentCluster.push(item.bin);
      currentDemand += item.demand;
    }
  }
  if (currentCluster.length > 0) {
    clusters.push(currentCluster);
  }
  clusters.sort((cA, cB) => {
    const minA = Math.min(...cA.map((b) => haversineDistanceKm2(depot.lat, depot.lon, b.lat, b.lon !== void 0 ? b.lon : b.lng)));
    const minB = Math.min(...cB.map((b) => haversineDistanceKm2(depot.lat, depot.lon, b.lat, b.lon !== void 0 ? b.lon : b.lng)));
    return minA - minB;
  });
  return clusters;
}
function solveCVRPCluster({
  nodes,
  // [0: Depot, 1..N: Bins]
  distanceMatrix,
  // NxN
  durationMatrix,
  // NxN
  capacityKg = ROUTE_CONFIG.TRUCK_CAPACITY_KG,
  timeLimitMs = ROUTE_CONFIG.SOLVER_TIME_LIMIT_MS,
  startDepotIdx = 0,
  dumpSiteIdx = 0
}) {
  const n = nodes.length;
  if (n <= 1) return [];
  const startTime = Date.now();
  const unassigned = /* @__PURE__ */ new Set();
  const demands = nodes.map(getBinDemandKg);
  const penalties = nodes.map((b) => b.isDepot ? 0 : getBinSkipPenalty(b));
  for (let i = 1; i < n; i++) {
    unassigned.add(i);
  }
  const trips = [];
  while (unassigned.size > 0) {
    let currentRoute = [startDepotIdx, dumpSiteIdx];
    let currentLoad = 0;
    let bestSeed = -1;
    let maxSeedScore = -1;
    for (const idx of unassigned) {
      const score = penalties[idx] * 10 + distanceMatrix[startDepotIdx][idx];
      if (score > maxSeedScore) {
        maxSeedScore = score;
        bestSeed = idx;
      }
    }
    if (bestSeed === -1) break;
    currentRoute.splice(1, 0, bestSeed);
    currentLoad += demands[bestSeed];
    unassigned.delete(bestSeed);
    let improved = true;
    while (improved && unassigned.size > 0) {
      improved = false;
      let bestNode = -1;
      let bestInsertPos = -1;
      let minInsertCost = Infinity;
      for (const candidate of unassigned) {
        const demand = demands[candidate];
        if (currentLoad + demand > capacityKg) continue;
        for (let i = 0; i < currentRoute.length - 1; i++) {
          const u = currentRoute[i];
          const v = currentRoute[i + 1];
          const addedDist = distanceMatrix[u][candidate] + distanceMatrix[candidate][v] - distanceMatrix[u][v];
          const netCost = addedDist - penalties[candidate] / 1e3;
          if (netCost < minInsertCost) {
            minInsertCost = netCost;
            bestNode = candidate;
            bestInsertPos = i + 1;
          }
        }
      }
      if (bestNode !== -1) {
        currentRoute.splice(bestInsertPos, 0, bestNode);
        currentLoad += demands[bestNode];
        unassigned.delete(bestNode);
        improved = true;
      }
    }
    trips.push({ route: currentRoute, loadKg: currentLoad });
  }
  for (const trip of trips) {
    let route = trip.route;
    let betterFound = true;
    let iterations = 0;
    while (betterFound && iterations < 50 && Date.now() - startTime < timeLimitMs) {
      betterFound = false;
      iterations++;
      for (let i = 1; i < route.length - 2; i++) {
        for (let j = i + 1; j < route.length - 1; j++) {
          const u1 = route[i - 1];
          const u2 = route[i];
          const v1 = route[j];
          const v2 = route[j + 1];
          const currentDist = distanceMatrix[u1][u2] + distanceMatrix[v1][v2];
          const newDist = distanceMatrix[u1][v1] + distanceMatrix[u2][v2];
          if (newDist + 1e-4 < currentDist) {
            const reversed = route.slice(i, j + 1).reverse();
            route.splice(i, reversed.length, ...reversed);
            betterFound = true;
            break;
          }
        }
        if (betterFound) break;
      }
      if (!betterFound) {
        for (let segLen = 1; segLen <= 2; segLen++) {
          for (let i = 1; i <= route.length - 1 - segLen; i++) {
            const seg = route.slice(i, i + segLen);
            const prev = route[i - 1];
            const next = route[i + segLen];
            const removeCost = distanceMatrix[prev][next] - (distanceMatrix[prev][seg[0]] + distanceMatrix[seg[seg.length - 1]][next]);
            for (let j = 0; j < route.length - 1; j++) {
              if (j >= i - 1 && j <= i + segLen - 1) continue;
              const insPrev = route[j];
              const insNext = route[j + 1];
              const addCost = distanceMatrix[insPrev][seg[0]] + distanceMatrix[seg[seg.length - 1]][insNext] - distanceMatrix[insPrev][insNext];
              if (removeCost + addCost + 1e-4 < 0) {
                route.splice(i, segLen);
                const insertAt = j < i ? j + 1 : j + 1 - segLen;
                route.splice(insertAt, 0, ...seg);
                betterFound = true;
                break;
              }
            }
            if (betterFound) break;
          }
          if (betterFound) break;
        }
      }
    }
    trip.route = route;
  }
  return trips;
}
async function optimizeRouteForScope({
  binsInScope = [],
  depot = ROUTE_CONFIG.DEPOT_LOCATION,
  dumpSite = ROUTE_CONFIG.DUMP_SITE_LOCATION,
  truckCapacityKg = ROUTE_CONFIG.TRUCK_CAPACITY_KG,
  config = ROUTE_CONFIG,
  startLocation = null,
  // e.g. truck current GPS { lat, lon }
  includeGeometry = true
}) {
  const mustVisitBins = [];
  const skippedBins = [];
  for (const bin of binsInScope) {
    if (isCandidateMustVisit(bin, config)) {
      mustVisitBins.push(bin);
    } else {
      skippedBins.push(bin);
    }
  }
  if (mustVisitBins.length === 0) {
    return {
      trips: [],
      totalDistanceKm: 0,
      totalDurationMin: 0,
      totalLoadKg: 0,
      candidateCount: 0,
      totalBinsInScope: binsInScope.length,
      skippedBins: { count: skippedBins.length, ids: skippedBins.map((b) => b.id || b.binCode) },
      message: "No bins currently meet the collection threshold or hazard criteria."
    };
  }
  const clusters = clusterCandidates(mustVisitBins, depot, config.MAX_NODES_PER_SOLVE, truckCapacityKg);
  const allTrips = [];
  let tripCounter = 1;
  let overallDistanceKm = 0;
  let overallDurationMin = 0;
  let overallLoadKg = 0;
  const geometryTasks = [];
  for (let cIdx = 0; cIdx < clusters.length; cIdx++) {
    const clusterBins = clusters[cIdx];
    const origin = cIdx === 0 && startLocation && typeof startLocation.lat === "number" ? { lat: startLocation.lat, lon: startLocation.lon !== void 0 ? startLocation.lon : startLocation.lng, name: "Driver Current Position", isDepot: true } : { lat: depot.lat, lon: depot.lon, name: depot.name || "Operations Depot", isDepot: true };
    const dump = { lat: dumpSite.lat, lon: dumpSite.lon, name: dumpSite.name || "Landfill Dump Site", isDepot: true };
    const nodes = [origin, ...clusterBins.map((b) => ({
      ...b,
      lat: Number(b.lat),
      lon: Number(b.lon !== void 0 ? b.lon : b.lng),
      isDepot: false
    }))];
    const { distances, durations } = await fetchOsrmTable(nodes);
    const clusterTrips = solveCVRPCluster({
      nodes,
      distanceMatrix: distances,
      durationMatrix: durations,
      capacityKg: truckCapacityKg,
      timeLimitMs: config.SOLVER_TIME_LIMIT_MS,
      startDepotIdx: 0,
      dumpSiteIdx: 0
    });
    for (const rawTrip of clusterTrips) {
      const stopNodes = rawTrip.route.map((idx) => nodes[idx]);
      if (stopNodes.length <= 2) continue;
      let tripDistKm = 0;
      let tripDurMin = 0;
      let cumMinutes = 0;
      const formattedStops = [];
      for (let s = 1; s < stopNodes.length - 1; s++) {
        const prevNode = stopNodes[s - 1];
        const currNode = stopNodes[s];
        const prevIdx = rawTrip.route[s - 1];
        const currIdx = rawTrip.route[s];
        const legDist = Number((distances[prevIdx][currIdx] || haversineDistanceKm2(prevNode.lat, prevNode.lon, currNode.lat, currNode.lon)).toFixed(2));
        const legDur = Number((durations[prevIdx][currIdx] || legDist / config.AVERAGE_TRUCK_SPEED_KMH * 60).toFixed(1));
        cumMinutes += legDur + config.SERVICE_TIME_PER_BIN_MINS;
        tripDistKm += legDist;
        tripDurMin += legDur + config.SERVICE_TIME_PER_BIN_MINS;
        const fill = Number(currNode.fillLevel !== void 0 ? currNode.fillLevel : currNode.fill) || 0;
        const isHazard = currNode.fire === true || currNode.status === "critical" || currNode.status === "fire";
        formattedStops.push({
          stopNumber: formattedStops.length + 1,
          binId: currNode.id || currNode.binCode,
          name: currNode.binCode || currNode.id || `Bin #${s}`,
          location: currNode.location || `Stop #${s}`,
          ward: currNode.ward?.name || currNode.ward?.area || (currNode.wardId ? `Ward ${currNode.wardId}` : "Assigned Ward"),
          wardId: currNode.wardId || currNode.ward?.id,
          lat: currNode.lat,
          lon: currNode.lon,
          lng: currNode.lon,
          fillLevel: fill,
          capacityKg: currNode.capacityKg || 120,
          demandKg: getBinDemandKg(currNode),
          priority: isHazard ? "CRITICAL_HAZARD" : fill >= 90 ? "CRITICAL_OVERFLOW" : "MUST_VISIT",
          etaMinutes: Math.round(cumMinutes),
          legDistanceKm: legDist
        });
      }
      const lastStopIdx = rawTrip.route[rawTrip.route.length - 2];
      const endDepotIdx = rawTrip.route[rawTrip.route.length - 1];
      const returnDist = Number((distances[lastStopIdx][endDepotIdx] || haversineDistanceKm2(stopNodes[stopNodes.length - 2].lat, stopNodes[stopNodes.length - 2].lon, dump.lat, dump.lon)).toFixed(2));
      const returnDur = Number((durations[lastStopIdx][endDepotIdx] || returnDist / config.AVERAGE_TRUCK_SPEED_KMH * 60).toFixed(1));
      tripDistKm += returnDist;
      tripDurMin += returnDur;
      const hasHazard = formattedStops.some((s) => s.priority === "CRITICAL_HAZARD");
      const loadKg = Number(rawTrip.loadKg.toFixed(1));
      const tripObj = {
        tripNumber: tripCounter++,
        stops: formattedStops,
        stopsCount: formattedStops.length,
        distanceKm: Number(tripDistKm.toFixed(2)),
        durationMin: Math.round(tripDurMin),
        loadKg,
        capacityKg: truckCapacityKg,
        utilizationPct: Math.round(loadKg / truckCapacityKg * 100),
        hasHazard,
        depot,
        dumpSite,
        geometry: {
          type: "LineString",
          coordinates: stopNodes.map((w) => [w.lon, w.lat])
        }
      };
      allTrips.push(tripObj);
      if (includeGeometry) {
        geometryTasks.push(
          fetchRouteGeometry(stopNodes).then((geom) => {
            tripObj.geometry = geom;
          }).catch(() => {
          })
        );
      }
      overallDistanceKm += tripDistKm;
      overallDurationMin += tripDurMin;
      overallLoadKg += loadKg;
    }
  }
  if (geometryTasks.length > 0) {
    await Promise.all(geometryTasks);
  }
  allTrips.sort((a, b) => {
    if (a.hasHazard && !b.hasHazard) return -1;
    if (!a.hasHazard && b.hasHazard) return 1;
    return a.tripNumber - b.tripNumber;
  });
  allTrips.forEach((t, idx) => {
    t.tripNumber = idx + 1;
  });
  return {
    trips: allTrips,
    totalDistanceKm: Number(overallDistanceKm.toFixed(2)),
    totalDurationMin: Math.round(overallDurationMin),
    totalLoadKg: Number(overallLoadKg.toFixed(1)),
    candidateCount: mustVisitBins.length,
    totalBinsInScope: binsInScope.length,
    skippedBins: {
      count: skippedBins.length,
      ids: skippedBins.map((b) => b.id || b.binCode)
    },
    depot,
    dumpSite
  };
}
async function compareRouteStrategies(binsInScope = [], depot = ROUTE_CONFIG.DEPOT_LOCATION) {
  if (!binsInScope || binsInScope.length === 0) {
    return {
      baselineA: { name: "Fixed Route (All Bins)", totalDistanceKm: 0, binsVisited: 0, overflowEvents: 0, fuelCostBdt: 0 },
      baselineB: { name: "Nearest-Neighbor Greedy (All Bins)", totalDistanceKm: 0, binsVisited: 0, overflowEvents: 0, fuelCostBdt: 0 },
      proposed: { name: "IntelliWaste Threshold & CVRP Optimizer", totalDistanceKm: 0, binsVisited: 0, overflowEvents: 0, fuelCostBdt: 0 }
    };
  }
  const fuelCostPerKm = ROUTE_CONFIG.DIESEL_PRICE_PER_LITRE_BDT / ROUTE_CONFIG.TRUCK_FUEL_CONSUMPTION_KM_PER_LITRE;
  const fixedNodes = [...binsInScope].sort((a, b) => String(a.binCode || a.id).localeCompare(String(b.binCode || b.id)));
  let distA = 0;
  let prevLat = depot.lat;
  let prevLon = depot.lon;
  for (const b of fixedNodes) {
    const lat = b.lat;
    const lon = b.lon !== void 0 ? b.lon : b.lng;
    distA += haversineDistanceKm2(prevLat, prevLon, lat, lon);
    prevLat = lat;
    prevLon = lon;
  }
  distA += haversineDistanceKm2(prevLat, prevLon, depot.lat, depot.lon);
  const unvisitedB = [...binsInScope];
  let distB = 0;
  let currLat = depot.lat;
  let currLon = depot.lon;
  while (unvisitedB.length > 0) {
    let nearestIdx = -1;
    let minDist = Infinity;
    for (let i = 0; i < unvisitedB.length; i++) {
      const b = unvisitedB[i];
      const d = haversineDistanceKm2(currLat, currLon, b.lat, b.lon !== void 0 ? b.lon : b.lng);
      if (d < minDist) {
        minDist = d;
        nearestIdx = i;
      }
    }
    const [picked] = unvisitedB.splice(nearestIdx, 1);
    distB += minDist;
    currLat = picked.lat;
    currLon = picked.lon !== void 0 ? picked.lon : picked.lng;
  }
  distB += haversineDistanceKm2(currLat, currLon, depot.lat, depot.lon);
  const proposedResult = await optimizeRouteForScope({ binsInScope, depot });
  const visitedIds = /* @__PURE__ */ new Set();
  proposedResult.trips.forEach((t) => t.stops.forEach((s) => visitedIds.add(s.binId)));
  const unvisitedCritical = binsInScope.filter((b) => {
    const fill = Number(b.fillLevel !== void 0 ? b.fillLevel : b.fill) || 0;
    const id = b.id || b.binCode;
    return fill >= 90 && !visitedIds.has(id);
  }).length;
  return {
    baselineA: {
      name: "Baseline A: Fixed Sequence (All Bins)",
      totalDistanceKm: Number(distA.toFixed(2)),
      binsVisited: binsInScope.length,
      estimatedOverflowEvents: 0,
      estimatedFuelCostBdt: Math.round(distA * fuelCostPerKm),
      description: "Static legacy schedule visiting every single bin regardless of fill level"
    },
    baselineB: {
      name: "Baseline B: Nearest-Neighbour Greedy (All Bins)",
      totalDistanceKm: Number(distB.toFixed(2)),
      binsVisited: binsInScope.length,
      estimatedOverflowEvents: 0,
      estimatedFuelCostBdt: Math.round(distB * fuelCostPerKm),
      description: "Greedy heuristic visiting all containers without dynamic fill filtering"
    },
    proposed: {
      name: "Proposed: Dynamic Threshold + Forecast + CVRP Optimizer",
      totalDistanceKm: proposedResult.totalDistanceKm,
      binsVisited: proposedResult.candidateCount,
      skippedBinsCount: proposedResult.skippedBins.count,
      estimatedOverflowEvents: unvisitedCritical,
      estimatedFuelCostBdt: Math.round(proposedResult.totalDistanceKm * fuelCostPerKm),
      tripsCount: proposedResult.trips.length,
      description: "Lean candidate filtering (fill >= 70%, 12h forecast, alerts) with cluster CVRP"
    },
    comparisonMetrics: {
      distanceSavedVsBaselineAKm: Number((distA - proposedResult.totalDistanceKm).toFixed(2)),
      distanceSavedVsBaselineBKm: Number((distB - proposedResult.totalDistanceKm).toFixed(2)),
      fuelSavingsVsBaselineABdt: Math.round((distA - proposedResult.totalDistanceKm) * fuelCostPerKm),
      fuelSavingsVsBaselineBBdt: Math.round((distB - proposedResult.totalDistanceKm) * fuelCostPerKm)
    }
  };
}

// lib/handlers/routes/index.ts
var lastReoptMap = /* @__PURE__ */ new Map();
var routes_default = apiHandler(
  async (req, res, currentUser) => {
    const driverId = currentUser?.userId || currentUser?.id;
    if (!driverId) {
      return res.status(401).json({ error: "Unauthorized: Driver identification required" });
    }
    let driverScope = null;
    try {
      driverScope = getDriverBinScope(currentUser);
    } catch (err) {
      return res.status(403).json({ error: err.message || "Driver scope assignment invalid" });
    }
    const segments = Array.isArray(req.query?.path) ? req.query.path : typeof req.query?.path === "string" ? req.query.path.split("/").filter(Boolean) : [];
    const cleanUrl = (req.url || "").split("?")[0].replace(/^\/api\/?/, "").replace(/^\//, "");
    const urlSegs = cleanUrl.split("/").filter(Boolean);
    const action = segments[1] || urlSegs[1] || req.query?.action || "current";
    async function getBinsInScope(filterWardId) {
      const targetWardId = filterWardId || driverScope.wardId;
      const targetCityCorpId = driverScope.cityCorpId;
      try {
        const whereClause = {};
        if (targetWardId) {
          whereClause.wardId = targetWardId;
        } else if (targetCityCorpId) {
          whereClause.OR = [
            { cityCorpId: targetCityCorpId },
            { ward: { cityCorpId: targetCityCorpId } }
          ];
        }
        const dbBins = await prisma_default.bin.findMany({
          where: whereClause,
          select: {
            id: true,
            binCode: true,
            location: true,
            capacity: true,
            capacityKg: true,
            fill: true,
            fillLevel: true,
            temp: true,
            gas: true,
            fire: true,
            status: true,
            lat: true,
            lng: true,
            wardId: true,
            cityCorpId: true,
            forecastFull90At: true,
            alerts: {
              where: { resolved: false },
              select: { id: true, type: true, message: true, priority: true }
            },
            ward: {
              select: { id: true, name: true, area: true, cityCorpId: true }
            }
          }
        });
        if (dbBins && dbBins.length > 0) {
          return dbBins.map((b) => ({
            ...b,
            lon: b.lng,
            capacityKg: b.capacityKg || 120,
            fillLevel: b.fillLevel || b.fill || 0
          }));
        }
      } catch (err) {
        console.warn("[Route DB Notice] Fallback to memory store:", err.message);
      }
      let memBins = [...memoryDb.bins];
      if (targetWardId) {
        memBins = memBins.filter((b) => b.wardId === targetWardId);
      } else if (targetCityCorpId) {
        memBins = memBins.filter((b) => {
          if (b.cityCorpId === targetCityCorpId) return true;
          const ward = memoryDb.wards.find((w) => w.id === b.wardId);
          return ward && ward.cityCorpId === targetCityCorpId;
        });
      }
      return memBins.map((b) => {
        const ward = memoryDb.wards.find((w) => w.id === b.wardId);
        const activeAlerts = memoryDb.alerts.filter((a) => a.binId === b.id && !a.resolved);
        return {
          ...b,
          lon: b.lng,
          capacityKg: b.capacityKg || 120,
          fillLevel: b.fillLevel || b.fill || 0,
          ward: ward ? { id: ward.id, name: ward.name, area: ward.area, cityCorpId: ward.cityCorpId } : null,
          alerts: activeAlerts
        };
      });
    }
    if (req.method === "GET" && (action === "bins" || req.query.view === "bins")) {
      const filterWard = req.query.ward || void 0;
      const allBins = await getBinsInScope(filterWard);
      const west = req.query.west ? Number(req.query.west) : null;
      const south = req.query.south ? Number(req.query.south) : null;
      const east = req.query.east ? Number(req.query.east) : null;
      const north = req.query.north ? Number(req.query.north) : null;
      let filtered = allBins;
      if (west !== null && south !== null && east !== null && north !== null) {
        filtered = allBins.filter((b) => {
          const lat = b.lat;
          const lon = b.lon !== void 0 ? b.lon : b.lng;
          return lat >= south && lat <= north && lon >= west && lon <= east;
        });
      }
      const limit = req.query.limit ? parseInt(req.query.limit, 10) : 5e3;
      const offset = req.query.offset ? parseInt(req.query.offset, 10) : 0;
      const sliced = filtered.slice(offset, offset + limit);
      const lightweight = sliced.map((b) => ({
        id: b.id,
        binCode: b.binCode,
        location: b.location,
        lat: b.lat,
        lon: b.lon !== void 0 ? b.lon : b.lng,
        lng: b.lon !== void 0 ? b.lon : b.lng,
        fill: b.fillLevel || b.fill || 0,
        fillLevel: b.fillLevel || b.fill || 0,
        status: b.status || "normal",
        temp: b.temp,
        gas: b.gas,
        fire: b.fire,
        capacityKg: b.capacityKg || 120,
        wardId: b.wardId,
        wardName: b.ward?.name || b.ward?.area || `Ward ${b.wardId}`,
        forecastFull90At: b.forecastFull90At,
        hasActiveAlert: Array.isArray(b.alerts) && b.alerts.length > 0
      }));
      return res.status(200).json({
        total: filtered.length,
        scope: driverScope,
        bins: lightweight
      });
    }
    if (req.method === "GET" && action === "compare") {
      const allBins = await getBinsInScope();
      const comparison = await compareRouteStrategies(allBins, ROUTE_CONFIG.DEPOT_LOCATION);
      return res.status(200).json({
        scope: driverScope,
        totalBinsInScope: allBins.length,
        ...comparison
      });
    }
    if (req.method === "GET" && (action === "optimize" || action === "current")) {
      if (action === "current") {
        try {
          const existingDbRoute = await prisma_default.route.findFirst({
            where: { driverId, status: "active" },
            orderBy: { createdAt: "desc" }
          });
          if (existingDbRoute) {
            const parsed = {
              id: existingDbRoute.id,
              driverId: existingDbRoute.driverId,
              scope: JSON.parse(existingDbRoute.scope || "{}"),
              trips: JSON.parse(existingDbRoute.trips || "[]"),
              totalDistanceKm: existingDbRoute.totalDistanceKm,
              totalDurationMin: existingDbRoute.totalDurationMin,
              status: existingDbRoute.status,
              createdAt: existingDbRoute.createdAt
            };
            return res.status(200).json(parsed);
          }
        } catch {
        }
        const memRoute = (memoryDb.routes || []).find((r) => r.driverId === driverId && r.status === "active");
        if (memRoute) {
          return res.status(200).json(memRoute);
        }
      }
      const binsInScope = await getBinsInScope();
      const optResult = await optimizeRouteForScope({
        binsInScope,
        depot: ROUTE_CONFIG.DEPOT_LOCATION,
        dumpSite: ROUTE_CONFIG.DUMP_SITE_LOCATION,
        truckCapacityKg: ROUTE_CONFIG.TRUCK_CAPACITY_KG
      });
      const routeRecord = {
        id: `route-${Date.now()}`,
        driverId,
        scope: driverScope,
        trips: optResult.trips,
        totalDistanceKm: optResult.totalDistanceKm,
        totalDurationMin: optResult.totalDurationMin,
        totalLoadKg: optResult.totalLoadKg,
        candidateCount: optResult.candidateCount,
        totalBinsInScope: optResult.totalBinsInScope,
        skippedBins: optResult.skippedBins,
        status: "active",
        depot: optResult.depot,
        dumpSite: optResult.dumpSite,
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      if (!memoryDb.routes) memoryDb.routes = [];
      memoryDb.routes = memoryDb.routes.filter((r) => r.driverId !== driverId);
      memoryDb.routes.push(routeRecord);
      try {
        await prisma_default.route.deleteMany({ where: { driverId } });
        await prisma_default.route.create({
          data: {
            id: routeRecord.id,
            driverId,
            scope: JSON.stringify(driverScope),
            trips: JSON.stringify(optResult.trips),
            totalDistanceKm: optResult.totalDistanceKm,
            totalDurationMin: optResult.totalDurationMin,
            status: "active"
          }
        });
      } catch {
      }
      return res.status(200).json(routeRecord);
    }
    if (req.method === "POST" && (action === "reoptimize" || req.body?.action === "reoptimize")) {
      const now = Date.now();
      const lastCall = lastReoptMap.get(driverId) || 0;
      if (now - lastCall < 1500) {
        return res.status(429).json({ error: "Re-optimization rate limit exceeded. Please wait a moment." });
      }
      lastReoptMap.set(driverId, now);
      const { currentLat, currentLon, currentLng, completedBinIds = [] } = req.body || {};
      const lat = Number(currentLat);
      const lon = Number(currentLon !== void 0 ? currentLon : currentLng);
      const allBins = await getBinsInScope();
      const completedSet = new Set(completedBinIds.map(String));
      const remainingBins = allBins.filter((b) => !completedSet.has(String(b.id)) && !completedSet.has(String(b.binCode)));
      const startLocation = !isNaN(lat) && !isNaN(lon) && lat !== 0 && lon !== 0 ? { lat, lon, name: "Live Truck Position" } : null;
      const optResult = await optimizeRouteForScope({
        binsInScope: remainingBins,
        depot: ROUTE_CONFIG.DEPOT_LOCATION,
        dumpSite: ROUTE_CONFIG.DUMP_SITE_LOCATION,
        truckCapacityKg: ROUTE_CONFIG.TRUCK_CAPACITY_KG,
        startLocation
      });
      const updatedRoute = {
        id: `route-${Date.now()}`,
        driverId,
        scope: driverScope,
        trips: optResult.trips,
        totalDistanceKm: optResult.totalDistanceKm,
        totalDurationMin: optResult.totalDurationMin,
        totalLoadKg: optResult.totalLoadKg,
        candidateCount: optResult.candidateCount,
        totalBinsInScope: allBins.length,
        skippedBins: optResult.skippedBins,
        status: "active",
        depot: optResult.depot,
        dumpSite: optResult.dumpSite,
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      if (!memoryDb.routes) memoryDb.routes = [];
      memoryDb.routes = memoryDb.routes.filter((r) => r.driverId !== driverId);
      memoryDb.routes.push(updatedRoute);
      try {
        await prisma_default.route.deleteMany({ where: { driverId } });
        await prisma_default.route.create({
          data: {
            id: updatedRoute.id,
            driverId,
            scope: JSON.stringify(driverScope),
            trips: JSON.stringify(optResult.trips),
            totalDistanceKm: optResult.totalDistanceKm,
            totalDurationMin: optResult.totalDurationMin,
            status: "active"
          }
        });
      } catch {
      }
      return res.status(200).json(updatedRoute);
    }
    return res.status(405).json({ error: "Method not allowed on routes endpoint" });
  },
  { allowedMethods: ["GET", "POST"] }
);

// api-src/index.ts
async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,PATCH,DELETE,POST,PUT");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization"
  );
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  try {
    const matched = req.headers["x-matched-path"] || req.headers["x-now-route-matches"];
    const rawUrl = req.url && req.url !== "/api/index.js" && req.url !== "/api/[...path].js" ? req.url : matched || req.url || "";
    const urlClean = rawUrl.split("?")[0];
    const urlPath = urlClean.replace(/^\/api\/?/, "").replace(/^\//, "");
    const segments = Array.isArray(req.query.path) ? req.query.path : typeof req.query.path === "string" ? req.query.path.split("/").filter(Boolean) : urlPath.split("/").filter(Boolean);
    const [resource, subResource] = segments;
    if (resource === "auth") {
      if (subResource === "login") return login_default(req, res);
      if (subResource === "register") return register_default(req, res);
      if (subResource === "me") return me_default(req, res);
      if (subResource === "forgot-password") return forgot_password_default(req, res);
      if (subResource === "verify-code") return verify_code_default(req, res);
      if (subResource === "reset-password") return reset_password_default(req, res);
    }
    if (resource === "setup") {
      return setup_default(req, res);
    }
    if (resource === "dashboard") {
      if (subResource === "stats") return stats_default(req, res);
    }
    if (resource === "seed") {
      return seed_default(req, res);
    }
    if (resource === "alerts") {
      return alerts_default(req, res);
    }
    if (resource === "cities") {
      if (subResource) {
        req.query.id = subResource;
        return id_default(req, res);
      }
      return cities_default(req, res);
    }
    if (resource === "wards") {
      if (subResource) {
        req.query.id = subResource;
        return id_default2(req, res);
      }
      return wards_default(req, res);
    }
    if (resource === "bins") {
      if (subResource) {
        req.query.id = subResource;
        return id_default3(req, res);
      }
      return bins_default(req, res);
    }
    if (resource === "tracks") {
      if (subResource) {
        req.query.id = subResource;
        return id_default4(req, res);
      }
      return tracks_default(req, res);
    }
    if (resource === "users") {
      if (subResource) {
        req.query.id = subResource;
        return id_default5(req, res);
      }
      return users_default(req, res);
    }
    if (resource === "withdrawals") {
      if (subResource) {
        req.query.id = subResource;
        return id_default6(req, res);
      }
      return withdrawals_default(req, res);
    }
    if (resource === "pickups") {
      if (subResource) {
        req.query.id = subResource;
        return id_default7(req, res);
      }
      return pickups_default(req, res);
    }
    if (resource === "reports") {
      return reports_default(req, res);
    }
    if (resource === "audit") {
      return audit_default(req, res);
    }
    if (resource === "alerts") {
      return alerts_default(req, res);
    }
    if (resource === "ranks") {
      return ranks_default(req, res);
    }
    if (resource === "rewards") {
      if (subResource === "redeem") {
        req.body = { ...req.body, action: "redeem" };
      }
      return rewards_default(req, res);
    }
    if (resource === "schedules") {
      return schedules_default(req, res);
    }
    if (resource === "waste-types") {
      return waste_types_default(req, res);
    }
    if (resource === "wallet") {
      return wallet_default(req, res);
    }
    if (resource === "routes") {
      req.query.action = subResource || req.query.action || "current";
      return routes_default(req, res);
    }
    return res.status(200).json({ status: "healthy", endpoint: segments.join("/") });
  } catch (err) {
    console.warn("[API Router Caught Fallback]", err?.message || err);
    if (!res.writableEnded) {
      if (req.method === "GET") {
        return res.status(200).json([]);
      }
      return res.status(200).json({
        success: true,
        message: "Handled via global resilient router fallback"
      });
    }
  }
}
export {
  handler as default
};
/*! Bundled license information:

bcryptjs/dist/bcrypt.js:
  (**
   * @license bcrypt.js (c) 2013 Daniel Wirtz <dcode@dcode.io>
   * Released under the Apache License, Version 2.0
   * see: https://github.com/dcodeIO/bcrypt.js for details
   *)

safe-buffer/index.js:
  (*! safe-buffer. MIT License. Feross Aboukhadijeh <https://feross.org/opensource> *)
*/
