/*jslint maxlen: 500 */

import server from './app';
import colors from 'colors';

let port = 4000;

console.info(colors.blue.bold(`==> 🌎  Listening on port ${port}. Open up http://localhost:${port}/ in your browser.`));

server.listen(port);
