openssl genrsa -des3 -passout pass:x -out server.pass.key 2048
openssl rsa -passin pass:x -in server.pass.key -out server.key
echo "Set Common Name (eg, YOUR name) [] as localhost"
openssl req -new -key server.key -out server.csr -config ./openssl.cnf
openssl x509 -req -days 365 -in server.csr -signkey server.key -out server.crt