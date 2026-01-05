import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request) {
  try {
    // Check if Cloudinary is configured
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      console.error('Cloudinary configuration missing');
      return Response.json(
        { error: 'Image upload service unavailable' },
        { status: 503 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return Response.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return Response.json({ error: 'Only image files are allowed' }, { status: 400 });
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      return Response.json({ error: 'File size must be less than 5MB' }, { status: 400 });
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to Cloudinary with timeout
    const result = await Promise.race([
      new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          {
            resource_type: 'auto',
            folder: 'atlas-blog-images',
            transformation: [
              { width: 1200, height: 630, crop: 'fill', quality: 'auto', fetch_format: 'auto' }
            ],
            timeout: 60000 // 60 second timeout
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        ).end(buffer);
      }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Upload timeout')), 60000)
      )
    ]);

    return Response.json({
      success: true,
      url: result.secure_url,
      public_id: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format,
      bytes: result.bytes
    });

  } catch (error) {
    console.error('Upload error:', error);

    // Provide more specific error messages
    if (error.message?.includes('timeout')) {
      return Response.json(
        { error: 'Upload timeout - please try again' },
        { status: 408 }
      );
    }

    if (error.http_code) {
      return Response.json(
        { error: `Cloudinary error: ${error.message}` },
        { status: error.http_code }
      );
    }

    return Response.json(
      { error: 'Failed to upload image. Please try again.' },
      { status: 500 }
    );
  }
}
