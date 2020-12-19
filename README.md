# Simple Object Storage
Simple Variable and Small Object Storage System backed by Node Persistent and made for directly for usage with Apple HomeKit

# Commands
All Commands are done via HTTP GET and are URL encoded to make implementation easier and faster to migrate to.
## get - Get an Item
### /get?item=name
- If item does not exsist it will return "NOT_FOUND"
- It will be returned as is with no type conversion. You can rely on HomeKit todo automatic type conversion.

## set - Write an Item
### /set?item=name&value=something
- Will return "OK" after write, if there is a error it will return 500 and a blank response

## cet - Write an Item and Call a URL 
### /set?item=name&value=something&opt=0
- Does a set and then calls the URL in the config, "0" is the index of the url array
- Will return OK after write, does not return if the call was successful
- Useful if you want to Write a state and then trigger HomeKit to parse that state somewhere else or call an external API
  - On that note, The call is a simple URL call. No header support or POST support is here at this time.

## del - Deletes a Item
### /del?item=name
- It does what it says, there is no undo!

## all - Prints out all Items in storage
## /all
- Returns a unordered array of all items in storage

# Install
* npm install
* Edit the config.json
* node ./index.js
  - supervisor -s -n success -k -w index.js index.js

## Config.json
Set your HTTP and HTTPS port, location to TLS certificate and key, and set any call URLs. You can not set them if you do not have the need yet for "cet"

# CRITICAL NOTE
**HTTPS support was added because homekit requires it (no if ands or buts about it),
That being said HomeKit REQUIRES an actual valid and trusted certificate.** 

There are 2 ways to approach the HTTPS requirement:
* Get an actual SSL certificate with a hostname via Letsencrypt, then override the hostname on your local DNS server.
    * This is what i currently use and works fine, To handle the short certificate lifecycle I use a ansible script that renews the cert on my public VPS, downloads it to my local server
* Create a self signed certificate and package it in a configuration profile, deploy it on all homehubs (Apple TV's, HomePod's, and iPad's)
    * I have no clue if this works but is the only way to trust a certificate in the iOS ecosystem
