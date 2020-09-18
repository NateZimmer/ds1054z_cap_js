/**
 * @file capture.js
 * @license MIT
 * @description Captures the current image on a DS1054Z oscilloscope via a TCP socket. Image is converted to a .png
 * @usage node capture.js [IP] [optional filename]
 */

const net = require('net');
const fs = require('fs');
const jimp = require("jimp");

var conn_timeout = null;
var data_buf = Buffer.from([]);

var ip_address = process.argv[2];
var rigol_port = 5555;
var date = new Date();
var file_name = 'cap.'+date.getMonth()+'_'+date.getDate()+'_'+date.getFullYear()+'.'+date.getHours()+'_'+date.getMinutes()+'.png';

if (ip_address == null) {
    console.log('Usage: node capture.js [IP] [optional filename]');
    return;
}

if (process.argv[3]) {
    file_name = process.argv[3] + '.png';
}

console.log(`Connecing to ${ip_address} on port ${rigol_port}`);

var client = new net.Socket();
client.connect(rigol_port, ip_address, () => {
    console.log('Connected');
    client.write('DISP:DATA?\n');
});

client.on('data', (data) => {

    // display progress 
    process.stdout.clearLine();
    process.stdout.cursorTo(0);
    process.stdout.write((data_buf.length / 1024).toFixed() + ' KB');

    if (conn_timeout) {
        data_buf = Buffer.concat([data_buf, data]); // append data
    } else {
        data_buf = data.slice(data.indexOf('BM')); // start of image      
    }

    clearTimeout(conn_timeout);
    conn_timeout = setTimeout(() => {
        if(data_buf.length > 1000){
            jimp.read(data_buf)
            .then((image) => {
                image.write(file_name);
                console.log('\r\nWrote ' + file_name);
            });
        }else{
            console.log('Socket timeout without sufficent data');
        }
        client.end();
    },1000);
});
