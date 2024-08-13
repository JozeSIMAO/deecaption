// awsConfig.js for v3
import { S3Client } from '@aws-sdk/client-s3';
import { CreateMultipartUploadCommand, CompleteMultipartUploadCommand ,UploadPartCommand } from '@aws-sdk/client-s3';

const s3 = new S3Client({
    region: "us-east-2",
    credentials: {
        accessKeyId: process.env.MY_OWN_AWS_ACCESS_KEY,
        secretAccessKey: process.env.MY_OWN_AWS_SECRET_ACCESS_KEY,
    },
    logger: console,
});

export { s3, CreateMultipartUploadCommand, UploadPartCommand, CompleteMultipartUploadCommand };
