//From http://www.ohdave.com/rsa/
// BigInt, a suite of routines for performing multiple-precision arithmetic in
// JavaScript.
//
// Copyright 1998-2005 David Shapiro.
//
// You may use, re-use, abuse,
// copy, and modify this code to your liking, but please keep this header.
// Thanks!
//
// Dave Shapiro
// dave@ohdave.com
// IMPORTANT THING: Be sure to set maxDigits according to your precision
// needs. Use the setMaxDigits() function to do this. See comments below.
//
// Tweaked by Ian Bunning
// Alterations:
// Fix bug in function biFromHex(s) to allow
// parsing of strings of length != 0 (mod 4)
// Changes made by Dave Shapiro as of 12/30/2004:
//
// The BigInt() constructor doesn't take a string anymore. If you want to
// create a BigInt from a string, use biFromDecimal() for base-10
// representations, biFromHex() for base-16 representations, or
// biFromString() for base-2-to-36 representations.
//
// biFromArray() has been removed. Use biCopy() instead, passing a BigInt
// instead of an array.
//
// The BigInt() constructor now only constructs a zeroed-out array.
// Alternatively, if you pass <true>, it won't construct any array. See the
// biCopy() method for an example of this.
//
// Be sure to set maxDigits depending on your precision needs. The default
// zeroed-out array ZERO_ARRAY is constructed inside the setMaxDigits()
// function. So use this function to set the variable. DON'T JUST SET THE
// VALUE. USE THE FUNCTION.
//
// ZERO_ARRAY exists to hopefully speed up construction of BigInts(). By
// precalculating the zero array, we can just use slice(0) to make copies of
// it. Presumably this calls faster native code, as opposed to setting the
// elements one at a time. I have not done any timing tests to verify this
// claim.
// Max number = 10^16 - 2 = 9999999999999998;
//               2^53     = 9007199254740992;
var biRadixBase = 2;
var biRadixBits = 16;
var bitsPerDigit = biRadixBits;
var biRadix = 1 << 16; // = 2^16 = 65536
var biHalfRadix = biRadix >>> 1;
var biRadixSquared = biRadix * biRadix;
var maxDigitVal = biRadix - 1;
var maxInteger = 9999999999999998;

// maxDigits:
// Change this to accommodate your largest number size. Use setMaxDigits()
// to change it!
//
// In general, if you're working with numbers of size N bits, you'll need 2*N
// bits of storage. Each digit holds 16 bits. So, a 1024-bit key will need
//
// 1024 * 2 / 16 = 128 digits of storage.
//
var maxDigits;
var ZERO_ARRAY;
var bigZero, bigOne;

function setMaxDigits(value) {
  maxDigits = value;
  ZERO_ARRAY = new Array(maxDigits);
  for (var iza = 0; iza < ZERO_ARRAY.length; iza++) ZERO_ARRAY[iza] = 0;
  bigZero = new BigInt();
  bigOne = new BigInt();
  bigOne.digits[0] = 1;
}

setMaxDigits(20);

// The maximum number of digits in base 10 you can convert to an
// integer without JavaScript throwing up on you.
var dpl10 = 15;
// lr10 = 10 ^ dpl10
var lr10 = biFromNumber(1000000000000000);

function BigInt(flag) {
  if (typeof flag == "boolean" && flag == true) {
    this.digits = null;
  } else {
    this.digits = ZERO_ARRAY.slice(0);
  }
  this.isNeg = false;
}

function biFromDecimal(s) {
  var isNeg = s.charAt(0) == '-';
  var i = isNeg ? 1 : 0;
  var result;
  // Skip leading zeros.
  while (i < s.length && s.charAt(i) == '0')++i;
  if (i == s.length) {
    result = new BigInt();
  } else {
    var digitCount = s.length - i;
    var fgl = digitCount % dpl10;
    if (fgl == 0) fgl = dpl10;
    result = biFromNumber(Number(s.substr(i, fgl)));
    i += fgl;
    while (i < s.length) {
      result = biAdd(biMultiply(result, lr10), biFromNumber(Number(s.substr(i, dpl10))));
      i += dpl10;
    }
    result.isNeg = isNeg;
  }
  return result;
}

function biCopy(bi) {
  var result = new BigInt(true);
  result.digits = bi.digits.slice(0);
  result.isNeg = bi.isNeg;
  return result;
}

function biFromNumber(i) {
  var result = new BigInt();
  result.isNeg = i < 0;
  i = Math.abs(i);
  var j = 0;
  while (i > 0) {
    result.digits[j++] = i & maxDigitVal;
    i >>= biRadixBits;
  }
  return result;
}

function reverseStr(s) {
  var result = "";
  for (var i = s.length - 1; i > -1; --i) {
    result += s.charAt(i);
  }
  return result;
}

var hexatrigesimalToChar = new Array('0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z');

function biToString(x, radix)
// 2 <= radix <= 36
{
  var b = new BigInt();
  b.digits[0] = radix;
  var qr = biDivideModulo(x, b);
  var result = hexatrigesimalToChar[qr[1].digits[0]];
  while (biCompare(qr[0], bigZero) == 1) {
    qr = biDivideModulo(qr[0], b);
    digit = qr[1].digits[0];
    result += hexatrigesimalToChar[qr[1].digits[0]];
  }
  return (x.isNeg ? "-" : "") + reverseStr(result);
}

function biToDecimal(x) {
  var b = new BigInt();
  b.digits[0] = 10;
  var qr = biDivideModulo(x, b);
  var result = String(qr[1].digits[0]);
  while (biCompare(qr[0], bigZero) == 1) {
    qr = biDivideModulo(qr[0], b);
    result += String(qr[1].digits[0]);
  }
  return (x.isNeg ? "-" : "") + reverseStr(result);
}

var hexToChar = new Array('0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f');

function digitToHex(n) {
  var mask = 0xf;
  var result = "";
  for (i = 0; i < 4; ++i) {
    result += hexToChar[n & mask];
    n >>>= 4;
  }
  return reverseStr(result);
}

function biToHex(x) {
  var result = "";
  var n = biHighIndex(x);
  for (var i = biHighIndex(x); i > -1; --i) {
    result += digitToHex(x.digits[i]);
  }
  return result;
}

function charToHex(c) {
  var ZERO = 48;
  var NINE = ZERO + 9;
  var littleA = 97;
  var littleZ = littleA + 25;
  var bigA = 65;
  var bigZ = 65 + 25;
  var result;

  if (c >= ZERO && c <= NINE) {
    result = c - ZERO;
  } else if (c >= bigA && c <= bigZ) {
    result = 10 + c - bigA;
  } else if (c >= littleA && c <= littleZ) {
    result = 10 + c - littleA;
  } else {
    result = 0;
  }
  return result;
}

function hexToDigit(s) {
  var result = 0;
  var sl = Math.min(s.length, 4);
  for (var i = 0; i < sl; ++i) {
    result <<= 4;
    result |= charToHex(s.charCodeAt(i))
  }
  return result;
}

function biFromHex(s) {
  var result = new BigInt();
  var sl = s.length;
  for (var i = sl, j = 0; i > 0; i -= 4, ++j) {
    result.digits[j] = hexToDigit(s.substr(Math.max(i - 4, 0), Math.min(i, 4)));
  }
  return result;
}

function biFromString(s, radix) {
  var isNeg = s.charAt(0) == '-';
  var istop = isNeg ? 1 : 0;
  var result = new BigInt();
  var place = new BigInt();
  place.digits[0] = 1; // radix^0
  for (var i = s.length - 1; i >= istop; i--) {
    var c = s.charCodeAt(i);
    var digit = charToHex(c);
    var biDigit = biMultiplyDigit(place, digit);
    result = biAdd(result, biDigit);
    place = biMultiplyDigit(place, radix);
  }
  result.isNeg = isNeg;
  return result;
}

function biDump(b) {
  return (b.isNeg ? "-" : "") + b.digits.join(" ");
}

function biAdd(x, y) {
  var result;

  if (x.isNeg != y.isNeg) {
    y.isNeg = !y.isNeg;
    result = biSubtract(x, y);
    y.isNeg = !y.isNeg;
  } else {
    result = new BigInt();
    var c = 0;
    var n;
    for (var i = 0; i < x.digits.length; ++i) {
      n = x.digits[i] + y.digits[i] + c;
      result.digits[i] = n & 0xffff;
      c = Number(n >= biRadix);
    }
    result.isNeg = x.isNeg;
  }
  return result;
}

function biSubtract(x, y) {
  var result;
  if (x.isNeg != y.isNeg) {
    y.isNeg = !y.isNeg;
    result = biAdd(x, y);
    y.isNeg = !y.isNeg;
  } else {
    result = new BigInt();
    var n, c;
    c = 0;
    for (var i = 0; i < x.digits.length; ++i) {
      n = x.digits[i] - y.digits[i] + c;
      result.digits[i] = n & 0xffff;
      // Stupid non-conforming modulus operation.
      if (result.digits[i] < 0) result.digits[i] += biRadix;
      c = 0 - Number(n < 0);
    }
    // Fix up the negative sign, if any.
    if (c == -1) {
      c = 0;
      for (var i = 0; i < x.digits.length; ++i) {
        n = 0 - result.digits[i] + c;
        result.digits[i] = n & 0xffff;
        // Stupid non-conforming modulus operation.
        if (result.digits[i] < 0) result.digits[i] += biRadix;
        c = 0 - Number(n < 0);
      }
      // Result is opposite sign of arguments.
      result.isNeg = !x.isNeg;
    } else {
      // Result is same sign.
      result.isNeg = x.isNeg;
    }
  }
  return result;
}

function biHighIndex(x) {
  var result = x.digits.length - 1;
  while (result > 0 && x.digits[result] == 0)--result;
  return result;
}

function biNumBits(x) {
  var n = biHighIndex(x);
  var d = x.digits[n];
  var m = (n + 1) * bitsPerDigit;
  var result;
  for (result = m; result > m - bitsPerDigit; --result) {
    if ((d & 0x8000) != 0) break;
    d <<= 1;
  }
  return result;
}

function biMultiply(x, y) {
  var result = new BigInt();
  var c;
  var n = biHighIndex(x);
  var t = biHighIndex(y);
  var u, uv, k;

  for (var i = 0; i <= t; ++i) {
    c = 0;
    k = i;
    for (j = 0; j <= n; ++j, ++k) {
      uv = result.digits[k] + x.digits[j] * y.digits[i] + c;
      result.digits[k] = uv & maxDigitVal;
      c = uv >>> biRadixBits;
    }
    result.digits[i + n + 1] = c;
  }
  // Someone give me a logical xor, please.
  result.isNeg = x.isNeg != y.isNeg;
  return result;
}

function biMultiplyDigit(x, y) {
  var n, c, uv;

  result = new BigInt();
  n = biHighIndex(x);
  c = 0;
  for (var j = 0; j <= n; ++j) {
    uv = result.digits[j] + x.digits[j] * y + c;
    result.digits[j] = uv & maxDigitVal;
    c = uv >>> biRadixBits;
  }
  result.digits[1 + n] = c;
  return result;
}

function arrayCopy(src, srcStart, dest, destStart, n) {
  var m = Math.min(srcStart + n, src.length);
  for (var i = srcStart, j = destStart; i < m; ++i, ++j) {
    dest[j] = src[i];
  }
}

var highBitMasks = new Array(0x0000, 0x8000, 0xC000, 0xE000, 0xF000, 0xF800, 0xFC00, 0xFE00, 0xFF00, 0xFF80, 0xFFC0, 0xFFE0, 0xFFF0, 0xFFF8, 0xFFFC, 0xFFFE, 0xFFFF);

function biShiftLeft(x, n) {
  var digitCount = Math.floor(n / bitsPerDigit);
  var result = new BigInt();
  arrayCopy(x.digits, 0, result.digits, digitCount, result.digits.length - digitCount);
  var bits = n % bitsPerDigit;
  var rightBits = bitsPerDigit - bits;
  for (var i = result.digits.length - 1, i1 = i - 1; i > 0; --i, --i1) {
    result.digits[i] = ((result.digits[i] << bits) & maxDigitVal) | ((result.digits[i1] & highBitMasks[bits]) >>> (rightBits));
  }
  result.digits[0] = ((result.digits[i] << bits) & maxDigitVal);
  result.isNeg = x.isNeg;
  return result;
}

var lowBitMasks = new Array(0x0000, 0x0001, 0x0003, 0x0007, 0x000F, 0x001F, 0x003F, 0x007F, 0x00FF, 0x01FF, 0x03FF, 0x07FF, 0x0FFF, 0x1FFF, 0x3FFF, 0x7FFF, 0xFFFF);

function biShiftRight(x, n) {
  var digitCount = Math.floor(n / bitsPerDigit);
  var result = new BigInt();
  arrayCopy(x.digits, digitCount, result.digits, 0, x.digits.length - digitCount);
  var bits = n % bitsPerDigit;
  var leftBits = bitsPerDigit - bits;
  for (var i = 0, i1 = i + 1; i < result.digits.length - 1; ++i, ++i1) {
    result.digits[i] = (result.digits[i] >>> bits) | ((result.digits[i1] & lowBitMasks[bits]) << leftBits);
  }
  result.digits[result.digits.length - 1] >>>= bits;
  result.isNeg = x.isNeg;
  return result;
}

function biMultiplyByRadixPower(x, n) {
  var result = new BigInt();
  arrayCopy(x.digits, 0, result.digits, n, result.digits.length - n);
  return result;
}

function biDivideByRadixPower(x, n) {
  var result = new BigInt();
  arrayCopy(x.digits, n, result.digits, 0, result.digits.length - n);
  return result;
}

function biModuloByRadixPower(x, n) {
  var result = new BigInt();
  arrayCopy(x.digits, 0, result.digits, 0, n);
  return result;
}

function biCompare(x, y) {
  if (x.isNeg != y.isNeg) {
    return 1 - 2 * Number(x.isNeg);
  }
  for (var i = x.digits.length - 1; i >= 0; --i) {
    if (x.digits[i] != y.digits[i]) {
      if (x.isNeg) {
        return 1 - 2 * Number(x.digits[i] > y.digits[i]);
      } else {
        return 1 - 2 * Number(x.digits[i] < y.digits[i]);
      }
    }
  }
  return 0;
}

function biDivideModulo(x, y) {
  var nb = biNumBits(x);
  var tb = biNumBits(y);
  var origYIsNeg = y.isNeg;
  var q, r;
  if (nb < tb) {
    // |x| < |y|
    if (x.isNeg) {
      q = biCopy(bigOne);
      q.isNeg = !y.isNeg;
      x.isNeg = false;
      y.isNeg = false;
      r = biSubtract(y, x);
      // Restore signs, 'cause they're references.
      x.isNeg = true;
      y.isNeg = origYIsNeg;
    } else {
      q = new BigInt();
      r = biCopy(x);
    }
    return new Array(q, r);
  }

  q = new BigInt();
  r = x;

  // Normalize Y.
  var t = Math.ceil(tb / bitsPerDigit) - 1;
  var lambda = 0;
  while (y.digits[t] < biHalfRadix) {
    y = biShiftLeft(y, 1);
    ++lambda;
    ++tb;
    t = Math.ceil(tb / bitsPerDigit) - 1;
  }
  // Shift r over to keep the quotient constant. We'll shift the
  // remainder back at the end.
  r = biShiftLeft(r, lambda);
  nb += lambda; // Update the bit count for x.
  var n = Math.ceil(nb / bitsPerDigit) - 1;

  var b = biMultiplyByRadixPower(y, n - t);
  while (biCompare(r, b) != -1) {
    ++q.digits[n - t];
    r = biSubtract(r, b);
  }
  for (var i = n; i > t; --i) {
    var ri = (i >= r.digits.length) ? 0 : r.digits[i];
    var ri1 = (i - 1 >= r.digits.length) ? 0 : r.digits[i - 1];
    var ri2 = (i - 2 >= r.digits.length) ? 0 : r.digits[i - 2];
    var yt = (t >= y.digits.length) ? 0 : y.digits[t];
    var yt1 = (t - 1 >= y.digits.length) ? 0 : y.digits[t - 1];
    if (ri == yt) {
      q.digits[i - t - 1] = maxDigitVal;
    } else {
      q.digits[i - t - 1] = Math.floor((ri * biRadix + ri1) / yt);
    }

    var c1 = q.digits[i - t - 1] * ((yt * biRadix) + yt1);
    var c2 = (ri * biRadixSquared) + ((ri1 * biRadix) + ri2);
    while (c1 > c2) {
      --q.digits[i - t - 1];
      c1 = q.digits[i - t - 1] * ((yt * biRadix) | yt1);
      c2 = (ri * biRadix * biRadix) + ((ri1 * biRadix) + ri2);
    }

    b = biMultiplyByRadixPower(y, i - t - 1);
    r = biSubtract(r, biMultiplyDigit(b, q.digits[i - t - 1]));
    if (r.isNeg) {
      r = biAdd(r, b);
      --q.digits[i - t - 1];
    }
  }
  r = biShiftRight(r, lambda);
  // Fiddle with the signs and stuff to make sure that 0 <= r < y.
  q.isNeg = x.isNeg != origYIsNeg;
  if (x.isNeg) {
    if (origYIsNeg) {
      q = biAdd(q, bigOne);
    } else {
      q = biSubtract(q, bigOne);
    }
    y = biShiftRight(y, lambda);
    r = biSubtract(y, r);
  }
  // Check for the unbelievably stupid degenerate case of r == -0.
  if (r.digits[0] == 0 && biHighIndex(r) == 0) r.isNeg = false;

  return new Array(q, r);
}

function biDivide(x, y) {
  return biDivideModulo(x, y)[0];
}

function biModulo(x, y) {
  return biDivideModulo(x, y)[1];
}

function biMultiplyMod(x, y, m) {
  return biModulo(biMultiply(x, y), m);
}

function biPow(x, y) {
  var result = bigOne;
  var a = x;
  while (true) {
    if ((y & 1) != 0) result = biMultiply(result, a);
    y >>= 1;
    if (y == 0) break;
    a = biMultiply(a, a);
  }
  return result;
}

function biPowMod(x, y, m) {
  var result = bigOne;
  var a = x;
  var k = y;
  while (true) {
    if ((k.digits[0] & 1) != 0) result = biMultiplyMod(result, a, m);
    k = biShiftRight(k, 1);
    if (k.digits[0] == 0 && biHighIndex(k) == 0) break;
    a = biMultiplyMod(a, a, m);
  }
  return result;
}

// BarrettMu, a class for performing Barrett modular reduction computations in
// JavaScript.
//
// Requires BigInt.js.
//
// Copyright 2004-2005 David Shapiro.
//
// You may use, re-use, abuse, copy, and modify this code to your liking, but
// please keep this header.
//
// Thanks!
//
// Dave Shapiro
// dave@ohdave.com

function BarrettMu(m) {
  this.modulus = biCopy(m);
  this.k = biHighIndex(this.modulus) + 1;
  var b2k = new BigInt();
  b2k.digits[2 * this.k] = 1; // b2k = b^(2k)
  this.mu = biDivide(b2k, this.modulus);
  this.bkplus1 = new BigInt();
  this.bkplus1.digits[this.k + 1] = 1; // bkplus1 = b^(k+1)
  this.modulo = BarrettMu_modulo;
  this.multiplyMod = BarrettMu_multiplyMod;
  this.powMod = BarrettMu_powMod;
}

function BarrettMu_modulo(x) {
  var q1 = biDivideByRadixPower(x, this.k - 1);
  var q2 = biMultiply(q1, this.mu);
  var q3 = biDivideByRadixPower(q2, this.k + 1);
  var r1 = biModuloByRadixPower(x, this.k + 1);
  var r2term = biMultiply(q3, this.modulus);
  var r2 = biModuloByRadixPower(r2term, this.k + 1);
  var r = biSubtract(r1, r2);
  if (r.isNeg) {
    r = biAdd(r, this.bkplus1);
  }
  var rgtem = biCompare(r, this.modulus) >= 0;
  while (rgtem) {
    r = biSubtract(r, this.modulus);
    rgtem = biCompare(r, this.modulus) >= 0;
  }
  return r;
}

function BarrettMu_multiplyMod(x, y) {
  /*
   x = this.modulo(x);
   y = this.modulo(y);
   */
  var xy = biMultiply(x, y);
  return this.modulo(xy);
}

function BarrettMu_powMod(x, y) {
  var result = new BigInt();
  result.digits[0] = 1;
  var a = x;
  var k = y;
  while (true) {
    if ((k.digits[0] & 1) != 0) result = this.multiplyMod(result, a);
    k = biShiftRight(k, 1);
    if (k.digits[0] == 0 && biHighIndex(k) == 0) break;
    a = this.multiplyMod(a, a);
  }
  return result;
}
// RSA, a suite of routines for performing RSA public-key computations in
// JavaScript.
//
// Requires BigInt.js and Barrett.js.
//
// Copyright 1998-2005 David Shapiro.
//
// You may use, re-use, abuse, copy, and modify this code to your liking, but
// please keep this header.
//
// Thanks!
//
// Dave Shapiro
// dave@ohdave.com

function RSAKeyPair(encryptionExponent, decryptionExponent, modulus) {
  this.e = biFromHex(encryptionExponent);
  this.d = biFromHex(decryptionExponent);
  this.m = biFromHex(modulus);
  // We can do two bytes per digit, so
  // chunkSize = 2 * (number of digits in modulus - 1).
  // Since biHighIndex returns the high index, not the number of digits, 1 has
  // already been subtracted.
  this.chunkSize = 2 * biHighIndex(this.m);
  this.radix = 16;
  this.barrett = new BarrettMu(this.m);
}

function twoDigit(n) {
  return (n < 10 ? "0" : "") + String(n);
}

function encryptedString(key, s)
// Altered by Rob Saunders (rob@robsaunders.net). New routine pads the
// string after it has been converted to an array. This fixes an
// incompatibility with Flash MX's ActionScript.
{
  var a = new Array();
  var sl = s.length;
  var i = 0;
  while (i < sl) {
    a[i] = s.charCodeAt(i);
    i++;
  }

  while (a.length % key.chunkSize != 0) {
    a[i++] = 0;
  }

  var al = a.length;
  var result = "";
  var j, k, block;
  for (i = 0; i < al; i += key.chunkSize) {
    block = new BigInt();
    j = 0;
    for (k = i; k < i + key.chunkSize; ++j) {
      block.digits[j] = a[k++];
      block.digits[j] += a[k++] << 8;
    }
    var crypt = key.barrett.powMod(block, key.e);
    var text = key.radix == 16 ? biToHex(crypt) : biToString(crypt, key.radix);
    result += text + " ";
  }
  return result.substring(0, result.length - 1); // Remove last space.
}

function decryptedString(key, s) {
  var blocks = s.split(" ");
  var result = "";
  var i, j, block;
  for (i = 0; i < blocks.length; ++i) {
    var bi;
    if (key.radix == 16) {
      bi = biFromHex(blocks[i]);
    } else {
      bi = biFromString(blocks[i], key.radix);
    }
    block = key.barrett.powMod(bi, key.d);
    for (j = 0; j <= biHighIndex(block); ++j) {
      result += String.fromCharCode(block.digits[j] & 255, block.digits[j] >> 8);
    }
  }
  // Remove trailing null, if any.
  if (result.charCodeAt(result.length - 1) == 0) {
    result = result.substring(0, result.length - 1);
  }
  return result;
}

/*
 * packages.js
 * Simple framework for managing script's dependency.
 * See packages.readme.txt for further information.
 *
 * Copyright(c) 2009 Atsushi Oka [ http://oka.nu/ ]
 * This script file is distributed under the LGPL
 */
var __Crypto = __Crypto || {};
function initPackages(__scope) {
  var __package = function (packageRoot, pathString) {
    var paths = pathString.split(".");
    var currentPackage = packageRoot;
    for (var i = 0; i < paths.length; i++) {
      var id = paths[i];
      if (currentPackage[id] == null) {
        currentPackage[id] = {};
      }
      currentPackage = currentPackage[id];
    }
    return currentPackage;
  };

  var __export = function (packageRoot, pathString, object) {
    var paths = pathString.split(".");
    var currentPackage = packageRoot;
    for (var i = 0; i < paths.length; i++) {
      var id = paths[i];
      if (i < paths.length - 1) {
        if (currentPackage[id] == null) {
          currentPackage[id] = {};
        }
      } else {
        if (currentPackage[id] == null) {
          currentPackage[id] = object;
        } else {
          throw "The specified package path is already defined. " + pathString;
        }
      }
      currentPackage = currentPackage[id];
    }
    return currentPackage;
  };

  var __import = function (packageRoot, pathString, object) {
    var paths = pathString.split(".");
    var currentPackage = packageRoot;
    var currentPath = "[package root]";
    for (var i = 0; i < paths.length; i++) {
      var id = paths[i];
      currentPath += "." + id;
      if (currentPackage[id] == null) {
        throw pathString + " is not found. " + currentPath + " is null in " + __CURRENT_UNIT.unit_name + ".";
      }
      currentPackage = currentPackage[id];
    }
    return currentPackage;
  };

  var __DEFINED_UNITS = {};
  var __CURRENT_UNIT = "";
  var __unit = function (unit_name) {
    __DEFINED_UNITS[unit_name] = true;
    __CURRENT_UNIT = {
      unit_name: unit_name,
      requring_units: {}
    };
  }
  var __uses = function (unit_name) {
    if (__DEFINED_UNITS[unit_name]) {
      __CURRENT_UNIT.requring_units[unit_name] = true;
      return true;
    } else {
      throw "Unit Not Found Error : " + __CURRENT_UNIT.unit_name + " requires " + unit_name;
    }
  };


  //Object.prototype.resolve = function( pathString ) {
  //  return __package( this, pathString );
  //};
  __scope.__package = __package;
  __scope.__import = __import;
  __scope.__export = __export;
  __scope.__unit = __unit;
  __scope.__uses = __uses;
  __scope.__DEFINED_UNITS = __DEFINED_UNITS;
  __scope.__PACKAGE_ENABLED = true;

  __unit("packages.js");
}

initPackages(__Crypto);


// vim:ts=8:
/*
 * binary.js
 * Tools for creating, modifying binary data
 * including base64-encoding, base64-decoding , utf8-encoding and utf8-decoding
 * See binary.readme.txt for further information.
 *
 * Copyright(c) 2009 Atsushi Oka [ http://oka.nu/ ]
 * This script file is distributed under the LGPL
 */

function initBinary(packageRoot) {
  if (packageRoot.__PACKAGE_ENABLED) {
    __Crypto.__unit("binary.js");
  }

  var i2a = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '+', '/'];

  function base64_encode(s) {
    var length = s.length;
    var groupCount = Math.floor(length / 3);
    var remaining = length - 3 * groupCount;
    var result = "";

    var idx = 0;
    for (var i = 0; i < groupCount; i++) {
      var b0 = s[idx++] & 0xff;
      var b1 = s[idx++] & 0xff;
      var b2 = s[idx++] & 0xff;
      result += (i2a[b0 >> 2]);
      result += (i2a[(b0 << 4) & 0x3f | (b1 >> 4)]);
      result += (i2a[(b1 << 2) & 0x3f | (b2 >> 6)]);
      result += (i2a[b2 & 0x3f]);
    }

    if (remaining == 0) {} else if (remaining == 1) {
      var b0 = s[idx++] & 0xff;
      result += (i2a[b0 >> 2]);
      result += (i2a[(b0 << 4) & 0x3f]);
      result += ("==");
    } else if (remaining == 2) {
      var b0 = s[idx++] & 0xff;
      var b1 = s[idx++] & 0xff;
      result += (i2a[b0 >> 2]);
      result += (i2a[(b0 << 4) & 0x3f | (b1 >> 4)]);
      result += (i2a[(b1 << 2) & 0x3f]);
      result += ('=');
    } else {
      throw "never happen";
    }
    return result;
  }

  var a2i = [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 62, -1, -1, -1, 63, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, -1, -1, -1, -1, -1, -1, -1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, -1, -1, -1, -1, -1, -1, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51];

  function get_a2i(c) {
    var result = (0 <= c) && (c < a2i.length) ? a2i[c] : -1;
    if (result < 0) throw "Illegal character " + c;
    return result;
  }

  function base64_decode(s) {
    var length = s.length;
    var groupCount = Math.floor(length / 4);
    if (4 * groupCount != length) throw "String length must be a multiple of four.";

    var missing = 0;
    if (length != 0) {
      if (s.charAt(length - 1) == '=') {
        missing++;
        groupCount--;
      }
      if (s.charAt(length - 2) == '=') missing++;
    }

    var len = (3 * groupCount - missing);
    if (len < 0) {
      len = 0;
    }
    var result = new Array(len);
    // var result = new Array( 3 * groupCount - missing );
    // var result = new Array( 3 * ( groupCount +1 ) - missing );
    var idx_in = 0;
    var idx_out = 0;
    for (var i = 0; i < groupCount; i++) {
      var c0 = get_a2i(s.charCodeAt(idx_in++));
      var c1 = get_a2i(s.charCodeAt(idx_in++));
      var c2 = get_a2i(s.charCodeAt(idx_in++));
      var c3 = get_a2i(s.charCodeAt(idx_in++));
      result[idx_out++] = 0xFF & ((c0 << 2) | (c1 >> 4));
      result[idx_out++] = 0xFF & ((c1 << 4) | (c2 >> 2));
      result[idx_out++] = 0xFF & ((c2 << 6) | c3);
    }

    if (missing == 0) {} else if (missing == 1) {
      var c0 = get_a2i(s.charCodeAt(idx_in++));
      var c1 = get_a2i(s.charCodeAt(idx_in++));
      var c2 = get_a2i(s.charCodeAt(idx_in++));
      result[idx_out++] = 0xFF & ((c0 << 2) | (c1 >> 4));
      result[idx_out++] = 0xFF & ((c1 << 4) | (c2 >> 2));

    } else if (missing == 2) {
      var c0 = get_a2i(s.charCodeAt(idx_in++));
      var c1 = get_a2i(s.charCodeAt(idx_in++));
      result[idx_out++] = 0xFF & ((c0 << 2) | (c1 >> 4));
    } else {
      throw "never happen";
    }
    return result;
  }

  function base64x_encode(s) {
    return base64x_pre_encode(base64_encode(s));
  }

  function base64x_decode(s) {
    return base64_decode(base64x_pre_decode(s));
  }

  var base64x_pre_encode_map = {};
  base64x_pre_encode_map["x"] = "xx";
  base64x_pre_encode_map["+"] = "xa";
  base64x_pre_encode_map["/"] = "xb";
  base64x_pre_encode_map["="] = "";


  function base64x_pre_encode(s) {
    var ss = "";
    for (var i = 0; i < s.length; i++) {
      var c = s.charAt(i);
      var cc = base64x_pre_encode_map[c];
      if (cc != null) {
        ss = ss + cc;
      } else {
        ss = ss + c;
      }
    }
    return ss;
  }

  var base64x_pre_decode_map = {};
  base64x_pre_decode_map['x'] = 'x';
  base64x_pre_decode_map['a'] = '+';
  base64x_pre_decode_map['b'] = '/';

  function base64x_pre_decode(s) {
    var ss = "";
    for (var i = 0; i < s.length; i++) {
      var c = s.charAt(i);
      if (c == 'x') {
        c = s.charAt(++i);
        var cc = base64x_pre_decode_map[c];
        if (cc != null) {
          ss = ss + cc;
          // ss = ss + '/';
        } else {
          // throw "invalid character was found. ("+cc+")"; // ignore.
        }
      } else {
        ss = ss + c;
      }
    }
    while (ss.length % 4 != 0) {
      ss += "=";
    }
    return ss;
  }

  function equals(a, b) {
    if (a.length != b.length) return false;
    var size = a.length;
    for (var i = 0; i < size; i++) {
      // trace( a[i] + "/" + b[i] );
      if (a[i] != b[i]) return false;
    }
    return true;
  }


  function hex(i) {
    if (i == null) return "??";
    //if ( i < 0 ) i+=256;
    i &= 0xff;
    var result = i.toString(16);
    return (result.length < 2) ? "0" + result : result;
  }

  function base16(data, columns, delim) {
    return base16_encode(data, columns, delim);
  }

  function base16_encode(data, columns, delim) {
    if (delim == null) {
      delim = "";
    }
    if (columns == null) {
      columns = 256;
    }
    var result = "";
    for (var i = 0; i < data.length; i++) {
      //if ( ( i % columns == 0 ) && ( 0<i ) )
      //result += "\n";
      result += hex(data[i]) + delim;
    }
    return result.toUpperCase();
  }

  var amap = {};
  amap['0'] = 0;
  amap['1'] = 1;
  amap['2'] = 2;
  amap['3'] = 3;
  amap['4'] = 4;
  amap['5'] = 5;
  amap['6'] = 6;
  amap['7'] = 7;
  amap['8'] = 8;
  amap['9'] = 9;
  amap['A'] = 10;
  amap['B'] = 11;
  amap['C'] = 12;
  amap['D'] = 13;
  amap['E'] = 14;
  amap['F'] = 15;
  amap['a'] = 10;
  amap['b'] = 11;
  amap['c'] = 12;
  amap['d'] = 13;
  amap['e'] = 14;
  amap['f'] = 15;

  function get_amap(c) {
    var cc = amap[c];
    //trace(c + "=>" + cc );
    if (cc == null) throw "found an invalid character.";
    return cc;
  }

  function base16_decode(data) {
    var ca = [];
    for (var i = 0, j = 0; i < data.length; i++) {
      var c = data.charAt(i);
      if (c == "\s") {
        continue;
      } else {
        ca[j++] = c;
      }
    }
    if (ca.length % 2 != 0) {
      throw "data must be a multiple of two.";
    }

    var result = new Array(ca.length >> 1);
    for (var i = 0; i < ca.length; i += 2) {
      var v = 0xff & ((get_amap(ca[i]) << 4) | (get_amap(ca[i + 1])));
      result[i >> 1] = v;
      // trace(  get_amap( ca[i+1] ) )
      // result[i>>1] =  get_amap( ca[i+1] );
    }
    return result;
  }
  // trace( base16_encode([0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,128,255 ] ) );
  // trace( base16_encode( base16_decode("000102030405060708090A0B0C0D0E0F1080FF") ) );
  // trace( base16_encode( base16_decode( "000102030405060708090A0B0C0D0E0F102030405060708090A0B0C0D0E0F0FF" ) ) );
  //                                       000102030405060708090A0B0C0D0E0F102030405060708090A0B0C0D0E0F0FF
  /////////////////////////////////////////////////////////////////////////////////////////////
  var B10000000 = 0x80;
  var B11000000 = 0xC0;
  var B11100000 = 0xE0;
  var B11110000 = 0xF0;
  var B11111000 = 0xF8;
  var B11111100 = 0xFC;
  var B11111110 = 0xFE;
  var B01111111 = 0x7F;
  var B00111111 = 0x3F;
  var B00011111 = 0x1F;
  var B00001111 = 0x0F;
  var B00000111 = 0x07;
  var B00000011 = 0x03;
  var B00000001 = 0x01;

  function str2utf8(str) {
    var result = [];
    var length = str.length;
    var idx = 0;
    for (var i = 0; i < length; i++) {
      var c = str.charCodeAt(i);
      if (c <= 0x7f) {
        result[idx++] = c;
      } else if (c <= 0x7ff) {
        result[idx++] = B11000000 | (B00011111 & (c >>> 6));
        result[idx++] = B10000000 | (B00111111 & (c >>> 0));
      } else if (c <= 0xffff) {
        result[idx++] = B11100000 | (B00001111 & (c >>> 12));
        result[idx++] = B10000000 | (B00111111 & (c >>> 6));
        result[idx++] = B10000000 | (B00111111 & (c >>> 0));
      } else if (c <= 0x10ffff) {
        result[idx++] = B11110000 | (B00000111 & (c >>> 18));
        result[idx++] = B10000000 | (B00111111 & (c >>> 12));
        result[idx++] = B10000000 | (B00111111 & (c >>> 6));
        result[idx++] = B10000000 | (B00111111 & (c >>> 0));
      } else {
        throw "error";
      }
    }
    return result;
  }

  function utf82str(data) {
    var result = "";
    var length = data.length;

    for (var i = 0; i < length;) {
      var c = data[i++];
      if (c < 0x80) {
        result += String.fromCharCode(c);
      } else if ((c < B11100000)) {
        result += String.fromCharCode(((B00011111 & c) << 6) | ((B00111111 & data[i++]) << 0));
      } else if ((c < B11110000)) {
        result += String.fromCharCode(((B00001111 & c) << 12) | ((B00111111 & data[i++]) << 6) | ((B00111111 & data[i++]) << 0));
      } else if ((c < B11111000)) {
        result += String.fromCharCode(((B00000111 & c) << 18) | ((B00111111 & data[i++]) << 12) | ((B00111111 & data[i++]) << 6) | ((B00111111 & data[i++]) << 0));
      } else if ((c < B11111100)) {
        result += String.fromCharCode(((B00000011 & c) << 24) | ((B00111111 & data[i++]) << 18) | ((B00111111 & data[i++]) << 12) | ((B00111111 & data[i++]) << 6) | ((B00111111 & data[i++]) << 0));
      } else if ((c < B11111110)) {
        result += String.fromCharCode(((B00000001 & c) << 30) | ((B00111111 & data[i++]) << 24) | ((B00111111 & data[i++]) << 18) | ((B00111111 & data[i++]) << 12) | ((B00111111 & data[i++]) << 6) | ((B00111111 & data[i++]) << 0));
      }
    }
    return result;
  }

  /////////////////////////////////////////////////////////////////////////////////////////////
  // convert unicode character array to string

  function char2str(ca) {
    var result = "";
    for (var i = 0; i < ca.length; i++) {
      result += String.fromCharCode(ca[i]);
    }
    return result;
  }

  // convert string to unicode character array

  function str2char(str) {
    var result = new Array(str.length);
    for (var i = 0; i < str.length; i++) {
      result[i] = str.charCodeAt(i);
    }
    return result;
  }

  /////////////////////////////////////////////////////////////////////////////////////////////
  // byte expressions (big endian)

  function i2ba_be(i) {
    return [
      0xff & (i >> 24), 0xff & (i >> 16), 0xff & (i >> 8), 0xff & (i >> 0)];
  }

  function ba2i_be(bs) {
    return ((bs[0] << 24) | (bs[1] << 16) | (bs[2] << 8) | (bs[3] << 0));
  }

  function s2ba_be(i) {
    return [
      0xff & (i >> 8), 0xff & (i >> 0)];
  }

  function ba2s_be(bs) {
    return (
        0 | (bs[0] << 8) | (bs[1] << 0));
  }

  // byte expressions (little endian)

  function i2ba_le(i) {
    return [
      0xff & (i >> 0), 0xff & (i >> 8), 0xff & (i >> 16), 0xff & (i >> 24)];
  }

  function ba2i_le(bs) {
    return (
        0 | (bs[3] << 0) | (bs[2] << 8) | (bs[1] << 16) | (bs[0] << 24));
  }

  function s2ba_le(i) {
    return [
      0xff & (i >> 0), 0xff & (i >> 8)];
  }

  function ba2s_le(bs) {
    return (
        0 | (bs[1] << 0) | (bs[0] << 8));
  }

  function ia2ba_be(ia) {
    var length = ia.length << 2;
    var ba = new Array(length);
    for (var ii = 0, bi = 0; ii < ia.length && bi < ba.length;) {
      ba[bi++] = 0xff & (ia[ii] >> 24);
      ba[bi++] = 0xff & (ia[ii] >> 16);
      ba[bi++] = 0xff & (ia[ii] >> 8);
      ba[bi++] = 0xff & (ia[ii] >> 0);
      ii++;
    }
    return ba;
  }

  function ba2ia_be(ba) {
    var length = (ba.length + 3) >> 2;
    var ia = new Array(length);;
    for (var ii = 0, bi = 0; ii < ia.length && bi < ba.length;) {
      ia[ii++] = (bi < ba.length ? (ba[bi++] << 24) : 0) | (bi < ba.length ? (ba[bi++] << 16) : 0) | (bi < ba.length ? (ba[bi++] << 8) : 0) | (bi < ba.length ? (ba[bi++] /*<< 0*/ ) : 0);
    }
    return ia;
  }

  function ia2ba_le(ia) {
    var length = ia.length << 2;
    var ba = new Array(length);
    for (var ii = 0, bi = 0; ii < ia.length && bi < ba.length;) {
      ba[bi++] = 0xff & (ia[ii] >> 0);
      ba[bi++] = 0xff & (ia[ii] >> 8);
      ba[bi++] = 0xff & (ia[ii] >> 16);
      ba[bi++] = 0xff & (ia[ii] >> 24);
      ii++;
    }
    return ba;
  }

  function ba2ia_le(ba) {
    var length = (ba.length + 3) >> 2;
    var ia = new Array(length);;
    for (var ii = 0, bi = 0; ii < ia.length && bi < ba.length;) {
      ia[ii++] = (bi < ba.length ? (ba[bi++] /*<< 0*/ ) : 0) | (bi < ba.length ? (ba[bi++] << 8) : 0) | (bi < ba.length ? (ba[bi++] << 16) : 0) | (bi < ba.length ? (ba[bi++] << 24) : 0);
    }
    return ia;
  }

  /////////////////////////////////////////////////////////////////////////////////////////////

  function trim(s) {
    var result = "";
    for (var idx = 0; idx < s.length; idx++) {
      var c = s.charAt(idx);
      if (c == "\s" || c == "\t" || c == "\r" || c == "\n") {} else {
        result += c;
      }
    }
    return result;
  }

  /////////////////////////////////////////////////////////////////////////////////////////////

  function mktst(encode, decode) {
    return function (trial, from, to) {
      var flg = true;
      for (var i = 0; i < trial; i++) {
        for (var j = from; j < to; j++) {
          var arr = new Array(j);
          for (var k = 0; k < j; k++)
            arr[k] = Math.floor(Math.random() * 256);

          var s = encode(arr);
          var b = decode(s);

          // trace( "in:"+arr.length);
          // trace( "base64:"+s.length);
          // trace( "out:"+b.length);
          // trace( "in:"+arr);
          // trace( "base64:"+s );
          // trace( "out:"+b );
          trace("in :" + arr.length + ":" + base16_encode(arr));
          trace("b64:" + s.length + ":" + s);
          trace("out:" + b.length + ":" + base16_encode(arr));
          if (equals(arr, b)) {
            trace("OK! ( " + i + "," + j + ")");
          } else {
            trace("ERR ( " + i + "," + j + ")");
            flg = false;
          }
          trace("-----------");
        }
      }
      if (flg) {
        trace("ALL OK! ");
      } else {
        trace("FOUND ERROR!");
      }
    };
  }

  // export
  // base64
  packageRoot.base64_encode = base64_encode;
  packageRoot.base64_decode = base64_decode;
  packageRoot.base64_test = mktst(base64_encode, base64_decode);

  // base64ex
  packageRoot.base64x_encode = base64x_encode;
  packageRoot.base64x_decode = base64x_decode;
  packageRoot.base64x_test = mktst(base64x_encode, base64x_decode);

  packageRoot.base64x_pre_encode = base64x_pre_encode;
  packageRoot.base64x_pre_decode = base64x_pre_decode;

  // base16
  packageRoot.base16_encode = base16_encode;
  packageRoot.base16_decode = base16_decode;
  packageRoot.base16 = base16;
  packageRoot.hex = base16;

  // utf8
  packageRoot.utf82str = utf82str;
  packageRoot.str2utf8 = str2utf8;
  packageRoot.str2char = str2char;
  packageRoot.char2str = char2str;

  // byte expressions
  packageRoot.i2ba = i2ba_be;
  packageRoot.ba2i = ba2i_be;
  packageRoot.i2ba_be = i2ba_be;
  packageRoot.ba2i_be = ba2i_be;
  packageRoot.i2ba_le = i2ba_le;
  packageRoot.ba2i_le = ba2i_le;

  packageRoot.s2ba = s2ba_be;
  packageRoot.ba2s = ba2s_be;
  packageRoot.s2ba_be = s2ba_be;
  packageRoot.ba2s_be = ba2s_be;
  packageRoot.s2ba_le = s2ba_le;
  packageRoot.ba2s_le = ba2s_le;

  packageRoot.ba2ia = ba2ia_be;
  packageRoot.ia2ba = ia2ba_be;
  packageRoot.ia2ba_be = ia2ba_be;
  packageRoot.ba2ia_be = ba2ia_be;
  packageRoot.ia2ba_le = ia2ba_le;
  packageRoot.ba2ia_le = ba2ia_le;


  // arrays
  packageRoot.cmparr = equals;
}

initBinary(__Crypto);


/*
 * Cipher.js
 * A block-cipher algorithm implementation on JavaScript
 * See Cipher.readme.txt for further information.
 *
 * Copyright(c) 2009 Atsushi Oka [ http://oka.nu/ ]
 * This script file is distributed under the LGPL
 *
 * ACKNOWLEDGMENT
 *
 *     The main subroutines are written by Michiel van Everdingen.
 *
 *     Michiel van Everdingen
 *     http://home.versatel.nl/MAvanEverdingen/index.html
 *
 *     All rights for these routines are reserved to Michiel van Everdingen.
 *
 */

function initBlockCipher(packageRoot) {
  __Crypto.__unit("Cipher.js");
  __Crypto.__uses("packages.js");

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // Math
  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  var MAXINT = 0xFFFFFFFF;

  function rotb(b, n) {
    return (b << n | b >>> (8 - n)) & 0xFF;
  }

  function rotw(w, n) {
    return (w << n | w >>> (32 - n)) & MAXINT;
  }

  function getW(a, i) {
    return a[i] | a[i + 1] << 8 | a[i + 2] << 16 | a[i + 3] << 24;
  }

  function setW(a, i, w) {
    a.splice(i, 4, w & 0xFF, (w >>> 8) & 0xFF, (w >>> 16) & 0xFF, (w >>> 24) & 0xFF);
  }

  function setWInv(a, i, w) {
    a.splice(i, 4, (w >>> 24) & 0xFF, (w >>> 16) & 0xFF, (w >>> 8) & 0xFF, w & 0xFF);
  }

  function getB(x, n) {
    return (x >>> (n * 8)) & 0xFF;
  }

  function getNrBits(i) {
    var n = 0;
    while (i > 0) {
      n++;
      i >>>= 1;
    }
    return n;
  }

  function getMask(n) {
    return (1 << n) - 1;
  }

  // added 2008/11/13 XXX MUST USE ONE-WAY HASH FUNCTION FOR SECURITY REASON

  function randByte() {
    return Math.floor(Math.random() * 256);
  }

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // Ciphers
  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  var ALGORITHMS = {};

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // AES
  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  function createRijndael() {
    //
    var keyBytes = null;
    var dataBytes = null;
    var dataOffset = -1;
    // var dataLength    = -1;
    var algorithmName = null;
    //var idx2          = -1;
    //
    algorithmName = "rijndael"

    var aesNk;
    var aesNr;

    var aesPows;
    var aesLogs;
    var aesSBox;
    var aesSBoxInv;
    var aesRco;
    var aesFtable;
    var aesRtable;
    var aesFi;
    var aesRi;
    var aesFkey;
    var aesRkey;

    function aesMult(x, y) {
      return (x && y) ? aesPows[(aesLogs[x] + aesLogs[y]) % 255] : 0;
    }

    function aesPackBlock() {
      return [getW(dataBytes, dataOffset), getW(dataBytes, dataOffset + 4), getW(dataBytes, dataOffset + 8), getW(dataBytes, dataOffset + 12)];
    }

    function aesUnpackBlock(packed) {
      for (var j = 0; j < 4; j++, dataOffset += 4) setW(dataBytes, dataOffset, packed[j]);
    }

    function aesXTime(p) {
      p <<= 1;
      return p & 0x100 ? p ^ 0x11B : p;
    }

    function aesSubByte(w) {
      return aesSBox[getB(w, 0)] | aesSBox[getB(w, 1)] << 8 | aesSBox[getB(w, 2)] << 16 | aesSBox[getB(w, 3)] << 24;
    }

    function aesProduct(w1, w2) {
      return aesMult(getB(w1, 0), getB(w2, 0)) ^ aesMult(getB(w1, 1), getB(w2, 1)) ^ aesMult(getB(w1, 2), getB(w2, 2)) ^ aesMult(getB(w1, 3), getB(w2, 3));
    }

    function aesInvMixCol(x) {
      return aesProduct(0x090d0b0e, x) | aesProduct(0x0d0b0e09, x) << 8 | aesProduct(0x0b0e090d, x) << 16 | aesProduct(0x0e090d0b, x) << 24;
    }

    function aesByteSub(x) {
      var y = aesPows[255 - aesLogs[x]];
      x = y;
      x = rotb(x, 1);
      y ^= x;
      x = rotb(x, 1);
      y ^= x;
      x = rotb(x, 1);
      y ^= x;
      x = rotb(x, 1);
      return x ^ y ^ 0x63;
    }

    function aesGenTables() {
      var i, y;
      aesPows = [1, 3];
      aesLogs = [0, 0, null, 1];
      aesSBox = new Array(256);
      aesSBoxInv = new Array(256);
      aesFtable = new Array(256);
      aesRtable = new Array(256);
      aesRco = new Array(30);

      for (i = 2; i < 256; i++) {
        aesPows[i] = aesPows[i - 1] ^ aesXTime(aesPows[i - 1]);
        aesLogs[aesPows[i]] = i;
      }

      aesSBox[0] = 0x63;
      aesSBoxInv[0x63] = 0;
      for (i = 1; i < 256; i++) {
        y = aesByteSub(i);
        aesSBox[i] = y;
        aesSBoxInv[y] = i;
      }

      for (i = 0, y = 1; i < 30; i++) {
        aesRco[i] = y;
        y = aesXTime(y);
      }

      for (i = 0; i < 256; i++) {
        y = aesSBox[i];
        aesFtable[i] = aesXTime(y) | y << 8 | y << 16 | (y ^ aesXTime(y)) << 24;
        y = aesSBoxInv[i];
        aesRtable[i] = aesMult(14, y) | aesMult(9, y) << 8 | aesMult(13, y) << 16 | aesMult(11, y) << 24;
      }
    }

    function aesInit(key) {
      keyBytes = key;
      keyBytes = keyBytes.slice(0, 32);
      var i, k, m;
      var j = 0;
      var l = keyBytes.length;

      while (l != 16 && l != 24 && l != 32) keyBytes[l++] = keyBytes[j++];
      aesGenTables();

      aesNk = keyBytes.length >>> 2;
      aesNr = 6 + aesNk;

      var N = 4 * (aesNr + 1);

      aesFi = new Array(12);
      aesRi = new Array(12);
      aesFkey = new Array(N);
      aesRkey = new Array(N);

      for (m = j = 0; j < 4; j++, m += 3) {
        aesFi[m] = (j + 1) % 4;
        aesFi[m + 1] = (j + 2) % 4;
        aesFi[m + 2] = (j + 3) % 4;
        aesRi[m] = (4 + j - 1) % 4;
        aesRi[m + 1] = (4 + j - 2) % 4;
        aesRi[m + 2] = (4 + j - 3) % 4;
      }

      for (i = j = 0; i < aesNk; i++, j += 4) aesFkey[i] = getW(keyBytes, j);

      for (k = 0, j = aesNk; j < N; j += aesNk, k++) {
        aesFkey[j] = aesFkey[j - aesNk] ^ aesSubByte(rotw(aesFkey[j - 1], 24)) ^ aesRco[k];
        if (aesNk <= 6) for (i = 1; i < aesNk && (i + j) < N; i++) aesFkey[i + j] = aesFkey[i + j - aesNk] ^ aesFkey[i + j - 1];
        else {
          for (i = 1; i < 4 && (i + j) < N; i++) aesFkey[i + j] = aesFkey[i + j - aesNk] ^ aesFkey[i + j - 1];
          if ((j + 4) < N) aesFkey[j + 4] = aesFkey[j + 4 - aesNk] ^ aesSubByte(aesFkey[j + 3]);
          for (i = 5; i < aesNk && (i + j) < N; i++) aesFkey[i + j] = aesFkey[i + j - aesNk] ^ aesFkey[i + j - 1];
        }
      }

      for (j = 0; j < 4; j++) aesRkey[j + N - 4] = aesFkey[j];
      for (i = 4; i < N - 4; i += 4) {
        k = N - 4 - i;
        for (j = 0; j < 4; j++) aesRkey[k + j] = aesInvMixCol(aesFkey[i + j]);
      }
      for (j = N - 4; j < N; j++) aesRkey[j - N + 4] = aesFkey[j];
    }

    function aesClose() {
      aesPows = aesLogs = aesSBox = aesSBoxInv = aesRco = null;
      aesFtable = aesRtable = aesFi = aesRi = aesFkey = aesRkey = null;
    }

    function aesRounds(block, key, table, inc, box) {
      var tmp = new Array(4);
      var i, j, m, r;

      for (r = 0; r < 4; r++) block[r] ^= key[r];
      for (i = 1; i < aesNr; i++) {
        for (j = m = 0; j < 4; j++, m += 3) {
          tmp[j] = key[r++] ^ table[block[j] & 0xFF] ^ rotw(table[(block[inc[m]] >>> 8) & 0xFF], 8) ^ rotw(table[(block[inc[m + 1]] >>> 16) & 0xFF], 16) ^ rotw(table[(block[inc[m + 2]] >>> 24) & 0xFF], 24);
        }
        var t = block;
        block = tmp;
        tmp = t;
      }

      for (j = m = 0; j < 4; j++, m += 3)
        tmp[j] = key[r++] ^ box[block[j] & 0xFF] ^ rotw(box[(block[inc[m]] >>> 8) & 0xFF], 8) ^ rotw(box[(block[inc[m + 1]] >>> 16) & 0xFF], 16) ^ rotw(box[(block[inc[m + 2]] >>> 24) & 0xFF], 24);
      return tmp;
    }

    function aesEncrypt(data, offset) {
      dataBytes = data;
      dataOffset = offset;
      aesUnpackBlock(aesRounds(aesPackBlock(), aesFkey, aesFtable, aesFi, aesSBox));
    }

    function aesDecrypt(data, offset) {
      dataBytes = data;
      dataOffset = offset;
      aesUnpackBlock(aesRounds(aesPackBlock(), aesRkey, aesRtable, aesRi, aesSBoxInv));
    }

    return {
      name: "rijndael",
      blocksize: 128 / 8,
      open: aesInit,
      close: aesClose,
      encrypt: aesEncrypt,
      decrypt: aesDecrypt
    };
  }
  ALGORITHMS.RIJNDAEL = {
    create: createRijndael
  };


  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // Serpent
  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  function createSerpent() {
    //
    var keyBytes = null;
    var dataBytes = null;
    var dataOffset = -1;
    //var dataLength    = -1;
    var algorithmName = null;
    // var idx2          = -1;
    //
    algorithmName = "serpent";

    var srpKey = [];

    function srpK(r, a, b, c, d, i) {
      r[a] ^= srpKey[4 * i];
      r[b] ^= srpKey[4 * i + 1];
      r[c] ^= srpKey[4 * i + 2];
      r[d] ^= srpKey[4 * i + 3];
    }

    function srpLK(r, a, b, c, d, e, i) {
      r[a] = rotw(r[a], 13);
      r[c] = rotw(r[c], 3);
      r[b] ^= r[a];
      r[e] = (r[a] << 3) & MAXINT;
      r[d] ^= r[c];
      r[b] ^= r[c];
      r[b] = rotw(r[b], 1);
      r[d] ^= r[e];
      r[d] = rotw(r[d], 7);
      r[e] = r[b];
      r[a] ^= r[b];
      r[e] = (r[e] << 7) & MAXINT;
      r[c] ^= r[d];
      r[a] ^= r[d];
      r[c] ^= r[e];
      r[d] ^= srpKey[4 * i + 3];
      r[b] ^= srpKey[4 * i + 1];
      r[a] = rotw(r[a], 5);
      r[c] = rotw(r[c], 22);
      r[a] ^= srpKey[4 * i + 0];
      r[c] ^= srpKey[4 * i + 2];
    }

    function srpKL(r, a, b, c, d, e, i) {
      r[a] ^= srpKey[4 * i + 0];
      r[b] ^= srpKey[4 * i + 1];
      r[c] ^= srpKey[4 * i + 2];
      r[d] ^= srpKey[4 * i + 3];
      r[a] = rotw(r[a], 27);
      r[c] = rotw(r[c], 10);
      r[e] = r[b];
      r[c] ^= r[d];
      r[a] ^= r[d];
      r[e] = (r[e] << 7) & MAXINT;
      r[a] ^= r[b];
      r[b] = rotw(r[b], 31);
      r[c] ^= r[e];
      r[d] = rotw(r[d], 25);
      r[e] = (r[a] << 3) & MAXINT;
      r[b] ^= r[a];
      r[d] ^= r[e];
      r[a] = rotw(r[a], 19);
      r[b] ^= r[c];
      r[d] ^= r[c];
      r[c] = rotw(r[c], 29);
    }

    var srpS = [

      function (r, x0, x1, x2, x3, x4) {
        r[x4] = r[x3];
        r[x3] |= r[x0];
        r[x0] ^= r[x4];
        r[x4] ^= r[x2];
        r[x4] = ~r[x4];
        r[x3] ^= r[x1];
        r[x1] &= r[x0];
        r[x1] ^= r[x4];
        r[x2] ^= r[x0];
        r[x0] ^= r[x3];
        r[x4] |= r[x0];
        r[x0] ^= r[x2];
        r[x2] &= r[x1];
        r[x3] ^= r[x2];
        r[x1] = ~r[x1];
        r[x2] ^= r[x4];
        r[x1] ^= r[x2];
      }, function (r, x0, x1, x2, x3, x4) {
        r[x4] = r[x1];
        r[x1] ^= r[x0];
        r[x0] ^= r[x3];
        r[x3] = ~r[x3];
        r[x4] &= r[x1];
        r[x0] |= r[x1];
        r[x3] ^= r[x2];
        r[x0] ^= r[x3];
        r[x1] ^= r[x3];
        r[x3] ^= r[x4];
        r[x1] |= r[x4];
        r[x4] ^= r[x2];
        r[x2] &= r[x0];
        r[x2] ^= r[x1];
        r[x1] |= r[x0];
        r[x0] = ~r[x0];
        r[x0] ^= r[x2];
        r[x4] ^= r[x1];
      }, function (r, x0, x1, x2, x3, x4) {
        r[x3] = ~r[x3];
        r[x1] ^= r[x0];
        r[x4] = r[x0];
        r[x0] &= r[x2];
        r[x0] ^= r[x3];
        r[x3] |= r[x4];
        r[x2] ^= r[x1];
        r[x3] ^= r[x1];
        r[x1] &= r[x0];
        r[x0] ^= r[x2];
        r[x2] &= r[x3];
        r[x3] |= r[x1];
        r[x0] = ~r[x0];
        r[x3] ^= r[x0];
        r[x4] ^= r[x0];
        r[x0] ^= r[x2];
        r[x1] |= r[x2];
      }, function (r, x0, x1, x2, x3, x4) {
        r[x4] = r[x1];
        r[x1] ^= r[x3];
        r[x3] |= r[x0];
        r[x4] &= r[x0];
        r[x0] ^= r[x2];
        r[x2] ^= r[x1];
        r[x1] &= r[x3];
        r[x2] ^= r[x3];
        r[x0] |= r[x4];
        r[x4] ^= r[x3];
        r[x1] ^= r[x0];
        r[x0] &= r[x3];
        r[x3] &= r[x4];
        r[x3] ^= r[x2];
        r[x4] |= r[x1];
        r[x2] &= r[x1];
        r[x4] ^= r[x3];
        r[x0] ^= r[x3];
        r[x3] ^= r[x2];
      }, function (r, x0, x1, x2, x3, x4) {
        r[x4] = r[x3];
        r[x3] &= r[x0];
        r[x0] ^= r[x4];
        r[x3] ^= r[x2];
        r[x2] |= r[x4];
        r[x0] ^= r[x1];
        r[x4] ^= r[x3];
        r[x2] |= r[x0];
        r[x2] ^= r[x1];
        r[x1] &= r[x0];
        r[x1] ^= r[x4];
        r[x4] &= r[x2];
        r[x2] ^= r[x3];
        r[x4] ^= r[x0];
        r[x3] |= r[x1];
        r[x1] = ~r[x1];
        r[x3] ^= r[x0];
      }, function (r, x0, x1, x2, x3, x4) {
        r[x4] = r[x1];
        r[x1] |= r[x0];
        r[x2] ^= r[x1];
        r[x3] = ~r[x3];
        r[x4] ^= r[x0];
        r[x0] ^= r[x2];
        r[x1] &= r[x4];
        r[x4] |= r[x3];
        r[x4] ^= r[x0];
        r[x0] &= r[x3];
        r[x1] ^= r[x3];
        r[x3] ^= r[x2];
        r[x0] ^= r[x1];
        r[x2] &= r[x4];
        r[x1] ^= r[x2];
        r[x2] &= r[x0];
        r[x3] ^= r[x2];
      }, function (r, x0, x1, x2, x3, x4) {
        r[x4] = r[x1];
        r[x3] ^= r[x0];
        r[x1] ^= r[x2];
        r[x2] ^= r[x0];
        r[x0] &= r[x3];
        r[x1] |= r[x3];
        r[x4] = ~r[x4];
        r[x0] ^= r[x1];
        r[x1] ^= r[x2];
        r[x3] ^= r[x4];
        r[x4] ^= r[x0];
        r[x2] &= r[x0];
        r[x4] ^= r[x1];
        r[x2] ^= r[x3];
        r[x3] &= r[x1];
        r[x3] ^= r[x0];
        r[x1] ^= r[x2];
      }, function (r, x0, x1, x2, x3, x4) {
        r[x1] = ~r[x1];
        r[x4] = r[x1];
        r[x0] = ~r[x0];
        r[x1] &= r[x2];
        r[x1] ^= r[x3];
        r[x3] |= r[x4];
        r[x4] ^= r[x2];
        r[x2] ^= r[x3];
        r[x3] ^= r[x0];
        r[x0] |= r[x1];
        r[x2] &= r[x0];
        r[x0] ^= r[x4];
        r[x4] ^= r[x3];
        r[x3] &= r[x0];
        r[x4] ^= r[x1];
        r[x2] ^= r[x4];
        r[x3] ^= r[x1];
        r[x4] |= r[x0];
        r[x4] ^= r[x1];
      }];

    var srpSI = [

      function (r, x0, x1, x2, x3, x4) {
        r[x4] = r[x3];
        r[x1] ^= r[x0];
        r[x3] |= r[x1];
        r[x4] ^= r[x1];
        r[x0] = ~r[x0];
        r[x2] ^= r[x3];
        r[x3] ^= r[x0];
        r[x0] &= r[x1];
        r[x0] ^= r[x2];
        r[x2] &= r[x3];
        r[x3] ^= r[x4];
        r[x2] ^= r[x3];
        r[x1] ^= r[x3];
        r[x3] &= r[x0];
        r[x1] ^= r[x0];
        r[x0] ^= r[x2];
        r[x4] ^= r[x3];
      }, function (r, x0, x1, x2, x3, x4) {
        r[x1] ^= r[x3];
        r[x4] = r[x0];
        r[x0] ^= r[x2];
        r[x2] = ~r[x2];
        r[x4] |= r[x1];
        r[x4] ^= r[x3];
        r[x3] &= r[x1];
        r[x1] ^= r[x2];
        r[x2] &= r[x4];
        r[x4] ^= r[x1];
        r[x1] |= r[x3];
        r[x3] ^= r[x0];
        r[x2] ^= r[x0];
        r[x0] |= r[x4];
        r[x2] ^= r[x4];
        r[x1] ^= r[x0];
        r[x4] ^= r[x1];
      }, function (r, x0, x1, x2, x3, x4) {
        r[x2] ^= r[x1];
        r[x4] = r[x3];
        r[x3] = ~r[x3];
        r[x3] |= r[x2];
        r[x2] ^= r[x4];
        r[x4] ^= r[x0];
        r[x3] ^= r[x1];
        r[x1] |= r[x2];
        r[x2] ^= r[x0];
        r[x1] ^= r[x4];
        r[x4] |= r[x3];
        r[x2] ^= r[x3];
        r[x4] ^= r[x2];
        r[x2] &= r[x1];
        r[x2] ^= r[x3];
        r[x3] ^= r[x4];
        r[x4] ^= r[x0];
      }, function (r, x0, x1, x2, x3, x4) {
        r[x2] ^= r[x1];
        r[x4] = r[x1];
        r[x1] &= r[x2];
        r[x1] ^= r[x0];
        r[x0] |= r[x4];
        r[x4] ^= r[x3];
        r[x0] ^= r[x3];
        r[x3] |= r[x1];
        r[x1] ^= r[x2];
        r[x1] ^= r[x3];
        r[x0] ^= r[x2];
        r[x2] ^= r[x3];
        r[x3] &= r[x1];
        r[x1] ^= r[x0];
        r[x0] &= r[x2];
        r[x4] ^= r[x3];
        r[x3] ^= r[x0];
        r[x0] ^= r[x1];
      }, function (r, x0, x1, x2, x3, x4) {
        r[x2] ^= r[x3];
        r[x4] = r[x0];
        r[x0] &= r[x1];
        r[x0] ^= r[x2];
        r[x2] |= r[x3];
        r[x4] = ~r[x4];
        r[x1] ^= r[x0];
        r[x0] ^= r[x2];
        r[x2] &= r[x4];
        r[x2] ^= r[x0];
        r[x0] |= r[x4];
        r[x0] ^= r[x3];
        r[x3] &= r[x2];
        r[x4] ^= r[x3];
        r[x3] ^= r[x1];
        r[x1] &= r[x0];
        r[x4] ^= r[x1];
        r[x0] ^= r[x3];
      }, function (r, x0, x1, x2, x3, x4) {
        r[x4] = r[x1];
        r[x1] |= r[x2];
        r[x2] ^= r[x4];
        r[x1] ^= r[x3];
        r[x3] &= r[x4];
        r[x2] ^= r[x3];
        r[x3] |= r[x0];
        r[x0] = ~r[x0];
        r[x3] ^= r[x2];
        r[x2] |= r[x0];
        r[x4] ^= r[x1];
        r[x2] ^= r[x4];
        r[x4] &= r[x0];
        r[x0] ^= r[x1];
        r[x1] ^= r[x3];
        r[x0] &= r[x2];
        r[x2] ^= r[x3];
        r[x0] ^= r[x2];
        r[x2] ^= r[x4];
        r[x4] ^= r[x3];
      }, function (r, x0, x1, x2, x3, x4) {
        r[x0] ^= r[x2];
        r[x4] = r[x0];
        r[x0] &= r[x3];
        r[x2] ^= r[x3];
        r[x0] ^= r[x2];
        r[x3] ^= r[x1];
        r[x2] |= r[x4];
        r[x2] ^= r[x3];
        r[x3] &= r[x0];
        r[x0] = ~r[x0];
        r[x3] ^= r[x1];
        r[x1] &= r[x2];
        r[x4] ^= r[x0];
        r[x3] ^= r[x4];
        r[x4] ^= r[x2];
        r[x0] ^= r[x1];
        r[x2] ^= r[x0];
      }, function (r, x0, x1, x2, x3, x4) {
        r[x4] = r[x3];
        r[x3] &= r[x0];
        r[x0] ^= r[x2];
        r[x2] |= r[x4];
        r[x4] ^= r[x1];
        r[x0] = ~r[x0];
        r[x1] |= r[x3];
        r[x4] ^= r[x0];
        r[x0] &= r[x2];
        r[x0] ^= r[x1];
        r[x1] &= r[x2];
        r[x3] ^= r[x2];
        r[x4] ^= r[x3];
        r[x2] &= r[x3];
        r[x3] |= r[x0];
        r[x1] ^= r[x4];
        r[x3] ^= r[x4];
        r[x4] &= r[x0];
        r[x4] ^= r[x2];
      }];

    var srpKc = [7788, 63716, 84032, 7891, 78949, 25146, 28835, 67288, 84032, 40055, 7361, 1940, 77639, 27525, 24193, 75702, 7361, 35413, 83150, 82383, 58619, 48468, 18242, 66861, 83150, 69667, 7788, 31552, 40054, 23222, 52496, 57565, 7788, 63716];
    var srpEc = [44255, 61867, 45034, 52496, 73087, 56255, 43827, 41448, 18242, 1939, 18581, 56255, 64584, 31097, 26469, 77728, 77639, 4216, 64585, 31097, 66861, 78949, 58006, 59943, 49676, 78950, 5512, 78949, 27525, 52496, 18670, 76143];
    var srpDc = [44255, 60896, 28835, 1837, 1057, 4216, 18242, 77301, 47399, 53992, 1939, 1940, 66420, 39172, 78950, 45917, 82383, 7450, 67288, 26469, 83149, 57565, 66419, 47400, 58006, 44254, 18581, 18228, 33048, 45034, 66508, 7449];

    function srpInit(key) {
      keyBytes = key;
      var i, j, m, n;

      function keyIt(a, b, c, d, i) {
        srpKey[i] = r[b] = rotw(srpKey[a] ^ r[b] ^ r[c] ^ r[d] ^ 0x9e3779b9 ^ i, 11);
      }

      function keyLoad(a, b, c, d, i) {
        r[a] = srpKey[i];
        r[b] = srpKey[i + 1];
        r[c] = srpKey[i + 2];
        r[d] = srpKey[i + 3];
      }

      function keyStore(a, b, c, d, i) {
        srpKey[i] = r[a];
        srpKey[i + 1] = r[b];
        srpKey[i + 2] = r[c];
        srpKey[i + 3] = r[d];
      }

      keyBytes.reverse();
      keyBytes[keyBytes.length] = 1;
      while (keyBytes.length < 32) keyBytes[keyBytes.length] = 0;
      for (i = 0; i < 8; i++) {
        srpKey[i] = (keyBytes[4 * i + 0] & 0xff) | (keyBytes[4 * i + 1] & 0xff) << 8 | (keyBytes[4 * i + 2] & 0xff) << 16 | (keyBytes[4 * i + 3] & 0xff) << 24;
      }

      var r = [srpKey[3], srpKey[4], srpKey[5], srpKey[6], srpKey[7]];

      i = 0;
      j = 0;
      while (keyIt(j++, 0, 4, 2, i++), keyIt(j++, 1, 0, 3, i++), i < 132) {
        keyIt(j++, 2, 1, 4, i++);
        if (i == 8) {
          j = 0;
        }
        keyIt(j++, 3, 2, 0, i++);
        keyIt(j++, 4, 3, 1, i++);
      }

      i = 128;
      j = 3;
      n = 0;
      while (m = srpKc[n++], srpS[j++ % 8](r, m % 5, m % 7, m % 11, m % 13, m % 17), m = srpKc[n], keyStore(m % 5, m % 7, m % 11, m % 13, i), i > 0) {
        i -= 4;
        keyLoad(m % 5, m % 7, m % 11, m % 13, i);
      }
    }

    function srpClose() {
      srpKey = [];
    }

    function srpEncrypt(data, offset) {
      dataBytes = data;
      dataOffset = offset;
      var blk = dataBytes.slice(dataOffset, dataOffset + 16);
      blk.reverse();
      var r = [getW(blk, 0), getW(blk, 4), getW(blk, 8), getW(blk, 12)];

      srpK(r, 0, 1, 2, 3, 0);
      var n = 0,
          m = srpEc[n];
      while (srpS[n % 8](r, m % 5, m % 7, m % 11, m % 13, m % 17), n < 31) {
        m = srpEc[++n];
        srpLK(r, m % 5, m % 7, m % 11, m % 13, m % 17, n);
      }
      srpK(r, 0, 1, 2, 3, 32);

      for (var j = 3; j >= 0; j--, dataOffset += 4) setWInv(dataBytes, dataOffset, r[j]);
    }

    function srpDecrypt(data, offset) {
      dataBytes = data;
      dataOffset = offset;
      var blk = dataBytes.slice(dataOffset, dataOffset + 16);
      blk.reverse();
      var r = [getW(blk, 0), getW(blk, 4), getW(blk, 8), getW(blk, 12)];

      srpK(r, 0, 1, 2, 3, 32);
      var n = 0,
          m = srpDc[n];
      while (srpSI[7 - n % 8](r, m % 5, m % 7, m % 11, m % 13, m % 17), n < 31) {
        m = srpDc[++n];
        srpKL(r, m % 5, m % 7, m % 11, m % 13, m % 17, 32 - n);
      }
      srpK(r, 2, 3, 1, 4, 0);

      setWInv(dataBytes, dataOffset, r[4]);
      setWInv(dataBytes, dataOffset + 4, r[1]);
      setWInv(dataBytes, dataOffset + 8, r[3]);
      setWInv(dataBytes, dataOffset + 12, r[2]);
      dataOffset += 16;
    }

    return {
      name: "serpent",
      blocksize: 128 / 8,
      open: srpInit,
      close: srpClose,
      encrypt: srpEncrypt,
      decrypt: srpDecrypt
    };
  }
  ALGORITHMS.SERPENT = {
    create: createSerpent
  };


  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // Twofish
  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  function createTwofish() {
    //
    var keyBytes = null;
    var dataBytes = null;
    var dataOffset = -1;
    // var dataLength    = -1;
    var algorithmName = null;
    // var idx2          = -1;
    //
    algorithmName = "twofish";

    var tfsKey = [];
    var tfsM = [
      [],
      [],
      [],
      []
    ];

    function tfsInit(key) {
      keyBytes = key;
      var i, a, b, c, d, meKey = [],
          moKey = [],
          inKey = [];
      var kLen;
      var sKey = [];
      var f01, f5b, fef;

      var q0 = [
        [8, 1, 7, 13, 6, 15, 3, 2, 0, 11, 5, 9, 14, 12, 10, 4],
        [2, 8, 11, 13, 15, 7, 6, 14, 3, 1, 9, 4, 0, 10, 12, 5]
      ];
      var q1 = [
        [14, 12, 11, 8, 1, 2, 3, 5, 15, 4, 10, 6, 7, 0, 9, 13],
        [1, 14, 2, 11, 4, 12, 3, 7, 6, 13, 10, 5, 15, 9, 0, 8]
      ];
      var q2 = [
        [11, 10, 5, 14, 6, 13, 9, 0, 12, 8, 15, 3, 2, 4, 7, 1],
        [4, 12, 7, 5, 1, 6, 9, 10, 0, 14, 13, 8, 2, 11, 3, 15]
      ];
      var q3 = [
        [13, 7, 15, 4, 1, 2, 6, 14, 9, 11, 3, 0, 8, 5, 12, 10],
        [11, 9, 5, 1, 12, 3, 13, 14, 6, 4, 7, 15, 2, 0, 8, 10]
      ];
      var ror4 = [0, 8, 1, 9, 2, 10, 3, 11, 4, 12, 5, 13, 6, 14, 7, 15];
      var ashx = [0, 9, 2, 11, 4, 13, 6, 15, 8, 1, 10, 3, 12, 5, 14, 7];
      var q = [
        [],
        []
      ];
      var m = [
        [],
        [],
        [],
        []
      ];

      function ffm5b(x) {
        return x ^ (x >> 2) ^ [0, 90, 180, 238][x & 3];
      }

      function ffmEf(x) {
        return x ^ (x >> 1) ^ (x >> 2) ^ [0, 238, 180, 90][x & 3];
      }

      function mdsRem(p, q) {
        var i, t, u;
        for (i = 0; i < 8; i++) {
          t = q >>> 24;
          q = ((q << 8) & MAXINT) | p >>> 24;
          p = (p << 8) & MAXINT;
          u = t << 1;
          if (t & 128) {
            u ^= 333;
          }
          q ^= t ^ (u << 16);
          u ^= t >>> 1;
          if (t & 1) {
            u ^= 166;
          }
          q ^= u << 24 | u << 8;
        }
        return q;
      }

      function qp(n, x) {
        var a, b, c, d;
        a = x >> 4;
        b = x & 15;
        c = q0[n][a ^ b];
        d = q1[n][ror4[b] ^ ashx[a]];
        return q3[n][ror4[d] ^ ashx[c]] << 4 | q2[n][c ^ d];
      }

      function hFun(x, key) {
        var a = getB(x, 0),
            b = getB(x, 1),
            c = getB(x, 2),
            d = getB(x, 3);
        switch (kLen) {
          case 4:
            a = q[1][a] ^ getB(key[3], 0);
            b = q[0][b] ^ getB(key[3], 1);
            c = q[0][c] ^ getB(key[3], 2);
            d = q[1][d] ^ getB(key[3], 3);
          case 3:
            a = q[1][a] ^ getB(key[2], 0);
            b = q[1][b] ^ getB(key[2], 1);
            c = q[0][c] ^ getB(key[2], 2);
            d = q[0][d] ^ getB(key[2], 3);
          case 2:
            a = q[0][q[0][a] ^ getB(key[1], 0)] ^ getB(key[0], 0);
            b = q[0][q[1][b] ^ getB(key[1], 1)] ^ getB(key[0], 1);
            c = q[1][q[0][c] ^ getB(key[1], 2)] ^ getB(key[0], 2);
            d = q[1][q[1][d] ^ getB(key[1], 3)] ^ getB(key[0], 3);
        }
        return m[0][a] ^ m[1][b] ^ m[2][c] ^ m[3][d];
      }

      keyBytes = keyBytes.slice(0, 32);
      i = keyBytes.length;
      while (i != 16 && i != 24 && i != 32) keyBytes[i++] = 0;

      for (i = 0; i < keyBytes.length; i += 4) {
        inKey[i >> 2] = getW(keyBytes, i);
      }
      for (i = 0; i < 256; i++) {
        q[0][i] = qp(0, i);
        q[1][i] = qp(1, i);
      }
      for (i = 0; i < 256; i++) {
        f01 = q[1][i];
        f5b = ffm5b(f01);
        fef = ffmEf(f01);
        m[0][i] = f01 + (f5b << 8) + (fef << 16) + (fef << 24);
        m[2][i] = f5b + (fef << 8) + (f01 << 16) + (fef << 24);
        f01 = q[0][i];
        f5b = ffm5b(f01);
        fef = ffmEf(f01);
        m[1][i] = fef + (fef << 8) + (f5b << 16) + (f01 << 24);
        m[3][i] = f5b + (f01 << 8) + (fef << 16) + (f5b << 24);
      }

      kLen = inKey.length / 2;
      for (i = 0; i < kLen; i++) {
        a = inKey[i + i];
        meKey[i] = a;
        b = inKey[i + i + 1];
        moKey[i] = b;
        sKey[kLen - i - 1] = mdsRem(a, b);
      }
      for (i = 0; i < 40; i += 2) {
        a = 0x1010101 * i;
        b = a + 0x1010101;
        a = hFun(a, meKey);
        b = rotw(hFun(b, moKey), 8);
        tfsKey[i] = (a + b) & MAXINT;
        tfsKey[i + 1] = rotw(a + 2 * b, 9);
      }
      for (i = 0; i < 256; i++) {
        a = b = c = d = i;
        switch (kLen) {
          case 4:
            a = q[1][a] ^ getB(sKey[3], 0);
            b = q[0][b] ^ getB(sKey[3], 1);
            c = q[0][c] ^ getB(sKey[3], 2);
            d = q[1][d] ^ getB(sKey[3], 3);
          case 3:
            a = q[1][a] ^ getB(sKey[2], 0);
            b = q[1][b] ^ getB(sKey[2], 1);
            c = q[0][c] ^ getB(sKey[2], 2);
            d = q[0][d] ^ getB(sKey[2], 3);
          case 2:
            tfsM[0][i] = m[0][q[0][q[0][a] ^ getB(sKey[1], 0)] ^ getB(sKey[0], 0)];
            tfsM[1][i] = m[1][q[0][q[1][b] ^ getB(sKey[1], 1)] ^ getB(sKey[0], 1)];
            tfsM[2][i] = m[2][q[1][q[0][c] ^ getB(sKey[1], 2)] ^ getB(sKey[0], 2)];
            tfsM[3][i] = m[3][q[1][q[1][d] ^ getB(sKey[1], 3)] ^ getB(sKey[0], 3)];
        }
      }
    }

    function tfsG0(x) {
      return tfsM[0][getB(x, 0)] ^ tfsM[1][getB(x, 1)] ^ tfsM[2][getB(x, 2)] ^ tfsM[3][getB(x, 3)];
    }

    function tfsG1(x) {
      return tfsM[0][getB(x, 3)] ^ tfsM[1][getB(x, 0)] ^ tfsM[2][getB(x, 1)] ^ tfsM[3][getB(x, 2)];
    }

    function tfsFrnd(r, blk) {
      var a = tfsG0(blk[0]);
      var b = tfsG1(blk[1]);
      blk[2] = rotw(blk[2] ^ (a + b + tfsKey[4 * r + 8]) & MAXINT, 31);
      blk[3] = rotw(blk[3], 1) ^ (a + 2 * b + tfsKey[4 * r + 9]) & MAXINT;
      a = tfsG0(blk[2]);
      b = tfsG1(blk[3]);
      blk[0] = rotw(blk[0] ^ (a + b + tfsKey[4 * r + 10]) & MAXINT, 31);
      blk[1] = rotw(blk[1], 1) ^ (a + 2 * b + tfsKey[4 * r + 11]) & MAXINT;
    }

    function tfsIrnd(i, blk) {
      var a = tfsG0(blk[0]);
      var b = tfsG1(blk[1]);
      blk[2] = rotw(blk[2], 1) ^ (a + b + tfsKey[4 * i + 10]) & MAXINT;
      blk[3] = rotw(blk[3] ^ (a + 2 * b + tfsKey[4 * i + 11]) & MAXINT, 31);
      a = tfsG0(blk[2]);
      b = tfsG1(blk[3]);
      blk[0] = rotw(blk[0], 1) ^ (a + b + tfsKey[4 * i + 8]) & MAXINT;
      blk[1] = rotw(blk[1] ^ (a + 2 * b + tfsKey[4 * i + 9]) & MAXINT, 31);
    }

    function tfsClose() {
      tfsKey = [];
      tfsM = [
        [],
        [],
        [],
        []
      ];
    }

    function tfsEncrypt(data, offset) {
      dataBytes = data;
      dataOffset = offset;
      var blk = [getW(dataBytes, dataOffset) ^ tfsKey[0], getW(dataBytes, dataOffset + 4) ^ tfsKey[1], getW(dataBytes, dataOffset + 8) ^ tfsKey[2], getW(dataBytes, dataOffset + 12) ^ tfsKey[3]];
      for (var j = 0; j < 8; j++) {
        tfsFrnd(j, blk);
      }
      setW(dataBytes, dataOffset, blk[2] ^ tfsKey[4]);
      setW(dataBytes, dataOffset + 4, blk[3] ^ tfsKey[5]);
      setW(dataBytes, dataOffset + 8, blk[0] ^ tfsKey[6]);
      setW(dataBytes, dataOffset + 12, blk[1] ^ tfsKey[7]);
      dataOffset += 16;
    }

    function tfsDecrypt(data, offset) {
      dataBytes = data;
      dataOffset = offset;
      var blk = [getW(dataBytes, dataOffset) ^ tfsKey[4], getW(dataBytes, dataOffset + 4) ^ tfsKey[5], getW(dataBytes, dataOffset + 8) ^ tfsKey[6], getW(dataBytes, dataOffset + 12) ^ tfsKey[7]];
      for (var j = 7; j >= 0; j--) {
        tfsIrnd(j, blk);
      }
      setW(dataBytes, dataOffset, blk[2] ^ tfsKey[0]);
      setW(dataBytes, dataOffset + 4, blk[3] ^ tfsKey[1]);
      setW(dataBytes, dataOffset + 8, blk[0] ^ tfsKey[2]);
      setW(dataBytes, dataOffset + 12, blk[1] ^ tfsKey[3]);
      dataOffset += 16;
    }

    return {
      name: "twofish",
      blocksize: 128 / 8,
      open: tfsInit,
      close: tfsClose,
      encrypt: tfsEncrypt,
      decrypt: tfsDecrypt
    };
  }
  ALGORITHMS.TWOFISH = {
    create: createTwofish
  };




  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // BLOCK CIPHER MODES
  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  var MODES = {};

  function createECB() {
    function encryptOpenECB() {
      this.algorithm.open(this.keyBytes);
      this.dataLength = this.dataBytes.length;
      this.dataOffset = 0;
      // idx2=0;
      return;
    }

    function encryptCloseECB() {
      this.algorithm.close();
    }

    function encryptProcECB() {
      this.algorithm.encrypt(this.dataBytes, this.dataOffset);
      this.dataOffset += this.algorithm.blocksize;
      if (this.dataLength <= this.dataOffset) {
        return 0;
      } else {
        return this.dataLength - this.dataOffset;
      }
    }

    function decryptOpenECB() {
      this.algorithm.open(this.keyBytes);
      // this.dataLength = dataBytes.length;
      this.dataLength = this.dataBytes.length;
      this.dataOffset = 0;
      // idx2=0;
      return;
    }

    function decryptProcECB() {
      this.algorithm.decrypt(this.dataBytes, this.dataOffset);
      this.dataOffset += this.algorithm.blocksize;
      if (this.dataLength <= this.dataOffset) {
        return 0;
      } else {
        return this.dataLength - this.dataOffset;
      }
    }

    function decryptCloseECB() {
      this.algorithm.close();

      // ???
      while (this.dataBytes[this.dataBytes.length - 1] == 0)
        this.dataBytes.pop();
      // while( dataBytes[dataBytes.length-1] ==0 )
      //     dataBytes.pop();
    }

    return {
      encrypt: {
        open: encryptOpenECB,
        exec: encryptProcECB,
        close: encryptCloseECB
      },
      decrypt: {
        open: decryptOpenECB,
        exec: decryptProcECB,
        close: decryptCloseECB
      }
    };
  }
  MODES.ECB = createECB();


  function createCBC() {
    function encryptOpenCBC() {
      this.algorithm.open(this.keyBytes);
      this.dataBytes.unshift(
          randByte(), randByte(), randByte(), randByte(), randByte(), randByte(), randByte(), randByte(), randByte(), randByte(), randByte(), randByte(), randByte(), randByte(), randByte(), randByte());
      this.dataLength = this.dataBytes.length;
      this.dataOffset = 16;
      // idx2=0;
      return;
    }

    function encryptProcCBC() {
      for (var idx2 = this.dataOffset; idx2 < this.dataOffset + 16; idx2++)
        this.dataBytes[idx2] ^= this.dataBytes[idx2 - 16];
      this.algorithm.encrypt(this.dataBytes, this.dataOffset);
      this.dataOffset += this.algorithm.blocksize;

      if (this.dataLength <= this.dataOffset) {
        return 0;
      } else {
        return this.dataLength - this.dataOffset;
      }
    }

    function encryptCloseCBC() {
      this.algorithm.close();
    }

    function decryptOpenCBC() {
      this.algorithm.open(this.keyBytes);
      this.dataLength = this.dataBytes.length;

      // notice it start from dataOffset:16
      this.dataOffset = 16;

      // added 2008/12/31
      // 1. Create a new field for initialization vector.
      // 2. Get initialized vector and store it on the new field.
      this.iv = this.dataBytes.slice(0, 16);

      // idx2=0;
      return;
    }

    // function decryptProcCBC(){
    //     this.dataOffset=this.dataLength-this.dataOffset;
    //
    //     this.algorithm.decrypt( this.dataBytes, this.dataOffset );
    //     this.dataOffset += this.algorithm.blocksize;
    //
    //     for (var idx2=this.dataOffset-16; idx2<this.dataOffset; idx2++)
    //         this.dataBytes[idx2] ^= this.dataBytes[idx2-16];
    //
    //     this.dataOffset = this.dataLength+32-this.dataOffset;
    //
    //     if ( this.dataLength<=this.dataOffset ){
    //         return 0;
    //     } else {
    //         return this.dataLength-this.dataOffset;
    //     }
    // }

    function decryptProcCBC() {
      // copy cipher text for later use of initialization vector.
      var iv2 = this.dataBytes.slice(this.dataOffset, this.dataOffset + 16);
      // decryption
      this.algorithm.decrypt(this.dataBytes, this.dataOffset);
      // xor with the current initialization vector.
      for (var ii = 0; ii < 16; ii++)
        this.dataBytes[this.dataOffset + ii] ^= this.iv[ii];

      // advance the index counter.
      this.dataOffset += this.algorithm.blocksize;
      // set the copied previous cipher text as the current initialization vector.
      this.iv = iv2;

      if (this.dataLength <= this.dataOffset) {
        return 0;
      } else {
        return this.dataLength - this.dataOffset;
      }
    }

    function decryptCloseCBC() {
      this.algorithm.close();
      // trace( "splice.before:"+base16( this.dataBytes ) );
      this.dataBytes.splice(0, 16);
      // trace( "splice.after:"+base16( this.dataBytes ) );
      // ???
      while (this.dataBytes[this.dataBytes.length - 1] == 0)
        this.dataBytes.pop();
    }

    return {
      encrypt: {
        open: encryptOpenCBC,
        exec: encryptProcCBC,
        close: encryptCloseCBC
      },
      decrypt: {
        open: decryptOpenCBC,
        exec: decryptProcCBC,
        close: decryptCloseCBC
      }
    };
  }
  MODES.CBC = createCBC();

  function createCFB() {
    function encryptOpenCFB() {
      throw "not implemented!";
    }

    function encryptProcCFB() {
      throw "not implemented!";
    }

    function encryptCloseCFB() {
      throw "not implemented!";
    }

    function decryptOpenCFB() {
      throw "not implemented!";
    }

    function decryptProcCFB() {
      throw "not implemented!";
    }

    function decryptCloseCFB() {
      throw "not implemented!";
    }

    return {
      encrypt: {
        open: encryptOpenCFB,
        exec: encryptProcCFB,
        close: encryptCloseCFB
      },
      decrypt: {
        open: decryptOpenCFB,
        exec: decryptProcCFB,
        close: decryptCloseCFB
      }
    };
  }
  MODES.CFB = createCFB();

  function createOFB() {
    function encryptOpenOFB() {
      throw "not implemented!";
    }

    function encryptProcOFB() {
      throw "not implemented!";
    }

    function encryptCloseOFB() {
      throw "not implemented!";
    }

    function decryptOpenOFB() {
      throw "not implemented!";
    }

    function decryptProcOFB() {
      throw "not implemented!";
    }

    function decryptCloseOFB() {
      throw "not implemented!";
    }

    return {
      encrypt: {
        open: encryptOpenOFB,
        exec: encryptProcOFB,
        close: encryptCloseOFB
      },
      decrypt: {
        open: decryptOpenOFB,
        exec: decryptProcOFB,
        close: decryptCloseOFB
      }
    };
  }
  MODES.OFB = createOFB();

  function createCTR() {
    function encryptOpenCTR() {
      throw "not implemented!";
    }

    function encryptProcCTR() {
      throw "not implemented!";
    }

    function encryptCloseCTR() {
      throw "not implemented!";
    }

    function decryptOpenCTR() {
      throw "not implemented!";
    }

    function decryptProcCTR() {
      throw "not implemented!";
    }

    function decryptCloseCTR() {
      throw "not implemented!";
    }

    return {
      encrypt: {
        open: encryptOpenCTR,
        exec: encryptProcCTR,
        close: encryptCloseCTR
      },
      decrypt: {
        open: decryptOpenCTR,
        exec: decryptProcCTR,
        close: decryptCloseCTR
      }
    };
  }
  MODES.CTR = createCTR();

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // PADDING ALGORITHMS
  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  var PADDINGS = {};

  /*
   * | DD DD DD DD DD DD DD DD | DD DD DD 80 00 00 00 00 |
   */

  function createRFC1321() {
    function appendPaddingRFC1321(data) {
      var len = 16 - (data.length % 16);
      data.push(0x80);
      for (var i = 1; i < len; i++) {
        data.push(0x00);
      }
      return data;
    }
    // trace( "appendPaddingRFC1321:" + base16( appendPaddingRFC1321( [0,1,2,3,4,5,6,7,8] ) ) );

    function removePaddingRFC1321(data) {
      for (var i = data.length - 1; 0 <= i; i--) {
        var val = data[i];
        if (val == 0x80) {
          data.splice(i);
          break;
        } else if (val != 0x00) {
          break;
        }
      }
      return data;
    }
    // trace( "removePaddingRFC1321:" + base16( removePaddingRFC1321( [0,1,2,3,4,5,6,7,8,9,0x80,00,00,00,00] ) ) );
    return {
      append: appendPaddingRFC1321,
      remove: removePaddingRFC1321
    };
  };
  PADDINGS.RFC1321 = createRFC1321();

  /*
   * ... | DD DD DD DD DD DD DD DD | DD DD DD DD 00 00 00 04 |
   */

  function createANSIX923() {
    function appendPaddingANSIX923(data) {
      var len = 16 - (data.length % 16);
      for (var i = 0; i < len - 1; i++) {
        data.push(0x00);
      }
      data.push(len);
      return data;
    }
    // trace( "appendPaddingANSIX923:" + base16( appendPaddingANSIX923( [0,1,2,3,4,5,6,7,8,9 ] ) ) );

    function removePaddingANSIX923(data) {
      var len = data.pop();
      if (16 < len) len = 16;
      for (var i = 1; i < len; i++) {
        data.pop();
      }
      return data;
    }
    // trace( "removePaddingANSIX923:" + base16( removePaddingANSIX923( [0,1,2,3,4,5,6,7,8,9,0x00,00,00,00,0x05] ) ) );
    return {
      append: appendPaddingANSIX923,
      remove: removePaddingANSIX923
    };
  }
  PADDINGS.ANSIX923 = createANSIX923();

  /*
   * ... | DD DD DD DD DD DD DD DD | DD DD DD DD 81 A6 23 04 |
   */

  function createISO10126() {

    function appendPaddingISO10126(data) {
      var len = 16 - (data.length % 16);
      for (var i = 0; i < len - 1; i++) {
        data.push(randByte());
      }
      data.push(len);
      return data;
    }
    // trace( "appendPaddingISO10126:" + base16( appendPaddingISO10126( [0,1,2,3,4,5,6,7,8,9 ] ) ) );

    function removePaddingISO10126(data) {
      var len = data.pop();
      if (16 < len) len = 16;
      for (var i = 1; i < len; i++) {
        data.pop();
      }
      return data;
    }
    // trace( "removePaddingISO10126:" + base16( removePaddingISO10126( [0,1,2,3,4,5,6,7,8,9,0x00,00,00,00,0x05] ) ) );
    return {
      append: appendPaddingISO10126,
      remove: removePaddingISO10126
    };
  }
  PADDINGS.ISO10126 = createISO10126();


  /*
   * 01
   * 02 02
   * 03 03 03
   * 04 04 04 04
   * 05 05 05 05 05
   * etc.
   */

  function createPKCS7() {
    function appendPaddingPKCS7(data) {
      // trace( "appendPaddingPKCS7");
      // alert( "appendPaddingPKCS7");
      var len = 16 - (data.length % 16);
      for (var i = 0; i < len; i++) {
        data.push(len);
      }
      // trace( "data:"+base16(data) );
      // trace( "data.length:"+data.length );
      return data;
    }
    // trace( "appendPaddingPKCS7:" + base16( appendPaddingPKCS7( [0,1,2,3,4,5,6,7,8,9 ] ) ) );

    function removePaddingPKCS7(data) {
      var len = data.pop();
      if (16 < len) len = 0;
      for (var i = 1; i < len; i++) {
        data.pop();
      }
      return data;
    }
    // trace( "removePaddingPKCS7:" + base16( removePaddingPKCS7( [0,1,2,3,4,5,6,7,8,9,0x00,04,04,04,0x04] ) ) );
    return {
      append: appendPaddingPKCS7,
      remove: removePaddingPKCS7
    };
  }
  PADDINGS.PKCS7 = createPKCS7();

  /*
   * NO PADDINGS
   */

  function createNoPadding() {
    function appendPaddingNone(data) {
      return data;
    }
    // trace( "appendPaddingPKCS7:" + base16( appendPaddingPKCS7( [0,1,2,3,4,5,6,7,8,9 ] ) ) );

    function removePaddingNone(data) {
      return data;
    }
    // trace( "removePaddingPKCS7:" + base16( removePaddingPKCS7( [0,1,2,3,4,5,6,7,8,9,0x00,04,04,04,0x04] ) ) );
    return {
      append: appendPaddingNone,
      remove: removePaddingNone
    };
  }
  PADDINGS.NO_PADDING = createNoPadding();

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // ENCRYPT/DECRYPT
  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  var DIRECTIONS = {
    ENCRYPT: "encrypt",
    DECRYPT: "decrypt"
  };



  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // INTERFACE
  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  function Cipher(algorithm, direction, mode, padding) {
    this.algorithm = algorithm;
    this.direction = direction;
    this.mode = mode;
    this.padding = padding;

    this.modeOpen = mode[direction].open;
    this.modeExec = mode[direction].exec;
    this.modeClose = mode[direction].close;

    // NOTE : values below are reffered by MODE functions via "this" parameter.
    this.keyBytes = null;
    this.dataBytes = null;
    this.dataOffset = -1;
    this.dataLength = -1;

  }

  Cipher.prototype = new Object();
  Cipher.prototype.inherit = Cipher;

  function open(keyBytes, dataBytes) {
    if (keyBytes == null) throw "keyBytes is null";
    if (dataBytes == null) throw "dataBytes is null";

    // BE CAREFUL : THE KEY GENERATING ALGORITHM OF SERPENT HAS SIDE-EFFECT
    // TO MODIFY THE KEY ARRAY.  IT IS NECESSARY TO DUPLICATE IT BEFORE
    // PROCESS THE CIPHER TEXT.
    this.keyBytes = keyBytes.concat();

    // DATA BUFFER IS USUALLY LARGE. DON'T DUPLICATE IT FOR PERFORMANCE REASON.
    this.dataBytes = dataBytes /*.concat()*/
    ;

    this.dataOffset = 0;
    this.dataLength = dataBytes.length;

    //if ( this.direction == Cipher.ENCRYPT ) // fixed 2008/12/31
    if (this.direction == DIRECTIONS.ENCRYPT) {
      this.padding.append(this.dataBytes);
    }

    this.modeOpen();
  }

  function operate() {
    return this.modeExec();
  }

  function close() {
    this.modeClose();
    // if ( this.direction == Cipher.DECRYPT ) // fixed 2008/12/31
    if (this.direction == DIRECTIONS.DECRYPT) {
      this.padding.remove(this.dataBytes);
    }
    return this.dataBytes;
  }

  function execute(keyBytes, dataBytes) {
    this.open(keyBytes, dataBytes);
    for (;;) {
      var size = this.operate();
      if (0 < size) {
        // trace( size );
        //alert( size );
        continue;
      } else {
        break;
      }
    }
    return this.close();
  }

  Cipher.prototype.open = open;
  Cipher.prototype.close = close;
  Cipher.prototype.operate = operate;
  Cipher.prototype.execute = execute;

  ////////////////////////////////////////////////////////////////////////
  // this.updateMode = function() {
  //     this.modeProcs = this.mode[ this.direction ];
  // };
  ////////////////////////////////////////////////////////////////////////
  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  //
  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  Cipher.ENCRYPT = "ENCRYPT";
  Cipher.DECRYPT = "DECRYPT";

  Cipher.RIJNDAEL = "RIJNDAEL";
  Cipher.SERPENT = "SERPENT";
  Cipher.TWOFISH = "TWOFISH";

  Cipher.ECB = "ECB";
  Cipher.CBC = "CBC";
  Cipher.CFB = "CFB";
  Cipher.OFB = "OFB";
  Cipher.CTR = "CTR";

  Cipher.RFC1321 = "RFC1321";
  Cipher.ANSIX923 = "ANSIX923";
  Cipher.ISO10126 = "ISO10126";
  Cipher.PKCS7 = "PKCS7";
  Cipher.NO_PADDING = "NO_PADDING";

  Cipher.create = function (algorithmName, directionName, modeName, paddingName) {

    if (algorithmName == null) algorithmName = Cipher.RIJNDAEL;
    if (directionName == null) directionName = Cipher.ENCRYPT;
    if (modeName == null) modeName = Cipher.CBC;
    if (paddingName == null) paddingName = Cipher.PKCS7;

    var algorithm = ALGORITHMS[algorithmName];
    var direction = DIRECTIONS[directionName];
    var mode = MODES[modeName];
    var padding = PADDINGS[paddingName];

    if (algorithm == null) throw "Invalid algorithm name '" + algorithmName + "'.";
    if (direction == null) throw "Invalid direction name '" + directionName + "'.";
    if (mode == null) throw "Invalid mode name '" + modeName + "'.";
    if (padding == null) throw "Invalid padding name '" + paddingName + "'.";

    return new Cipher(algorithm.create(), direction, mode, padding);
  };

  Cipher.algorithm = function (algorithmName) {
    if (algorithmName == null) throw "Null Pointer Exception ( algorithmName )";
    var algorithm = ALGORITHMS[algorithmName];
    if (algorithm == null) throw "Invalid algorithm name '" + algorithmName + "'.";
    // trace( "ss" );
    // trace( algorithm );
    return algorithm.create();
  }


  ///////////////////////////////////
  // export
  ///////////////////////////////////
  __Crypto.__export(packageRoot, "titaniumcore.crypto.Cipher", Cipher);

} // the end of initBlockCipher();
initBlockCipher(__Crypto);

/*
 * SecureRandom.js
 * A Secure Random Number Generator
 * See SecureRandom.readme.txt for further information.
 *
 * ACKNOWLEDGMENT
 *
 *     This library is originally written by Tom Wu
 *
 *     Copyright (c) 2005  Tom Wu
 *     All Rights Reserved.
 *     http://www-cs-students.stanford.edu/~tjw/jsbn/
 *
 * MODIFICATION
 *
 *     Some modifications are applied by Atsushi Oka
 *
 *     Atushi Oka
 *     http://oka.nu/
 *
 *     - Packaged
 *     - Added Object-Oriented Interface.
 */

function initRNG(packages) {
  __Crypto.__unit("SecureRandom.js");
  __Crypto.__uses("packages.js");

  /////////////////////////////////////////////
  // import
  /////////////////////////////////////////////
  // var Arcfour = __package( packages ).Arcfour;
  /////////////////////////////////////
  // implementation
  /////////////////////////////////////
  //
  // Arcfour
  //
  var Arcfour = function () {
    this.i = 0;
    this.j = 0;
    this.S = new Array();
  };

  // Initialize arcfour context from key, an array of ints, each from [0..255]
  Arcfour.prototype.init = function (key) {
    var i, j, t;
    for (i = 0; i < 256; ++i)
      this.S[i] = i;
    j = 0;
    for (i = 0; i < 256; ++i) {
      j = (j + this.S[i] + key[i % key.length]) & 255;
      t = this.S[i];
      this.S[i] = this.S[j];
      this.S[j] = t;
    }
    this.i = 0;
    this.j = 0;
  };

  Arcfour.prototype.next = function () {
    var t;
    this.i = (this.i + 1) & 255;
    this.j = (this.j + this.S[this.i]) & 255;
    t = this.S[this.i];
    this.S[this.i] = this.S[this.j];
    this.S[this.j] = t;
    return this.S[(t + this.S[this.i]) & 255];
  };


  // Plug in your RNG constructor here
  Arcfour.create = function () {
    return new Arcfour();
  };

  // Pool size must be a multiple of 4 and greater than 32.
  // An array of bytes the size of the pool will be passed to init()
  Arcfour.rng_psize = 256;

  //
  // SecureRandom
  //
  var rng_state = null;
  var rng_pool = [];
  var rng_pptr = 0;

  // Mix in a 32-bit integer into the pool
  rng_seed_int = function (x) {
    // FIXED 7 DEC,2008 http://oka.nu/
    // >>
    // rng_pool[rng_pptr++] ^= x & 255;
    // rng_pool[rng_pptr++] ^= (x >> 8) & 255;
    // rng_pool[rng_pptr++] ^= (x >> 16) & 255;
    // rng_pool[rng_pptr++] ^= (x >> 24) & 255;
    rng_pool[rng_pptr] ^= x & 255;
    rng_pptr++;
    rng_pool[rng_pptr] ^= (x >> 8) & 255;
    rng_pptr++;
    rng_pool[rng_pptr] ^= (x >> 16) & 255;
    rng_pptr++;
    rng_pool[rng_pptr] ^= (x >> 24) & 255;
    rng_pptr++;
    // <<
    if (rng_pptr >= Arcfour.rng_psize) rng_pptr -= Arcfour.rng_psize;
  };

  // Mix in the current time (w/milliseconds) into the pool
  rng_seed_time = function () {
    rng_seed_int(new Date().getTime());
  };

  // Initialize the pool with junk if needed.
  pool_init = function () {
    var t;
    //if ( navigator.appName == "Netscape" && navigator.appVersion < "5" && window.crypto ) {
    // Extract entropy (256 bits) from NS4 RNG if available
    //var z = window.crypto.random(32);
    //for(t = 0; t < z.length; ++t)
    //rng_pool[rng_pptr++] = z.charCodeAt(t) & 255;
    //}
    while (rng_pptr < Arcfour.rng_psize) { // extract some randomness from Math.random()
      t = Math.floor(65536 * Math.random());
      rng_pool[rng_pptr++] = t >>> 8;
      rng_pool[rng_pptr++] = t & 255;
    }
    rng_pptr = 0;
    rng_seed_time();
    //rng_seed_int(window.screenX);
    //rng_seed_int(window.screenY);
  };

  var rng_get_byte = function () {
    if (rng_state == null) {
      rng_seed_time();
      // rng_state = Arcfour.prng_newstate();
      rng_state = Arcfour.create();
      rng_state.init(rng_pool);
      for (rng_pptr = 0; rng_pptr < rng_pool.length; ++rng_pptr)
        rng_pool[rng_pptr] = 0;
      rng_pptr = 0;
      //rng_pool = null;
    }
    // TODO: allow reseeding after first request
    return rng_state.next();
  };

  var SecureRandom = function () {};
  SecureRandom.prototype.nextBytes = function (ba) {
    for (var i = 0; i < ba.length; ++i)
      ba[i] = rng_get_byte();
  };

  // initialize
  pool_init();

  ///////////////////////////////////////////
  // export
  ///////////////////////////////////////////
  // __package( packages, path ).RNG = RNG;
  // __package( packages, path ).SecureRandom = SecureRandom;
  __Crypto.__export(packages, "titaniumcore.crypto.SecureRandom", SecureRandom);
};
initRNG(__Crypto);


// vim:ts=8 sw=4:noexpandtab:
// vim:ts=8 sw=4:noexpandtab:

/*
 * A JavaScript implementation of the RSA Data Security, Inc. MD5 Message
 * Digest Algorithm, as defined in RFC 1321.
 * Version 2.2 Copyright (C) Paul Johnston 1999 - 2009
 * Other contributors: Greg Holt, Andrew Kepert, Ydnar, Lostinet
 * Distributed under the BSD License
 * See http://pajhome.org.uk/crypt/md5 for more info.
 */

/*
 * Configurable variables. You may need to tweak these to be compatible with
 * the server-side, but the defaults work in most cases.
 */
var hexcase = 0;   /* hex output format. 0 - lowercase; 1 - uppercase        */
var b64pad  = "";  /* base-64 pad character. "=" for strict RFC compliance   */

/*
 * These are the functions you'll usually want to call
 * They take string arguments and return either hex or base-64 encoded strings
 */
function hex_md5(s)    { return rstr2hex(rstr_md5(str2rstr_utf8(s))); }
function b64_md5(s)    { return rstr2b64(rstr_md5(str2rstr_utf8(s))); }
function any_md5(s, e) { return rstr2any(rstr_md5(str2rstr_utf8(s)), e); }
function hex_hmac_md5(k, d)
{ return rstr2hex(rstr_hmac_md5(str2rstr_utf8(k), str2rstr_utf8(d))); }
function b64_hmac_md5(k, d)
{ return rstr2b64(rstr_hmac_md5(str2rstr_utf8(k), str2rstr_utf8(d))); }
function any_hmac_md5(k, d, e)
{ return rstr2any(rstr_hmac_md5(str2rstr_utf8(k), str2rstr_utf8(d)), e); }

/*
 * Perform a simple self-test to see if the VM is working
 */
function md5_vm_test()
{
  return hex_md5("abc").toLowerCase() == "900150983cd24fb0d6963f7d28e17f72";
}

/*
 * Calculate the MD5 of a raw string
 */
function rstr_md5(s)
{
  return binl2rstr(binl_md5(rstr2binl(s), s.length * 8));
}

/*
 * Calculate the HMAC-MD5, of a key and some data (raw strings)
 */
function rstr_hmac_md5(key, data)
{
  var bkey = rstr2binl(key);
  if(bkey.length > 16) bkey = binl_md5(bkey, key.length * 8);

  var ipad = Array(16), opad = Array(16);
  for(var i = 0; i < 16; i++)
  {
    ipad[i] = bkey[i] ^ 0x36363636;
    opad[i] = bkey[i] ^ 0x5C5C5C5C;
  }

  var hash = binl_md5(ipad.concat(rstr2binl(data)), 512 + data.length * 8);
  return binl2rstr(binl_md5(opad.concat(hash), 512 + 128));
}

/*
 * Convert a raw string to a hex string
 */
function rstr2hex(input)
{
  try { hexcase } catch(e) { hexcase=0; }
  var hex_tab = hexcase ? "0123456789ABCDEF" : "0123456789abcdef";
  var output = "";
  var x;
  for(var i = 0; i < input.length; i++)
  {
    x = input.charCodeAt(i);
    output += hex_tab.charAt((x >>> 4) & 0x0F)
        +  hex_tab.charAt( x        & 0x0F);
  }
  return output;
}

/*
 * Convert a raw string to a base-64 string
 */
function rstr2b64(input)
{
  try { b64pad } catch(e) { b64pad=''; }
  var tab = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  var output = "";
  var len = input.length;
  for(var i = 0; i < len; i += 3)
  {
    var triplet = (input.charCodeAt(i) << 16)
        | (i + 1 < len ? input.charCodeAt(i+1) << 8 : 0)
        | (i + 2 < len ? input.charCodeAt(i+2)      : 0);
    for(var j = 0; j < 4; j++)
    {
      if(i * 8 + j * 6 > input.length * 8) output += b64pad;
      else output += tab.charAt((triplet >>> 6*(3-j)) & 0x3F);
    }
  }
  return output;
}

/*
 * Convert a raw string to an arbitrary string encoding
 */
function rstr2any(input, encoding)
{
  var divisor = encoding.length;
  var i, j, q, x, quotient;

  /* Convert to an array of 16-bit big-endian values, forming the dividend */
  var dividend = Array(Math.ceil(input.length / 2));
  for(i = 0; i < dividend.length; i++)
  {
    dividend[i] = (input.charCodeAt(i * 2) << 8) | input.charCodeAt(i * 2 + 1);
  }

  /*
   * Repeatedly perform a long division. The binary array forms the dividend,
   * the length of the encoding is the divisor. Once computed, the quotient
   * forms the dividend for the next step. All remainders are stored for later
   * use.
   */
  var full_length = Math.ceil(input.length * 8 /
      (Math.log(encoding.length) / Math.log(2)));
  var remainders = Array(full_length);
  for(j = 0; j < full_length; j++)
  {
    quotient = Array();
    x = 0;
    for(i = 0; i < dividend.length; i++)
    {
      x = (x << 16) + dividend[i];
      q = Math.floor(x / divisor);
      x -= q * divisor;
      if(quotient.length > 0 || q > 0)
        quotient[quotient.length] = q;
    }
    remainders[j] = x;
    dividend = quotient;
  }

  /* Convert the remainders to the output string */
  var output = "";
  for(i = remainders.length - 1; i >= 0; i--)
    output += encoding.charAt(remainders[i]);

  return output;
}

/*
 * Encode a string as utf-8.
 * For efficiency, this assumes the input is valid utf-16.
 */
function str2rstr_utf8(input)
{
  var output = "";
  var i = -1;
  var x, y;

  while(++i < input.length)
  {
    /* Decode utf-16 surrogate pairs */
    x = input.charCodeAt(i);
    y = i + 1 < input.length ? input.charCodeAt(i + 1) : 0;
    if(0xD800 <= x && x <= 0xDBFF && 0xDC00 <= y && y <= 0xDFFF)
    {
      x = 0x10000 + ((x & 0x03FF) << 10) + (y & 0x03FF);
      i++;
    }

    /* Encode output as utf-8 */
    if(x <= 0x7F)
      output += String.fromCharCode(x);
    else if(x <= 0x7FF)
      output += String.fromCharCode(0xC0 | ((x >>> 6 ) & 0x1F),
          0x80 | ( x         & 0x3F));
    else if(x <= 0xFFFF)
      output += String.fromCharCode(0xE0 | ((x >>> 12) & 0x0F),
          0x80 | ((x >>> 6 ) & 0x3F),
          0x80 | ( x         & 0x3F));
    else if(x <= 0x1FFFFF)
      output += String.fromCharCode(0xF0 | ((x >>> 18) & 0x07),
          0x80 | ((x >>> 12) & 0x3F),
          0x80 | ((x >>> 6 ) & 0x3F),
          0x80 | ( x         & 0x3F));
  }
  return output;
}

/*
 * Encode a string as utf-16
 */
function str2rstr_utf16le(input)
{
  var output = "";
  for(var i = 0; i < input.length; i++)
    output += String.fromCharCode( input.charCodeAt(i)        & 0xFF,
        (input.charCodeAt(i) >>> 8) & 0xFF);
  return output;
}

function str2rstr_utf16be(input)
{
  var output = "";
  for(var i = 0; i < input.length; i++)
    output += String.fromCharCode((input.charCodeAt(i) >>> 8) & 0xFF,
        input.charCodeAt(i)        & 0xFF);
  return output;
}

/*
 * Convert a raw string to an array of little-endian words
 * Characters >255 have their high-byte silently ignored.
 */
function rstr2binl(input)
{
  var output = Array(input.length >> 2);
  for(var i = 0; i < output.length; i++)
    output[i] = 0;
  for(var i = 0; i < input.length * 8; i += 8)
    output[i>>5] |= (input.charCodeAt(i / 8) & 0xFF) << (i%32);
  return output;
}

/*
 * Convert an array of little-endian words to a string
 */
function binl2rstr(input)
{
  var output = "";
  for(var i = 0; i < input.length * 32; i += 8)
    output += String.fromCharCode((input[i>>5] >>> (i % 32)) & 0xFF);
  return output;
}

/*
 * Calculate the MD5 of an array of little-endian words, and a bit length.
 */
function binl_md5(x, len)
{
  /* append padding */
  x[len >> 5] |= 0x80 << ((len) % 32);
  x[(((len + 64) >>> 9) << 4) + 14] = len;

  var a =  1732584193;
  var b = -271733879;
  var c = -1732584194;
  var d =  271733878;

  for(var i = 0; i < x.length; i += 16)
  {
    var olda = a;
    var oldb = b;
    var oldc = c;
    var oldd = d;

    a = md5_ff(a, b, c, d, x[i+ 0], 7 , -680876936);
    d = md5_ff(d, a, b, c, x[i+ 1], 12, -389564586);
    c = md5_ff(c, d, a, b, x[i+ 2], 17,  606105819);
    b = md5_ff(b, c, d, a, x[i+ 3], 22, -1044525330);
    a = md5_ff(a, b, c, d, x[i+ 4], 7 , -176418897);
    d = md5_ff(d, a, b, c, x[i+ 5], 12,  1200080426);
    c = md5_ff(c, d, a, b, x[i+ 6], 17, -1473231341);
    b = md5_ff(b, c, d, a, x[i+ 7], 22, -45705983);
    a = md5_ff(a, b, c, d, x[i+ 8], 7 ,  1770035416);
    d = md5_ff(d, a, b, c, x[i+ 9], 12, -1958414417);
    c = md5_ff(c, d, a, b, x[i+10], 17, -42063);
    b = md5_ff(b, c, d, a, x[i+11], 22, -1990404162);
    a = md5_ff(a, b, c, d, x[i+12], 7 ,  1804603682);
    d = md5_ff(d, a, b, c, x[i+13], 12, -40341101);
    c = md5_ff(c, d, a, b, x[i+14], 17, -1502002290);
    b = md5_ff(b, c, d, a, x[i+15], 22,  1236535329);

    a = md5_gg(a, b, c, d, x[i+ 1], 5 , -165796510);
    d = md5_gg(d, a, b, c, x[i+ 6], 9 , -1069501632);
    c = md5_gg(c, d, a, b, x[i+11], 14,  643717713);
    b = md5_gg(b, c, d, a, x[i+ 0], 20, -373897302);
    a = md5_gg(a, b, c, d, x[i+ 5], 5 , -701558691);
    d = md5_gg(d, a, b, c, x[i+10], 9 ,  38016083);
    c = md5_gg(c, d, a, b, x[i+15], 14, -660478335);
    b = md5_gg(b, c, d, a, x[i+ 4], 20, -405537848);
    a = md5_gg(a, b, c, d, x[i+ 9], 5 ,  568446438);
    d = md5_gg(d, a, b, c, x[i+14], 9 , -1019803690);
    c = md5_gg(c, d, a, b, x[i+ 3], 14, -187363961);
    b = md5_gg(b, c, d, a, x[i+ 8], 20,  1163531501);
    a = md5_gg(a, b, c, d, x[i+13], 5 , -1444681467);
    d = md5_gg(d, a, b, c, x[i+ 2], 9 , -51403784);
    c = md5_gg(c, d, a, b, x[i+ 7], 14,  1735328473);
    b = md5_gg(b, c, d, a, x[i+12], 20, -1926607734);

    a = md5_hh(a, b, c, d, x[i+ 5], 4 , -378558);
    d = md5_hh(d, a, b, c, x[i+ 8], 11, -2022574463);
    c = md5_hh(c, d, a, b, x[i+11], 16,  1839030562);
    b = md5_hh(b, c, d, a, x[i+14], 23, -35309556);
    a = md5_hh(a, b, c, d, x[i+ 1], 4 , -1530992060);
    d = md5_hh(d, a, b, c, x[i+ 4], 11,  1272893353);
    c = md5_hh(c, d, a, b, x[i+ 7], 16, -155497632);
    b = md5_hh(b, c, d, a, x[i+10], 23, -1094730640);
    a = md5_hh(a, b, c, d, x[i+13], 4 ,  681279174);
    d = md5_hh(d, a, b, c, x[i+ 0], 11, -358537222);
    c = md5_hh(c, d, a, b, x[i+ 3], 16, -722521979);
    b = md5_hh(b, c, d, a, x[i+ 6], 23,  76029189);
    a = md5_hh(a, b, c, d, x[i+ 9], 4 , -640364487);
    d = md5_hh(d, a, b, c, x[i+12], 11, -421815835);
    c = md5_hh(c, d, a, b, x[i+15], 16,  530742520);
    b = md5_hh(b, c, d, a, x[i+ 2], 23, -995338651);

    a = md5_ii(a, b, c, d, x[i+ 0], 6 , -198630844);
    d = md5_ii(d, a, b, c, x[i+ 7], 10,  1126891415);
    c = md5_ii(c, d, a, b, x[i+14], 15, -1416354905);
    b = md5_ii(b, c, d, a, x[i+ 5], 21, -57434055);
    a = md5_ii(a, b, c, d, x[i+12], 6 ,  1700485571);
    d = md5_ii(d, a, b, c, x[i+ 3], 10, -1894986606);
    c = md5_ii(c, d, a, b, x[i+10], 15, -1051523);
    b = md5_ii(b, c, d, a, x[i+ 1], 21, -2054922799);
    a = md5_ii(a, b, c, d, x[i+ 8], 6 ,  1873313359);
    d = md5_ii(d, a, b, c, x[i+15], 10, -30611744);
    c = md5_ii(c, d, a, b, x[i+ 6], 15, -1560198380);
    b = md5_ii(b, c, d, a, x[i+13], 21,  1309151649);
    a = md5_ii(a, b, c, d, x[i+ 4], 6 , -145523070);
    d = md5_ii(d, a, b, c, x[i+11], 10, -1120210379);
    c = md5_ii(c, d, a, b, x[i+ 2], 15,  718787259);
    b = md5_ii(b, c, d, a, x[i+ 9], 21, -343485551);

    a = safe_add(a, olda);
    b = safe_add(b, oldb);
    c = safe_add(c, oldc);
    d = safe_add(d, oldd);
  }
  return Array(a, b, c, d);
}

/*
 * These functions implement the four basic operations the algorithm uses.
 */
function md5_cmn(q, a, b, x, s, t)
{
  return safe_add(bit_rol(safe_add(safe_add(a, q), safe_add(x, t)), s),b);
}
function md5_ff(a, b, c, d, x, s, t)
{
  return md5_cmn((b & c) | ((~b) & d), a, b, x, s, t);
}
function md5_gg(a, b, c, d, x, s, t)
{
  return md5_cmn((b & d) | (c & (~d)), a, b, x, s, t);
}
function md5_hh(a, b, c, d, x, s, t)
{
  return md5_cmn(b ^ c ^ d, a, b, x, s, t);
}
function md5_ii(a, b, c, d, x, s, t)
{
  return md5_cmn(c ^ (b | (~d)), a, b, x, s, t);
}

/*
 * Add integers, wrapping at 2^32. This uses 16-bit operations internally
 * to work around bugs in some JS interpreters.
 */
function safe_add(x, y)
{
  var lsw = (x & 0xFFFF) + (y & 0xFFFF);
  var msw = (x >> 16) + (y >> 16) + (lsw >> 16);
  return (msw << 16) | (lsw & 0xFFFF);
}

/*
 * Bitwise rotate a 32-bit number to the left.
 */
function bit_rol(num, cnt)
{
  return (num << cnt) | (num >>> (32 - cnt));
}