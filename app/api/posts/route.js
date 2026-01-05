import { NextResponse } from 'next/server';
import connectDB from '@/app/lib/mongodb';
import Post from '@/models/Post';

// GET /api/posts?search=&status=published&authorId=&limit=&page=
export async function GET(req) {
  try {
    const dbConnection = await connectDB();

    // If MongoDB connection failed, return empty posts array (graceful fallback)
    if (!dbConnection) {
      console.warn('⚠️ MongoDB not available - returning empty posts');
      return NextResponse.json({ success: true, posts: [], total: 0, page: 1, pages: 0 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || 'published';
    const authorIdRaw = searchParams.get('authorId');
    const authorId = authorIdRaw ? String(authorIdRaw).toLowerCase().trim() : undefined;
    const authorNameRaw = searchParams.get('authorName');
    const authorName = authorNameRaw ? String(authorNameRaw).trim() : undefined;
    const limit = Math.min(parseInt(searchParams.get('limit')) || 10, 50); // Max 50 posts per page
    const page = Math.max(parseInt(searchParams.get('page')) || 1, 1);

    const buildAuthorFilter = () => {
      const parts = [];
      if (authorId) {
        const escaped = authorId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        parts.push({ authorId: { $regex: `^${escaped}$`, $options: 'i' } });
      }
      if (authorName) {
        const escapedName = authorName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        parts.push({ authorName: { $regex: `^${escapedName}$`, $options: 'i' } });
      }
      if (parts.length === 0) return {};
      return { $or: parts };
    };

    const query = {
      status,
      ...buildAuthorFilter(),
      ...(search
        ? {
            $or: [
              { title: { $regex: search, $options: 'i' } },
              { content: { $regex: search, $options: 'i' } },
              { tags: { $in: [new RegExp(search, 'i')] } },
            ],
          }
        : {}),
    };

    // Get total count for pagination
    const total = await Post.countDocuments(query);

    // Get paginated posts
    const posts = await Post.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .select('title content coverImage tags authorName authorId status createdAt updatedAt')
      .lean();

    const pages = Math.ceil(total / limit);

    // Add cache headers for better performance
    const response = NextResponse.json({
      success: true,
      posts,
      total,
      page,
      pages,
      limit
    });

    // Cache for 5 minutes for published posts, no cache for drafts
    if (status === 'published') {
      response.headers.set('Cache-Control', 'public, max-age=300, s-maxage=300');
    } else {
      response.headers.set('Cache-Control', 'private, no-cache');
    }

    return response;
  } catch (err) {
    console.error('GET /api/posts error', err);
    return NextResponse.json({ success: false, message: 'Failed to fetch posts' }, { status: 500 });
  }
}

// POST /api/posts
export async function POST(req) {
  try {
    const dbConnection = await connectDB();

    // If MongoDB connection failed, return error
    if (!dbConnection) {
      return NextResponse.json({
        success: false,
        message: 'Database connection unavailable. Please check MongoDB configuration.'
      }, { status: 503 });
    }

    const body = await req.json();
    const { title, content, coverImage = '', tags = [], authorName = 'Anonymous', authorId, status = 'published' } = body;

    // Input validation
    if (!title?.trim()) {
      return NextResponse.json({ success: false, message: 'Title is required' }, { status: 400 });
    }

    if (!content?.trim()) {
      return NextResponse.json({ success: false, message: 'Content is required' }, { status: 400 });
    }

    if (!authorId) {
      return NextResponse.json({ success: false, message: 'Author ID is required' }, { status: 400 });
    }

    // Sanitize and validate input
    const sanitizedTitle = title.trim().substring(0, 200); // Max 200 chars
    const sanitizedContent = content.trim();
    const sanitizedAuthorName = authorName.trim().substring(0, 100) || 'Anonymous';
    const normalizedAuthorId = String(authorId).toLowerCase().trim();

    // Validate status
    const validStatuses = ['draft', 'published'];
    const sanitizedStatus = validStatuses.includes(status) ? status : 'published';

    // Validate and sanitize tags
    const sanitizedTags = Array.isArray(tags)
      ? tags
          .filter(tag => typeof tag === 'string' && tag.trim())
          .map(tag => tag.trim().toLowerCase().substring(0, 50))
          .slice(0, 10) // Max 10 tags
      : [];

    // Validate cover image URL if provided
    if (coverImage && typeof coverImage === 'string') {
      try {
        new URL(coverImage);
      } catch {
        return NextResponse.json({ success: false, message: 'Invalid cover image URL' }, { status: 400 });
      }
    }

    const postData = {
      title: sanitizedTitle,
      content: sanitizedContent,
      coverImage: coverImage || '',
      tags: sanitizedTags,
      authorName: sanitizedAuthorName,
      authorId: normalizedAuthorId,
      status: sanitizedStatus
    };

    const post = await Post.create(postData);

    return NextResponse.json({
      success: true,
      post: {
        _id: post._id,
        title: post.title,
        content: post.content.substring(0, 200) + (post.content.length > 200 ? '...' : ''), // Truncate content in response
        coverImage: post.coverImage,
        tags: post.tags,
        authorName: post.authorName,
        authorId: post.authorId,
        status: post.status,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt
      }
    });
  } catch (err) {
    console.error('POST /api/posts error', err);

    // Handle specific MongoDB errors
    if (err.code === 11000) {
      return NextResponse.json({ success: false, message: 'A post with this title already exists' }, { status: 409 });
    }

    return NextResponse.json({ success: false, message: 'Failed to create post' }, { status: 500 });
  }
}
