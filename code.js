var ex_id, // ID of the current exercise, index into examples array
    example, // current exercise, an element of examples array
    no_states, // number of states
    in1, // the div with the ID "in1"
    string1, // what the user entered
    from, // start of the substring the user marked
    to, // end of the substring the user marked
    cfrom, // start of the subsubstring the computer player marked
    cto, // end of the subsubstring the computer player marked
    repeat; // how often the user wants the subsubstring to be repeated
var maxStates = 30; // maximal number of states if these are selected randomly

// helper functions to render the limited TeX used by this game
// without needing the full MathJax distribution
function escapeHTML(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function stripMathDelimiters(str) {
  str = String(str).trim();
  while (str.length > 1 && str[0] === '$' && str[str.length - 1] === '$') {
    str = str.slice(1, -1).trim();
  }
  return str;
}

function readGroup(src, index) {
  var depth = 0;
  var i = index;

  while (i < src.length) {
    if (src[i] === '{')
      depth++;
    else if (src[i] === '}') {
      depth--;
      if (depth === 0)
        break;
    }
    i++;
  }

  return {
    body: src.slice(index + 1, i),
    end: i + 1
  };
}

function readCommand(src, index) {
  var i = index + 1;
  while (i < src.length && src[i].match(/[A-Za-z]/))
    i++;

  if (i === index + 1 && i < src.length)
    i++;

  return {
    name: src.slice(index + 1, i),
    end: i
  };
}

function readScriptAtom(src, index) {
  while (index < src.length && src[index].match(/\s/))
    index++;

  if (index >= src.length)
    return { html: '', end: index };

  if (src[index] === '{') {
    var group = readGroup(src, index);
    return { html: renderMathFragment(group.body), end: group.end };
  }

  if (src[index] === '\\') {
    var command = renderCommand(src, index);
    return { html: command.html, end: command.end };
  }

  return {
    html: escapeHTML(src[index]),
    end: index + 1
  };
}

function renderCommand(src, index) {
  var command = readCommand(src, index);
  var name = command.name;
  var arg;
  var atom;
  var html;
  var end = command.end;

  if (name === '{' || name === '}') {
    return { html: escapeHTML(name), end: end };
  }

  if (name === 'mathtt' || name === 'mathbb' || name === 'text') {
    while (end < src.length && src[end].match(/\s/))
      end++;

    if (end < src.length && src[end] === '{') {
      arg = readGroup(src, end);
      html = renderMathFragment(arg.body);
      end = arg.end;
    } else {
      atom = readScriptAtom(src, end);
      html = atom.html;
      end = atom.end;
    }

    if (name === 'mathtt')
      html = '<span class="math-mono">' + html + '</span>';
    else if (name === 'mathbb')
      html = '<span class="math-bb">' + html + '</span>';
    else
      html = '<span class="math-text">' + html + '</span>';

    return { html: html, end: end };
  }

  if (name === 'Sigma')
    return { html: '&Sigma;', end: end };
  if (name === 'ast')
    return { html: '&lowast;', end: end };
  if (name === 'mid')
    return { html: ' | ', end: end };
  if (name === 'lor')
    return { html: ' &or; ', end: end };
  if (name === 'geq')
    return { html: ' &ge; ', end: end };
  if (name === 'equiv')
    return { html: ' &equiv; ', end: end };
  if (name === 'in')
    return { html: ' &isin; ', end: end };

  if (name === 'pmod') {
    atom = readScriptAtom(src, end);
    return {
      html: '<span class="math-text">(mod ' + atom.html + ')</span>',
      end: atom.end
    };
  }

  return { html: escapeHTML(name), end: end };
}

function renderMathFragment(src) {
  var html = '';
  var i = 0;
  var piece;

  while (i < src.length) {
    if (src[i] === '\\') {
      piece = renderCommand(src, i);
      html += piece.html;
      i = piece.end;
      continue;
    }

    if (src[i] === '^' || src[i] === '_') {
      piece = readScriptAtom(src, i + 1);
      html += (src[i] === '^' ? '<sup>' : '<sub>') + piece.html + (src[i] === '^' ? '</sup>' : '</sub>');
      i = piece.end;
      continue;
    }

    if (src[i] === '{') {
      piece = readGroup(src, i);
      html += renderMathFragment(piece.body);
      i = piece.end;
      continue;
    }

    if (src[i] === '}') {
      i++;
      continue;
    }

    if (src[i].match(/\s/)) {
      html += ' ';
      i++;
      continue;
    }

    html += escapeHTML(src[i]);
    i++;
  }

  return html;
}

function renderMathHTML(html) {
  return '<span class="math-inline">' + renderMathFragment(stripMathDelimiters(html)) + '</span>';
}

function setJax(id, html) {
  var element = d3.select('#' + id);
  var normalized = stripMathDelimiters(html);

  if (window.MathJax && MathJax.Hub && MathJax.Hub.Queue) {
    element.classed('math-fallback', false).html('$' + normalized + '$');
    MathJax.Hub.Queue(["Typeset", MathJax.Hub, id]);
    return;
  }

  element.classed('math-fallback', false).html(renderMathHTML(normalized));
}

function toggleStep(selector, visible) {
  d3.selectAll(selector).classed('hidden-step', !visible);
}

// returns a random integer between min (inclusive) and max (exclusive)
function randomInt(min, max) {
  if (!max) {
    max = min;
    min = 0;
  }
  return Math.floor(Math.random() * (max - min)) + min;
}

// sets ex_id and no_states according to the URL parameters "ex" and
// "states"
function getParams () {
  // hacky, but good enough in this case
  var match = document.URL.match(/ex=([0-9]+)/);
  if (match)
    ex_id = parseInt(match[1]);
  match = document.URL.match(/states=([0-9]+)/);
  if (match)
    no_states = parseInt(match[1]);
}

// called when the page has been loaded; the parameter n isn't
// actually used by any caller...
function init (n) {
  getParams();
  n = n || ex_id;

  // set exercise and number of states, either by URL parameters or
  // randomly
  if ((typeof n != 'number') || (n >= examples.length) || (n < 0) || (n % 1 !== 0))
    n = randomInt(examples.length);
  ex_id = n;
  example = examples[n];

  // note that the individual exercises can restrict the range for the
  // number of states
  if ((typeof no_states != 'number') || (no_states >= maxStates * 2) || (no_states < 1) || (no_states % 1 !== 0))
    no_states = randomInt(example.randomFrom || 4, example.randomTo || maxStates);

  // build the exercise links at the top
  var linkData = [{label: 'Random', href: '?', active: false}]
    .concat(d3.range(examples.length).map(function (index) {
      return {
        label: index + 1,
        href: '?ex=' + index,
        active: n === index
      };
    }));
  var links = d3.select('#links');
  links.selectAll('a').remove();
  links.selectAll('a').data(linkData).enter().append('a')
    .attr('class', 'exercise-link')
    .classed('is-active', function (d) {
      return d.active;
    })
    .text(function (d) {
      return d.label;
    })
    .attr('href', function (d) {
      return d.href;
    });

  // hide some parts which should be hidden anyway, just in case
  d3.select('#div1').classed('hidden-step', false);
  toggleStep('.step2', false);
  toggleStep('.step3', false);
  toggleStep('.step4', false);

  // set up some MathJax snippets from the parameters above; for some
  // reason the constant parts have to be re-rendered too
  setJax('lang', '$L=\\{' + example.set + '\\}$');
  setJax('alph', '\\Sigma=\\{\\mathtt{a},\\mathtt{b}\\}');
  setJax('lang2', 'L');
  setJax('no_states', no_states);
  setJax('no_states4', no_states-1);
  setJax('lang3', 'L');
  setJax('lang4', 'L');
  setJax('no_states2', no_states);
  setJax('no_states3', no_states);
  setJax('var_n', 'n');
  setJax('var_m', 'm');
  setJax('var_w', 'w');
  setJax('rev_w', 'w^{\\mathtt{R}}');

  // this is where the user must enter the string
  in1 = d3.select('#in1')[0][0];
  in1.disabled = false;
  in1.focus();
}

// this function is called when the user presses the first "Continue"
// button
function step1 () {
  // compute the string the user meant
  string1 = expand(toParts(toChunks(in1.value)));
  in1.value = string1;
  var i;

  // check its length
  if (string1.length < no_states) {
    alert("Your string must have at least " + no_states + " characters.");
    in1.focus();
    return;
  }
  // check if it's correct
  if (!example.test(string1)) {
    alert("Your string doesn't belong to the language.");
    in1.focus();
    return;
  }
  in1.disabled = true;

  // the string is entered in two different places - out1 is static
  // while in1 is one span per character so that each character can
  // have a different background later
  var out1 = d3.select("#out1").html(string1);

  var in2 = d3.select("#in2");
  in2.selectAll("span").remove();
  in2.selectAll("span").data(string1.split("")).enter().append("span")
    .text(function (c) {
      return c;
    });

  // set up the sliders - the first one is for the start, the second
  // one for the length
  d3.select('#range1').attr({
    min: 0,
    max: string1.length - no_states
  }).property({
    value: 0
    // we need both "change" and "input" due to a Firefox bug
  }).on("change", function () {
    range_update();
  }).on("input", function () {
    range_update();
  });
  d3.select('#range2').attr({
    min: no_states,
    max: string1.length
  }).property({
    value: no_states
  }).on("change", function () {
    range_update();
  }).on("input", function () {
    range_update();
  });;
  range_update();

  // remove the textarea and stuff from the HTML, then show the new
  // parts with the sliders
  d3.select('#div1').remove();
  d3.select('#span1').remove();
  toggleStep('.step2', true);
  out1.style("background-color", "gainsboro");
  in2.style("background-color", "gainsboro");
}

// this function is called when the second "Continue" button is
// pressed and the user has presumably marked a substring with the
// sliders
function step2 () {
  // fill the three places where the string with various marks will be
  // shown - out2 (user substring marked blue, static), out3 (computer
  // subsubstring marked green, static), and in3 (computer
  // subsubstring marked green, dynamic)
  var out2 = d3.select("#out2");
  out2.selectAll("span").remove();
  out2.selectAll("span").data(string1.split("")).enter().append("span")
    .text(function (c) {
      return c;
    });
  range_update('#out2');
  out2.style("background-color", "gainsboro");

  var out3 = d3.select("#out3");
  out3.selectAll("span").remove();
  out3.selectAll("span").data(string1.split("")).enter().append("span")
    .text(function (c) {
      return c;
    });
  out3.style("background-color", "gainsboro");
  var in3 = d3.select("#in3");
  in3.selectAll("span").remove();
  in3.selectAll("span").data(string1.split("")).enter().append("span")
    .text(function (c) {
      return c;
    });
  in3.style("background-color", "gainsboro");

  // let the computer figure out which subsubstring to mark...
  trials();
  if (example.strategy)
    example.strategy();
  // ...and mark it
  range_update('#out3', cfrom, cto, 'greenyellow');
  range_update('#in3', cfrom, cto, 'greenyellow');

  // remove some HTML from previous step (sliders and such)
  d3.select('#div2').remove();
  d3.selectAll('.span2').remove();
  toggleStep('.step3', true);

  // set up the new slider
  repeat = 1;
  d3.select('#range3').attr({
    min: 0,
    max: maxStates * 2
  }).property({
    value: repeat
    // see remark above about "change" and "input"
  }).on("change", range_update2).on("input", range_update2);
}

// this is called once the last "Continue" button was pressed
function step3 () {
  // as usual, remove some stuff (slider and button)
  d3.select('#tr1').remove();
  d3.select('#tr2').remove();

  // set up links to repeat the exercise
  d3.select('#href1').attr("href", "?ex=" + ex_id);
  d3.select('#href2').attr("href", "?ex=" + ex_id + "&states=" + no_states);

  // check who won and say it
  if (example.test(modify(cfrom, cto, repeat))) {
    d3.select('#span3').html("The string belongs to the language.");
    d3.select('#span4').html("You lost!").classed('lose', true).classed('win', false);
    d3.select('#resultCard').classed('is-loss', true);
  } else {
    d3.select('#span3').html("The string doesn't belong to the language.");
    d3.select('#span4').html("You won!").classed('win', true).classed('lose', false);
    d3.select('#resultCard').classed('is-loss', false);
  }
  toggleStep('.step4', true);
}

// returns a modified version of string1: the part until the index
// start, followed by rep copies of the part from start to end,
// followed by the part after end; string1 itself is left untouched
function modify (start, end, rep) {
  var i,
      result = string1.slice(0, start),
      part = string1.slice(start, end);
  for (i = 0; i < rep; i++) {
    result += part;
  }
  return result + string1.slice(end);
}

// generic function for the computer to find a subsubstring which the
// user can't use to win; sets up cfrom and cto, but the result will
// only be used if there's no specific strategy (see data.js); the
// function is guaranteed to set these values even if no winning
// subsubstring can be found
function trials () {
  // very simple: just try all possible subsubstrings within the
  // marked (blue) substring to see if one of them can be safely
  // removed and repeated; for non-regular languages this can of
  // course only work if the user made a mistake
  var start = from, end, ok, i;
  while (start + 1 <= to) {
    end = start + 1;
    while (end <= to) {
      ok = true;
      // we can only try a certain amount of repetitions (but also the
      // user can only specify a certain amount of repetitions due to
      // the slider being finite...)
      for (i = 0; i < maxStates * 2; i++)
        if (!example.test(modify(start, end, i))) {
          ok = false;
          break;
        }
      if (ok) {
        cfrom = start;
        cto = end;
        return;
      }
      end++;
    }
    start++;
  }
  // in case we didn't find anything, use random values
  cfrom = randomInt(from, to);
  cto = randomInt(cfrom + 1, to + 1);
}

// marks the substring from start to end in the HTML element with ID
// id with the color col; if id isn't specified, it's meant to be
// "#in2"; the default values for start and end are as read from the
// "#range1" and "#range2" sliders and the default color is
// "lightblue"; this is a callback for the first two sliders but it is
// also used in other places
function range_update (id, start, end, col, string) {
  string = string || string1;
  
  if (d3.select('#range1')[0][0]) {
    from = parseInt(d3.select('#range1').property("value"));
    to = Math.min(string.length, from + parseInt(d3.select('#range2').property("value")));
  }

  id = id || '#in2';
  if (typeof start != 'number')
    start = from;
  if (typeof end != 'number')
    end = to;
  col = col || 'lightblue';

  d3.select('#from').html(start);
  d3.select('#to').html(end);

  d3.select(id).selectAll("span").style("background-color", function (d, i) {
    return (start <= i && i < end) ? col : "gainsboro";
  });
}

// reads the number of repetitions from the last slider and sets up
// and marks the "in3" HTML element accordingly (using range_update
// for the color)
function range_update2 () {
  repeat = parseInt(d3.select('#range3').property("value"));
  var string = modify(cfrom, cto, repeat);

  var in3 = d3.select("#in3");    
  in3.selectAll("span").remove();
  in3.selectAll("span").data(string.split("")).enter().append("span")
    .text(function (c) {
      return c;
    });
  range_update('#in3', cfrom, cfrom + repeat * (cto - cfrom), 'greenyellow', string);
}

// accepts and parses a string str and returns an array of the form
// [.., n1, .., n2, ...] where n1, n2, etc. are numbers and .. is
// either a string or a nested array like this one; for example
// "a10(a3)5" will be translated to ["a", "10", ["a", "3"], "5"];
// also, all characters will be converted to lowercase and everything
// that's not a decimal digit, a parenthesis, or a latin letter will
// be ignored; strings will always be one character; there's no
// guarantee that numbers and strings/arrays will alternate - the main
// purpose of this function is just to separate them; the result is
// undefined if meaningless strings like ")3" or "((a)" are entered
function toChunks (str) {
  str = str.toLowerCase().replace(/[^0-9ab()]/g,'')
  
  var len = str.length;
  // index to mark where we are in the string
  var i = 0;

  // inner function to do the actual parsing work; calls itself
  // recursively if necessary
  function parse () {
    // what will be returned
    var chunks = [];
    // current "chunk" which is "pending" and not yet in chunks array
    var chunk = '';
    
    while (i < len) {
      // current character
      var c = str[i];
      if (c === ')') {
        // if we see a closing parentheses, we should have been in a
        // recursive call, so we advance i and return
        if (chunk) {
          // but don't forget to add the last chunk
          chunks.push(chunk);
          chunk = '';
        }
        i++;
        // leave this recursive level
        return chunks;
      } else if (c === '(') {
        // if we see an opening parentheses, we call ourselves
        // recursively and should be able to continue the loop with i
        // at the right place once parse has returned
        if (chunk) {
          // but don't forget to add the current chunk first
          chunks.push(chunk);
          chunk = '';
        }
        i++;
        // the result of the recursive call will of course be
        // remembered as a chunk
        chunks.push(parse());
      } else if (chunk.match(/^[0-9]+$/) && c.match(/[0-9]/)) {
        // if the current chunk already holds a number and we look at
        // a decimal digit, we add it
        chunk += c;
        i++;
      } else {
        // otherwise always start a new chunk (i.e. something like
        // "abc") will result in three chunks "a", "b", and "c"
        if (chunk)
          chunks.push(chunk);
        chunk = c;
        i++;
      }
    }
    if (chunk)
      chunks.push(chunk);
    return chunks;
  }

  return parse();
}

// accepts an array of "chunks" as returned by toChunks above and
// "fills the gaps", i.e. this function makes sure that strings (or
// arrays) and numbers always alternate by adding ones if necessary;
// it also converts the string representation of the numbers to
// numbers; furthermore, each pair of string/array and number will be
// converted to a two-element array
function toParts(chunks) {
  chunks = chunks.slice();
  var len = chunks.length;

  // if the first part is a number (which is meaningless), discard it
  while (len > 0 && typeof chunks[0] == 'string' && chunks[0].match(/^[0-9]+$/)) {
    chunks.shift();
    len--;
  }

  var chunk;
  var result = [];
  var i = 0;

  while (i < len) {
    chunk = chunks[i];
    // the function calls itself recursively to deal with nested
    // arrays
    if (typeof chunk != 'string')
      chunk = toParts(chunk);
    i++;
    if (i < len && typeof chunks[i] == 'string' && chunks[i].match(/^[0-9]+$/)) {
      result.push([chunk, parseInt(chunks[i])]);
      i++;
    } else {
      // add 1 if necessary
      result.push([chunk, 1]);
    }
  }
  return result;
}

var MAX = 2000;

// accepts an array of "chunks" with repetition numbers as returned by
// toParts above and expands it into a string; makes sure the result
// won't be longer than MAX accidently
function expand (parts) {
  var result = '';
  var i = 0;
  var len = parts.length;
  var part, rep, j;

  while (i < len) {
    part = parts[i][0];
    // expand nested arrays recursively
    if (typeof part != 'string')
      part = expand(part);
    rep = parts[i][1];
    if (result.length + rep * part.length <= MAX)
      for (j = 0; j < rep; j++)
        result = result + part;
    i++;
  }
  return result;
}
