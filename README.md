# simple-storage-api

Simple Variable and Small Object Storage System written on Node and made for HomeKit

Commands (All done via GET):
* get (/get?item=name)
* set (/set?item=name&value=something)
* del (/del?item=name)
* all (/all)

When you run you must specify a listen port (HTTP and HTTPS) as a argument when you launch the program (I am not implementing config files and verification for something so simple)
Example: node ./index.js 8080 8443

HTTPS support was added because homekit requires it, That being said HomeKit REQUIRES a actual valid trusted certificate. You can try loading the cert using a configuration profile on all homehubs or register a real cert with lets encrypt and setup a task to update that cert. Thats for you to figure out, but it works. 
