import server from './app';
import colors from 'colors';

console.log(colors.blue.bold("Listening on port 4000..."));
server.listen(4000);
