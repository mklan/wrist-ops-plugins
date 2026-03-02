module.exports = {
  name: 'debug',
  description: 'Echo input text with Node.js runtime stats (no network)',

  handle: async function(text, context) {
    var mem   = process.memoryUsage();
    var mb    = function(b) { return (b / 1024 / 1024).toFixed(1) + ' MB'; };
    var upSec = Math.floor(process.uptime());

    var stats = [
      `date: ${new Date()}`,
      'node ' + process.version,
      'uptime: ' + upSec + 's',
      'heap: ' + mb(mem.heapUsed) + ' / ' + mb(mem.heapTotal),
      'rss: ' + mb(mem.rss)
    ].join(' | ');

    return { result: text + '\n\n[echo] ' + stats };
  }
};
