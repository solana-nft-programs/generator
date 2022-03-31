npm install

zip -r lambda.zip .

aws lambda update-function-code --function-name cardinal-img-generator --region us-west-1 --zip-file fileb://./lambda.zip

rm -rf lambda.zip
