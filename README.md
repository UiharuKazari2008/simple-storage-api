# simple-storage-api

Simple Variable and Small Object Storage System written on Node and made for HomeKit

Commands (All done via GET):
* get (/get?item=name)
* set (/set?item=name&value=something)
* del (/del?item=name)
* all (/all)

When you run you must specify a listen port as a argument when you launch the program (I am not implementing config files and verification for something so simple)
Example: node ./index.js 8080
