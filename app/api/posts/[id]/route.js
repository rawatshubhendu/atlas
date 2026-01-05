import { NextResponse } from 'next/server';
import connectDB from '@/app/lib/mongodb';
import Post from '@/models/Post';

export async function GET(_req, { params }) {
  try {
    const dbConnection = await connectDB();
    if (!dbConnection) {
      return NextResponse.json({ success: false, message: 'Database connection unavailable' }, { status: 503 });
    }

    const { id } = params;

    // Validate ObjectId format
    if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
      return NextResponse.json({ success: false, message: 'Invalid post ID' }, { status: 400 });
    }

    const post = await Post.findById(id).lean();
    if (!post) {
      return NextResponse.json({ success: false, message: 'Post not found' }, { status: 404 });
    }

    // Only return published posts for public access (no auth check here)
    if (post.status !== 'published') {
      return NextResponse.json({ success: false, message: 'Post not found' }, { status: 404 });
    }

    const response = NextResponse.json({
      success: true,
      post: {
        _id: post._id,
        title: post.title,
        content: post.content,
        coverImage: post.coverImage,
        tags: post.tags,
        authorName: post.authorName,
        authorId: post.authorId,
        status: post.status,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt
      }
    });

    // Cache published posts for 10 minutes
    response.headers.set('Cache-Control', 'public, max-age=600, s-maxage=600');
    response.headers.set('CDN-Cache-Control', 'max-age=3600');
    response.headers.set('Vercel-CDN-Cache-Control', 'max-age=3600');

    return response;
  } catch (err) {
    console.error('GET /api/posts/[id] error', err);
    return NextResponse.json({ success: false, message: 'Failed to fetch post' }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const dbConnection = await connectDB();
    if (!dbConnection) {
      return NextResponse.json({ success: false, message: 'Database connection unavailable' }, { status: 503 });
    }
    
    const { id } = params;
    const { searchParams } = new URL(req.url);
    const authorIdRaw = searchParams.get('authorId');
    const authorId = authorIdRaw ? String(authorIdRaw).toLowerCase().trim() : undefined;
    const authorNameRaw = searchParams.get('authorName');
    const authorName = authorNameRaw ? String(authorNameRaw).trim() : undefined;

    if (!authorId) {
      return NextResponse.json({ success: false, message: 'authorId required' }, { status: 400 });
    }

    const post = await Post.findById(id);
    if (!post) {
      return NextResponse.json({ success: false, message: 'Post not found' }, { status: 404 });
    }

    const postAuthorId = String(post.authorId || '').toLowerCase().trim();
    const postAuthorName = String(post.authorName || '').trim();

    const idMatches = postAuthorId && authorId && postAuthorId === authorId;
    const nameMatches = !postAuthorId && authorName && postAuthorName.toLowerCase() === authorName.toLowerCase();

    if (!idMatches && !nameMatches) {
      return NextResponse.json({ success: false, message: 'Not authorized to delete this post' }, { status: 403 });
    }

    await Post.deleteOne({ _id: id });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('DELETE /api/posts/[id] error', err);
    return NextResponse.json({ success: false, message: 'Failed to delete post' }, { status: 500 });
  }
}


