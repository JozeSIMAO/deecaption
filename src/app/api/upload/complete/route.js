import { s3, CompleteMultipartUploadCommand } from '../../../../../awsConfig';

export async function POST(req) {
    try {
        const { uploadId, parts, fileName } = await req.json();

        const params = {
            Bucket: process.env.MY_OWN_BUCKET_NAME,
            Key: fileName,
            UploadId: uploadId,
            MultipartUpload: {
                Parts: parts,
            },
        };

        const command = new CompleteMultipartUploadCommand(params);
        const data = await s3.send(command);

        return new Response(JSON.stringify({ location: data.Location }), { status: 200 });
    } catch (error) {
        console.error('Error completing multipart upload:', error);
        return new Response(JSON.stringify({ error: 'Error completing multipart upload' }), { status: 500 });
    }
}
