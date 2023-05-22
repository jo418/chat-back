
In Windows use Bash terminal, or in Linux use your favorite terminal.
To install OpenSSL in windows the following can be run:

```bash
choco install openssl
```

To generate private key and certificate one can use openssl.

```bash
openssl genrsa -out private-key.key 2048
openssl req -new -x509 -sha256 -key private-key.key -out certificate.crt -days 365
```

But well, it just not taht simple; toi develop locally one acn himself act as CA (certificate authority).
Then one should import authority CA.pem into browser, such ac chrome for instance.
It is a vulnerability to store private keys into Git. As this a public repository, we don't store them in here.
In the internet there are several atricles that instruct using self made certificates loacally.
To learn more, please read the following:
https://link.medium.com/PZ5ZmGErUzb
https://hackernoon.com/how-to-get-sslhttps-for-localhost-i11s3342
https://gist.github.com/cecilemuller/9492b848eb8fe46d462abeb26656c4f8

You should crete certificate folder and another folder localhost into it. Then
you should gererate your CA and private key and signed certficate into certioficate/localhost folder.
Otherwise to make the code run locally you should use http insetad of https and make the
respective changes.

To pull latest Postgre image, type

```bash
docker pull postgres:latest
```

To pull a specific image, type:

```bash
docker pull postgres:13
```

To run Postgres locally, a docker image can be used:

```bash
docker run --name chat-db -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres
```

To initialize node, type

```bash
npm install
```
to run, type

```bash
node server.js
```
