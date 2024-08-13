import { s3, UploadPartCommand } from '../../../../../awsConfig';

export async function POST(req) {
    try {
        const formData = await req.formData();
        const fileChunk = formData.get('fileChunk');  // File object from FormData
        const fileName = formData.get('fileName');
        const uploadId = formData.get('uploadId');
        const partNumber = parseInt(formData.get('partNumber'), 10);

        if (!fileChunk || !(fileChunk instanceof Blob)) {
            throw new Error('File chunk is missing or not a Blob.');
        }

        // Convert the file chunk to an ArrayBuffer and then to a Buffer
        const buffer = Buffer.from(await fileChunk.arrayBuffer());

        const params = {
            Bucket: process.env.MY_OWN_BUCKET_NAME,
            Key: fileName,
            UploadId: uploadId,
            PartNumber: partNumber,
            Body: buffer,  // Use Buffer here
        };

        const command = new UploadPartCommand(params);
        const data = await s3.send(command);

        return new Response(JSON.stringify({ ETag: data.ETag }), { status: 200 });
    } catch (error) {
        console.error('Error uploading part:', error);
        return new Response(JSON.stringify({ error: 'Error uploading part' }), { status: 500 });
    }
}
