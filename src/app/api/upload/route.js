import { S3Client } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import uniqid from 'uniqid';

export async function POST(req) {
  const formData = await req.formData();
  const file = formData.get('file');

  if (!file) {
    return Response.json({ error: 'No file uploaded' }, { status: 400 });
  }

  const { name, type } = file;

  try {
    const s3client = new S3Client({
      region: 'us-east-2',
      credentials: {
        accessKeyId: process.env.MY_OWN_AWS_ACCESS_KEY,
        secretAccessKey: process.env.MY_OWN_AWS_SECRET_ACCESS_KEY,
      },
    });

    let id = uniqid();
    let ext = name.split('.').pop();
    const newName = `${id}.${ext}`;

    // Create an instance of Upload
    const upload = new Upload({
      client: s3client,
      params: {
        Bucket: process.env.MY_OWN_BUCKET_NAME,
        Body: file.stream(), // Use stream for large files
        Key: newName,
        ACL: 'public-read',
        ContentType: type,
      },
    });

    // Wait for the upload to complete
    await upload.done();

    return Response.json({ name, ext, newName, id });
  } catch (error) {
    console.error('Upload Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
