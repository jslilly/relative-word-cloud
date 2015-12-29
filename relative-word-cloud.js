// Generated by CoffeeScript 1.9.3
(function() {
  var $, MAXSIZE, MINSIZE, base, baseCache, baseSelect, calc, cloud, customBase, doRelative, getBase, getStats, loadto, process, stopwords, targetSelect, updateBase;

  $ = document.querySelector.bind(document);

  loadto = function(el, url) {
    return fetch(url).then(function(resp) {
      return resp.text();
    }).then(function(body) {
      return el.value = body;
    });
  };

  targetSelect = $('#target-select');

  targetSelect.addEventListener('change', function() {
    var baseOpt, path, val;
    val = targetSelect.options[targetSelect.selectedIndex].value;
    if (val === 'custom') {
      return;
    }
    path = val.split('/')[0];
    if (baseOpt = $("#base-select option[value=\"base/" + path + ".json\"]")) {
      baseOpt.selected = true;
      updateBase();
    }
    return loadto($('#target'), val).then(doRelative);
  });

  base = null;

  baseCache = {};

  getBase = function(url) {
    if (baseCache[url]) {
      return baseCache[url];
    }
    return baseCache[url] = fetch(url).then(function(resp) {
      return resp.json();
    });
  };

  customBase = false;

  baseSelect = $('#base-select');

  updateBase = function() {
    var baseName;
    baseName = baseSelect.options[baseSelect.selectedIndex].value;
    if (baseName === 'custom') {
      $('#base').disabled = false;
      return customBase = true;
    } else {
      $('#base').disabled = true;
      customBase = false;
      return base = getBase(baseName);
    }
  };

  baseSelect.addEventListener('change', updateBase);

  stopwords = fetch('stopwords.txt').then(function(resp) {
    return resp.text();
  }).then(function(body) {
    var i, len, line, o, ref;
    o = {};
    ref = body.split('\n');
    for (i = 0, len = ref.length; i < len; i++) {
      line = ref[i];
      o[line] = true;
    }
    return o;
  });

  process = function(el) {
    var counts, i, len, word, words;
    words = el.value.replace(/[^\w'’]/g, ' ').replace(/  +/g, ' ').toLowerCase();
    if (words.length === 0) {
      return {};
    }
    words = words.split(' ');
    counts = {};
    for (i = 0, len = words.length; i < len; i++) {
      word = words[i];
      counts[word] = counts[word] + 1 || 1;
    }
    return counts;
  };

  $('#traditional').addEventListener('click', function() {
    return stopwords.then(function(stopwords) {
      var count, counts, countsArray, word;
      counts = process($('#target'));
      countsArray = (function() {
        var results;
        results = [];
        for (word in counts) {
          count = counts[word];
          if (!stopwords[word]) {
            results.push({
              word: word,
              weight: count
            });
          }
        }
        return results;
      })();
      countsArray.sort(function(a, b) {
        return b.weight - a.weight;
      });
      return cloud(countsArray.slice(0, 20));
    });
  });

  calc = function(targetCount, target, baseCount, base) {
    var baseProb, targetProb, usefulness;
    targetProb = targetCount / target.total;
    baseProb = baseCount / base.total;
    if (!baseProb) {
      return targetProb;
    }
    usefulness = targetCount / target.max;
    return (usefulness * targetProb + (1 - usefulness) * baseProb) / (baseProb * 2);
  };

  getStats = function(words) {
    var avg, count, max, num, total, word;
    total = 0;
    num = 0;
    max = 0;
    for (word in words) {
      count = words[word];
      if (count > max) {
        max = count;
      }
      total += count;
      num++;
    }
    avg = total / num;
    return {
      total: total,
      num: num,
      avg: avg,
      max: max
    };
  };

  doRelative = function() {
    if (customBase) {
      base = Promise.resolve(process($('#base')));
    }
    return base.then(function(base) {
      var baseStat, count, list, target, targetStat, word;
      baseStat = getStats(base);
      target = process($('#target'));
      targetStat = getStats(target);
      list = (function() {
        var results;
        results = [];
        for (word in target) {
          count = target[word];
          results.push({
            word: word,
            weight: calc(count, targetStat, base[word] || 0, baseStat)
          });
        }
        return results;
      })();
      list.sort(function(a, b) {
        return b.weight - a.weight;
      });
      return cloud(list.slice(0, 20));
    });
  };

  $('#relative').addEventListener('click', doRelative);

  MINSIZE = 10;

  MAXSIZE = 72;

  cloud = function(words) {
    var i, len, max, min, ref, ref1, results, scale, size, span, word;
    max = ((ref = words[0]) != null ? ref.weight : void 0) || NaN;
    min = ((ref1 = words[words.length - 1]) != null ? ref1.weight : void 0) || 0;
    $('#cloud').innerHTML = '';
    results = [];
    for (i = 0, len = words.length; i < len; i++) {
      word = words[i];
      span = document.createElement('span');
      scale = (word.weight - min) / ((max - min) || 1);
      size = Math.round(scale * (MAXSIZE - MINSIZE) + MINSIZE);
      span.style.fontSize = size + "px";
      span.textContent = word.word + ' ';
      results.push($('#cloud').appendChild(span));
    }
    return results;
  };

  base = getBase('base/pg.json');

  loadto($('#target'), 'pg/75 - Microsoft is Dead.txt').then(doRelative);

}).call(this);
