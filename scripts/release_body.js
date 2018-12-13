/**
 * Populate release body from CHANGELOG
 */

const fs = require('fs');
const request = require('request');

// Setup a client
client = request.defaults({
  baseUrl: 'https://api.github.com',
  auth: {
    bearer: process.env.GH_TOKEN
  },
  headers: {
    'User-Agent': 'request'
  },
  json: true
})

// Fetch latest draft release ID
client.get('/repos/creditkarma/Mimic/releases', (error, _, data) => {
  if (error) { throw error; }
  const { id } = data[0]
  
  // Read CHANGELOG
  fs.readFile('./CHANGELOG.md', 'utf8', (err, content) => {
    if (err) throw err;
    // Extract latest changes
    const body = /\n{3}([\s\S]+?)\n{6}/.exec(content)[1]
    // Update release body
    client.patch(`/repos/creditkarma/Mimic/releases/${id}`, {body: {body}}, (error) => {
      if (error) { throw error; }
    })
  });
});
