var examples = [
  {
    // "set" is the TeX description of the language
    set: "w \\in \\Sigma^\\ast \\mid |w|_{\\mathbb{a}} < |w|_{\\mathbb{b}}",
    // "test" must be a function which accepts a string and checks
    // whether the string belongs to the language
    test: function (str) {
      return (str.match(/a/g) || []).length < (str.match(/b/g) || []).length;
    },
    // "strategy" is optional and tries to set cfrom and cto so that
    // the computer player will win - see function trials(); we always
    // provide strategies for regular languages and sometimes (as
    // here) also for non-regular languages just for fun
    strategy: function () {
      // the strategy is to mark a single "b" if possible; this can of
      // course fail, but it's the best we can do
      var start = from;
      while (start + 1 <= to) {
        if (string1[start] === 'b') {
          cfrom = start;
          cto = start + 1;
          return;
        }
        start++;
      }
    }
  },
  {
    set: "\\mathtt{a}^n\\mathtt{b}^n \\mid n\\in\\mathbb{N}",
    test: function (str) {
      var len = str.length;
      return (len % 2 == 0 && str.slice(0, len/2).match(/^a*$/) && str.slice(len/2).match(/^b*$/));
    }
  },
  {
    set: "w \\in \\Sigma^\\ast \\mid w = w^{\\mathtt{R}}",
    test: function (str) {
      return str === str.split("").reverse().join("");
    }
  },
  {
    set: "\\mathtt{a}^{n}\\mathtt{b}^{k}\\mathtt{a}^{n+k}\\mid k,n\\in\\mathbb{N}",
    test: function (str) {
      var match = str.match(/^(a*b*)a*$/);
      return match && 2 * match[1].length == str.length;
    }
  },
  {
    set: "\\mathtt{a}^{2^n}\\mid n\\in\\mathbb{N}",
    test: function (str) {
      var len = str.length;
      return str.match(/^a*$/) && len > 0 && (Math.log(len)/Math.log(2)) % 1 == 0;
    }
  },
  {
    set: "\\mathtt{a}^n\\mid n\\text{ is prime}",
    test: function (str) {
      var len = str.length;
      return str.match(/^a*$/) && len > 1 &&
        d3.range(2, len).every(function (k) {
          return len % k != 0;
        })
    }
  },
  {
    set: "(\\mathtt{ab})^{3n}\\mid n\\in\\mathbb{N}",
    test: function (str) {
      return str.match(/^(ab)*$/) && str.length % 6 == 0;
    },
    // optional value which in this case says that the number of
    // states must be at least 7...
    randomFrom: 7,
    // ...which means we can always mark exactly 6 characters... :)
    strategy: function () {
      cfrom = from;
      cto = from + 6;
    }
  },
  {
    set: "\\mathtt{a}^k\\mathtt{b}^n \\mid k \\text{ is even or } n \\text{ is odd}",
    test: function (str) {
      return (str.match(/^(aa)*b*$|^a*b(bb)*$/));
    },
    randomFrom: 3,
    strategy: function () {
      var start = from;
      while (start + 2 <= to) {
        // if we're able to remove/add an even number of a's or b's,
        // we can't lose
        if (string1.slice(start).match(/^aa|^bb/))
          break;
        start++;
      }
      cfrom = start;
      cto = start + 2;
    }
  },
  {
    set: "\\mathtt{b}^5w \\mid |w|_{\\mathbb{a}} = 2|w|_{\\mathbb{b}}",
    test: function (str) {
      var alen = (str.match(/a/g) || []).length;
      var blen = (str.match(/b/g) || []).length - 5;
      return str.match(/^bbbbb/) && alen == 2 * blen;
    },
    randomFrom: 8,
    // there's no guarantee, but if we can remove/add two a's and one
    // b, then the user has made a mistake which we can exploit
    strategy: function () {
      var start = Math.max(from, 5);
      while (start + 3 < to) {
        if (string1.slice(start).match(/^aab|^aba|^baa/))
          break;
        start++;
      }
      cfrom = start;
      cto = start + 3;
    }
  },
  {
    set: "\\mathtt{a}^k\\mathtt{b}^m\\mathtt{a}^n \\mid k + m \\equiv n \\pmod 3",
    test: function (str) {
      var match = str.match('^(a*)(b*)(a*)$');
      return match && (match[2].length == 0 || (match[1].length + match[2].length - match[3].length) % 3 == 0);
    },
    // a string of at least seven characters must contain three a's or
    // three b's in a row which we can safely add/remove
    randomFrom: 7,
    strategy: function () {
      var start = from;
      while (start + 3 <= to) {
        if (string1.slice(start).match(/^aaa|^bbb/))
          break;
        start++;
      }
      cfrom = start;
      cto = start + 3;
    }
  },
  {
    set: "(\\mathtt{ab})^n\\mathtt{a}^k \\mid n \\geq k",
    test: function (str) {
      var alen = (str.match(/a/g) || []).length;
      var blen = (str.match(/b/g) || []).length;
      return str.match(/^(ab)*a*$/) && blen >= alen - blen;
    }
  },
  {
    set: "w_1w_2 \\in \\Sigma^\\ast \\mid w_1 = \\mathtt{a}^{|w_2|} \\lor w_2 = \\mathtt{b}^{|w_1|}",
    test: function (str) {
      var len = str.length;
      return len % 2 == 0 && (str.slice(0, len / 2).match(/^a*$/) || str.slice(len / 2).match(/^b*$/));
    }
  },
  {
    set: "(\\mathtt{ab})^n\\mathtt{a}^k(\\mathtt{ba})^n \\mid k < 3",
    test: function (str) {
      var str1, str2, len = str.length;
      if (len % 2 == 0) {
        // k == 0
        str1 = str.substr(0, len / 2);
        str2 = str.substr(len / 2);
        if (str1.match(/^(?:ab)*$/) && str2.match(/^(?:ba)*$/))
          return true;
        // k == 2
        str1 = str.substr(0, len / 2 - 1);
        str2 = str.substr(len / 2 + 1);
        return (str.substr(len / 2 - 1, 2) == "aa" && str1.match(/^(?:ab)*$/) && str2.match(/^(?:ba)*$/));
      } else {
        // k == 1
        str1 = str.substr(0, (len - 1) / 2);
        str2 = str.substr((len + 1) / 2);
        return (str.substr((len - 1) / 2, 1) == "a" && str1.match(/^(?:ab)*$/) && str2.match(/^(?:ba)*$/));
      }
    }
  },
  {
    set: "w \\in \\Sigma^\\ast \\mid |w| \\text{ is even}",
    test: function (str) {
      return str.length % 2 == 0;
    },
    randomFrom: 2,
    strategy: function () {
      cfrom = from;
      cto = from + 2;
    }
  },
  {
    set: "\\mathtt{a}^n\\mathtt{b}^{n^2} \\mid n\\in\\mathbb{N}",
    test: function (str) {
      if (!str.match(/^a*b*$/))
        return false;
      var alen = (str.match(/a/g) || []).length;
      return (str.match(/b/g) || []).length == alen * alen;
    }
  },
  {
    set: "\\mathtt{a}^n\\mathtt{b}\\mathtt{a}^{n} \\mid n\\in\\mathbb{N}",
    test: function (str) {
      return str.match(/^(a*)b\1$/);
    }
  },
  {
    set: "\\mathtt{a}^n \\mid n \\text{ is odd}",
    test: function (str) {
      return str.match(/^a*$/) && str.length % 2 == 1;
    },
    randomFrom: 2,
    strategy: function () {
      cfrom = from;
      cto = from + 2;
    }
  },
  {
    set: "w \\in \\Sigma^\\ast \\mid |w| \\text{ is odd and the middle symbol is }\\mathbb{a}",
    test: function (str) {
      var len = str.length;
      return len % 2 == 1 && str[(len - 1)/ 2] === 'a';
    }
  }
];
