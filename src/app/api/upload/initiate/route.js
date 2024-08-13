import { s3, CreateMultipartUploadCommand } from '../../../../../awsConfig';
import uniqid from 'uniqid';

export async function POST(req) {
    try {
        // Parse JSON body
        const { fileName, fileType } = await req.json();
        const id = uniqid();
        const ext = fileName.split('.').pop();
        const newName = `${id}.${ext}`;

        const params = {
            Bucket: process.env.MY_OWN_BUCKET_NAME,
            Key: newName,
            ContentType: fileType,
            ACL: 'public-read',
        };

        const command = new CreateMultipartUploadCommand(params);
        const { UploadId } = await s3.send(command);

        return new Response(JSON.stringify({ uploadId: UploadId, newName }), { status: 200 });
    } catch (error) {
        console.error('Error initiating multipart upload:', error);
        return new Response(JSON.stringify({ error: 'Error initiating multipart upload' }), { status: 500 });
    }
}
